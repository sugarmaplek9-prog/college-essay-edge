/**
 * Routing diagnostic for the 5 holdout cases that never reached /start/direction.
 * Prints: final URL, API decision, API blocking, API signal fields.
 */
import { chromium } from '@playwright/test';

const BASE = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';

const CASES = [
  {
    id: 'HO_01',
    notes: 'I was the only person on the team who knew how to fix the memory leak in our codebase. I fixed it in ten minutes the first time it happened. The second time, a junior teammate was stuck on it for two days before I stepped in and fixed it again. My advisor asked why I had not taught her how to fix it. I did not have a good answer. I rewrote the documentation and ran a code review session the following week. I have not touched that bug since.',
  },
  {
    id: 'HO_02',
    notes: 'I ran a Saturday reading program for elementary kids. Attendance was good the first month. Then it dropped by half. I assumed the kids were just busy. A parent told me her daughter stopped coming because the books were too hard and she felt embarrassed in front of the older kids. I split the group by reading level the next week. Attendance came back. My original goal was to help kids love reading. I was doing the opposite.',
  },
  {
    id: 'HO_05',
    notes: 'I scored in the bottom third at the state math competition. I had prepared more than anyone I knew. After I got my score back I looked at every problem I missed. All of them required me to switch strategy mid-problem, which I had never practiced. I built a drill where you start a problem, stop after two minutes, explain in writing why your approach is failing, then try a different method. Twelve students at my school now use it.',
  },
  {
    id: 'HO_08',
    notes: "In ninth grade I was placed in ESL because of my last name even though I had spoken English my whole life. I asked the counselor to move me. She said she would look into it. I waited three weeks and nothing happened. I wrote a one-page document with my test scores and sat outside the counselor's office until she saw me. I was moved the same day. I did not understand at the time that I had just done something most kids in that class had never been able to do.",
  },
  {
    id: 'HO_11',
    notes: 'I play violin and I also captain the soccer team. Both have made me who I am. I am not sure which story to tell for college.',
  },
];

const browser = await chromium.launch({ headless: true });

for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Hit the API directly from Node for the raw decision
  let apiRes = {};
  try {
    const r = await fetch(`${BASE}/api/intake/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ raw_input: c.notes }),
    });
    apiRes = await r.json();
  } catch (e) {
    apiRes = { _error: String(e) };
  }

  // Then run through the actual UI flow
  await page.goto(`${BASE}/start`, { waitUntil: 'networkidle' });
  await page.getByLabel('Your notes or draft').fill(c.notes);
  await page
    .getByRole('button', {
      name: /Find the strongest direction|Show me possible directions|See what's here/i,
    })
    .first()
    .click();

  try {
    await page.waitForURL(/\/start\//, { timeout: 30000 });
  } catch {
    // may have stayed on /start
  }

  const url = page.url();
  const h1 = await page
    .getByRole('heading', { level: 1 })
    .first()
    .innerText()
    .catch(() => '');
  const body = (await page.locator('main').innerText().catch(() => ''))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);

  console.log(
    JSON.stringify(
      {
        id: c.id,
        final_url: url,
        h1,
        body_excerpt: body,
        api: apiRes,
      },
      null,
      2
    )
  );
  await page.close();
}

await browser.close();
