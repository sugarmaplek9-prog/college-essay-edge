// =============================================================
// src/lib/fm/sessionCaseState.ts
//
// Rich evidence session state for the governance layer.
// Stored in sessionStorage under FM_EVIDENCE_SESSION_KEY.
//
// This is the richer state model used by the evidence routing
// layer. The existing SessionCaseState in case-state.ts
// remains for backward compat with question/direction pages.
// =============================================================

export const FM_EVIDENCE_SESSION_KEY = 'fm_evidence_session';

export interface EvidenceSessionState {
  sessionId: string;
  rawInputHistory: Array<{
    step: 'start' | 'question' | 'compare' | 'sharpen';
    text: string;
    timestamp: string;
  }>;
  inferredNarrative: {
    primaryPattern: string | null;
    strongestAngle: string | null;
    weakerAngle: string | null;
  };
  evidenceModel: {
    actors: string[];
    scenes: string[];
    conflictMoments: string[];
    turningPoints: string[];
    consequences: string[];
    reflections: string[];
    missingHighValueDetails: string[];
  };
  interactionMemory: {
    priorSharpeningQuestions: string[];
    priorQuestionTargets: string[];
    acceptedAngle: string | null;
  };
}

export function createEvidenceSessionState(
  sessionId: string,
  rawInput: string,
  intelligence: {
    narrative_pattern: { primary_pattern: string | null };
  }
): EvidenceSessionState {
  return {
    sessionId,
    rawInputHistory: [
      {
        step: 'start',
        text: rawInput,
        timestamp: new Date().toISOString(),
      },
    ],
    inferredNarrative: {
      primaryPattern: intelligence.narrative_pattern.primary_pattern,
      strongestAngle: null,
      weakerAngle: null,
    },
    evidenceModel: {
      actors: [],
      scenes: [],
      conflictMoments: [],
      turningPoints: [],
      consequences: [],
      reflections: [],
      missingHighValueDetails: [],
    },
    interactionMemory: {
      priorSharpeningQuestions: [],
      priorQuestionTargets: [],
      acceptedAngle: null,
    },
  };
}

export function addInputToEvidenceState(
  state: EvidenceSessionState,
  text: string,
  step: EvidenceSessionState['rawInputHistory'][number]['step']
): EvidenceSessionState {
  return {
    ...state,
    rawInputHistory: [
      ...state.rawInputHistory,
      { step, text, timestamp: new Date().toISOString() },
    ],
  };
}

export function recordQuestionAsked(
  state: EvidenceSessionState,
  questionText: string,
  questionTarget: string
): EvidenceSessionState {
  return {
    ...state,
    interactionMemory: {
      ...state.interactionMemory,
      priorSharpeningQuestions: [
        ...state.interactionMemory.priorSharpeningQuestions,
        questionText,
      ],
      priorQuestionTargets: [
        ...state.interactionMemory.priorQuestionTargets,
        questionTarget,
      ],
    },
  };
}

export function acceptAngle(
  state: EvidenceSessionState,
  angle: string
): EvidenceSessionState {
  return {
    ...state,
    inferredNarrative: {
      ...state.inferredNarrative,
      strongestAngle: angle,
    },
    interactionMemory: {
      ...state.interactionMemory,
      acceptedAngle: angle,
    },
  };
}
