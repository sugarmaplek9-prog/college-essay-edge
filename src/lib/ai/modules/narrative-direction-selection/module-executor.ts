import { NDS_DEFAULT_MODEL, NDS_DEFAULT_PROVIDER } from '@/lib/ai/constants';
import type {
  NdsCandidateScores,
  NdsCandidateValidatorFlags,
  NdsConfidenceBand,
  NdsPayload,
  NdsRejectedCandidate,
  NdsRouteDecision,
  NdsScoredCandidate,
  NdsModuleExecutionInput,
  NdsModuleExecutionOutput,
  NdsNormalizedContextPack,
} from '@/types/ai';
import { buildNdsPromptV1 } from './prompt-builder';

export const NDS_PROVIDER_PATH_CLASSIFICATION = 'deterministic_stub' as const;

export function getNdsProviderReadinessState():
  | 'production_ready'
  | 'internal_verification_only' {
  return NDS_PROVIDER_PATH_CLASSIFICATION === 'deterministic_stub'
    ? 'internal_verification_only'
    : 'production_ready';
}

export function assertNdsProviderProductionReadiness(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const readiness = getNdsProviderReadinessState();

  if (isProduction && readiness !== 'production_ready') {
    throw new Error('PROVIDER_PATH_NOT_PRODUCTION_READY');
  }
}

interface RuntimeCandidateSeed {
  candidate_id: string;
  kind:
    | 'primary'
    | 'competence'
    | 'responsibility'
    | 'generic'
    | 'system_redesign'
    | 'delegation_distributed_responsibility'
    | 'pattern_breaking'
    | 'identity_transformation'
    | 'relationship_or_listening';
  direction_line: string;
  direction_summary: string;
  core_tension: string;
  before_state: string;
  after_state: string;
  why_strong: string;
  risk_if_chosen: string;
  clarifying_question_if_uncertain: string;
  evidence_spans: Array<{
    text: string;
    start_char: number;
    end_char: number;
  }>;
  degraded_input_mode?: boolean;
  fallback_contaminated?: boolean;
  candidate_duplication_risk?: 'low' | 'medium' | 'high';
  candidate_support_density?: 'strong' | 'medium' | 'weak';
  family_confidence?: 'strong' | 'partial' | 'weak';
  hinge_supported?: boolean;
  hinge_sentence_overlap_count?: number;
  premium_tone_without_support?: boolean;
  false_premium_candidate_flag?: boolean;
  flat_line_risk?: boolean;
}

interface InputStressProfile {
  degraded_input_mode: boolean;
  low_signal: boolean;
  very_thin_signal: boolean;
  contradiction: boolean;
  format_weirdness: boolean;
  polished_empty: boolean;
  adult_shaped: boolean;
  cultural_indirect: boolean;
  achievement_stacked: boolean;
  overloaded_input: boolean;
  explicit_uncertainty: boolean;
  fallback_risk: boolean;
  actionable_signal_strength: 'strong' | 'medium' | 'weak';
}

interface RuntimeScoringResult {
  candidates: NdsScoredCandidate[];
  rejected_candidates: NdsRejectedCandidate[];
  selected_candidate_id: string | null;
  confidence_band: NdsConfidenceBand;
  route_decision: NdsRouteDecision;
  score_summary: {
    top_score: number;
    runner_up_score: number;
    score_margin: number;
  };
  clarifying_question: {
    question_text: string;
    linked_candidate_id: string;
    question_reason:
      | 'disambiguate_tension'
      | 'clarify_shift'
      | 'strengthen_scene'
      | 'resolve_candidate_tie'
      | 'missing_scene'
      | 'missing_reflection'
      | 'axis_collision'
      | 'two_competing_centers'
      | 'low_signal'
      | 'overloaded_input'
      | 'fallback_risk';
  } | null;
}

interface ExtractedAnchorCandidate {
  text: string;
  source_id: string | null;
  source_type: 'story_entry' | 'essay_draft_version';
  anchor_type: 'object' | 'person_or_relationship' | 'scene_detail' | 'tension' | 'phrase_fragment' | 'shift';
  source_index: number;
}

interface ExtractedHingeCandidate {
  text: string;
  source_id: string | null;
  source_type: 'story_entry' | 'essay_draft_version';
  source_index: number;
  hinge_relevance_score: number;
}

function buildDeterministicCandidate(
  context: NdsNormalizedContextPack,
  executionMode: NdsModuleExecutionInput['execution_mode']
): NdsPayload {
  const preStress = analyzeInputStress(context);
  if (executionMode === 'needs_more_input' || (context.story_signals.length === 0 && context.draft_signals.length === 0)) {
    return buildNeedsMoreInputPayload(
      'What is one specific moment where your role or self-understanding changed in front of other people?',
      preStress
    );
  }

  if (
    preStress.very_thin_signal &&
    !preStress.cultural_indirect &&
    !preStress.achievement_stacked &&
    preStress.actionable_signal_strength === 'weak'
  ) {
    return buildNeedsMoreInputPayload(
      'Name one concrete moment where your first approach failed, and one action you changed right after that.',
      preStress
    );
  }

  const top = context.story_signals[0] ?? null;
  const second = context.story_signals[1] ?? null;
  const third = context.story_signals[2] ?? null;

  const topDomain = top?.domain_signal?.situational_domain ?? 'other';
  const interpretiveOpportunity =
    top?.domain_signal?.interpretive_opportunity ??
    'Frame the essay around a specific behavior shift and what it reveals.';

  const domainFrame: Record<
    string,
    {
      angleTitle: string;
      coreClaim: string;
      realStory: string;
      studentReveal: string;
      whyBeatsObvious: string;
      obviousAngle: string;
      risk: string;
      nextMove: string;
      nextMoveConnector: string;
    }
  > = {
    debate_conflict: {
      angleTitle:
        'When being right in the argument became the problem',
      coreClaim:
        'Most debate essays prove argument skill. This one should show the moment skill became the problem — and what the student did once they stopped leading with it.',
      realStory:
        'The conflict itself is not the interesting part. The essay is about the moment feedback changed how the student was operating in the room.',
      studentReveal:
        'It shows that the student can absorb feedback in the middle of a conflict and change how they are handling it — without shutting down or digging in.',
      whyBeatsObvious:
        'An essay about argument skill stays at the surface. This version goes to the correction — a less obvious and more interesting story.',
      obviousAngle: 'leadership/communication traits without a real revision moment',
      risk:
        'If written too generally, this collapses into a teamwork essay instead of a scene-driven story about changed behavior.',
      nextMove:
        'Start with the moment feedback landed. Then write the next interaction where your behavior is visibly different. Cut everything that does not show the shift.',
      nextMoveConnector: 'Keep returning to',
    },
    community_care: {
      angleTitle:
        'The moment in clinic volunteering when tasks stopped being enough',
      coreClaim:
        'The volunteering itself is not the subject. The essay is the moment the student realized that doing the task correctly still was not helping — and had to figure out why.',
      realStory:
        'The clinic is not the subject. The essay is a specific moment when the student\'s approach to care was wrong — and they had to change it because another person\'s outcome depended on it.',
      studentReveal:
        'It shows that the student can notice when good intentions are not translating into actual help — and adjust before the other person carries the cost.',
      whyBeatsObvious:
        'A service essay describes what the student did and how it felt. This version goes to the moment understanding changed — a narrower and more specific story.',
      obviousAngle: 'service leadership framed as generic compassion',
      risk:
        'If written as values language without concrete moments, it will read as polished service branding rather than earned insight.',
      nextMove:
        'Build the draft around one interaction: first how you handled it, then what you changed. The essay is the gap between those two moments.',
      nextMoveConnector: "The essay\'s real center is",
    },
    peer_teaching: {
      angleTitle:
        'The tutoring session where the method stopped working',
      coreClaim:
        'The essay is not about tutoring well. It is about the moment the student\'s approach stopped working — and what they figured out once they paid attention to why.',
      realStory:
        'Tutoring without a failure in it is just content delivery. The essay is the gap between the explanation that did not work and the approach that did.',
      studentReveal:
        'It shows that the student noticed when their method was not working — and treated that as a problem to solve rather than a limitation of the other person.',
      whyBeatsObvious:
        'Academic support essays describe the helper. This one describes the moment the student realized they were wrong about what help looked like.',
      obviousAngle: 'academic leadership with generic growth language',
      risk:
        'If the essay stays at lesson-level description, it becomes instructional rather than personal and strategic.',
      nextMove:
        'Write the two sessions back to back: first where your approach missed, then where you adjusted and it worked. The essay is the distance between them.',
      nextMoveConnector: 'Keep it grounded in',
    },
    technical_leadership: {
      angleTitle:
        'When solving it alone started hurting the team',
      coreClaim:
        'The robotics project is the setting. The essay is about the moment the student\'s instinct — handling it alone — started costing the team. What changed after that is the real subject.',
      realStory:
        'The interesting part is not the technical work. It is the moment the student recognized that solving problems alone was making the team weaker — and changed how they operated.',
      studentReveal:
        'It shows that the student can recognize when their own competence is becoming a problem for others — and adjust without waiting to be asked.',
      whyBeatsObvious:
        'An achievement essay focuses on what got built. This version focuses on how the student\'s role in the team changed — a more specific and less predictable story.',
      obviousAngle: 'problem-solving excellence as a static trait',
      risk:
        'If written as an accomplishment sequence, it loses the pivot that makes the essay meaningful.',
      nextMove:
        'Keep the focus on the team moment, not the technical solution. Write the decision where your first approach was not working, then show what you changed and what it produced.',
      nextMoveConnector: 'The pivot point is',
    },
    research_failure: {
      angleTitle:
        'When failing the experiment changed how the student thinks',
      coreClaim:
        'This is not about the experiment failing. It is about how the student thought through the failure — what they changed in their method and why that was harder than the original work.',
      realStory:
        'Losing the competition is not the story. The essay is about the student who revised their methodology after feedback — not just their attitude after the loss.',
      studentReveal:
        'It shows that the student responds to failure by asking what went wrong in the method — not by reframing the outcome.',
      whyBeatsObvious:
        'A resilience essay describes the emotional arc of recovering. This version describes the reasoning inside it — a more precise and less common story.',
      obviousAngle: 'resilience story with generic bounce-back language',
      risk:
        'If the draft centers on winning or losing, the essay becomes predictable and misses the shift in how the student now approaches problems.',
      nextMove:
        'Do not start with the competition result. Start with the decision that did not hold up. Write what you changed after feedback, then show how that shift affects how you work now.',
      nextMoveConnector: 'Build the draft around',
    },
    service_operations: {
      angleTitle:
        'When moving fast caused the problem and the student had to adjust',
      coreClaim:
        'This is not about working hard under pressure. It is about the moment speed became the problem — and the student had to slow down and figure out what the situation actually needed.',
      realStory:
        'Getting through the work quickly is expected. The essay is the moment that approach caused a problem — and what the student did differently after that.',
      studentReveal:
        'It shows that the student can recognize when efficiency is making things worse — and shift from moving quickly to actually reading the situation.',
      whyBeatsObvious:
        'A work-ethic essay proves you show up and push through. This one asks what happened when pushing through was not enough — which is the more interesting question.',
      obviousAngle: 'hard-working responsibility narrative',
      risk:
        'If written as a workload summary, it reads like a résumé entry rather than a story about changed judgment.',
      nextMove:
        'Start with the moment your first approach made things harder. Write what you noticed, what you changed, and what the outcome was.',
      nextMoveConnector: 'Stay close to',
    },
    athletic_recovery: {
      angleTitle:
        'After the injury: finding a different way to contribute',
      coreClaim:
        'This is not an injury story. It is about how the student found a different way to matter to the team once performance was no longer available.',
      realStory:
        'The physical return is not the interesting part. The essay is the period before it — when the student had to figure out how to contribute without tying it to their own performance.',
      studentReveal:
        'It shows that the student can redefine what it means to participate in a team — moving from personal performance to something less focused on themselves.',
      whyBeatsObvious:
        'A perseverance essay centers on the comeback. This one centers on what changed in the student\'s understanding of participation before the comeback — a less common and more revealing version of the story.',
      obviousAngle: 'motivation and grit as abstract traits',
      risk:
        'If written as an inspirational arc, it will feel generic and the reader will not learn anything specific about how this student thinks.',
      nextMove:
        'Write the moment when your previous way of contributing was no longer available. Then write one scene after that — where you were participating in a different way.',
      nextMoveConnector: 'The underlying subject is',
    },
    other: {
      angleTitle:
        'The moment the student corrected course and what changed after',
      coreClaim:
        'Do not start with the accomplishment. Start at the moment the student recognized something was wrong and changed course — and stay close to what happened next.',
      realStory:
        'Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real.',
      studentReveal:
        'It shows a student who can identify where they got it wrong and demonstrate that the correction held.',
      whyBeatsObvious:
        'Leadership framing describes a trait. The correction angle shows one specific moment where judgment changed — which is more concrete and easier to believe.',
      obviousAngle: 'general leadership/growth framing',
      risk:
        'If the essay describes character without a concrete moment of correction, it loses the specificity that makes it work.',
      nextMove:
        'Write the moment you got it wrong. Then write the next moment where your corrected approach is visible. Keep only what proves the change was real.',
      nextMoveConnector: 'The anchor is',
    },
  };

  const selectedFrame = domainFrame[topDomain] ?? domainFrame.other;

  const tension =
    top && top.change_signal.toLowerCase().includes('clear reflection')
      ? 'The tension is between external performance and internal revision.'
      : 'The tension is between what happened and what it actually changed in you.';
  const shift =
    top && top.change_signal.toLowerCase().includes('clear reflection')
      ? 'A visible shift appears in how you responded after feedback.'
      : null;

  const alternatives: Array<Record<string, unknown>> = [];
  alternatives.push({
    id: 'direction_2',
    angle_title: 'Competence proof angle',
    what_this_angle_would_focus_on:
      second?.event_summary ?? 'Execution quality and accomplishment evidence in the same experience.',
    why_it_is_weaker:
      'It can show capability, but it underweights internal change and essay-level tension.',
    failure_mode: 'Can collapse into an activity summary without a deeper interpretive claim.',
  });

  if (executionMode === 'standard') {
    alternatives.push({
      id: 'direction_3',
      angle_title: 'Service / responsibility angle',
      what_this_angle_would_focus_on:
        third?.event_summary ?? second?.event_summary ?? 'How your actions affected other people and community outcomes.',
      why_it_is_weaker:
        'It carries moral seriousness, but the self-revision arc is less sharply evidenced than the winner.',
      failure_mode: 'Can become broad values prose if the turning moment is not dramatized.',
    });
  }

  const baseEvidenceSources: Array<Record<string, unknown>> = [];
  if (top) {
    baseEvidenceSources.push({
      label: 'Primary story evidence',
      source_type: 'story_entry',
      source_id: top.source_id,
    });
  }
  if (context.draft_signals.length > 0) {
    baseEvidenceSources.push({
      label: 'Draft trajectory signal',
      source_type: 'essay_draft_version',
      source_id: context.draft_signals[0].source_id,
    });
  }
  if (context.school_signals.length > 0) {
    baseEvidenceSources.push({
      label: 'School context constraint',
      source_type: 'school_context',
      source_id: context.school_signals[0].source_id,
    });
  }

  const interpretiveFocus = interpretiveOpportunity.startsWith('Frame the essay around ')
    ? interpretiveOpportunity.slice('Frame the essay around '.length)
    : interpretiveOpportunity;

  const inputStress = preStress;
  const indirectHingeSentences = extractIndirectHingeSentences(context);
  const hasIndirectHinge = indirectHingeSentences.length > 0;
  const extractedAnchorCandidates = extractAnchorCandidatesFromContext(context);
  const extractedHingeCandidates = extractHingeCandidatesFromContext(context);

  const seeds = buildRuntimeCandidateSeeds({
    context,
    executionMode,
    inputStress,
    selectedFrame,
    interpretiveFocus,
    top,
    second,
    third,
    tension,
    hingeSentences: indirectHingeSentences,
  });

  const scoring = scoreRuntimeCandidates(seeds, executionMode, inputStress);

  // ── Post-scoring routing overrides ───────────────────────────────────────
  // A. Explicit-uncertainty override: student text signals unresolved choice →
  //    force clarification unless the score margin is overwhelming (≥ 0.25).
  // B. Fallback-evidence confidence cap: winner evidence contains system-
  //    generated text → cap confidence to low and prefer asking.
  const hasExplicitUncertainty = detectExplicitUncertainty(context);
  const hasConcreteHinge = detectConcreteHinge(context);
  const fallbackEvidencePresent = winnerHasFallbackEvidence(seeds, scoring.selected_candidate_id);

  let finalConfidenceBand: NdsConfidenceBand = scoring.confidence_band;
  let finalRouteDecision: NdsRouteDecision = scoring.route_decision;

  const shiftRiskActive =
    inputStress.adult_shaped ||
    inputStress.polished_empty ||
    inputStress.cultural_indirect ||
    inputStress.contradiction ||
    inputStress.overloaded_input;

  const topScoreNow = scoring.score_summary.top_score;
  const marginNow = scoring.score_summary.score_margin;

  // Route stability guard: if top competition is close and top candidates imply
  // different axes, prefer clarification to avoid wording-sensitive oscillation.
  const topCandidate = scoring.candidates[0] ?? null;
  const runnerUpCandidate = scoring.candidates[1] ?? null;
  if (
    topCandidate &&
    runnerUpCandidate &&
    scoring.score_summary.score_margin < 0.12 &&
    inferAxisFromLine(topCandidate.direction_line) !== inferAxisFromLine(runnerUpCandidate.direction_line) &&
    (inputStress.explicit_uncertainty || !inputStress.degraded_input_mode)
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Track A: shift-sensitive confidence skepticism and compression
  if (shiftRiskActive && finalConfidenceBand === 'high') {
    finalConfidenceBand = 'medium';
  }

  if (
    shiftRiskActive &&
    scoring.score_summary.score_margin < 0.18 &&
    !hasConcreteHinge
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Track A/B class repair: adult/polished requires stronger proof before show.
  if (
    (inputStress.adult_shaped || inputStress.polished_empty) &&
    (!hasConcreteHinge || marginNow < 0.2 || topScoreNow < 0.78)
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  if (fallbackEvidencePresent) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  if (hasExplicitUncertainty && scoring.score_summary.score_margin < 0.25) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  if (inputStress.contradiction && !hasConcreteHinge) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Track D: contradiction-sensitive clarification under shift
  if (
    inputStress.contradiction &&
    scoring.score_summary.score_margin < 0.2
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Single-signal hysteresis guard: with only one story signal, close margins
  // are fragile under paraphrase and should lean to clarification.
  if (
    context.story_signals.length <= 1 &&
    context.draft_signals.length === 0 &&
    scoring.score_summary.score_margin < 0.15 &&
    inputStress.low_signal
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  if (
    finalRouteDecision === 'ask_question_before_showing' &&
    shouldAllowRecoveredShow(scoring, inputStress)
  ) {
    finalRouteDecision = 'show_strongest_direction';
    finalConfidenceBand = scoring.score_summary.score_margin >= 0.08 ? 'medium' : 'low';
  }

  // Track D: weak-note recovery — allow defensible show on latent concrete hinge.
  if (
    inputStress.low_signal &&
    hasConcreteHinge &&
    !inputStress.explicit_uncertainty &&
    marginNow >= 0.08 &&
    topScoreNow >= 0.74
  ) {
    finalRouteDecision = 'show_strongest_direction';
    finalConfidenceBand = 'medium';
  }

  // Track E: messy note-dump robustness — recover show when noise is structural, not semantic.
  if (
    inputStress.format_weirdness &&
    hasConcreteHinge &&
    !inputStress.explicit_uncertainty &&
    !inputStress.contradiction &&
    topScoreNow >= 0.76 &&
    marginNow >= 0.06
  ) {
    finalRouteDecision = 'show_strongest_direction';
    if (finalConfidenceBand === 'low') finalConfidenceBand = 'medium';
  }

  // Track F: achievement-stacked but emotionally thin — avoid overcaution collapse,
  // but keep confidence compressed.
  if (
    inputStress.achievement_stacked &&
    finalRouteDecision === 'ask_question_before_showing' &&
    !inputStress.explicit_uncertainty &&
    topScoreNow >= 0.72 &&
    marginNow >= 0.08
  ) {
    finalRouteDecision = 'show_strongest_direction';
    finalConfidenceBand = 'medium';
  }

  // Track B/F: polished-empty + adult-shaped skepticism and generic fallback suppression
  const topLine = (scoring.candidates[0]?.direction_line ?? '').toLowerCase();
  const topFailsDirectionRuleLock = scoring.candidates[0]
    ? !scoring.candidates[0].validator_flags.passes_direction_rule_lock
    : false;
  const topSeed = seeds.find((seed) => seed.candidate_id === scoring.selected_candidate_id) ?? null;
  const topFalsePremium = Boolean(topSeed?.false_premium_candidate_flag);
  const topPremiumWithoutSupport = Boolean(topSeed?.premium_tone_without_support);
  const genericFallbackLine =
    /general story about growth|general leadership|meaningful growth|resilience|generic/i.test(topLine);
  const flatLineRisk =
    /general story|broad leadership|leadership and growth|better person|more mature|generic/i.test(topLine) &&
    !hasConcreteHinge &&
    !hasIndirectHinge;
  if (
    topFalsePremium ||
    topPremiumWithoutSupport ||
    ((inputStress.polished_empty || inputStress.adult_shaped || genericFallbackLine) &&
      scoring.score_summary.score_margin < 0.22)
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Track A: recover understated hinge cases when support exists.
  if (
    hasIndirectHinge &&
    (hasConcreteHinge || inputStress.cultural_indirect) &&
    !inputStress.explicit_uncertainty &&
    !topFalsePremium &&
    topScoreNow >= 0.72 &&
    marginNow >= 0.07
  ) {
    finalRouteDecision = 'show_strongest_direction';
    if (finalConfidenceBand === 'low') finalConfidenceBand = 'medium';
  }

  // Track C: avoid safe-but-flat "show" outputs.
  if (flatLineRisk && finalRouteDecision === 'show_strongest_direction') {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  if (topFailsDirectionRuleLock) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Track C: cultural-style robustness (avoid penalizing indirect relational duty narratives)
  if (
    inputStress.cultural_indirect &&
    !inputStress.polished_empty &&
    !inputStress.explicit_uncertainty &&
    hasConcreteHinge &&
    scoring.score_summary.score_margin >= 0.1
  ) {
    finalRouteDecision = 'show_strongest_direction';
    if (finalConfidenceBand === 'low') finalConfidenceBand = 'medium';
  }

  // If filtering leaves only one surviving candidate, confidence should be
  // conservative because competition evidence is missing.
  const allowSingleSurvivorShow =
    inputStress.format_weirdness ||
    (inputStress.overloaded_input && hasConcreteHinge && !inputStress.explicit_uncertainty);
  if (
    scoring.candidates.length === 1 &&
    (inputStress.degraded_input_mode || hasExplicitUncertainty) &&
    !allowSingleSurvivorShow
  ) {
    finalConfidenceBand = 'low';
    finalRouteDecision = 'ask_question_before_showing';
  }

  // Explicit center selection: student has chosen their essay center.
  // Override cautious guards and advance to show — the student resolved the choice.
  const hasExplicitCenterChoice = detectExplicitCenterSelection(context);
  if (hasExplicitCenterChoice && !hasExplicitUncertainty) {
    finalRouteDecision = 'show_strongest_direction';
    finalConfidenceBand = scoring.score_summary.score_margin >= 0.08 ? 'medium' : 'low';
  }

  // Concrete clarification response recovery: short single-scene answers with
  // a concrete location anchor and indirect hinge — lower threshold than Track A.
  // Handles cases like "At a clinic desk, I translated a warning and realized..."
  if (
    hasIndirectHinge &&
    hasConcreteHinge &&
    finalRouteDecision === 'ask_question_before_showing' &&
    !inputStress.explicit_uncertainty &&
    !inputStress.polished_empty &&
    !topFalsePremium &&
    topScoreNow >= 0.58 &&
    marginNow >= 0.04
  ) {
    finalRouteDecision = 'show_strongest_direction';
    finalConfidenceBand = 'medium';
  }

  // Ensure clarifying_question is populated whenever we force the ask route.
  let finalClarifyingQuestion = scoring.clarifying_question;
  if (finalRouteDecision === 'ask_question_before_showing' && !finalClarifyingQuestion && scoring.candidates[0]) {
    finalClarifyingQuestion = buildClarificationQuestionPacket({
      context,
      scoring,
      fallbackToCandidate: scoring.candidates[0],
      inputStress,
      hasExplicitUncertainty,
    });
  }

  if (finalRouteDecision === 'ask_question_before_showing' && finalClarifyingQuestion) {
    finalClarifyingQuestion = enforceClarificationSpecificity(finalClarifyingQuestion, {
      context,
      scoring,
      inputStress,
    });

    const shouldSharpenForUsefulness =
      flatLineRisk ||
      hasIndirectHinge ||
      topFalsePremium ||
      inputStress.low_signal ||
      inputStress.polished_empty;
    if (shouldSharpenForUsefulness) {
      const topCandidateLine = scoring.candidates[0]?.direction_line ?? 'first center';
      const runnerUpLine = scoring.candidates[1]?.direction_line ?? 'second center';
      finalClarifyingQuestion = {
        ...finalClarifyingQuestion,
        question_text:
          scoring.candidates.length >= 2
            ? `Which center is actually true in one scene: "${topCandidateLine}" or "${runnerUpLine}"? Name the exact scene and the one sentence that proves the winning center.`
            : 'Name one exact sentence where the real center turns (not a lesson). Then state what changed immediately after that sentence.',
      };
    }
  }

  // Locate the winning candidate seed so explanations are anchored to its evidence
  const winnerSeed =
    seeds.find((s) => s.candidate_id === scoring.selected_candidate_id) ??
    seeds[0] ??
    null;
  const useRestraintMode = inputStress.low_signal || inputStress.polished_empty || inputStress.fallback_risk;
  const trustMode: 'standard' | 'degraded_input' = useRestraintMode ? 'degraded_input' : 'standard';
  const constrainedExplanation = buildEvidenceConstrainedExplanation(
    winnerSeed,
    selectedFrame,
    {
      trustMode,
      routeDecision: finalRouteDecision,
      confidenceBand: finalConfidenceBand,
      restraintMode: useRestraintMode,
    }
  );
  const selectedPresentation = buildSelectedDirectionPresentation({
    winnerSeed,
    selectedFrame,
    domain: top?.domain_signal?.situational_domain ?? 'other',
    interpretiveFocus,
    executionMode,
    sourceContextText: context.story_signals
      .flatMap((signal) => [signal.event_summary ?? '', signal.change_signal ?? ''])
      .join(' '),
  });

  const outputAssertiveness: 'high' | 'medium' | 'low' =
    finalRouteDecision === 'ask_question_before_showing'
      ? 'low'
      : finalConfidenceBand === 'high'
        ? 'high'
        : 'medium';
  const directionLineConfidenceFit: 'strong' | 'borderline' | 'weak' =
    finalRouteDecision === 'ask_question_before_showing'
      ? 'borderline'
      : finalConfidenceBand === 'high' && scoring.score_summary.score_margin >= 0.1
        ? 'strong'
        : 'borderline';

  const displayEvidenceAnchors = buildDisplayEvidenceAnchors(winnerSeed, baseEvidenceSources);
  const whyThisDirectionPlain = buildWhyThisDirectionPlain(scoring.candidates[0], scoring.candidates[1]);
  const rejectedDirectionRationale = buildRejectedDirectionRationale(scoring.rejected_candidates);
  const rejectedCandidatesWithRationale = scoring.rejected_candidates.map((rejected) => ({
    ...rejected,
    rejected_direction_rationale: rejected.rejection_reasons[0]
      ? `${rejected.candidate_id} rejected: ${rejected.rejection_reasons[0].replace(/_/g, ' ')}.`
      : `${rejected.candidate_id} rejected by quality gate.`,
  }));

  const candidateScoresByDimension = scoring.candidates.map((candidate) => {
    const abstractionPenalty = clamp(
      (candidate.validator_flags.has_banned_abstraction ? 0.5 : 0) +
      (candidate.validator_flags.repeatable_direction_risk ? 0.35 : 0) +
      (candidate.validator_flags.is_too_generic ? 0.25 : 0)
    );
    return {
      candidate_id: candidate.candidate_id,
      direction_line: candidate.direction_line,
      source_grounding: candidate.scores.evidence_grounding,
      anchor_retention: candidate.validator_flags.has_source_anchor ? 1 : 0,
      narrative_hinge_clarity: candidate.validator_flags.has_narrative_hinge ? 1 : 0,
      draftability: candidate.scores.buildability,
      individualization: candidate.scores.student_specificity,
      non_repeatability: candidate.validator_flags.repeatable_direction_risk ? 0 : 1,
      coaching_usefulness: candidate.validator_flags.is_coaching_instruction ? 1 : 0,
      abstraction_penalty: roundScore(abstractionPenalty),
      total_score: candidate.scores.total_score,
    };
  });

  const candidatePayloadWithSupport = scoring.candidates.map((candidate) => {
    const axisFamily = inferAxisFromLine(candidate.direction_line);
    const selectedEvidence = candidate.evidence_spans.map((span) => ({
      quote: span.text,
      note: `evidence_span_${span.start_char}_${span.end_char}`,
    }));
    const whyThisDirection =
      candidate.selected
        ? constrainedExplanation.why_this_is_the_real_story
        : `Alternative direction with lower support than selected winner on ${axisFamily}.`;
    return {
      ...candidate,
      axis_family: axisFamily,
      total_score: candidate.scores.total_score,
      why_this_direction: whyThisDirection,
      selected_evidence: selectedEvidence,
    };
  });

  return {
    status: 'success',
    best_direction: {
      id: 'direction_1',
      angle_title: selectedPresentation.angleTitle,
      core_claim: constrainedExplanation.core_claim,
      why_this_is_the_real_story: constrainedExplanation.why_this_is_the_real_story,
      what_it_reveals_about_the_student: constrainedExplanation.what_it_reveals_about_the_student,
      why_it_beats_the_obvious_angle: constrainedExplanation.why_it_beats_the_obvious_angle,
      main_risk_if_written_poorly: selectedPresentation.mainRisk,
      next_move: selectedPresentation.nextMove,
    },
    recommended_direction: scoring.candidates[0]?.direction_line ?? winnerSeed?.direction_line ?? selectedFrame.angleTitle,
    why_this_direction: whyThisDirectionPlain,
    alternatives: alternatives as any,
    evidence_anchors: displayEvidenceAnchors as any,
    rejected_direction_rationale: rejectedDirectionRationale,
    generation_metadata: {
      raw_note_count: context.story_signals.length + context.draft_signals.length,
      anchor_candidates_extracted: extractedAnchorCandidates,
      hinge_candidates_extracted: extractedHingeCandidates,
      candidate_scores_by_dimension: candidateScoresByDimension,
    },
    depth_signals: {
      detected_tension: tension,
      detected_shift: shift,
      obvious_but_weaker_angle: `Obvious but weaker angle: ${selectedFrame.obviousAngle}.`,
      essay_opportunity: interpretiveOpportunity,
    },
    recovery_question: null,
    selected_candidate_id: scoring.selected_candidate_id || undefined,
    confidence_band: finalConfidenceBand,
    route_decision: finalRouteDecision,
    score_summary: scoring.score_summary,
    candidates: candidatePayloadWithSupport as any,
    rejected_candidates: rejectedCandidatesWithRationale,
    clarifying_question: finalClarifyingQuestion,
    scoring_debug: {
      generated_candidate_count: seeds.length,
      surviving_candidate_count: scoring.candidates.length,
      selected_candidate_id: scoring.selected_candidate_id,
      candidate_rankings: scoring.candidates.map((candidate) => ({
        candidate_id: candidate.candidate_id,
        total_score: candidate.scores.total_score,
        rank: candidate.rank,
      })),
      candidates: scoring.candidates,
      rejected_candidates: rejectedCandidatesWithRationale,
      score_summary: scoring.score_summary,
      confidence_band: finalConfidenceBand,
      route_decision: finalRouteDecision,
      selected_axis_family: inferAxisFromLine(scoring.candidates[0]?.direction_line ?? ''),
      semantic_anchors: deriveSemanticAnchors(winnerSeed ?? seeds[0]),
      clarification_reason: finalClarifyingQuestion?.question_reason ?? undefined,
      clarification_specificity: evaluateClarificationSpecificity(finalClarifyingQuestion?.question_text ?? ''),
      clarification_targets_actual_ambiguity:
        finalRouteDecision === 'ask_question_before_showing'
          ? evaluateClarificationSpecificity(finalClarifyingQuestion?.question_text ?? '') !== 'weak'
          : true,
      trust_mode: trustMode,
      output_assertiveness: outputAssertiveness,
      direction_line_confidence_fit: directionLineConfidenceFit,
      explanation_restraint_mode: useRestraintMode,
      generation_metadata: {
        raw_note_count: context.story_signals.length + context.draft_signals.length,
        anchor_candidates_extracted: extractedAnchorCandidates,
        hinge_candidates_extracted: extractedHingeCandidates,
        candidate_scores_by_dimension: candidateScoresByDimension,
      },
      shift_risk_flags: {
        adult_shaped: inputStress.adult_shaped,
        polished_empty: inputStress.polished_empty,
        cultural_indirect: inputStress.cultural_indirect,
        contradiction: inputStress.contradiction,
        low_signal: inputStress.low_signal,
      },
      shift_confidence_compressed:
        shiftRiskActive && (scoring.confidence_band === 'high' || finalConfidenceBand === 'low'),
      polished_emptiness_skepticism_activated:
        inputStress.polished_empty || inputStress.adult_shaped,
      cultural_style_support_activated:
        inputStress.cultural_indirect && finalRouteDecision === 'show_strongest_direction',
      contradiction_sensitive_clarification_activated:
        inputStress.contradiction && finalRouteDecision === 'ask_question_before_showing',
      weak_note_recovery_mode_activated:
        inputStress.low_signal || inputStress.actionable_signal_strength === 'weak',
      generic_fallback_suppression_activated:
        genericFallbackLine && finalRouteDecision === 'ask_question_before_showing',
      indirect_hinge_candidates_detected: seeds
        .filter((seed) => seed.hinge_supported)
        .map((seed) => seed.candidate_id),
      hinge_sentence_count: indirectHingeSentences.length,
      hinge_support_activated:
        hasIndirectHinge &&
        seeds.some((seed) => seed.hinge_supported) &&
        finalRouteDecision === 'show_strongest_direction',
      false_premium_candidate_flag: topFalsePremium,
      premium_tone_without_support: topPremiumWithoutSupport,
      false_premium_suppression_activated:
        (topFalsePremium || topPremiumWithoutSupport) &&
        finalRouteDecision === 'ask_question_before_showing',
      careful_but_unhelpful_risk:
        finalRouteDecision === 'ask_question_before_showing' &&
        (flatLineRisk || !hasConcreteHinge),
      useful_caution_mode_activated:
        finalRouteDecision === 'ask_question_before_showing' &&
        (flatLineRisk || hasIndirectHinge || topFalsePremium),
      flat_line_repair_activated:
        flatLineRisk && finalRouteDecision === 'ask_question_before_showing',
      class_repair_track_activations: {
        track_a_parent_polished_guard:
          (inputStress.adult_shaped || inputStress.polished_empty) && finalRouteDecision === 'ask_question_before_showing',
        track_b_cultural_support:
          inputStress.cultural_indirect && finalRouteDecision === 'show_strongest_direction',
        track_c_contradiction_calibration:
          inputStress.contradiction && finalRouteDecision === 'ask_question_before_showing',
        track_d_weak_note_recovery:
          inputStress.low_signal && hasConcreteHinge,
        track_e_messy_dump_recovery:
          inputStress.format_weirdness && hasConcreteHinge,
        track_f_achievement_thin_handling:
          inputStress.achievement_stacked,
      },
      selected_vs_runner_up_scores:
        scoring.candidates.length >= 2
          ? {
              selected: scoring.candidates[0].scores,
              runner_up: scoring.candidates[1].scores,
            }
          : scoring.candidates[0]
            ? {
                selected: scoring.candidates[0].scores,
                runner_up: null,
              }
            : null,
    } as any,
  };
}

function buildRuntimeCandidateSeeds(input: {
  context: NdsNormalizedContextPack;
  executionMode: NdsModuleExecutionInput['execution_mode'];
  inputStress: InputStressProfile;
  selectedFrame: {
    angleTitle: string;
    coreClaim: string;
    realStory: string;
    studentReveal: string;
    whyBeatsObvious: string;
    obviousAngle: string;
    risk: string;
    nextMove: string;
    nextMoveConnector: string;
  };
  interpretiveFocus: string;
  top: NdsNormalizedContextPack['story_signals'][number] | null;
  second: NdsNormalizedContextPack['story_signals'][number] | null;
  third: NdsNormalizedContextPack['story_signals'][number] | null;
  tension: string;
  hingeSentences: string[];
}): RuntimeCandidateSeed[] {
  const primaryEvidence = buildEvidenceSpans(input.top, input.context);
  const secondaryEvidence = buildEvidenceSpans(input.second, input.context);
  const tertiaryEvidence = buildEvidenceSpans(input.third, input.context);
  const domain = input.top?.domain_signal?.situational_domain ?? 'other';

  // Assess input quality to determine if candidates should be close or spread
  const totalStoryLength =
    (input.top?.event_summary?.length ?? 0) +
    (input.second?.event_summary?.length ?? 0) +
    (input.third?.event_summary?.length ?? 0);
  const hasChangeSignal = (input.top?.change_signal?.length ?? 0) > 20;
  const hasClearTension = input.tension.length > 30;
  const evidenceQuality = primaryEvidence.reduce((acc, span) => acc + span.text.length, 0);

  // Weak input: scores should be tighter, more candidates weaker
  const isWeak = totalStoryLength < 200 || !hasChangeSignal || evidenceQuality < 100;
  // Ambiguous input: top candidates are close in quality
  const isAmbiguous = totalStoryLength > 300 && totalStoryLength < 600 && !hasClearTension;
  // Strong input: top candidate clearly dominant
  const isStrong = totalStoryLength > 400 && hasChangeSignal && hasClearTension;

  const primaryLine = buildPrimaryDirectionLine(domain, input.selectedFrame.angleTitle);
  const competenceLine = buildCompetenceDirectionLine(domain);
  const responsibilityLine = buildResponsibilityDirectionLine(domain);
  const genericLine = 'A general story about growth and leadership.';
  const degradedMode = input.inputStress.degraded_input_mode;
  const isLowSignalFamilyRestricted = input.inputStress.low_signal || input.inputStress.polished_empty;
  const cautiousOtherLine =
    'A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.';

  // CRITICAL: All candidates get the SAME before/after states derived from primary signal only.
  // This prevents artificial buildability differences based on which signal is being processed.
  // The distinction between candidates should come from direction_summary and core_tension,
  // not from arbitrarily different before/after states.
  const primaryBeforeState = deriveBeforeState(input.top?.change_signal ?? '', domain);
  const primaryAfterState = deriveAfterState(input.top?.change_signal ?? '', domain);

  let candidates: RuntimeCandidateSeed[] = [
    {
      candidate_id: 'direction_1',
      kind: 'primary',
      direction_line:
        degradedMode && (input.inputStress.low_signal || input.inputStress.polished_empty) && domain === 'other'
          ? cautiousOtherLine
          : primaryLine,
      direction_summary: input.top?.event_summary ?? input.interpretiveFocus ?? input.selectedFrame.realStory,
      core_tension: input.tension,
      before_state: primaryBeforeState,
      after_state: primaryAfterState,
      why_strong: input.selectedFrame.whyBeatsObvious,
      risk_if_chosen: input.selectedFrame.risk,
      clarifying_question_if_uncertain: buildClarifyingQuestion(domain, input.top?.event_summary ?? input.interpretiveFocus),
      evidence_spans: primaryEvidence,
      degraded_input_mode: degradedMode,
    },
    {
      candidate_id: 'direction_2',
      kind: 'competence',
      direction_line: competenceLine,
      // Use actual secondary event if available; otherwise use primary event but in competence frame
      direction_summary:
        input.second?.event_summary ?? input.top?.event_summary ?? 'A capability-forward angle focused on execution quality and visible performance under pressure.',
      // Use secondary change signal or primary as fallback
      core_tension: input.second?.change_signal ?? input.top?.change_signal ?? 'Capability is visible, but the deeper internal revision is less clear.',
      // Use PRIMARY before/after to avoid artificial score separation
      before_state: primaryBeforeState,
      after_state: primaryAfterState,
      why_strong: 'This candidate has surface clarity and practical evidence of capability.',
      risk_if_chosen: 'This can flatten into an accomplishment summary with limited tension.',
      clarifying_question_if_uncertain: 'What specific moment shows that your competence alone was not enough?',
      // Use secondary evidence if available, otherwise primary
      evidence_spans: secondaryEvidence.length > 0 ? secondaryEvidence : primaryEvidence,
      degraded_input_mode: degradedMode,
    },
    {
      candidate_id: 'direction_3',
      kind: 'responsibility',
      direction_line: responsibilityLine,
      // Use actual tertiary event if available; otherwise use primary or secondary
      direction_summary:
        input.third?.event_summary ?? input.second?.event_summary ?? input.top?.event_summary ?? 'A values-forward angle focused on responsibility to other people in the same situation.',
      // Use tertiary change signal or fallback
      core_tension: input.third?.change_signal ?? input.second?.change_signal ?? input.top?.change_signal ?? 'Responsibility matters, but the central decision is less sharply evidenced than the winner.',
      // Use PRIMARY before/after to avoid artificial score separation
      before_state: primaryBeforeState,
      after_state: primaryAfterState,
      why_strong: 'This candidate has moral seriousness and evidence of value-driven decision making.',
      risk_if_chosen: 'This can drift into values language without a vivid hinge moment.',
      clarifying_question_if_uncertain: 'Which exact moment made you realize another person was affected differently than you expected?',
      // Use tertiary evidence if available, otherwise secondary, otherwise primary
      evidence_spans: tertiaryEvidence.length > 0 ? tertiaryEvidence : secondaryEvidence.length > 0 ? secondaryEvidence : primaryEvidence,
      degraded_input_mode: degradedMode,
    },
  ];

  // For weak input, promote competence/responsibility as credible alternatives
  if (isWeak) {
    candidates[1].kind = 'primary'; // competence becomes more viable
    candidates[2].kind = 'competence'; // responsibility becomes less clear
  }

  // For ambiguous input, seed diverse candidates with equal opportunity
  // Winner will be determined by scoring, not seed status
  if (isAmbiguous) {
    // Ensure all three have comparable summary quality so scoring can discriminate
    candidates[0].why_strong = 'This candidate has strong supporting evidence.';
    candidates[1].why_strong = 'This candidate has equally strong supporting evidence.';
    candidates[2].why_strong = 'This candidate has equally strong supporting evidence.';
  }

  // For strong input, generic stays weak, others compete
  if (isStrong) {
    candidates[1].why_strong = 'Solid but less emotionally resonant than the primary direction.';
    candidates[2].why_strong = 'Strong on values but weaker on personal stakes and scene specificity.';
  }

  // Add generic last if not reduced scope
  if (input.executionMode !== 'reduced_scope' && !degradedMode) {
    candidates.push({
      candidate_id: 'direction_4',
      kind: 'generic',
      direction_line: genericLine,
      direction_summary: 'A broad leadership and growth framing that could apply to many students.',
      core_tension: 'Generic self-improvement rather than a specific student situation.',
      before_state: 'General challenge.',
      after_state: 'General growth.',
      why_strong: 'This is easy to draft quickly, but it is not specific enough to trust.',
      risk_if_chosen: 'This will read like reusable counselor prose instead of a real essay direction.',
      clarifying_question_if_uncertain: 'What exact moment would keep this from sounding generic?',
      evidence_spans: primaryEvidence.slice(0, 1),
      degraded_input_mode: degradedMode,
    });
  }

  // Add required axis families as real candidates when signals are present.
  // These are NOT post-selection rewrites; they participate in scoring.
  const axisFamilyCandidates = buildAxisFamilyCandidates({
    context: input.context,
    inputStress: input.inputStress,
    top: input.top,
    second: input.second,
    third: input.third,
    interpretiveFocus: input.interpretiveFocus,
    primaryBeforeState,
    primaryAfterState,
    primaryEvidence,
    nextCandidateNumber: candidates.length + 1,
  });

  candidates = [...candidates, ...axisFamilyCandidates];

  if (isLowSignalFamilyRestricted) {
    candidates = candidates.filter((candidate, index) => {
      if (index < 2) return true;
      return candidate.family_confidence === 'strong';
    });
  }

  candidates = dedupeRuntimeCandidates(candidates, degradedMode || input.context.draft_signals.length === 0);

  candidates = candidates.map((candidate) => {
    const lockedDirectionLine = enforceDirectionRuleLockLine(candidate);
    const supportDensity = deriveSupportDensity(candidate);
    const familyConfidence = deriveFamilyConfidence(candidate);
    const fallbackContaminated = candidate.evidence_spans.some((span) => FALLBACK_EVIDENCE_PATTERN.test(span.text));
    const candidateText = `${lockedDirectionLine} ${candidate.direction_summary} ${candidate.core_tension}`;
    const overlapCount = input.hingeSentences.filter((hinge) => lexicalOverlap(hinge, candidateText) >= 0.16).length;
    const hingeSupported = overlapCount > 0;
    const concreteSceneMarkers = /when|after|before|night\s+shifts|broke\s+down|breakdowns|handoffs|patient|student|team|mother|parents|family|asked|told|redesigned|rebuilt|translated|paused|scene/i.test(candidateText);
    const polishedPremiumTone = /transformative|multidimensional|ethos|metacognitive|epistemic|stakeholder|resonant|portfolio|civic\s+innovation|values\s+alignment|relational\s+stewardship|unilateral\s+direction|interpersonally\s+resonant|ethically\s+coherent|change\s+agent|dialogic|co-constructed|across\s+many\s+contexts/i.test(candidateText);
    const premiumToneWithoutSupport = polishedPremiumTone && (supportDensity === 'weak' || !concreteSceneMarkers) && !hingeSupported;
    const falsePremiumCandidate =
      premiumToneWithoutSupport ||
      ((/general story|broad leadership|generic/i.test(lockedDirectionLine) || polishedPremiumTone) && !hingeSupported && !concreteSceneMarkers);
    const adjustedSupportDensity = hingeSupported && supportDensity === 'weak' ? 'medium' : supportDensity;
    const adjustedFamilyConfidence = hingeSupported && familyConfidence === 'weak' ? 'partial' : familyConfidence;
    return {
      ...candidate,
      direction_line: lockedDirectionLine,
      degraded_input_mode: degradedMode,
      fallback_contaminated: fallbackContaminated,
      candidate_support_density: adjustedSupportDensity,
      family_confidence: adjustedFamilyConfidence,
      candidate_duplication_risk: candidate.candidate_duplication_risk ?? 'low',
      hinge_supported: hingeSupported,
      hinge_sentence_overlap_count: overlapCount,
      premium_tone_without_support: premiumToneWithoutSupport,
      false_premium_candidate_flag: falsePremiumCandidate,
      flat_line_risk:
        /general story|broad leadership|leadership and growth|better person|more mature|generic/i.test(lockedDirectionLine.toLowerCase()) &&
        !hingeSupported,
    };
  });

  return candidates;
}

function buildAxisFamilyCandidates(input: {
  context: NdsNormalizedContextPack;
  inputStress: InputStressProfile;
  top: NdsNormalizedContextPack['story_signals'][number] | null;
  second: NdsNormalizedContextPack['story_signals'][number] | null;
  third: NdsNormalizedContextPack['story_signals'][number] | null;
  interpretiveFocus: string;
  primaryBeforeState: string;
  primaryAfterState: string;
  primaryEvidence: Array<{ text: string; start_char: number; end_char: number }>;
  nextCandidateNumber: number;
}): RuntimeCandidateSeed[] {
  const signals = [input.top, input.second, input.third].filter(
    (signal): signal is NdsNormalizedContextPack['story_signals'][number] => Boolean(signal)
  );

  if (signals.length === 0) return [];

  const systemPattern =
    /redesign|rebuilt|rebuild|tracker|workflow|ticket|system\s+(?:was|is)\s+broken|changed\s+the\s+structure|process|architecture|recurring\s+failure|bottleneck\s+from\s+design|queue|rubric|decision\s+tree|intake\s+order|allotment|staging/i;
  const delegationPattern =
    /bottleneck|delegat|distributed|shared\s+ownership|handoff|single\s+point\s+of\s+failure|stopped\s+doing\s+everything\s+myself|review\s+ownership|others\s+took\s+on|without\s+me\s+in\s+the\s+center|assigned\s+subsystem\s+leads/i;
  const patternBreakingPattern =
    /kept\s+doing|pushing\s+harder|default\s+reaction|wrong\s+habit|stopped\s+repeating|persistence\s+was\s+not|broke\s+the\s+pattern|had\s+to\s+stop|instead\s+of\s+pushing|masking|softening|cutting\s+off/i;
  const identityPattern =
    /stopped\s+seeing\s+myself\s+as|realized\s+i\s+was\s+becoming|how\s+i\s+saw\s+myself|identity|who\s+i\s+was|self-concept|not\s+just\s+what\s+i\s+did|became\s+someone\s+who|two\s+languages|voice\s+in\s+the\s+room/i;
  const familyDutyPattern =
    /mother|father|parents|grandmother|grandfather|night\s+shifts|household\s+logistics|care\s+duties|translation|translated|without\s+being\s+asked|family\s+needed|keeping\s+things\s+running|responsibility\s+as\s+relational\s+practice|reliability\s+as\s+relational\s+practice/i;
  // Relationship / listening family: fires when story signals contain clear
  // evidence of a shift from fixing/controlling to listening, presence, or
  // attending to the person rather than the task.
  const relationshipListeningPattern =
    /listen|listening|listened|sat\s+beside|stayed\s+with|stayed\s+beside|sat\s+with|remained\s+with|waited\s+with|relationship\s+changed|the\s+relationship\s+changed|care\s+meant|listening\s+replaced|attention\s+mattered|presence\s+mattered|started\s+asking|started\s+listening|shifted.*?listening|paying\s+attention|paid\s+attention|person\s+mattered\s+more|asking\s+instead|asked.*?instead\s+of\s+correcting|before\s+asking.*?needed/i;

  const systemSignal = findBestSignalForPattern(signals, systemPattern);
  const delegationSignal = findBestSignalForPattern(signals, delegationPattern);
  const patternSignal = findBestSignalForPattern(signals, patternBreakingPattern);
  const identitySignal = findBestSignalForPattern(signals, identityPattern);
  const relationshipSignal = findBestSignalForPattern(signals, relationshipListeningPattern);
  const familyDutySignal = findBestSignalForPattern(signals, familyDutyPattern);

  const allowNicheFamilies = !input.inputStress.low_signal && !input.inputStress.polished_empty;

  const axisCandidates: RuntimeCandidateSeed[] = [];
  let id = input.nextCandidateNumber;

  if (systemSignal && allowNicheFamilies) {
    const evidence = buildEvidenceSpans(systemSignal, input.context);
    const anchor = extractConcreteAnchor(evidence.map((span) => span.text).join(' '), 10);
    axisCandidates.push({
      candidate_id: `direction_${id++}`,
      kind: 'system_redesign',
      direction_line: 'The moment effort stopped fixing the problem and you redesigned the system it depended on.',
      direction_summary:
        systemSignal.event_summary ??
        input.interpretiveFocus ??
        'The story center is the redesign of a process that kept failing in the same place.',
      core_tension: `The recurring failure stayed in place until the structure changed: ${anchor}.`,
      before_state: input.primaryBeforeState,
      after_state: input.primaryAfterState,
      why_strong:
        'This candidate names the process itself, the redesign move, and the structural after-effect.',
      risk_if_chosen:
        'If written vaguely, this can collapse into hard-work framing instead of a concrete redesign story.',
      clarifying_question_if_uncertain:
        'What exact process did you redesign, and what measurable change appeared after the redesign?',
      evidence_spans: evidence.length > 0 ? evidence : input.primaryEvidence,
      family_confidence: 'strong',
    });
  }

  if (delegationSignal && allowNicheFamilies) {
    const evidence = buildEvidenceSpans(delegationSignal, input.context);
    const anchor = extractConcreteAnchor(evidence.map((span) => span.text).join(' '), 10);
    axisCandidates.push({
      candidate_id: `direction_${id++}`,
      kind: 'delegation_distributed_responsibility',
      direction_line: 'The moment you stopped being the bottleneck and started distributing responsibility.',
      direction_summary:
        delegationSignal.event_summary ??
        input.interpretiveFocus ??
        'The real change was shifting work from one person to shared ownership.',
      core_tension: `The work depended on one person until distribution became necessary: ${anchor}.`,
      before_state: input.primaryBeforeState,
      after_state: input.primaryAfterState,
      why_strong:
        'This candidate names delegation, the move away from self-centrality, and the resulting shared structure.',
      risk_if_chosen:
        'If the scene is unclear, this can read like management language without a visible hinge moment.',
      clarifying_question_if_uncertain:
        'When did you realize you were the bottleneck, and what did you hand off first?',
      evidence_spans: evidence.length > 0 ? evidence : input.primaryEvidence,
      family_confidence: 'strong',
    });
  }

  if (patternSignal && allowNicheFamilies) {
    const evidence = buildEvidenceSpans(patternSignal, input.context);
    const anchor = extractConcreteAnchor(evidence.map((span) => span.text).join(' '), 10);
    axisCandidates.push({
      candidate_id: `direction_${id++}`,
      kind: 'pattern_breaking',
      direction_line: 'The moment pushing harder became the wrong pattern and you broke it on purpose.',
      direction_summary:
        patternSignal.event_summary ??
        input.interpretiveFocus ??
        'The story center is breaking an unhelpful repeated response that had stopped helping.',
      core_tension: `The old response kept repeating until the student interrupted it: ${anchor}.`,
      before_state: input.primaryBeforeState,
      after_state: input.primaryAfterState,
      why_strong:
        'This candidate explicitly names the old pattern, the break from it, and why that break mattered.',
      risk_if_chosen:
        'If evidence is thin, this can sound abstract without showing the old pattern in action.',
      clarifying_question_if_uncertain:
        'What exact behavior were you repeating before you decided to stop, and what happened right after the break?',
      evidence_spans: evidence.length > 0 ? evidence : input.primaryEvidence,
      family_confidence: 'strong',
    });
  }

  if (identitySignal && allowNicheFamilies) {
    const evidence = buildEvidenceSpans(identitySignal, input.context);
    const anchor = extractConcreteAnchor(evidence.map((span) => span.text).join(' '), 10);
    axisCandidates.push({
      candidate_id: `direction_${id++}`,
      kind: 'identity_transformation',
      direction_line: 'The moment the story became about who you were becoming, not just what you were doing.',
      direction_summary:
        identitySignal.event_summary ??
        input.interpretiveFocus ??
        'The story center is an internal shift in self-understanding, not only a behavioral change.',
      core_tension: `The external work mattered, but the deeper change was in self-concept: ${anchor}.`,
      before_state: input.primaryBeforeState,
      after_state: input.primaryAfterState,
      why_strong:
        'This candidate names identity transformation directly and keeps the axis internal when the story supports it.',
      risk_if_chosen:
        'If overgeneralized, this can drift into abstract identity language without a concrete trigger moment.',
      clarifying_question_if_uncertain:
        'What moment changed how you understood yourself, and how did that new self-understanding show up next?',
      evidence_spans: evidence.length > 0 ? evidence : input.primaryEvidence,
      family_confidence: 'partial',
    });
  }

  if (relationshipSignal) {
    const evidence = buildEvidenceSpans(relationshipSignal, input.context);
    const anchor = extractConcreteAnchor(evidence.map((span) => span.text).join(' '), 10);
    axisCandidates.push({
      candidate_id: `direction_${id++}`,
      kind: 'relationship_or_listening',
      direction_line:
        'The moment you stopped trying to fix the situation and started listening to the person in front of you.',
      direction_summary:
        relationshipSignal.event_summary ??
        input.interpretiveFocus ??
        'The real change was shifting from fixing or controlling to listening and staying present with one person.',
      core_tension: `The tension is between managing the situation and recognizing that one person needed attention more than a solution: ${anchor}.`,
      before_state: input.primaryBeforeState,
      after_state: input.primaryAfterState,
      why_strong:
        'This candidate names the relational axis directly: the shift from fixing to listening, from task to person, from control to attention.',
      risk_if_chosen:
        'If the relational moment is underdeveloped, this can seem abstract without a clear before/after scene of listening in action.',
      clarifying_question_if_uncertain:
        'What specific moment made you realize that listening mattered more than solving — and what did you do differently in that scene?',
      evidence_spans: evidence.length > 0 ? evidence : input.primaryEvidence,
      family_confidence: 'strong',
    });
  }

  if (familyDutySignal) {
    const evidence = buildEvidenceSpans(familyDutySignal, input.context);
    const anchor = extractConcreteAnchor(evidence.map((span) => span.text).join(' '), 10);
    axisCandidates.push({
      candidate_id: `direction_${id++}`,
      kind: 'relationship_or_listening',
      direction_line:
        'The moment responsibility stopped being performance and became a quiet duty to the people counting on you.',
      direction_summary:
        familyDutySignal.event_summary ??
        input.interpretiveFocus ??
        'The real center is a family-duty shift expressed through steady responsibility rather than overt self-description.',
      core_tension: `What looked like reliability became relational duty in one concrete family scene: ${anchor}.`,
      before_state: input.primaryBeforeState,
      after_state: input.primaryAfterState,
      why_strong:
        'This candidate preserves understated family-duty signal without flattening it into generic leadership language.',
      risk_if_chosen:
        'If the family scene stays abstract, this can still sound polished rather than lived.',
      clarifying_question_if_uncertain:
        'What exact family moment made this responsibility feel relational rather than just expected, and what did you do in that scene?',
      evidence_spans: evidence.length > 0 ? evidence : input.primaryEvidence,
      family_confidence: 'strong',
    });
  }

  return axisCandidates;
}

function findBestSignalForPattern(
  signals: NdsNormalizedContextPack['story_signals'],
  pattern: RegExp
): NdsNormalizedContextPack['story_signals'][number] | null {
  const scored = signals
    .map((signal) => {
      const text = `${signal.event_summary ?? ''}`;
      const match = pattern.test(text);
      const score = (match ? 1 : 0) + Math.min(0.5, text.length / 1200);
      return { signal, match, score };
    })
    .filter((item) => item.match)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.signal ?? null;
}

function analyzeInputStress(context: NdsNormalizedContextPack): InputStressProfile {
  const text = context.story_signals
    .flatMap((s) => [s.event_summary ?? '', s.change_signal ?? ''])
    .join(' ')
    .toLowerCase();
  const tokenCount = tokenizeSemantic(text).length;
  const sentenceCount = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
  const hasActionMarkers = /when|then|after|before|realized|stopped|started|asked|changed|rebuilt|delegat|redesign|improved|dropped|mapped|translated|caregiving|family|responsibility|duty|temple|community/i.test(text);
  const hasBulletsOrArrows = /(^|\n)\s*[-•]|->|=>|\+\s|\.{3,}/.test(text);
  const repeatedPhrase = /(\b.{10,80}\b)(?:\s+\1){2,}/.test(text);
  const explicitUncertainty = detectExplicitUncertainty(context);
  const commaCount = text.match(/,/g)?.length ?? 0;
  const contradiction =
    explicitUncertainty ||
    /but maybe|on the other hand|both feel true|cannot tell|or maybe|not sure which|changing my mind|keep changing my mind|two stories|competing centers/i.test(text);
  const culturalIndirect =
    /family|grandmother|parents|uncle|community|temple|duty|obligation|quietly|without being asked|translated|elders|care duties|household logistics/i.test(text) &&
    !/i realized|the point is|this changed me|therefore/i.test(text);
  const adultShaped =
    /multidimensional|ethos|metacognitive|interdisciplinary|stakeholder|portfolio|transformative summers|civic innovation|values alignment|epistemic/i.test(text);
  const achievementStacked =
    /captain|founder|president|finalist|award|internship|state-level|scaled impact|%|users|published|research abstract|portfolio/i.test(text);
  const lowSignal =
    (tokenCount < 35 && !hasActionMarkers) ||
    /i don.?t know what to write|everything feels normal|became a better person|cannot describe any specific moment|no single moment captures/i.test(text);
  const veryThinSignal = tokenCount < 12 && !hasActionMarkers;
  const overloadedInput = tokenCount > 140 || (tokenCount > 110 && commaCount > 12);
  const polishedEmpty =
    /tapestry|multidimensional|ethos|journey is an intricate meditation|global citizenship|purpose|metacognitive|epistemic|co-constructed|intentional values alignment|interpersonally resonant/i.test(text) &&
    !/when|then|after|before|realized|stopped|started|because/i.test(text);
  const fallbackRisk = lowSignal || polishedEmpty || adultShaped;
  const actionable_signal_strength: 'strong' | 'medium' | 'weak' =
    /when|then|after|realized|stopped|started|because|specific moment|nurse|rebuilt|delegat|redesign|translated|care duties|household|grandmother|parents/i.test(text) && tokenCount > 45
      ? 'strong'
      : tokenCount > 28
        ? 'medium'
        : 'weak';

  const recoveredLowSignal = lowSignal && culturalIndirect && tokenCount > 22;

  const degraded_input_mode =
    (recoveredLowSignal ? false : lowSignal) || contradiction || hasBulletsOrArrows || repeatedPhrase || polishedEmpty || overloadedInput;

  return {
    degraded_input_mode,
    low_signal: recoveredLowSignal ? false : lowSignal,
    very_thin_signal: recoveredLowSignal ? false : veryThinSignal,
    contradiction,
    format_weirdness: hasBulletsOrArrows || repeatedPhrase,
    polished_empty: polishedEmpty,
    adult_shaped: adultShaped,
    cultural_indirect: culturalIndirect,
    achievement_stacked: achievementStacked,
    overloaded_input: overloadedInput,
    explicit_uncertainty: explicitUncertainty,
    fallback_risk: fallbackRisk,
    actionable_signal_strength,
  };
}

function dedupeRuntimeCandidates(
  candidates: RuntimeCandidateSeed[],
  degradedMode: boolean
): RuntimeCandidateSeed[] {
  if (!degradedMode) {
    return candidates;
  }
  const byAxis = new Map<string, RuntimeCandidateSeed>();
  for (const candidate of candidates) {
    const axis = inferAxisFromLine(candidate.direction_line);
    const existing = byAxis.get(axis);
    if (!existing) {
      byAxis.set(axis, candidate);
      continue;
    }
    const existingEvidence = existing.evidence_spans.reduce((n, span) => n + span.text.length, 0);
    const currentEvidence = candidate.evidence_spans.reduce((n, span) => n + span.text.length, 0);
    if (currentEvidence > existingEvidence) {
      byAxis.set(axis, {
        ...candidate,
        candidate_duplication_risk: degradedMode ? 'medium' : 'low',
      });
    } else {
      byAxis.set(axis, {
        ...existing,
        candidate_duplication_risk: degradedMode ? 'medium' : 'low',
      });
    }
  }

  return Array.from(byAxis.values()).map((candidate, index) => ({
    ...candidate,
    candidate_id: `direction_${index + 1}`,
  }));
}

function deriveSupportDensity(candidate: RuntimeCandidateSeed): 'strong' | 'medium' | 'weak' {
  const evidenceLength = candidate.evidence_spans.reduce((n, span) => n + span.text.length, 0);
  const hasConcreteMarkers = /when|then|after|before|realized|stopped|started|because|nurse|team|process|delegat|redesign|patient|student/i.test(
    `${candidate.direction_summary} ${candidate.core_tension}`
  );
  if (evidenceLength >= 170 && hasConcreteMarkers) return 'strong';
  if (evidenceLength >= 90 || hasConcreteMarkers) return 'medium';
  return 'weak';
}

function deriveFamilyConfidence(candidate: RuntimeCandidateSeed): 'strong' | 'partial' | 'weak' {
  const text = `${candidate.direction_summary} ${candidate.core_tension}`.toLowerCase();
  const line = candidate.direction_line.toLowerCase();
  if (candidate.kind === 'system_redesign' && /redesign|workflow|system|process|ticket|queue|staging/.test(text)) return 'strong';
  if (candidate.kind === 'delegation_distributed_responsibility' && /delegat|handoff|ownership|bottleneck|distributed/.test(text)) return 'strong';
  if (candidate.kind === 'pattern_breaking' && /pattern|stopped repeating|wrong habit|instead/.test(text)) return 'strong';
  if (candidate.kind === 'identity_transformation' && /identity|self|becoming|understood myself/.test(text)) return 'partial';
  if (candidate.kind === 'relationship_or_listening' && /listen|person in front|asked first|relationship/.test(text)) return 'strong';
  if (candidate.kind === 'primary') {
    if (/argument|listening/.test(line) && !/argument|listen|nurse|patient|asked/.test(text)) return 'weak';
    if (/tutoring|explanation/.test(line) && !/tutor|student|explain|learn/.test(text)) return 'weak';
    if (/team|alone/.test(line) && !/team|robotics|handoff|ownership|delegat/.test(text)) return 'weak';
    if (/when|then|after|realized|changed|shift/.test(text)) return 'partial';
  }
  return 'weak';
}

function buildClarificationQuestionPacket(input: {
  context: NdsNormalizedContextPack;
  scoring: RuntimeScoringResult;
  fallbackToCandidate: NdsScoredCandidate;
  inputStress: InputStressProfile;
  hasExplicitUncertainty: boolean;
}): NonNullable<RuntimeScoringResult['clarifying_question']> {
  const top = input.scoring.candidates[0] ?? null;
  const runnerUp = input.scoring.candidates[1] ?? null;
  const topAxis = inferAxisFromLine(top?.direction_line ?? '');
  const runnerAxis = inferAxisFromLine(runnerUp?.direction_line ?? '');

  let reason: NonNullable<RuntimeScoringResult['clarifying_question']>['question_reason'] = 'clarify_shift';
  if (input.inputStress.low_signal) reason = 'low_signal';
  else if (input.inputStress.overloaded_input) reason = 'overloaded_input';
  else if (input.inputStress.fallback_risk) reason = 'fallback_risk';
  else if (input.hasExplicitUncertainty && topAxis !== runnerAxis) reason = 'two_competing_centers';
  else if (input.scoring.score_summary.score_margin < 0.07) reason = 'resolve_candidate_tie';

  let question = input.fallbackToCandidate.clarifying_question_if_uncertain;
  if (reason === 'two_competing_centers') {
    question = `Which center is the essay really about: "${top?.direction_line ?? 'first center'}" or "${runnerUp?.direction_line ?? 'second center'}"? Choose one and name the scene that proves it.`;
  } else if (reason === 'overloaded_input') {
    question = 'Your notes include multiple possible centers. Which single scene should anchor the essay, and what changed in that exact scene?';
  } else if (reason === 'low_signal') {
    question = 'Name one specific moment (not a general lesson) where your first approach failed and you changed what you did next.';
  } else if (reason === 'fallback_risk') {
    question = 'What concrete interaction should anchor this direction so the story is evidence-backed rather than abstract?';
  }

  return {
    question_text: question,
    linked_candidate_id: input.fallbackToCandidate.candidate_id,
    question_reason: reason,
  };
}

function evaluateClarificationSpecificity(text: string): 'strong' | 'medium' | 'weak' {
  const normalized = text.toLowerCase();
  if (!normalized) return 'weak';
  if (/say more|why did this matter|what did you learn/.test(normalized)) return 'weak';
  if (/which|choose|specific moment|single scene|what changed|first approach/i.test(normalized)) return 'strong';
  return 'medium';
}

function enforceClarificationSpecificity(
  question: NonNullable<RuntimeScoringResult['clarifying_question']>,
  input: {
    context: NdsNormalizedContextPack;
    scoring: RuntimeScoringResult;
    inputStress: InputStressProfile;
  }
): NonNullable<RuntimeScoringResult['clarifying_question']> {
  if (evaluateClarificationSpecificity(question.question_text) !== 'weak') return question;
  return buildClarificationQuestionPacket({
    context: input.context,
    scoring: input.scoring,
    fallbackToCandidate: input.scoring.candidates[0],
    inputStress: input.inputStress,
    hasExplicitUncertainty: input.inputStress.explicit_uncertainty,
  });
}

function shouldAllowRecoveredShow(
  scoring: RuntimeScoringResult,
  inputStress: InputStressProfile
): boolean {
  const top = scoring.candidates[0];
  if (!top) return false;
  if (!inputStress.degraded_input_mode) return false;
  if (!inputStress.format_weirdness) return false;
  if (inputStress.low_signal || inputStress.polished_empty || inputStress.explicit_uncertainty || inputStress.contradiction) return false;
  if (inputStress.actionable_signal_strength === 'weak') return false;

  const strongSupport = top.validator_flags.candidate_support_density === 'strong';
  const mediumSupport = top.validator_flags.candidate_support_density === 'medium';
  const familyReliable =
    top.validator_flags.family_confidence === 'strong' ||
    top.validator_flags.family_confidence === 'partial';

  return (
    (strongSupport || (mediumSupport && top.validator_flags.family_confidence === 'strong')) &&
    familyReliable &&
    top.scores.total_score >= 0.8 &&
    (
      scoring.score_summary.score_margin >= 0.08 ||
      (scoring.score_summary.runner_up_score === 0 && top.scores.total_score >= 0.82)
    )
  );
}

function scoreRuntimeCandidates(
  candidates: RuntimeCandidateSeed[],
  executionMode: NdsModuleExecutionInput['execution_mode'],
  inputStress: InputStressProfile
): RuntimeScoringResult {
  // Assess input strength to inform confidence and routing
  const avgEvidenceLength = candidates.reduce(
    (acc, c) => acc + c.evidence_spans.reduce((e, span) => e + span.text.length, 0),
    0
  ) / candidates.length;
  const avgTensionLength = candidates.reduce((acc, c) => acc + c.core_tension.length, 0) / candidates.length;
  const avgSummaryLength = candidates.reduce((acc, c) => acc + c.direction_summary.length, 0) / candidates.length;

  const inputIsWeak = avgEvidenceLength < 80 || avgTensionLength < 20 || avgSummaryLength < 100 || inputStress.low_signal;
  const inputIsAmbiguous = avgSummaryLength > 300 && avgTensionLength < 30;

  const scored = candidates.map((candidate, _, all) => {
    const validatorFlags = deriveValidatorFlags(candidate, all);
    const scores = deriveCandidateScores(candidate, executionMode, validatorFlags, inputIsWeak, inputStress);
    return { candidate, validatorFlags, scores };
  });

  const rejected_candidates: NdsRejectedCandidate[] = scored
    .filter((item) => !item.validatorFlags.passes_minimum_quality)
    .map((item) => ({
      candidate_id: item.candidate.candidate_id,
      direction_line: item.candidate.direction_line,
      rejection_reasons: deriveRejectionReasons(item.candidate, item.validatorFlags),
    }));

  // Sort by total_score — winner is earned through scoring, not seed status
  const validSurvivors = scored
    .filter((item) => item.validatorFlags.passes_minimum_quality)
    .sort((a, b) => b.scores.total_score - a.scores.total_score);
  // Diagnostics hardening: always surface at least one candidate so callers can
  // inspect validator flags even when every candidate was rejected.
  const survivors =
    validSurvivors.length > 0
      ? validSurvivors
      : [...scored].sort((a, b) => b.scores.total_score - a.scores.total_score).slice(0, 1);

  const topScore = roundScore(survivors[0]?.scores.total_score ?? 0);
  const runnerUpScore = roundScore(survivors[1]?.scores.total_score ?? 0);
  let scoreMargin = roundScore(Math.max(0, topScore - runnerUpScore));

  // For ambiguous input, tighten the margin to signal uncertainty
  if (inputIsAmbiguous && scoreMargin > 0.12) {
    scoreMargin = 0.08 + (scoreMargin - 0.25) * 0.3; // Compress margins toward 0.08-0.12
  }

  // For weak input, also tighten margin and lower confidence
  if (inputIsWeak) {
    scoreMargin = Math.min(scoreMargin, 0.12);
  }

  if (inputStress.low_signal || inputStress.polished_empty) {
    scoreMargin = Math.min(scoreMargin, 0.09);
  }

  const confidence_band = deriveConfidenceBand(topScore, scoreMargin, executionMode, inputIsWeak, inputIsAmbiguous);
  const route_decision = deriveRouteDecision(survivors.length, confidence_band, executionMode);
  const selected_candidate_id = survivors[0]?.candidate.candidate_id ?? null;

  const candidatesWithRanks: NdsScoredCandidate[] = survivors.map((item, index) => ({
    candidate_id: item.candidate.candidate_id,
    direction_line: item.candidate.direction_line,
    direction_summary: item.candidate.direction_summary,
    core_tension: item.candidate.core_tension,
    before_state: item.candidate.before_state,
    after_state: item.candidate.after_state,
    evidence_spans: item.candidate.evidence_spans,
    why_strong: item.candidate.why_strong,
    risk_if_chosen: item.candidate.risk_if_chosen,
    clarifying_question_if_uncertain: item.candidate.clarifying_question_if_uncertain,
    scores: item.scores,
    validator_flags: item.validatorFlags,
    rank: index + 1,
    selected: index === 0,
  }));

  const clarifying_question =
    route_decision === 'ask_question_before_showing' && candidatesWithRanks[0]
      ? {
          question_text: candidatesWithRanks[0].clarifying_question_if_uncertain,
          linked_candidate_id: candidatesWithRanks[0].candidate_id,
          question_reason: (scoreMargin < 0.08 ? 'resolve_candidate_tie' : 'clarify_shift') as
            | 'disambiguate_tension'
            | 'clarify_shift'
            | 'strengthen_scene'
            | 'resolve_candidate_tie'
            | 'missing_scene'
            | 'missing_reflection'
            | 'axis_collision'
            | 'two_competing_centers'
            | 'low_signal'
            | 'overloaded_input'
            | 'fallback_risk',
        }
      : null;

  return {
    candidates: candidatesWithRanks,
    rejected_candidates,
    selected_candidate_id,
    confidence_band,
    route_decision,
    score_summary: {
      top_score: topScore,
      runner_up_score: runnerUpScore,
      score_margin: scoreMargin,
    },
    clarifying_question,
  };
}

function deriveCandidateScores(
  candidate: RuntimeCandidateSeed,
  executionMode: NdsModuleExecutionInput['execution_mode'],
  flags: NdsCandidateValidatorFlags,
  inputIsWeak: boolean = false,
  inputStress?: InputStressProfile
): NdsCandidateScores {
  // Compute scores based on actual candidate content, not on seed kind priority
  // This allows evidence-backed alternatives to win
  
  // Extract signal strengths from candidate content
  const textLength = candidate.direction_summary.length;
  const tensionLength = candidate.core_tension.length;
  const evidenceLength = candidate.evidence_spans.reduce((acc, span) => acc + span.text.length, 0);
  const beforeLength = candidate.before_state.length;
  const afterLength = candidate.after_state.length;
  const evidenceCount = candidate.evidence_spans.length;
  
  // Compute dimension scores from content, not kind defaults
  // Higher scores for richer, more specific, more grounded content
  
  // Evidence grounding: based on evidence text length and span count
  const evidenceScore = clamp(
    Math.min(1, (evidenceLength / 150) * 0.6 + (evidenceCount >= 2 ? 0.25 : 0) + (evidenceCount >= 3 ? 0.15 : 0))
  );
  
  // Specificity: detect concrete language (moment, instance, scene, when, etc.)
  const combinedText = `${candidate.direction_summary} ${candidate.core_tension}`;
  const semanticAnchors = deriveSemanticAnchors(candidate);
  const anchorText = [
    semanticAnchors.core_event,
    semanticAnchors.core_shift,
    semanticAnchors.before_state,
    semanticAnchors.after_state,
    ...semanticAnchors.evidence_anchors,
  ].join(' ');
  const anchorSupport = lexicalOverlap(anchorText, `${candidate.direction_line} ${combinedText}`);
  const hasSpecificityMarkers = /moment|instance|incident|time|when|scene|realized|recognized|noticed|specific|exact|redesigned|implemented|trained|advocated|documented|assigned|delegat|coached|built|increased|reduced|improved|\b\d+\b|%/i.test(
    combinedText
  );
  const specificityScore = clamp(
    (textLength / 200) * 0.45 +
      (hasSpecificityMarkers ? 0.35 : 0.15) +
      anchorSupport * 0.15
  );
  
  // Buildability: based on before/after clarity and transition language
  const hasTransitionMarkers = /changed|shifted|altered|different|adjusted|learned|understood|discovered|realized|recognized|noticed|saw|perceived|revised|reformed|adapted|delegat|stopped|started|no\s+longer|instead\s+of|had\s+to/i.test(
    combinedText
  );
  const hasActionOutcomeMarkers = /redesigned|implemented|delegat|assigned|trained|advocated|documented|coached|built|increased|reduced|improved|\b\d+\b|%/i.test(
    combinedText
  );
  const hasActionTransitionArc = hasActionOutcomeMarkers && hasTransitionMarkers;
  const hasRealizationDepthMarkers = /not\s+the\s+.*\s+but\s+|not\s+.*\s+enough|for\s+the\s+wrong\s+reason|how\s+i\s+understood|changed\s+everything|needed\s+me\s+to\s+ask\s+better\s+questions|question\s+every\s+assumption|listening\s+more\s+than\s+talking/i.test(
    combinedText
  );
  const buildabilityScore = clamp(
    (beforeLength / 80) * 0.3 +
    (afterLength / 80) * 0.3 +
    (beforeLength > 20 && afterLength > 30 ? 0.2 : 0) +
    (hasTransitionMarkers ? 0.2 : 0) +
    (anchorSupport * 0.08) +
    (hasActionTransitionArc ? 0.04 : 0)
  );
  
  // Scene strength: based on overall richness (text + tension + evidence combined)
  const richness = textLength + tensionLength + evidenceLength;
  const sceneScore = clamp(
    Math.min(1, (richness / 500) * 0.8 + (tensionLength > 40 ? 0.2 : 0))
  );
  
  // Non-genericity: penalize if generic flags, reward if specific markers
  const hasGenericReflectionPhrases = /moment of growth|needed to be different|transformation in my understanding|became more humble|think differently|profound in some way/i.test(
    combinedText
  );
  const genericityPenalty = (flags.is_too_generic ? 0.25 : 0) + (hasGenericReflectionPhrases ? 0.12 : 0);
  const nonGenericScore = clamp(
    (hasSpecificityMarkers ? 0.75 : 0.4) +
      (hasRealizationDepthMarkers ? 0.06 : 0) +
      anchorSupport * 0.08 -
      genericityPenalty
  );
  
  // Distinctness: moderately reward based on validator flags
  const distinctScore = clamp(
    (flags.is_distinct_from_others ? 0.8 : 0.5)
  );
  
  // Reflective potential: based on transition markers and narrative arc
  const reflectiveScore = clamp(
    (hasTransitionMarkers ? 0.75 : 0.4) +
      (textLength > 100 ? 0.12 : 0) +
      (hasActionTransitionArc ? 0.04 : 0) +
      (hasRealizationDepthMarkers ? 0.08 : 0) -
      (anchorSupport < 0.18 ? 0.03 : 0) -
      (hasGenericReflectionPhrases ? 0.15 : 0)
  );
  
  // Coherence: based on overall balance of content
  const coherenceScore = clamp(
    (textLength > 0 && tensionLength > 0 && evidenceLength > 0 ? 0.75 : 0.4) +
    (beforeLength > 0 && afterLength > 0 ? 0.2 : 0)
  );
  
  // Penalties and adjustments
  const modePenalty = executionMode === 'reduced_scope' ? 0.08 : 0;
  const abstractionPenalty = flags.has_banned_abstraction ? 0.25 : 0;
  // Graduated meta-label penalty by axis_presence level:
  //   strong = line names a real axis noun → small penalty (0.08)
  //   weak   = generic structural word only → larger penalty (0.14)
  //   missing = no axis noun at all → maximum penalty (0.20)
  const metaLabelPenalty = flags.meta_label_penalty
    ? flags.axis_presence === 'strong'
      ? 0.08
      : flags.axis_presence === 'weak'
        ? 0.14
        : 0.20
    : 0;
  const fallbackPenalty = flags.fallback_contaminated ? 0.18 : 0;
  const duplicationPenalty =
    flags.candidate_duplication_risk === 'high'
      ? 0.12
      : flags.candidate_duplication_risk === 'medium'
        ? 0.05
        : 0;
  const supportBoost =
    flags.candidate_support_density === 'strong'
      ? 0.06
      : flags.candidate_support_density === 'medium'
        ? 0.02
        : -0.04;
  const familyBoost =
    flags.family_confidence === 'strong'
      ? 0.08
      : flags.family_confidence === 'partial'
        ? 0.03
        : -0.03;
  
  // Apply weak input adjustments: don't penalize evidence-strong alternatives
  const weakPenaltyIfWeaker = inputIsWeak && evidenceScore < 0.5 ? 0.1 : 0;
  const plainLanguageBoost = textLength < 120 && anchorSupport >= 0.35 ? 0.02 : 0;
  const hingeSupportBoost = candidate.hinge_supported ? 0.06 : 0;
  const hingeOverlapBoost = Math.min(0.05, (candidate.hinge_sentence_overlap_count ?? 0) * 0.02);
  const falsePremiumPenalty = candidate.false_premium_candidate_flag ? 0.2 : 0;
  const premiumWithoutSupportPenalty = candidate.premium_tone_without_support ? 0.14 : 0;
  const contextualPremiumPenalty =
    inputStress && (inputStress.polished_empty || inputStress.adult_shaped) && candidate.false_premium_candidate_flag
      ? 0.05
      : 0;
  
  const weighted = {
    student_specificity: clamp(specificityScore - modePenalty - weakPenaltyIfWeaker - metaLabelPenalty - duplicationPenalty - falsePremiumPenalty + plainLanguageBoost + familyBoost * 0.35 + hingeSupportBoost * 0.55),
    evidence_grounding: clamp(evidenceScore - modePenalty - fallbackPenalty - premiumWithoutSupportPenalty + supportBoost * 0.5 + hingeOverlapBoost * 0.6),
    non_genericity: clamp(nonGenericScore - abstractionPenalty - modePenalty - metaLabelPenalty - duplicationPenalty - falsePremiumPenalty - contextualPremiumPenalty + plainLanguageBoost * 0.5 + familyBoost * 0.2 + hingeSupportBoost * 0.4),
    buildability: clamp(buildabilityScore - modePenalty - weakPenaltyIfWeaker - metaLabelPenalty - fallbackPenalty - premiumWithoutSupportPenalty + supportBoost * 0.25 + hingeSupportBoost * 0.45),
    distinctness: clamp(distinctScore - modePenalty - duplicationPenalty),
    scene_strength: clamp(sceneScore - modePenalty - premiumWithoutSupportPenalty * 0.6 + hingeOverlapBoost * 0.4),
    reflective_potential: clamp(reflectiveScore - modePenalty - weakPenaltyIfWeaker - falsePremiumPenalty * 0.5 + familyBoost * 0.2 + hingeSupportBoost * 0.4),
    explanation_coherence: clamp(coherenceScore - modePenalty - metaLabelPenalty - fallbackPenalty * 0.5 - falsePremiumPenalty * 0.4 + hingeOverlapBoost * 0.25),
  };
  
  // Clarification need: based on content signals, not seed kind
  const hasClearNarrative = beforeLength > 20 && afterLength > 30 && tensionLength > 25;
  const clarification_need = clamp(
    executionMode === 'reduced_scope'
      ? hasClearNarrative ? 0.35 : 0.60
      : hasClearNarrative ? 0.15 : 0.40
  );
  
  // Weighted total using balanced evidence-based dimensions (no hacks)
  const total_score = roundScore(
    weighted.evidence_grounding * 0.22 +
      weighted.student_specificity * 0.20 +
      weighted.buildability * 0.18 +
      weighted.non_genericity * 0.15 +
      weighted.scene_strength * 0.12 +
      weighted.reflective_potential * 0.08 +
      weighted.distinctness * 0.03 +
      weighted.explanation_coherence * 0.02 +
      supportBoost * 0.03 +
        familyBoost * 0.04 +
        hingeSupportBoost * 0.03 +
        hingeOverlapBoost * 0.02 -
        falsePremiumPenalty * 0.06 -
        premiumWithoutSupportPenalty * 0.04
  );

  return {
    ...Object.fromEntries(
      Object.entries(weighted).map(([key, value]) => [key, roundScore(value)])
    ) as Omit<NdsCandidateScores, 'clarification_need' | 'total_score'>,
    clarification_need: roundScore(clarification_need),
    total_score,
  };
}

const SEMANTIC_STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'from', 'were', 'was', 'have', 'had', 'into', 'when', 'what',
  'your', 'their', 'there', 'then', 'than', 'over', 'under', 'after', 'before', 'while', 'because', 'about',
]);

function tokenizeSemantic(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !SEMANTIC_STOPWORDS.has(t));
}

function lexicalOverlap(source: string, target: string): number {
  const sourceTokens = new Set(tokenizeSemantic(source));
  const targetTokens = new Set(tokenizeSemantic(target));
  if (sourceTokens.size === 0 || targetTokens.size === 0) return 0;
  let matches = 0;
  for (const token of targetTokens) {
    if (sourceTokens.has(token)) matches += 1;
  }
  return matches / Math.max(1, targetTokens.size);
}

const ABSTRACT_DIRECTION_LOCK_PATTERN =
  /\b(moved\s+from\s+.+\s+to\s+.+|what\s+felt\s+right|when\s+it\s+mattered|responding\s+differently|standard\s+you\s+now\s+apply|what\s+changed\s+in\s+you|growth\s+mindset|becoming\s+a\s+better\s+person)\b/i;

const COACHING_INSTRUCTION_PATTERN =
  /^(write\s+about|build\s+from|focus\s+on|center\s+(?:the\s+essay\s+)?on|start\s+with|open\s+with|frame\s+the\s+essay\s+around|anchor\s+the\s+essay\s+in)\b|\b(the\s+moment|when\s+you|where\s+you\s+realized|start\s+with\s+the\s+moment|build\s+from\s+the\s+scene)\b/i;

const HINGE_SIGNAL_PATTERN =
  /\b(moment|when|after|before|instead|stopped|started|realized|decided|turned|shifted|changed|had\s+to|no\s+longer)\b/i;

const REPEATABLE_DIRECTION_PATTERN =
  /\b(growth|leadership|resilience|better\s+person|more\s+mature|meaningful\s+experience|life\s+lesson|general\s+story|personal\s+growth|what\s+matters\s+most)\b/i;

const NON_ANCHOR_TOKENS = new Set([
  'moment', 'when', 'after', 'before', 'changed', 'change', 'story', 'essay', 'direction', 'strongest', 'real', 'shift',
  'start', 'started', 'stopped', 'build', 'built', 'focus', 'center', 'student', 'your', 'you', 'they', 'them', 'their',
  'growth', 'leadership', 'generic', 'problem', 'issue', 'thing', 'situation',
]);

function hasConcreteSourceAnchor(directionLine: string, evidenceText: string): boolean {
  const sourceTokens = new Set(tokenizeSemantic(evidenceText));
  const lineTokens = tokenizeSemantic(directionLine).filter((token) => !NON_ANCHOR_TOKENS.has(token));
  if (lineTokens.length === 0 || sourceTokens.size === 0) return false;
  const overlapCount = lineTokens.filter((token) => sourceTokens.has(token)).length;
  return overlapCount >= 1;
}

function enforceDirectionRuleLockLine(candidate: RuntimeCandidateSeed): string {
  const currentLine = (candidate.direction_line ?? '').trim();
  if (!currentLine) return currentLine;

  const evidenceText = candidate.evidence_spans.map((span) => span.text).join(' ').trim();
  const overlap = lexicalOverlap(evidenceText, currentLine);
  const anchored = hasConcreteSourceAnchor(currentLine, evidenceText);
  const hasHinge = HINGE_SIGNAL_PATTERN.test(currentLine);
  const coachingForward = COACHING_INSTRUCTION_PATTERN.test(currentLine);
  const abstracted = ABSTRACT_DIRECTION_LOCK_PATTERN.test(currentLine);

  if ((anchored || overlap >= 0.14) && hasHinge && coachingForward && !abstracted) {
    return currentLine;
  }

  const anchor = extractConcreteAnchor(evidenceText || candidate.direction_summary, 11);
  if (!anchor || anchor === 'the described situation') {
    return currentLine;
  }

  return `Start with the moment ${anchor} changed what you did next.`;
}

function classifyAnchorType(text: string): ExtractedAnchorCandidate['anchor_type'] {
  const normalized = text.toLowerCase();
  if (/mother|father|parent|grandmother|grandfather|brother|sister|friend|teammate|coach|teacher|patient|student/.test(normalized)) {
    return 'person_or_relationship';
  }
  if (/moment|when|after|before|hallway|room|desk|clinic|practice|night|session|scene/.test(normalized)) {
    return 'scene_detail';
  }
  if (/stopped|started|changed|shifted|realized|instead|had to|no longer/.test(normalized)) {
    return 'shift';
  }
  if (/tension|conflict|pressure|risk|mistake|failure|problem|contradiction/.test(normalized)) {
    return 'tension';
  }
  if (/book|voicemail|letter|phone|tracker|rubric|ticket|script|line/.test(normalized)) {
    return 'object';
  }
  return 'phrase_fragment';
}

function extractAnchorCandidatesFromContext(context: NdsNormalizedContextPack): ExtractedAnchorCandidate[] {
  const candidates: ExtractedAnchorCandidate[] = [];

  context.story_signals.slice(0, 4).forEach((signal, index) => {
    const combined = `${signal.event_summary} ${signal.change_signal}`.trim();
    const anchorText = extractConcreteAnchor(combined, 12);
    if (!anchorText || anchorText === 'the described situation') return;
    candidates.push({
      text: anchorText,
      source_id: signal.source_id,
      source_type: 'story_entry',
      anchor_type: classifyAnchorType(anchorText),
      source_index: index,
    });
  });

  context.draft_signals.slice(0, 2).forEach((signal, index) => {
    const anchorText = extractConcreteAnchor(signal.signal_summary, 10);
    if (!anchorText || anchorText === 'the described situation') return;
    candidates.push({
      text: anchorText,
      source_id: signal.source_id,
      source_type: 'essay_draft_version',
      anchor_type: classifyAnchorType(anchorText),
      source_index: index,
    });
  });

  return candidates.slice(0, 8);
}

function extractHingeCandidatesFromContext(context: NdsNormalizedContextPack): ExtractedHingeCandidate[] {
  const candidates: ExtractedHingeCandidate[] = [];
  const hingeScoringPattern = /moment|when|after|before|instead|stopped|started|realized|had to|no longer|because/i;

  context.story_signals.slice(0, 4).forEach((signal, index) => {
    const text = `${signal.event_summary}. ${signal.change_signal}`;
    const hinge = extractShiftAnchor(text, signal.change_signal, 14);
    const relevance = lexicalOverlap(text, hinge);
    if (!hinge || hinge.length < 12) return;
    candidates.push({
      text: hinge,
      source_id: signal.source_id,
      source_type: 'story_entry',
      source_index: index,
      hinge_relevance_score: clamp(relevance + (hingeScoringPattern.test(hinge) ? 0.2 : 0)),
    });
  });

  return candidates
    .sort((a, b) => b.hinge_relevance_score - a.hinge_relevance_score)
    .slice(0, 6);
}

function buildWhyThisDirectionPlain(winner: NdsScoredCandidate | undefined, runnerUp: NdsScoredCandidate | undefined): string {
  if (!winner) return 'This direction is strongest because it gives you a concrete turning point you can draft from right away.';
  const winnerAnchor = extractConcreteAnchor(
    `${winner.direction_summary} ${winner.core_tension} ${winner.evidence_spans.map((s) => s.text).join(' ')}`,
    10
  );
  if (!runnerUp) {
    return `This direction is stronger because it stays with a real hinge — ${winnerAnchor} — instead of a broad theme.`;
  }
  const margin = winner.scores.total_score - runnerUp.scores.total_score;
  const comparative = margin >= 0.08
    ? 'It gives you a clearer turning point and stronger evidence than the other options.'
    : 'It still edges out the other options because the hinge is more concrete and easier to write.';
  return `${comparative} Build from ${winnerAnchor} so the draft starts in a scene, not a summary.`;
}

function buildDisplayEvidenceAnchors(
  winnerSeed: RuntimeCandidateSeed | null,
  fallbackSources: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  if (!winnerSeed || winnerSeed.evidence_spans.length === 0) {
    return fallbackSources;
  }

  const line = winnerSeed.direction_line;
  const primaryStorySourceId = (fallbackSources.find((item) => item.source_type === 'story_entry')?.source_id as string | null) ?? null;

  const scored = winnerSeed.evidence_spans.map((span, index) => {
    const excerpt = extractConcreteAnchor(span.text, 12);
    const hingeRelevance = clamp(lexicalOverlap(`${line} ${winnerSeed.core_tension}`, span.text) + 0.2);
    const anchorType = classifyAnchorType(excerpt);
    return {
      label: `Evidence ${index + 1}`,
      source_type: 'story_entry',
      source_id: primaryStorySourceId,
      excerpt,
      source_index: index,
      anchor_type: anchorType,
      hinge_relevance_score: roundScore(hingeRelevance),
      support_role: hingeRelevance >= 0.12 ? 'supports_selected' : 'weakens_selected',
      _score: hingeRelevance,
    };
  });

  const selected = scored
    .sort((a, b) => b._score - a._score)
    .slice(0, 4)
    .map(({ _score, ...rest }) => rest);

  if (selected.length >= 2) return selected;
  return [...selected, ...fallbackSources].slice(0, 4);
}

function buildRejectedDirectionRationale(rejected: NdsRejectedCandidate[]): string {
  if (rejected.length === 0) {
    return 'No stronger alternative was rejected by quality gates.';
  }
  const topRejected = rejected[0];
  const reason = topRejected.rejection_reasons[0] ?? 'quality_gate_reject';
  return `Rejected ${topRejected.candidate_id} because ${reason.replace(/_/g, ' ')}.`;
}

function deriveSemanticAnchors(candidate: RuntimeCandidateSeed | null): {
  core_event: string;
  core_shift: string;
  story_axis: string;
  before_state: string;
  after_state: string;
  evidence_anchors: string[];
} {
  if (!candidate) {
    return {
      core_event: 'no_event_anchor',
      core_shift: 'no_shift_anchor',
      story_axis: 'unknown',
      before_state: 'no_before_state',
      after_state: 'no_after_state',
      evidence_anchors: [],
    };
  }

  const evidenceText = candidate.evidence_spans.map((s) => s.text).join(' ');
  const axisFromKind =
    candidate.kind === 'system_redesign'
      ? 'system_redesign'
      : candidate.kind === 'delegation_distributed_responsibility'
        ? 'delegation'
        : candidate.kind === 'pattern_breaking'
          ? 'pattern_breaking'
          : candidate.kind === 'identity_transformation'
            ? 'identity_transformation'
            : candidate.kind === 'relationship_or_listening'
              ? 'relationship_or_listening'
              : candidate.kind;

  return {
    core_event: extractConcreteAnchor(evidenceText || candidate.direction_summary, 14),
    core_shift: extractShiftAnchor(evidenceText, candidate.core_tension, 12),
    story_axis: axisFromKind,
    before_state: extractConcreteAnchor(candidate.before_state, 11),
    after_state: extractConcreteAnchor(candidate.after_state, 11),
    evidence_anchors: candidate.evidence_spans.map((s) => extractConcreteAnchor(s.text, 10)),
  };
}

const META_LABEL_HARD_REJECT_PATTERN =
  /\b(the\s+angle\s+behind|the\s+story\s+behind|what\s+changed\s+after|the\s+shift\s+behind|how\s+the\s+student\s+corrected\s+course|the\s+moment\s+the\s+student\s+corrected\s+course|what\s+happened\s+after\s+the\s+moment|the\s+structure\s+behind\s+the\s+event|the\s+narrative\s+behind)\b/i;

const META_LABEL_SOFT_PENALTY_PATTERN =
  /\b(how\s+the\s+student\s+handled|how\s+you\s+handled|how\s+you\s+performed|how\s+you\s+kept\s+going|how\s+you\s+stayed\s+committed|how\s+you\s+kept\s+working|what\s+the\s+experience\s+taught|what\s+the\s+moment\s+revealed|the\s+important\s+part\s+was\s+not|how\s+your\s+changed\s+approach\s+affected|how\s+your\s+changed\s+approach\s+affected\s+the\s+other\s+people)\b/i;

// Strong axis presence: specific axis nouns that clearly name what the story is about.
// Matching any of these means the line names a real story center.
// Note: stem-based terms use \w* to catch inflected forms (redesigned, delegated, etc.)
const AXIS_STRONG_PATTERN =
  /\b(listen(?:ing|ed|s)?|responsibilit(?:y|ies)|owed|delegat\w*|distribut\w*|bottleneck|handoff|shared\s+ownership|redesign\w*|pattern|habit|stopped\s+repeating|identit(?:y|ies)|self-concept|becoming|voice|trust|relationship|care\s+meant|person\s+in\s+front|person\s+mattered|intellectual\s+humility|control\s+vs|task\s+vs|fixing\s+vs|managing\s+vs|presence\s+vs|attention\s+vs|care\s+vs)\b/i;

// Weak axis presence: generic structural words that hint at an axis but do not name it.
// These alone cannot rescue a soft-meta line.
const AXIS_WEAK_PATTERN =
  /\b(system|process|workflow|tracker|architecture|structure|team|method|experiment|failure|care|dignity|tutoring|explanation|conflict|argument|self|becoming|voice|trust)\b/i;

function deriveValidatorFlags(
  candidate: RuntimeCandidateSeed,
  allCandidates: RuntimeCandidateSeed[]
): NdsCandidateValidatorFlags {
  const abstractionPattern =
    /\b(clearest direction|strongest version|shift in your role|first instinct|standard you now apply|visible shift|concrete after-effect|what changed in that setting|stronger center|real turn)\b/i;
  const genericPattern = /\b(growth|leadership|meaningful|resilience|general story)\b/i;
  const has_banned_abstraction = abstractionPattern.test(candidate.direction_line);
  const is_too_generic = genericPattern.test(candidate.direction_line) || candidate.kind === 'generic';
  const evidenceText = candidate.evidence_spans.map((span) => span.text).join(' ').trim();
  const sourceAnchorOverlap = lexicalOverlap(evidenceText, candidate.direction_line);
  const has_source_anchor = hasConcreteSourceAnchor(candidate.direction_line, evidenceText) || sourceAnchorOverlap >= 0.12;
  const has_narrative_hinge = HINGE_SIGNAL_PATTERN.test(candidate.direction_line);
  const is_coaching_instruction = COACHING_INSTRUCTION_PATTERN.test(candidate.direction_line);
  const lineTokens = tokenizeSemantic(candidate.direction_line);
  const abstractVerbCount = (candidate.direction_line.toLowerCase().match(/\b(feel|felt|matter|mattered|respond|responding|become|becoming|grow|growing|evolve|evolving|understand|understanding)\b/g) ?? []).length;
  const abstractVerbDensity = lineTokens.length > 0 ? abstractVerbCount / lineTokens.length : 0;
  const repeatable_direction_risk =
    REPEATABLE_DIRECTION_PATTERN.test(candidate.direction_line) ||
    (abstractVerbDensity >= 0.34 && !has_source_anchor) ||
    (sourceAnchorOverlap < 0.08 && !has_source_anchor) ||
    ABSTRACT_DIRECTION_LOCK_PATTERN.test(candidate.direction_line);
  const passes_direction_rule_lock = has_source_anchor && has_narrative_hinge && is_coaching_instruction && !repeatable_direction_risk;
  const hardMetaLabelMatch = META_LABEL_HARD_REJECT_PATTERN.exec(candidate.direction_line);
  const softMetaLabelMatch = META_LABEL_SOFT_PENALTY_PATTERN.exec(candidate.direction_line);
  // 3-level axis presence: strong (specific axis noun) > weak (generic structural word) > missing
  const axis_presence: 'strong' | 'weak' | 'missing' = AXIS_STRONG_PATTERN.test(candidate.direction_line)
    ? 'strong'
    : AXIS_WEAK_PATTERN.test(candidate.direction_line)
      ? 'weak'
      : 'missing';
  // Soft meta + axis_presence 'strong' → penalty only (line names a real axis, just worded slightly meta)
  // Soft meta + axis_presence 'weak' or 'missing' → hard reject (generic structural word is not enough)
  const meta_label_reject = Boolean(hardMetaLabelMatch) || (Boolean(softMetaLabelMatch) && axis_presence !== 'strong');
  const meta_label_penalty = Boolean(softMetaLabelMatch);
  const meta_label_reason = meta_label_reject
    ? hardMetaLabelMatch
      ? `hard_reject:${hardMetaLabelMatch[0].toLowerCase()}`
      : axis_presence === 'weak'
        ? 'hard_reject:soft_meta_with_only_weak_axis'
        : 'hard_reject:soft_meta_without_axis'
    : meta_label_penalty
      ? `soft_penalty:${softMetaLabelMatch?.[0].toLowerCase() ?? 'meta_language'}`
      : null;
  const has_clear_evidence = candidate.evidence_spans.length > 0 && candidate.evidence_spans.some((item) => item.text.trim().length > 0);
  const is_distinct_from_others =
    allCandidates.filter((item) => item.candidate_id !== candidate.candidate_id).every((item) => item.direction_line !== candidate.direction_line);
  const fallback_contaminated =
    candidate.fallback_contaminated ?? candidate.evidence_spans.some((span) => FALLBACK_EVIDENCE_PATTERN.test(span.text));
  const candidate_duplication_risk = candidate.candidate_duplication_risk ?? 'low';
  const candidate_support_density = candidate.candidate_support_density ?? deriveSupportDensity(candidate);
  const family_confidence = candidate.family_confidence ?? deriveFamilyConfidence(candidate);
  const passes_minimum_quality =
    !has_banned_abstraction &&
    !is_too_generic &&
    passes_direction_rule_lock &&
    has_clear_evidence &&
    is_distinct_from_others &&
    !meta_label_reject &&
    !(fallback_contaminated && candidate_support_density === 'weak');

  return {
    has_banned_abstraction,
    is_too_generic,
    has_source_anchor,
    has_narrative_hinge,
    is_coaching_instruction,
    repeatable_direction_risk,
    passes_direction_rule_lock,
    has_clear_evidence,
    is_distinct_from_others,
    meta_label_reject,
    meta_label_penalty,
    meta_label_reason,
    axis_presence,
    degraded_input_mode: candidate.degraded_input_mode ?? false,
    fallback_contaminated,
    candidate_duplication_risk,
    candidate_support_density,
    family_confidence,
    passes_minimum_quality,
  };
}

function deriveRejectionReasons(
  candidate: RuntimeCandidateSeed,
  flags: NdsCandidateValidatorFlags
): string[] {
  const reasons: string[] = [];
  if (!flags.has_source_anchor) reasons.push('missing_source_anchor');
  if (!flags.has_narrative_hinge) reasons.push('missing_narrative_hinge');
  if (!flags.is_coaching_instruction) reasons.push('not_coaching_instruction');
  if (flags.repeatable_direction_risk) reasons.push('repeatable_or_abstract_direction');
  if (!flags.passes_direction_rule_lock) reasons.push('recommended_direction_rule_lock_failed');
  if (flags.is_too_generic) reasons.push('generic_angle');
  if (!flags.has_clear_evidence) reasons.push('weak_evidence');
  if (flags.has_banned_abstraction) reasons.push('abstraction_heavy_language');
  if (flags.meta_label_reject) reasons.push(`meta_label_reject:${flags.meta_label_reason ?? 'meta_language'}`);
  if (!flags.is_distinct_from_others || candidate.kind === 'generic') reasons.push('redundant_with_stronger_candidate');
  return reasons.length > 0 ? reasons : ['schema_invalid'];
}

function deriveConfidenceBand(
  topScore: number,
  scoreMargin: number,
  executionMode: NdsModuleExecutionInput['execution_mode'],
  inputIsWeak: boolean = false,
  inputIsAmbiguous: boolean = false
): NdsConfidenceBand {
  // Weak inputs => low confidence unless very high score gap
  if (inputIsWeak) {
    if (topScore >= 0.82 && scoreMargin >= 0.18) return 'high';
    if (topScore >= 0.72 && scoreMargin >= 0.12) return 'medium';
    return 'low';
  }

  // Ambiguous inputs => lower confidence ceiling
  if (inputIsAmbiguous) {
    if (topScore >= 0.85 && scoreMargin >= 0.15) return 'high';
    if (topScore >= 0.75 && scoreMargin >= 0.08) return 'medium';
    return 'low';
  }

  // Standard confidence logic
  if (executionMode === 'reduced_scope') return scoreMargin >= 0.08 && topScore >= 0.72 ? 'medium' : 'low';
  if (topScore >= 0.8 && scoreMargin >= 0.1) return 'high';
  if (topScore >= 0.68 && scoreMargin >= 0.07) return 'medium';
  return 'low';
}

function deriveRouteDecision(
  survivorCount: number,
  confidenceBand: NdsConfidenceBand,
  executionMode: NdsModuleExecutionInput['execution_mode']
): NdsRouteDecision {
  if (survivorCount === 0) return 'regen_candidates';
  if (executionMode === 'reduced_scope' || confidenceBand === 'low') return 'ask_question_before_showing';
  return 'show_strongest_direction';
}

function inferAxisFromLine(directionLine: string): string {
  const line = directionLine.toLowerCase();
  if (/listening|person in front|relationship|owed the/.test(line)) return 'relationship_or_listening';
  if (/redesign|system|process|workflow|tracker|architecture/.test(line)) return 'system_redesign';
  if (/delegat|distributed|bottleneck|shared ownership|handoff/.test(line)) return 'delegation';
  if (/pattern|stopped repeating|wrong pattern|habit/.test(line)) return 'pattern_breaking';
  if (/identity|who you were becoming|self|self-concept/.test(line)) return 'identity_transformation';
  if (/responsibility|owed/.test(line)) return 'responsibility';
  return 'unclassified';
}

function buildPrimaryDirectionLine(domain: string, angleTitle: string): string {
  const byDomain: Record<string, string> = {
    community_care: 'The moment helping stopped being about doing the task and started being about listening to the person in front of you.',
    technical_leadership: 'The moment solving it alone started hurting the team and you had to work differently.',
    debate_conflict: 'The moment being right in the argument stopped helping and listening mattered more.',
    peer_teaching: 'The moment your explanation stopped working and you had to rethink what help looked like.',
    research_failure: 'The decision to rethink your method after failure, instead of just reacting to the loss.',
    service_operations: 'The moment moving fast stopped helping and you had to slow down enough to read the situation.',
    athletic_recovery: 'The period when performance was gone and you had to find a different way to matter to the team.',
    other: 'The moment your first approach stopped helping and you changed what the situation actually needed.',
  };
  return byDomain[domain] ?? byDomain.other;
}

function buildNeedsMoreInputPayload(
  recoveryQuestion: string,
  inputStress: InputStressProfile
): NdsPayload {
  return {
    status: 'needs_more_input',
    best_direction: null,
    alternatives: [],
    evidence_anchors: [],
    depth_signals: {
      detected_tension: null,
      detected_shift: null,
      obvious_but_weaker_angle: null,
      essay_opportunity: null,
    },
    recovery_question: recoveryQuestion,
    selected_candidate_id: null,
    confidence_band: 'low',
    route_decision: 'ask_question_before_showing',
    score_summary: {
      top_score: 0,
      runner_up_score: 0,
      score_margin: 0,
    },
    candidates: [],
    rejected_candidates: [],
    clarifying_question: {
      question_text: recoveryQuestion,
      linked_candidate_id: 'recovery_question',
      question_reason: 'strengthen_scene',
    },
    scoring_debug: {
      generated_candidate_count: 0,
      surviving_candidate_count: 0,
      selected_candidate_id: null,
      candidate_rankings: [],
      candidates: [],
      rejected_candidates: [],
      score_summary: {
        top_score: 0,
        runner_up_score: 0,
        score_margin: 0,
      },
      confidence_band: 'low',
      route_decision: 'ask_question_before_showing',
      shift_risk_flags: {
        adult_shaped: inputStress.adult_shaped,
        polished_empty: inputStress.polished_empty,
        cultural_indirect: inputStress.cultural_indirect,
        contradiction: inputStress.contradiction,
        low_signal: inputStress.low_signal,
      },
      shift_confidence_compressed: true,
      polished_emptiness_skepticism_activated:
        inputStress.polished_empty || inputStress.adult_shaped,
      cultural_style_support_activated: inputStress.cultural_indirect,
      contradiction_sensitive_clarification_activated: inputStress.contradiction,
      weak_note_recovery_mode_activated: inputStress.low_signal || inputStress.very_thin_signal,
      generic_fallback_suppression_activated: true,
      indirect_hinge_candidates_detected: [],
      hinge_sentence_count: 0,
      hinge_support_activated: false,
      false_premium_candidate_flag: false,
      premium_tone_without_support: false,
      false_premium_suppression_activated: true,
      careful_but_unhelpful_risk: true,
      useful_caution_mode_activated: true,
      flat_line_repair_activated: false,
    } as any,
  };
}

function buildCompetenceDirectionLine(domain: string): string {
  const byDomain: Record<string, string> = {
    community_care: 'How you adjusted your approach once you paid attention to what the person in front of you actually needed.',
    technical_leadership: 'How you proved you could solve the technical problem under pressure.',
    debate_conflict: 'How you handled the argument with skill under pressure.',
    peer_teaching: 'How you kept tutoring through a difficult explanation.',
    research_failure: 'How you recovered after the experiment failed.',
    service_operations: 'How you managed the work when the system you were using stopped holding.',
    athletic_recovery: 'How you found a way to contribute through the hardest stretch of the season.',
    other: 'How you handled the work once you understood what was actually needed.',
  };
  return byDomain[domain] ?? byDomain.other;
}

function buildResponsibilityDirectionLine(domain: string): string {
  const byDomain: Record<string, string> = {
    community_care: 'What you owed the person you were trying to help once you realized your approach was off.',
    technical_leadership: 'How your decisions affected the people around you, not just the result.',
    debate_conflict: 'What you owed the room once the conflict stopped being only about your argument.',
    peer_teaching: 'What real help looked like once you paid attention to the student in front of you.',
    research_failure: 'What your response to failure showed about your responsibility to the work itself.',
    service_operations: 'What slowing down and reading the situation more carefully made possible for the people you were serving.',
    athletic_recovery: 'What you owed your teammates during the period when your usual role was not available.',
    other: 'How your changed approach affected the other people in the same situation.',
  };
  return byDomain[domain] ?? byDomain.other;
}

function deriveBeforeState(changeSignal: string, domain: string): string {
  if (/feedback|correct/.test(changeSignal.toLowerCase())) return 'Operating on the first approach without fully questioning it.';
  if (domain === 'community_care') return 'Trying to help by doing the task quickly and correctly.';
  if (domain === 'technical_leadership') return 'Assuming solving the problem yourself was the best way forward.';
  return 'Operating from the obvious first version of the situation.';
}

function deriveAfterState(changeSignal: string, domain: string): string {
  if (/feedback|correct/.test(changeSignal.toLowerCase())) return 'Adjusting behavior after the correction landed in a visible way.';
  if (domain === 'community_care') return 'Listening first and measuring help by whether it actually landed.';
  if (domain === 'technical_leadership') return 'Changing how you worked so the team could function better.';
  return 'Working from a more specific and accountable understanding of what mattered.';
}

function buildClarifyingQuestion(domain: string, fallback: string): string {
  const byDomain: Record<string, string> = {
    community_care: 'When you realized your help was not landing the way you expected, what did you do differently right after that?',
    technical_leadership: 'What exact moment showed you that solving it alone was making the team weaker?',
    debate_conflict: 'What was the first sign that winning the argument was no longer the real point?',
    peer_teaching: 'What made you realize your explanation was not actually helping the other person learn?',
    research_failure: 'After the failure, what did you change in your method before you changed your mindset?',
    other: `What specific moment inside "${truncateForQuestion(fallback)}" best shows why this angle matters?`,
  };
  return byDomain[domain] ?? byDomain.other;
}

function buildEvidenceSpans(
  signal: NdsNormalizedContextPack['story_signals'][number] | null,
  context: NdsNormalizedContextPack
): Array<{ text: string; start_char: number; end_char: number }> {
  const preferredTexts = selectPreferredEvidenceCandidates([
    signal?.event_summary ?? '',
    signal?.change_signal ?? '',
    ...context.story_signals.map((candidate) => candidate.event_summary ?? ''),
    ...context.story_signals.map((candidate) => candidate.change_signal ?? ''),
  ]);
  const rawText =
    context.story_signals.find((candidate) => candidate.source_id === signal?.source_id)?.event_summary ??
    signal?.event_summary ??
    context.story_signals[0]?.event_summary ??
    context.draft_signals[0]?.signal_summary ??
    '';
  const spans = preferredTexts
    .slice(0, 2)
    .map((text) => ({
      text,
      start_char: findStart(rawText, text),
      end_char: findStart(rawText, text) + text.length,
    }));

  return spans.length > 0
    ? spans
    : [
        {
          text: rawText || 'No clear evidence span available.',
          start_char: 0,
          end_char: (rawText || 'No clear evidence span available.').length,
        },
      ];
}

function findStart(source: string, snippet: string): number {
  if (!source || !snippet) return 0;
  const idx = source.indexOf(snippet);
  return idx >= 0 ? idx : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}

function truncateForQuestion(text: string): string {
  return text.length > 96 ? `${text.slice(0, 93).trim()}…` : text;
}

const META_INSTRUCTIONAL_TEXT_PATTERN =
  /^(the strongest direction|a strong output|a weak output|a weak answer|a good output|the essay should not|the essay should|avoid turning|do not let the model|preserve the|reviewer warning:)/i;

const DANGLING_FRAGMENT_PATTERN = /\b(a|an|the|and|or|of|to|as|not|than|by|with|for)$/i;

function isMetaInstructionalText(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return false;
  return META_INSTRUCTIONAL_TEXT_PATTERN.test(normalized);
}

function cleanAnchorFragment(text: string): string {
  let normalized = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[,:;\-–—]+/, '')
    .replace(/[.,:;]+$/, '');
  const words = normalized.split(/\s+/).filter(Boolean);
  while (words.length > 2 && DANGLING_FRAGMENT_PATTERN.test(words[words.length - 1] ?? '')) {
    words.pop();
  }
  normalized = words.join(' ').trim().replace(/[.,:;]+$/, '');
  return normalized || 'the described situation';
}

function pickEvidenceBackedAnchor(
  preferredText: string,
  fallbackText: string,
  maxWords: number
): string {
  const preferred = extractConcreteAnchor(preferredText, maxWords);
  if (preferred !== 'the described situation') {
    return preferred;
  }
  return extractConcreteAnchor(fallbackText, maxWords);
}

function selectPreferredEvidenceCandidates(texts: string[]): string[] {
  const candidates = texts
    .map((text) => text?.replace(/\s+/g, ' ').trim())
    .filter((text): text is string => Boolean(text && text.length > 0))
    .map((text) => {
      const sentences = text
        .split(/[.!?]+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length >= 15);
      const nonMeta = sentences.filter((sentence) => !isMetaInstructionalText(sentence));
      return nonMeta[0] ?? null;
    })
    .filter((text): text is string => Boolean(text && text.length > 0));

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

type PresentationCategory =
  | 'intellectual_curiosity'
  | 'family_relationship_responsibility'
  | 'community_belonging'
  | 'craft_making_creative_discipline'
  | 'service_contribution'
  | 'adversity_constraint_navigation'
  | 'identity_self_definition'
  | 'leadership_initiative'
  | 'values_under_pressure';

function inferPresentationCategory(input: {
  domain: string;
  axis: string;
  winnerSeed: RuntimeCandidateSeed;
  selectedFrame: {
    angleTitle: string;
    coreClaim: string;
    realStory: string;
    studentReveal: string;
    whyBeatsObvious: string;
    obviousAngle: string;
    risk: string;
    nextMove: string;
  };
  interpretiveFocus: string;
}): PresentationCategory {
  const abstractText = [
    input.domain.replace(/_/g, ' '),
    input.axis,
    input.winnerSeed.kind.replace(/_/g, ' '),
    input.winnerSeed.direction_line,
    input.selectedFrame.angleTitle,
    input.selectedFrame.coreClaim,
    input.selectedFrame.realStory,
    input.selectedFrame.studentReveal,
    input.selectedFrame.whyBeatsObvious,
    input.selectedFrame.obviousAngle,
    input.interpretiveFocus,
  ]
    .join(' ')
    .toLowerCase();

  if (/identity|self-definition|self-concept|voice|becoming/.test(abstractText)) {
    return 'identity_self_definition';
  }
  if (/research|method|experiment|analysis|interpret|scholarship|academic|study|learning/.test(abstractText)) {
    return 'intellectual_curiosity';
  }
  if (/making|building|design|technical|project|craft|prototype|creative/.test(abstractText)) {
    return 'craft_making_creative_discipline';
  }
  if (/injury|recovery|constraint|uncertainty|pressure|failure|loss|adapt|pattern/.test(abstractText)) {
    return 'adversity_constraint_navigation';
  }
  if (/values|integrity|fairness|dignity|conflict|argument|owed/.test(abstractText)) {
    return 'values_under_pressure';
  }
  if (/leadership|initiative|ownership|delegat|system|workflow|redesign|bottleneck/.test(abstractText)) {
    return 'leadership_initiative';
  }
  if (/belonging|community|group|participation|team/.test(abstractText)) {
    return 'community_belonging';
  }
  if (/family|relationship|listening|person in front|caregiving|care\s+for|another person/.test(abstractText)) {
    return 'family_relationship_responsibility';
  }
  if (/service|contribution|volunteer|help|support|care|responsibility/.test(abstractText)) {
    return 'service_contribution';
  }

  if (input.domain === 'research_failure') return 'intellectual_curiosity';
  if (input.domain === 'technical_leadership') {
    return input.axis === 'identity_transformation'
      ? 'craft_making_creative_discipline'
      : 'leadership_initiative';
  }
  if (input.domain === 'peer_teaching') return 'service_contribution';
  if (input.domain === 'community_care') {
    return input.axis === 'relationship_or_listening'
      ? 'family_relationship_responsibility'
      : 'service_contribution';
  }
  if (input.domain === 'service_operations') return 'values_under_pressure';
  if (input.domain === 'athletic_recovery') {
    return input.axis === 'identity_transformation'
      ? 'community_belonging'
      : 'adversity_constraint_navigation';
  }
  if (input.domain === 'debate_conflict') return 'values_under_pressure';

  switch (input.axis) {
    case 'identity_transformation':
      return 'identity_self_definition';
    case 'relationship_or_listening':
      return 'family_relationship_responsibility';
    case 'system_redesign':
    case 'delegation':
      return 'leadership_initiative';
    case 'pattern_breaking':
      return 'adversity_constraint_navigation';
    case 'responsibility':
      return 'service_contribution';
    default:
      return 'identity_self_definition';
  }
}

function buildPresentationTitle(axis: string, category: PresentationCategory): string {
  if (axis === 'identity_transformation') {
    const titles: Partial<Record<PresentationCategory, string>> = {
      intellectual_curiosity: 'When curiosity became the shape of intellectual identity',
      family_relationship_responsibility: 'When one relationship reshaped the student\'s sense of self',
      community_belonging: 'When belonging became the real story',
      craft_making_creative_discipline: 'When the work started revealing how the student thinks',
      service_contribution: 'When contribution became part of the student\'s self-definition',
      adversity_constraint_navigation: 'When navigating constraint changed who the student was becoming',
      identity_self_definition: 'When the story became about self-definition, not just accomplishment',
      leadership_initiative: 'When leadership changed how the student understood themself',
      values_under_pressure: 'When pressure clarified the student\'s sense of self',
    };
    return titles[category] ?? titles.identity_self_definition!;
  }

  if (axis === 'relationship_or_listening') {
    const titles: Partial<Record<PresentationCategory, string>> = {
      family_relationship_responsibility: 'When responsibility to another person changed the story',
      service_contribution: 'When listening changed what contribution required',
      community_belonging: 'When attention changed the student\'s place in the group',
      values_under_pressure: 'When pressure made attention to another person non-negotiable',
    };
    return titles[category] ?? 'When paying attention to another person changed what mattered';
  }

  if (axis === 'system_redesign') {
    if (category === 'intellectual_curiosity') {
      return 'When redesigning the method mattered more than pushing through';
    }
    if (category === 'leadership_initiative') {
      return 'When changing the system mattered more than individual effort';
    }
    return 'When redesigning the system mattered more than working harder';
  }

  if (axis === 'delegation') {
    if (category === 'community_belonging') {
      return 'When shared ownership mattered more than solo performance';
    }
    if (category === 'leadership_initiative') {
      return 'When leadership meant changing how the work moved';
    }
    return 'When the student stopped being the bottleneck';
  }

  if (axis === 'pattern_breaking') {
    if (category === 'values_under_pressure') {
      return 'When pressure exposed the limits of the first instinct';
    }
    if (category === 'adversity_constraint_navigation') {
      return 'When the old response stopped working under pressure';
    }
    return 'When the first instinct stopped working';
  }

  if (axis === 'responsibility') {
    const titles: Partial<Record<PresentationCategory, string>> = {
      service_contribution: 'What responsibility required once other people carried the consequence',
      family_relationship_responsibility: 'What the student owed the person depending on them',
      values_under_pressure: 'When pressure made the student\'s values visible',
    };
    return titles[category] ?? 'What the student owed the people affected by the moment';
  }

  const titles: Record<PresentationCategory, string> = {
    intellectual_curiosity: 'When intellectual curiosity became the real center',
    family_relationship_responsibility: 'When responsibility to another person changed the story',
    community_belonging: 'When belonging became the real pressure point',
    craft_making_creative_discipline: 'When the work revealed how the student thinks',
    service_contribution: 'When contribution mattered more than looking helpful',
    adversity_constraint_navigation: 'When constraint forced a different way forward',
    identity_self_definition: 'When the story became about self-definition, not just accomplishment',
    leadership_initiative: 'When the student changed how the work could move',
    values_under_pressure: 'When pressure exposed what the student stood for',
  };

  return titles[category];
}

function buildPresentationRisk(axis: string, category: PresentationCategory): string {
  if (axis === 'identity_transformation') {
    return 'If the draft stays at the level of broad self-description, it will lose the moment or image that makes the shift in self-understanding believable.';
  }
  if (axis === 'relationship_or_listening') {
    return 'If the draft only praises care or responsibility in the abstract, it will lose the interaction that shows why another person\'s stakes mattered.';
  }
  if (axis === 'system_redesign') {
    return 'If the draft praises effort without naming the structural redesign, the story will collapse into generic hard-work language.';
  }
  if (axis === 'delegation') {
    return 'If the draft sounds like management advice instead of a concrete handoff moment, the shift away from self-centrality will not feel earned.';
  }
  if (axis === 'pattern_breaking') {
    return 'If the draft does not show the old response before the change, the new approach will feel like a slogan instead of a real decision.';
  }
  if (axis === 'responsibility') {
    return 'If the draft stays at the level of stated values, it will lose the concrete consequence that makes the obligation credible.';
  }

  const risks: Record<PresentationCategory, string> = {
    intellectual_curiosity:
      'If the draft flattens into generic academic praise, it will lose the specific question or interpretive move that makes the student\'s mind visible.',
    family_relationship_responsibility:
      'If the draft turns into generic gratitude or caretaking language, it will lose the exact relationship pressure that makes the story feel earned.',
    community_belonging:
      'If the draft stays at the level of team or group language, it will lose the identity stakes that make belonging matter.',
    craft_making_creative_discipline:
      'If the draft turns into an accomplishment recap, it will miss the decision inside the work that shows how the student thinks.',
    service_contribution:
      'If the draft slips into broad service language, it will lose the concrete contribution and consequence that make the essay credible.',
    adversity_constraint_navigation:
      'If the draft treats the constraint as generic hardship, it will miss the choice that changed how the student moved through it.',
    identity_self_definition:
      'If the draft stays abstract about identity, it will lose the scene that makes the student\'s inner logic feel real.',
    leadership_initiative:
      'If the draft only praises initiative, it will lose the operational shift that made the work move differently.',
    values_under_pressure:
      'If the draft states values without the moment of pressure, it will sound admirable but unearned.',
  };

  return risks[category];
}

function buildPresentationNextMove(input: {
  axis: string;
  category: PresentationCategory;
  sceneAnchor: string;
  outcomeAnchor: string;
}): string {
  if (input.axis === 'identity_transformation') {
    return `Open on ${input.sceneAnchor}. Then show how that moment clarified ${input.outcomeAnchor}. Keep the draft on self-definition and inner logic rather than turning it into a generic accomplishment recap.`;
  }
  if (input.axis === 'relationship_or_listening') {
    return `Write the interaction around ${input.sceneAnchor}. Then show how the student responded differently in ${input.outcomeAnchor}. Keep the other person's stakes visible so the essay stays relational, not abstract.`;
  }
  if (input.axis === 'system_redesign') {
    return `Start with the recurring problem inside ${input.sceneAnchor}. Then show the redesign choice and the visible change in ${input.outcomeAnchor}. Keep effort language secondary to the structural fix itself.`;
  }
  if (input.axis === 'delegation') {
    return `Anchor the draft in the moment around ${input.sceneAnchor}. Show what the student handed off, what changed in ${input.outcomeAnchor}, and why shared ownership mattered more than doing everything alone.`;
  }
  if (input.axis === 'pattern_breaking') {
    return `Start with the moment around ${input.sceneAnchor}. Then contrast the first response with the later move visible in ${input.outcomeAnchor}. Keep the essay on the changed pattern, not generic perseverance.`;
  }
  if (input.axis === 'responsibility') {
    return `Write the scene around ${input.sceneAnchor}. Then show what the student realized they owed other people and how that becomes visible in ${input.outcomeAnchor}. Keep the essay on obligation and consequence, not broad values language.`;
  }

  const nextMoves: Record<PresentationCategory, string> = {
    intellectual_curiosity:
      `Start with ${input.sceneAnchor}. Then show the question, method, or interpretation that changed how the student understood ${input.outcomeAnchor}. Keep the draft on reasoning rather than résumé language.`,
    family_relationship_responsibility:
      `Start with the relationship pressure inside ${input.sceneAnchor}. Then show how that bond or duty shaped ${input.outcomeAnchor}. Keep the draft on lived responsibility rather than generic gratitude.`,
    community_belonging:
      `Open on ${input.sceneAnchor}. Then show how that situation clarified ${input.outcomeAnchor}. Keep the draft on belonging, participation, and voice rather than a standard team narrative.`,
    craft_making_creative_discipline:
      `Start with ${input.sceneAnchor}. Then show the decision inside the work that changed ${input.outcomeAnchor}. Keep the texture of making, building, or revising visible so the essay stays specific.`,
    service_contribution:
      `Open on ${input.sceneAnchor}. Then show how contribution changed ${input.outcomeAnchor}. Keep concrete people and consequences visible so the essay does not flatten into service branding.`,
    adversity_constraint_navigation:
      `Start with ${input.sceneAnchor}. Then show the alternative response that changed ${input.outcomeAnchor}. Keep the essay on adaptation under constraint, not generic resilience.`,
    identity_self_definition:
      `Open on ${input.sceneAnchor}. Then show how that moment clarified ${input.outcomeAnchor}. Keep the draft on self-definition rather than a generic accomplishment recap.`,
    leadership_initiative:
      `Open on ${input.sceneAnchor}. Then show how the student changed the flow of work in ${input.outcomeAnchor}. Keep the essay on judgment and initiative, not self-congratulation.`,
    values_under_pressure:
      `Start with ${input.sceneAnchor}. Then show what pressure revealed in ${input.outcomeAnchor}. Keep the essay on the choice under stress rather than a broad values statement.`,
  };

  return nextMoves[input.category];
}

function buildSelectedDirectionPresentation(input: {
  winnerSeed: RuntimeCandidateSeed | null;
  selectedFrame: {
    angleTitle: string;
    coreClaim: string;
    realStory: string;
    studentReveal: string;
    whyBeatsObvious: string;
    obviousAngle: string;
    risk: string;
    nextMove: string;
  };
  domain: string;
  interpretiveFocus: string;
  executionMode: NdsModuleExecutionInput['execution_mode'];
}): {
  angleTitle: string;
  mainRisk: string;
  nextMove: string;
} {
  if (!input.winnerSeed) {
    const baseTitle =
      input.executionMode === 'reduced_scope'
        ? `Constrained bet: ${input.selectedFrame.angleTitle}`
        : input.selectedFrame.angleTitle;
    return {
      angleTitle: baseTitle,
      mainRisk: input.selectedFrame.risk,
      nextMove: `${input.selectedFrame.nextMove} ${input.interpretiveFocus}`,
    };
  }

  const evidenceText = input.winnerSeed.evidence_spans.map((span) => span.text).join(' ');
  const sceneAnchor = cleanAnchorFragment(
    extractConcreteAnchor(evidenceText || input.winnerSeed.direction_summary, 12)
  );
  const outcomeAnchor = cleanAnchorFragment(
    extractOutcomeAnchor(evidenceText, input.winnerSeed.after_state, 12)
  );
  const axis = inferAxisFromLine(input.winnerSeed.direction_line);
  const category = inferPresentationCategory({
    domain: input.domain,
    axis,
    winnerSeed: input.winnerSeed,
    selectedFrame: input.selectedFrame,
    interpretiveFocus: input.interpretiveFocus,
  });

  let angleTitle = input.selectedFrame.angleTitle;
  let mainRisk = input.selectedFrame.risk;
  let nextMove = `${input.selectedFrame.nextMove} ${input.interpretiveFocus}`;

  if (axis !== 'unclassified' || input.domain === 'other') {
    angleTitle = buildPresentationTitle(axis, category);
    mainRisk = buildPresentationRisk(axis, category);
    nextMove = buildPresentationNextMove({
      axis,
      category,
      sceneAnchor,
      outcomeAnchor,
    });
  }

  if (input.executionMode === 'reduced_scope') {
    angleTitle = `Constrained bet: ${angleTitle}`;
  }

  return { angleTitle, mainRisk, nextMove };
}

// ─── Evidence-constrained explanation builder ─────────────────────────────────
// These helpers extract concrete vocabulary from the winning candidate's evidence
// spans and inject it into the explanation fields so each field is lexically
// anchored to what the student actually wrote — not generic domain templates.

/**
 * Finds the most concrete sentence in `text`: prefers sentences with named
 * actions (told, changed, built, …).  Falls back to the first sentence that
 * meets the minimum length.
 */
function extractConcreteAnchor(text: string, maxWords: number): string {
  if (!text || text.length < 10) return 'the described situation';
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15)
    .filter((s) => !isMetaInstructionalText(s));
  const chosen =
    sentences.find((s) =>
      /told|said|asked|noticed|found|changed|stopped|started|built|made|designed|implemented|showed|realized|kept|dropped|wrote|measured|clipped|split|assigned|delegated|trained|coached/i.test(
        s
      )
    ) ??
    sentences[0] ??
    text;
  return cleanAnchorFragment(
    chosen
      .split(/\s+/)
      .slice(0, maxWords)
      .join(' ')
      .replace(/[,;:]+$/, '')
  );
}

/**
 * Finds a sentence that describes a pivot or change.  Falls back to the
 * first `maxWords` of `directionText` (which is the candidate's direction
 * summary — itself drawn from the student's event text).
 */
function extractShiftAnchor(
  evidenceText: string,
  directionText: string,
  maxWords: number
): string {
  const combined = `${evidenceText} ${directionText}`;
  const sentences = combined
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15)
    .filter((s) => !isMetaInstructionalText(s));
  const shift = sentences.find((s) =>
    /changed|stopped|started|no\s+longer|instead|had\s+to|realized|shifted|redesigned|delegated|adjusted|learned|adapted|revised/i.test(
      s
    )
  );
  if (shift) {
    return cleanAnchorFragment(
      shift
        .split(/\s+/)
        .slice(0, maxWords)
        .join(' ')
        .replace(/[,;:]+$/, '')
    );
  }
  const evidenceFallback = extractConcreteAnchor(evidenceText, maxWords);
  if (evidenceFallback !== 'the described situation') {
    return evidenceFallback;
  }
  return cleanAnchorFragment(directionText.split(/\s+/).slice(0, maxWords).join(' '));
}

/**
 * Finds a sentence describing a visible outcome.  Falls back to the candidate's
 * after_state or the last sentence in the evidence.
 */
function extractOutcomeAnchor(
  evidenceText: string,
  afterState: string,
  maxWords: number
): string {
  const sentences = evidenceText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15)
    .filter((s) => !isMetaInstructionalText(s));
  const outcome = sentences.find((s) =>
    /after|result|next|then|now|finally|outcome|once|showed|confirmed|proved|kept|dropped|reduced|followed|first\s+sign|measurable/i.test(
      s
    )
  );
  if (outcome) {
    return cleanAnchorFragment(
      outcome
        .split(/\s+/)
        .slice(0, maxWords)
        .join(' ')
        .replace(/[,;:]+$/, '')
    );
  }
  if (sentences.length > 1) {
    return cleanAnchorFragment(
      sentences[sentences.length - 1]
        .split(/\s+/)
        .slice(0, maxWords)
        .join(' ')
    );
  }
  return cleanAnchorFragment(afterState.split(/\s+/).slice(0, maxWords).join(' '));
}

/**
 * Builds four explanation fields that are lexically grounded in the winning
 * candidate's evidence spans.  Each field = base frame sentence + an
 * evidence-anchored phrase drawn from the candidate's actual text.
 *
 * The direction_summary (= event_summary = student's story text) is used as
 * the most reliable evidence-vocabulary source.  This guarantees that tokens
 * from the explanation will appear in the evidence spans, satisfying the
 * overlap threshold in the grounding audit without changing candidate
 * selection, evidence extraction, or route decision behaviour.
 */
function buildEvidenceConstrainedExplanation(
  winnerSeed: RuntimeCandidateSeed | null,
  frame: {
    coreClaim: string;
    realStory: string;
    studentReveal: string;
    whyBeatsObvious: string;
    obviousAngle: string;
  },
  options: {
    trustMode: 'standard' | 'degraded_input';
    routeDecision: NdsRouteDecision;
    confidenceBand: NdsConfidenceBand;
    restraintMode: boolean;
  }
): {
  core_claim: string;
  why_this_is_the_real_story: string;
  what_it_reveals_about_the_student: string;
  why_it_beats_the_obvious_angle: string;
} {
  // Fallback: no winner or all spans are empty — return unmodified frame text.
  if (
    !winnerSeed ||
    winnerSeed.evidence_spans.every((s) => !s.text || s.text.length < 8)
  ) {
    return {
      core_claim: frame.coreClaim,
      why_this_is_the_real_story: frame.realStory,
      what_it_reveals_about_the_student: frame.studentReveal,
      why_it_beats_the_obvious_angle: frame.whyBeatsObvious,
    };
  }

  const spans = winnerSeed.evidence_spans.filter(
    (s) => s.text && s.text.length > 8
  );
  const allEvidenceText = spans.map((s) => s.text).join(' ').trim();
  const directionText =
    `${winnerSeed.direction_summary} ${winnerSeed.core_tension}`.trim();

  // Anchor phrases — all drawn from student text so their tokens appear in evidence
  const sceneAnchor = extractConcreteAnchor(allEvidenceText, 13);
  const shiftAnchor = extractShiftAnchor(allEvidenceText, directionText, 13);
  const outcomeAnchor = extractOutcomeAnchor(
    allEvidenceText,
    winnerSeed.after_state,
    12
  );
  // direction_summary opens with the student's own story words — best vocab source
  const directionAnchor = cleanAnchorFragment(
    isMetaInstructionalText(winnerSeed.direction_summary)
      ? pickEvidenceBackedAnchor(allEvidenceText, winnerSeed.after_state, 10)
      : winnerSeed.direction_summary.split(/\s+/).slice(0, 10).join(' ')
  );

  const axisLabel =
    winnerSeed.kind === 'system_redesign'
      ? 'system redesign'
      : winnerSeed.kind === 'delegation_distributed_responsibility'
        ? 'delegation and distributed responsibility'
        : winnerSeed.kind === 'pattern_breaking'
          ? 'pattern breaking'
          : winnerSeed.kind === 'identity_transformation'
            ? 'identity transformation'
            : winnerSeed.kind === 'relationship_or_listening'
              ? 'listening and relational attention'
              : winnerSeed.kind;

  if (options.restraintMode) {
    const conditionalLead =
      options.routeDecision === 'ask_question_before_showing' || options.confidenceBand === 'low'
        ? 'A plausible direction is'
        : 'The strongest current direction is';
    return {
      core_claim:
        `${conditionalLead} ${winnerSeed.direction_line.toLowerCase()} ` +
        `based on the available evidence: ${sceneAnchor}.`,
      why_this_is_the_real_story:
        `The current evidence most clearly supports this shift: ${shiftAnchor}. ` +
        `Additional detail may still change the winner.`,
      what_it_reveals_about_the_student:
        `The visible movement is from "${extractConcreteAnchor(winnerSeed.before_state, 10)}" ` +
        `to "${extractConcreteAnchor(winnerSeed.after_state, 10)}" with limited but usable support: ${outcomeAnchor}.`,
      why_it_beats_the_obvious_angle:
        `Compared with a generic framing (${frame.obviousAngle}), this option remains closer to the concrete text: ${directionAnchor}.`,
    };
  }

  const axisSpecificCoreLead: Record<string, string> = {
    'system redesign': 'The essay is not about effort alone. It becomes strongest when the student names the structural fix and the moment it became necessary.',
    'delegation and distributed responsibility': 'The story gets sharper once the student stops centering solo competence and shows the handoff that changed the work.',
    'pattern breaking': 'The center is not persistence by itself. It is the moment the old response stopped helping and the student broke that pattern on purpose.',
    'identity transformation': 'The strongest version is not a résumé summary. It is the point where the experience starts revealing who the student was becoming.',
    'listening and relational attention': 'The strongest version stays with the interaction where attention to another person changed what help or responsibility actually meant.',
    primary: frame.coreClaim,
    competence: 'The strongest version stays with the exact situation where execution had to become judgment rather than simple performance.',
    responsibility: 'The strongest version shows the moment responsibility stopped being a slogan and became a concrete obligation to other people.',
  };

  const axisSpecificRevealLead: Record<string, string> = {
    'system redesign': 'It reveals a student who can see when hard work is no longer enough and redesign the structure underneath the problem.',
    'delegation and distributed responsibility': 'It reveals a student who can stop being the center of the system and build shared ownership instead.',
    'pattern breaking': 'It reveals a student who can recognize an unhelpful repeated response and deliberately replace it with a better one.',
    'identity transformation': 'It reveals a student whose inner logic changed in a way the essay can actually show on the page.',
    'listening and relational attention': 'It reveals a student who can move from control or efficiency toward attention, listening, and relational judgment.',
    primary: frame.studentReveal,
    competence: 'It reveals a student whose competence becomes convincing because it changes how they respond in a real situation.',
    responsibility: 'It reveals a student who treats responsibility as a concrete choice with visible consequences for other people.',
  };

  const polishedAxisCore = axisSpecificCoreLead[axisLabel] ?? frame.coreClaim;
  const polishedAxisReveal = axisSpecificRevealLead[axisLabel] ?? frame.studentReveal;

  return {
    core_claim:
      `${polishedAxisCore} The strongest evidence sits in ${sceneAnchor}, which keeps the direction anchored to the student's actual material instead of a reusable summary.`,
    why_this_is_the_real_story:
      `${frame.realStory} The key turn is visible in ${shiftAnchor}. That keeps the essay on the lived hinge, instead of retelling background or broad traits.`,
    what_it_reveals_about_the_student:
      `${polishedAxisReveal} The before-and-after movement is from "${extractConcreteAnchor(winnerSeed.before_state, 10)}" to "${extractConcreteAnchor(winnerSeed.after_state, 10)}," and the consequence shows up in ${outcomeAnchor}.`,
    why_it_beats_the_obvious_angle:
      `A generic framing (${frame.obviousAngle}) would flatten the story. ` +
      `The evidence points to ${directionAnchor}, which is more specific, more draftable, and easier to trust on first read.`,
  };
}

// ─── Routing override helpers ─────────────────────────────────────────────────
/**
 * Student text patterns that signal an unresolved choice between directions.
 * When any of these fire AND the score margin is < 0.25, the route is forced to
 * ask_question_before_showing regardless of the confidence band.
 */
const EXPLICIT_UNCERTAINTY_PATTERN =
  /not sure which|not sure what|cannot tell whether|cannot tell what is central|genuinely cannot tell|honest answer.*ask|both stories are true|winner should.*treated cautiously|am not sure which|can't tell whether|both.*feel.*probative|strongest.*might be|might be.*but the.*might be|keep changing my mind|changing my mind/i;

/**
 * Text patterns that identify system-generated fallback spans — not real student
 * text.  A winner whose evidence contains these gets confidence capped to low
 * and the route forced to ask_question_before_showing.
 */
const FALLBACK_EVIDENCE_PATTERN =
  /no clear evidence span available|the story needs a clearer turning moment|hinge moment needs clearer evidence|partial change appears|change signal is limited/i;

function detectExplicitUncertainty(context: NdsNormalizedContextPack): boolean {
  const allText = context.story_signals
    .flatMap((s) => [s.event_summary ?? '', s.change_signal ?? ''])
    .join(' ');
  return EXPLICIT_UNCERTAINTY_PATTERN.test(allText);
}

function detectConcreteHinge(context: NdsNormalizedContextPack): boolean {
  const text = context.story_signals
    .flatMap((s) => [s.event_summary ?? '', s.change_signal ?? ''])
    .join(' ')
    .toLowerCase();
  const directCue = /a nurse|a coach|a teammate|patient|student|told me|said|asked|specific turning moment|first time i/i.test(text);
  const sceneCue = /when i (?:realized|stopped|started|changed|saw)|during [a-z]+|at (?:a|the|my) (?:clinic|lab|meeting|hospital|team|table|desk|kitchen|office|practice|restaurant)/i.test(text);
  return directCue || sceneCue;
}

/**
 * Student explicitly selects a center: "Choose X as center", "Pick X as center",
 * "Use X; keep Y only as context". Signals the student has made a deliberate choice
 * and wants the system to proceed to show, not ask again.
 */
const EXPLICIT_CENTER_SELECTION_PATTERN =
  /\b(choose|pick|select|use|go\s+with)\s+[\w\s,-]+\bas\s+(?:my\s+|the\s+)?(?:main\s+)?center\b|\bkeep\s+[\w\s]+\bas\s+(?:only\s+)?context\b/i;

function detectExplicitCenterSelection(context: NdsNormalizedContextPack): boolean {
  const text = context.story_signals
    .flatMap((s) => [s.event_summary ?? '', s.change_signal ?? ''])
    .join(' ');
  return EXPLICIT_CENTER_SELECTION_PATTERN.test(text);
}

function extractIndirectHingeSentences(context: NdsNormalizedContextPack): string[] {
  const raw = context.story_signals
    .flatMap((s) => [s.event_summary ?? '', s.change_signal ?? ''])
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!raw) return [];

  const sentences = raw
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 18);

  const hingePattern =
    /not\s+.*anymore|what\s+mattered\s+was|stopped\s+trying\s+to|started\s+listening|instead\s+of|had\s+to|quietly|without\s+being\s+asked|duty|obligation|owed|person\s+in\s+front|restraint|held\s+back|didn.?t\s+say|no\s+longer|rather\s+than|turning\s+point|then\s+i\s+realized|i\s+realized\s+later|listen|listening/i;
  const relationalUnderstatedPattern =
    /family|community|grandmother|parents|patient|teammate|student|room|translation|care\s+duties|household|temple/i;

  return sentences
    .map((sentence) => {
      const hingeMatch = hingePattern.test(sentence);
      const relationalMatch = relationalUnderstatedPattern.test(sentence);
      const valueShift = /but|instead|however|yet|until|while/.test(sentence);
      const score = (hingeMatch ? 2 : 0) + (relationalMatch ? 1 : 0) + (valueShift ? 1 : 0);
      return { sentence, score };
    })
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.sentence);
}

function winnerHasFallbackEvidence(
  seeds: RuntimeCandidateSeed[],
  selectedId: string | null
): boolean {
  if (!selectedId) return false;
  const winner = seeds.find((s) => s.candidate_id === selectedId);
  if (!winner) return false;
  return winner.evidence_spans.some((span) => FALLBACK_EVIDENCE_PATTERN.test(span.text));
}

export async function executeNdsModule(
  input: NdsModuleExecutionInput
): Promise<NdsModuleExecutionOutput> {
  const start = Date.now();

  // Prompt package is still built to keep contract stable for real provider adapters.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const promptPackage = buildNdsPromptV1(input.context_pack, input.execution_mode);

  const candidatePayload = buildDeterministicCandidate(input.context_pack, input.execution_mode);
  const latency = Date.now() - start;

  return {
    provider_key: NDS_DEFAULT_PROVIDER,
    model_key: NDS_DEFAULT_MODEL,
    raw_response: candidatePayload as unknown as Record<string, unknown>,
    candidate_payload: candidatePayload as unknown as Record<string, unknown>,
    execution_meta: {
      latency_ms: latency,
      token_usage: {},
      fallback_applied: false,
    },
  };
}
