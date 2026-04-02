from pathlib import Path

path = Path('src/lib/fm/canonicalPage3Payload.ts')
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

  const labelA = optionLabels[0] ?? 'your first option';
  const labelB = optionLabels[1] ?? 'your second option';
  const sportsPattern = /\\b(cross[-\\s]?country|running|track|soccer|football|basketball|swim|tennis|wrestling|baseball|volleyball)\\b/i;
  const primaryLabel =
    optionLabels.length >= 2
      ? sportsPattern.test(labelB) && !sportsPattern.test(labelA)
        ? labelB
        : labelA
      : labelA;
  const secondaryLabel = primaryLabel === labelA ? labelB : labelA;

  const evidenceA = evidencePacket.evidence_lines[0] ?? 'No clear anchor line yet.';
  const evidenceB = evidencePacket.evidence_lines[1] ?? evidencePacket.evidence_lines[0] ?? 'No second anchor line yet.';
  const primaryEvidence = primaryLabel === labelB ? evidenceB : evidenceA;
  const secondaryEvidence = primaryLabel === labelB ? evidenceA : evidenceB;

  const recommendation = `Provisional direction: start with ${primaryLabel} as your main angle. Keep ${secondaryLabel} only as a backup unless it gives a clearer scene, choice, and consequence.`;
  const about = `This essay is about proving one claim with one real scene. Treat ${primaryLabel} as the lead thread and use ${secondaryLabel} only if it wins the same scene test.`;
  const why = `This keeps the decision usable now instead of leaving both options equal. Current support for ${primaryLabel}: "${primaryEvidence}". Current support for ${secondaryLabel}: "${secondaryEvidence}". Switch only if ${secondaryLabel} gives a sharper moment, harder choice, and more immediate consequence.`;

  const weakerRead = 'If you merge both angles in one opening, the claim blurs and the essay reads as indecisive summary instead of a focused argument.';

  const strongerRead = `Draft from ${primaryLabel} first: write a 4-line opening with scene, decision, and result. Then test whether ${secondaryLabel} beats it on clarity; keep only one.`;

  return {
    displayed_recommendation: recommendation,
    essay_about: about,
    why_this_direction: why,
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    first_coaching_step: twoTrackHint
      ? `Write one concrete scene for ${primaryLabel} first. If you cannot name a real decision and immediate consequence, switch to ${secondaryLabel}.`
      : 'Write one scene with who was there, what decision happened, what changed immediately, then name which angle that evidence truly supports.',
    evidence_lines: evidencePacket.evidence_lines,
    evidence_explanations: evidencePacket.evidence_explanations,
  };
}
'''

if old not in text:
    raise SystemExit('old ambiguity block not found')

path.write_text(text.replace(old, new))
print('patched ambiguity fallback to provisional mode')
