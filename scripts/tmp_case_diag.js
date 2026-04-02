const fs = require('fs');

const j = JSON.parse(
  fs.readFileSync('evaluation_outputs/page3_holdout_v2_remediation/summary.json', 'utf8')
);

const tags = [
  'relationship-based responsibility',
  'ownership under contradiction',
  'interpretation change',
  'process angle',
  'realization angle',
  'relationship angle',
  'value angle',
];

const rows = j.rows.map((r) => {
  const c = r.product.canonical_payload;
  const w = r.scores.winner;
  const p = r.scores.product;
  const o = r.scores.openai;
  const packet = c.recommendation_packet || {};
  const txt = `${packet.displayed_recommendation || ''} ${packet.essay_about || ''} ${packet.why_this_direction || ''}`.toLowerCase();
  const hits = tags.filter((t) => txt.includes(t));

  return {
    case_id: r.case_id,
    title: r.title,
    winner: w.winner,
    margin: w.weighted_margin,
    p_avg: p.average_effective,
    o_avg: o.average_effective,
    winner_family: c.candidate_debug.winner_family,
    weaker_family: c.candidate_debug.weaker_read_family,
    primary: c.classification.primary_pattern,
    secondary: c.classification.secondary_patterns,
    p_about: p.essay_aboutness_clarity,
    p_name: p.essay_angle_naming_quality,
    p_case: p.case_specificity_beyond_pivot,
    hits,
  };
});

rows.sort((a, b) => a.margin - b.margin);
console.log(JSON.stringify(rows, null, 2));
