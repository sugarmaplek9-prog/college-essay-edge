import csv
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'data' / 'NDS_GOLD_LABEL_PACK_V1.csv'
OUT_DIR = ROOT / 'outputs'
API_URL = os.getenv('NDS_API_URL', 'https://college-essay-edge.vercel.app/api/intake/session')


def map_product_mode_to_best_action(product_mode: str) -> str:
    pm = (product_mode or '').strip().lower()
    if pm in {'clarification', 'clarify'}:
        return 'ask_question_before_showing'
    if pm in {'direction_light', 'direction_full'}:
        return 'show_strongest_direction'
    return 'blocked_or_needs_more_input'


def _candidate_from_dict(item: dict[str, Any]) -> str:
    for key in [
        'direction_line',
        'direction',
        'label',
        'title',
        'summary',
        'name',
    ]:
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ''


def extract_candidate_inventory(payload: Any) -> tuple[list[str], list[str]]:
    candidates: list[str] = []
    source_paths: list[str] = []

    def walk(node: Any, path: str = '') -> None:
        if isinstance(node, dict):
            for k, v in node.items():
                p = f'{path}.{k}' if path else k
                lk = k.lower()

                # list of dictionaries potentially containing candidate lines
                if isinstance(v, list) and v:
                    if isinstance(v[0], dict):
                        extracted = []
                        for item in v:
                            if not isinstance(item, dict):
                                continue
                            cand = _candidate_from_dict(item)
                            if cand:
                                extracted.append(cand)
                        if extracted and any(t in lk for t in ['candidate', 'direction', 'option', 'rank']):
                            candidates.extend(extracted)
                            source_paths.append(p)
                    elif isinstance(v[0], str):
                        if any(t in lk for t in ['candidate', 'direction', 'option']) and all(str(x).strip() for x in v):
                            candidates.extend([str(x).strip() for x in v])
                            source_paths.append(p)

                # direct direction-like string fields
                if isinstance(v, str) and v.strip() and any(t in lk for t in ['direction_line', 'best_direction', 'selected_direction']):
                    candidates.append(v.strip())
                    source_paths.append(p)

                walk(v, p)

        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f'{path}[{i}]')

    walk(payload)

    # Explicit fallback for light-direction payload shape
    if isinstance(payload, dict):
      light = payload.get('light_direction_payload')
      if isinstance(light, dict):
          for key in ['provisionalAngle', 'plainEnglishTheme', 'shortExample']:
              value = light.get(key)
              if isinstance(value, str) and value.strip():
                  candidates.append(value.strip())
                  source_paths.append(f'light_direction_payload.{key}')

    # de-dupe while preserving order
    seen = set()
    ordered = []
    for c in candidates:
        if c not in seen:
            seen.add(c)
            ordered.append(c)
    return ordered, source_paths


def call_live_nds(raw_input: str) -> dict[str, Any]:
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({'raw_input': raw_input}).encode(),
        headers={'content-type': 'application/json'},
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode())


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, str]] = []
    with CSV_PATH.open() as f:
        rows = list(csv.DictReader(f))

    current_path = OUT_DIR / 'NDS_PREDICTIONS_FULL25_CURRENT_NDS.jsonl'
    baseline_path = OUT_DIR / 'NDS_PREDICTIONS_FULL25_GENERIC_BASELINE.jsonl'
    inventory_path = OUT_DIR / 'NDS_LIVE_CANDIDATE_INVENTORY_FULL25.json'
    error_path = OUT_DIR / 'NDS_PREDICTIONS_FULL25_CURRENT_NDS_ERRORS.json'

    inventory_rows: list[dict[str, Any]] = []
    errors: list[dict[str, str]] = []

    with current_path.open('w') as f_current, baseline_path.open('w') as f_base:
        for row in rows:
            now = datetime.now(timezone.utc).isoformat()
            case_id = row['case_id']

            try:
                live = call_live_nds(row['request_text'])
                product_mode = str(live.get('product_mode') or '')
                evidence = live.get('evidence_strength') or {}
                route = evidence.get('route')
                best_action = map_product_mode_to_best_action(product_mode or route or '')

                candidates, source_paths = extract_candidate_inventory(live)
                best_direction = candidates[0] if candidates else ''

                clarification_payload = live.get('clarification_payload') or {}
                primary_q = clarification_payload.get('primaryQuestion')
                clarification_questions = [primary_q] if isinstance(primary_q, str) and primary_q.strip() else []

                current_obj = {
                    'case_id': case_id,
                    'run_id': 'full25-current-nds-live-inventory',
                    'model_version': 'current-nds-api',
                    'timestamp_utc': now,
                    'predicted_best_action': best_action,
                    'predicted_action': best_action,
                    'predicted_best_direction': best_direction,
                    'predicted_candidate_directions': candidates,
                    'predicted_rejected_directions': candidates[1:] if len(candidates) > 1 else [],
                    'clarification_questions': clarification_questions,
                    'confidence_band': 'medium',
                    'risk_flags': ['live_api', 'inventory_capture_enabled'],
                    'one_sentence_rationale': 'Current NDS route and candidate inventory captured from live API payload.',
                    'full_rationale': json.dumps(
                        {
                            'product_mode': product_mode,
                            'route': route,
                            'recommendation_viability': (live.get('intake_intelligence') or {}).get('recommendation_viability', {}).get('decision'),
                            'candidate_inventory_count': len(candidates),
                            'inventory_source_paths': source_paths,
                        }
                    )[:1800],
                    'needs_human_review': True,
                    'failure_annotation': {
                        'failure_owner': '',
                        'better_candidate_existed': '',
                        'clarify_should_have_happened': '',
                        'trust_risk': '',
                        'likely_student_reaction': '',
                    },
                    'provenance': {
                        'source_type': 'public_internet',
                        'source_origin': row.get('source', ''),
                        'source_reference': row.get('source_url', ''),
                        'capture_date': '',
                        'transformation_level': 'redacted',
                        'adjudication_status': 'needs_adjudication',
                    },
                }
                f_current.write(json.dumps(current_obj) + '\n')

                inventory_rows.append(
                    {
                        'case_id': case_id,
                        'product_mode': product_mode,
                        'route': route,
                        'candidate_inventory_count': len(candidates),
                        'candidate_inventory': candidates,
                        'inventory_source_paths': source_paths,
                    }
                )

            except Exception as exc:  # noqa: BLE001
                errors.append({'case_id': case_id, 'error': str(exc)})
                fallback = {
                    'case_id': case_id,
                    'run_id': 'full25-current-nds-live-inventory',
                    'model_version': 'current-nds-api',
                    'timestamp_utc': now,
                    'predicted_best_action': 'blocked_or_needs_more_input',
                    'predicted_action': 'blocked_or_needs_more_input',
                    'predicted_best_direction': '',
                    'predicted_candidate_directions': [],
                    'predicted_rejected_directions': [],
                    'clarification_questions': [],
                    'confidence_band': 'low',
                    'risk_flags': ['live_api_error'],
                    'one_sentence_rationale': 'Live API call failed during benchmark capture.',
                    'full_rationale': str(exc),
                    'needs_human_review': True,
                    'failure_annotation': {
                        'failure_owner': '',
                        'better_candidate_existed': '',
                        'clarify_should_have_happened': '',
                        'trust_risk': '',
                        'likely_student_reaction': '',
                    },
                    'provenance': {
                        'source_type': 'public_internet',
                        'source_origin': row.get('source', ''),
                        'source_reference': row.get('source_url', ''),
                        'capture_date': '',
                        'transformation_level': 'redacted',
                        'adjudication_status': 'needs_adjudication',
                    },
                }
                f_current.write(json.dumps(fallback) + '\n')

                inventory_rows.append(
                    {
                        'case_id': case_id,
                        'product_mode': '',
                        'route': '',
                        'candidate_inventory_count': 0,
                        'candidate_inventory': [],
                        'inventory_source_paths': [],
                    }
                )

            # generic baseline prediction
            candidates_base = [c.strip() for c in (row.get('candidate_directions') or '').split('||') if c.strip()]
            best_base = candidates_base[0] if candidates_base else ''
            baseline_obj = {
                'case_id': case_id,
                'run_id': 'full25-generic-baseline',
                'model_version': 'generic-baseline-v1',
                'timestamp_utc': now,
                'predicted_best_action': 'show_strongest_direction',
                'predicted_action': 'show_strongest_direction',
                'predicted_best_direction': best_base,
                'predicted_candidate_directions': candidates_base,
                'predicted_rejected_directions': candidates_base[1:],
                'clarification_questions': [],
                'confidence_band': 'medium',
                'risk_flags': ['generic_baseline'],
                'one_sentence_rationale': 'Generic baseline chooses first listed candidate and defaults to show.',
                'full_rationale': 'No route adaptation; baseline prioritizes immediate directional output.',
                'needs_human_review': True,
                'failure_annotation': {
                    'failure_owner': '',
                    'better_candidate_existed': '',
                    'clarify_should_have_happened': '',
                    'trust_risk': '',
                    'likely_student_reaction': '',
                },
                'provenance': {
                    'source_type': 'public_internet',
                    'source_origin': row.get('source', ''),
                    'source_reference': row.get('source_url', ''),
                    'capture_date': '',
                    'transformation_level': 'redacted',
                    'adjudication_status': 'needs_adjudication',
                },
            }
            f_base.write(json.dumps(baseline_obj) + '\n')

    inventory_path.write_text(json.dumps(inventory_rows, indent=2))
    error_path.write_text(json.dumps(errors, indent=2))

    print(f'Wrote {current_path}')
    print(f'Wrote {baseline_path}')
    print(f'Wrote {inventory_path}')
    print(f'Wrote {error_path}')
    print(f'Live API errors: {len(errors)}')


if __name__ == '__main__':
    main()
