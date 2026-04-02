import fs from 'node:fs';
import path from 'node:path';

const summary = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'evaluation_outputs/page3_holdout_v2_remediation/summary.json'), 'utf8'));
for (const row of summary.rows) {
  const recommendation = row.product?.canonical_payload?.recommendation_packet?.displayed_recommendation ?? '';
  const prefix = recommendation.toLowerCase().replace(/\s+/g, ' ').trim().split(' ').slice(0, 5).join(' ');
  const family = row.product?.canonical_payload?.candidate_debug?.winner_family ?? 'none';
  console.log(`${row.case_id}\t${family}\t${prefix}\t${recommendation.slice(0, 140)}`);
}
