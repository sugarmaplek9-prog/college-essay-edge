
import json
import pandas as pd
from pathlib import Path
from datetime import datetime, timezone


def map_expected_action_to_best_action(expected_action: str) -> str:
    action = (expected_action or "").strip().lower()
    mapping = {
        "rank_candidates": "show_strongest_direction",
        "scope_correct_and_instruct": "show_strongest_direction",
        "clarify_then_rank": "ask_question_before_showing",
        "reframe_with_guardrails": "ask_question_before_showing",
        "warn_then_reframe": "ask_question_before_showing",
        "structured_intake_not_fake_certainty": "ask_question_before_showing",
        "guarded_reframe": "ask_question_before_showing",
        "show_strongest_direction": "show_strongest_direction",
        "ask_question_before_showing": "ask_question_before_showing",
        "blocked_or_needs_more_input": "blocked_or_needs_more_input",
        "no_good_candidate": "no_good_candidate",
    }
    return mapping.get(action, "show_strongest_direction")


def infer_source_type(source: str) -> str:
    src = (source or "").strip().lower()
    if src:
        return "public_internet"
    return "legacy_internal_case"


def infer_adjudication_status(raw_status: str) -> str:
    status = (raw_status or "").strip().lower()
    if status in {"approved", "gold_ready"}:
        return "gold_ready"
    if status in {"pending", "needs_adjudication", ""}:
        return "needs_adjudication"
    return "benchmark_only"

def main():
    src = Path("data/NDS_GOLD_LABEL_PACK_V1.csv")
    out = Path("outputs/NDS_PREDICTIONS_TEMPLATE.jsonl")
    df = pd.read_csv(src)
    out.parent.mkdir(parents=True, exist_ok=True)

    with out.open("w") as f:
        for _, row in df.iterrows():
            obj = {
                "case_id": row["case_id"],
                "run_id": "fill-me",
                "model_version": "fill-me",
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),

                "predicted_best_action": "",
                "predicted_action": "",
                "predicted_best_direction": "",
                "predicted_candidate_directions": [],
                "predicted_rejected_directions": [],
                "clarification_questions": [],
                "confidence_band": "",
                "risk_flags": [],
                "one_sentence_rationale": "",
                "full_rationale": "",
                "needs_human_review": False,

                "failure_annotation": {
                    "failure_owner": "",
                    "better_candidate_existed": "",
                    "clarify_should_have_happened": "",
                    "trust_risk": "",
                    "likely_student_reaction": "",
                },

                "provenance": {
                    "source_type": infer_source_type(row.get("source", "")),
                    "source_origin": row.get("source", ""),
                    "source_reference": row.get("source_url", ""),
                    "capture_date": "",
                    "transformation_level": "redacted",
                    "adjudication_status": infer_adjudication_status(row.get("approved_for_benchmark", "")),
                },

                "expected_best_action": map_expected_action_to_best_action(row.get("expected_nds_action", "")),
            }
            f.write(json.dumps(obj) + "\n")
    print(f"Wrote template to {out}")

if __name__ == "__main__":
    main()
