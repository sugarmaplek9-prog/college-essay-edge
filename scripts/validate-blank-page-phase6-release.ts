import fs from 'node:fs';
import path from 'node:path';
import { validateBlankPageReleaseInputs } from '@/lib/release/validateBlankPageReleaseInputs';

const releaseId = process.env.BLANK_PAGE_RELEASE_ID ?? 'blank_page_phase6_rc2_2026-03-18';
const result = validateBlankPageReleaseInputs({
  releaseId,
  repositoryRoot: process.cwd(),
});

const outputDir = path.resolve(process.cwd(), 'evaluation_outputs', 'blank_page_phase6_release_validation_v1');
fs.mkdirSync(outputDir, { recursive: true });

const outputPath = path.join(outputDir, 'blank-page-phase6-release-input-validation.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify({ outputPath, result }, null, 2));

if (!result.is_complete) {
  process.exitCode = 1;
}
