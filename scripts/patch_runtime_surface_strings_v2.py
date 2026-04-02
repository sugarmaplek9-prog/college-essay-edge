from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
s = p.read_text()

s = s.replace(
"""    consequenceQ
      ? `Name the essay as a values-under-cost story, then verify that value through what happened in ${consequenceQ}.`
      : `Frame the draft around the value you protected when it was costly, not the activity list around it.`,
    'Readers trust this angle because they can see what you chose to protect when the easy option was available.',
    consequenceQ
      ? `This essay is about a value-under-cost decision and how that value shaped outcomes in ${consequenceQ}.`
      : 'This essay is about a value-under-cost decision and the behavior that followed.',
""",
"""    consequenceQ
      ? `Name the essay as a values-under-cost story, then verify that value through what happened in ${consequenceQ}.`
      : `Frame the draft around the value you protected when it was costly, not the activity list around it.`,
    'Readers trust this angle because they can see what you chose to protect when the easy option was available.',
    consequenceQ
      ? `At its core, this essay is about a value-under-cost decision and how that value shaped outcomes in ${consequenceQ}.`
      : 'At its core, this essay is about a value-under-cost decision and the behavior that followed.',
""",
1
)

s = s.replace(
"""    turningQ
      ? `This essay is about the standard you rebuilt after ${turningQ}: how that failure changed what you required of yourself and what it proved you could do differently.`
      : 'This essay is about a standard rebuilt: the specific failure, the specific change in approach, and the behavior that proved it stuck.',
""",
"""    turningQ
      ? `Under the scene, this essay is really about the standard you rebuilt after ${turningQ}: how that failure changed what you required of yourself and what it proved you could do differently.`
      : 'Under the scene, this essay is really about a standard rebuilt: the specific failure, the specific change in approach, and the behavior that proved it stuck.',
""",
1
)

s = s.replace(
"""    actor && turningQ
      ? `Name the essay as relationship-based responsibility, using your interaction with ${actor.toLowerCase()} at ${turningQ} as proof.`
      : turningQ
        ? `Name the essay as relationship-based responsibility, using what ${turningQ} revealed about what another person needed as proof.`
        : actor
          ? `Name the essay as relationship-based responsibility through one interaction with ${actor.toLowerCase()}.`
          : 'Name the essay as relationship-based responsibility through one interaction that changed your behavior.',
""",
"""    actor && turningQ
      ? `Center this essay on relationship-based responsibility, using your interaction with ${actor.toLowerCase()} at ${turningQ} as proof.`
      : turningQ
        ? `Make the claim that relationship-based responsibility is the real turn, using what ${turningQ} revealed about what another person needed.`
        : actor
          ? `Show how responsibility in relationship changed once you noticed what ${actor.toLowerCase()} needed.`
          : 'Write this as relationship-based responsibility through one interaction that changed your behavior.',
""",
1
)

s = s.replace(
"""    actor && turningQ
      ? `This essay is about responsibility in relationship: understanding what ${actor.toLowerCase()} needed and acting on it.`
      : turningQ
        ? `This essay is about responsibility in relationship: what ${turningQ} showed you about another person’s need and how you changed your response.`
        : actor
          ? `This essay is about responsibility in relationship: understanding what ${actor.toLowerCase()} needed and acting on it.`
          : 'This essay is about responsibility in relationship: understanding another person’s need and acting on it.',
""",
"""    actor && turningQ
      ? `What gives this essay meaning is responsibility in relationship: understanding what ${actor.toLowerCase()} needed and acting on it.`
      : turningQ
        ? `The deeper subject here is responsibility in relationship: what ${turningQ} showed you about another person’s need and how you changed your response.`
        : actor
          ? `At its core, this essay is about responsibility in relationship: understanding what ${actor.toLowerCase()} needed and acting on it.`
          : 'Under the scene, this essay is really about responsibility in relationship: understanding another person’s need and acting on it.',
""",
1
)

s = s.replace(
"""    reflectionQ
      ? `This essay is about interpretation change: what you understood at ${reflectionQ} and the behavior it changed.`
      : 'This essay is about interpretation change and the behavior it changed in a visible way.',
""",
"""    reflectionQ
      ? `The essay becomes about interpretation change: what you understood at ${reflectionQ} and the behavior it changed.`
      : 'The essay becomes about interpretation change and the behavior it changed in a visible way.',
""",
1
)

s = s.replace(
"""          ][Math.abs((runnerUpCandidate.candidate_id || '').split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],
""",
"""          ][Math.abs(`${runnerUpCandidate.candidate_id || ''}:${runnerUpCandidate.hinge_span || ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],
""",
1
)

s = s.replace(
"""          ][Math.abs(((selectedCandidate?.candidate_id ?? 'selected')).split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],
""",
"""          ][Math.abs(`${selectedCandidate?.candidate_id ?? 'selected'}:${selectedCandidate?.hinge_span ?? ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],
""",
1
)

p.write_text(s)
print('patched runtime surface strings v2')
