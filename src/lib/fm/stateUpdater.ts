// =============================================================
// src/lib/fm/stateUpdater.ts
//
// Updates EvidenceSessionState after new user input or
// after a sharpening question is answered.
//
// Works with EvidenceSessionState (sessionCaseState.ts).
// The existing SessionCaseState (case-state.ts) is updated
// separately through applySharpeningAnswer.
// =============================================================

import {
  type EvidenceSessionState,
  addInputToEvidenceState,
  recordQuestionAsked,
} from '@/lib/fm/sessionCaseState';

// =============================================================
// State update functions
// =============================================================

/**
 * Merges a new answer into the session state.
 * Records the question that was answered so it isn't repeated.
 */
export function applyAnswerToEvidenceState(
  state: EvidenceSessionState,
  answerText: string,
  questionAsked: string,
  questionTarget: string
): EvidenceSessionState {
  const withInput = addInputToEvidenceState(state, answerText, 'question');
  return recordQuestionAsked(withInput, questionAsked, questionTarget);
}

/**
 * Merges a compare-screen interaction into the session state.
 */
export function applyCompareSelectionToState(
  state: EvidenceSessionState,
  selectionText: string
): EvidenceSessionState {
  return addInputToEvidenceState(state, selectionText, 'compare');
}

/**
 * Merges a sharpening-phase answer into the session state.
 */
export function applySharpenAnswerToState(
  state: EvidenceSessionState,
  text: string,
  questionAsked: string,
  questionTarget: string
): EvidenceSessionState {
  const withInput = addInputToEvidenceState(state, text, 'sharpen');
  return recordQuestionAsked(withInput, questionAsked, questionTarget);
}

/**
 * Returns all raw input text from history, joined for
 * downstream re-analysis.
 */
export function buildEvidenceTranscript(state: EvidenceSessionState): string {
  return state.rawInputHistory.map((e: { text: string }) => e.text).join(' ');
}
