import { describe, expect, it } from 'vitest';
import { collectBestDirectionText, run072Case } from './helpers/nds-targeted-repair-v2';

describe('072 targeted repair V2 — premium tone', () => {
  it('avoids mechanical internal jargon in surfaced recommendation language', async () => {
    for (const caseId of ['RHC-001', 'RHC-005']) {
      const { payload } = await run072Case(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      const outputText = collectBestDirectionText(payload);
      expect(outputText).not.toMatch(/faithful to the axis|interpretation is consistent|selected direction|concrete text|the strongest center is/i);
      expect(outputText).not.toMatch(/multidimensional|epistemic|stakeholder|co-constructed/i);
    }
  });
});