import fs from 'node:fs';
import path from 'node:path';
import {
  CASE_DIR,
  listCaseFiles,
  loadCases,
  validateEvaluationCase,
} from '@/lib/ai/evaluation/pack';

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const files = listCaseFiles(CASE_DIR);
if (files.length === 0) {
  fail('No case files found in evaluation/cases');
}

const seen = new Set<string>();
let errorCount = 0;

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf-8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error(`Invalid JSON: ${file}`);
    errorCount += 1;
    continue;
  }

  const errors = validateEvaluationCase(parsed);
  if (errors.length > 0) {
    console.error(`${path.basename(file)} failed: ${errors.join(' | ')}`);
    errorCount += 1;
    continue;
  }

  const caseId = (parsed as { case_id: string }).case_id;
  if (seen.has(caseId)) {
    console.error(`Duplicate case_id detected: ${caseId}`);
    errorCount += 1;
  }
  seen.add(caseId);
}

if (errorCount > 0) {
  fail(`Validation failed with ${errorCount} error(s).`);
}

const cases = loadCases(CASE_DIR);
const weak = cases.filter((c: { difficulty: string }) => c.difficulty === 'weak').length;
const medium = cases.filter((c: { difficulty: string }) => c.difficulty === 'medium').length;
const strong = cases.filter((c: { difficulty: string }) => c.difficulty === 'strong').length;

if (cases.length < 30) {
  fail(`Validation failed: expected at least 30 cases, found ${cases.length}`);
}

if (weak !== 10 || medium !== 10 || strong !== 10) {
  fail(`Validation failed: expected weak=10 medium=10 strong=10, got weak=${weak} medium=${medium} strong=${strong}`);
}

const countTag = (tag: string): number => cases.filter((c: { tags: string[] }) => c.tags.includes(tag)).length;
const requiredCoverage: Array<{ tag: string; min: number }> = [
  { tag: 'messy_notes', min: 5 },
  { tag: 'draft_present', min: 5 },
  { tag: 'school_sensitive', min: 5 },
  { tag: 'conflicting_signals', min: 5 },
  { tag: 'resume_list', min: 5 },
  { tag: 'red_team', min: 8 },
];

const coverageErrors = requiredCoverage
  .map(({ tag, min }) => ({ tag, min, count: countTag(tag) }))
  .filter((row) => row.count < row.min);

if (coverageErrors.length > 0) {
  fail(
    `Validation failed: coverage thresholds unmet -> ${coverageErrors
      .map((row) => `${row.tag}=${row.count} (min ${row.min})`)
      .join(', ')}`
  );
}

console.log(`Validation passed. total=${cases.length} weak=${weak} medium=${medium} strong=${strong}`);
console.log(
  [
    `messy_notes=${countTag('messy_notes')}`,
    `draft_present=${countTag('draft_present')}`,
    `school_sensitive=${countTag('school_sensitive')}`,
    `conflicting_signals=${countTag('conflicting_signals')}`,
    `resume_list=${countTag('resume_list')}`,
    `red_team=${countTag('red_team')}`,
  ].join(' ')
);
