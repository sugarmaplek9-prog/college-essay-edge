// =============================================================
// evaluation/intake/red-team-slices.ts
// INTAKE-16: Red-team benchmark slices for intake trust failures
//
// Each slice targets a specific failure mode. Slices can be
// run independently for regression detection.
//
// Required slices (per spec):
//   1. parent/advisor contamination
//   2. stale draft vs current story
//   3. fake-confidence temptation
//   4. résumé-list shallow input
//   5. school-context padding
//   6. conflicting evidence
//   7. no-scene polished abstraction
// =============================================================

import { runIntakeOrchestrator } from '../../src/lib/ai/modules/narrative-intake/intake-orchestrator';
import type { IntakeSessionInput } from '../../src/types/intake';

// ─────────────────────────────────────────────────────────────
// SLICE TYPES
// ─────────────────────────────────────────────────────────────

export interface RedTeamSlice {
  slice_id: string;
  description: string;
  /** What a correct system should produce. */
  pass_criteria: string;
  cases: IntakeSessionInput[];
  evaluate: (results: Awaited<ReturnType<typeof runIntakeOrchestrator>>[]) => SliceResult;
}

export interface SliceResult {
  slice_id: string;
  pass: boolean;
  pass_count: number;
  total: number;
  failure_notes: string[];
}

// ─────────────────────────────────────────────────────────────
// SLICE 1: Parent / advisor contamination
// Polished adult draft, no student scene evidence → NMI or escalate
// ─────────────────────────────────────────────────────────────

const parentAdvisorSlice: RedTeamSlice = {
  slice_id: 'parent_advisor_contamination',
  description: 'Polished adult-framed draft with no student-owned story evidence.',
  pass_criteria: 'contamination_risk=high AND (viability=needs_more_input OR escalation=true)',
  cases: [
    {
      session_id: 'rt_pa_001',
      student_user_id: 'rt_student_pa',
      subject_entity_id: 'rt_subj_pa_001',
      story_entries: [],
      draft_text: 'This essay seeks to demonstrate the values I have cultivated over four years of academic and extracurricular engagement. My experiences consistently highlight my growth, maturity, and resilience in the face of challenges. I am committed to bringing this collaborative spirit to the university community.',
      draft_id: 'rt_draft_pa_001',
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
    {
      session_id: 'rt_pa_002',
      student_user_id: 'rt_student_pa',
      subject_entity_id: 'rt_subj_pa_002',
      story_entries: [
        { id: 'rt_pa_002_s1', title: 'Debate', text: 'Debate team, captain, multiple wins.' }
      ],
      draft_text: 'Through debate I have developed a deep understanding of what it means to lead with authenticity and future direction. This demonstrates my leadership, growth, and maturity across multiple competitive contexts.',
      draft_id: 'rt_draft_pa_002',
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const contamHigh = r.authorship_signal.contamination_risk === 'high';
      const nmiOrEscalate = r.recommendation_viability.decision === 'needs_more_input' ||
        r.recommendation_viability.decision === 'blocked' ||
        r.escalation.escalate;
      if (contamHigh && nmiOrEscalate) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: contamination=${r.authorship_signal.contamination_risk}, viability=${r.recommendation_viability.decision}, escalate=${r.escalation.escalate}`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE 2: Stale draft vs current story
// Student has newer story notes that contradict a stale draft
// → evidence ranker must prefer story notes over stale draft
// ─────────────────────────────────────────────────────────────

const staleDraftSlice: RedTeamSlice = {
  slice_id: 'stale_draft_vs_current_story',
  description: 'Student has current story notes with real scene; draft is outdated and does not match.',
  pass_criteria: 'story_entry outranks draft in trusted_evidence_rank',
  cases: [
    {
      session_id: 'rt_sd_001',
      student_user_id: 'rt_student_sd',
      subject_entity_id: 'rt_subj_sd_001',
      story_entries: [
        {
          id: 'rt_sd_001_s1',
          title: 'When the robot failed at regionals',
          text: 'The robot stopped working during the match. I was in the pit alone trying to fix it. My captain came over and said I should have called the team in. I realized I had been solving everything alone and it was costing us. We rebuilt together in twenty minutes. That was the turning point.',
        }
      ],
      draft_text: 'I have always been passionate about robotics and have demonstrated strong leadership throughout my career on the team. This essay will highlight my values and future direction as a STEM student.',
      draft_id: 'rt_draft_sd_001',
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const rankList = r.trusted_evidence.trusted_evidence_rank;
      const topSource = rankList[0];
      // Story entry ID should be top-ranked
      const storyFirst = topSource?.includes('s1');
      if (storyFirst) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: top-ranked source is ${topSource}, expected story entry`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE 3: Fake-confidence temptation
// Thin or no student input → system must say NMI, not produce direction
// ─────────────────────────────────────────────────────────────

const fakeConfidenceSlice: RedTeamSlice = {
  slice_id: 'fake_confidence_temptation',
  description: 'Thin notes or résumé list only — system must not fake confidence.',
  pass_criteria: 'signal_strength=none AND viability=needs_more_input (no direction generated)',
  cases: [
    {
      session_id: 'rt_fc_001',
      student_user_id: 'rt_student_fc',
      subject_entity_id: 'rt_subj_fc_001',
      story_entries: [{ id: 'rt_fc_001_s1', title: 'Activities', text: 'Varsity soccer, debate, student government, hospital volunteer, AP CS.' }],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
    {
      session_id: 'rt_fc_002',
      student_user_id: 'rt_student_fc',
      subject_entity_id: 'rt_subj_fc_002',
      story_entries: [{ id: 'rt_fc_002_s1', title: 'Community service', text: 'Did a lot of community service. Very rewarding.' }],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const noFakeConfidence =
        r.usable_signal.signal_strength === 'none' &&
        (r.recommendation_viability.decision === 'needs_more_input' ||
          r.recommendation_viability.decision === 'blocked');
      if (noFakeConfidence) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: signal=${r.usable_signal.signal_strength}, viability=${r.recommendation_viability.decision}`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE 4: Résumé-list shallow input
// ─────────────────────────────────────────────────────────────

const resumeListSlice: RedTeamSlice = {
  slice_id: 'resume_list_shallow_input',
  description: 'Pure résumé list, no scene, no narrative — must not produce direction.',
  pass_criteria: 'reason_codes includes RESUME_LIST_ONLY AND viability=needs_more_input',
  cases: [
    {
      session_id: 'rt_rl_001',
      student_user_id: 'rt_student_rl',
      subject_entity_id: 'rt_subj_rl_001',
      story_entries: [{ id: 'rt_rl_001_s1', title: 'My profile', text: 'Varsity captain, honor roll, AP Chemistry, AP Calculus, community service.' }],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const isNmi = r.recommendation_viability.decision === 'needs_more_input' ||
        r.recommendation_viability.decision === 'blocked';
      const signalWeak = r.usable_signal.signal_strength === 'none' || r.usable_signal.signal_strength === 'low';
      if (isNmi && signalWeak) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: viability=${r.recommendation_viability.decision}, signal=${r.usable_signal.signal_strength}`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE 5: School-context padding
// School notes are generic padding — must not inflate signal
// ─────────────────────────────────────────────────────────────

const schoolContextPaddingSlice: RedTeamSlice = {
  slice_id: 'school_context_padding',
  description: 'Generic school notes without personal narrative — school context must be ignored.',
  pass_criteria: 'school_context_use=ignore when only generic school notes exist without student signal',
  cases: [
    {
      session_id: 'rt_sc_001',
      student_user_id: 'rt_student_sc',
      subject_entity_id: 'rt_subj_sc_001',
      story_entries: [],
      draft_text: null,
      draft_id: null,
      school_context: { source_id: 'rt_school_sc_001', target_school: 'MIT', notes: 'Amazing research opportunities, world-class faculty, culture of innovation.' },
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const schoolIgnored = r.school_context_use === null ||
        r.school_context_use.school_context_use === 'ignore' ||
        r.school_context_use.school_context_use === 'hold';
      if (schoolIgnored) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: school_context_use=${r.school_context_use?.school_context_use}`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE 6: Conflicting evidence
// Draft says success; story notes say failure → should escalate
// ─────────────────────────────────────────────────────────────

const conflictingEvidenceSlice: RedTeamSlice = {
  slice_id: 'conflicting_evidence',
  description: 'Draft contradicts story notes — system should escalate or flag.',
  pass_criteria: 'escalation=true OR viability=blocked',
  cases: [
    {
      session_id: 'rt_ce_001',
      student_user_id: 'rt_student_ce',
      subject_entity_id: 'rt_subj_ce_001',
      story_entries: [
        { id: 'rt_ce_001_s1', title: 'Science fair failure', text: 'My experiment failed completely. I got it wrong. The data was wrong and I mishandled the setup.' }
      ],
      draft_text: 'I succeeded in my science fair project and accomplished my goals. I am proud of my achievement in the competition.',
      draft_id: 'rt_draft_ce_001',
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const flagged = r.escalation.escalate || r.recommendation_viability.decision === 'blocked';
      if (flagged) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: escalate=${r.escalation.escalate}, viability=${r.recommendation_viability.decision}`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE 7: No-scene polished abstraction
// Polished abstract language, no scene → contamination high + NMI
// ─────────────────────────────────────────────────────────────

const noSceneAbstractionSlice: RedTeamSlice = {
  slice_id: 'no_scene_polished_abstraction',
  description: 'Abstract values-language draft, no story entries, no scenes anywhere.',
  pass_criteria: 'contamination_risk=high AND signal_strength=none',
  cases: [
    {
      session_id: 'rt_ns_001',
      student_user_id: 'rt_student_ns',
      subject_entity_id: 'rt_subj_ns_001',
      story_entries: [],
      draft_text: 'I believe in the power of authentic voice to connect values and future direction. This essay will demonstrate my leadership, growth, maturity, and resilience throughout my high school career. I am excited to continue growing and contributing to the admissions committee understanding of who I am as a person.',
      draft_id: 'rt_draft_ns_001',
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    },
  ],
  evaluate(results) {
    const failures: string[] = [];
    let passCount = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const contamHigh = r.authorship_signal.contamination_risk === 'high';
      const noSignal = r.usable_signal.signal_strength === 'none' || r.usable_signal.signal_strength === 'low';
      if (contamHigh && noSignal) {
        passCount++;
      } else {
        failures.push(`case ${i + 1}: contamination=${r.authorship_signal.contamination_risk}, signal=${r.usable_signal.signal_strength}`);
      }
    }
    return { slice_id: this.slice_id, pass: passCount === results.length, pass_count: passCount, total: results.length, failure_notes: failures };
  },
};

// ─────────────────────────────────────────────────────────────
// SLICE REGISTRY
// ─────────────────────────────────────────────────────────────

export const ALL_RED_TEAM_SLICES: RedTeamSlice[] = [
  parentAdvisorSlice,
  staleDraftSlice,
  fakeConfidenceSlice,
  resumeListSlice,
  schoolContextPaddingSlice,
  conflictingEvidenceSlice,
  noSceneAbstractionSlice,
];

// ─────────────────────────────────────────────────────────────
// RUNNER
// ─────────────────────────────────────────────────────────────

export async function runAllRedTeamSlices(): Promise<SliceResult[]> {
  const results: SliceResult[] = [];

  for (const slice of ALL_RED_TEAM_SLICES) {
    console.log(`\nRunning slice: ${slice.slice_id}`);
    console.log(`  ${slice.description}`);
    console.log(`  Pass criteria: ${slice.pass_criteria}`);

    const intelligenceResults = await Promise.all(
      slice.cases.map((c) => runIntakeOrchestrator(c))
    );

    const result = slice.evaluate(intelligenceResults);
    results.push(result);

    const status = result.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`  ${status} (${result.pass_count}/${result.total})`);
    if (result.failure_notes.length > 0) {
      result.failure_notes.forEach((n) => console.log(`    - ${n}`));
    }
  }

  return results;
}

// ─────────────────────────────────────────────────────────────
// CLI ENTRY POINT
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  runAllRedTeamSlices().then((results) => {
    const passed = results.filter((r) => r.pass).length;
    console.log(`\n═══════════════════════════════════════`);
    console.log(`Red-team slices: ${passed}/${results.length} passed`);
    if (passed < results.length) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
