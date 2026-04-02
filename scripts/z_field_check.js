const fs = require('fs');
const data = JSON.parse(fs.readFileSync('evaluation_outputs/page3_holdout_v4_thematic/summary.json'));
const ids = ['HV4_01', 'HV4_02', 'HV4_03', 'HV4_07'];
ids.forEach(function(id) {
  const row = data.rows.find(function(r) { return r.case_id === id; });
  if (!row) { console.log(id + ': NOT FOUND'); return; }
  const o = (row.product && row.product.output) || {};
  console.log('\n==' + id + '==');
  console.log('rec:     ' + String(o.displayed_recommendation || '').slice(0, 90));
  console.log('why:     ' + String(o.why_this_direction || '').slice(0, 90));
  console.log('weaker:  ' + String(o.weaker_read || '(empty)').slice(0, 80));
  console.log('stronger:' + String(o.stronger_read || '(empty)').slice(0, 80));
  const ev = o.evidence_lines || [];
  console.log('ev[0]:   ' + String(ev[0] || '').slice(0, 80));
});
