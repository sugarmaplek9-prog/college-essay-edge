// realInputCorpusAppRouterFinal.ts
// Final App Router integration aligned to the real RealInputCorpusService contract

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { PermissionDeniedError, MalformedRequestError } from '@/lib/ai/errors';
import type { RicProductSurface } from '@/types/realInputCorpus';
import { RealInputCorpusService } from '@/types/realInputCorpusService';
import { handleRicError } from '@/lib/real-input-corpus/realInputCorpusErrorBridge';
import { SqlRicAuditSink } from '@/lib/real-input-corpus/realInputCorpusAudit';
import type { SqlTransactionalClient } from '@/lib/real-input-corpus/realInputCorpusDb';
import { RealInputCorpusPgAdapter } from '@/lib/real-input-corpus/realInputCorpusPgAdapter';

export type RicAppRouterDeps = {
  createSqlClient: () => Promise<SqlTransactionalClient>;
  assertReviewerAccess?: (userId: string) => Promise<void>;
};

async function requireUser(assertReviewerAccess?: (userId: string) => Promise<void>) {
  const db = await createAuthClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();

  if (error || !user) {
    throw new PermissionDeniedError('Unauthorized');
  }

  if (assertReviewerAccess) {
    await assertReviewerAccess(user.id);
  }

  return user;
}

async function parseJson<T = unknown>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new MalformedRequestError('Request body is not valid JSON');
  }
}

async function buildService(deps: RicAppRouterDeps): Promise<RealInputCorpusService> {
  const sql = await deps.createSqlClient();
  const repo = new RealInputCorpusPgAdapter(sql);
  const audit = new SqlRicAuditSink(sql);
  return new RealInputCorpusService(repo, audit);
}

export function createRicCollectionHandlers(deps: RicAppRouterDeps) {
  return {
    async POST(request: NextRequest): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const body = await parseJson(request);
        const service = await buildService(deps);
        const result = await service.createCase(user.id, body);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async GET(request: NextRequest): Promise<NextResponse> {
      try {
        await requireUser(deps.assertReviewerAccess);
        const service = await buildService(deps);
        const query = Object.fromEntries(new URL(request.url).searchParams.entries());
        const result = await service.getReviewQueue(query);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return handleRicError(error);
      }
    },
  };
}

export function createRicCaseHandlers(deps: RicAppRouterDeps) {
  return {
    async GET(
      _request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        await requireUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const service = await buildService(deps);
        const result = await service.getCaseDetail(caseId);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async normalize(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJson(request);
        const service = await buildService(deps);
        await service.normalizeCase(user.id, caseId, body);
        return NextResponse.json({ caseId, ok: true }, { status: 200 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async attachRun(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJson(request);
        const service = await buildService(deps);
        const result = await service.attachRun(user.id, caseId, body);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async submitReview(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
      productSurface: RicProductSurface,
    ): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJson(request);
        const service = await buildService(deps);
        const result = await service.submitCaseReview(user.id, caseId, productSurface, body);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async adjudicate(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJson(request);
        const service = await buildService(deps);
        const result = await service.adjudicateCase(user.id, caseId, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async promote(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJson(request);
        const service = await buildService(deps);
        const result = await service.promoteCase(user.id, caseId, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async createEvalPack(request: NextRequest): Promise<NextResponse> {
      try {
        const user = await requireUser(deps.assertReviewerAccess);
        const body = await parseJson(request);
        const service = await buildService(deps);
        const result = await service.createEvalPack(user.id, body);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return handleRicError(error);
      }
    },

    async exportEvalPack(_request: NextRequest, evalPackId: string): Promise<NextResponse> {
      try {
        await requireUser(deps.assertReviewerAccess);
        const service = await buildService(deps);
        const result = await service.exportEvalPack(evalPackId);
        return NextResponse.json(result.payload, { status: 200 });
      } catch (error) {
        return handleRicError(error);
      }
    },
  };
}
