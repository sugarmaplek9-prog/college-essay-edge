import type { BlankPageIntakePayload, BlankPagePostAnswerDecision } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';

export interface BlankPageRouteAuditRecord {
  event: 'blank_page_route_audit';
  at: string;
  session_id: string;
  blank_page_mode: string;
  blank_page_trigger_signals: string[];
  question_family_primary: string | null;
  question_family_secondary: string | null;
  selected_template_id: string;
  missing_signal_type: string;
  why_not_ready_for_direction: string;
  blank_page_recovery_depth: number;
  blank_page_recovery_exhausted: boolean;
  post_answer_route: string;
  post_answer_route_reason: string;
  recovered_signal_summary: string;
}

export function buildBlankPageRouteAuditRecord(input: {
  sessionId: string;
  payload: BlankPageIntakePayload;
  decision: BlankPagePostAnswerDecision;
  caseState: SessionCaseState;
  triggerSignals?: string[];
}): BlankPageRouteAuditRecord {
  return {
    event: 'blank_page_route_audit',
    at: new Date().toISOString(),
    session_id: input.sessionId,
    blank_page_mode: input.payload.blank_page_mode,
    blank_page_trigger_signals: input.triggerSignals ?? [],
    question_family_primary: input.payload.question_family_primary,
    question_family_secondary: input.payload.question_family_secondary,
    selected_template_id: input.payload.selected_template_id,
    missing_signal_type: input.payload.missing_signal_type,
    why_not_ready_for_direction: input.payload.why_not_ready_for_direction,
    blank_page_recovery_depth: input.caseState.blank_page_recovery.blank_page_recovery_depth,
    blank_page_recovery_exhausted: input.decision.blank_page_recovery_exhausted,
    post_answer_route: input.decision.post_answer_route,
    post_answer_route_reason: input.decision.post_answer_route_reason,
    recovered_signal_summary: input.decision.recovered_signal_summary.summary_text,
  };
}

export function logBlankPageRouteAudit(record: BlankPageRouteAuditRecord): void {
  console.log(JSON.stringify(record));
}
