import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { EvaluationCase } from '@/lib/ai/evaluation/pack';
import type { NdsPayload, NdsResolvedSources } from '@/types/ai';

const MODULE_EXECUTOR_PATH = path.join(
  process.cwd(),
  'src',
  'lib',
  'ai',
  'modules',
  'narrative-direction-selection',
  'module-executor.ts'
);

const INPUT_PATH = path.join(
  process.cwd(),
  'evaluation_outputs',
  '072-real-human-corpus-expansion',
  'blind-evaluation-run-v1',
  'input',
  '072_blind_frozen_input_v1.json'
);

const META_PATTERN =
  /(?:the strongest direction|a strong output|a weak output|a weak answer|a good output|the essay should(?: not)?|reviewer warning:|do not let the model)/i;
const GENERIC_CORRECTION_TITLE = /the moment the student corrected course and what changed after/i;
const GENERIC_NEXT_MOVE_SUFFIX = /build more specific evidence for mistake, pivot, and behavior change/i;
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

function loadFrozenCases(): EvaluationCase[] {
  return JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8')) as EvaluationCase[];
}

function mapCaseToSources(caseRecord: EvaluationCase): NdsResolvedSources {
  return {
    essay_project: {
      id: caseRecord.essay_project.project_id,
      student_user_id: `repair_${caseRecord.case_id}`,
      title: caseRecord.label,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `repair_${caseRecord.case_id}`,
      first_name: 'Repair',
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
          source_id: `${caseRecord.case_id}_school_context`,
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

async function runCase(caseId: string): Promise<{ caseRecord: EvaluationCase; payload: NdsPayload }> {
  const caseRecord = loadFrozenCases().find((entry) => entry.case_id === caseId);
  if (!caseRecord) {
    throw new Error(`Missing frozen 072 case: ${caseId}`);
  }

  const contextPack = buildNdsNormalizedContextPack(mapCaseToSources(caseRecord));
  const readiness = evaluateNdsReadiness(contextPack);
  const run = await executeNdsModule({
    run_id: `repair-${caseId}`,
    module_key: 'narrative_direction_selection',
    execution_mode: readiness.execution_mode,
    context_pack: contextPack,
    module_versions: {
      prompt_version: 'v1',
      schema_version: 'v1',
      validator_version: 'v1',
    },
  });

  return { caseRecord, payload: run.candidate_payload as NdsPayload };
}

function collectOutputText(payload: NdsPayload): string {
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

function computeSourceOverlap(caseRecord: EvaluationCase, outputText: string): string[] {
  const sourceTokens = new Set(
    caseRecord.story_entries
      .flatMap((entry) => entry.text.toLowerCase().match(/[a-z][a-z'-]{4,}/g) ?? [])
      .filter((token) => !STOPWORDS.has(token))
  );
  const loweredOutput = outputText.toLowerCase();
  return [...sourceTokens].filter((token) => loweredOutput.includes(token)).slice(0, 12);
}

describe('072 targeted output repair', () => {
  it('keeps the runtime repair logic free of frozen-case fingerprint patterns', () => {
    const source = fs.readFileSync(MODULE_EXECUTOR_PATH, 'utf8');

    expect(source).not.toMatch(/playlist\|music/);
    expect(source).not.toMatch(/classical\|history\|historical\|gender/);
    expect(source).not.toMatch(/packing lightly\|preparing carefully/);
    expect(source).not.toMatch(/belonging\|sport\|athlete\|competitive space\|team/);
  });

  it('filters reviewer/meta language and preserves case-specific playlist grounding', async () => {
    const { payload } = await runCase('NSB-FS-005');

    expect(payload.status).toBe('success');
    if (payload.status !== 'success') return;

    const outputText = collectOutputText(payload);
    expect(payload.best_direction.angle_title).not.toMatch(GENERIC_CORRECTION_TITLE);
    expect(payload.best_direction.next_move).not.toMatch(GENERIC_NEXT_MOVE_SUFFIX);
    expect(outputText).not.toMatch(META_PATTERN);
    expect(outputText.toLowerCase()).toContain('playlist');
    expect(outputText).not.toMatch(DANGLING_FRAGMENT_PATTERN);
  });

  it('keeps repaired frozen-case outputs grounded in source language across representative 072 cases', async () => {
    for (const caseId of ['NSB-FS-005', 'NSB-FS-013', 'NSB-FS-016']) {
      const { caseRecord, payload } = await runCase(caseId);

      expect(payload.status).toBe('success');
      if (payload.status !== 'success') continue;

      const outputText = collectOutputText(payload);
      const overlap = computeSourceOverlap(caseRecord, outputText);

      expect(payload.best_direction.angle_title).not.toMatch(GENERIC_CORRECTION_TITLE);
      expect(payload.best_direction.next_move).not.toMatch(GENERIC_NEXT_MOVE_SUFFIX);
      expect(outputText).not.toMatch(META_PATTERN);
      expect(overlap.length).toBeGreaterThanOrEqual(2);
    }
  });
});