const fs = require('fs');
const path = require('path');
const s = require('../evaluation_outputs/page3_holdout_v2_remediation/summary.json');
const lines = [];
for (const row of s.rows) {
  const w = row?.scores?.winner?.winner;
  if (w !== 'product') {
    lines.push(`${row.case_id}\t${row.narrative_pattern}\tinternal=${row.product?.canonical_payload?.classification?.primary_pattern}\t${w}\tmargin=${row?.scores?.winner?.weighted_margin}`);
    lines.push(`rec: ${row?.product?.output?.displayed_recommendation}`);
    lines.push(`why: ${row?.product?.output?.why_this_direction}`);
    lines.push('---');
  }
}
lines.push(`tally: ${JSON.stringify(s.final_tally)}`);
fs.writeFileSync(path.join(__dirname, '../evaluation_outputs/page3_holdout_v2_remediation/CYCLE5_NONWINS.txt'), lines.join('\n'));
console.log('wrote CYCLE5_NONWINS.txt');
