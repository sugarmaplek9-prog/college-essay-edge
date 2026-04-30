import { describe, expect, it } from 'vitest';
import { run072Case } from './helpers/nds-targeted-repair-v2';

describe('072 targeted repair V2 — admissions judgment', () => {
  it('explains the winner as differentiated applicant value, not just topic summary', async () => {
    for (const caseId of ['RHC-001', 'RHC-004', 'RHC-005']) {
      const { payload } = await run072Case(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      const reveal = payload.best_direction.what_it_reveals_about_the_student.toLowerCase();
      expect(reveal).toMatch(/reader|judgment|trust|responsibility|listening|pressure|differentiated|applicant/);
      expect(reveal).toMatch(/shows|reveals|lets/);
      expect(reveal).not.toMatch(/\bgrowth\b|\bresilience\b|\bpassion\b/);
    }
  });
});