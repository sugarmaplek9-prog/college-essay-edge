import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-2znydb2qi-college-edge.vercel.app';

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

function cleanLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function normalizeLabel(value) {
  return value.trim().toUpperCase();
}

function linesBetween(lines, startLabel, endLabels) {
  const normalizedStart = normalizeLabel(startLabel);
  const normalizedEnds = endLabels.map((label) => normalizeLabel(label));
  const start = lines.findIndex((line) => normalizeLabel(line) === normalizedStart);
  if (start === -1) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (normalizedEnds.includes(normalizeLabel(lines[i]))) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end);
}

function removeStepNumbers(lines) {
  return lines.filter((line) => !/^\d+$/.test(line));
}

async function runCase(browser, testCase) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const submitName = /Find the strongest direction|Show me possible directions|See what's here/i;

  await page.goto(base + '/start', { waitUntil: 'domcontentloaded' });
  const textarea = page.locator('textarea[aria-label="Your notes or draft"]');
  await textarea.waitFor({ timeout: 30000 });
  await textarea.click();
  await page.keyboard.insertText(testCase.raw_input);
  await page.waitForFunction(() => {
    const button = document.querySelector('button[type="submit"]');
    return Boolean(button && !button.disabled);
  }, { timeout: 30000 });
  await page.getByRole('button', { name: submitName }).click();
  await page.waitForURL(/\/start\/(reflecting|direction)/, { timeout: 45000 });

  if (page.url().includes('/reflecting')) {
    await page.getByRole('button', { name: 'Build from this direction' }).click();
    await page.waitForURL('**/start/direction', { timeout: 30000 });
  }

  await page.waitForSelector('text=Why this wins', { timeout: 30000 });
  const directionLines = cleanLines(await page.locator('body').innerText());
  const decisionBlock = linesBetween(directionLines, 'THE DECISION', ['NEXT MOVE']);
  const nextMoveBlock = linesBetween(directionLines, 'NEXT MOVE', ['WHY THIS WINS']);
  const whyBlock = linesBetween(directionLines, 'WHY THIS WINS', ['BUILD THE OPENING FROM THIS EVIDENCE', 'SUPPORT FROM YOUR NOTES', 'EXTRA STRATEGY NOTES']);

  const openingButton = page.getByRole('button', { name: /Draft my opening now|Draft the opening|Build from this direction|Show me the strongest angle|Show me the direction/i }).first();
  await openingButton.click();
  await page.waitForURL('**/start/opening', { timeout: 30000 });
  await page.waitForSelector('text=What this opening needs', { timeout: 30000 });

  const openingLines = cleanLines(await page.locator('body').innerText());
  const openingIntro = linesBetween(openingLines, 'DRAFT THE OPENING', ['WHAT THIS OPENING NEEDS']);
  const openingNeeds = linesBetween(openingLines, 'WHAT THIS OPENING NEEDS', ['BUILD FROM THE EVIDENCE', 'DRAFT THIS OPENING']);
  const draftThisOpening = removeStepNumbers(linesBetween(openingLines, 'BUILD FROM THE EVIDENCE', ['WHAT TO PROVE NEXT']));
  const opensUp = linesBetween(openingLines, 'WHAT TO PROVE NEXT', ['DO NOT FLATTEN IT']);
  const warnings = linesBetween(openingLines, 'DO NOT FLATTEN IT', ['SAVE THIS OPENING', 'GET ONE QUESTION TO SHARPEN IT']);

  await context.close();

  return {
    case_id: testCase.case_id,
    preview_url: base,
    page3: {
      recommendation: decisionBlock[0] ?? null,
      why_this_wins: decisionBlock[1] ?? null,
      next_move: nextMoveBlock,
      compare_block: whyBlock,
    },
    page4: {
      intro: openingIntro,
      guidance: draftThisOpening,
      opens_up: opensUp,
      warnings,
      opening_needs: openingNeeds,
    },
  };
}

const browser = await chromium.launch({ headless: true });
const results = [];
for (const testCase of cases) {
  try {
    results.push(await runCase(browser, testCase));
  } catch (error) {
    results.push({
      case_id: testCase.case_id,
      preview_url: base,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
await browser.close();

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_served_strong_cases.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ outPath, base, caseCount: results.length }, null, 2));
