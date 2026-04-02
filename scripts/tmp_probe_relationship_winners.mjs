import { readFileSync } from 'fs';

// Check Layer A relationship winners
const a = JSON.parse(readFileSync('evaluation_outputs/page3_layers/layer_a_frozen_validation_v1/summary.json', 'utf8'));

console.log('=== LAYER A winners ===');
for (const r of a.rows) {
  const d = r.product?.canonical_payload?.candidate_debug;
  if (!d || !d.scores_by_candidate) continue;
  const winner = d.scores_by_candidate.find(c => c.id === d.winner_id);
  const dl = winner ? (winner.direction_line || '') : '';
  const first5 = dl.toLowerCase().split(/\s+/).slice(0, 5).join(' ');
  console.log(r.case_id, '|', d.winner_id, '|', winner?.recommendation_family || '', '|', JSON.stringify(first5));
}

console.log('\n=== LAYER B relationship cases ===');
const b = JSON.parse(readFileSync('evaluation_outputs/page3_layers/layer_b_unseen_validation_v1/summary.json', 'utf8'));
for (const r of b.rows) {
  const d = r.product?.canonical_payload?.candidate_debug;
  if (!d || !d.scores_by_candidate) continue;
  const winner = d.scores_by_candidate.find(c => c.id === d.winner_id);
  if (winner?.recommendation_family !== 'relationship') continue;
  const dl = winner ? (winner.direction_line || '') : '';
  console.log(r.case_id, '|', d.winner_id, '|', JSON.stringify(dl.slice(0, 120)));
}
