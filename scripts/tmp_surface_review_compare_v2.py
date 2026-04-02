#!/usr/bin/env python3
import json
import re
from collections import Counter

BEFORE = "evaluation_outputs/page3_controlled_testing_v1/ct24_source_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json"
AFTER = "evaluation_outputs/page3_controlled_testing_v1/ct24_coach_quality_v1/CONTROLLED_TESTING_SUMMARY_V1.json"

def clean(v):
    return re.sub(r"\s+", " ", str(v or "")).strip()

def lower(v):
    return clean(v).lower()

def prefix5(v):
    return " ".join([x for x in re.split(r"[^a-z0-9]+", lower(v)) if x][:5]) or "empty"

def score_recommendation_clarity(rec, route_category):
    rec = clean(rec)
    if not rec:
        return 1
    if route_category in {"blocked", "question"}:
        return 2
    if re.search(r"^essay angle:\s*choose the stronger", rec, re.I):
        return 2
    if re.search(r"center your essay on the moment you changed your response after the moment you noticed", rec, re.I):
        return 2
    if re.search(r"center your essay on", rec, re.I):
        return 3
    return 4

def score_essay_about_meaning(essay_about):
    essay_about = clean(essay_about)
    if not essay_about:
        return 1
    if re.search(r"what matters here is", essay_about, re.I) and re.search(r"why this matters:", essay_about, re.I):
        return 2
    if re.search(r"the meaning is", essay_about, re.I):
        return 3
    return 4

def score_why_usefulness(why):
    why = clean(why)
    if not why:
        return 1
    has_comparative = bool(re.search(r"beats the weaker read|rather than|instead of|stronger", why, re.I))
    has_drafting = bool(re.search(r"drafting payoff|start with|draft", why, re.I))
    truncated = bool(re.search(r"…|\.\.\.$", why))
    if has_comparative and has_drafting and not truncated:
        return 4
    if has_comparative and has_drafting:
        return 3
    if has_comparative or has_drafting:
        return 2
    return 1

def score_compare_utility(weaker, stronger):
    weaker = clean(weaker)
    stronger = clean(stronger)
    if not weaker and not stronger:
        return 1
    if weaker and stronger:
        return 3
    return 2

def score_next_step(next_step):
    next_step = clean(next_step)
    if not next_step:
        return 1
    if re.search(r"open with|next step|write|draft|start", next_step, re.I):
        return 4
    return 2

def derive_flags(row):
    output = row.get("output") or {}
    rec = output.get("displayed_recommendation", "")
    essay_about = output.get("essay_about", "")
    why = output.get("why_this_direction", "")
    weaker = output.get("weaker_read", "")
    stronger = output.get("stronger_read", "")
    next_step = output.get("next_step", "")
    route_category = row.get("route_category", "")

    rec_score = score_recommendation_clarity(rec, route_category)
    essay_score = score_essay_about_meaning(essay_about)
    why_score = score_why_usefulness(why)
    compare_score = score_compare_utility(weaker, stronger)
    next_score = score_next_step(next_step)

    templated = bool(re.search(r"^center your essay on", lower(rec))) or bool(re.search(r"^show how your understanding shifted", lower(rec))) or bool(re.search(r"the moment you changed your response after the moment you noticed", lower(rec)))
    generic = bool(re.search(r"what matters here is|the meaning is", lower(essay_about))) or bool(re.search(r"this beats the weaker read because", lower(why)))
    misrouted = route_category in {"blocked", "question"}
    sharp_coach_voice = why_score >= 3 and next_score >= 2 and not templated

    avg = (rec_score + essay_score + why_score + compare_score + next_score) / 5
    if misrouted or rec_score <= 2 or next_score <= 1 or (templated and generic):
        outcome = "failure"
    elif avg < 2.8 or templated:
        outcome = "structurally_weak"
    elif avg >= 3.6 and sharp_coach_voice:
        outcome = "landed"
    else:
        outcome = "usable_with_polish"

    return {
        "recommendation_clarity": rec_score,
        "essay_about_meaning": essay_score,
        "why_usefulness": why_score,
        "compare_utility": compare_score,
        "next_step_concreteness": next_score,
        "templated": templated,
        "generic": generic,
        "misrouted": misrouted,
        "sharp_coach_voice": sharp_coach_voice,
        "outcome": outcome,
    }

def summarize(path):
    with open(path) as f:
        data = json.load(f)
    rows = data["rows"]
    reviewed = []
    families = Counter()
    shells = Counter()
    prefixes = Counter()
    for row in rows:
        flags = derive_flags(row)
        reviewed.append((row, flags))
        fam = (row.get("instrumentation") or {}).get("winner_family")
        if fam:
            families[fam] += 1
        shell = (row.get("instrumentation") or {}).get("semantic_shell") or "unknown"
        shells[shell] += 1
        prefixes[prefix5((row.get("output") or {}).get("displayed_recommendation", ""))] += 1
    n = len(rows)
    return {
        "case_count": n,
        "relationship_winner_share_all": round(families.get("relationship", 0) / max(n, 1), 4),
        "shell_top": shells.most_common(5),
        "prefix_top": prefixes.most_common(5),
        "templated_count": sum(1 for _,f in reviewed if f["templated"]),
        "generic_count": sum(1 for _,f in reviewed if f["generic"]),
        "weak_sharp_coach_voice_count": sum(1 for _,f in reviewed if not f["sharp_coach_voice"]),
        "weak_next_step_count": sum(1 for _,f in reviewed if f["next_step_concreteness"] <= 2),
        "outcome_counts": Counter(f["outcome"] for _,f in reviewed),
        "score_means": {
            "why_usefulness": round(sum(f["why_usefulness"] for _,f in reviewed)/n, 4),
            "compare_utility": round(sum(f["compare_utility"] for _,f in reviewed)/n, 4),
            "next_step_concreteness": round(sum(f["next_step_concreteness"] for _,f in reviewed)/n, 4),
        },
    }

before = summarize(BEFORE)
after = summarize(AFTER)
print(json.dumps({"before": before, "after": after}, indent=2))
