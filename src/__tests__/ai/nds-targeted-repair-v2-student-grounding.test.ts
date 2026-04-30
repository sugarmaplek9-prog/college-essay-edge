import { describe, expect, it } from 'vitest';
import {
  collectBestDirectionText,
  computeSourceOverlap,
  run072Case,
} from './helpers/nds-targeted-repair-v2';

describe('072 targeted repair V2 — student-specific grounding', () => {
  it('retains lexical grounding to the student material across target and guardrail cases', async () => {
    for (const caseId of ['RHC-026', 'RHC-027', 'RHC-029', 'RHC-005']) {
      const { caseRecord, payload } = await run072Case(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      const overlap = computeSourceOverlap(caseRecord, collectBestDirectionText(payload));
      expect(overlap.length).toBeGreaterThanOrEqual(2);
      expect(payload.evidence_anchors.length).toBeGreaterThan(0);
    }
  });
});