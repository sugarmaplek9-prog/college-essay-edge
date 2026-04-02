const fs = require('node:fs');
const path = require('node:path');

const runDir = process.argv[2];
if (!runDir) {
  console.error('Usage: node evaluation/scripts/build-nds-failure-dataset.js <runDir>');
  process.exit(1);
}

const cases = fs
  .readdirSync('evaluation/cases')
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join('evaluation/cases', f), 'utf8')));
const caseById = new Map(cases.map((c) => [c.case_id, c]));

const normalized = JSON.parse(fs.readFileSync(path.join(runDir, 'normalized_results.json'), 'utf8'));
const scores = JSON.parse(fs.readFileSync(path.join(runDir, 'scores.json'), 'utf8'));

const byCase = new Map();
for (const row of normalized) {
  const cur = byCase.get(row.case_id) || {};
  if (row.system === 'nds_internal') cur.nds = row;
  if (row.system === 'baseline_free_ai') cur.baseline = row;
  byCase.set(row.case_id, cur);
}

const scoreByCase = new Map(
  scores.map((s) => {
    const dims = Object.values(s.scores || {});
    const avgDelta = dims.length
      ? dims.reduce((sum, d) => sum + (d.nds - d.baseline), 0) / dims.length
      : 0;
    return [s.case_id, { avgDelta, binary: !!s.binary_judgment?.nds_clearly_better_than_baseline }];
  })
);

const blindSlicePath = path.join(runDir, 'result_audit', 'blind_review_10.case_ids.json');
const blindSlice = fs.existsSync(blindSlicePath)
  ? JSON.parse(fs.readFileSync(blindSlicePath, 'utf8')).selected_case_ids
  : [];

const weakest10 = Array.from(scoreByCase.entries())
  .sort((a, b) => a[1].avgDelta - b[1].avgDelta)
  .slice(0, 10)
  .map(([caseId]) => caseId);

const selected = Array.from(new Set([...blindSlice, ...weakest10]));

function classifyFailures(ndsRow, baselineRow) {
  const tags = [];

  if (!ndsRow || ndsRow.status === 'failed') {
    return ['F1_too_vague', 'F2_too_shallow', 'F4_too_generic', 'F6_no_premium_feel'];
  }

  if (ndsRow.status === 'needs_more_input' && baselineRow?.status === 'success') {
    tags.push('F3_too_cautious', 'F4_too_generic', 'F5_weak_next_move', 'F6_no_premium_feel');
  }

  if (ndsRow.status === 'needs_more_input') {
    tags.push('F1_too_vague');
  }

  if (ndsRow.status === 'success') {
    const best = ndsRow.best_direction || {};
    const core = (best.core_claim || '').toLowerCase();
    const real = (best.why_this_is_the_real_story || '').toLowerCase();
    const next = (best.next_move || '').toLowerCase();
    const depth = ndsRow.depth_signals || {};
    const depthCount = Object.values(depth).filter((v) => typeof v === 'string' && v.trim().length > 0).length;

    if (core.length < 80 || real.length < 60) tags.push('F2_too_shallow');
    if (/meaningful experience|growth|leadership|resilience/.test(core + ' ' + real)) tags.push('F4_too_generic');
    if (/draft a paragraph|expand on this|describe what you learned/.test(next) || next.length < 80) tags.push('F5_weak_next_move');
    if (depthCount === 0) tags.push('F1_too_vague', 'F6_no_premium_feel');
    if (depthCount < 2) tags.push('F6_no_premium_feel');
  }

  if (tags.length === 0) {
    tags.push('none_detected');
  }

  return Array.from(new Set(tags));
}

function likelyFailureLayer(failureTags, ndsRow, baselineRow) {
  if (failureTags.includes('F3_too_cautious')) return 'readiness';
  if (failureTags.includes('F5_weak_next_move')) return 'output_contract';
  if (failureTags.includes('F4_too_generic') || failureTags.includes('F2_too_shallow')) return 'prompt';
  if (failureTags.includes('F1_too_vague')) return 'validator';
  if (!ndsRow || ndsRow.status === 'failed') return 'context_assembly';
  if (baselineRow?.status === 'success' && ndsRow?.status !== 'success') return 'readiness';
  return 'prompt';
}

const records = selected.map((caseId) => {
  const row = byCase.get(caseId) || {};
  const nds = row.nds;
  const baseline = row.baseline;
  const failure_categories = classifyFailures(nds, baseline);
  const constrainedPossible = nds?.status === 'needs_more_input' ? baseline?.status === 'success' : true;

  return {
    case_id: caseId,
    from_blind_slice: blindSlice.includes(caseId),
    from_weakest10: weakest10.includes(caseId),
    current_output: {
      nds_status: nds?.status ?? 'missing',
      baseline_status: baseline?.status ?? 'missing',
      nds_best_direction: nds?.best_direction ?? null,
      nds_alternative_count: nds?.meta?.alternative_count ?? 0,
      nds_depth_signals: nds?.depth_signals ?? null,
      nds_recovery_question: nds?.recovery_question ?? null,
    },
    failure_categories,
    constrained_recommendation_should_have_been_possible: constrainedPossible,
    premium_output_should_have_done_differently:
      nds?.status === 'needs_more_input'
        ? 'Deliver a reduced-scope winner with explicit uncertainty and one strategic next move instead of default NMI.'
        : 'Sharpen interpretive claim, increase narrative-function differentiation in alternatives, and make next move more strategic.',
    likely_primary_failure_layer: likelyFailureLayer(failure_categories, nds, baseline),
  };
});

const out = {
  run_id: path.basename(runDir),
  generated_at: new Date().toISOString(),
  source_sets: {
    blind_review_slice_case_ids: blindSlice,
    weakest_10_case_ids: weakest10,
    final_union_case_ids: selected,
  },
  records,
};

const outDir = path.join(runDir, 'result_audit');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'nds_failure_analysis_dataset.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');

console.log(`wrote ${outPath} with ${records.length} records`);
