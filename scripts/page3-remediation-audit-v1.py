import json
import os
import re
import urllib.request
from datetime import datetime, UTC

ROOT = '/Volumes/TOSHIBA EXT/College Essay'
OUT_DIR = os.path.join(ROOT, 'evaluation_outputs', 'page3_rewrite_revision_proof_v1')
os.makedirs(OUT_DIR, exist_ok=True)

DEPLOYED_URL = 'https://college-essay-edge-hz5647mrv-college-edge.vercel.app'
BEFORE_URL = 'https://college-essay-edge-g311wfuqb-college-edge.vercel.app'

BLIND_PACKET_PATH = os.path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_packet.json')
BLIND_KEY_PATH = os.path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'blind_review_answer_key.json')
FIVE_CASE_PATH = os.path.join(ROOT, 'evaluation_outputs', 'page3_five_case_before_after_v1', 'summary.json')


def now_iso():
    return datetime.now(UTC).isoformat().replace('+00:00', 'Z')


def post_json(url, raw_notes):
    payload = json.dumps({'raw_input': raw_notes}).encode('utf-8')
    req = urllib.request.Request(
        url + '/api/intake/session',
        data=payload,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def extract_packet(resp):
    cp = (resp or {}).get('canonical_page3_payload') or {}
    rp = (cp.get('recommendation_packet') or {})
    return {
        'displayed_recommendation': rp.get('displayed_recommendation', ''),
        'essay_about': rp.get('essay_about', ''),
        'why_this_direction': rp.get('why_this_direction', ''),
        'weaker_read': rp.get('weaker_read', ''),
        'stronger_read': rp.get('stronger_read', ''),
        'evidence_lines': rp.get('evidence_lines', []) or [],
        'evidence_explanations': rp.get('evidence_explanations', []) or [],
        'route_target': ((cp.get('routing') or {}).get('route_target')),
        'unknown_classifier': ((cp.get('routing') or {}).get('unknown_classifier')),
        'product_mode': (resp or {}).get('product_mode'),
    }


families = {
    'hard_banned_shells': [
        r'build from the angle that',
        r'the direction is the specific moment',
        r'the real story is',
        r'what changed in your judgment',
        r'the choice at.+changed what happened',
    ],
    'hard_banned_why': [
        r'this direction works because',
        r'this works because',
        r'specific gap',
        r'not a general lesson',
        r'links one decision to one consequence',
    ],
    'hard_banned_compare': [
        r'overweights setup',
        r'underweights the real decision',
        r'centers the hinge',
        r'keeps the decision and consequence tied',
        r'stays closer to setup than hinge',
    ],
    'hard_banned_evidence': [
        r'this line grounds the setting where',
        r'this line contains the hinge',
        r'this line shows what changed after',
        r'this line captures what you understood',
    ],
    'structural_equivalents': [
        r'one clear thread',
        r'concrete moments and consequences',
        r'strong central claim',
        r'this read stays closer',
        r'this read centers',
        r'best angle stays anchored',
        r'real hinge',
        r'turning decision',
        r'source-backed hinge',
    ],
}


def joined_text_from_candidate(c):
    return ' '.join([
        c.get('recommendation', ''),
        c.get('essay_about', ''),
        c.get('why_this_direction', ''),
        c.get('weaker_read', ''),
        c.get('stronger_read', ''),
        ' '.join(c.get('evidence_explanations', []) or []),
    ]).lower()


def count_patterns(text, pats):
    return sum(len(re.findall(p, text, flags=re.I)) for p in pats)


blind = json.load(open(BLIND_PACKET_PATH))
blind_key = json.load(open(BLIND_KEY_PATH))
key_rows = blind_key.get('key', []) if isinstance(blind_key, dict) else blind_key
key_map = {k['case_id']: k for k in key_rows}

# phrase-family compliance counts
family_counts = {}
for fam, pats in families.items():
    family_counts[fam] = {
        'product_side_count': 0,
        'all_candidate_count': 0,
        'patterns': {p: 0 for p in pats},
    }

rhythm_pattern = re.compile(r'\b(this version|this angle|this essay is fundamentally about)\b', re.I)
ident_details = []

for row in blind:
    cid = row['case_id']
    A = row['candidate_A']
    B = row['candidate_B']
    a_text = joined_text_from_candidate(A)
    b_text = joined_text_from_candidate(B)
    km = key_map.get(cid, {})
    product_side = 'A' if km.get('A_model') == 'product' else 'B'
    product_text = a_text if product_side == 'A' else b_text

    for fam, pats in families.items():
        family_counts[fam]['product_side_count'] += count_patterns(product_text, pats)
        family_counts[fam]['all_candidate_count'] += count_patterns(a_text + ' ' + b_text, pats)
        for p in pats:
            family_counts[fam]['patterns'][p] += len(re.findall(p, product_text, flags=re.I))

    a_tell = len(rhythm_pattern.findall(a_text))
    b_tell = len(rhythm_pattern.findall(b_text))
    if (a_tell > 0) != (b_tell > 0):
        guessed = 'A' if a_tell > 0 else 'B'
        ident_details.append({
            'case_id': cid,
            'a_tell_hits': a_tell,
            'b_tell_hits': b_tell,
            'guessed_product_side': guessed,
            'actual_product_side': product_side,
            'correct': guessed == product_side,
        })

ident = {
    'cases_total': len(blind),
    'decodable_cases': len(ident_details),
    'decodable_rate': round(len(ident_details) / max(1, len(blind)), 3),
    'correct_guesses': sum(1 for d in ident_details if d['correct']),
    'details': ident_details,
}

# before/after phrase counts
five = json.load(open(FIVE_CASE_PATH))
before_text = []
after_text = []
for r in five.get('results', []):
    b = r.get('before', {}).get('direction_surface') or {}
    a = r.get('after', {}).get('direction_surface') or {}
    before_text.append(' '.join([
        b.get('displayed_recommendation', ''),
        b.get('why_this_direction', ''),
        b.get('weaker_read', ''),
        b.get('stronger_read', ''),
    ]))
    after_text.append(' '.join([
        a.get('displayed_recommendation', ''),
        a.get('why_this_direction', ''),
        a.get('weaker_read', ''),
        a.get('stronger_read', ''),
    ]))

before_join = ' '.join(before_text).lower()
after_join = ' '.join(after_text).lower()

before_after = {}
for fam, pats in families.items():
    before_after[fam] = {
        'before_count': count_patterns(before_join, pats),
        'after_count': count_patterns(after_join, pats),
    }

# ambiguity proofs
ambiguity_cases = [
    {
        'case_id': 'AMB_NHB_01',
        'title': 'Split focus: art portfolio vs cross-country',
        'raw_notes': 'I can write about building my art portfolio or about cross-country. Both matter and I am not sure which direction is stronger.',
    },
    {
        'case_id': 'AMB_NHB_02',
        'title': 'Uncertain service notes',
        'raw_notes': 'I volunteered a lot this year and learned many things. I am not sure what exact moment should be my essay center.',
    },
]

amb_rows = []
for c in ambiguity_cases:
    old_resp = post_json(BEFORE_URL, c['raw_notes'])
    new_resp = post_json(DEPLOYED_URL, c['raw_notes'])
    old_p = extract_packet(old_resp)
    new_p = extract_packet(new_resp)
    amb_rows.append({
        'case_id': c['case_id'],
        'title': c['title'],
        'raw_notes': c['raw_notes'],
        'before': old_p,
        'after': new_p,
        'checks': {
            'after_mentions_multiple_angles': bool(re.search(r'\b(two|2|three|3)\b', (new_p['displayed_recommendation'] + ' ' + new_p['essay_about']).lower())),
            'after_mentions_missing_info': bool(re.search(r'\b(missing|decisive|choose|sorting question)\b', (new_p['why_this_direction'] + ' ' + new_p['stronger_read']).lower())),
            'after_contains_concrete_next_question': '?' in new_p['stronger_read'] or '?' in (new_p.get('why_this_direction') or ''),
            'before_was_blankish': not any([old_p['displayed_recommendation'], old_p['essay_about'], old_p['why_this_direction']]),
        },
    })

json.dump({
    'generated_at': now_iso(),
    'deployed_url': DEPLOYED_URL,
    'blind_packet_path': BLIND_PACKET_PATH,
    'family_counts': family_counts,
    'before_after_counts': before_after,
}, open(os.path.join(OUT_DIR, 'phrase_family_compliance_audit.json'), 'w'), indent=2)

json.dump({
    'generated_at': now_iso(),
    'deployed_url': DEPLOYED_URL,
    'analysis': ident,
}, open(os.path.join(OUT_DIR, 'blind_identifiability_audit.json'), 'w'), indent=2)

json.dump({
    'generated_at': now_iso(),
    'before_url': BEFORE_URL,
    'after_url': DEPLOYED_URL,
    'rows': amb_rows,
}, open(os.path.join(OUT_DIR, 'ambiguity_case_proofs_v1.json'), 'w'), indent=2)

print('wrote remediation audits to', OUT_DIR)
