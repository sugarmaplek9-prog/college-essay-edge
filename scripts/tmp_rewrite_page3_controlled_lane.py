from pathlib import Path

content = r'''import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const ROOT = process.cwd();
const CASES_PATH = process.env.PAGE3_CONTROLLED_CASES_PATH
  ? path.resolve(ROOT, process.env.PAGE3_CONTROLLED_CASES_PATH)
  : path.join(ROOT, 'scripts', 'data', 'page3-controlled-testing-lane-v1.sample.json');
const OUT_DIR = process.env.PAGE3_CONTROLLED_OUT_DIR
  ? path.resolve(ROOT, process.env.PAGE3_CONTROLLED_OUT_DIR)
  : path.join(ROOT, 'evaluation_outputs', 'page3_controlled_testing_v1');
const OUT_JSON = path.join(OUT_DIR, 'CONTROLLED_TESTING_SUMMARY_V1.json');
const OUT_MD = path.join(OUT_DIR, 'CONTROLLED_TESTING_SUMMARY_V1.md');
const HARD_FAIL_REASONS = new Set([
  'claim_first_clarity_fail',
  'plain_claim_clarity_fail',
  'why_coaching_clarity_fail',
  'no_concrete_next_step',
  'essay_about_restate_fail',
  'comprehension_fail',
]);

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function short(v, max = 540) {
  const t = clean(v);
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function prefix(text, n = 5) {
  return clean(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, n).join(' ');
}

function semanticShell(v) {
  const s = clean(v).toLowerCase();
  if (/^(build from|build this|build the essay)/.test(s)) return 'build_from';
  if (/^(anchor in|anchor the essay)/.test(s)) return 'anchor_in';
  if (/^(name the essay as|name the essay angle as|name this essay as)/.test(s)) return 'name_essay_as';
  if (/^(use the scene where|use the moment where|start with the scene where)/.test(s)) return 'use_scene_where';
  if (/^(focus on)/.test(s)) return 'focus_on';
  if (/^(frame the draft around|frame the essay around)/.test(s)) return 'frame_around';
  if (/^(tell the story through)/.test(s)) return 'tell_story_through';
  if (/^essay angle:/.test(s)) return 'essay_angle';
  return `other:${prefix(s, 3)}`;
}

function runCommand(command, args, label) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    env: process.env,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status})\n${res.stdout}\n${res.stderr}`);
  }
  return res;
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function withManagedProductUrl(run) {
  if (process.env.PRODUCT_URL) {
    return run(process.env.PRODUCT_URL);
  }

  const port = process.env.PAGE3_CONTROLLED_PORT ?? '3399';
  const url = `http://127.0.0.1:${port}`;
  runCommand('npm', ['run', 'build'], 'page3 controlled build');

  const server = spawn('npm', ['run', 'start', '--', '-p', port], {
    cwd: ROOT,
    env: process.env,
    stdio: 'ignore',
  });

  try {
    await waitForUrl(`${url}/start`);
    return await run(url);
  } finally {
    server.kill('SIGTERM');
  }
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
  }, { timeout: 25000 });
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

function summarizeCandidates(canonicalPayload) {
  const debug = canonicalPayload?.candidate_debug ?? {};
  const candidates = debug.scores_by_candidate ?? [];
  const winner = candidates.find((candidate) => candidate.id === debug.winner_id) ?? null;
  const strictSurvivors = candidates.filter((candidate) => {
    const reasons = candidate.rejection_reasons ?? [];
    return reasons.length < 2 && !reasons.some((reason) => HARD_FAIL_REASONS.has(reason));
  });
  const sorted = [...candidates].sort((a, b) => (b.total ?? -Infinity) - (a.total ?? -Infinity));
  const winnerTotal = Number(winner?.total ?? 0);
  const suppressedStrongCandidates = sorted
    .filter((candidate) => candidate.id !== debug.winner_id)
    .filter((candidate) => Number(candidate.total ?? 0) >= winnerTotal - 0.12)
    .filter((candidate) => (candidate.rejection_reasons ?? []).length > 0)
    .slice(0, 3)
    .map((candidate) => ({
      id: candidate.id,
      family: candidate.recommendation_family,
      total: candidate.total,
      rejection_reasons: candidate.rejection_reasons ?? [],
    }));

  const rejectionCounts = new Map();
  for (const candidate of candidates) {
    for (const reason of candidate.rejection_reasons ?? []) {
      rejectionCounts.set(reason, (rejectionCounts.get(reason) ?? 0) + 1);
    }
  }

  return {
    winner_id: debug.winner_id ?? null,
    winner_family: debug.winner_family ?? null,
    candidates_generated: Number(debug.candidates_generated ?? candidates.length ?? 0),
    strict_survivor_count: strictSurvivors.length,
    thin_candidate_coverage: strictSurvivors.length < 3,
    fallback_path_used: Boolean((debug.winner_id ?? '').includes('_shadow') || candidates.some((candidate) => String(candidate.id ?? '').includes('_shadow'))),
    weaker_read_source_id: debug.weaker_read_source_id ?? null,
    weaker_read_family: debug.weaker_read_family ?? null,
    suppressed_strong_candidates: suppressedStrongCandidates,
    top_rejection_reasons: [...rejectionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count })),
  };
}

async function runCase(browser, row, productUrl) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
  const routeTrace = [];
  try {
    await page.goto(`${productUrl}/start`, { waitUntil: 'networkidle' });
    routeTrace.push(page.url());

    await page.getByLabel('Your notes or draft').fill(row.raw_notes);
    await page.getByRole('button', { name: /Find the strongest direction|Show me possible directions|See what's here/i }).first().click();
    await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });
    routeTrace.push(page.url());

    if (page.url().includes('/start/reflecting')) {
      await waitForReflectingLoaded(page);
      const btn = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await page.waitForURL('**/start/direction', { timeout: 15000 });
        routeTrace.push(page.url());
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
    let mainText = '';
    if (page.url().includes('/start/direction')) {
      await waitForDirectionLoaded(page);
      mainText = await page.locator('main').innerText().catch(() => '');
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
        next_step: clean(packet?.next_step || packet?.next_move || ''),
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
        next_step: clean(packet.next_step || packet.next_move || ''),
        evidence_lines: (packet.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
        evidence_explanations: (packet.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
        body_excerpt: short(`${packet.displayed_recommendation || ''} ${packet.essay_about || ''} ${packet.why_this_direction || ''}`, 540),
      };
    }

    const instrumentation = summarizeCandidates(canonicalPayload);
    return {
      case_id: row.case_id,
      title: row.title,
      tags: row.tags ?? [],
      operator_notes: row.operator_notes ?? '',
      review_notes: row.review_notes ?? '',
      raw_notes: row.raw_notes,
      route_trace: routeTrace,
      final_url: page.url(),
      route_category: page.url().split('/').pop() ?? '',
      output,
      instrumentation: {
        ...instrumentation,
        recommendation_prefix_5: prefix(output?.displayed_recommendation || ''),
        semantic_shell: semanticShell(output?.displayed_recommendation || ''),
        final_url: page.url(),
      },
      canonical_payload_excerpt: canonicalPayload ? {
        route: canonicalPayload.route ?? null,
        effective_product_mode: canonicalPayload.effectiveProductMode ?? null,
        recommendation_packet: canonicalPayload.recommendation_packet ?? null,
      } : null,
    };
  } finally {
    await page.close();
  }
}

function aggregate(rows) {
  const familyCounts = new Map();
  const prefixCounts = new Map();
  const shellCounts = new Map();
  let fallbackCount = 0;
  let thinCoverageCount = 0;

  for (const row of rows) {
    const family = row.instrumentation.winner_family;
    if (family) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    const pref = row.instrumentation.recommendation_prefix_5;
    if (pref) prefixCounts.set(pref, (prefixCounts.get(pref) ?? 0) + 1);
    const shell = row.instrumentation.semantic_shell;
    if (shell) shellCounts.set(shell, (shellCounts.get(shell) ?? 0) + 1);
    if (row.instrumentation.fallback_path_used) fallbackCount += 1;
    if (row.instrumentation.thin_candidate_coverage) thinCoverageCount += 1;
  }

  const topEntries = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => ({ key, count }));

  return {
    case_count: rows.length,
    fallback_case_count: fallbackCount,
    thin_coverage_case_count: thinCoverageCount,
    family_distribution: topEntries(familyCounts),
    top_prefixes: topEntries(prefixCounts),
    top_semantic_shells: topEntries(shellCounts),
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf8'));

  await withManagedProductUrl(async (productUrl) => {
    const browser = await chromium.launch({ headless: true });

    try {
      const rows = [];
      for (const row of cases) {
        console.error(`[page3-controlled] ${row.case_id}: ${row.title}`);
        rows.push(await runCase(browser, row, productUrl));
      }

      const summary = {
        generated_at: new Date().toISOString(),
        product_url: productUrl,
        cases_path: CASES_PATH,
        out_dir: OUT_DIR,
        batch_summary: aggregate(rows),
        rows,
      };

      fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2));

      const md = [
        '# Page 3 Controlled Testing Summary V1',
        '',
        `- product_url: ${productUrl}`,
        `- cases_path: ${CASES_PATH}`,
        `- case_count: ${summary.batch_summary.case_count}`,
        `- fallback_case_count: ${summary.batch_summary.fallback_case_count}`,
        `- thin_coverage_case_count: ${summary.batch_summary.thin_coverage_case_count}`,
        '',
        '## Batch signals',
        ...summary.batch_summary.family_distribution.map((entry) => `- family ${entry.key}: ${entry.count}`),
        ...summary.batch_summary.top_prefixes.map((entry) => `- prefix ${entry.key}: ${entry.count}`),
        ...summary.batch_summary.top_semantic_shells.map((entry) => `- shell ${entry.key}: ${entry.count}`),
        '',
        '## Cases',
        ...rows.flatMap((row) => [
          `### ${row.case_id} — ${row.title}`,
          `- route_category: ${row.route_category}`,
          `- winner: ${row.instrumentation.winner_id || 'none'} (${row.instrumentation.winner_family || 'unknown'})`,
          `- candidates_generated: ${row.instrumentation.candidates_generated}`,
          `- strict_survivor_count: ${row.instrumentation.strict_survivor_count}`,
          `- fallback_path_used: ${row.instrumentation.fallback_path_used}`,
          `- thin_candidate_coverage: ${row.instrumentation.thin_candidate_coverage}`,
          `- recommendation: ${row.output?.displayed_recommendation || '(none)'}`,
          `- essay_about: ${row.output?.essay_about || '(none)'}`,
          `- why_this_direction: ${row.output?.why_this_direction || '(none)'}`,
          `- stronger_read: ${row.output?.stronger_read || '(none)'}`,
          `- weaker_read: ${row.output?.weaker_read || '(none)'}`,
          `- next_step: ${row.output?.next_step || '(none)'}`,
          `- operator_notes: ${row.operator_notes || '(none)'}`,
          `- suppressed_strong_candidates: ${row.instrumentation.suppressed_strong_candidates.map((candidate) => `${candidate.id}:${candidate.total}`).join(' | ') || 'none'}`,
          '',
        ]),
      ].join('\n');

      fs.writeFileSync(OUT_MD, `${md}\n`);
      console.log(JSON.stringify({ out_json: OUT_JSON, out_md: OUT_MD, case_count: rows.length, fallback_case_count: summary.batch_summary.fallback_case_count }, null, 2));
    } finally {
      await browser.close();
    }
  });
}

main().catch((error) => {
  console.error('[page3-controlled] fatal:', error);
  process.exit(1);
});
'''

Path('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-controlled-testing-lane.mjs').write_text(content)
print('rewrote page3-controlled-testing-lane.mjs')
