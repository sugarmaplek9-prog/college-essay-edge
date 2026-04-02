// realInputCorpusErrorBridge.ts
// Final App Router transport mapping for the real RIC service contract

import { NextResponse } from 'next/server';
import {
  AiServiceError,
  ArtifactNotFoundError,
  ConflictingRunError,
  InsufficientInputError,
  InvalidWorkflowStateError,
  MalformedRequestError,
  ModuleDisabledError,
  ModuleNotFoundError,
  PermissionDeniedError,
  ProviderExecutionError,
  RunNotFoundError,
  ServiceConfigurationError,
  SubjectNotFoundError,
  ValidatorError,
} from '@/lib/ai/errors';
import { RicLifecycleError, RicValidationError } from '@/types/realInputCorpusService';

export function handleRicError(error: unknown): NextResponse {
  if (error instanceof RicValidationError) {
    return NextResponse.json(
      {
        error: {
          code: 'ric_validation_error',
          message: error.message,
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
          code: 'ric_lifecycle_error',
          message: error.message,
        },
      },
      { status: 409 },
    );
  }

  if (error instanceof MalformedRequestError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 400 });
  }

  if (error instanceof PermissionDeniedError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 403 });
  }

  if (
    error instanceof SubjectNotFoundError ||
    error instanceof ModuleNotFoundError ||
    error instanceof RunNotFoundError ||
    error instanceof ArtifactNotFoundError
  ) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 404 });
  }

  if (error instanceof ConflictingRunError || error instanceof InvalidWorkflowStateError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 409 });
  }

  if (error instanceof InsufficientInputError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 422 });
  }

  if (
    error instanceof ModuleDisabledError ||
    error instanceof ProviderExecutionError ||
    error instanceof ValidatorError
  ) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 500 });
  }

  if (error instanceof ServiceConfigurationError) {
    return NextResponse.json(
      { error: { code: 'service_unavailable', message: 'Service temporarily unavailable' } },
      { status: 503 },
    );
  }

  if (error instanceof AiServiceError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: 500 });
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: { code: 'internal_error', message: error.message } },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: { code: 'internal_error', message: 'Unexpected error' } },
    { status: 500 },
  );
}
