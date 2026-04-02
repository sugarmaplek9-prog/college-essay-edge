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
  const split = rawInput
    .split(/\\bor\\b/i)
    .map((s) => s.replace(/\\s+/g, ' ').trim())
    .filter((s) => s.length >= 8)
    .slice(0, 2);
  const twoTrackHint = split.length >= 2 || /\\b(both|either|unsure|not sure|which one|split|two)\\b/i.test(rawInput);

  const angleA = split[0]
    ? `Angle A: ${split[0].slice(0, 72)}${split[0].length > 72 ? '…' : ''}`
    : 'Angle A: focus on how you responded to another person in one concrete moment'
  ;
  const angleB = split[1]
    ? `Angle B: ${split[1].slice(0, 72)}${split[1].length > 72 ? '…' : ''}`
    : 'Angle B: focus on a decision where pressure forced a different standard';

  const evidenceA = evidencePacket.evidence_lines[0] ?? 'No clear anchor line yet.';
  const evidenceB = evidencePacket.evidence_lines[1] ?? evidencePacket.evidence_lines[0] ?? 'No second anchor line yet.';

  const recommendation = `${angleA}. ${angleB}. Compare both as full essay angles, not as scene options.`;
  const about = 'This essay is about choosing one clear claim you can prove with a real scene, not mixing two directions in the same draft.';
  const why = `Angle A currently has this best support: "${evidenceA}". Angle B currently has this best support: "${evidenceB}". Pick the angle you can prove with one scene, one decision, and one immediate consequence.`;

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
new = '''function cleanCompareOptionLabel(value: string): string {
  return value
    .replace(/^(i\\s+(?:could|can|might|am|keep|have|want|feel|love|care about|do)\\s+)/i, '')
    .replace(/^(between|about|whether|if|choosing|choose)\\s+/i, '')
    .replace(/\\b(for my (?:college )?essay|for college essays?)\\b/gi, '')
    .replace(/\\b(both matter to me|matter to me|not sure which one|unsure which one|which one is better|is better)\\b/gi, '')
    .replace(/^[\\s,:;.-]+|[\\s,:;.-]+$/g, '')
    .replace(/\\s+/g, ' ')
    .trim();
}

function extractCompareOptionLabels(rawInput: string): string[] {
  const normalized = rawInput.replace(/\\s+/g, ' ').trim();
  const labels: string[] = [];

  const add = (value: string | undefined) => {
    if (!value) return;
    const cleaned = cleanCompareOptionLabel(value);
    if (cleaned.length < 3) return;
    if (labels.some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) return;
    labels.push(cleaned);
  };

  const andAlso = normalized.match(/i\\s+(.+?)\\s+and\\s+i\\s+also\\s+(.+?)(?:[.!?]|$)/i);
  if (andAlso) {
    add(andAlso[1]);
    add(andAlso[2]);
  }

  const between = normalized.match(/\\bbetween\\s+(.+?)\\s+and\\s+(.+?)(?:[.!?]|$)/i);
  if (between) {
    add(between[1]);
    add(between[2]);
  }

  if (labels.length < 2) {
    normalized
      .split(/\\bor\\b/i)
      .map((part) => part.trim())
      .forEach((part) => add(part));
  }

  return labels.slice(0, 2);
}

function buildAmbiguityFallbackRecommendation(rawInput: string, evidencePacket: {
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

if old not in text:
    raise SystemExit('old block not found')

path.write_text(text.replace(old, new))
print('rewritten')
