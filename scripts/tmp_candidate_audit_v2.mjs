import fs from 'node:fs';
import path from 'node:path';

const root = '/Volumes/TOSHIBA EXT/College Essay';
const summaryPath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/summary.json');
const gatePath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/PACKET_VALIDATION_GATE_V2.json');
const packetPath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));

// Try to read the blind review packet (has final directions)
let packetByCase = {};
try {
  const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
  const cases = packet.cases || packet;
  if (Array.isArray(cases)) {
    for (const c of cases) {
      packetByCase[c.case_id] = c;
    }
  }
} catch(e) { console.log('packet read error:', e.message); }

console.log('=== CANDIDATE GENERATION AUDIT ===\n');
for (const row of summary.rows) {
  const cp = row.product?.canonical_payload || {};
  const debug = cp.candidate_debug || {};
  const rp = cp.recommendation_packet || {};
  const direction = rp.direction || cp.direction || {};
  
  const candidates = debug.scores_by_candidate || [];
  const winnerId = debug.winner_id;
  const packetCase = packetByCase[row.case_id] || {};
  const productRec = packetCase.product_recommendation || '';
  
  console.log(`━━━ [${row.case_id}] ${row.title} ━━━`);
  console.log(`   pattern: ${row.narrative_pattern || '?'} | generated: ${debug.candidates_generated ?? candidates.length} | winner: ${winnerId}`);
  console.log(`   final direction (packet): "${productRec.slice(0, 120)}"`);
  
  const dirLine = direction.direction_line || rp.direction_line || '';
  if (dirLine) console.log(`   direction_line (payload): "${dirLine.slice(0, 120)}"`);
  
  // Show all candidates
  const sortedCandidates = [...candidates].sort((a,b) => (b.total || b.packet_adjusted_total || 0) - (a.total || a.packet_adjusted_total || 0));
  for (const c of sortedCandidates) {
    const isWinner = c.id === winnerId ? ' <<<WINNER' : '';
    const score = c.total ?? c.packet_adjusted_total ?? '?';
    const patScore = c.packet_adjusted_total ?? score;
    const rej = (c.rejection_reasons || []).join(', ') || 'none';
    const family = c.recommendation_family || c.angle_type || '?';
    const dirC = c.direction_line || '';
    console.log(`   [${c.id?.padEnd(28)}] fam:${family?.padEnd(15)} score:${String(score).slice(0,5).padEnd(5)} adj:${String(patScore).slice(0,5).padEnd(5)}${isWinner}`);
    console.log(`     rej: ${rej}`);
    if (dirC) console.log(`     dir: "${dirC.slice(0,100)}"`);
    
    // Show key sub-scores
    const keyScores = {
      essay_aboutness_clarity: c.essay_aboutness_clarity,
      directional_usefulness: c.directional_usefulness,
      why_quality: c.why_quality,
      coaching_actionability: c.coaching_actionability,
      angle_first_quality: c.angle_first_quality,
      template_scaffold_penalty: c.template_scaffold_penalty,
      family_collapse_penalty: c.family_collapse_penalty,
    };
    console.log(`     scores: ${JSON.stringify(keyScores)}`);
  }
  console.log('');
}

// Summary: which cases have only 1 candidate?
console.log('\n=== CANDIDATE COUNT SUMMARY ===');
for (const row of summary.rows) {
  const debug = row.product?.canonical_payload?.candidate_debug || {};
  const generated = debug.candidates_generated ?? (debug.scores_by_candidate || []).length;
  const candidates = debug.scores_by_candidate || [];
  const nonRejected = candidates.filter(c => (c.rejection_reasons || []).length === 0).length;
  const hardFailed = candidates.filter(c => (c.rejection_reasons || []).length >= 2).length;
  console.log(`[${row.case_id}] generated:${generated} | candidates in debug:${candidates.length} | clean:${nonRejected} | hardFail:${hardFailed} | winner:${debug.winner_id}`);
}
