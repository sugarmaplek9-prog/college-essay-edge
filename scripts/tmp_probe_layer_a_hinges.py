import json

# Load Layer A summary
with open("evaluation_outputs/page3_layers/layer_a_frozen_regression_v1/summary.json") as f:
    a = json.load(f)

print("=== Layer A relationship/realization winner details ===")
for r in a.get("rows", []):
    d = r.get("product", {}).get("canonical_payload", {}).get("candidate_debug", {})
    if not d:
        continue
    winner_id = d.get("winner_id")
    cands = d.get("scores_by_candidate", [])
    winner = next((c for c in cands if c.get("id") == winner_id), None)
    family = (winner or {}).get("recommendation_family", "")
    if family not in ("relationship", "realization"):
        continue
    dl = (winner or {}).get("direction_line", "")
    print(f"  {r['case_id']} | {winner_id} | family={family}")
    print(f"    direction_line: {repr(dl)}")
    
    # Compute seed from candidate_id + what we can infer
    # The seed = f"c_relationship_angle:{turningQ}:{consequenceQ}:{reflectionQ}"
    # Hinge for relationship: "the moment you changed your response after X" → turningQ=X
    # or "the moment you changed how you responded to ACTOR" → actor=ACTOR
    # Let's extract from direction_line
    import re
    if family == "relationship":
        # Pattern: "Center your essay on the moment you changed how you responded to ACTOR, and CONSEQUENCE"
        m = re.search(r"Center your essay on the moment you changed how you responded to ([^,]+)", dl, re.IGNORECASE)
        if m:
            actor = m.group(1).strip().rstrip(".")
            print(f"    → actor={repr(actor)}")
        else:
            # Pattern: "Center your essay on the moment you changed your response after TURNINGQ, and CONSEQUENCE"
            m2 = re.search(r"Center your essay on the moment you changed your response after ([^,]+)", dl, re.IGNORECASE)
            if m2:
                turningQ = m2.group(1).strip().rstrip(".")
                print(f"    → turningQ={repr(turningQ)}")
        # Extract consequence
        m3 = re.search(r", and (.+?)$", dl)
        if m3:
            print(f"    → consequence tail: {repr(m3.group(1)[:80])}")
    print()
