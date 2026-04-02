from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = p.read_text()
old = """    const normalizedDirection = normalizeSentence(direction_line);
    const directionBody = normalizedDirection.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim)\s*/i, '');
    const directionStarters = [
      'Your essay should show',
      'Make your main claim',
      'Center your essay on',
      'Show how',
      'Write this around',
    ] as const;

    const diversifiedDirection = family === 'relationship' && directionBody
      ? `${directionStarters[seedValue % directionStarters.length]} ${directionBody.charAt(0).toLowerCase()}${directionBody.slice(1)}`
      : normalizedDirection;
"""
new = """    const normalizedDirection = normalizeSentence(direction_line);
    const directionBody = normalizedDirection.replace(/^(Center this essay on|Center your essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim|Argue that|Lead with the claim that|Frame the essay around|Build the draft around)\s*/i, '');
    const directionStarters = [
      'Your essay should show',
      'Make your main claim that',
      'Center your essay on',
      'Show how',
      'Write this around',
      'Argue that',
      'Lead with the claim that',
      'Frame the essay around',
    ] as const;

    const shouldDiversifyStarter = (family === 'relationship' || family === 'process' || family === 'contradiction') && directionBody;
    const diversifiedDirection = shouldDiversifyStarter
      ? `${directionStarters[seedValue % directionStarters.length]} ${directionBody.charAt(0).toLowerCase()}${directionBody.slice(1)}`
      : normalizedDirection;
"""
if old not in text:
    raise SystemExit('starter snippet missing')
text = text.replace(old, new, 1)
p.write_text(text)
print('patched starter diversification')
