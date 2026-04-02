#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type CaseClass =
  | 'low_signal'
  | 'contradiction'
  | 'format_weirdness'
  | 'polished_empty'
  | 'overloaded';

type ExpectedBehavior =
  | 'show_strongest_direction'
  | 'ask_question_before_showing'
  | 'fail_closed_or_needs_more_input';

type CorrectActionTaken = 'show' | 'clarify' | 'fail_closed';
type BehaviorCorrectness = 'correct' | 'borderline' | 'incorrect';
type BluffRisk = 'low' | 'medium' | 'high';
type CandidateFairness = 'fair' | 'degraded' | 'broken';
type OutputTrustworthiness = 'trustworthy' | 'questionable' | 'not_trustworthy';

type EdgeCase = {
  id: string;
  title: string;
  caseClass: CaseClass;
  rawInput: string;
  expectedBehavior: ExpectedBehavior;
  correctActionTaken: CorrectActionTaken;
  intendedAxisHint: string;
  reviewerIntentNote: string;
  cautionRequired: boolean;
  traps: Array<
    | 'false_confidence'
    | 'decorative_evidence'
    | 'generic_winner_drift'
    | 'clarification_suppression'
    | 'fallback_contamination'
    | 'story_collision'
  >;
};

type CandidateRow = {
  candidate_id: string;
  direction_line: string;
  direction_summary: string;
  total_score: number;
  validator_flags: Record<string, unknown>;
};

type EdgeCasePacket = {
  case_id: string;
  title: string;
  case_class: CaseClass;
  expected_behavior: ExpectedBehavior;
  reviewer_intent_note: string;
  raw_input: string;
  runtime_result: {
    status: string;
    selected_candidate_id: string;
    selected_axis_family: string;
    selected_direction_line: string;
    confidence_band: string;
    route_decision: string;
    route_decision_reasons: string[];
    top_score: number;
    runner_up_score: number;
    score_margin: number;
  };
  candidates: CandidateRow[];
  selected_output_quality: {
    selected_explanation: string;
    selected_evidence_items: Array<{ text: string; note: string }>;
    fallback_evidence_used: boolean;
    fallback_explanation_language_used: boolean;
  };
  debug_fields: {
    selected_vs_runner_up_score_breakdown: Record<string, unknown> | null;
    extracted_semantic_anchors: Record<string, unknown> | null;
    scoring_debug_selected_axis_family: string | null;
  };
  edge_case_audit: {
    behavior_correctness: BehaviorCorrectness;
    bluff_risk: BluffRisk;
    candidate_fairness_under_edge_input: CandidateFairness;
    output_trustworthiness: OutputTrustworthiness;
    correct_action_taken: CorrectActionTaken;
    route_matches_correct_action: boolean;
    did_system_bluff: boolean;
    did_system_overcommit: boolean;
    did_system_misframe_story: boolean;
    chose_clarification_when_appropriate: boolean;
    failed_closed_when_appropriate: boolean;
    reviewer_notes: string;
    subsystem_guess:
      | 'scorer'
      | 'routing'
      | 'explanation'
      | 'candidate_generation'
      | 'fallback_behavior'
      | 'mixed';
    human_review: {
      primary_reviewer: string | null;
      secondary_reviewer: string | null;
      adjudication_required: boolean;
      contested: boolean;
      final_label: 'pending' | 'confirmed';
      notes: string | null;
    };
    candidate_failure_clusters: Array<
      | 'candidate_duplication'
      | 'candidate_family_missing'
      | 'fallback_contamination'
      | 'evidence_noise'
      | 'axis_collapse'
      | 'wrong_family_dominance'
      | 'low_signal_overstretch'
      | 'overloaded_input_fragmentation'
    >;
    remediation_buckets: Array<
      | 'candidate_generation_failure'
      | 'clarification_quality_failure'
      | 'trust_output_failure'
      | 'fallback_behavior_failure'
      | 'axis_collision_failure'
    >;
    pre_patch_outcome?: {
      route: string;
      candidate_quality: CandidateFairness;
      trustworthiness: OutputTrustworthiness;
    } | null;
    patch_track_applied?: Array<'A_candidate_recovery' | 'B_clarification_quality' | 'C_trust_output'>;
    post_patch_outcome?: {
      route: string;
      candidate_quality: CandidateFairness;
      trustworthiness: OutputTrustworthiness;
    } | null;
    remaining_failure?: string | null;
  };
};

type AggregateSummary = {
  total_cases: number;
  behavior_correct_count: number;
  bluff_high_count: number;
  candidate_broken_count: number;
  trustworthiness_trustworthy_count: number;
  route_action_match_count: number;
  caution_cases_correct_count: number;
  low_signal_or_contradiction_overbluff_count: number;
  pass: boolean;
};

const OUTPUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_edge_case_breaker_v1.json');
const OUTPUT_MD = path.join(process.cwd(), 'docs', 'engineering', 'NDS_EDGE_CASE_BREAKER_RESULTS_V1.md');

const FALLBACK_EVIDENCE_PATTERN =
  /no clear evidence span available|the story needs a clearer turning moment|hinge moment needs clearer evidence|partial change appears|change signal is limited/i;

const FALLBACK_EXPLANATION_PATTERN =
  /do not start with the accomplishment|most of what led up to the correction is context|the correction angle shows one specific moment|generic bounce-back language|no clear evidence span available/i;

const EDGE_CASES: EdgeCase[] = [
  // A) low-signal / thin-input — 6
  {
    id: 'ECB_01',
    title: 'One-sentence volunteering statement',
    caseClass: 'low_signal',
    rawInput: 'I volunteered a lot and it changed me.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: system may hallucinate a premium center from zero concrete detail.',
    cautionRequired: true,
    traps: ['false_confidence', 'clarification_suppression'],
  },
  {
    id: 'ECB_02',
    title: 'I do not know what to write',
    caseClass: 'low_signal',
    rawInput: 'I do not know what to write about. Everything feels normal.',
    expectedBehavior: 'fail_closed_or_needs_more_input',
    correctActionTaken: 'fail_closed',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: should fail closed or ask for more input, not force a direction.',
    cautionRequired: true,
    traps: ['false_confidence', 'fallback_contamination'],
  },
  {
    id: 'ECB_03',
    title: 'Emotionally important but no event',
    caseClass: 'low_signal',
    rawInput:
      'Losing my grandfather affected me deeply and changed my perspective, but I cannot describe any specific moment yet.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'grief_reflection',
    reviewerIntentNote: 'Trap: emotional language can trick scorer into overconfidence without concrete scene.',
    cautionRequired: true,
    traps: ['false_confidence', 'decorative_evidence'],
  },
  {
    id: 'ECB_04',
    title: 'Task summary without scene',
    caseClass: 'low_signal',
    rawInput:
      'I was team captain and managed schedules, meetings, and communication every week for two years.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: résumé summary should not produce a false precise axis winner.',
    cautionRequired: true,
    traps: ['generic_winner_drift', 'clarification_suppression'],
  },
  {
    id: 'ECB_05',
    title: 'Reflection with no concrete event',
    caseClass: 'low_signal',
    rawInput:
      'I learned leadership is listening and humility, and now I think differently about people and teamwork.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'relationship_or_listening',
    reviewerIntentNote: 'Trap: abstract realization markers without evidence should trigger clarification.',
    cautionRequired: true,
    traps: ['false_confidence', 'decorative_evidence'],
  },
  {
    id: 'ECB_06',
    title: 'Single short line with vague growth',
    caseClass: 'low_signal',
    rawInput: 'I grew a lot from challenges and became a better person.',
    expectedBehavior: 'fail_closed_or_needs_more_input',
    correctActionTaken: 'fail_closed',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: this should not receive a trustworthy strongest-direction output.',
    cautionRequired: true,
    traps: ['false_confidence', 'generic_winner_drift'],
  },

  // B) contradiction / collision — 5
  {
    id: 'ECB_07',
    title: 'Leadership versus listening self-interpretation conflict',
    caseClass: 'contradiction',
    rawInput:
      'I think my story is about leadership because I coordinated people, but maybe it is really about listening because I had to stop controlling every decision. Both feel true and I cannot tell which center is stronger.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'story_collision',
    reviewerIntentNote: 'Trap: two plausible axes; forcing one winner is premature.',
    cautionRequired: true,
    traps: ['story_collision', 'clarification_suppression'],
  },
  {
    id: 'ECB_08',
    title: 'Action lane and realization lane jammed together',
    caseClass: 'contradiction',
    rawInput:
      'I redesigned the tutoring workflow and it improved outcomes, but the real change might have been identity because I stopped seeing myself as the smartest explainer. I am not sure which one the essay should center.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'story_collision',
    reviewerIntentNote: 'Trap: process redesign and identity shift are both strong and in tension.',
    cautionRequired: true,
    traps: ['story_collision', 'false_confidence'],
  },
  {
    id: 'ECB_09',
    title: 'Two competing stories in one input',
    caseClass: 'contradiction',
    rawInput:
      'Story 1: I rebuilt the food pantry distribution process. Story 2: I translated for my parents and learned to listen. I need to choose one but both are meaningful and I am mixing them here.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'story_collision',
    reviewerIntentNote: 'Trap: system should not collapse two separate narratives into one fake center.',
    cautionRequired: true,
    traps: ['story_collision', 'clarification_suppression'],
  },
  {
    id: 'ECB_10',
    title: 'Conflicting self-interpretations in same paragraph',
    caseClass: 'contradiction',
    rawInput:
      'At first I thought this was about resilience. Then I thought it was about redesign. Then maybe it is really about responsibility. I keep changing my mind on what actually changed.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: unstable self-labeling should increase caution, not certainty.',
    cautionRequired: true,
    traps: ['false_confidence', 'clarification_suppression'],
  },
  {
    id: 'ECB_11',
    title: 'Contradiction with one clearer center',
    caseClass: 'contradiction',
    rawInput:
      'I kept saying this was about leadership, but the specific turning moment was when a nurse told me I was in the way and I started listening first before acting with patients.',
    expectedBehavior: 'show_strongest_direction',
    correctActionTaken: 'show',
    intendedAxisHint: 'relationship_or_listening',
    reviewerIntentNote: 'Trap: contradictory framing present, but concrete evidence clearly points to listening axis.',
    cautionRequired: false,
    traps: ['story_collision'],
  },

  // C) format weirdness — 5
  {
    id: 'ECB_12',
    title: 'Bullet fragments only',
    caseClass: 'format_weirdness',
    rawInput:
      '- hospital\n- moved too fast\n- nurse said ask first\n- listened\n- changed interactions',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'relationship_or_listening',
    reviewerIntentNote: 'Trap: fragments should remain interpretable without fake polish confidence.',
    cautionRequired: false,
    traps: ['clarification_suppression', 'decorative_evidence'],
  },
  {
    id: 'ECB_13',
    title: 'Repeated sentence four times',
    caseClass: 'format_weirdness',
    rawInput:
      'I learned leadership is listening. I learned leadership is listening. I learned leadership is listening. I learned leadership is listening.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'relationship_or_listening',
    reviewerIntentNote: 'Trap: repetition inflation should not boost confidence.',
    cautionRequired: false,
    traps: ['false_confidence', 'generic_winner_drift'],
  },
  {
    id: 'ECB_14',
    title: 'Arrow shorthand note dump',
    caseClass: 'format_weirdness',
    rawInput:
      'old way -> explain more -> students still stuck -> ask diag questions -> better responses -> maybe pattern break?',
    expectedBehavior: 'show_strongest_direction',
    correctActionTaken: 'show',
    intendedAxisHint: 'pattern_breaking',
    reviewerIntentNote: 'Trap: weird syntax but meaningful pattern-break arc exists and should still be recoverable.',
    cautionRequired: false,
    traps: ['generic_winner_drift'],
  },
  {
    id: 'ECB_15',
    title: 'Weird spacing and punctuation paste',
    caseClass: 'format_weirdness',
    rawInput:
      'i   was   the  bottleneck ;  reviews waited on me ... then I delegated  ownership + handoff rules  ; turnaround improved',
    expectedBehavior: 'show_strongest_direction',
    correctActionTaken: 'show',
    intendedAxisHint: 'delegation',
    reviewerIntentNote: 'Trap: malformed punctuation/spacing should not break candidate quality.',
    cautionRequired: false,
    traps: ['generic_winner_drift'],
  },
  {
    id: 'ECB_16',
    title: 'Abrupt switches notes to draft voice',
    caseClass: 'format_weirdness',
    rawInput:
      'notes: argued too much in debate. draft line: The decisive shift was relational, not rhetorical. notes again: partner said I wasn\'t listening. then I asked first.',
    expectedBehavior: 'show_strongest_direction',
    correctActionTaken: 'show',
    intendedAxisHint: 'relationship_or_listening',
    reviewerIntentNote: 'Trap: mixed register should not collapse into generic line.',
    cautionRequired: false,
    traps: ['decorative_evidence'],
  },

  // D) polished-but-empty / overwritten — 4
  {
    id: 'ECB_17',
    title: 'Parent-sounding abstract excellence prose',
    caseClass: 'polished_empty',
    rawInput:
      'Through a tapestry of service and leadership, I cultivated a multidimensional ethos of impact, resilience, and global citizenship.',
    expectedBehavior: 'fail_closed_or_needs_more_input',
    correctActionTaken: 'fail_closed',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: high polish with no event should fail closed, not receive premium confident narrative center.',
    cautionRequired: false,
    traps: ['false_confidence', 'generic_winner_drift', 'fallback_contamination'],
  },
  {
    id: 'ECB_18',
    title: 'Overwritten admissions-style but no hinge moment',
    caseClass: 'polished_empty',
    rawInput:
      'My journey is an intricate meditation on purpose, where every challenge expanded my capacity for empathetic leadership and thoughtful contribution.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: fancy style should not be mistaken for strong evidence.',
    cautionRequired: false,
    traps: ['false_confidence', 'decorative_evidence'],
  },
  {
    id: 'ECB_19',
    title: 'Sophisticated wording with weak center',
    caseClass: 'polished_empty',
    rawInput:
      'The most important thing I learned is that growth is nonlinear and responsibility is relational, though no single moment captures this evolution.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: conceptual language but no concrete axis evidence should trigger clarification.',
    cautionRequired: false,
    traps: ['clarification_suppression', 'generic_winner_drift'],
  },
  {
    id: 'ECB_20',
    title: 'Resume-rich but emotionally empty',
    caseClass: 'polished_empty',
    rawInput:
      'I led 3 clubs, founded a nonprofit chapter, and won 5 awards while mentoring younger students and serving my community with dedication.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'unknown',
    reviewerIntentNote: 'Trap: achievements list should not auto-convert into false deep direction.',
    cautionRequired: false,
    traps: ['generic_winner_drift', 'clarification_suppression'],
  },

  // E) overloaded / noisy — 4
  {
    id: 'ECB_21',
    title: 'Long rambling notes with buried center',
    caseClass: 'overloaded',
    rawInput:
      'Freshman year robotics, sophomore year debate, junior year hospital volunteering, summer research, family translation, AP stress, team conflict, and then finally at the clinic I realized moving fast was hurting patients because I was acting before asking what they needed. Also there were schedule issues and communication issues and unrelated drama.',
    expectedBehavior: 'show_strongest_direction',
    correctActionTaken: 'show',
    intendedAxisHint: 'relationship_or_listening',
    reviewerIntentNote: 'Trap: noisy multi-plot input with one buried relational center should still surface a defensible axis.',
    cautionRequired: false,
    traps: ['story_collision', 'generic_winner_drift'],
  },
  {
    id: 'ECB_22',
    title: 'Over-contextualized operations detail dump',
    caseClass: 'overloaded',
    rawInput:
      'We had ticket flow failures, inventory mismatch, staffing shortages, prep timing conflicts, mislabeled bins, and queue congestion. I mapped each choke point, rebuilt the ticket rail, color-coded urgency, and changed staging order. After the redesign callbacks dropped significantly.',
    expectedBehavior: 'show_strongest_direction',
    correctActionTaken: 'show',
    intendedAxisHint: 'system_redesign',
    reviewerIntentNote: 'Trap: heavy detail should not drown the actual redesign center or create nonsense candidates.',
    cautionRequired: false,
    traps: ['generic_winner_drift'],
  },
  {
    id: 'ECB_23',
    title: 'Multiple subplots with unresolved central claim',
    caseClass: 'overloaded',
    rawInput:
      'I could write about debate conflict, or tutoring pattern breaks, or translating for my parents, or rebuilding our pantry workflow. All of them mattered and I am trying to combine them into one essay but I cannot tell what is central.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'story_collision',
    reviewerIntentNote: 'Trap: should choose clarification, not collapse four stories into one confident winner.',
    cautionRequired: false,
    traps: ['story_collision', 'clarification_suppression'],
  },
  {
    id: 'ECB_24',
    title: 'Noisy mixed chronology plus contradiction',
    caseClass: 'overloaded',
    rawInput:
      'Before I delegated review ownership, I thought speed mattered most, then I had a clinic volunteering realization about listening, then I went back to code review and rewrote the process. I am unsure whether this is about care, leadership, or systems.',
    expectedBehavior: 'ask_question_before_showing',
    correctActionTaken: 'clarify',
    intendedAxisHint: 'story_collision',
    reviewerIntentNote: 'Trap: chronology and axis collision should trigger caution, not overcommitment.',
    cautionRequired: false,
    traps: ['story_collision', 'false_confidence'],
  },
];

function buildInput(caseDef: EdgeCase): NdsResolvedSources {
  return {
    essay_project: {
      id: `ecb_${caseDef.id}`,
      student_user_id: `ecb_${caseDef.id}`,
      title: caseDef.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `ecb_${caseDef.id}`,
      first_name: 'EdgeCase',
      last_name: caseDef.id,
      grade: 11,
      interests: [],
    },
    story_entries: [
      {
        id: `${caseDef.id}_1`,
        title: caseDef.title,
        body: caseDef.rawInput,
        category: null,
      },
    ],
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: 1,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

function inferAxisFamily(directionLine: string): string {
  const line = directionLine.toLowerCase();
  if (/listening|person in front|relationship|owed/.test(line)) return 'relationship_or_listening';
  if (/redesign|system|workflow|process|tracker|architecture/.test(line)) return 'system_redesign';
  if (/delegat|distributed|bottleneck|shared ownership|handoff/.test(line)) return 'delegation';
  if (/pattern|stopped repeating|wrong pattern|habit/.test(line)) return 'pattern_breaking';
  if (/identity|self-concept|who you were becoming|fixer/.test(line)) return 'identity_transformation';
  if (/responsibility|owed/.test(line)) return 'responsibility';
  return 'unclassified';
}

function detectFallbackEvidence(selectedEvidence: string[]): boolean {
  return selectedEvidence.some((text) => FALLBACK_EVIDENCE_PATTERN.test(text));
}

function detectFallbackExplanation(explanation: string): boolean {
  return FALLBACK_EXPLANATION_PATTERN.test(explanation);
}

function evaluateCandidateFairness(candidates: CandidateRow[]): CandidateFairness {
  if (candidates.length === 0) return 'broken';

  const uniqueLines = new Set(candidates.map((c) => c.direction_line.toLowerCase()));
  const duplicateRatio = 1 - uniqueLines.size / Math.max(1, candidates.length);

  const junkLikeCount = candidates.filter((c) => {
    const line = c.direction_line.toLowerCase();
    return (
      line.length < 16 ||
      /general story|angle behind|what changed after|how you handled/.test(line)
    );
  }).length;

  if (duplicateRatio >= 0.5 || junkLikeCount >= Math.ceil(candidates.length * 0.7)) return 'broken';
  if (duplicateRatio > 0 || junkLikeCount > 0 || candidates.length < 2) return 'degraded';
  return 'fair';
}

function evaluateBluffRisk(
  caseDef: EdgeCase,
  routeDecision: string,
  confidenceBand: string,
  scoreMargin: number,
  fallbackEvidenceUsed: boolean,
): BluffRisk {
  const cautionExpected = caseDef.correctActionTaken !== 'show';

  if (
    (cautionExpected && routeDecision === 'show_strongest_direction' && (confidenceBand === 'high' || confidenceBand === 'medium')) ||
    (caseDef.caseClass === 'low_signal' && routeDecision === 'show_strongest_direction') ||
    (cautionExpected && caseDef.caseClass === 'contradiction' && routeDecision === 'show_strongest_direction' && confidenceBand !== 'low')
  ) {
    return 'high';
  }

  if (
    (cautionExpected && routeDecision === 'show_strongest_direction') ||
    (confidenceBand === 'high' && scoreMargin < 0.07) ||
    fallbackEvidenceUsed
  ) {
    return 'medium';
  }

  return 'low';
}

function chooseCorrectActionMatch(correctAction: CorrectActionTaken, status: string, routeDecision: string): boolean {
  if (correctAction === 'show') return status === 'success' && routeDecision === 'show_strongest_direction';
  if (correctAction === 'clarify') return routeDecision === 'ask_question_before_showing';
  return status === 'needs_more_input' || routeDecision === 'ask_question_before_showing';
}

function evaluateBehaviorCorrectness(
  caseDef: EdgeCase,
  status: string,
  routeDecision: string,
  confidenceBand: string,
  misframe: boolean,
): BehaviorCorrectness {
  const match = chooseCorrectActionMatch(caseDef.correctActionTaken, status, routeDecision);
  if (match && (caseDef.correctActionTaken !== 'show' || !misframe)) return 'correct';

  if (
    caseDef.correctActionTaken === 'clarify' &&
    routeDecision === 'show_strongest_direction' &&
    confidenceBand === 'low'
  ) {
    return 'borderline';
  }

  if (
    caseDef.correctActionTaken === 'show' &&
    routeDecision === 'ask_question_before_showing' &&
    confidenceBand === 'low'
  ) {
    return 'borderline';
  }

  return 'incorrect';
}

function evaluateTrustworthiness(
  behavior: BehaviorCorrectness,
  bluffRisk: BluffRisk,
  fairness: CandidateFairness,
  misframe: boolean,
): OutputTrustworthiness {
  if (behavior === 'correct' && bluffRisk === 'low' && fairness !== 'broken' && !misframe) {
    return 'trustworthy';
  }
  if (behavior === 'incorrect' || bluffRisk === 'high' || fairness === 'broken' || misframe) {
    return 'not_trustworthy';
  }
  if (behavior === 'borderline' || bluffRisk === 'medium' || fairness === 'degraded') {
    return 'questionable';
  }
  return 'trustworthy';
}

function classifySubsystem(
  behavior: BehaviorCorrectness,
  bluffRisk: BluffRisk,
  fairness: CandidateFairness,
  fallbackEvidenceUsed: boolean,
  fallbackExplanationUsed: boolean,
  misframe: boolean,
): EdgeCasePacket['edge_case_audit']['subsystem_guess'] {
  if (fallbackEvidenceUsed || fallbackExplanationUsed) return 'fallback_behavior';
  if (fairness === 'broken') return 'candidate_generation';
  if (behavior === 'incorrect' && bluffRisk !== 'low') return 'routing';
  if (misframe) return 'scorer';
  if (behavior === 'borderline') return 'explanation';
  return 'mixed';
}

function clusterCandidateFailures(
  packetInput: {
    caseClass: CaseClass;
    candidates: CandidateRow[];
    selectedAxisFamily: string;
    intendedAxisHint: string;
    fallbackEvidenceUsed: boolean;
    fairness: CandidateFairness;
  }
): Array<
  | 'candidate_duplication'
  | 'candidate_family_missing'
  | 'fallback_contamination'
  | 'evidence_noise'
  | 'axis_collapse'
  | 'wrong_family_dominance'
  | 'low_signal_overstretch'
  | 'overloaded_input_fragmentation'
> {
  const clusters: Array<
    | 'candidate_duplication'
    | 'candidate_family_missing'
    | 'fallback_contamination'
    | 'evidence_noise'
    | 'axis_collapse'
    | 'wrong_family_dominance'
    | 'low_signal_overstretch'
    | 'overloaded_input_fragmentation'
  > = [];

  const lowerLines = packetInput.candidates.map((c) => c.direction_line.toLowerCase());
  const unique = new Set(lowerLines);
  if (lowerLines.length > 1 && unique.size <= Math.ceil(lowerLines.length / 2)) clusters.push('candidate_duplication');
  if (packetInput.candidates.length <= 1 || packetInput.fairness === 'broken') clusters.push('axis_collapse');
  if (packetInput.fallbackEvidenceUsed) clusters.push('fallback_contamination');
  if (packetInput.caseClass === 'low_signal' && packetInput.fairness !== 'fair') clusters.push('low_signal_overstretch');
  if (packetInput.caseClass === 'overloaded' && packetInput.fairness !== 'fair') clusters.push('overloaded_input_fragmentation');
  if (
    packetInput.intendedAxisHint !== 'unknown' &&
    packetInput.intendedAxisHint !== 'story_collision' &&
    !packetInput.selectedAxisFamily.includes(packetInput.intendedAxisHint)
  ) {
    clusters.push('wrong_family_dominance');
  }
  if (!packetInput.candidates.some((c) => c.total_score > 0.75)) clusters.push('candidate_family_missing');
  if (packetInput.candidates.some((c) => c.direction_summary.length < 40)) clusters.push('evidence_noise');

  return Array.from(new Set(clusters));
}

function inferRemediationBuckets(input: {
  behavior: BehaviorCorrectness;
  bluffRisk: BluffRisk;
  fairness: CandidateFairness;
  trustworthiness: OutputTrustworthiness;
  fallbackEvidenceUsed: boolean;
  routeMatch: boolean;
  caseClass: CaseClass;
}): Array<
  | 'candidate_generation_failure'
  | 'clarification_quality_failure'
  | 'trust_output_failure'
  | 'fallback_behavior_failure'
  | 'axis_collision_failure'
> {
  const out: Array<
    | 'candidate_generation_failure'
    | 'clarification_quality_failure'
    | 'trust_output_failure'
    | 'fallback_behavior_failure'
    | 'axis_collision_failure'
  > = [];

  if (input.fairness !== 'fair') out.push('candidate_generation_failure');
  if (!input.routeMatch && (input.caseClass === 'contradiction' || input.caseClass === 'overloaded')) out.push('axis_collision_failure');
  if (!input.routeMatch || input.behavior !== 'correct') out.push('clarification_quality_failure');
  if (input.trustworthiness !== 'trustworthy' || input.bluffRisk !== 'low') out.push('trust_output_failure');
  if (input.fallbackEvidenceUsed) out.push('fallback_behavior_failure');

  return Array.from(new Set(out));
}

function explanationTextFromPayload(payload: Record<string, unknown>): string {
  const best = (payload.best_direction ?? {}) as Record<string, unknown>;
  return [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .map((x) => String(x).replace(/\s+/g, ' ').trim())
    .join(' ');
}

function evidenceNote(spanText: string, directionLine: string): string {
  const normalizedSpan = spanText.toLowerCase();
  if (FALLBACK_EVIDENCE_PATTERN.test(normalizedSpan)) return 'fallback / system-generated evidence note';
  const overlap = directionLine
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2)
    .filter((t) => normalizedSpan.includes(t)).length;
  if (overlap >= 4) return 'direct support';
  if (overlap >= 2) return 'related but partial support';
  return 'mostly contextual setup';
}

async function runCase(caseDef: EdgeCase): Promise<EdgeCasePacket> {
  const context = buildNdsNormalizedContextPack(buildInput(caseDef));
  const execution = await executeNdsModule({
    run_id: `ecb_${caseDef.id}`,
    module_key: 'narrative_direction_selection',
    execution_mode: 'standard',
    context_pack: context,
    module_versions: {
      prompt_version: 'v1',
      schema_version: 'v1',
      validator_version: 'v1',
    },
  });

  const payload = (execution.candidate_payload ?? {}) as Record<string, unknown>;
  const status = String(payload.status ?? 'unknown');
  const candidatesRaw = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidatesRaw.find((c) => c.selected === true) ?? candidatesRaw[0] ?? null;

  const selectedDirectionLine = String(selected?.direction_line ?? '');
  const selectedAxisFamily =
    String((payload.scoring_debug as Record<string, unknown> | undefined)?.selected_axis_family ?? '') ||
    inferAxisFamily(selectedDirectionLine);

  const scoreSummary = (payload.score_summary ?? {}) as Record<string, unknown>;
  const topScore = Number(scoreSummary.top_score ?? 0);
  const runnerUpScore = Number(scoreSummary.runner_up_score ?? 0);
  const scoreMargin = Number(scoreSummary.score_margin ?? 0);
  const confidenceBand = String(payload.confidence_band ?? 'n/a');
  const routeDecision = String(payload.route_decision ?? 'n/a');

  const candidates: CandidateRow[] = candidatesRaw.map((c) => ({
    candidate_id: String(c.candidate_id ?? ''),
    direction_line: String(c.direction_line ?? ''),
    direction_summary: String(c.direction_summary ?? ''),
    total_score: Number((c.scores as Record<string, unknown> | undefined)?.total_score ?? 0),
    validator_flags: (c.validator_flags ?? {}) as Record<string, unknown>,
  }));

  const selectedEvidenceItems = ((selected?.evidence_spans ?? []) as Array<Record<string, unknown>>)
    .map((span) => String(span.text ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const selectedExplanation = explanationTextFromPayload(payload);
  const fallbackEvidenceUsed = detectFallbackEvidence(selectedEvidenceItems);
  const fallbackExplanationLanguageUsed = detectFallbackExplanation(selectedExplanation);

  const intended = caseDef.intendedAxisHint.toLowerCase();
  const selectedAxisLower = selectedAxisFamily.toLowerCase();
  const misframe =
    routeDecision === 'show_strongest_direction' &&
    intended !== 'unknown' &&
    intended !== 'story_collision' &&
    !selectedAxisLower.includes(intended) &&
    !selectedDirectionLine.toLowerCase().includes(intended.replace(/_/g, ' '));

  const behaviorCorrectness = evaluateBehaviorCorrectness(
    caseDef,
    status,
    routeDecision,
    confidenceBand,
    misframe,
  );
  const bluffRisk = evaluateBluffRisk(
    caseDef,
    routeDecision,
    confidenceBand,
    scoreMargin,
    fallbackEvidenceUsed,
  );
  const fairness = evaluateCandidateFairness(candidates);
  const trustworthiness = evaluateTrustworthiness(behaviorCorrectness, bluffRisk, fairness, misframe);

  const routeMatch = chooseCorrectActionMatch(caseDef.correctActionTaken, status, routeDecision);
  const didSystemBluff = bluffRisk === 'high';
  const didSystemOvercommit =
    (caseDef.correctActionTaken !== 'show' && routeDecision === 'show_strongest_direction') ||
    (confidenceBand === 'high' && scoreMargin < 0.07);

  const choseClarificationWhenAppropriate =
    caseDef.correctActionTaken === 'clarify' ? routeDecision === 'ask_question_before_showing' : true;
  const failedClosedWhenAppropriate =
    caseDef.correctActionTaken === 'fail_closed'
      ? status === 'needs_more_input' || routeDecision === 'ask_question_before_showing'
      : true;

  const routeDecisionReasons: string[] = [];
  if (routeDecision === 'ask_question_before_showing') {
    if (confidenceBand === 'low') routeDecisionReasons.push('low_confidence_band');
    if (scoreMargin < 0.12) routeDecisionReasons.push('close_margin');
    if (fallbackEvidenceUsed) routeDecisionReasons.push('fallback_evidence_guard');
  } else if (routeDecision === 'show_strongest_direction') {
    if (confidenceBand === 'medium' || confidenceBand === 'high') routeDecisionReasons.push('confidence_allows_show');
    if (scoreMargin >= 0.07) routeDecisionReasons.push('score_margin_above_show_threshold');
  }

  const subsystemGuess = classifySubsystem(
    behaviorCorrectness,
    bluffRisk,
    fairness,
    fallbackEvidenceUsed,
    fallbackExplanationLanguageUsed,
    misframe,
  );

  const reviewerNotes = [
    `Trap(s): ${caseDef.traps.join(', ')}.`,
    `Behavior=${behaviorCorrectness}; bluff_risk=${bluffRisk}; fairness=${fairness}; trust=${trustworthiness}.`,
    misframe ? 'Selected output appears misframed relative to intended axis hint.' : 'No strong misframe detected by auto-audit.',
  ].join(' ');

  const candidateFailureClusters = clusterCandidateFailures({
    caseClass: caseDef.caseClass,
    candidates,
    selectedAxisFamily,
    intendedAxisHint: caseDef.intendedAxisHint,
    fallbackEvidenceUsed,
    fairness,
  });

  const remediationBuckets = inferRemediationBuckets({
    behavior: behaviorCorrectness,
    bluffRisk,
    fairness,
    trustworthiness,
    fallbackEvidenceUsed,
    routeMatch,
    caseClass: caseDef.caseClass,
  });

  return {
    case_id: caseDef.id,
    title: caseDef.title,
    case_class: caseDef.caseClass,
    expected_behavior: caseDef.expectedBehavior,
    reviewer_intent_note: caseDef.reviewerIntentNote,
    raw_input: caseDef.rawInput,
    runtime_result: {
      status,
      selected_candidate_id: String(selected?.candidate_id ?? 'n/a'),
      selected_axis_family: selectedAxisFamily || 'n/a',
      selected_direction_line: selectedDirectionLine,
      confidence_band: confidenceBand,
      route_decision: routeDecision,
      route_decision_reasons: routeDecisionReasons,
      top_score: topScore,
      runner_up_score: runnerUpScore,
      score_margin: scoreMargin,
    },
    candidates,
    selected_output_quality: {
      selected_explanation: selectedExplanation,
      selected_evidence_items: selectedEvidenceItems.map((text) => ({
        text,
        note: evidenceNote(text, selectedDirectionLine),
      })),
      fallback_evidence_used: fallbackEvidenceUsed,
      fallback_explanation_language_used: fallbackExplanationLanguageUsed,
    },
    debug_fields: {
      selected_vs_runner_up_score_breakdown:
        ((payload.scoring_debug as Record<string, unknown> | undefined)?.selected_vs_runner_up_scores as Record<string, unknown>) ?? null,
      extracted_semantic_anchors:
        ((payload.scoring_debug as Record<string, unknown> | undefined)?.semantic_anchors as Record<string, unknown>) ?? null,
      scoring_debug_selected_axis_family:
        String((payload.scoring_debug as Record<string, unknown> | undefined)?.selected_axis_family ?? '') || null,
    },
    edge_case_audit: {
      behavior_correctness: behaviorCorrectness,
      bluff_risk: bluffRisk,
      candidate_fairness_under_edge_input: fairness,
      output_trustworthiness: trustworthiness,
      correct_action_taken: caseDef.correctActionTaken,
      route_matches_correct_action: routeMatch,
      did_system_bluff: didSystemBluff,
      did_system_overcommit: didSystemOvercommit,
      did_system_misframe_story: misframe,
      chose_clarification_when_appropriate: choseClarificationWhenAppropriate,
      failed_closed_when_appropriate: failedClosedWhenAppropriate,
      reviewer_notes: reviewerNotes,
      subsystem_guess: subsystemGuess,
      human_review: {
        primary_reviewer: null,
        secondary_reviewer: null,
        adjudication_required:
          behaviorCorrectness === 'incorrect' ||
          bluffRisk === 'high' ||
          fairness === 'broken' ||
          trustworthiness === 'not_trustworthy',
        contested: false,
        final_label: 'pending',
        notes: null,
      },
      candidate_failure_clusters: candidateFailureClusters,
      remediation_buckets: remediationBuckets,
      patch_track_applied: ['A_candidate_recovery', 'B_clarification_quality', 'C_trust_output'],
      post_patch_outcome: {
        route: routeDecision,
        candidate_quality: fairness,
        trustworthiness,
      },
      remaining_failure:
        behaviorCorrectness === 'correct' && fairness === 'fair' && trustworthiness === 'trustworthy'
          ? null
          : remediationBuckets.join(', '),
    },
  };
}

function computeAggregate(packets: EdgeCasePacket[]): AggregateSummary {
  const behaviorCorrectCount = packets.filter((p) => p.edge_case_audit.behavior_correctness === 'correct').length;
  const bluffHighCount = packets.filter((p) => p.edge_case_audit.bluff_risk === 'high').length;
  const candidateBrokenCount = packets.filter((p) => p.edge_case_audit.candidate_fairness_under_edge_input === 'broken').length;
  const trustworthyCount = packets.filter((p) => p.edge_case_audit.output_trustworthiness === 'trustworthy').length;
  const routeActionMatchCount = packets.filter((p) => p.edge_case_audit.route_matches_correct_action).length;

  const cautionCaseIds = new Set(EDGE_CASES.filter((c) => c.cautionRequired).map((c) => c.id));
  const cautionCases = packets.filter((p) => cautionCaseIds.has(p.case_id));
  const cautionCasesCorrectCount = cautionCases.filter(
    (p) =>
      p.edge_case_audit.correct_action_taken === 'clarify'
        ? p.runtime_result.route_decision === 'ask_question_before_showing'
        : p.runtime_result.status === 'needs_more_input' || p.runtime_result.route_decision === 'ask_question_before_showing'
  ).length;

  const lowSignalOrContradiction = packets.filter(
    (p) =>
      (p.case_class === 'low_signal' || p.case_class === 'contradiction') &&
      p.edge_case_audit.correct_action_taken !== 'show'
  );
  const lowSignalOrContradictionOverbluffCount = lowSignalOrContradiction.filter(
    (p) =>
      p.runtime_result.route_decision === 'show_strongest_direction' &&
      (p.runtime_result.confidence_band === 'high' || p.runtime_result.confidence_band === 'medium')
  ).length;

  const pass =
    behaviorCorrectCount >= 18 &&
    bluffHighCount <= 3 &&
    candidateBrokenCount <= 4 &&
    trustworthyCount >= 18 &&
    routeActionMatchCount >= 20 &&
    cautionCasesCorrectCount >= 8 &&
    lowSignalOrContradictionOverbluffCount === 0;

  return {
    total_cases: packets.length,
    behavior_correct_count: behaviorCorrectCount,
    bluff_high_count: bluffHighCount,
    candidate_broken_count: candidateBrokenCount,
    trustworthiness_trustworthy_count: trustworthyCount,
    route_action_match_count: routeActionMatchCount,
    caution_cases_correct_count: cautionCasesCorrectCount,
    low_signal_or_contradiction_overbluff_count: lowSignalOrContradictionOverbluffCount,
    pass,
  };
}

function buildMarkdown(packets: EdgeCasePacket[], aggregate: AggregateSummary): string {
  const byClass = {
    low_signal: packets.filter((p) => p.case_class === 'low_signal').length,
    contradiction: packets.filter((p) => p.case_class === 'contradiction').length,
    format_weirdness: packets.filter((p) => p.case_class === 'format_weirdness').length,
    polished_empty: packets.filter((p) => p.case_class === 'polished_empty').length,
    overloaded: packets.filter((p) => p.case_class === 'overloaded').length,
  };

  const bluffRiskCases = packets.filter((p) => p.edge_case_audit.bluff_risk === 'high');
  const brokenCandidateCases = packets.filter(
    (p) => p.edge_case_audit.candidate_fairness_under_edge_input === 'broken'
  );
  const misframedCases = packets.filter((p) => p.edge_case_audit.did_system_misframe_story);
  const cautionMisses = packets.filter((p) => !p.edge_case_audit.route_matches_correct_action);
  const cautionTargetCount = EDGE_CASES.filter((c) => c.cautionRequired).length;
  const remediationCounts = {
    candidate_generation_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('candidate_generation_failure')).length,
    clarification_quality_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('clarification_quality_failure')).length,
    trust_output_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('trust_output_failure')).length,
    fallback_behavior_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('fallback_behavior_failure')).length,
    axis_collision_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('axis_collision_failure')).length,
  };

  return [
    '# NDS_EDGE_CASE_BREAKER_RESULTS_V1',
    '',
    '## Protocol purpose',
    '',
    'Deliberately stress NDS with messy, weak, contradictory, malformed, polished-empty, and overloaded inputs to surface hidden failure modes before launch.',
    '',
    '## Case inventory by class',
    '',
    `- low_signal: ${byClass.low_signal}`,
    `- contradiction: ${byClass.contradiction}`,
    `- format_weirdness: ${byClass.format_weirdness}`,
    `- polished_empty: ${byClass.polished_empty}`,
    `- overloaded: ${byClass.overloaded}`,
    `- total: ${packets.length}`,
    '',
    '## Aggregate pass/fail summary',
    '',
    `- behavior_correctness correct: ${aggregate.behavior_correct_count}/24 (${aggregate.behavior_correct_count >= 18 ? 'PASS' : 'FAIL'})`,
    `- bluff_risk high: ${aggregate.bluff_high_count}/24 (${aggregate.bluff_high_count <= 3 ? 'PASS' : 'FAIL'})`,
    `- candidate_fairness broken: ${aggregate.candidate_broken_count}/24 (${aggregate.candidate_broken_count <= 4 ? 'PASS' : 'FAIL'})`,
    `- output_trustworthiness trustworthy: ${aggregate.trustworthiness_trustworthy_count}/24 (${aggregate.trustworthiness_trustworthy_count >= 18 ? 'PASS' : 'FAIL'})`,
    `- matches correct_action_taken: ${aggregate.route_action_match_count}/24 (${aggregate.route_action_match_count >= 20 ? 'PASS' : 'FAIL'})`,
    `- caution cases (clarify/fail_closed) correctly handled: ${aggregate.caution_cases_correct_count}/${cautionTargetCount} (${aggregate.caution_cases_correct_count >= 8 ? 'PASS' : 'FAIL'})`,
    `- low_signal/contradiction overbluff count: ${aggregate.low_signal_or_contradiction_overbluff_count} (${aggregate.low_signal_or_contradiction_overbluff_count === 0 ? 'PASS' : 'FAIL'})`,
    '',
    `**OVERALL: ${aggregate.pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Bluff-risk cases',
    '',
    ...(bluffRiskCases.length === 0
      ? ['- None']
      : bluffRiskCases.map((c) => `- ${c.case_id} (${c.case_class}): route=${c.runtime_result.route_decision}, confidence=${c.runtime_result.confidence_band}`)),
    '',
    '## Broken-candidate cases',
    '',
    ...(brokenCandidateCases.length === 0
      ? ['- None']
      : brokenCandidateCases.map((c) => `- ${c.case_id} (${c.case_class})`)),
    '',
    '## Misframed-output cases',
    '',
    ...(misframedCases.length === 0
      ? ['- None']
      : misframedCases.map((c) => `- ${c.case_id}: selected_axis=${c.runtime_result.selected_axis_family}, line="${c.runtime_result.selected_direction_line}"`)),
    '',
    '## Clarification/fail-closed misses',
    '',
    ...(cautionMisses.length === 0
      ? ['- None']
      : cautionMisses.map((c) => `- ${c.case_id}: expected=${c.edge_case_audit.correct_action_taken}, got route=${c.runtime_result.route_decision}, confidence=${c.runtime_result.confidence_band}`)),
    '',
    '## Failure buckets by subsystem focus',
    '',
    `- candidate_generation_failure: ${remediationCounts.candidate_generation_failure}`,
    `- clarification_quality_failure: ${remediationCounts.clarification_quality_failure}`,
    `- trust_output_failure: ${remediationCounts.trust_output_failure}`,
    `- fallback_behavior_failure: ${remediationCounts.fallback_behavior_failure}`,
    `- axis_collision_failure: ${remediationCounts.axis_collision_failure}`,
    '',
    '## Remediation recommendations',
    '',
    '- For high bluff-risk cases: lower confidence ceiling when signal quality is thin/contradictory even if lexical confidence markers are present.',
    '- For broken-candidate cases: harden candidate de-duplication and malformed-input normalization before family-specific generation.',
    '- For misframed outputs: tighten axis-family routing by requiring stronger evidence-anchor overlap with selected direction line.',
    '- For clarification misses: bias to ask-question route when close margins and unresolved story collisions coexist.',
    '- Re-run this breaker protocol after each scorer/routing/explanation patch before rollout expansion.',
    '',
  ].join('\n');
}

function renderPacket(packet: EdgeCasePacket): string {
  const candidatesSection = packet.candidates
    .map(
      (c) =>
        `- candidate_id: ${c.candidate_id}\n` +
        `  direction_line: ${c.direction_line}\n` +
        `  direction_summary: ${c.direction_summary}\n` +
        `  total_score: ${c.total_score.toFixed(3)}\n` +
        `  validator_flags: ${JSON.stringify(c.validator_flags)}`
    )
    .join('\n');

  const evidenceSection = packet.selected_output_quality.selected_evidence_items
    .map((e, i) => `${i + 1}. "${e.text}"\n   note: ${e.note}`)
    .join('\n');

  return [
    `CASE_ID: ${packet.case_id}`,
    `TITLE: ${packet.title}`,
    `CASE_CLASS: ${packet.case_class}`,
    `EXPECTED_BEHAVIOR: ${packet.expected_behavior}`,
    '',
    'RAW_INPUT:',
    packet.raw_input,
    '',
    'RUNTIME_RESULT:',
    `- status: ${packet.runtime_result.status}`,
    `- selected_candidate_id: ${packet.runtime_result.selected_candidate_id}`,
    `- selected_axis_family: ${packet.runtime_result.selected_axis_family}`,
    `- direction_line: ${packet.runtime_result.selected_direction_line}`,
    `- confidence_band: ${packet.runtime_result.confidence_band}`,
    `- route_decision: ${packet.runtime_result.route_decision}`,
    `- route_decision_reasons: ${packet.runtime_result.route_decision_reasons.join(', ') || 'none'}`,
    `- top_score: ${packet.runtime_result.top_score.toFixed(3)}`,
    `- runner_up_score: ${packet.runtime_result.runner_up_score.toFixed(3)}`,
    `- score_margin: ${packet.runtime_result.score_margin.toFixed(3)}`,
    '',
    'CANDIDATES:',
    candidatesSection || '(none)',
    '',
    'SELECTED_EXPLANATION:',
    packet.selected_output_quality.selected_explanation || '(none)',
    '',
    'SELECTED_EVIDENCE:',
    evidenceSection || '(none)',
    '',
    'DEBUG_FIELDS:',
    `- selected_vs_runner_up_score_breakdown: ${JSON.stringify(packet.debug_fields.selected_vs_runner_up_score_breakdown)}`,
    `- extracted_semantic_anchors: ${JSON.stringify(packet.debug_fields.extracted_semantic_anchors)}`,
    `- fallback_evidence_used: ${packet.selected_output_quality.fallback_evidence_used}`,
    `- fallback_explanation_language_used: ${packet.selected_output_quality.fallback_explanation_language_used}`,
    `- scoring_debug_selected_axis_family: ${packet.debug_fields.scoring_debug_selected_axis_family ?? 'n/a'}`,
    '',
    'EDGE_CASE_AUDIT:',
    `- behavior_correctness: ${packet.edge_case_audit.behavior_correctness}`,
    `- bluff_risk: ${packet.edge_case_audit.bluff_risk}`,
    `- candidate_fairness_under_edge_input: ${packet.edge_case_audit.candidate_fairness_under_edge_input}`,
    `- output_trustworthiness: ${packet.edge_case_audit.output_trustworthiness}`,
    `- correct_action_taken: ${packet.edge_case_audit.correct_action_taken}`,
    `- reviewer_notes: ${packet.edge_case_audit.reviewer_notes}`,
    `- candidate_failure_clusters: ${packet.edge_case_audit.candidate_failure_clusters.join(', ') || 'none'}`,
    `- remediation_buckets: ${packet.edge_case_audit.remediation_buckets.join(', ') || 'none'}`,
    `- pre_patch_outcome: ${packet.edge_case_audit.pre_patch_outcome ? JSON.stringify(packet.edge_case_audit.pre_patch_outcome) : 'n/a'}`,
    `- post_patch_outcome: ${packet.edge_case_audit.post_patch_outcome ? JSON.stringify(packet.edge_case_audit.post_patch_outcome) : 'n/a'}`,
    `- remaining_failure: ${packet.edge_case_audit.remaining_failure ?? 'none'}`,
  ].join('\n');
}

async function run(): Promise<void> {
  const previousArtifact = fs.existsSync(OUTPUT_JSON)
    ? (JSON.parse(fs.readFileSync(OUTPUT_JSON, 'utf8')) as {
        packets?: Array<{
          case_id: string;
          runtime_result?: { route_decision?: string };
          edge_case_audit?: {
            candidate_fairness_under_edge_input?: CandidateFairness;
            output_trustworthiness?: OutputTrustworthiness;
          };
        }>;
      })
    : null;
  const previousByCase = new Map(
    (previousArtifact?.packets ?? []).map((packet) => [packet.case_id, packet])
  );

  const packets: EdgeCasePacket[] = [];

  for (const caseDef of EDGE_CASES) {
    const packet = await runCase(caseDef);
    const previous = previousByCase.get(caseDef.id);
    if (previous) {
      packet.edge_case_audit.pre_patch_outcome = {
        route: String(previous.runtime_result?.route_decision ?? 'n/a'),
        candidate_quality:
          (previous.edge_case_audit?.candidate_fairness_under_edge_input as CandidateFairness | undefined) ?? 'degraded',
        trustworthiness:
          (previous.edge_case_audit?.output_trustworthiness as OutputTrustworthiness | undefined) ?? 'questionable',
      };
    }
    packets.push(packet);

    console.log(renderPacket(packet));
    console.log('\n' + '─'.repeat(88) + '\n');
  }

  const aggregate = computeAggregate(packets);
  const output = {
    protocol: 'NDS_EDGE_CASE_BREAKER_V1',
    generated_at: new Date().toISOString(),
    total_cases: EDGE_CASES.length,
    packets,
    aggregate,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(packets, aggregate));

  console.log('NDS_EDGE_CASE_BREAKER_V1');
  console.log(`  behavior_correct: ${aggregate.behavior_correct_count}/24`);
  console.log(`  bluff_high: ${aggregate.bluff_high_count}/24`);
  console.log(`  candidate_broken: ${aggregate.candidate_broken_count}/24`);
  console.log(`  trustworthy: ${aggregate.trustworthiness_trustworthy_count}/24`);
  console.log(`  route_action_match: ${aggregate.route_action_match_count}/24`);
  console.log(`  caution_cases_correct: ${aggregate.caution_cases_correct_count}/10`);
  console.log(`  low_signal_or_contradiction_overbluff: ${aggregate.low_signal_or_contradiction_overbluff_count}`);
  console.log(`  overall: ${aggregate.pass ? 'PASS' : 'FAIL'}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);

  if (!aggregate.pass) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
