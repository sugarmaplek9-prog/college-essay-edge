from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
t = p.read_text(encoding='utf-8')

start = t.find("const RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY")
end = t.find("function stripDirectivePrefix(directionLine: string): string {")
if start < 0 or end < 0 or end <= start:
    raise SystemExit('markers not found')

replacement = """const RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], readonly string[]> = {
  tension: ['Frame the essay around'],
  value: ['Lead with the claim that'],
  process: ['Make the claim that'],
  relationship: [
    'Center your essay on',
    'At the center, show',
    'Frame the essay around',
  ],
  contradiction: ['Argue that'],
  realization: ['Show how'],
  ambiguity: ['Frame the essay around'],
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

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
  const hashed = stableTextHash(selectionKey) + Math.abs(seedValue);

  if (family === 'relationship' && variants.length >= 3) {
    const roll = hashed % 5;
    if (roll <= 2) return variants[0] ?? 'Center your essay on';
    if (roll === 3) return variants[1] ?? variants[0] ?? 'Center your essay on';
    return variants[2] ?? variants[0] ?? 'Center your essay on';
  }

  return variants[0] ?? 'Make the claim that';
}

"""

t = t[:start] + replacement + t[end:]
p.write_text(t, encoding='utf-8')
print('ok: relationship variant policy set')
