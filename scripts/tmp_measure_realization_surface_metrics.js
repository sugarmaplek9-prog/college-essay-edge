const fs = require('fs');

const beforePath = process.argv[2];
const afterPath = process.argv[3];
const caseIds = new Set(['CT24_02', 'CT24_03', 'CT24_13', 'CT24_15', 'CT24_17', 'CT24_22']);

function readRows(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')).rows.filter((row) => caseIds.has(row.case_id));
}

function prefix(text, n = 5) {
  return String(text ?? '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, n)
    .join(' ');
}

function repeatedShellSummary(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const p = prefix(row.output[key]);
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }

  let repeatedCount = 0;
  for (const row of rows) {
    const p = prefix(row.output[key]);
    if ((counts.get(p) ?? 0) > 1) {
      repeatedCount += 1;
    }
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
  return {
    count: repeatedCount,
    top_prefix: top[0],
    top_prefix_count: top[1],
  };
}

function weakCoach(text) {
  return /^(show how your approach to the decision shifted at|show how the shift in your judgment came at|center your essay on what shifted in your read after)\b/i.test(String(text ?? '').trim());
}

function weakWhy(text) {
  const normalized = String(text ?? '').trim();
  return /^this beats the weaker read because\b/i.test(normalized)
    || /^this is stronger because\b.*drafting payoff:\s*(this gives a clean first paragraph structure|the reader can follow your argument from scene to claim without guesswork|you can draft the opening in three lines)/i.test(normalized);
}

function weakNext(text) {
  return /^(start inside the moment you|start inside i rebuilt the|start inside i shifted to|write the opening in four moves:)\b/i.test(String(text ?? '').trim().toLowerCase());
}

function summarize(rows) {
  return {
    repeated_shell: repeatedShellSummary(rows, 'displayed_recommendation'),
    weak_coach_voice_count: rows.filter((row) => weakCoach(row.output.displayed_recommendation)).length,
    weak_why_usefulness_count: rows.filter((row) => weakWhy(row.output.why_this_direction)).length,
    weak_first_step_concreteness_count: rows.filter((row) => weakNext(row.output.next_step)).length,
    recommendation_prefixes: [...rows.reduce((map, row) => {
      const p = prefix(row.output.displayed_recommendation);
      map.set(p, (map.get(p) ?? 0) + 1);
      return map;
    }, new Map())].sort((a, b) => b[1] - a[1]),
  };
}

const before = readRows(beforePath);
const after = readRows(afterPath);

console.log(JSON.stringify({
  bucket: [...caseIds],
  before: summarize(before),
  after: summarize(after),
}, null, 2));
