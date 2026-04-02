from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text()

text = text.replace(
"""  const comparativeLeads = [
    'Choose this over the weaker version because',
    'This beats the alternate read because',
    'Pick this direction because',
    'This is stronger than the fallback because',
    'Compared with the weaker path, this works because',
  ] as const;""",
"""  const comparativeLeads = [
    'Choose this over the weaker version because',
    'This beats the alternate read because',
    'Pick this direction because',
    'This is stronger than the fallback because',
    'Compared with the weaker path, this works because',
    'From a drafting lens, choose this because',
    'This is the clearer coaching path because',
    'If your goal is a writable claim, pick this because',
  ] as const;"""
)

text = text.replace(
"""  const stem = normalized.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim|Center your essay on|Write this around)\\s*/i, '').trim();""",
"""  const stem = normalized.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim|Center your essay on|Write this around|This essay is about|The essay is about|Your essay is really about|The heart of this essay is|The essay is fundamentally about)\\s*/i, '').trim();"""
)

text = text.replace(
"""  const starters = [
    'Your essay should show',
    'Make your main claim that',
    'Center your essay on',
    'Show how',
    'Write this around',
    'Argue that',
    'At the center, show',
    'Lead with the claim that',
  ] as const;
  const lead = starters[(stableTextHash(stem) + seedValue) % starters.length];

  const needRewrite = !hasPlainClaimSignal(normalized)
    || (TAXONOMY_FORWARD_PATTERN.test(normalized) && !/\\b(moment|decision|choice|result|what changed|what you changed)\\b/i.test(normalized));""",
"""  const starters = [
    'Your essay should show',
    'Make your main claim that',
    'Center your essay on',
    'Show how',
    'Write this around',
    'Argue that',
    'At the center, show',
    'Lead with the claim that',
    'Frame the essay around',
    'Build the draft around',
  ] as const;
  const lead = starters[(stableTextHash(`${normalized}:${stem}`) + seedValue) % starters.length];

  const startsAsAbout = /^(this essay is about|the essay is about|your essay is really about|the heart of this essay is|the essay is fundamentally about)\\b/i.test(normalized);
  const needRewrite = startsAsAbout
    || !hasPlainClaimSignal(normalized)
    || (TAXONOMY_FORWARD_PATTERN.test(normalized) && !/\\b(moment|decision|choice|result|what changed|what you changed)\\b/i.test(normalized));"""
)

path.write_text(text)
print('ok')
