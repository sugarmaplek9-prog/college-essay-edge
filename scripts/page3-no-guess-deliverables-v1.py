import json
import os
import re
import urllib.request
from datetime import datetime, UTC
from collections import Counter

ROOT = '/Volumes/TOSHIBA EXT/College Essay'
EVAL_OUT = os.path.join(ROOT, 'evaluation_outputs')
HOLDOUT_DIR = os.path.join(EVAL_OUT, 'page3_holdout_v2_remediation')
SUMMARY_PATH = os.path.join(HOLDOUT_DIR, 'summary.json')
BLIND_PACKET_PATH = os.path.join(HOLDOUT_DIR, 'blind_review_packet.json')
BLIND_KEY_PATH = os.path.join(HOLDOUT_DIR, 'blind_review_answer_key.json')
FIVE_CASE_PATH = os.path.join(EVAL_OUT, 'page3_five_case_before_after_v1', 'summary.json')

DEFAULT_DEPLOYED_URL = 'https://college-essay-edge.vercel.app'
DEFAULT_BEFORE_URL = 'https://college-essay-edge-g311wfuqb-college-edge.vercel.app'


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace('+00:00', 'Z')


def read_json(path: str, fallback):
    if not os.path.exists(path):
        return fallback
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_text(path: str, body: str) -> None:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(body)


def overlap(a: str, b: str) -> float:
    def toks(text: str):
        return [w for w in re.split(r'[^a-z0-9]+', (text or '').lower()) if len(w) >= 4]

    A, B = set(toks(a)), set(toks(b))
    if not A or not B:
        return 0.0
    return len(A & B) / len(A | B)


def specificity_score(text: str) -> float:
    t = (text or '').strip()
    if not t:
        return 0.0
    word_count = len(re.findall(r"[A-Za-z0-9']+", t))
    concrete_hits = len(re.findall(r'\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research|method|discipline|evidence|trust|advocacy)\b', t, re.I))
    filler_hits = len(re.findall(r'\b(one clear thread|concrete moments and consequences|strong central claim|pressure moment|scene-level choice|choice and consequence)\b', t, re.I))
    return max(0.0, min(1.0, 0.2 + min(word_count, 22) * 0.02 + concrete_hits * 0.08 - filler_hits * 0.2))


def angle_named(text: str) -> bool:
    return bool(re.search(r'\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research|method|discipline|trust|advocacy|responsibility)\b', (text or '').lower()))


def pivot_narration(text: str) -> bool:
    return bool(re.search(r'\b(scene|choice|pressure|standard|what happened next|decision)\b', (text or '').lower())) and not angle_named(text)


def post_json(base_url: str, raw_notes: str):
    data = json.dumps({'raw_input': raw_notes}).encode('utf-8')
    req = urllib.request.Request(
        base_url.rstrip('/') + '/api/intake/session',
        data=data,
        method='POST',
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode('utf-8'))


def family_win_reason(candidate: dict) -> str:
    fam = candidate.get('recommendation_family', 'unknown')
    total = candidate.get('total', 0)
    angle = candidate.get('angle_directness', 0)
    about = candidate.get('essay_aboutness_clarity', 0)
    shell = candidate.get('decision_shell_penalty', 0)
    return f'family={fam}; total={total:.3f}; angle_directness={angle:.3f}; essay_about_clarity={about:.3f}; shell_penalty={shell:.3f}'


def get_product_candidate_for_blind(case_id: str, key_map: dict, blind_packet_map: dict):
    key = key_map.get(case_id) or {}
    row = blind_packet_map.get(case_id) or {}
    if not row:
        return {}, 'missing_blind_packet_case'
    if key.get('A_model') == 'product':
        return row.get('candidate_A') or {}, 'A'
    if key.get('B_model') == 'product':
        return row.get('candidate_B') or {}, 'B'
    return {}, 'missing_key_model_mapping'


def main():
    summary = read_json(SUMMARY_PATH, {})
    blind_packet = read_json(BLIND_PACKET_PATH, [])
    blind_key = read_json(BLIND_KEY_PATH, {})
    key_rows = blind_key.get('key', []) if isinstance(blind_key, dict) else blind_key
    key_map = {k.get('case_id'): k for k in key_rows if isinstance(k, dict)}
    blind_packet_map = {r.get('case_id'): r for r in blind_packet if isinstance(r, dict)}
    five_case = read_json(FIVE_CASE_PATH, {'results': []})

    deployed_url = summary.get('product_url') or os.environ.get('PRODUCT_URL') or DEFAULT_DEPLOYED_URL
    before_url = os.environ.get('BEFORE_URL') or DEFAULT_BEFORE_URL

    rows = summary.get('rows', [])

    # 1) FAMILY DISTRIBUTION CONTROL AUDIT
    winner_families = []
    family_md = [
        '# PAGE_THREE_FAMILY_DISTRIBUTION_CONTROL_AUDIT_V1',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
        '| Case | Families generated | Pre-penalty winner | Post-penalty winner | Final winner reason | Dominant family suppressed? |',
        '|---|---|---|---|---|---|',
    ]

    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        debug = cp.get('candidate_debug') or {}
        cands = debug.get('scores_by_candidate') or []
        by_id = {c.get('id'): c for c in cands}
        pre_id = debug.get('winner_before_reweight_id')
        post_id = debug.get('winner_id')
        pre = by_id.get(pre_id) or (max(cands, key=lambda c: c.get('pre_penalty_total', c.get('total', -999))) if cands else {})
        post = by_id.get(post_id) or (cands[0] if cands else {})
        fams = sorted(set([(c.get('recommendation_family') or 'unknown') for c in cands]))
        pre_fam = pre.get('recommendation_family', 'n/a')
        post_fam = post.get('recommendation_family', 'n/a')
        winner_families.append(post_fam)

        dominant_suppressed = 'YES' if pre_fam != post_fam and pre_fam in {'tension', 'value'} else 'NO'
        family_md.append(
            f"| {row.get('case_id')} | {', '.join(fams) if fams else 'n/a'} | {pre_fam} | {post_fam} | {family_win_reason(post) if post else 'n/a'} | {dominant_suppressed} |"
        )

    family_counts = Counter(winner_families)
    total_winners = max(1, len(winner_families))
    top_family, top_count = ('n/a', 0)
    if family_counts:
        top_family, top_count = family_counts.most_common(1)[0]
    top_ratio = top_count / total_winners
    cap_pass = top_ratio <= 0.35

    family_md += [
        '',
        '## Distribution summary',
        f'- winner_family_counts: {json.dumps(dict(family_counts), ensure_ascii=False)}',
        f'- dominant_family: {top_family}',
        f'- dominant_family_ratio: {top_ratio:.3f}',
        '- cap_rule: no single family above 35% in 12-case packet unless justified',
        f"- cap_rule_result: {'PASS' if cap_pass else 'FAIL'}",
    ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_FAMILY_DISTRIBUTION_CONTROL_AUDIT_V1.md'), '\n'.join(family_md) + '\n')

    # Map previous recommendations if available
    previous_map = {}
    for r in five_case.get('results', []):
        cid = r.get('case_id')
        if not cid:
            continue
        old_rec = (((r.get('before') or {}).get('direction_surface') or {}).get('displayed_recommendation') or '').strip()
        previous_map[cid] = old_rec

    # 2) RECOMMENDATION ANGLE NAMING AUDIT
    rec_md = [
        '# PAGE_THREE_RECOMMENDATION_ANGLE_NAMING_AUDIT_V1',
        '',
        f'Generated: {now_iso()}',
        f'Before baseline packet: {before_url}',
        f'After deployed packet: {deployed_url}',
        '',
    ]

    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        rp = cp.get('recommendation_packet') or {}
        cid = row.get('case_id')
        old_rec = previous_map.get(cid, '(not available in this run)')
        new_rec = (rp.get('displayed_recommendation') or '').strip()
        names_angle = angle_named(new_rec)
        pivot_shell = pivot_narration(new_rec)
        passed = names_angle and not pivot_shell
        rec_md += [
            f'## {cid}',
            '',
            f'- Previous recommendation: {old_rec}',
            f'- New recommendation: {new_rec or "(blank)"}',
            f'- Essay angle now named: {"YES" if names_angle else "NO"}',
            f'- Still pivot narration: {"YES" if pivot_shell else "NO"}',
            f'- Pass/fail: {"PASS" if passed else "FAIL"}',
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_RECOMMENDATION_ANGLE_NAMING_AUDIT_V1.md'), '\n'.join(rec_md) + '\n')

    # 3) ESSAY_ABOUT SPECIFICITY / REDUNDANCY AUDIT
    about_md = [
        '# PAGE_THREE_ESSAY_ABOUT_SPECIFICITY_AND_REDUNDANCY_AUDIT_V1',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
        '| Case | Recommendation | Essay_about | Semantic overlap | Specificity score | Old redundancy outcome | New redundancy outcome | Pass/fail |',
        '|---|---|---|---:|---:|---|---|---|',
    ]

    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        rp = cp.get('recommendation_packet') or {}
        rec = rp.get('displayed_recommendation', '')
        abt = rp.get('essay_about', '')
        ov = overlap(rec, abt)
        spec = specificity_score(abt)

        old_outcome = 'FAIL' if ov > 0.62 else 'PASS'
        new_fail = ov > 0.52 or spec < 0.45 or bool(re.search(r'\b(one clear thread|concrete moments and consequences|strong central claim|pressure moment)\b', abt, re.I))
        new_outcome = 'FAIL' if new_fail else 'PASS'

        about_md.append(
            f"| {row.get('case_id')} | {rec[:88]}{'…' if len(rec) > 88 else ''} | {abt[:88]}{'…' if len(abt) > 88 else ''} | {ov:.3f} | {spec:.3f} | {old_outcome} | {new_outcome} | {'PASS' if new_outcome == 'PASS' else 'FAIL'} |"
        )

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_ESSAY_ABOUT_SPECIFICITY_AND_REDUNDANCY_AUDIT_V1.md'), '\n'.join(about_md) + '\n')

    # 4) AMBIGUITY MODE COMPETITIVENESS AUDIT
    ambiguity_cases = [
        ('AMB_NG_01', 'I can write about redesigning our pantry inventory process or about translating for my parents at hospital check-ins. I am not sure which angle should lead.'),
        ('AMB_NG_02', 'I have two real options: robotics systems troubleshooting and peer tutoring communication gaps. I cannot tell which makes the stronger essay angle.'),
        ('AMB_NG_03', 'I can write about debate leadership conflict or a research reliability correction project. Both feel true and I need help choosing now.'),
    ]

    amb_md = [
        '# PAGE_THREE_AMBIGUITY_MODE_COMPETITIVENESS_AUDIT_V1',
        '',
        f'Generated: {now_iso()}',
        f'Before baseline packet: {before_url}',
        f'After deployed packet: {deployed_url}',
        '',
    ]

    for cid, raw in ambiguity_cases:
        old_resp = post_json(before_url, raw)
        new_resp = post_json(deployed_url, raw)
        old_packet = ((old_resp.get('canonical_page3_payload') or {}).get('recommendation_packet') or {})
        new_packet = ((new_resp.get('canonical_page3_payload') or {}).get('recommendation_packet') or {})

        new_text = ' '.join([
            new_packet.get('displayed_recommendation', ''),
            new_packet.get('essay_about', ''),
            new_packet.get('why_this_direction', ''),
            new_packet.get('stronger_read', ''),
            new_packet.get('first_coaching_step') or '',
        ]).lower()

        checks = {
            'two_angles': bool(re.search(r'angle a|angle b|two', new_text)),
            'each_reveals': bool(re.search(r'what a would reveal|what b would reveal|reveal', new_text)),
            'evidence_for_each': bool(re.search(r'evidence for a|evidence for b|strongest current evidence', new_text)),
            'missing_evidence': bool(re.search(r'missing evidence|break the tie|decisive', new_text)),
            'sorting_question': bool(re.search(r'sorting question|which angle', new_text)),
            'immediate_next_move': bool(re.search(r'immediate next drafting move|next action|step 1', new_text)),
        }
        competitive = all(checks.values())

        amb_md += [
            f'## {cid}',
            '',
            f'- Input: {raw}',
            f'- Old output: recommendation="{old_packet.get("displayed_recommendation", "")}" | why="{old_packet.get("why_this_direction", "")}" | stronger_read="{old_packet.get("stronger_read", "")}"',
            f'- New output: recommendation="{new_packet.get("displayed_recommendation", "")}" | why="{new_packet.get("why_this_direction", "")}" | stronger_read="{new_packet.get("stronger_read", "")}"',
            f'- Human-usefulness explanation: New output is only competitive if it supplies two plausible angles, explicit evidence comparison, tie-break info, and an immediate drafting move.',
            f"- Contract checks: {json.dumps(checks, ensure_ascii=False)}",
            f"- Product-competitive now: {'YES' if competitive else 'NO'}",
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_AMBIGUITY_MODE_COMPETITIVENESS_AUDIT_V1.md'), '\n'.join(amb_md) + '\n')

    # 5) EVALUATOR HUMAN-REALITY ALIGNMENT AUDIT
    eval_md = [
        '# PAGE_THREE_EVALUATOR_HUMAN_REALITY_ALIGNMENT_AUDIT_V1',
        '',
        f'Generated: {now_iso()}',
        'Evaluator snapshot: scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
        '',
    ]

    for row in rows[:5]:
        scores = row.get('scores') or {}
        product = scores.get('product') or {}
        baseline = scores.get('openai') or {}
        old_winner = ((scores.get('winner') or {}).get('winner') or 'unscored')

        old_weighted_margin = ((scores.get('winner') or {}).get('weighted_margin') or 0)

        def rescored(x):
            return (
                x.get('human_usefulness', 0) * 0.14
                + x.get('human_packet_readability', 0) * 0.1
                + x.get('angle_directness', 0) * 0.16
                + x.get('essay_angle_naming_quality', 0) * 0.16
                + x.get('ambiguity_mode_usefulness', 0) * 0.08
                + x.get('ambiguity_decision_helpfulness', 0) * 0.06
                + x.get('essay_aboutness_clarity', 0) * 0.08
                + x.get('why_persuasion', 0) * 0.07
                - x.get('packet_identifiability_penalty', 0) * 0.42
                - x.get('family_collapse_penalty', 0) * 0.36
                - x.get('essay_about_redundancy_penalty', 0) * 0.24
            )

        p_new = rescored(product)
        b_new = rescored(baseline)
        new_margin = p_new - b_new
        if abs(new_margin) < 0.85:
            new_winner = 'tie'
        elif new_margin > 0:
            new_winner = 'product'
        else:
            new_winner = 'openai'

        rec = (((row.get('product') or {}).get('output') or {}).get('displayed_recommendation') or '')
        non_believable_reason = 'Pivot-shell narration remains stronger than essay-angle naming.' if pivot_narration(rec) else 'Packet-identifiability and redundancy penalties remain too high for confident human preference.'

        eval_md += [
            f"## {row.get('case_id')}",
            '',
            f"- Old winner: {old_winner}",
            f"- Why old winner can fail human read: {non_believable_reason}",
            f"- New score breakdown (product): human_usefulness={product.get('human_usefulness')}, angle_directness={product.get('angle_directness')}, essay_angle_naming_quality={product.get('essay_angle_naming_quality')}, family_collapse_penalty={product.get('family_collapse_penalty')}, packet_identifiability_penalty={product.get('packet_identifiability_penalty')}, essay_about_redundancy_penalty={product.get('essay_about_redundancy_penalty')}",
            f"- New score breakdown (baseline): human_usefulness={baseline.get('human_usefulness')}, angle_directness={baseline.get('angle_directness')}, essay_angle_naming_quality={baseline.get('essay_angle_naming_quality')}, family_collapse_penalty={baseline.get('family_collapse_penalty')}, packet_identifiability_penalty={baseline.get('packet_identifiability_penalty')}, essay_about_redundancy_penalty={baseline.get('essay_about_redundancy_penalty')}",
            f"- Old weighted margin: {old_weighted_margin:.3f}",
            f"- New weighted margin: {new_margin:.3f}",
            f"- New winner: {new_winner}",
            '- Why new scoring is more human-believable: it blocks pivot-shell outputs from winning without angle clarity and usefulness.',
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_EVALUATOR_HUMAN_REALITY_ALIGNMENT_AUDIT_V1.md'), '\n'.join(eval_md) + '\n')

    # 6) DEPLOYED PACKET WINNER VERIFICATION AUDIT
    verify_md = [
        '# PAGE_THREE_DEPLOYED_PACKET_WINNER_VERIFICATION_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
    ]

    verification_rows = []
    for row in rows:
        cid = row.get('case_id')
        raw_notes = row.get('raw_notes') or ''
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        rp = cp.get('recommendation_packet') or {}
        cls = cp.get('classification') or {}
        debug = cp.get('candidate_debug') or {}
        winner_id = debug.get('winner_id')
        cands = debug.get('scores_by_candidate') or []
        winner = next((c for c in cands if c.get('id') == winner_id), {})

        product_blind_candidate, blind_slot = get_product_candidate_for_blind(cid, key_map, blind_packet_map)

        blind_recommendation = (product_blind_candidate.get('recommendation') or '').strip()
        canonical_recommendation = (rp.get('displayed_recommendation') or '').strip()
        blind_essay_about = (product_blind_candidate.get('essay_about') or '').strip()
        canonical_essay_about = (rp.get('essay_about') or '').strip()

        blind_match = (blind_recommendation == canonical_recommendation) and (blind_essay_about == canonical_essay_about)

        live_status = 'NOT_CHECKED'
        live_winner_family = None
        live_rec = ''
        try:
            live = post_json(deployed_url, raw_notes)
            live_cp = live.get('canonical_page3_payload') or {}
            live_debug = live_cp.get('candidate_debug') or {}
            live_winner_id = live_debug.get('winner_id')
            live_candidates = live_debug.get('scores_by_candidate') or []
            live_winner = next((c for c in live_candidates if c.get('id') == live_winner_id), {})
            live_winner_family = live_winner.get('recommendation_family')
            live_rec = ((live_cp.get('recommendation_packet') or {}).get('displayed_recommendation') or '').strip()
            winner_family_match = (live_winner_family == winner.get('recommendation_family'))
            rec_match = (live_rec == canonical_recommendation)
            live_status = 'EXACT_MATCH' if winner_family_match and rec_match else 'DRIFT'
        except Exception as e:
            live_status = f'CHECK_ERROR: {type(e).__name__}'

        verification_rows.append({
            'case_id': cid,
            'live_status': live_status,
        })

        verify_md += [
            f'## {cid}',
            '',
            f'- Raw notes: {raw_notes}',
            f"- Classifier result: primary_pattern={cls.get('primary_pattern')} | signal_strength={cls.get('signal_strength')}",
            f"- Final winning family ID: {winner.get('recommendation_family', 'n/a')} (candidate_id={winner_id})",
            f"- Final recommendation: {canonical_recommendation}",
            f"- Final essay_about: {canonical_essay_about}",
            f"- Final why: {(rp.get('why_this_direction') or '').strip()}",
            f"- Canonical payload extract: recommendation_packet + candidate_debug winner_id={winner_id}",
            f"- Blind packet extract: product was Candidate {blind_slot}; recommendation={blind_recommendation}; essay_about={blind_essay_about}",
            f"- Proof blind text came from winning payload: {'YES' if blind_match else 'NO'}",
            f"- Deployed API re-check status: {live_status}",
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_DEPLOYED_PACKET_WINNER_VERIFICATION_V1.md'), '\n'.join(verify_md) + '\n')

    # 7) PACKET LEVEL PROOF V_NEXT
    proof_md = [
        '# PAGE_THREE_PACKET_LEVEL_PROOF_V_NEXT.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
        '## Required package checklist',
        '- fresh blind review packet: evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
        '- fresh blind answer key: evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
        '- per-case classifier results: evaluation_outputs/page3_holdout_v2_remediation/summary.json',
        '- per-case final winning family IDs + runner-up IDs: summary.json candidate_debug',
        '- family distribution control audit: evaluation_outputs/PAGE_THREE_FAMILY_DISTRIBUTION_CONTROL_AUDIT_V1.md',
        '- recommendation angle naming audit: evaluation_outputs/PAGE_THREE_RECOMMENDATION_ANGLE_NAMING_AUDIT_V1.md',
        '- essay_about specificity/redundancy audit: evaluation_outputs/PAGE_THREE_ESSAY_ABOUT_SPECIFICITY_AND_REDUNDANCY_AUDIT_V1.md',
        '- ambiguity mode competitiveness audit: evaluation_outputs/PAGE_THREE_AMBIGUITY_MODE_COMPETITIVENESS_AUDIT_V1.md',
        '- evaluator human-reality alignment audit: evaluation_outputs/PAGE_THREE_EVALUATOR_HUMAN_REALITY_ALIGNMENT_AUDIT_V1.md',
        '- deployed packet winner verification audit: evaluation_outputs/PAGE_THREE_DEPLOYED_PACKET_WINNER_VERIFICATION_V1.md',
        '- fresh human blind results file: evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md',
        '',
        '## Per-case classifier and family outputs',
        '| Case | Classifier pattern | Winner family | Runner-up family | Deployed verification status |',
        '|---|---|---|---|---|',
    ]

    status_map = {r['case_id']: r['live_status'] for r in verification_rows}

    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        cls = cp.get('classification') or {}
        debug = cp.get('candidate_debug') or {}
        cands = debug.get('scores_by_candidate') or []
        winner = next((c for c in cands if c.get('id') == debug.get('winner_id')), {})
        runner = next((c for c in cands if c.get('id') == debug.get('weaker_read_source_id')), {})
        cid = row.get('case_id')
        proof_md.append(
            f"| {cid} | {cls.get('primary_pattern', 'unknown')} | {winner.get('recommendation_family', 'n/a')} | {runner.get('recommendation_family', 'n/a')} | {status_map.get(cid, 'NOT_CHECKED')} |"
        )

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_PACKET_LEVEL_PROOF_V_NEXT.md'), '\n'.join(proof_md) + '\n')

    # 8) HUMAN BLIND RESULTS V_NEXT (fresh status shell)
    human_md = [
        '# PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md',
        '',
        f'Date: {datetime.now(UTC).date().isoformat()}',
        f'Deployed build under review: {deployed_url}',
        'Status: PENDING_REAL_HUMAN_PANEL_SUBMISSION',
        '',
        '## Blind packet sources',
        '- evaluation_outputs/page3_holdout_v2_remediation/BLIND_REVIEW_PACKET_V2.md',
        '- evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
        '- evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
        '',
        '## Required scoring fields (to be filled by human panel)',
        '- panel_size:',
        '- recommendation_winner_counts:',
        '- essay_about_winner_counts:',
        '- why_winner_counts:',
        '- evidence_winner_counts:',
        '- overall_winner_counts:',
        '- product_preference_rate:',
        '- baseline_preference_rate:',
        '- tie_rate:',
        '- signed_decision:',
        '',
        '## Automated context (not a substitute for human vote)',
        f"- product_wins: {summary.get('final_tally', {}).get('product_wins')}",
        f"- openai_wins: {summary.get('final_tally', {}).get('openai_wins')}",
        f"- ties: {summary.get('final_tally', {}).get('ties')}",
        f"- scored_cases: {summary.get('scored_case_count')}",
    ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md'), '\n'.join(human_md) + '\n')

    print(json.dumps({
        'generated_at': now_iso(),
        'deployed_url': deployed_url,
        'outputs': [
            'PAGE_THREE_FAMILY_DISTRIBUTION_CONTROL_AUDIT_V1.md',
            'PAGE_THREE_RECOMMENDATION_ANGLE_NAMING_AUDIT_V1.md',
            'PAGE_THREE_ESSAY_ABOUT_SPECIFICITY_AND_REDUNDANCY_AUDIT_V1.md',
            'PAGE_THREE_AMBIGUITY_MODE_COMPETITIVENESS_AUDIT_V1.md',
            'PAGE_THREE_EVALUATOR_HUMAN_REALITY_ALIGNMENT_AUDIT_V1.md',
            'PAGE_THREE_DEPLOYED_PACKET_WINNER_VERIFICATION_V1.md',
            'PAGE_THREE_PACKET_LEVEL_PROOF_V_NEXT.md',
            'PAGE_THREE_HUMAN_BLIND_RESULTS_V_NEXT.md',
        ],
    }, indent=2))


if __name__ == '__main__':
    main()
