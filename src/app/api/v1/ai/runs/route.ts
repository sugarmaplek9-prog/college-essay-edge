// =============================================================
// src/app/api/v1/ai/runs/route.ts
// POST /api/v1/ai/runs
//
// Creates a new execution run for narrative_direction_selection.
//
// Steps:
//   A — Resolve subject (essay_project)
//   B — Resolve module (module_registry)
//   C — Assess pre-run readiness
//   D — Determine execution mode
//   E — Check for conflicting in-flight run
//   F — Insert ai_runs row (queued)
//   G — Dispatch background worker (after response is sent)
//
// Background execution uses Next.js after() so the 201 response
// is returned immediately while the worker runs asynchronously.
// Requires Next.js 15.1+. Vercel's waitUntil() is equivalent.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import {
  assessNdsReadiness,
  assertNoActiveRun,
  buildCreateRunResponse,
  createRun,
} from '@/lib/ai/run-service';
import { assembleNdsContext } from '@/lib/ai/modules/narrative-direction-selection/context-assembler';
import { executeRun } from '@/lib/ai/worker/execute-run';
import {
  ConflictingRunError,
  InsufficientInputError,
  InvalidWorkflowStateError,
  MalformedRequestError,
  ModuleDisabledError,
  ModuleNotFoundError,
  PermissionDeniedError,
  SubjectNotFoundError,
} from '@/lib/ai/errors';
import { MODULE_KEY_NDS } from '@/lib/ai/constants';
import type { CreateRunRequest } from '@/types/ai';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    // --- Parse and validate request body ---
    let body: CreateRunRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body is not valid JSON', code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    const validationError = validateCreateRunRequest(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    // --- Step B: Resolve module ---
    const { data: moduleRow, error: moduleError } = await db
      .from('module_registry')
      .select('id, module_key, display_name, is_enabled')
      .eq('module_key', body.module)
      .maybeSingle();

    if (moduleError || !moduleRow) {
      throw new ModuleNotFoundError(body.module);
    }

    if (!moduleRow.is_enabled) {
      throw new ModuleDisabledError(body.module);
    }

    // --- Step A: Resolve subject ---
    if (body.subject.entity_type !== 'essay_project') {
      return NextResponse.json(
        {
          error: 'subject.entity_type must be essay_project for this module',
          code: 'MALFORMED_REQUEST',
        },
        { status: 400 }
      );
    }

    const { data: essayProject, error: projectError } = await db
      .from('essay_projects')
      .select('id, student_user_id, title, status')
      .eq('id', body.subject.entity_id)
      .maybeSingle();

    if (projectError || !essayProject) {
      throw new SubjectNotFoundError('essay_project', body.subject.entity_id);
    }

    // Confirm requester owns the project
    if (essayProject.student_user_id !== user.id) {
      throw new PermissionDeniedError(
        'You do not have access to this essay project'
      );
    }

    // --- Step C: Assess readiness ---
    // We need the full context to assess readiness correctly
    const context = await assembleNdsContext(db, {
      essayProjectId: body.subject.entity_id,
      studentUserId: user.id,
    });

    const readinessPrecheck = assessNdsReadiness(context);

    // Hard-block: do not create a run or queue a job
    if (readinessPrecheck.state === 'blocked') {
      throw new InvalidWorkflowStateError(
        readinessPrecheck.reason ??
          'Essay project workflow state does not allow direction selection'
      );
    }

    // --- Conflicting in-flight run check (Step E) ---
    await assertNoActiveRun(db, {
      moduleId: moduleRow.id,
      subjectEntityType: body.subject.entity_type,
      subjectEntityId: body.subject.entity_id,
    });

    // --- Step F: Insert run row ---
    const { runId, executionMode } = await createRun(db, {
      moduleId: moduleRow.id,
      moduleKey: moduleRow.module_key,
      studentUserId: user.id,
      subjectEntityType: body.subject.entity_type,
      subjectEntityId: body.subject.entity_id,
      triggerType: body.trigger.type,
      readinessPrecheck,
    });

    const createdAt = new Date().toISOString();

    // --- Step G: Dispatch background worker ---
    // after() ensures the worker runs AFTER the 201 response is sent.
    after(async () => {
      await executeRun(runId);
    });

    // --- Return 201 ---
    const response = buildCreateRunResponse({
      runId,
      moduleKey: moduleRow.module_key,
      executionMode,
      subjectEntityType: body.subject.entity_type,
      subjectEntityId: body.subject.entity_id,
      createdAt,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    return handleAiServiceError(err);
  }
}

// =============================================================
// REQUEST VALIDATION
// =============================================================

function validateCreateRunRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body must be an object';
  }

  const b = body as Record<string, unknown>;

  if (!b['module'] || typeof b['module'] !== 'string') {
    return 'module is required and must be a string';
  }
  if (b['module'] !== MODULE_KEY_NDS) {
    return `module must be '${MODULE_KEY_NDS}' for this endpoint`;
  }

  const subject = b['subject'] as Record<string, unknown> | undefined;
  if (!subject || typeof subject !== 'object') {
    return 'subject is required';
  }
  if (!subject['entity_type'] || !subject['entity_id']) {
    return 'subject.entity_type and subject.entity_id are required';
  }

  const trigger = b['trigger'] as Record<string, unknown> | undefined;
  if (!trigger || !trigger['type']) {
    return 'trigger.type is required';
  }

  if (!b['requested_mode']) {
    return 'requested_mode is required';
  }

  return null;
}

// =============================================================
// ERROR MAPPING
// =============================================================

function handleAiServiceError(err: unknown): NextResponse {
  if (err instanceof MalformedRequestError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 400 });
  }
  if (err instanceof PermissionDeniedError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 403 });
  }
  if (err instanceof SubjectNotFoundError || err instanceof ModuleNotFoundError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 404 });
  }
  if (err instanceof ConflictingRunError) {
    return NextResponse.json(
      { error: err.message, code: err.code, existing_run_id: err.existingRunId },
      { status: 409 }
    );
  }
  if (err instanceof InvalidWorkflowStateError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 409 });
  }
  if (err instanceof InsufficientInputError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
  }
  if (err instanceof ModuleDisabledError) {
    return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
  }

  console.error('[POST /v1/ai/runs] Unhandled error:', err);
  return NextResponse.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
