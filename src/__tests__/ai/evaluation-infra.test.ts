import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  autoScoreHeadToHead,
  createManifest,
  generateSummary,
  loadCases,
  normalizeResults,
  validateEvaluationCase,
  type BaselineEvalRunRecord,
  type EvaluationCase,
  type NdsEvalRunRecord,
} from '@/lib/ai/evaluation/pack';

const sampleCase: EvaluationCase = {
  case_id: 'case_999',
  label: 'sample case',
  difficulty: 'medium',
  tags: ['conflicting_signals', 'messy_notes', 'draft_present'],
  student_profile: {
    grade_level: '12',
    intended_majors: ['biology'],
    core_interests: ['science'],
    identity_notes: [],
  },
  essay_project: {
    project_id: 'eval_case_999',
    project_type: 'personal_statement',
    target_school: null,
  },
  story_entries: [{ id: 'story_1', text: 'A meaningful story with a clear turning point.' }],
  current_draft: { id: null, text: null },
  school_context: { target_school: null, notes: '' },
  expected_conditions: {
    should_be_needs_more_input: false,
    should_have_clear_winner: true,
    likely_bad_baseline_behavior: ['generic_praise'],
  },
  author_notes: {
    why_included: 'validation test',
    reviewer_warning: '',
  },
};

describe('evaluation infrastructure', () => {
  it('validates a well-formed case', () => {
    const errors = validateEvaluationCase(sampleCase);
    expect(errors).toHaveLength(0);
  });

  it('rejects malformed cases deterministically', () => {
    const malformed = {
      ...sampleCase,
      tags: ['unknown_tag'],
      story_entries: [],
      current_draft: { id: null, text: null },
      author_notes: { ...sampleCase.author_notes, why_included: '' },
    };

    const errors = validateEvaluationCase(malformed);
    expect(errors.some((e: string) => e.includes('tags[0]'))).toBe(true);
    expect(errors.some((e: string) => e.includes('at least one of story_entries or current_draft.text'))).toBe(true);
    expect(errors.some((e: string) => e.includes('author_notes.why_included'))).toBe(true);
  });

  it('loads cases and fails on duplicate case_id', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-cases-'));
    const c1 = { ...sampleCase, case_id: 'dup_case' };
    const c2 = { ...sampleCase, case_id: 'dup_case', label: 'dup 2' };
    fs.writeFileSync(path.join(tmp, 'a.json'), JSON.stringify(c1, null, 2), 'utf-8');
    fs.writeFileSync(path.join(tmp, 'b.json'), JSON.stringify(c2, null, 2), 'utf-8');

    expect(() => loadCases(tmp)).toThrowError(/Duplicate case_id/);
  });

  it('creates a manifest with required version metadata', () => {
    const manifest = createManifest(30);
    expect(manifest.module).toBe('narrative_direction_selection');
    expect(manifest.module_version).toBe('v1');
    expect(manifest.prompt_version).toBe('v1');
    expect(manifest.validator_version).toBe('v1');
    expect(manifest.case_count).toBe(30);
    expect(manifest.evaluation_run_id.startsWith('nds_eval_')).toBe(true);
  });

  it('fails loudly when normalize CLI inputs are missing', () => {
    const tmpRunDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eval-run-missing-'));
    const repoRoot = process.cwd();

    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'evaluation/scripts/eval-normalize.ts', '--run-dir', tmpRunDir],
      {
        cwd: repoRoot,
        encoding: 'utf-8',
      }
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toContain('Required result files are missing in run dir');
  });

  it('normalizes nds and baseline outputs into comparable records', () => {
    const nds: NdsEvalRunRecord[] = [
      {
        run_id: 'run_nds_1',
        case_id: 'case_999',
        system: 'nds_internal',
        provider_classification: 'deterministic_stub',
        readiness_state: 'ready',
        execution_mode: 'standard',
        validator_decision: 'accept',
        artifact_status: 'success',
        artifact_payload: {
          status: 'success',
          best_direction: {
            id: 'direction_1',
            angle_title: 'A strong winner',
            core_claim: 'Strong claim text with specific transformation and grounded evidence.',
            why_this_is_the_real_story: 'Grounded in internal revision rather than simple activity recap.',
            what_it_reveals_about_the_student: 'Shows public judgment change.',
            why_it_beats_the_obvious_angle: 'Beats obvious angle by centering tension and shift.',
            main_risk_if_written_poorly: 'Could be broad.',
            next_move: 'Write a specific hinge scene and attach two proof details of behavioral change.',
          },
          alternatives: [],
          evidence_anchors: [{ label: 'Story 1', source_type: 'story_entry', source_id: 'story_1' }],
          depth_signals: {
            detected_tension: 'tension',
            detected_shift: 'shift',
            obvious_but_weaker_angle: 'obvious angle',
            essay_opportunity: 'opportunity',
          },
          recovery_question: null,
        },
        trace: { context_pack: {}, warnings: [] },
      },
    ];

    const baseline: BaselineEvalRunRecord[] = [
      {
        run_id: 'run_base_1',
        case_id: 'case_999',
        system: 'baseline_free_ai',
        baseline_mode: 'deterministic_prompt_harness',
        raw_output: {},
        normalized_output: {
          status: 'needs_more_input',
          best_direction: null,
          alternatives: [],
          evidence_anchors: [],
          depth_signals: {
            detected_tension: null,
            detected_shift: null,
            obvious_but_weaker_angle: null,
            essay_opportunity: null,
          },
          recovery_question: 'Tell me more.',
        },
        warnings: [],
      },
    ];

    const normalized = normalizeResults(nds, baseline);
    expect(normalized).toHaveLength(2);
    expect(normalized[0].system).toBe('nds_internal');
    expect(normalized[1].status).toBe('needs_more_input');
  });

  it('generates summary from scores', () => {
    const nds: NdsEvalRunRecord[] = [
      {
        run_id: 'run_nds_1',
        case_id: 'case_999',
        system: 'nds_internal',
        provider_classification: 'deterministic_stub',
        readiness_state: 'ready',
        execution_mode: 'standard',
        validator_decision: 'accept',
        artifact_status: 'success',
        artifact_payload: {
          status: 'success',
          best_direction: {
            id: 'direction_1',
            angle_title: 'A strong winner',
            core_claim: 'Strong claim text with specific transformation and grounded evidence.',
            why_this_is_the_real_story: 'Grounded and specific internal shift.',
            what_it_reveals_about_the_student: 'Shows reflective decision-making under pressure.',
            why_it_beats_the_obvious_angle: 'Beats obvious angle by making a sharper essay bet.',
            main_risk_if_written_poorly: 'Could be broad.',
            next_move: 'Write a scene and test the claim against two concrete details from the event.',
          },
          alternatives: [
            {
              id: 'direction_2',
              angle_title: 'Alt',
              what_this_angle_would_focus_on: 'Alternative focus',
              why_it_is_weaker: 'weaker',
              failure_mode: 'broad',
            },
          ],
          evidence_anchors: [{ label: 'Story 1', source_type: 'story_entry', source_id: 'story_1' }],
          depth_signals: {
            detected_tension: 'tension',
            detected_shift: 'shift',
            obvious_but_weaker_angle: 'obvious angle',
            essay_opportunity: 'opportunity',
          },
          recovery_question: null,
        },
        trace: { context_pack: {}, warnings: [] },
      },
    ];

    const baseline: BaselineEvalRunRecord[] = [
      {
        run_id: 'run_base_1',
        case_id: 'case_999',
        system: 'baseline_free_ai',
        baseline_mode: 'deterministic_prompt_harness',
        raw_output: {},
        normalized_output: {
          status: 'success',
          best_direction: {
            id: 'direction_1',
            angle_title: 'Direction 1',
            core_claim: 'Generic summary',
            why_this_is_the_real_story: 'Generic.',
            what_it_reveals_about_the_student: 'Generic.',
            why_it_beats_the_obvious_angle: 'Generic.',
            main_risk_if_written_poorly: 'Generic.',
            next_move: 'Write paragraph.',
          },
          alternatives: [],
          evidence_anchors: [],
          depth_signals: {
            detected_tension: null,
            detected_shift: null,
            obvious_but_weaker_angle: null,
            essay_opportunity: null,
          },
          recovery_question: null,
        },
        warnings: [],
      },
    ];

    const scores = autoScoreHeadToHead(nds, baseline);
    const summary = generateSummary(
      [{ ...sampleCase, tags: [...sampleCase.tags, 'red_team', 'resume_list'] }],
      scores,
      nds,
      baseline
    ) as {
      totals: { total_cases_run: number };
      red_team_summary: Array<{ bucket: string; avg_score_delta: number; case_count: number }>;
    };

    expect(summary.totals.total_cases_run).toBe(1);
    const resumeBucket = summary.red_team_summary.find((row) => row.bucket === 'resume_list_input');
    expect(resumeBucket?.case_count).toBe(1);
    expect(typeof resumeBucket?.avg_score_delta).toBe('number');
  });
});
