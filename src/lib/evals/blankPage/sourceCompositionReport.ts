import type { BlankPageEvalCase, BlankPageEvalSourceType } from '@/lib/evals/schema/blankPageCaseSchema';

export interface BlankPageSourceCompositionReport {
  total_case_count: number;
  by_source_type: Record<BlankPageEvalSourceType, number>;
  real_input_case_count: number;
  real_input_percent: number;
  synthetic_case_count: number;
  synthetic_percent: number;
  threshold_required_percent: number;
  threshold_passed: boolean;
}

const REAL_INPUT_THRESHOLD = 0.7;

export function buildBlankPageSourceCompositionReport(
  cases: BlankPageEvalCase[]
): BlankPageSourceCompositionReport {
  const bySource: Record<BlankPageEvalSourceType, number> = {
    public_internet: 0,
    anonymized_product_input: 0,
    synthetic: 0,
    legacy_synthetic: 0,
  };

  for (const item of cases) {
    bySource[item.source_type] += 1;
  }

  const total = cases.length;
  const realInputCount = bySource.public_internet + bySource.anonymized_product_input;
  const syntheticCount = bySource.synthetic + bySource.legacy_synthetic;

  const realInputPercent = total === 0 ? 0 : realInputCount / total;
  const syntheticPercent = total === 0 ? 0 : syntheticCount / total;

  return {
    total_case_count: total,
    by_source_type: bySource,
    real_input_case_count: realInputCount,
    real_input_percent: realInputPercent,
    synthetic_case_count: syntheticCount,
    synthetic_percent: syntheticPercent,
    threshold_required_percent: REAL_INPUT_THRESHOLD,
    threshold_passed: realInputPercent >= REAL_INPUT_THRESHOLD,
  };
}
