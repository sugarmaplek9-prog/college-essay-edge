// =============================================================
// src/app/api/v1/ai/artifacts/[artifact_id]/select/route.ts
// POST /api/v1/ai/artifacts/{artifact_id}/select
//
// Persists explicit user direction selection in one operation:
//   1. Validates artifact ownership + module + status
//   2. Validates selected_item_id exists in payload
//   3. Inserts artifact_selection_events
//   4. Updates ai_artifacts (selected_by_user, selected_item_id)
//   5. Updates essay_projects.selected_direction_artifact_id
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import {
  loadAndValidateArtifactForSelection,
  persistSelection,
  validateSelectedItemId,
} from '@/lib/ai/selection-service';
import {
  ArtifactNotFoundError,
  MalformedRequestError,
  PermissionDeniedError,
} from '@/lib/ai/errors';
import { MODULE_KEY_NDS } from '@/lib/ai/constants';
import type { SelectArtifactRequest } from '@/types/ai';

interface RouteParams {
  params: Promise<{ artifact_id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { artifact_id: artifactId } = await params;
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

    if (!artifactId || typeof artifactId !== 'string') {
      return NextResponse.json(
        { error: 'artifact_id is required', code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    // --- Parse request body ---
    let body: SelectArtifactRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body is not valid JSON', code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    // --- Validate request fields ---
    const validationError = validateSelectRequest(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    // --- Load and validate artifact ---
    const artifact = await loadAndValidateArtifactForSelection(
      db,
      artifactId,
      user.id,
      MODULE_KEY_NDS
    );

    // --- Validate selected_item_id exists in payload ---
    validateSelectedItemId(artifact, body.selected_item_id);

    // --- Persist selection ---
    const response = await persistSelection(db, artifact, body, user.id);

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof MalformedRequestError) {
      return NextResponse.json(
        { error: (err as MalformedRequestError).message, code: (err as MalformedRequestError).code },
        { status: 400 }
      );
    }
    if (err instanceof PermissionDeniedError) {
      return NextResponse.json(
        { error: (err as PermissionDeniedError).message, code: (err as PermissionDeniedError).code },
        { status: 403 }
      );
    }
    if (err instanceof ArtifactNotFoundError) {
      return NextResponse.json(
        { error: (err as ArtifactNotFoundError).message, code: (err as ArtifactNotFoundError).code },
        { status: 404 }
      );
    }

    console.error('[POST /v1/ai/artifacts/:artifact_id/select] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// =============================================================
// REQUEST VALIDATION
// =============================================================

function validateSelectRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body must be an object';
  }

  const b = body as Record<string, unknown>;

  if (!b['selected_item_id'] || typeof b['selected_item_id'] !== 'string') {
    return 'selected_item_id is required and must be a string';
  }

  if (!b['selection_context'] || typeof b['selection_context'] !== 'string') {
    return 'selection_context is required';
  }

  if (b['selection_context'] !== 'direction_choice') {
    return 'selection_context must be direction_choice for this module';
  }

  if (
    b['selected_rank'] !== undefined &&
    b['selected_rank'] !== null &&
    typeof b['selected_rank'] !== 'number'
  ) {
    return 'selected_rank must be a number or null';
  }

  return null;
}
