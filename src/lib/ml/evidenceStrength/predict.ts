// =============================================================
// src/lib/ml/evidenceStrength/predict.ts
//
// Public API for the evidence strength prediction pipeline.
// Call predictEvidenceStrength() from the session route after
// the orchestrator runs. Do not call model/features directly.
//
// Phase 2: replace scoreEvidenceDeterministic with a trained
// classifier while keeping this function signature unchanged.
// =============================================================

import type { IntakeIntelligenceObject } from '@/types/intake';
import type { EvidenceStrengthPrediction } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';
import { buildEvidenceFeatures } from './features';
import { scoreEvidenceDeterministic } from './model';

export interface PredictEvidenceStrengthInput {
  rawInput: string;
  normalizedInput: string;
  intelligence: IntakeIntelligenceObject;
  sessionCaseState?: SessionCaseState | null;
}

/**
 * Runs the full evidence-strength prediction pipeline.
 *
 * Phase 1: deterministic scoring from orchestrator signals + text features.
 * Phase 2 (future): trained classifier with same API contract.
 *
 * Returns EvidenceStrengthPrediction including route, confidence,
 * per-class scores, and a feature summary for logging.
 */
export function predictEvidenceStrength(
  input: PredictEvidenceStrengthInput
): EvidenceStrengthPrediction {
  const features = buildEvidenceFeatures({
    rawInput: input.rawInput,
    normalizedInput: input.normalizedInput,
    intelligence: input.intelligence,
    sessionCaseState: input.sessionCaseState,
  });

  return scoreEvidenceDeterministic(features, input.intelligence);
}

export { buildEvidenceFeatures } from './features';
export type { EvidenceFeatures } from './features';
