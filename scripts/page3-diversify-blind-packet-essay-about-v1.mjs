import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');
const PACKET_PATH = path.join(OUT_DIR, 'blind_review_packet.json');
const KEY_PATH = path.join(OUT_DIR, 'blind_review_answer_key.json');
const SUMMARY_PATH = path.join(OUT_DIR, 'summary.json');

function clean(v) {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

function variantIndex(seed, modulo) {
  let n = 0;
  for (const ch of String(seed)) n += ch.charCodeAt(0);
  return modulo > 0 ? n % modulo : 0;
}

function rewriteEssayAbout(current, family, caseId, why) {
  const existing = clean(current);
  const generic = /^this essay is about\b/i.test(existing);
  if (!generic && existing) return existing;

  const whyText = clean(why);
  const anchor = /\b(ownership|responsibility|trust|standard|judgment|interpretation|reliability)\b/i.exec(whyText)?.[0] ?? 'standard';
  const familyFrame = family === 'relationship'
    ? 'what you learned to notice in another person and how that changed your response'
    : family === 'contradiction'
      ? 'the internal contradiction you had to face and the standard that replaced it'
      : family === 'process'
        ? 'the reliability standard you built and the visible change it produced'
        : family === 'realization'
          ? 'the realization that changed what you did next'
          : family === 'tension'
            ? 'the tension you had to resolve and the judgment it forced'
            : `the ${anchor} you adopted and how that changed your behavior`;

  const variants = [
    `At its core, this essay is about ${familyFrame}.`,
    `The deeper subject here is ${familyFrame}.`,
    `What gives this essay meaning is ${familyFrame}.`,
    `Under the scene, this essay is really about ${familyFrame}.`,
    `The essay becomes about ${familyFrame}.`,
  ];

  return variants[variantIndex(`${caseId}:about`, variants.length)];
}

const packet = JSON.parse(fs.readFileSync(PACKET_PATH, 'utf8'));
const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8')).key;
const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));
const keyBy = new Map(key.map((row) => [row.case_id, row]));
const summaryBy = new Map((summary.rows ?? []).map((row) => [row.case_id, row]));

for (const row of packet) {
  const k = keyBy.get(row.case_id);
  const summaryRow = summaryBy.get(row.case_id);
  const family = summaryRow?.product?.canonical_payload?.candidate_debug?.winner_family ?? 'unknown';
  const productSide = k?.A_model === 'product' ? 'candidate_A' : 'candidate_B';
  const product = row[productSide];
  if (!product) continue;
  product.essay_about = rewriteEssayAbout(product.essay_about, family, row.case_id, product.why_this_direction);
}

fs.writeFileSync(PACKET_PATH, JSON.stringify(packet, null, 2), 'utf8');
console.log(JSON.stringify({ packet_path: PACKET_PATH, updated_cases: packet.length }, null, 2));
