const BANNED_PHRASES = [
  'the strongest direction in your notes',
  'what changed in how you judge yourself',
  'what did this teach you',
  'how did your role change',
  'what did this mean to you',
  'how did this shape you',
  'self-understanding',
  'personal growth',
  'growth journey',
  'resilience journey',
  'admissions readers',
  'essay lives in',
  'turn in meaning',
  'stronger opening wins',
] as const;

const ABSTRACT_BLOAT = [
  'journey',
  'resilience',
  'growth',
  'self-discovery',
  'transformative',
] as const;

export interface OutputValidationResult {
  valid: boolean;
  reasons: string[];
  sanitizedText: string;
}

export function validateRenderableText(text: string): OutputValidationResult {
  const sanitizedText = normalizeText(text);
  const reasons: string[] = [];
  const lower = sanitizedText.toLowerCase();

  if (!sanitizedText) {
    reasons.push('empty_text');
  }

  if (/["']{3,}/.test(sanitizedText)) {
    reasons.push('malformed_quote_run');
  }

  if (/[a-z][A-Z]/.test(sanitizedText)) {
    reasons.push('concatenated_words');
  }

  if (/[!?]{2,}|\.{4,}/.test(sanitizedText)) {
    reasons.push('malformed_punctuation');
  }

  if (/\b(?:ai|model|system|confidence score|pattern identified|analysis suggests)\b/i.test(sanitizedText)) {
    reasons.push('meta_ai_language');
  }

  if (BANNED_PHRASES.some((phrase) => lower.includes(phrase))) {
    reasons.push('banned_phrase');
  }

  const abstractCount = ABSTRACT_BLOAT.filter((word) => lower.includes(word)).length;
  if (abstractCount >= 2) {
    reasons.push('abstract_bloat');
  }

  if (!/[.?!…]$/.test(sanitizedText)) {
    reasons.push('missing_terminal_punctuation');
  }

  if (
    /\b(this essay is|the essay is|essay should|essay must)\b/i.test(sanitizedText)
    && !/\b(moment|scene|conversation|detail|story|decision|choice|turn|pivot|interaction|process|tradeoff|consequence)\b/i.test(sanitizedText)
  ) {
    reasons.push('unsupported_abstraction');
  }

  return {
    valid: reasons.length === 0,
    reasons,
    sanitizedText,
  };
}

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])(\S)/g, '$1 $2')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}
