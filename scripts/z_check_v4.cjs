const data = JSON.parse(require('fs').readFileSync('evaluation_outputs/page3_holdout_v4_thematic/summary.json'));
['HV4_01','HV4_02','HV4_03','HV4_07'].forEach(function(id) {
  const r = data.rows.find(function(x) { return x.case_id === id; });
  if (!r) return;
  console.log(id);
  console.log('  rec:', (r.product && r.product.output && r.product.output.displayed_recommendation || '').slice(0, 90));
  console.log('  why:', (r.product && r.product.output && r.product.output.why_this_direction || '').slice(0, 90));
  console.log('  weaker:', (r.product && r.product.output && r.product.output.weaker_read || '(empty)').slice(0, 80));
  console.log('  stronger:', (r.product && r.product.output && r.product.output.stronger_read || '(empty)').slice(0, 80));
  console.log('  ev0:', (r.product && r.product.output && r.product.output.evidence_lines && r.product.output.evidence_lines[0] || '').slice(0, 80));
});
