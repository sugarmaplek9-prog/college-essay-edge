import { validateRenderableText } from '@/lib/fm/output-validator';

export function normalizeRenderText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])(\S)/g, '$1 $2')
    .replace(/\s{2,}/g, ' ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

export function capWords(text: string, maxWords: number): string {
  const words = normalizeRenderText(text).split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ').trim()}…`;
}

export function capSentences(text: string, maxSentences: number): string {
  const normalized = normalizeRenderText(text);
  const parts = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= maxSentences) return normalized;
  return parts.slice(0, maxSentences).join(' ');
}

export function renderGuard(
  text: string,
  fallback: string,
  options: { maxWords?: number; maxSentences?: number } = {}
): string {
  const normalized = normalizeRenderText(text);
  const safeBase = normalized.length >= 16 ? normalized : fallback;
  const sentenceSafe = options.maxSentences ? capSentences(safeBase, options.maxSentences) : safeBase;
  const wordSafe = options.maxWords ? capWords(sentenceSafe, options.maxWords) : sentenceSafe;
  const validated = validateRenderableText(wordSafe);
  if (validated.valid) {
    return normalizeRenderText(validated.sanitizedText);
  }

  const fallbackValidated = validateRenderableText(normalizeRenderText(fallback));
  if (fallbackValidated.valid) {
    return normalizeRenderText(fallbackValidated.sanitizedText);
  }

  return normalizeRenderText(fallback);
}
