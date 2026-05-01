import fs from 'node:fs';
import path from 'node:path';
import {
  autoScoreHeadToHead,
  generateSummary,
  normalizeResults,
  persistRunArtifacts,
  runBaselineEvaluation,
  runNdsEvaluation,
  validateEvaluationCase,
} from '@/lib/ai/evaluation/pack';
import type {
  EvaluationCase,
  NdsEvalRunRecord,
  NormalizedComparisonOutput,
  BaselineEvalRunRecord,
} from '@/lib/ai/evaluation/pack';

const RUN_LABEL = '072-post-repair-evaluation-execution-v1';
const WORKTREE_ROOT = process.cwd();
const FROZEN_SOURCE_ROOT = resolveFrozenSourceRoot();
const INPUT_SOURCE_ROOT = resolveInputSourceRoot();
const OUTPUT_DIR = path.join(
  WORKTREE_ROOT,
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  RUN_LABEL,
);
const SENTINEL_DIR = path.join(OUTPUT_DIR, 'frozen-072-sentinel');
const HOLDOUT_DIR = path.join(OUTPUT_DIR, 'unseen-holdout-v1');
const FUTURE_SPLIT_DIR = path.join(OUTPUT_DIR, 'future-split-v1');
const BLIND_REVIEW_DIR = path.join(OUTPUT_DIR, 'blinded-human-review-v1');
const BLIND_REVIEW_PROTECTED_DIR = path.join(BLIND_REVIEW_DIR, 'protected');

const FROZEN_INPUT_PATH = path.join(
  FROZEN_SOURCE_ROOT,
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  'blind-evaluation-run-v1',
  'input',
  '072_blind_frozen_input_v1.json',
);
const FROZEN_BEFORE_RESULTS_PATH = path.join(
  FROZEN_SOURCE_ROOT,
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  'blind-evaluation-run-v1',
  'nds_results.json',
);
const HOLDOUT_SOURCE_PATH = path.join(
  INPUT_SOURCE_ROOT,
  'evaluation',
  'cases',
  '072_real_human_visible_medium_weak_v1.json',
);
const FUTURE_SPLIT_SOURCE_PATH = path.join(
  INPUT_SOURCE_ROOT,
  'evaluation',
  'cases',
  '072_real_human_visible_bootstrap_v1.json',
);

const META_PATTERN =
  /(?:the strongest direction|a strong output|a weak output|a weak answer|a good output|the essay should(?: not)?|reviewer warning:|do not let the model)/i;
const CORRECTION_TEMPLATE_PATTERN = /the moment the student corrected course and what changed after/i;
const GENERIC_NEXT_MOVE_PATTERN = /build more specific evidence for mistake, pivot, and behavior change/i;
const DANGLING_FRAGMENT_PATTERN = /\b(?:a|an|the|and|or|of|to|as|not|than|by|with|for)\./i;
const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'around',
  'because',
  'become',
  'became',
  'being',
  'build',
  'could',
  'direction',
  'essay',
  'frame',
  'generic',
  'keeps',
  'output',
  'preserve',
  'should',
  'shows',
  'story',
  'student',
  'stronger',
  'strongest',
  'through',
  'turning',
  'using',
  'would',
]);

type RunRecord = NdsEvalRunRecord & {
  artifact_payload?: {
    status?: string;
    best_direction?: {
      angle_title?: string;
      core_claim?: string;
      why_this_is_the_real_story?: string;
      what_it_reveals_about_the_student?: string;
      why_it_beats_the_obvious_angle?: string;
      main_risk_if_written_poorly?: string;
      next_move?: string;
    };
  };
};

type RawBenchmarkCase = {
  case_id: string;
  case_label: string;
  normalized_product_input: {
    project_type: 'personal_statement';
    rough_notes: string[];
    optional_partial_draft: string | null;
    context_notes: string;
  };
  expected_evaluator_signals: {
    expected_route: 'direction' | 'clarification' | 'blocked';
    should_avoid: string[];
  };
  tags: string[];
};

type PatternAssessment = {
  case_id: string;
  label: string;
  angle_title: string;
  has_correction_template: boolean;
  has_meta_instructional_leak: boolean;
  has_generic_next_move_suffix: boolean;
  has_dangling_fragment: boolean;
  source_overlap_tokens: string[];
  source_overlap_count: number;
};

type BlindReviewCase = {
  case_id: string;
  label: string;
  source_layer: 'unseen_holdout' | 'future_split';
  expected_route: string;
  prompt: string;
  output_a: ReturnType<typeof toPacketView>;
  output_b: ReturnType<typeof toPacketView>;
};

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resolveFrozenSourceRoot(): string {
  const candidates = [WORKTREE_ROOT, path.resolve(WORKTREE_ROOT, '..', '..')];
  for (const candidate of candidates) {
    const frozenInput = path.join(
      candidate,
      'evaluation_outputs',
      '072-real-human-corpus-expansion',
      'blind-evaluation-run-v1',
      'input',
      '072_blind_frozen_input_v1.json',
    );
    if (fs.existsSync(frozenInput)) {
      return candidate;
    }
  }
  return WORKTREE_ROOT;
}

function resolveInputSourceRoot(): string {
  const candidates = [WORKTREE_ROOT, path.resolve(WORKTREE_ROOT, '..', '..')];
  for (const candidate of candidates) {
    const holdoutPath = path.join(candidate, 'evaluation', 'cases', '072_real_human_visible_medium_weak_v1.json');
    const futureSplitPath = path.join(candidate, 'evaluation', 'cases', '072_real_human_visible_bootstrap_v1.json');
    if (fs.existsSync(holdoutPath) && fs.existsSync(futureSplitPath)) {
      return candidate;
    }
  }
  return WORKTREE_ROOT;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function assertMissing(filePath: string): void {
  if (fs.existsSync(filePath)) {
    throw new Error(`Refusing to overwrite existing execution artifact: ${filePath}`);
  }
}

function loadFrozenSentinelCases(): EvaluationCase[] {
  if (!fs.existsSync(FROZEN_INPUT_PATH)) {
    throw new Error(`Missing frozen sentinel input artifact: ${FROZEN_INPUT_PATH}`);
  }
  const cases = readJson<EvaluationCase[]>(FROZEN_INPUT_PATH);
  for (const caseRecord of cases) {
    const errors = validateEvaluationCase(caseRecord);
    if (errors.length > 0) {
      throw new Error(`Frozen sentinel case ${caseRecord.case_id} failed validation: ${errors.join('; ')}`);
    }
  }
  return cases;
}

function toDifficulty(tags: string[]): 'weak' | 'medium' | 'strong' {
  if (tags.includes('strength:weak')) return 'weak';
  if (tags.includes('strength:strong')) return 'strong';
  return 'medium';
}

function normalizeEvaluationTags(caseRecord: RawBenchmarkCase): string[] {
  const tags = new Set<string>();

  if (caseRecord.normalized_product_input.rough_notes.length >= 3) {
    tags.add('messy_notes');
  }
  if (caseRecord.normalized_product_input.optional_partial_draft) {
    tags.add('draft_present');
  }
  if (caseRecord.expected_evaluator_signals.expected_route !== 'direction') {
    tags.add('conflicting_signals');
    tags.add('fake_confidence_temptation');
  }
  if (caseRecord.expected_evaluator_signals.should_avoid.length > 0) {
    tags.add('generic_padding_risk');
  }
  if (caseRecord.normalized_product_input.context_notes.toLowerCase().includes('school')) {
    tags.add('school_sensitive');
  }

  return [...tags];
}

function convertBenchmarkCases(sourcePath: string): EvaluationCase[] {
  const rawCases = readJson<RawBenchmarkCase[]>(sourcePath);
  const converted = rawCases.map((caseRecord) => ({
    case_id: caseRecord.case_id,
    label: caseRecord.case_label,
    difficulty: toDifficulty(caseRecord.tags),
    tags: normalizeEvaluationTags(caseRecord),
    student_profile: {
      grade_level: '12',
      intended_majors: ['undeclared'],
      core_interests: ['reflection', 'writing', 'direction-finding'],
      identity_notes: [],
    },
    essay_project: {
      project_id: `072_${caseRecord.case_id.toLowerCase()}`,
      project_type: 'personal_statement' as const,
      target_school: null,
    },
    story_entries: caseRecord.normalized_product_input.rough_notes.map((text, index) => ({
      id: `${caseRecord.case_id}_story_${index + 1}`,
      text,
    })),
    current_draft: {
      id: null,
      text: caseRecord.normalized_product_input.optional_partial_draft,
    },
    school_context: {
      target_school: null,
      notes: caseRecord.normalized_product_input.context_notes,
    },
    expected_conditions: {
      should_be_needs_more_input: caseRecord.expected_evaluator_signals.expected_route !== 'direction',
      should_have_clear_winner: caseRecord.expected_evaluator_signals.expected_route === 'direction',
      likely_bad_baseline_behavior: caseRecord.expected_evaluator_signals.should_avoid,
    },
    author_notes: {
      why_included: `072 post-repair unseen benchmark source: ${path.basename(sourcePath)}`,
      reviewer_warning: caseRecord.normalized_product_input.context_notes,
    },
  }));

  for (const caseRecord of converted) {
    const errors = validateEvaluationCase(caseRecord);
    if (errors.length > 0) {
      throw new Error(`Converted unseen case ${caseRecord.case_id} failed validation: ${errors.join('; ')}`);
    }
  }

  return converted;
}

function getBestDirectionTextFromRun(record: RunRecord): string {
  const best = record.artifact_payload?.best_direction;
  return [
    best?.angle_title,
    best?.core_claim,
    best?.why_this_is_the_real_story,
    best?.what_it_reveals_about_the_student,
    best?.why_it_beats_the_obvious_angle,
    best?.main_risk_if_written_poorly,
    best?.next_move,
  ]
    .filter((value): value is string => Boolean(value && value.trim().length > 0))
    .join(' ');
}

function getBestDirectionTextFromNormalized(record: NormalizedComparisonOutput): string {
  return [
    record.best_direction.angle_title,
    record.best_direction.core_claim,
    record.best_direction.why_this_is_the_real_story,
    record.best_direction.what_it_reveals_about_the_student,
    record.best_direction.why_it_beats_the_obvious_angle,
    record.best_direction.main_risk_if_written_poorly,
    record.best_direction.next_move,
  ]
    .filter((value) => value.trim().length > 0)
    .join(' ');
}

function computeSourceOverlap(caseRecord: EvaluationCase, outputText: string): string[] {
  const sourceTokens = new Set(
    caseRecord.story_entries
      .flatMap((entry) => entry.text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [])
      .filter((token) => !STOPWORDS.has(token)),
  );
  const loweredOutput = outputText.toLowerCase();
  return [...sourceTokens].filter((token) => loweredOutput.includes(token)).slice(0, 12);
}

function assessRunRecord(caseRecord: EvaluationCase, record: RunRecord): PatternAssessment {
  const angleTitle = record.artifact_payload?.best_direction?.angle_title ?? '';
  const nextMove = record.artifact_payload?.best_direction?.next_move ?? '';
  const outputText = getBestDirectionTextFromRun(record);
  const overlap = computeSourceOverlap(caseRecord, outputText);

  return {
    case_id: caseRecord.case_id,
    label: caseRecord.label,
    angle_title: angleTitle,
    has_correction_template: CORRECTION_TEMPLATE_PATTERN.test(angleTitle),
    has_meta_instructional_leak: META_PATTERN.test(outputText),
    has_generic_next_move_suffix: GENERIC_NEXT_MOVE_PATTERN.test(nextMove),
    has_dangling_fragment: DANGLING_FRAGMENT_PATTERN.test(outputText),
    source_overlap_tokens: overlap,
    source_overlap_count: overlap.length,
  };
}

function assessNormalizedRecord(caseRecord: EvaluationCase, record: NormalizedComparisonOutput): PatternAssessment {
  const angleTitle = record.best_direction.angle_title ?? '';
  const nextMove = record.best_direction.next_move ?? '';
  const outputText = getBestDirectionTextFromNormalized(record);
  const overlap = computeSourceOverlap(caseRecord, outputText);

  return {
    case_id: caseRecord.case_id,
    label: caseRecord.label,
    angle_title: angleTitle,
    has_correction_template: CORRECTION_TEMPLATE_PATTERN.test(angleTitle),
    has_meta_instructional_leak: META_PATTERN.test(outputText),
    has_generic_next_move_suffix: GENERIC_NEXT_MOVE_PATTERN.test(nextMove),
    has_dangling_fragment: DANGLING_FRAGMENT_PATTERN.test(outputText),
    source_overlap_tokens: overlap,
    source_overlap_count: overlap.length,
  };
}

function summarizePatterns(assessments: PatternAssessment[]) {
  const averageSourceOverlap =
    assessments.reduce((sum, item) => sum + item.source_overlap_count, 0) / Math.max(1, assessments.length);

  return {
    case_count: assessments.length,
    correction_template_count: assessments.filter((item) => item.has_correction_template).length,
    meta_instructional_leak_count: assessments.filter((item) => item.has_meta_instructional_leak).length,
    generic_next_move_suffix_count: assessments.filter((item) => item.has_generic_next_move_suffix).length,
    dangling_fragment_count: assessments.filter((item) => item.has_dangling_fragment).length,
    low_specificity_case_count: assessments.filter((item) => item.source_overlap_count < 2).length,
    average_source_overlap: Math.round(averageSourceOverlap * 100) / 100,
  };
}

function buildSentinelStatus(beforeSummary: ReturnType<typeof summarizePatterns>, afterSummary: ReturnType<typeof summarizePatterns>): 'REPAIR_PASS' | 'PARTIAL_REPAIR' | 'REPAIR_FAILED' {
  const criticalZero =
    afterSummary.correction_template_count === 0 &&
    afterSummary.meta_instructional_leak_count === 0 &&
    afterSummary.generic_next_move_suffix_count === 0;
  const phrasingZero = afterSummary.dangling_fragment_count === 0;
  const specificityHeld = afterSummary.average_source_overlap >= beforeSummary.average_source_overlap - 0.25;

  if (criticalZero && phrasingZero && specificityHeld) {
    return 'REPAIR_PASS';
  }

  const criticalImproved =
    afterSummary.correction_template_count <= beforeSummary.correction_template_count &&
    afterSummary.meta_instructional_leak_count <= beforeSummary.meta_instructional_leak_count &&
    afterSummary.generic_next_move_suffix_count <= beforeSummary.generic_next_move_suffix_count;

  return criticalImproved ? 'PARTIAL_REPAIR' : 'REPAIR_FAILED';
}

function hashToBool(input: string): boolean {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % 2 === 0;
}

function buildReviewPrompt(caseRecord: EvaluationCase, expectedRoute: string): string {
  const notes = caseRecord.story_entries.map((entry) => `- ${entry.text}`).join('\n');
  return [
    `Student label: ${caseRecord.label}`,
    `Expected route: ${expectedRoute}`,
    `Difficulty: ${caseRecord.difficulty}`,
    'Rough notes:',
    notes,
  ].join('\n');
}

function toPacketView(record: NormalizedComparisonOutput) {
  return {
    status: record.status,
    angle_title: record.best_direction.angle_title,
    core_claim: record.best_direction.core_claim,
    why_this_is_the_real_story: record.best_direction.why_this_is_the_real_story,
    what_it_reveals_about_the_student: record.best_direction.what_it_reveals_about_the_student,
    why_it_beats_the_obvious_angle: record.best_direction.why_it_beats_the_obvious_angle,
    main_risk_if_written_poorly: record.best_direction.main_risk_if_written_poorly,
    next_move: record.best_direction.next_move,
    evidence_anchors: record.evidence_anchors,
    recovery_question: record.recovery_question,
  };
}

function buildBlindPacketMarkdown(cases: BlindReviewCase[]): string {
  const lines: string[] = [];
  lines.push('# 072 Post-Repair Blinded Human Review Packet — V1');
  lines.push('');
  lines.push('- mode: blind');
  lines.push(`- case_count: ${cases.length}`);
  lines.push('- provenance labels hidden until decode');
  lines.push('');

  for (const caseRecord of cases) {
    lines.push(`## ${caseRecord.case_id} — ${caseRecord.label}`);
    lines.push('');
    lines.push(`- source_layer: ${caseRecord.source_layer}`);
    lines.push(`- expected_route: ${caseRecord.expected_route}`);
    lines.push('');
    lines.push('### Student input packet');
    lines.push(caseRecord.prompt);
    lines.push('');
    lines.push('### Output A');
    lines.push('```json');
    lines.push(JSON.stringify(caseRecord.output_a, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### Output B');
    lines.push('```json');
    lines.push(JSON.stringify(caseRecord.output_b, null, 2));
    lines.push('```');
    lines.push('');
    lines.push('### Blind decision form');
    lines.push('- preferred_output: `A` / `B` / `tie` / `invalid`');
    lines.push('- strength_band: `clearly better` / `somewhat better` / `tie` / `invalid`');
    lines.push('- notes:');
    lines.push('');
  }

  return lines.join('\n');
}

function buildSelectedBlindCases(input: {
  holdoutCases: EvaluationCase[];
  holdoutNormalized: NormalizedComparisonOutput[];
  futureSplitCases: EvaluationCase[];
  futureSplitNormalized: NormalizedComparisonOutput[];
}): {
  cases: BlindReviewCase[];
  decode: Record<string, { A: 'nds_internal' | 'baseline_free_ai'; B: 'nds_internal' | 'baseline_free_ai' }>;
  manifest: { holdout_case_ids: string[]; future_split_case_ids: string[]; total_cases: number };
} {
  const holdoutSelected = [...input.holdoutCases].sort((a, b) => a.case_id.localeCompare(b.case_id)).slice(0, 5);
  const futureSelected = [...input.futureSplitCases].sort((a, b) => a.case_id.localeCompare(b.case_id)).slice(0, 5);
  const decode: Record<string, { A: 'nds_internal' | 'baseline_free_ai'; B: 'nds_internal' | 'baseline_free_ai' }> = {};
  const selectedCases: BlindReviewCase[] = [];

  function addCases(
    cases: EvaluationCase[],
    normalized: NormalizedComparisonOutput[],
    sourceLayer: 'unseen_holdout' | 'future_split',
    expectedRouteMap: Map<string, string>,
  ): void {
    for (const caseRecord of cases) {
      const nds = normalized.find((row) => row.case_id === caseRecord.case_id && row.system === 'nds_internal');
      const baseline = normalized.find((row) => row.case_id === caseRecord.case_id && row.system === 'baseline_free_ai');
      if (!nds || !baseline) {
        throw new Error(`Missing normalized outputs for blind review case ${caseRecord.case_id}`);
      }

      const swap = hashToBool(`${sourceLayer}:${caseRecord.case_id}`);
      const outputA = swap ? nds : baseline;
      const outputB = swap ? baseline : nds;

      decode[caseRecord.case_id] = {
        A: outputA.system,
        B: outputB.system,
      };

      selectedCases.push({
        case_id: caseRecord.case_id,
        label: caseRecord.label,
        source_layer: sourceLayer,
        expected_route: expectedRouteMap.get(caseRecord.case_id) ?? 'direction',
        prompt: buildReviewPrompt(caseRecord, expectedRouteMap.get(caseRecord.case_id) ?? 'direction'),
        output_a: toPacketView(outputA),
        output_b: toPacketView(outputB),
      });
    }
  }

  const holdoutExpectedRoutes = new Map<string, string>();
  const futureExpectedRoutes = new Map<string, string>();
  const rawHoldout = readJson<RawBenchmarkCase[]>(HOLDOUT_SOURCE_PATH);
  const rawFuture = readJson<RawBenchmarkCase[]>(FUTURE_SPLIT_SOURCE_PATH);
  rawHoldout.forEach((item) => holdoutExpectedRoutes.set(item.case_id, item.expected_evaluator_signals.expected_route));
  rawFuture.forEach((item) => futureExpectedRoutes.set(item.case_id, item.expected_evaluator_signals.expected_route));

  addCases(holdoutSelected, input.holdoutNormalized, 'unseen_holdout', holdoutExpectedRoutes);
  addCases(futureSelected, input.futureSplitNormalized, 'future_split', futureExpectedRoutes);

  return {
    cases: selectedCases,
    decode,
    manifest: {
      holdout_case_ids: holdoutSelected.map((item) => item.case_id),
      future_split_case_ids: futureSelected.map((item) => item.case_id),
      total_cases: selectedCases.length,
    },
  };
}

async function runUnseenDataset(input: {
  datasetLabel: 'unseen_holdout_v1' | 'future_split_v1';
  outputDir: string;
  cases: EvaluationCase[];
  sourcePath: string;
}): Promise<{
  ndsResults: NdsEvalRunRecord[];
  baselineResults: BaselineEvalRunRecord[];
  normalized: NormalizedComparisonOutput[];
  summary: Record<string, unknown>;
  ndsPatternSummary: ReturnType<typeof summarizePatterns>;
}> {
  ensureDir(input.outputDir);
  const ndsResults = await runNdsEvaluation(input.cases);
  const baselineResults = await runBaselineEvaluation(input.cases);
  const normalized = normalizeResults(ndsResults, baselineResults);
  const scores = autoScoreHeadToHead(ndsResults, baselineResults);
  const summary = generateSummary(input.cases, scores, ndsResults, baselineResults);
  const packet = `Reviewer packet delegated to combined blinded packet at ${path.relative(process.cwd(), path.join(BLIND_REVIEW_DIR, 'reviewer_packet.md'))}`;
  persistRunArtifacts({
    runDir: input.outputDir,
    ndsResults,
    baselineResults,
    normalizedResults: normalized,
    scores,
    summary,
    reviewerPacket: packet,
    reviewerDecode: {},
  });

  const ndsAssessments = input.cases.map((caseRecord) => {
    const normalizedRow = normalized.find((row) => row.case_id === caseRecord.case_id && row.system === 'nds_internal');
    if (!normalizedRow) {
      throw new Error(`Missing normalized NDS row for ${caseRecord.case_id}`);
    }
    return assessNormalizedRecord(caseRecord, normalizedRow);
  });
  const ndsPatternSummary = summarizePatterns(ndsAssessments);

  writeJson(path.join(input.outputDir, 'dataset_manifest.json'), {
    dataset_label: input.datasetLabel,
    source_path: path.relative(process.cwd(), input.sourcePath),
    case_ids: input.cases.map((item) => item.case_id),
    case_count: input.cases.length,
  });
  writeJson(path.join(input.outputDir, 'nds_pattern_assessments.json'), ndsAssessments);
  writeJson(path.join(input.outputDir, 'nds_pattern_summary.json'), ndsPatternSummary);

  return {
    ndsResults,
    baselineResults,
    normalized,
    summary,
    ndsPatternSummary,
  };
}

async function main(): Promise<void> {
  assertMissing(path.join(OUTPUT_DIR, 'execution_metadata.json'));
  ensureDir(OUTPUT_DIR);
  ensureDir(SENTINEL_DIR);
  ensureDir(HOLDOUT_DIR);
  ensureDir(FUTURE_SPLIT_DIR);
  ensureDir(BLIND_REVIEW_DIR);
  ensureDir(BLIND_REVIEW_PROTECTED_DIR);

  const executionStartedAt = new Date().toISOString();

  const frozenCases = loadFrozenSentinelCases();
  const beforeFrozenResults = readJson<RunRecord[]>(FROZEN_BEFORE_RESULTS_PATH);
  const rerunFrozenResults = (await runNdsEvaluation(frozenCases)) as RunRecord[];
  const beforeAssessments = frozenCases.map((caseRecord) => {
    const record = beforeFrozenResults.find((item) => item.case_id === caseRecord.case_id);
    if (!record) {
      throw new Error(`Missing pre-repair frozen result for ${caseRecord.case_id}`);
    }
    return assessRunRecord(caseRecord, record);
  });
  const afterAssessments = frozenCases.map((caseRecord) => {
    const record = rerunFrozenResults.find((item) => item.case_id === caseRecord.case_id);
    if (!record) {
      throw new Error(`Missing post-repair frozen rerun result for ${caseRecord.case_id}`);
    }
    return assessRunRecord(caseRecord, record);
  });
  const beforeSummary = summarizePatterns(beforeAssessments);
  const afterSummary = summarizePatterns(afterAssessments);
  const sentinelStatus = buildSentinelStatus(beforeSummary, afterSummary);
  writeJson(path.join(SENTINEL_DIR, 'pre_repair_assessments.json'), beforeAssessments);
  writeJson(path.join(SENTINEL_DIR, 'post_repair_assessments.json'), afterAssessments);
  writeJson(path.join(SENTINEL_DIR, 'sentinel_summary.json'), {
    status: sentinelStatus,
    before_summary: beforeSummary,
    after_summary: afterSummary,
  });
  writeJson(path.join(SENTINEL_DIR, 'nds_results.json'), rerunFrozenResults);

  const holdoutCases = convertBenchmarkCases(HOLDOUT_SOURCE_PATH);
  const futureSplitCases = convertBenchmarkCases(FUTURE_SPLIT_SOURCE_PATH);

  const holdoutRun = await runUnseenDataset({
    datasetLabel: 'unseen_holdout_v1',
    outputDir: HOLDOUT_DIR,
    cases: holdoutCases,
    sourcePath: HOLDOUT_SOURCE_PATH,
  });
  const futureSplitRun = await runUnseenDataset({
    datasetLabel: 'future_split_v1',
    outputDir: FUTURE_SPLIT_DIR,
    cases: futureSplitCases,
    sourcePath: FUTURE_SPLIT_SOURCE_PATH,
  });

  const blindPacket = buildSelectedBlindCases({
    holdoutCases,
    holdoutNormalized: holdoutRun.normalized,
    futureSplitCases,
    futureSplitNormalized: futureSplitRun.normalized,
  });
  fs.writeFileSync(path.join(BLIND_REVIEW_DIR, 'reviewer_packet.md'), buildBlindPacketMarkdown(blindPacket.cases), 'utf8');
  writeJson(path.join(BLIND_REVIEW_DIR, 'reviewer_packet.json'), blindPacket.cases);
  writeJson(path.join(BLIND_REVIEW_PROTECTED_DIR, 'reviewer_blind_decode.json'), blindPacket.decode);
  writeJson(path.join(BLIND_REVIEW_DIR, 'packet_manifest.json'), blindPacket.manifest);

  const holdoutTotals = holdoutRun.summary.totals as { nds_better_percent: number; total_cases_run: number };
  const futureTotals = futureSplitRun.summary.totals as { nds_better_percent: number; total_cases_run: number };
  const combinedUnseenCases = holdoutTotals.total_cases_run + futureTotals.total_cases_run;
  const combinedUnseenPercent = Math.round(
    ((holdoutTotals.nds_better_percent * holdoutTotals.total_cases_run +
      futureTotals.nds_better_percent * futureTotals.total_cases_run) /
      Math.max(1, combinedUnseenCases)) *
      100,
  ) / 100;

  writeJson(path.join(OUTPUT_DIR, 'execution_metadata.json'), {
    run_label: RUN_LABEL,
    execution_started_at: executionStartedAt,
    execution_finished_at: new Date().toISOString(),
    approved_plan: 'specs/072-real-human-corpus-expansion/post-repair-evaluation-plan-v1.md',
    branch_intent: '072-post-repair-evaluation-execution',
    repair_baseline_merge_commit: 'ee2ff2a4990b8117d8c80991edf9cd230ed0516a',
    planning_merge_commit: 'a49bbd534fd7ebd848a9a47fb8cc921b169c5836',
    rules_confirmed: {
      repair_code_altered: false,
      frozen_072_artifacts_altered: false,
      evaluation_inputs_altered_after_start: false,
      public_proof_claim_authorized: false,
    },
  });
  writeJson(path.join(OUTPUT_DIR, 'layer_manifest.json'), {
    frozen_072_sentinel: path.relative(process.cwd(), SENTINEL_DIR),
    unseen_holdout_v1: path.relative(process.cwd(), HOLDOUT_DIR),
    future_split_v1: path.relative(process.cwd(), FUTURE_SPLIT_DIR),
    blinded_human_review_v1: path.relative(process.cwd(), BLIND_REVIEW_DIR),
  });
  writeJson(path.join(OUTPUT_DIR, 'execution_summary.json'), {
    frozen_sentinel_status: sentinelStatus,
    holdout_nds_better_percent: holdoutTotals.nds_better_percent,
    future_split_nds_better_percent: futureTotals.nds_better_percent,
    combined_unseen_nds_better_percent: combinedUnseenPercent,
    blind_packet_case_count: blindPacket.manifest.total_cases,
    blind_packet_holdout_case_ids: blindPacket.manifest.holdout_case_ids,
    blind_packet_future_split_case_ids: blindPacket.manifest.future_split_case_ids,
  });

  console.log(
    JSON.stringify(
      {
        run_label: RUN_LABEL,
        output_dir: OUTPUT_DIR,
        sentinel_status: sentinelStatus,
        holdout_nds_better_percent: holdoutTotals.nds_better_percent,
        future_split_nds_better_percent: futureTotals.nds_better_percent,
        blind_packet_case_count: blindPacket.manifest.total_cases,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error('[072-post-repair-evaluation-execution-v1] fatal:', error);
  process.exit(1);
});