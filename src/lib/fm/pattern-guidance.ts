import type { NarrativePattern } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';
import {
  getDominantScene,
  getDominantTurningPoint,
  getDominantActor,
} from '@/lib/fm/case-state';

/**
 * Pattern-specific direction guidance templates.
 * When signal strength is high/medium, show these instead of generic scaffolding.
 * Each pattern gets a tailored opening strategy that reflects the narrative core.
 */

function trimSnippet(text: string): string {
  const value = text.trim();
  if (!value) return '';
  return value.length > 88 ? `${value.slice(0, 85).trim()}…` : value;
}

export interface PatternGuidance {
  opening_strategy: string;
  key_principle: string;
  first_move: string;
  avoidance_warning: string;
}

function getUsefulness_vs_IntentionGuidance(caseState: SessionCaseState | null): PatternGuidance {
  const actor = caseState ? getDominantActor(caseState) : null;
  return {
    opening_strategy: actor
      ? `Start by showing what ${actor} actually needed, not what you thought they needed.`
      : 'Start by showing what was actually needed versus what you intended to provide.',
    key_principle: 'The gap between good intent and real need.',
    first_move: 'Open with a specific moment where you learned your intention wasn\'t enough.',
    avoidance_warning: 'Do not open with the lesson. Open with the moment you realized the mismatch.',
  };
}

function getSelf_Correction_ArcGuidance(caseState: SessionCaseState | null): PatternGuidance {
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  return {
    opening_strategy: turning
      ? `Start inside "${trimSnippet(turning)}" so the reader feels the moment your standard changed.`
      : 'Start inside the correction moment so the reader experiences it, not just hears about it.',
    key_principle: 'The correction is the pivot, not the setup.',
    first_move: 'Open with the mistake or assumption, then immediately show what changed it.',
    avoidance_warning: 'Do not spend the opening explaining the old way. Show the shift itself.',
  };
}

function getResponsibility_ShiftGuidance(caseState: SessionCaseState | null): PatternGuidance {
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  return {
    opening_strategy: turning
      ? `Start at "${trimSnippet(turning)}" where responsibility became visible and personal.`
      : 'Start when responsibility stopped being a title and became a real choice you made.',
    key_principle: 'From role to real choice.',
    first_move: 'Open with a specific choice that showed what responsibility actually meant to you.',
    avoidance_warning: 'Do not use leadership language. Show the quiet moment of decision.',
  };
}

function getConflict_ReframeGuidance(caseState: SessionCaseState | null): PatternGuidance {
  return {
    opening_strategy: 'Start by showing the conflict as you saw it in that moment, not how you understand it now.',
    key_principle: 'The shift from defending to understanding.',
    first_move: 'Open with what the conflict taught you—show the learning, not the dispute.',
    avoidance_warning: 'Do not open by explaining who was right. Open with what you realized.',
  };
}

function getFailure_ReinterpretationGuidance(caseState: SessionCaseState | null): PatternGuidance {
  return {
    opening_strategy: 'Start with what you chose to do right after the failure, not the failure itself.',
    key_principle: 'The direction is the choice after, not the setback.',
    first_move: 'Open with a specific action you took that showed what the failure changed.',
    avoidance_warning: 'Do not dwell on the setback. Move quickly to what you did with it.',
  };
}

function getIdentity_ShiftGuidance(caseState: SessionCaseState | null): PatternGuidance {
  return {
    opening_strategy: 'Start with a moment that shows who you became, not just what you did.',
    key_principle: 'The behavior changed because you changed.',
    first_move: 'Open with a specific action that would only make sense from your new perspective.',
    avoidance_warning: 'Do not open with "I used to… now I…" Tell the moment instead.',
  };
}

function getCompetence_vs_ResponsibilityGuidance(caseState: SessionCaseState | null): PatternGuidance {
  return {
    opening_strategy: 'Start with a moment where you had the skill but still had to choose what to do with it.',
    key_principle: 'Ability is not the same as judgment.',
    first_move: 'Open with a specific choice that showed ability alone wasn\'t enough.',
    avoidance_warning: 'Do not open by listing skills. Open by showing a choice that required judgment.',
  };
}

export function getPatternGuidance(
  pattern: NarrativePattern,
  caseState: SessionCaseState | null
): PatternGuidance {
  switch (pattern) {
    case 'usefulness_vs_intention':
      return getUsefulness_vs_IntentionGuidance(caseState);
    case 'self_correction_arc':
      return getSelf_Correction_ArcGuidance(caseState);
    case 'responsibility_shift':
      return getResponsibility_ShiftGuidance(caseState);
    case 'conflict_reframe':
      return getConflict_ReframeGuidance(caseState);
    case 'failure_reinterpretation':
      return getFailure_ReinterpretationGuidance(caseState);
    case 'identity_shift':
      return getIdentity_ShiftGuidance(caseState);
    case 'competence_vs_responsibility':
      return getCompetence_vs_ResponsibilityGuidance(caseState);
    default:
      return {
        opening_strategy: 'Start with a specific, concrete moment from your story.',
        key_principle: 'Real moments beat generic lessons.',
        first_move: 'Open with what you were doing and what changed.',
        avoidance_warning: 'Do not open with explanation. Show the moment first.',
      };
  }
}
