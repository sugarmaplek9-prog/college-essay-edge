// realInputCorpusPgAdapter.final.ts
// Final adapter notes + compile-oriented skeleton aligned to the real RicRepository interface.

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
import type { RicRepository } from '@/types/realInputCorpusService';
import type { RicCaseRecord } from '@/types/realInputCorpus';
import {
  mapCaseRowToRecord,
  type RicDbCaseRow,
  type SqlTransactionalClient,
} from '@/lib/real-input-corpus/realInputCorpusDb';

export class RealInputCorpusPgAdapter implements RicRepository {
  constructor(private readonly db: SqlTransactionalClient) {}

  async createCase(_input: CreateCaseRequest): Promise<CreateCaseResponse> {
    throw new Error('Bind createCase SQL implementation here');
  }

  async getCaseById(_caseId: string): Promise<RicCaseRecord | null> {
    throw new Error('Bind getCaseById SQL implementation here');
  }

  async normalizeCase(_caseId: string, _input: unknown): Promise<void> {
    throw new Error('Bind normalizeCase SQL implementation here');
  }

  async attachRun(_caseId: string, _input: AttachRunRequest): Promise<AttachRunResponse> {
    throw new Error('Bind attachRun SQL implementation here');
  }

  async submitReview(
    _caseId: string,
    _input: SubmitCaseReviewRequest,
  ): Promise<SubmitCaseReviewResponse> {
    throw new Error('Bind submitReview SQL implementation here');
  }

  async adjudicateCase(
    _caseId: string,
    _input: AdjudicateCaseRequest,
  ): Promise<AdjudicateCaseResponse> {
    throw new Error('Bind adjudicateCase SQL implementation here');
  }

  async promoteCase(_caseId: string, _input: PromoteCaseRequest): Promise<PromoteCaseResponse> {
    throw new Error('Bind promoteCase SQL implementation here');
  }

  async createEvalPack(_input: CreateEvalPackRequest): Promise<CreateEvalPackResponse> {
    throw new Error('Bind createEvalPack SQL implementation here');
  }

  async getEvalPack(_evalPackId: string): Promise<GetEvalPackResponse> {
    throw new Error('Bind getEvalPack SQL implementation here');
  }

  async exportEvalPack(_evalPackId: string): Promise<ExportEvalPackResponse> {
    throw new Error('Bind exportEvalPack SQL implementation here');
  }

  async getReviewQueue(
    _query?: Record<string, string | number | undefined>,
  ): Promise<GetReviewQueueResponse> {
    throw new Error('Bind getReviewQueue SQL implementation here');
  }

  async getCaseDetail(_caseId: string): Promise<GetCaseDetailResponse> {
    throw new Error('Bind getCaseDetail SQL implementation here');
  }
}

/**
 * Compile note:
 * The uploaded `realInputCorpusService.ts` gives the exact repository interface,
 * so this adapter skeleton is now signature-correct against the real contract.
 * Remaining work is SQL implementation, not interface inference.
 */
