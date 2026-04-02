// =============================================================
// src/lib/fm/routeByEvidence.ts
//
// Maps an EvidenceStrengthPrediction to a concrete product
// routing decision, including the next URL path.
//
// Frontend must use product_mode as the single source of truth.
// Do not infer routing from viability flags after this layer.
// =============================================================

import type { ProductMode } from '@/types/intake';

export interface EvidenceRoute {
  mode: ProductMode;
  /** Next.js path to push/replace to */
  path: string;
  /** Human-readable reason for the route decision (logging) */
  reason: string;
}

/**
 * Maps product_mode to the canonical frontend route.
 *
 * direction_full → /start/reflecting (then /start/direction)
 * direction_light → /start/reflecting  (lighter payload already in state)
 * clarification → /start/question
 * blocked → /start/blocked
 */
export function getRouteForProductMode(mode: ProductMode): EvidenceRoute {
  switch (mode) {
    case 'direction_full':
      return {
        mode,
        path: '/start/reflecting',
        reason: 'Strong evidence — full premium experience unlocked.',
      };

    case 'direction_light':
      return {
        mode,
        path: '/start/reflecting',
        reason: 'Probable pattern — provisional direction unlocked.',
      };

    case 'clarification':
      return {
        mode,
        path: '/start/question',
        reason: 'Possible story exists but key detail still missing.',
      };

    case 'blocked':
      return {
        mode,
        path: '/start/blocked',
        reason: 'Insufficient signal to produce honest guidance.',
      };

    default:
      return { mode: 'blocked' as ProductMode, path: '/start/blocked', reason: 'Unknown mode.' };
  }
}

/**
 * Returns true if this mode allows any direction content to be shown.
 */
export function canShowDirection(mode: ProductMode): boolean {
  return mode === 'direction_full' || mode === 'direction_light';
}

/**
 * Returns true if full premium direction content should be rendered.
 */
export function shouldShowFullDirection(mode: ProductMode): boolean {
  return mode === 'direction_full';
}

/**
 * Returns true if the clarification screen should be shown.
 */
export function shouldShowClarification(mode: ProductMode): boolean {
  return mode === 'clarification';
}
