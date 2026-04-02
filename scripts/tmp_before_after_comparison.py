#!/usr/bin/env python3
"""Before/after comparison of source-construction patch."""
import json

before_path = "evaluation_outputs/page3_controlled_testing_v1/ct24_winner_path_v2/CONTROLLED_TESTING_SUMMARY_V1.json"
after_path = "evaluation_outputs/page3_controlled_testing_v1/ct24_source_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json"

with open(before_path) as f:
    before = json.load(f)
with open(after_path) as f:
    after = json.load(f)

b = before["batch_summary"]
a = after["batch_summary"]

print("="*70)
print("BEFORE vs AFTER — SOURCE-CONSTRUCTION PATCH")
print("="*70)

print("\n1. FAMILY DISTRIBUTION")
print(f"   {'family':15s} {'BEFORE':>10s} {'AFTER':>10s} {'delta':>10s}")
print("   " + "-"*45)
bf = {e["key"]: e["count"] for e in b["family_distribution"]}
af = {e["key"]: e["count"] for e in a["family_distribution"]}
families = sorted(set(list(bf.keys()) + list(af.keys())))
for fam in families:
    bv = bf.get(fam, 0)
    av = af.get(fam, 0)
    print(f"   {fam:15s} {bv:10d} {av:10d} {av-bv:>+10d}")

print("\n2. PREFIX DISTRIBUTION")
print(f"   {'prefix':45s} {'BEFORE':>8s} {'AFTER':>8s}")
print("   " + "-"*65)
bp = {e["key"]: e["count"] for e in b["top_prefixes"]}
ap = {e["key"]: e["count"] for e in a["top_prefixes"]}
all_prefixes = sorted(set(list(bp.keys()) + list(ap.keys())), key=lambda k: -(bp.get(k,0)+ap.get(k,0)))
for p in all_prefixes:
    print(f"   {p:45s} {bp.get(p,0):8d} {ap.get(p,0):8d}")

print("\n3. WINNER-PATH MARGIN STATS")
bm = b["winner_path_diagnostics"]["margin_stats"]
am = a["winner_path_diagnostics"]["margin_stats"]
print(f"   {'stat':10s} {'BEFORE':>10s} {'AFTER':>10s}")
for k in ["mean", "min", "max", "median"]:
    print(f"   {k:10s} {bm[k]:10.4f} {am[k]:10.4f}")

print("\n4. RELATIONSHIP DOMINANCE")
bw = b["winner_path_diagnostics"]
aw = a["winner_path_diagnostics"]
print(f"   relationship_winner_count: BEFORE={bw['relationship_winner_count']} AFTER={aw['relationship_winner_count']}")
print(f"   runner_up_also_relationship: BEFORE={bw['runner_up_also_relationship']} AFTER={aw['runner_up_also_relationship']}")

print("\n5. TOTAL SCORE BY FAMILY")
print(f"   {'family':15s} {'BEFORE mean':>14s} {'AFTER mean':>14s} {'delta':>10s}")
bt = {e["family"]: e for e in bw.get("total_score_by_family", [])}
at = {e["family"]: e for e in aw.get("total_score_by_family", [])}
for fam in ["relationship", "realization", "tension", "value", "contradiction"]:
    bv = bt.get(fam, {}).get("mean", 0)
    av = at.get(fam, {}).get("mean", 0)
    print(f"   {fam:15s} {bv:14.4f} {av:14.4f} {av-bv:>+10.4f}")

print("\n6. PER-CASE WINNER CHANGE")
print(f"   {'case':10s} {'BEFORE':>15s} {'AFTER':>15s} {'changed':>8s}")
print("   " + "-"*55)
changes = 0
for br, ar in zip(before["rows"], after["rows"]):
    bf_fam = br.get("instrumentation", {}).get("winner_family") or "none"
    af_fam = ar.get("instrumentation", {}).get("winner_family") or "none"
    changed = "YES" if bf_fam != af_fam else ""
    if changed:
        changes += 1
    print(f"   {br['case_id']:10s} {bf_fam:>15s} {af_fam:>15s} {changed:>8s}")

print(f"\n   Total cases changed: {changes}")
print("\nDone.")
