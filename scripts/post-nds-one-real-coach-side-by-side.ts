import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const PRODUCTION_URL = process.env.PRODUCTION_URL ?? 'https://college-essay-edge.vercel.app';
const CANDIDATE_URL = process.env.CANDIDATE_URL ?? 'http://127.0.0.1:3000';
const OUT_DIR = path.join(process.cwd(), 'evaluation_outputs', 'post_nds_one_real_coach_side_by_side_v1');
const PACKET_PATH = path.join(process.cwd(), 'evaluation_outputs', 'POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_V1.json');

type PacketCase = {
  case_id: string;
  title: string;
  session_payload: {
    fm_intelligence: unknown;
    fm_case_state: unknown;
    fm_product_mode: string;
  };
};

type Packet = { cases: PacketCase[] };

type FlowProbe = {
  base_url: string;
  direction_url: string;
  compare_url: string | null;
  opening_url: string | null;
  question_url: string | null;
  checks: {
    has_direction_coach_read: boolean;
    has_compare_cta: boolean;
    has_compare_coach_read: boolean;
    has_opening_coach_signal: boolean;
    has_question_opening_return_signal: boolean;
  };
  screenshots: {
    direction: string;
    compare?: string;
    opening?: string;
    question?: string;
  };
};

type CaseComparison = {
  case_id: string;
  title: string;
  production: FlowProbe;
  candidate: FlowProbe;
};

function loadPacket(): Packet {
  if (!fs.existsSync(PACKET_PATH)) {
    throw new Error(`Missing packet at ${PACKET_PATH}. Run post-nds-result-screen-human-clarity-packet.ts first.`);
  }
  return JSON.parse(fs.readFileSync(PACKET_PATH, 'utf-8')) as Packet;
}

async function runProbe(
  browser: Awaited<ReturnType<typeof chromium.launch>>,
  baseUrl: string,
  packetCase: PacketCase,
): Promise<FlowProbe> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await context.newPage();
  const envTag = baseUrl.includes('127.0.0.1') ? 'candidate' : 'production';
  try {
    await page.addInitScript((payload) => {
      window.sessionStorage.setItem('fm_intelligence', JSON.stringify(payload.fm_intelligence));
      window.sessionStorage.setItem('fm_case_state', JSON.stringify(payload.fm_case_state));
      window.sessionStorage.setItem('fm_product_mode', payload.fm_product_mode);
    }, packetCase.session_payload);

    await page.goto(baseUrl + '/start/direction', { waitUntil: 'networkidle' });
    const directionUrl = page.url();
    const directionShot = path.join(OUT_DIR, `${packetCase.case_id}-${envTag}-direction.png`);
    await page.screenshot({ path: directionShot, fullPage: true });

    const hasDirectionCoachRead = await page.getByText(/Coach read/i).first().isVisible().catch(() => false);
    const compareButton = page.getByRole('button', { name: /weaker version|compare/i }).first();
    const hasCompareCta = await compareButton.isVisible().catch(() => false);

    let compareUrl: string | null = null;
    let openingUrl: string | null = null;
    let questionUrl: string | null = null;
    let hasCompareCoachRead = false;
    let hasOpeningCoachSignal = false;
    let hasQuestionOpeningReturnSignal = false;
    let compareShot: string | undefined;
    let openingShot: string | undefined;
    let questionShot: string | undefined;

    if (hasCompareCta) {
      await compareButton.click();
      try {
        await page.waitForURL('**/start/compare', { timeout: 15000 });
        compareUrl = page.url();
        compareShot = path.join(OUT_DIR, `${packetCase.case_id}-${envTag}-compare.png`);
        await page.screenshot({ path: compareShot, fullPage: true });
        hasCompareCoachRead = await page.getByText(/Coach comparison read|Coach verdict/i).first().isVisible().catch(() => false);
        await page.goto(baseUrl + '/start/direction', { waitUntil: 'networkidle' });
      } catch {
        // Keep compare checks as failed and continue; this reflects a product-flow issue.
      }
    }

    const draftNow = page.getByRole('button', { name: /Draft my opening now/i }).first();
    if (await draftNow.isVisible().catch(() => false)) {
      await draftNow.click();
      await page.waitForURL(/\/start\/(opening|question)|\/start\?entry=draft/, { timeout: 15000 });

      if (page.url().includes('/start/opening')) {
        openingUrl = page.url();
        openingShot = path.join(OUT_DIR, `${packetCase.case_id}-${envTag}-opening.png`);
        await page.screenshot({ path: openingShot, fullPage: true });
        hasOpeningCoachSignal = await page.getByText(/Coach sequence|Coach next move|What I am stopping you from doing/i).first().isVisible().catch(() => false);

        const lessVague = page.getByRole('button', { name: /Make this less vague/i }).first();
        if (await lessVague.isVisible().catch(() => false)) {
          await lessVague.click();
          try {
            await page.waitForURL('**/start/question', { timeout: 15000 });
            questionUrl = page.url();
            questionShot = path.join(OUT_DIR, `${packetCase.case_id}-${envTag}-question.png`);
            await page.screenshot({ path: questionShot, fullPage: true });
            hasQuestionOpeningReturnSignal = await page.getByText(/already know the direction|narrow correction|Last correction/i).first().isVisible().catch(() => false);
          } catch {
            // Keep false check values and continue the run; this is a product failure, not a harness failure.
          }
        }
      }
    }

    return {
      base_url: baseUrl,
      direction_url: directionUrl,
      compare_url: compareUrl,
      opening_url: openingUrl,
      question_url: questionUrl,
      checks: {
        has_direction_coach_read: hasDirectionCoachRead,
        has_compare_cta: hasCompareCta,
        has_compare_coach_read: hasCompareCoachRead,
        has_opening_coach_signal: hasOpeningCoachSignal,
        has_question_opening_return_signal: hasQuestionOpeningReturnSignal,
      },
      screenshots: {
        direction: path.relative(process.cwd(), directionShot),
        compare: compareShot ? path.relative(process.cwd(), compareShot) : undefined,
        opening: openingShot ? path.relative(process.cwd(), openingShot) : undefined,
        question: questionShot ? path.relative(process.cwd(), questionShot) : undefined,
      },
    };
  } finally {
    await page.close();
    await context.close();
  }
}

function passScore(probe: FlowProbe): number {
  const values = Object.values(probe.checks);
  return values.filter(Boolean).length;
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const packet = loadPacket();
  const cases = packet.cases.slice(0, 3);
  const browser = await chromium.launch({ headless: true });

  try {
    const comparisons: CaseComparison[] = [];

    for (const item of cases) {
      const production = await runProbe(browser, PRODUCTION_URL, item);
      const candidate = await runProbe(browser, CANDIDATE_URL, item);
      comparisons.push({
        case_id: item.case_id,
        title: item.title,
        production,
        candidate,
      });
    }

    const summary = {
      generated_at: new Date().toISOString(),
      production_url: PRODUCTION_URL,
      candidate_url: CANDIDATE_URL,
      criteria: [
        'direction has coach framing',
        'compare has coach analysis framing',
        'opening has coach sequence framing',
        'opening->question preserves continuity cues',
      ],
      comparisons,
      decision: comparisons.every((entry) => passScore(entry.candidate) >= 4)
        ? 'PASS_CANDIDATE_READY_FOR_HUMAN_REVIEW'
        : 'HOLD_NEEDS_FIXES',
    };

    const jsonPath = path.join(OUT_DIR, 'summary.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf-8');

    const mdLines = [
      '# POST_NDS_ONE_REAL_COACH_SIDE_BY_SIDE_V1',
      '',
      `- Generated at: ${summary.generated_at}`,
      `- Production URL: ${PRODUCTION_URL}`,
      `- Candidate URL: ${CANDIDATE_URL}`,
      `- Decision: ${summary.decision}`,
      '',
      '## Case-by-case score (checks passed out of 5)',
      '',
      '| Case | Production | Candidate |',
      '| --- | ---: | ---: |',
      ...comparisons.map((entry) => `| ${entry.case_id} | ${passScore(entry.production)} | ${passScore(entry.candidate)} |`),
      '',
      '## Required checks',
      '- direction has coach framing',
      '- compare has coach analysis framing',
      '- opening has coach sequence framing',
      '- opening→question continuity cue is visible',
      '',
      '## Artifacts',
      `- JSON summary: ${path.relative(process.cwd(), jsonPath)}`,
      `- Screenshot folder: ${path.relative(process.cwd(), OUT_DIR)}`,
      '',
    ];

    const mdPath = path.join(OUT_DIR, 'POST_NDS_ONE_REAL_COACH_SIDE_BY_SIDE_V1.md');
    fs.writeFileSync(mdPath, mdLines.join('\n'), 'utf-8');

    console.log(JSON.stringify({ jsonPath, mdPath, decision: summary.decision, cases: comparisons.length }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
