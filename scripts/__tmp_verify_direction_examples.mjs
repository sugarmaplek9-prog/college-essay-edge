import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const base = 'https://college-essay-edge.vercel.app';

await page.goto(base + '/start');
await page.getByLabel('Your notes or draft').fill(
  'I worked a weekend shift at the restaurant and got into an argument with my manager because I thought I was right. He sent me home, and during the drive back I realized I cared more about winning the point than solving the problem. The next morning I apologized and asked how to repair the trust.'
);
await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).click();
await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 20000 });

if (page.url().includes('/reflecting')) {
  await page.getByRole('button', { name: /strongest angle|direction/i }).click();
  await page.waitForURL('**/start/direction', { timeout: 20000 });
}

const exampleBlock = await page.getByText('Example based on your story').first().locator('..').textContent();
const startBlock = await page.getByText('Stronger start').locator('..').textContent();

console.log('example_block=' + exampleBlock);
console.log('start_block=' + startBlock);

await browser.close();
