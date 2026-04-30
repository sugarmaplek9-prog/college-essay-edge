import fs from 'node:fs';
import path from 'node:path';
import { runNdsEvaluation, validateEvaluationCase } from '@/lib/ai/evaluation/pack';
import type { EvaluationCase, NdsEvalRunRecord } from '@/lib/ai/evaluation/pack';

const RUN_LABEL = '072-targeted-repair-v2';
const WORKTREE_ROOT = process.cwd();
const INPUT_SOURCE_ROOT = resolveInputSourceRoot();
const OUTPUT_DIR = path.join(
  WORKTREE_ROOT,
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  RUN_LABEL
);

const TARGET_CASE_IDS = ['RHC-026', 'RHC-028', 'RHC-030', 'RHC-001', 'RHC-004', 'RHC-005'] as const;
const GUARDRAIL_CASE_IDS = ['RHC-027', 'RHC-029', 'RHC-002', 'RHC-003'] as const;
const CASE_FILES = [
  path.join(INPUT_SOURCE_ROOT, 'evaluation', 'cases', '072_real_human_visible_bootstrap_v1.json'),
  path.join(INPUT_SOURCE_ROOT, 'evaluation', 'cases', '072_real_human_visible_medium_weak_v1.json'),
];

const HEDGE_PATTERN = /\b(could be|might be|maybe|perhaps|one option|possible direction|plausible direction|you could|you might)\b/i;
const META_PATTERN = /the strongest center is|faithful to the axis|interpretation is consistent|concrete text/i;
const ADMISSIONS_PATTERN = /\b(reader|admissions|applicant|judgment|trust|responsibility|listening|pressure|differentiated|credibility)\b/i;
const CONTRAST_PATTERN = /\b(would|instead|lets the reader|leave the reader|watch|summary|trait claim|resume|résumé)\b/i;
const STOPWORDS = new Set([
  'about', 'after', 'again', 'around', 'because', 'being', 'build', 'direction', 'essay', 'generic', 'reader', 'shows', 'story', 'student', 'stronger', 'through', 'trust', 'would',
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

function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resolveInputSourceRoot(): string {
  const candidates = [WORKTREE_ROOT, path.resolve(WORKTREE_ROOT, '..', '..')];
  for (const candidate of candidates) {
    const bootstrapPath = path.join(candidate, 'evaluation', 'cases', '072_real_human_visible_bootstrap_v1.json');
    const mediumWeakPath = path.join(candidate, 'evaluation', 'cases', '072_real_human_visible_medium_weak_v1.json');
    if (fs.existsSync(bootstrapPath) && fs.existsSync(mediumWeakPath)) {
      return candidate;
    }
  }

  return WORKTREE_ROOT;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
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

function loadEvaluationCases(filePath: string): EvaluationCase[] {
  const rawCases = readJson<Array<EvaluationCase | RawBenchmarkCase>>(filePath);

  return rawCases.map((caseRecord) => {
    if ('essay_project' in caseRecord) {
      return caseRecord;
    }

    return {
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
        project_type: 'personal_statement',
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
        why_included: `072 targeted repair V2 benchmark source: ${path.basename(filePath)}`,
        reviewer_warning: caseRecord.normalized_product_input.context_notes,
      },
    } satisfies EvaluationCase;
  });
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function loadPacketCases(): EvaluationCase[] {
  const caseIds = new Set([...TARGET_CASE_IDS, ...GUARDRAIL_CASE_IDS]);
  const loaded = CASE_FILES.flatMap((filePath) => loadEvaluationCases(filePath));
  const filtered = loaded.filter((caseRecord) => caseIds.has(caseRecord.case_id as typeof TARGET_CASE_IDS[number] | typeof GUARDRAIL_CASE_IDS[number]));

  for (const caseRecord of filtered) {
    const errors = validateEvaluationCase(caseRecord);
    if (errors.length > 0) {
      throw new Error(`Case ${caseRecord.case_id} failed validation: ${errors.join('; ')}`);
    }
  }

  if (filtered.length !== caseIds.size) {
    const found = new Set(filtered.map((caseRecord) => caseRecord.case_id));
    const missing = [...caseIds].filter((caseId) => !found.has(caseId));
    throw new Error(`Missing locked V2 packet cases: ${missing.join(', ')}`);
  }

  return filtered;
}

function collectBestDirectionText(record: RunRecord): string {
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

function isAdmissibleSuccess(record: RunRecord): boolean {
  return record.artifact_status === 'success' && record.artifact_payload?.status === 'success';
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

function scoreAdmissions(record: RunRecord): 0 | 1 | 2 {
  if (!isAdmissibleSuccess(record)) return 0;
  const reveal = record.artifact_payload?.best_direction?.what_it_reveals_about_the_student ?? '';
  if (!ADMISSIONS_PATTERN.test(reveal)) return 0;
  if (/reader|admissions|applicant/i.test(reveal) && /judgment|trust|responsibility|listening|pressure|credibility/i.test(reveal)) return 2;
  return 1;
}

function scoreDecisiveness(record: RunRecord): 0 | 1 | 2 {
  if (!isAdmissibleSuccess(record)) return 0;
  const best = record.artifact_payload?.best_direction;
  const joined = [best?.core_claim, best?.why_this_is_the_real_story].join(' ');
  if (!best?.angle_title || HEDGE_PATTERN.test(joined)) return 0;
  if (/show_strongest_direction/i.test(JSON.stringify(record)) && !HEDGE_PATTERN.test(joined)) return 2;
  return 1;
}

function scoreContrast(record: RunRecord): 0 | 1 | 2 {
  if (!isAdmissibleSuccess(record)) return 0;
  const contrast = record.artifact_payload?.best_direction?.why_it_beats_the_obvious_angle ?? '';
  if (!CONTRAST_PATTERN.test(contrast)) return 0;
  if (/lets the reader|leave the reader|watch/i.test(contrast) && /would|instead/i.test(contrast)) return 2;
  return 1;
}

function scorePremiumTone(record: RunRecord): 0 | 1 | 2 {
  if (!isAdmissibleSuccess(record)) return 0;
  const outputText = collectBestDirectionText(record);
  if (META_PATTERN.test(outputText)) return 0;
  if (!/reader|judgment|trust|responsibility|listening/i.test(outputText)) return 1;
  return 2;
}

function scoreGrounding(caseRecord: EvaluationCase, record: RunRecord): 0 | 1 | 2 {
  if (!isAdmissibleSuccess(record)) return 0;
  const overlap = computeSourceOverlap(caseRecord, collectBestDirectionText(record));
  if (overlap.length < 2) return 0;
  if (overlap.length >= 4) return 2;
  return 1;
}

type CategoryScoreRow = {
  case_id: string;
  bucket: 'target' | 'guardrail';
  total: number;
  admissions_judgment_quality: 0 | 1 | 2;
  recommendation_decisiveness: 0 | 1 | 2;
  stronger_vs_obvious_reasoning: 0 | 1 | 2;
  premium_coaching_tone: 0 | 1 | 2;
  student_specific_evidence_use: 0 | 1 | 2;
};

function classifyPacket(scores: CategoryScoreRow[]): 'V2_REPAIR_PASS' | 'V2_PARTIAL_REPAIR' | 'V2_REPAIR_FAILED' {
  const targetScores = scores.filter((score) => score.bucket === 'target');
  const targetCategoryTwos = {
    admissions_judgment_quality: targetScores.filter((score) => score.admissions_judgment_quality === 2).length,
    recommendation_decisiveness: targetScores.filter((score) => score.recommendation_decisiveness === 2).length,
    stronger_vs_obvious_reasoning: targetScores.filter((score) => score.stronger_vs_obvious_reasoning === 2).length,
    premium_coaching_tone: targetScores.filter((score) => score.premium_coaching_tone === 2).length,
    student_specific_evidence_use: targetScores.filter((score) => score.student_specific_evidence_use === 2).length,
  };
  const guardrailOk = scores.filter((score) => score.bucket === 'guardrail' && score.total >= 7).length === GUARDRAIL_CASE_IDS.length;
  const acceptedCategoryCount = Object.values(targetCategoryTwos).filter((count) => count >= 4).length;

  if (acceptedCategoryCount === 5 && guardrailOk) return 'V2_REPAIR_PASS';
  if (acceptedCategoryCount >= 1 || guardrailOk) return 'V2_PARTIAL_REPAIR';
  return 'V2_REPAIR_FAILED';
}

async function main(): Promise<void> {
  ensureDir(OUTPUT_DIR);

  const packetCases = loadPacketCases();
  const runResults = (await runNdsEvaluation(packetCases)) as RunRecord[];

  writeJson(path.join(OUTPUT_DIR, 'nds_results.json'), runResults);

  const categoryScores = packetCases.map((caseRecord) => {
    const result = runResults.find((record) => record.case_id === caseRecord.case_id);
    if (!result) {
      throw new Error(`Missing run result for ${caseRecord.case_id}`);
    }

    const admissions_judgment_quality = scoreAdmissions(result);
    const recommendation_decisiveness = scoreDecisiveness(result);
    const stronger_vs_obvious_reasoning = scoreContrast(result);
    const premium_coaching_tone = scorePremiumTone(result);
    const student_specific_evidence_use = scoreGrounding(caseRecord, result);
    const total =
      admissions_judgment_quality +
      recommendation_decisiveness +
      stronger_vs_obvious_reasoning +
      premium_coaching_tone +
      student_specific_evidence_use;

    return {
      case_id: caseRecord.case_id,
      label: caseRecord.label,
      bucket: TARGET_CASE_IDS.includes(caseRecord.case_id as typeof TARGET_CASE_IDS[number]) ? 'target' : 'guardrail',
      artifact_status: result.artifact_status,
      admissions_judgment_quality,
      recommendation_decisiveness,
      stronger_vs_obvious_reasoning,
      premium_coaching_tone,
      student_specific_evidence_use,
      lexical_overlap: isAdmissibleSuccess(result)
        ? computeSourceOverlap(caseRecord, collectBestDirectionText(result))
        : [],
      total,
    };
  });

  const finalClassification = classifyPacket(categoryScores);

  writeJson(path.join(OUTPUT_DIR, 'targeted-repair-v2-category-scores.json'), {
    run_label: RUN_LABEL,
    generated_at: new Date().toISOString(),
    target_case_ids: TARGET_CASE_IDS,
    guardrail_case_ids: GUARDRAIL_CASE_IDS,
    category_scores: categoryScores,
    final_classification: finalClassification,
    note: 'This is a machine-scored V2 implementation packet only.',
  });

  const markdown = [
    '# 072 Targeted Repair V2 — Implementation Packet Summary',
    '',
    '## Locked packet',
    '',
    `- Target cases: ${TARGET_CASE_IDS.join(', ')}`,
    `- Guardrail cases: ${GUARDRAIL_CASE_IDS.join(', ')}`,
    '',
    '## Machine classification',
    '',
    `- Final classification: ${finalClassification}`,
    '- Scope: machine-scored implementation packet only.',
    '',
    '## Category scores',
    '',
    ...categoryScores.map((score) =>
      `- ${score.case_id} [${score.bucket}] — admissions=${score.admissions_judgment_quality}, decisiveness=${score.recommendation_decisiveness}, contrast=${score.stronger_vs_obvious_reasoning}, tone=${score.premium_coaching_tone}, grounding=${score.student_specific_evidence_use}, total=${score.total}`
    ),
  ].join('\n');

  fs.writeFileSync(path.join(OUTPUT_DIR, 'targeted-repair-v2-implementation-summary.md'), `${markdown}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});