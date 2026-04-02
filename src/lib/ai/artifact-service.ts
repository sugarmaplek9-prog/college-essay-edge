// =============================================================
// src/lib/ai/artifact-service.ts
//
// Service layer for ai_artifacts retrieval.
// Enforces: no raw provider output, no blocked content leakage.
// =============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AiArtifact,
  AiRun,
  GetArtifactResponse,
  ValidatorResult,
} from '@/types/ai';
import { ArtifactNotFoundError } from './errors';
import { NDS_SCHEMA_VERSION, DEFAULT_VALIDATOR_VERSION } from './constants';

/**
 * Returns the admissible artifact for a run, with validator state.
 * Throws ArtifactNotFoundError if no admissible artifact exists.
 * Never returns blocked or failed-validation artifacts.
 */
export async function getAdmissibleArtifactForRun(
  db: SupabaseClient,
  runId: string
): Promise<{ artifact: AiArtifact; validatorResult: ValidatorResult | null }> {
  // Load artifact — must belong to this run
  const { data: artifact, error: artifactError } = await db
    .from('ai_artifacts')
    .select('*')
    .eq('run_id', runId)
    .maybeSingle();

  if (artifactError) {
    throw new Error(`Failed to load artifact: ${artifactError.message}`);
  }

  // No artifact persisted (blocked run, system_error, etc.)
  if (!artifact) {
    throw new ArtifactNotFoundError(runId);
  }

  // Guard: never return blocked or failed-validation artifacts
  if (
    artifact.artifact_status === 'blocked' ||
    artifact.artifact_status === 'failed_validation'
  ) {
    throw new ArtifactNotFoundError(runId);
  }

  // Load validator result for this run
  const { data: validatorResult } = await db
    .from('validator_results')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    artifact: artifact as AiArtifact,
    validatorResult: validatorResult as ValidatorResult | null,
  };
}

/**
 * Builds the GetArtifactResponse shape for the API endpoint.
 * payload_json is exposed as artifact.data — raw provider response
 * is never included.
 */
export function buildGetArtifactResponse(
  run: AiRun,
  moduleKey: string,
  artifact: AiArtifact,
  validatorResult: ValidatorResult | null
): GetArtifactResponse {
  return {
    run: {
      run_id: run.id,
      module: moduleKey,
      status: run.status,
      execution_mode: run.execution_mode,
      readiness_state: run.readiness_state,
    },
    artifact: {
      id: artifact.id,
      module: moduleKey,
      schema_version: NDS_SCHEMA_VERSION,
      status: artifact.artifact_status,
      summary: artifact.summary_text,
      data: artifact.payload_json,
      warnings: artifact.warnings_json,
      meta: {
        selected: artifact.selected_by_user,
        is_canonical_for_subject: artifact.is_canonical_for_subject,
        created_at: artifact.created_at,
      },
    },
    validator: validatorResult
      ? {
          validator_version: DEFAULT_VALIDATOR_VERSION,
          structural_pass: validatorResult.structural_pass,
          semantic_pass: validatorResult.semantic_pass,
          brand_pass: validatorResult.brand_pass,
          authenticity_pass: validatorResult.authenticity_pass,
          decision: validatorResult.admissibility_decision,
          severity: validatorResult.highest_severity,
          failure_codes: validatorResult.failure_codes_json,
          notes: validatorResult.warning_codes_json,
        }
      : {
          validator_version: DEFAULT_VALIDATOR_VERSION,
          structural_pass: true,
          semantic_pass: true,
          brand_pass: true,
          authenticity_pass: true,
          decision: 'accept',
          severity: 'low',
          failure_codes: [],
          notes: [],
        },
    review: {
      queued: false,
      queue_item_id: null,
    },
  };
}
