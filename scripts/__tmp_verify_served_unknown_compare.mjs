import fs from 'node:fs';
import path from 'node:path';

const baseUrl = process.env.PRODUCT_URL ?? 'http://127.0.0.1:3501';
const targets = [
  {
    case_id: 'HV2_11',
    raw_input: 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.',
  },
  {
    case_id: 'HV3_11',
    raw_input: 'I sing in choir and I also build small coding projects. Both matter to me and I am not sure which would make a better college essay topic.',
  },
  {
    case_id: 'HV4_11',
    raw_input: 'I do photography and I also play tennis competitively. Both are meaningful to me and I am unsure which one should be my college essay topic.',
  },
];

const results = [];
for (const target of targets) {
  const response = await fetch(`${baseUrl}/api/intake/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_input: target.raw_input }),
  });

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  const packet = parsed?.canonical_page3_payload?.recommendation_packet ?? null;
  results.push({
    case_id: target.case_id,
    status: response.status,
    ok: response.ok,
    product_mode: parsed?.product_mode ?? null,
    displayed_recommendation: packet?.displayed_recommendation ?? null,
    why_this_direction: packet?.why_this_direction ?? null,
    essay_about: packet?.essay_about ?? null,
    weaker_read: packet?.weaker_read ?? null,
    stronger_read: packet?.stronger_read ?? null,
    raw_response_excerpt: text.slice(0, 300),
  });
}

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_served_unknown_compare_verify.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
