#!/usr/bin/env python3
"""Read CT24 family-aware fallback results and print diagnostic summary."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESULTS_PATH = os.path.join(ROOT, "evaluation_outputs", "page3_controlled_testing_v1", "ct24_family_aware_fallback_v1", "CONTROLLED_TESTING_SUMMARY_V1.json")

with open(RESULTS_PATH) as f:
    data = json.load(f)

bs = data["batch_summary"]
print("=== BATCH SUMMARY ===")
print(f"case_count: {bs['case_count']}")
print(f"failed_case_count: {bs['failed_case_count']}")
print(f"fallback_case_count: {bs['fallback_case_count']}")
print(f"thin_coverage_case_count: {bs['thin_coverage_case_count']}")
print()

print("=== COMPOSITION DIAGNOSTICS ===")
cd = bs.get("composition_diagnostics", {})
print(f"cases_with_any_composition_failure: {cd.get('cases_with_any_composition_failure', 'n/a')}")
print(f"cases_with_any_fallback_replacement: {cd.get('cases_with_any_fallback_replacement', 'n/a')}")
print(f"cases_with_family_aware_winner_fallback: {cd.get('cases_with_family_aware_winner_fallback', 'n/a')}")
print()
print("Top composition issues:")
for e in cd.get("top_composition_issues", []):
    print(f"  {e['key']}: {e['count']}")
print()
print("Top fallback reasons:")
for e in cd.get("top_fallback_reasons", []):
    print(f"  {e['key']}: {e['count']}")
print()

print("=== FAMILY DISTRIBUTION ===")
for e in bs["family_distribution"]:
    print(f"  {e['key']}: {e['count']}")
print()

print("=== TOP PREFIXES ===")
for e in bs["top_prefixes"]:
    print(f"  {e['key']}: {e['count']}")
print()

print("=== TOP SEMANTIC SHELLS ===")
for e in bs["top_semantic_shells"]:
    print(f"  {e['key']}: {e['count']}")
print()

# Per-case composition detail
print("=== PER-CASE COMPOSITION DETAIL ===")
for row in data["rows"]:
    cid = row.get("case_id", "?")
    title = row.get("title", "?")
    inst = row.get("instrumentation", {})
    cs = inst.get("composition_summary", {})
    wc = cs.get("winner_composition") or {}
    rec = (row.get("output") or {}).get("displayed_recommendation", "(none)")
    fam = inst.get("winner_family", "?")
    print(f"\n--- {cid}: {title} ---")
    print(f"  winner_family: {fam}")
    print(f"  route_category: {row.get('route_category', '?')}")
    print(f"  composition_failed: {wc.get('composition_failed', '?')}")
    print(f"  composition_issues: {wc.get('composition_issues', [])}")
    print(f"  fallback_replaced: {wc.get('fallback_replaced', '?')}")
    print(f"  fallback_reason: {wc.get('fallback_reason', '?')}")
    print(f"  pre_fallback:  {(wc.get('pre_fallback_recommendation', '') or '')[:120]}")
    print(f"  post_fallback: {(wc.get('post_fallback_recommendation', '') or '')[:120]}")
    print(f"  displayed_rec: {rec[:140]}")
    # Composition detail per candidate
    per_cand = cs.get("per_candidate", [])
    for pc in per_cand:
        ci = pc.get("composition_instrumentation")
        if ci and ci.get("composition_failed"):
            print(f"    [FAIL] {pc['id']} ({pc['family']}): issues={ci['composition_issues']}, reason={ci['fallback_reason']}")
