import fs from 'node:fs';
import path from 'node:path';
import {
  validateBlankPageEvalCase,
  type BlankPageEvalCase,
} from '@/lib/evals/schema/blankPageCaseSchema';
import { buildBlankPageReport, type BlankPageEvaluationReport } from '@/lib/evals/blankPage/buildBlankPageReport';

export interface RunBlankPageEvalResult {
  report: BlankPageEvaluationReport;
  cases: BlankPageEvalCase[];
  invalid_cases: Array<{ index: number; errors: string[] }>;
}

export function runBlankPageEval(input: {
  cases: unknown[];
  abandonmentCount?: number;
}): RunBlankPageEvalResult {
  const validCases: BlankPageEvalCase[] = [];
  const invalidCases: Array<{ index: number; errors: string[] }> = [];

  input.cases.forEach((item, index) => {
    const validation = validateBlankPageEvalCase(item);
    if (validation.isValid) {
      validCases.push(item as BlankPageEvalCase);
    } else {
      invalidCases.push({ index, errors: validation.errors });
    }
  });

  const report = buildBlankPageReport({
    cases: validCases,
    abandonmentCount: input.abandonmentCount,
  });

  return {
    report,
    cases: validCases,
    invalid_cases: invalidCases,
  };
}

export function writeBlankPageEvalArtifacts(input: {
  outputDir: string;
  result: RunBlankPageEvalResult;
}): void {
  fs.mkdirSync(input.outputDir, { recursive: true });

  const scorePath = path.join(input.outputDir, 'blank-page-score-report.json');
  const sourcePath = path.join(input.outputDir, 'blank-page-source-composition-report.json');
  const routePath = path.join(input.outputDir, 'blank-page-route-distribution-report.json');
  const packetPath = path.join(input.outputDir, 'blank-page-phase5-observability-review-packet.json');

  fs.writeFileSync(scorePath, JSON.stringify(input.result.report.score_report, null, 2));
  fs.writeFileSync(sourcePath, JSON.stringify(input.result.report.source_composition_report, null, 2));
  fs.writeFileSync(routePath, JSON.stringify(input.result.report.route_distribution_report, null, 2));
  fs.writeFileSync(
    packetPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        invalid_case_count: input.result.invalid_cases.length,
        invalid_cases: input.result.invalid_cases,
        summary: input.result.report,
      },
      null,
      2
    )
  );
}
