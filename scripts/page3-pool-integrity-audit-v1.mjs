import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = process.env.HOLDOUT_OUT_DIR
  ? path.resolve(ROOT, process.env.HOLDOUT_OUT_DIR)
  : path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');

const SUMMARY_PATH = path.join(OUT_DIR, 'summary.json');
const OUT_JSON = path.join(OUT_DIR, 'POOL_INTEGRITY_AUDIT_V1.json');
const OUT_MD = path.join(OUT_DIR, 'POOL_INTEGRITY_AUDIT_V1.md');

const MIN_VIABLE_SURVIVORS = Number(process.env.MIN_VIABLE_SURVIVORS ?? '3');
const HARD_FAIL_REASONS = new Set([
  'claim_first_clarity_fail',
  'plain_claim_clarity_fail',
  'why_coaching_clarity_fail',
  'no_concrete_next_step',
  'essay_about_restate_fail',
  'comprehension_fail',
]);
const SHELL_HARD_FAIL_REASONS = new Set([
  'cross_family_shell_sameness',
  'over_repeated_scaffold_family',
  'family_collapse_penalty',
  'decision_shell_penalty',
  'banned_recommendation_shell',
  'banned_why_shell',
]);

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function top(arr, n = 3) {
  return [...arr].sort((a, b) => b.count - a.count).slice(0, n);
}

function hasComparativeWhySignal(text) {
  return /\b(stronger|beats|rather than|instead of|compared|vs\.?|easier to trust)\b/i.test(text || '');
}

function hasDraftingPayoffSignal(text) {
  return /\b(drafting payoff|so you can draft|easier to draft|gives you a clear opening|clear opening|draft your opening|start by)\b/i.test(text || '');
}

function prefix5(text) {
  const t = (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  return t.split(' ').slice(0, 5).join(' ');
}

const summary = readJson(SUMMARY_PATH);

const familyCounts = new Map();
const prefixCounts = new Map();
const rejectCounts = new Map();
const caseAudits = [];

for (const row of summary.rows ?? []) {
  const cp = row.product?.canonical_payload ?? {};
  const debug = cp.candidate_debug ?? {};
  const candidates = debug.scores_by_candidate ?? [];
  const winnerId = debug.winner_id ?? null;

  // Skip route-blocked cases that produced no candidates (e.g. HV2_11)
  if (candidates.length === 0) continue;

  const winner = candidates.find((c) => c.id === winnerId) ?? candidates[0] ?? null;
  const winnerFamily = winner?.recommendation_family ?? null;
  if (winnerFamily) familyCounts.set(winnerFamily, (familyCounts.get(winnerFamily) ?? 0) + 1);

  const recommendation = cp.recommendation_packet?.displayed_recommendation ?? '';
  const recPrefix = prefix5(recommendation);
  if (recPrefix) prefixCounts.set(recPrefix, (prefixCounts.get(recPrefix) ?? 0) + 1);

  const strictSurvivors = candidates.filter((c) => {
    const reasons = c.rejection_reasons ?? [];
    return reasons.length < 2 && !reasons.some((r) => HARD_FAIL_REASONS.has(r));
  });
  const shellSafe = candidates.filter((c) => !(c.rejection_reasons ?? []).some((r) => SHELL_HARD_FAIL_REASONS.has(r)));

  const sortedByTotal = [...candidates].sort((a, b) => (b.total ?? -Infinity) - (a.total ?? -Infinity));
  const bestLosingAlternatives = sortedByTotal
    .filter((c) => c.id !== winnerId)
    .slice(0, 3)
    .map((c) => ({
      id: c.id,
      family: c.recommendation_family,
      total: c.total,
      score_gap_vs_winner: winner ? Number(((winner.total ?? 0) - (c.total ?? 0)).toFixed(3)) : null,
      rejection_reasons: c.rejection_reasons ?? [],
    }));

  const whyAlignmentFails = sortedByTotal.filter((c) => {
    const why = cp.recommendation_packet?.why_this_direction ?? '';
    return !(hasComparativeWhySignal(why) && hasDraftingPayoffSignal(why));
  }).length;

  for (const c of candidates) {
    for (const reason of c.rejection_reasons ?? []) {
      rejectCounts.set(reason, (rejectCounts.get(reason) ?? 0) + 1);
    }
  }

  caseAudits.push({
    case_id: row.case_id,
    title: row.title,
    narrative_pattern: row.narrative_pattern,
    winner_id: winnerId,
    winner_family: winnerFamily,
    winner_total: winner?.total ?? null,
    recommendation_prefix_5: recPrefix,
    candidates_generated: candidates.length,
    strict_survivor_count: strictSurvivors.length,
    shell_safe_count: shellSafe.length,
    meets_min_viable_survivors: strictSurvivors.length >= MIN_VIABLE_SURVIVORS,
    why_validator_alignment_fail_count: whyAlignmentFails,
    best_losing_alternatives: bestLosingAlternatives,
  });
}

const collapseCases = caseAudits.filter((c) => c.strict_survivor_count < MIN_VIABLE_SURVIVORS);
const familyRows = [...familyCounts.entries()].map(([family, count]) => ({ family, count }));
const prefixRows = [...prefixCounts.entries()].map(([prefix, count]) => ({ prefix, count }));
const rejectRows = [...rejectCounts.entries()].map(([reason, count]) => ({ reason, count }));

const dominantFamily = top(familyRows, 1)[0] ?? null;
const dominantFamilyRatio = dominantFamily ? Number((dominantFamily.count / Math.max(caseAudits.length, 1)).toFixed(3)) : 0;

const report = {
  generated_at: new Date().toISOString(),
  input_summary_path: SUMMARY_PATH,
  thresholds: {
    minimum_viable_survivors: MIN_VIABLE_SURVIVORS,
  },
  totals: {
    cases: caseAudits.length,
    collapse_cases: collapseCases.length,
    collapse_ratio: Number((collapseCases.length / Math.max(caseAudits.length, 1)).toFixed(3)),
    dominant_family: dominantFamily?.family ?? null,
    dominant_family_count: dominantFamily?.count ?? 0,
    dominant_family_ratio: dominantFamilyRatio,
    top_recommendation_prefix: top(prefixRows, 1)[0]?.prefix ?? null,
    top_recommendation_prefix_count: top(prefixRows, 1)[0]?.count ?? 0,
  },
  top_rejection_reasons: top(rejectRows, 10),
  top_recommendation_prefixes: top(prefixRows, 10),
  family_distribution: top(familyRows, 10),
  cases_below_minimum_survivors: collapseCases,
  case_audits: caseAudits,
};

const md = [
  '# Pool Integrity Audit V1',
  '',
  `Generated: ${report.generated_at}`,
  `Cases: ${report.totals.cases}`,
  `Minimum viable survivors: ${MIN_VIABLE_SURVIVORS}`,
  `Collapse cases: ${report.totals.collapse_cases} (${report.totals.collapse_ratio})`,
  `Dominant family: ${report.totals.dominant_family ?? 'n/a'} (${report.totals.dominant_family_ratio})`,
  `Top recommendation prefix: ${report.totals.top_recommendation_prefix ?? 'n/a'} (${report.totals.top_recommendation_prefix_count})`,
  '',
  '## Top rejection reasons',
  ...report.top_rejection_reasons.map((r) => `- ${r.reason}: ${r.count}`),
  '',
  '## Cases below minimum survivors',
  ...report.cases_below_minimum_survivors.map((c) => {
    const loserText = c.best_losing_alternatives
      .map((x) => `${x.id}(${x.family}) gap=${x.score_gap_vs_winner} reasons=${(x.rejection_reasons || []).join('|') || 'none'}`)
      .join(' ; ');
    return `- ${c.case_id}: generated=${c.candidates_generated}, strict_survivors=${c.strict_survivor_count}, winner=${c.winner_id}/${c.winner_family}, losers=[${loserText}]`;
  }),
  '',
].join('\n');

fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({ out_json: OUT_JSON, out_md: OUT_MD, collapse_cases: report.totals.collapse_cases, dominant_family_ratio: report.totals.dominant_family_ratio }, null, 2));
