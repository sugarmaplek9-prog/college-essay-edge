// Rebuild blind packet from existing summary.json using updated payload shape
const fs = require('fs');
const path = require('path');

const summaryPath = process.argv[2] || 'evaluation_outputs/page3_holdout_v4_thematic/summary.json';
const data = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
const rows = data.rows;

function clean(v) {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '';
}

function deterministicSwap(caseId) {
  let sum = 0;
  for (const ch of caseId) sum += ch.charCodeAt(0);
  return sum % 2 === 1;
}

const packet = [];
const key = [];

for (const r of rows) {
  if (r.openai.status !== 'ok') continue;
  const swap = deterministicSwap(r.case_id);

  const productPayload = {
    recommendation: clean(r.product.output && r.product.output.displayed_recommendation || ''),
    why_this_direction: clean(r.product.output && r.product.output.why_this_direction || ''),
    weaker_read: clean(r.product.output && r.product.output.weaker_read || ''),
    stronger_read: clean(r.product.output && r.product.output.stronger_read || ''),
    evidence_lines: (r.product.output && r.product.output.evidence_lines || []).map(clean).filter(Boolean),
  };

  const openaiPayload = {
    recommendation: clean(r.openai.output && r.openai.output.displayed_recommendation || ''),
    why_this_direction: clean(r.openai.output && r.openai.output.why_this_direction || ''),
    weaker_read: clean(r.openai.output && r.openai.output.weaker_read || ''),
    stronger_read: clean(r.openai.output && r.openai.output.stronger_read || ''),
    evidence_lines: (r.openai.output && r.openai.output.evidence_lines || []).map(clean).filter(Boolean),
  };

  const A = swap ? openaiPayload : productPayload;
  const B = swap ? productPayload : openaiPayload;

  packet.push({
    case_id: r.case_id,
    title: r.title,
    signal_quality: r.signal_quality,
    narrative_pattern: r.narrative_pattern,
    raw_notes: r.raw_notes,
    candidate_A: A,
    candidate_B: B,
    review_fields: [
      'directional_usefulness',
      'why_quality',
      'coaching_actionability',
      'evidence_faithfulness',
      'overall_winner',
    ],
  });

  key.push({
    case_id: r.case_id,
    A_model: swap ? 'openai' : 'product',
    B_model: swap ? 'product' : 'openai',
    product_auto_winner: (r.scores && r.scores.winner && r.scores.winner.winner) || 'unscored',
  });
}

const outDir = path.dirname(path.resolve(summaryPath));
fs.writeFileSync(path.join(outDir, 'blind_review_packet.json'), JSON.stringify(packet, null, 2) + '\n', 'utf-8');
fs.writeFileSync(path.join(outDir, 'blind_review_answer_key.json'), JSON.stringify(key, null, 2) + '\n', 'utf-8');

console.log('Rebuilt blind packet: ' + packet.length + ' cases');
console.log('Written to: ' + outDir);
