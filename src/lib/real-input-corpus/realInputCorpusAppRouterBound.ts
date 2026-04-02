// realInputCorpusAppRouterBound.ts
// App Router integration aligned to the repository's actual handler/service call signatures

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import type { RicProductSurface } from '@/types/realInputCorpus';
import {
  RealInputCorpusService,
  RicLifecycleError,
  RicValidationError,
} from '@/types/realInputCorpusService';
import { MalformedRequestError, PermissionDeniedError } from '@/lib/ai/errors';

/**
 * INTEGRATION:
 * Bind to the repo's real SQL client factory and real repository implementation.
 */
import type { SqlTransactionalClient } from '@/lib/real-input-corpus/realInputCorpusDb';
import { RealInputCorpusPgAdapter } from '@/lib/real-input-corpus/realInputCorpusPgAdapter';
import { SqlRicAuditSink } from '@/lib/real-input-corpus/realInputCorpusAudit';

export type CreateRicAppRouterDeps = {
  createSqlClient: () => Promise<SqlTransactionalClient>;
  assertReviewerAccess?: (userId: string) => Promise<void>;
};

function mapError(error: unknown): NextResponse {
  if (error instanceof RicValidationError) {
    return NextResponse.json(
      {
        error: {
          code: 'validation_error',
          message: 'Request validation failed',
          details: error.issues,
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof RicLifecycleError) {
    return NextResponse.json(
      {
        error: {
          code: 'lifecycle_error',
          message: error.message,
        },
      },
      { status: 409 },
    );
  }

  if (error instanceof PermissionDeniedError) {
    return NextResponse.json(
      {
        error: {
          code: 'permission_denied',
          message: error.message,
        },
      },
      { status: 403 },
    );
  }

  if (error instanceof MalformedRequestError) {
    return NextResponse.json(
      {
        error: {
          code: 'malformed_request',
          message: error.message,
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: error.message,
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'internal_error',
        message: 'Unexpected error',
      },
    },
    { status: 500 },
  );
}

async function parseJsonOrThrow<T = unknown>(request: NextRequest): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new MalformedRequestError('Request body is not valid JSON');
  }
}

async function requireAuthenticatedUser(assertReviewerAccess?: (userId: string) => Promise<void>) {
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

async function buildService(deps: CreateRicAppRouterDeps): Promise<RealInputCorpusService> {
  const sql = await deps.createSqlClient();
  const repository = new RealInputCorpusPgAdapter(sql);
  const auditSink = new SqlRicAuditSink(sql);

  return new RealInputCorpusService(repository, auditSink);
}

export function createRicCollectionRouteHandlers(deps: CreateRicAppRouterDeps) {
  return {
    async POST(request: NextRequest): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const result = await service.createCase(user.id, body);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return mapError(error);
      }
    },

    async GET(request: NextRequest): Promise<NextResponse> {
      try {
        await requireAuthenticatedUser(deps.assertReviewerAccess);
        const service = await buildService(deps);
        const query = Object.fromEntries(new URL(request.url).searchParams.entries());
        const result = await service.getReviewQueue(query);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },
  };
}

export function createRicCaseActionHandlers(deps: CreateRicAppRouterDeps) {
  return {
    async GET(
      _request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        await requireAuthenticatedUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const service = await buildService(deps);
        const result = await service.getCaseDetail(caseId);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },

    async normalize(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        await service.normalizeCase(user.id, caseId, body);
        return NextResponse.json({ caseId }, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },

    async attachRun(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const result = await service.attachRun(user.id, caseId, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },

    async submitReview(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
      productSurface: RicProductSurface,
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const result = await service.submitCaseReview(user.id, caseId, productSurface, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },

    async adjudicate(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const result = await service.adjudicateCase(user.id, caseId, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },

    async promote(
      request: NextRequest,
      context: { params: Promise<{ caseId: string }> },
    ): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const { caseId } = await context.params;
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const result = await service.promoteCase(user.id, caseId, body);
        return NextResponse.json(result, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },

    async createEvalPack(request: NextRequest): Promise<NextResponse> {
      try {
        const user = await requireAuthenticatedUser(deps.assertReviewerAccess);
        const body = await parseJsonOrThrow(request);
        const service = await buildService(deps);
        const result = await service.createEvalPack(user.id, body);
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return mapError(error);
      }
    },

    async exportEvalPack(_request: NextRequest, evalPackId: string): Promise<NextResponse> {
      try {
        await requireAuthenticatedUser(deps.assertReviewerAccess);
        const service = await buildService(deps);
        const result = await service.exportEvalPack(evalPackId);
        return NextResponse.json(result.payload, { status: 200 });
      } catch (error) {
        return mapError(error);
      }
    },
  };
}
