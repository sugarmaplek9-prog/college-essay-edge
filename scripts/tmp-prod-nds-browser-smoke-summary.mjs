import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'prod_nds_browser_smoke_post1820_summary.json');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const base = 'https://college-essay-edge.vercel.app';

const summary = {
  base,
  started_at: new Date().toISOString(),
  steps: {},
};

try {
  await page.goto(`${base}/start`, { waitUntil: 'networkidle' });
  summary.steps.start_url = page.url();
  summary.steps.start_buttons = await page.getByRole('button').allTextContents();
  await page.locator('textarea').fill(
    'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
  );
  await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).click();
  await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 20000 });
  summary.steps.after_submit_url = page.url();

  if (page.url().includes('/reflecting')) {
    summary.steps.reflecting_buttons = await page.getByRole('button').allTextContents();
    summary.steps.reflecting_excerpt = ((await page.locator('body').textContent()) ?? '').slice(0, 700);
    await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
    await page.waitForURL('**/start/direction', { timeout: 20000 });
  }

  const body = (await page.locator('body').textContent()) ?? '';
  summary.steps.final_url = page.url();
  summary.steps.direction_headings = await page.getByRole('heading').allTextContents();
  summary.steps.direction_excerpt = body.slice(0, 1200);
  summary.steps.section_presence = Object.fromEntries(
    [
      'Build from this direction',
      'Why this wins',
      'Draft the opening this way',
      'What this opens up',
    ].map((text) => [text, body.includes(text)]),
  );
} catch (error) {
  summary.error = String(error instanceof Error ? error.stack || error.message : error);
} finally {
  await browser.close();
}

fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf-8');
console.log(outPath);
