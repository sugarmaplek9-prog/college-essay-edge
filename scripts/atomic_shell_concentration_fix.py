#!/usr/bin/env python3
"""
Atomic patch for shell concentration, coach voice, and next-step concreteness.
This is ONE atomic operation that touches the direction composer exactly once.
"""

from pathlib import Path

# Read the entire file
filepath = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
content = filepath.read_text('utf-8')

# ====== PATCH 1: Replace RECOMMENDATION_STARTER_BY_FAMILY with variants ======
old_starters_block = """const RECOMMENDATION_STARTER_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], string> = {
  tension: 'Frame the essay around',
  value: 'Lead with the claim that',
  process: 'Make the claim that',
  relationship: 'Center your essay on',
  contradiction: 'Argue that',
  realization: 'Show how',
  ambiguity: 'Frame the essay around',
};"""

new_starters_block = """// Deterministic variation of recommendation starters to reduce shell concentration
// Each family has multiple variants that rotate based on case content hash
const RECOMMENDATION_STARTER_FAMILIES: Record<RuntimeDirectionCandidate['family_type'], string[]> = {
  tension: [
    'Frame the essay around',
    'Build the core claim on',
    'Center your argument on the tension between',
    'Show the collision at',
  ],
  value: [
    'Lead with the claim that',
    'Make the core claim that',
    'Show how',
    'Argue that',
  ],
  process: [
    'Make the claim that',
    'Move the essay forward with',
    'Establish this claim:',
    'Build from the fact that',
  ],
  relationship: [
    'Center your essay on',
    'Show the relationship between',
    'Make the essay about',
    'Ground the draft in',
  ],
  contradiction: [
    'Argue that',
    'Resolve the contradiction by showing',
    'Prove that',
    'Establish that',
  ],
  realization: [
    'Show how',
    'Demonstrate how',
    'Write toward the moment when',
    'Ground the essay in the realization that',
  ],
  ambiguity: [
    'Frame the essay around',
    'Explore both angles of',
    'Make the essay handle both:',
    'Test which reads stronger:',
  ],
};

function selectRecommendationStarter(
  family: RuntimeDirectionCandidate['family_type'],
  hingeContent: string | null,
  consequenceContent: string | null,
  seedValue: number
): string {
  const variants = RECOMMENDATION_STARTER_FAMILIES[family] ?? RECOMMENDATION_STARTER_FAMILIES.value;
  const contentHash = stableTextHash(\`\${hingeContent}|\${consequenceContent}\`) + seedValue;
  const selectedIndex = Math.abs(contentHash) % variants.length;
  return variants[selectedIndex];
}

const RECOMMENDATION_STARTER_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], string> = {
  tension: 'Frame the essay around',
  value: 'Lead with the claim that',
  process: 'Make the claim that',
  relationship: 'Center your essay on',
  contradiction: 'Argue that',
  realization: 'Show how',
  ambiguity: 'Frame the essay around',
};"""

content = content.replace(old_starters_block, new_starters_block)

# ====== PATCH 2: Update buildDeterministicRecommendation to use seedValue ======
old_build_deterministic = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null
): string {
  const starter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';
  const hinge = normalizeSentence(stripDirectivePrefix(hingeForComposition ?? 'one decisive moment changed your standard')).replace(/\.$/, '');
  const consequence = consequenceForComposition
    ? normalizeSentence(stripDirectivePrefix(consequenceForComposition)).replace(/\.$/, '')
    : null;
  const body = consequence ? `${hinge}, and ${consequence}` : hinge;
  return canonicalizeRecommendationAssembly(`${starter} ${body}`);
}"""

new_build_deterministic = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null,
  seedValue: number = 0
): string {
  // Use deterministic variation instead of fixed starter
  const starter = selectRecommendationStarter(family, hingeForComposition, consequenceForComposition, seedValue);
  const hinge = normalizeSentence(stripDirectivePrefix(hingeForComposition ?? 'one decisive moment changed your standard')).replace(/\.$/, '');
  const consequence = consequenceForComposition
    ? normalizeSentence(stripDirectivePrefix(consequenceForComposition)).replace(/\.$/, '')
    : null;
  const body = consequence ? `${hinge}, and ${consequence}` : hinge;
  return canonicalizeRecommendationAssembly(`${starter} ${body}`);
}"""

content = content.replace(old_build_deterministic, new_build_deterministic)

# ====== PATCH 3: Update call to buildDeterministicRecommendation ======
old_call_deterministic = """    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );"""

new_call_deterministic = """    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition,
      seedValue
    );"""

content = content.replace(old_call_deterministic, new_call_deterministic)

# ====== PATCH 4: Improve coach voice in ensureWhyValidatorContract ======
old_why_validator = """function ensureWhyValidatorContract(why: string, seedValue = 0): string {
  let normalized = ensureComparativeWhy(why, seedValue);

  if (!hasComparativeWhySignal(normalized)) {
    const body = normalized.charAt(0).toLowerCase() + normalized.slice(1);
    normalized = `This beats the weaker read because ${body}`;
  }

  if (!hasDraftingPayoffSignal(normalized)) {
    const payoffVariants = [
      'Drafting payoff: start with one scene, then write claim and immediate consequence.',
      'Drafting payoff: write 3 lines — moment, decision, result.',
      'Drafting payoff: this gives you a clear opening paragraph order.',
    ] as const;
    const addOn = payoffVariants[(stableTextHash(normalized) + seedValue) % payoffVariants.length];
    normalized = `${normalized} ${addOn}`;
  }

  return normalizeSentence(normalized);
}"""

new_why_validator = """function ensureWhyValidatorContract(why: string, seedValue = 0): string {
  let normalized = ensureComparativeWhy(why, seedValue);

  if (!hasComparativeWhySignal(normalized)) {
    const body = normalized.charAt(0).toLowerCase() + normalized.slice(1);
    // Stronger, more decisive framing instead of generic "This beats the weaker read because"
    const strongerFramings = [
      `This wins because ${body}`,
      `The advantage: ${body}`,
      `Why this is sharper: ${body}`,
      `This is stronger because ${body}`,
    ] as const;
    const framing = strongerFramings[(stableTextHash(body) + seedValue) % strongerFramings.length];
    normalized = framing;
  }

  if (!hasDraftingPayoffSignal(normalized)) {
    const payoffVariants = [
      'Your draft opens: moment, decision, result in one paragraph.',
      'This gives you a clear 3-sentence paragraph structure.',
      'You can write the whole first paragraph in one sitting.',
      'The opening is concrete enough to draft immediately.',
    ] as const;
    const addOn = payoffVariants[(stableTextHash(normalized) + seedValue) % payoffVariants.length];
    normalized = `${normalized} ${addOn}`;
  }

  return normalizeSentence(normalized);
}"""

content = content.replace(old_why_validator, new_why_validator)

# ====== PATCH 5: Improve next-step concreteness ======
old_next_move = """function ensureConcreteNextMove(nextMove: string, seedValue = 0): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  const variants = [
    'Next step: write 3 lines — moment, decision, immediate result.',
    'Next step: draft one scene paragraph, then one sentence claim, then one consequence line.',
    'Next step: list the hinge detail, your choice, and what changed right after.',
    'Next step: write your opening in 4 lines: context, decision, result, why it mattered.',
    'Next step: draft the first paragraph using scene -> choice -> consequence.',
  ] as const;
  return `${normalized} ${variants[(stableTextHash(normalized) + seedValue) % variants.length]}`;
}"""

new_next_move = """function ensureConcreteNextMove(nextMove: string, seedValue = 0): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  // More concrete, immediately actionable next steps without generic "Next step:" label
  const variants = [
    'Write the opening: scene detail, then your decision, then what changed as a result.',
    'Draft the first paragraph as three sentences: moment, choice, consequence.',
    'Write down: the specific scene, your competing options, and which you chose.',
    'Open with the concrete detail, then state the claim, then show the shift.',
    'Write: what happened, what you decided, why that decision mattered.',
  ] as const;
  return `${normalized} Then: ${variants[(stableTextHash(normalized) + seedValue) % variants.length]}`;
}"""

content = content.replace(old_next_move, new_next_move)

# Write the file back
filepath.write_text(content, 'utf-8')

print('✓ Atomic shell concentration fix applied to direction.ts')
print('  - Lead variation: RECOMMENDATION_STARTER_FAMILIES added')
print('  - Coach voice: Stronger framing in ensureWhyValidatorContract')
print('  - Next-step: More concrete language in ensureConcreteNextMove')
