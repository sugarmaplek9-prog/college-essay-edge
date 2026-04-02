// =============================================================
// src/lib/fm/missingDetailRanker.ts
//
// Ranks which missing narrative detail is most worth asking
// about next, given the current evidence state.
//
// Output drives questionComposer.ts.
// Must never return a target that has already been answered
// or that cannot be inferred from the available case signals.
// =============================================================

import type { IntakeIntelligenceObject, NarrativePattern } from '@/types/intake';
import type { EvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import type { SessionCaseState } from '@/lib/fm/case-state';

// =============================================================
// Target taxonomy
// =============================================================

export type MissingDetailTarget =
  | 'scene_line'         // Specific moment / where / when
  | 'conflict_cause'     // What triggered the conflict or correction
  | 'turning_point'      // The exact moment of realization or shift
  | 'other_person_reaction' // How another person responded
  | 'internal_realization'  // What clicked internally
  | 'repair_action'      // What follow-through action happened
  | 'consequence'        // What changed afterward
  | null;

// =============================================================
// Pattern-specific priority tables
// =============================================================

const PATTERN_TARGET_PRIORITY: Record<NarrativePattern, MissingDetailTarget[]> = {
  self_correction_arc:         ['other_person_reaction', 'conflict_cause', 'internal_realization', 'consequence', 'scene_line'],
  usefulness_vs_intention:     ['scene_line', 'other_person_reaction', 'internal_realization', 'repair_action', 'consequence'],
  identity_shift:              ['turning_point', 'scene_line', 'internal_realization', 'consequence'],
  responsibility_shift:        ['turning_point', 'other_person_reaction', 'consequence', 'internal_realization'],
  failure_reinterpretation:    ['turning_point', 'internal_realization', 'consequence', 'scene_line'],
  conflict_reframe:            ['conflict_cause', 'turning_point', 'other_person_reaction', 'internal_realization'],
  competence_vs_responsibility: ['turning_point', 'internal_realization', 'consequence', 'scene_line'],
  unknown:                     ['scene_line', 'turning_point', 'conflict_cause', 'internal_realization'],
};

// =============================================================
// Gap detection from features + case state
// =============================================================

function isMissing(target: MissingDetailTarget, f: EvidenceFeatures, state: SessionCaseState | null): boolean {
  switch (target) {
    case 'scene_line':
      return f.sceneSpecificityScore < 0.4 || (state ? state.extracted.scenes.length === 0 : true);
    case 'conflict_cause':
      return f.conflictPresent === 0 || f.sceneSpecificityScore < 0.3;
    case 'turning_point':
      return f.turningPointPresent === 0 || (state ? state.extracted.turning_points.length === 0 : true);
    case 'other_person_reaction':
      return f.actorCount <= 1 && f.sceneSpecificityScore < 0.5;
    case 'internal_realization':
      return f.reflectionPresent === 0 || (state ? state.extracted.reflections.length === 0 : true);
    case 'repair_action':
      return f.repairPresent === 0;
    case 'consequence':
      return f.consequencePresent === 0 || (state ? state.extracted.consequences.length === 0 : true);
    default:
      return false;
  }
}

// =============================================================
// Public API
// =============================================================

export function rankMissingDetails(
  intelligence: IntakeIntelligenceObject,
  f: EvidenceFeatures,
  state: SessionCaseState | null
): MissingDetailTarget[] {
  const pattern = intelligence.narrative_pattern.primary_pattern;
  const priorities = PATTERN_TARGET_PRIORITY[pattern];

  return priorities.filter((target) => isMissing(target, f, state));
}

export function getTopMissingDetail(
  intelligence: IntakeIntelligenceObject,
  f: EvidenceFeatures,
  state: SessionCaseState | null,
  alreadyAskedTargets: string[] = []
): MissingDetailTarget {
  const ranked = rankMissingDetails(intelligence, f, state);
  const filtered = ranked.filter((t) => t && !alreadyAskedTargets.includes(t));
  return filtered[0] ?? null;
}
