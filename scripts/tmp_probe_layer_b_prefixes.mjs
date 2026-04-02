import { readFileSync } from 'fs';

const b = JSON.parse(readFileSync('evaluation_outputs/page3_layers/layer_b_unseen_validation_v1/summary.json', 'utf8'));

const prefixCount = {};
for (const r of b.rows) {
  const d = r.product?.canonical_payload?.candidate_debug;
  if (!d || !d.scores_by_candidate) continue;
  const winner = d.scores_by_candidate.find(c => c.candidate_id === d.winner_id);
  const dl = winner ? (winner.direction_line || '') : '';
  const first5 = dl.toLowerCase().split(/\s+/).slice(0, 5).join(' ');
  prefixCount[first5] = (prefixCount[first5] || 0) + 1;
  const family = winner ? (winner.family_type || winner.recommendation_family || '') : '';
  console.log(r.case_id, '|', d.winner_id, '|', family, '|', JSON.stringify(first5));
}
console.log('\nPrefix distribution:');
for (const [p, c] of Object.entries(prefixCount).sort((a,b) => b[1]-a[1])) {
  console.log(`  count=${c}  "${p}"`);
}
