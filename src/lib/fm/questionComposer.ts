// =============================================================
// src/lib/fm/questionComposer.ts
//
// Generates a single, case-specific sharpening question
// from a MissingDetailTarget and actual case evidence.
//
// Rules:
//   - Reference actual case elements (actor, scene fragment, etc.)
//   - Ask about one concrete moment only
//   - Avoid abstract language ("self-understanding", "growth")
//   - Understandable to a 16–18 year old
//   - Must not repeat a previously asked question (enforced upstream
//     via questionDeduper.ts before calling this)
// =============================================================

import type { IntakeIntelligenceObject } from '@/types/intake';
import type { EvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import type { SessionCaseState } from '@/lib/fm/case-state';
import type { MissingDetailTarget } from '@/lib/fm/missingDetailRanker';
import {
  getDominantActor,
  getDominantScene,
  getDominantTurningPoint,
  getDominantConsequence,
} from '@/lib/fm/case-state';

// =============================================================
// Helpers
// =============================================================

function trimSnippet(text: string): string {
  return text.length > 80 ? `${text.slice(0, 77).trim()}…` : text;
}

function getFirstActor(intelligence: IntakeIntelligenceObject, state: SessionCaseState | null): string | null {
  if (state) {
    const actor = getDominantActor(state);
    if (actor && !/^(I|a|an|the)$/i.test(actor.trim())) return actor;
  }
  const excerpt = intelligence.narrative_pattern.supporting_evidence[0]?.excerpt ?? '';
  const m = excerpt.match(/\b(my\s+(?:manager|coach|teacher|nurse|friend|teammate|parent|mom|mother|dad|father|boss|captain|mentor))\b/i);
  return m?.[1] ?? null;
}

function getSceneFragment(intelligence: IntakeIntelligenceObject | null, state: SessionCaseState | null): string | null {
  if (state) return getDominantScene(state);
  return intelligence?.narrative_pattern.supporting_evidence[0]?.excerpt ?? null;
}

function getTurningFragment(state: SessionCaseState | null): string | null {
  if (!state) return null;
  return getDominantTurningPoint(state);
}

function getConsequenceFragment(state: SessionCaseState | null): string | null {
  if (!state) return null;
  return getDominantConsequence(state);
}

// =============================================================
// Question builders per target
// =============================================================

function buildSceneLineQuestion(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const actor = getFirstActor(intelligence, state);
  const scene = getSceneFragment(intelligence, state);

  if (actor && scene) {
    return `In that moment with ${actor} — "${trimSnippet(scene)}" — where exactly were you, what happened first, and what did you notice right away?`;
  }
  if (actor) {
    return `What exactly happened in the moment with ${actor}? Where were you, what was said or done first, and what did you notice right away?`;
  }
  if (scene) {
    return `Walk me back to the start of that moment: "${trimSnippet(scene)}" — where were you, who else was there, and what happened first?`;
  }
  return `Start with the most concrete moment in this story. Where were you, who else was there, and what happened in the first thirty seconds?`;
}

function buildConflictCauseQuestion(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const actor = getFirstActor(intelligence, state);
  const scene = getSceneFragment(intelligence, state);

  if (actor && scene) {
    return `What specifically set that off with ${actor}? Was there a comment, a decision, or something you did that started it?`;
  }
  if (actor) {
    return `What did ${actor} say or do that made the tension start? What was the trigger?`;
  }
  if (scene) {
    return `In "${trimSnippet(scene)}" — what caused that? Was there a specific moment or comment that started everything?`;
  }
  return `What caused the tension? Was there a specific comment, decision, or moment that triggered it?`;
}

function buildTurningPointQuestion(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const actor = getFirstActor(intelligence, state);
  const scene = getSceneFragment(intelligence, state);

  if (actor && scene) {
    return `When exactly did you realize "${trimSnippet(scene)}" meant something more than you originally thought? What did ${actor} say or do in that moment?`;
  }
  if (scene) {
    return `When did "${trimSnippet(scene)}" stop feeling like just an experience and start feeling like something that changed you?`;
  }
  if (actor) {
    return `What did ${actor} say or do that made you see things differently? What was the exact moment you understood something new?`;
  }
  return `What was the exact moment this stopped being a normal experience and became something that changed how you think? Describe it without explaining what it means yet.`;
}

function buildOtherPersonReactionQuestion(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const actor = getFirstActor(intelligence, state);
  const turning = getTurningFragment(state);

  if (actor && turning) {
    return `After "${trimSnippet(turning)}" — what did ${actor} actually say or do? What was their reaction?`;
  }
  if (actor) {
    return `What did ${actor} actually say or do in that moment? What was their exact reaction?`;
  }
  return `How did the other person respond in that moment? What did they say or do that you still remember clearly?`;
}

function buildInternalRealizationQuestion(
  _intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const turning = getTurningFragment(state);
  const scene = getSceneFragment(null, state);

  if (turning) {
    return `After "${trimSnippet(turning)}" — what clicked? What did you understand in that moment that you had not seen before?`;
  }
  if (scene) {
    return `In "${trimSnippet(scene)}" — when did something shift inside you? What were you thinking right at that moment, before you explained it to anyone?`;
  }
  return `What clicked in that moment? Not what you learned generally — what did you realize right then that you had not seen before?`;
}

function buildRepairActionQuestion(
  _intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const turning = getTurningFragment(state);

  if (turning) {
    return `After "${trimSnippet(turning)}" — what did you do differently the very next time? What was the first thing you changed?`;
  }
  return `What did you do after that moment that shows the change was real? What was the first thing you actually did differently?`;
}

function buildConsequenceQuestion(
  _intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): string {
  const turning = getTurningFragment(state);

  if (turning) {
    return `After "${trimSnippet(turning)}" — what is one concrete thing you did differently because of it? Something someone could see, not just feel?`;
  }
  return `What changed in what you did next? Give me one specific, visible thing that proves this moment mattered beyond the moment itself.`;
}

// =============================================================
// Public API
// =============================================================

export function generateSharpeningQuestion(input: {
  intelligence: IntakeIntelligenceObject;
  features: EvidenceFeatures;
  caseState: SessionCaseState | null;
  target: MissingDetailTarget;
}): string | null {
  const { intelligence, caseState, target } = input;

  switch (target) {
    case 'scene_line':
      return buildSceneLineQuestion(intelligence, caseState);
    case 'conflict_cause':
      return buildConflictCauseQuestion(intelligence, caseState);
    case 'turning_point':
      return buildTurningPointQuestion(intelligence, caseState);
    case 'other_person_reaction':
      return buildOtherPersonReactionQuestion(intelligence, caseState);
    case 'internal_realization':
      return buildInternalRealizationQuestion(intelligence, caseState);
    case 'repair_action':
      return buildRepairActionQuestion(intelligence, caseState);
    case 'consequence':
      return buildConsequenceQuestion(intelligence, caseState);
    default:
      return null;
  }
}
