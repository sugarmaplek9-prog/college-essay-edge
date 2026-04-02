import { chromium } from '@playwright/test';

const URLS = [
  'https://college-essay-edge.vercel.app',
  'https://college-essay-edge-g311wfuqb-college-edge.vercel.app',
];

const STRONG_INPUT = 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
const THIN_INPUT = 'I like sports but I am not great at them.';
const BLOCKED_INPUT = 'I am good at everything.';
const SUBMIT_NAME = /Find the strongest direction|Show me possible directions|See what\'s here/i;

const EXPECTED_SECTIONS = [
  'Why this direction works',
  'What to write first',
  'What not to do',
  'What to write right after the opening',
  'Your next move',
];

const EXPECTED_CTAS = [
  'Draft my opening now',
  'Help me sharpen the moment first',
  'Show me what the weaker version would do',
];

async function httpCheck(base, path, expected) {
  const response = await fetch(base + path, { redirect: 'manual' });
  const text = await response.text().catch(() => '');
  return {
    path,
    status: response.status,
    pass: expected(response.status),
    bodySnippet: text.replace(/\s+/g, ' ').slice(0, 140),
  };
}

async function hasExactText(page, text) {
  return page.getByText(text, { exact: true }).first().isVisible().catch(() => false);
}

async function runStrongFlow(page, base) {
  await page.goto(base + '/start', { waitUntil: 'networkidle' });
  await page.getByLabel('Your notes or draft').fill(STRONG_INPUT);
  await page.getByRole('button', { name: SUBMIT_NAME }).click();
  await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 25000 });

  const firstUrl = page.url();
  if (firstUrl.includes('/reflecting')) {
    const nextButton = page.getByRole('button', {
      name: /Build from this direction|Show me the strongest angle|Show me the direction/i,
    });
    if (await nextButton.first().isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForURL('**/start/direction', { timeout: 25000 });
    }
  }

  const finalUrl = page.url();
  const sectionsFound = [];
  for (const text of EXPECTED_SECTIONS) {
    if (await hasExactText(page, text)) sectionsFound.push(text);
  }

  const ctasFound = [];
  for (const text of EXPECTED_CTAS) {
    if (await page.getByRole('button', { name: text }).first().isVisible().catch(() => false)) {
      ctasFound.push(text);
    }
  }

  return {
    firstUrl,
    finalUrl,
    reachedDirection: finalUrl.includes('/start/direction'),
    sectionsFound,
    ctasFound,
    sectionsPass: EXPECTED_SECTIONS.every((text) => sectionsFound.includes(text)),
    ctasPass: EXPECTED_CTAS.every((text) => ctasFound.includes(text)),
    heading: await page.getByRole('heading', { level: 1 }).first().textContent().catch(() => null),
    buttons: (await page.locator('button').allTextContents().catch(() => []))
      .map((text) => text.replace(/\s+/g, ' ').trim())
      .filter(Boolean),
    bodyExcerpt: (await page.locator('main').innerText().catch(() => ''))
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500),
  };
}

async function runRouteCheck(page, base, input, expectedPattern) {
  await page.goto(base + '/start', { waitUntil: 'networkidle' });
  await page.getByLabel('Your notes or draft').fill(input);
  await page.getByRole('button', { name: SUBMIT_NAME }).click();
  await page.waitForURL(expectedPattern, { timeout: 25000 });
  return {
    finalUrl: page.url(),
    pass: expectedPattern.test ? expectedPattern.test(page.url()) : page.url().includes('/start/blocked'),
  };
}

async function runForBase(browser, base) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  try {
    const http = [
      await httpCheck(base, '/', (status) => status === 200),
      await httpCheck(base, '/start', (status) => status === 200),
      await httpCheck(base, '/api/admin/real-input-corpus', (status) => status === 401 || status === 403),
      await httpCheck(base, '/evaluation_outputs/ric_human_proof_packet_v1.json', (status) => status === 404 || status === 401 || status === 403),
    ];

    const strong = await runStrongFlow(page, base);
    const thin = await runRouteCheck(page, base, THIN_INPUT, /\/start\/(question|blocked)/);
    const blocked = await runRouteCheck(page, base, BLOCKED_INPUT, /\/start\/blocked/);

    const pass = http.every((item) => item.pass)
      && strong.reachedDirection
      && strong.sectionsPass
      && strong.ctasPass
      && thin.pass
      && blocked.pass;

    return {
      base,
      pass,
      http,
      flow: {
        strong,
        thin,
        blocked,
      },
    };
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const base of URLS) {
    results.push(await runForBase(browser, base));
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
