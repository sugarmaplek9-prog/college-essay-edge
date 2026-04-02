import fs from 'node:fs';
import path from 'node:path';

const base = process.env.PRODUCT_URL ?? 'https://college-essay-edge-3ygy69od5-college-edge.vercel.app';

const cases = [
  {
    case_id: 'HV2_01',
    raw_input:
      'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.',
  },
  {
    case_id: 'HV2_10',
    raw_input:
      'During regionals our robot failed inspection twice, and I told the team to remove an autonomous feature to pass on time. Another programmer argued we should keep it and risk a late match. I overruled him. We qualified but lost our quarterfinal because of manual control mistakes. After the event he said my call protected schedule but ignored our actual strength. I now frame emergency decisions as tradeoffs out loud before choosing.',
  },
  {
    case_id: 'HV2_12',
    raw_input:
      'I used to think translating for my grandparents at government offices was just a family duty. At one appointment the clerk spoke quickly and I summarized instead of translating line by line so we could finish faster. My grandfather signed a form he did not understand. We had to return the next week to reverse it. Since then I ask officials to pause and I translate every instruction fully even when the line gets longer. That day changed what responsibility sounds like to me.',
  },
];

const results = [];
for (const testCase of cases) {
  const response = await fetch(base + '/api/intake/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ raw_input: testCase.raw_input }),
  });
  const json = await response.json();
  results.push({
    case_id: testCase.case_id,
    status: response.status,
    product_mode: json?.product_mode ?? null,
    displayed_recommendation: json?.canonical_page3_payload?.recommendation_packet?.displayed_recommendation ?? null,
    why_this_direction: json?.canonical_page3_payload?.recommendation_packet?.why_this_direction ?? null,
    first_coaching_step: json?.canonical_page3_payload?.recommendation_packet?.first_coaching_step ?? null,
    next_step: json?.canonical_page3_payload?.recommendation_packet?.next_step ?? null,
    essay_about: json?.canonical_page3_payload?.recommendation_packet?.essay_about ?? null,
  });
}

const outPath = path.join(process.cwd(), 'evaluation_outputs', 'tmp_strong_preview_api_probe.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ outPath, base, caseCount: results.length }, null, 2));
