from pathlib import Path
import re

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text(encoding='utf-8')

# Revert starter/directory block between directive starters declaration and escapeRegex function
pattern = re.compile(
    r"const RECOMMENDATION_DIRECTIVE_STARTERS = \[[\s\S]*?function escapeRegex\(value: string\): string \{",
    re.MULTILINE,
)
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

function escapeRegex(value: string): string {"""

new_text, n = pattern.subn(replacement, text, count=1)
if n != 1:
    raise SystemExit('starter block revert failed')
text = new_text

text, n2 = re.subn(
    r"function buildDeterministicRecommendation\(\n\s*family: RuntimeDirectionCandidate\['family_type'\],\n\s*hingeForComposition: string \| null,\n\s*consequenceForComposition: string \| null,\n\s*seedValue = 0\n\): string \{\n\s*const starter = selectDeterministicRecommendationStarter\([\s\S]*?\n\s*\);",
    """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null
): string {
  const starter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';""",
    text,
    count=1,
)
if n2 != 1:
    raise SystemExit('buildDeterministicRecommendation revert failed')

text, n3 = re.subn(
    r"const deterministicDirection = buildDeterministicRecommendation\(\n\s*family,\n\s*hingeForComposition,\n\s*consequenceForComposition,\n\s*seedValue\n\s*\);",
    """const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );""",
    text,
    count=1,
)
if n3 != 1:
    raise SystemExit('call site revert failed')

path.write_text(text, encoding='utf-8')
print('ok: reverted to stable baseline starter system')
