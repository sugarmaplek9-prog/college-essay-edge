// =============================================================
// src/lib/fm/observations.ts
// First-minute experience — observation derivation
//
// Implements §1 of FIRST_MINUTE_OUTPUT_PRESENTATION_RULES_V1.md
// Consumes IntakeIntelligenceObject; returns 2–3 plain one-sentence
// observations. No labeled sections. No interpretive mini-analysis.
// Never exposes internal fields to the caller.
// =============================================================

import type { IntakeIntelligenceObject, NarrativePattern } from '@/types/intake';
import {
  getDominantConsequence,
  getDominantReflection,
  getDominantScene,
  getDominantTurningPoint,
  type SessionCaseState,
} from '@/lib/fm/case-state';

// =============================================================
// Public interface
// =============================================================

export interface ObservationResult {
  observations: string[];
  /** When true, the reflection screen should be skipped and direction
   *  rendered with a bridging sentence instead. */
  skip_reflection: boolean;
  bridging_sentence: string | null;
}

// =============================================================
// Base observations: 2 locked sentences per pattern.
// These are shown as-is — no labels, no interpretive structure.
// Sentence 1: what the story is actually about (plain)
// Sentence 2: what makes it stronger than the obvious version (plain)
// =============================================================

const BASE_OBSERVATIONS: Record<NarrativePattern, [string, string]> = {
  self_correction_arc: [
    'The story gets stronger after the feedback moment, not before it.',
    "This isn't a service essay — it's a standards essay.",
  ],
  identity_shift: [
    'This looks less like an activity essay and more like a "who I became" story.',
    "The question isn't what you did — it's what the role changed in you.",
  ],
  responsibility_shift: [
    'What comes through is not what you did, but how the role changed.',
    'The stronger angle is the moment responsibility became something different than you expected.',
  ],
  failure_reinterpretation: [
    "The interesting part isn't the outcome — it's what the failure revealed.",
    'The essay earns its meaning from the reinterpretation, not the obstacle.',
  ],
  conflict_reframe: [
    "This isn't really a conflict story — it's a 'what I understood differently' story.",
    "The reader cares less about who was right and more about what changed in your thinking.",
  ],
  usefulness_vs_intention: [
    "There's a gap between what you intended and what actually happened — that gap is the essay.",
    'The story gets its stakes from the distance between trying to help and actually helping.',
  ],
  competence_vs_responsibility: [
    'The stronger story may not be about being good at this — it may be about what you chose to do with that.',
    'Ability alone is not the essay. What you decided to do with it is.',
  ],
  unknown: [
    "There's something specific in the material that hasn't fully surfaced yet.",
    'The strongest direction will come from the most concrete moment you can describe.',
  ],
};

// =============================================================
// Dynamic third observation: derived from case-state evidence.
// Appended only when a vivid anchor is present.
// =============================================================

function deriveThirdObservation(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string | null {
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const consequence = caseState ? getDominantConsequence(caseState) : null;
  const reflection = caseState ? getDominantReflection(caseState) : null;
  const scene = caseState ? getDominantScene(caseState) : null;

  if (turning && consequence) {
    return `The move from "${trimSnippet(turning)}" into "${trimSnippet(consequence)}" is the clearest anchor so far.`;
  }
  if (turning) {
    return `"${trimSnippet(turning)}" is the detail the rest of the essay should stay close to.`;
  }
  if (scene && !reflection) {
    return `The scene around "${trimSnippet(scene)}" is concrete enough to open with directly.`;
  }
  if (intake.recommendation_viability.decision === 'needs_more_input') {
    return 'One more specific answer would make the direction much sharper.';
  }
  if (intake.authorship_signal.authorship_signal === 'mixed') {
    return "Some of this reads like your voice already — the rest will follow once the angle is locked.";
  }
  return null;
}

// =============================================================
// Public derivation functions
// =============================================================

/** Derives observations from intake alone (no session state). */
export function deriveObservations(intake: IntakeIntelligenceObject): ObservationResult {
  return deriveReflectionContentFromCase(intake, null);
}

export function deriveReflectionContent(intake: IntakeIntelligenceObject): ObservationResult {
  return deriveObservations(intake);
}

/**
 * Primary export used by reflecting/page.tsx.
 * Returns 2–3 plain one-sentence observations plus skip/bridging metadata.
 */
export function deriveReflectionContentFromCase(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): ObservationResult {
  const pattern = intake.narrative_pattern.primary_pattern;
  const [obs1, obs2] = BASE_OBSERVATIONS[pattern];

  const observations: string[] = [obs1, obs2];

  const third = deriveThirdObservation(intake, caseState);
  if (third) observations.push(third);

  const bridging_sentence =
    intake.recommendation_viability.decision !== 'needs_more_input'
      ? 'You already have enough here to move into the strongest direction.'
      : null;

  return {
    observations,
    skip_reflection: false,
    bridging_sentence,
  };
}

function trimSnippet(text: string): string {
  const value = text.trim();
  if (!value) return '';
  return value.length > 90 ? `${value.slice(0, 87).trim()}…` : value;
}
