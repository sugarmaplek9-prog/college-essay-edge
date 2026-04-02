// =============================================================
// src/lib/ai/selection-service.ts
//
// Persists explicit user direction selections.
//
// Write contract (all in one transaction):
//  1. Insert artifact_selection_events row
//  2. Update ai_artifacts.selected_by_user = true
//  3. Update ai_artifacts.selected_item_id
//  4. Update essay_projects.selected_direction_artifact_id
//
// Selection is never inferred from downstream project mutation.
// History is append-only; prior selections are never deleted.
// =============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AiArtifact, SelectArtifactRequest, SelectArtifactResponse } from '@/types/ai';
import {
  ArtifactNotFoundError,
  MalformedRequestError,
  PermissionDeniedError,
} from './errors';

/**
 * Loads and validates the artifact for a selection operation.
 * Throws appropriate errors for invalid states.
 */
export async function loadAndValidateArtifactForSelection(
  db: SupabaseClient,
  artifactId: string,
  studentUserId: string,
  moduleKey: string
): Promise<AiArtifact> {
  const { data: artifact, error } = await db
    .from('ai_artifacts')
    .select(
      'id, run_id, module_id, student_user_id, subject_entity_type, subject_entity_id, artifact_status, payload_json, selected_by_user, selected_item_id'
    )
    .eq('id', artifactId)
    .maybeSingle();

  if (error || !artifact) {
    throw new ArtifactNotFoundError(artifactId);
  }

  // Ownership check — artifact must belong to authenticated student
  if (artifact.student_user_id !== studentUserId) {
    throw new PermissionDeniedError(
      'Artifact does not belong to the authenticated user'
    );
  }

  // Module check
  const { data: moduleRow } = await db
    .from('module_registry')
    .select('module_key')
    .eq('id', artifact.module_id)
    .single();

  if (!moduleRow || moduleRow.module_key !== moduleKey) {
    throw new MalformedRequestError(
      `Selection is not valid for module: ${moduleRow?.module_key ?? 'unknown'}`
    );
  }

  // Status check — selection only allowed on admissible statuses
  const selectionAllowedStatuses = ['success', 'partial', 'needs_more_input'];
  if (!selectionAllowedStatuses.includes(artifact.artifact_status)) {
    throw new MalformedRequestError(
      `Cannot select artifact with status: ${artifact.artifact_status}`
    );
  }

  return artifact as AiArtifact;
}

/**
 * Validates that the selected_item_id exists in the artifact payload.
 */
export function validateSelectedItemId(
  artifact: AiArtifact,
  selectedItemId: string
): void {
  const payload = artifact.payload_json;

  if (payload['status'] === 'needs_more_input') {
    throw new MalformedRequestError(
      'Cannot select a direction from a needs_more_input artifact'
    );
  }

  // Collect all valid selectable ids from the payload
  const validIds: string[] = [];

  const bestDirection = payload['best_direction'] as Record<string, unknown> | null;
  if (bestDirection?.['id'] && typeof bestDirection['id'] === 'string') {
    validIds.push(bestDirection['id']);
  }

  const alternatives = payload['alternatives'] as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(alternatives)) {
    for (const alt of alternatives) {
      if (alt['id'] && typeof alt['id'] === 'string') {
        validIds.push(alt['id']);
      }
    }
  }

  if (!validIds.includes(selectedItemId)) {
    throw new MalformedRequestError(
      `selected_item_id '${selectedItemId}' does not exist in artifact payload. ` +
        `Valid ids: ${validIds.join(', ')}`
    );
  }
}

/**
 * Persists the direction selection in a single atomic transaction:
 *  - artifact_selection_events insert
 *  - ai_artifacts update (selected_by_user, selected_item_id)
 *  - essay_projects update (selected_direction_artifact_id)
 *
 * Note: Supabase JS client does not support server-side transactions
 * natively. We serialize writes and handle partial failure with
 * explicit rollback guidance in the error path. For true atomicity,
 * this operation should be wrapped in a Postgres function or RPC.
 */
export async function persistSelection(
  db: SupabaseClient,
  artifact: AiArtifact,
  request: SelectArtifactRequest,
  studentUserId: string
): Promise<SelectArtifactResponse> {
  const now = new Date().toISOString();

  // Step 1: Insert selection event (append-only log)
  const { error: eventError } = await db
    .from('artifact_selection_events')
    .insert({
      artifact_id: artifact.id,
      student_user_id: studentUserId,
      selected_item_id: request.selected_item_id,
      selected_rank: request.selected_rank ?? null,
      selection_context: request.selection_context,
      created_at: now,
    });

  if (eventError) {
    throw new Error(`Failed to insert selection event: ${eventError.message}`);
  }

  // Step 2: Update artifact to reflect user selection
  const { error: artifactUpdateError } = await db
    .from('ai_artifacts')
    .update({
      selected_by_user: true,
      selected_item_id: request.selected_item_id,
    })
    .eq('id', artifact.id);

  if (artifactUpdateError) {
    throw new Error(
      `Failed to update artifact selection state: ${artifactUpdateError.message}`
    );
  }

  // Step 3: Update essay_projects to point to newly selected artifact
  const { error: projectUpdateError } = await db
    .from('essay_projects')
    .update({
      selected_direction_artifact_id: artifact.id,
    })
    .eq('id', artifact.subject_entity_id)
    .eq('student_user_id', studentUserId);

  if (projectUpdateError) {
    throw new Error(
      `Failed to update essay_project direction pointer: ${projectUpdateError.message}`
    );
  }

  return {
    artifact_id: artifact.id,
    selected_item_id: request.selected_item_id,
    status: 'recorded',
    recorded_at: now,
  };
}
