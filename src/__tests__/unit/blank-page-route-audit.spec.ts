import { describe, expect, it } from 'vitest';
import { buildBlankPageRouteAuditRecord } from '@/lib/fm/blankPageRouteAudit';
import type { BlankPageIntakePayload, BlankPagePostAnswerDecision } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';

const payload: BlankPageIntakePayload = {
  product_mode: 'blank_page_intake',
  blank_page_mode: 'blank_page_discovery',
  missing_signal_type: 'missing_topic_candidate',
  why_not_ready_for_direction: 'No concrete event yet.',
  next_step_type: 'answer_primary_question',
  recovery_question_primary: 'What happened in one specific moment?',
  recovery_question_secondary: null,
  reassurance_copy: 'Start small.',
  example_answer_shape: 'One sentence on event, one on what changed.',
  what_good_signal_would_look_like: 'A concrete event and your response.',
  topic_candidate: null,
  recovery_confidence: 'medium',
  question_family_primary: 'moment_question',
  question_family_secondary: null,
  selected_template_id: 'bp_template_01',
};

const decision: BlankPagePostAnswerDecision = {
  post_answer_route: 'direction_light',
  post_answer_route_reason: 'Concrete shift is now visible.',
  blank_page_recovery_depth: 2,
  blank_page_recovery_exhausted: false,
  recovered_signal_summary: {
    has_concrete_moment: true,
    has_hinge_or_shift: true,
    has_lived_event_anchor: true,
    has_personal_center: true,
    has_tension_or_responsibility: true,
    coherent_enough_for_progression: true,
    summary_text: 'Clear shift and ownership are now present.',
  },
};

const caseState: SessionCaseState = {
  version: 'fm_case_state_v1',
  session_id: 'session_abc',
  narrative_pattern: 'unknown',
  viability: 'needs_more_input',
  raw_inputs: [],
  extracted: {
    actors: [],
    scenes: [],
    turning_points: [],
    consequences: [],
    reflections: [],
  },
  missing_details: [],
  prior_questions_asked: [],
  current_question: null,
  blank_page_recovery: {
    blank_page_recovery_depth: 2,
    blank_page_recovery_exhausted: false,
    blank_page_previous_mode: null,
    blank_page_previous_question_family: null,
    blank_page_previous_route_after_answer: null,
    post_answer_route: 'direction_light',
    post_answer_route_reason: 'Concrete shift is now visible.',
    recovered_signal_summary: 'Clear shift and ownership are now present.',
    blank_page_answer_history: [],
  },
};

describe('blank-page route audit record', () => {
  it('builds a complete debug record for route decisions', () => {
    const record = buildBlankPageRouteAuditRecord({
      sessionId: 'session_abc',
      payload,
      decision,
      caseState,
      triggerSignals: ['blank_page_language'],
    });

    expect(record.event).toBe('blank_page_route_audit');
    expect(record.blank_page_mode).toBe('blank_page_discovery');
    expect(record.post_answer_route).toBe('direction_light');
    expect(record.blank_page_recovery_depth).toBe(2);
    expect(record.blank_page_trigger_signals).toEqual(['blank_page_language']);
  });
});
