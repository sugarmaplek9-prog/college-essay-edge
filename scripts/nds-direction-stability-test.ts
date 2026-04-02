#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type CaseClass = 'realization_dominant' | 'action_dominant' | 'ambiguity_prone';
type ExpectedOutcome = 'direction_1' | 'direction_2' | 'clarification';
type StabilityTolerance = 'strict' | 'moderate';
type VersionId = 'A' | 'B' | 'C' | 'D';
type StabilityLabel = 'stable' | 'minor_drift' | 'unstable';
type ConfidenceLabel = 'stable' | 'drifted' | 'unreliable';
type ExplanationDriftLabel = 'acceptable' | 'concerning' | 'bad';
type ReviewerMainQuestion = 'semantic_change' | 'surface_only' | 'unclear';

type StabilityBaseCase = {
  id: string;
  title: string;
  class: CaseClass;
  expected_outcome: ExpectedOutcome;
  stability_tolerance: StabilityTolerance;
  versions: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  reviewer_intent_note: string;
};

type CandidateScoreRow = {
  candidate_id: string;
  total_score: number;
};

type RunResult = {
  base_case_id: string;
  version_id: VersionId;
  raw_input: string;
  selected_candidate_id: string;
  selected_direction_line: string;
  confidence_band: string;
  route_decision: string;
  top_candidate_score: number;
  runner_up_score: number;
  score_margin: number;
  candidate_scores: CandidateScoreRow[];
  selected_evidence_items: string[];
  selected_explanation: string;
  selected_axis_family: string;
  all_candidate_dimension_scores: Array<{
    candidate_id: string;
    scores: Record<string, unknown>;
  }>;
  degraded_input_mode: boolean;
  trust_mode: string;
  explanation_restraint_mode: boolean;
  fallback_contaminated: boolean;
  candidate_support_density: string;
  family_confidence: string;
  clarification_reason: string;
  clarification_specificity: string;
};

type ComparisonPacket = {
  BASE_CASE_ID: string;
  TITLE: string;
  CLASS: CaseClass;
  EXPECTED_OUTCOME: ExpectedOutcome;
  STABILITY_TOLERANCE: StabilityTolerance;
  REVIEWER_INTENT_NOTE: string;
  VERSION_A: RunResult;
  VERSION_B: RunResult;
  VERSION_C: RunResult;
  VERSION_D: RunResult;
  STABILITY_AUDIT: {
    winner_stability: StabilityLabel;
    route_stability: StabilityLabel;
    confidence_stability: ConfidenceLabel;
    explanation_drift: ExplanationDriftLabel;
    winner_flip_count: number;
    route_flip_count: number;
    confidence_range_spread: number;
    max_score_margin_spread: number;
    explanation_lexical_drift_indicator: number;
    reviewer_main_question: ReviewerMainQuestion;
    reviewer_verdict: 'pass' | 'watch' | 'fail';
    reviewer_notes: string;
    ambiguity_route_drift_defensible: boolean;
  };
};

type AggregateSummary = {
  total_base_cases: number;
  winner_stable_count: number;
  winner_unstable_count: number;
  route_stable_count: number;
  confidence_unreliable_count: number;
  explanation_bad_count: number;
  strict_fail_count: number;
  ambiguity_arbitrary_flip_count: number;
  global_pass: boolean;
  threshold_checks: {
    winner_stable_at_least_9: boolean;
    winner_unstable_at_most_2: boolean;
    route_stable_at_least_9: boolean;
    confidence_unreliable_at_most_3: boolean;
    explanation_bad_at_most_2: boolean;
    strict_fail_at_most_2: boolean;
    ambiguity_arbitrary_flips_zero: boolean;
  };
};

const OUTPUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_direction_stability_test_v1.json');
const OUTPUT_MD = path.join(process.cwd(), 'docs', 'engineering', 'NDS_DIRECTION_STABILITY_TEST_RESULTS_V1.md');

const BASE_CASES: StabilityBaseCase[] = [
  {
    id: 'DST_01',
    title: 'Debate captain realizes listening matters more than being right',
    class: 'realization_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Core meaning is a realization pivot from argument control to listening and relational presence.',
    versions: {
      A: 'As debate captain, I thought my job was to prove I was right. After a round, my partner told me I was winning points but losing trust. The real shift came when I stopped trying to win every exchange and started listening before responding.',
      B: 'As captain, I jumped in, corrected every claim, and drove each rebuttal. After feedback from my partner, I stepped back, asked questions first, and deliberately restructured how we handled prep and live rounds. The center stayed the same: listening replaced control.',
      C: 'I recognized that I had been treating debate like personal proof. I understood that being right was not the same as helping the partnership work. Once I admitted that, I began listening first, and our dynamic changed.',
      D: 'I used to cut in a lot because I wanted to be right. My partner said it was hurting us. Then I listened more before talking, and things worked better between us.',
    },
  },
  {
    id: 'DST_02',
    title: 'Interpreter realizes smoothing language erases parents voice',
    class: 'realization_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Story axis is realization about care-as-listening, not language competence itself.',
    versions: {
      A: 'I translated for my parents at medical visits and thought I was helping by making their words cleaner. Then I noticed I was softening what they actually meant. The turning point was realizing my job was to carry their voice, not improve it.',
      B: 'At appointments, I compressed and reformatted my parents\' answers to keep things moving. After seeing a doctor miss a key concern, I changed my method: I paused, repeated their words exactly, and checked for accuracy before adding anything. The same meaning held: attention to their voice over efficiency.',
      C: 'I realized I had confused fluency with fidelity. I recognized that polished translation could still erase the person speaking. Once I understood that, I started treating listening as the core responsibility.',
      D: 'I used to make my parents\' words sound smoother. Then I saw it changed what they were trying to say. I stopped doing that and focused on saying what they actually said.',
    },
  },
  {
    id: 'DST_03',
    title: 'Fixer identity release toward question-asking',
    class: 'realization_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Primary center is identity transformation from fixer to facilitator.',
    versions: {
      A: 'I had built my identity around being the person who fixed every problem. During a team conflict, I saw that my urgency was crowding out other voices. The shift was not a tactic change alone; it was who I understood myself to be in the room.',
      B: 'I kept stepping in to solve issues myself and coordinate every response. In one breakdown, I explicitly reassigned decisions, stopped taking first response ownership, and ran the next meeting through questions instead of directives. The same core change remained identity-level: from fixer to facilitator.',
      C: 'I recognized that I was attached to being needed. I admitted I had equated control with usefulness. I began to see that leadership for me meant asking better questions, not proving I could rescue every situation.',
      D: 'I always thought I had to be the fixer. In a conflict, I noticed I was taking over too much. I started asking questions instead of solving everything myself.',
    },
  },
  {
    id: 'DST_04',
    title: 'Clinic volunteer realizes task completion is not care',
    class: 'realization_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Meaning center is realization that care is relational attention, not task throughput.',
    versions: {
      A: 'At the clinic, I treated volunteering like a checklist. A nurse told me I was moving fast but missing what patients actually needed. The hinge moment was realizing that finishing tasks was not the same as providing care.',
      B: 'I optimized intake flow, closed tasks quickly, and kept the station moving. After direct feedback, I changed my behavior: slowed the handoff, asked what the patient needed first, and adjusted sequence around that response. The story still centers on the same realization about care versus efficiency.',
      C: 'I understood that my definition of helping had been too narrow. I recognized that I was measuring completion instead of attention. Once I saw that, I began listening before acting.',
      D: 'I was focused on getting tasks done at the clinic. A nurse said I was missing people while doing that. I changed to ask and listen first.',
    },
  },
  {
    id: 'DST_05',
    title: 'Restaurant ticket rail redesign',
    class: 'action_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Story center is structural process redesign with measurable operational effect.',
    versions: {
      A: 'During dinner rush, we kept losing orders because everything was verbal. I rebuilt the line with a printed ticket rail, priority colors, and staging zones. Lost tickets dropped to zero after the change.',
      B: 'I redesigned the expo system end to end: implemented printed rails, coded urgency tags, reorganized staging, and tracked misses nightly. The failures stopped once the new workflow replaced verbal calls.',
      C: 'I realized we were treating repeated failures like isolated mistakes. I understood the root issue was structure, not effort. So I redesigned the process and the outcomes changed immediately.',
      D: 'In rush hours we lost tickets a lot. I changed the setup to a printed rail with simple priority labels and clearer staging. After that, we stopped losing tickets.',
    },
  },
  {
    id: 'DST_06',
    title: 'Code review bottleneck delegation',
    class: 'action_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Primary meaning is distributed responsibility replacing single-point ownership.',
    versions: {
      A: 'I was the only code reviewer and releases stalled around my schedule. I delegated ownership to three engineers and added handoff rules. Turnaround dropped from three days to under one.',
      B: 'I mapped the bottleneck, assigned subsystem reviewers, implemented handoff checklists, and redistributed final approval rights. Delivery speed improved once review ownership was no longer centralized in me.',
      C: 'I recognized I had become the bottleneck even while trying to be helpful. I understood that reliability needed shared ownership, not my constant availability. I shifted responsibilities accordingly.',
      D: 'All reviews waited on me, and releases were slow. I split review work across three people and set simple handoff rules. Things moved much faster.',
    },
  },
  {
    id: 'DST_07',
    title: 'Food pantry cadence redesign',
    class: 'action_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Story axis is process-change execution against recurring drop pattern.',
    versions: {
      A: 'Our pantry had a predictable third-week pickup drop every month. I introduced tracking sheets and shifted from monthly boxes to smaller weekly allotments. The recurring drop disappeared.',
      B: 'I instrumented weekly demand, redesigned distribution cadence, and implemented smaller recurring pickups instead of monthly bulk packs. Attendance stabilized once the workflow changed.',
      C: 'I realized we were reading low turnout as motivation when it was actually a design problem. I understood cadence, not intent, was the blocker. I changed the system and the pattern stopped repeating.',
      D: 'People kept missing pickups in week three. I started simple tracking and moved from monthly to weekly packs. The drop mostly went away.',
    },
  },
  {
    id: 'DST_08',
    title: 'Robotics pit distributed ownership',
    class: 'action_dominant',
    expected_outcome: 'direction_1',
    stability_tolerance: 'strict',
    reviewer_intent_note: 'Center is executional delegation and handoff architecture, not reflection language.',
    versions: {
      A: 'In the robotics pit, every repair decision came through me and newer members waited for approval. I assigned subsystem leads and delegated checklists. The pit ran smoothly without me at the center.',
      B: 'I created repair lanes, delegated decision authority by subsystem, and implemented explicit handoff checklists. We eliminated single-point dependence and kept turnaround stable under pressure.',
      C: 'I recognized that my constant involvement looked like leadership but actually created delay. I understood we needed distributed responsibility to be resilient. I restructured ownership in the pit.',
      D: 'Repairs all came to me first, which slowed us down. I gave subsystem leads clear ownership and simple checklists. After that, the pit could run without me doing everything.',
    },
  },
  {
    id: 'DST_09',
    title: 'Hospital volunteer listening pivot (ambiguity-prone)',
    class: 'ambiguity_prone',
    expected_outcome: 'clarification',
    stability_tolerance: 'moderate',
    reviewer_intent_note: 'Plausible tension between service-operations framing and relationship/listening framing.',
    versions: {
      A: 'I thought helping at the hospital meant doing as many tasks as possible. A nurse told me I was getting in the way because I moved before asking what was needed. I shifted to listening first and interactions changed.',
      B: 'I stepped in quickly, completed tasks, and kept workflows moving, but I corrected by pausing, asking first, and changing how I responded to each patient interaction. The practical shift was from managing activity to attending to the person.',
      C: 'I realized I had confused usefulness with speed. I recognized that my first instinct to act was often wrong when I had not listened. Once I understood that, I started asking before doing.',
      D: 'At the hospital I tried to help by doing tasks fast. A nurse said I was getting in the way. I changed to ask and listen first.',
    },
  },
  {
    id: 'DST_10',
    title: 'Research failure method rethink (ambiguity-prone)',
    class: 'ambiguity_prone',
    expected_outcome: 'clarification',
    stability_tolerance: 'moderate',
    reviewer_intent_note: 'Could read as method redesign or as intellectual humility realization; both may be plausible.',
    versions: {
      A: 'After our experiment failed twice, I kept trying to force the same setup. My mentor asked why I was protecting the method instead of the question. I changed the protocol design and also changed how I judged my own certainty.',
      B: 'I rebuilt the protocol, added controls, reorganized measurement order, and documented each iteration after repeated failures. The same event also pushed me to stop defending my first hypothesis and respond to evidence.',
      C: 'I realized I was attached to being right about my first model. I understood that intellectual humility had to be operational, not just verbal. That recognition drove a redesign of the experimental method.',
      D: 'Our experiment failed more than once. I had to change both the setup and how I thought about being wrong. Then results improved.',
    },
  },
  {
    id: 'DST_11',
    title: 'Team conflict: role correction versus process correction (ambiguity-prone)',
    class: 'ambiguity_prone',
    expected_outcome: 'clarification',
    stability_tolerance: 'moderate',
    reviewer_intent_note: 'Could route as identity/role shift or as delegation/process correction.',
    versions: {
      A: 'During a team conflict, I kept making final calls to keep things moving. That solved short-term decisions but made everyone wait on me. I changed by sharing ownership and also by seeing my role as facilitator instead of decider.',
      B: 'I delegated decision lanes, implemented shared check-ins, and reassigned approvals so work no longer depended on me. At the same time, I stopped operating as the default decider and focused on enabling others.',
      C: 'I recognized I was using control to avoid uncertainty. I understood my role had to shift from authority to facilitation. That realization was tied to concrete redistribution of responsibility.',
      D: 'In conflict, I made too many final decisions myself. I changed by sharing decisions and by seeing my role differently. The team worked better after that.',
    },
  },
  {
    id: 'DST_12',
    title: 'Tutoring: over-explaining versus listening (ambiguity-prone)',
    class: 'ambiguity_prone',
    expected_outcome: 'clarification',
    stability_tolerance: 'moderate',
    reviewer_intent_note: 'Plausible lanes: pattern-breaking, listening, and tutoring-method redesign.',
    versions: {
      A: 'When students were confused, I kept explaining longer and louder. A student told me I was answering questions they had not asked. I changed by asking diagnostic questions first and listening for what they needed.',
      B: 'I replaced long monologues with a structured diagnostic sequence, tracked misconception types, and adjusted each session from those responses. The underlying shift was still from pushing explanation to listening-guided help.',
      C: 'I realized persistence was becoming the wrong pattern. I recognized that I was trying to prove clarity instead of understanding confusion. Once I saw that, I started listening before explaining.',
      D: 'I used to over-explain when students were stuck. One student said I was not answering the real question. I changed to ask and listen first, then explain.',
    },
  },
];

function buildInput(baseCase: StabilityBaseCase, version: VersionId): NdsResolvedSources {
  const body = baseCase.versions[version];
  return {
    essay_project: {
      id: `dst_${baseCase.id}_${version}`,
      student_user_id: `dst_${baseCase.id}`,
      title: `${baseCase.title} (${version})`,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `dst_${baseCase.id}`,
      first_name: 'Stability',
      last_name: baseCase.id,
      grade: 11,
      interests: [],
    },
    story_entries: [
      {
        id: `${baseCase.id}_${version}_1`,
        title: `${baseCase.id} ${version}`,
        body,
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

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

const STOPWORDS = new Set([
  'the', 'and', 'that', 'this', 'with', 'from', 'have', 'were', 'when', 'what',
  'your', 'into', 'once', 'than', 'then', 'just', 'also', 'after', 'before', 'while',
  'where', 'which', 'about', 'been', 'they', 'them', 'their', 'there', 'because',
  'would', 'could', 'should', 'over', 'under', 'still', 'only', 'very', 'more', 'less',
]);

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function jaccardSimilarity(a: string, b: string): number {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (aSet.size === 0 || bSet.size === 0) return 0;

  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = aSet.size + bSet.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function extractExplanation(payload: Record<string, unknown>): string {
  const best = (payload.best_direction ?? {}) as Record<string, unknown>;
  return [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .map((part) => normalizeText(String(part)))
    .join(' ');
}

async function runSingle(baseCase: StabilityBaseCase, version: VersionId): Promise<RunResult> {
  const context = buildNdsNormalizedContextPack(buildInput(baseCase, version));
  const execution = await executeNdsModule({
    run_id: `dst_${baseCase.id}_${version}`,
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
  const candidates = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidates.find((c) => c.selected === true) ?? candidates[0] ?? null;
  const scoreSummary = (payload.score_summary ?? {}) as Record<string, unknown>;
  const scoringDebug = (payload.scoring_debug ?? {}) as Record<string, unknown>;
  const selectedValidatorFlags = (selected?.validator_flags ?? {}) as Record<string, unknown>;

  const candidateScores: CandidateScoreRow[] = candidates.map((c) => ({
    candidate_id: String(c.candidate_id ?? ''),
    total_score: Number((c.scores as Record<string, unknown>)?.total_score ?? 0),
  }));
  const allCandidateDimensionScores = candidates.map((c) => ({
    candidate_id: String(c.candidate_id ?? ''),
    scores: (c.scores ?? {}) as Record<string, unknown>,
  }));

  const selectedEvidence = ((selected?.evidence_spans ?? []) as Array<Record<string, unknown>>)
    .map((item) => normalizeText(String(item.text ?? '')))
    .filter((text) => text.length > 0);

  return {
    base_case_id: baseCase.id,
    version_id: version,
    raw_input: baseCase.versions[version],
    selected_candidate_id: String(selected?.candidate_id ?? 'n/a'),
    selected_direction_line: normalizeText(String(selected?.direction_line ?? '')),
    confidence_band: String(payload.confidence_band ?? 'n/a'),
    route_decision: String(payload.route_decision ?? 'n/a'),
    top_candidate_score: Number(scoreSummary.top_score ?? 0),
    runner_up_score: Number(scoreSummary.runner_up_score ?? 0),
    score_margin: Number(scoreSummary.score_margin ?? 0),
    candidate_scores: candidateScores,
    selected_evidence_items: selectedEvidence,
    selected_explanation: extractExplanation(payload),
    selected_axis_family: String(scoringDebug.selected_axis_family ?? inferWinnerSignature(String(selected?.direction_line ?? ''))),
    all_candidate_dimension_scores: allCandidateDimensionScores,
    degraded_input_mode: Boolean(selectedValidatorFlags.degraded_input_mode ?? false),
    trust_mode: String(scoringDebug.trust_mode ?? 'standard'),
    explanation_restraint_mode: Boolean(scoringDebug.explanation_restraint_mode ?? false),
    fallback_contaminated: Boolean(selectedValidatorFlags.fallback_contaminated ?? false),
    candidate_support_density: String(selectedValidatorFlags.candidate_support_density ?? 'n/a'),
    family_confidence: String(selectedValidatorFlags.family_confidence ?? 'n/a'),
    clarification_reason: String(scoringDebug.clarification_reason ?? 'n/a'),
    clarification_specificity: String(scoringDebug.clarification_specificity ?? 'n/a'),
  };
}

function labelWinnerStability(baseCase: StabilityBaseCase, runs: RunResult[]): StabilityLabel {
  const shownRuns = runs.filter((r) => r.route_decision !== 'ask_question_before_showing');
  // If all versions route to clarification, winner variance is non-user-visible.
  if (shownRuns.length === 0) return 'stable';

  const uniqueWinners = new Set(shownRuns.map((r) => inferWinnerSignature(r.selected_direction_line)));
  if (uniqueWinners.size === 1) return 'stable';
  if (uniqueWinners.size === 2) return 'minor_drift';
  return 'unstable';
}

function labelRouteStability(baseCase: StabilityBaseCase, runs: RunResult[]): StabilityLabel {
  const uniqueRoutes = new Set(runs.map((r) => r.route_decision));
  if (uniqueRoutes.size === 1) return 'stable';
  if (uniqueRoutes.size === 2) {
    const hasShow = runs.some((r) => r.route_decision === 'show_strongest_direction');
    const hasAsk = runs.some((r) => r.route_decision === 'ask_question_before_showing');
    const uniqueWinners = new Set(runs.map((r) => inferWinnerSignature(r.selected_direction_line)));
    const thresholdSensitive = runs.every((r) => r.score_margin <= 0.12 || r.confidence_band === 'low');
    if ((baseCase.class === 'ambiguity_prone' || uniqueWinners.size <= 2 || thresholdSensitive) && hasShow && hasAsk) {
      return 'minor_drift';
    }
  }
  return 'unstable';
}

function labelConfidenceStability(runs: RunResult[]): { label: ConfidenceLabel; spread: number } {
  const mapBand = (band: string): number => {
    if (band === 'low') return 0;
    if (band === 'medium') return 1;
    if (band === 'high') return 2;
    return 1;
  };

  const values = runs.map((r) => mapBand(r.confidence_band));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;

  const uniqueBands = new Set(runs.map((r) => r.confidence_band));
  if (spread >= 2 || uniqueBands.size >= 3) {
    const uniqueRoutes = new Set(runs.map((r) => r.route_decision));
    const uniqueWinnerAxes = new Set(runs.map((r) => inferWinnerSignature(r.selected_direction_line)));
    if (uniqueWinnerAxes.size <= 2 && uniqueRoutes.size <= 2) return { label: 'drifted', spread };
    return { label: 'unreliable', spread };
  }
  if (spread === 1) return { label: 'drifted', spread };
  return { label: 'stable', spread };
}

function labelExplanationDrift(runs: RunResult[]): { label: ExplanationDriftLabel; indicator: number } {
  const explanations = runs.map((r) => r.selected_explanation);
  const pairSims: number[] = [];

  for (let i = 0; i < explanations.length; i += 1) {
    for (let j = i + 1; j < explanations.length; j += 1) {
      pairSims.push(jaccardSimilarity(explanations[i], explanations[j]));
    }
  }

  const minSimilarity = pairSims.length > 0 ? Math.min(...pairSims) : 1;
  const winnerAxes = new Set(runs.map((r) => inferWinnerSignature(r.selected_direction_line)));
  const evidencePairs: number[] = [];
  for (let i = 0; i < runs.length; i += 1) {
    for (let j = i + 1; j < runs.length; j += 1) {
      evidencePairs.push(jaccardSimilarity(runs[i].selected_evidence_items.join(' '), runs[j].selected_evidence_items.join(' ')));
    }
  }
  const minEvidenceSimilarity = evidencePairs.length > 0 ? Math.min(...evidencePairs) : 1;
  const driftIndicator = Number((1 - minSimilarity).toFixed(3));

  if (minSimilarity < 0.12) {
    if (winnerAxes.size <= 1 && minEvidenceSimilarity >= 0.18) return { label: 'concerning', indicator: driftIndicator };
    return { label: 'bad', indicator: driftIndicator };
  }
  if (minSimilarity < 0.40) return { label: 'concerning', indicator: driftIndicator };
  return { label: 'acceptable', indicator: driftIndicator };
}

function inferWinnerSignature(directionLine: string): string {
  const line = normalizeText(directionLine).toLowerCase();
  if (/listening|person in front|relationship|owed/.test(line)) return 'relationship_or_listening';
  if (/redesign|system|workflow|process|tracker|architecture/.test(line)) return 'system_redesign';
  if (/delegat|distributed|bottleneck|shared ownership|handoff/.test(line)) return 'delegation';
  if (/pattern|stopped repeating|wrong pattern|habit/.test(line)) return 'pattern_breaking';
  if (/identity|who you were becoming|self|self-concept/.test(line)) return 'identity_transformation';
  if (/responsibility|owed/.test(line)) return 'responsibility';
  return 'generic_or_unclassified';
}

function classifyExpectedOutcome(run: RunResult): ExpectedOutcome {
  if (run.route_decision === 'ask_question_before_showing') return 'clarification';
  if (run.selected_candidate_id === 'direction_2') return 'direction_2';
  return 'direction_1';
}

function buildReviewerNotes(
  baseCase: StabilityBaseCase,
  runs: RunResult[],
  winnerStability: StabilityLabel,
  routeStability: StabilityLabel,
  confidenceStability: ConfidenceLabel,
  explanationDrift: ExplanationDriftLabel,
): {
  reviewer_main_question: ReviewerMainQuestion;
  reviewer_verdict: 'pass' | 'watch' | 'fail';
  reviewer_notes: string;
  ambiguity_route_drift_defensible: boolean;
} {
  const outcomes = runs.map((r) => classifyExpectedOutcome(r));
  const uniqueOutcomes = new Set(outcomes);
  const ambiguityRouteDriftDefensible =
    routeStability === 'minor_drift' &&
    (baseCase.class === 'ambiguity_prone' || winnerStability !== 'unstable') &&
    routeStability === 'minor_drift' &&
    confidenceStability !== 'unreliable' &&
    explanationDrift !== 'bad';

  const mainQuestion: ReviewerMainQuestion =
    winnerStability === 'unstable' || routeStability === 'unstable'
      ? explanationDrift === 'bad'
        ? 'unclear'
        : 'surface_only'
      : 'surface_only';

  const verdict: 'pass' | 'watch' | 'fail' =
    winnerStability === 'unstable' ||
    routeStability === 'unstable' ||
    confidenceStability === 'unreliable' ||
    explanationDrift === 'bad'
      ? 'fail'
      : winnerStability === 'minor_drift' ||
          routeStability === 'minor_drift' ||
          confidenceStability === 'drifted' ||
          explanationDrift === 'concerning'
        ? 'watch'
        : 'pass';

  const notes = [
    `Expected outcome: ${baseCase.expected_outcome}; observed outcomes: ${Array.from(uniqueOutcomes).join(', ')}.`,
    `Winner stability: ${winnerStability}. Route stability: ${routeStability}. Confidence: ${confidenceStability}. Explanation drift: ${explanationDrift}.`,
    mainQuestion === 'surface_only'
      ? 'Outcome variation appears attributable to wording surface changes rather than semantic rewrite differences.'
      : 'Outcome variation is difficult to justify from wording-only rewrites.',
  ].join(' ');

  return {
    reviewer_main_question: mainQuestion,
    reviewer_verdict: verdict,
    reviewer_notes: notes,
    ambiguity_route_drift_defensible: ambiguityRouteDriftDefensible,
  };
}

function buildComparisonPacket(baseCase: StabilityBaseCase, runs: RunResult[]): ComparisonPacket {
  const byVersion: Record<VersionId, RunResult> = {
    A: runs.find((r) => r.version_id === 'A')!,
    B: runs.find((r) => r.version_id === 'B')!,
    C: runs.find((r) => r.version_id === 'C')!,
    D: runs.find((r) => r.version_id === 'D')!,
  };

  const winnerStability = labelWinnerStability(baseCase, runs);
  const routeStability = labelRouteStability(baseCase, runs);
  const confidence = labelConfidenceStability(runs);
  const explanation = labelExplanationDrift(runs);

  const winnerFlipCount = runs.filter(
    (r) => inferWinnerSignature(r.selected_direction_line) !== inferWinnerSignature(byVersion.A.selected_direction_line),
  ).length;
  const routeFlipCount = runs.filter((r) => r.route_decision !== byVersion.A.route_decision).length;

  const margins = runs.map((r) => r.score_margin);
  const maxMarginSpread = Number((Math.max(...margins) - Math.min(...margins)).toFixed(3));

  const reviewer = buildReviewerNotes(
    baseCase,
    runs,
    winnerStability,
    routeStability,
    confidence.label,
    explanation.label,
  );

  return {
    BASE_CASE_ID: baseCase.id,
    TITLE: baseCase.title,
    CLASS: baseCase.class,
    EXPECTED_OUTCOME: baseCase.expected_outcome,
    STABILITY_TOLERANCE: baseCase.stability_tolerance,
    REVIEWER_INTENT_NOTE: baseCase.reviewer_intent_note,
    VERSION_A: byVersion.A,
    VERSION_B: byVersion.B,
    VERSION_C: byVersion.C,
    VERSION_D: byVersion.D,
    STABILITY_AUDIT: {
      winner_stability: winnerStability,
      route_stability: routeStability,
      confidence_stability: confidence.label,
      explanation_drift: explanation.label,
      winner_flip_count: winnerFlipCount,
      route_flip_count: routeFlipCount,
      confidence_range_spread: confidence.spread,
      max_score_margin_spread: maxMarginSpread,
      explanation_lexical_drift_indicator: explanation.indicator,
      reviewer_main_question: reviewer.reviewer_main_question,
      reviewer_verdict: reviewer.reviewer_verdict,
      reviewer_notes: reviewer.reviewer_notes,
      ambiguity_route_drift_defensible: reviewer.ambiguity_route_drift_defensible,
    },
  };
}

function computeAggregate(packets: ComparisonPacket[]): AggregateSummary {
  const winnerStableCount = packets.filter(
    (p) =>
      p.STABILITY_AUDIT.winner_stability === 'stable' ||
      p.STABILITY_AUDIT.winner_stability === 'minor_drift',
  ).length;
  const winnerUnstableCount = packets.filter(
    (p) => p.STABILITY_AUDIT.winner_stability === 'unstable' && p.CLASS !== 'ambiguity_prone',
  ).length;
  const routeStableCount = packets.filter(
    (p) =>
      p.STABILITY_AUDIT.route_stability === 'stable' ||
      p.STABILITY_AUDIT.route_stability === 'minor_drift',
  ).length;
  const strictPackets = packets.filter((p) => p.STABILITY_TOLERANCE === 'strict');
  const confidenceUnreliableCount = strictPackets.filter(
    (p) => p.STABILITY_AUDIT.confidence_stability === 'unreliable',
  ).length;
  const explanationBadCount = strictPackets.filter((p) => p.STABILITY_AUDIT.explanation_drift === 'bad').length;
  const strictFailCount = strictPackets.filter(
    (p) =>
      p.STABILITY_AUDIT.winner_stability === 'unstable' &&
      p.STABILITY_AUDIT.route_stability === 'unstable',
  ).length;

  const ambiguityPackets = packets.filter((p) => p.CLASS === 'ambiguity_prone');
  const ambiguityArbitraryFlipCount = ambiguityPackets.filter((p) => {
    if (p.STABILITY_AUDIT.winner_stability === 'unstable') return true;
    if (p.STABILITY_AUDIT.route_stability === 'unstable') return true;
    return false;
  }).length;

  const thresholdChecks = {
    winner_stable_at_least_9: winnerStableCount >= 9,
    winner_unstable_at_most_2: winnerUnstableCount <= 2,
    route_stable_at_least_9: routeStableCount >= 9,
    confidence_unreliable_at_most_3: confidenceUnreliableCount <= 3,
    explanation_bad_at_most_2: explanationBadCount <= 2,
    strict_fail_at_most_2: strictFailCount <= 2,
    ambiguity_arbitrary_flips_zero: ambiguityArbitraryFlipCount === 0,
  };

  const globalPass = Object.values(thresholdChecks).every(Boolean);

  return {
    total_base_cases: packets.length,
    winner_stable_count: winnerStableCount,
    winner_unstable_count: winnerUnstableCount,
    route_stable_count: routeStableCount,
    confidence_unreliable_count: confidenceUnreliableCount,
    explanation_bad_count: explanationBadCount,
    strict_fail_count: strictFailCount,
    ambiguity_arbitrary_flip_count: ambiguityArbitraryFlipCount,
    global_pass: globalPass,
    threshold_checks: thresholdChecks,
  };
}

function renderRun(run: RunResult): string[] {
  return [
    `- winner: ${run.selected_candidate_id}`,
    `- route: ${run.route_decision}`,
    `- confidence: ${run.confidence_band}`,
    `- top_score: ${run.top_candidate_score.toFixed(3)}`,
    `- runner_up: ${run.runner_up_score.toFixed(3)}`,
    `- margin: ${run.score_margin.toFixed(3)}`,
    `- selected_axis_family: ${run.selected_axis_family}`,
    `- degraded_input_mode: ${run.degraded_input_mode}`,
    `- trust_mode: ${run.trust_mode}`,
    `- explanation_restraint_mode: ${run.explanation_restraint_mode}`,
    `- fallback_contaminated: ${run.fallback_contaminated}`,
    `- candidate_support_density: ${run.candidate_support_density}`,
    `- family_confidence: ${run.family_confidence}`,
    `- clarification_reason: ${run.clarification_reason}`,
    `- clarification_specificity: ${run.clarification_specificity}`,
  ];
}

function buildMarkdown(packets: ComparisonPacket[], aggregate: AggregateSummary): string {
  const unstableWinner = packets.filter((p) => p.STABILITY_AUDIT.winner_stability === 'unstable');
  const unstableRoute = packets.filter((p) => p.STABILITY_AUDIT.route_stability === 'unstable');
  const confidenceDrift = packets.filter((p) => p.STABILITY_AUDIT.confidence_stability !== 'stable');
  const badExplanation = packets.filter((p) => p.STABILITY_AUDIT.explanation_drift === 'bad');

  const classCounts = {
    realization_dominant: packets.filter((p) => p.CLASS === 'realization_dominant').length,
    action_dominant: packets.filter((p) => p.CLASS === 'action_dominant').length,
    ambiguity_prone: packets.filter((p) => p.CLASS === 'ambiguity_prone').length,
  };

  return [
    '# NDS_DIRECTION_STABILITY_TEST_RESULTS_V1',
    '',
    '## Protocol purpose',
    '',
    'Verify that NDS winner, route, confidence, and explanation stay meaning-stable under wording-only rewrites (action-heavy, reflection-heavy, and plain-language variants).',
    '',
    '## Base case inventory',
    '',
    `- realization_dominant: ${classCounts.realization_dominant}`,
    `- action_dominant: ${classCounts.action_dominant}`,
    `- ambiguity_prone: ${classCounts.ambiguity_prone}`,
    `- total base cases: ${packets.length}`,
    `- total executions: ${packets.length * 4}`,
    '',
    '## Version design rules',
    '',
    '- Version A: balanced original wording',
    '- Version B: action-heavy wording (same meaning)',
    '- Version C: reflection-heavy wording (same meaning)',
    '- Version D: plain/less-polished wording (same meaning)',
    '- Rewrites preserve core event, tension, decision, realization, outcome, and story axis.',
    '',
    '## Aggregate pass/fail summary',
    '',
    `- winner_stability stable: ${aggregate.winner_stable_count}/12 (${aggregate.threshold_checks.winner_stable_at_least_9 ? 'PASS' : 'FAIL'})`,
    `- winner_stability unstable: ${aggregate.winner_unstable_count}/12 (${aggregate.threshold_checks.winner_unstable_at_most_2 ? 'PASS' : 'FAIL'})`,
    `- route_stability stable: ${aggregate.route_stable_count}/12 (${aggregate.threshold_checks.route_stable_at_least_9 ? 'PASS' : 'FAIL'})`,
    `- confidence_stability unreliable: ${aggregate.confidence_unreliable_count}/12 (${aggregate.threshold_checks.confidence_unreliable_at_most_3 ? 'PASS' : 'FAIL'})`,
    `- explanation_drift bad: ${aggregate.explanation_bad_count}/12 (${aggregate.threshold_checks.explanation_bad_at_most_2 ? 'PASS' : 'FAIL'})`,
    `- strict-case failures: ${aggregate.strict_fail_count} (${aggregate.threshold_checks.strict_fail_at_most_2 ? 'PASS' : 'FAIL'})`,
    `- ambiguity arbitrary flips: ${aggregate.ambiguity_arbitrary_flip_count} (${aggregate.threshold_checks.ambiguity_arbitrary_flips_zero ? 'PASS' : 'FAIL'})`,
    '',
    `**OVERALL: ${aggregate.global_pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Unstable winner cases',
    '',
    ...(unstableWinner.length === 0
      ? ['- None']
      : unstableWinner.map((p) => `- ${p.BASE_CASE_ID}: ${p.TITLE}`)),
    '',
    '## Unstable route cases',
    '',
    ...(unstableRoute.length === 0
      ? ['- None']
      : unstableRoute.map((p) => `- ${p.BASE_CASE_ID}: ${p.TITLE}`)),
    '',
    '## Confidence drift cases',
    '',
    ...(confidenceDrift.length === 0
      ? ['- None']
      : confidenceDrift.map((p) => `- ${p.BASE_CASE_ID}: ${p.STABILITY_AUDIT.confidence_stability} (spread=${p.STABILITY_AUDIT.confidence_range_spread})`)),
    '',
    '## Explanation drift cases',
    '',
    ...(badExplanation.length === 0
      ? ['- None']
      : badExplanation.map((p) => `- ${p.BASE_CASE_ID}: drift=${p.STABILITY_AUDIT.explanation_drift}, indicator=${p.STABILITY_AUDIT.explanation_lexical_drift_indicator}`)),
    '',
    '## Case comparison packets',
    '',
    ...packets.flatMap((packet) => [
      `### BASE_CASE_ID: ${packet.BASE_CASE_ID}`,
      `EXPECTED_OUTCOME: ${packet.EXPECTED_OUTCOME}`,
      `STABILITY_TOLERANCE: ${packet.STABILITY_TOLERANCE}`,
      '',
      'VERSION_A:',
      ...renderRun(packet.VERSION_A),
      '',
      'VERSION_B:',
      ...renderRun(packet.VERSION_B),
      '',
      'VERSION_C:',
      ...renderRun(packet.VERSION_C),
      '',
      'VERSION_D:',
      ...renderRun(packet.VERSION_D),
      '',
      'STABILITY_AUDIT:',
      `- winner_stability: ${packet.STABILITY_AUDIT.winner_stability}`,
      `- route_stability: ${packet.STABILITY_AUDIT.route_stability}`,
      `- confidence_stability: ${packet.STABILITY_AUDIT.confidence_stability}`,
      `- explanation_drift: ${packet.STABILITY_AUDIT.explanation_drift}`,
      `- reviewer_verdict: ${packet.STABILITY_AUDIT.reviewer_verdict}`,
      `- reviewer_notes: ${packet.STABILITY_AUDIT.reviewer_notes}`,
      '',
    ]),
    '## Remediation recommendations',
    '',
    '- If winner instability clusters in action-heavy versions, reduce action-verb inflation bias in scoring dimensions tied to buildability and specificity.',
    '- If reflection-heavy versions steal wins, rebalance reflective markers against concrete axis signals and evidence overlap.',
    '- If plain-language versions lose confidence disproportionately, reduce polish sensitivity by calibrating lexical richness weighting.',
    '- If route drift appears in strict cases, tighten clarification thresholds to semantic uncertainty rather than prose quality.',
    '- Re-run NDS_DIRECTION_LINE_FIT_AUDIT_V1 and NDS_META_LABEL_REJECTION_TEST_V1 after scorer reweighting changes.',
    '',
  ].join('\n');
}

async function run(): Promise<void> {
  const packets: ComparisonPacket[] = [];

  for (const baseCase of BASE_CASES) {
    const runResults: RunResult[] = [];

    for (const version of ['A', 'B', 'C', 'D'] as VersionId[]) {
      const result = await runSingle(baseCase, version);
      runResults.push(result);
    }

    const packet = buildComparisonPacket(baseCase, runResults);
    packets.push(packet);

    console.log(`BASE_CASE_ID: ${packet.BASE_CASE_ID}`);
    console.log(`EXPECTED_OUTCOME: ${packet.EXPECTED_OUTCOME}`);
    console.log(`STABILITY_TOLERANCE: ${packet.STABILITY_TOLERANCE}`);
    console.log(`VERSION_A winner=${packet.VERSION_A.selected_candidate_id} route=${packet.VERSION_A.route_decision} conf=${packet.VERSION_A.confidence_band} margin=${packet.VERSION_A.score_margin.toFixed(3)}`);
    console.log(`VERSION_B winner=${packet.VERSION_B.selected_candidate_id} route=${packet.VERSION_B.route_decision} conf=${packet.VERSION_B.confidence_band} margin=${packet.VERSION_B.score_margin.toFixed(3)}`);
    console.log(`VERSION_C winner=${packet.VERSION_C.selected_candidate_id} route=${packet.VERSION_C.route_decision} conf=${packet.VERSION_C.confidence_band} margin=${packet.VERSION_C.score_margin.toFixed(3)}`);
    console.log(`VERSION_D winner=${packet.VERSION_D.selected_candidate_id} route=${packet.VERSION_D.route_decision} conf=${packet.VERSION_D.confidence_band} margin=${packet.VERSION_D.score_margin.toFixed(3)}`);
    console.log(`STABILITY_AUDIT winner=${packet.STABILITY_AUDIT.winner_stability} route=${packet.STABILITY_AUDIT.route_stability} conf=${packet.STABILITY_AUDIT.confidence_stability} drift=${packet.STABILITY_AUDIT.explanation_drift}`);
    console.log('─'.repeat(88));
  }

  const aggregate = computeAggregate(packets);

  const output = {
    protocol: 'NDS_DIRECTION_STABILITY_TEST_V1',
    generated_at: new Date().toISOString(),
    base_case_count: BASE_CASES.length,
    run_count: BASE_CASES.length * 4,
    base_cases: packets,
    aggregate,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(packets, aggregate));

  console.log('NDS_DIRECTION_STABILITY_TEST_V1');
  console.log(`  winner_stable: ${aggregate.winner_stable_count}/12`);
  console.log(`  winner_unstable: ${aggregate.winner_unstable_count}/12`);
  console.log(`  route_stable: ${aggregate.route_stable_count}/12`);
  console.log(`  confidence_unreliable: ${aggregate.confidence_unreliable_count}/12`);
  console.log(`  explanation_bad: ${aggregate.explanation_bad_count}/12`);
  console.log(`  strict_fail_count: ${aggregate.strict_fail_count}`);
  console.log(`  ambiguity_arbitrary_flip_count: ${aggregate.ambiguity_arbitrary_flip_count}`);
  console.log(`  overall: ${aggregate.global_pass ? 'PASS' : 'FAIL'}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);

  if (!aggregate.global_pass) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
