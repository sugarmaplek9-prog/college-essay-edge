import { chromium } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'https://college-essay-edge.vercel.app';

async function main(): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });

  try {
    await page.goto(`${BASE_URL}/start`, { waitUntil: 'networkidle' });
    await page.getByLabel('Your notes or draft').fill(
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.'
    );
    await page.getByRole('button', { name: /show me possible directions/i }).click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 25000 });

    if (page.url().includes('/reflecting')) {
      await page.goto(`${BASE_URL}/start/direction`, { waitUntil: 'networkidle' });
    }

    const labels = [
      'Strongest direction',
      'Why this direction works',
      'What to write first',
      'What not to do',
      'What to write right after the opening',
      'If you feel stuck, answer this one question',
      'Your next move',
    ];

    const ctas = [
      'Draft my opening now',
      'Help me sharpen the moment first',
      'Show me what the weaker version would do',
    ];

    const labelsPresent: string[] = [];
    for (const label of labels) {
      if (await page.getByText(label, { exact: true }).first().isVisible().catch(() => false)) {
        labelsPresent.push(label);
      }
    }

    const ctasPresent: string[] = [];
    for (const cta of ctas) {
      if (await page.getByRole('button', { name: cta }).first().isVisible().catch(() => false)) {
        ctasPresent.push(cta);
      }
    }

    const reachedResultScreen = page.url().includes('/start/direction');
    const visibleImprovementConfirmed =
      labelsPresent.includes('Why this direction works') &&
      labelsPresent.includes('What to write first') &&
      labelsPresent.includes('What not to do') &&
      labelsPresent.includes('What to write right after the opening') &&
      ctasPresent.includes('Draft my opening now');

    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          finalUrl: page.url(),
          reachedResultScreen,
          labelsPresent,
          ctasPresent,
          visibleImprovementConfirmed,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
