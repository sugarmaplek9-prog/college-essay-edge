// =============================================================
// src/app/api/v1/ai/runs/[run_id]/artifact/route.ts
// GET /api/v1/ai/runs/{run_id}/artifact
//
// Returns the product-approved artifact and validator state.
//
// Contract:
//  - Returns only validated artifact (no raw provider output)
//  - Returns 404 if no admissible artifact exists for the run
//  - Blocked content is NEVER returned as a successful artifact
//  - failed_validation artifacts are NEVER returned
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { getRunById } from '@/lib/ai/run-service';
import {
  buildGetArtifactResponse,
  getAdmissibleArtifactForRun,
} from '@/lib/ai/artifact-service';
import {
  ArtifactNotFoundError,
  PermissionDeniedError,
  RunNotFoundError,
} from '@/lib/ai/errors';

interface RouteParams {
  params: Promise<{ run_id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { run_id: runId } = await params;
    const db = await createAuthClient();

    // --- Authenticate ---
    const {
      data: { user },
      error: authError,
    } = await db.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    if (!runId || typeof runId !== 'string') {
      return NextResponse.json(
        { error: 'run_id is required', code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    // --- Load run (ownership enforced) ---
    const run = await getRunById(db, runId, user.id);

    // --- Resolve module key ---
    const { data: moduleRow } = await db
      .from('module_registry')
      .select('module_key')
      .eq('id', run.module_id)
      .single();

    const moduleKey = moduleRow?.module_key ?? 'unknown';

    // --- Load admissible artifact (throws if none exists or if blocked) ---
    const { artifact, validatorResult } = await getAdmissibleArtifactForRun(
      db,
      runId
    );

    // --- Build response ---
    const response = buildGetArtifactResponse(run, moduleKey, artifact, validatorResult);

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof ArtifactNotFoundError) {
      return NextResponse.json(
        { error: (err as ArtifactNotFoundError).message, code: (err as ArtifactNotFoundError).code },
        { status: 404 }
      );
    }
    if (err instanceof RunNotFoundError) {
      return NextResponse.json(
        { error: (err as RunNotFoundError).message, code: (err as RunNotFoundError).code },
        { status: 404 }
      );
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: (err as PermissionDeniedError).message, code: (err as PermissionDeniedError).code },
        { status: 403 }
      );
    }

    console.error('[GET /v1/ai/runs/:run_id/artifact] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
