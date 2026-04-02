import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const PREVIEW_URL = 'https://college-essay-edge-f58wr6o4r-college-edge.vercel.app';
const PRODUCTION_URL = 'https://college-essay-edge.vercel.app';
const OUT_DIR = path.join(process.cwd(), 'evaluation_outputs', 'post_nds_preview_compare_v1');

type CaseInput = {
  id: string;
  label: string;
  raw_input: string;
};

type SmokeResult = {
  name: string;
  path: string;
  status: number;
  pass: boolean;
  note: string;
};

type FlowCapture = {
  base_url: string;
  final_url: string;
  screenshot_path: string;
  route_kind: 'direction' | 'question' | 'blocked' | 'unknown';
  heading: string | null;
  labels_present: string[];
  ctas_present: string[];
  body_excerpt: string;
};

type CaseComparison = {
  case_id: string;
  label: string;
  production: FlowCapture;
  preview: FlowCapture;
};

const CASES: CaseInput[] = [
  {
    id: 'svc_hospital',
    label: 'Strong service turning-point case',
    raw_input:
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
  },
  {
    id: 'debate_clarity',
    label: 'Clarity-through-concrete-scene case',
    raw_input:
      'At debate camp, my coach stopped my speech and told me I was hiding behind big words. I rewrote my case overnight around one concrete story and the room reacted differently the next day.',
  },
  {
    id: 'preschool_shift',
    label: 'Care over control case',
    raw_input:
      'While helping in a preschool classroom, I was lining up crayons and trying to keep the room organized when I noticed one child sitting quietly apart from everyone else. I stopped fussing over the room and sat beside her instead, and that changed what I thought care looked like.',
  },
];

const LABEL_CANDIDATES = [
  'Strongest direction',
  'What this essay is really about',
  'Why this direction works',
  'What to write first',
  'What not to do',
  'What to write right after the opening',
  'If you feel stuck, answer this one question',
  'Your next move',
  'Why this beats the obvious version',
  'How to structure it',
  'Best next move',
];

const CTA_CANDIDATES = [
  'Draft my opening now',
  'Draft the opening now',
  'Help me sharpen the moment first',
  'Show me what the weaker version would do',
  'Show me what a weak version would do',
  'Compare the alternatives',
  'Show me the strongest angle',
  'Show me the direction',
];

async function fetchSmoke(baseUrl: string): Promise<SmokeResult[]> {
  const targets = [
    {
      name: 'homepage',
      path: '/',
      check: (status: number) => status === 200,
      ok: '200 healthy render expected',
    },
    {
      name: 'start page',
      path: '/start',
      check: (status: number) => status === 200,
      ok: '200 healthy render expected',
    },
    {
      name: 'admin RIC unauth route',
      path: '/api/admin/real-input-corpus',
      check: (status: number) => status === 401 || status === 403,
      ok: '401/403 expected when unauthenticated',
    },
    {
      name: 'artifact path',
      path: '/evaluation_outputs/ric_human_proof_packet_v1.json',
      check: (status: number) => status === 404 || status === 401 || status === 403,
      ok: '404/blocked expected unless intentionally public',
    },
  ];

  const results: SmokeResult[] = [];
  for (const target of targets) {
    const res = await fetch(baseUrl + target.path, { redirect: 'manual' });
    results.push({
      name: target.name,
      path: target.path,
      status: res.status,
      pass: target.check(res.status),
      note: target.ok,
    });
  }
  return results;
}

async function runFlow(browser: Awaited<ReturnType<typeof chromium.launch>>, baseUrl: string, testCase: CaseInput): Promise<FlowCapture> {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
  try {
    await page.goto(baseUrl + '/start', { waitUntil: 'networkidle' });
    await page.getByLabel('Your notes or draft').fill(testCase.raw_input);
    await page.getByRole('button', { name: /show me possible directions|see what/i }).click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 25000 });

    if (page.url().includes('/reflecting')) {
      await page.goto(baseUrl + '/start/direction', { waitUntil: 'networkidle' });
    }

    const route_kind = page.url().includes('/start/direction')
      ? 'direction'
      : page.url().includes('/start/question')
      ? 'question'
      : page.url().includes('/start/blocked')
      ? 'blocked'
      : 'unknown';

    const labels_present: string[] = [];
    for (const label of LABEL_CANDIDATES) {
      if (await page.getByText(label, { exact: true }).first().isVisible().catch(() => false)) {
        labels_present.push(label);
      }
    }

    const ctas_present: string[] = [];
    for (const cta of CTA_CANDIDATES) {
      if (await page.getByRole('button', { name: cta }).first().isVisible().catch(() => false)) {
        ctas_present.push(cta);
      }
    }

    const heading = await page.getByRole('heading', { level: 1 }).first().textContent().catch(() => null);
    const body_excerpt = ((await page.locator('main').innerText().catch(() => '')).replace(/\s+/g, ' ').trim()).slice(0, 700);
    const fileName = `${testCase.id}-${baseUrl.includes('vercel.app') && baseUrl.includes('f58wr6o4r') ? 'preview' : baseUrl.includes('college-essay-edge.vercel.app') ? 'production' : 'local'}.png`;
    const screenshot_path = path.join(OUT_DIR, fileName);
    await page.screenshot({ path: screenshot_path, fullPage: true });

    return {
      base_url: baseUrl,
      final_url: page.url(),
      screenshot_path,
      route_kind,
      heading,
      labels_present,
      ctas_present,
      body_excerpt,
    };
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const previewSmoke = await fetchSmoke(PREVIEW_URL);
  const productionSmoke = await fetchSmoke(PRODUCTION_URL);

  const browser = await chromium.launch({ headless: true });
  const comparisons: CaseComparison[] = [];
  let previewFlowSmoke: FlowCapture | null = null;

  try {
    for (const testCase of CASES) {
      const production = await runFlow(browser, PRODUCTION_URL, testCase);
      const preview = await runFlow(browser, PREVIEW_URL, testCase);
      if (!previewFlowSmoke) previewFlowSmoke = preview;
      comparisons.push({ case_id: testCase.id, label: testCase.label, production, preview });
    }
  } finally {
    await browser.close();
  }

  const summary = {
    generated_at: new Date().toISOString(),
    production_url: PRODUCTION_URL,
    preview_url: PREVIEW_URL,
    preview_smoke: {
      url_smokes: previewSmoke,
      flow_smoke: previewFlowSmoke,
      pass:
        previewSmoke.every((item) => item.pass) &&
        previewFlowSmoke != null &&
        previewFlowSmoke.route_kind === 'direction',
    },
    production_smoke: {
      url_smokes: productionSmoke,
    },
    case_comparisons: comparisons,
  };

  const outPath = path.join(OUT_DIR, 'summary.json');
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf-8');
  console.log(JSON.stringify({ outPath, previewUrl: PREVIEW_URL, productionUrl: PRODUCTION_URL, caseCount: comparisons.length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
