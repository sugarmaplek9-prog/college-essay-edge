#!/usr/bin/env python3
"""Read CT24 errors."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = os.path.join(ROOT, "evaluation_outputs", "page3_controlled_testing_v1", "ct24_family_aware_fallback_v1", "CONTROLLED_TESTING_SUMMARY_V1.json")
with open(p) as f:
    data = json.load(f)
for row in data["rows"][:3]:
    print(f"--- {row['case_id']} ---")
    print(f"  status: {row.get('status')}")
    print(f"  error: {row.get('error')}")
    print(f"  route_trace: {row.get('route_trace')}")
    print(f"  final_url: {row.get('final_url')}")
    print()
