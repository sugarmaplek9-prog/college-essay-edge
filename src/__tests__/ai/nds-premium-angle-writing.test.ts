import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

const SELF_CORRECTION_CASES = ['case_024', 'case_027', 'case_020', 'case_012', 'case_025'];

function mapCaseToSources(caseId: string): NdsResolvedSources {
  const c = JSON.parse(fs.readFileSync(`evaluation/cases/${caseId}.json`, 'utf8'));
  return {
    essay_project: {
      id: c.essay_project.project_id,
      student_user_id: `eval_${caseId}`,
      title: c.label,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `eval_${caseId}`,
      first_name: 'Eval',
      last_name: caseId,
      grade: Number(c.student_profile.grade_level) || null,
      interests: c.student_profile.core_interests,
    },
    story_entries: c.story_entries.map((s: { id: string; text: string }) => ({
      id: s.id,
      title: s.id,
      body: s.text,
      category: null,
    })),
    current_draft: c.current_draft?.text
      ? {
          id: c.current_draft.id ?? `${caseId}_draft`,
          draft_text: c.current_draft.text,
          version_number: 1,
        }
      : null,
    school_context: c.school_context?.target_school
      ? {
          source_id: `${caseId}_school_ctx`,
          target_school: c.school_context.target_school,
          signal_summary: c.school_context.notes || 'school context provided',
        }
      : null,
    source_meta: {
      story_entry_count: c.story_entries.length,
      has_current_draft: !!c.current_draft?.text,
      has_school_context: !!c.school_context?.target_school,
    },
  };
}

describe('NDS Step 3 premium angle writing', () => {
  it('produces premium strategy fields for five self-correction cases', async () => {
    const outputs: Array<{ caseId: string; best: Record<string, string> }> = [];

    for (const caseId of SELF_CORRECTION_CASES) {
      const pack = buildNdsNormalizedContextPack(mapCaseToSources(caseId));
      const run = await executeNdsModule({
        run_id: `run_${caseId}`,
        module_key: 'narrative_direction_selection',
        execution_mode: 'standard',
        context_pack: pack,
        module_versions: {
          prompt_version: 'v1',
          schema_version: 'v1',
          validator_version: 'v1',
        },
      });

      const payload = run.candidate_payload as {
        status: string;
        best_direction: Record<string, string>;
      };

      expect(payload.status).toBe('success');

      const best = payload.best_direction;

      // Step 5: anti-pattern guards
      expect(best.core_claim).not.toContain("captures the student's real revision in judgment and behavior");
      expect(best.why_it_beats_the_obvious_angle).not.toContain('it stays at trait-level');
      expect(best.why_this_is_the_real_story).not.toMatch(/^Not the \w+\. Not \w+ \w+\./);
      expect(best.what_it_reveals_about_the_student).not.toMatch(/That is not a \w+\. That is a \w+\./);
      expect(best.what_it_reveals_about_the_student).not.toMatch(/Not \w+\. \w+ work\./);

      // Fields must still contain substantive strategic content
      expect(best.why_it_beats_the_obvious_angle.length).toBeGreaterThan(80);
      expect(best.main_risk_if_written_poorly.length).toBeGreaterThan(80);
      expect(/\b(Write|Draft|Start|Build|Keep|Do)\b/i.test(best.next_move)).toBe(true);
      expect(best.next_move.length).toBeGreaterThan(120);
      expect(best.next_move).not.toContain('Use this interpretive test:');

      outputs.push({ caseId, best });
    }

    const titles = outputs.map((o) => o.best.angle_title);
    expect(new Set(titles).size).toBe(SELF_CORRECTION_CASES.length);

    // All three middle fields must be distinct across cases — no interchangeability
    const coreClaims = outputs.map((o) => o.best.core_claim);
    const realStories = outputs.map((o) => o.best.why_this_is_the_real_story);
    const reveals = outputs.map((o) => o.best.what_it_reveals_about_the_student);
    expect(new Set(coreClaims).size).toBe(SELF_CORRECTION_CASES.length);
    expect(new Set(realStories).size).toBe(SELF_CORRECTION_CASES.length);
    expect(new Set(reveals).size).toBe(SELF_CORRECTION_CASES.length);

    const byCase = new Map(outputs.map((o) => [o.caseId, o.best.angle_title]));
    expect(byCase.get('case_024')).toContain('argument');
    expect(byCase.get('case_027')).toContain('clinic');
    expect(byCase.get('case_020')).toContain('tutoring');
    expect(byCase.get('case_012')).toContain('alone');
    expect(byCase.get('case_025')).toContain('experiment');

    // Each core_claim must name its actual situation — not a generic placeholder
    const claimByCase = new Map(outputs.map((o) => [o.caseId, o.best.core_claim]));
    expect(claimByCase.get('case_024')).toContain('skill');
    expect(claimByCase.get('case_027')).toContain('volunteering');
    expect(claimByCase.get('case_020')).toContain('tutoring');
    expect(claimByCase.get('case_012')).toContain('robotics');
    expect(claimByCase.get('case_025')).toContain('experiment');

    // why_this_is_the_real_story must reference domain-specific context
    const realStoryByCase = new Map(outputs.map((o) => [o.caseId, o.best.why_this_is_the_real_story]));
    expect(realStoryByCase.get('case_024')).toContain('conflict');
    expect(realStoryByCase.get('case_027')).toContain('clinic');
    expect(realStoryByCase.get('case_025')).toContain('competition');
  });
});
