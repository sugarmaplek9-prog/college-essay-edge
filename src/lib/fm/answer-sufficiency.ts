const CONCRETE_SIGNAL_PATTERNS = [
  /\b(said|told|asked|yelled|emailed|texted|called|wrote)\b/i,
  /\b(because|so that|instead of|when)\b/i,
  /\b(room|office|classroom|practice|hospital|kitchen|hallway|field|desk|car|home)\b/i,
  /\b(decided|chose|went|came|returned|apologized|fixed|changed|stopped|started)\b/i,
  /\b(argument|fight|conflict|mistake|deadline|shift|exam|practice|conversation)\b/i,
];

const WEAK_ANSWER_PATTERNS = [
  /^i\s+(had|have)\s+time\s+to\s+reflect[.?!]?$/i,
  /^i\s+understood\s+it\s+better[.?!]?$/i,
  /^it\s+made\s+me\s+think[.?!]?$/i,
  /^i\s+grew\s+from\s+it[.?!]?$/i,
  /^i\s+learned\s+a\s+lot[.?!]?$/i,
  /^it\s+changed\s+me[.?!]?$/i,
  /^i\s+understood\s+it\s+better(?:\s+after\s+that)?[.?!]?$/i,
];

export interface AnswerSufficiencyResult {
  sufficient: boolean;
  reasons: string[];
}

export function evaluateClarificationAnswer(answer: string): AnswerSufficiencyResult {
  const normalized = answer.trim().replace(/\s+/g, ' ');
  const reasons: string[] = [];

  if (normalized.length < 20) {
    reasons.push('too_short');
  }

  if (WEAK_ANSWER_PATTERNS.some((pattern) => pattern.test(normalized))) {
    reasons.push('generic_summary');
  }

  const concreteSignals = CONCRETE_SIGNAL_PATTERNS.filter((pattern) => pattern.test(normalized)).length;
  if (concreteSignals === 0) {
    reasons.push('missing_concrete_detail');
  }

  return {
    sufficient: reasons.length === 0,
    reasons,
  };
}
