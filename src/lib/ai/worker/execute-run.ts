// =============================================================
// src/lib/ai/worker/execute-run.ts
//
// Background worker for AI run execution.
// Called via Next.js after() so it runs after the 201 response
// is sent to the client.
//
// Worker phases (from spec Section 2.3):
//   Phase 1 — Load run (assert queued)
//   Phase 2 — Mark running
//   Phase 3 — Assemble context
//   Phase 4 — Execute module (provider call)
//   Phase 5 — Validate output
//   Phase 6 — Persist artifact if admissible
//   Phase 7 — Update run terminal state
//
// Error handling:
//   - Any unrecoverable error sets status = system_error
//   - Blocked content is never exposed to users
//   - validator_results is written for every completed attempt
// =============================================================

import { createServiceClient } from '@/lib/supabase/server';
import {
  buildSubjectLinksFromResolvedSources,
  resolveNdsSources,
} from '@/lib/ai/modules/narrative-direction-selection/source-resolution';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { evaluateNdsReadiness } from '@/lib/ai/modules/narrative-direction-selection/readiness';
import {
  assertNdsProviderProductionReadiness,
  executeNdsModule,
} from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import { validateNdsOutput } from '@/lib/ai/modules/narrative-direction-selection/validator';
import {
  DECISION_TO_ARTIFACT_STATUS,
  DECISION_TO_RUN_STATUS,
  DEFAULT_RENDER_VERSION,
  NDS_DEFAULT_MODEL,
  NDS_DEFAULT_PROVIDER,
  PERSIST_DECISIONS,
} from '@/lib/ai/constants';
import type {
  AiRun,
  NdsResolvedSources,
  ProviderOutput,
  RunStatus,
  ValidatorOutput,
} from '@/types/ai';

// =============================================================
// MAIN ENTRY POINT
// =============================================================

/**
 * Executes all worker phases for a queued AI run.
 * Safe to call fire-and-forget; handles all errors internally.
 *
 * @param runId - The id of the ai_runs row to process
 */
export async function executeRun(runId: string): Promise<void> {
  const db = createServiceClient();
  let run: AiRun | null = null;

  try {
    // --- Phase 1: Load run ---
    const { data: runRow, error: runLoadError } = await db
      .from('ai_runs')
      .select('*')
      .eq('id', runId)
      .single();

    if (runLoadError || !runRow) {
      // Nothing to update; log and bail
      console.error(`[worker] Run not found: ${runId}`, runLoadError?.message);
      return;
    }

    run = runRow as AiRun;

    if (run.status !== 'queued') {
      // Race condition or duplicate dispatch — skip silently
      console.warn(
        `[worker] Run ${runId} is not in queued state (found: ${run.status}). Skipping.`
      );
      return;
    }

    // --- Phase 2: Mark running ---
    await db
      .from('ai_runs')
      .update({
        status: 'running' as RunStatus,
        started_at: new Date().toISOString(),
        provider_key: NDS_DEFAULT_PROVIDER,
        model_key: NDS_DEFAULT_MODEL,
      })
      .eq('id', runId);

    // --- Phase 3: Resolve and normalize context ---
    const resolvedSources = await resolveNdsSources(db, {
      module: 'narrative_direction_selection',
      subject_entity_type: 'essay_project',
      subject_entity_id: run.subject_entity_id,
      student_user_id: run.student_user_id,
    });

    const contextPack = buildNdsNormalizedContextPack(resolvedSources);
    const readiness = evaluateNdsReadiness(contextPack);

    await db
      .from('ai_runs')
      .update({
        readiness_state: readiness.readiness_state,
        execution_mode: readiness.execution_mode,
      })
      .eq('id', runId);

    // --- Phase 4: Execute module ---
    const providerOutput = await executeProvider(runId, contextPack, run, readiness.execution_mode);

    // --- Phase 5: Validate output ---
    const validatorOutput = validateNdsOutput(providerOutput.parsedPayload);

    // --- Phase 6: Persist artifact if admissible ---
    let artifactId: string | null = null;

    if ((PERSIST_DECISIONS as readonly string[]).includes(validatorOutput.decision)) {
      artifactId = await persistArtifact(db, run, resolvedSources, providerOutput, validatorOutput);
    }

    // Always persist validator result
    await persistValidatorResult(db, run, artifactId, validatorOutput);

    // --- Phase 7: Update run to terminal state ---
    const terminalStatus = (DECISION_TO_RUN_STATUS[validatorOutput.decision] ??
      'system_error') as RunStatus;

    await db
      .from('ai_runs')
      .update({
        status: terminalStatus,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    console.info(
      `[worker] Run ${runId} completed. decision=${validatorOutput.decision} status=${terminalStatus}`
    );
  } catch (err) {
    console.error(`[worker] System error for run ${runId}:`, err);

    // Set terminal state = system_error so the client sees a clean status
    if (run) {
      try {
        await db
          .from('ai_runs')
          .update({
            status: 'system_error' as RunStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', runId);
      } catch (updateErr: unknown) {
        console.error(
          `[worker] Also failed to set system_error on run ${runId}:`,
          updateErr
        );
      }
    }
  }
}

// =============================================================
// PHASE 4 — Provider execution
// =============================================================

/**
 * Resolves the provider adapter and executes the NDS module.
 * Returns normalized ProviderOutput (never raw provider response).
 *
 * Implementation note: swap the stub below for a real OpenAI
 * or Anthropic adapter. The interface contract stays the same.
 */
async function executeProvider(
  runId: string,
  contextPack: Parameters<typeof executeNdsModule>[0]['context_pack'],
  run: AiRun,
  executionMode: Parameters<typeof executeNdsModule>[0]['execution_mode']
): Promise<ProviderOutput> {
  assertNdsProviderProductionReadiness();

  const moduleOutput = await executeNdsModule({
    run_id: runId,
    module_key: 'narrative_direction_selection',
    execution_mode: executionMode,
    context_pack: contextPack,
    module_versions: {
      prompt_version: 'v1',
      schema_version: 'v1',
      validator_version: 'v1',
    },
  });

  const providerKey = run.provider_key ?? moduleOutput.provider_key ?? NDS_DEFAULT_PROVIDER;
  const modelKey = run.model_key ?? moduleOutput.model_key ?? NDS_DEFAULT_MODEL;
  const parsedPayload = moduleOutput.candidate_payload;
  const latencyMs = moduleOutput.execution_meta.latency_ms;

  console.info(
    `[worker] Provider execution complete. run=${runId} provider=${providerKey} model=${modelKey} latency=${latencyMs}ms`
  );

  return {
    rawText: JSON.stringify(parsedPayload),
    parsedPayload,
    providerKey,
    modelKey,
    latencyMs,
  };
}

// =============================================================
// PHASE 6 — Artifact persistence
// =============================================================

async function persistArtifact(
  db: ReturnType<typeof createServiceClient>,
  run: AiRun,
  resolvedSources: NdsResolvedSources,
  providerOutput: ProviderOutput,
  validatorOutput: ValidatorOutput
): Promise<string> {
  const artifactStatus = DECISION_TO_ARTIFACT_STATUS[validatorOutput.decision];
  const now = new Date().toISOString();

  // --- Supersede prior canonical artifact for this subject ---
  // Must happen BEFORE inserting the new one to avoid violating
  // the partial unique index on (subject_entity_type, subject_entity_id)
  // where is_canonical_for_subject = true.
  await db
    .from('ai_artifacts')
    .update({
      is_canonical_for_subject: false,
      superseded_at: now,
    })
    .eq('subject_entity_type', run.subject_entity_type)
    .eq('subject_entity_id', run.subject_entity_id)
    .eq('is_canonical_for_subject', true);

  // --- Build summary text ---
  const summaryText = buildArtifactSummary(providerOutput.parsedPayload);

  // --- Insert new artifact ---
  const { data: artifact, error: artifactError } = await db
    .from('ai_artifacts')
    .insert({
      run_id: run.id,
      module_id: run.module_id,
      student_user_id: run.student_user_id,
      subject_entity_type: run.subject_entity_type,
      subject_entity_id: run.subject_entity_id,
      artifact_status: artifactStatus,
      summary_text: summaryText,
      payload_json: providerOutput.parsedPayload,
      warnings_json: validatorOutput.warningCodes,
      meta_json: {
        latency_ms: providerOutput.latencyMs,
        provider: providerOutput.providerKey,
        model: providerOutput.modelKey,
      },
      is_canonical_for_subject: true,
      selected_by_user: false,
      selected_item_id: null,
      render_version: DEFAULT_RENDER_VERSION,
      created_at: now,
      superseded_at: null,
    })
    .select('id')
    .single();

  if (artifactError || !artifact) {
    throw new Error(`Failed to insert artifact: ${artifactError?.message}`);
  }

  // --- Insert subject links for provenance ---
  const links = buildSubjectLinksFromResolvedSources(artifact.id, resolvedSources);
  if (links.length > 0) {
    const { error: linksError } = await db
      .from('artifact_subject_links')
      .insert(links);

    if (linksError) {
      // Non-fatal: log but don't fail the run
      console.warn(
        `[worker] Failed to insert subject links for artifact ${artifact.id}: ${linksError.message}`
      );
    }
  }

  return artifact.id;
}

// =============================================================
// PHASE 5b — Validator result persistence
// =============================================================

async function persistValidatorResult(
  db: ReturnType<typeof createServiceClient>,
  run: AiRun,
  artifactId: string | null,
  validatorOutput: ValidatorOutput
): Promise<void> {
  const { error } = await db.from('validator_results').insert({
    run_id: run.id,
    artifact_id: artifactId,
    module_id: run.module_id,
    validator_version_id: null,
    structural_pass: validatorOutput.structuralPass,
    semantic_pass: validatorOutput.semanticPass,
    brand_pass: validatorOutput.brandPass,
    authenticity_pass: validatorOutput.authenticityPass,
    admissibility_decision: validatorOutput.decision,
    highest_severity: validatorOutput.highestSeverity,
    failure_codes_json: validatorOutput.failureCodes,
    warning_codes_json: validatorOutput.warningCodes,
    needs_more_input_reason_code: validatorOutput.needsMoreInputReasonCode,
  });

  if (error) {
    // Non-fatal: validator result write failure should not crash the run
    // but must be logged for operational visibility.
    console.error(
      `[worker] Failed to persist validator_result for run ${run.id}: ${error.message}`
    );
  }
}

// =============================================================
// UTILITY
// =============================================================

function buildArtifactSummary(payload: Record<string, unknown>): string {
  const status = payload['status'];

  if (status === 'needs_more_input') {
    return 'Not enough information to identify a strong direction. Recovery question provided.';
  }

  if (status === 'success') {
    const bd = payload['best_direction'] as Record<string, unknown> | undefined;
    const alternatives = payload['alternatives'] as unknown[] | undefined;
    const altCount = Array.isArray(alternatives) ? alternatives.length : 0;
    return `Best direction: "${bd?.['title'] ?? 'identified'}". ${altCount} alternative${altCount !== 1 ? 's' : ''} analyzed.`;
  }

  return 'Direction analysis complete.';
}
