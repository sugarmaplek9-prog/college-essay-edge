#!/usr/bin/env node
/**
 * NDS_RELATIONSHIP_LISTENING_COVERAGE_MICROTEST_V1
 *
 * Targeted validation that the relationship_or_listening axis family is
 * correctly generated for stories whose true center is listening, presence,
 * or relational attention.  Covers four sub-scenarios from the spec:
 *
 *   RL_01 — Listening over fixing (hospital volunteer, AXC_11 verbatim)
 *   RL_02 — Relationship changed by listening (debate partner, AXC_12 verbatim)
 *   RL_03 — Presence over management (sat beside)
 *   RL_04 — Person over task (stopped to listen instead of finishing the work)
 *
 * Pass gates:
 *   - rel_candidate_present: 4/4 cases have a candidate whose direction_line
 *     matches FAMILY_PRESENT_PATTERN (contains "listening" or "person in
 *     front of you" or other axis-naming words)
 *   - core_tension_named: 4/4 candidates name a control/task/fixing vs
 *     listening/attention/person tension
 *   - no_missing_coverage: 0 cases have zero relationship_or_listening
 *     candidates in the full candidate set
 *   - OVERALL: all three gates pass
 */

import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

// ─── Family detection (mirrors nds-axis-coverage-test.ts) ────────────────────

const FAMILY_PRESENT_PATTERN =
  /\b(listening|owed\s+the\s+person|person\s+in\s+front\s+of\s+you|relationship|room\s+once\s+the\s+conflict|paid\s+attention\s+to\s+what\s+the\s+person)\b/i;

// Core-tension quality gate: must name one side of the relational axis
const TENSION_AXIS_PATTERN =
  /\b(control|task|fixing|fix|manage|managing|solution|solving|situation|room|efficiency)\b.*\b(listen|listening|attention|presence|person|staying|care)\b|\b(listen|listening|attention|presence|person|staying|care)\b.*\b(control|task|fixing|fix|manage|managing|solution|solving|situation|room|efficiency)\b/i;

// ─── Test cases ───────────────────────────────────────────────────────────────

type MicrotestCase = {
  id: string;
  title: string;
  scenario: string;
  storyEntries: string[];
};

const CASES: MicrotestCase[] = [
  {
    id: 'RL_01',
    title: 'Hospital volunteer listening pivot',
    scenario: 'listening_over_fixing',
    storyEntries: [
      'I thought helping meant doing as many tasks as possible at the hospital.',
      'a nurse told me I was getting in the way because I moved before asking what was needed.',
      'I shifted to listening first and patient interactions changed immediately.',
    ],
  },
  {
    id: 'RL_02',
    title: 'Debate partner listening correction',
    scenario: 'relationship_changed_by_listening',
    storyEntries: [
      'as captain I kept cutting my partner off because I thought being right was the job.',
      'I changed by asking questions after speeches instead of correcting publicly.',
      'the relationship changed once listening replaced control.',
    ],
  },
  {
    id: 'RL_03',
    title: 'Pediatric unit presence over task',
    scenario: 'presence_over_management',
    storyEntries: [
      'I thought my job in the pediatric unit was to keep moving through the task list.',
      'but when one child kept crying I sat beside her and just waited, instead of calling the duty nurse.',
      'staying with her mattered more than finishing the list.',
    ],
  },
  {
    id: 'RL_04',
    title: 'Camp counselor person over task',
    scenario: 'person_over_task',
    storyEntries: [
      'as a camp counselor I tracked participation stats after every session to stay ahead of the program.',
      'one evening a camper sat alone and I almost walked past because I had a report to finish.',
      'I stopped, sat down, and just listened to what he said, which turned out to be the whole point.',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInput(tc: MicrotestCase): NdsResolvedSources {
  return {
    essay_project: {
      id: `rl_${tc.id}`,
      student_user_id: `rl_${tc.id}`,
      title: tc.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `rl_${tc.id}`,
      first_name: 'RelListening',
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

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  let relCandidatePresentCount = 0;
  let coreTensionNamedCount = 0;
  let missingCoverageCount = 0;

  for (const tc of CASES) {
    const context = buildNdsNormalizedContextPack(buildInput(tc));
    const execution = await executeNdsModule({
      run_id: `rl_${tc.id}`,
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
    const allCandidates: any[] = payload?.candidates ?? [];
    const selected = allCandidates.find((c: any) => c.selected) ?? allCandidates[0] ?? null;

    // Find all candidates whose direction_line matches FAMILY_PRESENT_PATTERN
    const relPresentCandidates = allCandidates.filter((c: any) =>
      FAMILY_PRESENT_PATTERN.test(String(c.direction_line ?? ''))
    );

    const hasPresentCandidate = relPresentCandidates.length > 0;
    if (!hasPresentCandidate) missingCoverageCount += 1;

    // Gate 1: family-present candidate exists
    if (hasPresentCandidate) relCandidatePresentCount += 1;

    // Gate 2: core_tension of best rel candidate names the axis correctly
    const bestRelCandidate = relPresentCandidates[0] ?? null;
    const coreTension = String(bestRelCandidate?.core_tension ?? '');
    const tensionNamed = TENSION_AXIS_PATTERN.test(coreTension);
    if (tensionNamed) coreTensionNamedCount += 1;

    // Console output per case
    console.log(`${tc.id}: [${tc.scenario}]`);
    console.log(`  selected=${selected?.candidate_id ?? 'n/a'} line="${selected?.direction_line ?? 'n/a'}"`);
    console.log(`  rel_present_candidates(${relPresentCandidates.length}): ${relPresentCandidates.map((c: any) => c.candidate_id).join(', ') || 'none'}`);
    if (bestRelCandidate) {
      console.log(`  best_rel_candidate: ${bestRelCandidate.candidate_id}`);
      console.log(`    direction_line: ${bestRelCandidate.direction_line}`);
      console.log(`    core_tension:   ${coreTension}`);
      console.log(`    tension_axis_named: ${tensionNamed ? 'YES' : 'NO'}`);
    } else {
      console.log(`  best_rel_candidate: none`);
    }
    console.log(`  gates: present=${hasPresentCandidate ? 'PASS' : 'FAIL'} tension=${tensionNamed ? 'PASS' : 'FAIL'}`);
    console.log('');
  }

  // ─── Summary ───────────────────────────────────────────────────────────────

  const gate1Pass = relCandidatePresentCount === CASES.length;
  const gate2Pass = coreTensionNamedCount === CASES.length;
  const gate3Pass = missingCoverageCount === 0;
  const overallPass = gate1Pass && gate2Pass && gate3Pass;

  console.log('NDS_RELATIONSHIP_LISTENING_COVERAGE_MICROTEST_V1');
  console.log(
    `  rel_candidate_present: ${relCandidatePresentCount}/${CASES.length} ${gate1Pass ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  core_tension_named: ${coreTensionNamedCount}/${CASES.length} ${gate2Pass ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  no_missing_coverage: missing=${missingCoverageCount}/${CASES.length} ${gate3Pass ? 'PASS' : 'FAIL'}`
  );
  console.log(`  OVERALL: ${overallPass ? 'PASS' : 'FAIL'}`);

  if (!overallPass) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
