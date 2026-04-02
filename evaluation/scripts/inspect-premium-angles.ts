import fs from 'node:fs';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

const caseIds = ['case_024', 'case_027', 'case_020', 'case_012', 'case_025'];

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

async function main(): Promise<void> {
  const out: Array<Record<string, unknown>> = [];

  for (const caseId of caseIds) {
    const pack = buildNdsNormalizedContextPack(mapCaseToSources(caseId));
    const run = await executeNdsModule({
      run_id: `inspect_${caseId}`,
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
      best_direction?: Record<string, unknown>;
    };

    out.push({
      case_id: caseId,
      status: payload.status,
      best_direction: payload.best_direction,
    });
  }

  console.log(JSON.stringify(out, null, 2));
}

void main();
