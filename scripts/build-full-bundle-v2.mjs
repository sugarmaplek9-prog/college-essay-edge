import fs from 'fs';
import path from 'path';

const root = process.cwd();
const outDir = path.join(root, 'evaluation_outputs', 'full_bundle_v2');
fs.mkdirSync(outDir, { recursive: true });

const summary = JSON.parse(fs.readFileSync(path.join(root, 'evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json'), 'utf8'));

function buildCaseBundle(caseId, label) {
  const r = summary.rows.find(row => row.case_id === caseId);
  if (!r) throw new Error(`Case ${caseId} not found`);
  const cp = r.product?.canonical_payload || {};
  return {
    label,
    case_id: r.case_id,
    title: r.title,
    signal_quality: r.signal_quality,
    narrative_pattern: r.narrative_pattern,
    raw_notes: r.raw_notes,
    route_trace: r.product?.route_trace || null,
    final_url: r.product?.final_url || null,
    routing: cp.routing || null,
    classification: cp.classification || null,
    source_truth: cp.source_truth || null,
    candidate_debug: cp.candidate_debug || null,
    recommendation_packet: cp.recommendation_packet || null,
    evaluation_metadata: cp.evaluation_metadata || null,
    full_canonical_payload: cp,
    head_to_head_scores: r.scores || null,
    blind_packet_rendering: {
      case_id: r.case_id,
      title: r.title,
      candidate_A: r.candidate_A || null,
      candidate_B: r.candidate_B || null,
    }
  };
}

// Bad case: HV2_03 (tie, margin 0.51 — product side repetitive vs baseline)
const badBundle = buildCaseBundle('HV2_03', 'BAD_CASE__TIE__process_repetitive');
fs.writeFileSync(path.join(outDir, 'CASE_BUNDLE_HV2_03_BAD.json'), JSON.stringify(badBundle, null, 2));
console.log('Written: CASE_BUNDLE_HV2_03_BAD.json');

// Good case: HV2_09 (product win, margin 1.91 — strongest win in packet)
const goodBundle = buildCaseBundle('HV2_09', 'GOOD_CASE__PRODUCT_WIN__strongest_margin');
fs.writeFileSync(path.join(outDir, 'CASE_BUNDLE_HV2_09_GOOD.json'), JSON.stringify(goodBundle, null, 2));
console.log('Written: CASE_BUNDLE_HV2_09_GOOD.json');

// Per-case family distribution detail
const famRows = summary.rows.map(r => {
  const cp = r.product?.canonical_payload || {};
  const debug = cp.candidate_debug || {};
  const scores = debug.scores_by_candidate || [];
  const winner = scores.find(s => s.id === debug.winner_id) || scores[0];
  const runnerUp = scores.find(s => s.id === debug.weaker_read_source_id) || scores[1];
  return {
    case_id: r.case_id,
    title: r.title,
    winner_family: winner?.recommendation_family || 'unknown',
    winner_id: debug.winner_id,
    winner_score: winner?.total,
    runner_up_family: runnerUp?.recommendation_family || 'unknown',
    runner_up_id: debug.weaker_read_source_id,
    runner_up_score: runnerUp?.total,
    all_families: scores.map(s => ({ id: s.id, family: s.recommendation_family, total: s.total })),
    head_to_head_winner: r.scores?.winner
  };
});

const familyCounts = {};
famRows.forEach(row => {
  const f = row.winner_family;
  familyCounts[f] = (familyCounts[f] || 0) + 1;
});
const total = famRows.length;
const dominantCount = Math.max(...Object.values(familyCounts));
const famDist = {
  generated_at: new Date().toISOString(),
  total_cases: total,
  family_counts: familyCounts,
  dominant_family: Object.entries(familyCounts).sort((a,b) => b[1]-a[1])[0]?.[0],
  dominant_ratio: dominantCount / total,
  cap_threshold: 0.35,
  cap_rule_result: (dominantCount / total) <= 0.35 ? 'PASS' : 'FAIL',
  per_case: famRows
};
fs.writeFileSync(path.join(outDir, 'FAMILY_DISTRIBUTION_DETAIL_V2.json'), JSON.stringify(famDist, null, 2));
console.log('Written: FAMILY_DISTRIBUTION_DETAIL_V2.json');
console.log('Family counts:', JSON.stringify(familyCounts));
console.log('Dominant ratio:', famDist.dominant_ratio.toFixed(3), '—', famDist.cap_rule_result);
