#!/usr/bin/env python3
"""Deep dimension-level analysis of relationship vs realization scoring."""
import json

with open("evaluation_outputs/page3_controlled_testing_v1/ct24_winner_path_v2/CONTROLLED_TESTING_SUMMARY_V1.json") as f:
    data = json.load(f)

# Extract ALL scoring dimensions from candidate_debug for direction cases
all_dims = set()
family_dim_vals = {}  # family → dim → [values]

for row in data["rows"]:
    if row.get("route_category") != "direction":
        continue
    cd = row.get("canonical_payload_excerpt", {}) or {}
    cand_debug = cd.get("candidate_debug") if isinstance(cd, dict) else None
    if not cand_debug:
        continue
    for c in cand_debug.get("scores_by_candidate", []):
        fam = c.get("recommendation_family", "unknown")
        if fam not in family_dim_vals:
            family_dim_vals[fam] = {}
        for key, val in c.items():
            if isinstance(val, (int, float)) and key not in ("id",):
                all_dims.add(key)
                if key not in family_dim_vals[fam]:
                    family_dim_vals[fam][key] = []
                family_dim_vals[fam][key].append(val)

# Compare relationship vs realization across ALL dimensions
print("="*90)
print("RELATIONSHIP vs REALIZATION — ALL SCORING DIMENSIONS")
print("="*90)
print(f"{'dimension':45s} {'relationship':>12s} {'realization':>12s} {'delta':>10s} {'note':>8s}")
print("-"*90)

dims_sorted = sorted(all_dims)
for dim in dims_sorted:
    r_vals = family_dim_vals.get("relationship", {}).get(dim, [])
    e_vals = family_dim_vals.get("realization", {}).get(dim, [])
    r_mean = sum(r_vals)/len(r_vals) if r_vals else 0
    e_mean = sum(e_vals)/len(e_vals) if e_vals else 0
    delta = r_mean - e_mean
    note = ""
    if abs(delta) > 0.05:
        note = "⚠️" if delta > 0 else "📉"
    print(f"  {dim:45s} {r_mean:12.4f} {e_mean:12.4f} {delta:10.4f} {note}")

# Also show tension, value, contradiction means for context
print("\n" + "="*90)
print("ALL FAMILIES — KEY DIMENSIONS COMPARISON")
print("="*90)
key_dims = [
    "family_fit_base", "family_fit", "family_fit_gap", "pattern_conditioned_misfit_penalty",
    "directional_usefulness", "essay_aboutness_clarity", "why_quality",
    "coaching_actionability", "human_preference_likelihood",
    "draftability", "non_repeatability", "individualization",
    "concrete_anchor_retention", "narrative_hinge_clarity",
    "source_grounding", "source_faithfulness",
    "angle_directness", "essay_angle_naming_quality",
    "case_specificity_beyond_pivot",
    "translation_penalty", "template_scaffold_penalty", "abstraction_penalty",
    "decision_shell_penalty", "family_collapse_penalty",
    "dominant_family_overuse_penalty",
    "pre_penalty_total", "post_penalty_total", "total",
]

families = ["relationship", "realization", "tension", "value", "contradiction"]
header = f"{'dimension':38s}" + "".join(f"{f:>14s}" for f in families)
print(header)
print("-"*108)
for dim in key_dims:
    vals_str = ""
    for fam in families:
        v = family_dim_vals.get(fam, {}).get(dim, [])
        mean = sum(v)/len(v) if v else 0
        vals_str += f"{mean:14.4f}"
    print(f"  {dim:38s}{vals_str}")

# Identify the LARGEST deltas favoring relationship over realization
print("\n" + "="*90)
print("TOP 10 DIMENSIONS FAVORING RELATIONSHIP OVER REALIZATION")
print("="*90)
deltas = []
for dim in all_dims:
    r_vals = family_dim_vals.get("relationship", {}).get(dim, [])
    e_vals = family_dim_vals.get("realization", {}).get(dim, [])
    r_mean = sum(r_vals)/len(r_vals) if r_vals else 0
    e_mean = sum(e_vals)/len(e_vals) if e_vals else 0
    deltas.append((dim, r_mean - e_mean, r_mean, e_mean))

deltas.sort(key=lambda x: x[1], reverse=True)
for dim, delta, r_mean, e_mean in deltas[:10]:
    print(f"  {dim:45s}: rel={r_mean:.4f} rea={e_mean:.4f} delta=+{delta:.4f}")

# Check per-case score IDENTITY (how many cases produce identical scores)
print("\n" + "="*90)
print("SCORE IDENTITY CHECK — HOW MANY CASES PRODUCE IDENTICAL relationship TOTALS?")
print("="*90)
rel_totals = []
for row in data["rows"]:
    if row.get("route_category") != "direction":
        continue
    cd = row.get("canonical_payload_excerpt", {}) or {}
    cand_debug = cd.get("candidate_debug") if isinstance(cd, dict) else None
    if not cand_debug:
        continue
    for c in cand_debug.get("scores_by_candidate", []):
        if c.get("recommendation_family") == "relationship":
            rel_totals.append((row["case_id"], c.get("total", 0)))

from collections import Counter
total_counter = Counter(t for _, t in rel_totals)
for total_val, count in total_counter.most_common(10):
    cases = [cid for cid, t in rel_totals if t == total_val]
    print(f"  total={total_val}: {count} cases → {', '.join(cases[:5])}{'...' if len(cases)>5 else ''}")

print("\nDone.")
