import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectBestDirectionText,
  computeSourceOverlap,
  run072Case,
} from './helpers/nds-targeted-repair-v2';

const MODULE_EXECUTOR_PATH = path.join(
  process.cwd(),
  'src',
  'lib',
  'ai',
  'modules',
  'narrative-direction-selection',
  'module-executor.ts'
);

describe('072 targeted output repair — V2 guardrails', () => {
  it('keeps runtime logic free of frozen-case ids and packet fingerprints', () => {
    const source = fs.readFileSync(MODULE_EXECUTOR_PATH, 'utf8');

    expect(source).not.toMatch(/RHC-026|RHC-028|RHC-030|RHC-001|RHC-004|RHC-005/);
    expect(source).not.toMatch(/072_real_human_visible_bootstrap_v1|072_real_human_visible_medium_weak_v1/);
    expect(source).not.toMatch(/CollegeEssays topic dilemma: absent father\/alcoholism vs chronic migraines/);
  });

  it('keeps representative 072 outputs grounded in case-specific source language', async () => {
    for (const caseId of ['RHC-001', 'RHC-026', 'RHC-030']) {
      const { caseRecord, payload } = await run072Case(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      const outputText = collectBestDirectionText(payload);
      const overlap = computeSourceOverlap(caseRecord, outputText);

      expect(overlap.length).toBeGreaterThanOrEqual(2);
      expect(outputText).not.toMatch(/the strongest center is|faithful to the axis|interpretation is consistent/i);
    }
  });
});