import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SLICES_ROOT = process.env.PAGE3_CONTROLLED_SLICES_ROOT
  ? path.resolve(ROOT, process.env.PAGE3_CONTROLLED_SLICES_ROOT)
  : path.join(ROOT, 'evaluation_outputs', 'page3_controlled_testing_v1', 'slices_v1');
const OUT_JSON = path.join(SLICES_ROOT, 'CONTROLLED_BATCH_MONITOR_V1.json');
const OUT_MD = path.join(SLICES_ROOT, 'CONTROLLED_BATCH_MONITOR_V1.md');

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function prefix5(v) {
  return clean(v).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 5).join(' ');
}

function topFromMap(map, n = 8) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([key, count]) => ({ key, count }));
}

function readSlice(sliceDir, sliceId) {
  const summaryPath = path.join(sliceDir, 'CONTROLLED_TESTING_SUMMARY_V1.json');
  if (!fs.existsSync(summaryPath)) return null;
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const rows = summary.rows ?? [];

  const routeCounts = new Map();
  const shellCounts = new Map();
  const prefixCounts = new Map();
  let fallback = 0;
  let thinCoverage = 0;
  let compareMode = 0;
  let suppressedStrong = 0;
  let malformed = 0;

  for (const row of rows) {
    const route = row.route_category || 'unknown';
    routeCounts.set(route, (routeCounts.get(route) ?? 0) + 1);

    const shell = row.instrumentation?.semantic_shell || 'unknown';
    shellCounts.set(shell, (shellCounts.get(shell) ?? 0) + 1);

    const rec = row.output?.displayed_recommendation || '';
    const p = prefix5(rec);
    prefixCounts.set(p || 'empty', (prefixCounts.get(p || 'empty') ?? 0) + 1);

    if (row.instrumentation?.fallback_path_used) fallback += 1;
    if (row.instrumentation?.thin_candidate_coverage) thinCoverage += 1;
    if ((row.instrumentation?.winner_id || '').includes('compare') || route === 'question') compareMode += 1;
    if ((row.instrumentation?.suppressed_strong_candidates || []).length > 0) suppressedStrong += 1;

    const malformedSurface = !clean(rec)
      || /\[object Object\]/i.test(rec)
      || /(\.\.\.){2,}/.test(rec)
      || /\s{3,}/.test(rec);
    if (malformedSurface) malformed += 1;
  }

  const caseCount = rows.length || 1;
  const topShell = topFromMap(shellCounts, 1)[0] ?? { key: 'none', count: 0 };
  const topPrefix = topFromMap(prefixCounts, 1)[0] ?? { key: 'none', count: 0 };
  const topRoute = topFromMap(routeCounts, 1)[0] ?? { key: 'none', count: 0 };

  return {
    slice_id: sliceId,
    summary_path: summaryPath,
    case_count: rows.length,
    rc_status_during_slice: 'must remain green via eval:page3:rc',
    concentration: {
      top_shell: topShell,
      top_shell_ratio: Number((topShell.count / caseCount).toFixed(3)),
      top_prefix: topPrefix,
      top_prefix_ratio: Number((topPrefix.count / caseCount).toFixed(3)),
      top_route: topRoute,
      top_route_ratio: Number((topRoute.count / caseCount).toFixed(3)),
      shell_distribution: topFromMap(shellCounts, 10),
      prefix_distribution: topFromMap(prefixCounts, 10),
      route_distribution: topFromMap(routeCounts, 10),
    },
    fallback_route_signals: {
      fallback_case_count: fallback,
      fallback_ratio: Number((fallback / caseCount).toFixed(3)),
      thin_coverage_case_count: thinCoverage,
      thin_coverage_ratio: Number((thinCoverage / caseCount).toFixed(3)),
      compare_mode_case_count: compareMode,
      compare_mode_ratio: Number((compareMode / caseCount).toFixed(3)),
      suppressed_strong_case_count: suppressedStrong,
      malformed_surface_case_count: malformed,
    },
  };
}

function main() {
  if (!fs.existsSync(SLICES_ROOT)) throw new Error(`Missing slices root: ${SLICES_ROOT}`);

  const sliceDirs = fs.readdirSync(SLICES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^slice_\d+$/i.test(entry.name))
    .map((entry) => entry.name)
    .sort();

  const slices = sliceDirs
    .map((sliceId) => readSlice(path.join(SLICES_ROOT, sliceId), sliceId))
    .filter(Boolean);

  const allRows = slices.reduce((n, s) => n + s.case_count, 0);

  const report = {
    generated_at: new Date().toISOString(),
    slices_root: SLICES_ROOT,
    slice_count: slices.length,
    total_cases_analyzed: allRows,
    slices,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

  const md = [
    '# Controlled Testing Batch Monitor V1',
    '',
    `- slice_count: ${report.slice_count}`,
    `- total_cases_analyzed: ${report.total_cases_analyzed}`,
    '',
    ...slices.flatMap((slice) => [
      `## ${slice.slice_id}`,
      `- case_count: ${slice.case_count}`,
      `- top_shell: ${slice.concentration.top_shell.key} (${slice.concentration.top_shell.count}, ratio=${slice.concentration.top_shell_ratio})`,
      `- top_prefix: ${slice.concentration.top_prefix.key} (${slice.concentration.top_prefix.count}, ratio=${slice.concentration.top_prefix_ratio})`,
      `- top_route: ${slice.concentration.top_route.key} (${slice.concentration.top_route.count}, ratio=${slice.concentration.top_route_ratio})`,
      `- fallback_ratio: ${slice.fallback_route_signals.fallback_ratio}`,
      `- thin_coverage_ratio: ${slice.fallback_route_signals.thin_coverage_ratio}`,
      `- compare_mode_ratio: ${slice.fallback_route_signals.compare_mode_ratio}`,
      `- suppressed_strong_case_count: ${slice.fallback_route_signals.suppressed_strong_case_count}`,
      `- malformed_surface_case_count: ${slice.fallback_route_signals.malformed_surface_case_count}`,
      '',
    ]),
  ].join('\n');

  fs.writeFileSync(OUT_MD, `${md}\n`);

  console.log(JSON.stringify({ out_json: OUT_JSON, out_md: OUT_MD, slice_count: report.slice_count, total_cases: report.total_cases_analyzed }, null, 2));
}

main();
