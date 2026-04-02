import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { PermissionDeniedError, MalformedRequestError } from '@/lib/ai/errors';
import { handleRicError } from '@/lib/real-input-corpus/realInputCorpusErrorBridge';
import { RealInputCorpusService } from '@/types/realInputCorpusService';
import type { RicProductSurface } from '@/types/realInputCorpus';
import { RealInputCorpusPgAdapter } from '@/lib/real-input-corpus/realInputCorpusPgAdapter';
import { SqlRicAuditSink } from '@/lib/real-input-corpus/realInputCorpusAudit';
import type { SqlTransactionalClient } from '@/lib/real-input-corpus/realInputCorpusDb';

export type CreateRepositoryDeps = {
  createSqlClient: () => Promise<SqlTransactionalClient>;
  assertReviewerAccess?: (userId: string) => Promise<void>;
};

async function requireAuthenticatedUser() {
  const db = await createAuthClient();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();

  if (error || !user) {
    throw new PermissionDeniedError('Unauthorized');
  }

  return user;
}

async function parseJsonOrThrow<T = unknown>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new MalformedRequestError('Request body is not valid JSON');
  }
}

async function buildService(deps: CreateRepositoryDeps) {
  const sql = await deps.createSqlClient();
  return new RealInputCorpusService(new RealInputCorpusPgAdapter(sql), new SqlRicAuditSink(sql));
}

export function createRicCollectionHandlers(deps: CreateRepositoryDeps) {
  return {
    async POST(request: NextRequest): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const created = await service.createCase(user.id, body);
        return NextResponse.json(created, { status: 201 });
      } catch (err) {
        return handleRicError(err);
      }
    },

    async GET(request: NextRequest): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const service = await buildService(deps);
        const { searchParams } = new URL(request.url);
        const query = Object.fromEntries(searchParams.entries());
        const queue = await service.getReviewQueue(query);
        return NextResponse.json(queue, { status: 200 });
      } catch (err) {
        return handleRicError(err);
      }
    },
  };
}

export function createRicCaseHandlers(deps: CreateRepositoryDeps) {
  return {
    async GET(
      _request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const { caseId } = await context.params;
        const service = await buildService(deps);
        return NextResponse.json(await service.getCaseDetail(caseId), { status: 200 });
      } catch (err) {
        return handleRicError(err);
      }
    },

    async normalize(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const { caseId } = await context.params;
        const service = await buildService(deps);
        await service.normalizeCase(user.id, caseId, await parseJsonOrThrow(request));
        return NextResponse.json({ ok: true }, { status: 200 });
      } catch (err) {
        return handleRicError(err);
      }
    },

    async attachRun(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const { caseId } = await context.params;
        const service = await buildService(deps);
        return NextResponse.json(
          await service.attachRun(user.id, caseId, await parseJsonOrThrow(request)),
          { status: 201 },
        );
      } catch (err) {
        return handleRicError(err);
      }
    },

    async review(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const { caseId } = await context.params;
        const service = await buildService(deps);
        const body = (await parseJsonOrThrow(request)) as { productSurface?: unknown };
        const productSurface =
          typeof body.productSurface === 'string'
            ? (body.productSurface as RicProductSurface)
            : ('brainstorm' as RicProductSurface);

        return NextResponse.json(
          await service.submitCaseReview(user.id, caseId, productSurface, body),
          { status: 201 },
        );
      } catch (err) {
        return handleRicError(err);
      }
    },

    async adjudicate(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const { caseId } = await context.params;
        const service = await buildService(deps);
        return NextResponse.json(
          await service.adjudicateCase(user.id, caseId, await parseJsonOrThrow(request)),
          { status: 200 },
        );
      } catch (err) {
        return handleRicError(err);
      }
    },

    async promote(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser();
        if (deps.assertReviewerAccess) await deps.assertReviewerAccess(user.id);

        const { caseId } = await context.params;
        const service = await buildService(deps);
        return NextResponse.json(
          await service.promoteCase(user.id, caseId, await parseJsonOrThrow(request)),
          { status: 200 },
        );
      } catch (err) {
        return handleRicError(err);
      }
    },
  };
}
