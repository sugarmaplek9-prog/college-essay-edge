import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.env.PRODUCT_URL ?? 'http://127.0.0.1:3311';
const targets = [
  ['scripts/data/page3-holdout-v2-cases.json', 'HV2_11'],
  ['scripts/data/page3-holdout-v3-cases.json', 'HV3_11'],
  ['scripts/data/page3-holdout-v4-cases.json', 'HV4_11'],
];

const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();

async function waitForDirectionLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    const h1 = document.querySelector('h1');
    if (!main || !h1) return false;
    const mainTxt = (main.textContent || '').replace(/\s+/g, ' ').trim();
    const h1Txt = (h1.textContent || '').trim();
    if (!h1Txt || /Finding the strongest thread/i.test(mainTxt)) return false;
    return /Build from this direction|Recommended angle|Why this wins|Why this angle works/i.test(mainTxt);
  }, { timeout: 20000 });
}

async function waitForReflectingLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    if (!main) return false;
    const txt = (main.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt || /Reading what you shared/i.test(txt)) return false;
    if (/YOUR DIRECTION|THE DIRECTION WE RECOMMEND FIRST|WHAT THE SYSTEM IS SEEING|WHY THIS DIRECTION/i.test(txt)) return true;
    return txt.length > 260;
  }, { timeout: 30000 });
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const [relPath, caseId] of targets) {
  const filePath = path.join(process.cwd(), relPath);
  const cases = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const row = cases.find((entry) => entry.case_id === caseId);
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  try {
    await page.goto(`${baseUrl}/start`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.getByLabel('Your notes or draft').fill(row.raw_notes);
    await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });

    if (page.url().includes('/start/reflecting')) {
      await waitForReflectingLoaded(page);
      const button = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        await page.waitForURL('**/start/direction', { timeout: 15000 });
      }
    }

    if (page.url().includes('/start/direction')) {
      await waitForDirectionLoaded(page);
    }

    const packet = await page.evaluate(() => {
      try {
        const raw = sessionStorage.getItem('fm_canonical_page3_payload');
        return raw ? JSON.parse(raw)?.recommendation_packet : null;
      } catch {
        return null;
      }
    });

    results.push({
      case_id: caseId,
      title: row.title,
      final_url: page.url(),
      displayed_recommendation: clean(packet?.displayed_recommendation || ''),
      why_this_direction: clean(packet?.why_this_direction || ''),
      essay_about: clean(packet?.essay_about || ''),
      stronger_read: clean(packet?.stronger_read || ''),
    });
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
