import fs from 'node:fs';
import path from 'node:path';
import {
  autoScoreHeadToHead,
  BaselineEvalRunRecord,
  CASE_DIR,
  generateSummary,
  NdsEvalRunRecord,
  loadCases,
  toCsvSummary,
  toMarkdownSummary,
  validateScoreRecords,
} from '@/lib/ai/evaluation/pack';

function latestRunDir(root: string): string | null {
  if (!fs.existsSync(root)) return null;
  const dirs = fs
    .readdirSync(root)
    .map((name) => path.join(root, name))
    .filter((p) => fs.statSync(p).isDirectory())
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return dirs[0] ?? null;
}

const runDirArgIndex = process.argv.indexOf('--run-dir');
const runDir =
  runDirArgIndex > -1
    ? process.argv[runDirArgIndex + 1]
    : latestRunDir(path.join(process.cwd(), 'evaluation', 'runs'));

if (!runDir) {
  console.error('Missing --run-dir argument');
  process.exit(1);
}

const ndsPath = path.join(runDir, 'nds_results.json');
const baselinePath = path.join(runDir, 'baseline_results.json');
if (!fs.existsSync(ndsPath) || !fs.existsSync(baselinePath)) {
  console.error('Required results missing. Need nds_results.json and baseline_results.json');
  process.exit(1);
}

const ndsResults = JSON.parse(fs.readFileSync(ndsPath, 'utf-8')) as NdsEvalRunRecord[];
const baselineResults = JSON.parse(fs.readFileSync(baselinePath, 'utf-8')) as BaselineEvalRunRecord[];
const cases = loadCases(CASE_DIR);

const scores = autoScoreHeadToHead(ndsResults, baselineResults);
const scoreErrors = validateScoreRecords(scores);
if (scoreErrors.length > 0) {
  console.error(`Score schema validation failed: ${scoreErrors.join(' | ')}`);
  process.exit(1);
}

const summary = generateSummary(cases, scores, ndsResults, baselineResults);

fs.writeFileSync(path.join(runDir, 'scores.json'), JSON.stringify(scores, null, 2), 'utf-8');
fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');
fs.writeFileSync(path.join(runDir, 'summary.csv'), toCsvSummary(summary), 'utf-8');
fs.writeFileSync(path.join(runDir, 'summary.md'), toMarkdownSummary(summary), 'utf-8');

console.log(`Summary generated for ${runDir}`);
