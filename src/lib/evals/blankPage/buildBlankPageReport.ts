import type { BlankPagePostAnswerRoute } from '@/types/intake';
import type { BlankPageEvalCase } from '@/lib/evals/schema/blankPageCaseSchema';
import {
  buildBlankPageSourceCompositionReport,
  type BlankPageSourceCompositionReport,
} from '@/lib/evals/blankPage/sourceCompositionReport';

export interface BlankPageRouteDistributionReport {
  assignment_count_by_mode: Record<string, number>;
  post_answer_route_counts: Record<BlankPagePostAnswerRoute, number>;
  conversion_to_direction_light_rate: number;
  second_recovery_question_rate: number;
  clarification_rate: number;
  too_thin_fallback_rate: number;
  abandonment_rate: number;
}

export interface BlankPageScoreReport {
  total_cases: number;
  mode_match_rate: number;
  route_match_rate: number;
  trust_usefulness_summary: {
    pass: boolean;
    notes: string;
  };
}

export interface BlankPageEvaluationReport {
  generated_at: string;
  score_report: BlankPageScoreReport;
  route_distribution_report: BlankPageRouteDistributionReport;
  source_composition_report: BlankPageSourceCompositionReport;
}

export function buildBlankPageReport(input: {
  cases: BlankPageEvalCase[];
  abandonmentCount?: number;
}): BlankPageEvaluationReport {
  const cases = input.cases;
  const total = cases.length;

  const modeMatches = cases.filter((item) => item.expected_mode === item.observed_mode).length;
  const routeMatches = cases.filter((item) => item.expected_route === item.observed_route).length;

  const assignmentCountByMode = cases.reduce<Record<string, number>>((acc, item) => {
    acc[item.observed_mode] = (acc[item.observed_mode] ?? 0) + 1;
    return acc;
  }, {});

  const routeCounts: Record<BlankPagePostAnswerRoute, number> = {
    direction_light: 0,
    second_recovery_question: 0,
    clarification: 0,
    too_thin_to_recover: 0,
  };

  for (const item of cases) {
    routeCounts[item.observed_route] += 1;
  }

  const safeRate = (value: number): number => (total === 0 ? 0 : value / total);

  const scoreReport: BlankPageScoreReport = {
    total_cases: total,
    mode_match_rate: safeRate(modeMatches),
    route_match_rate: safeRate(routeMatches),
    trust_usefulness_summary: {
      pass: safeRate(routeMatches) >= 0.75,
      notes:
        safeRate(routeMatches) >= 0.75
          ? 'Route agreement is within expected trust bounds.'
          : 'Route agreement is below trust threshold and requires review.',
    },
  };

  const routeDistributionReport: BlankPageRouteDistributionReport = {
    assignment_count_by_mode: assignmentCountByMode,
    post_answer_route_counts: routeCounts,
    conversion_to_direction_light_rate: safeRate(routeCounts.direction_light),
    second_recovery_question_rate: safeRate(routeCounts.second_recovery_question),
    clarification_rate: safeRate(routeCounts.clarification),
    too_thin_fallback_rate: safeRate(routeCounts.too_thin_to_recover),
    abandonment_rate: safeRate(input.abandonmentCount ?? 0),
  };

  return {
    generated_at: new Date().toISOString(),
    score_report: scoreReport,
    route_distribution_report: routeDistributionReport,
    source_composition_report: buildBlankPageSourceCompositionReport(cases),
  };
}
