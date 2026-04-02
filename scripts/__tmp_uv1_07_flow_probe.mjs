import { chromium } from '@playwright/test';

const rawNotes = "As first violin, I thought leading meant fixing wrong notes in rehearsal by playing louder and cleaner. Our section still entered late in the same passage at the concert run-through. I recorded rehearsal and noticed my bow cues were too subtle for players behind me. I switched to clear count-ins plus eye contact before entrances. The section locked in, and I redefined leadership as making my signal usable for others.";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) console.log('NAV', page.url());
});
page.on('console', (msg) => console.log('BROWSER', msg.type(), msg.text()));
page.on('pageerror', (err) => console.log('PAGEERROR', err.message));

try {
  await page.goto('http://127.0.0.1:3311/start', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('URL_AFTER_GOTO', page.url());
  await page.getByLabel('Your notes or draft').fill(rawNotes);
  await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
  try {
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 35000 });
    console.log('URL_AFTER_WAIT', page.url());
  } catch (error) {
    console.log('WAIT_FOR_URL_FAILED', String(error));
    console.log('URL_ON_FAILURE', page.url());
    const mainText = await page.locator('main').innerText().catch(() => '');
    console.log('MAIN_TEXT_START', mainText.slice(0, 1200));
  }
} finally {
  await browser.close();
}
