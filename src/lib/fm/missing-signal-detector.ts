// =============================================================
// src/lib/fm/missing-signal-detector.ts
//
// Determines which single high-value narrative signal is
// missing from the student's story, given what has already
// been extracted.
//
// Uses simple ordered logic. Does not call AI.
// Output drives clarification-question.ts.
// =============================================================

import type { NarrativeSignals } from './narrative-signals';

// =============================================================
// Target taxonomy
// =============================================================

/**
 * The specific story gap we want to close with one question.
 *
 * Ordered roughly by impact on essay quality:
 *   conflict_detail   — know tension exists, don't know what it was about
 *   exact_words       — know something happened, want the specific words/scene
 *   decision_reason   — know a concrete follow-up happened, but not why they chose it
 *   repair_action     — know the realization, no follow-through action described
 *   consequence_detail — know tension but no vivid consequence scene yet
 *   realization       — know consequence exists, no internal shift described
 *   behavior_change   — both present but no evidence of lasting change
 */
export type MissingSignalTarget =
  | 'conflict_detail'
  | 'exact_words'
  | 'decision_reason'
  | 'realization'
  | 'repair_action'
  | 'behavior_change'
  | 'consequence_detail'
  | null;

const FALLBACK_ORDER: Exclude<MissingSignalTarget, null>[] = [
  'conflict_detail',
  'exact_words',
  'decision_reason',
  'repair_action',
  'consequence_detail',
  'realization',
  'behavior_change',
];

// =============================================================
// Helpers
// =============================================================

/** True if the tension sentence names a conflict type but gives no content. */
function tensionIsLabelOnly(tensionEvent: string): boolean {
  const CONFLICT_LABEL = /\b(argument|fight|conflict|confrontation|disagreement|dispute|tension)\b/i;
  if (!CONFLICT_LABEL.test(tensionEvent)) return false;
  // If the sentence also contains "about" / "over" / "because" it has some content
  const HAS_CONTENT = /\b(about|over|because|regarding|concerning|related to)\b/i;
  return !HAS_CONTENT.test(tensionEvent);
}

/** True if there is a vivid scene word in the sentence. */
function hasVividDetail(sentence: string): boolean {
  const VIVID = /\b(said|told|looked|walked|stood|sat|stared|handed|held|wrote|exactly|word\s+for\s+word|room|office|desk|face|eyes|voice|tone|door|chair|table)\b/i;
  return VIVID.test(sentence);
}

// =============================================================
// Public API
// =============================================================

/**
 * Returns the single most important missing signal target.
 *
 * @param signals   Extracted narrative signals from the student's text.
 * @param priorTargets  Targets already used in this session (to avoid repeats).
 */
export function detectMissingSignal(
  signals: NarrativeSignals,
  priorTargets: MissingSignalTarget[] = []
): MissingSignalTarget {
  const candidates: MissingSignalTarget[] = [];

  // ── Priority 1: conflict detail ──────────────────────────────
  // Tension identified but no specifics about what it was actually about
  if (signals.tensionEvent && tensionIsLabelOnly(signals.tensionEvent)) {
    candidates.push('conflict_detail');
  }

  // ── Priority 2: exact words / scene detail ───────────────────
  // Consequence exists but no vivid scene or dialogue captured
  if (signals.consequence && !hasVividDetail(signals.consequence) && !signals.realizationMoment) {
    candidates.push('exact_words');
  }

  // ── Priority 3: decision reason ───────────────────────────────
  // A follow-up action happened, but we do not yet know what made them choose it.
  if (signals.repairAction && !signals.realizationMoment) {
    candidates.push('decision_reason');
  }

  // ── Priority 4: repair action ─────────────────────────────────
  // Realization described but no follow-through action
  if (signals.realizationMoment && !signals.repairAction) {
    candidates.push('repair_action');
  }

  // ── Priority 5: consequence detail ───────────────────────────
  // Tension present but no consequence or realization yet
  if (signals.tensionEvent && !signals.consequence && !signals.realizationMoment) {
    candidates.push('consequence_detail');
  }

  // ── Priority 6: realization ──────────────────────────────────
  // A consequence happened, but we still do not know the thinking shift.
  if (signals.consequence && !signals.repairAction && !signals.realizationMoment) {
    candidates.push('realization');
  }

  // ── Priority 7: behavior change ───────────────────────────────
  // Both realization and repair present but no lasting change evidence
  if (signals.realizationMoment && signals.repairAction && !signals.behaviorChange) {
    candidates.push('behavior_change');
  }

  // ── Default ───────────────────────────────────────────────────
  if (candidates.length === 0) {
    if (signals.tensionEvent) {
      candidates.push('realization');
    } else if (signals.keyEvents.length > 0) {
      candidates.push('conflict_detail');
    } else {
      candidates.push('exact_words');
    }
  }

  // Skip any target already used in this session
  const remaining = candidates.filter((t) => !priorTargets.includes(t));
  if (remaining[0]) return remaining[0];

  // If all current candidates were already used, force progression by
  // selecting the next global target not yet used.
  const nextUnused = FALLBACK_ORDER.find((t) => !priorTargets.includes(t));
  return nextUnused ?? null;
}
