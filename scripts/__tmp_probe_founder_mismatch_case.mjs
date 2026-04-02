import fs from 'node:fs';
import path from 'node:path';

const raw = 'I am deciding between I was lining up crayons with preschoolers during quiet work time and I was sitting with one child who would not stop crying. Both matter to me and I am unsure which one is better for my college essay.';
const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-2znydb2qi-college-edge.vercel.app';

const response = await fetch(base + '/api/intake/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ raw_input: raw }),
});
const json = await response.json();

const output = {
  base,
  raw_input: raw,
  product_mode: json.product_mode,
  route_target: json.canonical_page3_payload?.routing?.route_target,
  recommendation_packet: json.canonical_page3_payload?.recommendation_packet,
  candidate_debug: {
    winner_family: json.canonical_page3_payload?.candidate_debug?.winner_family,
    winner_id: json.canonical_page3_payload?.candidate_debug?.winner_id,
  },
};

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_founder_mismatch_probe.json');
fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ outPath, ...output }, null, 2));
