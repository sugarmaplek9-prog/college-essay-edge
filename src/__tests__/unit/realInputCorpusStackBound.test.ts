import { describe, expect, it } from 'vitest';
import { handleRicError } from '@/lib/real-input-corpus/realInputCorpusErrorBridge';
import { ConflictingRunError, MalformedRequestError, PermissionDeniedError } from '@/lib/ai/errors';
import { RicLifecycleError, RicValidationError } from '@/types/realInputCorpusService';

describe('realInputCorpusErrorBridge', () => {
  it('maps RicValidationError to 400', () => {
    const res = handleRicError(new RicValidationError([{ path: 'body', message: 'bad input' } as any]));
    expect(res.status).toBe(400);
  });

  it('maps RicLifecycleError to 409', () => {
    const res = handleRicError(new RicLifecycleError('bad transition'));
    expect(res.status).toBe(409);
  });

  it('maps MalformedRequestError to 400', () => {
    const res = handleRicError(new MalformedRequestError('bad json'));
    expect(res.status).toBe(400);
  });

  it('maps PermissionDeniedError to 403', () => {
    const res = handleRicError(new PermissionDeniedError('no access'));
    expect(res.status).toBe(403);
  });

  it('maps ConflictingRunError to 409', () => {
    const res = handleRicError(new ConflictingRunError('run-123'));
    expect(res.status).toBe(409);
  });
});
