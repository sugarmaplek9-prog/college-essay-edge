from pathlib import Path
import re

path = Path('src/lib/fm/direction.ts')
text = path.read_text()
pattern = re.compile(r"function hasComprehensionSignal\(candidate: RuntimeDirectionCandidate\): boolean \{\n.*?\n\}\n", re.S)
replacement = """function hasComprehensionSignal(candidate: RuntimeDirectionCandidate): boolean {
  const direction = normalizeSentence(candidate.direction_line);
  const directionWordCount = direction.split(/\\s+/).filter(Boolean).length;
  const directionHasCore = /\\b(moment|decision|choice|result|standard|method|value|response|behavior|discipline|accountability|ownership|judgment|tradeoff|trust)\\b/i.test(direction);
  const whyHasReasoning = /\\bbecause\\b/i.test(candidate.why_this_direction) || hasComparativeWhySignal(candidate.why_this_direction);
  const nextHasConcrete = hasConcreteNextStep(candidate.next_move);
  const hasStructuredClause = /\\b(and|then|,|;)\\b/.test(direction);
  const conciseEnough = directionWordCount <= 72;
  const boundedLongForm = directionWordCount <= 92 && hasStructuredClause;
  return hasClaimFirstForm(direction) && directionHasCore && (conciseEnough || boundedLongForm) && whyHasReasoning && nextHasConcrete;
}
"""
new_text, count = pattern.subn(replacement, text, count=1)
if count != 1:
    raise SystemExit(f'expected 1 replacement, got {count}')
path.write_text(new_text)
print('patched comprehension signal relaxation v2')
