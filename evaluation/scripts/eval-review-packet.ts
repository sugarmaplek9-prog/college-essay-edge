import fs from 'node:fs';
import path from 'node:path';
import {
  CASE_DIR,
  EvaluationCase,
  NormalizedComparisonOutput,
  generateReviewerPacket,
  loadCases,
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
const blind = !process.argv.includes('--labeled');

if (!runDir) {
  console.error('Missing --run-dir argument');
  process.exit(1);
}

const normalizedPath = path.join(runDir, 'normalized_results.json');
if (!fs.existsSync(normalizedPath)) {
  console.error('normalized_results.json missing. Run eval:normalize first.');
  process.exit(1);
}

const normalized = JSON.parse(fs.readFileSync(normalizedPath, 'utf-8')) as NormalizedComparisonOutput[];
const cases = loadCases(CASE_DIR) as EvaluationCase[];
const { packet, decode } = generateReviewerPacket(cases, normalized, { blind });

fs.writeFileSync(path.join(runDir, 'reviewer_packet.md'), packet, 'utf-8');
fs.writeFileSync(path.join(runDir, 'reviewer_blind_decode.json'), JSON.stringify(decode, null, 2), 'utf-8');

console.log(`Reviewer packet generated for ${runDir} (blind=${blind})`);
