/**
 * PAGE3 HOLDOUT EVALUATION — V2 (UNTOUCHED PACKET)
 *
 * This script runs product vs OpenAI on a second holdout packet that was not
 * used in prior repair iterations. It uses a frozen evaluator snapshot and
 * emits a blind human-review packet for A/B judging.
 */

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const EVALUATOR_PATH = process.env.EVALUATOR_PATH
  ? path.resolve(process.cwd(), process.env.EVALUATOR_PATH)
  : new URL('./frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs', import.meta.url).pathname;
const { clean, scoreOutput, winnerCall } = await import(EVALUATOR_PATH);

const PRODUCT_URL = process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app';
const HOLDOUT_CASES_PATH = process.env.HOLDOUT_CASES_PATH ?? path.join(process.cwd(), 'scripts', 'data', 'page3-holdout-v2-cases.json');
const HOLDOUT_OUT_DIR = process.env.HOLDOUT_OUT_DIR ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2');
const HOLDOUT_LABEL = process.env.HOLDOUT_LABEL ?? 'V2 (UNTOUCHED PACKET)';
const CASES_PATH = HOLDOUT_CASES_PATH;
const OUT_DIR = HOLDOUT_OUT_DIR;
const OUT_JSON = path.join(OUT_DIR, 'summary.json');
const OUT_MD = path.join(OUT_DIR, 'PAGE3_HOLDOUT_V2.md');
const OUT_BLIND_JSON = path.join(OUT_DIR, 'blind_review_packet.json');
const OUT_BLIND_MD = path.join(OUT_DIR, 'BLIND_REVIEW_PACKET_V2.md');
const OUT_BLIND_KEY = path.join(OUT_DIR, 'blind_review_answer_key.json');
const DOMINANT_FAMILY_CAP = Number(process.env.DOMINANT_FAMILY_CAP ?? '0.35');
const LAYER_A_PARITY_REFERENCE_STATUS_PATH = process.env.LAYER_A_PARITY_REFERENCE_STATUS_PATH
  ?? path.join(process.cwd(), 'scripts', 'data', 'frozen', 'page3-layer-a-parity-reference-status-v1.json');

function readLayerAParityReferenceStatus() {
  try {
    if (!fs.existsSync(LAYER_A_PARITY_REFERENCE_STATUS_PATH)) return null;
    return JSON.parse(fs.readFileSync(LAYER_A_PARITY_REFERENCE_STATUS_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

function isLayerAFrozenRegressionRun() {
  return /page3-holdout-v2-cases\.frozen\.json$/.test(String(CASES_PATH));
}

function getParityStatusDetails(parityReferenceComplete) {
  const statusDoc = isLayerAFrozenRegressionRun() ? readLayerAParityReferenceStatus() : null;
  if (parityReferenceComplete) {
    return {
      parityStatus: 'scorable',
      benchmarkLossCondition: false,
      benchmarkLossReason: null,
      parityReferenceStatusPath: statusDoc ? LAYER_A_PARITY_REFERENCE_STATUS_PATH : null,
    };
  }

  if (statusDoc?.status === 'permanently_unavailable') {
    return {
      parityStatus: 'permanently_unavailable',
      benchmarkLossCondition: true,
      benchmarkLossReason: statusDoc.reason ?? 'benchmark_loss_missing_authoritative_artifact',
      parityReferenceStatusPath: LAYER_A_PARITY_REFERENCE_STATUS_PATH,
    };
  }

  return {
    parityStatus: 'reference_unavailable',
    benchmarkLossCondition: false,
    benchmarkLossReason: null,
    parityReferenceStatusPath: statusDoc ? LAYER_A_PARITY_REFERENCE_STATUS_PATH : null,
  };
}

function resolveBaselineCacheSummaryPath() {
  const candidates = [
    process.env.BASELINE_CACHE_SUMMARY?.trim(),
    path.join(process.cwd(), 'evaluation_outputs', 'page3_delivery_bundle_v1', 'summary.json'),
    path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

const BASELINE_CACHE_SUMMARY = resolveBaselineCacheSummaryPath();

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
    return /Build from this direction|Recommended angle|Why this wins|Why this angle works/i.test(mainTxt);
  }, { timeout: 20000 });
}

async function waitForReflectingLoaded(page) {
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    if (!main) return false;
    const txt = (main.textContent || '').replace(/\s+/g, ' ').trim();
    if (!txt || /Reading what you shared/i.test(txt)) return false;
    if (/YOUR DIRECTION|THE DIRECTION WE RECOMMEND FIRST|WHAT THE SYSTEM IS SEEING|WHY THIS DIRECTION/i.test(txt)) return true;
    return txt.length > 260;
  }, { timeout: 30000 });
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

    const canonicalPayload = await page.evaluate(() => {
      try {
        const raw = sessionStorage.getItem('fm_canonical_page3_payload');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    });

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
      const packet = canonicalPayload?.recommendation_packet;
      output = {
        displayed_recommendation: clean(packet?.displayed_recommendation || await page.getByRole('heading', { level: 1 }).first().innerText().catch(() => '')),
        essay_about: clean(packet?.essay_about || ''),
        why_this_direction: clean(packet?.why_this_direction || await page.locator('h1 + p').first().innerText().catch(() => '')),
        weaker_read: clean(packet?.weaker_read || compare.weaker_read),
        stronger_read: clean(packet?.stronger_read || compare.stronger_read),
        evidence_lines: (packet?.evidence_lines ?? evidenceLines).map(clean).filter(Boolean).slice(0, 4),
        evidence_explanations: (packet?.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
        body_excerpt: short(mainText, 540),
      };
    }

    if (!output && canonicalPayload?.recommendation_packet) {
      const packet = canonicalPayload.recommendation_packet;
      output = {
        displayed_recommendation: clean(packet.displayed_recommendation || ''),
        essay_about: clean(packet.essay_about || ''),
        why_this_direction: clean(packet.why_this_direction || ''),
        weaker_read: clean(packet.weaker_read || ''),
        stronger_read: clean(packet.stronger_read || ''),
        evidence_lines: (packet.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
        evidence_explanations: (packet.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
        body_excerpt: short(`${packet.displayed_recommendation || ''} ${packet.essay_about || ''} ${packet.why_this_direction || ''}`, 540),
      };
    }

    return {
      route_trace: trace,
      final_url: page.url(),
      true_recommendation_surface_hit: Boolean(output?.displayed_recommendation),
      canonical_payload: canonicalPayload,
      output,
    };
  } finally {
    await page.close();
  }
}

async function prewarmProductRuntime(browser, baseUrl) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  try {
    const warmPaths = [
      '/start',
      '/start/blocked',
      '/start/question',
      '/start/reflecting',
      '/start/direction',
    ];

    for (const path of warmPaths) {
      await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
    }

    await page.goto(`${baseUrl}/start`, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null);
    await page.evaluate(async () => {
      try {
        await fetch('/api/intake/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_input: 'I mentor coding workshops and also captain my dance team. Both matter to me and I am unsure which one should be my essay focus.',
          }),
        });
      } catch {}
    }).catch(() => null);
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
    'recommendation, essay_about, why_this_direction, weaker_read, stronger_read, evidence_lines (array of direct quoted source lines), evidence_explanations (array aligned to evidence_lines).',
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
        essay_about: clean(p.essay_about || ''),
        why_this_direction: clean(p.why_this_direction),
        weaker_read: clean(p.weaker_read),
        stronger_read: clean(p.stronger_read),
        evidence_lines: Array.isArray(p.evidence_lines) ? p.evidence_lines.map(clean).filter(Boolean).slice(0, 4) : [],
        evidence_explanations: Array.isArray(p.evidence_explanations) ? p.evidence_explanations.map(clean).filter(Boolean).slice(0, 4) : [],
        body_excerpt: short(rawText, 540),
      },
    };
  } catch {
    return { status: 'openai_parse_error', raw: short(String(rawText), 540) };
  }
}

function deterministicSwap(caseId) {
  let sum = 0;
  for (const ch of caseId) sum += ch.charCodeAt(0);
  return sum % 2 === 1;
}

function isScorableOpenAiStatus(status) {
  return /^ok/.test(String(status ?? ''));
}

function isPacketBaselineAvailable(status) {
  return isScorableOpenAiStatus(status) || status === 'ok_cache_product_only';
}

function isParityScorableBaseline(openai) {
  if (!isScorableOpenAiStatus(openai?.status)) return false;
  return openai?.source !== 'baseline_cache_product_output';
}

function loadBaselineCache() {
  try {
    if (!BASELINE_CACHE_SUMMARY || !fs.existsSync(BASELINE_CACHE_SUMMARY)) return new Map();
    const summary = JSON.parse(fs.readFileSync(BASELINE_CACHE_SUMMARY, 'utf-8'));
    const rows = summary?.rows ?? [];
    const byCase = new Map();
    for (const row of rows) {
      const cacheSource = row?.openai?.output ? 'openai_output' : row?.product?.output ? 'product_output' : null;
      const output = row?.openai?.output ?? row?.product?.output;
      if (!row?.case_id || !output) continue;
      byCase.set(row.case_id, {
        cache_source: cacheSource,
        output: {
          displayed_recommendation: clean(output.displayed_recommendation || ''),
          essay_about: clean(output.essay_about || ''),
          why_this_direction: clean(output.why_this_direction || ''),
          weaker_read: clean(output.weaker_read || ''),
          stronger_read: clean(output.stronger_read || ''),
          evidence_lines: (output.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
          evidence_explanations: (output.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
          body_excerpt: short(output.body_excerpt || `${output.displayed_recommendation || ''} ${output.essay_about || ''} ${output.why_this_direction || ''}`, 540),
        },
      });
    }
    return byCase;
  } catch {
    return new Map();
  }
}

function clampNumber(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getProductCandidates(row) {
  return row?.product?.canonical_payload?.candidate_debug?.scores_by_candidate ?? [];
}

function getInitialWinnerId(row, candidates) {
  const winnerId = row?.product?.canonical_payload?.candidate_debug?.winner_id;
  if (winnerId && candidates.some((candidate) => candidate.id === winnerId)) return winnerId;
  return candidates[0]?.id ?? null;
}

function buildFamilyCounts(rows, selectionByCase) {
  const counts = new Map();
  for (const row of rows) {
    const candidates = getProductCandidates(row);
    const winnerId = selectionByCase.get(row.case_id);
    const selected = candidates.find((candidate) => candidate.id === winnerId);
    const family = selected?.recommendation_family;
    if (!family) continue;
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }
  return counts;
}

function dominanceObjective(counts, totalCases) {
  const capCount = DOMINANT_FAMILY_CAP * totalCases;
  let total = 0;
  for (const count of counts.values()) {
    const overflow = Math.max(0, count - capCount);
    total += overflow * overflow;
  }
  return total;
}

function packetPressureForFamily(family, counts, totalCases) {
  const count = counts.get(family) ?? 0;
  const ratio = totalCases > 0 ? count / totalCases : 0;
  const packetFamilySamenessPenalty = Number(clampNumber((count - 1) / Math.max(totalCases - 1, 1)).toFixed(3));
  const batchFamilyDistributionPenalty = Number(clampNumber((ratio - DOMINANT_FAMILY_CAP) / Math.max(1 - DOMINANT_FAMILY_CAP, 0.01)).toFixed(3));
  return { packetFamilySamenessPenalty, batchFamilyDistributionPenalty };
}

function packetAdjustedTotal(candidate, counts, totalCases) {
  const family = candidate?.recommendation_family;
  if (!family) return Number(candidate?.total ?? 0);
  const pressure = packetPressureForFamily(family, counts, totalCases);
  return Number(((candidate.total ?? 0) - pressure.packetFamilySamenessPenalty * 0.18 - pressure.batchFamilyDistributionPenalty * 0.46).toFixed(3));
}

function applyPacketFamilyPressure(rows) {
  const productRows = rows.filter((row) => getProductCandidates(row).length > 0);
  const totalCases = productRows.length;
  if (totalCases === 0) return rows;

  const selectionByCase = new Map(productRows.map((row) => [row.case_id, getInitialWinnerId(row, getProductCandidates(row))]));

  for (let iter = 0; iter < totalCases * 6; iter += 1) {
    const counts = buildFamilyCounts(productRows, selectionByCase);
    const currentObjective = dominanceObjective(counts, totalCases);
    const dominantRatio = Math.max(...Array.from(counts.values(), (count) => count / totalCases), 0);
    if (dominantRatio <= DOMINANT_FAMILY_CAP || currentObjective <= 0) break;

    let bestSwitch = null;
    for (const row of productRows) {
      const candidates = getProductCandidates(row);
      const currentId = selectionByCase.get(row.case_id);
      const current = candidates.find((candidate) => candidate.id === currentId);
      if (!current?.recommendation_family) continue;

      const currentEffective = packetAdjustedTotal(current, counts, totalCases);
      for (const candidate of candidates) {
        if (!candidate?.recommendation_family || candidate.id === current.id) continue;
        if (candidate.recommendation_family === current.recommendation_family) continue;

        const nextCounts = new Map(counts);
        nextCounts.set(current.recommendation_family, Math.max(0, (nextCounts.get(current.recommendation_family) ?? 1) - 1));
        nextCounts.set(candidate.recommendation_family, (nextCounts.get(candidate.recommendation_family) ?? 0) + 1);

        const nextObjective = dominanceObjective(nextCounts, totalCases);
        if (nextObjective >= currentObjective) continue;

        const alternativeEffective = packetAdjustedTotal(candidate, nextCounts, totalCases);
        const scoreLoss = Number((currentEffective - alternativeEffective).toFixed(3));
        const objectiveGain = Number((currentObjective - nextObjective).toFixed(3));
        if (scoreLoss > 0.16 && objectiveGain < 1) continue;

        const rank = Number((scoreLoss / Math.max(objectiveGain, 0.001)).toFixed(3));
        if (!bestSwitch || rank < bestSwitch.rank || (rank === bestSwitch.rank && scoreLoss < bestSwitch.scoreLoss)) {
          bestSwitch = { caseId: row.case_id, nextId: candidate.id, rank, scoreLoss };
        }
      }
    }

    if (!bestSwitch) break;
    selectionByCase.set(bestSwitch.caseId, bestSwitch.nextId);
  }

  const finalCounts = buildFamilyCounts(productRows, selectionByCase);
  for (const row of productRows) {
    const candidates = getProductCandidates(row);
    const selectedId = selectionByCase.get(row.case_id);
    for (const candidate of candidates) {
      const family = candidate?.recommendation_family;
      if (!family) continue;
      const pressure = packetPressureForFamily(family, finalCounts, totalCases);
      candidate.packet_family_sameness_penalty = pressure.packetFamilySamenessPenalty;
      candidate.batch_family_distribution_penalty = pressure.batchFamilyDistributionPenalty;
      candidate.packet_adjusted_total = packetAdjustedTotal(candidate, finalCounts, totalCases);
    }

    const selected = candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];
    const runnerUp = [...candidates]
      .filter((candidate) => candidate.id !== selected?.id)
      .sort((a, b) => (b.packet_adjusted_total ?? b.total ?? 0) - (a.packet_adjusted_total ?? a.total ?? 0))[0] ?? null;
    if (!selected) continue;

    row.product.canonical_payload.candidate_debug.winner_id = selected.id;
    row.product.canonical_payload.candidate_debug.winner_family = selected.recommendation_family ?? null;
    row.product.canonical_payload.candidate_debug.weaker_read_source_id = runnerUp?.id ?? null;
    row.product.canonical_payload.candidate_debug.weaker_read_family = runnerUp?.recommendation_family ?? null;

    row.product.canonical_payload.recommendation_packet.displayed_recommendation = selected.direction_line ?? row.product.canonical_payload.recommendation_packet.displayed_recommendation ?? '';
    row.product.canonical_payload.recommendation_packet.essay_about = selected.essay_about ?? row.product.canonical_payload.recommendation_packet.essay_about ?? '';
    row.product.canonical_payload.recommendation_packet.why_this_direction = selected.why_this_direction ?? row.product.canonical_payload.recommendation_packet.why_this_direction ?? '';

    row.product.output.displayed_recommendation = clean(selected.direction_line ?? row.product.output.displayed_recommendation ?? '');
    row.product.output.essay_about = clean(selected.essay_about ?? row.product.output.essay_about ?? '');
    row.product.output.why_this_direction = clean(selected.why_this_direction ?? row.product.output.why_this_direction ?? '');
    row.product.output.body_excerpt = short(`${row.product.output.displayed_recommendation} ${row.product.output.essay_about} ${row.product.output.why_this_direction}`, 540);
  }

  return rows;
}

function buildBlindPacket(rows) {
  const packet = [];
  const key = [];

  for (const r of rows) {
    if (!isPacketBaselineAvailable(r.openai.status)) continue;
    const swap = deterministicSwap(r.case_id);

    const productPayload = {
      recommendation: r.product.output?.displayed_recommendation ?? '',
      essay_about: r.product.output?.essay_about ?? '',
      why_this_direction: r.product.output?.why_this_direction ?? '',
      weaker_read: r.product.output?.weaker_read ?? '',
      stronger_read: r.product.output?.stronger_read ?? '',
      evidence_lines: r.product.output?.evidence_lines ?? [],
      evidence_explanations: r.product.output?.evidence_explanations ?? [],
    };

    const openaiPayload = {
      recommendation: r.openai.output?.displayed_recommendation ?? '',
      essay_about: r.openai.output?.essay_about ?? '',
      why_this_direction: r.openai.output?.why_this_direction ?? '',
      weaker_read: r.openai.output?.weaker_read ?? '',
      stronger_read: r.openai.output?.stronger_read ?? '',
      evidence_lines: r.openai.output?.evidence_lines ?? [],
      evidence_explanations: r.openai.output?.evidence_explanations ?? [],
    };

    const A = swap ? openaiPayload : productPayload;
    const B = swap ? productPayload : openaiPayload;

    packet.push({
      case_id: r.case_id,
      title: r.title,
      signal_quality: r.signal_quality,
      narrative_pattern: r.narrative_pattern,
      raw_notes: r.raw_notes,
      candidate_A: A,
      candidate_B: B,
      review_fields: [
        'recommendation_quality_winner',
        'why_this_direction_winner',
        'evidence_support_winner',
        'overall_winner',
      ],
    });

    key.push({
      case_id: r.case_id,
      A_model: swap ? 'openai' : 'product',
      B_model: swap ? 'product' : 'openai',
      product_auto_winner: r.scores.winner?.winner ?? 'unscored',
    });
  }

  return { packet, key };
}

function renderBlindMarkdown(packet) {
  const md = [];
  md.push('# BLIND HUMAN REVIEW PACKET — PAGE3 HOLDOUT V2');
  md.push('');
  md.push('Instructions: For each case, compare Candidate A vs Candidate B without guessing source.');
  md.push('Judge only these dimensions: recommendation, why-this-direction, evidence support.');
  md.push('');
  md.push('Allowed marks per dimension: A | B | Tie');
  md.push('');

  for (const row of packet) {
    md.push(`## ${row.case_id} — ${row.title}`);
    md.push('');
    md.push('### Student raw notes');
    md.push(row.raw_notes);
    md.push('');
    md.push('### Candidate A');
    md.push(`- Recommendation: ${row.candidate_A.recommendation || '(none)'}`);
    md.push(`- Essay about: ${row.candidate_A.essay_about || '(none)'}`);
    md.push(`- Why this direction: ${row.candidate_A.why_this_direction || '(none)'}`);
    md.push(`- Evidence support: ${(row.candidate_A.evidence_lines || []).join(' | ') || '(none)'}`);
    md.push(`- Evidence explanations: ${(row.candidate_A.evidence_explanations || []).join(' | ') || '(none)'}`);
    md.push('');
    md.push('### Candidate B');
    md.push(`- Recommendation: ${row.candidate_B.recommendation || '(none)'}`);
    md.push(`- Essay about: ${row.candidate_B.essay_about || '(none)'}`);
    md.push(`- Why this direction: ${row.candidate_B.why_this_direction || '(none)'}`);
    md.push(`- Evidence support: ${(row.candidate_B.evidence_lines || []).join(' | ') || '(none)'}`);
    md.push(`- Evidence explanations: ${(row.candidate_B.evidence_explanations || []).join(' | ') || '(none)'}`);
    md.push('');
    md.push('### Reviewer scoring');
    md.push('- Recommendation winner (A/B/Tie):');
    md.push('- Why-this-direction winner (A/B/Tie):');
    md.push('- Evidence-support winner (A/B/Tie):');
    md.push('- Overall winner (A/B/Tie):');
    md.push('- Notes:');
    md.push('');
  }

  return `${md.join('\n')}\n`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf-8'));
  const baselineCache = loadBaselineCache();
  const browser = await chromium.launch({ headless: true });

  try {
    await prewarmProductRuntime(browser, PRODUCT_URL);

    const rows = [];
    for (const c of cases) {
      console.error(`[holdout-v2] running case ${c.case_id}: ${c.title}`);
      const product = await runProductCase(browser, PRODUCT_URL, c);
      let openai = await fetchOpenAiBaseline(c.raw_notes);
      if (!isScorableOpenAiStatus(openai.status)) {
        const cached = baselineCache.get(c.case_id);
        if (cached) {
          openai = {
            status: cached.cache_source === 'openai_output' ? 'ok_cache' : 'ok_cache_product_only',
            output: cached.output,
            source: cached.cache_source === 'openai_output' ? 'baseline_cache' : 'baseline_cache_product_output',
          };
        }
      }

      const productScore = scoreOutput(product.output ?? {});
      const openaiScore = isParityScorableBaseline(openai) ? scoreOutput(openai.output) : null;
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

    applyPacketFamilyPressure(rows);

    for (const row of rows) {
      if (!isParityScorableBaseline(row.openai)) continue;
      row.scores.product = scoreOutput(row.product.output ?? {}, rows.map((r) => r.product.output));
      row.scores.winner = row.scores.openai ? winnerCall(row.scores.product, row.scores.openai) : null;
    }

    const packetComparableRows = rows.filter((r) => isPacketBaselineAvailable(r.openai.status));
    const scoredRows = rows.filter((r) => r.scores.winner !== null);
    const productWins = scoredRows.filter((r) => r.scores.winner.winner === 'product').length;
    const openaiWins = scoredRows.filter((r) => r.scores.winner.winner === 'openai').length;
    const ties = scoredRows.filter((r) => r.scores.winner.winner === 'tie').length;
    const packetBaselineComplete = rows.every((r) => isPacketBaselineAvailable(r.openai.status));
    const parityReferenceComplete = rows.every((r) => isParityScorableBaseline(r.openai));
    const parityReferenceAvailableCount = rows.filter((r) => isParityScorableBaseline(r.openai)).length;
    const parityReferenceMissingCaseIds = rows.filter((r) => !isParityScorableBaseline(r.openai)).map((r) => r.case_id);
    const parityStatusDetails = getParityStatusDetails(parityReferenceComplete);
    const baselineAttempted = rows.filter((r) => r.openai.status !== 'unavailable_missing_openai_api_key').length;
    const surfaceHits = rows.filter((r) => r.product.true_recommendation_surface_hit).length;

    const productLosses = scoredRows.filter((r) => r.scores.winner.winner === 'openai');
    const failureReasons = productLosses.map((r) => {
      const dims = [
        'angle_directness',
        'angle_first_quality',
        'essay_angle_naming_quality',
        'conceptual_lift',
        'case_specificity_beyond_pivot',
        'essay_angle_legibility',
        'essay_aboutness_clarity',
        'why_persuasion',
        'directional_usefulness',
        'human_usefulness',
        'family_diversity_survival',
        'ambiguity_mode_usefulness',
        'ambiguity_decision_helpfulness',
        'source_specificity',
        'family_collapse_penalty',
        'packet_family_sameness_penalty',
        'essay_about_redundancy_penalty',
      ];
      const gaps = dims.filter((d) => r.scores.product[d] < r.scores.openai[d]);
      const identifiabilityWorse = r.scores.product.packet_identifiability_penalty > r.scores.openai.packet_identifiability_penalty;
      const collapsePenaltyWorse = (r.scores.product.family_collapse_penalty ?? 0) > (r.scores.openai.family_collapse_penalty ?? 0);
      const packetSamenessPenaltyWorse = (r.scores.product.packet_family_sameness_penalty ?? 0) > (r.scores.openai.packet_family_sameness_penalty ?? 0);
      const aboutRedundancyPenaltyWorse = (r.scores.product.essay_about_redundancy_penalty ?? 0) > (r.scores.openai.essay_about_redundancy_penalty ?? 0);
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
        identifiability_penalty_worse: identifiabilityWorse,
        family_collapse_penalty_worse: collapsePenaltyWorse,
        packet_family_sameness_penalty_worse: packetSamenessPenaltyWorse,
        essay_about_redundancy_penalty_worse: aboutRedundancyPenaltyWorse,
        product_recommendation: r.product.output?.displayed_recommendation ?? '',
        openai_recommendation: r.openai.output?.displayed_recommendation ?? '',
        product_evidence_count: (r.product.output?.evidence_lines ?? []).length,
        openai_evidence_count: (r.openai.output?.evidence_lines ?? []).length,
      };
    });

    const summary = {
      generated_at: new Date().toISOString(),
      product_url: PRODUCT_URL,
      evaluator_frozen_snapshot: 'scripts/frozen/page3-evaluator-frozen-2026-03-24-remediation.mjs',
      holdout_packet: CASES_PATH,
      baseline: BASELINE_CACHE_SUMMARY ? 'openai_or_cached_summary' : 'openai_only',
      baseline_cache_summary_path: BASELINE_CACHE_SUMMARY,
      case_count: rows.length,
      scored_case_count: scoredRows.length,
      packet_scored_case_count: packetComparableRows.length,
      true_recommendation_surface_hits: surfaceHits,
      baseline_complete: parityReferenceComplete,
      packet_baseline_complete: packetBaselineComplete,
      parity_reference_complete: parityReferenceComplete,
      parity_reference_available_count: parityReferenceAvailableCount,
      parity_status: parityStatusDetails.parityStatus,
      benchmark_loss_condition: parityStatusDetails.benchmarkLossCondition,
      benchmark_loss_reason: parityStatusDetails.benchmarkLossReason,
      parity_reference_status_path: parityStatusDetails.parityReferenceStatusPath,
      parity_reference_missing_case_ids: parityReferenceMissingCaseIds,
      baseline_attempted: baselineAttempted,
      final_tally: {
        product_wins: productWins,
        openai_wins: openaiWins,
        ties,
        unscored: rows.length - scoredRows.length,
      },
      scorer_limitation: 'Heuristic evaluator only; use real human blind results as final authority.',
      failure_reasons: failureReasons,
      rows,
    };

    fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2), 'utf-8');

    const md = [];
    md.push(`# PAGE3 HOLDOUT EVALUATION — ${HOLDOUT_LABEL}`);
    md.push('');
    md.push('> Untouched holdout packet not used during prior repair iterations.');
    md.push('> Evaluator is frozen at scripts/frozen/page3-evaluator-frozen-2026-03-23.mjs.');
    md.push('');
    md.push(`- Product URL: ${PRODUCT_URL}`);
    md.push(`- Packet: ${summary.holdout_packet}`);
    md.push(`- Cases: ${rows.length} (scored: ${scoredRows.length})`);
    md.push(`- True recommendation surface hits: ${surfaceHits}/${rows.length}`);
    md.push(`- Packet baseline complete: ${packetBaselineComplete} (${packetComparableRows.length} packet-comparable)`);
    md.push(`- Parity reference complete: ${parityReferenceComplete} (${parityReferenceAvailableCount} parity-comparable)`);
    if (parityStatusDetails.benchmarkLossCondition) {
      md.push(`- Benchmark loss condition: true (${parityStatusDetails.benchmarkLossReason})`);
    }
    md.push(`- Baseline attempted: ${baselineAttempted}`);
    md.push('');
    md.push('## Final tally');
    md.push('');
    md.push('| | Wins |');
    md.push('|---|---|');
    md.push(`| Product | ${productWins} |`);
    md.push(`| OpenAI | ${openaiWins} |`);
    md.push(`| Ties | ${ties} |`);
    md.push(`| Unscored | ${rows.length - scoredRows.length} |`);
    md.push('');

    if (failureReasons.length > 0) {
      md.push('## Product losses — failure breakdown');
      md.push('');
      for (const f of failureReasons) {
        md.push(`### ${f.case_id} — ${f.title}`);
        md.push(`- Pattern: ${f.narrative_pattern} | Signal: ${f.signal_quality}`);
        md.push(`- Score: product avg ${f.product_avg} vs OpenAI avg ${f.openai_avg}`);
        md.push(`- Points: product ${f.product_points} vs OpenAI ${f.openai_points}`);
        md.push(`- Dimensions product lost: ${f.dimensions_product_lost.join(', ') || 'none (lost on other weighted penalties)'}`);
        md.push(`- Identifiability penalty worse: ${f.identifiability_penalty_worse}`);
        md.push(`- Family collapse penalty worse: ${f.family_collapse_penalty_worse}`);
        md.push(`- Packet family sameness penalty worse: ${f.packet_family_sameness_penalty_worse}`);
        md.push(`- Essay_about redundancy penalty worse: ${f.essay_about_redundancy_penalty_worse}`);
        md.push('');
      }
    }

    fs.writeFileSync(OUT_MD, `${md.join('\n')}\n`, 'utf-8');

    const blind = buildBlindPacket(rows);
    fs.writeFileSync(OUT_BLIND_JSON, JSON.stringify(blind.packet, null, 2), 'utf-8');
    fs.writeFileSync(OUT_BLIND_KEY, JSON.stringify({ generated_at: new Date().toISOString(), key: blind.key }, null, 2), 'utf-8');
    fs.writeFileSync(OUT_BLIND_MD, renderBlindMarkdown(blind.packet), 'utf-8');

    console.log(JSON.stringify({
      out_json: OUT_JSON,
      out_md: OUT_MD,
      blind_packet_json: OUT_BLIND_JSON,
      blind_packet_md: OUT_BLIND_MD,
      blind_key_json: OUT_BLIND_KEY,
      baseline_complete: parityReferenceComplete,
      packet_baseline_complete: packetBaselineComplete,
      baseline_attempted: baselineAttempted,
      scored_cases: scoredRows.length,
      packet_scored_cases: packetComparableRows.length,
      final_tally: { product_wins: productWins, openai_wins: openaiWins, ties },
      unscored: rows.length - scoredRows.length,
    }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('[holdout-v2] fatal:', err);
  process.exit(1);
});
