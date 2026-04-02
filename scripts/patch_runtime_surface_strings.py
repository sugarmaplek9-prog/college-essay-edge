from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
s = p.read_text()

old_contradiction = """  const contradictionCandidate = recommend(
    'c_contradiction_angle',
    'contradiction',
    'angle_contradiction_resolved',
    turningQ
      ? `Name the essay as ownership under contradiction: what you believed about yourself versus what ${turningQ} proved.`
      : 'Name the essay as ownership under contradiction between self-image and what the moment required.',
    'The contradiction creates real stakes, and resolving it gives the essay a clear arc readers can trust.',
    'This essay is about ownership under contradiction and the behavior shift that followed.',
    'Write two short beats: what you assumed about yourself, then the detail that proved that assumption was incomplete.',
    'contrast',
    'insight_depth'
  );
"""
new_contradiction = """  const contradictionCandidate = recommend(
    'c_contradiction_angle',
    'contradiction',
    'angle_contradiction_resolved',
    turningQ
      ? `Name the essay as ownership under contradiction: what you believed about yourself versus what ${turningQ} proved.`
      : 'Name the essay as ownership under contradiction between self-image and what the moment required.',
    turningQ
      ? `This wins because ${turningQ} makes the contradiction visible and shows what standard replaced it.`
      : 'This wins because the contradiction is explicit and the replacement standard is concrete.',
    turningQ
      ? `This essay is about ownership under contradiction: what ${turningQ} forced you to revise in how you judged the situation.`
      : 'This essay is about ownership under contradiction and the behavior shift that followed.',
    'Write two short beats: what you assumed about yourself, then the detail that proved that assumption was incomplete.',
    'contrast',
    'insight_depth'
  );
"""

old_coach = """  const coachComparison = runnerUpCandidate
    ? {
        weaker_read: renderGuard(
          `The alternate option carries detail but leaves the governing claim less explicit (${runnerUpCandidate.angle_type} angle).`,
          'The alternate option carries detail but leaves the governing claim less explicit.', {
          maxWords: 22,
          maxSentences: 1,
        }),
        stronger_read: renderGuard(
          `The selected option states the claim early and ties hinge to consequence cleanly (${selectedCandidate?.angle_type ?? 'selected'} angle).`,
          'The selected option states the claim early and ties hinge to consequence cleanly.', {
          maxWords: 24,
          maxSentences: 1,
        }),
"""
new_coach = """  const coachComparison = runnerUpCandidate
    ? {
        weaker_read: renderGuard(
          [
            `The weaker path falls short because it stays thinner on claim clarity (${runnerUpCandidate.angle_type} angle).`,
            `What the weaker version misses is claim control under evidence pressure (${runnerUpCandidate.angle_type} angle).`,
            `That weaker option keeps detail but leaves the governing claim less explicit (${runnerUpCandidate.angle_type} angle).`,
          ][Math.abs((runnerUpCandidate.candidate_id || '').split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],
          'The alternate option carries detail but leaves the governing claim less explicit.', {
          maxWords: 22,
          maxSentences: 1,
        }),
        stronger_read: renderGuard(
          [
            `The stronger option works because it states the claim early and ties hinge to consequence cleanly (${selectedCandidate?.angle_type ?? 'selected'} angle).`,
            `What makes the stronger version hold together is clear claim-first structure with visible consequence (${selectedCandidate?.angle_type ?? 'selected'} angle).`,
            `The stronger path is easier to trust because the decision and outcome stay tightly linked (${selectedCandidate?.angle_type ?? 'selected'} angle).`,
          ][Math.abs(((selectedCandidate?.candidate_id ?? 'selected')).split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],
          'The selected option states the claim early and ties hinge to consequence cleanly.', {
          maxWords: 24,
          maxSentences: 1,
        }),
"""

changed = False
if old_contradiction in s:
    s = s.replace(old_contradiction, new_contradiction, 1)
    changed = True
if old_coach in s:
    s = s.replace(old_coach, new_coach, 1)
    changed = True

if not changed:
    raise SystemExit('No target blocks found')

p.write_text(s)
print('patched runtime surface strings')
