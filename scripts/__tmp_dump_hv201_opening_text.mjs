import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-qwru3vak8-college-edge.vercel.app';
const rawInput = 'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(base + '/start', { waitUntil: 'networkidle' });
await page.getByLabel('Your notes or draft').fill(rawInput);
await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).click();
await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 30000 });

if (page.url().includes('/reflecting')) {
  await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
  await page.waitForURL('**/start/direction', { timeout: 30000 });
}

await page.getByRole('button', { name: /Draft my opening now/i }).click();
await page.waitForURL('**/start/opening', { timeout: 30000 });
await page.waitForSelector('text=What this opening needs', { timeout: 30000 });

const bodyText = await page.locator('body').innerText();
await browser.close();

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_hv201_opening_text.txt');
fs.writeFileSync(outPath, bodyText);
console.log(JSON.stringify({ outPath, base }, null, 2));
