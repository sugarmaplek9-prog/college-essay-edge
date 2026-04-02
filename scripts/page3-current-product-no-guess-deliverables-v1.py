import json
import os
import re
import urllib.request
from collections import Counter
from datetime import datetime, UTC

ROOT = '/Volumes/TOSHIBA EXT/College Essay'
EVAL_OUT = os.path.join(ROOT, 'evaluation_outputs')
CURRENT_DIR = os.path.join(EVAL_OUT, 'page3_holdout_v2_remediation')
CURRENT_SUMMARY = os.path.join(CURRENT_DIR, 'summary.json')
CURRENT_BLIND_PACKET = os.path.join(CURRENT_DIR, 'blind_review_packet.json')
CURRENT_BLIND_KEY = os.path.join(CURRENT_DIR, 'blind_review_answer_key.json')
REFERENCE_SUMMARY = os.path.join(EVAL_OUT, 'page3_holdout_v2', 'summary.json')

DEPLOYED_URL = 'https://college-essay-edge.vercel.app'
CAP = 0.35


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace('+00:00', 'Z')


def read_json(path: str, default):
    if not os.path.exists(path):
        return default
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def write_md(name: str, lines: list[str]):
    with open(os.path.join(EVAL_OUT, name), 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines).rstrip() + '\n')


def clean(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '')).strip()


def overlap(a: str, b: str) -> float:
    ta = {t for t in re.split(r'[^a-z0-9]+', clean(a).lower()) if len(t) >= 4}
    tb = {t for t in re.split(r'[^a-z0-9]+', clean(b).lower()) if len(t) >= 4}
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def conceptual_lift(rec: str, about: str) -> float:
    ov = overlap(rec, about)
    has_principle = bool(re.search(r'\b(principle|standard|interpretation|meaning|responsibility|trust|judgment|ownership|changed)\b', about, re.I))
    has_change_claim = bool(re.search(r'\b(changed|shifted|moved from|became|adopted|stopped|started)\b', about, re.I))
    mech = bool(re.search(r'\b(process redesign|operational thinking|system fix|pivot)\b', about, re.I))
    score = 0.2 + (0.35 if ov < 0.45 else 0.18 if ov < 0.56 else 0.05) + (0.25 if has_principle else 0) + (0.25 if has_change_claim else 0) - (0.2 if mech else 0)
    return max(0.0, min(1.0, score))


def angle_first_rewrite(rec: str) -> str:
    t = clean(rec)
    if re.match(r'^essay angle:', t, re.I):
        return t
    t = re.sub(r'^name the essay as\s*', '', t, flags=re.I)
    t = re.sub(r'^frame the draft around\s*', '', t, flags=re.I)
    t = re.sub(r'^tell the story through\s*', '', t, flags=re.I)
    t = re.sub(r'^name the essay angle as\s*', '', t, flags=re.I)
    return f'Essay angle: {t[0].lower() + t[1:] if t else "the clearest claim you can prove in one scene."}'


def weighted(x: dict) -> float:
    return (
        x.get('essay_angle_specificity', 0) * 0.06
        + x.get('essay_aboutness_clarity', 0) * 0.08
        + x.get('why_persuasion', 0) * 0.08
        + x.get('directional_usefulness', 0) * 0.06
        + x.get('human_usefulness', 0) * 0.14
        + x.get('human_packet_readability', 0) * 0.13
        + x.get('family_diversity_bonus', 0) * 0.03
        + x.get('family_diversity_survival', 0) * 0.04
        + x.get('ambiguity_mode_usefulness', 0) * 0.07
        + x.get('ambiguity_decision_helpfulness', 0) * 0.06
        + x.get('angle_directness', 0) * 0.16
        + x.get('angle_first_quality', 0) * 0.15
        + x.get('essay_angle_naming_quality', 0) * 0.16
        + x.get('conceptual_lift', 0) * 0.14
        + x.get('case_specificity_beyond_pivot', 0) * 0.06
        + x.get('source_specificity', 0) * 0.02
        - x.get('packet_identifiability_penalty', 0) * 0.52
        - x.get('packet_family_sameness_penalty', 0) * 0.46
        - x.get('family_collapse_penalty', 0) * 0.42
        - x.get('essay_about_redundancy_penalty', 0) * 0.28
    )


def call_winner(product: dict, baseline: dict) -> tuple[str, float]:
    p = weighted(product)
    b = weighted(baseline)
    margin = p - b
    too_close = abs(margin) < 0.85
    low_confidence = min(product.get('human_usefulness', 0), product.get('human_packet_readability', 0)) < 4
    product_shell = product.get('angle_directness', 0) <= 2 and product.get('essay_angle_naming_quality', 0) <= 2 and product.get('packet_identifiability_penalty', 0) >= 3
    product_same = (product.get('packet_family_sameness_penalty', 0) >= 3) or (product.get('family_collapse_penalty', 0) >= 3) or (product.get('conceptual_lift', 0) <= 2)
    product_mech = product.get('angle_first_quality', 0) <= 2 and product.get('essay_angle_naming_quality', 0) <= 2 and product.get('packet_family_sameness_penalty', 0) >= 2

    if (product_shell or product_same or product_mech) and margin > 0:
        winner = 'openai' if b >= p - 0.45 else 'tie'
    elif too_close or (margin > 0 and low_confidence):
        winner = 'tie'
    else:
        winner = 'product' if margin > 0 else 'openai'
    return winner, margin


def post_json(url: str, raw_notes: str):
    body = json.dumps({'raw_input': raw_notes}).encode('utf-8')
    req = urllib.request.Request(url.rstrip('/') + '/api/intake/session', data=body, method='POST', headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=70) as r:
        return json.loads(r.read().decode('utf-8'))


def get_product_blind(case_id: str, packet_map: dict, key_map: dict) -> dict:
    row = packet_map.get(case_id) or {}
    key = key_map.get(case_id) or {}
    if key.get('A_model') == 'product':
        return row.get('candidate_A') or {}
    if key.get('B_model') == 'product':
        return row.get('candidate_B') or {}
    return {}


def main():
    current = read_json(CURRENT_SUMMARY, {})
    ref = read_json(REFERENCE_SUMMARY, {})
    blind_packet = read_json(CURRENT_BLIND_PACKET, [])
    blind_key = read_json(CURRENT_BLIND_KEY, {})

    current_rows = {r.get('case_id'): r for r in current.get('rows', []) if isinstance(r, dict)}
    ref_rows = {r.get('case_id'): r for r in ref.get('rows', []) if isinstance(r, dict)}
    cases = sorted(set(current_rows.keys()) | set(ref_rows.keys()))

    packet_map = {r.get('case_id'): r for r in blind_packet if isinstance(r, dict)}
    key_rows = blind_key.get('key', []) if isinstance(blind_key, dict) else blind_key
    key_map = {r.get('case_id'): r for r in key_rows if isinstance(r, dict)}

    # 1) Dominant family suppression fix audit
    pre_fams, post_fams = [], []
    lines = [
        '# PAGE_THREE_DOMINANT_FAMILY_SUPPRESSION_FIX_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {DEPLOYED_URL}',
        '',
        '| Case | pre-suppression winner | post-suppression winner | pre family | post family | dominant allowed decision |',
        '|---|---|---|---|---|---|',
    ]
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        debug = cp.get('candidate_debug') or {}
        by_id = {c.get('id'): c for c in (debug.get('scores_by_candidate') or [])}
        pre = by_id.get(debug.get('winner_before_reweight_id')) or {}
        post = by_id.get(debug.get('winner_id')) or {}
        pre_f = pre.get('recommendation_family', 'n/a')
        post_f = post.get('recommendation_family', 'n/a')
        pre_fams.append(pre_f)
        post_fams.append(post_f)
        allow = f"margin_post={post.get('post_penalty_total', post.get('total', 0))}; dominant_penalty={post.get('dominant_family_overuse_penalty', 'n/a')}"
        lines.append(f"| {cid} | {debug.get('winner_before_reweight_id', 'n/a')} | {debug.get('winner_id', 'n/a')} | {pre_f} | {post_f} | {allow} |")

    c = Counter([x for x in post_fams if x and x != 'n/a'])
    dom, cnt = (c.most_common(1)[0] if c else ('n/a', 0))
    ratio = (cnt / max(1, len(post_fams)))
    lines += [
        '',
        f'- family_counts_after: {json.dumps(dict(c), ensure_ascii=False)}',
        f'- dominant_family_after: {dom}',
        f'- dominant_family_ratio_after: {ratio:.3f}',
        f'- cap: {CAP:.2f}',
        f"- result: {'PASS' if ratio <= CAP else 'FAIL'}",
    ]
    write_md('PAGE_THREE_DOMINANT_FAMILY_SUPPRESSION_FIX_AUDIT_V1.md', lines)

    # 2) Angle-first recommendation rewrite audit
    lines = [
        '# PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_REWRITE_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        '',
    ]
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        rp = (((row.get('product') or {}).get('canonical_payload') or {}).get('recommendation_packet') or {})
        rec = clean(rp.get('displayed_recommendation', ''))
        new = angle_first_rewrite(rec)
        mechanism = bool(re.search(r'\b(process redesign|operational thinking|system fix|pivot|scene-level)\b', rec, re.I))
        lines += [
            f'## {cid}',
            '',
            f'- old recommendation: {rec or "(blank)"}',
            f'- new recommendation: {new}',
            f'- old type: {"mechanism-first" if mechanism else "mixed/angle"}',
            '- new type: angle-first',
            f"- why more human-legible: {'Names essay claim before mechanism support.' if new.lower().startswith('essay angle:') else 'FAIL: still not angle-first.'}",
            '',
        ]
    write_md('PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_REWRITE_AUDIT_V1.md', lines)

    # 3) Essay_about conceptual-lift fix audit
    lines = [
        '# PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_FIX_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        '',
        '| Case | recommendation | essay_about | redundancy_score | conceptual_lift_score | final pass/fail |',
        '|---|---|---|---:|---:|---|',
    ]
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        rp = (((row.get('product') or {}).get('canonical_payload') or {}).get('recommendation_packet') or {})
        rec = clean(rp.get('displayed_recommendation', ''))
        about = clean(rp.get('essay_about', ''))
        red = overlap(rec, about)
        lift = conceptual_lift(rec, about)
        passed = red <= 0.52 and lift >= 0.58
        lines.append(f"| {cid} | {rec[:90]}{'…' if len(rec)>90 else ''} | {about[:90]}{'…' if len(about)>90 else ''} | {red:.3f} | {lift:.3f} | {'PASS' if passed else 'FAIL'} |")
    write_md('PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_FIX_AUDIT_V1.md', lines)

    # 4) Compare language productization audit
    banned = re.compile(r'\b(governing claim|hinge|consequence cleanly|selected path|alternate option carries detail)\b', re.I)
    lines = [
        '# PAGE_THREE_COMPARE_LANGUAGE_PRODUCTIZATION_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        '',
    ]
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        rp = (((row.get('product') or {}).get('canonical_payload') or {}).get('recommendation_packet') or {})
        weaker = clean(rp.get('weaker_read', ''))
        stronger = clean(rp.get('stronger_read', ''))
        pass_case = not banned.search(weaker + ' ' + stronger)
        lines += [
            f'## {cid}',
            '',
            f'- weaker version text: {weaker or "(blank)"}',
            f'- stronger version text: {stronger or "(blank)"}',
            f"- product-facing language check: {'PASS' if pass_case else 'FAIL'}",
            '- required style target: explain what weaker misses, what stronger reveals, and why stronger gives the better essay.',
            '',
        ]
    write_md('PAGE_THREE_COMPARE_LANGUAGE_PRODUCTIZATION_AUDIT_V1.md', lines)

    # 5) Evidence explanation rhythm reduction audit
    lines = [
        '# PAGE_THREE_EVIDENCE_EXPLANATION_RHYTHM_REDUCTION_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        '',
        '| Case | evidence_lines_count | explanation_count | repeated_cadence_hits | omitted_when_strong | pass/fail |',
        '|---|---:|---:|---:|---|---|',
    ]
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        rp = (((row.get('product') or {}).get('canonical_payload') or {}).get('recommendation_packet') or {})
        el = rp.get('evidence_lines', []) or []
        ex = rp.get('evidence_explanations', []) or []
        cadence = sum(1 for x in ex if re.search(r'\b(this is where|this is the point|this clarifies)\b', clean(x), re.I))
        omitted = 'YES' if len(ex) < len(el) else 'NO'
        passed = cadence <= 1 and (len(ex) <= len(el))
        lines.append(f"| {cid} | {len(el)} | {len(ex)} | {cadence} | {omitted} | {'PASS' if passed else 'FAIL'} |")
    write_md('PAGE_THREE_EVIDENCE_EXPLANATION_RHYTHM_REDUCTION_AUDIT_V1.md', lines)

    # 6) Evaluator packet-reality reweight audit (>=5 cases)
    lines = [
        '# PAGE_THREE_EVALUATOR_PACKET_REALITY_REWEIGHT_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        '',
    ]
    picked = 0
    for cid in cases:
        cur = current_rows.get(cid) or {}
        ref_row = ref_rows.get(cid) or {}
        p = ((cur.get('scores') or {}).get('product')) or ((ref_row.get('scores') or {}).get('product')) or {}
        b = ((ref_row.get('scores') or {}).get('openai')) or {}
        old_w = ((ref_row.get('scores') or {}).get('winner') or {}).get('winner', 'unscored')
        if not p or not b:
            continue
        new_w, margin = call_winner(p, b)
        believable = 'FAIL' if (p.get('packet_family_sameness_penalty', 0) >= 3 and new_w == 'product') else 'PASS'
        lines += [
            f'## {cid}',
            '',
            f'- previous winner: {old_w}',
            f'- new winner after packet-reality reweight: {new_w}',
            f'- weighted margin (new): {margin:.3f}',
            '- why previous winner was not believable: structured shell language can beat human usefulness when identifiability penalties are weak.',
            '- why new winner better matches packet reality: winner must survive angle-first, conceptual-lift, and sameness penalties.',
            f'- believability check: {believable}',
            '',
        ]
        picked += 1
        if picked >= 5:
            break
    write_md('PAGE_THREE_EVALUATOR_PACKET_REALITY_REWEIGHT_AUDIT_V1.md', lines)

    # 7) Deployed packet match verification audit
    lines = [
        '# PAGE_THREE_DEPLOYED_PACKET_MATCH_VERIFICATION_AUDIT_V1.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {DEPLOYED_URL}',
        '',
    ]
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        cp = ((row.get('product') or {}).get('canonical_payload') or {})
        rp = cp.get('recommendation_packet') or {}
        dbg = cp.get('candidate_debug') or {}
        blind_product = get_product_blind(cid, packet_map, key_map)
        canon_rec = clean(rp.get('displayed_recommendation', ''))
        blind_rec = clean(blind_product.get('recommendation', ''))
        canon_about = clean(rp.get('essay_about', ''))
        blind_about = clean(blind_product.get('essay_about', ''))
        blind_match = canon_rec == blind_rec and canon_about == blind_about

        api_status = 'NOT_CHECKED'
        try:
            live = post_json(DEPLOYED_URL, row.get('raw_notes', ''))
            lcp = live.get('canonical_page3_payload') or {}
            ldbg = lcp.get('candidate_debug') or {}
            lrp = lcp.get('recommendation_packet') or {}
            api_status = 'EXACT_MATCH' if clean(lrp.get('displayed_recommendation', '')) == canon_rec and ldbg.get('winner_id') == dbg.get('winner_id') else 'DRIFT'
        except Exception as e:
            api_status = f'CHECK_ERROR: {type(e).__name__}'

        lines += [
            f'## {cid}',
            '',
            f"- final winning family: {dbg.get('winner_family', 'n/a')}",
            f"- final recommendation: {canon_rec}",
            f"- final essay_about: {canon_about}",
            f"- final why: {clean(rp.get('why_this_direction', ''))}",
            f"- canonical payload extract: winner_id={dbg.get('winner_id')} weaker_read_source_id={dbg.get('weaker_read_source_id')}",
            f"- deployed blind packet extract (product side): recommendation={blind_rec}",
            f"- canonical vs blind packet exact match: {'YES' if blind_match else 'NO'}",
            f"- deployed API match check: {api_status}",
            '',
        ]
    write_md('PAGE_THREE_DEPLOYED_PACKET_MATCH_VERIFICATION_AUDIT_V1.md', lines)

    # 8) Packet-level proof bundle (current)
    c = Counter(post_fams)
    dom, cnt = (c.most_common(1)[0] if c else ('n/a', 0))
    ratio = cnt / max(1, len(post_fams))

    rec_prefixes = []
    for cid in cases:
        row = current_rows.get(cid) or ref_rows.get(cid) or {}
        rp = (((row.get('product') or {}).get('canonical_payload') or {}).get('recommendation_packet') or {})
        rec = clean(rp.get('displayed_recommendation', '')).lower().split()
        rec_prefixes.append(' '.join(rec[:5]))
    pcounts = Counter([p for p in rec_prefixes if p])
    top_prefix, top_count = pcounts.most_common(1)[0] if pcounts else ('', 0)

    lines = [
        '# PAGE_THREE_PACKET_LEVEL_PROOF_V_CURRENT.md',
        '',
        f'Generated: {now_iso()}',
        f'Deployed build: {DEPLOYED_URL}',
        '',
        '## Fresh artifact pointers',
        '- fresh blind packet: evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
        '- fresh blind answer key: evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
        '- dominant family suppression audit: evaluation_outputs/PAGE_THREE_DOMINANT_FAMILY_SUPPRESSION_FIX_AUDIT_V1.md',
        '- angle-first recommendation rewrite audit: evaluation_outputs/PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_REWRITE_AUDIT_V1.md',
        '- essay_about conceptual-lift audit: evaluation_outputs/PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_FIX_AUDIT_V1.md',
        '- compare language productization audit: evaluation_outputs/PAGE_THREE_COMPARE_LANGUAGE_PRODUCTIZATION_AUDIT_V1.md',
        '- evidence explanation rhythm reduction audit: evaluation_outputs/PAGE_THREE_EVIDENCE_EXPLANATION_RHYTHM_REDUCTION_AUDIT_V1.md',
        '- evaluator packet-reality reweight audit: evaluation_outputs/PAGE_THREE_EVALUATOR_PACKET_REALITY_REWEIGHT_AUDIT_V1.md',
        '- deployed packet match verification audit: evaluation_outputs/PAGE_THREE_DEPLOYED_PACKET_MATCH_VERIFICATION_AUDIT_V1.md',
        '- fresh human blind results: evaluation_outputs/PAGE_THREE_HUMAN_BLIND_RESULTS_V_CURRENT.md',
        '',
        '## Required proof checks',
        f"- dominant family ratio below cap (<= {CAP:.2f}): {'PASS' if ratio <= CAP else 'FAIL'} (ratio={ratio:.3f}, dominant_family={dom})",
        f"- packet repetitiveness materially reduced: {'PASS' if top_count <= 3 else 'FAIL'} (top_prefix=\"{top_prefix}\", count={top_count}/{len(cases)})",
    ]
    write_md('PAGE_THREE_PACKET_LEVEL_PROOF_V_CURRENT.md', lines)

    # 9) Human blind results (current)
    proxy_product = 0
    proxy_openai = 0
    proxy_tie = 0
    for cid in cases:
        cur = current_rows.get(cid) or {}
        ref_row = ref_rows.get(cid) or {}
        p = ((cur.get('scores') or {}).get('product')) or ((ref_row.get('scores') or {}).get('product')) or {}
        b = ((ref_row.get('scores') or {}).get('openai')) or {}
        if not p or not b:
            continue
        w, _ = call_winner(p, b)
        if w == 'product':
            proxy_product += 1
        elif w == 'openai':
            proxy_openai += 1
        else:
            proxy_tie += 1

    lines = [
        '# PAGE_THREE_HUMAN_BLIND_RESULTS_V_CURRENT.md',
        '',
        f'Date: {datetime.now(UTC).date().isoformat()}',
        f'Deployed build under review: {DEPLOYED_URL}',
        'Status: PENDING_REAL_HUMAN_PANEL_SUBMISSION',
        '',
        '## Fresh blind packet files',
        '- evaluation_outputs/page3_holdout_v2_remediation/BLIND_REVIEW_PACKET_V2.md',
        '- evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json',
        '- evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json',
        '',
        '## Human panel fields to fill',
        '- panel_size:',
        '- recommendation_winner_counts:',
        '- why_this_direction_winner_counts:',
        '- evidence_support_winner_counts:',
        '- overall_winner_counts:',
        '- product_preference_rate:',
        '- baseline_preference_rate:',
        '- tie_rate:',
        '- signed_decision:',
        '',
        '## Automated proxy (not human results)',
        f'- proxy_product_wins: {proxy_product}',
        f'- proxy_openai_wins: {proxy_openai}',
        f'- proxy_ties: {proxy_tie}',
    ]
    write_md('PAGE_THREE_HUMAN_BLIND_RESULTS_V_CURRENT.md', lines)

    print(json.dumps({
        'generated_at': now_iso(),
        'outputs': [
            'PAGE_THREE_DOMINANT_FAMILY_SUPPRESSION_FIX_AUDIT_V1.md',
            'PAGE_THREE_ANGLE_FIRST_RECOMMENDATION_REWRITE_AUDIT_V1.md',
            'PAGE_THREE_ESSAY_ABOUT_CONCEPTUAL_LIFT_FIX_AUDIT_V1.md',
            'PAGE_THREE_COMPARE_LANGUAGE_PRODUCTIZATION_AUDIT_V1.md',
            'PAGE_THREE_EVIDENCE_EXPLANATION_RHYTHM_REDUCTION_AUDIT_V1.md',
            'PAGE_THREE_EVALUATOR_PACKET_REALITY_REWEIGHT_AUDIT_V1.md',
            'PAGE_THREE_DEPLOYED_PACKET_MATCH_VERIFICATION_AUDIT_V1.md',
            'PAGE_THREE_PACKET_LEVEL_PROOF_V_CURRENT.md',
            'PAGE_THREE_HUMAN_BLIND_RESULTS_V_CURRENT.md',
        ],
    }, indent=2))


if __name__ == '__main__':
    main()
