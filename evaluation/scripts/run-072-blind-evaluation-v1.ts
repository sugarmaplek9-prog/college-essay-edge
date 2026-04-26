import fs from 'node:fs';
import path from 'node:path';
import {
  autoScoreHeadToHead,
  createManifest,
  generateReviewerPacket,
  generateSummary,
  normalizeResults,
  persistRunArtifacts,
  runBaselineEvaluation,
  runNdsEvaluation,
  validateEvaluationCase,
  validateScoreRecords,
} from '@/lib/ai/evaluation/pack';
import type { EvaluationCase, HeadToHeadScoreRecord, NormalizedComparisonOutput } from '@/lib/ai/evaluation/pack';

const OUTPUT_DIR = path.join(
  process.cwd(),
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  'blind-evaluation-run-v1'
);
const INPUT_PATH = path.join(OUTPUT_DIR, 'input', '072_blind_frozen_input_v1.json');
const PROTECTED_DIR = path.join(OUTPUT_DIR, 'protected');
const FOUNDER_PACKET_PATH = path.join(OUTPUT_DIR, 'founder_human_review_packet_v1.md');

const EXPECTED_BLIND_IDS = [
  'NSB-FS-005',
  'NSB-FS-006',
  'NSB-FS-013',
  'NSB-FS-014',
  'NSB-FS-015',
  'NSB-FS-016',
  'NSB-FS-020',
  'NSB-FS-021',
  'NSB-FS-022',
].sort();

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function loadBlindCases(): EvaluationCase[] {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Missing frozen blind input artifact: ${INPUT_PATH}`);
  }

  const cases = readJson<EvaluationCase[]>(INPUT_PATH);
  if (!Array.isArray(cases)) {
    throw new Error('Frozen blind input artifact must be an array of evaluation cases.');
  }

  const ids = cases.map((caseRecord) => caseRecord.case_id).sort();
  const expected = EXPECTED_BLIND_IDS.join('|');
  const actual = ids.join('|');
  if (expected !== actual) {
    throw new Error(`Frozen blind input inventory mismatch. expected=${expected} actual=${actual}`);
  }

  const seen = new Set<string>();
  for (const caseRecord of cases) {
    if (seen.has(caseRecord.case_id)) {
      throw new Error(`Duplicate blind case id in input artifact: ${caseRecord.case_id}`);
    }
    seen.add(caseRecord.case_id);

    const errors = validateEvaluationCase(caseRecord);
    if (errors.length > 0) {
      throw new Error(`Blind case ${caseRecord.case_id} failed validation: ${errors.join('; ')}`);
    }
  }

  return cases;
}

function totalsForScore(record: HeadToHeadScoreRecord): { nds: number; baseline: number } {
  const values = Object.values(record.scores);
  return {
    nds: values.reduce((sum, row) => sum + row.nds, 0),
    baseline: values.reduce((sum, row) => sum + row.baseline, 0),
  };
}

function findOutput(
  normalized: NormalizedComparisonOutput[],
  caseId: string,
  system: 'nds_internal' | 'baseline_free_ai'
): NormalizedComparisonOutput {
  const match = normalized.find((row) => row.case_id === caseId && row.system === system);
  if (!match) {
    throw new Error(`Missing normalized ${system} output for ${caseId}`);
  }
  return match;
}

function buildFounderPacket(
  cases: EvaluationCase[],
  normalized: NormalizedComparisonOutput[],
  scores: HeadToHeadScoreRecord[]
): string {
  const lines: string[] = [];
  lines.push('# 072 Founder Human Review Packet — Blind Evaluation Run V1');
  lines.push('');
  lines.push('- status: post-run founder review packet');
  lines.push(`- blind packet path: ${path.relative(process.cwd(), path.join(OUTPUT_DIR, 'reviewer_packet.md'))}`);
  lines.push(`- protected decode path: ${path.relative(process.cwd(), path.join(PROTECTED_DIR, 'reviewer_blind_decode.json'))}`);
  lines.push(`- scoring path: ${path.relative(process.cwd(), path.join(OUTPUT_DIR, 'scores.json'))}`);
  lines.push('');
  lines.push('This packet keeps decode material separate. Use the protected decode only when the review protocol explicitly allows it.');
  lines.push('');

  for (const caseRecord of cases) {
    const nds = findOutput(normalized, caseRecord.case_id, 'nds_internal');
    const baseline = findOutput(normalized, caseRecord.case_id, 'baseline_free_ai');
    const score = scores.find((row) => row.case_id === caseRecord.case_id);
    const scoreTotals = score ? totalsForScore(score) : null;

    lines.push(`## ${caseRecord.case_id} — ${caseRecord.label}`);
    lines.push('');
    lines.push('### Student input / source-safe case summary');
    for (const entry of caseRecord.story_entries) {
      lines.push(`- ${entry.text}`);
    }
    lines.push('');
    lines.push('### NDS output');
    lines.push('```json');
    lines.push(JSON.stringify(nds, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### Generic AI baseline output');
    lines.push('```json');
    lines.push(JSON.stringify(baseline, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### Judge / scoring result');
    if (score) {
      lines.push(`- nds_total_points: ${scoreTotals?.nds ?? 0}`);
      lines.push(`- baseline_total_points: ${scoreTotals?.baseline ?? 0}`);
      lines.push(`- nds_clearly_better_than_baseline: ${score.binary_judgment.nds_clearly_better_than_baseline}`);
      lines.push(`- nds_strength_note: ${score.reviewer_notes.nds_strength}`);
      lines.push(`- baseline_failure_note: ${score.reviewer_notes.baseline_failure}`);
      lines.push(`- scoring_comment: ${score.reviewer_notes.important_comment}`);
    } else {
      lines.push('- scoring result missing');
    }
    lines.push('');
    lines.push('### Reviewer notes');
    lines.push('- ');
    lines.push('');
    lines.push('### Founder decision');
    lines.push('- ');
    lines.push('');
  }

  return lines.join('\n');
}

async function main(): Promise<void> {
  const startTime = new Date().toISOString();
  if (fs.existsSync(path.join(OUTPUT_DIR, 'summary.json'))) {
    throw new Error(`Output directory already contains run artifacts. Abort to avoid undocumented rerun: ${OUTPUT_DIR}`);
  }

  ensureDir(OUTPUT_DIR);
  ensureDir(PROTECTED_DIR);

  const cases = loadBlindCases();
  const manifest = createManifest(cases.length);
  const runDir = OUTPUT_DIR;
  writeJson(path.join(runDir, 'manifest.json'), manifest);

  const ndsResults = await runNdsEvaluation(cases);
  const baselineResults = await runBaselineEvaluation(cases);
  const normalized = normalizeResults(ndsResults, baselineResults);
  const scores = autoScoreHeadToHead(ndsResults, baselineResults);
  const scoreErrors = validateScoreRecords(scores);
  if (scoreErrors.length > 0) {
    throw new Error(`Score schema validation failed: ${scoreErrors.join(' | ')}`);
  }

  const summary = generateSummary(cases, scores, ndsResults, baselineResults);
  const { packet, decode } = generateReviewerPacket(cases, normalized, { blind: true });

  persistRunArtifacts({
    runDir,
    ndsResults,
    baselineResults,
    normalizedResults: normalized,
    scores,
    summary,
    reviewerPacket: packet,
    reviewerDecode: decode,
  });

  const decodePath = path.join(runDir, 'reviewer_blind_decode.json');
  if (fs.existsSync(decodePath)) {
    fs.renameSync(decodePath, path.join(PROTECTED_DIR, 'reviewer_blind_decode.json'));
  }

  fs.writeFileSync(FOUNDER_PACKET_PATH, buildFounderPacket(cases, normalized, scores), 'utf8');

  writeJson(path.join(runDir, 'execution_metadata.json'), {
    execution_started_at: startTime,
    execution_finished_at: new Date().toISOString(),
    approved_manifest: 'specs/072-real-human-corpus-expansion/split-manifest.yaml',
    input_artifact: path.relative(process.cwd(), INPUT_PATH),
    protected_decode_path: path.relative(process.cwd(), path.join(PROTECTED_DIR, 'reviewer_blind_decode.json')),
    output_dir: path.relative(process.cwd(), OUTPUT_DIR),
    case_count: cases.length,
    blind_case_ids: EXPECTED_BLIND_IDS,
  });

  console.log(`072 blind evaluation run complete. outputDir=${OUTPUT_DIR} cases=${cases.length}`);
}

main().catch((error) => {
  console.error('[072-blind-evaluation-run-v1] fatal:', error);
  process.exit(1);
});