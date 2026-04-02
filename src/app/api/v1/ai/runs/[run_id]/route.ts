// =============================================================
// src/app/api/v1/ai/runs/[run_id]/route.ts
// GET /api/v1/ai/runs/{run_id}
//
// Returns execution state only. This is the polling endpoint.
//
// Contract:
//  - Returns run status, execution_mode, readiness_state
//  - Returns artifact_id if one exists for the run (null otherwise)
//  - Returns validator_result_id if one exists
//  - Never returns raw model output
//  - Never collapses artifact status into run status
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { buildGetRunResponse, getRunById } from '@/lib/ai/run-service';
import { RunNotFoundError, PermissionDeniedError } from '@/lib/ai/errors';

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

    // --- Load run (ownership enforced inside) ---
    const run = await getRunById(db, runId, user.id);

    // --- Resolve module key ---
    const { data: moduleRow } = await db
      .from('module_registry')
      .select('module_key')
      .eq('id', run.module_id)
      .single();

    const moduleKey = moduleRow?.module_key ?? 'unknown';

    // --- Build response (includes artifact_id and validator_result_id lookups) ---
    const response = await buildGetRunResponse(db, run, moduleKey);

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof RunNotFoundError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 404 }
      );
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: 403 }
      );
    }

    console.error('[GET /v1/ai/runs/:run_id] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
