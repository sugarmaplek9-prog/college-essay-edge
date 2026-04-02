from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
t = p.read_text(encoding='utf-8')

start = t.find("const RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY")
end = t.find("function escapeRegex(value: string): string {")
if start < 0 or end < 0 or end <= start:
    raise SystemExit('markers not found')

replacement = """const RECOMMENDATION_STARTER_VARIANTS_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], readonly string[]> = {
  tension: ['Frame the essay around'],
  value: ['Lead with the claim that'],
  process: ['Make the claim that'],
  relationship: [
    'Center your essay on',
    'Focus the essay on',
    'Anchor the essay in',
  ],
  contradiction: ['Argue that'],
  realization: ['Show how'],
  ambiguity: ['Frame the essay around'],
};

"""

t = t[:start] + replacement + t[end:]
p.write_text(t, encoding='utf-8')
print('ok: variants narrowed')
