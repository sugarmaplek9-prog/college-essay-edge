from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-holdout-v2.mjs')
s = p.read_text()
old = """async function waitForReflectingLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    if (!main) return false;
    const txt = (main.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!txt || /Reading what you shared/i.test(txt)) return false;
    return /YOUR DIRECTION|THE DIRECTION WE RECOMMEND FIRST|WHAT THE SYSTEM IS SEEING|WHY THIS DIRECTION/i.test(txt);
  }, { timeout: 20000 });
}
"""
new = """async function waitForReflectingLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    if (!main) return false;
    const txt = (main.textContent || '').replace(/\\s+/g, ' ').trim();
    if (!txt || /Reading what you shared/i.test(txt)) return false;
    if (/YOUR DIRECTION|THE DIRECTION WE RECOMMEND FIRST|WHAT THE SYSTEM IS SEEING|WHY THIS DIRECTION/i.test(txt)) return true;
    return txt.length > 260;
  }, { timeout: 30000 });
}
"""
if old not in s:
    raise SystemExit('target waitForReflectingLoaded block not found')
p.write_text(s.replace(old, new, 1))
print('patched waitForReflectingLoaded')
