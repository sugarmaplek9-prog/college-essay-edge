import fs from 'node:fs';
import path from 'node:path';
import {
  BaselineEvalRunRecord,
  NdsEvalRunRecord,
  normalizeResults,
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
  console.error('Required result files are missing in run dir');
  process.exit(1);
}

const ndsResults = JSON.parse(fs.readFileSync(ndsPath, 'utf-8')) as NdsEvalRunRecord[];
const baselineResults = JSON.parse(fs.readFileSync(baselinePath, 'utf-8')) as BaselineEvalRunRecord[];

const normalized = normalizeResults(ndsResults, baselineResults);
fs.writeFileSync(path.join(runDir, 'normalized_results.json'), JSON.stringify(normalized, null, 2), 'utf-8');

console.log(`Normalization complete for ${runDir}`);
