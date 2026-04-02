import { chromium } from '@playwright/test';

const urls = [
  'https://college-essay-edge.vercel.app',
  'https://college-essay-edge-g311wfuqb-college-edge.vercel.app',
];

const input = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
const submitName = /Find the strongest direction|Show me possible directions|See what\'s here/i;

const browser = await chromium.launch({ headless: true });
try {
  for (const base of urls) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
    try {
      await page.goto(base + '/start', { waitUntil: 'networkidle' });
      await page.getByLabel('Your notes or draft').fill(input);
      await page.getByRole('button', { name: submitName }).click();
      await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 25000 });

      const payload = {
        base,
        url: page.url(),
        h1: await page.getByRole('heading', { level: 1 }).first().textContent().catch(() => null),
        h2s: await page.getByRole('heading').allTextContents().catch(() => []),
        buttons: (await page.locator('button').allTextContents().catch(() => []))
          .map((text) => text.replace(/\s+/g, ' ').trim())
          .filter(Boolean),
        body: (await page.locator('main').innerText().catch(() => ''))
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 1000),
      };

      console.log(JSON.stringify(payload, null, 2));
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
