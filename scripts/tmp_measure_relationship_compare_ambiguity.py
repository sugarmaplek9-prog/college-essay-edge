import json
import pathlib
from collections import Counter

summary = json.loads(pathlib.Path('evaluation_outputs/page3_controlled_testing_v1/ct24_dimension_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json').read_text())
rows = {row['case_id']: row for row in summary['rows']}

buckets = {
    'compare': ['CT24_06', 'CT24_11', 'CT24_19'],
    'ambiguity': ['CT24_01', 'CT24_04', 'CT24_07', 'CT24_09', 'CT24_12', 'CT24_17', 'CT24_20', 'CT24_23'],
}

for name, ids in buckets.items():
    recs = []
    whys = []
    steps = []
    for cid in ids:
        rp = ((rows[cid].get('canonical_payload_excerpt') or {}).get('recommendation_packet') or {})
        recs.append(' '.join(str(rp.get('displayed_recommendation', '') or '').lower().split()[:5]))
        whys.append(' '.join(str(rp.get('why_this_direction', '') or '').lower().split()[:7]))
        steps.append(' '.join(str(rp.get('first_coaching_step', '') or '').lower().split()[:7]))
    print(name, 'rec', Counter(recs).most_common())
    print(name, 'why', Counter(whys).most_common())
    print(name, 'step', Counter(steps).most_common())
