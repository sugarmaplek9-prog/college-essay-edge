import argparse
import json
import re
from pathlib import Path

import pandas as pd

CANONICAL_ACTIONS = {
    "show_strongest_direction",
    "ask_question_before_showing",
    "blocked_or_needs_more_input",
    "no_good_candidate",
}


def norm(s):
    if s is None:
        return ""
    s = str(s).lower().strip()
    s = re.sub(r"[^a-z0-9\s]+", "", s)
    s = re.sub(r"\s+", " ", s)
    return s


def load_predictions(path):
    preds = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            preds[obj["case_id"]] = obj
    return preds


def map_to_best_action(action: str) -> str:
    raw = str(action or "").replace("_", " ")
    a = norm(raw)
    mapping = {
        "rank candidates": "show_strongest_direction",
        "scope correct and instruct": "show_strongest_direction",
        "show strongest direction": "show_strongest_direction",
        "clarify then rank": "ask_question_before_showing",
        "reframe with guardrails": "ask_question_before_showing",
        "warn then reframe": "ask_question_before_showing",
        "structured intake not fake certainty": "ask_question_before_showing",
        "guarded reframe": "ask_question_before_showing",
        "ask question before showing": "ask_question_before_showing",
        "blocked or needs more input": "blocked_or_needs_more_input",
        "no good candidate": "no_good_candidate",
    }
    return mapping.get(a, "")


def expected_best_action(row: dict) -> str:
    explicit = row.get("expected_best_action")
    if explicit:
        mapped = map_to_best_action(explicit)
        if mapped:
            return mapped
    return map_to_best_action(row.get("expected_nds_action", ""))


def predicted_best_action(pred: dict) -> str:
    return map_to_best_action(pred.get("predicted_best_action") or pred.get("predicted_action") or "")


def infer_adjudication_status(row):
    raw = str(row.get("approved_for_benchmark", "")).strip().lower()
    if raw in {"approved", "gold_ready"}:
        return "gold_ready"
    if raw in {"pending", "needs_adjudication", ""}:
        return "needs_adjudication"
    return "benchmark_only"


def infer_provenance(row):
    source = str(row.get("source", "")).strip()
    source_url = str(row.get("source_url", "")).strip()
    source_type = "public_internet" if source or source_url else "legacy_internal_case"
    return {
        "source_type": source_type,
        "source_origin": source,
        "source_reference": source_url,
        "capture_date": row.get("capture_date", ""),
        "transformation_level": row.get("transformation_level", "redacted") or "redacted",
        "adjudication_status": infer_adjudication_status(row),
    }


def infer_failure_owner(best_action_match, best_direction_match, better_candidate_existed, clarify_should_have_happened, pred):
    if clarify_should_have_happened:
        return "routing"
    if best_action_match and not best_direction_match and better_candidate_existed:
        return "selection_or_reranking"
    if not best_direction_match and not better_candidate_existed:
        return "candidate_generation"
    rationale = ((pred.get("one_sentence_rationale") or "") + " " + (pred.get("full_rationale") or "")).strip()
    if rationale and len(rationale) < 40:
        return "explanation"
    return "benchmark_borderline"


def infer_trust_risk(row, best_action_match, best_direction_match):
    sensitive = any(flag.strip() for flag in str(row.get("sensitive_topic_flags", "")).split(",") if flag.strip())
    if sensitive and (not best_action_match or not best_direction_match):
        return "high"
    if sensitive:
        return "medium"
    if not best_action_match:
        return "medium"
    return "low"


def infer_likely_student_reaction(failure_owner, trust_risk):
    if failure_owner in {"candidate_generation", "selection_or_reranking"}:
        return "flattened"
    if failure_owner == "routing":
        return "mixed"
    if trust_risk == "high":
        return "misread"
    return "understood"


def score_case(row, pred):
    scores = {
        "action_selection": 0,
        "best_action_support": 0,
        "best_direction": 0,
        "rejected_direction_quality": 0,
        "clarification_discipline": 0,
        "risk_handling": 0,
        "explanation_quality": 0,
    }

    expected_action = expected_best_action(row)
    predicted_action = predicted_best_action(pred)
    if predicted_action == expected_action and predicted_action in CANONICAL_ACTIONS:
        scores["best_action_support"] = 2
    elif predicted_action in CANONICAL_ACTIONS:
        scores["best_action_support"] = 1

    expected_action_legacy = norm(row.get("expected_nds_action", ""))
    predicted_action_legacy = norm(pred.get("predicted_action", ""))
    if predicted_action_legacy == expected_action_legacy:
        scores["action_selection"] = 2
    elif predicted_action_legacy:
        scores["action_selection"] = 1

    gold_best = norm(row.get("best_direction", ""))
    pred_best = norm(pred.get("predicted_best_direction", ""))
    if expected_action == "show_strongest_direction" and pred_best == gold_best:
        scores["best_direction"] = 2
    elif expected_action == "show_strongest_direction" and pred_best and (pred_best in gold_best or gold_best in pred_best):
        scores["best_direction"] = 1
    elif expected_action != "show_strongest_direction" and predicted_action == expected_action:
        scores["best_direction"] = 2

    if pred.get("predicted_rejected_directions"):
        scores["rejected_direction_quality"] = 2
    elif pred.get("predicted_candidate_directions"):
        scores["rejected_direction_quality"] = 1

    expected_clarify = norm(row.get("clarification_needed", "")) == "yes"
    provided_clarify = len(pred.get("clarification_questions", [])) > 0
    if expected_clarify == provided_clarify:
        scores["clarification_discipline"] = 2
    elif provided_clarify:
        scores["clarification_discipline"] = 1

    sensitive = any(flag.strip() for flag in str(row.get("sensitive_topic_flags", "")).split(",") if flag.strip())
    risk_flags = pred.get("risk_flags", [])
    if sensitive and risk_flags:
        scores["risk_handling"] = 2
    elif not sensitive:
        scores["risk_handling"] = 2
    elif pred.get("one_sentence_rationale") or pred.get("full_rationale"):
        scores["risk_handling"] = 1

    rationale = (pred.get("one_sentence_rationale") or "").strip()
    full = (pred.get("full_rationale") or "").strip()
    if len(rationale) >= 25 and len(full) >= 60:
        scores["explanation_quality"] = 2
    elif rationale or full:
        scores["explanation_quality"] = 1

    total = sum(scores.values())

    candidate_dirs = [norm(x) for x in pred.get("predicted_candidate_directions", []) if str(x).strip()]
    better_candidate_existed = bool(gold_best and candidate_dirs and gold_best in candidate_dirs and pred_best != gold_best)
    clarify_should_have_happened = expected_action == "ask_question_before_showing" and predicted_action == "show_strongest_direction"
    no_good_candidate_existed = expected_action in {"blocked_or_needs_more_input", "no_good_candidate"}
    line_or_explanation_amplified_failure = bool((rationale or full) and total <= 7)
    benchmark_borderline = str(row.get("difficulty_tier", "")).strip() in {"4", "5"}

    best_action_match = predicted_action == expected_action and predicted_action in CANONICAL_ACTIONS
    best_direction_match = (pred_best == gold_best) if expected_action == "show_strongest_direction" else best_action_match
    failure_owner = infer_failure_owner(
        best_action_match=best_action_match,
        best_direction_match=best_direction_match,
        better_candidate_existed=better_candidate_existed,
        clarify_should_have_happened=clarify_should_have_happened,
        pred=pred,
    )
    trust_risk = infer_trust_risk(row=row, best_action_match=best_action_match, best_direction_match=best_direction_match)

    diagnostics = {
        "expected_best_action": expected_action,
        "predicted_best_action": predicted_action,
        "best_action_match": best_action_match,
        "no_good_candidate_existed": no_good_candidate_existed,
        "better_candidate_already_existed": better_candidate_existed,
        "clarification_should_have_replaced_show": clarify_should_have_happened,
        "line_or_explanation_amplified_failure": line_or_explanation_amplified_failure,
        "benchmark_borderline": benchmark_borderline,
        "failure_owner": failure_owner,
        "trust_risk": trust_risk,
        "likely_student_reaction": infer_likely_student_reaction(failure_owner=failure_owner, trust_risk=trust_risk),
    }
    return scores, total, diagnostics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default="data/NDS_GOLD_LABEL_PACK_V1.csv")
    parser.add_argument("--predictions", required=True)
    args = parser.parse_args()

    df = pd.read_csv(args.csv)
    preds = load_predictions(args.predictions)

    rows = []
    totals = []
    miss_rows = []
    provenance_summary = {
        "public_internet": 0,
        "anonymized_product_input": 0,
        "legacy_internal_case": 0,
    }

    for _, row in df.iterrows():
        row_dict = row.to_dict()
        pred = preds.get(row["case_id"], {})
        dim_scores, total, diagnostics = score_case(row_dict, pred)
        totals.append(total)

        provenance = infer_provenance(row_dict)
        provenance_summary[provenance["source_type"]] = provenance_summary.get(provenance["source_type"], 0) + 1

        row_result = {
            "case_id": row["case_id"],
            "expected_action": row.get("expected_nds_action", ""),
            "expected_best_action": diagnostics["expected_best_action"],
            "gold_best_direction": row.get("best_direction", ""),
            "predicted_action": pred.get("predicted_action", ""),
            "predicted_best_action": diagnostics["predicted_best_action"],
            "predicted_best_direction": pred.get("predicted_best_direction", ""),
            "total_score": total,
            "provenance": provenance,
            "failure_diagnostics": diagnostics,
            **dim_scores,
        }
        rows.append(row_result)

        if not diagnostics["best_action_match"] or dim_scores["best_direction"] < 2:
            miss_rows.append({
                "case_id": row["case_id"],
                "system_prediction": {
                    "predicted_action": pred.get("predicted_action", ""),
                    "predicted_best_action": diagnostics["predicted_best_action"],
                    "predicted_best_direction": pred.get("predicted_best_direction", ""),
                },
                "baseline_prediction": None,
                "expected_best_action": diagnostics["expected_best_action"],
                "better_candidate_existed": "yes" if diagnostics["better_candidate_already_existed"] else "no",
                "clarify_should_have_happened": "yes" if diagnostics["clarification_should_have_replaced_show"] else "no",
                "failure_owner": diagnostics["failure_owner"],
                "trust_risk": diagnostics["trust_risk"],
                "likely_student_reaction": diagnostics["likely_student_reaction"],
                "adjudication_status": provenance["adjudication_status"],
            })

    out_json = Path("outputs/NDS_SCORE_REPORT.json")
    out_md = Path("outputs/NDS_SCORE_REPORT.md")
    out_miss = Path("outputs/NDS_BENCHMARK_MISS_REVIEW_V1.json")
    out_json.parent.mkdir(parents=True, exist_ok=True)

    summary = {
        "cases_scored": len(rows),
        "max_total_per_case": 14,
        "average_total_score": round(sum(totals) / len(totals), 2) if totals else 0,
        "provenance_summary": provenance_summary,
        "rows": rows,
    }
    out_json.write_text(json.dumps(summary, indent=2))
    out_miss.write_text(json.dumps(miss_rows, indent=2))

    def avg(field):
        return round(sum(r[field] for r in rows) / len(rows), 2) if rows else 0

    failure_owner_counts = {}
    for r in miss_rows:
        owner = r["failure_owner"]
        failure_owner_counts[owner] = failure_owner_counts.get(owner, 0) + 1

    md = []
    md.append("# NDS Score Report\n")
    md.append(f"- Cases scored: {len(rows)}")
    md.append(f"- Average total score: {summary['average_total_score']} / 14")
    md.append(f"- Misses requiring review: {len(miss_rows)}")
    md.append("- Provenance summary:")
    for key, value in provenance_summary.items():
        md.append(f"  - {key}: {value}")
    md.append(f"- Action selection avg: {avg('action_selection')} / 2")
    md.append(f"- Best-action support avg: {avg('best_action_support')} / 2")
    md.append(f"- Best direction avg: {avg('best_direction')} / 2")
    md.append(f"- Rejected direction avg: {avg('rejected_direction_quality')} / 2")
    md.append(f"- Clarification discipline avg: {avg('clarification_discipline')} / 2")
    md.append(f"- Risk handling avg: {avg('risk_handling')} / 2")
    md.append(f"- Explanation quality avg: {avg('explanation_quality')} / 2\n")

    md.append("## Miss clusters by failure owner\n")
    md.append("| Failure owner | Count |")
    md.append("|---|---:|")
    for owner in sorted(failure_owner_counts.keys()):
        md.append(f"| {owner} | {failure_owner_counts[owner]} |")

    md.append("\n## Per-case scores\n")
    md.append("| Case | Total | Action | Best-action | Best direction | Clarification | Risk | Explanation |")
    md.append("|---|---:|---:|---:|---:|---:|---:|---:|")
    for r in rows:
        md.append(
            f"| {r['case_id']} | {r['total_score']} | {r['action_selection']} | {r['best_action_support']} | {r['best_direction']} | {r['clarification_discipline']} | {r['risk_handling']} | {r['explanation_quality']} |"
        )
    out_md.write_text("\n".join(md))

    print(f"Wrote {out_json}")
    print(f"Wrote {out_md}")
    print(f"Wrote {out_miss}")


if __name__ == "__main__":
    main()
