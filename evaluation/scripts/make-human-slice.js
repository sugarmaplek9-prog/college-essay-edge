const fs = require('node:fs');

const runDir = process.argv[2];
if (!runDir) {
  console.error('Usage: node evaluation/scripts/make-human-slice.js <runDir>');
  process.exit(1);
}

const cases = fs
  .readdirSync('evaluation/cases')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(`evaluation/cases/${f}`, 'utf8')));

const normalized = JSON.parse(fs.readFileSync(`${runDir}/normalized_results.json`, 'utf8'));
const decode = JSON.parse(fs.readFileSync(`${runDir}/reviewer_blind_decode.json`, 'utf8'));

const byCaseMeta = new Map(cases.map((c) => [c.case_id, c]));
const byCaseOut = new Map();
for (const row of normalized) {
  const cur = byCaseOut.get(row.case_id) || {};
  if (row.system === 'nds_internal') cur.nds = row;
  if (row.system === 'baseline_free_ai') cur.baseline = row;
  byCaseOut.set(row.case_id, cur);
}

const selected = [
  'case_021',
  'case_024',
  'case_027',
  'case_011',
  'case_014',
  'case_017',
  'case_002',
  'case_003',
  'case_006',
  'case_008',
];

const lines = [
  '# Human Blind Review Slice (10 cases)',
  'mode: blind',
  '',
  `selected_case_ids: ${selected.join(', ')}`,
  '',
];

for (const id of selected) {
  const c = byCaseMeta.get(id);
  const pair = byCaseOut.get(id);
  const map = decode[id];
  if (!c || !pair || !map) continue;

  const A = map.A === 'nds_internal' ? pair.nds : pair.baseline;
  const B = map.B === 'nds_internal' ? pair.nds : pair.baseline;

  lines.push(`## ${id} — ${c.label}`);
  lines.push(`difficulty: ${c.difficulty}`);
  lines.push(`tags: ${c.tags.join(', ')}`);
  lines.push('');
  lines.push('### Student input packet');
  lines.push(`stories: ${c.story_entries.length}`);
  lines.push(`draft present: ${Boolean(c.current_draft && c.current_draft.text)}`);
  lines.push(
    `school context: ${
      c.school_context && c.school_context.target_school ? c.school_context.target_school : 'none'
    }`
  );
  lines.push('');
  lines.push('### Output A');
  lines.push(JSON.stringify(A, null, 2));
  lines.push('');
  lines.push('### Output B');
  lines.push(JSON.stringify(B, null, 2));
  lines.push('');
  lines.push('### Human score form');
  lines.push('- divergence_quality (1-5 each)');
  lines.push('- conviction_quality (1-5 each)');
  lines.push('- evidence_grounding (1-5 each)');
  lines.push('- next_step_usefulness (1-5 each)');
  lines.push('- substitution_risk (1-5 each)');
  lines.push('- student_dignity_tone (1-5 each)');
  lines.push('- product_sharpness (1-5 each)');
  lines.push('- nds_clearly_better_than_baseline (true/false)');
  lines.push('- nds_strength');
  lines.push('- baseline_failure');
  lines.push('- important_comment');
  lines.push('');
}

fs.writeFileSync(`${runDir}/human_review_slice_10.packet.md`, lines.join('\n'), 'utf8');
fs.writeFileSync(
  `${runDir}/human_review_slice_10.case_ids.json`,
  JSON.stringify({ selected_case_ids: selected }, null, 2),
  'utf8'
);

const decodeSubset = {};
for (const id of selected) decodeSubset[id] = decode[id];
fs.writeFileSync(`${runDir}/human_review_slice_10.decode.json`, JSON.stringify(decodeSubset, null, 2), 'utf8');

console.log(`created slice artifacts in ${runDir}`);
