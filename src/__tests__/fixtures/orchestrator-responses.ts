/**
 * src/__tests__/fixtures/orchestrator-responses.ts
 * 
 * Minimal fixture pack for first-minute vertical slice testing.
 * Three seeded cases: strong (F1), thin recovery (F3), blocked (F4).
 * 
 * These are deterministic IntakeIntelligenceObject responses
 * used by E2E and unit tests.
 */

import type { IntakeIntelligenceObject } from '@/types/intake';

/**
 * F1 — Strong Case
 * 
 * Input: Clear signal, enough detail, resolvable pattern.
 * Expected route: reflection → direction → compare available
 * 
 * Use case: Student provides a concrete narrative with pivot moment.
 */
export const FIXTURE_F1_STRONG_CASE = {
  intake_session_id: 'fixture-f1-strong-case',
  student_user_id: 'test-student-1',
  subject_entity_id: 'test-essay-1',
  
  usable_signal: {
    usable_signal: true,
    signal_strength: 'high',
    signal_types: ['self_correction_arc', 'responsibility_shift'],
    confidence: 'high',
    reason_codes: [
      'STRONG_SELF_CORRECTION_PRESENT',
      'SCENE_DETAIL_SUFFICIENT',
    ],
    evidence_sources: [
      {
        source_id: 'story-1',
        source_type: 'story_entry',
        excerpt: 'spent three summers...That conversation changed how I think about service.',
      },
    ],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'hybrid',
    },
  },

  authorship_signal: {
    authorship_signal: 'student_authentic',
    contamination_risk: 'low',
    student_scene_evidence: 'present',
    reasons: ['SCENE_SPECIFIC_LANGUAGE', 'PERSONAL_REFLECTION'],
    evidence_sources: [
      {
        source_id: 'story-1',
        source_type: 'story_entry',
      },
    ],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  narrative_pattern: {
    primary_pattern: 'self_correction_arc',
    secondary_patterns: ['responsibility_shift'],
    confidence: 'high',
    reason_codes: [
      'PIVOT_MOMENT_DETECTED',
      'BEFORE_AFTER_CONTRAST_PRESENT',
      'EXTERNAL_FEEDBACK_CITED',
    ],
    supporting_evidence: [
      {
        source_id: 'story-1',
        source_type: 'story_entry',
        excerpt: 'nurse pulled me aside and said I was just getting in the way',
      },
    ],
    taxonomy_version: 'taxonomy_v1',
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  trusted_evidence: {
    trusted_evidence_rank: ['story-1'],
    downgraded_sources: [],
    reason_codes: ['SCENE_DETAIL_ELEVATES_RANK'],
    ranking: [
      {
        source_id: 'story-1',
        source_type: 'story_entry',
        reliability: 'high',
        excerpt_length_estimate: 45,
        contains_scene_detail: true,
        reason_trusted: 'CONCRETE_NARRATIVE_WITH_PIVOT',
      },
    ],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'hybrid',
    },
  },

  next_question: null,

  recommendation_viability: {
    decision: 'success',
    reasoning: 'Clear signal present, authorship clean, pattern strong',
    confidence: 'high',
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
  },

  school_context_use: null,

  escalation: {
    escalate: false,
    blocking: false,
    escalation_reason: null,
    reason_codes: [],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
    reason: 'No escalation needed',
  },

  created_at: new Date().toISOString(),
  orchestration_version: '1.0.0',
} as unknown as IntakeIntelligenceObject;

/**
 * F3 — Thin Recoverable Case
 * 
 * Input: Minimal but real, requires one clarifying question.
 * Expected route: reflection → recovery question → updated direction
 * 
 * Use case: Student provides too little detail, but pattern is detectable.
 */
export const FIXTURE_F3_THIN_RECOVERY = {
  intake_session_id: 'fixture-f3-thin-recovery',
  student_user_id: 'test-student-2',
  subject_entity_id: 'test-essay-2',
  
  usable_signal: {
    usable_signal: true,
    signal_strength: 'medium',
    signal_types: ['identity_shift'],
    confidence: 'medium',
    reason_codes: [
      'CLEAR_IDENTITY_SHIFT_PRESENT',
      'AMBIGUOUS_POSSIBLE_SIGNAL',
    ],
    evidence_sources: [
      {
        source_id: 'story-2',
        source_type: 'story_entry',
        excerpt: 'I like sports but I\'m not great at them.',
      },
    ],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  authorship_signal: {
    authorship_signal: 'student_authentic',
    contamination_risk: 'low',
    student_scene_evidence: 'weak',
    reasons: ['PERSONAL_VOICE_PRESENT'],
    evidence_sources: [
      {
        source_id: 'story-2',
        source_type: 'story_entry',
      },
    ],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  narrative_pattern: {
    primary_pattern: 'identity_shift',
    secondary_patterns: [],
    confidence: 'medium',
    reason_codes: [
      'IDENTITY_CLAIM_SHIFT_DETECTED',
      'INSUFFICIENT_EVIDENCE_FOR_PATTERN',
    ],
    supporting_evidence: [
      {
        source_id: 'story-2',
        source_type: 'story_entry',
        excerpt: 'I like sports but I\'m not great',
      },
    ],
    taxonomy_version: 'taxonomy_v1',
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  trusted_evidence: {
    trusted_evidence_rank: ['story-2'],
    downgraded_sources: [],
    reason_codes: ['NO_SOURCES_RANKABLE'],
    ranking: [
      {
        source_id: 'story-2',
        source_type: 'story_entry',
        reliability: 'medium',
        excerpt_length_estimate: 8,
        contains_scene_detail: false,
        reason_trusted: 'AUTHENTIC_BUT_MINIMAL',
      },
    ],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  next_question: {
    question_type: 'scene_detail',
    question_text:
      'Tell me about a specific moment with sports where something surprised you, frustrated you, or made you realize something about yourself.',
    selection_reason: 'fills_scene_detail_gap',
    fallback_if_unanswered:
      'Use the pattern as-is and generate a direction based on identity shift.',
    reason_codes: ['MISSING_SCENE_DETAIL', 'PATTERN_AMBIGUOUS'],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
  },

  recommendation_viability: {
    decision: 'needs_more_input',
    reasoning:
      'Pattern detected but insufficient scene detail. One question will unlock stronger direction.',
    confidence: 'medium',
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
  },

  school_context_use: null,

  escalation: {
    escalate: false,
    blocking: false,
    escalation_reason: null,
    reason_codes: [],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
    reason: 'Recoverable with one question',
  },

  created_at: new Date().toISOString(),
  orchestration_version: '1.0.0',
} as unknown as IntakeIntelligenceObject;

/**
 * F4 — Blocked Case
 * 
 * Input: Insufficient signal, cannot generate reliable direction.
 * Expected route: reflection → blocked state (graceful exit)
 * 
 * Use case: Student provides generic or abstract content.
 */
export const FIXTURE_F4_BLOCKED = {
  intake_session_id: 'fixture-f4-blocked',
  student_user_id: 'test-student-3',
  subject_entity_id: 'test-essay-3',
  
  usable_signal: {
    usable_signal: false,
    signal_strength: 'none',
    signal_types: ['unknown'],
    confidence: 'high',
    reason_codes: [
      'NO_SIGNAL_DETECTED',
    ],
    evidence_sources: [],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  authorship_signal: {
    authorship_signal: 'generic_or_coached',
    contamination_risk: 'high',
    student_scene_evidence: 'absent',
    reasons: ['NO_CONCRETE_LANGUAGE', 'ABSTRACT_VALUES_ONLY'],
    evidence_sources: [],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  narrative_pattern: {
    primary_pattern: 'unknown',
    secondary_patterns: [],
    confidence: 'low',
    reason_codes: [
      'INSUFFICIENT_EVIDENCE_FOR_PATTERN',
    ],
    supporting_evidence: [],
    taxonomy_version: 'taxonomy_v1',
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  trusted_evidence: {
    trusted_evidence_rank: [],
    downgraded_sources: [],
    reason_codes: ['NO_SOURCES_RANKABLE'],
    ranking: [],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'classifier',
    },
  },

  next_question: null,

  recommendation_viability: {
    decision: 'blocked',
    reasoning:
      'No usable signal detected. Input is too generic or abstract to produce reliable direction.',
    confidence: 'high',
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
  },

  school_context_use: null,

  escalation: {
    escalate: true,
    blocking: true,
    escalation_reason: 'no_usable_signal_multiple_attempts',
    reason_codes: ['QUESTION_CAP_NO_SIGNAL'],
    meta: {
      decision_version: '1.0.0',
      taxonomy_version: 'taxonomy_v1',
      made_at: new Date().toISOString(),
      made_by: 'rules',
    },
    reason: 'Insufficient signal for direction generation',
  },

  created_at: new Date().toISOString(),
  orchestration_version: '1.0.0',
} as unknown as IntakeIntelligenceObject;

/**
 * Test helper: Mock POST /api/intake/session to return a fixture
 * 
 * Usage in tests:
 * 
 *   mockIntakeSession(FIXTURE_F1_STRONG_CASE);
 *   // Now fetch('/api/intake/session', ...) will return F1
 */
export function getMockResponses() {
  return {
    F1_STRONG_CASE: FIXTURE_F1_STRONG_CASE,
    F3_THIN_RECOVERY: FIXTURE_F3_THIN_RECOVERY,
    F4_BLOCKED: FIXTURE_F4_BLOCKED,
  };
}
