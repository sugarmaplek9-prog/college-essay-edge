from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
s = p.read_text()

old = """  const recommend = (
    candidate_id: string,
    family: RuntimeDirectionCandidate['family_type'],
    shellId: string,
    direction_line: string,
    why_this_direction: string,
    essay_about: string,
    next_move: string,
    whyFamily: RuntimeDirectionCandidate['why_family_type'],
    compareFamily: RuntimeDirectionCandidate['compare_family_type']
  ): RuntimeDirectionCandidate => ({
    candidate_id,
    family_type: family,
    recommendation_family: family,
    angle_type: family,
    surface_shell_id: shellId,
    shell_penalty_hits: [],
    why_family_type: whyFamily,
    compare_family_type: compareFamily,
    direction_line: normalizeSentence(direction_line),
    why_this_direction: normalizeSentence(why_this_direction),
    essay_about: normalizeSentence(essay_about),
    next_move: normalizeSentence(next_move),
    source_anchor_spans: anchors.slice(0, 4),
    hinge_span: hinge ? trimSnippet(hinge) : null,
  });
"""

new = """  const recommend = (
    candidate_id: string,
    family: RuntimeDirectionCandidate['family_type'],
    shellId: string,
    direction_line: string,
    why_this_direction: string,
    essay_about: string,
    next_move: string,
    whyFamily: RuntimeDirectionCandidate['why_family_type'],
    compareFamily: RuntimeDirectionCandidate['compare_family_type']
  ): RuntimeDirectionCandidate => {
    const seed = `${candidate_id}:${turningQ ?? ''}:${consequenceQ ?? ''}:${reflectionQ ?? ''}`;
    const seedValue = Math.abs(seed.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));

    const normalizedDirection = normalizeSentence(direction_line);
    const directionBody = normalizedDirection.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as)\\s*/i, '');
    const directionStarters = [
      'Center this essay on',
      'Make the claim that',
      'Show how',
      'Write this as',
      'Name the essay as',
    ] as const;

    const diversifiedDirection = family === 'relationship' && directionBody
      ? `${directionStarters[seedValue % directionStarters.length]} ${directionBody.charAt(0).toLowerCase()}${directionBody.slice(1)}`
      : normalizedDirection;

    return {
      candidate_id,
      family_type: family,
      recommendation_family: family,
      angle_type: family,
      surface_shell_id: shellId,
      shell_penalty_hits: [],
      why_family_type: whyFamily,
      compare_family_type: compareFamily,
      direction_line: diversifiedDirection,
      why_this_direction: normalizeSentence(why_this_direction),
      essay_about: normalizeSentence(essay_about),
      next_move: normalizeSentence(next_move),
      source_anchor_spans: anchors.slice(0, 4),
      hinge_span: hinge ? trimSnippet(hinge) : null,
    };
  };
"""

if old not in s:
    raise SystemExit('recommend block not found')

p.write_text(s.replace(old, new, 1))
print('patched recommend runtime diversity')
