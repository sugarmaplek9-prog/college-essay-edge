#!/usr/bin/env python3
"""
REVERT to baseline + only the safe patches (coach voice + next-step improvements)
Skip the new starter families that broke the RC.
"""

from pathlib import Path

filepath = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = filepath.read_text('utf-8')

# Remove the RECOMMENDATION_STARTER_FAMILIES and selectRecommendationStarter we added
# Find and remove them
lines = text.split('\n')
filtered = []
skip_until_empty = False
for i, line in enumerate(lines):
    if 'RECOMMENDATION_STARTER_FAMILIES' in line:
        skip_until_empty = True
        continue
    if skip_until_empty:
        if 'const RECOMMENDATION_STARTER_BY_FAMILY' in line:
            skip_until_empty = False
            filtered.append(line)  # Keep this line
        elif not line.strip():
            # Empty line at end of block, skip but continue
            continue
        # else skip the line
    else:
        filtered.append(line)

text = '\n'.join(filtered)

# Now restore buildDeterministicRecommendation to NOT use seedValue
old_build_with_seed = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null,
  seedValue: number = 0
): string {
  // Use deterministic variation instead of fixed starter
  const starter = selectRecommendationStarter(family, hingeForComposition, consequenceForComposition, seedValue);"""

new_build_no_seed = """function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null
): string {
  const starter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';"""

text = text.replace(old_build_with_seed, new_build_no_seed)

# Remove the seedValue parameter from the call site
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

text = text.replace(old_call, new_call)

filepath.write_text(text, 'utf-8')
print('✓ Reverted to baseline (removed broken new starters)')
print('  Kept improvements: coach voice + next-step language')
