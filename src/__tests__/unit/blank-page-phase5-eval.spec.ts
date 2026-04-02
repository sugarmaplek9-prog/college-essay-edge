import { describe, expect, it } from 'vitest';
import {
  validateBlankPageEvalCase,
  type BlankPageEvalCase,
} from '@/lib/evals/schema/blankPageCaseSchema';
import { buildBlankPageSourceCompositionReport } from '@/lib/evals/blankPage/sourceCompositionReport';
import { runBlankPageEval } from '@/lib/evals/blankPage/runBlankPageEval';

const baseCase: BlankPageEvalCase = {
  case_id: 'bp_case_001',
  prompt: 'I have no idea what to write about.',
  expected_mode: 'blank_page_discovery',
  observed_mode: 'blank_page_discovery',
  expected_route: 'second_recovery_question',
  observed_route: 'second_recovery_question',
  source_type: 'anonymized_product_input',
  source_origin: 'session_replay',
  source_reference: 'session_123',
  capture_date: '2026-03-15T10:00:00.000Z',
  transformation_level: 'lightly_normalized',
  adjudication_status: 'approved',
};

describe('blank-page phase 5 eval infrastructure', () => {
  it('validates required provenance fields', () => {
    const valid = validateBlankPageEvalCase(baseCase);
    expect(valid.isValid).toBe(true);

    const invalid = validateBlankPageEvalCase({
      ...baseCase,
      source_reference: '',
      source_type: 'unknown_source',
    });

    expect(invalid.isValid).toBe(false);
    expect(invalid.errors.some((e) => e.includes('source_reference'))).toBe(true);
    expect(invalid.errors.some((e) => e.includes('source_type'))).toBe(true);
  });

  it('enforces real-input source composition threshold at report level', () => {
    const cases: BlankPageEvalCase[] = [
      baseCase,
      {
        ...baseCase,
        case_id: 'bp_case_002',
        source_type: 'public_internet',
      },
      {
        ...baseCase,
        case_id: 'bp_case_003',
        source_type: 'legacy_synthetic',
      },
    ];

    const report = buildBlankPageSourceCompositionReport(cases);
    expect(report.total_case_count).toBe(3);
    expect(report.real_input_case_count).toBe(2);
    expect(report.threshold_passed).toBe(false);
  });

  it('builds score/source/route outputs from valid cases and isolates invalid cases', () => {
    const result = runBlankPageEval({
      cases: [
        baseCase,
        {
          ...baseCase,
          case_id: 'bp_case_002',
          expected_route: 'direction_light',
          observed_route: 'direction_light',
          source_type: 'public_internet',
        },
        {
          ...baseCase,
          case_id: '',
        },
      ],
      abandonmentCount: 1,
    });

    expect(result.cases).toHaveLength(2);
    expect(result.invalid_cases).toHaveLength(1);
    expect(result.report.score_report.total_cases).toBe(2);
    expect(result.report.route_distribution_report.post_answer_route_counts.direction_light).toBe(1);
    expect(result.report.route_distribution_report.abandonment_rate).toBe(0.5);
  });
});
