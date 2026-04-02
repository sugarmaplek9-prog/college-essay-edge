import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BEFORE_URL = process.env.BEFORE_URL ?? 'https://college-essay-edge-g311wfuqb-college-edge.vercel.app';
const AFTER_URL = process.env.AFTER_URL ?? 'https://college-essay-edge.vercel.app';
const OUT_DIR = path.join(process.cwd(), 'evaluation_outputs', 'page3_five_case_before_after_v1');
const OUT_JSON = path.join(OUT_DIR, 'summary.json');
const OUT_MD = path.join(OUT_DIR, 'PAGE3_FIVE_CASE_BEFORE_AFTER_V1.md');

const CANDIDATE_CASES = [
  {
    case_id: 'RUS_02',
    title: 'Hospital volunteer correction moment',
    raw_notes:
      'I spent three summers volunteering at a hospital. In my third summer, a nurse told me I was getting in the way. I had to relearn service as listening before doing.',
  },
  {
    case_id: 'RUS_03',
    title: 'Pantry redesign with concrete hinge',
    raw_notes:
      'I changed in debate and also helped redesign pantry pickup, both mattered but I am not sure which one says more about me. One family told me they stopped coming because lines were public. I proposed quiet pickup slots and attendance recovered.',
  },
  {
    case_id: 'RUS_04',
    title: 'Robotics mistake to checklist ownership',
    raw_notes:
      'I keep saying I learned confidence, but that sounds fake. Concrete moment: I gave wrong instructions during robotics setup and had to ask a freshman to walk me through my own design. After that, I created a pre-launch checklist owned by whoever would be affected, not whoever had seniority.',
  },
  {
    case_id: 'RUS_01',
    title: 'Peer tutoring ownership redesign',
    raw_notes:
      'I reorganized peer tutoring because everyone waited for me, then I created rotating owners and wait times dropped. The moment was when a younger student said she finally felt seen.',
  },
  {
    case_id: 'RUS_05',
    title: 'Translation precision at clinic desk',
    raw_notes:
      'I could write about coding club leadership or translating for my parents. At a clinic desk, I translated a medication warning and realized precision could change outcomes that same day.',
  },
  {
    case_id: 'RUS_07',
    title: 'Dyslexia tutoring specificity shift',
    raw_notes:
      'I helped my brother with dyslexia by changing from giving answers to having him narrate each step. After six weeks, he started leading story summaries himself.',
  },
  {
    case_id: 'RUS_10',
    title: 'Revision loop with stronger second detail',
    raw_notes:
      'My first draft sounded generic. Then I rewrote around the moment I stopped giving instructions and started asking teammates to set constraints before we built anything.',
  },
  {
    case_id: 'RUS_11',
    title: 'Unclear center then concrete family operations scene',
    raw_notes:
      'I usually describe myself through achievements, but the most real moment was handling a supply shortfall in our family store when a customer needed a specific medication item and we had no backup plan.',
  },
  {
    case_id: 'RUS_12',
    title: 'Hospital service hinge with explicit consequence',
    raw_notes:
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
  },
  {
    case_id: 'RUS_13',
    title: 'Clinic translation with immediate outcome',
    raw_notes:
      'At a clinic desk, I translated a medication warning for my parents and realized precision could change outcomes that same day. I shifted from sounding fluent to making sure every instruction was actually understood.',
  },
  {
    case_id: 'RUS_14',
    title: 'Team bottleneck correction scene',
    raw_notes:
      'In robotics, I kept giving fast instructions until we failed a setup because my directions were wrong. I asked a freshman to walk me through my own design, then I changed our prep process to student-owned checklists.',
  },
  {
    case_id: 'RUS_15',
    title: 'Caregiving routine redesign under pressure',
    raw_notes:
      'When my grandmother came home after discharge, I translated medication instructions and realized our routine would fail unless I redesigned it hour by hour. I moved from reacting to owning the safety system.',
  },
  {
    case_id: 'RUS_16',
    title: 'Pantry privacy fix as narrative center',
    raw_notes:
      'At the pantry, one family told me they stopped coming because pickup lines felt public. I proposed quiet pickup slots and attendance recovered. That changed how I think about what help should feel like for people receiving it.',
  },
  {
    case_id: 'RUS_09',
    title: 'ACL injury vs caregiving center collision',
    raw_notes:
      'I tore my ACL and also became main caregiver for my grandmother that year. Choose caregiving center, use ACL only as pressure context. I learned medication timing, translated discharge instructions, and redesigned our daily routine to avoid missed doses.',
  },
];

function clean(value) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function short(value, max = 280) {
  const v = clean(value);
  return v.length > max ? `${v.slice(0, max - 1)}…` : v;
}

function parseCompareFromText(mainText) {
  const text = clean(mainText);
  const weaker = (text.match(/WEAKER READ\s+([\s\S]*?)\s+STRONGER READ/i)?.[1] ?? '').trim();
  const stronger = (text.match(/STRONGER READ\s+([\s\S]*?)\s+(COACH VERDICT|WHY THIS DIRECTION|FROM YOUR NOTES|Draft my opening now|Sharpen this first|How to approach this direction)/i)?.[1] ?? '').trim();
  const judgment = (text.match(/COACH VERDICT\s+([\s\S]*?)\s+(How to approach this direction|Draft my opening now|Sharpen this first|Build from this direction)/i)?.[1] ?? '').trim();
  return {
    weaker_read: weaker,
    stronger_read: stronger,
    judgment,
  };
}

function parseReflecting(mainText) {
  const text = clean(mainText);
  const recommendation = (
    text.match(/YOUR DIRECTION\s+([\s\S]*?)\s+WHAT THE SYSTEM IS SEEING/i)?.[1] ??
    text.match(/THE DIRECTION WE RECOMMEND FIRST:?\s*([\s\S]*?)\s+WHY THIS IS THE BEST STARTING POINT/i)?.[1] ??
    ''
  ).trim();
  const whyThisDirection = (
    text.match(/WHY THIS DIRECTION\s+([\s\S]*?)\s+FROM YOUR NOTES/i)?.[1] ??
    text.match(/WHY THIS IS THE BEST STARTING POINT\s+([\s\S]*?)\s+(THE NOTES THAT POINT US HERE|Build from this direction)/i)?.[1] ??
    ''
  ).trim();
  const evidenceBlock = (
    text.match(/FROM YOUR NOTES\s+([\s\S]*?)\s+Build from this direction/i)?.[1] ??
    text.match(/THE NOTES THAT POINT US HERE\s+([\s\S]*?)\s+Build from this direction/i)?.[1] ??
    ''
  ).trim();

  const evidenceQuotes = [];
  for (const m of evidenceBlock.matchAll(/["“”]([^"“”]{12,220})["“”]/g)) {
    evidenceQuotes.push(clean(m[1]));
  }

  return {
    displayed_recommendation: recommendation,
    why_this_direction: whyThisDirection,
    ...parseCompareFromText(text),
    evidence_lines: [...new Set(evidenceQuotes)].slice(0, 4),
    body_excerpt: short(text, 520),
  };
}

async function captureDirection(page) {
  const mainText = await page.locator('main').innerText().catch(() => '');
  const recommendation = clean(await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => ''));
  const why = await page.locator('h1 + p').first().innerText().catch(() => '');
  const compare = parseCompareFromText(mainText);

  return {
    displayed_recommendation: recommendation,
    why_this_direction: clean(why),
    weaker_read: compare.weaker_read,
    stronger_read: compare.stronger_read,
    evidence_lines: [],
    body_excerpt: short(mainText, 520),
  };
}

async function waitForReflectingLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    if (!main) return false;
    const txt = (main.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt || /Reading what you shared/i.test(txt)) return false;
    return /YOUR DIRECTION|THE DIRECTION WE RECOMMEND FIRST|WHAT THE SYSTEM IS SEEING|WHY THIS DIRECTION/i.test(txt);
  }, { timeout: 20000 });
}

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

async function runCaseOnBase(browser, baseUrl, row) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  const trace = [];
  try {
    await page.goto(`${baseUrl}/start`, { waitUntil: 'networkidle' });
    trace.push(page.url());

    await page.getByLabel('Your notes or draft').fill(row.raw_notes);
    const submit = page.getByRole('button', {
      name: /Find the strongest direction|Show me possible directions|See what's here/i,
    }).first();
    await submit.click();

    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });
    trace.push(page.url());

    let reflectingCapture = null;
    if (page.url().includes('/start/reflecting')) {
      await waitForReflectingLoaded(page);
      const main = await page.locator('main').innerText().catch(() => '');
      reflectingCapture = parseReflecting(main);
      const toDirection = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await toDirection.isVisible().catch(() => false)) {
        await toDirection.click();
        await page.waitForURL('**/start/direction', { timeout: 15000 });
        trace.push(page.url());
      }
    }

    let directionCapture = null;
    if (page.url().includes('/start/direction')) {
      await waitForDirectionLoaded(page);
      directionCapture = await captureDirection(page);
    }

    const trueRecommendationSurface =
      page.url().includes('/start/direction') &&
      Boolean(directionCapture?.displayed_recommendation) &&
      Boolean(directionCapture?.why_this_direction);

    return {
      base_url: baseUrl,
      route_trace: trace,
      landed_first: trace[1] ?? null,
      final_url: page.url(),
      landed_reflecting_first: Boolean(trace[1]?.includes('/start/reflecting')),
      true_recommendation_surface_hit: trueRecommendationSurface,
      reflecting_surface: reflectingCapture,
      direction_surface: directionCapture,
    };
  } finally {
    await page.close();
  }
}

async function fetchOpenAiBaseline(rawNotes) {
  const fullKeyRaw = process.env.OPENAI_API_KEY?.trim() ?? '';
  const fragmentRaw = process.env.OPENAI_API_KEY_FRAGMENT?.trim() ?? '';

  const extractToken = (raw) => {
    if (!raw) return '';
    const direct = raw.match(/sk-[A-Za-z0-9_-]{40,}/)?.[0];
    if (direct) return direct;
    const fragmentToken = raw.match(/[A-Za-z0-9_-]{80,}/)?.[0] ?? '';
    return fragmentToken ? `sk-proj-${fragmentToken}` : '';
  };

  const apiKey = extractToken(fullKeyRaw) || extractToken(fragmentRaw);
  if (!apiKey) {
    return { status: 'unavailable_missing_openai_api_key' };
  }

  const prompt = [
    'You are baseline ChatGPT for college essay directioning.',
    'Given raw student notes, output strict JSON with keys:',
    'recommendation, why_this_direction, weaker_read, stronger_read, evidence_lines (array of direct quoted source lines).',
    'Keep it concise and generic baseline style, no markdown.',
    `RAW_NOTES: ${rawNotes}`,
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_BASELINE_MODEL || 'gpt-4o-mini',
      input: prompt,
      text: { format: { type: 'json_object' } },
      max_output_tokens: 500,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errBody = await res.json();
      detail = errBody?.error?.code || errBody?.error?.type || '';
    } catch {
      // noop
    }
    return { status: `openai_error_${res.status}${detail ? `_${detail}` : ''}` };
  }

  const body = await res.json();
  const rawText = body?.output_text ?? body?.output?.[0]?.content?.[0]?.text ?? '';
  try {
    const parsed = JSON.parse(rawText);
    return {
      status: 'ok',
      ...parsed,
    };
  } catch {
    return {
      status: 'openai_parse_error',
      raw: short(String(rawText), 480),
    };
  }
}

async function fetchClaudeBaseline(rawNotes) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return { status: 'unavailable_missing_anthropic_api_key' };
  }

  const system = 'You are baseline Claude for college essay directioning. Return strict JSON only.';
  const user = [
    'Given raw student notes, output JSON with keys:',
    'recommendation, why_this_direction, weaker_read, stronger_read, evidence_lines (array of direct quoted source lines).',
    'Do not output markdown.',
    `RAW_NOTES: ${rawNotes}`,
  ].join('\n');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_BASELINE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    return { status: `anthropic_error_${res.status}` };
  }

  const body = await res.json();
  const rawText = body?.content?.[0]?.text ?? '';
  try {
    const parsed = JSON.parse(rawText);
    return {
      status: 'ok',
      ...parsed,
    };
  } catch {
    return {
      status: 'anthropic_parse_error',
      raw: short(String(rawText), 480),
    };
  }
}

function passDirectionSurface(entry) {
  return Boolean(entry?.true_recommendation_surface_hit);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results = [];
  const selectedCases = [];

  try {
    for (const row of CANDIDATE_CASES) {
      const before = await runCaseOnBase(browser, BEFORE_URL, row);
      const after = await runCaseOnBase(browser, AFTER_URL, row);

      const qualifies =
        before.final_url.includes('/start/direction') &&
        after.final_url.includes('/start/direction') &&
        before.true_recommendation_surface_hit &&
        after.true_recommendation_surface_hit;

      if (!qualifies) {
        continue;
      }

      const [chatgptBaseline, claudeBaseline] = await Promise.all([
        fetchOpenAiBaseline(row.raw_notes),
        fetchClaudeBaseline(row.raw_notes),
      ]);

      results.push({
        case_id: row.case_id,
        title: row.title,
        raw_notes: row.raw_notes,
        before,
        after,
        baseline: {
          chatgpt: chatgptBaseline,
          claude: claudeBaseline,
        },
      });

      selectedCases.push(row.case_id);
      if (results.length >= 5) break;
    }
  } finally {
    await browser.close();
  }

  if (results.length < 5) {
    throw new Error(`Could not collect 5 qualifying cases. Collected=${results.length}. Selected=${selectedCases.join(', ')}`);
  }

  const summary = {
    generated_at: new Date().toISOString(),
    before_url: BEFORE_URL,
    after_url: AFTER_URL,
    case_count: results.length,
    candidate_pool_count: CANDIDATE_CASES.length,
    selected_case_ids: selectedCases,
    recommendation_surface_check: {
      before_pass_count: results.filter((r) => passDirectionSurface(r.before)).length,
      after_pass_count: results.filter((r) => passDirectionSurface(r.after)).length,
      required: results.length,
    },
    results,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2), 'utf-8');

  const lines = [];
  lines.push('# PAGE3_FIVE_CASE_BEFORE_AFTER_V1');
  lines.push('');
  lines.push(`- Generated at: ${summary.generated_at}`);
  lines.push(`- Before URL: ${BEFORE_URL}`);
  lines.push(`- After URL: ${AFTER_URL}`);
  lines.push(`- True recommendation surface checks (before): ${summary.recommendation_surface_check.before_pass_count}/${summary.case_count}`);
  lines.push(`- True recommendation surface checks (after): ${summary.recommendation_surface_check.after_pass_count}/${summary.case_count}`);
  lines.push('');

  for (const row of results) {
    lines.push(`## ${row.case_id} — ${row.title}`);
    lines.push('');
    lines.push(`Raw notes: ${row.raw_notes}`);
    lines.push('');

    lines.push('### BEFORE');
    lines.push(`- First landed URL: ${row.before.landed_first}`);
    lines.push(`- Final URL: ${row.before.final_url}`);
    lines.push(`- True recommendation surface hit: ${row.before.true_recommendation_surface_hit}`);
    lines.push(`- Displayed recommendation: ${row.before.direction_surface?.displayed_recommendation || row.before.reflecting_surface?.displayed_recommendation || ''}`);
    lines.push(`- Why this direction: ${row.before.direction_surface?.why_this_direction || row.before.reflecting_surface?.why_this_direction || ''}`);
    lines.push(`- Weaker read: ${row.before.direction_surface?.weaker_read || row.before.reflecting_surface?.weaker_read || ''}`);
    lines.push(`- Stronger read: ${row.before.direction_surface?.stronger_read || row.before.reflecting_surface?.stronger_read || ''}`);
    lines.push(`- Evidence lines: ${(row.before.reflecting_surface?.evidence_lines || row.before.direction_surface?.evidence_lines || []).join(' | ')}`);
    lines.push('');

    lines.push('### AFTER');
    lines.push(`- First landed URL: ${row.after.landed_first}`);
    lines.push(`- Final URL: ${row.after.final_url}`);
    lines.push(`- True recommendation surface hit: ${row.after.true_recommendation_surface_hit}`);
    lines.push(`- Displayed recommendation: ${row.after.direction_surface?.displayed_recommendation || row.after.reflecting_surface?.displayed_recommendation || ''}`);
    lines.push(`- Why this direction: ${row.after.direction_surface?.why_this_direction || row.after.reflecting_surface?.why_this_direction || ''}`);
    lines.push(`- Weaker read: ${row.after.direction_surface?.weaker_read || row.after.reflecting_surface?.weaker_read || ''}`);
    lines.push(`- Stronger read: ${row.after.direction_surface?.stronger_read || row.after.reflecting_surface?.stronger_read || ''}`);
    lines.push(`- Evidence lines: ${(row.after.reflecting_surface?.evidence_lines || row.after.direction_surface?.evidence_lines || []).join(' | ')}`);
    lines.push('');

    lines.push('### BASELINE CHATGPT/CLAUDE');
    lines.push(`- ChatGPT baseline status: ${row.baseline.chatgpt.status}`);
    lines.push(`- ChatGPT recommendation: ${row.baseline.chatgpt.recommendation || ''}`);
    lines.push(`- ChatGPT why this direction: ${row.baseline.chatgpt.why_this_direction || ''}`);
    lines.push(`- Claude baseline status: ${row.baseline.claude.status}`);
    lines.push(`- Claude recommendation: ${row.baseline.claude.recommendation || ''}`);
    lines.push(`- Claude why this direction: ${row.baseline.claude.why_this_direction || ''}`);
    lines.push('');
  }

  lines.push('## Artifacts');
  lines.push(`- JSON: ${path.relative(process.cwd(), OUT_JSON)}`);
  lines.push(`- Markdown: ${path.relative(process.cwd(), OUT_MD)}`);
  lines.push('');

  fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`, 'utf-8');

  console.log(
    JSON.stringify(
      {
        out_json: OUT_JSON,
        out_md: OUT_MD,
        before_surface_hits: summary.recommendation_surface_check.before_pass_count,
        after_surface_hits: summary.recommendation_surface_check.after_pass_count,
        cases: summary.case_count,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
