import fs from 'node:fs';
import path from 'node:path';

const BLIND_PACKET = process.env.BLIND_PACKET ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_packet.json');
const BLIND_KEY = process.env.BLIND_KEY ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_answer_key.json');
const BLIND_OUT_JSON = process.env.BLIND_OUT_JSON ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_scored_proxy.json');
const BLIND_OUT_MD = process.env.BLIND_OUT_MD ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2', 'BLIND_REVIEW_SCORED_PROXY.md');

function extractOpenAiKey() {
  const fullKeyRaw = process.env.OPENAI_API_KEY?.trim() ?? '';
  const fragmentRaw = process.env.OPENAI_API_KEY_FRAGMENT?.trim() ?? '';
  const extractToken = (raw) => {
    if (!raw) return '';
    const direct = raw.match(/sk-[A-Za-z0-9_-]{40,}/)?.[0];
    if (direct) return direct;
    const fragmentToken = raw.match(/[A-Za-z0-9_-]{80,}/)?.[0] ?? '';
    return fragmentToken ? `sk-proj-${fragmentToken}` : '';
  };
  return extractToken(fullKeyRaw) || extractToken(fragmentRaw);
}

function mapChoiceToModel(choice, keyRow) {
  if (choice === 'A') return keyRow.A_model;
  if (choice === 'B') return keyRow.B_model;
  return 'tie';
}

async function judgeCase(caseRow, apiKey) {
  const prompt = [
    'You are a strict blind reviewer for college-essay direction outputs.',
    'Compare Candidate A vs Candidate B using only:',
    '1) recommendation quality',
    '2) why-this-direction quality',
    '3) evidence support quality',
    '4) overall quality.',
    'Choose exactly one of: A, B, Tie for each field.',
    'Return strict JSON with keys:',
    'recommendation_winner, why_winner, evidence_winner, overall_winner, rationale_short',
    '',
    `CASE_ID: ${caseRow.case_id}`,
    `TITLE: ${caseRow.title}`,
    `RAW_NOTES: ${caseRow.raw_notes}`,
    '',
    'CANDIDATE_A',
    `recommendation: ${caseRow.candidate_A.recommendation}`,
    `why_this_direction: ${caseRow.candidate_A.why_this_direction}`,
    `evidence_lines: ${(caseRow.candidate_A.evidence_lines || []).join(' | ')}`,
    '',
    'CANDIDATE_B',
    `recommendation: ${caseRow.candidate_B.recommendation}`,
    `why_this_direction: ${caseRow.candidate_B.why_this_direction}`,
    `evidence_lines: ${(caseRow.candidate_B.evidence_lines || []).join(' | ')}`,
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_BLIND_REVIEW_MODEL || 'gpt-4o-mini',
      input: prompt,
      text: { format: { type: 'json_object' } },
      max_output_tokens: 400,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`openai_blind_review_error_${res.status}:${txt.slice(0, 160)}`);
  }

  const body = await res.json();
  const rawText = body?.output_text ?? body?.output?.[0]?.content?.[0]?.text ?? '{}';
  const j = JSON.parse(rawText);

  const normalize = (v) => {
    const s = String(v || '').trim();
    if (/^a$/i.test(s)) return 'A';
    if (/^b$/i.test(s)) return 'B';
    return 'Tie';
  };

  return {
    recommendation_winner: normalize(j.recommendation_winner),
    why_winner: normalize(j.why_winner),
    evidence_winner: normalize(j.evidence_winner),
    overall_winner: normalize(j.overall_winner),
    rationale_short: String(j.rationale_short || '').trim().slice(0, 280),
  };
}

async function main() {
  const apiKey = extractOpenAiKey();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY missing for blind review scoring');
  }

  const packet = JSON.parse(fs.readFileSync(BLIND_PACKET, 'utf-8'));
  const key = JSON.parse(fs.readFileSync(BLIND_KEY, 'utf-8')).key;
  const keyMap = new Map(key.map((k) => [k.case_id, k]));

  const rows = [];
  for (const row of packet) {
    const judged = await judgeCase(row, apiKey);
    const keyRow = keyMap.get(row.case_id);
    rows.push({
      case_id: row.case_id,
      judged,
      decoded: {
        recommendation_winner: mapChoiceToModel(judged.recommendation_winner, keyRow),
        why_winner: mapChoiceToModel(judged.why_winner, keyRow),
        evidence_winner: mapChoiceToModel(judged.evidence_winner, keyRow),
        overall_winner: mapChoiceToModel(judged.overall_winner, keyRow),
      },
    });
  }

  const dims = ['recommendation_winner', 'why_winner', 'evidence_winner', 'overall_winner'];
  const aggregate = {};
  for (const d of dims) {
    aggregate[d] = {
      product: rows.filter((r) => r.decoded[d] === 'product').length,
      openai: rows.filter((r) => r.decoded[d] === 'openai').length,
      tie: rows.filter((r) => r.decoded[d] === 'tie').length,
    };
  }

  const out = {
    generated_at: new Date().toISOString(),
    method: 'blind_proxy_reviewer_single_model',
    model: process.env.OPENAI_BLIND_REVIEW_MODEL || 'gpt-4o-mini',
    packet_path: BLIND_PACKET,
    answer_key_path: BLIND_KEY,
    case_count: rows.length,
    aggregate,
    rows,
  };

  fs.writeFileSync(BLIND_OUT_JSON, JSON.stringify(out, null, 2), 'utf-8');

  const md = [];
  md.push('# BLIND REVIEW SCORED (PROXY) — PAGE3 HOLDOUT V2');
  md.push('');
  md.push('This is a proxy blind review scored by a neutral model, not a human panel.');
  md.push('');
  md.push(`- Cases: ${rows.length}`);
  md.push(`- Reviewer model: ${out.model}`);
  md.push('');
  md.push('## Aggregate');
  md.push('');
  for (const d of dims) {
    md.push(`### ${d}`);
    md.push(`- product: ${aggregate[d].product}`);
    md.push(`- openai: ${aggregate[d].openai}`);
    md.push(`- tie: ${aggregate[d].tie}`);
    md.push('');
  }

  md.push('## Per-case');
  md.push('');
  for (const r of rows) {
    md.push(`### ${r.case_id}`);
    md.push(`- recommendation: ${r.decoded.recommendation_winner}`);
    md.push(`- why: ${r.decoded.why_winner}`);
    md.push(`- evidence: ${r.decoded.evidence_winner}`);
    md.push(`- overall: ${r.decoded.overall_winner}`);
    md.push(`- rationale: ${r.judged.rationale_short}`);
    md.push('');
  }

  fs.writeFileSync(BLIND_OUT_MD, `${md.join('\n')}\n`, 'utf-8');

  console.log(JSON.stringify({ out_json: BLIND_OUT_JSON, out_md: BLIND_OUT_MD, aggregate }, null, 2));
}

main().catch((e) => {
  console.error('[blind-score] fatal:', e.message || e);
  process.exit(1);
});
