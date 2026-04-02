import {
  RealInputCorpusService,
  type RicAuditSink,
  type RicRepository,
} from '@/types/realInputCorpusService';
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
import type {
  RicCaseRecord,
  RicLifecycleStatus,
  RicProductSurface,
  RicReviewDecision,
} from '@/types/realInputCorpus';

type StoredCase = {
  record: RicCaseRecord;
  rawInputText: string;
  normalizedInputText: string | null;
};

type EvalPack = {
  id: string;
  key: string;
  version: string;
  packType: 'broad_regression' | 'failure_focused' | 'sparse_edge' | 'gold_benchmark';
  labelVersion: string;
  caseIds: string[];
  createdAt: string;
};

class InMemoryRicRepository implements RicRepository {
  private caseCounter = 0;
  private runCounter = 0;
  private reviewCounter = 0;
  private adjudicationCounter = 0;
  private evalPackCounter = 0;

  private cases = new Map<string, StoredCase>();
  private evalPacks = new Map<string, EvalPack>();

  async createCase(input: CreateCaseRequest): Promise<CreateCaseResponse> {
    this.caseCounter += 1;
    const id = `case-${this.caseCounter}`;
    const key = `CASE-2026-${String(this.caseCounter).padStart(6, '0')}`;

    const now = new Date().toISOString();
    this.cases.set(id, {
      record: {
        id,
        caseKey: key,
        caseType: input.caseType,
        productSurface: input.productSurface,
        sourceChannel: input.sourceChannel,
        lifecycleStatus: 'captured',
        reviewPriority: 'normal',
        currentTruthStatus: 'unreviewed',
        labelSchemaVersion: input.labelSchemaVersion,
        routingPolicyVersion: null,
        promptTemplateVersion: null,
        releaseVersion: null,
        tags: input.tags ?? [],
        notesInternal: null,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      },
      rawInputText: input.rawInputText,
      normalizedInputText: null,
    });

    return { caseId: id, caseKey: key, lifecycleStatus: 'captured' };
  }

  async getCaseById(caseId: string): Promise<RicCaseRecord | null> {
    return this.cases.get(caseId)?.record ?? null;
  }

  async normalizeCase(caseId: string, input: any): Promise<void> {
    const stored = this.mustGetCase(caseId);
    stored.normalizedInputText = input.normalizedInputText;
    this.setLifecycle(caseId, input.normalizationStatus === 'failed' ? 'normalization_failed' : 'normalized');
  }

  async attachRun(caseId: string, input: AttachRunRequest): Promise<AttachRunResponse> {
    this.mustGetCase(caseId);
    this.runCounter += 1;
    const runId = `run-${this.runCounter}`;
    this.setLifecycle(caseId, 'run_attached');

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
    this.mustGetCase(caseId);
    this.reviewCounter += 1;
    const reviewId = `review-${this.reviewCounter}`;
    const adjudicationRequired = input.requiresAdjudicationFlag;

    this.setLifecycle(caseId, adjudicationRequired ? 'adjudication_required' : 'review_complete');

    return {
      reviewId,
      caseId,
      lifecycleStatus: adjudicationRequired ? 'adjudication_required' : 'review_complete',
      adjudicationRequired,
    };
  }

  async adjudicateCase(caseId: string, input: AdjudicateCaseRequest): Promise<AdjudicateCaseResponse> {
    this.mustGetCase(caseId);
    this.adjudicationCounter += 1;
    this.setLifecycle(caseId, 'adjudicated');

    return {
      adjudicationId: `adj-${this.adjudicationCounter}`,
      caseId,
      lifecycleStatus: 'adjudicated',
      truthStatus: input.truthStatus,
    };
  }

  async promoteCase(caseId: string, input: PromoteCaseRequest): Promise<PromoteCaseResponse> {
    this.mustGetCase(caseId);
    const lifecycleStatus = input.target === 'gold' ? 'gold' : 'eval_pack_eligible';
    this.setLifecycle(caseId, lifecycleStatus);
    return { caseId, lifecycleStatus, promotedTarget: input.target };
  }

  async createEvalPack(input: CreateEvalPackRequest): Promise<CreateEvalPackResponse> {
    this.evalPackCounter += 1;
    const id = `pack-${this.evalPackCounter}`;
    this.evalPacks.set(id, {
      id,
      key: input.evalPackKey,
      version: input.version,
      packType: input.packType,
      labelVersion: input.labelVersion,
      caseIds: [...input.caseIds],
      createdAt: new Date().toISOString(),
    });

    return {
      evalPackId: id,
      evalPackKey: input.evalPackKey,
      version: input.version,
      packType: input.packType,
    };
  }

  async getEvalPack(evalPackId: string): Promise<GetEvalPackResponse> {
    const pack = this.mustGetEvalPack(evalPackId);
    return {
      evalPack: {
        id: pack.id,
        evalPackKey: pack.key,
        version: pack.version,
        packType: pack.packType,
        labelVersion: pack.labelVersion,
        selectionLogicText: 'manual-smoke',
        createdBy: 'smoke-script',
        createdAt: pack.createdAt,
        notes: null,
      },
      caseCount: pack.caseIds.length,
      cases: pack.caseIds.map((caseId) => ({
        caseId,
        caseKey: this.mustGetCase(caseId).record.caseKey,
        productSurface: this.mustGetCase(caseId).record.productSurface,
        expectedTruthStatus: this.mustGetCase(caseId).record.currentTruthStatus ?? 'unreviewed',
      })),
    };
  }

  async exportEvalPack(evalPackId: string): Promise<ExportEvalPackResponse> {
    const pack = this.mustGetEvalPack(evalPackId);

    return {
      evalPackKey: pack.key,
      version: pack.version,
      packType: pack.packType,
      labelVersion: pack.labelVersion,
      createdAt: pack.createdAt,
      cases: pack.caseIds.map((caseId) => {
        const stored = this.mustGetCase(caseId);
        return {
          caseKey: stored.record.caseKey,
          productSurface: stored.record.productSurface,
          rawInputText: stored.rawInputText,
          normalizedInputText: stored.normalizedInputText,
          context: {},
          expectedTruthStatus: stored.record.currentTruthStatus ?? 'unreviewed',
          expectedFailureModes: [],
          expectedScoreProfile: {},
        };
      }),
    };
  }

  async getReviewQueue(): Promise<GetReviewQueueResponse> {
    const items = [...this.cases.values()]
      .filter((c) => c.record.lifecycleStatus === 'review_queued' || c.record.lifecycleStatus === 'in_review')
      .map((c) => ({
        caseId: c.record.id,
        caseKey: c.record.caseKey,
        productSurface: c.record.productSurface,
        caseType: c.record.caseType,
        reviewPriority: c.record.reviewPriority,
        lifecycleStatus: c.record.lifecycleStatus,
        createdAt: c.record.createdAt,
        queueDecision: null,
        queueReasonSummary: [],
        confidenceScore: null,
        riskScore: null,
      }));

    return { items, nextCursor: null };
  }

  async getCaseDetail(caseId: string): Promise<GetCaseDetailResponse> {
    const stored = this.mustGetCase(caseId);
    return {
      case: stored.record,
      input: {
        rawInputText: stored.rawInputText,
        normalizedInputText: stored.normalizedInputText,
        extractedIntent: null,
        extractedEssayStage: null,
        extractedPromptType: null,
        extractedAmbiguityLevel: null,
        extractedEmotionalSignal: null,
        extractedConstraints: [],
      },
      context: null,
      latestRun: null,
      reviews: [],
      adjudication: null,
    };
  }

  setLifecycle(caseId: string, lifecycleStatus: RicLifecycleStatus): void {
    const stored = this.mustGetCase(caseId);
    stored.record = {
      ...stored.record,
      lifecycleStatus,
      currentTruthStatus:
        lifecycleStatus === 'adjudicated'
          ? 'adjudicated'
          : lifecycleStatus === 'gold'
            ? 'gold'
            : stored.record.currentTruthStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  private mustGetCase(caseId: string): StoredCase {
    const found = this.cases.get(caseId);
    if (!found) {
      throw new Error(`Missing case: ${caseId}`);
    }
    return found;
  }

  private mustGetEvalPack(evalPackId: string): EvalPack {
    const found = this.evalPacks.get(evalPackId);
    if (!found) {
      throw new Error(`Missing eval pack: ${evalPackId}`);
    }
    return found;
  }
}

class MemoryAuditSink implements RicAuditSink {
  public events: Array<{ actionType: string; caseId?: string; actorId: string }> = [];

  async write(entry: {
    actorId: string;
    actionType: string;
    targetTable: string;
    targetId?: string;
    caseId?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    this.events.push({ actorId: entry.actorId, actionType: entry.actionType, caseId: entry.caseId });
  }
}

type SeedCase = {
  name: string;
  category:
    | 'blank_page_confusion'
    | 'achievement_clutter'
    | 'vague_identity_angle'
    | 'sensitive_topic_hesitation'
    | 'over_polished_generic_direction'
    | 'weak_student_fit_reads';
  caseType: 'nds_real_input' | 'red_team_case';
  decision: RicReviewDecision;
  promoteToGoldFlag: boolean;
  requiresAdjudicationFlag: boolean;
  finalTruthStatus:
    | 'adjudicated_usable'
    | 'adjudicated_not_usable'
    | 'adjudicated_gold_ready'
    | 'adjudicated_needs_rework';
};

async function runCaseFlow(
  service: RealInputCorpusService,
  repo: InMemoryRicRepository,
  actorId: string,
  productSurface: RicProductSurface,
  seed: SeedCase,
): Promise<{ caseId: string; lifecycleStatus: RicLifecycleStatus }> {
  const created = await service.createCase(actorId, {
    caseType: seed.caseType,
    productSurface,
    sourceChannel: 'evaluation_seed',
    rawInputText: `${seed.name} raw input`,
    context: {},
    labelSchemaVersion: 'ml_labels_v1',
  });

  await service.normalizeCase(actorId, created.caseId, {
    normalizedInputText: `${seed.name} normalized`,
    normalizationStatus: 'success',
  });

  const run = await service.attachRun(actorId, created.caseId, {
    runKey: `run-${seed.name}`,
    modelProvider: 'openai',
    modelName: 'gpt-5.3-codex',
    routingPolicyVersion: 'irp_v1.2.0',
    promptTemplateVersion: 'nds_prompt_v1.5.0',
    fallbackUsed: false,
    confidenceScore: 0.82,
    riskScore: 0.2,
    runStatus: 'success',
    releaseVersion: 'app_1.0.0',
    inputFeatures: {},
    retrievedPatterns: [],
    outputs: [
      {
        outputRole: 'final',
        outputText: `Direction for ${seed.name}`,
        selectedForDelivery: true,
        deliveredToUser: true,
      },
    ],
  });

  repo.setLifecycle(created.caseId, 'review_queued');

  const review = await service.submitCaseReview(actorId, created.caseId, productSurface, {
    caseId: created.caseId,
    runId: run.runId,
    reviewerId: 'reviewer-1',
    reviewRound: 1,
    decision: seed.decision,
    rationaleText: `review for ${seed.name}`,
    generalizableLearningFlag: true,
    promoteToGoldFlag: seed.promoteToGoldFlag,
    requiresAdjudicationFlag: seed.requiresAdjudicationFlag,
    scores: [
      { dimension: 'authenticity_preservation', value: 4 },
      { dimension: 'narrative_specificity', value: 4 },
      { dimension: 'directional_usefulness', value: 4 },
      { dimension: 'non_genericness', value: 4 },
      { dimension: 'strategic_differentiation', value: 4 },
      { dimension: 'student_fit', value: 4 },
      { dimension: 'clarity_of_recommendation', value: 4 },
      { dimension: 'evidence_grounded_interpretation', value: 4 },
      { dimension: 'actionability', value: 4 },
      { dimension: 'safety_policy_compliance', value: 5 },
    ],
    failureModes: [],
    reasonCodes: ['smoke_flow'],
  });

  if (review.lifecycleStatus === 'adjudication_required') {
    await service.adjudicateCase(actorId, created.caseId, {
      adjudicatorId: 'adjudicator-1',
      adjudicationReason: 'reviewer_disagreement',
      finalDecision: seed.decision,
      truthStatus: seed.finalTruthStatus,
      goldCandidateConfirmed: seed.promoteToGoldFlag,
      labelVersionLocked: 'ml_labels_v1',
    });
  }

  await service.promoteCase(actorId, created.caseId, {
    target: seed.promoteToGoldFlag ? 'gold' : 'eval_pack_eligible',
    goldSetId: seed.promoteToGoldFlag ? 'goldset-v1' : undefined,
    goldReason: seed.promoteToGoldFlag ? 'smoke-verified' : undefined,
  });

  const detail = await service.getCaseDetail(created.caseId);
  return { caseId: created.caseId, lifecycleStatus: detail.case.lifecycleStatus };
}

async function main(): Promise<void> {
  const repo = new InMemoryRicRepository();
  const audit = new MemoryAuditSink();
  const service = new RealInputCorpusService(repo, audit);

  const seeds: SeedCase[] = [
    {
      name: 'bp-confusion-01',
      category: 'blank_page_confusion',
      caseType: 'nds_real_input',
      decision: 'approve_with_minor_edits',
      promoteToGoldFlag: true,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_gold_ready',
    },
    {
      name: 'bp-confusion-02',
      category: 'blank_page_confusion',
      caseType: 'nds_real_input',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_usable',
    },
    {
      name: 'bp-confusion-03',
      category: 'blank_page_confusion',
      caseType: 'nds_real_input',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'ach-clutter-01',
      category: 'achievement_clutter',
      caseType: 'nds_real_input',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: false,
      finalTruthStatus: 'adjudicated_needs_rework',
    },
    {
      name: 'ach-clutter-02',
      category: 'achievement_clutter',
      caseType: 'nds_real_input',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'ach-clutter-03',
      category: 'achievement_clutter',
      caseType: 'nds_real_input',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_usable',
    },
    {
      name: 'vague-identity-01',
      category: 'vague_identity_angle',
      caseType: 'nds_real_input',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_needs_rework',
    },
    {
      name: 'vague-identity-02',
      category: 'vague_identity_angle',
      caseType: 'nds_real_input',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'vague-identity-03',
      category: 'vague_identity_angle',
      caseType: 'nds_real_input',
      decision: 'approve_with_minor_edits',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: false,
      finalTruthStatus: 'adjudicated_usable',
    },
    {
      name: 'sensitive-hesitation-01',
      category: 'sensitive_topic_hesitation',
      caseType: 'red_team_case',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'sensitive-hesitation-02',
      category: 'sensitive_topic_hesitation',
      caseType: 'red_team_case',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_needs_rework',
    },
    {
      name: 'sensitive-hesitation-03',
      category: 'sensitive_topic_hesitation',
      caseType: 'red_team_case',
      decision: 'approve_with_minor_edits',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_usable',
    },
    {
      name: 'generic-polished-01',
      category: 'over_polished_generic_direction',
      caseType: 'nds_real_input',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'generic-polished-02',
      category: 'over_polished_generic_direction',
      caseType: 'nds_real_input',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: false,
      finalTruthStatus: 'adjudicated_needs_rework',
    },
    {
      name: 'generic-polished-03',
      category: 'over_polished_generic_direction',
      caseType: 'nds_real_input',
      decision: 'approve_with_minor_edits',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_usable',
    },
    {
      name: 'weak-fit-01',
      category: 'weak_student_fit_reads',
      caseType: 'nds_real_input',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'weak-fit-02',
      category: 'weak_student_fit_reads',
      caseType: 'nds_real_input',
      decision: 'usable_but_weak',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_needs_rework',
    },
    {
      name: 'weak-fit-03',
      category: 'weak_student_fit_reads',
      caseType: 'nds_real_input',
      decision: 'approve_with_minor_edits',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: false,
      finalTruthStatus: 'adjudicated_usable',
    },
    {
      name: 'weak-fit-04',
      category: 'weak_student_fit_reads',
      caseType: 'red_team_case',
      decision: 'not_usable',
      promoteToGoldFlag: false,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_not_usable',
    },
    {
      name: 'clean-high-signal-02',
      category: 'blank_page_confusion',
      caseType: 'nds_real_input',
      decision: 'approve_with_minor_edits',
      promoteToGoldFlag: true,
      requiresAdjudicationFlag: true,
      finalTruthStatus: 'adjudicated_gold_ready',
    },
  ];

  const results: Array<{ caseId: string; lifecycleStatus: RicLifecycleStatus }> = [];
  for (const seed of seeds) {
    const result = await runCaseFlow(
      service,
      repo,
      'ric-smoke-actor',
      'narrative_direction_selection',
      seed,
    );
    results.push(result);
  }

  const evalPack = await service.createEvalPack('ric-smoke-actor', {
    evalPackKey: 'RIC-SMOKE-PACK',
    version: 'v1',
    packType: 'broad_regression',
    labelVersion: 'ml_labels_v1',
    selectionLogicText: 'manual smoke flow',
    createdBy: 'ric-smoke-script',
    caseIds: results.map((r) => r.caseId),
  });

  const exported = await service.exportEvalPack(evalPack.evalPackId);

  console.log('RIC_SMOKE_RESULTS', {
    results,
    seedCount: seeds.length,
    evalPackId: evalPack.evalPackId,
    exportedCaseCount: exported.payload.cases.length,
    auditEvents: audit.events.length,
  });
}

main().catch((error) => {
  console.error('RIC_SMOKE_FAILED', error);
  process.exit(1);
});
