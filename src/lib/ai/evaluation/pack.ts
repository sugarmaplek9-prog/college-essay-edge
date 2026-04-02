import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Ajv from 'ajv';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import {
  executeNdsModule,
  NDS_PROVIDER_PATH_CLASSIFICATION,
} from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import { validateNdsOutput } from '@/lib/ai/modules/narrative-direction-selection/validator';
import {
  buildFreeAiBaselinePayload,
  scoreNdsPayload,
} from '@/lib/ai/evaluation/nds-evaluation';
import type { NdsResolvedSources, NdsPayload } from '@/types/ai';

export type EvalDifficulty = 'weak' | 'medium' | 'strong';

export interface EvaluationCase {
  case_id: string;
  label: string;
  difficulty: EvalDifficulty;
  tags: string[];
  student_profile: {
    grade_level: string;
    intended_majors: string[];
    core_interests: string[];
    identity_notes: string[];
  };
  essay_project: {
    project_id: string;
    project_type: 'personal_statement';
    target_school: string | null;
  };
  story_entries: Array<{
    id: string;
    text: string;
  }>;
  current_draft: {
    id: string | null;
    text: string | null;
  };
  school_context: {
    target_school: string | null;
    notes: string;
  };
  expected_conditions: {
    should_be_needs_more_input: boolean;
    should_have_clear_winner: boolean;
    likely_bad_baseline_behavior: string[];
  };
  author_notes: {
    why_included: string;
    reviewer_warning: string;
  };
}

export interface NdsEvalRunRecord {
  run_id: string;
  case_id: string;
  system: 'nds_internal';
  provider_classification: 'deterministic_stub' | 'real_provider';
  readiness_state: string;
  execution_mode: string;
  validator_decision: string;
  artifact_status: string;
  artifact_payload: Record<string, unknown>;
  trace: {
    context_pack: Record<string, unknown>;
    warnings: string[];
  };
}

export interface BaselineEvalRunRecord {
  run_id: string;
  case_id: string;
  system: 'baseline_free_ai';
  baseline_mode: 'deterministic_prompt_harness' | 'real_provider';
  raw_output: Record<string, unknown>;
  normalized_output: Record<string, unknown>;
  warnings: string[];
}

export interface NormalizedComparisonOutput {
  case_id: string;
  system: 'nds_internal' | 'baseline_free_ai';
  status: 'success' | 'needs_more_input' | 'failed';
  best_direction: {
    angle_title: string;
    core_claim: string;
    why_this_is_the_real_story: string;
    what_it_reveals_about_the_student: string;
    why_it_beats_the_obvious_angle: string;
    main_risk_if_written_poorly: string;
    next_move: string;
  };
  alternatives: Array<{
    angle_title: string;
    what_this_angle_would_focus_on: string;
    why_it_is_weaker: string;
    failure_mode: string;
  }>;
  evidence_anchors: string[];
  depth_signals: {
    detected_tension: string | null;
    detected_shift: string | null;
    obvious_but_weaker_angle: string | null;
    essay_opportunity: string | null;
  };
  recovery_question: string | null;
  meta: {
    clear_winner_present: boolean;
    alternative_count: number;
    evidence_anchor_count: number;
  };
}

export interface EvaluationManifest {
  evaluation_run_id: string;
  module: 'narrative_direction_selection';
  module_version: 'v1';
  prompt_version: 'v1';
  validator_version: 'v1';
  provider_classification: 'deterministic_stub' | 'real_provider';
  baseline_mode: 'deterministic_prompt_harness' | 'real_provider';
  case_count: number;
  generated_at: string;
}

export const EVAL_ROOT = 'evaluation';
export const CASE_DIR = path.join(EVAL_ROOT, 'cases');
export const RUNS_DIR = path.join(EVAL_ROOT, 'runs');
const CASE_SCHEMA_PATH = path.join(EVAL_ROOT, 'schemas', 'evaluation-case.schema.json');
const SCORE_SCHEMA_PATH = path.join(EVAL_ROOT, 'schemas', 'evaluation-score.schema.json');

function loadSchema(filePath: string): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function ensureDir(p: string): void {
  fs.mkdirSync(p, { recursive: true });
}

function readJsonFile<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function writeJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function listCaseFiles(caseDir = CASE_DIR): string[] {
  if (!fs.existsSync(caseDir)) return [];
  return fs
    .readdirSync(caseDir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(caseDir, name));
}

export function validateEvaluationCase(caseObj: unknown): string[] {
  const errors: string[] = [];
  const caseSchema = loadSchema(CASE_SCHEMA_PATH);

  if (caseSchema) {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(caseSchema);
    const valid = validate(caseObj);
    if (!valid && validate.errors) {
      for (const e of validate.errors) {
        const err = e as { instancePath?: string; dataPath?: string; message?: string };
        errors.push(`schema: ${err.instancePath || err.dataPath || '/'} ${err.message ?? 'invalid'}`);
      }
    }
  }

  if (!isObject(caseObj)) return ['case must be an object'];

  const requiredTop = [
    'case_id',
    'label',
    'difficulty',
    'tags',
    'student_profile',
    'essay_project',
    'story_entries',
    'current_draft',
    'school_context',
    'expected_conditions',
    'author_notes',
  ];

  for (const key of requiredTop) {
    if (!(key in caseObj)) errors.push(`missing required field: ${key}`);
  }

  if (typeof caseObj.case_id !== 'string' || caseObj.case_id.length === 0) {
    errors.push('case_id must be non-empty string');
  }

  if (!['weak', 'medium', 'strong'].includes(String(caseObj.difficulty))) {
    errors.push('difficulty must be weak|medium|strong');
  }

  if (!Array.isArray(caseObj.story_entries)) {
    errors.push('story_entries must be array');
  }

  const allowedTags = new Set([
    'red_team',
    'messy_notes',
    'draft_present',
    'school_sensitive',
    'conflicting_signals',
    'resume_list',
    'stale_draft_risk',
    'parent_advisor_risk',
    'generic_padding_risk',
    'fake_confidence_temptation',
  ]);
  if (!Array.isArray(caseObj.tags)) {
    errors.push('tags must be an array');
  } else {
    caseObj.tags.forEach((tag, idx) => {
      if (typeof tag !== 'string' || !allowedTags.has(tag)) {
        errors.push(`tags[${idx}] is invalid: ${String(tag)}`);
      }
    });
  }

  const storyHasText = Array.isArray(caseObj.story_entries)
    ? caseObj.story_entries.some((s) => isObject(s) && typeof s.text === 'string' && s.text.trim().length > 0)
    : false;

  const draftText = isObject(caseObj.current_draft) && typeof caseObj.current_draft.text === 'string'
    ? caseObj.current_draft.text.trim()
    : '';

  if (!storyHasText && draftText.length === 0) {
    errors.push('at least one of story_entries or current_draft.text must be non-empty');
  }

  if (!isObject(caseObj.expected_conditions)) {
    errors.push('expected_conditions must exist');
  }

  const whyIncluded =
    isObject(caseObj.author_notes) && typeof caseObj.author_notes.why_included === 'string'
      ? caseObj.author_notes.why_included.trim()
      : '';

  if (whyIncluded.length === 0) {
    errors.push('author_notes.why_included is required');
  }

  return errors;
}

export function validateScoreRecords(scores: unknown): string[] {
  const errors: string[] = [];
  const scoreSchema = loadSchema(SCORE_SCHEMA_PATH);

  if (!Array.isArray(scores)) {
    return ['scores must be an array'];
  }

  if (!scoreSchema) {
    return ['score schema file missing'];
  }

  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(scoreSchema);

  scores.forEach((record, idx) => {
    const valid = validate(record);
    if (!valid && validate.errors) {
      validate.errors.forEach((e) => {
        const err = e as { instancePath?: string; dataPath?: string; message?: string };
        errors.push(
          `score[${idx}] ${err.instancePath || err.dataPath || '/'} ${err.message ?? 'invalid'}`
        );
      });
    }
  });

  return errors;
}

export function loadCases(caseDir = CASE_DIR): EvaluationCase[] {
  const files = listCaseFiles(caseDir);
  const loaded = files.map((file) => readJsonFile<EvaluationCase>(file));

  const ids = new Set<string>();
  for (const c of loaded) {
    if (ids.has(c.case_id)) {
      throw new Error(`Duplicate case_id detected: ${c.case_id}`);
    }
    ids.add(c.case_id);

    const errors = validateEvaluationCase(c);
    if (errors.length > 0) {
      throw new Error(`Case ${c.case_id} failed validation: ${errors.join('; ')}`);
    }
  }

  return loaded;
}

export function createEvaluationRunId(prefix = 'nds_eval'): string {
  const date = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15);
  const suffix = randomUUID().slice(0, 8);
  return `${prefix}_${date}_${suffix}`;
}

function mapCaseToResolvedSources(c: EvaluationCase): NdsResolvedSources {
  return {
    essay_project: {
      id: c.essay_project.project_id,
      student_user_id: `eval_${c.case_id}`,
      title: c.label,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `eval_${c.case_id}`,
      first_name: 'Eval',
      last_name: c.case_id,
      grade: Number(c.student_profile.grade_level) || null,
      interests: c.student_profile.core_interests,
    },
    story_entries: c.story_entries.map((s) => ({
      id: s.id,
      title: s.id,
      body: s.text,
      category: null,
    })),
    current_draft: c.current_draft.text
      ? {
          id: c.current_draft.id ?? `${c.case_id}_draft`,
          draft_text: c.current_draft.text,
          version_number: 1,
        }
      : null,
    school_context: c.school_context.target_school
      ? {
          source_id: `${c.case_id}_school_ctx`,
          target_school: c.school_context.target_school,
          signal_summary: c.school_context.notes || 'school context provided',
        }
      : null,
    source_meta: {
      story_entry_count: c.story_entries.length,
      has_current_draft: !!c.current_draft.text,
      has_school_context: !!c.school_context.target_school,
    },
  };
}

function deriveArtifactStatus(decision: string): string {
  if (decision === 'accept') return 'success';
  if (decision === 'accept_partial') return 'partial';
  if (decision === 'convert_to_needs_more_input') return 'needs_more_input';
  if (decision === 'block') return 'blocked';
  return 'failed_validation';
}

export async function runNdsEvaluation(cases: EvaluationCase[]): Promise<NdsEvalRunRecord[]> {
  const out: NdsEvalRunRecord[] = [];

  for (const c of cases) {
    const sources = mapCaseToResolvedSources(c);
    const contextPack = buildNdsNormalizedContextPack(sources);
    const readiness = evaluateNdsReadiness(contextPack);

    const moduleOutput = await executeNdsModule({
      run_id: `eval_nds_${c.case_id}`,
      module_key: 'narrative_direction_selection',
      execution_mode: readiness.execution_mode,
      context_pack: contextPack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const validator = validateNdsOutput(moduleOutput.candidate_payload);

    out.push({
      run_id: `eval_nds_${c.case_id}_${Date.now()}`,
      case_id: c.case_id,
      system: 'nds_internal',
      provider_classification: NDS_PROVIDER_PATH_CLASSIFICATION,
      readiness_state: readiness.readiness_state,
      execution_mode: readiness.execution_mode,
      validator_decision: validator.decision,
      artifact_status: deriveArtifactStatus(validator.decision),
      artifact_payload: moduleOutput.candidate_payload,
      trace: {
        context_pack: contextPack as unknown as Record<string, unknown>,
        warnings: validator.warningCodes,
      },
    });
  }

  return out;
}

export async function runBaselineEvaluation(cases: EvaluationCase[]): Promise<BaselineEvalRunRecord[]> {
  const out: BaselineEvalRunRecord[] = [];

  for (const c of cases) {
    const sources = mapCaseToResolvedSources(c);
    const contextPack = buildNdsNormalizedContextPack(sources);
    const hasVisibleSubstance =
      contextPack.story_signals.length > 0 || contextPack.draft_signals.length > 0;
    const baselineModeExecution = hasVisibleSubstance ? 'standard' : 'needs_more_input';
    const payload = buildFreeAiBaselinePayload(contextPack, baselineModeExecution);

    out.push({
      run_id: `eval_baseline_${c.case_id}_${Date.now()}`,
      case_id: c.case_id,
      system: 'baseline_free_ai',
      baseline_mode: 'deterministic_prompt_harness',
      raw_output: payload as unknown as Record<string, unknown>,
      normalized_output: payload as unknown as Record<string, unknown>,
      warnings: [],
    });
  }

  return out;
}

function toComparable(payload: NdsPayload): Omit<NormalizedComparisonOutput, 'case_id' | 'system'> {
  if (payload.status === 'needs_more_input') {
    return {
      status: 'needs_more_input',
      best_direction: {
        angle_title: '',
        core_claim: '',
        why_this_is_the_real_story: '',
        what_it_reveals_about_the_student: '',
        why_it_beats_the_obvious_angle: '',
        main_risk_if_written_poorly: '',
        next_move: '',
      },
      alternatives: [],
      evidence_anchors: [],
      depth_signals: {
        detected_tension: null,
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: payload.recovery_question,
      meta: {
        clear_winner_present: false,
        alternative_count: 0,
        evidence_anchor_count: 0,
      },
    };
  }

  return {
    status: 'success',
    best_direction: {
      angle_title: payload.best_direction.angle_title,
      core_claim: payload.best_direction.core_claim,
      why_this_is_the_real_story: payload.best_direction.why_this_is_the_real_story,
      what_it_reveals_about_the_student: payload.best_direction.what_it_reveals_about_the_student,
      why_it_beats_the_obvious_angle: payload.best_direction.why_it_beats_the_obvious_angle,
      main_risk_if_written_poorly: payload.best_direction.main_risk_if_written_poorly,
      next_move: payload.best_direction.next_move,
    },
    alternatives: payload.alternatives.map((a: {
      angle_title: string;
      what_this_angle_would_focus_on: string;
      why_it_is_weaker: string;
      failure_mode: string;
    }) => ({
      angle_title: a.angle_title,
      what_this_angle_would_focus_on: a.what_this_angle_would_focus_on,
      why_it_is_weaker: a.why_it_is_weaker,
      failure_mode: a.failure_mode,
    })),
    evidence_anchors: payload.evidence_anchors.map((a: { label: string }) => a.label),
    depth_signals: payload.depth_signals,
    recovery_question: null,
    meta: {
      clear_winner_present: payload.best_direction.angle_title.trim().length > 0,
      alternative_count: payload.alternatives.length,
      evidence_anchor_count: payload.evidence_anchors.length,
    },
  };
}

export function normalizeResults(
  ndsResults: NdsEvalRunRecord[],
  baselineResults: BaselineEvalRunRecord[]
): NormalizedComparisonOutput[] {
  const normalized: NormalizedComparisonOutput[] = [];

  for (const r of ndsResults) {
    const payload = r.artifact_payload as unknown as NdsPayload;
    normalized.push({
      case_id: r.case_id,
      system: 'nds_internal',
      ...toComparable(payload),
    });
  }

  for (const r of baselineResults) {
    const payload = r.normalized_output as unknown as NdsPayload;
    normalized.push({
      case_id: r.case_id,
      system: 'baseline_free_ai',
      ...toComparable(payload),
    });
  }

  return normalized;
}

export interface HeadToHeadScoreRecord {
  case_id: string;
  reviewer_id: string;
  systems_compared: [string, string];
  scores: Record<string, { nds: number; baseline: number }>;
  binary_judgment: {
    nds_clearly_better_than_baseline: boolean;
  };
  reviewer_notes: {
    nds_strength: string;
    baseline_failure: string;
    important_comment: string;
  };
}

export function autoScoreHeadToHead(
  ndsResults: NdsEvalRunRecord[],
  baselineResults: BaselineEvalRunRecord[]
): HeadToHeadScoreRecord[] {
  const baselineByCase = new Map<string, BaselineEvalRunRecord>();
  for (const b of baselineResults) baselineByCase.set(b.case_id, b);

  return ndsResults.map((n) => {
    const b = baselineByCase.get(n.case_id);
    if (!b) {
      throw new Error(`Missing baseline result for case ${n.case_id}`);
    }

    const ndsPayload = n.artifact_payload as unknown as NdsPayload;
    const baselinePayload = b.normalized_output as unknown as NdsPayload;
    const nds = scoreNdsPayload(ndsPayload);
    const base = scoreNdsPayload(baselinePayload);

    const ndsFive = Math.max(1, Math.min(5, Math.round(nds.total / 2)));
    const baseFive = Math.max(1, Math.min(5, Math.round(base.total / 2)));

    const scores = {
      divergence_quality: { nds: ndsFive, baseline: baseFive },
      conviction_quality: { nds: ndsFive, baseline: baseFive },
      evidence_grounding: { nds: ndsFive, baseline: baseFive },
      next_step_usefulness: { nds: ndsFive, baseline: baseFive },
      substitution_risk: { nds: ndsFive, baseline: baseFive },
      student_dignity_tone: { nds: ndsFive, baseline: baseFive },
      product_sharpness: { nds: ndsFive, baseline: baseFive },
    };

    return {
      case_id: n.case_id,
      reviewer_id: 'auto_reviewer',
      systems_compared: ['nds_internal', 'baseline_free_ai'],
      scores,
      binary_judgment: {
        nds_clearly_better_than_baseline: nds.total > base.total,
      },
      reviewer_notes: {
        nds_strength: nds.notes.join(', ') || 'stronger structure and grounding',
        baseline_failure: base.notes.join(', ') || 'more generic and less grounded',
        important_comment: 'Auto-scored for engineering verification; replace with human review for release gate.',
      },
    };
  });
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

export function generateSummary(
  cases: EvaluationCase[],
  scores: HeadToHeadScoreRecord[],
  ndsResults: NdsEvalRunRecord[],
  baselineResults: BaselineEvalRunRecord[]
): Record<string, unknown> {
  const scoreDims = [
    'divergence_quality',
    'conviction_quality',
    'evidence_grounding',
    'next_step_usefulness',
    'substitution_risk',
    'student_dignity_tone',
    'product_sharpness',
  ];

  const byCase = new Map<string, EvaluationCase>(cases.map((c) => [c.case_id, c]));

  const overallByDim = scoreDims.map((dim) => {
    const ndsVals = scores.map((s) => s.scores[dim].nds);
    const baseVals = scores.map((s) => s.scores[dim].baseline);
    return {
      dimension: dim,
      nds_avg: avg(ndsVals),
      baseline_avg: avg(baseVals),
      delta: Math.round((avg(ndsVals) - avg(baseVals)) * 100) / 100,
    };
  });

  const betterCount = scores.filter((s) => s.binary_judgment.nds_clearly_better_than_baseline).length;

  const byDifficulty = ['weak', 'medium', 'strong'].map((d) => {
    const ids = cases.filter((c) => c.difficulty === d).map((c) => c.case_id);
    const scoped = scores.filter((s) => ids.includes(s.case_id));
    return {
      difficulty: d,
      case_count: ids.length,
      nds_better_percent: ids.length === 0 ? 0 : Math.round((scoped.filter((s) => s.binary_judgment.nds_clearly_better_than_baseline).length / ids.length) * 100),
    };
  });

  const redTeamBuckets = {
    stale_draft_contamination_risk: 'stale_draft_risk',
    parent_advisor_contamination_risk: 'parent_advisor_risk',
    conflicting_evidence: 'conflicting_signals',
    thin_school_or_generic_padding_risk: 'generic_padding_risk',
    resume_list_input: 'resume_list',
    fake_confidence_temptation_cases: 'fake_confidence_temptation',
  } as const;

  const averageScoreDeltaByCase = (record: HeadToHeadScoreRecord): number => {
    const dims = Object.values(record.scores);
    if (dims.length === 0) return 0;
    const raw = dims.reduce((sum, d) => sum + (d.nds - d.baseline), 0) / dims.length;
    return Math.round(raw * 100) / 100;
  };

  const redTeam = Object.entries(redTeamBuckets).map(([k, tag]) => {
    const ids = cases.filter((c) => c.tags.includes(tag)).map((c) => c.case_id);
    const scoped = scores.filter((s) => ids.includes(s.case_id));
    const avgScoreDelta =
      scoped.length === 0
        ? 0
        : Math.round((scoped.reduce((sum, s) => sum + averageScoreDeltaByCase(s), 0) / scoped.length) * 100) / 100;
    return {
      bucket: k,
      case_count: ids.length,
      nds_better_percent:
        ids.length === 0
          ? 0
          : Math.round(
              (scoped.filter((s) => s.binary_judgment.nds_clearly_better_than_baseline).length /
                ids.length) *
                100
            ),
      avg_score_delta: avgScoreDelta,
    };
  });

  const ndsNmi = ndsResults.filter((r) => r.artifact_status === 'needs_more_input').length;
  const baselineNmi = baselineResults.filter(
    (r) => (r.normalized_output as unknown as NdsPayload).status === 'needs_more_input'
  ).length;

  const missingScoring = cases.length - scores.length;
  const ambiguous = scores.filter((s) => !s.binary_judgment.nds_clearly_better_than_baseline).length;

  return {
    totals: {
      total_cases_run: cases.length,
      total_scored_cases: scores.length,
      nds_better_percent: Math.round((betterCount / Math.max(1, scores.length)) * 100),
    },
    overall_dimension_summary: overallByDim,
    difficulty_segment_summary: byDifficulty,
    red_team_summary: redTeam,
    failure_summary: {
      nds_needs_more_input_cases: ndsNmi,
      baseline_needs_more_input_cases: baselineNmi,
      structural_normalization_failures: 0,
      scoring_missingness: missingScoring,
      ambiguous_reviewer_outcomes: ambiguous,
    },
    generated_at: new Date().toISOString(),
  };
}

export function toCsvSummary(summary: Record<string, unknown>): string {
  const lines: string[] = [];
  lines.push('section,key,value');

  const totals = summary.totals as Record<string, unknown>;
  for (const [k, v] of Object.entries(totals)) {
    lines.push(`totals,${k},${v}`);
  }

  const dims = summary.overall_dimension_summary as Array<Record<string, unknown>>;
  for (const d of dims) {
    lines.push(`dimension,${d.dimension},nds=${d.nds_avg}|baseline=${d.baseline_avg}|delta=${d.delta}`);
  }

  const diff = summary.difficulty_segment_summary as Array<Record<string, unknown>>;
  for (const d of diff) {
    lines.push(`difficulty,${d.difficulty},cases=${d.case_count}|nds_better_percent=${d.nds_better_percent}`);
  }

  const red = summary.red_team_summary as Array<Record<string, unknown>>;
  for (const r of red) {
    lines.push(
      `red_team,${r.bucket},cases=${r.case_count}|nds_better_percent=${r.nds_better_percent}|avg_score_delta=${r.avg_score_delta}`
    );
  }

  const failure = summary.failure_summary as Record<string, unknown>;
  for (const [k, v] of Object.entries(failure)) {
    lines.push(`failure,${k},${v}`);
  }

  return lines.join('\n');
}

export function toMarkdownSummary(summary: Record<string, unknown>): string {
  const totals = summary.totals as Record<string, unknown>;
  const dims = summary.overall_dimension_summary as Array<Record<string, unknown>>;
  const difficulty = summary.difficulty_segment_summary as Array<Record<string, unknown>>;
  const redTeam = summary.red_team_summary as Array<Record<string, unknown>>;
  const failure = summary.failure_summary as Record<string, unknown>;

  const lines: string[] = [];
  lines.push('# Evaluation Summary');
  lines.push('');
  lines.push('## Totals');
  for (const [k, v] of Object.entries(totals)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push('## Overall dimension summary');
  lines.push('| Dimension | NDS Avg | Baseline Avg | Delta |');
  lines.push('|---|---:|---:|---:|');
  for (const d of dims) {
    lines.push(`| ${d.dimension} | ${d.nds_avg} | ${d.baseline_avg} | ${d.delta} |`);
  }
  lines.push('');
  lines.push('## Difficulty summary');
  lines.push('| Difficulty | Case Count | NDS Better % |');
  lines.push('|---|---:|---:|');
  for (const d of difficulty) {
    lines.push(`| ${d.difficulty} | ${d.case_count} | ${d.nds_better_percent} |`);
  }
  lines.push('');
  lines.push('## Red-team summary');
  lines.push('| Bucket | Case Count | NDS Better % | Avg Score Delta |');
  lines.push('|---|---:|---:|---:|');
  for (const r of redTeam) {
    lines.push(`| ${r.bucket} | ${r.case_count} | ${r.nds_better_percent} | ${r.avg_score_delta} |`);
  }
  lines.push('');
  lines.push('## Failure summary');
  for (const [k, v] of Object.entries(failure)) lines.push(`- ${k}: ${v}`);
  lines.push('');
  lines.push(`generated_at: ${summary.generated_at}`);

  return lines.join('\n');
}

export function generateReviewerPacket(
  cases: EvaluationCase[],
  normalized: NormalizedComparisonOutput[],
  options?: { blind?: boolean }
): { packet: string; decode: Record<string, { A: string; B: string }> } {
  const blind = options?.blind ?? true;
  const byCase = new Map<string, { nds?: NormalizedComparisonOutput; baseline?: NormalizedComparisonOutput }>();
  for (const n of normalized) {
    const row = byCase.get(n.case_id) ?? {};
    if (n.system === 'nds_internal') row.nds = n;
    if (n.system === 'baseline_free_ai') row.baseline = n;
    byCase.set(n.case_id, row);
  }

  const lines: string[] = [];
  const decode: Record<string, { A: string; B: string }> = {};

  lines.push('# Reviewer Packet');
  lines.push(`mode: ${blind ? 'blind' : 'labeled'}`);
  lines.push('');

  for (const c of cases) {
    const pair = byCase.get(c.case_id);
    if (!pair?.nds || !pair?.baseline) continue;

    const swap = c.case_id.charCodeAt(c.case_id.length - 1) % 2 === 0;
    const first = swap ? pair.baseline : pair.nds;
    const second = swap ? pair.nds : pair.baseline;

    decode[c.case_id] = {
      A: first.system,
      B: second.system,
    };

    lines.push(`## ${c.case_id} — ${c.label}`);
    lines.push(`difficulty: ${c.difficulty}`);
    lines.push(`tags: ${c.tags.join(', ')}`);
    lines.push('');
    lines.push('### Student input packet');
    lines.push(`stories: ${c.story_entries.length}`);
    lines.push(`draft present: ${!!c.current_draft.text}`);
    lines.push(`school context: ${c.school_context.target_school ?? 'none'}`);
    lines.push('');

    if (blind) {
      lines.push('### Output A');
      lines.push(JSON.stringify(first, null, 2));
      lines.push('');
      lines.push('### Output B');
      lines.push(JSON.stringify(second, null, 2));
    } else {
      lines.push('### NDS output');
      lines.push(JSON.stringify(pair.nds, null, 2));
      lines.push('');
      lines.push('### Baseline output');
      lines.push(JSON.stringify(pair.baseline, null, 2));
    }

    lines.push('');
    lines.push('### Score form');
    lines.push('- divergence_quality (1-5 each)');
    lines.push('- conviction_quality (1-5 each)');
    lines.push('- evidence_grounding (1-5 each)');
    lines.push('- next_step_usefulness (1-5 each)');
    lines.push('- substitution_risk (1-5 each)');
    lines.push('- student_dignity_tone (1-5 each)');
    lines.push('- product_sharpness (1-5 each)');
    lines.push('- nds_clearly_better_than_baseline (true/false)');
    lines.push('');
  }

  return {
    packet: lines.join('\n'),
    decode,
  };
}

export function createManifest(caseCount: number): EvaluationManifest {
  return {
    evaluation_run_id: createEvaluationRunId(),
    module: 'narrative_direction_selection',
    module_version: 'v1',
    prompt_version: 'v1',
    validator_version: 'v1',
    provider_classification: NDS_PROVIDER_PATH_CLASSIFICATION,
    baseline_mode: 'deterministic_prompt_harness',
    case_count: caseCount,
    generated_at: new Date().toISOString(),
  };
}

export function initializeRunFolder(manifest: EvaluationManifest): string {
  ensureDir(RUNS_DIR);
  const runDir = path.join(RUNS_DIR, manifest.evaluation_run_id);
  if (fs.existsSync(runDir)) {
    throw new Error(`Run folder already exists: ${runDir}`);
  }
  ensureDir(runDir);
  writeJsonFile(path.join(runDir, 'manifest.json'), manifest);
  return runDir;
}

export function persistRunArtifacts(params: {
  runDir: string;
  ndsResults: NdsEvalRunRecord[];
  baselineResults: BaselineEvalRunRecord[];
  normalizedResults: NormalizedComparisonOutput[];
  scores: HeadToHeadScoreRecord[];
  summary: Record<string, unknown>;
  reviewerPacket: string;
  reviewerDecode: Record<string, { A: string; B: string }>;
}): void {
  const ndsCaseDir = path.join(params.runDir, 'nds_cases');
  const baselineCaseDir = path.join(params.runDir, 'baseline_cases');
  const normalizedCaseDir = path.join(params.runDir, 'normalized_cases');
  ensureDir(ndsCaseDir);
  ensureDir(baselineCaseDir);
  ensureDir(normalizedCaseDir);

  writeJsonFile(path.join(params.runDir, 'nds_results.json'), params.ndsResults);
  writeJsonFile(path.join(params.runDir, 'baseline_results.json'), params.baselineResults);
  writeJsonFile(path.join(params.runDir, 'normalized_results.json'), params.normalizedResults);
  writeJsonFile(path.join(params.runDir, 'scores.json'), params.scores);
  writeJsonFile(path.join(params.runDir, 'summary.json'), params.summary);
  fs.writeFileSync(path.join(params.runDir, 'summary.csv'), toCsvSummary(params.summary), 'utf-8');
  fs.writeFileSync(path.join(params.runDir, 'summary.md'), toMarkdownSummary(params.summary), 'utf-8');
  fs.writeFileSync(path.join(params.runDir, 'reviewer_packet.md'), params.reviewerPacket, 'utf-8');
  writeJsonFile(path.join(params.runDir, 'reviewer_blind_decode.json'), params.reviewerDecode);

  params.ndsResults.forEach((row) => {
    writeJsonFile(path.join(ndsCaseDir, `${row.case_id}.json`), row);
  });
  params.baselineResults.forEach((row) => {
    writeJsonFile(path.join(baselineCaseDir, `${row.case_id}.json`), row);
  });
  params.normalizedResults.forEach((row) => {
    writeJsonFile(path.join(normalizedCaseDir, `${row.case_id}_${row.system}.json`), row);
  });
}
