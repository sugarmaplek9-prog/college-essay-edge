from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/canonicalPage3Payload.ts')
text = path.read_text()

old = '''function buildAmbiguityFallbackRecommendation(rawInput: string, evidencePacket: {
  evidence_lines: string[];
  evidence_explanations: string[];
}): {
  displayed_recommendation: string;
  essay_about: string;
  why_this_direction: string;
  weaker_read: string;
  stronger_read: string;
  first_coaching_step: string | null;
  evidence_lines: string[];
  evidence_explanations: string[];
} {
  const optionLabels = extractCompareOptionLabels(rawInput);
  const twoTrackHint = optionLabels.length >= 2 || /\\b(both|either|unsure|not sure|which one|split|two)\\b/i.test(rawInput);

  const angleA = optionLabels[0]
    ? `Angle A: build the essay around ${optionLabels[0]} only if you can name one scene, one choice, and one result from it`
    : 'Angle A: build the essay around one concrete scene where your response changed the outcome';
  const angleB = optionLabels[1]
    ? `Angle B: build the essay around ${optionLabels[1]} only if you can name one scene, one choice, and one result from it`
    : 'Angle B: build the essay around one concrete scene where a decision revealed your standard under pressure';

  const evidenceA = evidencePacket.evidence_lines[0] ?? 'No clear anchor line yet.';
  const evidenceB = evidencePacket.evidence_lines[1] ?? evidencePacket.evidence_lines[0] ?? 'No second anchor line yet.';

  const recommendation = `${angleA}. ${angleB}. Compare both as full essay angles, not as scene options.`;
  const about = 'This essay is about choosing one clear claim you can prove with a real scene, not mixing two directions in the same draft.';
  const why = `This is a compare decision, not a final topic win yet. Angle A currently has this best support: "${evidenceA}". Angle B currently has this best support: "${evidenceB}". Keep the option with the cleaner scene, clearer choice, and more immediate consequence.`;

  const weakerRead = 'If you merge both angles in one opening, the claim blurs and the essay reads as indecisive summary instead of a focused argument.';

  const strongerRead = 'Sorting question: which angle can you prove in one scene with one decision and one immediate consequence? Immediate next drafting move: write a 4-line opening for A and B, then keep the version with clearer claim and stronger consequence evidence.';

  return {
    displayed_recommendation: recommendation,
    essay_about: about,
    why_this_direction: why,
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    first_coaching_step: twoTrackHint
      ? 'Step 1: list one concrete scene for Angle A and one for Angle B. Step 2: write a one-sentence claim for each. Step 3: keep only the angle with stronger evidence and clearer consequence.'
      : 'Write one scene with who was there, what decision happened, what changed immediately, then name which angle that evidence truly supports.',
    evidence_lines: evidencePacket.evidence_lines,
    evidence_explanations: evidencePacket.evidence_explanations,
  };
}
'''

new = '''function buildAmbiguityFallbackRecommendation(rawInput: string, evidencePacket: {
  evidence_lines: string[];
  evidence_explanations: string[];
}): {
  displayed_recommendation: string;
  essay_about: string;
  why_this_direction: string;
  weaker_read: string;
  stronger_read: string;
  first_coaching_step: string | null;
  evidence_lines: string[];
  evidence_explanations: string[];
} {
  const optionLabels = extractCompareOptionLabels(rawInput);
  const twoTrackHint = optionLabels.length >= 2 || /\\b(both|either|unsure|not sure|which one|split|two)\\b/i.test(rawInput);

  const fallbackEvidence = Array.from(
    new Set([
      ...evidencePacket.evidence_lines,
      ...rawInput
        .split(/(?<=[.!?])\\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 16),
    ])
  ).slice(0, 2);

  const angleA = optionLabels[0]
    ? `Angle A (${optionLabels[0]}): creative-discipline method`
    : 'Angle A: creative-discipline method';
  const angleB = optionLabels[1]
    ? `Angle B (${optionLabels[1]}): endurance-discipline method`
    : 'Angle B: endurance-discipline method';

  const evidenceA = fallbackEvidence[0] ?? 'No clear anchor line yet.';
  const evidenceB = fallbackEvidence[1] ?? fallbackEvidence[0] ?? 'No second anchor line yet.';

  const recommendation = `Essay angle: choose the stronger discipline claim. ${angleA}. ${angleB}. Compare both as full essay angles, then keep one.`;
  const about = 'This essay is about choosing one discipline method you can prove with evidence, then showing accountability and ownership through that method in one focused claim.';
  const why = `This is a compare decision, not a final topic win yet. Angle A currently has this best support: "${evidenceA}". Angle B currently has this best support: "${evidenceB}". Keep the option with the cleaner scene, clearer choice, and more immediate consequence.`;

  const weakerRead = 'If you merge both angles in one opening, the claim blurs and the essay reads as indecisive summary instead of a focused argument.';

  const strongerRead = 'Sorting question: which angle can you prove in one scene with one decision and one immediate consequence? Immediate next drafting move: write a 4-line opening for A and B, then keep the version with clearer claim and stronger consequence evidence.';

  return {
    displayed_recommendation: recommendation,
    essay_about: about,
    why_this_direction: why,
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    first_coaching_step: twoTrackHint
      ? 'Step 1: list one concrete scene for Angle A and one for Angle B. Step 2: write a one-sentence claim for each. Step 3: keep only the angle with stronger evidence and clearer consequence.'
      : 'Write one scene with who was there, what decision happened, what changed immediately, then name which angle that evidence truly supports.',
    evidence_lines: fallbackEvidence.length > 0 ? fallbackEvidence : evidencePacket.evidence_lines,
    evidence_explanations: evidencePacket.evidence_explanations,
  };
}
'''

if old not in text:
    raise SystemExit('old block not found')

path.write_text(text.replace(old, new))
print('patched compare fallback angle naming')
