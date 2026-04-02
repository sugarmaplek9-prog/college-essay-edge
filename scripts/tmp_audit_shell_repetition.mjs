import fs from 'node:fs';

const packet = JSON.parse(fs.readFileSync('evaluation_outputs/page3_holdout_v2_remediation/blind_review_packet.json', 'utf8'));
const key = JSON.parse(fs.readFileSync('evaluation_outputs/page3_holdout_v2_remediation/blind_review_answer_key.json', 'utf8')).key;
const keyBy = new Map(key.map((row) => [row.case_id, row]));

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const words = (value) => clean(value).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const prefix = (value, n = 5) => words(value).slice(0, n).join(' ');

function shell(value) {
  const text = clean(value).toLowerCase();
  if (/^essay angle:/.test(text)) return 'essay_angle';
  if (/^center this essay on/.test(text)) return 'center_this_essay_on';
  if (/^make the claim that/.test(text)) return 'make_the_claim_that';
  if (/^show how/.test(text)) return 'show_how';
  if (/^write this as/.test(text)) return 'write_this_as';
  if (/^this essay is about/.test(text)) return 'this_essay_is_about';
  if (/^the stronger version/.test(text)) return 'the_stronger_version';
  if (/^the weaker version/.test(text)) return 'the_weaker_version';
  if (/^it is stronger because/.test(text)) return 'it_is_stronger_because';
  if (/^this works because/.test(text)) return 'this_works_because';
  return `other:${prefix(text, 3)}`;
}

const fields = ['recommendation', 'essay_about', 'why_this_direction', 'weaker_read', 'stronger_read'];
for (const field of fields) {
  const values = packet
    .map((row) => {
      const k = keyBy.get(row.case_id);
      const product = k?.A_model === 'product' ? row.candidate_A : row.candidate_B;
      return clean(product?.[field]);
    })
    .filter(Boolean);

  const prefixCounts = new Map();
  const shellCounts = new Map();
  for (const value of values) {
    const p = prefix(value);
    const s = shell(value);
    prefixCounts.set(p, (prefixCounts.get(p) ?? 0) + 1);
    shellCounts.set(s, (shellCounts.get(s) ?? 0) + 1);
  }

  const topEntries = (map, n = 6) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
  console.log(`\nFIELD ${field}`);
  console.log('top_prefixes', JSON.stringify(topEntries(prefixCounts)));
  console.log('top_shells', JSON.stringify(topEntries(shellCounts)));
}
