from pathlib import Path

path = Path('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-controlled-testing-lane.mjs')
text = path.read_text()

text = text.replace(
"""  const prefixCounts = new Map();
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
""",
"""  const prefixCounts = new Map();
  const shellCounts = new Map();
  let fallbackCount = 0;
  let thinCoverageCount = 0;
  let failedCaseCount = 0;

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
  }
""")

text = text.replace(
"""  return {
    case_count: rows.length,
    fallback_case_count: fallbackCount,
    thin_coverage_case_count: thinCoverageCount,
    family_distribution: topEntries(familyCounts),
    top_prefixes: topEntries(prefixCounts),
    top_semantic_shells: topEntries(shellCounts),
  };
""",
"""  return {
    case_count: rows.length,
    failed_case_count: failedCaseCount,
    fallback_case_count: fallbackCount,
    thin_coverage_case_count: thinCoverageCount,
    family_distribution: topEntries(familyCounts),
    top_prefixes: topEntries(prefixCounts),
    top_semantic_shells: topEntries(shellCounts),
  };
""")

text = text.replace(
"""      const rows = [];
      for (const row of cases) {
        console.error(`[page3-controlled] ${row.case_id}: ${row.title}`);
        rows.push(await runCase(browser, row, productUrl));
      }
""",
"""      const rows = [];
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
""")

text = text.replace(
"""        `- case_count: ${summary.batch_summary.case_count}`,
        `- fallback_case_count: ${summary.batch_summary.fallback_case_count}`,
        `- thin_coverage_case_count: ${summary.batch_summary.thin_coverage_case_count}`,
""",
"""        `- case_count: ${summary.batch_summary.case_count}`,
        `- failed_case_count: ${summary.batch_summary.failed_case_count}`,
        `- fallback_case_count: ${summary.batch_summary.fallback_case_count}`,
        `- thin_coverage_case_count: ${summary.batch_summary.thin_coverage_case_count}`,
""")

text = text.replace(
"""        ...rows.flatMap((row) => [
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
""",
"""        ...rows.flatMap((row) => [
          `### ${row.case_id} — ${row.title}`,
          `- status: ${row.status || 'ok'}`,
          `- error: ${row.error?.name ? `${row.error.name}: ${row.error.message}` : 'none'}`,
          `- route_category: ${row.route_category}`,
          `- winner: ${row.instrumentation?.winner_id || 'none'} (${row.instrumentation?.winner_family || 'unknown'})`,
          `- candidates_generated: ${row.instrumentation?.candidates_generated ?? 0}`,
          `- strict_survivor_count: ${row.instrumentation?.strict_survivor_count ?? 0}`,
          `- fallback_path_used: ${row.instrumentation?.fallback_path_used ?? false}`,
          `- thin_candidate_coverage: ${row.instrumentation?.thin_candidate_coverage ?? true}`,
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
""")

path.write_text(text)
print('patched controlled lane resilience')
