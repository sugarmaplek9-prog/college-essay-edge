const fs = require('fs');
const path = require('path');

const csvPath = path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2_remediation', 'human_blind_review', 'human_blind_scores_template.csv');
const lines = fs.readFileSync(csvPath, 'utf8').trimEnd().split(/\r?\n/);
const header = lines[0];
const rows = lines.slice(1).map((line) => {
  const [caseId] = line.split(',');
  return { caseId };
});

const overrides = {
  HV2_01: 'HV2_01,B,B,B,A,Tie,A,B,"A did not sound like a coach or understandable direction."',
  HV2_02: 'HV2_02,A,A,A,B,Tie,B,A,"B did not give enough coaching and direction; left me wondering what to do next. A was more general but gave more understandable direction."',
  HV2_03: 'HV2_03,B,B,B,A,B,A,B,"Overall I had no understanding of what A was trying to say; it made no sense."',
};

const outRows = rows.map((r) => overrides[r.caseId] || `${r.caseId},,,,,,,`);
const out = [header, ...outRows].join('\n') + '\n';
fs.writeFileSync(csvPath, out, 'utf8');
console.log(csvPath);
