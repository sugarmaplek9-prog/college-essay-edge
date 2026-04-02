import fs from 'node:fs';
import path from 'node:path';
import {
  CASE_DIR,
  loadCases,
  normalizeResults,
  runBaselineEvaluation,
  runNdsEvaluation,
  type EvaluationCase,
  type NormalizedComparisonOutput,
} from '@/lib/ai/evaluation/pack';

const CONTROLLED_PACK_PATH = path.join(
  process.cwd(),
  'evaluation',
  'intake',
  'RIC_NDS_CONTROLLED_VALIDATION_PACK_V1.json',
);

type ControlledPack = {
  pack_id: string;
  review_protocol?: {
    recommended_first_human_calibration_subset_size?: number;
  };
  cases: Array<{
    case_id: string;
    title: string;
    case_family: string;
    student_input_raw: string;
    student_input_normalized: string;
    context: {
      ambiguity_level: number;
      notes: string;
    };
  }>;
};

type BlindCase = {
  case_id: string;
  label: string;
  prompt: string;
  output_a: Omit<NormalizedComparisonOutput, 'case_id' | 'system'>;
  output_b: Omit<NormalizedComparisonOutput, 'case_id' | 'system'>;
};

function pickCases(cases: EvaluationCase[], count = 12): EvaluationCase[] {
  return cases.slice(0, count);
}

function toView(row: NormalizedComparisonOutput): Omit<NormalizedComparisonOutput, 'case_id' | 'system'> {
  const { case_id: _id, system: _sys, ...rest } = row;
  return rest;
}

async function main(): Promise<void> {
  const controlledPack = loadControlledPack();
  const source = controlledPack ? 'controlled_validation_pack_v1' : 'evaluation_cases_fallback';
  const allCases = controlledPack ? convertControlledPackToEvalCases(controlledPack) : loadCases(CASE_DIR);
  const requested = controlledPack?.review_protocol?.recommended_first_human_calibration_subset_size ?? 12;
  const cases = pickCases(allCases, Math.max(10, Math.min(15, requested)));
  const nds = await runNdsEvaluation(cases);
  const baseline = await runBaselineEvaluation(cases);
  const normalized = normalizeResults(nds, baseline);

  const byCase = new Map<string, { nds?: NormalizedComparisonOutput; baseline?: NormalizedComparisonOutput }>();
  for (const row of normalized) {
    const bucket = byCase.get(row.case_id) ?? {};
    if (row.system === 'nds_internal') bucket.nds = row;
    if (row.system === 'baseline_free_ai') bucket.baseline = row;
    byCase.set(row.case_id, bucket);
  }

  const blindCases: BlindCase[] = [];
  const decode: Array<{ case_id: string; output_a: 'nds_internal' | 'baseline_free_ai'; output_b: 'nds_internal' | 'baseline_free_ai' }> = [];

  for (const c of cases) {
    const pair = byCase.get(c.case_id);
    if (!pair?.nds || !pair?.baseline) continue;

    const flip = hashToBool(c.case_id);
    const outputA = flip ? pair.nds : pair.baseline;
    const outputB = flip ? pair.baseline : pair.nds;

    blindCases.push({
      case_id: c.case_id,
      label: c.label,
      prompt: buildReviewPrompt(c),
      output_a: toView(outputA),
      output_b: toView(outputB),
    });

    decode.push({
      case_id: c.case_id,
      output_a: flip ? 'nds_internal' : 'baseline_free_ai',
      output_b: flip ? 'baseline_free_ai' : 'nds_internal',
    });
  }

  const outDir = path.join(process.cwd(), 'evaluation_outputs');
  fs.mkdirSync(outDir, { recursive: true });

  const packetPath = path.join(outDir, 'ric_human_proof_packet_v1.json');
  const decodePath = path.join(outDir, 'ric_human_proof_packet_decode_v1.json');

  fs.writeFileSync(
    packetPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        source,
        source_pack_id: controlledPack?.pack_id ?? null,
        case_count: blindCases.length,
        cases: blindCases,
      },
      null,
      2,
    ),
    'utf-8',
  );
  fs.writeFileSync(decodePath, JSON.stringify({ generated_at: new Date().toISOString(), decode }, null, 2), 'utf-8');

  const templatePath = path.join(process.cwd(), 'evaluation', 'intake', 'ric_human_reviews', 'reviewer_template.csv');
  const header = [
    'reviewer_id',
    'case_id',
    'preferred_output',
    'decision_confidence',
    'directional_usefulness',
    'non_genericness',
    'actionability',
    'student_fit',
    'gold_candidate',
    'failure_tags',
    'notes',
  ].join(',');

  const lines = [header];
  for (const item of blindCases) {
    lines.push(
      [
        'reviewer_name',
        item.case_id,
        'A_or_B_or_tie',
        '1_to_5',
        '1_to_5',
        '1_to_5',
        '1_to_5',
        '1_to_5',
        'true_or_false',
        'tag1|tag2|tag3',
        'short note',
      ].join(','),
    );
  }
  fs.writeFileSync(templatePath, `${lines.join('\n')}\n`, 'utf-8');

  console.log(
    'RIC_HUMAN_PROOF_PACKET_READY',
    JSON.stringify({ packetPath, decodePath, templatePath, caseCount: blindCases.length, source, sourcePackId: controlledPack?.pack_id ?? null }),
  );
}

function loadControlledPack(): ControlledPack | null {
  if (!fs.existsSync(CONTROLLED_PACK_PATH)) return null;
  const raw = fs.readFileSync(CONTROLLED_PACK_PATH, 'utf-8');
  return JSON.parse(raw) as ControlledPack;
}

function convertControlledPackToEvalCases(pack: ControlledPack): EvaluationCase[] {
  return pack.cases.map((c) => ({
    case_id: c.case_id,
    label: c.title,
    difficulty: c.context.ambiguity_level >= 4 ? 'weak' : c.context.ambiguity_level === 3 ? 'medium' : 'strong',
    tags: ['messy_notes'],
    student_profile: {
      grade_level: '12',
      intended_majors: ['undeclared'],
      core_interests: ['reflection', 'growth'],
      identity_notes: [],
    },
    essay_project: {
      project_id: `ctrl_${c.case_id}`,
      project_type: 'personal_statement',
      target_school: null,
    },
    story_entries: [
      {
        id: `${c.case_id}_raw`,
        text: c.student_input_raw,
      },
    ],
    current_draft: {
      id: null,
      text: c.student_input_normalized,
    },
    school_context: {
      target_school: null,
      notes: c.context.notes,
    },
    expected_conditions: {
      should_be_needs_more_input: false,
      should_have_clear_winner: c.context.ambiguity_level <= 3,
      likely_bad_baseline_behavior: ['generic_praise', 'flat_options', 'resume_list_regurgitation'],
    },
    author_notes: {
      why_included: `Controlled pack family: ${c.case_family}`,
      reviewer_warning: c.context.notes,
    },
  }));
}

function buildReviewPrompt(c: EvaluationCase): string {
  const story = c.story_entries.map((s) => `- ${s.text}`).join('\n');
  const draft = c.current_draft.text?.trim()
    ? `Current draft:\n${c.current_draft.text.trim()}`
    : 'Current draft: (none)';

  return [
    `Student label: ${c.label}`,
    `Difficulty: ${c.difficulty}`,
    `Tags: ${c.tags.join(', ')}`,
    `Story entries:\n${story || '- (none)'}`,
    draft,
  ].join('\n\n');
}

function hashToBool(input: string): boolean {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 2 === 0;
}

main().catch((error) => {
  console.error('RIC_HUMAN_PROOF_PACKET_FAILED', error);
  process.exit(1);
});
