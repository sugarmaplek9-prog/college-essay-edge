import { chromium } from '@playwright/test';

const rawNotes = "As first violin, I thought leading meant fixing wrong notes in rehearsal by playing louder and cleaner. Our section still entered late in the same passage at the concert run-through. I recorded rehearsal and noticed my bow cues were too subtle for players behind me. I switched to clear count-ins plus eye contact before entrances. The section locked in, and I redefined leadership as making my signal usable for others.";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
const t0 = Date.now();
const log = (label) => console.log(label, Date.now() - t0);
try {
  await page.goto('http://127.0.0.1:3311/start', { waitUntil: 'networkidle', timeout: 30000 });
  log('after_goto_ms');
  await page.getByLabel('Your notes or draft').fill(rawNotes);
  log('after_fill_ms');
  await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
  log('after_click_ms');
  await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 60000 });
  log('after_waitForURL_ms');
  console.log('final_url', page.url());
} finally {
  await browser.close();
}
