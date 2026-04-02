// =============================================================
// src/__tests__/ai/retrieval.test.ts
// 4.4 Retrieval Tests
//
// Tests for GET /runs/{id} and GET /runs/{id}/artifact:
//  - GET /runs/{id} returns execution state only
//  - GET /runs/{id}/artifact returns validated artifact only
//  - blocked run never returns blocked content as successful artifact
//  - failed_validation artifact is never returned
//
// Service layer unit tests with mocked DB.
// =============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildGetArtifactResponse,
  getAdmissibleArtifactForRun,
} from '@/lib/ai/artifact-service';
import { ArtifactNotFoundError } from '@/lib/ai/errors';
import type { AiArtifact, AiRun, ValidatorResult } from '@/types/ai';

// =============================================================
// MOCKS
// =============================================================

const mockDb = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
};

// =============================================================
// FIXTURES
// =============================================================

function makeRun(overrides: Partial<AiRun> = {}): AiRun {
  return {
    id: 'run-abc',
    module_id: 'module-1',
    student_user_id: 'user-1',
    trigger_type: 'user_action',
    subject_entity_type: 'essay_project',
    subject_entity_id: 'proj-1',
    execution_mode: 'standard',
    readiness_state: 'ready',
    status: 'completed',
    retry_count: 0,
    fallback_applied: false,
    fallback_reason_code: null,
    provider_key: 'openai',
    model_key: 'gpt-4o',
    prompt_bundle_version_id: null,
    schema_version_id: null,
    validator_version_id: null,
    started_at: '2026-03-11T00:00:01.000Z',
    completed_at: '2026-03-11T00:00:05.000Z',
    created_at: '2026-03-11T00:00:00.000Z',
    ...overrides,
  };
}

function makeArtifact(overrides: Partial<AiArtifact> = {}): AiArtifact {
  return {
    id: 'artifact-1',
    run_id: 'run-abc',
    module_id: 'module-1',
    student_user_id: 'user-1',
    subject_entity_type: 'essay_project',
    subject_entity_id: 'proj-1',
    artifact_status: 'success',
    summary_text: 'Best direction: "The robotics competition". 2 alternatives analyzed.',
    payload_json: {
      status: 'success',
      best_direction: {
        id: 'direction_1',
        title: 'The robotics competition',
        summary: 'Strong direction grounded in a concrete experience.',
        why_it_wins: 'Clear arc with a strong emotional core.',
        main_risk: 'Risk of staying surface-level.',
        next_move: 'Write the moment your thinking shifted.',
      },
      alternatives: [
        {
          id: 'direction_2',
          title: 'Volunteering',
          why_it_loses: 'Less specific',
          risk: 'Too broad',
        },
      ],
      evidence_anchors: [
        { label: 'Robotics competition', source_type: 'story_entry', source_id: 'story-1' },
      ],
      recovery_question: null,
    },
    warnings_json: [],
    meta_json: { provider: 'openai', model: 'gpt-4o' },
    is_canonical_for_subject: true,
    selected_by_user: false,
    selected_item_id: null,
    render_version: 'v1.0',
    created_at: '2026-03-11T00:00:05.000Z',
    superseded_at: null,
    ...overrides,
  };
}

function makeValidatorResult(overrides: Partial<ValidatorResult> = {}): ValidatorResult {
  return {
    id: 'validator-1',
    run_id: 'run-abc',
    artifact_id: 'artifact-1',
    module_id: 'module-1',
    validator_version_id: null,
    structural_pass: true,
    semantic_pass: true,
    brand_pass: true,
    authenticity_pass: true,
    admissibility_decision: 'accept',
    highest_severity: 'low',
    failure_codes_json: [],
    warning_codes_json: [],
    needs_more_input_reason_code: null,
    created_at: '2026-03-11T00:00:05.000Z',
    ...overrides,
  };
}

// =============================================================
// TESTS — getAdmissibleArtifactForRun
// =============================================================

describe('4.4 getAdmissibleArtifactForRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.from.mockReturnValue(mockDb);
    mockDb.select.mockReturnValue(mockDb);
    mockDb.eq.mockReturnValue(mockDb);
    mockDb.order.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
  });

  it('returns artifact and validator result for a successful run', async () => {
    mockDb.maybeSingle
      .mockResolvedValueOnce({ data: makeArtifact(), error: null }) // artifact
      .mockResolvedValueOnce({ data: makeValidatorResult(), error: null }); // validator

    const result = await getAdmissibleArtifactForRun(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockDb as any,
      'run-abc'
    );

    expect(result.artifact.id).toBe('artifact-1');
    expect(result.artifact.artifact_status).toBe('success');
    expect(result.validatorResult?.admissibility_decision).toBe('accept');
  });

  it('throws ArtifactNotFoundError when no artifact exists', async () => {
    mockDb.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAdmissibleArtifactForRun(mockDb as any, 'run-no-artifact')
    ).rejects.toThrow(ArtifactNotFoundError);
  });

  it('throws ArtifactNotFoundError for blocked artifact', async () => {
    mockDb.maybeSingle.mockResolvedValueOnce({
      data: makeArtifact({ artifact_status: 'blocked' }),
      error: null,
    });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAdmissibleArtifactForRun(mockDb as any, 'run-blocked')
    ).rejects.toThrow(ArtifactNotFoundError);
  });

  it('throws ArtifactNotFoundError for failed_validation artifact', async () => {
    mockDb.maybeSingle.mockResolvedValueOnce({
      data: makeArtifact({ artifact_status: 'failed_validation' }),
      error: null,
    });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getAdmissibleArtifactForRun(mockDb as any, 'run-failed-validation')
    ).rejects.toThrow(ArtifactNotFoundError);
  });

  it('returns needs_more_input artifact (admissible)', async () => {
    mockDb.maybeSingle
      .mockResolvedValueOnce({
        data: makeArtifact({ artifact_status: 'needs_more_input' }),
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await getAdmissibleArtifactForRun(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockDb as any,
      'run-nmi'
    );

    expect(result.artifact.artifact_status).toBe('needs_more_input');
  });
});

// =============================================================
// TESTS — buildGetArtifactResponse
// =============================================================

describe('4.4 buildGetArtifactResponse', () => {
  it('builds correct response shape for accepted artifact', () => {
    const run = makeRun();
    const artifact = makeArtifact();
    const validator = makeValidatorResult();

    const response = buildGetArtifactResponse(run, 'narrative_direction_selection', artifact, validator);

    // Run section contains execution state only
    expect(response.run.run_id).toBe('run-abc');
    expect(response.run.status).toBe('completed');
    expect(response.run.module).toBe('narrative_direction_selection');

    // Artifact section uses payload_json as data, not raw provider text
    expect(response.artifact.id).toBe('artifact-1');
    expect(response.artifact.status).toBe('success');
    expect(response.artifact.data).toBeDefined();
    expect(typeof response.artifact.data).toBe('object');

    // Validator section
    expect(response.validator.decision).toBe('accept');
    expect(response.validator.structural_pass).toBe(true);
    expect(response.validator.failure_codes).toHaveLength(0);

    // Review placeholder
    expect(response.review.queued).toBe(false);
    expect(response.review.queue_item_id).toBeNull();
  });

  it('does not include rawText or any provider response field', () => {
    const response = buildGetArtifactResponse(
      makeRun(),
      'narrative_direction_selection',
      makeArtifact(),
      makeValidatorResult()
    );

    // Ensure no raw provider fields leak through
    const responseStr = JSON.stringify(response);
    expect(responseStr).not.toContain('rawText');
    expect(responseStr).not.toContain('provider_response');
    expect(responseStr).not.toContain('raw_output');
  });

  it('meta includes selected and is_canonical_for_subject', () => {
    const artifact = makeArtifact({ selected_by_user: true, is_canonical_for_subject: true });
    const response = buildGetArtifactResponse(makeRun(), 'narrative_direction_selection', artifact, null);

    expect(response.artifact.meta.selected).toBe(true);
    expect(response.artifact.meta.is_canonical_for_subject).toBe(true);
  });
});
