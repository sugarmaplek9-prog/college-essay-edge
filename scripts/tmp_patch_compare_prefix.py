from pathlib import Path

p = Path('src/lib/fm/canonicalPage3Payload.ts')
t = p.read_text()
old = "      `Center your essay on ${optionA} and show one concrete decision plus immediate consequence before comparing anything else.`," 
new = "      `Choose ${optionA} as your lead angle and show one concrete decision plus immediate consequence before comparing anything else.`," 

if old not in t:
    raise SystemExit('target line not found')

p.write_text(t.replace(old, new, 1))
print('patched fallback compare prefix')
