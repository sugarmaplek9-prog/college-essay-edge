import { describe, expect, it } from 'vitest';
import { run072Case } from './helpers/nds-targeted-repair-v2';

describe('072 targeted repair V2 — stronger-vs-obvious contrast', () => {
  it('explains what the obvious version would do and what the stronger version lets the reader see', async () => {
    for (const caseId of ['RHC-028', 'RHC-030']) {
      const { payload } = await run072Case(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      const contrast = payload.best_direction.why_it_beats_the_obvious_angle;
      expect(contrast).toMatch(/would|instead|lets the reader|leave the reader|watch/i);
      expect(contrast).not.toMatch(/^.*\bmore specific\b.*$/i);
      expect(contrast.toLowerCase()).toContain('reader');
      expect(payload.depth_signals.obvious_but_weaker_angle).toBeTruthy();
    }
  });
});