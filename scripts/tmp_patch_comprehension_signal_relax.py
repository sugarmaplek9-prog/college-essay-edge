from pathlib import Path

path = Path('src/lib/fm/direction.ts')
text = path.read_text()
old = '''function hasComprehensionSignal(candidate: RuntimeDirectionCandidate): boolean {
  const direction = normalizeSentence(candidate.direction_line);
  const directionWordCount = direction.split(/\s+/).filter(Boolean).length;
  const directionHasCore = /\b(moment|decision|choice|result|standard|method|value|response|behavior)\b/i.test(direction);
  const whyHasBecause = /\bbecause\b/i.test(candidate.why_this_direction);
  const nextHasConcrete = hasConcreteNextStep(candidate.next_move);
  const hasStructuredClause = /\b(and|then|,|;)\b/.test(direction);
  const conciseEnough = directionWordCount <= 66;
  const boundedLongForm = directionWordCount <= 82 && hasStructuredClause;
  return hasClaimFirstForm(direction) && directionHasCore && (conciseEnough || boundedLongForm) && whyHasBecause && nextHasConcrete;
}
'''
new = '''function hasComprehensionSignal(candidate: RuntimeDirectionCandidate): boolean {
  const direction = normalizeSentence(candidate.direction_line);
  const directionWordCount = direction.split(/\s+/).filter(Boolean).length;
  const directionHasCore = /\b(moment|decision|choice|result|standard|method|value|response|behavior|discipline|accountability|ownership|judgment|tradeoff|trust)\b/i.test(direction);
  const whyHasReasoning = /\bbecause\b/i.test(candidate.why_this_direction) || hasComparativeWhySignal(candidate.why_this_direction);
  const nextHasConcrete = hasConcreteNextStep(candidate.next_move);
  const hasStructuredClause = /\b(and|then|,|;)\b/.test(direction);
  const conciseEnough = directionWordCount <= 72;
  const boundedLongForm = directionWordCount <= 92 && hasStructuredClause;
  return hasClaimFirstForm(direction) && directionHasCore && (conciseEnough || boundedLongForm) && whyHasReasoning && nextHasConcrete;
}
'''

if old not in text:
    raise SystemExit('target block not found')

path.write_text(text.replace(old, new, 1))
print('patched comprehension signal relaxation')
