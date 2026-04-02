import { chromium } from '@playwright/test';

const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-3ygy69od5-college-edge.vercel.app';

const cases = [
  {
    case_id: 'HV2_01',
    raw_input:
      'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.',
  },
  {
    case_id: 'HV2_10',
    raw_input:
      'During regionals our robot failed inspection twice, and I told the team to remove an autonomous feature to pass on time. Another programmer argued we should keep it and risk a late match. I overruled him. We qualified but lost our quarterfinal because of manual control mistakes. After the event he said my call protected schedule but ignored our actual strength. I now frame emergency decisions as tradeoffs out loud before choosing.',
  },
  {
    case_id: 'HV2_12',
    raw_input:
      'I used to think translating for my grandparents at government offices was just a family duty. At one appointment the clerk spoke quickly and I summarized instead of translating line by line so we could finish faster. My grandfather signed a form he did not understand. We had to return the next week to reverse it. Since then I ask officials to pause and I translate every instruction fully even when the line gets longer. That day changed what responsibility sounds like to me.',
  },
];

function linesBetween(text: string, startLabel: string, endLabels: string[]): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const start = lines.findIndex((line) => line === startLabel);
  if (start === -1) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (endLabels.includes(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const submitName = /Find the strongest direction|Show me possible directions|See what's here/i;
  const results = [];

  for (const testCase of cases) {
    await page.goto(base + '/start', { waitUntil: 'networkidle' });
    await page.getByLabel('Your notes or draft').fill(testCase.raw_input);
    await page.getByRole('button', { name: submitName }).click();
    await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 30000 });

    if (page.url().includes('/reflecting')) {
      await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction/i }).click();
      await page.waitForURL('**/start/direction', { timeout: 30000 });
    }

    const directionText = await page.locator('body').innerText();
    const decisionLines = linesBetween(directionText, 'The decision', ['Why this wins']);
    const whyThisWinsLines = linesBetween(directionText, 'Why this wins', ['Draft the opening this way', 'Support from your notes', 'Extra strategy notes']);

    await page.getByRole('button', { name: /Build from this direction|Show me the strongest angle|Show me the direction|Draft the opening this way/i }).click();
    await page.waitForURL('**/start/opening', { timeout: 30000 });

    const openingText = await page.locator('body').innerText();
    const openingIntroLines = linesBetween(openingText, 'Draft the opening', ['What this opening needs']);
    const openingNeedsLines = linesBetween(openingText, 'What this opening needs', ['Draft this opening']);
    const opensUpLines = linesBetween(openingText, 'What this opens up', ['Do not flatten it']);
    const flattenWarnings = linesBetween(openingText, 'Do not flatten it', ['Save this opening', 'Get one question to sharpen it']);

    results.push({
      case_id: testCase.case_id,
      direction_url: page.url(),
      decision: decisionLines,
      why_this_wins: whyThisWinsLines,
      opening_intro: openingIntroLines,
      opening_needs: openingNeedsLines,
      opening_opens_up: opensUpLines,
      opening_warnings: flattenWarnings,
    });
  }

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
