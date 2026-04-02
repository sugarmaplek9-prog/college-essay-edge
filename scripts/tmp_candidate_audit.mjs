import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const summaryPath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/summary.json');
const gatePath = path.join(root, 'evaluation_outputs/page3_holdout_v2_remediation/PACKET_VALIDATION_GATE_V2.json');

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const gate = JSON.parse(fs.readFileSync(gatePath, 'utf8'));

console.log('=== GATE STATUS ===');
const gr = gate.gate_results || {};
for (const [k, v] of Object.entries(gr)) {
  console.log(`  ${k}: ${v}`);
}
console.log('family_counts:', JSON.stringify(gate.diagnostic?.family_counts));
console.log('top_literal_prefixes:', JSON.stringify(gate.diagnostic?.top_literal_prefixes?.slice(0, 8)));
console.log('');

console.log('=== PER-CASE: WINNER ===');
for (const row of summary.rows) {
  const cp = row.product?.canonical_payload || {};
  const debug = cp.candidate_debug || {};
  const candidates = debug.scores_by_candidate || [];
  const winner = candidates.find(c => c.candidate_id === debug.winner_id);
  const direction = (cp.direction?.direction_line || '').trim();
  const prefix5 = direction.split(' ').slice(0, 5).join(' ');
  const family = winner?.family_type || '?';
  const score = winner?.scores?.total_score ?? '?';
  const clarityWeighted = winner?.scores?.clarity_weighted_total ?? winner?.scores?.total_score ?? '?';
  const claimFirst = winner?.scores?.claim_first_signal ?? '?';
  const comprehension = winner?.scores?.comprehension_signal ?? '?';
  const hvc = winner?.scores?.human_voice_clarity ?? '?';
  const rej = (winner?.rejection_reasons || []).join(',') || 'none';
  const evalWinner = row.winner || '?';
  console.log(`[${row.case_id}] ${(row.title||'').slice(0,28).padEnd(28)} | eval:${evalWinner.padEnd(7)} | family:${family.padEnd(15)} | score:${String(score).padEnd(5)} | cwt:${String(clarityWeighted).padEnd(5)} | cf:${claimFirst} comp:${comprehension} hvc:${String(hvc).slice(0,5)} | prefix:"${prefix5}"`);
  console.log(`   rej: ${rej}`);
}

console.log('\n=== PER-CASE: ALL CANDIDATES (showing top 3 by score) ===');
for (const row of summary.rows) {
  const cp = row.product?.canonical_payload || {};
  const debug = cp.candidate_debug || {};
  const candidates = debug.scores_by_candidate || [];
  if (!candidates.length) {
    console.log(`[${row.case_id}] no candidates`);
    continue;
  }
  const sorted = [...candidates].sort((a, b) => (b.scores?.total_score ?? 0) - (a.scores?.total_score ?? 0));
  const winnerId = debug.winner_id;
  console.log(`[${row.case_id}] ${(row.title||'').slice(0,30)} (winner=${winnerId}):`);
  for (const c of sorted.slice(0, 6)) {
    const isWin = c.candidate_id === winnerId ? ' <<WINNER' : '';
    const rej = (c.rejection_reasons || []).join(',') || 'none';
    const dir = (c.direction_line || '').slice(0, 70);
    console.log(`   [${c.candidate_id}] ${c.family_type?.padEnd(15)} score:${String(c.scores?.total_score ?? '?').padEnd(5)} cwt:${String(c.scores?.clarity_weighted_total ?? '?').padEnd(5)} cf:${c.scores?.claim_first_signal ?? '?'} comp:${c.scores?.comprehension_signal ?? '?'} rej:${rej}${isWin}`);
    console.log(`     dir: "${dir}"`);
  }
  console.log('');
}
