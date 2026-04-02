import { chromium } from '@playwright/test';

const base = 'http://localhost:3302';
const rawInput = 'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

await page.goto(`${base}/start`, { waitUntil: 'networkidle' });
await page.getByLabel('Your notes or draft').fill(rawInput);
await page.getByRole('button', { name: /Find the strongest direction|See what's here|Show me possible directions/i }).click();
await page.waitForURL(/\/start\/(reflecting|direction|question)/, { timeout: 30000 });

if (page.url().includes('/reflecting')) {
  await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
  await page.waitForURL('**/start/direction', { timeout: 30000 });
}

const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim();
console.log(`route=${new URL(page.url()).pathname}`);
console.log(`has_the_decision=${body.includes('The decision')}`);
console.log(`has_recommended_angle=${body.includes('RECOMMENDED ANGLE')}`);
console.log(`has_next_move=${body.includes('Next move')}`);
console.log(`has_why_this_wins=${body.includes('Why this wins')}`);
console.log(`has_build_opening_from_evidence=${body.includes('Build the opening from this evidence')}`);
console.log(`has_truncated_while_the=${body.includes('while the…')}`);
console.log(`heading=${(await page.locator('h1').first().innerText()).trim()}`);

await browser.close();
