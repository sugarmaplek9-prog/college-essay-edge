from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
t = p.read_text(encoding='utf-8')

# Restore claim-first starter pattern to RC-stable set
t = t.replace(
    "const CLAIM_FIRST_START_PATTERN = /^(your essay should|make your main claim that|make the claim that|center your essay on|center this essay on|show how|write this around|argue that|at the center, show|lead with the claim that|frame the essay around|build the draft around|focus the essay on|open by showing|prove that|anchor the essay in|start with the claim that|state clearly that)\\b/i;",
    "const CLAIM_FIRST_START_PATTERN = /^(your essay should|make your main claim that|center your essay on|show how|write this around|argue that|at the center, show|lead with the claim that|frame the essay around|build the draft around)\\b/i;",
)

# Replace directive/starter system block with RC-stable baseline
start = t.find("const RECOMMENDATION_DIRECTIVE_STARTERS = [")
end = t.find("function stripDirectivePrefix(directionLine: string): string {")
if start < 0 or end < 0 or end <= start:
    raise SystemExit('starter block markers not found')

stable_block = """const RECOMMENDATION_STARTER_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], string> = {
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

"""

t = t[:start] + stable_block + t[end:]

# Restore buildDeterministicRecommendation to RC-stable signature/logic
t = t.replace(
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
)

# Restore call site
t = t.replace(
"""    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition,
      seedValue
    );""",
"""    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );""",
)

# Remove selectRecommendationStarter if present
sel_start = t.find("function selectRecommendationStarter(")
if sel_start >= 0:
    sel_end = t.find("function stripDirectivePrefix(directionLine: string): string {", sel_start)
    if sel_end > sel_start:
        t = t[:sel_start] + t[sel_end:]

p.write_text(t, encoding='utf-8')
print('ok: restored RC-stable starter system')
