import json, os

base = "evaluation_outputs/page3_layers"

# Load full report
with open(os.path.join(base, "MULTILAYER_VALIDATION_REPORT_V1.json")) as f:
    rep = json.load(f)

# Load Layer B for detailed checks
with open(os.path.join(base, "layer_b_unseen_validation_v1/summary.json")) as f:
    b = json.load(f)

# UV1_07 and UV1_09 recovery check
by = {r["case_id"]: r for r in b.get("rows", [])}
for cid in ["UV1_07", "UV1_09"]:
    d = by.get(cid, {}).get("product", {}).get("canonical_payload", {}).get("candidate_debug", {})
    winner_id = d.get("winner_id", "?")
    n = d.get("candidates_generated", 0)
    print(f"{cid}: candidates={n}, winner={winner_id}")

# Comprehension fail count
comp = 0
for r in b.get("rows", []):
    d = r.get("product", {}).get("canonical_payload", {}).get("candidate_debug", {})
    for c in d.get("scores_by_candidate", []):
        for rr in c.get("rejection_reasons", []):
            if rr == "comprehension_fail":
                comp += 1
print(f"residual_comprehension_fail_total: {comp}")

# Layer summaries
print()
for layer in rep.get("layers", []):
    tally = layer.get("final_tally", {})
    pool = layer.get("pool_integrity", {})
    pkt = layer.get("packet_validation", {})
    failed = pkt.get("failed_gates", [])
    print(f"{layer['id']}: tally={tally} collapse={pool.get('collapse_cases')} packet_valid={pkt.get('packet_valid_for_review')} failed={failed}")

# Summary
s = rep.get("summary", {})
print()
print(f"all_layers_no_collapse: {s.get('all_layers_no_collapse')}")
print(f"all_layers_packet_valid: {s.get('all_layers_packet_valid')}")
print(f"frozen_regression_ok: {s.get('frozen_regression_ok')}")

# Layer B prefix distribution after fix
print()
print("=== Layer B winner prefix distribution (post-fix) ===")
prefix_count = {}
for r in b.get("rows", []):
    d = r.get("product", {}).get("canonical_payload", {}).get("candidate_debug", {})
    winner_id = d.get("winner_id")
    cands = d.get("scores_by_candidate", [])
    winner = next((c for c in cands if c.get("id") == winner_id), None)
    dl = (winner or {}).get("direction_line", "") if winner else ""
    words = dl.lower().split()
    first5 = " ".join(words[:5])
    family = (winner or {}).get("recommendation_family", "")
    prefix_count[first5] = prefix_count.get(first5, 0) + 1
    print(f"  {r['case_id']} | {winner_id} | {family} | '{first5}'")

print("\n  Prefix counts:")
for p, c in sorted(prefix_count.items(), key=lambda x: -x[1]):
    flag = " *** EXCEEDS MAX=3 ***" if c > 3 else ""
    print(f"    count={c}  '{p}'{flag}")
