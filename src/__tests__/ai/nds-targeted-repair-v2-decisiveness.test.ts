import { describe, expect, it } from 'vitest';
import { run072Case } from './helpers/nds-targeted-repair-v2';

const HEDGE_PATTERN = /\b(could be|might be|maybe|perhaps|one option|possible direction|plausible direction|you could|you might)\b/i;

describe('072 targeted repair V2 — decisiveness', () => {
  it('keeps successful recommendations clearly primary instead of brainstorm-like', async () => {
    for (const caseId of ['RHC-001', 'RHC-004']) {
      const { payload } = await run072Case(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      expect(payload.route_decision).toBe('show_strongest_direction');
      expect(payload.best_direction.core_claim).not.toMatch(HEDGE_PATTERN);
      expect(payload.best_direction.why_this_is_the_real_story).not.toMatch(HEDGE_PATTERN);
      expect(payload.why_this_direction ?? '').not.toMatch(HEDGE_PATTERN);
      expect(payload.alternatives.length).toBeGreaterThanOrEqual(2);
      expect(payload.best_direction.angle_title).not.toBe(payload.alternatives[0]?.angle_title);
    }
  });
});