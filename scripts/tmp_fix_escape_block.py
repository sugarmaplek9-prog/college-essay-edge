from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
t = p.read_text(encoding='utf-8')

old = """function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\]/g, '\$&');
}

const RECOMMENDATION_DIRECTIVE_PATTERN = new RegExp(
  `^(${RECOMMENDATION_DIRECTIVE_STARTERS.map((s) => escapeRegex(s)).join('|')})\s+(.+)$`,
  'i'
);
"""

new = """function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');
}

const RECOMMENDATION_DIRECTIVE_PATTERN = new RegExp(
  `^(${RECOMMENDATION_DIRECTIVE_STARTERS.map((s) => escapeRegex(s)).join('|')})\\\\s+(.+)$`,
  'i'
);
"""

if old not in t:
    raise SystemExit('target block not found')

t = t.replace(old, new, 1)
p.write_text(t, encoding='utf-8')
print('ok: fixed escape block')
