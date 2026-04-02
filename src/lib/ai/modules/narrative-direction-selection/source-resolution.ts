import type { SupabaseClient } from '@supabase/supabase-js';
import type { NdsResolvedSources } from '@/types/ai';

export interface ResolveNdsSourcesInput {
  module: 'narrative_direction_selection';
  subject_entity_type: 'essay_project';
  subject_entity_id: string;
  student_user_id: string;
}

/**
 * CA-01
 * Resolve bounded canonical sources for narrative_direction_selection.
 */
export async function resolveNdsSources(
  db: SupabaseClient,
  input: ResolveNdsSourcesInput
): Promise<NdsResolvedSources> {
  const { subject_entity_id, student_user_id } = input;

  const { data: project, error: projectError } = await db
    .from('essay_projects')
    .select('id, student_user_id, title, status, selected_direction_artifact_id')
    .eq('id', subject_entity_id)
    .eq('student_user_id', student_user_id)
    .single();

  if (projectError || !project) {
    throw new Error('MISSING_SUBJECT');
  }

  const [profileResult, storiesResult, draftResult, schoolContextResult] = await Promise.all([
    db
      .from('student_profiles')
      .select('user_id, first_name, last_name, grade, interests')
      .eq('user_id', student_user_id)
      .maybeSingle(),

    db
      .from('story_entries')
      .select('id, title, body, category, created_at, status')
      .eq('student_user_id', student_user_id)
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),

    db
      .from('essay_versions')
      .select('id, draft_text, version_number, created_at')
      .eq('essay_project_id', project.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Optional school context: bounded to institutions linked through supplement_projects
    db
      .from('supplement_projects')
      .select('institution_id, institutions:institution_id(common_name, official_name)')
      .eq('student_user_id', student_user_id)
      .limit(1)
      .maybeSingle(),
  ]);

  const storyEntries = (storiesResult.data ?? [])
    .filter((s: { body: string | null }) => !!s.body && s.body.trim().length > 0)
    .map((s: { id: string; title: string; body: string; category: string | null; created_at?: string }) => ({
      id: s.id,
      title: s.title,
      body: s.body,
      category: s.category ?? null,
      created_at: s.created_at,
    }));

  const currentDraft = draftResult.data
    ? {
        id: draftResult.data.id,
        draft_text: draftResult.data.draft_text,
        version_number: draftResult.data.version_number,
      }
    : null;

  let schoolContext: NdsResolvedSources['school_context'] = null;
  if (schoolContextResult.data?.institution_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const institution = schoolContextResult.data.institutions as any;
    schoolContext = {
      source_id: schoolContextResult.data.institution_id,
      target_school: institution?.common_name ?? institution?.official_name ?? 'Unknown School',
      signal_summary: 'School-linked context available for narrative framing constraints.',
    };
  }

  return {
    essay_project: {
      id: project.id,
      student_user_id: project.student_user_id,
      title: project.title,
      status: project.status,
      selected_direction_artifact_id: project.selected_direction_artifact_id ?? null,
    },
    student_profile: profileResult.data
      ? {
          user_id: profileResult.data.user_id,
          first_name: profileResult.data.first_name,
          last_name: profileResult.data.last_name,
          grade: profileResult.data.grade ?? null,
          interests: profileResult.data.interests ?? [],
        }
      : null,
    story_entries: storyEntries,
    current_draft: currentDraft,
    school_context: schoolContext,
    source_meta: {
      story_entry_count: storyEntries.length,
      has_current_draft: !!currentDraft,
      has_school_context: !!schoolContext,
    },
  };
}

export function buildSubjectLinksFromResolvedSources(
  artifactId: string,
  sources: NdsResolvedSources
): Array<{
  artifact_id: string;
  linked_entity_type: string;
  linked_entity_id: string;
  link_role: string;
}> {
  const links: Array<{
    artifact_id: string;
    linked_entity_type: string;
    linked_entity_id: string;
    link_role: string;
  }> = [
    {
      artifact_id: artifactId,
      linked_entity_type: 'essay_project',
      linked_entity_id: sources.essay_project.id,
      link_role: 'primary_subject',
    },
  ];

  for (const story of sources.story_entries) {
    links.push({
      artifact_id: artifactId,
      linked_entity_type: 'story_entry',
      linked_entity_id: story.id,
      link_role: 'evidence_source',
    });
  }

  if (sources.current_draft) {
    links.push({
      artifact_id: artifactId,
      linked_entity_type: 'essay_draft_version',
      linked_entity_id: sources.current_draft.id,
      link_role: 'selected_dependency',
    });
  }

  if (sources.school_context) {
    links.push({
      artifact_id: artifactId,
      linked_entity_type: 'supplement_project',
      linked_entity_id: sources.school_context.source_id,
      link_role: 'school_context',
    });
  }

  return links;
}
