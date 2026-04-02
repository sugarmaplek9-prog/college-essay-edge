import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const PRODUCT_URL = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';
const INPUT_PACKET = path.join(process.cwd(), 'evaluation_outputs', 'page3_five_case_before_after_v1', 'summary.json');
const OUT_DIR = path.join(process.cwd(), 'evaluation_outputs', 'page3_openai_headtohead_v1');
const OUT_JSON = path.join(OUT_DIR, 'summary.json');
const OUT_MD = path.join(OUT_DIR, 'PAGE3_OPENAI_HEADTOHEAD_V1.md');

function clean(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim();
}

function short(v, max = 420) {
  const t = clean(v);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function extractOpenAiKey() {
  const fullKeyRaw = process.env.OPENAI_API_KEY?.trim() ?? '';
  const fragmentRaw = process.env.OPENAI_API_KEY_FRAGMENT?.trim() ?? '';
  const extractToken = (raw) => {
    if (!raw) return '';
    const direct = raw.match(/sk-[A-Za-z0-9_-]{40,}/)?.[0];
    if (direct) return direct;
    const fragmentToken = raw.match(/[A-Za-z0-9_-]{80,}/)?.[0] ?? '';
    return fragmentToken ? `sk-proj-${fragmentToken}` : '';
  };
  return extractToken(fullKeyRaw) || extractToken(fragmentRaw);
}

function parseCompareFromText(mainText) {
  const text = clean(mainText);
  const weaker = (text.match(/WEAKER READ\s+([\s\S]*?)\s+STRONGER READ/i)?.[1] ?? '').trim();
  const stronger = (text.match(/STRONGER READ\s+([\s\S]*?)\s+(HOW TO APPROACH THIS DIRECTION|Draft my opening now|Help me sharpen the moment first|Show me what the weaker version would do)/i)?.[1] ?? '').trim();
  return { weaker_read: weaker, stronger_read: stronger };
}

async function waitForDirectionLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    const h1 = document.querySelector('h1');
    if (!main || !h1) return false;
    const mainTxt = (main.textContent || '').replace(/\s+/g, ' ').trim();
    const h1Txt = (h1.textContent || '').trim();
    if (!h1Txt || /Finding the strongest thread/i.test(mainTxt)) return false;
    return /Build from this direction|Why this wins/i.test(mainTxt);
  }, { timeout: 20000 });
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

async function runProductCase(browser, baseUrl, row) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  const trace = [];
  try {
    await page.goto(`${baseUrl}/start`, { waitUntil: 'networkidle' });
    trace.push(page.url());

    await page.getByLabel('Your notes or draft').fill(row.raw_notes);
    await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });
    trace.push(page.url());

    if (page.url().includes('/start/reflecting')) {
      await waitForReflectingLoaded(page);
      const btn = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForURL('**/start/direction', { timeout: 15000 });
        trace.push(page.url());
      }
    }

    let output = null;
    if (page.url().includes('/start/direction')) {
      await waitForDirectionLoaded(page);
      const mainText = await page.locator('main').innerText().catch(() => '');
      const compare = parseCompareFromText(mainText);
      const evidenceLines = await page.locator('main p').evaluateAll((nodes) => nodes
        .map((node) => (node.textContent || '').replace(/\s+/g, ' ').trim())
        .filter((text) => /^["“].+["”]$/.test(text))
        .map((text) => text.replace(/^["“]|["”]$/g, '').trim())
        .filter(Boolean)
        .slice(0, 4)
      ).catch(() => []);
      output = {
        displayed_recommendation: clean(await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '')),
        why_this_direction: clean(await page.locator('h1 + p').first().innerText().catch(() => '')),
        weaker_read: clean(compare.weaker_read),
        stronger_read: clean(compare.stronger_read),
        evidence_lines: evidenceLines,
        body_excerpt: short(mainText, 540),
      };
    }

    return {
      route_trace: trace,
      final_url: page.url(),
      true_recommendation_surface_hit: Boolean(page.url().includes('/start/direction') && output?.displayed_recommendation),
      output,
    };
  } finally {
    await page.close();
  }
}

async function fetchOpenAiBaseline(rawNotes) {
  const apiKey = extractOpenAiKey();
  if (!apiKey) {
    return { status: 'unavailable_missing_openai_api_key' };
  }

  const prompt = [
    'You are baseline ChatGPT for college essay directioning.',
    'Given raw student notes, output strict JSON with keys:',
    'recommendation, why_this_direction, weaker_read, stronger_read, evidence_lines (array of direct quoted source lines).',
    'No markdown. Keep output compact and actionable.',
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
      max_output_tokens: 700,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.code || err?.error?.type || '';
    } catch {
      // noop
    }
    return { status: `openai_error_${res.status}${detail ? `_${detail}` : ''}` };
  }

  const body = await res.json();
  const rawText = body?.output_text ?? body?.output?.[0]?.content?.[0]?.text ?? '';
  try {
    const p = JSON.parse(rawText);
    return {
      status: 'ok',
      output: {
        displayed_recommendation: clean(p.recommendation),
        why_this_direction: clean(p.why_this_direction),
        weaker_read: clean(p.weaker_read),
        stronger_read: clean(p.stronger_read),
        evidence_lines: Array.isArray(p.evidence_lines) ? p.evidence_lines.map(clean).filter(Boolean).slice(0, 4) : [],
        body_excerpt: short(rawText, 540),
      },
    };
  } catch {
    return { status: 'openai_parse_error', raw: short(String(rawText), 540) };
  }
}

function scoreOutput(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);
  const merged = `${recommendation} ${why} ${weaker} ${stronger}`;

  const quotedCount = (merged.match(/["“”]/g) || []).length;
  const hasConcreteEntity = /\b(hospital|nurse|clinic|robotics|pantry|freshman|medication|younger student|family)\b/i.test(merged);
  const hasActionChain = /\b(start|then|after|write|open|show|prove|scene|sentence|detail)\b/i.test(merged);
  const genericPhrase = /\b(best angle|specific moment your choice changed the story|growth|resilience|journey)\b/i.test(merged);
  const hingeSignal = /\b(hinge|moment|changed|decision|consequence|shift)\b/i.test(merged);

  const sourceSpecificity = Math.max(1, Math.min(5,
    (evidence.length >= 2 ? 3 : evidence.length === 1 ? 2 : 1) +
    (quotedCount >= 2 ? 1 : 0) +
    (hasConcreteEntity ? 1 : 0)
  ));

  const sourceFaithfulness = Math.max(1, Math.min(5,
    (evidence.length >= 2 ? 3 : evidence.length === 1 ? 2 : 1) +
    (why.includes('"') || recommendation.includes('"') ? 1 : 0) +
    (hasConcreteEntity ? 1 : 0)
  ));

  const draftability = Math.max(1, Math.min(5,
    (hasActionChain ? 3 : 1) +
    (/\b(start|then|after)\b/i.test(output?.why_this_direction || '') ? 1 : 0) +
    (/\b(write|open|show|prove)\b/i.test(merged) ? 1 : 0)
  ));

  const nonRepeatability = Math.max(1, Math.min(5,
    5 - (genericPhrase ? 2 : 0) - (sourceSpecificity <= 2 ? 1 : 0) - (sourceFaithfulness <= 2 ? 1 : 0)
  ));

  const recommendationClarity = Math.max(1, Math.min(5,
    recommendation.length >= 18 && recommendation.length <= 220
      ? (hingeSignal ? 5 : 4)
      : 2
  ));

  const weakerStrongerUsefulness = Math.max(1, Math.min(5,
    weaker && stronger
      ? 3 + (/\b(weaker|setup|generic|summary)\b/i.test(weaker) ? 1 : 0) + (/\b(stronger|hinge|concrete|wins|anchor)\b/i.test(stronger) ? 1 : 0)
      : 1
  ));

  const translationPenalty = Math.max(0, Math.min(5,
    (genericPhrase ? 2 : 0) +
    (/\b(best angle|the direction is)\b/i.test(merged) ? 2 : 0) +
    (sourceFaithfulness <= 2 ? 1 : 0)
  ));

  const avg = Number(((sourceSpecificity + sourceFaithfulness + draftability + nonRepeatability + recommendationClarity + weakerStrongerUsefulness + (5 - translationPenalty)) / 7).toFixed(2));

  return {
    source_specificity: sourceSpecificity,
    source_faithfulness: sourceFaithfulness,
    draftability: draftability,
    non_repeatability: nonRepeatability,
    recommendation_clarity: recommendationClarity,
    weaker_stronger_usefulness: weakerStrongerUsefulness,
    translation_penalty: translationPenalty,
    average_effective: avg,
  };
}

function winnerCall(product, baseline) {
  const dims = [
    'source_specificity',
    'source_faithfulness',
    'draftability',
    'non_repeatability',
    'recommendation_clarity',
    'weaker_stronger_usefulness',
  ];
  let p = 0;
  let b = 0;
  for (const d of dims) {
    if (product[d] > baseline[d]) p += 1;
    else if (baseline[d] > product[d]) b += 1;
  }
  if (product.translation_penalty < baseline.translation_penalty) p += 1;
  else if (baseline.translation_penalty < product.translation_penalty) b += 1;

  return {
    product_points: p,
    openai_points: b,
    winner: p === b ? 'tie' : p > b ? 'product' : 'openai',
  };
}

function loadExactFiveCasePacket() {
  if (!fs.existsSync(INPUT_PACKET)) {
    throw new Error(`Missing ${INPUT_PACKET}`);
  }
  const prev = JSON.parse(fs.readFileSync(INPUT_PACKET, 'utf-8'));
  const selected = prev?.results?.slice(0, 5) ?? [];
  if (selected.length !== 5) {
    throw new Error('Exact 5-case packet unavailable in prior summary.');
  }
  return selected.map((r) => ({
    case_id: r.case_id,
    title: r.title,
    raw_notes: r.raw_notes,
  }));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cases = loadExactFiveCasePacket();
  const browser = await chromium.launch({ headless: true });

  try {
    const rows = [];
    for (const c of cases) {
      const product = await runProductCase(browser, PRODUCT_URL, c);
      const openai = await fetchOpenAiBaseline(c.raw_notes);

      const productScore = scoreOutput(product.output ?? {});
      const openaiScore = openai.status === 'ok' ? scoreOutput(openai.output) : null;

      rows.push({
        ...c,
        product,
        openai,
        scores: {
          product: productScore,
          openai: openaiScore,
          winner: openaiScore ? winnerCall(productScore, openaiScore) : null,
        },
      });
    }

    const productWins = rows.filter((r) => r.scores.winner?.winner === 'product').length;
    const openaiWins = rows.filter((r) => r.scores.winner?.winner === 'openai').length;
    const ties = rows.filter((r) => r.scores.winner?.winner === 'tie').length;
    const baselineComplete = rows.every((r) => r.openai.status === 'ok');
    const surfaceHits = rows.filter((r) => r.product.true_recommendation_surface_hit).length;

    const summary = {
      generated_at: new Date().toISOString(),
      product_url: PRODUCT_URL,
      baseline: 'openai_only',
      case_count: rows.length,
      true_recommendation_surface_hits: surfaceHits,
      baseline_complete: baselineComplete,
      final_tally: {
        product_wins: productWins,
        openai_wins: openaiWins,
        ties,
      },
      rows,
    };

    fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2), 'utf-8');

    const md = [];
    md.push('# PAGE3_OPENAI_HEADTOHEAD_V1');
    md.push('');
    md.push(`- Product URL: ${PRODUCT_URL}`);
    md.push(`- Cases: ${rows.length}`);
    md.push(`- True recommendation surface hits: ${surfaceHits}/${rows.length}`);
    md.push(`- Baseline complete: ${baselineComplete}`);
    md.push(`- Final tally: product=${productWins}, openai=${openaiWins}, ties=${ties}`);
    md.push('');

    for (const r of rows) {
      md.push(`## ${r.case_id} — ${r.title}`);
      md.push('');
      md.push(`Raw notes: ${r.raw_notes}`);
      md.push('');
      md.push(`- Product final URL: ${r.product.final_url}`);
      md.push(`- Product true recommendation surface: ${r.product.true_recommendation_surface_hit}`);
      md.push(`- OpenAI status: ${r.openai.status}`);
      md.push('');

      md.push('### Product output');
      md.push(`- Recommendation: ${r.product.output?.displayed_recommendation ?? ''}`);
      md.push(`- Why this direction: ${r.product.output?.why_this_direction ?? ''}`);
      md.push(`- Weaker read: ${r.product.output?.weaker_read ?? ''}`);
      md.push(`- Stronger read: ${r.product.output?.stronger_read ?? ''}`);
      md.push(`- Evidence lines: ${(r.product.output?.evidence_lines ?? []).join(' | ')}`);
      md.push('');

      md.push('### OpenAI output');
      if (r.openai.status === 'ok') {
        md.push(`- Recommendation: ${r.openai.output?.displayed_recommendation ?? ''}`);
        md.push(`- Why this direction: ${r.openai.output?.why_this_direction ?? ''}`);
        md.push(`- Weaker read: ${r.openai.output?.weaker_read ?? ''}`);
        md.push(`- Stronger read: ${r.openai.output?.stronger_read ?? ''}`);
        md.push(`- Evidence lines: ${(r.openai.output?.evidence_lines ?? []).join(' | ')}`);
      } else {
        md.push(`- Baseline unavailable: ${r.openai.status}`);
      }
      md.push('');

      md.push('### Scores');
      md.push(`- Product: ${JSON.stringify(r.scores.product)}`);
      md.push(`- OpenAI: ${r.scores.openai ? JSON.stringify(r.scores.openai) : 'n/a'}`);
      md.push(`- Winner: ${r.scores.winner ? r.scores.winner.winner : 'n/a'}`);
      md.push('');
    }

    fs.writeFileSync(OUT_MD, `${md.join('\n')}\n`, 'utf-8');

    console.log(JSON.stringify({ out_json: OUT_JSON, out_md: OUT_MD, baseline_complete: baselineComplete, final_tally: { product_wins: productWins, openai_wins: openaiWins, ties } }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
