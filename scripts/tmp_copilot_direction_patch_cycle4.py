from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text()
original = text

anchor = """function quoteAnchor(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\\s+/g, ' ').trim();
  const trimmed = normalized.replace(/[\\\"“”]/g, '').trim();
  return trimmed || null;
}


function anchorCanStandAsClause(anchor: string | null): boolean {
"""
replacement = """function quoteAnchor(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\\s+/g, ' ').trim();
  const trimmed = normalized.replace(/[\\\"“”]/g, '').trim();
  return trimmed || null;
}

function sanitizeActorLabel(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.replace(/^\\s*(a|an|the)\\s+/i, '').replace(/\\s+/g, ' ').trim();
  if (normalized.length < 4) return null;

  const lowered = normalized.toLowerCase();
  const allowedSingleWordActors = new Set([
    'classmate', 'teammate', 'roommate', 'patient', 'nurse', 'teacher', 'coach',
    'student', 'freshman', 'peer', 'friend', 'parent', 'child', 'mentor', 'editor',
    'judge', 'partner', 'counselor', 'manager', 'volunteer', 'client', 'reader',
    'doctor', 'professor', 'principal', 'tutor', 'camper', 'staffer', 'neighbor', 'sibling',
  ]);
  const blockedSingleWordActors = new Set([
    'free', 'nut', 'label', 'labels', 'setup', 'checklist', 'inventory', 'attendance', 'pickup',
  ]);

  if (!normalized.includes(' ')) {
    if (blockedSingleWordActors.has(lowered)) return null;
    if (!allowedSingleWordActors.has(lowered) && !/[A-Z]/.test(normalized)) return null;
  }

  return normalized;
}

function anchorCanStandAsClause(anchor: string | null): boolean {
"""
assert anchor in text, 'anchor block not found'
text = text.replace(anchor, replacement, 1)

text = text.replace(
    "const actor = rawActor && rawActor.trim().length >= 4 ? rawActor : null;",
    "const actor = sanitizeActorLabel(rawActor);",
    1,
)

text = text.replace(
    """    consequenceQ
      ? `This angle wins because it names the tradeoff directly and connects judgment to an observable outcome in ${consequenceQ}.`
      : `${baseWhy} It gives the reader a clear conflict to follow.`,""",
    """    consequenceQ
      ? `It earns trust because it names the tradeoff directly and shows how your judgment shaped ${consequenceQ}.`
      : 'It earns trust because it names the tradeoff clearly and shows the standard your choice made visible.',""",
    1,
)

text = text.replace(
    """    actor && turningQ
      ? `This is stronger because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`
      : turningQ
        ? `This is stronger because it ties your change in response to a concrete moment at ${turningQ}.`
        : actor
          ? `This is stronger because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`
          : 'This is stronger because it shows a real interaction and a visible response change.',""",
    """    actor && turningQ
      ? `This beats the weaker read because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`
      : turningQ
        ? `This beats the weaker read because it shows how your response changed at ${turningQ}, not just that you cared.`
        : actor
          ? `This beats the weaker read because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`
          : 'This beats the weaker read because it shows a real interaction and a visible response change.',""",
    1,
)

text = text.replace(
    """    `${baseWhy} It also beats a flatter version because it turns realization into action instead of reflection-only language.`,""",
    """    reflectionQ
      ? `This beats the weaker read because ${reflectionQ} clarifies what you understood, and the next action shows that the new standard held.`
      : 'This beats the weaker read because it clarifies what changed in your understanding and shows the action that proved it held.',""",
    1,
)

assert text != original, 'no changes applied'
path.write_text(text)
print('patched')
