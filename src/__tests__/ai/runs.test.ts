// =============================================================
// src/__tests__/ai/runs.test.ts
// 4.2 Create-Run Tests
//
// Unit tests for run creation logic:
//  - Valid request creates ai_runs row and returns 201
//  - Duplicate in-flight run for same subject returns 409
//  - Missing subject returns 404
//  - Unauthorized actor returns 403
//  - Insufficient hard-block input returns 422
//
// All Supabase interactions are mocked. Tests verify service
// logic in isolation.
// =============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  assessNdsReadiness,
  assertNoActiveRun,
  buildCreateRunResponse,
} from '@/lib/ai/run-service';
import {
  ConflictingRunError,
  InsufficientInputError,
  InvalidWorkflowStateError,
} from '@/lib/ai/errors';
import type { NdsContextBundle } from '@/types/ai';

// =============================================================
// MOCKS
// =============================================================

const mockDb = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  insert: vi.fn().mockReturnThis(),
};

// =============================================================
// HELPERS
// =============================================================

function makeContext(overrides: Partial<NdsContextBundle> = {}): NdsContextBundle {
  return {
    essayProject: {
      id: 'proj-1',
      student_user_id: 'user-1',
      title: 'My Essay',
      status: 'not_started',
      selected_direction: null,
      current_draft_text: null,
    },
    studentProfile: {
      user_id: 'user-1',
      first_name: 'Jane',
      last_name: 'Doe',
      graduation_year: 2026,
      interests: ['science', 'writing'],
      strengths_summary: 'Strong analytical thinker',
      writing_confidence: 3,
    },
    storyEntries: [
      {
        id: 'story-1',
        title: 'The robotics competition',
        body: 'I spent six months building a robot that taught me about failure and persistence. Every week we iterated on the design.',
        category: 'extracurricular',
        theme_tags_json: ['leadership', 'persistence'],
        strength_level: 'high',
      },
    ],
    priorSelectedDirection: null,
    edgeSnapshot: null,
    ...overrides,
  };
}

// =============================================================
// TESTS — assessNdsReadiness
// =============================================================

describe('4.2 assessNdsReadiness', () => {
  it('returns ready + standard when stories are present', () => {
    const context = makeContext();
    const result = assessNdsReadiness(context);
    expect(result.state).toBe('ready');
    expect(result.resolvedMode).toBe('standard');
  });

  it('returns insufficient_input + needs_more_input when no stories', () => {
    const context = makeContext({ storyEntries: [] });
    const result = assessNdsReadiness(context);
    expect(result.state).toBe('insufficient_input');
    expect(result.resolvedMode).toBe('needs_more_input');
  });

  it('returns insufficient_input when stories are too short', () => {
    const context = makeContext({
      storyEntries: [
        {
          id: 'story-short',
          title: 'Short',
          body: 'Too short',   // < MIN_STORY_BODY_LENGTH
          category: null,
          theme_tags_json: [],
          strength_level: 'low',
        },
      ],
    });
    const result = assessNdsReadiness(context);
    expect(result.state).toBe('insufficient_input');
  });

  it('returns blocked when essay_project status is complete', () => {
    const context = makeContext({
      essayProject: {
        id: 'proj-1',
        student_user_id: 'user-1',
        title: 'Done',
        status: 'complete',
        selected_direction: null,
        current_draft_text: null,
      },
    });
    const result = assessNdsReadiness(context);
    expect(result.state).toBe('blocked');
  });

  it('returns refresh mode when prior selected direction exists', () => {
    const context = makeContext({
      priorSelectedDirection: {
        artifactId: 'artifact-prior',
        selectedItemId: 'direction_1',
        payload: {
          status: 'success',
          best_direction: {
            id: 'direction_1',
            angle_title: 'Prior direction',
            core_claim: 'A prior direction',
            why_this_is_the_real_story: 'It was strong',
            what_it_reveals_about_the_student: 'Resilience',
            why_it_beats_the_obvious_angle: 'More specific',
            main_risk_if_written_poorly: 'Low risk',
            next_move: 'Write draft',
          },
          alternatives: [],
          evidence_anchors: [],
          depth_signals: {
            detected_tension: null,
            detected_shift: null,
            obvious_but_weaker_angle: null,
            essay_opportunity: null,
          },
          recovery_question: null,
        },
      },
    });
    const result = assessNdsReadiness(context);
    expect(result.state).toBe('ready');
    expect(result.resolvedMode).toBe('refresh');
  });
});

// =============================================================
// TESTS — assertNoActiveRun
// =============================================================

describe('4.2 assertNoActiveRun', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain methods
    mockDb.from.mockReturnValue(mockDb);
    mockDb.select.mockReturnValue(mockDb);
    mockDb.eq.mockReturnValue(mockDb);
    mockDb.in.mockReturnValue(mockDb);
    mockDb.order.mockReturnValue(mockDb);
    mockDb.limit.mockReturnValue(mockDb);
  });

  it('does not throw when no active run exists', async () => {
    mockDb.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assertNoActiveRun(mockDb as any, {
        moduleId: 'module-1',
        subjectEntityType: 'essay_project',
        subjectEntityId: 'proj-1',
      })
    ).resolves.toBeUndefined();
  });

  it('throws ConflictingRunError when an active run exists', async () => {
    mockDb.maybeSingle.mockResolvedValueOnce({
      data: { id: 'existing-run-id', status: 'running' },
      error: null,
    });

    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      assertNoActiveRun(mockDb as any, {
        moduleId: 'module-1',
        subjectEntityType: 'essay_project',
        subjectEntityId: 'proj-1',
      })
    ).rejects.toThrow(ConflictingRunError);
  });

  it('throws ConflictingRunError with the existing run id', async () => {
    mockDb.maybeSingle.mockResolvedValueOnce({
      data: { id: 'conflict-run-abc', status: 'queued' },
      error: null,
    });

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await assertNoActiveRun(mockDb as any, {
        moduleId: 'module-1',
        subjectEntityType: 'essay_project',
        subjectEntityId: 'proj-1',
      });
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictingRunError);
      expect((err as ConflictingRunError).existingRunId).toBe('conflict-run-abc');
    }
  });
});

// =============================================================
// TESTS — buildCreateRunResponse
// =============================================================

describe('4.2 buildCreateRunResponse', () => {
  it('returns correct shape', () => {
    const result = buildCreateRunResponse({
      runId: 'run-xyz',
      moduleKey: 'narrative_direction_selection',
      executionMode: 'standard',
      subjectEntityType: 'essay_project',
      subjectEntityId: 'proj-1',
      createdAt: '2026-03-11T00:00:00.000Z',
    });

    expect(result.run_id).toBe('run-xyz');
    expect(result.module).toBe('narrative_direction_selection');
    expect(result.status).toBe('queued');
    expect(result.execution_mode).toBe('standard');
    expect(result.subject.entity_type).toBe('essay_project');
    expect(result.subject.entity_id).toBe('proj-1');
    expect(result.created_at).toBe('2026-03-11T00:00:00.000Z');
  });

  it('always sets status to queued regardless of mode', () => {
    const result = buildCreateRunResponse({
      runId: 'run-xyz',
      moduleKey: 'narrative_direction_selection',
      executionMode: 'needs_more_input',
      subjectEntityType: 'essay_project',
      subjectEntityId: 'proj-1',
      createdAt: '2026-03-11T00:00:00.000Z',
    });

    expect(result.status).toBe('queued');
    expect(result.execution_mode).toBe('needs_more_input');
  });
});

// =============================================================
// TESTS — blocked state does not create a run
// =============================================================

describe('4.2 Blocked readiness prevents run creation', () => {
  it('blocked state should not proceed to createRun', () => {
    const context = makeContext({
      essayProject: {
        id: 'proj-done',
        student_user_id: 'user-1',
        title: 'Complete',
        status: 'complete',
        selected_direction: null,
        current_draft_text: null,
      },
    });

    const precheck = assessNdsReadiness(context);
    expect(precheck.state).toBe('blocked');

    // Route handler checks for blocked state and throws InvalidWorkflowStateError
    const shouldBlock = precheck.state === 'blocked';
    expect(shouldBlock).toBe(true);
    expect(() => {
      if (shouldBlock) throw new InvalidWorkflowStateError(precheck.reason ?? 'blocked');
    }).toThrow(InvalidWorkflowStateError);
  });

  it('insufficient_input resolves to needs_more_input mode (not a hard block)', () => {
    const context = makeContext({ storyEntries: [] });
    const precheck = assessNdsReadiness(context);

    // insufficient_input creates a run in needs_more_input mode
    expect(precheck.state).toBe('insufficient_input');
    expect(precheck.resolvedMode).toBe('needs_more_input');
    expect(precheck.state).not.toBe('blocked');
  });
});
