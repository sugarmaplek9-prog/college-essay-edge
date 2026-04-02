import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SLICES_ROOT = path.join(ROOT, 'evaluation_outputs', 'page3_controlled_testing_v1', 'slices_v1');
const PACKET_ROOT = path.join(ROOT, 'evaluation_outputs', 'page3_controlled_testing_v1', 'packet_v1');
const OUT_ROOT = path.join(ROOT, 'evaluation_outputs', 'page3_controlled_testing_v1', 'reviews_v1');
const RC_STATUS_PATH = path.join(ROOT, 'evaluation_outputs', 'page3_release_candidate_v1', 'PAGE3_RC_STATUS_V1.json');

const SLICE_IDS = ['slice_01', 'slice_02', 'slice_03'];

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function lower(v) {
  return clean(v).toLowerCase();
}

function prefix5(v) {
  return lower(v).split(/[^a-z0-9]+/).filter(Boolean).slice(0, 5).join(' ');
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function boolLabel(v) {
  return v ? 'yes' : 'no';
}

function scoreRecommendationClarity(rec, routeCategory) {
  if (!clean(rec)) return 1;
  if (routeCategory === 'blocked' || routeCategory === 'question') return 2;
  if (/^essay angle:\s*choose the stronger/i.test(rec)) return 2;
  if (/center your essay on the moment you changed your response after the moment you noticed/i.test(rec)) return 2;
  if (/center your essay on/i.test(rec)) return 3;
  return 4;
}

function scoreEssayAboutMeaning(essayAbout) {
  if (!clean(essayAbout)) return 1;
  if (/what matters here is/i.test(essayAbout) && /why this matters:/i.test(essayAbout)) return 2;
  if (/the meaning is/i.test(essayAbout)) return 3;
  return 4;
}

function scoreWhyUsefulness(why) {
  if (!clean(why)) return 1;
  const hasComparative = /beats the weaker read|rather than|instead of|stronger/i.test(why);
  const hasDrafting = /drafting payoff|start with|draft/i.test(why);
  const truncated = /…|\.\.\.$/.test(why);
  if (hasComparative && hasDrafting && !truncated) return 4;
  if (hasComparative && hasDrafting) return 3;
  if (hasComparative || hasDrafting) return 2;
  return 1;
}

function scoreCompareUtility(weaker, stronger) {
  if (!clean(weaker) && !clean(stronger)) return 1;
  if (clean(weaker) && clean(stronger)) return 3;
  return 2;
}

function scoreNextStep(nextStep) {
  if (!clean(nextStep)) return 1;
  if (/open with|next step|write|draft|start/i.test(nextStep)) return 4;
  return 2;
}

function deriveFlags(row) {
  const rec = row.output?.displayed_recommendation ?? '';
  const essayAbout = row.output?.essay_about ?? '';
  const why = row.output?.why_this_direction ?? '';
  const weaker = row.output?.weaker_read ?? '';
  const stronger = row.output?.stronger_read ?? '';
  const nextStep = row.output?.next_step ?? '';
  const routeCategory = row.route_category ?? '';

  const recScore = scoreRecommendationClarity(rec, routeCategory);
  const essayScore = scoreEssayAboutMeaning(essayAbout);
  const whyScore = scoreWhyUsefulness(why);
  const compareScore = scoreCompareUtility(weaker, stronger);
  const nextScore = scoreNextStep(nextStep);

  const templated = /^center your essay on/i.test(lower(rec))
    || /^show how your understanding shifted/i.test(lower(rec))
    || /the moment you changed your response after the moment you noticed/i.test(lower(rec));
  const generic = /what matters here is|the meaning is/i.test(lower(essayAbout))
    || /this beats the weaker read because/i.test(lower(why));
  const misrouted = routeCategory === 'blocked' || routeCategory === 'question';
  const sharpCoachVoice = whyScore >= 3 && nextScore >= 2 && !templated;

  const avg = (recScore + essayScore + whyScore + compareScore + nextScore) / 5;
  let outcome = 'usable_with_polish';
  if (misrouted || recScore <= 2 || nextScore <= 1 || (templated && generic)) outcome = 'failure';
  else if (avg < 2.8 || templated) outcome = 'structurally_weak';
  else if (avg >= 3.6 && sharpCoachVoice) outcome = 'landed';

  const notes = [];
  if (templated) notes.push('Recommendation opening feels repeated/template-like.');
  if (generic) notes.push('Essay_about / why language reads generic across cases.');
  if (misrouted) notes.push(`Route ended on ${routeCategory}.`);
  if (nextScore <= 1) notes.push('Next-step concreteness is weak or missing.');
  if (!sharpCoachVoice) notes.push('Coach voice lacks sharp differentiation.');

  return {
    recommendation_clarity_score_1_to_5: recScore,
    essay_about_meaning_score_1_to_5: essayScore,
    why_this_direction_usefulness_score_1_to_5: whyScore,
    weaker_stronger_usefulness_score_1_to_5: compareScore,
    next_step_concreteness_score_1_to_5: nextScore,
    templated_feel_flag: boolLabel(templated),
    generic_feel_flag: boolLabel(generic),
    misrouted_flag: boolLabel(misrouted),
    sharp_coach_voice_flag: boolLabel(sharpCoachVoice),
    operator_outcome_label: outcome,
    freeform_notes: notes.join(' '),
  };
}

function writeCsv(filePath, rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','));
  }
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
}

function countBy(rows, key) {
  const out = {};
  for (const row of rows) {
    const v = row[key] ?? 'unknown';
    out[v] = (out[v] ?? 0) + 1;
  }
  return out;
}

function topPrefixRows(rows) {
  const counts = new Map();
  for (const row of rows) {
    const rec = row.output?.displayed_recommendation ?? '';
    const p = prefix5(rec) || 'empty';
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([prefix, count]) => ({ prefix, count }));
}

function summarizeSlice(sliceId, rows, reviewRows, rcStatus) {
  const size = rows.length;
  const routeCounts = countBy(rows, 'route_category');
  const topRoute = Object.entries(routeCounts).sort((a, b) => b[1] - a[1])[0];
  const topRouteRatio = topRoute ? Number((topRoute[1] / Math.max(size, 1)).toFixed(3)) : 0;

  const shellCounts = {};
  for (const row of rows) {
    const shell = row.instrumentation?.semantic_shell || 'unknown';
    shellCounts[shell] = (shellCounts[shell] ?? 0) + 1;
  }
  const topShell = Object.entries(shellCounts).sort((a, b) => b[1] - a[1])[0];
  const topShellRatio = topShell ? Number((topShell[1] / Math.max(size, 1)).toFixed(3)) : 0;

  const fallback = rows.filter((r) => r.instrumentation?.fallback_path_used).length;
  const thin = rows.filter((r) => r.instrumentation?.thin_candidate_coverage).length;
  const compare = rows.filter((r) => {
    const id = r.instrumentation?.winner_id || '';
    return id.includes('compare') || r.route_category === 'question';
  }).length;

  const flags = {
    templated_feel: reviewRows.filter((r) => r.templated_feel_flag === 'yes').length,
    generic_feel: reviewRows.filter((r) => r.generic_feel_flag === 'yes').length,
    misrouted_feel: reviewRows.filter((r) => r.misrouted_flag === 'yes').length,
    weak_recommendation_clarity: reviewRows.filter((r) => Number(r.recommendation_clarity_score_1_to_5) <= 2).length,
    weak_essay_about_meaning: reviewRows.filter((r) => Number(r.essay_about_meaning_score_1_to_5) <= 2).length,
    weak_why_usefulness: reviewRows.filter((r) => Number(r.why_this_direction_usefulness_score_1_to_5) <= 2).length,
    weak_next_step_concreteness: reviewRows.filter((r) => Number(r.next_step_concreteness_score_1_to_5) <= 2).length,
    weak_sharp_coach_voice: reviewRows.filter((r) => r.sharp_coach_voice_flag !== 'yes').length,
  };

  const recurringOpenings = topPrefixRows(rows).slice(0, 5);
  const outcomeCounts = countBy(reviewRows, 'operator_outcome_label');

  const harmSignals = flags.templated_feel >= 4
    || flags.generic_feel >= 4
    || flags.weak_recommendation_clarity >= 4
    || flags.weak_sharp_coach_voice >= 4;

  const emergingFailureClass = harmSignals
    ? 'controlled-testing shell concentration causing product-surface sameness'
    : null;

  return {
    slice_id: sliceId,
    slice_size: size,
    rc_status_during_slice: rcStatus?.rc_pass === true ? 'green' : 'not-green',
    shell_concentration: {
      top_shell: topShell ? topShell[0] : null,
      top_shell_count: topShell ? topShell[1] : 0,
      top_shell_ratio: topShellRatio,
    },
    route_concentration: {
      top_route: topRoute ? topRoute[0] : null,
      top_route_count: topRoute ? topRoute[1] : 0,
      top_route_ratio: topRouteRatio,
      route_distribution: routeCounts,
    },
    fallback_ratio: Number((fallback / Math.max(size, 1)).toFixed(3)),
    thin_coverage_ratio: Number((thin / Math.max(size, 1)).toFixed(3)),
    compare_mode_ratio: Number((compare / Math.max(size, 1)).toFixed(3)),
    operator_flag_totals: flags,
    recurring_recommendation_openings: recurringOpenings,
    outcome_counts: outcomeCounts,
    recurring_quality_complaints: [
      flags.templated_feel > 0 ? 'templated recommendation lead shells' : null,
      flags.generic_feel > 0 ? 'generic essay_about/why language' : null,
      flags.weak_next_step_concreteness > 0 ? 'weak next-step concreteness' : null,
      flags.misrouted_feel > 0 ? 'route ended in blocked/question for some cases' : null,
    ].filter(Boolean),
    concentration_harming_quality: harmSignals,
    emerging_failure_class: emergingFailureClass,
    remediation_warranted_now: harmSignals,
    decision_note: harmSignals
      ? 'Concentration appears to be materially harming perceived quality; open targeted remediation only for shell concentration/surface sameness.'
      : 'Concentration is measurable but not yet materially harmful; continue controlled testing with active monitoring.',
  };
}

function writeSliceMd(filePath, report) {
  const lines = [
    `# Controlled Testing ${report.slice_id} Report V1`,
    '',
    `- slice_size: ${report.slice_size}`,
    `- rc_status_during_slice: ${report.rc_status_during_slice}`,
    `- top_shell: ${report.shell_concentration.top_shell} (${report.shell_concentration.top_shell_count}, ratio=${report.shell_concentration.top_shell_ratio})`,
    `- top_route: ${report.route_concentration.top_route} (${report.route_concentration.top_route_count}, ratio=${report.route_concentration.top_route_ratio})`,
    `- fallback_ratio: ${report.fallback_ratio}`,
    `- thin_coverage_ratio: ${report.thin_coverage_ratio}`,
    `- compare_mode_ratio: ${report.compare_mode_ratio}`,
    '',
    '## Operator flag totals',
    ...Object.entries(report.operator_flag_totals).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Recurring openings',
    ...report.recurring_recommendation_openings.map((r) => `- ${r.prefix}: ${r.count}`),
    '',
    '## Outcome counts',
    ...Object.entries(report.outcome_counts).map(([k, v]) => `- ${k}: ${v}`),
    '',
    `- concentration_harming_quality: ${report.concentration_harming_quality}`,
    `- emerging_failure_class: ${report.emerging_failure_class ?? 'none'}`,
    `- remediation_warranted_now: ${report.remediation_warranted_now}`,
    `- decision_note: ${report.decision_note}`,
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
}

function main() {
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const rcStatus = JSON.parse(fs.readFileSync(RC_STATUS_PATH, 'utf8'));

  const sliceReports = [];
  for (const sliceId of SLICE_IDS) {
    const summaryPath = path.join(SLICES_ROOT, sliceId, 'CONTROLLED_TESTING_SUMMARY_V1.json');
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const rows = summary.rows ?? [];

    const reviewRows = rows.map((row) => ({
      case_id: row.case_id,
      slice_id: sliceId,
      run_group: 'page3_controlled_v1_24',
      ...deriveFlags(row),
    }));

    const headers = [
      'case_id','slice_id','run_group',
      'recommendation_clarity_score_1_to_5','essay_about_meaning_score_1_to_5','why_this_direction_usefulness_score_1_to_5','weaker_stronger_usefulness_score_1_to_5','next_step_concreteness_score_1_to_5',
      'templated_feel_flag','generic_feel_flag','misrouted_flag','sharp_coach_voice_flag','operator_outcome_label','freeform_notes'
    ];

    const csvOut = path.join(OUT_ROOT, `${sliceId}.operator_review_completed.csv`);
    writeCsv(csvOut, reviewRows, headers);

    const report = summarizeSlice(sliceId, rows, reviewRows, rcStatus);
    sliceReports.push(report);

    const jsonOut = path.join(OUT_ROOT, `${sliceId}.report.json`);
    const mdOut = path.join(OUT_ROOT, `${sliceId}.report.md`);
    fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2));
    writeSliceMd(mdOut, report);
  }

  const overall = {
    generated_at: new Date().toISOString(),
    rc_pass: rcStatus.rc_pass === true,
    slice_reports: sliceReports,
  };
  fs.writeFileSync(path.join(OUT_ROOT, 'CONTROLLED_SLICE_REPORTS_V1.json'), JSON.stringify(overall, null, 2));

  console.log(JSON.stringify({
    out_dir: OUT_ROOT,
    rc_pass: overall.rc_pass,
    slices: sliceReports.map((s) => ({ slice_id: s.slice_id, concentration_harming_quality: s.concentration_harming_quality, emerging_failure_class: s.emerging_failure_class }))
  }, null, 2));
}

main();
