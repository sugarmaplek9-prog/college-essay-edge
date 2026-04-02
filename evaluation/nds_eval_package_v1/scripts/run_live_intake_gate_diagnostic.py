import csv
import json
import os
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'data' / 'NDS_GOLD_LABEL_PACK_V1.csv'
OUT_DIR = ROOT / 'outputs'
API_URL = os.getenv('NDS_API_URL', 'https://college-essay-edge.vercel.app/api/intake/session')


def map_expected_action_to_best_action(expected_action: str) -> str:
    action = (expected_action or '').strip().lower()
    mapping = {
        'rank_candidates': 'show_strongest_direction',
        'scope_correct_and_instruct': 'show_strongest_direction',
        'clarify_then_rank': 'ask_question_before_showing',
        'reframe_with_guardrails': 'ask_question_before_showing',
        'warn_then_reframe': 'ask_question_before_showing',
        'structured_intake_not_fake_certainty': 'ask_question_before_showing',
        'guarded_reframe': 'ask_question_before_showing',
    }
    return mapping.get(action, 'show_strongest_direction')


def call_live(raw_input: str) -> dict:
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({'raw_input': raw_input}).encode(),
        headers={'content-type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode())


def build_normalized_input_summary(intake_intelligence: dict) -> str:
    usable = intake_intelligence.get('usable_signal') or {}
    signal_strength = usable.get('signal_strength')
    signal_types = usable.get('signal_types') or []
    reasons = usable.get('reason_codes') or []
    return f"signal_strength={signal_strength}; signal_types={','.join(signal_types)}; usable_reasons={','.join(reasons)}"


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    rows = list(csv.DictReader(CSV_PATH.open()))
    diagnostics = []
    errors = []

    for row in rows:
        case_id = row['case_id']
        expected_best_action = map_expected_action_to_best_action(row.get('expected_nds_action', ''))
        try:
            payload = call_live(row['request_text'])
            intake = payload.get('intake_intelligence') or {}
            recommendation_viability = intake.get('recommendation_viability') or {}
            usable_signal = intake.get('usable_signal') or {}
            evidence_strength = payload.get('evidence_strength') or {}
            feature_summary = evidence_strength.get('featureSummary') or {}

            route = (evidence_strength.get('route') or '').lower()
            is_blocked = route == 'blocked'

            block_reason_codes = recommendation_viability.get('reason_codes') or []
            route_decision_reason = ','.join(block_reason_codes) if block_reason_codes else 'none_provided'

            clarification_would_be_acceptable = expected_best_action == 'ask_question_before_showing'
            block_actually_correct = expected_best_action == 'blocked_or_needs_more_input'

            diagnostics.append(
                {
                    'case_id': case_id,
                    'raw_input': row['request_text'],
                    'normalized_input_summary': build_normalized_input_summary(intake),
                    'expected_best_action': expected_best_action,
                    'live_product_mode': payload.get('product_mode'),
                    'live_route': route,
                    'is_blocked': is_blocked,
                    'block_reason': route_decision_reason,
                    'evidence_strength_metrics': {
                        'confidence': evidence_strength.get('confidence'),
                        'scores': evidence_strength.get('scores') or {},
                    },
                    'low_signal_markers': {
                        'usable_signal': usable_signal.get('usable_signal'),
                        'signal_strength': usable_signal.get('signal_strength'),
                        'signal_types': usable_signal.get('signal_types') or [],
                        'usable_reason_codes': usable_signal.get('reason_codes') or [],
                        'scene_specificity': feature_summary.get('sceneSpecificity'),
                        'ambiguity': feature_summary.get('ambiguity'),
                    },
                    'contradiction_markers': {
                        'conflict_strength': feature_summary.get('conflictStrength'),
                        'reason_codes': [
                            code
                            for code in (recommendation_viability.get('reason_codes') or [])
                            if 'CONTRADICTION' in code
                        ],
                    },
                    'route_decision_reason': route_decision_reason,
                    'clarification_would_be_acceptable': clarification_would_be_acceptable,
                    'block_actually_correct': block_actually_correct,
                }
            )
        except Exception as exc:  # noqa: BLE001
            errors.append({'case_id': case_id, 'error': str(exc)})

    out_json = OUT_DIR / 'LIVE_INTAKE_GATE_DIAGNOSTIC_V1.json'
    out_md = OUT_DIR / 'LIVE_INTAKE_GATE_DIAGNOSTIC_V1.md'
    err_json = OUT_DIR / 'LIVE_INTAKE_GATE_DIAGNOSTIC_V1.errors.json'

    out_json.write_text(json.dumps(diagnostics, indent=2))
    err_json.write_text(json.dumps(errors, indent=2))

    blocked_rows = [r for r in diagnostics if r['is_blocked']]
    block_correct = sum(1 for r in blocked_rows if r['block_actually_correct'])
    clarify_ok = sum(1 for r in blocked_rows if r['clarification_would_be_acceptable'])
    expected_show = sum(1 for r in blocked_rows if r['expected_best_action'] == 'show_strongest_direction')

    reason_counts = Counter(r['block_reason'] for r in blocked_rows)
    low_signal_counts = Counter(str(r['low_signal_markers'].get('signal_strength')) for r in blocked_rows)

    lines = []
    lines.append('# LIVE_INTAKE_GATE_DIAGNOSTIC_V1')
    lines.append('')
    lines.append(f"- Generated at: {datetime.now(timezone.utc).isoformat()}")
    lines.append(f"- Cases evaluated: {len(diagnostics)}")
    lines.append(f"- Cases blocked by live route: {len(blocked_rows)}")
    lines.append(f"- Block actually correct: {block_correct}")
    lines.append(f"- Clarification would be acceptable: {clarify_ok}")
    lines.append(f"- Expected show (but blocked): {expected_show}")
    lines.append('')
    lines.append('## Block reason counts')
    for reason, count in reason_counts.most_common():
        lines.append(f"- {reason}: {count}")
    lines.append('')
    lines.append('## Low-signal strength counts')
    for strength, count in low_signal_counts.most_common():
        lines.append(f"- {strength}: {count}")
    lines.append('')
    lines.append('## Case-by-case')
    lines.append('| Case | Expected best action | Live route | Block reason | Clarification acceptable | Block correct |')
    lines.append('|---|---|---|---|---|---|')
    for r in diagnostics:
        lines.append(
            f"| {r['case_id']} | {r['expected_best_action']} | {r['live_route']} | {r['block_reason']} | {r['clarification_would_be_acceptable']} | {r['block_actually_correct']} |"
        )

    out_md.write_text('\n'.join(lines))

    print(f'Wrote {out_json}')
    print(f'Wrote {out_md}')
    print(f'Wrote {err_json}')
    print(f'Blocked: {len(blocked_rows)} / {len(diagnostics)}')
    print(f'Block correct: {block_correct}')
    print(f'Clarification acceptable: {clarify_ok}')


if __name__ == '__main__':
    main()
