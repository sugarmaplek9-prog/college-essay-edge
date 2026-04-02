import json

path = "evaluation_outputs/page3_delivery_bundle_v1/summary.json"
with open(path) as f:
    data = json.load(f)

rows = data.get("rows", [])
print(f"Baseline cache: {len(rows)} rows")
for r in rows:
    case_id = r.get("case_id")
    oai = r.get("openai", {})
    status = oai.get("status", "missing")
    has_output = bool(oai.get("output"))
    print(f"  {case_id}: openai.status={status}, has_output={has_output}")
