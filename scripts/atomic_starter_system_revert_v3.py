from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text(encoding='utf-8')

start = text.find("const RECOMMENDATION_DIRECTIVE_STARTERS = [")
end = text.find("function escapeRegex(value: string): string {")
if start == -1 or end == -1 or end <= start:
    raise SystemExit('failed to locate starter block boundaries')

replacement = """// Deterministic variation of recommendation starters to reduce shell concentration
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
] as const;

"""

text = text[:start] + replacement + text[end:]

old_func = """function buildDeterministicRecommendation(
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

new_func = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null
): string {
  const starter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';"""

if old_func not in text:
    raise SystemExit('patched deterministic function signature not found')
text = text.replace(old_func, new_func, 1)

old_call = """    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition,
      seedValue
    );"""
new_call = """    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );"""
if old_call not in text:
    raise SystemExit('patched call site not found')
text = text.replace(old_call, new_call, 1)

path.write_text(text, encoding='utf-8')
print('ok: reverted to stable baseline starter system')
