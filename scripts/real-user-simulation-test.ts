#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type SimulationClass =
  | 'strong_first_pass'
  | 'clarification_needed'
  | 'low_signal'
  | 'contradiction_collision'
  | 'revision_loop'
  | 'near_abandonment';

type ExpectedHelpfulnessOutcome =
  | 'strong_progress'
  | 'moderate_progress'
  | 'clarification_success'
  | 'recovery_success'
  | 'likely_abandon_if_bad';

type ProgressUsefulness = 'strong' | 'moderate' | 'weak';
type TrustDurability = 'maintained' | 'shaky' | 'lost';
type CumulativeIntelligence = 'strong' | 'partial' | 'weak';
type TernaryUsefulness = 'strong' | 'partial' | 'weak';
type OverallTrustworthiness = 'trustworthy' | 'questionable' | 'not_trustworthy';
type Severity = 'high' | 'medium' | 'low';

type FailureCluster =
  | 'first_result_disappointment'
  | 'clarification_wheel_spinning'
  | 'revision_loop_weakness'
  | 'compare_refine_confusion'
  | 'repetition_non_cumulative'
  | 'emotional_trust_drop'
  | 'abandonment_risk';

type UserActionType =
  | 'submit_rough_notes'
  | 'submit_rough_paragraph'
  | 'respond_clarification'
  | 'choose_between_centers'
  | 'revise_after_result'
  | 'switch_uncertain_to_concrete'
  | 'compare_or_refine'
  | 'return_after_unsatisfying_result'
  | 'continue_after_blocked_low_signal';

type Step = {
  action_type: UserActionType;
  input_summary: string;
  raw_input: string;
};

type SimulationScenario = {
  simulation_id: string;
  simulation_class: SimulationClass;
  student_profile_summary: string;
  initial_input_quality: 'high' | 'medium' | 'low';
  likely_user_risk: string;
  user_goal: string;
  expected_helpfulness_outcome: ExpectedHelpfulnessOutcome;
  step_sequence: Step[];
};

type SystemResponse = {
  route_decision: string;
  direction_line: string;
  explanation_summary: string;
  next_action_presented: string;
  confidence_band: string;
  status: string;
};

type TraceStep =
  | { step: number; kind: 'USER_ACTION'; action_type: UserActionType; input_summary: string }
  | { step: number; kind: 'SYSTEM_RESPONSE'; route_decision: string; direction_line: string; explanation_summary: string; next_action_presented: string };

type SimulationAudit = {
  progress_usefulness: ProgressUsefulness;
  trust_durability: TrustDurability;
  cumulative_intelligence: CumulativeIntelligence;
  clarification_usefulness: TernaryUsefulness | 'n/a';
  revision_usefulness: TernaryUsefulness | 'n/a';
  overall_simulation_trustworthiness: OverallTrustworthiness;
};

type SimulationPacket = {
  simulation_id: string;
  simulation_class: SimulationClass;
  expected_helpfulness_outcome: ExpectedHelpfulnessOutcome;
  student_profile_summary: string;
  likely_user_risk: string;
  user_goal: string;
  step_trace: TraceStep[];
  simulation_audit: SimulationAudit;
  likely_abandon_point: string;
  top_failures: string[];
  what_worked: string[];
  recommended_fixes: string[];
  severity: Severity;
  main_failure_cluster: FailureCluster;
  fix_owner: string;
  fix_priority: 1 | 2 | 3 | 4 | 5;
  human_review: {
    required: boolean;
    what_user_likely_felt: string;
    what_product_should_have_done_better: string;
    likely_layer: 'engine' | 'flow' | 'copy' | 'interaction_design';
  };
};

type ThresholdCheck = {
  metric: string;
  pass: number;
  total: number;
  threshold: number;
  status: 'PASS' | 'FAIL';
};

const ROOT = process.cwd();
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'real_user_simulation_test_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'REAL_USER_SIMULATION_TEST_RESULTS_V1.md');

const SCENARIOS: SimulationScenario[] = [
  {
    simulation_id: 'RUS_01',
    simulation_class: 'strong_first_pass',
    student_profile_summary: 'Built a tutoring schedule redesign and can name one turning moment clearly.',
    initial_input_quality: 'high',
    likely_user_risk: 'Could get annoyed if product slows momentum with unnecessary loops.',
    user_goal: 'Get a usable direction quickly and start drafting.',
    expected_helpfulness_outcome: 'strong_progress',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Concrete notes with clear before/after shift.', raw_input: 'I reorganized peer tutoring because everyone waited for me, then I created rotating owners and wait times dropped. The moment was when a younger student said she finally felt seen.' },
      { action_type: 'compare_or_refine', input_summary: 'Asks for refinement toward ownership arc.', raw_input: 'Refine this toward shared ownership and the moment I stopped controlling every step.' },
      { action_type: 'revise_after_result', input_summary: 'Adds specific scene details for stronger opening.', raw_input: 'Updated details: we moved check-ins to student-led rounds, and I apologized publicly for bottlenecking decisions.' },
    ],
  },
  {
    simulation_id: 'RUS_02',
    simulation_class: 'strong_first_pass',
    student_profile_summary: 'Hospital volunteer with a vivid correction moment and emotional stakes.',
    initial_input_quality: 'high',
    likely_user_risk: 'Could disengage if output sounds generic compared to strong material.',
    user_goal: 'Convert a strong story into a directional essay angle.',
    expected_helpfulness_outcome: 'strong_progress',
    step_sequence: [
      { action_type: 'submit_rough_paragraph', input_summary: 'Strong paragraph around listening correction.', raw_input: 'I spent three summers volunteering at a hospital. In my third summer, a nurse told me I was getting in the way. I had to relearn service as listening before doing.' },
      { action_type: 'compare_or_refine', input_summary: 'Asks compare between service and humility centers.', raw_input: 'Compare framing this as service vs humility; which has more essay traction?' },
      { action_type: 'revise_after_result', input_summary: 'Resubmits with sensory detail and dialogue.', raw_input: 'The line was: “You are helping yourself feel useful, not us.” That sentence changed how I entered every room.' },
    ],
  },
  {
    simulation_id: 'RUS_03',
    simulation_class: 'clarification_needed',
    student_profile_summary: 'Has real material but first submission is broad and split between two events.',
    initial_input_quality: 'medium',
    likely_user_risk: 'May give up if clarification feels repetitive.',
    user_goal: 'Narrow to one center with one follow-up question.',
    expected_helpfulness_outcome: 'clarification_success',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Broad notes about debate and community pantry.', raw_input: 'I changed in debate and also helped redesign pantry pickup, both mattered but I am not sure which one says more about me.' },
      { action_type: 'respond_clarification', input_summary: 'Answers with one concrete pantry moment.', raw_input: 'One family told me they stopped coming because lines were public. I proposed quiet pickup slots and attendance recovered.' },
      { action_type: 'choose_between_centers', input_summary: 'Explicitly picks pantry center.', raw_input: 'Choose pantry redesign as center; keep debate only as context.' },
    ],
  },
  {
    simulation_id: 'RUS_04',
    simulation_class: 'clarification_needed',
    student_profile_summary: 'Strong feelings, weak structure, uncertain what the essay is “about.”',
    initial_input_quality: 'medium',
    likely_user_risk: 'Could misread clarification as rejection.',
    user_goal: 'Get one actionable direction after clarification.',
    expected_helpfulness_outcome: 'clarification_success',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Half-formed and emotional first pass.', raw_input: 'I keep saying I learned confidence, but that sounds fake. I mostly learned to stop pretending I knew everything.' },
      { action_type: 'respond_clarification', input_summary: 'Uncertain but concrete answer.', raw_input: 'Concrete moment: I gave wrong instructions during robotics setup and had to ask a freshman to walk me through my own design.' },
      { action_type: 'switch_uncertain_to_concrete', input_summary: 'Second answer with clearer causality.', raw_input: 'After that, I created a pre-launch checklist owned by whoever would be affected, not whoever had seniority.' },
    ],
  },
  {
    simulation_id: 'RUS_05',
    simulation_class: 'clarification_needed',
    student_profile_summary: 'Has two plausible centers and initially answers clarification weakly.',
    initial_input_quality: 'medium',
    likely_user_risk: 'Clarification wheel-spinning risk is high.',
    user_goal: 'Recover after weak clarification answer and still move forward.',
    expected_helpfulness_outcome: 'recovery_success',
    step_sequence: [
      { action_type: 'submit_rough_paragraph', input_summary: 'Unclear paragraph with two arcs.', raw_input: 'I could write about coding club leadership or translating for my parents. Both changed me and I cannot tell what is strongest.' },
      { action_type: 'respond_clarification', input_summary: 'Weak/uncertain clarification answer.', raw_input: 'Maybe both are about responsibility and growing up, I am still not sure.' },
      { action_type: 'switch_uncertain_to_concrete', input_summary: 'Improved follow-up with specific translation scene.', raw_input: 'At a clinic desk, I translated a medication warning and realized precision could change outcomes that same day.' },
    ],
  },
  {
    simulation_id: 'RUS_06',
    simulation_class: 'low_signal',
    student_profile_summary: 'Thin notes, self-doubt, little concrete detail.',
    initial_input_quality: 'low',
    likely_user_risk: 'Likely to abandon if first output feels judgmental or vague.',
    user_goal: 'Get dignified guidance and one next step.',
    expected_helpfulness_outcome: 'moderate_progress',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Low-signal self-judging input.', raw_input: 'I like sports but I am not great at them. I do not think I have a big story.' },
      { action_type: 'continue_after_blocked_low_signal', input_summary: 'Adds one concrete moment after low-signal state.', raw_input: 'I stayed after every practice to track teammate feedback and changed drills based on it.' },
      { action_type: 'revise_after_result', input_summary: 'Resubmits concise improved version.', raw_input: 'Coach noticed I shifted from trying to stand out to helping newer players improve faster.' },
    ],
  },
  {
    simulation_id: 'RUS_07',
    simulation_class: 'low_signal',
    student_profile_summary: 'Emotionally hesitant, worried they sound boring.',
    initial_input_quality: 'low',
    likely_user_risk: 'High trust fragility if product sounds template-heavy.',
    user_goal: 'Move from vague to concrete without losing confidence.',
    expected_helpfulness_outcome: 'moderate_progress',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Hesitant low-signal opening.', raw_input: 'I am kind of average and not sure any of this matters. I helped my brother with homework sometimes.' },
      { action_type: 'continue_after_blocked_low_signal', input_summary: 'Returns with more specifics.', raw_input: 'He has dyslexia; I switched from giving answers to asking him to narrate each step out loud.' },
      { action_type: 'switch_uncertain_to_concrete', input_summary: 'Adds measurable shift.', raw_input: 'After six weeks, his reading confidence improved and he started leading story summaries himself.' },
    ],
  },
  {
    simulation_id: 'RUS_08',
    simulation_class: 'contradiction_collision',
    student_profile_summary: 'Two plausible centers: activism and family business operations.',
    initial_input_quality: 'medium',
    likely_user_risk: 'Could feel flattened if product merges conflicting arcs.',
    user_goal: 'Choose one center and keep the other as support.',
    expected_helpfulness_outcome: 'moderate_progress',
    step_sequence: [
      { action_type: 'submit_rough_paragraph', input_summary: 'Contradictory center candidates.', raw_input: 'I organized climate walkouts at school and also rebuilt inventory systems in my family store. Both changed my leadership style in different ways.' },
      { action_type: 'choose_between_centers', input_summary: 'Selects family store center.', raw_input: 'Choose inventory-system center; keep activism as context for why I cared about process fairness.' },
      { action_type: 'compare_or_refine', input_summary: 'Requests compare to confirm center choice.', raw_input: 'Compare whether operations-center gives clearer causality than activism-center.' },
    ],
  },
  {
    simulation_id: 'RUS_09',
    simulation_class: 'contradiction_collision',
    student_profile_summary: 'Pulled between athletics identity and caregiving identity.',
    initial_input_quality: 'medium',
    likely_user_risk: 'Might perceive advice as indecisive if compare path is weak.',
    user_goal: 'Resolve center collision and proceed with confidence.',
    expected_helpfulness_outcome: 'moderate_progress',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Two-center collision.', raw_input: 'I tore my ACL and also became main caregiver for my grandmother that year. I do not know which story is actually my center.' },
      { action_type: 'choose_between_centers', input_summary: 'Picks caregiving center for essay depth.', raw_input: 'Choose caregiving center, use ACL only as pressure context.' },
      { action_type: 'revise_after_result', input_summary: 'Resubmits with caregiving scene details.', raw_input: 'I learned medication timing, translated discharge instructions, and redesigned our daily routine to avoid missed doses.' },
    ],
  },
  {
    simulation_id: 'RUS_10',
    simulation_class: 'revision_loop',
    student_profile_summary: 'Starts decent, then intentionally rewrites after first result.',
    initial_input_quality: 'medium',
    likely_user_risk: 'If second pass feels same, product appears non-cumulative.',
    user_goal: 'See clear improvement on second submission.',
    expected_helpfulness_outcome: 'recovery_success',
    step_sequence: [
      { action_type: 'submit_rough_paragraph', input_summary: 'Initial rough paragraph.', raw_input: 'I led a hackathon team and learned communication matters. We built a tool for bus delays.' },
      { action_type: 'revise_after_result', input_summary: 'Second submission, much stronger details.', raw_input: 'Revision: our first prototype failed for non-English users, so I ran bilingual interviews, rebuilt flow labels, and adoption doubled.' },
      { action_type: 'compare_or_refine', input_summary: 'Requests refinement around listening-before-building.', raw_input: 'Refine toward listening before building, not generic teamwork.' },
    ],
  },
  {
    simulation_id: 'RUS_11',
    simulation_class: 'revision_loop',
    student_profile_summary: 'Gets unsatisfying first result and returns after pause.',
    initial_input_quality: 'medium',
    likely_user_risk: 'High abandonment risk if return flow is not helpful.',
    user_goal: 'Recover trust and move to stronger second direction.',
    expected_helpfulness_outcome: 'recovery_success',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'First notes are too abstract.', raw_input: 'I learned resilience and growth mindset through many experiences.' },
      { action_type: 'return_after_unsatisfying_result', input_summary: 'Comes back and restarts with concrete scene.', raw_input: 'Unsatisfying first output. New input: I failed to evacuate data before a server migration and had to own the mistake publicly.' },
      { action_type: 'revise_after_result', input_summary: 'Refines with concrete corrective actions.', raw_input: 'I then wrote rollback playbooks, scheduled peer checks, and trained juniors on failure drills.' },
    ],
  },
  {
    simulation_id: 'RUS_12',
    simulation_class: 'near_abandonment',
    student_profile_summary: 'Feels unseen and close to quitting after weak first pass.',
    initial_input_quality: 'low',
    likely_user_risk: 'Near-abandonment unless trust recovery happens quickly.',
    user_goal: 'Feel helped enough to keep going.',
    expected_helpfulness_outcome: 'likely_abandon_if_bad',
    step_sequence: [
      { action_type: 'submit_rough_notes', input_summary: 'Very weak first pass.', raw_input: 'I am good at everything and not sure what to write. Nothing feels special.' },
      { action_type: 'return_after_unsatisfying_result', input_summary: 'Returns with emotional hesitation.', raw_input: 'I almost stopped. The only real moment was when my teacher said my feedback hurt classmates and I had to rebuild trust.' },
      { action_type: 'switch_uncertain_to_concrete', input_summary: 'Provides concrete repair actions.', raw_input: 'I started weekly anonymous feedback summaries and one-on-one apology conversations.' },
      { action_type: 'continue_after_blocked_low_signal', input_summary: 'Keeps going after low confidence.', raw_input: 'Over time, team participation increased and quieter students started volunteering ideas.' },
    ],
  },
];

function buildInput(id: string, text: string): NdsResolvedSources {
  return {
    essay_project: { id, student_user_id: id, title: id, status: 'not_started', selected_direction_artifact_id: null },
    student_profile: { user_id: id, first_name: 'Real', last_name: 'User', grade: 11, interests: [] },
    story_entries: [{ id: `${id}_1`, title: id, body: text, category: null }],
    current_draft: null,
    school_context: null,
    source_meta: { story_entry_count: 1, has_current_draft: false, has_school_context: false },
  } as NdsResolvedSources;
}

function summarizeExplanation(selected: Record<string, unknown> | null): string {
  if (!selected) return 'No selected candidate explanation was available.';
  const keys = ['why_this_direction', 'reasoning', 'rationale', 'explanation', 'evidence_summary'];
  for (const key of keys) {
    const value = selected[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim().slice(0, 240);
  }
  return 'Candidate selected with limited explanation fields.';
}

function nextActionFor(response: SystemResponse): string {
  if (response.status === 'needs_more_input') return 'ask_for_concrete_detail';
  if (response.route_decision === 'ask_question_before_showing') return 'answer_clarification_question';
  return 'compare_or_refine_or_start_draft';
}

async function runEngine(rawInput: string, runId: string): Promise<SystemResponse> {
  const context = buildNdsNormalizedContextPack(buildInput(runId, rawInput));
  const execution = await executeNdsModule({
    run_id: runId,
    module_key: 'narrative_direction_selection',
    execution_mode: 'standard',
    context_pack: context,
    module_versions: { prompt_version: 'v1', schema_version: 'v1', validator_version: 'v1' },
  });

  const payload = (execution.candidate_payload ?? {}) as Record<string, unknown>;
  const candidates = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidates.find((c) => c.selected === true) ?? candidates[0] ?? null;
  const directionLineRaw = selected?.direction_line;
  const directionLine = typeof directionLineRaw === 'string' && directionLineRaw.trim().length > 0
    ? directionLineRaw.trim()
    : 'n/a';

  const response: SystemResponse = {
    route_decision: String(payload.route_decision ?? 'unknown'),
    direction_line: directionLine,
    explanation_summary: summarizeExplanation(selected),
    next_action_presented: '',
    confidence_band: String(payload.confidence_band ?? 'unknown'),
    status: String(payload.status ?? 'unknown'),
  };

  response.next_action_presented = nextActionFor(response);
  return response;
}

function hasClarification(steps: Step[]): boolean {
  return steps.some((s) => s.action_type === 'respond_clarification');
}

function hasRevision(steps: Step[]): boolean {
  return steps.some((s) => s.action_type === 'revise_after_result' || s.action_type === 'return_after_unsatisfying_result');
}

function responseProgressScore(responses: SystemResponse[]): number {
  return responses.reduce((score, r) => {
    let delta = 0;
    if (r.status !== 'needs_more_input') delta += 1;
    if (r.route_decision === 'show_strongest_direction') delta += 2;
    if (r.route_decision === 'ask_question_before_showing') delta += 1;
    if (r.direction_line !== 'n/a') delta += 1;
    if (r.confidence_band === 'high') delta += 2;
    if (r.confidence_band === 'medium') delta += 1;
    return score + delta;
  }, 0);
}

function classifyAudit(s: SimulationScenario, responses: SystemResponse[]): SimulationAudit {
  const first = responses[0];
  const last = responses[responses.length - 1];
  const clarificationUsed = hasClarification(s.step_sequence);
  const revisionUsed = hasRevision(s.step_sequence);

  const progressScore = responseProgressScore(responses);
  const progress_usefulness: ProgressUsefulness =
    last.status !== 'needs_more_input' && last.route_decision === 'show_strongest_direction' && progressScore >= 10
      ? 'strong'
      : last.status !== 'needs_more_input' && progressScore >= 7
        ? 'moderate'
        : 'weak';

  let trust_durability: TrustDurability = 'maintained';
  const blockedCount = responses.filter((r) => r.status === 'needs_more_input').length;
  const unknownCount = responses.filter((r) => r.route_decision === 'unknown').length;
  if (blockedCount >= 2 || unknownCount >= 2) trust_durability = 'lost';
  else if (blockedCount === 1 || unknownCount === 1 || progress_usefulness === 'weak') trust_durability = 'shaky';

  const changedDirection = first.direction_line !== last.direction_line && last.direction_line !== 'n/a';
  const changedRoute = first.route_decision !== last.route_decision;
  const changedConfidence = first.confidence_band !== last.confidence_band;
  const cumulative_intelligence: CumulativeIntelligence =
    (changedDirection && (changedRoute || changedConfidence)) ? 'strong' :
      (changedDirection || changedRoute || changedConfidence) ? 'partial' : 'weak';

  const clarification_usefulness: TernaryUsefulness | 'n/a' = !clarificationUsed
    ? 'n/a'
    : last.route_decision === 'show_strongest_direction' && last.status !== 'needs_more_input'
      ? 'strong'
      : changedDirection || changedRoute
        ? 'partial'
        : 'weak';

  const revision_usefulness: TernaryUsefulness | 'n/a' = !revisionUsed
    ? 'n/a'
    : last.route_decision === 'show_strongest_direction' && cumulative_intelligence !== 'weak'
      ? 'strong'
      : cumulative_intelligence === 'partial'
        ? 'partial'
        : 'weak';

  const overall_simulation_trustworthiness: OverallTrustworthiness =
    trust_durability === 'maintained' && progress_usefulness !== 'weak'
      ? 'trustworthy'
      : trust_durability === 'lost' || progress_usefulness === 'weak'
        ? 'not_trustworthy'
        : 'questionable';

  return {
    progress_usefulness,
    trust_durability,
    cumulative_intelligence,
    clarification_usefulness,
    revision_usefulness,
    overall_simulation_trustworthiness,
  };
}

function mapFailureCluster(audit: SimulationAudit): FailureCluster {
  if (audit.overall_simulation_trustworthiness === 'not_trustworthy') return 'abandonment_risk';
  if (audit.clarification_usefulness === 'weak') return 'clarification_wheel_spinning';
  if (audit.revision_usefulness === 'weak') return 'revision_loop_weakness';
  if (audit.cumulative_intelligence === 'weak') return 'repetition_non_cumulative';
  if (audit.progress_usefulness === 'weak') return 'first_result_disappointment';
  if (audit.trust_durability === 'shaky') return 'emotional_trust_drop';
  return 'compare_refine_confusion';
}

function severityFor(audit: SimulationAudit, simulationClass: SimulationClass): Severity {
  if (audit.overall_simulation_trustworthiness === 'not_trustworthy') return 'high';
  if (simulationClass === 'near_abandonment' && audit.overall_simulation_trustworthiness !== 'trustworthy') return 'high';
  if (audit.trust_durability === 'shaky' || audit.cumulative_intelligence === 'weak') return 'medium';
  return 'low';
}

function fixPriorityFor(cluster: FailureCluster): 1 | 2 | 3 | 4 | 5 {
  switch (cluster) {
    case 'abandonment_risk':
      return 1;
    case 'clarification_wheel_spinning':
      return 2;
    case 'revision_loop_weakness':
      return 3;
    case 'emotional_trust_drop':
      return 4;
    default:
      return 5;
  }
}

function humanReviewRequired(packet: SimulationPacket): boolean {
  const a = packet.simulation_audit;
  return packet.severity === 'high'
    || a.overall_simulation_trustworthiness === 'not_trustworthy'
    || a.clarification_usefulness === 'weak'
    || a.revision_usefulness === 'weak'
    || packet.likely_abandon_point !== 'none';
}

function threshold(metric: string, pass: number, total: number, thresholdValue: number): ThresholdCheck {
  return { metric, pass, total, threshold: thresholdValue, status: pass >= thresholdValue ? 'PASS' : 'FAIL' };
}

function findLikelyAbandonPoint(trace: TraceStep[], audit: SimulationAudit): string {
  if (audit.overall_simulation_trustworthiness === 'trustworthy') return 'none';
  const firstWeakSystem = trace.find((t) => t.kind === 'SYSTEM_RESPONSE' && (t.route_decision === 'unknown' || t.direction_line === 'n/a'));
  if (firstWeakSystem) return `step_${firstWeakSystem.step}`;
  return 'step_2';
}

function topFailuresFor(audit: SimulationAudit, cluster: FailureCluster): string[] {
  const out: string[] = [];
  if (audit.progress_usefulness === 'weak') out.push('Multi-step interaction did not produce meaningful direction progress.');
  if (audit.cumulative_intelligence === 'weak') out.push('Second response felt repetitive rather than cumulative.');
  if (audit.clarification_usefulness === 'weak') out.push('Clarification loop did not materially improve direction quality.');
  if (audit.revision_usefulness === 'weak') out.push('Revision loop did not produce visible incremental value.');
  out.push(`Primary failure cluster: ${cluster}.`);
  return out.slice(0, 3);
}

function whatWorkedFor(audit: SimulationAudit): string[] {
  const out: string[] = [];
  if (audit.progress_usefulness !== 'weak') out.push('Student moved toward a clearer direction and next step.');
  if (audit.cumulative_intelligence !== 'weak') out.push('System reflected at least some new information across turns.');
  if (out.length === 0) out.push('Low-signal handling remained non-blocking in at least one step.');
  return out.slice(0, 2);
}

function recommendedFixesFor(cluster: FailureCluster): string[] {
  switch (cluster) {
    case 'abandonment_risk':
      return ['Add explicit trust-recovery copy and concrete next action after weak first result.', 'Tighten low-signal to clarification bridge with one specific prompt.'];
    case 'clarification_wheel_spinning':
      return ['Force clarification prompts to request one concrete moment plus consequence.', 'Require post-clarification delta summary to show what changed.'];
    case 'revision_loop_weakness':
      return ['Add revision diff summary between first and second pass.', 'Bias second pass toward new evidence tokens and changed stakes.'];
    case 'compare_refine_confusion':
      return ['Make compare output explicitly choose recommended center with reason.', 'Reduce compare verbosity and add immediate next drafting move.'];
    case 'repetition_non_cumulative':
      return ['Detect repeated direction lines and trigger alternative framing strategy.', 'Increase penalties for reusing near-identical rationale text.'];
    case 'first_result_disappointment':
      return ['Improve first-result actionability with specific paragraph-start move.', 'Add quality safeguard for generic direction-line wording.'];
    case 'emotional_trust_drop':
      return ['Improve dignity-preserving language when confidence is low.', 'Add visible acknowledgment of user effort before asking another step.'];
  }
}

async function runSimulation(sim: SimulationScenario): Promise<SimulationPacket> {
  const trace: TraceStep[] = [];
  const responses: SystemResponse[] = [];

  for (let i = 0; i < sim.step_sequence.length; i += 1) {
    const step = sim.step_sequence[i];
    const stepNumber = i * 2 + 1;
    trace.push({ step: stepNumber, kind: 'USER_ACTION', action_type: step.action_type, input_summary: step.input_summary });

    const response = await runEngine(step.raw_input, `${sim.simulation_id}_${i + 1}`);
    responses.push(response);

    trace.push({
      step: stepNumber + 1,
      kind: 'SYSTEM_RESPONSE',
      route_decision: response.route_decision,
      direction_line: response.direction_line,
      explanation_summary: response.explanation_summary,
      next_action_presented: response.next_action_presented,
    });
  }

  const audit = classifyAudit(sim, responses);
  const cluster = mapFailureCluster(audit);
  const severity = severityFor(audit, sim.simulation_class);
  const likelyAbandon = findLikelyAbandonPoint(trace, audit);

  const packet: SimulationPacket = {
    simulation_id: sim.simulation_id,
    simulation_class: sim.simulation_class,
    expected_helpfulness_outcome: sim.expected_helpfulness_outcome,
    student_profile_summary: sim.student_profile_summary,
    likely_user_risk: sim.likely_user_risk,
    user_goal: sim.user_goal,
    step_trace: trace,
    simulation_audit: audit,
    likely_abandon_point: likelyAbandon,
    top_failures: topFailuresFor(audit, cluster),
    what_worked: whatWorkedFor(audit),
    recommended_fixes: recommendedFixesFor(cluster),
    severity,
    main_failure_cluster: cluster,
    fix_owner: 'product + AI + frontend',
    fix_priority: fixPriorityFor(cluster),
    human_review: {
      required: false,
      what_user_likely_felt: audit.trust_durability === 'maintained' ? 'Supported and willing to continue.' : 'Uncertain whether the product is actually helping.',
      what_product_should_have_done_better: audit.cumulative_intelligence === 'weak' ? 'Show explicit adaptation to newly provided details.' : 'Keep next-step guidance concrete and immediate.',
      likely_layer: cluster === 'clarification_wheel_spinning' || cluster === 'revision_loop_weakness' ? 'interaction_design' : cluster === 'first_result_disappointment' ? 'copy' : 'engine',
    },
  };

  packet.human_review.required = humanReviewRequired(packet);
  return packet;
}

function buildMarkdown(artifact: {
  pass_fail: 'PASS' | 'FAIL';
  packets: SimulationPacket[];
  threshold_checks: ThresholdCheck[];
  top_10_real_use_trust_breaks: string[];
  patch_sequence: string[];
}): string {
  const packets = artifact.packets;
  const highSeverity = packets.filter((p) => p.severity === 'high');
  const abandonPoints = packets.filter((p) => p.likely_abandon_point !== 'none');
  const cumulativeFails = packets.filter((p) => p.simulation_audit.cumulative_intelligence === 'weak');
  const clarificationFails = packets.filter((p) => p.simulation_audit.clarification_usefulness === 'weak');
  const revisionFails = packets.filter((p) => p.simulation_audit.revision_usefulness === 'weak');

  const severityTable = packets
    .map((p) => `| ${p.simulation_id} | ${p.severity} | ${p.main_failure_cluster} | ${p.likely_abandon_point} | ${p.fix_owner} | P${p.fix_priority} |`)
    .join('\n');

  return [
    '# REAL_USER_SIMULATION_TEST_RESULTS_V1',
    '',
    '## protocol purpose',
    '',
    'Validate whether realistic multi-step student usage remains helpful, trustworthy, and cumulative.',
    '',
    '## simulation inventory',
    '',
    ...packets.map((p) => `- ${p.simulation_id} — ${p.simulation_class}`),
    '',
    '## overall pass/fail summary',
    '',
    `**${artifact.pass_fail}**`,
    ...artifact.threshold_checks.map((c) => `- ${c.metric}: ${c.pass}/${c.total} (need ${c.threshold}) -> ${c.status}`),
    '',
    '## high-severity simulations',
    '',
    ...(highSeverity.length > 0 ? highSeverity.map((p) => `- ${p.simulation_id}`) : ['- none']),
    '',
    '## likely abandon points',
    '',
    ...(abandonPoints.length > 0 ? abandonPoints.map((p) => `- ${p.simulation_id}: ${p.likely_abandon_point}`) : ['- none']),
    '',
    '## cumulative-intelligence failures',
    '',
    ...(cumulativeFails.length > 0 ? cumulativeFails.map((p) => `- ${p.simulation_id}`) : ['- none']),
    '',
    '## clarification-loop failures',
    '',
    ...(clarificationFails.length > 0 ? clarificationFails.map((p) => `- ${p.simulation_id}`) : ['- none']),
    '',
    '## revision-loop failures',
    '',
    ...(revisionFails.length > 0 ? revisionFails.map((p) => `- ${p.simulation_id}`) : ['- none']),
    '',
    '## per-simulation severity table',
    '',
    '| simulation_id | severity | main failure cluster | likely abandon point | fix owner | fix priority |',
    '|---|---|---|---|---|---|',
    severityTable,
    '',
    '## top 10 real-use trust breaks',
    '',
    ...artifact.top_10_real_use_trust_breaks.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## recommended fix sequence',
    '',
    ...artifact.patch_sequence.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## product readiness implications',
    '',
    artifact.pass_fail === 'PASS'
      ? 'Real-use protocol currently meets launch gate thresholds.'
      : 'Do not move toward launch readiness until this protocol passes.',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const packets: SimulationPacket[] = [];
  for (const sim of SCENARIOS) {
    packets.push(await runSimulation(sim));
  }

  const progressPass = packets.filter((p) => ['strong', 'moderate'].includes(p.simulation_audit.progress_usefulness)).length;
  const trustPass = packets.filter((p) => p.simulation_audit.trust_durability === 'maintained').length;
  const cumulativePass = packets.filter((p) => ['strong', 'partial'].includes(p.simulation_audit.cumulative_intelligence)).length;
  const trustworthyPass = packets.filter((p) => p.simulation_audit.overall_simulation_trustworthiness === 'trustworthy').length;
  const highSeverityCount = packets.filter((p) => p.severity === 'high').length;

  const clarificationSet = packets.filter((p) => p.simulation_class === 'clarification_needed');
  const clarificationGood = clarificationSet.filter((p) => ['strong', 'partial'].includes(p.simulation_audit.clarification_usefulness)).length;
  const clarificationWeakAndLost = clarificationSet.filter((p) => p.simulation_audit.clarification_usefulness === 'weak' && p.simulation_audit.trust_durability === 'lost').length;

  const revisionSet = packets.filter((p) => p.simulation_class === 'revision_loop');
  const revisionNonWeak = revisionSet.filter((p) => p.simulation_audit.revision_usefulness !== 'weak').length;
  const revisionStrong = revisionSet.filter((p) => p.simulation_audit.revision_usefulness === 'strong').length;

  const nearAbandon = packets.find((p) => p.simulation_class === 'near_abandonment');

  const thresholdChecks: ThresholdCheck[] = [
    threshold('progress_usefulness_strong_or_moderate', progressPass, packets.length, 9),
    threshold('trust_durability_maintained', trustPass, packets.length, 9),
    threshold('cumulative_intelligence_strong_or_partial', cumulativePass, packets.length, 8),
    threshold('overall_trustworthy', trustworthyPass, packets.length, 8),
    threshold('high_severity_max_2', packets.length - highSeverityCount, packets.length, packets.length - 2),
    threshold('clarification_strong_or_partial_2_of_3', clarificationGood, clarificationSet.length, 2),
    threshold('clarification_weak_and_lost_0_of_3', clarificationSet.length - clarificationWeakAndLost, clarificationSet.length, clarificationSet.length),
    threshold('revision_non_weak_2_of_2', revisionNonWeak, revisionSet.length, 2),
    threshold('revision_strong_1_of_2', revisionStrong, revisionSet.length, 1),
    threshold('near_abandonment_not_not_trustworthy', nearAbandon?.simulation_audit.overall_simulation_trustworthiness === 'not_trustworthy' ? 0 : 1, 1, 1),
  ];

  const pass = thresholdChecks.every((c) => c.status === 'PASS');

  const clusterCounts = {
    first_result_disappointment: packets.filter((p) => p.main_failure_cluster === 'first_result_disappointment').length,
    clarification_wheel_spinning: packets.filter((p) => p.main_failure_cluster === 'clarification_wheel_spinning').length,
    revision_loop_weakness: packets.filter((p) => p.main_failure_cluster === 'revision_loop_weakness').length,
    compare_refine_confusion: packets.filter((p) => p.main_failure_cluster === 'compare_refine_confusion').length,
    repetition_non_cumulative: packets.filter((p) => p.main_failure_cluster === 'repetition_non_cumulative').length,
    emotional_trust_drop: packets.filter((p) => p.main_failure_cluster === 'emotional_trust_drop').length,
    abandonment_risk: packets.filter((p) => p.main_failure_cluster === 'abandonment_risk').length,
  };

  const topTrustBreaks = packets
    .filter((p) => p.severity !== 'low' || p.simulation_audit.overall_simulation_trustworthiness !== 'trustworthy')
    .slice(0, 10)
    .map((p) => `${p.simulation_id}: ${p.main_failure_cluster} -> ${p.top_failures[0] ?? 'n/a'}`);

  while (topTrustBreaks.length < 10) {
    topTrustBreaks.push(`coverage_fill_${topTrustBreaks.length + 1}: no additional break above threshold`);
  }

  const humanReviewQueue = packets
    .filter((p) => p.human_review.required)
    .map((p) => ({
      simulation_id: p.simulation_id,
      what_user_likely_felt: p.human_review.what_user_likely_felt,
      what_product_should_have_done_better: p.human_review.what_product_should_have_done_better,
      likely_problem_layer: p.human_review.likely_layer,
    }));

  const passFail: 'PASS' | 'FAIL' = pass ? 'PASS' : 'FAIL';

  const artifact = {
    protocol: 'REAL_USER_SIMULATION_TEST_V1',
    generated_at: new Date().toISOString(),
    scenario_mix_required: {
      strong_first_pass: 2,
      clarification_needed: 3,
      low_signal: 2,
      contradiction_collision: 2,
      revision_loop: 2,
      near_abandonment: 1,
    },
    packets,
    aggregate_summary: {
      threshold_checks: thresholdChecks,
      cluster_counts: clusterCounts,
      total_simulations: packets.length,
      high_severity_simulations: highSeverityCount,
    },
    per_simulation_severity_table: packets.map((p) => ({
      simulation_id: p.simulation_id,
      severity: p.severity,
      main_failure_cluster: p.main_failure_cluster,
      likely_abandon_point: p.likely_abandon_point,
      fix_owner: p.fix_owner,
      fix_priority: p.fix_priority,
    })),
    top_10_real_use_trust_breaks: topTrustBreaks,
    patch_sequence: [
      'Priority 1: abandonment-risk simulations.',
      'Priority 2: clarification loops that do not improve experience.',
      'Priority 3: revision loops that feel repetitive or low value.',
      'Priority 4: trust drops across multi-step journeys.',
      'Priority 5: minor cumulative-intelligence polish.',
    ],
    human_review_required: {
      high_severity: packets.filter((p) => p.severity === 'high').map((p) => p.simulation_id),
      not_trustworthy: packets.filter((p) => p.simulation_audit.overall_simulation_trustworthiness === 'not_trustworthy').map((p) => p.simulation_id),
      weak_clarification: packets.filter((p) => p.simulation_audit.clarification_usefulness === 'weak').map((p) => p.simulation_id),
      weak_revision: packets.filter((p) => p.simulation_audit.revision_usefulness === 'weak').map((p) => p.simulation_id),
      clear_abandon_point: packets.filter((p) => p.likely_abandon_point !== 'none').map((p) => p.simulation_id),
      review_queue: humanReviewQueue,
    },
    pass_fail: passFail,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown({ pass_fail: artifact.pass_fail, packets, threshold_checks: thresholdChecks, top_10_real_use_trust_breaks: topTrustBreaks, patch_sequence: artifact.patch_sequence }));

  console.log('REAL_USER_SIMULATION_TEST_V1');
  console.log(`  pass_fail: ${artifact.pass_fail}`);
  console.log(`  total_simulations: ${packets.length}`);
  console.log(`  high_severity_simulations: ${highSeverityCount}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main().catch((err) => {
  console.error('[real-user-simulation-test] fatal error', err);
  process.exit(1);
});
