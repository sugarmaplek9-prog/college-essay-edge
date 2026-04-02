#!/usr/bin/env python3
"""Compact CT24 results table."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, "evaluation_outputs", "page3_controlled_testing_v1", "ct24_family_aware_fallback_v1", "CONTROLLED_TESTING_SUMMARY_V1.json")
with open(p) as f:
    data = json.load(f)

print(f"{'case_id':<12} {'family':<15} {'route':<12} {'comp_fail':<10} {'prefix_5':<35}")
print("-" * 90)
for row in data["rows"]:
    cid = row.get("case_id", "?")
    inst = row.get("instrumentation", {})
    fam = inst.get("winner_family", "?") or "?"
    route = row.get("route_category", "?")
    cs = inst.get("composition_summary") or {}
    wc = cs.get("winner_composition") or {}
    cf = wc.get("composition_failed", "?")
    pfx = inst.get("recommendation_prefix_5", "?")
    print(f"{cid:<12} {str(fam):<15} {route:<12} {str(cf):<10} {pfx}")

print()
# Unique prefixes
from collections import Counter
prefixes = [r.get("instrumentation", {}).get("recommendation_prefix_5", "") for r in data["rows"] if r.get("route_category") != "error"]
families = [r.get("instrumentation", {}).get("winner_family", "") for r in data["rows"] if r.get("route_category") != "error"]
routes = [r.get("route_category", "") for r in data["rows"] if r.get("route_category") != "error"]

print("=== PREFIX CONCENTRATION ===")
for pfx, cnt in Counter(prefixes).most_common():
    print(f"  {pfx}: {cnt}")

print()
print("=== FAMILY CONCENTRATION ===")
for fam, cnt in Counter(families).most_common():
    print(f"  {fam}: {cnt}")

print()
print("=== ROUTE DISTRIBUTION ===")
for route, cnt in Counter(routes).most_common():
    print(f"  {route}: {cnt}")

# Direction-only stats
dir_cases = [r for r in data["rows"] if r.get("route_category") == "direction"]
dir_families = [r.get("instrumentation", {}).get("winner_family", "") for r in dir_cases]
dir_prefixes = [r.get("instrumentation", {}).get("recommendation_prefix_5", "") for r in dir_cases]
print()
print(f"=== DIRECTION-ONLY (n={len(dir_cases)}) ===")
print("Families:")
for fam, cnt in Counter(dir_families).most_common():
    print(f"  {fam}: {cnt}")
print("Prefixes:")
for pfx, cnt in Counter(dir_prefixes).most_common():
    print(f"  {pfx}: {cnt}")
unique_pfx = len(set(dir_prefixes))
print(f"\nUnique prefixes in direction cases: {unique_pfx}/{len(dir_cases)}")
print(f"Top-1 prefix share: {Counter(dir_prefixes).most_common(1)[0][1]}/{len(dir_cases)} = {Counter(dir_prefixes).most_common(1)[0][1]/len(dir_cases):.1%}")
