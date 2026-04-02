import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const PRODUCT_URL = 'https://college-essay-edge.vercel.app';
const OUT_PATH = path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2_remediation', 'TMP_BROWSER_PROBE.json');

const CASES = [
  {
    case_id: 'HV2_03',
    raw_notes: 'I managed inventory for a weekend coffee kiosk fundraiser and still ran out of cups before noon. I thought the problem was volume, but when I reviewed receipts I saw we were overpouring because the cup stacks had mixed sizes. I rebuilt the prep system so volunteers checked size-color stickers before service and logged each refill. The next event sold more drinks with less waste. The embarrassing shortage turned into the first process I designed that other clubs asked to copy.',
  },
  {
    case_id: 'HV2_08',
    raw_notes: 'A freshman with a nut allergy sat at our table and skipped lunch three days in a row because the labels were inconsistent. I reported it once and was told food service was already reviewing labels. Two weeks later nothing changed. I gathered photos of mislabeled trays, wrote a short memo, and asked the vice principal to walk the line with me before first lunch. New color-coded signs were posted that week. I stopped treating escalation like overreaction.',
  },
  {
    case_id: 'HV2_11',
    raw_notes: 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.',
  },
];

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
    return /YOUR DIRECTION|THE DIRECTION WE RECOMMEND FIRST|WHAT THE SYSTEM IS SEEING|WHY THIS DIRECTION/i.test(txt) || txt.length > 260;
  }, { timeout: 30000 });
}

async function probeCase(browser, row) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  const routeTrace = [];

  try {
    await page.goto(`${PRODUCT_URL}/start`, { waitUntil: 'networkidle' });
    routeTrace.push(page.url());

    await page.getByLabel('Your notes or draft').fill(row.raw_notes);
    await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });
    routeTrace.push(page.url());

    if (page.url().includes('/start/reflecting')) {
      await waitForReflectingLoaded(page);
      const button = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        await page.waitForURL('**/start/direction', { timeout: 15000 });
        routeTrace.push(page.url());
      }
    } else if (page.url().includes('/start/direction')) {
      await waitForDirectionLoaded(page);
    } else if (page.url().includes('/start/question')) {
      await page.waitForLoadState('networkidle');
    }

    const session = await page.evaluate(() => ({
      product_mode: sessionStorage.getItem('fm_product_mode'),
      canonical: (() => {
        try {
          const raw = sessionStorage.getItem('fm_canonical_page3_payload');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })(),
      blank_page: (() => {
        try {
          const raw = sessionStorage.getItem('fm_blank_page_intake_payload');
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      })(),
    }));

    const mainText = await page.locator('main').innerText().catch(() => '');

    return {
      case_id: row.case_id,
      final_url: page.url(),
      route_trace: routeTrace,
      session,
      recommendation: session.canonical?.recommendation_packet?.displayed_recommendation ?? null,
      main_excerpt: mainText.slice(0, 800),
    };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });

try {
  const results = [];
  for (const row of CASES) {
    results.push(await probeCase(browser, row));
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
  console.log(OUT_PATH);
} finally {
  await browser.close();
}
