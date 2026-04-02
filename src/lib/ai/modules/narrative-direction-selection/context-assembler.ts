// =============================================================
// src/lib/ai/modules/narrative-direction-selection/context-assembler.ts
//
// Assembles the internal context bundle for Narrative Direction
// Selection execution. This bundle is built server-side inside
// the worker from canonical database state. It is NEVER
// constructed from client-supplied data, and NEVER exposed
// via the public API.
//
// Used in: worker/execute-run.ts Phase 3
// =============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NdsContextBundle } from '@/types/ai';

export interface AssembleContextParams {
  essayProjectId: string;
  studentUserId: string;
}

/**
 * Assembles all context required for a Narrative Direction
 * Selection run from authoritative database state.
 *
 * Sources loaded:
 *  - essay_project (subject)
 *  - student_profile
 *  - story_entries (all belonging to student)
 *  - prior selected direction artifact (if any)
 *  - edge snapshot / snapshot_results (if available and approved)
 */
export async function assembleNdsContext(
  db: SupabaseClient,
  params: AssembleContextParams
): Promise<NdsContextBundle> {
  const { essayProjectId, studentUserId } = params;

  // Load all context sources in parallel to minimize latency
  const [
    essayProjectResult,
    studentProfileResult,
    storyEntriesResult,
    snapshotResult,
  ] = await Promise.all([
    db
      .from('essay_projects')
      .select(
        'id, student_user_id, title, status, selected_direction, current_draft_text, selected_direction_artifact_id'
      )
      .eq('id', essayProjectId)
      .eq('student_user_id', studentUserId)
      .single(),

    db
      .from('student_profiles')
      .select(
        'user_id, first_name, last_name, graduation_year, interests, strengths_summary, writing_confidence'
      )
      .eq('user_id', studentUserId)
      .maybeSingle(),

    db
      .from('story_entries')
      .select('id, title, body, category, theme_tags_json, strength_level')
      .eq('student_user_id', studentUserId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),

    db
      .from('snapshot_results')
      .select('summary_text, strongest_themes_json, story_directions_json, status')
      .eq('student_user_id', studentUserId)
      .eq('status', 'ready')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (essayProjectResult.error || !essayProjectResult.data) {
    throw new Error(
      `Failed to load essay_project ${essayProjectId}: ${essayProjectResult.error?.message ?? 'not found'}`
    );
  }

  const essayProject = essayProjectResult.data;

  // Load prior selected direction if one exists
  let priorSelectedDirection: NdsContextBundle['priorSelectedDirection'] = null;

  if (essayProject.selected_direction_artifact_id) {
    const priorArtifactResult = await db
      .from('ai_artifacts')
      .select('id, selected_item_id, payload_json')
      .eq('id', essayProject.selected_direction_artifact_id)
      .single();

    if (priorArtifactResult.data) {
      priorSelectedDirection = {
        artifactId: priorArtifactResult.data.id,
        selectedItemId: priorArtifactResult.data.selected_item_id ?? '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payload: priorArtifactResult.data.payload_json as any,
      };
    }
  }

  return {
    essayProject: {
      id: essayProject.id,
      student_user_id: essayProject.student_user_id,
      title: essayProject.title,
      status: essayProject.status,
      selected_direction: essayProject.selected_direction ?? null,
      current_draft_text: essayProject.current_draft_text ?? null,
    },
    studentProfile: studentProfileResult.data
      ? {
          user_id: studentProfileResult.data.user_id,
          first_name: studentProfileResult.data.first_name,
          last_name: studentProfileResult.data.last_name,
          graduation_year: studentProfileResult.data.graduation_year ?? null,
          interests: studentProfileResult.data.interests,
          strengths_summary: studentProfileResult.data.strengths_summary ?? null,
          writing_confidence: studentProfileResult.data.writing_confidence ?? null,
        }
      : null,
    storyEntries: (storyEntriesResult.data ?? []).map((s: {
      id: string;
      title: string;
      body: string;
      category: string | null;
      theme_tags_json: unknown[] | null;
      strength_level: string;
    }) => ({
      id: s.id,
      title: s.title,
      body: s.body,
      category: s.category ?? null,
      theme_tags_json: (s.theme_tags_json ?? []) as unknown[],
      strength_level: s.strength_level,
    })),
    priorSelectedDirection,
    edgeSnapshot: snapshotResult.data
      ? {
          summary_text: snapshotResult.data.summary_text ?? null,
          strongest_themes_json: snapshotResult.data.strongest_themes_json,
          story_directions_json: snapshotResult.data.story_directions_json,
        }
      : null,
  };
}

/**
 * Builds the list of subject links that must be created for an
 * NDS artifact. Each link records a piece of context provenance.
 */
export function buildSubjectLinks(
  artifactId: string,
  context: NdsContextBundle
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
  }> = [];

  // Primary subject is always the essay_project
  links.push({
    artifact_id: artifactId,
    linked_entity_type: 'essay_project',
    linked_entity_id: context.essayProject.id,
    link_role: 'primary_subject',
  });

  // Each story entry used as evidence
  for (const entry of context.storyEntries) {
    links.push({
      artifact_id: artifactId,
      linked_entity_type: 'story_entry',
      linked_entity_id: entry.id,
      link_role: 'evidence_source',
    });
  }

  // Prior selected direction if this was a refresh run
  if (context.priorSelectedDirection) {
    links.push({
      artifact_id: artifactId,
      linked_entity_type: 'essay_project',
      linked_entity_id: context.essayProject.id,
      link_role: 'selected_dependency',
    });
  }

  return links;
}
