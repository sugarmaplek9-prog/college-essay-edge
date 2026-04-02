import type {
  AdjudicateCaseRequest,
  AdjudicateCaseResponse,
  AttachRunRequest,
  AttachRunResponse,
  CreateCaseRequest,
  CreateCaseResponse,
  CreateEvalPackRequest,
  CreateEvalPackResponse,
  ExportEvalPackResponse,
  GetCaseDetailResponse,
  GetEvalPackResponse,
  GetReviewQueueResponse,
  PromoteCaseRequest,
  PromoteCaseResponse,
  SubmitCaseReviewRequest,
  SubmitCaseReviewResponse,
} from '@/types/api/realInputCorpusApi';
import type { RicCaseRecord } from '@/types/realInputCorpus';
import type { RicRepository } from '@/types/realInputCorpusService';
import { mapCaseRowToRecord, type RicDbCaseRow, type SqlTransactionalClient } from './realInputCorpusDb';

export class RealInputCorpusPgAdapter implements RicRepository {
  constructor(private readonly db: SqlTransactionalClient) {}

  async createCase(input: CreateCaseRequest): Promise<CreateCaseResponse> {
    const sql = `
      insert into cases (
        case_key, case_type, product_surface, source_channel,
        lifecycle_status, review_priority, current_truth_status,
        label_schema_version, tags_json
      )
      values (
        concat('CASE-', to_char(now(), 'YYYY'), '-', lpad((floor(random() * 999999)::int)::text, 6, '0')),
        $1, $2, $3,
        'captured', 'normal', 'unreviewed',
        $4, $5::jsonb
      )
      returning id, case_key, lifecycle_status
    `;

    const inserted = await this.db.query<{ id: string; case_key: string; lifecycle_status: 'captured' }>(sql, [
      input.caseType,
      input.productSurface,
      input.sourceChannel,
      input.labelSchemaVersion,
      JSON.stringify(input.tags ?? []),
    ]);

    const row = inserted.rows[0];

    return {
      caseId: row.id,
      caseKey: row.case_key,
      lifecycleStatus: row.lifecycle_status,
    };
  }

  async getCaseById(caseId: string): Promise<RicCaseRecord | null> {
    const sql = `
      select
        id,
        case_key,
        case_type,
        product_surface,
        source_channel,
        lifecycle_status,
        review_priority,
        current_truth_status,
        label_schema_version,
        routing_policy_version,
        prompt_template_version,
        release_version,
        tags_json,
        notes_internal,
        created_at,
        updated_at,
        archived_at
      from cases
      where id = $1
      limit 1
    `;

    const result = await this.db.query<RicDbCaseRow>(sql, [caseId]);
    if (!result.rows[0]) {
      return null;
    }

    return mapCaseRowToRecord(result.rows[0]);
  }

  async normalizeCase(caseId: string, input: any): Promise<void> {
    const count =
      typeof input.normalizedInputText === 'string'
        ? input.normalizedInputText
            .trim()
            .split(/\s+/)
            .filter(Boolean).length
        : 0;

    await this.db.query(
      `update case_inputs set
         normalized_input_text = $2,
         normalized_word_count = $3,
         normalization_status = $4,
         normalization_errors_json = $5::jsonb,
         extracted_intent = $6,
         extracted_essay_stage = $7,
         extracted_prompt_type = $8,
         extracted_ambiguity_level = $9,
         extracted_emotional_signal = $10,
         extracted_constraints_json = $11::jsonb
       where case_id = $1`,
      [
        caseId,
        input.normalizedInputText ?? null,
        count,
        input.normalizationStatus,
        JSON.stringify(input.normalizationErrors ?? []),
        input.extractedIntent ?? null,
        input.extractedEssayStage ?? null,
        input.extractedPromptType ?? null,
        input.extractedAmbiguityLevel ?? null,
        input.extractedEmotionalSignal ?? null,
        JSON.stringify(input.extractedConstraints ?? []),
      ],
    );

    await this.db.query(`update cases set lifecycle_status = $2 where id = $1`, [
      caseId,
      input.normalizationStatus === 'failed' ? 'normalization_failed' : 'normalized',
    ]);
  }

  async attachRun(caseId: string, input: AttachRunRequest): Promise<AttachRunResponse> {
    const run = await this.db.query<{ id: string }>(
      `insert into case_runs (
        case_id, run_key, model_provider, model_name, reasoning_mode,
        routing_policy_version, prompt_template_version, assembly_context_version,
        fallback_used, confidence_score, risk_score, latency_ms, token_input,
        token_output, run_status, release_version
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      returning id`,
      [
        caseId,
        input.runKey,
        input.modelProvider,
        input.modelName,
        input.reasoningMode ?? null,
        input.routingPolicyVersion,
        input.promptTemplateVersion,
        input.assemblyContextVersion ?? null,
        input.fallbackUsed,
        input.confidenceScore ?? null,
        input.riskScore ?? null,
        input.latencyMs ?? null,
        input.tokenInput ?? null,
        input.tokenOutput ?? null,
        input.runStatus,
        input.releaseVersion,
      ],
    );

    const runId = run.rows[0].id;

    await this.db.query(
      `insert into case_run_inputs (run_id, input_features_json, retrieved_patterns_json, assembly_payload_json) values ($1, $2::jsonb, $3::jsonb, $4::jsonb)`,
      [
        runId,
        JSON.stringify(input.inputFeatures ?? {}),
        JSON.stringify(input.retrievedPatterns ?? []),
        JSON.stringify(input.assemblyPayload ?? {}),
      ],
    );

    for (const output of input.outputs) {
      await this.db.query(
        `insert into case_outputs (run_id, output_role, output_text, output_rank, selected_for_delivery, delivered_to_user, output_metadata_json) values ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [
          runId,
          output.outputRole,
          output.outputText,
          output.outputRank ?? null,
          output.selectedForDelivery,
          output.deliveredToUser,
          JSON.stringify(output.outputMetadata ?? {}),
        ],
      );
    }

    await this.db.query(`update cases set lifecycle_status = 'run_attached' where id = $1`, [caseId]);

    return {
      caseId,
      runId,
      lifecycleStatus: 'run_attached',
      run: {
        id: runId,
        caseId,
        runKey: input.runKey,
        modelProvider: input.modelProvider,
        modelName: input.modelName,
        reasoningMode: input.reasoningMode ?? null,
        routingPolicyVersion: input.routingPolicyVersion,
        promptTemplateVersion: input.promptTemplateVersion,
        assemblyContextVersion: input.assemblyContextVersion ?? null,
        fallbackUsed: input.fallbackUsed,
        confidenceScore: input.confidenceScore ?? null,
        riskScore: input.riskScore ?? null,
        latencyMs: input.latencyMs ?? null,
        tokenInput: input.tokenInput ?? null,
        tokenOutput: input.tokenOutput ?? null,
        runStatus: input.runStatus,
        releaseVersion: input.releaseVersion,
        createdAt: new Date().toISOString(),
      },
    };
  }

  async submitReview(caseId: string, input: SubmitCaseReviewRequest): Promise<SubmitCaseReviewResponse> {
    const review = await this.db.query<{ id: string }>(
      `insert into case_reviews (case_id, run_id, reviewer_id, review_round, review_status, decision, rationale_text, generalizable_learning_flag, promote_to_gold_flag, requires_adjudication_flag) values ($1,$2,$3,$4,'submitted',$5,$6,$7,$8,$9) returning id`,
      [
        caseId,
        input.runId,
        input.reviewerId,
        input.reviewRound,
        input.decision,
        input.rationaleText ?? null,
        input.generalizableLearningFlag,
        input.promoteToGoldFlag,
        input.requiresAdjudicationFlag,
      ],
    );

    const reviewId = review.rows[0].id;

    for (const score of input.scores) {
      await this.db.query(
        `insert into case_review_scores (review_id, score_dimension, score_value) values ($1,$2,$3)`,
        [reviewId, score.dimension, score.value],
      );
    }

    for (const fm of input.failureModes) {
      await this.db.query(
        `insert into case_failure_modes (review_id, failure_mode, severity) values ($1,$2,$3)`,
        [reviewId, fm.failureMode, fm.severity],
      );
    }

    for (const rc of input.reasonCodes) {
      await this.db.query(
        `insert into case_reason_codes (review_id, reason_code) values ($1,$2)`,
        [reviewId, rc],
      );
    }

    const reviews = await this.db.query<{
      decision: string;
      promote_to_gold_flag: boolean;
      requires_adjudication_flag: boolean;
    }>(
      `select decision, promote_to_gold_flag, requires_adjudication_flag from case_reviews where case_id = $1 and review_status = 'submitted'`,
      [caseId],
    );

    const adjudicationRequired =
      reviews.rows.some((r) => r.promote_to_gold_flag || r.requires_adjudication_flag) ||
      new Set(reviews.rows.map((r) => r.decision)).size > 1;

    await this.db.query(`update cases set lifecycle_status = $2 where id = $1`, [
      caseId,
      adjudicationRequired ? 'adjudication_required' : 'review_complete',
    ]);

    return {
      reviewId,
      caseId,
      lifecycleStatus: adjudicationRequired ? 'adjudication_required' : 'review_complete',
      adjudicationRequired,
    };
  }

  async adjudicateCase(caseId: string, input: AdjudicateCaseRequest): Promise<AdjudicateCaseResponse> {
    const inserted = await this.db.query<{ id: string }>(
      `insert into case_adjudications (case_id, adjudicator_id, adjudication_reason, final_decision, truth_status, gold_candidate_confirmed, teaching_notes, label_version_locked) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [
        caseId,
        input.adjudicatorId,
        input.adjudicationReason,
        input.finalDecision,
        input.truthStatus,
        input.goldCandidateConfirmed,
        input.teachingNotes ?? null,
        input.labelVersionLocked,
      ],
    );

    await this.db.query(
      `update cases set lifecycle_status = 'adjudicated', current_truth_status = 'adjudicated' where id = $1`,
      [caseId],
    );

    return {
      adjudicationId: inserted.rows[0].id,
      caseId,
      lifecycleStatus: 'adjudicated',
      truthStatus: input.truthStatus,
    };
  }

  async promoteCase(caseId: string, input: PromoteCaseRequest): Promise<PromoteCaseResponse> {
    if (input.target === 'gold') {
      const caseRow = await this.db.query<{ label_schema_version: string }>(
        `select label_schema_version from cases where id = $1 limit 1`,
        [caseId],
      );

      await this.db.query(
        `insert into gold_cases (case_id, gold_set_id, canonical_label_version, gold_reason, benchmark_notes) values ($1,$2,$3,$4,$5)`,
        [
          caseId,
          input.goldSetId,
          caseRow.rows[0].label_schema_version,
          input.goldReason,
          input.benchmarkNotes ?? null,
        ],
      );

      await this.db.query(`update cases set lifecycle_status = 'gold', current_truth_status = 'gold' where id = $1`, [
        caseId,
      ]);

      return { caseId, lifecycleStatus: 'gold', promotedTarget: 'gold' };
    }

    await this.db.query(`update cases set lifecycle_status = 'eval_pack_eligible' where id = $1`, [
      caseId,
    ]);

    return { caseId, lifecycleStatus: 'eval_pack_eligible', promotedTarget: 'eval_pack_eligible' };
  }

  async createEvalPack(input: CreateEvalPackRequest): Promise<CreateEvalPackResponse> {
    const inserted = await this.db.query<{ id: string }>(
      `insert into eval_packs (eval_pack_key, version, pack_type, selection_logic_text, label_version, created_by, notes) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [
        input.evalPackKey,
        input.version,
        input.packType,
        input.selectionLogicText,
        input.labelVersion,
        input.createdBy,
        input.notes ?? null,
      ],
    );

    for (const caseId of input.caseIds) {
      await this.db.query(
        `insert into eval_pack_cases (eval_pack_id, case_id, expected_truth_status, expected_failure_modes_json, expected_score_profile_json) values ($1,$2,'pending_truth_binding','[]'::jsonb,'{}'::jsonb)`,
        [inserted.rows[0].id, caseId],
      );
    }

    return {
      evalPackId: inserted.rows[0].id,
      evalPackKey: input.evalPackKey,
      version: input.version,
      packType: input.packType,
    };
  }

  async getEvalPack(_evalPackId: string): Promise<GetEvalPackResponse> {
    throw new Error('Use exported package version if needed.');
  }

  async exportEvalPack(_evalPackId: string): Promise<ExportEvalPackResponse> {
    throw new Error('Use exported package version if needed.');
  }

  async getReviewQueue(
    _query?: Record<string, string | number | undefined>,
  ): Promise<GetReviewQueueResponse> {
    throw new Error('Use exported package version if needed.');
  }

  async getCaseDetail(_caseId: string): Promise<GetCaseDetailResponse> {
    throw new Error('Use exported package version if needed.');
  }
}
