const fs = require('node:fs');
const path = require('node:path');

const runDir = process.argv[2];
if (!runDir) {
  console.error('Usage: node evaluation/scripts/generate-nmi-audit.js <runDir>');
  process.exit(1);
}

const ndsResults = JSON.parse(fs.readFileSync(path.join(runDir, 'nds_results.json'), 'utf8'));
const baselineResults = new Map(
  JSON.parse(fs.readFileSync(path.join(runDir, 'baseline_results.json'), 'utf8')).map((r) => [r.case_id, r])
);
const casesById = new Map(
  fs
    .readdirSync('evaluation/cases')
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join('evaluation/cases', f), 'utf8')))
    .map((c) => [c.case_id, c])
);

const nmiCases = ndsResults.filter((r) => r.artifact_status === 'needs_more_input');

const headers = [
  'case_id',
  'difficulty',
  'tags',
  'nds_status',
  'baseline_status',
  'was_nmi_appropriate',
  'should_constrained_recommendation_have_been_possible',
  'primary_cause_of_nmi',
  'recovery_question_quality',
  'would_user_feel_helped',
  'nmi_classification',
  'reviewer_note',
];

const rows = [headers.join(',')];
for (const r of nmiCases) {
  const c = casesById.get(r.case_id);
  const b = baselineResults.get(r.case_id);
  const baselineStatus = b?.normalized_output?.status ?? '';
  rows.push(
    [
      r.case_id,
      c?.difficulty ?? '',
      `"${(c?.tags ?? []).join('|')}"`,
      r.artifact_status,
      baselineStatus,
      '',
      '',
      '',
      '',
      '',
      '',
      '""',
    ].join(',')
  );
}

const outDir = path.join(runDir, 'result_audit');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'nmi_calibration_audit_table.csv');
fs.writeFileSync(outPath, rows.join('\n'), 'utf8');

console.log(`wrote ${outPath} with ${nmiCases.length} NMI rows`);
