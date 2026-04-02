const fs = require('fs');
const path = require('path');

const src = path.join('evaluation_outputs', 'page3_holdout_v2_remediation', 'summary.json');
const out = path.join('evaluation_outputs', 'page3_holdout_v2_remediation', 'PAGE_THREE_CURRENT_PATH_PRODUCT_AUDIT_V1.source.json');
const j = JSON.parse(fs.readFileSync(src, 'utf8'));

const selected = {
  bad: ['HV2_01', 'HV2_04', 'HV2_08'],
  better: ['HV2_10', 'HV2_11'],
};

function pickRunnerUpFamily(scoresByCandidate = [], winnerId) {
  const sorted = [...scoresByCandidate].sort((a, b) => {
    const av = Number.isFinite(a.packet_adjusted_total) ? a.packet_adjusted_total : a.total;
    const bv = Number.isFinite(b.packet_adjusted_total) ? b.packet_adjusted_total : b.total;
    return (bv ?? -Infinity) - (av ?? -Infinity);
  });
  const runner = sorted.find((c) => c.id !== winnerId);
  return runner
    ? {
        id: runner.id,
        family: runner.recommendation_family ?? null,
        packet_adjusted_total: runner.packet_adjusted_total ?? null,
        total: runner.total ?? null,
      }
    : null;
}

function toCase(caseId) {
  const r = j.rows.find((x) => x.case_id === caseId);
  if (!r) return null;
  const c = r.product?.canonical_payload || {};
  const packet = c.recommendation_packet || {};
  const debug = c.candidate_debug || {};
  const runner = pickRunnerUpFamily(debug.scores_by_candidate || [], debug.winner_id);
  const excerpt = String(r.product?.output || '').replace(/\s+/g, ' ').trim().slice(0, 1000);

  return {
    case_id: r.case_id,
    title: r.title,
    narrative_pattern: r.narrative_pattern,
    signal_quality: r.signal_quality,
    evaluator_winner: r.scores?.winner?.winner ?? null,
    evaluator_weighted_margin: r.scores?.winner?.weighted_margin ?? null,
    raw_notes: r.raw_notes,
    classifier_result: c.classification || null,
    winning_family: debug.winner_family ?? null,
    winner_id: debug.winner_id ?? null,
    weaker_read_source_id: debug.weaker_read_source_id ?? null,
    weaker_read_family: debug.weaker_read_family ?? null,
    runner_up: runner,
    displayed_recommendation: packet.displayed_recommendation ?? null,
    essay_about: packet.essay_about ?? null,
    why_this_direction: packet.why_this_direction ?? null,
    weaker_read: packet.weaker_read ?? null,
    stronger_read: packet.stronger_read ?? null,
    evidence_explanations: packet.evidence_explanations ?? null,
    evidence_lines: packet.evidence_lines ?? null,
    rendered_output_excerpt: excerpt,
  };
}

const outObj = {
  generated_at: new Date().toISOString(),
  source_summary: src,
  selected,
  bad_cases: selected.bad.map(toCase).filter(Boolean),
  better_cases: selected.better.map(toCase).filter(Boolean),
};

fs.writeFileSync(out, JSON.stringify(outObj, null, 2));
console.log(out);
