import fs from 'node:fs';
import path from 'node:path';

const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-ps41ao7cl-college-edge.vercel.app';

const cases = [
  {
    case_id: 'FOUNDER_COMPARE_REPRO',
    raw_input: 'I am deciding between I was lining up crayons with preschoolers during quiet work time and I was sitting with one child who would not stop crying. Both matter to me and I am unsure which one is better for my college essay.',
  },
  {
    case_id: 'UNKNOWN_COMPARE_CONTROL',
    raw_input: 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.',
  },
  {
    case_id: 'STRONG_INPUT_CONTROL',
    raw_input: 'During regionals our robot failed inspection twice, and I told the team to remove an autonomous feature to pass on time. Another programmer argued we should keep it and risk a late match. I overruled him. We qualified but lost our quarterfinal because of manual control mistakes. After the event he said my call protected schedule but ignored our actual strength. I now frame emergency decisions as tradeoffs out loud before choosing.',
  },
];

const results = [];
for (const testCase of cases) {
  const response = await fetch(base + '/api/intake/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_input: testCase.raw_input }),
  });
  const json = await response.json();
  results.push({
    case_id: testCase.case_id,
    raw_input: testCase.raw_input,
    status: response.status,
    product_mode: json?.product_mode ?? null,
    route_target: json?.canonical_page3_payload?.routing?.route_target ?? null,
    recommendation_packet: json?.canonical_page3_payload?.recommendation_packet ?? null,
    candidate_debug: {
      winner_family: json?.canonical_page3_payload?.candidate_debug?.winner_family ?? null,
      winner_id: json?.canonical_page3_payload?.candidate_debug?.winner_id ?? null,
    },
  });
}

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_verify_compare_fix_live.json');
fs.writeFileSync(outPath, JSON.stringify({ base, results }, null, 2));
console.log(JSON.stringify({ outPath, base, caseCount: results.length }, null, 2));
