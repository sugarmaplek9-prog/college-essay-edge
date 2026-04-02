import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'https://college-essay-edge.vercel.app';
const input = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
const submitName = /Find the strongest direction|Show me possible directions|See what\'s here/i;

const genericFallbackPatterns = [
  /the direction is the specific moment your choice changed the story/i,
  /the best angle stays anchored in the point where your perspective or behavior clearly shifted/i,
];

const sourceAnchorPatterns = [
  /nurse/i,
  /hospital/i,
  /getting in the way/i,
  /"[^"]{8,}"/,
];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });

  try {
    await page.goto(base + '/start', { waitUntil: 'networkidle' });
    await page.getByLabel('Your notes or draft').fill(input);
    await page.getByRole('button', { name: submitName }).click();
    await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 25000 });

    if (page.url().includes('/reflecting')) {
      const btn = page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i });
      if (await btn.first().isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForURL('**/start/direction', { timeout: 25000 });
      }
    }

    const heading = await page.getByRole('heading', { level: 1 }).first().textContent().catch(() => null);
    const body = (await page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();

    const hasGenericFallback = genericFallbackPatterns.some((p) => p.test(body) || (heading ? p.test(heading) : false));
    const anchorHits = sourceAnchorPatterns.filter((p) => p.test(body) || (heading ? p.test(heading) : false)).length;

    const result = {
      base,
      final_url: page.url(),
      heading,
      anchor_hits: anchorHits,
      has_source_anchor_signal: anchorHits >= 2,
      has_generic_fallback_phrase: hasGenericFallback,
      pass_specificity_shift: anchorHits >= 2 && !hasGenericFallback,
      body_excerpt: body.slice(0, 700),
    };

    console.log(JSON.stringify(result, null, 2));

    if (!result.pass_specificity_shift) {
      process.exitCode = 1;
    }
  } finally {
    await page.close();
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
