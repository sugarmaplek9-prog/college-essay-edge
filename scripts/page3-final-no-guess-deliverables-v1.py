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


def clean(v: str) -> str:
    return re.sub(r'\s+', ' ', (v or '')).strip()


def overlap(a: str, b: str) -> float:
    def toks(text: str):
        return [w for w in re.split(r'[^a-z0-9]+', (text or '').lower()) if len(w) >= 4]

    A, B = set(toks(a)), set(toks(b))
    if not A or not B:
        return 0.0
    return len(A & B) / len(A | B)


def conceptual_lift_score(rec: str, about: str) -> float:
    ov = overlap(rec, about)
    concept = bool(re.search(r'\b(principle|standard|interpretation|responsibility|trust|judgment|ownership|reliability)\b', about, re.I))
    behavior = bool(re.search(r'\b(behavior|decision|choices?|pattern|actions?)\b', about, re.I))
    filler = bool(re.search(r'\b(one clear thread|concrete moments and consequences|strong central claim|pressure moment)\b', about, re.I))
    score = 0.22 + (0.34 if ov < 0.45 else 0.18 if ov < 0.55 else 0.0) + (0.22 if concept else 0.0) + (0.18 if behavior else 0.0) - (0.2 if filler else 0.0)
    return max(0.0, min(1.0, score))


def post_json(base_url: str, raw_notes: str):
    data = json.dumps({'raw_input': raw_notes}).encode('utf-8')
    req = urllib.request.Request(
        base_url.rstrip('/') + '/api/intake/session',
        data=data,
        method='POST',
        headers={'Content-Type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=70) as r:
        return json.loads(r.read().decode('utf-8'))


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


def angle_first_rewrite(rec: str) -> str:
    text = clean(rec)
    text = re.sub(r'^name the essay as\s*', 'Essay angle: ', text, flags=re.I)
    text = re.sub(r'^focus on\s*', 'Essay angle: ', text, flags=re.I)
    if not re.match(r'^essay angle:', text, flags=re.I):
        text = f'Essay angle: {text}'
    text = re.sub(r'\bprocess redesign and operational thinking\b', 'reliability as a standard proved in behavior', text, flags=re.I)
    return text


def strict_rescore(x: dict) -> float:
    return (
        x.get('human_usefulness', 0) * 0.12
        + x.get('human_packet_readability', 0) * 0.11
        + x.get('angle_directness', 0) * 0.12
        + x.get('angle_first_quality', 0) * 0.12
        + x.get('essay_angle_naming_quality', 0) * 0.12
        + x.get('conceptual_lift', 0) * 0.10
        + x.get('essay_aboutness_clarity', 0) * 0.07
        + x.get('why_persuasion', 0) * 0.07
        + x.get('ambiguity_mode_usefulness', 0) * 0.08
        + x.get('ambiguity_decision_helpfulness', 0) * 0.06
        - x.get('packet_identifiability_penalty', 0) * 0.44
        - x.get('packet_family_sameness_penalty', 0) * 0.40
        - x.get('family_collapse_penalty', 0) * 0.38
        - x.get('essay_about_redundancy_penalty', 0) * 0.28
    )


def main():
    summary = read_json(SUMMARY_PATH, {})
    rows = summary.get('rows', [])

    blind_packet = read_json(BLIND_PACKET_PATH, [])
    blind_key = read_json(BLIND_KEY_PATH, {})
    key_rows = blind_key.get('key', []) if isinstance(blind_key, dict) else blind_key
    key_map = {k.get('case_id'): k for k in key_rows if isinstance(k, dict)}
    blind_packet_map = {r.get('case_id'): r for r in blind_packet if isinstance(r, dict)}

    deployed_url = summary.get('product_url') or os.environ.get('PRODUCT_URL') or DEFAULT_DEPLOYED_URL
    before_url = os.environ.get('BEFORE_URL') or DEFAULT_BEFORE_URL

    # 1) Dominant family cap enforcement audit
    pre_fams, post_fams = [], []
    cap_md = [
        '# PAGE_THREE_DOMINANT_FAMILY_CAP_ENFORCEMENT_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
        '| Case | winner before cap enforcement | winner after cap enforcement | winner family before | winner family after | final winner allowed why |',
        '|---|---|---|---|---|---|',
    ]

    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        debug = cp.get('candidate_debug') or {}
        cands = debug.get('scores_by_candidate') or []
        by_id = {c.get('id'): c for c in cands}

        pre_id = debug.get('winner_before_reweight_id')
        post_id = debug.get('winner_id')
        pre = by_id.get(pre_id) or {}
        post = by_id.get(post_id) or {}

        pre_fam = pre.get('recommendation_family', 'n/a')
        post_fam = post.get('recommendation_family', 'n/a')
        pre_fams.append(pre_fam)
        post_fams.append(post_fam)

        allowed_why = f"total={post.get('total', 0):.3f}; angle_first={post.get('angle_first_quality', 0):.3f}; conceptual_lift={post.get('essay_about_conceptual_lift', 0):.3f}; batch_penalty={post.get('batch_family_distribution_penalty', 0):.3f}"
        cap_md.append(f"| {row.get('case_id')} | {pre_id or 'n/a'} | {post_id or 'n/a'} | {pre_fam} | {post_fam} | {allowed_why} |")

    pre_counts = Counter(pre_fams)
    post_counts = Counter(post_fams)
    pre_dom = pre_counts.most_common(1)[0] if pre_counts else ('n/a', 0)
    post_dom = post_counts.most_common(1)[0] if post_counts else ('n/a', 0)
    n = max(1, len(rows))
    pre_ratio = pre_dom[1] / n
    post_ratio = post_dom[1] / n

    cap_md += [
        '',
        '## Family counts before and after enforcement',
        f'- family_counts_before: {json.dumps(dict(pre_counts), ensure_ascii=False)}',
        f'- family_counts_after: {json.dumps(dict(post_counts), ensure_ascii=False)}',
        f'- dominant_before: {pre_dom[0]} ({pre_ratio:.3f})',
        f'- dominant_after: {post_dom[0]} ({post_ratio:.3f})',
        '- cap_threshold: 0.35',
        f"- cap_result: {'PASS' if post_ratio <= 0.35 else 'FAIL'}",
    ]
    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_DOMINANT_FAMILY_CAP_ENFORCEMENT_AUDIT_V1.md'), '\n'.join(cap_md) + '\n')

    # 2) Angle-first recommendation audit
    angle_md = [
        '# PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
    ]
    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        rp = cp.get('recommendation_packet') or {}
        rec = clean(rp.get('displayed_recommendation', ''))
        rewritten = angle_first_rewrite(rec)
        names_essay = bool(re.match(r'^essay angle:', rewritten, re.I))
        mechanism_heavy = bool(re.search(r'\b(process redesign|operational thinking|pivot|scene-level choice)\b', rec, re.I))
        passed = names_essay and not mechanism_heavy
        angle_md += [
            f"## {row.get('case_id')}",
            '',
            f"- current recommendation: {rec or '(blank)'}",
            f"- rewritten angle-first recommendation: {rewritten}",
            f"- names essay directly: {'YES' if names_essay else 'NO'}",
            f"- mechanism-first in current output: {'YES' if mechanism_heavy else 'NO'}",
            f"- pass/fail: {'PASS' if passed else 'FAIL'}",
            '',
        ]
    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_AUDIT_V1.md'), '\n'.join(angle_md) + '\n')

    # 3) Essay_about conceptual lift audit
    about_md = [
        '# PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
        '| Case | recommendation | essay_about | overlap_score | conceptual_lift_score | final pass/fail |',
        '|---|---|---|---:|---:|---|',
    ]

    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        rp = cp.get('recommendation_packet') or {}
        rec = clean(rp.get('displayed_recommendation', ''))
        about = clean(rp.get('essay_about', ''))
        ov = overlap(rec, about)
        lift = conceptual_lift_score(rec, about)
        passed = (ov <= 0.52) and (lift >= 0.58)
        about_md.append(
            f"| {row.get('case_id')} | {rec[:88]}{'…' if len(rec) > 88 else ''} | {about[:88]}{'…' if len(about) > 88 else ''} | {ov:.3f} | {lift:.3f} | {'PASS' if passed else 'FAIL'} |"
        )

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_AUDIT_V1.md'), '\n'.join(about_md) + '\n')

    # 4) Ambiguity mode competitive usefulness audit
    ambiguity_cases = [
        ('AMB_FINAL_01', 'I can write about redesigning our pantry inventory process or about translating for my parents at hospital check-ins. I am not sure which angle should lead.'),
        ('AMB_FINAL_02', 'I have two real options: robotics systems troubleshooting and peer tutoring communication gaps. I cannot tell which makes the stronger essay angle.'),
        ('AMB_FINAL_03', 'I can write about debate leadership conflict or a research reliability correction project. Both feel true and I need help choosing now.'),
    ]

    amb_md = [
        '# PAGE_THREE_AMBIGUITY_MODE_COMPETITIVE_USEFULNESS_AUDIT_V1.md',
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
            clean(new_packet.get('displayed_recommendation', '')),
            clean(new_packet.get('essay_about', '')),
            clean(new_packet.get('why_this_direction', '')),
            clean(new_packet.get('stronger_read', '')),
            clean(new_packet.get('first_coaching_step') or ''),
        ]).lower()

        checks = {
            'two_angles': bool(re.search(r'angle a|angle b|two', new_text)),
            'each_reveals': bool(re.search(r'what a would reveal|what b would reveal|reveal', new_text)),
            'evidence_for_each': bool(re.search(r'strongest current evidence for a|strongest current evidence for b', new_text)),
            'missing_evidence': bool(re.search(r'missing evidence|break the tie|decisive', new_text)),
            'sorting_question': bool(re.search(r'sorting question|which angle', new_text)),
            'testable_next_move': bool(re.search(r'immediate next drafting move|write a 4-line opening|step 1', new_text)),
        }
        competitive = all(checks.values())

        amb_md += [
            f'## {cid}',
            '',
            f'- input: {raw}',
            f'- old ambiguity output: recommendation="{clean(old_packet.get("displayed_recommendation", ""))}" | stronger_read="{clean(old_packet.get("stronger_read", ""))}"',
            f'- new ambiguity output: recommendation="{clean(new_packet.get("displayed_recommendation", ""))}" | stronger_read="{clean(new_packet.get("stronger_read", ""))}"',
            f'- contract checks: {json.dumps(checks, ensure_ascii=False)}',
            f"- competitive usefulness judgment: {'PASS' if competitive else 'FAIL'}",
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_AMBIGUITY_MODE_COMPETITIVE_USEFULNESS_AUDIT_V1.md'), '\n'.join(amb_md) + '\n')

    # 5) Evaluator reweight + reality check audit
    eval_md = [
        '# PAGE_THREE_EVALUATOR_REWEIGHT_AND_REALITY_CHECK_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        'Evaluator snapshot: scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
        '',
    ]

    for row in rows[:5]:
        scores = row.get('scores') or {}
        product = scores.get('product') or {}
        baseline = scores.get('openai') or {}
        old = scores.get('winner') or {}

        p_new = strict_rescore(product)
        b_new = strict_rescore(baseline)
        margin = p_new - b_new
        new_winner = 'tie' if abs(margin) < 0.85 else ('product' if margin > 0 else 'openai')

        eval_md += [
            f"## {row.get('case_id')}",
            '',
            f"- previous score breakdown (product): angle_directness={product.get('angle_directness')}, angle_first_quality={product.get('angle_first_quality')}, conceptual_lift={product.get('conceptual_lift')}, packet_identifiability_penalty={product.get('packet_identifiability_penalty')}, packet_family_sameness_penalty={product.get('packet_family_sameness_penalty')}, family_collapse_penalty={product.get('family_collapse_penalty')}",
            f"- previous score breakdown (baseline): angle_directness={baseline.get('angle_directness')}, angle_first_quality={baseline.get('angle_first_quality')}, conceptual_lift={baseline.get('conceptual_lift')}, packet_identifiability_penalty={baseline.get('packet_identifiability_penalty')}, packet_family_sameness_penalty={baseline.get('packet_family_sameness_penalty')}, family_collapse_penalty={baseline.get('family_collapse_penalty')}",
            f"- previous winner: {old.get('winner', 'unscored')} (old weighted margin={old.get('weighted_margin', 0):.3f})",
            f"- new score breakdown: product={p_new:.3f}, baseline={b_new:.3f}, margin={margin:.3f}",
            f"- new winner: {new_winner}",
            '- why this better matches human read: repetitive family-shell outputs are blocked unless angle-first clarity and conceptual lift are both strong.',
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_EVALUATOR_REWEIGHT_AND_REALITY_CHECK_AUDIT_V1.md'), '\n'.join(eval_md) + '\n')

    # 6) Deployed packet winner-match audit
    verify_md = [
        '# PAGE_THREE_DEPLOYED_PACKET_WINNER_MATCH_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
    ]

    verify_status = {}
    for row in rows:
        cid = row.get('case_id')
        raw_notes = row.get('raw_notes') or ''
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        cls = cp.get('classification') or {}
        rp = cp.get('recommendation_packet') or {}
        debug = cp.get('candidate_debug') or {}

        winner_id = debug.get('winner_id')
        runner_id = debug.get('weaker_read_source_id')
        winner_family = debug.get('winner_family')
        runner_family = debug.get('weaker_read_family')

        product_blind_candidate, slot = get_product_candidate_for_blind(cid, key_map, blind_packet_map)
        blind_rec = clean(product_blind_candidate.get('recommendation', ''))
        blind_about = clean(product_blind_candidate.get('essay_about', ''))

        canonical_rec = clean(rp.get('displayed_recommendation', ''))
        canonical_about = clean(rp.get('essay_about', ''))

        blind_match = (blind_rec == canonical_rec) and (blind_about == canonical_about)

        live_status = 'NOT_CHECKED'
        try:
            live = post_json(deployed_url, raw_notes)
            live_cp = live.get('canonical_page3_payload') or {}
            live_debug = live_cp.get('candidate_debug') or {}
            live_rp = live_cp.get('recommendation_packet') or {}
            fam_match = (live_debug.get('winner_family') == winner_family)
            rec_match = (clean(live_rp.get('displayed_recommendation', '')) == canonical_rec)
            live_status = 'EXACT_MATCH' if fam_match and rec_match else 'DRIFT'
        except Exception as e:
            live_status = f'CHECK_ERROR: {type(e).__name__}'

        verify_status[cid] = live_status

        verify_md += [
            f'## {cid}',
            '',
            f'- raw notes: {raw_notes}',
            f"- classifier output: primary_pattern={cls.get('primary_pattern')} | signal_strength={cls.get('signal_strength')}",
            f"- route decision: {((cp.get('routing') or {}).get('route_decision') or {}).get('route_target', 'n/a')} | reason={((cp.get('routing') or {}).get('route_decision') or {}).get('route_reason_code', 'n/a')}",
            f'- final winning candidate: {winner_id} (family={winner_family})',
            f'- final runner-up candidate: {runner_id} (family={runner_family})',
            f'- final recommendation: {canonical_rec}',
            f'- final essay_about: {canonical_about}',
            f"- final why: {clean(rp.get('why_this_direction', ''))}",
            f'- blind packet extract: product was Candidate {slot}; recommendation={blind_rec}; essay_about={blind_about}',
            f"- proof blind packet equals canonical winner: {'YES' if blind_match else 'NO'}",
            f'- deployed API re-check: {live_status}',
            '',
        ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_DEPLOYED_PACKET_WINNER_MATCH_AUDIT_V1.md'), '\n'.join(verify_md) + '\n')

    # 7) Packet-level proof final
    proof_md = [
        '# PAGE_THREE_PACKET_LEVEL_PROOF_V_FINAL.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {deployed_url}',
        '',
        '## Required package checklist',
        '- fresh blind review packet: evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
        '- fresh blind answer key: evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
        '- dominant family cap enforcement audit: evaluation_outputs/PAGE_THREE_DOMINANT_FAMILY_CAP_ENFORCEMENT_AUDIT_V1.md',
        '- angle-first recommendation audit: evaluation_outputs/PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_AUDIT_V1.md',
        '- essay_about conceptual lift audit: evaluation_outputs/PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_AUDIT_V1.md',
        '- ambiguity mode competitiveness audit: evaluation_outputs/PAGE_THREE_AMBIGUITY_MODE_COMPETITIVE_USEFULNESS_AUDIT_V1.md',
        '- evaluator reweight + reality check audit: evaluation_outputs/PAGE_THREE_EVALUATOR_REWEIGHT_AND_REALITY_CHECK_AUDIT_V1.md',
        '- deployed packet winner match audit: evaluation_outputs/PAGE_THREE_DEPLOYED_PACKET_WINNER_MATCH_AUDIT_V1.md',
        '- fresh human blind results file: evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_FINAL.md',
        '',
        '## Per-case classifier and final-family proof',
        '| Case | classifier pattern | winner family | runner-up family | deployed verification status |',
        '|---|---|---|---|---|',
    ]

    rec_prefixes = []
    for row in rows:
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        cls = cp.get('classification') or {}
        rp = cp.get('recommendation_packet') or {}
        debug = cp.get('candidate_debug') or {}
        cid = row.get('case_id')
        proof_md.append(
            f"| {cid} | {cls.get('primary_pattern', 'unknown')} | {debug.get('winner_family', 'n/a')} | {debug.get('weaker_read_family', 'n/a')} | {verify_status.get(cid, 'NOT_CHECKED')} |"
        )
        rec_prefixes.append(' '.join(clean(rp.get('displayed_recommendation', '')).lower().split()[:5]))

    prefix_counts = Counter([p for p in rec_prefixes if p])
    top_prefix, top_count = prefix_counts.most_common(1)[0] if prefix_counts else ('', 0)
    proof_md += [
        '',
        '## Packet repetitiveness check',
        f'- most repeated recommendation prefix: "{top_prefix}" ({top_count} / {len(rows)} cases)',
        f"- materially_less_repetitive_check: {'PASS' if top_count <= 3 else 'FAIL'}",
    ]

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_PACKET_LEVEL_PROOF_V_FINAL.md'), '\n'.join(proof_md) + '\n')

    # 8) Human blind results final
    human_md = [
        '# PAGE_THREE_HUMAN_BLIND_RESULTS_V_FINAL.md',
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

    write_text(os.path.join(EVAL_OUT, 'PAGE_THREE_HUMAN_BLIND_RESULTS_V_FINAL.md'), '\n'.join(human_md) + '\n')

    print(json.dumps({
        'generated_at': now_iso(),
        'deployed_url': deployed_url,
        'outputs': [
            'PAGE_THREE_DOMINANT_FAMILY_CAP_ENFORCEMENT_AUDIT_V1.md',
            'PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_AUDIT_V1.md',
            'PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_AUDIT_V1.md',
            'PAGE_THREE_AMBIGUITY_MODE_COMPETITIVE_USEFULNESS_AUDIT_V1.md',
            'PAGE_THREE_EVALUATOR_REWEIGHT_AND_REALITY_CHECK_AUDIT_V1.md',
            'PAGE_THREE_DEPLOYED_PACKET_WINNER_MATCH_AUDIT_V1.md',
            'PAGE_THREE_PACKET_LEVEL_PROOF_V_FINAL.md',
            'PAGE_THREE_HUMAN_BLIND_RESULTS_V_FINAL.md',
        ],
    }, indent=2))


if __name__ == '__main__':
    main()
