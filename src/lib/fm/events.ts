// =============================================================
// src/lib/fm/events.ts
// First-minute experience — instrumentation event helpers
//
// Implements FM-12: all 15 first-minute funnel events.
// Events are fired client-side via the browser Analytics abstraction.
// No PII in any event payload per FM-12 acceptance criteria.
// =============================================================

/** All valid first-minute event names. */
export type FmEventName =
  | 'fm_homepage_view'
  | 'fm_cta_click'
  | 'fm_start_view'
  | 'fm_input_focus'
  | 'fm_input_submit'
  | 'fm_loading_view'
  | 'fm_loading_timeout'
  | 'fm_reflection_view'
  | 'fm_direction_view'
  | 'fm_compare_view'
  | 'fm_compare_select'
  | 'fm_recovery_view'
  | 'fm_recovery_submit'
  | 'fm_blocked_view'
  | 'fm_abandon'
  | 'blank_page_mode_assigned'
  | 'blank_page_question_rendered'
  | 'blank_page_answer_submitted'
  | 'blank_page_to_direction_conversion'
  | 'blank_page_to_second_question'
  | 'blank_page_to_clarification'
  | 'blank_page_to_block'
  | 'blank_page_abandon'
  | 'blank_page_continue';

export interface FmEventPayload {
  /** ISO-8601 timestamp */
  at: string;
  /** Which screen triggered the event */
  screen: string;
  /** Time in ms since first page load (for latency reconstruction) */
  elapsed_ms?: number;
  /** Route the system decided to take (no PII) */
  route?: string;
  /** Product-mode assignment for this event */
  product_mode?: string;
  /** Pattern name — no student data */
  pattern?: string;
  /** Viability decision — no student data */
  viability?: string;
  /** Whether this was a reduced-scope result */
  reduced_scope?: boolean;
  /** Number of words in input (count only, no content) */
  input_word_count?: number;
  /** Blank-page lane mode, when relevant */
  blank_page_mode?: string;
  /** Missing signal category targeted by blank-page recovery */
  missing_signal_type?: string;
  /** UI next-step category for blank-page lane */
  next_step_type?: string;
  /** Post-answer route for blank-page lane */
  post_answer_route?: string;
  /** Recovery depth (bounded integer) */
  blank_page_recovery_depth?: number;
  /** Whether blank-page recovery depth has been exhausted */
  blank_page_recovery_exhausted?: boolean;
  /** Question family metadata for prompt diagnostics */
  question_family_primary?: string | null;
  question_family_secondary?: string | null;
  /** Selected template identifier for prompt diagnostics */
  selected_template_id?: string;
  /** Source classification used in eval/reporting contexts */
  source_type?: string;
}

/**
 * Build an event payload with the current timestamp and elapsed time.
 * Call this at the point of the event, not asynchronously.
 */
export function buildEvent(
  name: FmEventName,
  screen: string,
  extra: Omit<FmEventPayload, 'at' | 'screen'> = {},
): { name: FmEventName; payload: FmEventPayload } {
  return {
    name,
    payload: {
      at: new Date().toISOString(),
      screen,
      ...extra,
    },
  };
}

/**
 * Fire an event via the browser's analytics abstraction.
 * Currently writes to console in development; replace with
 * the production analytics call (e.g. Segment, PostHog) here
 * when FM-12 wires to a real sink.
 */
export function fireFmEvent(name: FmEventName, payload: FmEventPayload): void {
  if (typeof window === 'undefined') return;
  // Safety check: never fire if payload accidentally contains PII fields.
  const safePayload = sanitizePayload(payload);
  if (process.env.NODE_ENV === 'development') {
    console.log(`[fm_event] ${name}`, safePayload);
  }
  // TODO FM-12: wire to production analytics sink here
  // analytics.track(name, safePayload);
}

const PII_KEYS = ['email', 'name', 'text', 'content', 'story', 'draft', 'student_id', 'user_id'];

function sanitizePayload(payload: FmEventPayload): FmEventPayload {
  const safe = { ...payload };
  for (const key of PII_KEYS) {
    if (key in safe) {
      delete (safe as Record<string, unknown>)[key];
    }
  }
  return safe;
}
