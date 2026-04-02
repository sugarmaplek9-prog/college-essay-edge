import json
import pathlib
from collections import Counter

BEFORE = pathlib.Path('evaluation_outputs/page3_controlled_testing_v1/ct24_dimension_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json')
AFTER = pathlib.Path('evaluation_outputs/page3_controlled_testing_v1/ct24_relationship_compare_ambiguity_patch_v1/CONTROLLED_TESTING_SUMMARY_V1.json')

BUCKETS = {
    'compare': ['CT24_06', 'CT24_11', 'CT24_19'],
    'ambiguity': ['CT24_01', 'CT24_04', 'CT24_07', 'CT24_09', 'CT24_12', 'CT24_17', 'CT24_20', 'CT24_23'],
}

WEAK_REC = (
    'center your essay on what',
    'center your essay on the',
    'center your essay on how',
    'essay angle: choose the stronger',
    '',
)
WEAK_WHY = (
    'this is stronger because',
    'it is stronger because',
    'this is a compare decision, not a',
    '',
)
WEAK_STEP = (
    'write the opening in four moves:',
    'write the concrete moment before you explain',
    'step 1: list one concrete scene for',
    '',
)


def load_rows(path):
    data = json.loads(path.read_text())
    return {row['case_id']: row for row in data['rows']}


def prefix(text, words):
    return ' '.join(str(text or '').lower().split()[:words])


def repeated_case_count(prefixes):
    counts = Counter(prefixes)
    return sum(1 for p in prefixes if counts[p] > 1)


def weak_count(prefixes, weak_prefixes):
    total = 0
    for p in prefixes:
        if p == '':
            total += 1
            continue
        if any(w and p.startswith(w) for w in weak_prefixes):
            total += 1
    return total


def summarize(rows, ids):
    rec = []
    why = []
    step = []
    for cid in ids:
        rp = ((rows[cid].get('canonical_payload_excerpt') or {}).get('recommendation_packet') or {})
        rec.append(prefix(rp.get('displayed_recommendation', ''), 5))
        why.append(prefix(rp.get('why_this_direction', ''), 7))
        step.append(prefix(rp.get('first_coaching_step', ''), 7))
    rec_counts = Counter(rec).most_common()
    return {
        'repeated_shell_count': repeated_case_count(rec),
        'weak_coach_voice_count': weak_count(rec, WEAK_REC),
        'weak_why_usefulness_count': weak_count(why, WEAK_WHY),
        'weak_first_step_concreteness_count': weak_count(step, WEAK_STEP),
        'top_recommendation_prefix': rec_counts[0][0] if rec_counts else '',
        'top_recommendation_prefix_count': rec_counts[0][1] if rec_counts else 0,
    }

before_rows = load_rows(BEFORE)
after_rows = load_rows(AFTER)
for bucket, ids in BUCKETS.items():
    print(bucket.upper())
    print('before', summarize(before_rows, ids))
    print('after', summarize(after_rows, ids))
