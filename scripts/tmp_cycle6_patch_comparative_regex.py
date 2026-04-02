from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = p.read_text()
old = r"return /\b(stronger|beats|rather than|instead of|compared|vs\.?|easier to trust)\b/i.test(text);"
new = r"return /\b(stronger|beats|rather than|instead of|compared|vs\.?|easier to trust|earns trust|wins because)\b/i.test(text);"
if old not in text:
    raise SystemExit('target regex not found')
text = text.replace(old, new, 1)
p.write_text(text)
print('patched comparative regex')
