import json
from pathlib import Path

root = Path('/Volumes/TOSHIBA EXT/College Essay/evaluation_outputs/page3_controlled_testing_v1')
old = json.loads((root / 'ct24_post_blocked_route_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json').read_text())
new = json.loads((root / 'ct24_post_ct24_14_canonical_fix_v1/CONTROLLED_TESTING_SUMMARY_V1.json').read_text())

old_by = {row['case_id']: row for row in old['rows']}
new_by = {row['case_id']: row for row in new['rows']}
changes = []

for case_id in sorted(new_by):
    before = old_by.get(case_id, {})
    after = new_by[case_id]
    delta = {}
    fields = {
        'route_category': (before.get('route_category'), after.get('route_category')),
        'winner_id': (
            before.get('instrumentation', {}).get('winner_id'),
            after.get('instrumentation', {}).get('winner_id'),
        ),
        'winner_family': (
            before.get('instrumentation', {}).get('winner_family'),
            after.get('instrumentation', {}).get('winner_family'),
        ),
        'candidates_generated': (
            before.get('instrumentation', {}).get('candidates_generated'),
            after.get('instrumentation', {}).get('candidates_generated'),
        ),
        'fallback_path_used': (
            before.get('instrumentation', {}).get('fallback_path_used'),
            after.get('instrumentation', {}).get('fallback_path_used'),
        ),
        'displayed_recommendation': (
            before.get('output', {}).get('displayed_recommendation'),
            after.get('output', {}).get('displayed_recommendation'),
        ),
    }
    for key, (old_value, new_value) in fields.items():
        if old_value != new_value:
            delta[key] = {'before': old_value, 'after': new_value}
    if delta:
        changes.append({'case_id': case_id, 'changes': delta})

print(json.dumps({'changed_case_count': len(changes), 'changed_cases': changes}, indent=2))
