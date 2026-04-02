from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text(encoding='utf-8')

old_block = """// Deterministic variation of recommendation starters to reduce shell concentration
// Each family has multiple variants that rotate based on case content hash
const RECOMMENDATION_STARTER_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], string> = {
  tension: 'Frame the essay around',
  value: 'Lead with the claim that',
  process: 'Make the claim that',
  relationship: 'Center your essay on',
  contradiction: 'Argue that',
  realization: 'Show how',
  ambiguity: 'Frame the essay around',
};

const RECOMMENDATION_DIRECTIVE_PATTERN = /^(Your essay should show|Make your main claim that|Make the claim that|Center your essay on|Center this essay on|Show how|Write this around|Argue that|At the center, show|Lead with the claim that|Frame the essay around|Build the draft around)\\s+(.+)$/i;

const RECOMMENDATION_DIRECTIVE_STARTERS = [
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
] as const;"""

new_block = """const RECOMMENDATION_DIRECTIVE_STARTERS = [
  'Your essay should show',
  'Make your main claim that',
  'Make the claim that',
  'Center your essay on',
  'Anchor the essay in',
  'Build the essay around',
  'Show how',
  'Write this around',
  'Argue that',
  'At the center, show',
  'Lead with the claim that',
  'Frame the essay around',
  'Build the draft around',
] as const;

const RECOMMENDATION_DIRECTIVE_ALIAS_STARTERS = [
  'Center this essay on',
] as const;

const RECOMMENDATION_DIRECTIVE_STARTER_ALTERNATION = [
  ...RECOMMENDATION_DIRECTIVE_STARTERS,
  ...RECOMMENDATION_DIRECTIVE_ALIAS_STARTERS,
].map((s) => escapeRegex(s)).join('|');

const RECOMMENDATION_DIRECTIVE_PATTERN = new RegExp(
  `^(${RECOMMENDATION_DIRECTIVE_STARTER_ALTERNATION})\\\\s+(.+)$`,
  'i'
);

const RECOMMENDATION_STARTER_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], readonly string[]> = {
  tension: ['Frame the essay around'],
  value: ['Lead with the claim that'],
  process: ['Make the claim that'],
  relationship: ['Center your essay on', 'Anchor the essay in', 'Build the essay around'],
  contradiction: ['Argue that'],
  realization: ['Show how'],
  ambiguity: ['Frame the essay around'],
};

function selectDeterministicRecommendationStarter(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null,
  seedValue = 0
): string {
  const variants = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? ['Your essay should show'];
  if (variants.length <= 1) return variants[0];

  const hashInput = `${family}|${normalizeAnchorKey(hingeForComposition ?? '')}|${normalizeAnchorKey(consequenceForComposition ?? '')}`;
  const idx = Math.abs(stableTextHash(hashInput) + seedValue) % variants.length;
  return variants[idx];
}"""

if old_block not in text:
  raise SystemExit('old starter block not found exactly; aborting')
text = text.replace(old_block, new_block, 1)

old_build = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null
): string {
  const starter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';"""

new_build = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null,
  seedValue = 0
): string {
  const starter = selectDeterministicRecommendationStarter(
    family,
    hingeForComposition,
    consequenceForComposition,
    seedValue
  );"""

if old_build not in text:
  raise SystemExit('old buildDeterministicRecommendation header not found; aborting')
text = text.replace(old_build, new_build, 1)

old_call = """    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );"""
new_call = """    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition,
      seedValue
    );"""

if old_call not in text:
  raise SystemExit('old deterministicDirection call not found; aborting')
text = text.replace(old_call, new_call, 1)

path.write_text(text, encoding='utf-8')
print('ok: atomic starter-system patch applied')
