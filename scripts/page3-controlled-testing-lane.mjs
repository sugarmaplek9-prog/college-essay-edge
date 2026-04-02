import fs from 'node:fs';
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

function round4(v) { return Math.round(v * 10000) / 10000; }

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

  // Composition instrumentation: extract from all candidates
  const compositionIssueCounts = new Map();
  let compositionFailedCount = 0;
  let fallbackReplacedCount = 0;
  const fallbackReasonCounts = new Map();
  const perCandidateComposition = candidates.map((candidate) => {
    const ci = candidate.composition_instrumentation;
    if (!ci) return { id: candidate.id, family: candidate.recommendation_family, composition_instrumentation: null };
    if (ci.composition_failed) compositionFailedCount += 1;
    if (ci.fallback_replaced) fallbackReplacedCount += 1;
    fallbackReasonCounts.set(ci.fallback_reason, (fallbackReasonCounts.get(ci.fallback_reason) ?? 0) + 1);
    for (const issue of ci.composition_issues ?? []) {
      compositionIssueCounts.set(issue, (compositionIssueCounts.get(issue) ?? 0) + 1);
    }
    return { id: candidate.id, family: candidate.recommendation_family, composition_instrumentation: ci };
  });

  const winnerComposition = winner?.composition_instrumentation ?? null;

  // ── Winner-path diagnostics ──
  const runnerUp = sorted.find((c) => c.id !== (debug.winner_id ?? null)) ?? null;
  const runnerUpTotal = Number(runnerUp?.total ?? 0);
  const marginOverRunnerUp = winnerTotal - runnerUpTotal;

  const perFamilyScores = candidates.map((c) => ({
    id: c.id,
    family: c.recommendation_family,
    total: Number(c.total ?? 0),
    family_fit_base: Number(c.family_fit_base ?? 0),
    family_fit: Number(c.family_fit ?? 0),
    family_fit_gap: Number(c.family_fit_gap ?? 0),
    pattern_conditioned_misfit_penalty: Number(c.pattern_conditioned_misfit_penalty ?? 0),
    pre_penalty_total: Number(c.pre_penalty_total ?? 0),
    post_penalty_total: Number(c.post_penalty_total ?? 0),
    human_preference_likelihood: Number(c.human_preference_likelihood ?? 0),
    dominant_family_overuse_penalty: Number(c.dominant_family_overuse_penalty ?? 0),
    abstraction_penalty: Number(c.abstraction_penalty ?? 0),
    rejection_reasons: c.rejection_reasons ?? [],
    direction_prefix_5: prefix(c.direction_line ?? '', 5),
  }));

  const winnerFamilyFitBase = Number(winner?.family_fit_base ?? 0);
  const runnerUpFamilyFitBase = Number(runnerUp?.family_fit_base ?? 0);
  const familyFitAdvantage = winnerFamilyFitBase - runnerUpFamilyFitBase;
  const winnerMisfitPenalty = Number(winner?.pattern_conditioned_misfit_penalty ?? 0);
  const runnerUpMisfitPenalty = Number(runnerUp?.pattern_conditioned_misfit_penalty ?? 0);

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
    // Winner-path diagnostics
    winner_path: {
      winner_total: winnerTotal,
      runner_up_id: runnerUp?.id ?? null,
      runner_up_family: runnerUp?.recommendation_family ?? null,
      runner_up_total: runnerUpTotal,
      margin_over_runner_up: round4(marginOverRunnerUp),
      winner_family_fit_base: winnerFamilyFitBase,
      runner_up_family_fit_base: runnerUpFamilyFitBase,
      family_fit_base_advantage: round4(familyFitAdvantage),
      winner_family_fit: Number(winner?.family_fit ?? 0),
      runner_up_family_fit: Number(runnerUp?.family_fit ?? 0),
      winner_misfit_penalty: winnerMisfitPenalty,
      runner_up_misfit_penalty: runnerUpMisfitPenalty,
      winner_pre_penalty_total: Number(winner?.pre_penalty_total ?? 0),
      runner_up_pre_penalty_total: Number(runnerUp?.pre_penalty_total ?? 0),
      per_family_scores: perFamilyScores,
    },
    // Composition instrumentation summary
    composition_summary: {
      candidates_with_composition_failure: compositionFailedCount,
      candidates_with_fallback_replacement: fallbackReplacedCount,
      composition_issue_counts: [...compositionIssueCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([issue, count]) => ({ issue, count })),
      fallback_reason_counts: [...fallbackReasonCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([reason, count]) => ({ reason, count })),
      winner_composition: winnerComposition,
      per_candidate: perCandidateComposition,
    },
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
    try {
      await page.waitForURL(/\/start\/(reflecting|direction|question|blocked)/, { timeout: 30000 });
    } catch {
      // Best-effort: continue with current route and canonical payload probe.
    }
    routeTrace.push(page.url());

    if (page.url().includes('/start/reflecting')) {
      try {
        await waitForReflectingLoaded(page);
      } catch {
        // Keep case execution alive when reflecting text gate is slow.
      }
      const btn = page.getByRole('button', { name: /Build from this direction/i }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        try {
          await page.waitForURL('**/start/direction', { timeout: 15000 });
        } catch {
          // Continue; some cases stay in reflecting/question/blocked.
        }
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
      try {
        await waitForDirectionLoaded(page);
      } catch {
        // Continue with best-effort extraction.
      }
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
        next_step: clean(packet?.next_step || packet?.next_move || packet?.first_coaching_step || ''),
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
        next_step: clean(packet.next_step || packet.next_move || packet.first_coaching_step || ''),
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
        candidate_debug: canonicalPayload.candidate_debug ?? null,
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
  let failedCaseCount = 0;

  // Composition failure aggregation
  let compositionFailureCaseCount = 0;
  let compositionFallbackCaseCount = 0;
  const compositionIssueTotals = new Map();
  const fallbackReasonTotals = new Map();
  const familyAwareFallbackCaseCount = { count: 0 };

  // Winner-path aggregation
  const margins = [];
  const familyFitBaseByFamily = new Map(); // family → [fitBase values]
  const familyTotalByFamily = new Map();   // family → [total values]
  let relationshipWinnerCount = 0;
  let runnerUpAlsoRelationship = 0;
  const winnerRunnerUpFamilyPairs = [];

  for (const row of rows) {
    if (row.status === 'error') {
      failedCaseCount += 1;
      continue;
    }

    const family = row.instrumentation?.winner_family;
    if (family) familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    const pref = row.instrumentation?.recommendation_prefix_5;
    if (pref) prefixCounts.set(pref, (prefixCounts.get(pref) ?? 0) + 1);
    const shell = row.instrumentation?.semantic_shell;
    if (shell) shellCounts.set(shell, (shellCounts.get(shell) ?? 0) + 1);
    if (row.instrumentation?.fallback_path_used) fallbackCount += 1;
    if (row.instrumentation?.thin_candidate_coverage) thinCoverageCount += 1;

    // Winner-path diagnostics
    const wp = row.instrumentation?.winner_path;
    if (wp) {
      margins.push(wp.margin_over_runner_up);
      if (family === 'relationship') relationshipWinnerCount += 1;
      if (wp.runner_up_family === 'relationship') runnerUpAlsoRelationship += 1;
      winnerRunnerUpFamilyPairs.push({ winner: family, runner_up: wp.runner_up_family });
      for (const pf of wp.per_family_scores ?? []) {
        const fam = pf.family;
        if (!familyFitBaseByFamily.has(fam)) familyFitBaseByFamily.set(fam, []);
        familyFitBaseByFamily.get(fam).push(pf.family_fit_base);
        if (!familyTotalByFamily.has(fam)) familyTotalByFamily.set(fam, []);
        familyTotalByFamily.get(fam).push(pf.total);
      }
    }

    // Composition diagnostics
    const cs = row.instrumentation?.composition_summary;
    if (cs) {
      if (cs.candidates_with_composition_failure > 0) compositionFailureCaseCount += 1;
      if (cs.candidates_with_fallback_replacement > 0) compositionFallbackCaseCount += 1;
      if (cs.winner_composition?.fallback_reason === 'family_aware_fallback') familyAwareFallbackCaseCount.count += 1;
      for (const { issue, count } of cs.composition_issue_counts ?? []) {
        compositionIssueTotals.set(issue, (compositionIssueTotals.get(issue) ?? 0) + count);
      }
      for (const { reason, count } of cs.fallback_reason_counts ?? []) {
        fallbackReasonTotals.set(reason, (fallbackReasonTotals.get(reason) ?? 0) + count);
      }
    }
  }

  const topEntries = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([key, count]) => ({ key, count }));
  const avg = (arr) => arr.length > 0 ? round4(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const min = (arr) => arr.length > 0 ? Math.min(...arr) : 0;
  const max = (arr) => arr.length > 0 ? Math.max(...arr) : 0;
  const median = (arr) => {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  const familyFitBaseSummary = [...familyFitBaseByFamily.entries()]
    .sort((a, b) => avg(b[1]) - avg(a[1]))
    .map(([fam, vals]) => ({ family: fam, mean: avg(vals), min: round4(min(vals)), max: round4(max(vals)), n: vals.length }));
  const familyTotalSummary = [...familyTotalByFamily.entries()]
    .sort((a, b) => avg(b[1]) - avg(a[1]))
    .map(([fam, vals]) => ({ family: fam, mean: avg(vals), min: round4(min(vals)), max: round4(max(vals)), median: round4(median(vals)), n: vals.length }));

  return {
    case_count: rows.length,
    failed_case_count: failedCaseCount,
    fallback_case_count: fallbackCount,
    thin_coverage_case_count: thinCoverageCount,
    family_distribution: topEntries(familyCounts),
    top_prefixes: topEntries(prefixCounts),
    top_semantic_shells: topEntries(shellCounts),
    winner_path_diagnostics: {
      relationship_winner_count: relationshipWinnerCount,
      runner_up_also_relationship: runnerUpAlsoRelationship,
      margin_stats: {
        mean: avg(margins),
        min: round4(min(margins)),
        max: round4(max(margins)),
        median: round4(median(margins)),
      },
      family_fit_base_by_family: familyFitBaseSummary,
      total_score_by_family: familyTotalSummary,
      winner_runner_up_pairs: winnerRunnerUpFamilyPairs,
    },
    composition_diagnostics: {
      cases_with_any_composition_failure: compositionFailureCaseCount,
      cases_with_any_fallback_replacement: compositionFallbackCaseCount,
      cases_with_family_aware_winner_fallback: familyAwareFallbackCaseCount.count,
      top_composition_issues: topEntries(compositionIssueTotals),
      top_fallback_reasons: topEntries(fallbackReasonTotals),
    },
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
        try {
          rows.push(await runCase(browser, row, productUrl));
        } catch (error) {
          rows.push({
            case_id: row.case_id,
            title: row.title,
            tags: row.tags ?? [],
            operator_notes: row.operator_notes ?? '',
            review_notes: row.review_notes ?? '',
            raw_notes: row.raw_notes,
            status: 'error',
            error: {
              name: error?.name ?? 'Error',
              message: String(error?.message ?? error),
            },
            route_trace: [],
            final_url: null,
            route_category: 'error',
            output: null,
            instrumentation: {
              winner_id: null,
              winner_family: null,
              candidates_generated: 0,
              strict_survivor_count: 0,
              thin_candidate_coverage: true,
              fallback_path_used: false,
              weaker_read_source_id: null,
              weaker_read_family: null,
              suppressed_strong_candidates: [],
              top_rejection_reasons: [],
              recommendation_prefix_5: '',
              semantic_shell: '',
              final_url: null,
            },
            canonical_payload_excerpt: null,
          });
        }
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

      const wpd = summary.batch_summary.winner_path_diagnostics;
      const md = [
        '# Page 3 Controlled Testing Summary V1',
        '',
        `- product_url: ${productUrl}`,
        `- cases_path: ${CASES_PATH}`,
        `- case_count: ${summary.batch_summary.case_count}`,
        `- failed_case_count: ${summary.batch_summary.failed_case_count}`,
        `- fallback_case_count: ${summary.batch_summary.fallback_case_count}`,
        `- thin_coverage_case_count: ${summary.batch_summary.thin_coverage_case_count}`,
        '',
        '## Winner-path dominance diagnostics',
        `- relationship_winner_count: ${wpd?.relationship_winner_count ?? 0}`,
        `- runner_up_also_relationship: ${wpd?.runner_up_also_relationship ?? 0}`,
        `- margin mean: ${wpd?.margin_stats?.mean ?? 0}`,
        `- margin min: ${wpd?.margin_stats?.min ?? 0}`,
        `- margin max: ${wpd?.margin_stats?.max ?? 0}`,
        `- margin median: ${wpd?.margin_stats?.median ?? 0}`,
        '',
        '### family_fit_base by family (mean / min / max)',
        ...(wpd?.family_fit_base_by_family ?? []).map((f) => `- ${f.family}: mean=${f.mean} min=${f.min} max=${f.max} (n=${f.n})`),
        '',
        '### total_score by family (mean / min / max / median)',
        ...(wpd?.total_score_by_family ?? []).map((f) => `- ${f.family}: mean=${f.mean} min=${f.min} max=${f.max} median=${f.median} (n=${f.n})`),
        '',
        '### Winner → runner-up family pairs',
        ...(wpd?.winner_runner_up_pairs ?? []).map((p) => `- ${p.winner} → ${p.runner_up}`),
        '',
        '## Composition diagnostics',
        `- cases_with_any_composition_failure: ${summary.batch_summary.composition_diagnostics?.cases_with_any_composition_failure ?? 0}`,
        `- cases_with_any_fallback_replacement: ${summary.batch_summary.composition_diagnostics?.cases_with_any_fallback_replacement ?? 0}`,
        `- cases_with_family_aware_winner_fallback: ${summary.batch_summary.composition_diagnostics?.cases_with_family_aware_winner_fallback ?? 0}`,
        ...(summary.batch_summary.composition_diagnostics?.top_composition_issues ?? []).map((entry) => `- composition_issue ${entry.key}: ${entry.count}`),
        ...(summary.batch_summary.composition_diagnostics?.top_fallback_reasons ?? []).map((entry) => `- fallback_reason ${entry.key}: ${entry.count}`),
        '',
        '## Batch signals',
        ...summary.batch_summary.family_distribution.map((entry) => `- family ${entry.key}: ${entry.count}`),
        ...summary.batch_summary.top_prefixes.map((entry) => `- prefix ${entry.key}: ${entry.count}`),
        ...summary.batch_summary.top_semantic_shells.map((entry) => `- shell ${entry.key}: ${entry.count}`),
        '',
        '## Cases',
        ...rows.flatMap((row) => [
          `### ${row.case_id} — ${row.title}`,
          `- status: ${row.status || 'ok'}`,
          `- error: ${row.error?.name ? `${row.error.name}: ${row.error.message}` : 'none'}`,
          `- route_category: ${row.route_category}`,
          `- winner: ${row.instrumentation?.winner_id || 'none'} (${row.instrumentation?.winner_family || 'unknown'})`,
          `- candidates_generated: ${row.instrumentation?.candidates_generated ?? 0}`,
          `- strict_survivor_count: ${row.instrumentation?.strict_survivor_count ?? 0}`,
          `- fallback_path_used: ${row.instrumentation?.fallback_path_used ?? false}`,
          `- thin_candidate_coverage: ${row.instrumentation?.thin_candidate_coverage ?? true}`,
          `- winner_composition_failed: ${row.instrumentation?.composition_summary?.winner_composition?.composition_failed ?? 'unknown'}`,
          `- winner_composition_issues: ${(row.instrumentation?.composition_summary?.winner_composition?.composition_issues ?? []).join(', ') || 'none'}`,
          `- winner_fallback_replaced: ${row.instrumentation?.composition_summary?.winner_composition?.fallback_replaced ?? 'unknown'}`,
          `- winner_fallback_reason: ${row.instrumentation?.composition_summary?.winner_composition?.fallback_reason ?? 'unknown'}`,
          `- winner_pre_fallback: ${short(row.instrumentation?.composition_summary?.winner_composition?.pre_fallback_recommendation ?? '', 200)}`,
          `- winner_post_fallback: ${short(row.instrumentation?.composition_summary?.winner_composition?.post_fallback_recommendation ?? '', 200)}`,
          `- **winner_path**: margin=${row.instrumentation?.winner_path?.margin_over_runner_up ?? '?'} runner_up=${row.instrumentation?.winner_path?.runner_up_family ?? '?'} w_fit_base=${row.instrumentation?.winner_path?.winner_family_fit_base ?? '?'} ru_fit_base=${row.instrumentation?.winner_path?.runner_up_family_fit_base ?? '?'} fit_adv=${row.instrumentation?.winner_path?.family_fit_base_advantage ?? '?'} w_misfit=${row.instrumentation?.winner_path?.winner_misfit_penalty ?? '?'} ru_misfit=${row.instrumentation?.winner_path?.runner_up_misfit_penalty ?? '?'}`,
          `- **per_family_totals**: ${(row.instrumentation?.winner_path?.per_family_scores ?? []).map((pf) => `${pf.family}=${pf.total}`).join(' | ')}`,
          `- recommendation: ${row.output?.displayed_recommendation || '(none)'}`,
          `- essay_about: ${row.output?.essay_about || '(none)'}`,
          `- why_this_direction: ${row.output?.why_this_direction || '(none)'}`,
          `- stronger_read: ${row.output?.stronger_read || '(none)'}`,
          `- weaker_read: ${row.output?.weaker_read || '(none)'}`,
          `- next_step: ${row.output?.next_step || '(none)'}`,
          `- operator_notes: ${row.operator_notes || '(none)'}`,
          `- suppressed_strong_candidates: ${(row.instrumentation?.suppressed_strong_candidates ?? []).map((candidate) => `${candidate.id}:${candidate.total}`).join(' | ') || 'none'}`,
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
