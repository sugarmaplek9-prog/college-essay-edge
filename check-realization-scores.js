const fs = require('fs');
const s = JSON.parse(fs.readFileSync('evaluation_outputs/page3_holdout_v2_remediation/summary.json','utf8'));

// Check realization-winning cases
const realCases = ['HV2_01', 'HV2_02', 'HV2_04', 'HV2_07', 'HV2_08'];
realCases.forEach(cid => {
  const row = s.rows.find(r => r.case_id === cid);
  if (!row) return;
  const scores = row.product?.canonical_payload?.candidate_debug?.scores_by_candidate || [];
  const sorted = [...scores].sort((a,b) => (b.final_score ?? 0) - (a.final_score ?? 0));
  console.log(`\n${cid}:`);
  sorted.slice(0, 3).forEach(c => {
    const fam = c.recommendation_family || c.id?.split('_')[1] || '?';
    const score = typeof c.final_score === 'number' ? c.final_score.toFixed(3) : 'N/A';
    console.log(`  ${fam}: ${score}`);
  });
  if (sorted.length >= 2 && typeof sorted[0].final_score === 'number' && typeof sorted[1].final_score === 'number') {
    const lead = sorted[0].final_score - sorted[1].final_score;
    console.log(`  lead: ${lead.toFixed(3)}`);
  }
});
