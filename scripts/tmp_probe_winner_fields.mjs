import { readFileSync } from 'fs';

const b = JSON.parse(readFileSync('evaluation_outputs/page3_layers/layer_b_unseen_validation_v1/summary.json', 'utf8'));

const r0 = b.rows[0];
const d0 = r0?.product?.canonical_payload?.candidate_debug;
const cands = d0?.scores_by_candidate || [];
// Find winner for UV1_01
const winnerId = d0?.winner_id;
console.log('winner_id:', winnerId);
const winner = cands.find(c => c.id === winnerId);
console.log('winner found:', !!winner);
console.log('winner.id:', winner?.id);
console.log('winner.direction_line type:', typeof winner?.direction_line);
console.log('winner.direction_line length:', (winner?.direction_line || '').length);
console.log('winner.direction_line value:', JSON.stringify((winner?.direction_line || '').slice(0, 100)));
console.log('winner.recommendation_family:', winner?.recommendation_family);
