import fs from 'node:fs';
import path from 'node:path';

const root = '/Volumes/TOSHIBA EXT/College Essay';
const summaryPath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/summary.json');
const gatePath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/PACKET_VALIDATION_GATE_V2.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));

// Print full gate diagnostic
console.log('=== GATE DIAGNOSTIC ===');
console.log(JSON.stringify(gate, null, 2).slice(0, 3000));

// Print raw structure of first row to understand schema
console.log('\n=== FIRST ROW KEYS ===');
const row0 = summary.rows[0];
console.log('row keys:', Object.keys(row0));
if (row0.product) {
  console.log('product keys:', Object.keys(row0.product));
  if (row0.product.canonical_payload) {
    console.log('canonical_payload keys:', Object.keys(row0.product.canonical_payload));
    const debug = row0.product.canonical_payload.candidate_debug;
    console.log('candidate_debug:', JSON.stringify(debug, null, 2).slice(0, 2000));
  }
}
