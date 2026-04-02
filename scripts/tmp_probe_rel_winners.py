import json, os

base = "evaluation_outputs/page3_layers"

def probe_layer(path, label):
    full = os.path.join(base, path, "summary.json")
    if not os.path.exists(full):
        print(f"MISSING: {full}")
        return
    with open(full) as f:
        data = json.load(f)
    print(f"=== {label} ===")
    prefix_count = {}
    for r in data.get("rows", []):
        d = r.get("product", {}).get("canonical_payload", {}).get("candidate_debug", {})
        if not d or not d.get("scores_by_candidate"):
            continue
        winner_id = d.get("winner_id")
        winner = next((c for c in d["scores_by_candidate"] if c.get("id") == winner_id), None)
        dl = winner.get("direction_line", "") if winner else ""
        words = dl.lower().split()
        first5 = " ".join(words[:5])
        family = (winner or {}).get("recommendation_family", "")
        prefix_count[first5] = prefix_count.get(first5, 0) + 1
        print(f"  {r['case_id']} | {winner_id} | {family} | {repr(first5)}")
    print("  -- prefix distribution:")
    for p, c in sorted(prefix_count.items(), key=lambda x: -x[1]):
        print(f"     count={c}  '{p}'")

probe_layer("layer_a_frozen_regression_v1", "LAYER A")
probe_layer("layer_b_unseen_validation_v1", "LAYER B")
probe_layer("layer_c_messy_realworld_v1", "LAYER C")
