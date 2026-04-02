// =============================================================
// src/lib/fm/outputQualityGuard.ts
//
// Full output-quality guard for all user-facing premium text.
// Extends the lighter normalizeRenderText in output-quality.ts
// with pattern-based failure detection and auto-downgrade logic.
//
// Before rendering ANY premium text, run it through
// guardOutputText(). If it fails, use the fallback or
// downgrade the product_mode.
// =============================================================

import type { ProductMode } from '@/types/intake';

// =============================================================
// Failure mode enum
// =============================================================

export type OutputQualityFailure =
  | 'malformed_punctuation'
  | 'repeated_punctuation'
  | 'fragment_concatenation'
  | 'lowercase_i'
  | 'abstract_label'
  | 'grammar_corruption'
  | 'too_short'
  | null;

// =============================================================
// Banned abstract labels (§14)
// =============================================================

const BANNED_ABSTRACT_LABELS = [
  /\bthe thread worth following\b/i,
  /\bthe correction moment\b/i,
  /\bthe shift in how you saw yourself\b/i,
  /\bthe moment you changed the role\b/i,
  /\bwhat the failure revealed\b/i,
  /\bwhat you understood differently\b/i,
  /\bthe gap between what you meant\b/i,
  /\bbeyond being good at it\b/i,
];

// =============================================================
// Detection functions
// =============================================================

function detectMalformedPunctuation(text: string): boolean {
  // Double spaces after sentence-end
  if (/\.{2,}(?!\.)/.test(text)) return true;
  // Space before punctuation
  if (/\s[,;:!?]/.test(text)) return true;
  return false;
}

function detectRepeatedPunctuation(text: string): boolean {
  return /([!?])\1+/.test(text) || /,{2,}/.test(text);
}

function detectFragmentConcatenation(text: string): boolean {
  // Multiple consecutive short words typical of template-join artifacts
  return /\b\w{1,2}\s+\w{1,2}\s+\w{1,2}\s+\w{1,2}\b/.test(text) && text.length < 30;
}

function detectLowercaseI(text: string): boolean {
  return /(?<![a-z]) i (?![a-z])/i.test(text) && / i /.test(text);
}

function detectAbstractLabel(text: string): boolean {
  return BANNED_ABSTRACT_LABELS.some((pattern) => pattern.test(text));
}

function detectGrammarCorruption(text: string): boolean {
  // Detect obvious assembly artifacts
  if (/\bundefined\b/.test(text)) return true;
  if (/\bnull\b/.test(text)) return true;
  if (/\[object/.test(text)) return true;
  return false;
}

// =============================================================
// Quality check
// =============================================================

export function checkOutputQuality(text: string): OutputQualityFailure {
  if (!text || text.trim().length < 10) return 'too_short';
  if (detectGrammarCorruption(text)) return 'grammar_corruption';
  if (detectAbstractLabel(text)) return 'abstract_label';
  if (detectMalformedPunctuation(text)) return 'malformed_punctuation';
  if (detectRepeatedPunctuation(text)) return 'repeated_punctuation';
  if (detectFragmentConcatenation(text)) return 'fragment_concatenation';
  if (detectLowercaseI(text)) return 'lowercase_i';
  return null;
}

// =============================================================
// Guard function
// =============================================================

export interface GuardResult {
  text: string;
  passed: boolean;
  failure: OutputQualityFailure;
  /** If non-null, caller should downgrade to this mode */
  suggestedDowngrade: ProductMode | null;
}

/**
 * Main guard. Pass user-facing text through this before rendering.
 *
 * If the text fails:
 * - Returns the fallback text
 * - Sets passed=false and indicates the failure type
 * - Optionally suggests a mode downgrade
 *
 * Usage:
 *   const { text, passed } = guardOutputText(content.title, 'Strongest direction', currentMode);
 */
export function guardOutputText(
  text: string,
  fallback: string,
  currentMode: ProductMode = 'direction_full'
): GuardResult {
  const failure = checkOutputQuality(text);

  if (failure === null) {
    return { text, passed: true, failure: null, suggestedDowngrade: null };
  }

  // Determine if this failure warrants a mode downgrade
  let suggestedDowngrade: ProductMode | null = null;

  if (failure === 'grammar_corruption' || failure === 'abstract_label') {
    // Critical failures — downgrade from full to light or clarification
    if (currentMode === 'direction_full') suggestedDowngrade = 'direction_light';
    else if (currentMode === 'direction_light') suggestedDowngrade = 'clarification';
  }

  return {
    text: fallback,
    passed: false,
    failure,
    suggestedDowngrade,
  };
}

/**
 * Batch-guards a record of string values. Returns the record with
 * any failed values replaced by their fallbacks.
 */
export function guardOutputRecord<K extends string>(
  record: Record<K, string>,
  fallbacks: Partial<Record<K, string>>,
  currentMode: ProductMode = 'direction_full'
): { guarded: Record<K, string>; anyFailed: boolean; suggestedDowngrade: ProductMode | null } {
  const guarded = {} as Record<K, string>;
  let anyFailed = false;
  let worstDowngrade: ProductMode | null = null;

  for (const key in record) {
    const result = guardOutputText(record[key], fallbacks[key] ?? record[key], currentMode);
    guarded[key] = result.text;
    if (!result.passed) {
      anyFailed = true;
      if (result.suggestedDowngrade) {
        worstDowngrade = result.suggestedDowngrade;
      }
    }
  }

  return { guarded, anyFailed, suggestedDowngrade: worstDowngrade };
}
