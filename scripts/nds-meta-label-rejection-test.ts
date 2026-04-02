#!/usr/bin/env node

import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type TestCase = {
  id: string;
  title: string;
  storyEntries: string[];
};

const HARD_META_PATTERN =
  /\b(the\s+angle\s+behind|the\s+story\s+behind|what\s+changed\s+after|the\s+shift\s+behind|how\s+the\s+student\s+corrected\s+course|the\s+moment\s+the\s+student\s+corrected\s+course|what\s+happened\s+after\s+the\s+moment|the\s+structure\s+behind\s+the\s+event|the\s+narrative\s+behind)\b/i;

const CASES: TestCase[] = [
  {
    id: 'MLR_01',
    title: 'Template-frame trap (interpreter)',
    storyEntries: [
      'I translated for my parents and thought I was helping by smoothing their words.',
      'then I realized I was removing what they actually wanted to say, so I stopped and asked first.',
      'their voices changed the conversation with doctors.',
    ],
  },
  {
    id: 'MLR_02',
    title: 'Template-frame trap (orchestra)',
    storyEntries: [
      'I played louder to cover section hesitation.',
      'then I stopped masking and went quiet so people had to hear and fix weak spots.',
      'the section improved because the old pattern stopped.',
    ],
  },
  {
    id: 'MLR_03',
    title: 'System redesign axis',
    storyEntries: [
      'our restaurant kept losing tickets in rushes because everything was verbal.',
      'I redesigned the process with a ticket rail and priority staging workflow.',
      'lost tickets dropped to zero after the redesign.',
    ],
  },
  {
    id: 'MLR_04',
    title: 'Delegation axis',
    storyEntries: [
      'I was the bottleneck for all code reviews and everyone waited on me.',
      'I delegated ownership to three engineers and added a shared rubric and handoff rules.',
      'turnaround dropped from three days to under one.',
    ],
  },
  {
    id: 'MLR_05',
    title: 'Pattern breaking axis',
    storyEntries: [
      'I kept pushing harder with the same explanation whenever tutoring failed.',
      'I realized persistence was the wrong pattern and switched to diagnostic questions.',
      'students improved after I broke the default response.',
    ],
  },
  {
    id: 'MLR_06',
    title: 'Identity shift axis',
    storyEntries: [
      'I stopped seeing myself as the fixer who had to solve everything personally.',
      'the real change was in who I was becoming and how I understood my role.',
      'I started building conditions where others could own outcomes too.',
    ],
  },
];

function buildInput(tc: TestCase): NdsResolvedSources {
  return {
    essay_project: {
      id: `mlr_${tc.id}`,
      student_user_id: `mlr_${tc.id}`,
      title: tc.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `mlr_${tc.id}`,
      first_name: 'Meta',
      last_name: tc.id,
      grade: 11,
      interests: [],
    },
    story_entries: tc.storyEntries.map((body, i) => ({
      id: `${tc.id}_${i + 1}`,
      title: `Story ${i + 1}`,
      body,
      category: null,
    })),
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: tc.storyEntries.length,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

async function run(): Promise<void> {
  let hardRejectObservedCount = 0;
  let diagnosticsPresentCount = 0;
  let selectedHardMetaCount = 0;
  let selectedPenaltyCount = 0;

  for (const tc of CASES) {
    const context = buildNdsNormalizedContextPack(buildInput(tc));
    const execution = await executeNdsModule({
      run_id: `mlr_${tc.id}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: context,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = execution.candidate_payload as any;
    const selected = payload?.candidates?.find((c: any) => c.selected) ?? payload?.candidates?.[0];
    const selectedLine = String(selected?.direction_line ?? '');

    if (HARD_META_PATTERN.test(selectedLine)) selectedHardMetaCount += 1;

    const selectedFlags = selected?.validator_flags;
    const hasDiagnostics =
      selectedFlags &&
      typeof selectedFlags.meta_label_reject === 'boolean' &&
      typeof selectedFlags.meta_label_penalty === 'boolean' &&
      Object.prototype.hasOwnProperty.call(selectedFlags, 'meta_label_reason');
    if (hasDiagnostics) diagnosticsPresentCount += 1;

    if (selectedFlags?.meta_label_penalty) selectedPenaltyCount += 1;

    const rejected = payload?.rejected_candidates ?? [];
    const hasMetaRejection = rejected.some((r: any) =>
      (r.rejection_reasons ?? []).some((reason: string) => reason.startsWith('meta_label_reject:'))
    );
    if (hasMetaRejection) hardRejectObservedCount += 1;

    console.log(`${tc.id}: selected=${selected?.candidate_id ?? 'n/a'} route=${payload?.route_decision ?? 'n/a'}`);
    console.log(`  line: ${selectedLine}`);
    console.log(`  meta_flags: reject=${selectedFlags?.meta_label_reject ?? 'n/a'} penalty=${selectedFlags?.meta_label_penalty ?? 'n/a'} axis_presence=${selectedFlags?.axis_presence ?? 'n/a'} reason=${selectedFlags?.meta_label_reason ?? 'n/a'}`);
    console.log(`  rejected_meta_label_count=${rejected.filter((r: any) => (r.rejection_reasons ?? []).some((x: string) => x.startsWith('meta_label_reject:'))).length}`);
  }

  const diagnosticsPass = diagnosticsPresentCount === CASES.length;
  const selectedHardMetaPass = selectedHardMetaCount === 0;
  const hardRejectObservedPass = hardRejectObservedCount >= 2;

  console.log('\nNDS_META_LABEL_REJECTION_TEST_V1');
  console.log(`  diagnostics present on selected candidates: ${diagnosticsPresentCount}/${CASES.length} ${diagnosticsPass ? 'PASS' : 'FAIL'}`);
  console.log(`  selected hard meta-label lines: ${selectedHardMetaCount}/${CASES.length} ${selectedHardMetaPass ? 'PASS' : 'FAIL'}`);
  console.log(`  cases with explicit meta_label_reject in rejected candidates: ${hardRejectObservedCount}/${CASES.length} ${hardRejectObservedPass ? 'PASS' : 'FAIL'}`);
  console.log(`  selected candidates with soft penalty flag: ${selectedPenaltyCount}/${CASES.length}`);

  const overallPass = diagnosticsPass && selectedHardMetaPass && hardRejectObservedPass;
  console.log(`  OVERALL: ${overallPass ? 'PASS' : 'FAIL'}`);

  if (!overallPass) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
