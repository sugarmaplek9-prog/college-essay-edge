// =============================================================
// src/lib/fm/buildFullDirectionPayload.ts
//
// Thin wrapper around deriveDirectionContent for the
// direction_full product mode.
//
// Enforces that direction_full is ONLY assembled when the
// evidence is strong enough. Caller (session route) is
// responsible for only calling this after evidence model
// confirms direction_full.
// =============================================================

import type { IntakeIntelligenceObject } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';
import type { DirectionContent } from '@/lib/fm/direction';

/**
 * Returns the full premium DirectionContent for direction_full mode.
 *
 * Do not call this unless product_mode === 'direction_full'.
 * The session route enforces this; the frontend MUST also
 * guard based on product_mode before rendering any of this.
 */
export function buildFullDirectionPayload(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): DirectionContent {
  return deriveDirectionContent(intelligence, state);
}
