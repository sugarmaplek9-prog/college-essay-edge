import re

with open('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-openai-only-headtohead.mjs', encoding='utf-8') as f:
    frozen = f.read()

with open('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-holdout-v1.mjs', encoding='utf-8') as f:
    holdout = f.read()

def check(label, content):
    m = re.search(r'filter\(\(text\) => /(.*?)/\.test', content)
    if not m:
        print(label, ': regex not found')
        return
    pattern = m.group(1)
    print(label, 'regex:', repr(pattern))
    for i, c in enumerate(pattern):
        code = ord(c)
        if code > 127 or code == 34:
            print('  pos', i, '= U+' + format(code, '04X'), repr(c))

check('FROZEN', frozen)
check('HOLDOUT', holdout)

# Check EvidenceCard
with open('/Volumes/TOSHIBA EXT/College Essay/src/components/firstMinute/InteriorFlowSystem.tsx', encoding='utf-8') as f:
    ev = f.read()

ev_idx = ev.find('EvidenceCard')
ev_snippet = ev[ev_idx:ev_idx+600]
print('\nEvidenceCard snippet chars:')
for i, c in enumerate(ev_snippet):
    code = ord(c)
    if code > 127:
        print('  pos', i, '= U+' + format(code, '04X'), repr(c))

# ldquo/rdquo check
print('\n&ldquo; found:', '&ldquo;' in ev)
print('&rdquo; found:', '&rdquo;' in ev)
