const s = require('../evaluation_outputs/page3_holdout_v2_remediation/summary.json');
for (const row of s.rows) {
  const w = row?.scores?.winner?.winner;
  const p = row?.scores?.product || {};
  if (w !== 'product') {
    console.log(`${row.case_id}\t${row.narrative_pattern}\t${row.product?.canonical_payload?.classification?.primary_pattern}\t${w}\tmargin=${row?.scores?.winner?.weighted_margin}`);
    console.log(`  rec: ${row?.product?.output?.displayed_recommendation}`);
    console.log(`  why: ${row?.product?.output?.why_this_direction}`);
  }
}
console.log('tally', s.final_tally);
