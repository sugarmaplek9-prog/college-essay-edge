import json
import os
import re
import urllib.request
from datetime import datetime, UTC
from collections import Counter, defaultdict

ROOT = '/Volumes/TOSHIBA EXT/College Essay'
EVAL_OUT = os.path.join(ROOT, 'evaluation_outputs')
HOLDOUT_SUMMARY = os.path.join(EVAL_OUT, 'page3_holdout_v2_remediation', 'summary.json')
BLIND_PACKET = os.path.join(EVAL_OUT, 'page3_holdout_v2_remediation', 'blind_review_packet.json')
BLIND_KEY = os.path.join(EVAL_OUT, 'page3_holdout_v2_remediation', 'blind_review_answer_key.json')
FIVE_CASE = os.path.join(EVAL_OUT, 'page3_five_case_before_after_v1', 'summary.json')
PROOF_DIR = os.path.join(EVAL_OUT, 'page3_rewrite_revision_proof_v1')
os.makedirs(PROOF_DIR, exist_ok=True)

DEFAULT_DEPLOYED_URL = 'https://college-essay-edge.vercel.app'
BEFORE_URL = 'https://college-essay-edge-g311wfuqb-college-edge.vercel.app'


def now_iso():
    return datetime.now(UTC).isoformat().replace('+00:00', 'Z')


def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


def post_json(url, raw_notes):
    data = json.dumps({'raw_input': raw_notes}).encode('utf-8')
    req = urllib.request.Request(url + '/api/intake/session', data=data, method='POST', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


summary = json.load(open(HOLDOUT_SUMMARY))
blind = json.load(open(BLIND_PACKET))
key_json = json.load(open(BLIND_KEY))
key_rows = key_json.get('key', []) if isinstance(key_json, dict) else key_json
key_map = {k['case_id']: k for k in key_rows}
DEPLOYED_URL = summary.get('product_url') or os.environ.get('PRODUCT_URL') or DEFAULT_DEPLOYED_URL

# 1) FAMILY SELECTION REWEIGHT AUDIT
family_lines = [
    '# PAGE_THREE_FAMILY_SELECTION_REWEIGHT_AUDIT_V1',
    '',
    f'Generated: {now_iso()}',
    f'Deployed build: {DEPLOYED_URL}',
    '',
    '| Case | Families generated | Winner before reweight | Winner after reweight | Pre winner score | Post winner score | Human-legible improvement |',
    '|---|---|---|---|---:|---:|---|',
]

for row in summary.get('rows', []):
    cp = (row.get('product') or {}).get('canonical_payload') or {}
    debug = cp.get('candidate_debug') or {}
    cands = debug.get('scores_by_candidate', []) or []
    if not cands:
        family_lines.append(f"| {row.get('case_id')} | n/a | n/a | n/a | n/a | n/a | No candidates generated |")
        continue

    fams = [c.get('recommendation_family', 'unknown') for c in cands]
    winner_before_id = debug.get('winner_before_reweight_id') or max(cands, key=lambda c: c.get('pre_penalty_total', c.get('total', -999))).get('id')
    winner_after_id = debug.get('winner_id')
    winner_before = next((c for c in cands if c.get('id') == winner_before_id), None)
    winner_after = next((c for c in cands if c.get('id') == winner_after_id), None)
    pre_score = (winner_before or {}).get('pre_penalty_total', (winner_before or {}).get('total', 0))
    post_score = (winner_after or {}).get('post_penalty_total', (winner_after or {}).get('total', 0))
    rec = ((cp.get('recommendation_packet') or {}).get('displayed_recommendation') or '').lower()
    improvement = 'YES' if (winner_after or {}).get('recommendation_family') not in {'tension', 'value'} or bool(re.search(r'\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research|advocacy|trust)\b', rec)) else 'PARTIAL'
    family_lines.append(
        f"| {row.get('case_id')} | {', '.join(sorted(set(fams)))} | {(winner_before or {}).get('recommendation_family', 'n/a')} | {(winner_after or {}).get('recommendation_family', 'n/a')} | {pre_score:.3f} | {post_score:.3f} | {improvement} |"
    )

write(os.path.join(EVAL_OUT, 'PAGE_THREE_FAMILY_SELECTION_REWEIGHT_AUDIT_V1.md'), '\n'.join(family_lines) + '\n')

# 2) RECOMMENDATION ANGLE-FIRST AUDIT

def overlap(a, b):
    toks = lambda t: [w for w in re.split(r'[^a-z0-9]+', (t or '').lower()) if len(w) >= 4]
    A, B = set(toks(a)), set(toks(b))
    if not A or not B:
        return 0.0
    return len(A & B) / len(A | B)

angle_lines = [
    '# PAGE_THREE_RECOMMENDATION_ANGLE_FIRST_AUDIT_V1',
    '',
    f'Generated: {now_iso()}',
    f'Before baseline packet: {BEFORE_URL}',
    f'After deployed packet: {DEPLOYED_URL}',
    '',
]

five_case = json.load(open(FIVE_CASE)) if os.path.exists(FIVE_CASE) else {'results': []}
for result in five_case.get('results', []):
    old_rec = (((result.get('before') or {}).get('direction_surface') or {}).get('displayed_recommendation') or '').strip()
    new_rec = (((result.get('after') or {}).get('direction_surface') or {}).get('displayed_recommendation') or '').strip()
    names_angle = bool(re.search(r'\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research|advocacy|trust)\b', new_rec.lower())) and not bool(re.search(r'\b(pressure|decision|standard|one concrete|scene to insight)\b', new_rec.lower()))
    angle_lines += [
        f"## {result.get('case_id')}",
        '',
        f"- Old recommendation: {old_rec or '(blank)'}",
        f"- New recommendation: {new_rec or '(blank)'}",
        f"- New recommendation names essay angle directly: {'YES' if names_angle else 'NO'}",
        f"- Justification: {'Angle label is explicit and non-pivot.' if names_angle else 'Still dominated by pivot-shell wording.'}",
        '',
    ]

write(os.path.join(EVAL_OUT, 'PAGE_THREE_RECOMMENDATION_ANGLE_FIRST_AUDIT_V1.md'), '\n'.join(angle_lines) + '\n')

# 3) AMBIGUITY MODE PRODUCT USEFULNESS AUDIT (3 cases)
amb_cases = [
    ('AMB_GFC_01', 'I can write about robotics systems design or translating for my parents at clinic check-ins. I am not sure which one should lead.'),
    ('AMB_GFC_02', 'I did debate and pantry redesign and both matter. I cannot tell which angle is stronger for an essay.'),
    ('AMB_GFC_03', 'I volunteered and learned a lot, but I still do not know what specific moment should anchor the essay.'),
]

amb_rows = []
for cid, raw in amb_cases:
    old_r = post_json(BEFORE_URL, raw)
    new_r = post_json(DEPLOYED_URL, raw)
    old_p = ((old_r.get('canonical_page3_payload') or {}).get('recommendation_packet') or {})
    new_p = ((new_r.get('canonical_page3_payload') or {}).get('recommendation_packet') or {})
    checks = {
        'has_two_angles': bool(re.search(r'angle a|angle b|two viable', (new_p.get('displayed_recommendation', '') + ' ' + new_p.get('essay_about', '')).lower())),
        'has_missing_info': bool(re.search(r'missing detail|missing|decide|sorting question', (new_p.get('why_this_direction', '') + ' ' + new_p.get('stronger_read', '')).lower())),
        'has_next_action': bool(re.search(r'next action|write that scene|list two candidate', (new_p.get('stronger_read', '') + ' ' + (new_p.get('first_coaching_step') or '')).lower())),
    }
    amb_rows.append((cid, raw, old_p, new_p, checks))

amb_lines = [
    '# PAGE_THREE_AMBIGUITY_MODE_PRODUCT_USEFULNESS_AUDIT_V1',
    '',
    f'Generated: {now_iso()}',
    f'Before: {BEFORE_URL}',
    f'After: {DEPLOYED_URL}',
    '',
]
for cid, raw, old_p, new_p, checks in amb_rows:
    useful = checks['has_two_angles'] and checks['has_missing_info'] and checks['has_next_action']
    amb_lines += [
        f'## {cid}',
        '',
        f'- Raw: {raw}',
        f'- Old recommendation: {old_p.get("displayed_recommendation", "") or "(blank)"}',
        f'- New recommendation: {new_p.get("displayed_recommendation", "") or "(blank)"}',
        f'- New why: {new_p.get("why_this_direction", "") or "(blank)"}',
        f'- New stronger_read: {new_p.get("stronger_read", "") or "(blank)"}',
        f'- Checks: two_angles={checks["has_two_angles"]}, missing_info={checks["has_missing_info"]}, next_action={checks["has_next_action"]}',
        f"- Materially more useful: {'YES' if useful else 'NO'}",
        '',
    ]
write(os.path.join(EVAL_OUT, 'PAGE_THREE_AMBIGUITY_MODE_PRODUCT_USEFULNESS_AUDIT_V1.md'), '\n'.join(amb_lines) + '\n')

# 4) ESSAY ABOUT REDUNDANCY FIX AUDIT
redundancy_lines = [
    '# PAGE_THREE_ESSAY_ABOUT_REDUNDANCY_FIX_AUDIT_V1',
    '',
    f'Generated: {now_iso()}',
    f'Deployed build: {DEPLOYED_URL}',
    '',
    '| Case | Recommendation | Essay about | Overlap | Old overlap penalty | New overlap penalty | Final decision after penalty |',
    '|---|---|---|---:|---:|---:|---|',
]

for row in summary.get('rows', []):
    rp = ((row.get('product') or {}).get('canonical_payload') or {}).get('recommendation_packet') or {}
    rec = rp.get('displayed_recommendation', '')
    abt = rp.get('essay_about', '')
    ov = overlap(rec, abt)
    old_penalty = 0.35 if ov > 0.62 else (0.20 if ov > 0.50 else 0.04)
    new_penalty = 0.62 if ov > 0.56 else (0.34 if ov > 0.45 else 0.06)
    decision = 'REWEIGHT_OR_REJECT' if new_penalty >= 0.34 else 'ALLOW'
    redundancy_lines.append(
        f"| {row.get('case_id')} | {rec[:90]}{'…' if len(rec) > 90 else ''} | {abt[:90]}{'…' if len(abt) > 90 else ''} | {ov:.3f} | {old_penalty:.2f} | {new_penalty:.2f} | {decision} |"
    )

write(os.path.join(EVAL_OUT, 'PAGE_THREE_ESSAY_ABOUT_REDUNDANCY_FIX_AUDIT_V1.md'), '\n'.join(redundancy_lines) + '\n')

# 5) EVALUATOR RECALIBRATION AUDIT
align_lines = [
    '# PAGE_THREE_EVALUATOR_RECALIBRATION_V1',
    '',
    f'Generated: {now_iso()}',
    f'Evaluator: scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
    '',
    '| Case | Current winner | Rescored winner | Current margin | Rescored margin | Why current may be non-believable |',
    '|---|---|---|---:|---:|---|',
]

for row in (summary.get('rows', [])[:5]):
    winner = (((row.get('scores') or {}).get('winner') or {}).get('winner') or 'unscored')
    margin = (((row.get('scores') or {}).get('winner') or {}).get('weighted_margin'))
    p = ((row.get('scores') or {}).get('product') or {})
    b = ((row.get('scores') or {}).get('openai') or {})
    rec = (((row.get('product') or {}).get('output') or {}).get('displayed_recommendation') or '')
    shell_pen = 1.0 if bool(re.search(r'\b(pressure|decision|standard|one concrete|real standard)\b', rec.lower())) else 0.0
    p_rescored = (p.get('average_effective') or 0) + (p.get('angle_directness', 0) * 0.25) - (p.get('packet_identifiability_penalty', 0) * 0.55) - shell_pen
    b_rescored = (b.get('average_effective') or 0) + (b.get('angle_directness', 0) * 0.25) - (b.get('packet_identifiability_penalty', 0) * 0.55)
    rescored_margin = p_rescored - b_rescored
    if abs(rescored_margin) < 0.3:
        rescored_winner = 'tie'
    elif rescored_margin > 0:
        rescored_winner = 'product'
    else:
        rescored_winner = 'openai'

    margin_txt = f'{margin:.3f}' if isinstance(margin, (int, float)) else 'n/a'
    note = 'Decision/pivot shell remains visible.' if shell_pen > 0 else 'No major pivot-shell trigger.'
    align_lines.append(f"| {row.get('case_id')} | {winner} | {rescored_winner} | {margin_txt} | {rescored_margin:.3f} | {note} |")

align_lines += [
    '',
    '- Rescore logic applies heavier identifiability and shell penalties than current weighted margin.',
    '- Goal: force non-believable shell winners to tie or lose unless angle naming is genuinely strong.',
]
write(os.path.join(EVAL_OUT, 'PAGE_THREE_EVALUATOR_RECALIBRATION_V1.md'), '\n'.join(align_lines) + '\n')

# 6) STRUCTURAL IDENTIFIABILITY AUDIT
id_lines = [
    '# PAGE_THREE_STRUCTURAL_IDENTIFIABILITY_AUDIT_V1',
    '',
    f'Generated: {now_iso()}',
    '',
]

def join_candidate(c):
    return ' '.join([
        c.get('recommendation', ''), c.get('essay_about', ''), c.get('why_this_direction', ''),
        c.get('weaker_read', ''), c.get('stronger_read', ''),
        ' '.join(c.get('evidence_explanations', []) or []),
    ]).lower()

pattern = re.compile(r'\b(this path|this route|selected path|alternate path|angle a|angle b|sorting question)\b', re.I)

decodable = 0
correct = 0
rows = []
for r in blind:
    cid = r['case_id']
    a = join_candidate(r['candidate_A'])
    b = join_candidate(r['candidate_B'])
    a_hits = len(pattern.findall(a))
    b_hits = len(pattern.findall(b))
    if (a_hits > 0) != (b_hits > 0):
        decodable += 1
        guess = 'A' if a_hits > 0 else 'B'
        actual = 'A' if key_map[cid]['A_model'] == 'product' else 'B'
        ok = guess == actual
        if ok:
            correct += 1
        rows.append((cid, a_hits, b_hits, guess, actual, ok))

id_lines += [
    f'- cases_total: {len(blind)}',
    f'- decodable_cases: {decodable}',
    f'- decodable_rate: {decodable / max(1, len(blind)):.3f}',
    f'- correct_guesses_when_decodable: {correct}',
    '',
    '| Case | A hits | B hits | Guess | Actual | Correct |',
    '|---|---:|---:|---|---|---|',
]
for row in rows:
    id_lines.append(f'| {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]} | {"YES" if row[5] else "NO"} |')

write(os.path.join(EVAL_OUT, 'PAGE_THREE_STRUCTURAL_IDENTIFIABILITY_AUDIT_V1.md'), '\n'.join(id_lines) + '\n')

# 7) Packet-level proof packet
per_case_lines = [
    '',
    '## Per-case classifier and family proof',
    '| Case | runtime_pattern | unknown_classifier | winner_family | runner_up_family |',
    '|---|---|---|---|---|',
]
unknown_hits = 0
for row in summary.get('rows', []):
    cp = ((row.get('product') or {}).get('canonical_payload') or {})
    routing = cp.get('routing') or {}
    classification = cp.get('classification') or {}
    debug = cp.get('candidate_debug') or {}
    cands = debug.get('scores_by_candidate', []) or []
    w = next((c for c in cands if c.get('id') == debug.get('winner_id')), None)
    r = next((c for c in cands if c.get('id') == debug.get('weaker_read_source_id')), None)
    unk = bool(routing.get('unknown_classifier') or classification.get('primary_pattern') == 'unknown')
    if unk:
        unknown_hits += 1
    per_case_lines.append(
        f"| {row.get('case_id')} | {classification.get('primary_pattern', 'unknown')} | {'YES' if unk else 'NO'} | {(w or {}).get('recommendation_family', 'n/a')} | {(r or {}).get('recommendation_family', 'n/a')} |"
    )

proof_lines = [
    '# PAGE_THREE_PACKET_LEVEL_PROOF_V1',
    '',
    f'Generated: {now_iso()}',
    f'Deployed build: {DEPLOYED_URL}',
    '',
    '## Included artifacts',
    '- Fresh blind review packet + answer key',
    '- Per-case classifier outputs (in summary rows)',
    '- Per-case winner family IDs and runner-up family IDs',
    '- Fresh 5-case before/after packet',
    '- 3-case ambiguity packet checks',
    '- Human blind results status file',
    f'- unknown_classifier_hits: {unknown_hits}/{len(summary.get("rows", []))}',
    '',
    '## Paths',
    '- evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
    '- evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
    '- evaluation_outputs/page3_five_case_before_after_v1/summary.json',
    '- evaluation_outputs/PAGE_THREE_FAMILY_SELECTION_REWEIGHT_AUDIT_V1.md',
    '- evaluation_outputs/PAGE_THREE_RECOMMENDATION_ANGLE_FIRST_AUDIT_V1.md',
    '- evaluation_outputs/PAGE_THREE_ESSAY_ABOUT_REDUNDANCY_FIX_AUDIT_V1.md',
    '- evaluation_outputs/PAGE_THREE_AMBIGUITY_MODE_PRODUCT_USEFULNESS_AUDIT_V1.md',
    '- evaluation_outputs/PAGE_THREE_EVALUATOR_RECALIBRATION_V1.md',
    '- evaluation_outputs/PAGE_THREE_STRUCTURAL_IDENTIFIABILITY_AUDIT_V1.md',
    '- evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md',
]
proof_lines += per_case_lines
write(os.path.join(EVAL_OUT, 'PAGE_THREE_PACKET_LEVEL_PROOF_V1.md'), '\n'.join(proof_lines) + '\n')

# 8) human blind results status refresh
human_path = os.path.join(EVAL_OUT, 'PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md')
human_md = f'''# PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md

Status: REQUIRES REAL HUMAN SCORING (pending)
Date: {datetime.now(UTC).date().isoformat()}
Deployed build: {DEPLOYED_URL}

## Blind packet under review
- evaluation_outputs/page3_holdout_v2_remediation/BLIND_REVIEW_PACKET_V2.md
- evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json
- evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json

## Automated context (not a substitute for human vote)
- product_wins: {summary.get('final_tally',{}).get('product_wins')}
- openai_wins: {summary.get('final_tally',{}).get('openai_wins')}
- ties: {summary.get('final_tally',{}).get('ties')}
- scored_cases: {summary.get('scored_case_count')}

## Policy moving forward
- Refresh blind packet after every accepted rebuild/deploy candidate before human scoring.
- Standard command: npm run eval:holdout:v2:remediation
- Production path: npm run deploy:prod:canonical:with-blind-refresh

## Required human scoring sheet
- panel_size:
- recommendation winner counts:
- essay_about winner counts:
- why winner counts:
- evidence winner counts:
- overall winner counts:
- product_preference_rate:
- signed decision:

Gate status: PENDING (no completed human panel submission logged yet).
'''
write(human_path, human_md)

print('generated all remediation audits in evaluation_outputs')
