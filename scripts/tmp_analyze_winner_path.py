#!/usr/bin/env python3
"""Analyze CT24 winner-path diagnostic results."""
import json, sys

with open("evaluation_outputs/page3_controlled_testing_v1/ct24_winner_path_v1/CONTROLLED_TESTING_SUMMARY_V1.json") as f:
    data = json.load(f)

bs = data["batch_summary"]
wpd = bs["winner_path_diagnostics"]

print("="*70)
print("WINNER-PATH DOMINANCE ANALYSIS — CT24")
print("="*70)

# 1. Family distribution
print("\n1. FAMILY DISTRIBUTION")
for e in bs["family_distribution"]:
    print(f"   {e['key']}: {e['count']}")

# 2. Margin stats
ms = wpd["margin_stats"]
print(f"\n2. MARGIN (winner - runner-up)")
print(f"   mean={ms['mean']:.4f}  min={ms['min']:.4f}  max={ms['max']:.4f}  median={ms['median']:.4f}")

# 3. family_fit_base by family
print("\n3. FAMILY_FIT_BASE BY FAMILY")
for f_entry in wpd["family_fit_base_by_family"]:
    print(f"   {f_entry['family']:15s}: mean={f_entry['mean']:.4f}  min={f_entry['min']}  max={f_entry['max']}  n={f_entry['n']}")

# 4. total_score by family
print("\n4. TOTAL_SCORE BY FAMILY")
for f_entry in wpd["total_score_by_family"]:
    print(f"   {f_entry['family']:15s}: mean={f_entry['mean']:.4f}  min={f_entry['min']}  max={f_entry['max']}  median={f_entry['median']}  n={f_entry['n']}")

# 5. Per-case winner-path details
print("\n5. PER-CASE WINNER-PATH (direction cases only)")
print(f"   {'case':10s} {'winner':15s} {'runner':15s} {'margin':>8s} {'w_fitB':>7s} {'r_fitB':>7s} {'w_fit':>7s} {'r_fit':>7s} {'w_misfit':>8s} {'r_misfit':>8s}")
print("   " + "-"*100)

direction_rows = []
for row in data["rows"]:
    if row.get("route_category") != "direction":
        continue
    wp = row.get("instrumentation", {}).get("winner_path", {})
    if not wp:
        continue
    direction_rows.append(row)
    wf = row["instrumentation"].get("winner_family", "?")
    rf = wp.get("runner_up_family", "?")
    margin = wp.get("margin_over_runner_up", 0)
    w_fitB = wp.get("winner_family_fit_base", 0)
    r_fitB = wp.get("runner_up_family_fit_base", 0)
    w_fit = wp.get("winner_family_fit", 0)
    r_fit = wp.get("runner_up_family_fit", 0)
    w_misfit = wp.get("winner_misfit_penalty", 0)
    r_misfit = wp.get("runner_up_misfit_penalty", 0)
    print(f"   {row['case_id']:10s} {wf:15s} {rf:15s} {margin:8.4f} {w_fitB:7.3f} {r_fitB:7.3f} {w_fit:7.3f} {r_fit:7.3f} {w_misfit:8.4f} {r_misfit:8.4f}")

# 6. Understand WHERE relationship beats realization — dimension breakdown
print("\n6. RELATIONSHIP vs REALIZATION SCORE DIMENSION COMPARISON")
print("   (Averaged across direction cases where both are present)")

rel_dims = {}
rea_dims = {}
dim_names = [
    "family_fit_base", "family_fit", "family_fit_gap", "pattern_conditioned_misfit_penalty",
    "dominant_family_overuse_penalty", "abstraction_penalty",
    "total", "pre_penalty_total", "post_penalty_total",
    "human_preference_likelihood"
]

for row in direction_rows:
    wp = row.get("instrumentation", {}).get("winner_path", {})
    for pf in wp.get("per_family_scores", []):
        fam = pf.get("family", "")
        target = rel_dims if fam == "relationship" else (rea_dims if fam == "realization" else None)
        if target is None:
            continue
        for dim in dim_names:
            if dim not in target:
                target[dim] = []
            target[dim].append(pf.get(dim, 0))

print(f"\n   {'dimension':40s} {'relationship':>14s} {'realization':>14s} {'delta':>10s}")
print("   " + "-"*80)
for dim in dim_names:
    r_vals = rel_dims.get(dim, [])
    e_vals = rea_dims.get(dim, [])
    r_mean = sum(r_vals)/len(r_vals) if r_vals else 0
    e_mean = sum(e_vals)/len(e_vals) if e_vals else 0
    delta = r_mean - e_mean
    print(f"   {dim:40s} {r_mean:14.4f} {e_mean:14.4f} {delta:10.4f}")

# 7. Cases where margin is tight (< 0.03)
print("\n7. TIGHT-MARGIN CASES (< 0.03)")
for row in direction_rows:
    wp = row.get("instrumentation", {}).get("winner_path", {})
    margin = wp.get("margin_over_runner_up", 0)
    if abs(margin) < 0.03:
        wf = row["instrumentation"].get("winner_family", "?")
        rf = wp.get("runner_up_family", "?")
        pf_totals = {pf["family"]: pf["total"] for pf in wp.get("per_family_scores", [])}
        print(f"   {row['case_id']}: {wf}→{rf}  margin={margin:.4f}  totals={pf_totals}")

print("\nDone.")
