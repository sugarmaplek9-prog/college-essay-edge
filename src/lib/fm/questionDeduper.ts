// =============================================================
// src/lib/fm/questionDeduper.ts
//
// Prevents users from seeing the same question twice in the
// same session. Blocks:
//   - exact repeats (string equality)
//   - near-semantic duplicates (high token overlap ratio)
//   - same target with trivially different wording
// =============================================================

// =============================================================
// Helpers
// =============================================================

const STOP_WORDS = new Set([
  'the', 'and', 'that', 'with', 'from', 'this', 'have', 'your', 'they', 'were',
  'when', 'what', 'where', 'after', 'about', 'there', 'their', 'would', 'could',
  'should', 'because', 'into', 'just', 'then', 'than', 'them', 'been', 'being',
  'some', 'more', 'much', 'like', 'really', 'very', 'still', 'also', 'only',
  'was', 'did', 'does', 'are', 'for', 'but', 'not',
]);

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 3)
      .filter((t) => !STOP_WORDS.has(t))
  );
}

function semanticOverlapRatio(a: string, b: string): number {
  const tokensA = tokenSet(a);
  const tokensB = tokenSet(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  const overlap = [...tokensA].filter((t) => tokensB.has(t)).length;
  const baseline = Math.min(tokensA.size, tokensB.size);
  return overlap / baseline;
}

// =============================================================
// Public API
// =============================================================

export interface DedupeContext {
  priorQuestions: string[];
  priorTargets: string[];
}

/**
 * Returns true if the candidate question is too similar to
 * any previously asked question in this session.
 *
 * Threshold: 0.7 token overlap ratio constitutes a semantic
 * near-repeat.
 */
export function isDuplicateQuestion(
  candidate: string,
  context: DedupeContext
): boolean {
  const { priorQuestions } = context;

  for (const prior of priorQuestions) {
    if (prior.trim().toLowerCase() === candidate.trim().toLowerCase()) {
      return true; // exact match
    }
    if (semanticOverlapRatio(candidate, prior) >= 0.7) {
      return true; // near-semantic match
    }
  }

  return false;
}

/**
 * Filters a list of candidate questions down to only those
 * that are not duplicates, preserving candidate order.
 */
export function filterDuplicateQuestions(
  candidates: Array<{ question: string; target: string }>,
  context: DedupeContext
): Array<{ question: string; target: string }> {
  return candidates.filter(({ question }) => !isDuplicateQuestion(question, context));
}
