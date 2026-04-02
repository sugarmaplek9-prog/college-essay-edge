import fs from 'node:fs';
import path from 'node:path';
import {
  CASE_DIR,
  loadCases,
  normalizeResults,
  runNdsEvaluation,
  type EvaluationCase,
} from '@/lib/ai/evaluation/pack';

const PACK_SIZE = 12;
const CONTROLLED_PACK_PATH = path.join(
  process.cwd(),
  'evaluation',
  'intake',
  'RIC_NDS_CONTROLLED_VALIDATION_PACK_V1.json',
);

type ControlledCaseFamily =
  | 'blank_page_confusion'
  | 'achievement_clutter'
  | 'vague_identity_angle'
  | 'sensitive_topic_hesitation'
  | 'over_polished_generic_direction'
  | 'weak_student_fit_read'
  | 'prestige_motivated_framing'
  | 'resume_disguised_prompt'
  | 'contradictory_signals';

type ControlledPack = {
  pack_id: string;
  review_protocol?: {
    recommended_first_human_calibration_subset_size?: number;
  };
  cases: ControlledCase[];
};

type ControlledCase = {
  case_id: string;
  case_family: ControlledCaseFamily;
  title: string;
  priority: 'high' | 'normal';
  student_input_raw: string;
  student_input_normalized: string;
  context: {
    essay_stage: string;
    prompt_type: string;
    ambiguity_level: number;
    sensitivity_flags: string[];
    notes: string;
  };
};

const REQUIRED_FAMILY_MINIMUMS: Array<{ family: ControlledCaseFamily; min: number }> = [
  { family: 'blank_page_confusion', min: 2 },
  { family: 'achievement_clutter', min: 2 },
  { family: 'vague_identity_angle', min: 2 },
  { family: 'sensitive_topic_hesitation', min: 2 },
  { family: 'over_polished_generic_direction', min: 1 },
  { family: 'weak_student_fit_read', min: 1 },
];

const DECISION_CATEGORIES = [
  'approve',
  'approve with minor edits',
  'usable but weak',
  'not usable',
  'unsafe or off-policy',
] as const;

const SCORE_DIMENSIONS = [
  'authenticity_preservation',
  'narrative_specificity',
  'directional_usefulness',
  'non_genericness',
  'strategic_differentiation',
  'student_fit',
  'clarity_of_recommendation',
  'evidence_grounded_interpretation',
  'actionability',
  'safety_policy_compliance',
] as const;

const FAILURE_TAXONOMY = [
  'generic advice',
  'fake depth',
  'overconfident inference',
  'weak narrative differentiation',
  'poor student-fit read',
  'shallow evidence use',
  'too broad / unfocused',
  'too polished / AI-sounding',
  'misread emotional signal',
  'weak actionability',
  'confusing structure',
  'unsupported recommendation',
  'policy / safety risk',
  'wrong essay-type assumption',
  'style drift from product standard',
] as const;

const FAILURE_SEVERITY = ['low', 'medium', 'high', 'critical'] as const;

async function main(): Promise<void> {
  const controlledPack = loadControlledPack();
  const source = controlledPack ? 'controlled_validation_pack_v1' : 'evaluation_cases_fallback';

  const allCases = controlledPack ? convertControlledPackToEvalCases(controlledPack) : loadCases(CASE_DIR);
  const selected = controlledPack
    ? selectCalibrationPacketFromControlledPack(controlledPack, allCases)
    : selectCalibrationPacket(allCases, PACK_SIZE);

  const ndsRuns = await runNdsEvaluation(selected);
  const normalized = normalizeResults(ndsRuns, []).filter((row) => row.system === 'nds_internal');

  const ndsByCase = new Map(ndsRuns.map((r) => [r.case_id, r]));
  const normalizedByCase = new Map(normalized.map((r) => [r.case_id, r]));

  const packetCases = selected.map((c, index) => {
    const run = ndsByCase.get(c.case_id);
    const out = normalizedByCase.get(c.case_id);

    return {
      case_order: index + 1,
      case_id: c.case_id,
      label: c.label,
      difficulty: c.difficulty,
      family_buckets: controlledPack ? [controlledFamilyForCaseId(controlledPack, c.case_id)] : classifyCase(c),
      raw_student_input: {
        story_entries: c.story_entries,
        current_draft_text: c.current_draft.text,
        school_context_notes: c.school_context,
      },
      normalized_input: run?.trace?.context_pack ?? null,
      final_nds_output: out ?? null,
      nds_metadata: {
        readiness_state: run?.readiness_state ?? null,
        execution_mode: run?.execution_mode ?? null,
        validator_decision: run?.validator_decision ?? null,
        warnings: run?.trace?.warnings ?? [],
      },
      reviewer_forms: {
        decision_category_options: DECISION_CATEGORIES,
        score_dimensions: SCORE_DIMENSIONS,
        score_scale: 'integer 1-5 only',
        failure_mode_taxonomy: FAILURE_TAXONOMY,
        failure_severity_levels: FAILURE_SEVERITY,
        required_fields: [
          'decision_category',
          ...SCORE_DIMENSIONS,
          'failure_modes',
          'rationale',
          'gold_candidate',
          'generalizable_learning',
        ],
      },
    };
  });

  const outDir = path.join(process.cwd(), 'evaluation_outputs');
  const intakeDir = path.join(process.cwd(), 'evaluation', 'intake', 'ric_human_reviews');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(intakeDir, { recursive: true });

  const packetPath = path.join(outDir, 'ric_human_calibration_packet_v1.json');
  const rubricPath = path.join(outDir, 'ric_human_calibration_rubric_freeze_v1.json');
  const templatePath = path.join(intakeDir, 'reviewer_template_calibration_v1.csv');

  const packet = {
    generated_at: new Date().toISOString(),
    packet_type: 'ric_human_calibration',
    source,
    source_pack_id: controlledPack?.pack_id ?? null,
    packet_size: packetCases.length,
    fixed_case_order: packetCases.map((c) => c.case_id),
    required_family_minimums: REQUIRED_FAMILY_MINIMUMS,
    selected_family_counts: summarizeFamilyCoverage(packetCases),
    cases: packetCases,
  };

  const rubricFreeze = {
    generated_at: new Date().toISOString(),
    decision_categories: DECISION_CATEGORIES,
    score_dimensions: SCORE_DIMENSIONS,
    score_scale: {
      allowed_values: [1, 2, 3, 4, 5],
      integer_only: true,
      no_half_points: true,
      all_dimensions_required: true,
    },
    failure_taxonomy: FAILURE_TAXONOMY,
    failure_severity_levels: FAILURE_SEVERITY,
    adjudication_trigger_dimensions: [
      'non_genericness',
      'student_fit',
      'actionability',
      'strategic_differentiation',
    ],
  };

  fs.writeFileSync(packetPath, JSON.stringify(packet, null, 2), 'utf-8');
  fs.writeFileSync(rubricPath, JSON.stringify(rubricFreeze, null, 2), 'utf-8');

  const header = [
    'reviewer_id',
    'case_id',
    'decision_category',
    ...SCORE_DIMENSIONS,
    'failure_modes',
    'rationale',
    'gold_candidate',
    'generalizable_learning',
  ].join(',');

  const rows = packetCases.map((c) =>
    [
      'reviewer_name',
      c.case_id,
      'approve|approve with minor edits|usable but weak|not usable|unsafe or off-policy',
      '1',
      '1',
      '1',
      '1',
      '1',
      '1',
      '1',
      '1',
      '1',
      '1',
      'generic advice:low|weak actionability:medium',
      'specific rationale (required)',
      'false',
      'false',
    ].join(','),
  );

  fs.writeFileSync(templatePath, `${header}\n${rows.join('\n')}\n`, 'utf-8');

  console.log(
    'RIC_HUMAN_CALIBRATION_PACKET_READY',
    JSON.stringify({
      packetPath,
      rubricPath,
      templatePath,
      caseCount: packetCases.length,
      familyCoverage: packet.selected_family_counts,
      source,
      sourcePackId: controlledPack?.pack_id ?? null,
    }),
  );
}

function loadControlledPack(): ControlledPack | null {
  if (!fs.existsSync(CONTROLLED_PACK_PATH)) return null;
  const raw = fs.readFileSync(CONTROLLED_PACK_PATH, 'utf-8');
  return JSON.parse(raw) as ControlledPack;
}

function convertControlledPackToEvalCases(pack: ControlledPack): EvaluationCase[] {
  return pack.cases.map((c) => {
    const tags = familyToTags(c.case_family, c.context.sensitivity_flags);
    return {
      case_id: c.case_id,
      label: c.title,
      difficulty: ambiguityToDifficulty(c.context.ambiguity_level),
      tags,
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
          id: `${c.case_id}_story_raw`,
          text: c.student_input_raw,
        },
      ],
      current_draft: {
        id: null,
        text: c.context.essay_stage === 'rough_idea' ? c.student_input_normalized : null,
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
    };
  });
}

function familyToTags(family: ControlledCaseFamily, sensitivityFlags: string[]): string[] {
  const tags = new Set<string>(['messy_notes']);

  if (family === 'achievement_clutter' || family === 'resume_disguised_prompt') {
    tags.add('resume_list');
    tags.add('generic_padding_risk');
  }
  if (family === 'vague_identity_angle') {
    tags.add('conflicting_signals');
  }
  if (family === 'sensitive_topic_hesitation') {
    tags.add('school_sensitive');
  }
  if (family === 'over_polished_generic_direction') {
    tags.add('stale_draft_risk');
    tags.add('generic_padding_risk');
  }
  if (family === 'weak_student_fit_read' || family === 'prestige_motivated_framing') {
    tags.add('parent_advisor_risk');
    tags.add('fake_confidence_temptation');
  }
  if (family === 'contradictory_signals') {
    tags.add('conflicting_signals');
    tags.add('fake_confidence_temptation');
  }
  if (sensitivityFlags.length > 0) {
    tags.add('school_sensitive');
  }

  return [...tags];
}

function ambiguityToDifficulty(level: number): EvaluationCase['difficulty'] {
  if (level >= 4) return 'weak';
  if (level === 3) return 'medium';
  return 'strong';
}

function controlledFamilyForCaseId(pack: ControlledPack, caseId: string): ControlledCaseFamily | 'unknown' {
  const row = pack.cases.find((c) => c.case_id === caseId);
  return row?.case_family ?? 'unknown';
}

function selectCalibrationPacketFromControlledPack(
  pack: ControlledPack,
  convertedCases: EvaluationCase[],
): EvaluationCase[] {
  const preferredSize = pack.review_protocol?.recommended_first_human_calibration_subset_size ?? PACK_SIZE;
  const packetSize = Math.max(10, Math.min(15, preferredSize));

  const evalById = new Map(convertedCases.map((c) => [c.case_id, c]));
  const selectedIds: string[] = [];
  const used = new Set<string>();

  for (const req of REQUIRED_FAMILY_MINIMUMS) {
    const matches = pack.cases
      .filter((c) => c.case_family === req.family)
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.case_id.localeCompare(b.case_id));

    let count = 0;
    for (const m of matches) {
      if (selectedIds.length >= packetSize) break;
      if (used.has(m.case_id)) continue;
      selectedIds.push(m.case_id);
      used.add(m.case_id);
      count += 1;
      if (count >= req.min) break;
    }
  }

  const remainder = pack.cases
    .filter((c) => !used.has(c.case_id))
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.case_id.localeCompare(b.case_id));

  for (const c of remainder) {
    if (selectedIds.length >= packetSize) break;
    selectedIds.push(c.case_id);
    used.add(c.case_id);
  }

  return selectedIds
    .map((id) => evalById.get(id))
    .filter((c): c is EvaluationCase => !!c);
}

function priorityRank(priority: 'high' | 'normal'): number {
  return priority === 'high' ? 0 : 1;
}

function selectCalibrationPacket(cases: EvaluationCase[], packetSize: number): EvaluationCase[] {
  const selected: EvaluationCase[] = [];
  const used = new Set<string>();

  const addCase = (c: EvaluationCase): void => {
    if (used.has(c.case_id)) return;
    selected.push(c);
    used.add(c.case_id);
  };

  for (const req of REQUIRED_FAMILY_MINIMUMS) {
    const familyMatches = cases.filter((c) => classifyCase(c).includes(req.family));
    for (const c of familyMatches) {
      if (selected.length >= packetSize) break;
      if (countFamily(selected, req.family) >= req.min) break;
      addCase(c);
    }
  }

  const remaining = cases
    .filter((c) => !used.has(c.case_id))
    .sort((a, b) => difficultyRank(a.difficulty) - difficultyRank(b.difficulty));

  for (const c of remaining) {
    if (selected.length >= packetSize) break;
    addCase(c);
  }

  return selected.slice(0, packetSize);
}

function countFamily(cases: EvaluationCase[], family: string): number {
  return cases.filter((c) => classifyCase(c).includes(family)).length;
}

function difficultyRank(d: EvaluationCase['difficulty']): number {
  if (d === 'weak') return 0;
  if (d === 'medium') return 1;
  return 2;
}

function classifyCase(c: EvaluationCase): string[] {
  const label = c.label.toLowerCase();
  const tags = new Set(c.tags);
  const families: string[] = [];

  if (c.difficulty === 'weak' || (!c.current_draft.text && tags.has('messy_notes'))) {
    families.push('A_blank_page_confusion');
  }

  if (
    tags.has('resume_list') ||
    tags.has('generic_padding_risk') ||
    /robotics|leadership|operations|science fair|achievement|resume/.test(label)
  ) {
    families.push('B_achievement_clutter_resume_noise');
  }

  if (/family|community|translation|caregiving|identity/.test(label)) {
    families.push('C_vague_identity_community_angle');
  }

  if (tags.has('school_sensitive') || /family|hesitation|sensitive|recovery/.test(label)) {
    families.push('D_sensitive_topic_hesitation');
  }

  if (tags.has('stale_draft_risk') || tags.has('parent_advisor_risk') || (!!c.current_draft.text && tags.has('generic_padding_risk'))) {
    families.push('E_over_polished_generic_direction_risk');
  }

  if (!c.expected_conditions.should_have_clear_winner || tags.has('conflicting_signals')) {
    families.push('F_weak_student_fit_ambiguity');
  }

  if (families.length === 0) {
    families.push('G_additional_difficult_edge_case');
  }

  return families;
}

function summarizeFamilyCoverage(packetCases: Array<{ family_buckets: string[] }>): Record<string, number> {
  const counts = new Map<string, number>();
  for (const c of packetCases) {
    for (const family of c.family_buckets) {
      counts.set(family, (counts.get(family) ?? 0) + 1);
    }
  }

  const out: Record<string, number> = {};
  for (const [family, count] of [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    out[family] = count;
  }
  return out;
}

main().catch((error) => {
  console.error('RIC_HUMAN_CALIBRATION_PACKET_FAILED', error);
  process.exit(1);
});
