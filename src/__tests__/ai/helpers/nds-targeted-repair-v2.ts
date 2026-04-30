import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { EvaluationCase } from '@/lib/ai/evaluation/pack';
import type { NdsPayload, NdsResolvedSources } from '@/types/ai';

const WORKTREE_ROOT = process.cwd();
const INPUT_SOURCE_ROOT = resolveInputSourceRoot();
const CASE_FILES = [
  path.join(INPUT_SOURCE_ROOT, 'evaluation', 'cases', '072_real_human_visible_bootstrap_v1.json'),
  path.join(INPUT_SOURCE_ROOT, 'evaluation', 'cases', '072_real_human_visible_medium_weak_v1.json'),
];

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

export const V2_TARGET_CASE_IDS = ['RHC-026', 'RHC-028', 'RHC-030', 'RHC-001', 'RHC-004', 'RHC-005'] as const;
export const V2_GUARDRAIL_CASE_IDS = ['RHC-027', 'RHC-029', 'RHC-002', 'RHC-003'] as const;

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
  const rawCases = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Array<EvaluationCase | RawBenchmarkCase>;

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

export function load072Case(caseId: string): EvaluationCase {
  for (const filePath of CASE_FILES) {
    const cases = loadEvaluationCases(filePath);
    const found = cases.find((entry) => entry.case_id === caseId);
    if (found) {
      return found;
    }
  }

  throw new Error(`Unable to locate 072 evaluation case: ${caseId}`);
}

export function mapCaseToSources(caseRecord: EvaluationCase): NdsResolvedSources {
  return {
    essay_project: {
      id: caseRecord.essay_project.project_id,
      student_user_id: `eval_${caseRecord.case_id}`,
      title: caseRecord.label,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `eval_${caseRecord.case_id}`,
      first_name: 'Eval',
      last_name: caseRecord.case_id,
      grade: Number(caseRecord.student_profile.grade_level) || null,
      interests: caseRecord.student_profile.core_interests,
    },
    story_entries: caseRecord.story_entries.map((entry) => ({
      id: entry.id,
      title: entry.id,
      body: entry.text,
      category: null,
    })),
    current_draft: caseRecord.current_draft?.text
      ? {
          id: caseRecord.current_draft.id ?? `${caseRecord.case_id}_draft`,
          draft_text: caseRecord.current_draft.text,
          version_number: 1,
        }
      : null,
    school_context: caseRecord.school_context?.target_school || caseRecord.school_context?.notes
      ? {
          source_id: `${caseRecord.case_id}_school_ctx`,
          target_school: caseRecord.school_context?.target_school ?? null,
          signal_summary: caseRecord.school_context?.notes ?? 'school context provided',
        }
      : null,
    source_meta: {
      story_entry_count: caseRecord.story_entries.length,
      has_current_draft: Boolean(caseRecord.current_draft?.text),
      has_school_context: Boolean(caseRecord.school_context?.target_school || caseRecord.school_context?.notes),
    },
  };
}

export async function run072Case(caseId: string): Promise<{
  caseRecord: EvaluationCase;
  payload: NdsPayload;
}> {
  const caseRecord = load072Case(caseId);
  const contextPack = buildNdsNormalizedContextPack(mapCaseToSources(caseRecord));
  const readiness = evaluateNdsReadiness(contextPack);
  const run = await executeNdsModule({
    run_id: `v2-${caseId}`,
    module_key: 'narrative_direction_selection',
    execution_mode: readiness.execution_mode,
    context_pack: contextPack,
    module_versions: {
      prompt_version: 'v1',
      schema_version: 'v1',
      validator_version: 'v1',
    },
  });

  return {
    caseRecord,
    payload: run.candidate_payload as NdsPayload,
  };
}

const STOPWORDS = new Set([
  'about',
  'after',
  'again',
  'around',
  'because',
  'being',
  'build',
  'direction',
  'essay',
  'generic',
  'reader',
  'shows',
  'story',
  'student',
  'stronger',
  'through',
  'trust',
  'would',
]);

export function collectBestDirectionText(payload: NdsPayload): string {
  if (payload.status !== 'success') {
    return JSON.stringify(payload);
  }

  return [
    payload.best_direction.angle_title,
    payload.best_direction.core_claim,
    payload.best_direction.why_this_is_the_real_story,
    payload.best_direction.what_it_reveals_about_the_student,
    payload.best_direction.why_it_beats_the_obvious_angle,
    payload.best_direction.main_risk_if_written_poorly,
    payload.best_direction.next_move,
  ].join(' ');
}

export function computeSourceOverlap(caseRecord: EvaluationCase, outputText: string): string[] {
  const sourceTokens = new Set(
    caseRecord.story_entries
      .flatMap((entry) => entry.text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [])
      .filter((token) => !STOPWORDS.has(token))
  );
  const loweredOutput = outputText.toLowerCase();
  return [...sourceTokens].filter((token) => loweredOutput.includes(token)).slice(0, 12);
}