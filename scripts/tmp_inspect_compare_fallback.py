from pathlib import Path

t = Path('src/lib/fm/canonicalPage3Payload.ts').read_text()
print('cleanCompareOptionLabel', 'cleanCompareOptionLabel' in t)
print('extractCompareOptionLabels', 'extractCompareOptionLabels' in t)
print('newWhy', 'This is a compare decision, not a final topic win yet' in t)
print('oldWhy', 'Angle A currently has this best support' in t)
