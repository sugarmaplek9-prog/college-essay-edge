import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import { validateNdsOutput } from '@/lib/ai/modules/narrative-direction-selection/validator';
import {
  buildFreeAiBaselinePayload,
  scoreNdsPayload,
} from '@/lib/ai/evaluation/nds-evaluation';
import { NDS_EVAL_CASES } from './fixtures/nds-eval-cases';
import type { NdsPayload } from '@/types/ai';

function toPayload(raw: Record<string, unknown>): NdsPayload {
  return raw as unknown as NdsPayload;
}

describe('NDS evaluation harness vs free AI baseline', () => {
  it('produces comparative scoring output and beats free baseline on average', async () => {
    const caseResults: Array<{
      case_id: string;
      label: string;
      mode: string;
      nds_score: number;
      baseline_score: number;
      delta: number;
      nds_decision: string;
      baseline_decision: string;
    }> = [];

    for (const testCase of NDS_EVAL_CASES) {
      const contextPack = buildNdsNormalizedContextPack(testCase.sources);
      const readiness = evaluateNdsReadiness(contextPack);

      const ndsOutput = await executeNdsModule({
        run_id: `eval-${testCase.id}`,
        module_key: 'narrative_direction_selection',
        execution_mode: readiness.execution_mode,
        context_pack: contextPack,
        module_versions: {
          prompt_version: 'v1',
          schema_version: 'v1',
          validator_version: 'v1',
        },
      });

      const baselinePayload = buildFreeAiBaselinePayload(
        contextPack,
        readiness.execution_mode
      );

      const ndsPayload = toPayload(ndsOutput.candidate_payload);
      const ndsValidation = validateNdsOutput(ndsOutput.candidate_payload);
      const baselineValidation = validateNdsOutput(
        baselinePayload as unknown as Record<string, unknown>
      );

      const ndsScore = scoreNdsPayload(ndsPayload);
      const baselineScore = scoreNdsPayload(baselinePayload);
      const delta = Math.round((ndsScore.total - baselineScore.total) * 10) / 10;

      caseResults.push({
        case_id: testCase.id,
        label: testCase.label,
        mode: readiness.execution_mode,
        nds_score: ndsScore.total,
        baseline_score: baselineScore.total,
        delta,
        nds_decision: ndsValidation.decision,
        baseline_decision: baselineValidation.decision,
      });
    }

    const ndsAvg =
      Math.round(
        (caseResults.reduce((acc, item) => acc + item.nds_score, 0) /
          caseResults.length) *
          10
      ) / 10;

    const baselineAvg =
      Math.round(
        (caseResults.reduce((acc, item) => acc + item.baseline_score, 0) /
          caseResults.length) *
          10
      ) / 10;

    const avgDelta = Math.round((ndsAvg - baselineAvg) * 10) / 10;

    const summary = {
      generated_at: new Date().toISOString(),
      module: 'narrative_direction_selection',
      case_count: caseResults.length,
      nds_average_score: ndsAvg,
      baseline_average_score: baselineAvg,
      average_delta_vs_baseline: avgDelta,
      case_results: caseResults,
    };

    const outputDir = path.join(process.cwd(), 'evaluation_outputs');
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'nds_eval_results.json');
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');

    // Emit proof in test output for review logs
    console.log('NDS_EVAL_SUMMARY', JSON.stringify(summary));

    expect(caseResults.length).toBeGreaterThanOrEqual(5);
    expect(ndsAvg).toBeGreaterThan(baselineAvg);
    expect(avgDelta).toBeGreaterThanOrEqual(1.0);

    const blockedNds = caseResults.filter((r) => r.nds_decision === 'block');
    expect(blockedNds).toHaveLength(0);
  });
});
