/**
 * PAGE3 HOLDOUT EVALUATION — V1
 *
 * Purpose:
 *   Independent validation of the repaired page-3 recommendation surface using
 *   12 genuinely unseen cases. None of these cases were used during any prior
 *   tuning or evaluation of the scoring heuristics or the hinge-selection patch.
 *
 * Evaluator status:
 *   The scoreOutput() and winnerCall() functions below are VERBATIM COPIES of
 *   the frozen evaluator in page3-openai-only-headtohead.mjs as of 2026-03-23.
 *   This script does NOT import from that file and does NOT modify it.
 *
 * Known limitation in frozen scorer:
 *   hasConcreteEntity uses a whitelist of entities from the 5 known cases
 *   (hospital, nurse, clinic, robotics, pantry, freshman, medication,
 *   younger student, family). New domains will score 0 on this signal.
 *   Both product and OpenAI are affected equally, so relative comparison
 *   remains valid, but absolute scores will be lower than the known-packet run.
 *
 * Case selection:
 *   12 cases across 7 narrative pattern types, 3 signal-quality levels,
 *   and 2 edge-case types (split focus, weak/short notes).
 *   No overlap with RUS_01, RUS_03, RUS_04, RUS_12, RUS_13.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const PRODUCT_URL = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';
const OUT_DIR = path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v1');
const OUT_JSON = path.join(OUT_DIR, 'summary.json');
const OUT_MD = path.join(OUT_DIR, 'PAGE3_HOLDOUT_V1.md');

// ─── HOLDOUT CORPUS ──────────────────────────────────────────────────────────
// 12 unseen cases. All raw_notes written specifically for this holdout.
// None appear in any prior evaluation run or tuning script.

const HOLDOUT_CASES = [
  {
    case_id: 'HO_01',
    title: 'Software mentorship — teach vs fix',
    narrative_pattern: 'competence_vs_responsibility',
    signal_quality: 'strong',
    raw_notes:
      'I was the only person on the team who knew how to fix the memory leak in our codebase. I fixed it in ten minutes the first time it happened. The second time, a junior teammate was stuck on it for two days before I stepped in and fixed it again. My advisor asked why I had not taught her how to fix it. I did not have a good answer. I rewrote the documentation and ran a code review session the following week. I have not touched that bug since.',
  },
  {
    case_id: 'HO_02',
    title: 'Library reading program — wrong help',
    narrative_pattern: 'usefulness_vs_intention',
    signal_quality: 'strong',
    raw_notes:
      'I ran a Saturday reading program for elementary kids. Attendance was good the first month. Then it dropped by half. I assumed the kids were just busy. A parent told me her daughter stopped coming because the books were too hard and she felt embarrassed in front of the older kids. I split the group by reading level the next week. Attendance came back. My original goal was to help kids love reading. I was doing the opposite.',
  },
  {
    case_id: 'HO_03',
    title: 'Swim team return on own terms',
    narrative_pattern: 'identity_shift',
    signal_quality: 'strong',
    raw_notes:
      'I quit the swim team junior year after my coach told me I was training wrong. I thought he was dismissing everything I had worked for. I came back four months later, not because he asked me to, but because I realized I had been measuring effort by hours in the pool and he was measuring it by what the times showed. That difference is what the essay is actually about. When I came back I started a training log that tracked both.',
  },
  {
    case_id: 'HO_04',
    title: 'Coach injury mid-competition',
    narrative_pattern: 'responsibility_shift',
    signal_quality: 'strong',
    raw_notes:
      'Our coach hurt her knee twenty minutes before our regional debate round. I was the team captain but I had never run a warmup or a strategy session on my own. The other team had a coach on the floor. I had to make three decisions in ninety seconds and two of them were wrong. We still made the final round. My teammate told me afterward that the decision I got right was the only one that mattered.',
  },
  {
    case_id: 'HO_05',
    title: 'Math competition failure to method',
    narrative_pattern: 'failure_reinterpretation',
    signal_quality: 'strong',
    raw_notes:
      'I scored in the bottom third at the state math competition. I had prepared more than anyone I knew. After I got my score back I looked at every problem I missed. All of them required me to switch strategy mid-problem, which I had never practiced. I built a drill where you start a problem, stop after two minutes, explain in writing why your approach is failing, then try a different method. Twelve students at my school now use it.',
  },
  {
    case_id: 'HO_06',
    title: 'School paper story kill',
    narrative_pattern: 'competence_vs_responsibility',
    signal_quality: 'strong',
    raw_notes:
      'I was editor of the school paper and I wrote a story about a teacher investigation that I thought was in the public interest. My faculty advisor said I had not given the teacher a chance to respond. I had not. I killed the story. I rewrote it after getting the teacher\'s side. The second version was worse in some ways and better in others. The decision to kill the first version is the one I still think about.',
  },
  {
    case_id: 'HO_07',
    title: 'Sibling application — wrong kind of help',
    narrative_pattern: 'usefulness_vs_intention',
    signal_quality: 'medium',
    raw_notes:
      'I helped my sister apply to college. I rewrote her first essay draft. She submitted it and did not get in anywhere she wanted. She showed me her second draft, which she wrote without me. It was worse writing but it sounded like her. She got into her first choice. I asked her about it and she said the first version sounded like someone who had read a lot of advice about essays. I think that was about me, not her.',
  },
  {
    case_id: 'HO_08',
    title: 'ESL misplacement and self-advocacy',
    narrative_pattern: 'responsibility_shift',
    signal_quality: 'strong',
    raw_notes:
      'In ninth grade I was placed in ESL because of my last name even though I had spoken English my whole life. I asked the counselor to move me. She said she would look into it. I waited three weeks and nothing happened. I wrote a one-page document with my test scores and sat outside the counselor\'s office until she saw me. I was moved the same day. I did not understand at the time that I had just done something most kids in that class had never been able to do.',
  },
  {
    case_id: 'HO_09',
    title: 'Mock trial ethics — win vs right',
    narrative_pattern: 'conflict_reframe',
    signal_quality: 'strong',
    raw_notes:
      'I coached a middle school mock trial team. We won the county competition but one of my students made an argument I knew was ethically wrong. It was technically within the rules. I let it stand during the round because it helped us win. After the competition I told her why it bothered me. She asked why I had not stopped her during the round if I thought it was wrong. I did not have a good answer. That question changed how I think about coaching.',
  },
  {
    case_id: 'HO_10',
    title: 'Language reclamation at seventeen',
    narrative_pattern: 'identity_shift',
    signal_quality: 'medium',
    raw_notes:
      'My parents stopped speaking Korean at home when I was seven because they thought it would help me fit in at school. By the time I was in high school I could barely hold a conversation with my grandparents. At seventeen I started taking a Korean conversation class at the community center. The teacher asked why I wanted to learn and I said because my parents gave it up for me. She said that was not a reason to learn a language, it was a reason to understand a decision. I think about that sentence a lot.',
  },
  {
    case_id: 'HO_11',
    title: 'Split focus — violin and soccer, weak signal',
    narrative_pattern: 'unknown',
    signal_quality: 'weak',
    raw_notes:
      'I play violin and I also captain the soccer team. Both have made me who I am. I am not sure which story to tell for college.',
  },
  {
    case_id: 'HO_12',
    title: 'Concession stand — adversarial authority',
    narrative_pattern: 'conflict_reframe',
    signal_quality: 'medium',
    raw_notes:
      'When I was running the concession stand at our school football games I noticed the line was always long on the east side and empty on the west. I moved three items to the west side and the line balanced out in twenty minutes. My manager came over and said I should have asked before moving things around. I said I had been trying to reach him for forty-five minutes. He said that was not the point. I think we were both right about different things but he was the one who had to be wrong that day for the stand to work.',
  },
];

// ─── UTILITIES ───────────────────────────────────────────────────────────────

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
  const stronger = (text.match(/STRONGER READ\s+([\s\S]*?)\s+(HOW TO APPROACH THIS DIRECTION|Draft my opening now|Help me sharpen the moment first|Show me what the weaker version would do|Keep these source details)/i)?.[1] ?? '').trim();
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

// ─── PRODUCT RUNNER ──────────────────────────────────────────────────────────

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
        .filter((text) => /^["\u201c\u201d].+["\u201c\u201d]$/.test(text))
        .map((text) => text.replace(/^["\u201c\u201d]|["\u201c\u201d]$/g, '').trim())
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

// ─── OPENAI BASELINE ─────────────────────────────────────────────────────────

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
    } catch { /* noop */ }
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

// ─── SCORER — VERBATIM COPY OF FROZEN EVALUATOR (page3-openai-only-headtohead.mjs, 2026-03-23) ───
// Do NOT modify this function. It is a snapshot, not a live import.
// Known limitation: hasConcreteEntity whitelist matches only the 5 training entities.
// Both product and OpenAI are affected equally on new domains.

function scoreOutput(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);
  const merged = `${recommendation} ${why} ${weaker} ${stronger}`;

  const quotedCount = (merged.match(/["""]/g) || []).length;
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

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    const rows = [];
    for (const c of HOLDOUT_CASES) {
      console.error(`[holdout] running case ${c.case_id}: ${c.title}`);
      const product = await runProductCase(browser, PRODUCT_URL, c);
      const openai = await fetchOpenAiBaseline(c.raw_notes);

      const productScore = scoreOutput(product.output ?? {});
      const openaiScore = openai.status === 'ok' ? scoreOutput(openai.output) : null;
      const winner = openaiScore ? winnerCall(productScore, openaiScore) : null;

      rows.push({
        case_id: c.case_id,
        title: c.title,
        narrative_pattern: c.narrative_pattern,
        signal_quality: c.signal_quality,
        raw_notes: c.raw_notes,
        product,
        openai,
        scores: { product: productScore, openai: openaiScore, winner },
      });
    }

    const scoredRows = rows.filter((r) => r.scores.winner !== null);
    const productWins = scoredRows.filter((r) => r.scores.winner.winner === 'product').length;
    const openaiWins = scoredRows.filter((r) => r.scores.winner.winner === 'openai').length;
    const ties = scoredRows.filter((r) => r.scores.winner.winner === 'tie').length;
    const baselineComplete = rows.every((r) => r.openai.status === 'ok');
    const baselineAttempted = rows.filter((r) => r.openai.status !== 'unavailable_missing_openai_api_key').length;
    const surfaceHits = rows.filter((r) => r.product.true_recommendation_surface_hit).length;

    // Failure reasons: product cases where OpenAI won
    const productLosses = scoredRows.filter((r) => r.scores.winner.winner === 'openai');
    const failureReasons = productLosses.map((r) => {
      const dims = [
        'source_specificity', 'source_faithfulness', 'draftability',
        'non_repeatability', 'recommendation_clarity', 'weaker_stronger_usefulness',
      ];
      const gaps = dims.filter((d) => r.scores.product[d] < r.scores.openai[d]);
      const translationWorse = r.scores.product.translation_penalty > r.scores.openai.translation_penalty;
      return {
        case_id: r.case_id,
        title: r.title,
        signal_quality: r.signal_quality,
        narrative_pattern: r.narrative_pattern,
        product_avg: r.scores.product.average_effective,
        openai_avg: r.scores.openai.average_effective,
        product_points: r.scores.winner.product_points,
        openai_points: r.scores.winner.openai_points,
        dimensions_product_lost: gaps,
        translation_penalty_worse: translationWorse,
        product_recommendation: r.product.output?.displayed_recommendation ?? '',
        openai_recommendation: r.openai.output?.displayed_recommendation ?? '',
        product_evidence_count: (r.product.output?.evidence_lines ?? []).length,
        openai_evidence_count: (r.openai.output?.evidence_lines ?? []).length,
      };
    });

    // Tie reasons
    const tieRows = scoredRows.filter((r) => r.scores.winner.winner === 'tie');

    const summary = {
      generated_at: new Date().toISOString(),
      product_url: PRODUCT_URL,
      evaluator_frozen_snapshot: 'page3-openai-only-headtohead.mjs @ 2026-03-23',
      baseline: 'openai_only',
      case_count: rows.length,
      scored_case_count: scoredRows.length,
      true_recommendation_surface_hits: surfaceHits,
      baseline_complete: baselineComplete,
      baseline_attempted: baselineAttempted,
      final_tally: {
        product_wins: productWins,
        openai_wins: openaiWins,
        ties,
        unscored: rows.length - scoredRows.length,
      },
      scorer_limitation: 'hasConcreteEntity whitelist covers only 5 training-packet entities; both product and OpenAI affected equally on new domains',
      failure_reasons: failureReasons,
      tie_cases: tieRows.map((r) => ({ case_id: r.case_id, title: r.title, signal_quality: r.signal_quality })),
      rows,
    };

    fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2), 'utf-8');

    // ─── MARKDOWN REPORT ───────────────────────────────────────────────────

    const md = [];
    md.push('# PAGE3 HOLDOUT EVALUATION — V1');
    md.push('');
    md.push('> Holdout validation using 12 unseen cases.');
    md.push('> Evaluator is a verbatim copy of the frozen scorer from page3-openai-only-headtohead.mjs (2026-03-23).');
    md.push('> Known limitation: entity whitelist in scorer covers only the 5 training-packet domains.');
    md.push('> Both product and OpenAI are affected equally by this limitation on new domains.');
    md.push('');
    md.push(`- Product URL: ${PRODUCT_URL}`);
    md.push(`- Cases: ${rows.length} (scored: ${scoredRows.length})`);
    md.push(`- True recommendation surface hits: ${surfaceHits}/${rows.length}`);
    md.push(`- Baseline complete: ${baselineComplete} (${baselineAttempted} attempted)`);
    md.push('');
    md.push('## Final tally');
    md.push('');
    md.push(`| | Wins |`);
    md.push(`|---|---|`);
    md.push(`| Product | ${productWins} |`);
    md.push(`| OpenAI | ${openaiWins} |`);
    md.push(`| Ties | ${ties} |`);
    md.push(`| Unscored (baseline unavailable) | ${rows.length - scoredRows.length} |`);
    md.push('');

    if (failureReasons.length > 0) {
      md.push('## Product losses — failure breakdown');
      md.push('');
      for (const f of failureReasons) {
        md.push(`### ${f.case_id} — ${f.title}`);
        md.push(`- Pattern: ${f.narrative_pattern} | Signal: ${f.signal_quality}`);
        md.push(`- Score: product avg ${f.product_avg} vs OpenAI avg ${f.openai_avg}`);
        md.push(`- Points: product ${f.product_points} vs OpenAI ${f.openai_points}`);
        md.push(`- Dimensions product lost: ${f.dimensions_product_lost.join(', ') || 'none (lost on translation penalty)'}`);
        md.push(`- Translation penalty worse: ${f.translation_penalty_worse}`);
        md.push(`- Product recommendation: "${f.product_recommendation}"`);
        md.push(`- OpenAI recommendation: "${f.openai_recommendation}"`);
        md.push(`- Product evidence lines: ${f.product_evidence_count} | OpenAI evidence lines: ${f.openai_evidence_count}`);
        md.push('');
      }
    } else {
      md.push('## Product losses — failure breakdown');
      md.push('');
      md.push('No product losses in scored cases.');
      md.push('');
    }

    if (tieRows.length > 0) {
      md.push('## Ties');
      md.push('');
      for (const t of tieRows) {
        md.push(`- ${t.case_id} — ${t.title} (${t.signal_quality})`);
      }
      md.push('');
    }

    md.push('## Per-case results');
    md.push('');
    for (const r of rows) {
      md.push(`### ${r.case_id} — ${r.title}`);
      md.push(`- Pattern: ${r.narrative_pattern} | Signal: ${r.signal_quality}`);
      md.push(`- Product surface hit: ${r.product.true_recommendation_surface_hit}`);
      md.push(`- OpenAI status: ${r.openai.status}`);
      md.push(`- Winner: ${r.scores.winner?.winner ?? 'unscored'}`);
      md.push('');
      md.push('**Product**');
      md.push(`- Recommendation: ${r.product.output?.displayed_recommendation ?? '(none)'}`);
      md.push(`- Why: ${r.product.output?.why_this_direction ?? '(none)'}`);
      md.push(`- Evidence lines: ${(r.product.output?.evidence_lines ?? []).join(' | ') || '(none)'}`);
      md.push(`- Scores: ${JSON.stringify(r.scores.product)}`);
      md.push('');
      if (r.openai.status === 'ok') {
        md.push('**OpenAI**');
        md.push(`- Recommendation: ${r.openai.output?.displayed_recommendation ?? '(none)'}`);
        md.push(`- Why: ${r.openai.output?.why_this_direction ?? '(none)'}`);
        md.push(`- Evidence lines: ${(r.openai.output?.evidence_lines ?? []).join(' | ') || '(none)'}`);
        md.push(`- Scores: ${JSON.stringify(r.scores.openai)}`);
      } else {
        md.push(`**OpenAI**: unavailable — ${r.openai.status}`);
      }
      md.push('');
    }

    fs.writeFileSync(OUT_MD, `${md.join('\n')}\n`, 'utf-8');

    console.log(JSON.stringify({
      out_json: OUT_JSON,
      out_md: OUT_MD,
      baseline_complete: baselineComplete,
      baseline_attempted: baselineAttempted,
      scored_cases: scoredRows.length,
      final_tally: { product_wins: productWins, openai_wins: openaiWins, ties },
      unscored: rows.length - scoredRows.length,
      scorer_limitation: 'entity_whitelist_covers_training_domains_only',
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[holdout] fatal:', err);
  process.exit(1);
});
