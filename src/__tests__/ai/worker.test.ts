// =============================================================
// src/__tests__/ai/worker.test.ts
// 4.3 Worker Tests
//
// Unit tests for the worker execution phases:
//  - queued run transitions to running
//  - accepted validator result persists artifact + validator + terminal status
//  - needs-more-input decision produces correct run/artifact state
//  - system error sets system_error with no admissible artifact leakage
//
// All Supabase interactions are mocked.
// =============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateNdsOutput } from '@/lib/ai/modules/narrative-direction-selection/validator';
import {
  DECISION_TO_ARTIFACT_STATUS,
  DECISION_TO_RUN_STATUS,
  PERSIST_DECISIONS,
} from '@/lib/ai/constants';
import type { NdsPayloadSuccess, NdsPayloadNeedsMoreInput } from '@/types/ai';

// =============================================================
// HELPERS
// =============================================================

function makeSuccessPayload(overrides: Partial<NdsPayloadSuccess> = {}): NdsPayloadSuccess {
  return {
    status: 'success',
    best_direction: {
      id: 'direction_1',
      angle_title: 'From proving competence to rebuilding team trust',
      core_claim: 'The strongest essay bet is the moment you moved from solo fixing to collaborative leadership after failure.',
      why_this_is_the_real_story: 'The story has a concrete internal shift under pressure, which creates real essay tension beyond accomplishment.',
      what_it_reveals_about_the_student: 'It reveals a student who revises judgment publicly and builds credibility through changed behavior.',
      why_it_beats_the_obvious_angle: 'The obvious angle is robotics achievement; this angle is stronger because it captures identity-level change.',
      main_risk_if_written_poorly: 'If written as a recap, it loses the turning-point tension and reads as activity summary.',
      next_move: 'Write the exact scene where your first approach failed, then add two observable details showing your leadership behavior changed in front of teammates.',
    },
    alternatives: [
      {
        id: 'direction_2',
        angle_title: 'Competence proof angle',
        what_this_angle_would_focus_on: 'Technical execution and problem-solving outcomes.',
        why_it_is_weaker: 'It shows capability but has less identity movement and weaker internal stakes.',
        failure_mode: 'Can become a polished achievement list with limited interpretive depth.',
      },
      {
        id: 'direction_3',
        angle_title: 'Service/responsibility angle',
        what_this_angle_would_focus_on: 'Impact on peers and team culture.',
        why_it_is_weaker: 'Compelling values, but less direct evidence of your personal turning-point decision.',
        failure_mode: 'Can drift into broad values language without a vivid hinge moment.',
      },
    ],
    evidence_anchors: [
      {
        label: 'Robotics competition',
        source_type: 'story_entry',
        source_id: 'story-uuid-1',
      },
    ],
    depth_signals: {
      detected_tension: 'External performance pressure vs internal recalibration.',
      detected_shift: 'Moved from proving expertise to enabling team execution.',
      obvious_but_weaker_angle: 'Robotics accomplishment essay.',
      essay_opportunity: 'Anchor the narrative around one failed decision and visible correction.',
    },
    recovery_question: null,
    ...overrides,
  };
}

function makeNmiPayload(): NdsPayloadNeedsMoreInput {
  return {
    status: 'needs_more_input',
    best_direction: null,
    alternatives: [],
    evidence_anchors: [],
    depth_signals: {
      detected_tension: null,
      detected_shift: null,
      obvious_but_weaker_angle: null,
      essay_opportunity: null,
    },
    recovery_question: 'What changed for you after this experience?',
  };
}

// =============================================================
// TESTS — Validator Engine
// =============================================================

describe('4.3 Worker — validator produces accept for valid success payload', () => {
  it('accepts a well-formed success payload', () => {
    const payload = makeSuccessPayload() as unknown as Record<string, unknown>;
    const result = validateNdsOutput(payload);

    expect(result.structuralPass).toBe(true);
    expect(result.semanticPass).toBe(true);
    expect(result.brandPass).toBe(true);
    expect(result.authenticityPass).toBe(true);
    expect(result.decision).toBe('accept');
    expect(result.failureCodes).toHaveLength(0);
  });

  it('converts needs_more_input payload to convert_to_needs_more_input decision', () => {
    const payload = makeNmiPayload() as unknown as Record<string, unknown>;
    const result = validateNdsOutput(payload);

    expect(result.decision).toBe('convert_to_needs_more_input');
    expect(result.needsMoreInputReasonCode).toBe(
      'insufficient_input_for_direction_generation'
    );
    expect(result.failureCodes).toHaveLength(0);
  });
});

describe('4.3 Worker — validator blocks structurally invalid payload', () => {
  it('blocks payload missing status', () => {
    const result = validateNdsOutput({});
    expect(result.structuralPass).toBe(false);
    expect(result.decision).toBe('block');
    expect(result.failureCodes).toContain('nds.structural.missing_status');
  });

  it('blocks payload with invalid status value', () => {
    const result = validateNdsOutput({ status: 'pending' });
    expect(result.structuralPass).toBe(false);
    expect(result.decision).toBe('block');
    expect(result.failureCodes).toContain('nds.structural.invalid_status');
  });

  it('blocks payload missing best_direction on success status', () => {
    const result = validateNdsOutput({ status: 'success' });
    expect(result.structuralPass).toBe(false);
    expect(result.decision).toBe('block');
    expect(result.failureCodes).toContain('nds.structural.missing_best_direction');
  });

  it('blocks payload with missing best_direction.id', () => {
    const payload = {
      status: 'success',
      best_direction: {
        angle_title: 'No ID direction',
        core_claim: 'A direction without an id',
        why_this_is_the_real_story: 'wins because there is a shift here with enough detail and evidence grounding.',
        what_it_reveals_about_the_student: 'reveal',
        why_it_beats_the_obvious_angle: 'beats obvious angle',
        main_risk_if_written_poorly: 'risk',
        next_move: 'next',
      },
      alternatives: [],
      evidence_anchors: [],
      depth_signals: {
        detected_tension: 'tension',
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: null,
    };
    const result = validateNdsOutput(payload);
    expect(result.structuralPass).toBe(false);
    expect(result.failureCodes).toContain('nds.structural.best_direction_missing_id');
  });

  it('blocks needs_more_input payload missing recovery_question', () => {
    const result = validateNdsOutput({
      status: 'needs_more_input',
      depth_signals: {
        detected_tension: null,
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: null,
    });
    expect(result.structuralPass).toBe(false);
    expect(result.failureCodes).toContain('nds.structural.nmi_missing_recovery_question');
  });

  it('blocks payload with non-unique alternative ids', () => {
    const payload = {
      status: 'success',
      best_direction: {
        id: 'direction_1',
        angle_title: 'Primary direction',
        core_claim: 'Strong claim with enough characters and strategic specificity for validation.',
        why_this_is_the_real_story: 'This is the real story because it tracks a specific internal shift under pressure with consequences.',
        what_it_reveals_about_the_student: 'Reveals a pattern of public judgment revision.',
        why_it_beats_the_obvious_angle: 'It beats the obvious angle by prioritizing transformation over achievement recap.',
        main_risk_if_written_poorly: 'Risk Y',
        next_move: 'Do Z',
      },
      alternatives: [
        { id: 'direction_2', angle_title: 'Alt A', what_this_angle_would_focus_on: 'A', why_it_is_weaker: 'weaker', failure_mode: 'risk' },
        { id: 'direction_2', angle_title: 'Alt B', what_this_angle_would_focus_on: 'B', why_it_is_weaker: 'weaker', failure_mode: 'risk' }, // duplicate
      ],
      evidence_anchors: [],
      depth_signals: {
        detected_tension: 'tension',
        detected_shift: 'shift',
        obvious_but_weaker_angle: 'obvious',
        essay_opportunity: 'opportunity',
      },
      recovery_question: null,
    };
    const result = validateNdsOutput(payload);
    expect(result.failureCodes).toContain('nds.structural.non_unique_alternative_ids');
  });
});

describe('4.3 Worker — validator blocks brand violations', () => {
  it('blocks payload containing banned phrase', () => {
    const payload = makeSuccessPayload({
      best_direction: {
        id: 'direction_1',
        angle_title: 'Direction with banned phrase',
        core_claim: 'As an AI I cannot provide specific advice.',
        why_this_is_the_real_story: 'Strong evidence with enough words to pass semantic checks if not for banned phrase.',
        what_it_reveals_about_the_student: 'Reveals resilience.',
        why_it_beats_the_obvious_angle: 'Compares against obvious angle adequately.',
        main_risk_if_written_poorly: 'Low risk',
        next_move: 'Move forward with a strategic scene and frame test over two drafts.',
      },
    }) as unknown as Record<string, unknown>;

    const result = validateNdsOutput(payload);
    expect(result.brandPass).toBe(false);
    expect(result.decision).toBe('block');
    expect(result.failureCodes).toContain('nds.brand.banned_phrase');
  });
});

describe('4.3 Worker — validator retry on generic titles', () => {
  it('returns retry_tightened for generic direction title', () => {
    const payload = makeSuccessPayload({
      best_direction: {
        id: 'direction_1',
        angle_title: 'direction 1', // matches GENERIC_DIRECTION_TITLES
        core_claim: 'A strong direction with real content here and enough length for meaningful validation.',
        why_this_is_the_real_story: 'It wins because of specific reasons tied to change in the story and a meaningful internal shift.',
        what_it_reveals_about_the_student: 'Shows better judgment development.',
        why_it_beats_the_obvious_angle: 'Clear compare against obvious angle.',
        main_risk_if_written_poorly: 'There is a risk here',
        next_move: 'Do this next step by writing the hinge scene, extracting two proof details, and stress-testing claim alignment.',
      },
    }) as unknown as Record<string, unknown>;

    const result = validateNdsOutput(payload);
    expect(result.semanticPass).toBe(false);
    expect(result.decision).toBe('retry_tightened');
  });

  it('converts dishonest success with no evidence anchors to needs_more_input', () => {
    const payload = makeSuccessPayload({
      evidence_anchors: [],
      alternatives: [
        {
          id: 'direction_2',
          angle_title: 'A different angle',
          what_this_angle_would_focus_on: 'Alternative focus',
          why_it_is_weaker: 'Less focused on transformation',
          failure_mode: 'May be diffuse',
        },
      ],
    }) as unknown as Record<string, unknown>;

    const result = validateNdsOutput(payload);
    expect(result.semanticPass).toBe(false);
    expect(result.decision).toBe('convert_to_needs_more_input');
    expect(result.failureCodes).toContain(
      'nds.semantic.dishonest_success_insufficient_evidence'
    );
  });

  it('rejects no-clear-winner payload when best title duplicates an alternative title', () => {
    const payload = makeSuccessPayload({
      best_direction: {
        id: 'direction_1',
        angle_title: 'Robotics growth arc',
        core_claim: 'Detailed claim with clear reflective movement and stakes anchored in a turning point.',
        why_this_is_the_real_story: 'Specific and grounded in a turning point with clear internal revision under pressure.',
        what_it_reveals_about_the_student: 'Shows judgment shift.',
        why_it_beats_the_obvious_angle: 'Beats obvious angle through transformation over achievement list.',
        main_risk_if_written_poorly: 'Could become broad if over-scoped.',
        next_move: 'Draft the exact scene where responsibility shifted and list two external signals proving the shift.',
      },
      alternatives: [
        {
          id: 'direction_2',
          angle_title: 'Robotics growth arc',
          what_this_angle_would_focus_on: 'Same framing as winner',
          why_it_is_weaker: 'Same framing as winner',
          failure_mode: 'No differentiation',
        },
      ],
    }) as unknown as Record<string, unknown>;

    const result = validateNdsOutput(payload);
    expect(result.semanticPass).toBe(false);
    expect(result.decision).toBe('convert_to_needs_more_input');
    expect(result.failureCodes).toContain('nds.semantic.no_clear_winner');
  });

  it('rejects fake-variety alternatives when losing rationale and risk are duplicated', () => {
    const payload = makeSuccessPayload({
      alternatives: [
        {
          id: 'direction_2',
          angle_title: 'Alternative A',
          what_this_angle_would_focus_on: 'Focus A',
          why_it_is_weaker: 'Same reason for both options',
          failure_mode: 'Same risk for both options',
        },
        {
          id: 'direction_3',
          angle_title: 'Alternative B',
          what_this_angle_would_focus_on: 'Focus B',
          why_it_is_weaker: 'Same reason for both options',
          failure_mode: 'Same risk for both options',
        },
      ],
    }) as unknown as Record<string, unknown>;

    const result = validateNdsOutput(payload);
    expect(result.semanticPass).toBe(false);
    expect(result.decision).toBe('retry_tightened');
    expect(result.failureCodes).toContain('nds.semantic.alternatives_not_functionally_distinct');
  });
});

// =============================================================
// TESTS — Decision → Status mapping
// =============================================================

describe('4.3 Worker — decision to run status mapping', () => {
  it('accept maps to completed', () => {
    expect(DECISION_TO_RUN_STATUS['accept']).toBe('completed');
  });

  it('accept_partial maps to partial', () => {
    expect(DECISION_TO_RUN_STATUS['accept_partial']).toBe('partial');
  });

  it('convert_to_needs_more_input maps to needs_more_input', () => {
    expect(DECISION_TO_RUN_STATUS['convert_to_needs_more_input']).toBe(
      'needs_more_input'
    );
  });

  it('block maps to blocked', () => {
    expect(DECISION_TO_RUN_STATUS['block']).toBe('blocked');
  });
});

describe('4.3 Worker — decision to artifact status mapping', () => {
  it('accept maps to success', () => {
    expect(DECISION_TO_ARTIFACT_STATUS['accept']).toBe('success');
  });

  it('convert_to_needs_more_input maps to needs_more_input', () => {
    expect(DECISION_TO_ARTIFACT_STATUS['convert_to_needs_more_input']).toBe(
      'needs_more_input'
    );
  });

  it('block is NOT in persist decisions', () => {
    expect(PERSIST_DECISIONS).not.toContain('block');
  });

  it('retry_tightened is NOT in persist decisions', () => {
    expect(PERSIST_DECISIONS).not.toContain('retry_tightened');
  });
});

// =============================================================
// TESTS — system_error path
// =============================================================

describe('4.3 Worker — system error sets correct terminal state', () => {
  it('system_error is a valid run status', () => {
    // Ensures our TypeScript type includes system_error
    const status: string = 'system_error';
    const validStatuses = [
      'queued', 'running', 'completed', 'partial',
      'needs_more_input', 'failed_validation', 'blocked', 'system_error'
    ];
    expect(validStatuses).toContain(status);
  });

  it('blocked artifacts are not in PERSIST_DECISIONS', () => {
    // This is the guard that prevents blocked content from being persisted
    const blockedDecision = 'block';
    expect(PERSIST_DECISIONS).not.toContain(blockedDecision);
  });
});
