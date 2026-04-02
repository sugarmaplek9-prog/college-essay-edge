import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const base = 'https://college-essay-edge.vercel.app';

try {
  await page.goto(`${base}/start`, { waitUntil: 'networkidle' });
  await page.locator('textarea').fill(
    'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
  );
  await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).click();
  await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 20000 });
  console.log(`url=${page.url()}`);

  if (page.url().includes('/reflecting')) {
    const buttons = await page.getByRole('button').allTextContents();
    const body = (await page.locator('body').textContent()) ?? '';
    console.log(`reflecting_buttons=${JSON.stringify(buttons)}`);
    console.log(`reflecting_visible=${body.includes('Your direction')}`);
    await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
    await page.waitForURL('**/start/direction', { timeout: 20000 });
  }

  const body = (await page.locator('body').textContent()) ?? '';
  const headings = await page.getByRole('heading').allTextContents();
  console.log(`final_url=${page.url()}`);
  console.log(`direction_headings=${JSON.stringify(headings)}`);
  console.log(`direction_excerpt=${JSON.stringify(body.slice(0, 900))}`);
  for (const text of [
    'Build from this direction',
    'Why this wins',
    'Draft the opening this way',
    'What this opens up',
  ]) {
    console.log(`${text}=${body.includes(text)}`);
  }
} finally {
  await browser.close();
}
