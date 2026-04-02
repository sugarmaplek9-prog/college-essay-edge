import json
import os
import re
import urllib.request
from datetime import datetime

root = '/Volumes/TOSHIBA EXT/College Essay'
out_dir = os.path.join(root, 'evaluation_outputs', 'page3_generator_rewrite_proof_v1')
os.makedirs(out_dir, exist_ok=True)

BEFORE = 'https://college-essay-edge-g311wfuqb-college-edge.vercel.app'
AFTER = 'https://college-essay-edge.vercel.app'


def post_json(url, raw_notes):
    data = json.dumps({'raw_input': raw_notes}).encode('utf-8')
    req = urllib.request.Request(
        url + '/api/intake/session',
        data=data,
        headers={'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def pack_fields_from_response(resp):
    cp = (resp or {}).get('canonical_page3_payload') or {}
    rec = (cp.get('recommendation_packet') or {})
    return {
        'displayed_recommendation': rec.get('displayed_recommendation', ''),
        'essay_about': rec.get('essay_about', ''),
        'why_this_direction': rec.get('why_this_direction', ''),
        'weaker_read': rec.get('weaker_read', ''),
        'stronger_read': rec.get('stronger_read', ''),
        'evidence_explanations': rec.get('evidence_explanations', []) or [],
        'product_mode': (resp or {}).get('product_mode'),
        'route_target': ((cp.get('routing') or {}).get('route_target')),
        'unknown_classifier': ((cp.get('routing') or {}).get('unknown_classifier')),
    }


selected = [
    (
        'RUS_03',
        'Pantry redesign with concrete hinge',
        'I changed in debate and also helped redesign pantry pickup, both mattered but I am not sure which one says more about me. One family told me they stopped coming because lines were public. I proposed quiet pickup slots and attendance recovered.',
    ),
    (
        'RUS_04',
        'Robotics mistake to checklist ownership',
        'I keep saying I learned confidence, but that sounds fake. Concrete moment: I gave wrong instructions during robotics setup and had to ask a freshman to walk me through my own design. After that, I created a pre-launch checklist owned by whoever would be affected, not whoever had seniority.',
    ),
    (
        'RUS_01',
        'Peer tutoring ownership redesign',
        'I reorganized peer tutoring because everyone waited for me, then I created rotating owners and wait times dropped. The moment was when a younger student said she finally felt seen.',
    ),
    (
        'RUS_12',
        'Hospital service hinge with explicit consequence',
        'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
    ),
    (
        'RUS_13',
        'Clinic translation with immediate outcome',
        'At a clinic desk, I translated a medication warning for my parents and realized precision could change outcomes that same day. I shifted from sounding fluent to making sure every instruction was actually understood.',
    ),
]

old_summary_path = os.path.join(root, 'evaluation_outputs', 'page3_five_case_before_after_v1', 'summary.json')
old_summary = json.load(open(old_summary_path))
old_map = {r['case_id']: r for r in old_summary.get('results', [])}

five = []
for cid, title, raw in selected:
    before_old = old_map.get(cid, {})
    old_dir = ((before_old.get('before') or {}).get('direction_surface') or {})
    old_ref = ((before_old.get('before') or {}).get('reflecting_surface') or {})
    old_fields = {
        'displayed_recommendation': old_dir.get('displayed_recommendation') or old_ref.get('displayed_recommendation') or '',
        'essay_about': '(not captured in old packet artifact)',
        'why_this_direction': old_dir.get('why_this_direction') or old_ref.get('why_this_direction') or '',
        'weaker_read': old_dir.get('weaker_read') or old_ref.get('weaker_read') or '',
        'stronger_read': old_dir.get('stronger_read') or old_ref.get('stronger_read') or '',
        'evidence_explanations': ['(not captured in old packet artifact)'],
        'source': 'page3_five_case_before_after_v1/summary.json (before.direction_surface + before.reflecting_surface)',
    }

    after_live = post_json(AFTER, raw)
    new_fields = pack_fields_from_response(after_live)

    def has_mech(text):
        t = (text or '').lower()
        bad = [
            'the real story is',
            'the choice at',
            'the direction is the specific moment',
            'this read stays closer',
            'this read centers',
            'this direction works because',
            'specific gap',
        ]
        return any(b in t for b in bad)

    commentary = {
        'less_machine_readable': (
            not has_mech(
                new_fields['displayed_recommendation']
                + ' '
                + new_fields['why_this_direction']
                + ' '
                + new_fields['weaker_read']
                + ' '
                + new_fields['stronger_read']
            )
        ),
        'more_essay_aboutness_driven': bool(new_fields['essay_about']) and new_fields['essay_about'] != '',
        'why_more_persuasive': len((new_fields['why_this_direction'] or '').split()) >= 8 and not has_mech(new_fields['why_this_direction']),
        'ambiguity_usefulness_improved_if_relevant': (
            'n/a' if 'unsure' not in raw.lower() and 'both' not in raw.lower() else bool(new_fields['displayed_recommendation'])
        ),
    }

    five.append(
        {
            'case_id': cid,
            'title': title,
            'raw_notes': raw,
            'old': old_fields,
            'new': new_fields,
            'commentary': commentary,
            'deployed_sources': {
                'after_url': AFTER,
                'after_response_product_mode': after_live.get('product_mode'),
                'after_route_target': ((after_live.get('canonical_page3_payload') or {}).get('routing') or {}).get('route_target'),
            },
        }
    )

five_out = {
    'generated_at': datetime.utcnow().isoformat() + 'Z',
    'before_source_artifact': 'evaluation_outputs/page3_five_case_before_after_v1/summary.json',
    'after_url': AFTER,
    'cases': five,
}
json.dump(five_out, open(os.path.join(out_dir, 'five_case_before_after_rewrite_live.json'), 'w'), indent=2)

amb_cases = [
    (
        'AMB_01',
        'Split focus — photography vs tennis',
        'I do photography and also play tennis competitively. Both matter to me and I am unsure which one should be my college essay topic.',
    ),
    (
        'AMB_02',
        'Thin uncertainty note',
        'I volunteered a lot this year and learned many things. I am not sure what moment to write about yet.',
    ),
]
amb_rows = []
for cid, title, raw in amb_cases:
    old_resp = post_json(BEFORE, raw)
    new_resp = post_json(AFTER, raw)
    old_pack = pack_fields_from_response(old_resp)
    new_pack = pack_fields_from_response(new_resp)
    amb_rows.append(
        {
            'case_id': cid,
            'title': title,
            'raw_notes': raw,
            'old_behavior': old_pack,
            'new_behavior': new_pack,
            'usefulness_delta': {
                'old_non_blank': bool(old_pack['displayed_recommendation'] or old_pack['why_this_direction'] or old_pack['essay_about']),
                'new_non_blank': bool(new_pack['displayed_recommendation'] or new_pack['why_this_direction'] or new_pack['essay_about']),
                'new_has_next_move_signal': bool(new_pack['why_this_direction']) or bool(new_pack['stronger_read']),
            },
        }
    )
amb_out = {'generated_at': datetime.utcnow().isoformat() + 'Z', 'before_url': BEFORE, 'after_url': AFTER, 'rows': amb_rows}
json.dump(amb_out, open(os.path.join(out_dir, 'ambiguity_proof_live.json'), 'w'), indent=2)

blind_packet = json.load(open(os.path.join(root, 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_packet.json')))
blind_key = json.load(open(os.path.join(root, 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_answer_key.json')))
key_rows = blind_key.get('key', []) if isinstance(blind_key, dict) else blind_key
key_map = {k['case_id']: k for k in key_rows}

families = {
    'recommendation_bad': [
        r'\\bthe real story is\\b',
        r'\\bthe choice at\\b',
        r'\\bthe direction is the specific moment\\b',
        r'\\bwhat changed when\\b',
        r'\\bwhat became visible\\b',
        r'\\bthe correction, not the activity\\b',
    ],
    'why_bad': [
        r'\\bthis direction works because\\b',
        r'\\bthis works because\\b',
        r'\\bspecific gap\\b',
        r'\\bnot a general lesson\\b',
        r'\\blinks one decision to one consequence\\b',
        r'\\bnon-generic and yours\\b',
    ],
    'compare_bad': [
        r'\\boverweights setup\\b',
        r'\\bkeeps the decision and consequence tied\\b',
        r'\\bcenters the real decision\\b',
        r'\\bstays closer to setup than hinge\\b',
    ],
    'evidence_bad': [
        r'\\bgrounds the setting where\\b',
        r'\\bcontains the hinge where\\b',
        r'\\bshows what changed after\\b',
        r'\\bcaptures what you understood\\b',
    ],
}

counts = {k: {'fresh_packet_product_side': 0, 'fresh_packet_all_candidates': 0, 'matches': {}} for k in families}
product_tell_hits = []

for row in blind_packet:
    cid = row['case_id']
    km = key_map.get(cid, {})
    A = row['candidate_A']
    B = row['candidate_B']
    A_text = ' '.join(
        [
            A.get('recommendation', ''),
            A.get('essay_about', ''),
            A.get('why_this_direction', ''),
            A.get('weaker_read', ''),
            A.get('stronger_read', ''),
            ' '.join(A.get('evidence_explanations', []) or []),
        ]
    ).lower()
    B_text = ' '.join(
        [
            B.get('recommendation', ''),
            B.get('essay_about', ''),
            B.get('why_this_direction', ''),
            B.get('weaker_read', ''),
            B.get('stronger_read', ''),
            ' '.join(B.get('evidence_explanations', []) or []),
        ]
    ).lower()
    product_side = 'A' if km.get('A_model') == 'product' else 'B'
    product_text = A_text if product_side == 'A' else B_text

    tell_phrases = [
        r'\\bthis read stays closer\\b',
        r'\\bthis read centers\\b',
        r'\\bhinge\\b',
        r'\\bnon-generic and yours\\b',
        r'\\bthe direction is the specific moment\\b',
    ]
    a_tell = sum(bool(re.search(p, A_text)) for p in tell_phrases)
    b_tell = sum(bool(re.search(p, B_text)) for p in tell_phrases)
    if (a_tell > 0) != (b_tell > 0):
        guessed = 'A' if a_tell > 0 else 'B'
        product_tell_hits.append(
            {
                'case_id': cid,
                'guessed_product_side_by_tell': guessed,
                'actual_product_side': product_side,
                'correct': guessed == product_side,
                'a_tell': a_tell,
                'b_tell': b_tell,
            }
        )

    for fam, pats in families.items():
        all_text = A_text + ' ' + B_text
        for pat in pats:
            m_all = len(re.findall(pat, all_text))
            m_prod = len(re.findall(pat, product_text))
            counts[fam]['fresh_packet_all_candidates'] += m_all
            counts[fam]['fresh_packet_product_side'] += m_prod
            counts[fam]['matches'][pat] = counts[fam]['matches'].get(pat, 0) + m_prod

old_text = ' '.join(
    ' '.join(
        [
            c['old']['displayed_recommendation'],
            c['old']['essay_about'],
            c['old']['why_this_direction'],
            c['old']['weaker_read'],
            c['old']['stronger_read'],
            ' '.join(c['old']['evidence_explanations']),
        ]
    )
    for c in five
).lower()
new_text = ' '.join(
    ' '.join(
        [
            c['new']['displayed_recommendation'],
            c['new']['essay_about'],
            c['new']['why_this_direction'],
            c['new']['weaker_read'],
            c['new']['stronger_read'],
            ' '.join(c['new']['evidence_explanations']),
        ]
    )
    for c in five
).lower()

before_after_counts = {}
for fam, pats in families.items():
    before_after_counts[fam] = {'before_count': 0, 'after_count': 0, 'by_pattern': []}
    for p in pats:
        b = len(re.findall(p, old_text))
        a = len(re.findall(p, new_text))
        before_after_counts[fam]['before_count'] += b
        before_after_counts[fam]['after_count'] += a
        before_after_counts[fam]['by_pattern'].append({'pattern': p, 'before': b, 'after': a})

ident = {
    'cases_total': len(blind_packet),
    'decodable_cases_by_tell_signal': len(product_tell_hits),
    'decodable_case_rate': round(len(product_tell_hits) / max(1, len(blind_packet)), 3),
    'correct_product_identifications_from_tell': sum(1 for x in product_tell_hits if x['correct']),
    'details': product_tell_hits,
}

json.dump(
    {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'fresh_packet_family_counts': counts,
        'before_after_family_counts': before_after_counts,
    },
    open(os.path.join(out_dir, 'family_compliance_counts.json'), 'w'),
    indent=2,
)
json.dump(
    {'generated_at': datetime.utcnow().isoformat() + 'Z', 'identifiability_analysis': ident},
    open(os.path.join(out_dir, 'blind_identifiability_analysis.json'), 'w'),
    indent=2,
)

print('wrote proof data to', out_dir)
