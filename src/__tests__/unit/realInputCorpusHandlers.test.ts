import { describe, expect, it, vi } from 'vitest';
import { createRicHandlers } from '@/lib/real-input-corpus/realInputCorpusHandlers';
import {
  RealInputCorpusService,
  RicValidationError,
  type RicAuditSink,
  type RicRepository,
} from '@/types/realInputCorpusService';
import { seedCreateCaseRequest } from '@/lib/real-input-corpus/ndsReviewSeedFixtures';

function makeService(overrides?: Partial<RealInputCorpusService>): RealInputCorpusService {
  const repo = {
    createCase: vi.fn().mockResolvedValue({
      caseId: 'case-1',
      caseKey: 'CASE-2026-000001',
      lifecycleStatus: 'captured',
    }),
    getCaseById: vi.fn(),
    normalizeCase: vi.fn(),
    attachRun: vi.fn(),
    submitReview: vi.fn(),
    adjudicateCase: vi.fn(),
    promoteCase: vi.fn(),
    createEvalPack: vi.fn(),
    getEvalPack: vi.fn(),
    exportEvalPack: vi.fn(),
    getReviewQueue: vi.fn(),
    getCaseDetail: vi.fn(),
  } as unknown as RicRepository;

  const audit: RicAuditSink = { write: vi.fn().mockResolvedValue(undefined) };
  const base = new RealInputCorpusService(repo, audit);

  if (!overrides) return base;

  Object.assign(base, overrides);
  return base;
}

describe('realInputCorpusHandlers', () => {
  it('returns 201 for valid create case', async () => {
    const handlers = createRicHandlers(makeService());
    const result = await handlers.createCase('actor_1', seedCreateCaseRequest);

    expect(result.status).toBe(201);
  });

  it('returns 400 for validation errors', async () => {
    const service = makeService({
      createCase: vi
        .fn()
        .mockRejectedValue(
          new RicValidationError([{ field: 'rawInputText', code: 'required', message: 'required' }]),
        ),
    } as unknown as Partial<RealInputCorpusService>);

    const handlers = createRicHandlers(service);
    const result = await handlers.createCase('actor_1', {});

    expect(result.status).toBe(400);
  });
});
