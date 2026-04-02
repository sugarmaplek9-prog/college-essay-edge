import { describe, expect, it, vi } from 'vitest';
import {
  RealInputCorpusService,
  RicLifecycleError,
  RicValidationError,
  hasDecisionBandConflict,
  type RicAuditSink,
  type RicRepository,
} from '@/types/realInputCorpusService';
import type {
  CreateCaseResponse,
  SubmitCaseReviewResponse,
} from '@/types/api/realInputCorpusApi';
import { seedCreateCaseRequest, seedSubmitReviewRequest } from '@/lib/real-input-corpus/ndsReviewSeedFixtures';

function makeRepo(): RicRepository {
  const caseRecord = {
    id: 'case-1',
    caseKey: 'CASE-2026-000001',
    caseType: 'nds_real_input' as const,
    productSurface: 'narrative_direction_selection' as const,
    sourceChannel: 'live_product' as const,
    lifecycleStatus: 'review_queued' as const,
    reviewPriority: 'normal' as const,
    currentTruthStatus: 'unreviewed' as const,
    labelSchemaVersion: 'ml_labels_v1',
    routingPolicyVersion: null,
    promptTemplateVersion: null,
    releaseVersion: null,
    tags: [],
    notesInternal: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    archivedAt: null,
  };

  return {
    createCase: vi.fn<() => Promise<CreateCaseResponse>>().mockResolvedValue({
      caseId: 'case-1',
      caseKey: 'CASE-2026-000001',
      lifecycleStatus: 'captured',
    }),
    getCaseById: vi.fn().mockResolvedValue(caseRecord),
    normalizeCase: vi.fn().mockResolvedValue(undefined),
    attachRun: vi.fn(),
    submitReview: vi.fn<() => Promise<SubmitCaseReviewResponse>>().mockResolvedValue({
      reviewId: 'review-1',
      caseId: 'case-1',
      lifecycleStatus: 'review_complete',
      adjudicationRequired: false,
    }),
    adjudicateCase: vi.fn(),
    promoteCase: vi.fn(),
    createEvalPack: vi.fn(),
    getEvalPack: vi.fn(),
    exportEvalPack: vi.fn(),
    getReviewQueue: vi.fn(),
    getCaseDetail: vi.fn(),
  } as unknown as RicRepository;
}

function makeAudit(): RicAuditSink {
  return {
    write: vi.fn().mockResolvedValue(undefined),
  };
}

describe('realInputCorpusService', () => {
  it('creates case and writes audit log', async () => {
    const repo = makeRepo();
    const audit = makeAudit();
    const service = new RealInputCorpusService(repo, audit);

    const result = await service.createCase('actor_1', seedCreateCaseRequest);

    expect(result.lifecycleStatus).toBe('captured');
    expect(repo.createCase).toHaveBeenCalledTimes(1);
    expect(audit.write).toHaveBeenCalledTimes(1);
  });

  it('maps invalid create-case payload to validation error', async () => {
    const service = new RealInputCorpusService(makeRepo(), makeAudit());

    await expect(service.createCase('actor_1', {})).rejects.toBeInstanceOf(RicValidationError);
  });

  it('rejects review submission from invalid lifecycle status', async () => {
    const repo = makeRepo();
    repo.getCaseById = vi.fn().mockResolvedValue({
      ...(await repo.getCaseById('case-1')),
      lifecycleStatus: 'captured',
    });

    const service = new RealInputCorpusService(repo, makeAudit());

    await expect(
      service.submitCaseReview(
        'actor_1',
        'case-1',
        'narrative_direction_selection',
        seedSubmitReviewRequest,
      ),
    ).rejects.toBeInstanceOf(RicLifecycleError);
  });

  it('returns deterministic review queue decision buckets', () => {
    const service = new RealInputCorpusService(makeRepo(), makeAudit());

    const full = service.decideReviewQueue({
      runStatus: 'success',
      confidenceScore: 0.4,
      riskScore: 0.5,
      fallbackUsed: false,
      usesNewRoutingVersion: false,
      usesNewPromptVersion: false,
      retryCount: 0,
      sparseSegment: false,
      highComplexity: false,
      sensitiveAmbiguity: false,
      genericnessRiskFlag: false,
      representedInRecentReviewedCorpus: true,
    });

    const exempt = service.decideReviewQueue({
      runStatus: 'success',
      confidenceScore: 0.9,
      riskScore: 0.1,
      fallbackUsed: false,
      usesNewRoutingVersion: false,
      usesNewPromptVersion: false,
      retryCount: 0,
      sparseSegment: false,
      highComplexity: false,
      sensitiveAmbiguity: false,
      genericnessRiskFlag: false,
      representedInRecentReviewedCorpus: true,
    });

    expect(full.queueDecision).toBe('full_review');
    expect(exempt.queueDecision).toBe('review_exempt');
  });

  it('detects decision band conflict threshold', () => {
    expect(hasDecisionBandConflict(['approve', 'not_usable'])).toBe(true);
    expect(hasDecisionBandConflict(['approve_with_minor_edits', 'usable_but_weak'])).toBe(false);
  });
});
