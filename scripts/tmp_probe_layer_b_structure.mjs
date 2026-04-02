import { readFileSync } from 'fs';

const b = JSON.parse(readFileSync('evaluation_outputs/page3_layers/layer_b_unseen_validation_v1/summary.json', 'utf8'));

// Inspect first row structure
const r0 = b.rows[0];
const d0 = r0?.product?.canonical_payload?.candidate_debug;
console.log('=== candidate_debug keys:', Object.keys(d0 || {}));
const cands = d0?.scores_by_candidate;
if (cands && cands.length > 0) {
  console.log('=== first candidate keys:', Object.keys(cands[0]));
  console.log('=== first candidate sample:', JSON.stringify(cands[0]).slice(0, 400));
}
