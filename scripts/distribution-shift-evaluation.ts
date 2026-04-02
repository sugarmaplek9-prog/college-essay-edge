#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type DistributionClass =
  | 'weak_student_low_skill'
  | 'parent_overwritten_adult_shaped'
  | 'over_polished_hollow'
  | 'contradictory_multi_center'
  | 'culturally_indirect_non_default'
  | 'achievement_stacked_emotionally_thin'
  | 'messy_real_style_note_dump';

type ExpectedBestAction = 'show_strongest_direction' | 'ask_question_before_showing' | 'blocked_or_needs_more_input';
type ActionCorrectness = 'correct' | 'borderline' | 'incorrect';
type OutputTrustworthiness = 'trustworthy' | 'questionable' | 'not_trustworthy';
type DistributionFit = 'strong' | 'mixed' | 'weak';
type LineFit = 'strong_fit' | 'partial_fit' | 'misfit';
type Grounding = 'sufficient' | 'borderline' | 'insufficient';
type StudentReaction = 'feels_understood' | 'mixed' | 'feels_flattened_or_misread';
type CulturalFit = 'appropriate' | 'partially_inappropriate' | 'misread_due_to_style' | 'n/a';
type FailureCluster =
  | 'overfit_to_clean_input_failure'
  | 'polished_emptiness_overvaluation'
  | 'weak_note_under_support'
  | 'adult_parent_overwrite_misread'
  | 'cultural_style_misread'
  | 'contradiction_collapse'
  | 'generic_fallback_under_shift';
type Severity = 'high' | 'medium' | 'low';

type DistributionCase = {
  case_id: string;
  distribution_class: DistributionClass;
  input_shape_summary: string;
  main_trap: string;
  expected_best_action: ExpectedBestAction;
  human_truth_note: string;
  raw_input: string;
  unlike_curated: boolean;
  weaker_system_likely_fail: boolean;
  can_succeed_without_good_sounding_input: boolean;
};

type RuntimeResult = {
  selected_candidate_id: string;
  selected_axis_family: string;
  direction_line: string;
  confidence_band: string;
  route_decision: string;
  top_score: number;
  runner_up_score: number;
  score_margin: number;
};

type CandidateView = {
  candidate_id: string;
  direction_line: string;
  total_score: number;
  validator_flags: string[];
};

type SelectedEvidence = { quote: string; note: string };

type CaseEvaluation = {
  action_correctness: ActionCorrectness;
  output_trustworthiness: OutputTrustworthiness;
  distribution_fit_robustness: DistributionFit;
  line_fit: LineFit;
  grounding_sufficiency: Grounding;
  student_reaction_prediction: StudentReaction;
  cultural_style_fit: CulturalFit;
  reviewer_notes: string;
};

type CasePacket = {
  case_id: string;
  distribution_class: DistributionClass;
  raw_input: string;
  input_shape_summary: string;
  main_trap: string;
  expected_best_action: ExpectedBestAction;
  human_truth_note: string;
  runtime_result: RuntimeResult;
  candidates: CandidateView[];
  selected_explanation: string;
  selected_evidence: SelectedEvidence[];
  clarification_question: string | null;
  blocked_message: string | null;
  evaluation: CaseEvaluation;
  main_failure_cluster: FailureCluster;
  severity: Severity;
  case_pass_fail: 'PASS' | 'FAIL';
  fix_owner: string;
  fix_priority: 1 | 2 | 3 | 4 | 5;
};

type ThresholdCheck = {
  metric: string;
  pass: number;
  total: number;
  threshold: number;
  status: 'PASS' | 'FAIL';
};

const ROOT = process.cwd();
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_evaluation_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'DISTRIBUTION_SHIFT_EVALUATION_RESULTS_V1.md');

function threshold(metric: string, pass: number, total: number, thresholdValue: number): ThresholdCheck {
  return { metric, pass, total, threshold: thresholdValue, status: pass >= thresholdValue ? 'PASS' : 'FAIL' };
}

function createCaseFactory() {
  let n = 0;
  return (item: Omit<DistributionCase, 'case_id'>): DistributionCase => {
    n += 1;
    const id = `DSE_${String(n).padStart(2, '0')}`;
    return { case_id: id, ...item };
  };
}

const mk = createCaseFactory();

const CASES: DistributionCase[] = [
  ...[
    {
      input_shape_summary: 'Thin reflection with generic volunteering language.',
      main_trap: 'genericity bait',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'There may be a real service-correction moment, but it is not explicit yet.',
      raw_input: 'I volunteered and learned a lot about helping people. It taught me leadership and empathy.',
    },
    {
      input_shape_summary: 'Weak scene detail and hesitant self-description.',
      main_trap: 'false confidence risk',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Needs one concrete turning moment before direction confidence is justified.',
      raw_input: 'I guess I changed over time in robotics but I cannot pinpoint one thing. I just got better.',
    },
    {
      input_shape_summary: 'Vague growth statement with no scene.',
      main_trap: 'weak note but real latent story',
      expected_best_action: 'blocked_or_needs_more_input' as const,
      human_truth_note: 'Potential exists but current evidence is too thin for a trustworthy winner.',
      raw_input: 'I improved as a person through activities. I learned resilience and communication and confidence.',
    },
    {
      input_shape_summary: 'Uncertain low-skill notes with one small concrete signal.',
      main_trap: 'overfit-to-clean-input failure',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can still succeed if system notices listening shift from one concrete sentence.',
      raw_input: 'I am not strong writer. One thing maybe: student I tutor stopped crying when I started asking what confused him first.',
    },
    {
      input_shape_summary: 'Low-quality note dump with repeated generic claims.',
      main_trap: 'generic fallback under shift',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Needs narrowing because repeated claims mask missing center.',
      raw_input: 'I learned so much and became better and stronger and more mature. This year changed me in many ways.',
    },
    {
      input_shape_summary: 'Weak notes but latent center about responsibility repair.',
      main_trap: 'weak note under-support',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'A real center exists around owning a mistake and repair actions.',
      raw_input: 'I forgot to send club forms and we almost lost funding. I had to explain and fix it with everyone mad.',
    },
    {
      input_shape_summary: 'Flat uncertain input, no timeline clarity.',
      main_trap: 'false confidence risk',
      expected_best_action: 'blocked_or_needs_more_input' as const,
      human_truth_note: 'Should restrain and request concrete timeline + specific moment.',
      raw_input: 'I did many things over the years and they all mattered. Hard to choose. maybe everything is important.',
    },
    {
      input_shape_summary: 'Messy grammar but concrete empathy shift appears.',
      main_trap: 'overfit-to-clean-input failure',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'System should not punish style; center is listening-before-fixing.',
      raw_input: 'hospital volunteer i used talk too much then nurse said stop and listen first and that changed me fr',
    },
    {
      input_shape_summary: 'Very short note with one duty signal.',
      main_trap: 'weak note but real latent story',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Could still produce a modest direction if it anchors on duty shift.',
      raw_input: 'After dad got sick I handled store closing every night and stopped blaming everyone.',
    },
    {
      input_shape_summary: 'Low-signal reflection language with no concrete detail.',
      main_trap: 'genericity bait',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'May still allow cautious direction if explicitly low confidence and grounded next step.',
      raw_input: 'Sports taught me discipline and teamwork and effort. I am still figuring out my identity.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'weak_student_low_skill',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: true,
      can_succeed_without_good_sounding_input: true,
    }),
  ),

  ...[
    {
      input_shape_summary: 'Adult-shaped polished prose with résumé framing.',
      main_trap: 'adult overwrite',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Needs authenticity probe before selecting winner.',
      raw_input: 'Over four transformative summers, I cultivated a multidimensional service ethos while stewarding interdisciplinary impact initiatives across clinical contexts.',
    },
    {
      input_shape_summary: 'High diction, low lived center.',
      main_trap: 'polished emptiness',
      expected_best_action: 'blocked_or_needs_more_input' as const,
      human_truth_note: 'Should restrain because there is no concrete student-owned moment.',
      raw_input: 'My educational arc evidences sustained metacognitive expansion and intentional values alignment across civic engagements.',
    },
    {
      input_shape_summary: 'Parent voice likely present but includes one concrete anecdote.',
      main_trap: 'adult overwrite misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can show direction only if anchored to the concrete anecdote, not polish.',
      raw_input: 'While mentoring younger debaters, I discovered facilitative leadership when a novice froze mid-round and I abandoned my script to help her recover.',
    },
    {
      input_shape_summary: 'Polished achievement stack with minimal reflection.',
      main_trap: 'false premium overcommitment',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Needs clarification about internal shift and consequence.',
      raw_input: 'I founded three initiatives, expanded participation 240%, and delivered measurable outcomes through strategic stakeholder management.',
    },
    {
      input_shape_summary: 'Adult-edited sentence rhythm and distant emotional tone.',
      main_trap: 'adult overwrite',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Acceptable if output remains cautious and evidence-grounded.',
      raw_input: 'My role evolved from executor to systems thinker when I redesigned shift handoffs after observing recurrent communication breakdowns.',
    },
    {
      input_shape_summary: 'Highly polished claim with no concrete scene.',
      main_trap: 'polished emptiness',
      expected_best_action: 'blocked_or_needs_more_input' as const,
      human_truth_note: 'Must request scene-level grounding.',
      raw_input: 'Through iterative introspection, I now inhabit a more ethically coherent and interpersonally resonant mode of leadership.',
    },
    {
      input_shape_summary: 'Polished language with one duty-centered family signal.',
      main_trap: 'adult overwrite misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should recover the family duty center without flattening it to generic leadership.',
      raw_input: 'When my mother began night shifts, I orchestrated household logistics and learned reliability as relational practice, not performance.',
    },
    {
      input_shape_summary: 'Over-edited paragraph with weak causality.',
      main_trap: 'generic winner risk',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Direction can be shown if engine picks one true causal hinge.',
      raw_input: 'The cumulative intersections of service, scholarship, and mentorship converged to refine my identity as a compassionate change agent.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'parent_overwritten_adult_shaped',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: true,
      can_succeed_without_good_sounding_input: false,
    }),
  ),

  ...[
    {
      input_shape_summary: 'Elegant transitions, weak story center.',
      main_trap: 'polished emptiness',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Needs concrete pivot moment before commitment.',
      raw_input: 'At each juncture, I moved from aspiration to intentionality, discovering that contribution is less an act than a sustained orientation.',
    },
    {
      input_shape_summary: 'Faux-intellectual reflection with low evidence.',
      main_trap: 'polished emptiness',
      expected_best_action: 'blocked_or_needs_more_input' as const,
      human_truth_note: 'Should block until lived evidence appears.',
      raw_input: 'Identity, I have learned, is dialogic and recursively co-constructed through participatory belonging and epistemic humility.',
    },
    {
      input_shape_summary: 'Smooth writing hides generic center.',
      main_trap: 'genericity bait',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can still show if specific evidence in output is present.',
      raw_input: 'Tutoring taught me patience, listening, and growth. Over time, those values became part of who I am.',
    },
    {
      input_shape_summary: 'Polished self-awareness but weak causality.',
      main_trap: 'false confidence risk',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Clarification should request one specific cause-effect chain.',
      raw_input: 'I now understand that leadership is relational stewardship rather than unilateral direction, a shift cultivated across many contexts.',
    },
    {
      input_shape_summary: 'Beautiful language, no scene anchor.',
      main_trap: 'polished emptiness',
      expected_best_action: 'blocked_or_needs_more_input' as const,
      human_truth_note: 'Must resist premium-sounding surface and ask for grounded moment.',
      raw_input: 'My narrative is one of gradual awakening to interdependence, rendered through the quiet accumulation of everyday acts of care.',
    },
    {
      input_shape_summary: 'Hollow but coherent prose with one latent center.',
      main_trap: 'generic fallback under shift',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Possible to show a direction if it references the one concrete action.',
      raw_input: 'I redesigned volunteer onboarding docs because new students kept leaving; after simplification retention improved.',
    },
    {
      input_shape_summary: 'Polished narrative voice masks uncertainty.',
      main_trap: 'false premium overcommitment',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should stay medium confidence and avoid inflated certainty.',
      raw_input: 'In orchestrating student government communications, I discovered that clarity is an ethical commitment to audience dignity.',
    },
    {
      input_shape_summary: 'Elegant but emotionally flat claims.',
      main_trap: 'polished emptiness',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'May pass only with concrete grounded evidence in explanation.',
      raw_input: 'I became more deliberate, more accountable, and more collaborative through sustained participation in civic leadership spaces.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'over_polished_hollow',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: true,
      can_succeed_without_good_sounding_input: false,
    }),
  ),

  ...[
    {
      input_shape_summary: 'Two valid centers, both underdeveloped.',
      main_trap: 'collision between two valid centers',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Should clarify before forcing winner.',
      raw_input: 'I could write about ACL injury recovery or caring for my grandmother after surgery. Both changed me differently.',
    },
    {
      input_shape_summary: 'Mixed fragments from unrelated domains.',
      main_trap: 'contradiction collapse',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Clarification needed to avoid premature collapse.',
      raw_input: 'Debate taught argument humility, but store inventory taught logistics discipline. I do not know which is real center.',
    },
    {
      input_shape_summary: 'Conflicting self-interpretations with one concrete scene.',
      main_trap: 'action/reflection mismatch',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can show with moderate confidence if concrete scene drives choice.',
      raw_input: 'I thought I was a leader, but after failing to include quiet teammates I realized I was controlling. Then I switched to rotating facilitation.',
    },
    {
      input_shape_summary: 'Two story centers with equal evidence weight.',
      main_trap: 'collision between two valid centers',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Clarification is higher trust than forced winner.',
      raw_input: 'I organized climate walkouts and rebuilt my family store checkout flow; both feel central and both have real stakes.',
    },
    {
      input_shape_summary: 'Contradictory motives in same paragraph.',
      main_trap: 'contradiction collapse',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Show is acceptable if system names tension honestly.',
      raw_input: 'I joined service club for resume reasons, then stayed because one patient asked me to just sit and listen.',
    },
    {
      input_shape_summary: 'Action and reflection signals point different directions.',
      main_trap: 'false confidence risk',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Should ask which moment best represents center.',
      raw_input: 'Most of my actions were technical coding work, but reflection keeps returning to family translation and care duties.',
    },
    {
      input_shape_summary: 'Multicenter note with one dominant causal arc.',
      main_trap: 'generic winner risk',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should still choose if one arc has clear causality.',
      raw_input: 'I did many things, but the strongest shift was after migration outage when I wrote rollback playbooks and trained juniors.',
    },
    {
      input_shape_summary: 'Contradictory fragments and abrupt transitions.',
      main_trap: 'contradiction collapse',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can show with low-medium confidence plus explicit uncertainty handling.',
      raw_input: 'I wanted medicine, then policy, then maybe education. The one stable part was translating at clinic front desk every week.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'contradictory_multi_center',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: true,
      can_succeed_without_good_sounding_input: true,
    }),
  ),

  ...[
    {
      input_shape_summary: 'Family/duty-centered narration with understated self-claim.',
      main_trap: 'indirect but meaningful center',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should recognize relational duty center without penalizing understatement.',
      raw_input: 'When my grandmother moved in, I arranged medicine reminders and meal timing. No one asked; it just became my responsibility.',
    },
    {
      input_shape_summary: 'Community-centered framing, low explicit “I learned.”',
      main_trap: 'cultural style misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Appropriate handling requires non-ego-centered interpretation.',
      raw_input: 'In our temple kitchen, older volunteers corrected me quietly. I changed prep flow so everyone could finish before evening prayers.',
    },
    {
      input_shape_summary: 'Indirect emotional register, concrete family labor.',
      main_trap: 'indirect but meaningful center',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'System should not confuse indirectness with weak signal.',
      raw_input: 'I translated landlord calls for my parents for two years and learned to phrase things so both sides could keep dignity.',
    },
    {
      input_shape_summary: 'Understated reflection with sparse explicit claims.',
      main_trap: 'cultural style misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Direction should remain culturally legible and respectful.',
      raw_input: 'At community center, I handled attendance quietly and adjusted seating for elders with hearing difficulties.',
    },
    {
      input_shape_summary: 'Relational storytelling without self-promotion.',
      main_trap: 'generic fallback under shift',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Engine should identify contribution center even if self-claim is understated.',
      raw_input: 'During harvest season I coordinated rides for cousins and neighbors so children could still attend tutoring.',
    },
    {
      input_shape_summary: 'Culturally indirect writing plus mixed fragments.',
      main_trap: 'cultural style misread',
      expected_best_action: 'ask_question_before_showing' as const,
      human_truth_note: 'Clarification can be appropriate if asked respectfully and concretely.',
      raw_input: 'I do not usually talk about myself. I did what was needed at home and school, especially when schedules conflicted.',
    },
    {
      input_shape_summary: 'Duty-shaped narrative with understated turning point.',
      main_trap: 'indirect but meaningful center',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should detect turning point despite low self-advertising language.',
      raw_input: 'After my uncle’s stroke, I became the one who explained rehab instructions and tracked exercises each night.',
    },
    {
      input_shape_summary: 'Collective framing, minimal individual triumph language.',
      main_trap: 'cultural style misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Correct behavior values collective contribution narrative, not only individual hero arc.',
      raw_input: 'Our dance group changed rehearsal times so working students could attend; I coordinated schedules and conflict mediation.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'culturally_indirect_non_default',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: true,
      can_succeed_without_good_sounding_input: true,
    }),
  ),

  ...[
    {
      input_shape_summary: 'Heavy accomplishments, little reflection.',
      main_trap: 'achievement-stack overcommitment',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can show only if output resists résumé framing and asks for center depth.',
      raw_input: 'Captain, founder, intern, finalist, president. I increased participation, raised funds, and won awards across multiple organizations.',
    },
    {
      input_shape_summary: 'Impressive metrics but no emotional center.',
      main_trap: 'generic winner risk',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should keep confidence calibrated and identify missing center explicitly.',
      raw_input: 'Built app with 5k users, launched tutoring nonprofit, led student council policy committee, and published research abstract.',
    },
    {
      input_shape_summary: 'Achievement-dense paragraph with one latent turning point.',
      main_trap: 'weak latent center hidden by metrics',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Best output isolates turning point instead of listing accomplishments.',
      raw_input: 'After a failed launch where users quit, I switched from feature-first to interview-first design and rebuilt onboarding.',
    },
    {
      input_shape_summary: 'Stacked accolades and polished confidence claims.',
      main_trap: 'false premium overcommitment',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should avoid inflated certainty from accolades alone.',
      raw_input: 'My impact portfolio spans competitive debate, startup incubation, state-level service recognition, and strategic civic innovation.',
    },
    {
      input_shape_summary: 'Activity-heavy list with no causal thread.',
      main_trap: 'generic fallback under shift',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'May still show if one causal thread is selected clearly.',
      raw_input: 'I did robotics, MUN, soccer, volunteering, coding mentorship, and science olympiad all at once every year.',
    },
    {
      input_shape_summary: 'Achievement stack with subtle relational center.',
      main_trap: 'overlooking latent center',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Trustworthy output should prefer relational pivot over raw accolades.',
      raw_input: 'Awards mattered less after I realized my team quit because I never listened; I rebuilt project roles around peer feedback.',
    },
    {
      input_shape_summary: 'Metric-heavy success claims and generic growth language.',
      main_trap: 'polished emptiness overvaluation',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Must avoid generic “leadership” fallback without grounded evidence.',
      raw_input: 'Scaled impact by 200%, optimized operations, and strengthened leadership identity through high-performance execution.',
    },
    {
      input_shape_summary: 'Accomplishment pile with fragmented context.',
      main_trap: 'false confidence risk',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should surface uncertainty and request next-step grounding, not overclaim.',
      raw_input: 'Everything went well this year: captain role, internship, awards, and startup prototype with district recognition.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'achievement_stacked_emotionally_thin',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: false,
      can_succeed_without_good_sounding_input: false,
    }),
  ),

  ...[
    {
      input_shape_summary: 'Bullets + fragments + abandoned starts.',
      main_trap: 'messy shape misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'System should extract latent center despite rough structure.',
      raw_input: '- clinic volunteer\n- got corrected by nurse\nstart over: maybe about listening?\nI thought doing more = helping more',
    },
    {
      input_shape_summary: 'Mixed rough paragraph and list notes.',
      main_trap: 'generic fallback under shift',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Can succeed if model links fragments into one causal arc.',
      raw_input: 'draft: I kept trying to be the “fixer.”\nnotes: pantry line issue / private pickup slot / families came back',
    },
    {
      input_shape_summary: 'Repeated ideas, weak transitions, one strong scene.',
      main_trap: 'overfit-to-clean-input failure',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should prioritize the strong scene and ignore noise repetition.',
      raw_input: 'I learned to listen, like really listen, over and over. Scene: teammate cried after I dismissed her concern in planning meeting.',
    },
    {
      input_shape_summary: 'Incoherent sequence but promising contradiction.',
      main_trap: 'contradiction collapse',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Direction okay if explanation acknowledges unresolved tension.',
      raw_input: 'Wanted medicine then policy then maybe teaching. Stable thing: translating clinic instructions every Saturday.',
    },
    {
      input_shape_summary: 'Fragmented notes and shorthand language.',
      main_trap: 'style noise over-penalty',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should not punish shorthand; center still accessible.',
      raw_input: 'debate -> less win/ more hear ppl\ncoach called me out\nnew role: question-first captain',
    },
    {
      input_shape_summary: 'Messy timeline with one clear responsibility arc.',
      main_trap: 'weak-note under-support',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Model should recover responsibility center from timeline noise.',
      raw_input: 'freshman random, sophomore bad grades, junior store closing duties nightly + payroll mistakes fixed.',
    },
    {
      input_shape_summary: 'Bullet dump with duplicate phrasing.',
      main_trap: 'generic fallback under shift',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should avoid generic line and select one grounded center.',
      raw_input: '- teamwork\n- discipline\n- helping others\n- actual moment: failed migration, owned error, wrote rollback checklist',
    },
    {
      input_shape_summary: 'Multiple starts plus emotional hesitation.',
      main_trap: 'flattening risk',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Trust depends on dignity-preserving interpretation of hesitancy.',
      raw_input: 'start1: idk what to write\nstart2: maybe grandma caregiving\nreal part: missed dose once, rebuilt daily med tracker',
    },
    {
      input_shape_summary: 'Very rough notes with parenthetical fragments.',
      main_trap: 'messy shape misread',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Should parse fragments and still identify center.',
      raw_input: 'robotics (wrong wiring -> owned) (asked freshman help) (made preflight checklist)',
    },
    {
      input_shape_summary: 'Incoherent but promising mixed style input.',
      main_trap: 'overfit-to-clean-input failure',
      expected_best_action: 'show_strongest_direction' as const,
      human_truth_note: 'Usable direction is still possible if model tracks correction arc.',
      raw_input: 'paragraph-ish: I tried to lead loud. notes: people shut down. fix: anonymous feedback summaries + role rotation.',
    },
  ].map((x) =>
    mk({
      distribution_class: 'messy_real_style_note_dump',
      ...x,
      unlike_curated: true,
      weaker_system_likely_fail: true,
      can_succeed_without_good_sounding_input: true,
    }),
  ),
];

if (CASES.length !== 60) {
  throw new Error(`Distribution-shift protocol requires 60 cases, got ${CASES.length}`);
}

function buildInput(id: string, text: string): NdsResolvedSources {
  return {
    essay_project: { id, student_user_id: id, title: id, status: 'not_started', selected_direction_artifact_id: null },
    student_profile: { user_id: id, first_name: 'Distribution', last_name: 'Shift', grade: 11, interests: [] },
    story_entries: [{ id: `${id}_1`, title: id, body: text, category: null }],
    current_draft: null,
    school_context: null,
    source_meta: { story_entry_count: 1, has_current_draft: false, has_school_context: false },
  } as NdsResolvedSources;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function scoreOf(candidate: Record<string, unknown>): number {
  const direct = asNumber(candidate.total_score ?? candidate.score ?? candidate.composite_score);
  if (direct !== 0) return direct;
  const nested = candidate.scores as Record<string, unknown> | undefined;
  return asNumber(nested?.total_score ?? nested?.total ?? nested?.final ?? nested?.overall);
}

function extractExplanation(selected: Record<string, unknown> | null): string {
  if (!selected) return 'No selected explanation available.';
  const keys = ['why_this_direction', 'reasoning', 'rationale', 'explanation', 'summary'];
  for (const key of keys) {
    const v = selected[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return 'Selected candidate did not include an explicit explanation field.';
}

function extractEvidence(selected: Record<string, unknown> | null, rawInput: string): SelectedEvidence[] {
  if (!selected) return [{ quote: rawInput.slice(0, 120), note: 'fallback from raw input due to missing evidence fields' }];
  const arrays = ['selected_evidence', 'evidence', 'evidence_items', 'supporting_evidence'];
  for (const key of arrays) {
    const arr = selected[key];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.slice(0, 3).map((item) => {
        if (typeof item === 'string') return { quote: item, note: `from ${key}` };
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          const quote = String(obj.quote ?? obj.text ?? obj.evidence ?? '').trim();
          const note = String(obj.note ?? obj.reason ?? key).trim();
          return { quote: quote.length > 0 ? quote : rawInput.slice(0, 100), note };
        }
        return { quote: rawInput.slice(0, 100), note: `fallback from ${key}` };
      });
    }
  }
  return [{ quote: rawInput.slice(0, 120), note: 'no evidence array returned; fallback to input excerpt' }];
}

async function runCase(c: DistributionCase): Promise<CasePacket> {
  const context = buildNdsNormalizedContextPack(buildInput(c.case_id, c.raw_input));
  const exec = await executeNdsModule({
    run_id: c.case_id,
    module_key: 'narrative_direction_selection',
    execution_mode: 'standard',
    context_pack: context,
    module_versions: { prompt_version: 'v1', schema_version: 'v1', validator_version: 'v1' },
  });

  const payload = (exec.candidate_payload ?? {}) as Record<string, unknown>;
  const candidatesRaw = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidatesRaw.find((x) => x.selected === true) ?? candidatesRaw[0] ?? null;
  const sorted = [...candidatesRaw].sort((a, b) => scoreOf(b) - scoreOf(a));
  const topScore = sorted.length > 0 ? scoreOf(sorted[0]) : 0;
  const runnerUpScore = sorted.length > 1 ? scoreOf(sorted[1]) : 0;

  const routeDecision = String(payload.route_decision ?? 'unknown');
  const status = String(payload.status ?? 'unknown');
  const confidenceBand = String(payload.confidence_band ?? 'unknown');
  const directionLine = typeof selected?.direction_line === 'string' ? String(selected.direction_line) : 'n/a';

  const runtime: RuntimeResult = {
    selected_candidate_id: String(selected?.candidate_id ?? 'n/a'),
    selected_axis_family: String(selected?.axis_family ?? selected?.axis ?? 'n/a'),
    direction_line: directionLine,
    confidence_band: confidenceBand,
    route_decision: routeDecision,
    top_score: topScore,
    runner_up_score: runnerUpScore,
    score_margin: topScore - runnerUpScore,
  };

  const candidates: CandidateView[] = candidatesRaw.map((candidate) => ({
    candidate_id: String(candidate.candidate_id ?? 'n/a'),
    direction_line: String(candidate.direction_line ?? 'n/a'),
    total_score: scoreOf(candidate),
    validator_flags: Array.isArray(candidate.validator_flags)
      ? (candidate.validator_flags as unknown[]).map((x) => String(x))
      : Array.isArray(candidate.flags)
        ? (candidate.flags as unknown[]).map((x) => String(x))
        : [],
  }));

  const selectedExplanation = extractExplanation(selected);
  const selectedEvidence = extractEvidence(selected, c.raw_input);

  const clarificationQuestion =
    typeof payload.primary_clarification_question === 'string'
      ? String(payload.primary_clarification_question)
      : typeof payload.clarification_question === 'string'
        ? String(payload.clarification_question)
        : null;

  const blockedMessage =
    status === 'needs_more_input'
      ? String(payload.blocked_message ?? payload.needs_more_input_message ?? 'More concrete detail required before selecting a direction.')
      : null;

  const actionCorrectness: ActionCorrectness =
    c.expected_best_action === 'show_strongest_direction'
      ? routeDecision === 'show_strongest_direction' && status !== 'needs_more_input'
        ? 'correct'
        : routeDecision === 'ask_question_before_showing' || status === 'needs_more_input'
          ? 'borderline'
          : 'incorrect'
      : c.expected_best_action === 'ask_question_before_showing'
        ? routeDecision === 'ask_question_before_showing'
          ? 'correct'
          : status === 'needs_more_input'
            ? 'borderline'
            : 'incorrect'
        : status === 'needs_more_input'
          ? 'correct'
          : routeDecision === 'ask_question_before_showing'
            ? 'borderline'
            : 'incorrect';

  const explanationLen = selectedExplanation.trim().length;
  const evidenceCount = selectedEvidence.length;
  const grounding: Grounding =
    evidenceCount >= 2 || explanationLen >= 120 ? 'sufficient' :
      evidenceCount >= 1 || explanationLen >= 70 ? 'borderline' : 'insufficient';

  const genericLine = /leadership|growth|resilience|teamwork|hard\s*work|community|maturity/i.test(directionLine);
  const lineFit: LineFit =
    directionLine === 'n/a'
      ? 'misfit'
      : genericLine && c.weaker_system_likely_fail
        ? 'partial_fit'
        : genericLine && (c.main_trap.includes('polished') || c.main_trap.includes('generic'))
          ? 'misfit'
          : c.human_truth_note.toLowerCase().includes('clarify') && routeDecision === 'show_strongest_direction'
            ? 'partial_fit'
            : 'strong_fit';

  const distributionFit: DistributionFit =
    actionCorrectness === 'correct' && lineFit !== 'misfit' && grounding !== 'insufficient'
      ? 'strong'
      : actionCorrectness === 'incorrect' || lineFit === 'misfit'
        ? 'weak'
        : 'mixed';

  const outputTrustworthiness: OutputTrustworthiness =
    actionCorrectness === 'incorrect' || grounding === 'insufficient' || (routeDecision === 'show_strongest_direction' && confidenceBand === 'high' && lineFit === 'misfit')
      ? 'not_trustworthy'
      : actionCorrectness === 'borderline' || grounding === 'borderline' || lineFit === 'partial_fit'
        ? 'questionable'
        : 'trustworthy';

  const studentReaction: StudentReaction =
    outputTrustworthiness === 'trustworthy' ? 'feels_understood' :
      outputTrustworthiness === 'questionable' ? 'mixed' : 'feels_flattened_or_misread';

  const culturalStyleFit: CulturalFit =
    c.distribution_class !== 'culturally_indirect_non_default'
      ? 'n/a'
      : lineFit === 'strong_fit' && outputTrustworthiness !== 'not_trustworthy'
        ? 'appropriate'
        : lineFit === 'misfit'
          ? 'misread_due_to_style'
          : 'partially_inappropriate';

  const evaluation: CaseEvaluation = {
    action_correctness: actionCorrectness,
    output_trustworthiness: outputTrustworthiness,
    distribution_fit_robustness: distributionFit,
    line_fit: lineFit,
    grounding_sufficiency: grounding,
    student_reaction_prediction: studentReaction,
    cultural_style_fit: culturalStyleFit,
    reviewer_notes:
      actionCorrectness === 'correct'
        ? 'Action route mostly aligned with expected handling for this shifted distribution case.'
        : 'Route deviated from expected shift-aware behavior; review trust calibration and restraint logic.',
  };

  const cluster: FailureCluster =
    c.distribution_class === 'culturally_indirect_non_default' && culturalStyleFit === 'misread_due_to_style'
      ? 'cultural_style_misread'
      : c.distribution_class === 'parent_overwritten_adult_shaped' && outputTrustworthiness !== 'trustworthy'
        ? 'adult_parent_overwrite_misread'
        : c.distribution_class === 'over_polished_hollow' && routeDecision === 'show_strongest_direction' && confidenceBand === 'high'
          ? 'polished_emptiness_overvaluation'
          : c.distribution_class === 'weak_student_low_skill' && actionCorrectness !== 'correct'
            ? 'weak_note_under_support'
            : c.distribution_class === 'contradictory_multi_center' && c.expected_best_action !== 'show_strongest_direction' && routeDecision === 'show_strongest_direction'
              ? 'contradiction_collapse'
              : genericLine
                ? 'generic_fallback_under_shift'
                : 'overfit_to_clean_input_failure';

  const caseFail =
    actionCorrectness === 'incorrect'
    || lineFit === 'misfit'
    || outputTrustworthiness === 'not_trustworthy'
    || grounding === 'insufficient'
    || studentReaction === 'feels_flattened_or_misread'
    || culturalStyleFit === 'misread_due_to_style';

  const severity: Severity =
    outputTrustworthiness === 'not_trustworthy' || (routeDecision === 'show_strongest_direction' && confidenceBand === 'high' && actionCorrectness === 'incorrect')
      ? 'high'
      : caseFail
        ? 'medium'
        : 'low';

  const fixPriority: 1 | 2 | 3 | 4 | 5 =
    routeDecision === 'show_strongest_direction' && confidenceBand === 'high' && actionCorrectness === 'incorrect'
      ? 1
      : cluster === 'polished_emptiness_overvaluation'
        ? 2
        : cluster === 'cultural_style_misread'
          ? 3
          : cluster === 'contradiction_collapse'
            ? 4
            : 5;

  return {
    case_id: c.case_id,
    distribution_class: c.distribution_class,
    raw_input: c.raw_input,
    input_shape_summary: c.input_shape_summary,
    main_trap: c.main_trap,
    expected_best_action: c.expected_best_action,
    human_truth_note: c.human_truth_note,
    runtime_result: runtime,
    candidates,
    selected_explanation: selectedExplanation,
    selected_evidence: selectedEvidence,
    clarification_question: clarificationQuestion,
    blocked_message: blockedMessage,
    evaluation,
    main_failure_cluster: cluster,
    severity,
    case_pass_fail: caseFail ? 'FAIL' : 'PASS',
    fix_owner: 'AI engine + product trust',
    fix_priority: fixPriority,
  };
}

function buildMarkdown(payload: {
  pass_fail: 'PASS' | 'FAIL';
  packets: CasePacket[];
  checks: ThresholdCheck[];
  classTable: Array<{ distribution_class: DistributionClass; total_cases: number; pass_rate: string; main_failure_cluster: string; fix_owner: string; fix_priority: number }>;
  topBreaks: string[];
  patchSequence: string[];
}): string {
  const byClass = payload.classTable.map((r) => `| ${r.distribution_class} | ${r.total_cases} | ${r.pass_rate} | ${r.main_failure_cluster} | ${r.fix_owner} | P${r.fix_priority} |`).join('\n');

  const caution = payload.packets.filter((p) => p.expected_best_action !== 'show_strongest_direction');
  const cautionCorrect = caution.filter((p) => p.runtime_result.route_decision === 'ask_question_before_showing' || p.blocked_message !== null).length;

  const pp = payload.packets.filter((p) => ['parent_overwritten_adult_shaped', 'over_polished_hollow'].includes(p.distribution_class));
  const falsePremium = pp.filter((p) => p.runtime_result.route_decision === 'show_strongest_direction' && p.runtime_result.confidence_band === 'high' && p.evaluation.output_trustworthiness !== 'trustworthy').length;

  const cultural = payload.packets.filter((p) => p.distribution_class === 'culturally_indirect_non_default');
  const culturalMisread = cultural.filter((p) => p.evaluation.cultural_style_fit === 'misread_due_to_style').length;

  return [
    '# DISTRIBUTION_SHIFT_EVALUATION_RESULTS_V1',
    '',
    '## protocol purpose',
    '',
    'Evaluate whether NDS generalizes with trust, restraint, and usefulness under shifted real-world input distributions.',
    '',
    '## class inventory',
    '',
    ...payload.classTable.map((r) => `- ${r.distribution_class}: ${r.total_cases}`),
    '',
    '## overall pass/fail summary',
    '',
    `**${payload.pass_fail}**`,
    ...payload.checks.map((c) => `- ${c.metric}: ${c.pass}/${c.total} (need ${c.threshold}) -> ${c.status}`),
    '',
    '## class-by-class performance',
    '',
    '| distribution class | total cases | pass rate | main failure cluster | fix owner | fix priority |',
    '|---|---:|---:|---|---|---|',
    byClass,
    '',
    '## caution-case performance',
    '',
    `- caution cases: ${caution.length}`,
    `- routed to clarification or blocked: ${cautionCorrect}/${caution.length}`,
    '',
    '## polished-empty / parent-overwrite performance',
    '',
    `- combined cases: ${pp.length}`,
    `- clearly high-confidence misleading winners: ${falsePremium}`,
    '',
    '## cultural-style findings',
    '',
    `- culturally indirect cases: ${cultural.length}`,
    `- misread_due_to_style: ${culturalMisread}`,
    '',
    '## top 10 distribution-shift trust breaks',
    '',
    ...payload.topBreaks.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## recommended fix sequence',
    '',
    ...payload.patchSequence.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## product readiness implications',
    '',
    payload.pass_fail === 'PASS'
      ? 'Generalization gate currently passes.'
      : 'Do not move toward launch readiness until distribution-shift protocol passes.',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const packets: CasePacket[] = [];
  for (const c of CASES) {
    packets.push(await runCase(c));
  }

  const actionCorrect = packets.filter((p) => p.evaluation.action_correctness === 'correct').length;
  const trustworthy = packets.filter((p) => p.evaluation.output_trustworthiness === 'trustworthy').length;
  const robust = packets.filter((p) => ['strong', 'mixed'].includes(p.evaluation.distribution_fit_robustness)).length;
  const lineFit = packets.filter((p) => ['strong_fit', 'partial_fit'].includes(p.evaluation.line_fit)).length;
  const grounding = packets.filter((p) => ['sufficient', 'borderline'].includes(p.evaluation.grounding_sufficiency)).length;
  const flattened = packets.filter((p) => p.evaluation.student_reaction_prediction === 'feels_flattened_or_misread').length;

  const cautionCases = packets.filter((p) => p.expected_best_action !== 'show_strongest_direction');
  const cautionAppropriate = cautionCases.filter((p) => p.runtime_result.route_decision === 'ask_question_before_showing' || p.blocked_message !== null).length;
  const cautionWrongOverconfidentShow = cautionCases.filter((p) => p.runtime_result.route_decision === 'show_strongest_direction' && p.runtime_result.confidence_band === 'high' && p.evaluation.action_correctness === 'incorrect').length;

  const parentPolished = packets.filter((p) => ['parent_overwritten_adult_shaped', 'over_polished_hollow'].includes(p.distribution_class));
  const falsePremiumOvercommit = parentPolished.filter((p) => p.runtime_result.route_decision === 'show_strongest_direction' && p.runtime_result.confidence_band === 'high' && p.evaluation.output_trustworthiness !== 'trustworthy');
  const avoidFalsePremium = parentPolished.length - falsePremiumOvercommit.length;

  const cultural = packets.filter((p) => p.distribution_class === 'culturally_indirect_non_default');
  const culturalGood = cultural.filter((p) => ['appropriate', 'partially_inappropriate'].includes(p.evaluation.cultural_style_fit)).length;
  const culturalMisread = cultural.filter((p) => p.evaluation.cultural_style_fit === 'misread_due_to_style').length;

  const checks: ThresholdCheck[] = [
    threshold('action_correctness_correct', actionCorrect, packets.length, 48),
    threshold('output_trustworthiness_trustworthy', trustworthy, packets.length, 45),
    threshold('distribution_fit_strong_or_mixed', robust, packets.length, 45),
    threshold('line_fit_strong_or_partial', lineFit, packets.length, 48),
    threshold('grounding_sufficient_or_borderline', grounding, packets.length, 48),
    threshold('student_reaction_flattened_max_6', packets.length - flattened, packets.length, packets.length - 6),
    threshold('caution_choose_clarification_or_blocked_12_of_15', cautionAppropriate, cautionCases.length, 12),
    threshold('caution_overconfident_wrong_show_max_1', cautionCases.length - cautionWrongOverconfidentShow, cautionCases.length, cautionCases.length - 1),
    threshold('parent_polished_avoid_false_overcommit_12_of_16', avoidFalsePremium, parentPolished.length, 12),
    threshold('parent_polished_high_conf_misleading_winner_max_2', parentPolished.length - falsePremiumOvercommit.length, parentPolished.length, parentPolished.length - 2),
    threshold('cultural_appropriate_or_partial_6_of_8', culturalGood, cultural.length, 6),
    threshold('cultural_misread_max_1', cultural.length - culturalMisread, cultural.length, cultural.length - 1),
  ];

  const unlikeCuratedCount = CASES.filter((c) => c.unlike_curated).length;
  const weakerLikelyFailCount = CASES.filter((c) => c.weaker_system_likely_fail).length;
  const cautionExpectedCount = CASES.filter((c) => c.expected_best_action !== 'show_strongest_direction').length;
  const strongWithoutSoundingGood = CASES.filter((c) => c.can_succeed_without_good_sounding_input).length;

  const designRuleChecks: ThresholdCheck[] = [
    threshold('design_rule_unlike_curated_at_least_30', unlikeCuratedCount, CASES.length, 30),
    threshold('design_rule_weaker_system_fail_at_least_20', weakerLikelyFailCount, CASES.length, 20),
    threshold('design_rule_caution_at_least_15', cautionExpectedCount, CASES.length, 15),
    threshold('design_rule_success_without_good_sounding_at_least_10', strongWithoutSoundingGood, CASES.length, 10),
  ];

  const pass = [...checks, ...designRuleChecks].every((c) => c.status === 'PASS');
  const passFail: 'PASS' | 'FAIL' = pass ? 'PASS' : 'FAIL';

  const classRows = (['weak_student_low_skill', 'parent_overwritten_adult_shaped', 'over_polished_hollow', 'contradictory_multi_center', 'culturally_indirect_non_default', 'achievement_stacked_emotionally_thin', 'messy_real_style_note_dump'] as DistributionClass[])
    .map((k) => {
      const cases = packets.filter((p) => p.distribution_class === k);
      const passCount = cases.filter((p) => p.case_pass_fail === 'PASS').length;
      const failCases = cases.filter((p) => p.case_pass_fail === 'FAIL');
      const clusterMap = new Map<string, number>();
      for (const f of failCases) clusterMap.set(f.main_failure_cluster, (clusterMap.get(f.main_failure_cluster) ?? 0) + 1);
      const mainCluster = [...clusterMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';
      const minPriority = Math.min(...cases.map((p) => p.fix_priority));
      return {
        distribution_class: k,
        total_cases: cases.length,
        pass_rate: `${((passCount / Math.max(1, cases.length)) * 100).toFixed(1)}%`,
        main_failure_cluster: mainCluster,
        fix_owner: 'AI engine + product trust',
        fix_priority: Number.isFinite(minPriority) ? minPriority : 5,
      };
    });

  const topBreaks = packets
    .filter((p) => p.case_pass_fail === 'FAIL' || p.severity !== 'low')
    .sort((a, b) => (a.severity === 'high' ? -1 : 0) - (b.severity === 'high' ? -1 : 0))
    .slice(0, 10)
    .map((p) => `${p.case_id} (${p.distribution_class}): ${p.main_failure_cluster} -> ${p.evaluation.student_reaction_prediction}`);
  while (topBreaks.length < 10) topBreaks.push(`coverage_fill_${topBreaks.length + 1}: no additional high-priority break`);

  const humanReviewQueue = packets
    .filter((p) =>
      p.evaluation.action_correctness === 'incorrect'
      || p.evaluation.output_trustworthiness === 'not_trustworthy'
      || p.evaluation.line_fit === 'misfit'
      || p.evaluation.grounding_sufficiency === 'insufficient'
      || p.evaluation.student_reaction_prediction === 'feels_flattened_or_misread'
      || p.evaluation.cultural_style_fit === 'misread_due_to_style',
    )
    .map((p) => ({
      case_id: p.case_id,
      what_system_assumed_incorrectly:
        p.evaluation.action_correctness === 'incorrect'
          ? 'It committed to the wrong high-level action under shifted input shape.'
          : 'It treated surface form as stronger evidence than warranted.',
      what_student_would_likely_feel:
        p.evaluation.student_reaction_prediction === 'feels_flattened_or_misread'
          ? 'Flattened or misunderstood.'
          : 'Some uncertainty about whether the output really understands their story.',
      correct_behavior_should_have_been:
        p.expected_best_action === 'show_strongest_direction'
          ? 'Show a calibrated direction grounded in concrete evidence.'
          : p.expected_best_action === 'ask_question_before_showing'
            ? 'Ask a focused clarification before selecting a winner.'
            : 'Restrain and request more concrete input before committing.',
      fix_bucket:
        p.main_failure_cluster === 'polished_emptiness_overvaluation' || p.main_failure_cluster === 'overfit_to_clean_input_failure'
          ? 'engine'
          : p.main_failure_cluster === 'contradiction_collapse'
            ? 'flow'
            : p.main_failure_cluster === 'generic_fallback_under_shift'
              ? 'copy'
              : 'trust calibration',
    }));

  const patchSequence = [
    'Priority 1: high-confidence misreads on shifted inputs.',
    'Priority 2: polished-emptiness overvaluation.',
    'Priority 3: cultural-style misreads.',
    'Priority 4: contradiction/collision overcommitment under shift.',
    'Priority 5: weak-note recovery weaknesses.',
  ];

  const artifact = {
    protocol: 'DISTRIBUTION_SHIFT_EVALUATION_V1',
    generated_at: new Date().toISOString(),
    class_inventory: {
      weak_student_low_skill: 10,
      parent_overwritten_adult_shaped: 8,
      over_polished_hollow: 8,
      contradictory_multi_center: 8,
      culturally_indirect_non_default: 8,
      achievement_stacked_emotionally_thin: 8,
      messy_real_style_note_dump: 10,
    },
    case_design_rule_checks: designRuleChecks,
    packets,
    aggregate_summary: {
      threshold_checks: checks,
      flattened_or_misread_count: flattened,
      caution_case_total: cautionCases.length,
      caution_appropriate_count: cautionAppropriate,
      parent_polished_false_premium_overcommit_count: falsePremiumOvercommit.length,
      cultural_style_misread_count: culturalMisread,
    },
    class_by_class_severity_table: classRows,
    top_10_generalization_trust_breaks: topBreaks,
    patch_sequence: patchSequence,
    human_review_required: {
      incorrect_action_cases: packets.filter((p) => p.evaluation.action_correctness === 'incorrect').map((p) => p.case_id),
      not_trustworthy_cases: packets.filter((p) => p.evaluation.output_trustworthiness === 'not_trustworthy').map((p) => p.case_id),
      misfit_line_cases: packets.filter((p) => p.evaluation.line_fit === 'misfit').map((p) => p.case_id),
      insufficient_grounding_cases: packets.filter((p) => p.evaluation.grounding_sufficiency === 'insufficient').map((p) => p.case_id),
      flattened_or_misread_cases: packets.filter((p) => p.evaluation.student_reaction_prediction === 'feels_flattened_or_misread').map((p) => p.case_id),
      misread_due_to_style_cases: packets.filter((p) => p.evaluation.cultural_style_fit === 'misread_due_to_style').map((p) => p.case_id),
      review_queue: humanReviewQueue,
    },
    pass_fail: passFail,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown({ pass_fail: passFail, packets, checks: [...checks, ...designRuleChecks], classTable: classRows, topBreaks, patchSequence }));

  console.log('DISTRIBUTION_SHIFT_EVALUATION_V1');
  console.log(`  pass_fail: ${passFail}`);
  console.log(`  total_cases: ${packets.length}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main().catch((err) => {
  console.error('[distribution-shift-evaluation] fatal error', err);
  process.exit(1);
});
