from pathlib import Path

src = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts').read_text()
out = Path('/Volumes/TOSHIBA EXT/College Essay/evaluation_outputs/page3_holdout_v2_remediation/LIVE_DIRECTION_SNIPPETS_V1.txt')
chunks = []
for needle in [
    'directionWordCount <= 50',
    'This is stronger than the obvious version because',
    'function ensureWhyValidatorContract',
    'Make your main claim that ${turningQ} made responsibility your call',
    'Argue that the method you rebuilt after ${turningQ} changed your standard',
    'Argue that what you believed about yourself collided with what ${turningQ} proved',
    "'essay_about_restate_fail',",
    'pool_backfill_recovery',
]:
    idx = src.find(needle)
    chunks.append(f'NEEDLE: {needle}\nFOUND: {idx}\n')
out.write_text('\n'.join(chunks))
print(str(out))
