import json
from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/package.json')
data = json.loads(path.read_text())
scripts = data.setdefault('scripts', {})
scripts['eval:page3:rc'] = 'node scripts/page3-release-candidate-validation.mjs'
scripts['eval:page3:rc:freeze'] = 'node scripts/freeze-page3-rc-baseline.mjs'
scripts['eval:page3:controlled'] = 'node scripts/page3-controlled-testing-lane.mjs'
path.write_text(json.dumps(data, indent=2) + '\n')
print('rewrote package.json with page3 rc scripts')
