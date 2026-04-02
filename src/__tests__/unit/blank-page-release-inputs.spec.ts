import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateBlankPageReleaseInputs } from '@/lib/release/validateBlankPageReleaseInputs';

describe('validateBlankPageReleaseInputs', () => {
  it('reports incomplete when required artifacts are missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-release-missing-'));
    const result = validateBlankPageReleaseInputs({
      releaseId: 'blank_page_phase6_rc1',
      repositoryRoot: tmp,
    });

    expect(result.is_complete).toBe(false);
    expect(result.missing_files.length).toBeGreaterThan(0);
  });

  it('reports complete when all required artifacts exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bp-release-complete-'));

    const required = [
      'docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_ROLLOUT_NOTE_V1.md',
      'docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_VALIDATION_RUN_V1.md',
      'docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_ROLLBACK_CONDITIONS_V1.md',
      'docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_6_RELEASE_REVIEW_PACKET_V1.md',
      'docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_5_OBSERVABILITY_REVIEW_PACKET_V1.md',
      'evaluation_outputs/blank_page_phase5_eval_v1/blank-page-score-report.json',
      'evaluation_outputs/blank_page_phase5_eval_v1/blank-page-source-composition-report.json',
      'evaluation_outputs/blank_page_phase5_eval_v1/blank-page-route-distribution-report.json',
      'evaluation_outputs/blank_page_phase5_eval_v1/blank-page-phase5-observability-review-packet.json',
    ];

    for (const relativePath of required) {
      const absolutePath = path.join(tmp, relativePath);
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, '{}', 'utf-8');
    }

    const result = validateBlankPageReleaseInputs({
      releaseId: 'blank_page_phase6_rc1',
      repositoryRoot: tmp,
    });

    expect(result.is_complete).toBe(true);
    expect(result.missing_files).toHaveLength(0);
  });
});
