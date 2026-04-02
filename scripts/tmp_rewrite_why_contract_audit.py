from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-why-contract-audit-v2.mjs')
text = path.read_text()
text = text.replace("const DIRECTION_PATH = path.join(ROOT, 'src', 'lib', 'fm', 'direction.ts');\nconst OUT_DIR = path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');", "const DIRECTION_PATH = process.env.DIRECTION_PATH\n  ? path.resolve(ROOT, process.env.DIRECTION_PATH)\n  : path.join(ROOT, 'src', 'lib', 'fm', 'direction.ts');\nconst OUT_DIR = process.env.OUT_DIR\n  ? path.resolve(ROOT, process.env.OUT_DIR)\n  : path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');")
needle = "const md = [\n"
if 'fs.mkdirSync(OUT_DIR, { recursive: true });' not in text:
    text = text.replace(needle, "fs.mkdirSync(OUT_DIR, { recursive: true });\n\n" + needle)
path.write_text(text)
print('rewrote page3-why-contract-audit-v2.mjs')
