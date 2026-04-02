// =============================================================
// src/lib/ai/run-service.ts
//
// Service layer for ai_runs: creation, retrieval, in-flight
// conflict detection, and readiness precheck.
//
// Design rules enforced here:
//  - Every invocation attempt creates a NEW ai_runs row
//  - Old rows are never overwritten to represent new attempts
//  - In-flight conflict check (queued | running) blocks duplicates
//  - Readiness state drives execution_mode, not client input
// =============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AiRun,
  CreateRunResponse,
  ExecutionMode,
  GetRunResponse,
  NdsContextBundle,
  ReadinessPrecheck,
  RunReadinessState,
  RunStatus,
  RunTriggerType,
  SubjectEntityType,
} from '@/types/ai';
import {
  ACTIVE_RUN_STATUSES,
  MIN_STORY_BODY_LENGTH,
  MIN_STORY_ENTRIES_FOR_STANDARD,
} from './constants';
import {
  ConflictingRunError,
  RunNotFoundError,
} from './errors';

export interface CreateRunParams {
  moduleId: string;
  moduleKey: string;
  studentUserId: string;
  subjectEntityType: SubjectEntityType;
  subjectEntityId: string;
  triggerType: RunTriggerType;
  readinessPrecheck: ReadinessPrecheck;
}

/**
 * Checks whether an active run already exists for the given
 * (module_id, subject_entity_type, subject_entity_id) triple.
 *
 * Throws ConflictingRunError if one exists.
 * Returns normally if no conflict.
 */
export async function assertNoActiveRun(
  db: SupabaseClient,
  params: {
    moduleId: string;
    subjectEntityType: SubjectEntityType;
    subjectEntityId: string;
  }
): Promise<void> {
  const { moduleId, subjectEntityType, subjectEntityId } = params;

  const { data, error } = await db
    .from('ai_runs')
    .select('id, status')
    .eq('module_id', moduleId)
    .eq('subject_entity_type', subjectEntityType)
    .eq('subject_entity_id', subjectEntityId)
    .in('status', ACTIVE_RUN_STATUSES)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check for active runs: ${error.message}`);
  }

  if (data) {
    throw new ConflictingRunError(data.id);
  }
}

/**
 * Inserts a new ai_runs row in 'queued' state.
 * Returns the created run id and resolved execution_mode.
 */
export async function createRun(
  db: SupabaseClient,
  params: CreateRunParams
): Promise<{ runId: string; executionMode: ExecutionMode }> {
  const {
    moduleId,
    studentUserId,
    subjectEntityType,
    subjectEntityId,
    triggerType,
    readinessPrecheck,
  } = params;

  const { data, error } = await db
    .from('ai_runs')
    .insert({
      module_id: moduleId,
      student_user_id: studentUserId,
      trigger_type: triggerType,
      subject_entity_type: subjectEntityType,
      subject_entity_id: subjectEntityId,
      execution_mode: readinessPrecheck.resolvedMode,
      readiness_state: readinessPrecheck.state,
      status: 'queued' as RunStatus,
      retry_count: 0,
      fallback_applied: false,
      fallback_reason_code: null,
      provider_key: null,
      model_key: null,
      started_at: null,
      completed_at: null,
    })
    .select('id, execution_mode')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create ai_run: ${error?.message ?? 'unknown'}`);
  }

  return { runId: data.id, executionMode: data.execution_mode as ExecutionMode };
}

/**
 * Retrieves a single run row by id. Throws RunNotFoundError if
 * the run does not exist or does not belong to the student.
 */
export async function getRunById(
  db: SupabaseClient,
  runId: string,
  studentUserId: string
): Promise<AiRun> {
  const { data, error } = await db
    .from('ai_runs')
    .select('*')
    .eq('id', runId)
    .eq('student_user_id', studentUserId)
    .single();

  if (error || !data) {
    throw new RunNotFoundError(runId);
  }

  return data as AiRun;
}

/**
 * Builds the GET /v1/ai/runs/{run_id} response shape.
 * Includes artifact_id and validator_result_id if available.
 */
export async function buildGetRunResponse(
  db: SupabaseClient,
  run: AiRun,
  moduleKey: string
): Promise<GetRunResponse> {
  // Look up artifact id (null if none persisted for this run)
  const { data: artifact } = await db
    .from('ai_artifacts')
    .select('id')
    .eq('run_id', run.id)
    .maybeSingle();

  // Look up validator result id
  const { data: validatorResult } = await db
    .from('validator_results')
    .select('id')
    .eq('run_id', run.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    run_id: run.id,
    module: moduleKey,
    status: run.status,
    execution_mode: run.execution_mode,
    readiness_state: run.readiness_state,
    subject: {
      entity_type: run.subject_entity_type,
      entity_id: run.subject_entity_id,
    },
    artifact_id: artifact?.id ?? null,
    validator_result_id: validatorResult?.id ?? null,
    review_queue_item_id: null, // review queue not implemented in v1
    attempt_count: run.retry_count + 1,
    created_at: run.created_at,
    started_at: run.started_at,
    completed_at: run.completed_at,
  };
}

/**
 * Builds the CreateRunResponse returned by POST /v1/ai/runs.
 */
export function buildCreateRunResponse(params: {
  runId: string;
  moduleKey: string;
  executionMode: ExecutionMode;
  subjectEntityType: SubjectEntityType;
  subjectEntityId: string;
  createdAt: string;
}): CreateRunResponse {
  return {
    run_id: params.runId,
    module: params.moduleKey,
    status: 'queued',
    execution_mode: params.executionMode,
    subject: {
      entity_type: params.subjectEntityType,
      entity_id: params.subjectEntityId,
    },
    created_at: params.createdAt,
  };
}

/**
 * Performs the readiness precheck for Narrative Direction Selection
 * against an essay_project subject. Determines the canonical
 * readiness state and resolves the execution mode the server will use.
 *
 * The client's requested_mode is taken as a hint; the server
 * overrides based on actual data state.
 */
export function assessNdsReadiness(
  context: NdsContextBundle
): ReadinessPrecheck {
  const { storyEntries } = context;

  // Hard-block: essay_project not in a state that allows direction selection
  const blockedStatuses = ['complete'];
  if (blockedStatuses.includes(context.essayProject.status)) {
    return {
      state: 'blocked' as RunReadinessState,
      resolvedMode: 'standard' as ExecutionMode,
      reason: `Essay project status '${context.essayProject.status}' does not allow direction selection`,
    };
  }

  // No usable story entries at all
  if (storyEntries.length === 0) {
    return {
      state: 'insufficient_input' as RunReadinessState,
      resolvedMode: 'needs_more_input' as ExecutionMode,
      reason: 'No story entries available for direction analysis',
    };
  }

  // Check if any story entries have sufficient content
  const substantiveEntries = storyEntries.filter(
    (e) => e.body && e.body.length >= MIN_STORY_BODY_LENGTH
  );

  if (substantiveEntries.length < MIN_STORY_ENTRIES_FOR_STANDARD) {
    return {
      state: 'insufficient_input' as RunReadinessState,
      resolvedMode: 'needs_more_input' as ExecutionMode,
      reason: 'Story entries present but content is too thin for direction generation',
    };
  }

  // Stale context: prior direction exists but story content has changed
  // (simplified v1 heuristic — can be enhanced with change timestamps)
  if (context.priorSelectedDirection && storyEntries.length > 0) {
    return {
      state: 'ready' as RunReadinessState,
      resolvedMode: 'refresh' as ExecutionMode,
    };
  }

  return {
    state: 'ready' as RunReadinessState,
    resolvedMode: 'standard' as ExecutionMode,
  };
}
