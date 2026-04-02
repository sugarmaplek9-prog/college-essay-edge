import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-2znydb2qi-college-edge.vercel.app';
const rawInput = 'During regionals our robot failed inspection twice, and I told the team to remove an autonomous feature to pass on time. Another programmer argued we should keep it and risk a late match. I overruled him. We qualified but lost our quarterfinal because of manual control mistakes. After the event he said my call protected schedule but ignored our actual strength. I now frame emergency decisions as tradeoffs out loud before choosing.';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(base + '/start', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('textarea[aria-label="Your notes or draft"]', { timeout: 30000 });
await page.getByLabel('Your notes or draft').fill(rawInput);
await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).click();
await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 45000 });
if (page.url().includes('/reflecting')) {
  await page.getByRole('button', { name: 'Build from this direction' }).click();
  await page.waitForURL('**/start/direction', { timeout: 30000 });
}
await page.waitForTimeout(1500);
const buttons = await page.getByRole('button').allTextContents();
const body = await page.locator('body').innerText();
await browser.close();
const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_served_direction_buttons.json');
fs.writeFileSync(outPath, JSON.stringify({ base, url: page.url(), buttons, body }, null, 2));
console.log(JSON.stringify({ outPath, base }, null, 2));
