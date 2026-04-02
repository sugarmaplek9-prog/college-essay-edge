import fs from 'node:fs';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import type { NdsResolvedSources } from '@/types/ai';

const caseIds = ['case_024', 'case_025', 'case_027', 'case_012', 'case_020'];

const output: Array<Record<string, unknown>> = [];

for (const caseId of caseIds) {
  const c = JSON.parse(fs.readFileSync(`evaluation/cases/${caseId}.json`, 'utf8'));

  const sources: NdsResolvedSources = {
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

  const pack = buildNdsNormalizedContextPack(sources);

  output.push({
    case_id: caseId,
    story_signal_count: pack.story_signals.length,
    story_signals: pack.story_signals.map((s: (typeof pack.story_signals)[number]) => ({
      source_id: s.source_id,
      event_summary: s.event_summary,
      change_signal: s.change_signal,
      narrative_signal: s.narrative_signal,
      domain_signal: s.domain_signal,
    })),
  });
}

console.log(JSON.stringify(output, null, 2));
