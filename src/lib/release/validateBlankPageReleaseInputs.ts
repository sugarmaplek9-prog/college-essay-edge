import fs from 'node:fs';
import path from 'node:path';

export interface BlankPageReleaseInputValidationResult {
  release_id: string;
  checked_at: string;
  required_files: string[];
  missing_files: string[];
  is_complete: boolean;
}

export function validateBlankPageReleaseInputs(input: {
  releaseId: string;
  repositoryRoot?: string;
}): BlankPageReleaseInputValidationResult {
  const repoRoot = input.repositoryRoot ?? process.cwd();

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

  const missing = required.filter((relativePath) => {
    const absolutePath = path.join(repoRoot, relativePath);
    return !fs.existsSync(absolutePath);
  });

  return {
    release_id: input.releaseId,
    checked_at: new Date().toISOString(),
    required_files: required,
    missing_files: missing,
    is_complete: missing.length === 0,
  };
}
