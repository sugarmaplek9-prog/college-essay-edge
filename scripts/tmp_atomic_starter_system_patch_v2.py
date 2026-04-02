from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text(encoding='utf-8')

# 1) Expand claim-first pattern starters
text = text.replace(
    "const CLAIM_FIRST_START_PATTERN = /^(your essay should|make your main claim that|center your essay on|show how|write this around|argue that|at the center, show|lead with the claim that|frame the essay around|build the draft around)\\b/i;",
    "const CLAIM_FIRST_START_PATTERN = /^(your essay should|make your main claim that|make the claim that|center your essay on|center this essay on|show how|write this around|argue that|at the center, show|lead with the claim that|frame the essay around|build the draft around|focus the essay on|open by showing|prove that|anchor the essay in|start with the claim that|state clearly that)\\b/i;",
)

# 2) Replace starter/matching block between markers
start_marker = "const RECOMMENDATION_STARTER_BY_FAMILY"
end_marker = "function escapeRegex(value: string): string {"
start = text.find(start_marker)
end = text.find(end_marker)
if start < 0 or end < 0 or end <= start:
    raise SystemExit('Failed to locate starter block markers')

new_block = """const RECOMMENDATION_DIRECTIVE_STARTERS = [
  'Your essay should show',
  'Make your main claim that',
  'Make the claim that',
  'Center your essay on',
  'Center this essay on',
  'Show how',
  'Write this around',
  'Argue that',
  'At the center, show',
  'Lead with the claim that',
  'Frame the essay around',
  'Build the draft around',
  'Focus the essay on',
  'Open by showing',
  'Prove that',
  'Anchor the essay in',
  'Start with the claim that',
  'State clearly that',
] as const;

const RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], readonly string[]> = {
  tension: [
    'Frame the essay around',
    'Open by showing',
    'State clearly that',
  ],
  value: [
    'Lead with the claim that',
    'Prove that',
    'Focus the essay on',
  ],
  process: [
    'Make the claim that',
    'Start with the claim that',
    'Build the draft around',
  ],
  relationship: [
    'Center your essay on',
    'Focus the essay on',
    'Anchor the essay in',
  ],
  contradiction: [
    'Argue that',
    'Prove that',
    'State clearly that',
  ],
  realization: [
    'Show how',
    'Open by showing',
    'Make your main claim that',
  ],
  ambiguity: [
    'Frame the essay around',
    'Start with the claim that',
    'Focus the essay on',
  ],
};

"""

text = text[:start] + new_block + text[end:]

# 3) Insert directive pattern + starter selector immediately after escapeRegex function
needle = """function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}
"""
insert = """
const RECOMMENDATION_DIRECTIVE_PATTERN = new RegExp(
  `^(${RECOMMENDATION_DIRECTIVE_STARTERS.map((s) => escapeRegex(s)).join('|')})\\s+(.+)$`,
  'i'
);

function selectRecommendationStarter(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null,
  seedValue = 0
): string {
  const variants = RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY[family] ?? RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY.value;
  const hingeKey = normalizeAnchorKey(hingeForComposition ?? '');
  const consequenceKey = normalizeAnchorKey(consequenceForComposition ?? '');
  const selectionKey = `${family}|${hingeKey}|${consequenceKey}`;
  const idx = (stableTextHash(selectionKey) + Math.abs(seedValue)) % variants.length;
  return variants[idx] ?? variants[0] ?? 'Make the claim that';
}
"""
if needle not in text:
    raise SystemExit('Failed to locate escapeRegex block')
text = text.replace(needle, needle + insert, 1)

# 4) Update deterministic recommendation function
text = text.replace(
"""function buildDeterministicRecommendation(
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
}""",
"""function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null,
  seedValue = 0
): string {
  const starter = selectRecommendationStarter(
    family,
    hingeForComposition,
    consequenceForComposition,
    seedValue
  );
  const hinge = normalizeSentence(stripDirectivePrefix(hingeForComposition ?? 'one decisive moment changed your standard')).replace(/\.$/, '');
  const consequence = consequenceForComposition
    ? normalizeSentence(stripDirectivePrefix(consequenceForComposition)).replace(/\.$/, '')
    : null;
  const body = consequence ? `${hinge}, and ${consequence}` : hinge;
  return canonicalizeRecommendationAssembly(`${starter} ${body}`);
}""",
)

# 5) Update call site with seed value
text = text.replace(
"""    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );""",
"""    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition,
      seedValue
    );""",
)

path.write_text(text, encoding='utf-8')
print('ok: atomic starter-system patch applied')
