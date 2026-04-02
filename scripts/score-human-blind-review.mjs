import fs from 'node:fs';
import path from 'node:path';

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const row = {};
    header.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });
    return row;
  }).filter((r) => r.case_id);
}

function decode(choice, keyRow) {
  const c = (choice || '').trim().toUpperCase();
  if (c === 'A') return keyRow.A_model;
  if (c === 'B') return keyRow.B_model;
  return 'tie';
}

function pick(row, keys) {
  for (const k of keys) {
    if (k in row) return row[k];
  }
  return '';
}

function scoreOne(baseDir) {
  const keyPath = path.join(baseDir, 'blind_review_answer_key.json');
  const csvPath = path.join(baseDir, 'human_blind_review', 'human_blind_scores_template.csv');
  const outPath = path.join(baseDir, 'human_blind_review', 'human_blind_scores_decoded.json');

  const key = JSON.parse(fs.readFileSync(keyPath, 'utf-8')).key;
  const keyMap = new Map(key.map((k) => [k.case_id, k]));
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf-8'));

  const completed = rows.filter((r) => {
    const hasAny = [
      pick(r, ['recommendation_winner(A|B|Tie)', 'directional_usefulness(A|B|Tie)']),
      pick(r, ['why_winner(A|B|Tie)', 'why_quality(A|B|Tie)']),
      pick(r, ['evidence_winner(A|B|Tie)', 'evidence_usefulness(A|B|Tie)', 'evidence_faithfulness(A|B|Tie)']),
      pick(r, ['overall_winner(A|B|Tie)']),
    ].some((v) => String(v || '').trim().length > 0);
    return hasAny;
  });

  const decoded = completed.map((r) => {
    const k = keyMap.get(r.case_id);
    return {
      case_id: r.case_id,
      recommendation_winner: decode(pick(r, ['recommendation_winner(A|B|Tie)', 'directional_usefulness(A|B|Tie)']), k),
      why_winner: decode(pick(r, ['why_winner(A|B|Tie)', 'why_quality(A|B|Tie)']), k),
      evidence_winner: decode(pick(r, ['evidence_winner(A|B|Tie)', 'evidence_usefulness(A|B|Tie)', 'evidence_faithfulness(A|B|Tie)']), k),
      overall_winner: decode(r['overall_winner(A|B|Tie)'], k),
      reviewer_notes: r.reviewer_notes || '',
    };
  });

  const dims = ['recommendation_winner', 'why_winner', 'evidence_winner', 'overall_winner'];
  const aggregate = {};
  for (const d of dims) {
    aggregate[d] = {
      product: decoded.filter((r) => r[d] === 'product').length,
      openai: decoded.filter((r) => r[d] === 'openai').length,
      tie: decoded.filter((r) => r[d] === 'tie').length,
    };
  }

  const out = {
    generated_at: new Date().toISOString(),
    case_count: rows.length,
    scored_case_count: decoded.length,
    aggregate,
    rows: decoded,
    status: decoded.length === 0 ? 'no_scored_rows_in_csv' : 'ok',
  };
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf-8');
  return { baseDir, outPath, aggregate };
}

function main() {
  const singleBase = process.env.BLIND_BASE_DIR;
  if (singleBase) {
    const one = scoreOne(path.resolve(process.cwd(), singleBase));
    console.log(JSON.stringify({ one }, null, 2));
    return;
  }
  const v2 = scoreOne(path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2'));
  const v3 = scoreOne(path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v3'));
  console.log(JSON.stringify({ v2, v3 }, null, 2));
}

main();
