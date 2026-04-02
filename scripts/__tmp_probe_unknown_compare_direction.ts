import fs from 'node:fs';
import path from 'node:path';
import { deriveDirectionContent } from '../src/lib/fm/direction';
import { createSessionCaseState } from '../src/lib/fm/case-state';
import { FIXTURE_F4_BLOCKED } from '../src/__tests__/fixtures/orchestrator-responses';

const intake = {
  ...FIXTURE_F4_BLOCKED,
  usable_signal: {
    ...FIXTURE_F4_BLOCKED.usable_signal,
    usable_signal: true,
    signal_strength: 'weak',
    confidence: 'medium',
  },
  recommendation_viability: {
    ...FIXTURE_F4_BLOCKED.recommendation_viability,
    decision: 'needs_more_input',
    confidence: 'medium',
  },
} as any;

const cases = [
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

const results = cases.map((entry) => {
  const caseState = createSessionCaseState(entry.raw_input, intake);
  const direction = deriveDirectionContent(intake, caseState);
  return {
    case_id: entry.case_id,
    displayed_recommendation: direction.strongest.title,
    why_this_direction: direction.strongest.explanation,
    essay_about: direction.strongest.essay_about,
  };
});

fs.writeFileSync(
  path.join(process.cwd(), 'evaluation_outputs', 'tmp_unknown_compare_direction_probe.json'),
  JSON.stringify(results, null, 2)
);

console.log(JSON.stringify(results, null, 2));
