import fs from 'node:fs';
import path from 'node:path';
import { runNdsEvaluation, validateEvaluationCase } from '@/lib/ai/evaluation/pack';
import type { EvaluationCase, NormalizedComparisonOutput } from '@/lib/ai/evaluation/pack';

const RUN_LABEL = '072-targeted-output-repair-v1';
const INPUT_PATH = path.join(
  process.cwd(),
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  'blind-evaluation-run-v1',
  'input',
  '072_blind_frozen_input_v1.json'
);
const BEFORE_RESULTS_PATH = path.join(
  process.cwd(),
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  'blind-evaluation-run-v1',
  'nds_results.json'
);
const OUTPUT_DIR = path.join(
  process.cwd(),
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  RUN_LABEL
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

type RunRecord = NormalizedComparisonOutput & {
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

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function loadCases(): EvaluationCase[] {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Missing frozen input artifact: ${INPUT_PATH}`);
  }
  const cases = readJson<EvaluationCase[]>(INPUT_PATH);
  for (const caseRecord of cases) {
    const errors = validateEvaluationCase(caseRecord);
    if (errors.length > 0) {
      throw new Error(`Case ${caseRecord.case_id} failed validation: ${errors.join('; ')}`);
    }
  }
  return cases;
}

function getBestDirectionText(record: RunRecord): string {
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

function computeSourceOverlap(caseRecord: EvaluationCase, outputText: string): string[] {
  const sourceTokens = new Set(
    caseRecord.story_entries
      .flatMap((entry) => entry.text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [])
      .filter((token) => !STOPWORDS.has(token))
  );
  const loweredOutput = outputText.toLowerCase();
  return [...sourceTokens].filter((token) => loweredOutput.includes(token)).slice(0, 12);
}

function assessRecord(caseRecord: EvaluationCase, record: RunRecord): PatternAssessment {
  const angleTitle = record.artifact_payload?.best_direction?.angle_title ?? '';
  const nextMove = record.artifact_payload?.best_direction?.next_move ?? '';
  const outputText = getBestDirectionText(record);
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
    assessments.reduce((sum, item) => sum + item.source_overlap_count, 0) / assessments.length;

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

function buildRecommendation(beforeSummary: ReturnType<typeof summarizePatterns>, afterSummary: ReturnType<typeof summarizePatterns>): {
  label: 'REPAIR_PASS' | 'PARTIAL_REPAIR' | 'REPAIR_FAILED';
  rationale: string;
} {
  const criticalZero =
    afterSummary.correction_template_count === 0 &&
    afterSummary.meta_instructional_leak_count === 0 &&
    afterSummary.generic_next_move_suffix_count === 0;
  const phrasingZero = afterSummary.dangling_fragment_count === 0;
  const specificityImproved = afterSummary.average_source_overlap > beforeSummary.average_source_overlap;
  const lowSpecificityImproved =
    afterSummary.low_specificity_case_count <= beforeSummary.low_specificity_case_count;

  if (criticalZero && phrasingZero && specificityImproved && lowSpecificityImproved) {
    return {
      label: 'REPAIR_PASS',
      rationale:
        'All critical templating leaks drop to zero, phrasing artifacts clear, and source-overlap grounding improves on the fixed 072 set.',
    };
  }

  const criticalImproved =
    afterSummary.correction_template_count <= beforeSummary.correction_template_count &&
    afterSummary.meta_instructional_leak_count < beforeSummary.meta_instructional_leak_count &&
    afterSummary.generic_next_move_suffix_count < beforeSummary.generic_next_move_suffix_count;

  if (criticalImproved || specificityImproved) {
    return {
      label: 'PARTIAL_REPAIR',
      rationale:
        'The repaired writer shows measurable improvement, but one or more rubric thresholds still miss full pass criteria on the fixed 072 set.',
    };
  }

  return {
    label: 'REPAIR_FAILED',
    rationale:
      'Critical leak patterns or grounding metrics did not improve enough on the fixed 072 set to justify the targeted repair as successful.',
  };
}

function buildMarkdownSummary(input: {
  beforeSummary: ReturnType<typeof summarizePatterns>;
  afterSummary: ReturnType<typeof summarizePatterns>;
  beforeAssessments: PatternAssessment[];
  afterAssessments: PatternAssessment[];
  recommendation: { label: 'REPAIR_PASS' | 'PARTIAL_REPAIR' | 'REPAIR_FAILED'; rationale: string };
}): string {
  const perCaseLines = input.afterAssessments.map((afterAssessment) => {
    const beforeAssessment = input.beforeAssessments.find((item) => item.case_id === afterAssessment.case_id);
    return [
      `## ${afterAssessment.case_id} — ${afterAssessment.label}`,
      '',
      `- angle_title_before: ${beforeAssessment?.angle_title ?? 'n/a'}`,
      `- angle_title_after: ${afterAssessment.angle_title}`,
      `- correction_template_before: ${beforeAssessment?.has_correction_template ?? false}`,
      `- correction_template_after: ${afterAssessment.has_correction_template}`,
      `- meta_leak_before: ${beforeAssessment?.has_meta_instructional_leak ?? false}`,
      `- meta_leak_after: ${afterAssessment.has_meta_instructional_leak}`,
      `- generic_next_move_before: ${beforeAssessment?.has_generic_next_move_suffix ?? false}`,
      `- generic_next_move_after: ${afterAssessment.has_generic_next_move_suffix}`,
      `- dangling_fragment_before: ${beforeAssessment?.has_dangling_fragment ?? false}`,
      `- dangling_fragment_after: ${afterAssessment.has_dangling_fragment}`,
      `- source_overlap_before: ${beforeAssessment?.source_overlap_count ?? 0} (${(beforeAssessment?.source_overlap_tokens ?? []).join(', ') || 'none'})`,
      `- source_overlap_after: ${afterAssessment.source_overlap_count} (${afterAssessment.source_overlap_tokens.join(', ') || 'none'})`,
      '',
    ].join('\n');
  });

  return [
    '# 072 Targeted Output Repair V1 — Pattern Summary',
    '',
    '## Rubric',
    '',
    '- Critical leak threshold: correction-template titles, meta-instructional leakage, and generic next-move suffixes must all be zero.',
    '- Phrasing threshold: dangling fragment artifacts should be zero.',
    '- Specificity threshold: average source-overlap must improve versus the stored pre-repair blind-run outputs, and low-specificity cases must not increase.',
    '',
    '## Recommendation',
    '',
    `- result: ${input.recommendation.label}`,
    `- rationale: ${input.recommendation.rationale}`,
    '',
    '## Before vs After Summary',
    '',
    `- correction_template_count: ${input.beforeSummary.correction_template_count} -> ${input.afterSummary.correction_template_count}`,
    `- meta_instructional_leak_count: ${input.beforeSummary.meta_instructional_leak_count} -> ${input.afterSummary.meta_instructional_leak_count}`,
    `- generic_next_move_suffix_count: ${input.beforeSummary.generic_next_move_suffix_count} -> ${input.afterSummary.generic_next_move_suffix_count}`,
    `- dangling_fragment_count: ${input.beforeSummary.dangling_fragment_count} -> ${input.afterSummary.dangling_fragment_count}`,
    `- low_specificity_case_count: ${input.beforeSummary.low_specificity_case_count} -> ${input.afterSummary.low_specificity_case_count}`,
    `- average_source_overlap: ${input.beforeSummary.average_source_overlap} -> ${input.afterSummary.average_source_overlap}`,
    '',
    ...perCaseLines,
  ].join('\n');
}

async function main(): Promise<void> {
  ensureDir(OUTPUT_DIR);

  const cases = loadCases();
  const beforeResults = readJson<RunRecord[]>(BEFORE_RESULTS_PATH);
  const afterResults = (await runNdsEvaluation(cases)) as RunRecord[];

  writeJson(path.join(OUTPUT_DIR, 'nds_results.json'), afterResults);

  const beforeAssessments = cases.map((caseRecord) => {
    const beforeRecord = beforeResults.find((item) => item.case_id === caseRecord.case_id);
    if (!beforeRecord) {
      throw new Error(`Missing pre-repair record for case ${caseRecord.case_id}`);
    }
    return assessRecord(caseRecord, beforeRecord);
  });

  const afterAssessments = cases.map((caseRecord) => {
    const afterRecord = afterResults.find((item) => item.case_id === caseRecord.case_id);
    if (!afterRecord) {
      throw new Error(`Missing post-repair record for case ${caseRecord.case_id}`);
    }
    return assessRecord(caseRecord, afterRecord);
  });

  const beforeSummary = summarizePatterns(beforeAssessments);
  const afterSummary = summarizePatterns(afterAssessments);
  const recommendation = buildRecommendation(beforeSummary, afterSummary);

  writeJson(path.join(OUTPUT_DIR, 'repair_summary.json'), {
    run_label: RUN_LABEL,
    generated_at: new Date().toISOString(),
    input_artifact: path.relative(process.cwd(), INPUT_PATH),
    pre_repair_results: path.relative(process.cwd(), BEFORE_RESULTS_PATH),
    rubric: {
      critical_leaks_must_be_zero: true,
      dangling_fragments_must_be_zero: true,
      average_source_overlap_must_improve: true,
      low_specificity_cases_must_not_increase: true,
    },
    before_summary: beforeSummary,
    after_summary: afterSummary,
    before_assessments: beforeAssessments,
    after_assessments: afterAssessments,
    recommendation,
  });

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'pattern_summary.md'),
    buildMarkdownSummary({
      beforeSummary,
      afterSummary,
      beforeAssessments,
      afterAssessments,
      recommendation,
    }),
    'utf8'
  );

  console.log(
    `[${RUN_LABEL}] ${recommendation.label} correction=${beforeSummary.correction_template_count}->${afterSummary.correction_template_count} meta=${beforeSummary.meta_instructional_leak_count}->${afterSummary.meta_instructional_leak_count} overlap=${beforeSummary.average_source_overlap}->${afterSummary.average_source_overlap}`
  );
}

main().catch((error) => {
  console.error(`[${RUN_LABEL}] fatal:`, error);
  process.exit(1);
});