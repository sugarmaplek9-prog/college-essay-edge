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

  const evidenceA = evidencePacket.evidence_lines[0] ?? 'No clear anchor line yet.';
  const evidenceB = evidencePacket.evidence_lines[1] ?? evidencePacket.evidence_lines[0] ?? 'No second anchor line yet.';

  const recommendation = `Do a two-scene test: ${labelA} versus ${labelB}. Keep only the option that already gives you one clear scene, one real choice, and one immediate result.`;
  const about = 'This decision is not about which topic sounds more impressive. It is about which option already behaves like an essay instead of a category.';
  const why = `Right now this is still a compare decision, not a final topic win. ${labelA} currently has this support: "${evidenceA}". ${labelB} currently has this support: "${evidenceB}". Keep the option that lets you name the moment, the choice, and the consequence without stretching.`;

  const weakerRead = 'If you merge both angles in one opening, the claim blurs and the essay reads as indecisive summary instead of a focused argument.';

  const strongerRead = `Better move: write one sentence for the best ${labelA} scene and one sentence for the best ${labelB} scene. Keep the one that already sounds like a story with pressure, choice, and consequence.`;

  return {
    displayed_recommendation: recommendation,
    essay_about: about,
    why_this_direction: why,
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    first_coaching_step: twoTrackHint
      ? `Write one sentence for your best ${labelA} moment and one for your best ${labelB} moment. Keep only the one that already sounds specific without extra explanation.`
      : 'Write one scene with who was there, what decision happened, what changed immediately, then name which angle that evidence truly supports.',
    evidence_lines: evidencePacket.evidence_lines,
    evidence_explanations: evidencePacket.evidence_explanations,
  };
}
'''

if old not in text:
    raise SystemExit('old block not found')

path.write_text(text.replace(old, new))
print('rewritten v2')
