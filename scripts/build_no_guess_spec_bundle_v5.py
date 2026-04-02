import json
import os
import zipfile
from datetime import datetime, UTC

ROOT = '/Volumes/TOSHIBA EXT/College Essay'
EVAL = os.path.join(ROOT, 'evaluation_outputs')
OUT_DIR = os.path.join(EVAL, 'requested_files_bundle_v5')
ZIP_PATH = os.path.join(EVAL, 'PAGE_THREE_NO_GUESS_SPEC_INPUT_BUNDLE_V5.zip')

SUMMARY_PATH = os.path.join(EVAL, 'page3_holdout_v2_remediation', 'summary.json')
BLIND_PACKET_PATH = os.path.join(EVAL, 'page3_holdout_v2_remediation', 'blind_review_packet.json')
ANSWER_KEY_PATH = os.path.join(EVAL, 'page3_holdout_v2_remediation', 'blind_review_answer_key.json')

BAD_PREF = ['HV2_03', 'HV2_09', 'HV2_12']


def rel(abs_path: str) -> str:
    return os.path.relpath(abs_path, ROOT).replace('\\', '/')


def load_json(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_json(path: str, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)


summary = load_json(SUMMARY_PATH)
blind_packet = load_json(BLIND_PACKET_PATH)
answer_key = load_json(ANSWER_KEY_PATH)

rows = summary.get('rows', [])
if not rows:
    raise RuntimeError('No rows found in holdout summary')

bad_case_id = next((cid for cid in BAD_PREF if any(r.get('case_id') == cid for r in rows)), rows[0].get('case_id'))
bad_row = next(r for r in rows if r.get('case_id') == bad_case_id)

product_wins = [r for r in rows if ((r.get('scores') or {}).get('winner') or {}).get('winner') == 'product' and r.get('case_id') != bad_case_id]
if product_wins:
    good_row = sorted(product_wins, key=lambda r: (((r.get('scores') or {}).get('winner') or {}).get('weighted_margin') or -999), reverse=True)[0]
else:
    good_row = next(r for r in rows if r.get('case_id') != bad_case_id) if len(rows) > 1 else rows[0]

def key_map_for(case_id: str):
    key_rows = answer_key.get('key', []) if isinstance(answer_key, dict) else answer_key
    return next((k for k in key_rows if k.get('case_id') == case_id), None)


def blind_product_view(case_id: str):
    packet_row = next((r for r in blind_packet if r.get('case_id') == case_id), None)
    if not packet_row:
        return None
    key_row = key_map_for(case_id)
    if not key_row:
        return {'note': 'answer key mapping missing', 'raw_blind_row': packet_row}
    if key_row.get('A_model') == 'product':
        product_side = packet_row.get('candidate_A')
        baseline_side = packet_row.get('candidate_B')
        product_label = 'A'
    else:
        product_side = packet_row.get('candidate_B')
        baseline_side = packet_row.get('candidate_A')
        product_label = 'B'
    return {
        'product_is_candidate': product_label,
        'product_side_rendered': product_side,
        'baseline_side_rendered': baseline_side,
        'review_fields': packet_row.get('review_fields'),
    }


def build_case_packet(row, label: str):
    cp = ((row.get('product') or {}).get('canonical_payload') or {})
    debug = cp.get('candidate_debug') or {}
    scores = debug.get('scores_by_candidate') or []
    winner_id = debug.get('winner_id')
    runner_id = debug.get('weaker_read_source_id')
    winner = next((c for c in scores if c.get('id') == winner_id), None)
    runner = next((c for c in scores if c.get('id') == runner_id), None)

    return {
        'generated_at': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
        'label': label,
        'case_id': row.get('case_id'),
        'title': row.get('title'),
        'raw_notes': row.get('raw_notes'),
        'classifier_output': {
            'routing': cp.get('routing'),
            'classification': cp.get('classification'),
        },
        'route_decision': ((cp.get('routing') or {}).get('route_decision')),
        'winner_family_id': (winner or {}).get('recommendation_family'),
        'winner_candidate_id': winner_id,
        'runner_up_candidate_id': runner_id,
        'winner_candidate_score_row': winner,
        'runner_up_candidate_score_row': runner,
        'chosen_recommendation_packet': cp.get('recommendation_packet'),
        'product_output_surface': (row.get('product') or {}).get('output'),
        'candidate_score_breakdown_all': scores,
        'candidate_output_texts_available': False,
        'candidate_output_texts_note': 'Per-candidate recommendation/essay_about/why text is not persisted in canonical candidate_debug; only score rows and IDs are persisted.',
        'blind_packet_case_rendering': blind_product_view(row.get('case_id')),
        'full_canonical_payload': cp,
        'score_winner_call': ((row.get('scores') or {}).get('winner')),
    }


bad_packet = build_case_packet(bad_row, 'bad_case')
good_packet = build_case_packet(good_row, 'good_case_comparison')

candidate_breakdown = {
    'generated_at': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
    'case_id': bad_row.get('case_id'),
    'title': bad_row.get('title'),
    'winner_id': bad_packet.get('winner_candidate_id'),
    'runner_up_id': bad_packet.get('runner_up_candidate_id'),
    'winner_before_reweight_id': (((bad_packet.get('full_canonical_payload') or {}).get('candidate_debug') or {}).get('winner_before_reweight_id')),
    'candidates': bad_packet.get('candidate_score_breakdown_all'),
    'note': 'All persisted candidate score rows are included; full candidate text rows are not persisted by current pipeline.'
}

runner_dump = {
    'generated_at': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
    'case_id': bad_row.get('case_id'),
    'winner_candidate_id': bad_packet.get('winner_candidate_id'),
    'runner_up_candidate_id': bad_packet.get('runner_up_candidate_id'),
    'winner_candidate': bad_packet.get('winner_candidate_score_row'),
    'runner_up_candidate': bad_packet.get('runner_up_candidate_score_row'),
    'all_candidates_sorted_by_total': sorted(
        bad_packet.get('candidate_score_breakdown_all') or [],
        key=lambda c: c.get('total', -999),
        reverse=True,
    ),
}

os.makedirs(OUT_DIR, exist_ok=True)

bad_file = os.path.join(OUT_DIR, f"{bad_case_id}_full_bad_case_packet_v5.json")
good_file = os.path.join(OUT_DIR, f"{good_row.get('case_id')}_good_case_packet_v5.json")
candidates_file = os.path.join(OUT_DIR, f"{bad_case_id}_all_candidate_breakdown_v5.json")
runner_file = os.path.join(OUT_DIR, f"{bad_case_id}_runner_up_dump_v5.json")

write_json(bad_file, bad_packet)
write_json(good_file, good_packet)
write_json(candidates_file, candidate_breakdown)
write_json(runner_file, runner_dump)

include_files = [
    os.path.join(ROOT, 'src/lib/fm/direction.ts'),
    os.path.join(ROOT, 'src/lib/fm/canonicalPage3Payload.ts'),
    os.path.join(ROOT, 'scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs'),
    os.path.join(ROOT, 'scripts/page3-holdout-v2.mjs'),
    bad_file,
    candidates_file,
    runner_file,
    good_file,
    os.path.join(EVAL, 'page3_rewrite_revision_proof_v1/phrase_family_compliance_audit.json'),
    os.path.join(EVAL, 'PAGE_THREE_EVALUATOR_RECALIBRATION_V1.md'),
    os.path.join(EVAL, 'page3_holdout_v2_remediation/blind_review_answer_key.json'),
    os.path.join(EVAL, 'page3_holdout_v2_remediation/blind_review_packet.json'),
]

manifest = {
    'generated_at': datetime.now(UTC).isoformat().replace('+00:00', 'Z'),
    'selected_bad_case': bad_case_id,
    'selected_good_case': good_row.get('case_id'),
    'deployed_product_url_from_summary': summary.get('product_url'),
    'files': [rel(p) for p in include_files] + [rel(os.path.join(OUT_DIR, 'MANIFEST.json'))],
}
write_json(os.path.join(OUT_DIR, 'MANIFEST.json'), manifest)

with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
    for p in include_files:
        if os.path.exists(p):
            zf.write(p, rel(p))
    zf.write(os.path.join(OUT_DIR, 'MANIFEST.json'), rel(os.path.join(OUT_DIR, 'MANIFEST.json')))

print(json.dumps({
    'zip': rel(ZIP_PATH),
    'selected_bad_case': bad_case_id,
    'selected_good_case': good_row.get('case_id'),
    'files_in_zip': len(manifest['files'])
}, indent=2))
