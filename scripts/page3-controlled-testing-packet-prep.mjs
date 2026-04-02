import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INTAKE_PATH = process.env.PAGE3_CONTROLLED_INTAKE_PATH
  ? path.resolve(ROOT, process.env.PAGE3_CONTROLLED_INTAKE_PATH)
  : path.join(ROOT, 'scripts', 'data', 'page3-controlled-testing-lane-v1.intake-24.json');
const OUT_ROOT = process.env.PAGE3_CONTROLLED_PACKET_OUT
  ? path.resolve(ROOT, process.env.PAGE3_CONTROLLED_PACKET_OUT)
  : path.join(ROOT, 'evaluation_outputs', 'page3_controlled_testing_v1', 'packet_v1');

const OPERATOR_FIELDS = [
  'case_id',
  'slice_id',
  'run_group',
  'recommendation_clarity_score_1_to_5',
  'essay_about_meaning_score_1_to_5',
  'why_this_direction_usefulness_score_1_to_5',
  'weaker_stronger_usefulness_score_1_to_5',
  'next_step_concreteness_score_1_to_5',
  'templated_feel_flag',
  'generic_feel_flag',
  'misrouted_flag',
  'sharp_coach_voice_flag',
  'operator_outcome_label',
  'freeform_notes'
];

function q(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(filePath, rows) {
  const lines = [OPERATOR_FIELDS.join(',')];
  for (const row of rows) {
    lines.push(OPERATOR_FIELDS.map((field) => q(row[field] ?? '')).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const intake = JSON.parse(fs.readFileSync(INTAKE_PATH, 'utf8'));
  if (intake.length !== 24) throw new Error(`Expected 24 cases, got ${intake.length}`);

  const slices = new Map();
  for (const row of intake) {
    const sliceId = row.slice_id;
    if (!sliceId) throw new Error(`Missing slice_id for case ${row.case_id}`);
    if (!slices.has(sliceId)) slices.set(sliceId, []);
    slices.get(sliceId).push(row);
  }

  for (const [sliceId, rows] of slices.entries()) {
    if (rows.length !== 8) throw new Error(`${sliceId} must have 8 cases, got ${rows.length}`);
  }

  for (const [sliceId, rows] of [...slices.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sliceDir = path.join(OUT_ROOT, sliceId);
    fs.mkdirSync(sliceDir, { recursive: true });

    fs.writeFileSync(path.join(sliceDir, `${sliceId}.cases.json`), JSON.stringify(rows, null, 2));

    const reviewRows = rows.map((row) => ({
      case_id: row.case_id,
      slice_id: row.slice_id,
      run_group: row.run_group,
      recommendation_clarity_score_1_to_5: '',
      essay_about_meaning_score_1_to_5: '',
      why_this_direction_usefulness_score_1_to_5: '',
      weaker_stronger_usefulness_score_1_to_5: '',
      next_step_concreteness_score_1_to_5: '',
      templated_feel_flag: '',
      generic_feel_flag: '',
      misrouted_flag: '',
      sharp_coach_voice_flag: '',
      operator_outcome_label: '',
      freeform_notes: '',
    }));
    writeCsv(path.join(sliceDir, `${sliceId}.operator_review_template.csv`), reviewRows);

    const instructions = [
      `# ${sliceId.toUpperCase()} operator instructions`,
      '',
      '- Run the slice using the controlled testing lane with this cases file.',
      '- For each case, score all fields in the CSV template.',
      '- Use operator_outcome_label: landed | usable_with_polish | structurally_weak | failure.',
      '- Record freeform notes for any templated, generic, misrouted, or weak-coaching output.',
      '- Save completed sheet beside the template with suffix .completed.csv.',
      '',
      `Cases file: ${sliceId}.cases.json`,
      `Review template: ${sliceId}.operator_review_template.csv`,
      '',
    ].join('\n');

    fs.writeFileSync(path.join(sliceDir, `${sliceId}.operator_instructions.md`), instructions, 'utf8');
  }

  const manifest = {
    generated_at: new Date().toISOString(),
    intake_path: INTAKE_PATH,
    packet_out_dir: OUT_ROOT,
    run_group: intake[0]?.run_group ?? null,
    total_cases: intake.length,
    slice_ids: [...slices.keys()].sort(),
    slice_sizes: Object.fromEntries([...slices.entries()].map(([id, rows]) => [id, rows.length])),
    pattern_mix: intake.reduce((acc, row) => {
      acc[row.pattern_group] = (acc[row.pattern_group] ?? 0) + 1;
      return acc;
    }, {}),
    logging_destination: path.join('evaluation_outputs', 'page3_controlled_testing_v1', 'slices_v1')
  };

  fs.writeFileSync(path.join(OUT_ROOT, 'CONTROLLED_PACKET_MANIFEST_V1.json'), JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({
    out_dir: OUT_ROOT,
    manifest: path.join(OUT_ROOT, 'CONTROLLED_PACKET_MANIFEST_V1.json'),
    total_cases: manifest.total_cases,
    slice_sizes: manifest.slice_sizes,
    pattern_mix: manifest.pattern_mix,
  }, null, 2));
}

main();
