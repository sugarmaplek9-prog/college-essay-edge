#!/usr/bin/env python3
from pathlib import Path

fp = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = fp.read_text()

changes = [
    (
        "      return 'The essay is fundamentally about one concrete judgment call that changed what happened next.';",
        "      return 'The essay is fundamentally about one concrete judgment call and the visible result that proved it.';",
        "paraphraseThemeStatement fallback"
    ),
    (
        "  return 'The essay should center one concrete choice that changed what happened next.';",
        "  return 'The essay should center one concrete choice and the visible result that followed it.';",
        "paraphraseHingeClause fallback"
    ),
    (
        "      return 'the first outcome that showed the decision changed what happened next';",
        "      return 'the first outcome that proved the judgment produced a visible result';",
        "paraphraseConsequenceClause default"
    ),
]

print("=== Removing 'what happened next' ===")
all_ok = True
for old, new, label in changes:
    count = text.count(old)
    if count == 0:
        print(f"  MISSING: {label}")
        all_ok = False
    elif count > 1:
        print(f"  AMBIGUOUS ({count}): {label}")
        all_ok = False
    else:
        text = text.replace(old, new, 1)
        print(f"  OK: {label}")

if not all_ok:
    print("Some failed — aborting")
    raise SystemExit(1)

fp.write_text(text)
text2 = fp.read_text()
remaining = text2.count('what happened next')
print(f"\nRemaining 'what happened next': {remaining}")
print("(should be 2: one in decisionShellPattern regex, one in collapseShell regex)")
