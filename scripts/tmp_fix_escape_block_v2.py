from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
t = p.read_text(encoding='utf-8')

start = t.find('function escapeRegex(value: string): string {')
end = t.find('function selectRecommendationStarter(')
if start < 0 or end < 0 or end <= start:
    raise SystemExit('escape block markers not found')

replacement = """function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

const RECOMMENDATION_DIRECTIVE_PATTERN = new RegExp(
  `^(${RECOMMENDATION_DIRECTIVE_STARTERS.map((s) => escapeRegex(s)).join('|')})\\\\s+(.+)$`,
  'i'
);

"""

t = t[:start] + replacement + t[end:]
p.write_text(t, encoding='utf-8')
print('ok: fixed escape block v2')
