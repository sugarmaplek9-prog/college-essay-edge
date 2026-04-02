import fs from 'node:fs';
import path from 'node:path';
import {
  CASE_DIR,
  createManifest,
  initializeRunFolder,
  loadCases,
  runBaselineEvaluation,
} from '@/lib/ai/evaluation/pack';

async function main(): Promise<void> {
  const cases = loadCases(CASE_DIR);
  const oneCaseIdArgIndex = process.argv.indexOf('--case');
  const selectedCaseId = oneCaseIdArgIndex > -1 ? process.argv[oneCaseIdArgIndex + 1] : null;
  const selected = selectedCaseId
    ? cases.filter((c: { case_id: string }) => c.case_id === selectedCaseId)
    : cases;

  if (selected.length === 0) {
    console.error('No matching cases found.');
    process.exit(1);
  }

  const manifest = createManifest(selected.length);
  const runDir = initializeRunFolder(manifest);
  const baselineResults = await runBaselineEvaluation(selected);

  const outPath = path.join(runDir, 'baseline_results.json');
  fs.writeFileSync(outPath, JSON.stringify(baselineResults, null, 2), 'utf-8');

  const perCaseDir = path.join(runDir, 'baseline_cases');
  fs.mkdirSync(perCaseDir, { recursive: true });
  for (const row of baselineResults) {
    fs.writeFileSync(path.join(perCaseDir, `${row.case_id}.json`), JSON.stringify(row, null, 2), 'utf-8');
  }

  console.log(`Baseline evaluation complete. runDir=${runDir} cases=${selected.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
