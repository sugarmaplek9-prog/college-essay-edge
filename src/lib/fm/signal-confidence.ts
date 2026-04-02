import type { SignalStrength } from '@/types/intake';

export type PersonalizationLevel = 'high_personalization' | 'fallback_scaffold';

/**
 * Determine whether to show personalized model-driven content
 * or fall back to generic scaffolding based on signal strength and confidence.
 */
export function decidePersonalizationLevel(signalStrength: SignalStrength): PersonalizationLevel {
  // High and medium signals deserve full personalization
  if (signalStrength === 'high' || signalStrength === 'medium') {
    return 'high_personalization';
  }
  // Low or no signal → use safe scaffolding
  return 'fallback_scaffold';
}

/**
 * Check if we should render personalized content
 */
export function shouldPersonalize(signalStrength: SignalStrength): boolean {
  return decidePersonalizationLevel(signalStrength) === 'high_personalization';
}
