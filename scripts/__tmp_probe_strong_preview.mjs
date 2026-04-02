import fs from 'node:fs';
import path from 'node:path';
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

function linesBetween(text, startLabel, endLabels) {
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

  const directionUrl = page.url();
  const directionText = await page.locator('body').innerText();
  const decisionLines = linesBetween(directionText, 'THE DECISION', ['NEXT MOVE']);
  const whyThisWinsLines = linesBetween(directionText, 'WHY THIS WINS', ['BUILD THE OPENING FROM THIS EVIDENCE', 'SUPPORT FROM YOUR NOTES', 'EXTRA STRATEGY NOTES']);

  await page.getByRole('button', { name: /Draft my opening now|Build from this direction|Show me the strongest angle|Show me the direction|Build the opening from this evidence/i }).click();
  await page.waitForURL('**/start/opening', { timeout: 30000 });

  const openingUrl = page.url();
  const openingText = await page.locator('body').innerText();
  const openingIntroLines = linesBetween(openingText, 'DRAFT THE OPENING', ['WHAT THIS OPENING NEEDS']);
  const openingNeedsLines = linesBetween(openingText, 'WHAT THIS OPENING NEEDS', ['BUILD FROM THE EVIDENCE', 'DRAFT THIS OPENING']);
  const opensUpLines = linesBetween(openingText, 'WHAT TO PROVE NEXT', ['DO NOT FLATTEN IT']);
  const flattenWarnings = linesBetween(openingText, 'DO NOT FLATTEN IT', ['SAVE THIS OPENING', 'GET ONE QUESTION TO SHARPEN IT', 'MAKE THIS SHARPER']);

  results.push({
    case_id: testCase.case_id,
    direction_url: directionUrl,
    opening_url: openingUrl,
    decision: decisionLines,
    why_this_wins: whyThisWinsLines,
    opening_intro: openingIntroLines,
    opening_needs: openingNeedsLines,
    opening_opens_up: opensUpLines,
    opening_warnings: flattenWarnings,
  });
}

await browser.close();

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_strong_preview_probe.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ outPath, caseCount: results.length, base }, null, 2));
