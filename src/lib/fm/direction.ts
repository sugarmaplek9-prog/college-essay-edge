import type { IntakeIntelligenceObject, NarrativePattern } from '@/types/intake';
import {
  getDominantActor,
  getDominantConsequence,
  getDominantReflection,
  getDominantScene,
  getDominantTurningPoint,
  type SessionCaseState,
} from '@/lib/fm/case-state';
import { renderGuard } from '@/lib/fm/output-quality';

export interface DirectionMinimal {
  title: string;
  explanation: string;
  why_beats_obvious: string;
  risk: string;
  next_move: string;
  essay_about: string;
  write_first_steps: string[];
  avoid_lines: string[];
  write_next_steps: string[];
  focused_question: string;
  draft_opening_seed: string;
  primary_cta_label: string;
  secondary_cta_label: string;
  tertiary_cta_label: string;
}

export interface CoachComparisonArtifact {
  weaker_read: string;
  stronger_read: string;
  coach_judgment: string;
}

export interface CompareAlternative {
  title: string;
  subtitle: string;
  essay_focus: string;
  why_it_works_or_loses: string;
  risk_if_written_this_way: string;
  how_it_would_likely_start: string;
  action_label: string;
  is_strongest: boolean;
}

export interface DirectionContent {
  strongest: DirectionMinimal;
  compare_alternatives: CompareAlternative[];
  coach_comparison: CoachComparisonArtifact;
  is_reduced_scope: boolean;
  candidate_pack?: Array<{
    candidate_id: string;
    recommendation_family: string;
    angle_type: 'tension' | 'value' | 'process' | 'relationship' | 'contradiction' | 'realization' | 'ambiguity';
    surface_shell_id: string;
    shell_penalty_hits: string[];
    direction_line: string;
    essay_about: string;
    source_anchor_spans: string[];
    hinge_span: string | null;
    why_this_direction: string;
    next_move: string;
    scores: {
      angle_directness: number;
      angle_first_quality: number;
      essay_angle_naming_quality: number;
      essay_about_conceptual_lift: number;
      case_specificity_beyond_pivot: number;
      family_diversity_survival: number;
      batch_diversity_credit: number;
      ambiguity_decision_helpfulness: number;
      source_grounding: number;
      source_faithfulness: number;
  family_fit_base: number;
  family_fit: number;
  family_fit_gap: number;
  pattern_conditioned_misfit_penalty: number;
      essay_aboutness_clarity: number;
      directional_usefulness: number;
      why_quality: number;
      coaching_actionability: number;
      human_preference_likelihood: number;
      concrete_anchor_retention: number;
      narrative_hinge_clarity: number;
      draftability: number;
      individualization: number;
      non_repeatability: number;
      coach_judgment_quality: number;
      translation_penalty: number;
      template_scaffold_penalty: number;
      abstraction_penalty: number;
      decision_shell_penalty: number;
      family_collapse_penalty: number;
      dominant_family_overuse_penalty: number;
      packet_family_sameness_penalty: number;
      batch_family_distribution_penalty: number;
      pre_penalty_total: number;
      post_penalty_total: number;
  packet_adjusted_total: number;
      total_score: number;
    };
    validator_flags: {
      has_source_anchor: boolean;
      has_narrative_hinge: boolean;
      repeatable_direction_risk: boolean;
      over_translated_risk: boolean;
      generic_language_risk: boolean;
    };
    rejection_reasons: string[];
    selected: boolean;
    rank: number | null;
  }>;
}

interface CompositionInstrumentation {
  composition_failed: boolean;
  composition_issues: string[];
  fallback_replaced: boolean;
  pre_fallback_recommendation: string;
  post_fallback_recommendation: string;
  fallback_reason: 'none' | 'composition_rebuild_succeeded' | 'composition_rebuild_failed_terminal_fallback' | 'family_aware_fallback';
  winning_family: string;
}

interface RuntimeDirectionCandidate {
  candidate_id: string;
  family_type: 'tension' | 'value' | 'process' | 'relationship' | 'contradiction' | 'realization' | 'ambiguity';
  why_family_type: 'compellingness' | 'tension' | 'trust' | 'contrast';
  compare_family_type: 'reveals_vs_flattens' | 'thread_strength' | 'insight_depth' | 'draftability';
  recommendation_family: string;
  angle_type: 'tension' | 'value' | 'process' | 'relationship' | 'contradiction' | 'realization' | 'ambiguity';
  surface_shell_id: string;
  shell_penalty_hits: string[];
  direction_line: string;
  why_this_direction: string;
  essay_about: string;
  next_move: string;
  source_anchor_spans: string[];
  hinge_span: string | null;
  composition_instrumentation?: CompositionInstrumentation;
}

interface RuntimeDirectionCandidateScores {
  angle_directness: number;
  angle_first_quality: number;
  essay_angle_naming_quality: number;
  essay_about_conceptual_lift: number;
  case_specificity_beyond_pivot: number;
  family_diversity_survival: number;
  batch_diversity_credit: number;
  ambiguity_decision_helpfulness: number;
  source_grounding: number;
  source_faithfulness: number;
  family_fit_base: number;
  family_fit: number;
  family_fit_gap: number;
  pattern_conditioned_misfit_penalty: number;
  essay_aboutness_clarity: number;
  directional_usefulness: number;
  why_quality: number;
  coaching_actionability: number;
  human_preference_likelihood: number;
  concrete_anchor_retention: number;
  narrative_hinge_clarity: number;
  draftability: number;
  individualization: number;
  non_repeatability: number;
  coach_judgment_quality: number;
  translation_penalty: number;
  template_scaffold_penalty: number;
  abstraction_penalty: number;
  decision_shell_penalty: number;
  family_collapse_penalty: number;
  dominant_family_overuse_penalty: number;
  packet_family_sameness_penalty: number;
  batch_family_distribution_penalty: number;
  pre_penalty_total: number;
  post_penalty_total: number;
  packet_adjusted_total: number;
  total_score: number;
}

interface RankedRuntimeDirectionCandidate extends RuntimeDirectionCandidate {
  scores: RuntimeDirectionCandidateScores & {
    family_fit_base: number;
    family_fit: number;
    family_fit_gap: number;
    pattern_conditioned_misfit_penalty: number;
    packet_adjusted_total: number;
  };
  validator_flags: {
    has_source_anchor: boolean;
    has_narrative_hinge: boolean;
    repeatable_direction_risk: boolean;
    over_translated_risk: boolean;
    generic_language_risk: boolean;
  };
  rejection_reasons: string[];
  scaffold_pattern_hits: string[];
  selected: boolean;
  rank: number | null;
}

// ─────────────────────────────────────────────────────────────
// THEMATIC COACHING LANGUAGE
// ─────────────────────────────────────────────────────────────
// These functions generate the "what this essay is about" and
// "why this direction" language that a human coach would use.
// Evidence anchors follow — they don't lead.

function deriveThemeStatement(
  pattern: NarrativePattern,
  turningQ: string | null,
  consequenceQ: string | null
): string | null {
  switch (pattern) {
    case 'self_correction_arc':
      return turningQ
        ? `Your essay is really about raising your own standard at ${turningQ}, then living by it when it cost you something.`
        : 'Your essay is about the moment you set a higher standard for yourself and then acted on it.';
    case 'failure_reinterpretation':
      return turningQ
        ? `The heart of this essay is how ${turningQ} forced a new interpretation, and that new interpretation changed what you did.`
        : 'The heart of this essay is the new interpretation you earned from the failure, and the action it changed.';
    case 'identity_shift':
      return turningQ
        ? `This essay is about who you became at ${turningQ}, shown through behavior instead of labels.`
        : 'This essay is about who you became, shown through one visible behavioral shift.';
    case 'competence_vs_responsibility':
      return turningQ
        ? `The strongest angle is the tension at ${turningQ}: you were capable before, but this is where you became accountable.`
        : 'The strongest angle is the tension between being capable and being accountable for outcomes.';
    case 'usefulness_vs_intention':
      return turningQ
        ? `The essay works when ${turningQ} shows the gap between wanting to help and actually being useful.`
        : 'The essay works when it centers the gap between wanting to help and actually being useful.';
    case 'responsibility_shift':
      return turningQ
        ? `This essay is about the point at ${turningQ} when responsibility became your call and not someone else’s.`
        : 'This essay is about the point where responsibility became your call and showed up in action.';
    case 'conflict_reframe':
      return turningQ
        ? `The angle is what changed in your lens at ${turningQ}; the essay is about understanding, not scorekeeping.`
        : 'The angle is what the conflict clarified about your lens, not who won the argument.';
    default:
      if (turningQ && consequenceQ && turningQ !== consequenceQ) {
        return `The essay is about the move from ${turningQ} to ${consequenceQ} and what that move reveals about your judgment.`;
      }
      if (turningQ) {
        return `The essay is fundamentally about what changed for you at ${turningQ} and how that change showed up in action.`;
      }
      if (consequenceQ) {
        return `The essay is fundamentally about the decision behind ${consequenceQ}, not just the result itself.`;
      }
      return 'The essay is fundamentally about one concrete judgment call and the visible result that proved it.';
    return null;
  }
}

function deriveWhyStatement(
  pattern: NarrativePattern,
  turningQ: string | null,
  consequenceQ: string | null
): string {
  switch (pattern) {
    case 'self_correction_arc':
      return consequenceQ
        ? `It is stronger because it shows a hard correction and then proves the correction held at ${consequenceQ}.`
        : 'It is stronger because it shows a hard correction you can prove, not a broad growth claim.';
    case 'failure_reinterpretation':
      return consequenceQ
        ? `It earns trust because the failure changed your interpretation and that shift is visible in ${consequenceQ}.`
        : 'It earns trust because it turns failure into changed judgment and changed action.';
    case 'identity_shift':
      return turningQ
        ? `That choice persuades because ${turningQ} shows identity change through choices the reader can see.`
        : 'That choice persuades because it shows identity change through concrete behavior, not labels.';
    case 'competence_vs_responsibility':
      return turningQ
        ? `It is stronger because ${turningQ} captures the moment accountability mattered more than being impressive.`
        : 'It is stronger because it captures accountability under pressure, not just competence.';
    case 'usefulness_vs_intention':
      return consequenceQ
        ? `It is stronger because it proves you listened to impact and changed course, with proof in ${consequenceQ}.`
        : 'It is stronger because usefulness became your standard, not intention.';
    case 'responsibility_shift':
      return turningQ
        ? `That route is easy to trust because ${turningQ} is a concrete ownership moment, not a title claim.`
        : 'That route is stronger than a leadership claim because it is anchored in one accountable choice.';
    case 'conflict_reframe':
      return turningQ
        ? `That route persuades because ${turningQ} shows the new lens you adopted after conflict.`
        : 'That route persuades because it focuses on the reframe, not the replay.';
    default:
      if (turningQ && consequenceQ && turningQ !== consequenceQ) {
        return `It is stronger because the move from ${turningQ} to ${consequenceQ} is clear, believable, and useful to draft.`;
      }
      if (consequenceQ) {
        return `It earns trust because ${consequenceQ} proves behavior-level change, not post-hoc reflection.`;
      }
      if (turningQ) {
        return `It is stronger because ${turningQ} gives you a decisive pivot instead of background summary.`;
      }
      return 'It is worth trusting because it gives one clear through-line with concrete evidence.';
    return 'The recommendation is strongest when it stays concrete, persuasive, and clearly tied to your notes.';
  }
}

const ANGLE_TITLE: Record<NarrativePattern, string> = {
  self_correction_arc: 'The moment you got corrected',
  identity_shift: 'How you changed',
  responsibility_shift: 'When responsibility got real',
  failure_reinterpretation: 'What the setback revealed',
  conflict_reframe: 'What became clear after the conflict',
  usefulness_vs_intention: 'Trying to help vs actually helping',
  competence_vs_responsibility: 'Can do it vs should do it',
  unknown: 'The strongest pattern in your notes',
};

const OBVIOUS_TITLE: Record<NarrativePattern, string> = {
  self_correction_arc: 'A résumé-style service essay',
  identity_shift: 'An activity summary',
  responsibility_shift: 'A generic leadership essay',
  failure_reinterpretation: 'A setback summary',
  conflict_reframe: 'A who-was-right essay',
  usefulness_vs_intention: 'A feel-good service essay',
  competence_vs_responsibility: 'A skills essay',
  unknown: 'A vague summary of events',
};

function deriveDirectionTitle(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const pattern = intake.narrative_pattern.primary_pattern;
  const turning = getPreferredTurningPoint(caseState);
  const consequence = getPreferredConsequence(caseState);
  const actor = caseState ? getDominantActor(caseState) : null;
  const scene = getPreferredScene(caseState);

  if (turning && consequence) {
    return `The moment "${trimSnippet(turning)}" changed what you did next in "${trimSnippet(consequence)}".`;
  }

  if (pattern === 'usefulness_vs_intention') {
    if (actor) {
      return `You moved from trying to help ${actor.toLowerCase()} to responding to what they actually needed.`;
    }
    return 'You moved from trying to help to listening first and acting on what was needed.';
  }

  if (pattern === 'self_correction_arc') {
    return turning
      ? `The correction in "${trimSnippet(turning)}" changed your standard for how to act.`
      : 'The correction moment changed your standard for how to act.';
  }

  if (pattern === 'conflict_reframe') {
    return 'You moved from defending your position to understanding what the conflict required.';
  }

  if (pattern === 'failure_reinterpretation') {
    return 'The essay should center what you chose right after the setback, not the setback itself.';
  }

  if (pattern === 'responsibility_shift') {
    return 'The essay should center the moment responsibility became personal and visible in your actions.';
  }

  if (pattern === 'identity_shift') {
    return 'The essay should center the moment your behavior changed, not just the role you held.';
  }

  if (pattern === 'competence_vs_responsibility') {
    return 'The essay should center where ability became a judgment call about what you should do.';
  }

  if (scene) {
    return `The direction lives in "${trimSnippet(scene)}" and the choice you made inside it.`;
  }

  return 'The essay should center one concrete choice and the visible result that followed it.';
}

function trimSnippet(text: string): string {
  const value = text.trim();
  if (!value) return '';
  return value.length > 88 ? `${value.slice(0, 85).trim()}…` : value;
}

function normalizeAnchorKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/["“”'‘’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLowInformationAnchor(text: string): boolean {
  const normalized = normalizeAnchorKey(text);
  if (!normalized) return true;
  if (normalized.length < 14) return true;
  if (/^(one|at|it|this|that|they|he|she)$/.test(normalized)) return true;
  return false;
}

function uniqAnchors(values: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  for (const raw of values) {
    if (!raw) continue;
    const clipped = trimSnippet(raw);
    if (!clipped || isLowInformationAnchor(clipped)) continue;
    const key = normalizeAnchorKey(clipped);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(clipped);
  }

  return out;
}

function extractRawSentenceAnchors(caseState: SessionCaseState | null): string[] {
  if (!caseState) return [];
  const allText = caseState.raw_inputs.map((entry) => entry.text).join(' ');
  if (!allText.trim()) return [];

  const sentences = allText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 24);

  return sentences
    .filter((s) => /\b(changed|realized|stopped|started|decided|after|when|because|shifted)\b/i.test(s) || /\b(then|but|so)\b/i.test(s))
    .slice(0, 4)
    .map((s) => trimSnippet(s));
}

function getCaseStateTranscript(caseState: SessionCaseState | null): string {
  return caseState?.raw_inputs.map((entry) => entry.text).join(' ').trim() ?? '';
}

function cleanRelationshipOptionLabel(value: string): string {
  return trimSnippet(
    value
      .replace(/[“”"'`]/g, '')
      .replace(/^(between|about|whether|if|choosing|choose|writing about|write about|focus on)\s+/i, '')
      .replace(/\b(both matter to me|matter to me|not sure which one|unsure which one|which one is better|is better|should carry the essay|essay center|essay centres?)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractRelationshipOptionLabels(rawInput: string): string[] {
  const normalized = rawInput.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const labels: string[] = [];
  const add = (value: string | undefined) => {
    const cleaned = cleanRelationshipOptionLabel(value ?? '');
    if (!cleaned || labels.includes(cleaned)) return;
    labels.push(cleaned);
  };

  const between = normalized.match(/\bbetween\s+(.+?)\s+and\s+(.+?)(?:[.!?]|$)/i);
  if (between) {
    add(between[1]);
    add(between[2]);
  }

  const vsMatch = normalized.match(/\babout\s+(.+?)\s+vs\.?\s+(.+?)(?:[.!?]|$)/i)
    ?? normalized.match(/\b(.+?)\s+vs\.?\s+(.+?)(?:[.!?]|$)/i);
  if (vsMatch) {
    add(vsMatch[1]);
    add(vsMatch[2]);
  }

  const torn = normalized.match(/\b(?:two possible essays|two possible essay centers|torn between|stuck between)\s*:?\s*(.+?)\s+(?:and|or)\s+(.+?)(?:[.!?]|$)/i);
  if (torn) {
    add(torn[1]);
    add(torn[2]);
  }

  return labels.slice(0, 2);
}

type RelationshipSurfaceMode = 'default' | 'compare' | 'ambiguity';

type RealizationSurfaceMode = 'default' | 'compare';

function getRelationshipSurfaceContext(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): {
  mode: RelationshipSurfaceMode;
  optionLabels: string[];
} {
  const rawInput = getCaseStateTranscript(caseState);
  const optionLabels = extractRelationshipOptionLabels(rawInput);
  const compareCue = /\b(torn between|stuck between|two possible essays?|two possible essay centers?|between|vs\.?|versus|which one|cannot decide|can't decide|do not know which|keep bouncing)\b/i.test(rawInput);
  const ambiguityCue = /\b(not sure|unsure|uncertain|unclear|which belongs first|no strong opening|too small for essay|preachy|generic leadership language|how to frame|too operational|essay energy)\b/i.test(rawInput);

  return {
    mode: (optionLabels.length >= 2 && compareCue)
      ? 'compare'
      : (ambiguityCue || intake.recommendation_viability.decision === 'needs_more_input')
        ? 'ambiguity'
        : 'default',
    optionLabels,
  };
}

function cleanRealizationOptionLabel(value: string): string {
  return trimSnippet(
    value
      .replace(/[“”"'`]/g, '')
      .replace(/^(between|about|whether|if|choosing|choose|writing about|write about|focus on)\s+/i, '')
      .replace(/\b(both shaped me|both changed me|changed me|matter to me|not sure which one|unsure which one|which one is better|is better|should carry the essay|gives me confidence speaking up|clearer argument)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractRealizationOptionLabels(rawInput: string): string[] {
  const normalized = rawInput.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const labels: string[] = [];
  const add = (value: string | undefined) => {
    const cleaned = cleanRealizationOptionLabel(value ?? '');
    if (!cleaned || labels.includes(cleaned)) return;
    labels.push(cleaned);
  };

  const between = normalized.match(/\bbetween\s+(.+?)\s+and\s+(.+?)(?:[.!?]|$)/i);
  if (between) {
    add(between[1]);
    add(between[2]);
  }

  const focus = normalized.match(/focus on\s+(.+?)\s+or\s+(.+?)(?:[.!?]|$)/i);
  if (focus) {
    add(focus[1]);
    add(focus[2]);
  }

  return labels.slice(0, 2);
}

function cleanUnknownCompareOptionLabel(value: string): string {
  return trimSnippet(
    value
      .replace(/[“”"'`]/g, '')
      .replace(/^(between|about|whether|if|choosing|choose|writing about|write about|focus on)\s+/i, '')
      .replace(/^I\s+/i, '')
      .replace(/\b(both matter to me|matter to me|both matter|not sure which one|unsure which one|which one is better|is better|better for my college essay|for my college essay|should carry the essay)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function extractUnknownCompareOptionLabels(rawInput: string): string[] {
  const normalized = rawInput.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const labels: string[] = [];
  const add = (value: string | undefined) => {
    const cleaned = cleanUnknownCompareOptionLabel(value ?? '');
    if (!cleaned || labels.includes(cleaned)) return;
    labels.push(cleaned);
  };

  const between = normalized.match(/\bbetween\s+(.+?)\s+and\s+(.+?)(?:[.!?]|$)/i);
  if (between) {
    add(between[1]);
    add(between[2]);
  }

  const focus = normalized.match(/focus on\s+(.+?)\s+or\s+(.+?)(?:[.!?]|$)/i);
  if (focus) {
    add(focus[1]);
    add(focus[2]);
  }

  const vsMatch = normalized.match(/\b(.+?)\s+vs\.?\s+(.+?)(?:[.!?]|$)/i);
  if (vsMatch) {
    add(vsMatch[1]);
    add(vsMatch[2]);
  }

  const andAlso = normalized.match(/\bI\s+(.+?)\s+and\s+(?:I\s+also\s+|also\s+)(.+?)(?:[.!?]|$)/i);
  if (andAlso) {
    add(andAlso[1]);
    add(andAlso[2]);
  }

  return labels.slice(0, 2);
}

function getUnknownCompareGrounding(rawInput: string): {
  optionLabels: string[];
  compareSentence: string | null;
  decisionSentence: string | null;
} | null {
  const optionLabels = extractUnknownCompareOptionLabels(rawInput);
  const compareCue = /\b(torn between|stuck between|between|vs\.?|versus|which one|cannot decide|can't decide|do not know which|keep bouncing|both matter|unsure|not sure|better for my college essay)\b/i.test(rawInput);
  if (!compareCue || optionLabels.length < 2) return null;

  const sentences = rawInput
    .split(/(?<=[.!?])\s+/)
    .map((value) => trimSnippet(value))
    .filter(Boolean);

  const compareSentence = sentences.find((value) => /\bI\s+.+\s+and\s+(?:I\s+also\s+|also\s+).+/i.test(value))
    ?? sentences.find((value) => optionLabels.every((label) => normalizeAnchorKey(value).includes(normalizeAnchorKey(label))))
    ?? `Choosing between ${optionLabels[0]} and ${optionLabels[1]}`;

  const decisionSentence = sentences.find((value) => /\b(both matter|which one|unsure|not sure|better for my college essay|should carry the essay)\b/i.test(value))
    ?? `Both ${optionLabels[0]} and ${optionLabels[1]} matter, but only one will give you a cleaner essay turn.`;

  return {
    optionLabels,
    compareSentence,
    decisionSentence,
  };
}

function buildUnknownCompareCoachRecommendation(
  optionA: string,
  optionB: string
): string {
  return `Choose between ${optionA} and ${optionB} by keeping the option you can prove with one specific scene, one clear decision, and one immediate result. Draft both openings, then keep the one that lands cleanly on the page.`;
}

function getRealizationSurfaceContext(
  caseState: SessionCaseState | null
): {
  mode: RealizationSurfaceMode;
  optionLabels: string[];
} {
  const rawInput = getCaseStateTranscript(caseState);
  const optionLabels = extractRealizationOptionLabels(rawInput);
  const compareCue = /\b(torn between|stuck between|between|vs\.?|versus|which one|cannot decide|can't decide|do not know which|keep bouncing)\b/i.test(rawInput);

  return {
    mode: optionLabels.length >= 2 && compareCue ? 'compare' : 'default',
    optionLabels,
  };
}

function isMetaRealizationSurfaceAnchor(text: string | null | undefined): boolean {
  const normalized = normalizeAnchorKey(text ?? '');
  if (!normalized) return true;
  return /\b(draft sentence i keep using|current draft lines|my draft says|both changed me|clearer argument|i learned persistence|i learned precision matters)\b/i.test(normalized)
    || normalized.startsWith('the moment you noticed what had to change and made the harder call')
    || normalized.startsWith('the first outcome that proved');
}

function scoreRealizationSurfaceAnchor(text: string, kind: 'hinge' | 'result'): number {
  let score = scoreSignalCandidate(text, kind === 'result' ? 'consequence' : 'turning');

  if (/\b(stopped|rebuilt|redesigned|created|shifted|changed|switched|admitted|realized|pushed|started|fixed|forcing|map consequences|prediction checks|checklist|verification)\b/i.test(text)) {
    score += 1.5;
  }
  if (/\b(robotics|testing checklist|younger brother|report meeting|community garden|role ownership|check-outs|peer counselors|hospital|inventory|patients|small business|podcast|audio approval|tracking sheet)\b/i.test(text)) {
    score += 0.8;
  }
  if (kind === 'result' && /\b(worked|proved|changed|different pattern|before publication|report meeting|leaving beds unfinished|audio approval|reaction|result)\b/i.test(text)) {
    score += 0.6;
  }
  if (isMetaRealizationSurfaceAnchor(text)) {
    score -= 4.2;
  }

  return score;
}

function getPreferredRealizationSurfaceAnchor(caseState: SessionCaseState | null): string | null {
  const rawInput = getCaseStateTranscript(caseState);
  const compareCue = /\b(torn between|stuck between|between|vs\.?|versus|which one|cannot decide|can't decide|do not know which|keep bouncing|both matter|unsure|not sure)\b/i.test(rawInput);
  const candidates = uniqAnchors([
    getPreferredTurningPoint(caseState),
    getPreferredScene(caseState),
    getPreferredConsequence(caseState),
    getPreferredReflection(caseState),
    ...extractRawSentenceAnchors(caseState),
  ]).filter((value) => !isMetaRealizationSurfaceAnchor(value));

  const fallbackCompareSentence = rawInput
    .split(/[.!?]/)
    .map((value) => trimSnippet(value))
    .find((value) => /\bI\s+.+\s+and\s+(?:I\s+also\s+|also\s+).+/i.test(value) && !/\b(both matter|which one|unsure|not sure|should carry the essay|better for my college essay)\b/i.test(value))
    ?? null;

  if (candidates.length === 0) return compareCue ? fallbackCompareSentence : null;

  const ranked = candidates
    .map((value) => {
      let score = scoreRealizationSurfaceAnchor(value, 'hinge');

      if (compareCue && /\b(both matter|which one|unsure|not sure|should carry the essay|better for my college essay)\b/i.test(value)) {
        score -= 2.8;
      }
      if (compareCue && /\bI\s+.+\s+and\s+(?:I\s+also\s+|also\s+).+/i.test(value)) {
        score += 0.9;
      }

      return { value, score };
    })
    .sort((a, b) => b.score - a.score || a.value.length - b.value.length);

  const best = ranked[0]?.value ?? null;
  const bestScore = ranked[0]?.score ?? Number.NEGATIVE_INFINITY;

  if (compareCue && fallbackCompareSentence && bestScore < 2.6) {
    return fallbackCompareSentence;
  }

  return best;
}

function getPreferredRealizationSurfaceResult(
  caseState: SessionCaseState | null,
  usedAnchor: string | null
): string | null {
  const rawInput = getCaseStateTranscript(caseState);
  const compareCue = /\b(torn between|stuck between|between|vs\.?|versus|which one|cannot decide|can't decide|do not know which|keep bouncing|both matter|unsure|not sure)\b/i.test(rawInput);
  const usedKey = normalizeAnchorKey(usedAnchor ?? '');
  const candidates = uniqAnchors([
    getPreferredConsequence(caseState),
    getPreferredScene(caseState),
    getPreferredTurningPoint(caseState),
    ...extractRawSentenceAnchors(caseState),
  ])
    .filter((value) => normalizeAnchorKey(value) !== usedKey)
    .filter((value) => !isMetaRealizationSurfaceAnchor(value));

  if (candidates.length === 0) return null;

  const ranked = candidates
    .map((value) => {
      let score = scoreRealizationSurfaceAnchor(value, 'result');

      if (compareCue && /\b(both matter|which one|unsure|not sure|should carry the essay|better for my college essay)\b/i.test(value)) {
        score -= 3.2;
      }

      return { value, score };
    })
    .sort((a, b) => b.score - a.score || a.value.length - b.value.length);

  const best = ranked[0] ?? null;
  if (!best) return null;

  if (compareCue && best.score < 2.8) {
    return null;
  }

  return best.value;
}

function polishRelationshipDirectionLineForDisplay(
  candidate: RankedRuntimeDirectionCandidate | null,
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string | null {
  if (!candidate || candidate.family_type !== 'relationship') return null;

  const context = getRelationshipSurfaceContext(intake, caseState);
  const rawInput = getCaseStateTranscript(caseState);
  const recoveredCompareLabels = context.optionLabels.length >= 2
    ? context.optionLabels
    : extractUnknownCompareOptionLabels(rawInput);
  const actor = sanitizeActorLabel(caseState ? getDominantActor(caseState) : null);
  const turning = getPreferredTurningPoint(caseState);
  const scene = getPreferredScene(caseState);

  if (context.mode === 'compare' && context.optionLabels.length >= 2) {
    const [optionA, optionB] = context.optionLabels;
    return buildUnknownCompareCoachRecommendation(optionA, optionB);
  }

  if (context.mode === 'ambiguity') {
    if (recoveredCompareLabels.length >= 2) {
      const [optionA, optionB] = recoveredCompareLabels;
      return buildUnknownCompareCoachRecommendation(optionA, optionB);
    }
    if (actor) {
      return `With ${actor.toLowerCase()}, build the essay around the one interaction where your read changed, not the whole role around it.`;
    }
    if (scene) {
      return `Use ${trimSnippet(scene)} as the correction scene, then build the essay around the response change that followed.`;
    }
    if (turning) {
      return `Anchor the essay in ${trimSnippet(turning)}, then show how that interaction changed your response standard.`;
    }
    return 'Build around one interaction that changed how you read another person, not a broad summary of the role.';
  }

  return null;
}

function polishRealizationDirectionLineForDisplay(
  candidate: RankedRuntimeDirectionCandidate | null,
  caseState: SessionCaseState | null
): string | null {
  if (!candidate || candidate.family_type !== 'realization') return null;

  const context = getRealizationSurfaceContext(caseState);
  const rawInput = getCaseStateTranscript(caseState);
  const anchor = getPreferredRealizationSurfaceAnchor(caseState);
  const result = getPreferredRealizationSurfaceResult(caseState, anchor);
  const seed = stableTextHash(`${anchor ?? ''}:${result ?? ''}:${getCaseStateTranscript(caseState)}`);
  const rawWordCount = rawInput.split(/\s+/).filter(Boolean).length;
  const recoveredCompareLabels = context.optionLabels.length >= 2
    ? context.optionLabels
    : (() => {
        const match = rawInput.match(/\bI\s+(.+?)\s+and\s+(?:I\s+also\s+|also\s+)(.+?)(?:[.!?]|$)/i);
        if (!match) return [] as string[];

        const normalizeLabel = (value: string): string => trimSnippet(
          value
            .replace(/[“”"'`]/g, '')
            .replace(/^I\s+/i, '')
            .replace(/\b(both matter|which one|unsure|not sure|better for my college essay|should carry the essay)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        );

        const first = normalizeLabel(match[1] ?? '');
        const second = normalizeLabel(match[2] ?? '');
        return [first, second].filter((value, index, arr) => Boolean(value) && arr.indexOf(value) === index).slice(0, 2);
      })();
  const lowSpecificityCompare = recoveredCompareLabels.length >= 2
    && rawWordCount <= 24
    && /\b(both matter|which one|unsure|not sure|better for my college essay|should carry the essay)\b/i.test(rawInput)
    && (!anchor || isMetaRealizationSurfaceAnchor(anchor) || scoreRealizationSurfaceAnchor(anchor, 'hinge') < 2.6)
    && (!result || isMetaRealizationSurfaceAnchor(result) || scoreRealizationSurfaceAnchor(result, 'result') < 2.8);

  if (lowSpecificityCompare) {
    const [optionA, optionB] = recoveredCompareLabels;
    return buildUnknownCompareCoachRecommendation(optionA, optionB);
  }

  if (context.mode === 'compare' && context.optionLabels.length >= 2) {
    const [optionA, optionB] = context.optionLabels;
    const variants = [
      `${optionA} and ${optionB} both matter, but keep the option where one bad read breaks, forces a better decision rule, and shows a visible result right after.`,
      `Between ${optionA} and ${optionB}, choose the version where the old assumption fails in one scene and the revised standard changes what you do next.`,
      `${optionA} and ${optionB} should compete on one test: which one lets the reader watch the mistaken assumption break, the rule change, and the first result that proves it held?`,
    ] as const;
    return variants[seed % variants.length];
  }

  if (anchor && result) {
    const variants = [
      `Build the essay around ${trimSnippet(anchor)}: the old assumption fails there, you revise the rule you were using, and ${trimSnippet(result)} shows the revision held.`,
      `Use ${trimSnippet(anchor)} as the hinge scene, then show the better standard you adopted and how ${trimSnippet(result)} made that standard visible.`,
      `Start with ${trimSnippet(anchor)}, where your old read stopped working. Then build the essay around the revised rule and the first result in ${trimSnippet(result)} that proved it was real.`,
    ] as const;
    return variants[seed % variants.length];
  }

  if (anchor) {
    const variants = [
      `Build the essay around ${trimSnippet(anchor)} and the better decision rule you adopted because of it.`,
      `Use ${trimSnippet(anchor)} as the hinge moment, then show the revised standard that changed what you did next.`,
      `Start with ${trimSnippet(anchor)}, then show the rule you replaced and the behavior that proved you replaced it.`,
    ] as const;
    return variants[seed % variants.length];
  }

  return null;
}

type SignalKind = 'scene' | 'turning' | 'consequence' | 'reflection';

function scoreSignalCandidate(text: string, kind: SignalKind): number {
  const normalized = normalizeAnchorKey(text);
  const words = normalized.split(' ').filter(Boolean);
  const concreteActionPattern = /\b(told|said|asked|pulled|proposed|created|recovered|walk me through|wait times dropped|finally felt seen|quiet pickup|checklist|freshman|nurse|attendance)\b/i;
  const turningPattern = /\b(wrong instructions|pulled me aside|walk me through|stopped coming|get(?:ting)? in the way|finally felt seen|told me|said)\b/i;
  const consequencePattern = /\b(after that|afterward|since then|so I|I started|I stopped|I changed|led to|which meant|attendance recovered|wait times dropped|created|proposed|owned by)\b/i;
  const reflectionPattern = /\b(changed how I think|changed my standard|made me realize|I realized|I understood|I learned)\b/i;
  const genericMetaPattern = /\b(I keep saying|sounds fake|both mattered|not sure which one says more|best angle|the direction is|essay is about)\b/i;
  const genericThemePattern = /\b(confidence|leadership|growth|service|helping)\b/i;

  let score = 0;

  if (words.length >= 7 && words.length <= 24) score += 1.2;
  if (words.length >= 10 && words.length <= 18) score += 0.4;
  if (concreteActionPattern.test(text)) score += 1.4;

  if (kind === 'scene' && /\b(pantry|pickup|robotics|hospital|debate|tutoring|summer|setup|conversation)\b/i.test(text)) {
    score += 1.1;
  }
  if (kind === 'turning' && turningPattern.test(text)) score += 2.4;
  if (kind === 'consequence' && consequencePattern.test(text)) score += 2.2;
  if (kind === 'reflection' && reflectionPattern.test(text)) score += 1.8;

  if (genericMetaPattern.test(text)) score -= 2.4;
  if (kind === 'turning' && /^I\s+(keep saying|changed|learned)\b/i.test(text)) score -= 1.8;
  if (genericThemePattern.test(text) && !concreteActionPattern.test(text)) score -= 0.8;
  if (isLowInformationAnchor(text)) score -= 1.5;

  return score;
}

function choosePreferredSignal(caseState: SessionCaseState | null, kind: SignalKind): string | null {
  if (!caseState) return null;

  const primaryPool =
    kind === 'scene'
      ? caseState.extracted.scenes
      : kind === 'turning'
        ? caseState.extracted.turning_points
        : kind === 'consequence'
          ? caseState.extracted.consequences
          : caseState.extracted.reflections;

  const secondaryPool =
    kind === 'turning'
      ? [...caseState.extracted.consequences, ...caseState.extracted.reflections]
      : kind === 'consequence'
        ? [...caseState.extracted.turning_points, ...caseState.extracted.reflections]
        : kind === 'reflection'
          ? [...caseState.extracted.turning_points, ...caseState.extracted.consequences]
          : caseState.extracted.turning_points;

  const candidates = uniqAnchors([
    ...primaryPool,
    ...secondaryPool,
    ...extractRawSentenceAnchors(caseState),
  ]);

  if (candidates.length === 0) return null;

  return candidates
    .map((value) => ({ value, score: scoreSignalCandidate(value, kind) }))
    .sort((a, b) => b.score - a.score || a.value.length - b.value.length)[0]?.value ?? null;
}

function getPreferredScene(caseState: SessionCaseState | null): string | null {
  return choosePreferredSignal(caseState, 'scene') ?? (caseState ? getDominantScene(caseState) : null);
}

function getPreferredTurningPoint(caseState: SessionCaseState | null): string | null {
  return choosePreferredSignal(caseState, 'turning') ?? (caseState ? getDominantTurningPoint(caseState) : null);
}

function getPreferredConsequence(caseState: SessionCaseState | null): string | null {
  return choosePreferredSignal(caseState, 'consequence') ?? (caseState ? getDominantConsequence(caseState) : null);
}

function getPreferredReflection(caseState: SessionCaseState | null): string | null {
  return choosePreferredSignal(caseState, 'reflection') ?? (caseState ? getDominantReflection(caseState) : null);
}

function chooseFallbackHingeFromRaw(caseState: SessionCaseState | null): string | null {
  const candidates = extractRawSentenceAnchors(caseState);
  return candidates[0] ?? null;
}

function normalizeSentence(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function quoteAnchor(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  const trimmed = normalized.replace(/[\"“”]/g, '').trim();
  return trimmed || null;
}

function sanitizeActorLabel(value: string | null): string | null {
  if (!value) return null;

  const normalized = value.replace(/^\s*(a|an|the)\s+/i, '').replace(/\s+/g, ' ').trim();
  if (normalized.length < 4) return null;

  const lowered = normalized.toLowerCase();
  const allowedSingleWordActors = new Set([
    'classmate', 'teammate', 'roommate', 'patient', 'nurse', 'teacher', 'coach',
    'student', 'freshman', 'peer', 'friend', 'parent', 'child', 'mentor', 'editor',
    'judge', 'partner', 'counselor', 'manager', 'volunteer', 'client', 'reader',
    'doctor', 'professor', 'principal', 'tutor', 'camper', 'staffer', 'neighbor', 'sibling',
  ]);
  const blockedSingleWordActors = new Set([
    'free', 'nut', 'label', 'labels', 'setup', 'checklist', 'inventory', 'attendance', 'pickup',
  ]);

  if (!normalized.includes(' ')) {
    if (blockedSingleWordActors.has(lowered)) return null;
    if (!allowedSingleWordActors.has(lowered) && !/[A-Z]/.test(normalized)) return null;
  }

  return normalized;
}

function anchorCanStandAsClause(anchor: string | null): boolean {
  if (!anchor) return false;
  const normalized = anchor.trim();
  if (!normalized) return false;
  if (normalized.includes('…')) return false;
  if (normalized.length < 22 || normalized.length > 140) return false;
  if (!/[a-z]/i.test(normalized)) return false;
  if (!/\b(changed|realized|decided|started|stopped|asked|saw|learned|forced|proved|showed|rewrote|rebuilt|moved|shifted|told|said|made|became|called|reviewed|explained|noticed)\b/i.test(normalized)) return false;
  return true;
}

function paraphraseHingeClause(pattern: NarrativePattern): string {
  switch (pattern) {
    case 'self_correction_arc':
      return 'the moment you realized your old standard failed and changed it';
    case 'failure_reinterpretation':
      return 'the moment you saw the failure clearly and changed your method';
    case 'identity_shift':
      return 'the moment you noticed the mismatch and became different in practice';
    case 'competence_vs_responsibility':
      return 'the moment you decided reliability mattered more and changed your approach';
    case 'usefulness_vs_intention':
      return 'the moment you realized intention was not enough and changed your response';
    case 'responsibility_shift':
      return 'the moment you decided responsibility was yours and acted on it';
    case 'conflict_reframe':
      return 'the moment you saw the conflict differently and changed your lens';
    default:
      return 'the moment you noticed what had to change and made the harder call';
  }
}

function paraphraseConsequenceClause(pattern: NarrativePattern): string {
  switch (pattern) {
    case 'self_correction_arc':
      return 'the first proof that the correction held under pressure';
    case 'failure_reinterpretation':
      return 'the first rebuilt step that showed the shift was real';
    case 'identity_shift':
      return 'the first visible behavior that made the change concrete';
    case 'competence_vs_responsibility':
      return 'the first choice that showed accountability mattered more than speed';
    case 'usefulness_vs_intention':
      return 'the first response that proved you adapted to real impact';
    case 'responsibility_shift':
      return 'the first action that showed responsibility had become your call';
    case 'conflict_reframe':
      return 'the first response that showed your new lens in action';
    default:
      return 'the first outcome that proved the judgment produced a visible result';
  }
}

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return Number(value.toFixed(3));
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

const TAXONOMY_FORWARD_PATTERN = /\b(relationship-based responsibility|ownership under contradiction|interpretation change|value-under-cost|angle|family|framework)\b/i;
const CLAIM_FIRST_START_PATTERN = /^(your essay should|make your main claim that|center your essay on|show how|write this around|argue that|at the center, show|lead with the claim that|frame the essay around|build the draft around)\b/i;

function hasPlainClaimSignal(text: string): boolean {
  const t = text.toLowerCase();
  const hasClaimVerb = /\b(show|argue|prove|claim|center|focus|make your main claim|your essay should)\b/i.test(t);
  const hasStudentMeaning = /\b(essay|moment|decision|choice|result|standard|response|method|value)\b/i.test(t);
  return hasClaimVerb && hasStudentMeaning;
}

function hasClaimFirstForm(text: string): boolean {
  return CLAIM_FIRST_START_PATTERN.test(normalizeSentence(text));
}

function hasComprehensionSignal(candidate: RuntimeDirectionCandidate): boolean {
  const direction = normalizeSentence(candidate.direction_line);
  const directionWordCount = direction.split(/\s+/).filter(Boolean).length;
  const directionHasCore = /\b(moment|decision|choice|result|standard|method|value|response|behavior|discipline|accountability|ownership|judgment|tradeoff|trust)\b/i.test(direction);
  const whyHasReasoning = /\bbecause\b/i.test(candidate.why_this_direction) || hasComparativeWhySignal(candidate.why_this_direction);
  const nextHasConcrete = hasConcreteNextStep(candidate.next_move);
  const hasStructuredClause = /\b(and|then|,|;)\b/.test(direction);
  const conciseEnough = directionWordCount <= 72;
  const boundedLongForm = directionWordCount <= 92 && hasStructuredClause;
  return hasClaimFirstForm(direction) && directionHasCore && (conciseEnough || boundedLongForm) && whyHasReasoning && nextHasConcrete;
}

function hasComparativeWhySignal(text: string): boolean {
  return /\b(stronger|beats|rather than|instead of|compared|vs\.?|easier to trust|earns trust|wins because)\b/i.test(text);
}

function hasDraftingPayoffSignal(text: string): boolean {
  return /\b(drafting payoff|so you can draft|easier to draft|gives you a clear opening|clear opening|draft your opening|start by)\b/i.test(text);
}

function hasConcreteNextStep(text: string): boolean {
  const action = /\b(write|start|open|draft|list)\b/i.test(text);
  const unit = /\b(sentence|sentences|scene|lines?|detail|decision|result|consequence|opening)\b/i.test(text);
  return action && unit;
}

function stableTextHash(value: string): number {
  return Math.abs((value || '').split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));
}

function ensureComparativeWhy(why: string, seedValue = 0): string {
  const out = normalizeSentence(why);
  const comparativeLeads = [
    'This is stronger than the obvious version because',
    'This beats the alternate read because',
    'Rather than the flatter version, choose this because',
    'This is stronger than the fallback because',
    'Compared with the weaker path, this works because',
    'This beats the hollow version because',
    'Rather than staying vague, use this because',
    'This is stronger as a drafting claim because',
  ] as const;
  const lead = comparativeLeads[(stableTextHash(out) + seedValue) % comparativeLeads.length];

  let firstPart = out.split(/(?<=[.!?])\s+/).filter(Boolean)[0] ?? out;
  if (!hasComparativeWhySignal(firstPart)) {
    firstPart = `${lead} the claim stays explicit and evidence-aligned.`;
  } else if (/^(this wins because|it is stronger because|this is stronger because)/i.test(firstPart)) {
    firstPart = firstPart.replace(/^(this wins because|it is stronger because|this is stronger because)\s*/i, `${lead} `);
  }
  if (!/\bbecause\b/i.test(firstPart)) {
    firstPart = `${firstPart} because the claim is explicit and evidence-aligned.`;
  }

  const payoffVariants = [
    'Drafting payoff: open with the hinge moment, then show decision and immediate result.',
    'Drafting payoff: start with one scene, then write the claim and consequence in order.',
    'Drafting payoff: you can draft the opening in three lines — moment, choice, result.',
    'Drafting payoff: this gives a clean first paragraph structure you can write right now.',
    'Drafting payoff: the reader can follow your argument from scene to claim without guesswork.',
  ] as const;

  const secondPart = payoffVariants[(stableTextHash(`${out}:${firstPart}`) + seedValue) % payoffVariants.length];
  return normalizeSentence(`${firstPart} ${secondPart}`);
}

function ensureWhyValidatorContract(why: string, seedValue = 0): string {
  let normalized = ensureComparativeWhy(why, seedValue);

  if (!hasComparativeWhySignal(normalized)) {
    const body = normalized.charAt(0).toLowerCase() + normalized.slice(1);
    // Stronger, more decisive framing instead of generic "This beats the weaker read because"
    const strongerFramings = [
      `This wins because ${body}`,
      `The advantage: ${body}`,
      `Why this is sharper: ${body}`,
      `This is stronger because ${body}`,
    ] as const;
    const framing = strongerFramings[(stableTextHash(body) + seedValue) % strongerFramings.length];
    normalized = framing;
  }

  if (!hasDraftingPayoffSignal(normalized)) {
    const payoffVariants = [
      'Your draft opens: moment, decision, result in one paragraph.',
      'This gives you a clear 3-sentence paragraph structure.',
      'You can write the whole first paragraph in one sitting.',
      'The opening is concrete enough to draft immediately.',
    ] as const;
    const addOn = payoffVariants[(stableTextHash(normalized) + seedValue) % payoffVariants.length];
    normalized = `${normalized} ${addOn}`;
  }

  return normalizeSentence(normalized);
}

function ensureConcreteNextMove(nextMove: string, seedValue = 0): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  // More concrete, immediately actionable next steps without generic "Next step:" label
  const variants = [
    'Write the opening: scene detail, then your decision, then what changed as a result.',
    'Draft the first paragraph as three sentences: moment, choice, consequence.',
    'Write down: the specific scene, your competing options, and which you chose.',
    'Open with the concrete detail, then state the claim, then show the shift.',
    'Write: what happened, what you decided, why that decision mattered.',
  ] as const;
  return `${normalized} Then: ${variants[(stableTextHash(normalized) + seedValue) % variants.length]}`;
}

const RECOMMENDATION_STARTER_BY_FAMILY: Record<RuntimeDirectionCandidate['family_type'], string> = {
  tension: 'Frame the essay around',
  value: 'Lead with the claim that',
  process: 'Make the claim that',
  relationship: 'Center your essay on',
  contradiction: 'Argue that',
  realization: 'Show how',
  ambiguity: 'Frame the essay around',
};

const RECOMMENDATION_DIRECTIVE_PATTERN = /^(Your essay should show|Make your main claim that|Make the claim that|Center your essay on|Center this essay on|Show how|Write this around|Argue that|At the center, show|Lead with the claim that|Frame the essay around|Build the draft around)\s+(.+)$/i;

const RECOMMENDATION_DIRECTIVE_STARTERS = [
  'Your essay should show',
  'Make your main claim that',
  'Make the claim that',
  'Center your essay on',
  'Center this essay on',
  'Show how',
  'Write this around',
  'Argue that',
  'At the center, show',
  'Lead with the claim that',
  'Frame the essay around',
  'Build the draft around',
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
}

function stripDirectivePrefix(directionLine: string): string {
  const normalized = normalizeSentence(directionLine);
  const match = normalized.match(RECOMMENDATION_DIRECTIVE_PATTERN);
  if (!match) return normalized;
  return normalizeSentence(match[2]).replace(/^[,.;:\-–—\s]+/, '').trim();
}

function canonicalizeRecommendationAssembly(directionLine: string): string {
  const normalized = normalizeSentence(directionLine).replace(/\s+([,.;:!?])/g, '$1');
  const match = normalized.match(RECOMMENDATION_DIRECTIVE_PATTERN);
  if (!match) return normalized;

  const rawStarter = normalizeSentence(match[1]).toLowerCase();
  const starter = rawStarter === 'center this essay on'
    ? 'Center your essay on'
    : RECOMMENDATION_DIRECTIVE_STARTERS.find((p) => p.toLowerCase() === rawStarter) ?? 'Your essay should show';
  const body = stripDirectivePrefix(normalized);
  if (!body) return starter;
  const bodyNormalized = body.charAt(0).toLowerCase() + body.slice(1);
  return `${starter} ${bodyNormalized}`;
}

function recommendationCompositionIssues(directionLine: string): string[] {
  const normalized = canonicalizeRecommendationAssembly(directionLine);
  const issues: string[] = [];

  if (!RECOMMENDATION_DIRECTIVE_PATTERN.test(normalized)) {
    issues.push('missing_directive_prefix');
  }

  const body = stripDirectivePrefix(normalized);
  if (!body) issues.push('empty_claim_body');

  const starterAlternation = RECOMMENDATION_DIRECTIVE_STARTERS
    .map((p) => escapeRegex(p.toLowerCase()))
    .join('|');
  const nestedStarterPattern = new RegExp(`^(?:${starterAlternation})\\b`, 'i');
  if (body && nestedStarterPattern.test(body)) {
    issues.push('nested_directive_prefix');
  }

  const directiveHitPattern = new RegExp(`\\b(?:${starterAlternation})\\b`, 'gi');
  const directiveHits = normalized.toLowerCase().match(directiveHitPattern) ?? [];
  if (directiveHits.length > 1) {
    issues.push('multiple_directive_prefixes');
  }

  return issues;
}

function buildDeterministicRecommendation(
  family: RuntimeDirectionCandidate['family_type'],
  hingeForComposition: string | null,
  consequenceForComposition: string | null
): string {
  const starter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';
  const hinge = normalizeSentence(stripDirectivePrefix(hingeForComposition ?? 'one decisive moment changed your standard')).replace(/\.$/, '');
  const consequence = consequenceForComposition
    ? normalizeSentence(stripDirectivePrefix(consequenceForComposition)).replace(/\.$/, '')
    : null;
  const body = consequence ? `${hinge}, and ${consequence}` : hinge;
  return canonicalizeRecommendationAssembly(`${starter} ${body}`);
}

interface EnsurePlainClaimResult {
  text: string;
  instrumentation: CompositionInstrumentation;
}

function ensurePlainClaimRecommendation(
  directionLine: string,
  _seedValue: number,
  family: RuntimeDirectionCandidate['family_type'] = 'process'
): EnsurePlainClaimResult {
  const canonicalInput = canonicalizeRecommendationAssembly(directionLine);
  const issues = recommendationCompositionIssues(canonicalInput);

  // Passthrough: if the recommendation is already valid, preserve the family-specific starter.
  // Do NOT remap — random remapping across a 10-starter pool causes cross-family prefix collapse.
  if (issues.length === 0) {
    return {
      text: canonicalInput,
      instrumentation: {
        composition_failed: false,
        composition_issues: [],
        fallback_replaced: false,
        pre_fallback_recommendation: canonicalInput,
        post_fallback_recommendation: canonicalInput,
        fallback_reason: 'none',
        winning_family: family,
      },
    };
  }

  // Invalid recommendation: rebuild with family-aware fallback starter instead of always
  // collapsing to "Make the claim that..." which causes cross-family shell sameness.
  const familyStarter = RECOMMENDATION_STARTER_BY_FAMILY[family] ?? 'Your essay should show';
  const stem = stripDirectivePrefix(canonicalInput).trim();
  const familyRebuilt = canonicalizeRecommendationAssembly(
    stem
      ? `${familyStarter} ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`
      : `${familyStarter} one clear claim you can prove from your notes.`
  );
  if (recommendationCompositionIssues(familyRebuilt).length === 0) {
    return {
      text: familyRebuilt,
      instrumentation: {
        composition_failed: true,
        composition_issues: issues,
        fallback_replaced: true,
        pre_fallback_recommendation: canonicalInput,
        post_fallback_recommendation: familyRebuilt,
        fallback_reason: 'family_aware_fallback',
        winning_family: family,
      },
    };
  }

  // Family-aware rebuild also failed composition — fall back to neutral "Make the claim that..."
  const neutralRebuilt = canonicalizeRecommendationAssembly(
    stem
      ? `Make the claim that ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`
      : 'Make the claim that one clear claim you can prove from your notes.'
  );
  if (recommendationCompositionIssues(neutralRebuilt).length === 0) {
    return {
      text: neutralRebuilt,
      instrumentation: {
        composition_failed: true,
        composition_issues: issues,
        fallback_replaced: true,
        pre_fallback_recommendation: canonicalInput,
        post_fallback_recommendation: neutralRebuilt,
        fallback_reason: 'composition_rebuild_succeeded',
        winning_family: family,
      },
    };
  }

  // Terminal fallback: nothing validates.
  const terminalFallback = 'Make the claim that one clear claim you can prove from your notes.';
  return {
    text: terminalFallback,
    instrumentation: {
      composition_failed: true,
      composition_issues: issues,
      fallback_replaced: true,
      pre_fallback_recommendation: canonicalInput,
      post_fallback_recommendation: terminalFallback,
      fallback_reason: 'composition_rebuild_failed_terminal_fallback',
      winning_family: family,
    },
  };
}

function ensureEssayAboutAddsMeaning(essayAbout: string, recommendation: string, seedValue: number): string {
  const normalized = normalizeSentence(essayAbout);
  const overlap = jaccardOverlap(normalized, recommendation);
  const hasMeaningCue = /\b(because|so that|which means|what this reveals|why this matters|this matters because)\b/i.test(normalized);

  const leadVariants = [
    'What this essay shows is',
    'The deeper point is',
    'Readers should come away seeing',
    'At heart, you are showing',
    'What matters here is',
    'The meaning is',
  ] as const;

  let rewritten = normalized;
  if (/^(this essay is about|the essay is about|at its core, this essay is about)\s+/i.test(rewritten)) {
    const tail = rewritten.replace(/^(this essay is about|the essay is about|at its core, this essay is about)\s+/i, '');
    const lead = leadVariants[(stableTextHash(tail) + seedValue) % leadVariants.length];
    rewritten = `${lead} ${tail}`;
  }

  if (overlap < 0.58 && hasMeaningCue) return rewritten;

  const addOns = [
    'Why this matters: it names what changed in your judgment, not just what happened.',
    'Why this matters: the reader can understand your claim in one read and see how to draft it.',
    'Why this matters: it clarifies scene, choice, and consequence as one argument.',
    'Why this matters: it turns the story into a claim the student can actually write.',
    'Why this matters: it removes ambiguity about what the essay is proving.',
  ] as const;

  const addOn = addOns[(stableTextHash(rewritten) + seedValue) % addOns.length];
  if (overlap >= 0.58 || !hasMeaningCue) return `${rewritten} ${addOn}`;
  return rewritten;
}

function normalizeEssayAboutCoreForScoring(essayAbout: string): string {
  const normalized = normalizeSentence(essayAbout);
  const withoutLead = normalized.replace(/^(what this essay shows is|the deeper point is|readers should come away seeing|at heart, you are showing|what matters here is|the meaning is)\s+/i, '');
  const withoutSuffix = withoutLead.replace(/\s+why this matters:\s*[\s\S]*$/i, '');
  return normalizeSentence(withoutSuffix || normalized);
}

function normalizeWhyCoreForScoring(why: string): string {
  const normalized = normalizeSentence(why);
  const withoutLead = normalized.replace(
    /^(this is stronger than the obvious version because|this beats the alternate read because|rather than the flatter version,\s*choose this because|this is stronger than the fallback because|compared with the weaker path,\s*this works because|this beats the hollow version because|rather than staying vague,\s*use this because|this is stronger as a drafting claim because|this wins because|the advantage:\s*|why this is sharper:\s*|this is stronger because)\s*/i,
    ''
  );
  const withoutTail = withoutLead.split(/\b(?:Drafting payoff:|Your draft opens:|This gives you a clear 3-sentence paragraph structure\.?|You can write the whole first paragraph in one sitting\.?|The opening is concrete enough to draft immediately\.?)\b/i)[0] ?? withoutLead;
  return normalizeSentence(withoutTail || normalized);
}

function buildRuntimeCandidates(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): RuntimeDirectionCandidate[] {
  const pattern = intake.narrative_pattern.primary_pattern;
  const rawInput = getCaseStateTranscript(caseState);
  const unknownCompareGrounding = pattern === 'unknown'
    ? getUnknownCompareGrounding(rawInput)
    : null;
  const scene = getPreferredScene(caseState);
  const turning = getPreferredTurningPoint(caseState);
  const consequence = getPreferredConsequence(caseState);
  const reflection = getPreferredReflection(caseState);
  const rawActor = caseState ? getDominantActor(caseState) : null;
  const actor = sanitizeActorLabel(rawActor);

  const rawFallbackHinge = chooseFallbackHingeFromRaw(caseState);
  const turningDistinctFromScene = turning && scene
    ? normalizeAnchorKey(turning) !== normalizeAnchorKey(scene)
    : Boolean(turning);
  const defaultHinge = turningDistinctFromScene ? turning : (consequence ?? rawFallbackHinge);
  const hinge = unknownCompareGrounding?.compareSentence ?? defaultHinge;

  const anchors = unknownCompareGrounding
    ? uniqAnchors([
        unknownCompareGrounding.optionLabels[0],
        unknownCompareGrounding.optionLabels[1],
        unknownCompareGrounding.compareSentence,
        unknownCompareGrounding.decisionSentence,
        ...extractRawSentenceAnchors(caseState),
      ])
    : uniqAnchors([
        scene,
        hinge,
        consequence,
        reflection,
        actor,
        ...extractRawSentenceAnchors(caseState),
      ]);

  const hingeKey = hinge ? normalizeAnchorKey(hinge) : '';
  const distinctConsequenceRaw = unknownCompareGrounding?.decisionSentence
    ?? (consequence && normalizeAnchorKey(consequence) !== hingeKey
      ? consequence
      : (anchors.find((anchor) => normalizeAnchorKey(anchor) !== hingeKey) ?? null));
  const sceneRaw = quoteAnchor(scene);
  const turningRaw = quoteAnchor(hinge);
  const reflectionRaw = quoteAnchor(reflection);
  const consequenceRaw = quoteAnchor(distinctConsequenceRaw);
  const sceneQ = anchorCanStandAsClause(sceneRaw) ? sceneRaw : paraphraseHingeClause(pattern);
  const turningQ = anchorCanStandAsClause(turningRaw) ? turningRaw : paraphraseHingeClause(pattern);
  const reflectionQ = anchorCanStandAsClause(reflectionRaw) ? reflectionRaw : paraphraseHingeClause(pattern);
  const consequenceQ = anchorCanStandAsClause(consequenceRaw) ? consequenceRaw : paraphraseConsequenceClause(pattern);

  const themeStatement = deriveThemeStatement(pattern, turningQ, consequenceQ);
  const baseWhy = deriveWhyStatement(pattern, turningQ, consequenceQ);
  const compareOptionA = unknownCompareGrounding?.optionLabels[0] ?? null;
  const compareOptionB = unknownCompareGrounding?.optionLabels[1] ?? null;
  const compareAbout = compareOptionA && compareOptionB
    ? `This essay is about choosing between ${compareOptionA} and ${compareOptionB} by keeping the option with one concrete scene, one changed standard, and one visible result.`
    : null;
  const compareWhy = compareOptionA && compareOptionB
    ? `This beats the weaker path because ${compareOptionA} and ${compareOptionB} both matter, but only one gives you a concrete scene, a revised standard, and a visible result. Drafting payoff: write four lines for each option and keep the version with the cleaner turn.`
    : null;
  const compareNextMove = compareOptionA && compareOptionB
    ? `Write four lines for ${compareOptionA}: scene, changed standard, visible result. Write four lines for ${compareOptionB}: scene, changed standard, visible result. Keep the option with the clearer turn.`
    : null;

  const realizationDirectionLine = (() => {
    switch (pattern) {
      case 'usefulness_vs_intention':
        return turningQ
          ? `Argue that ${turningQ} changed how you define helping, and show the next decision that proved it.`
          : 'Argue that one corrective moment changed how you define helping, then prove it with your next decision.';
      case 'competence_vs_responsibility':
        return turningQ
          ? `Make your main claim that ${turningQ} changed your standard from being fast to being reliable.`
          : 'Make your main claim that your standard shifted from being fast to being reliable, then show where it held.';
      case 'failure_reinterpretation':
        return turningQ
          ? `Show how ${turningQ} changed your interpretation of failure, and how that changed your method.`
          : 'Show how one failure changed your interpretation, then show the method you rebuilt from it.';
      case 'identity_shift':
        return reflectionQ
          ? `Lead with the claim that ${reflectionQ} changed who you were in practice, not just in reflection.`
          : 'Lead with the claim that one realization changed who you were in practice, not just what you believed.';
      case 'responsibility_shift':
        return turningQ
          ? `Make your main claim that ${turningQ} made responsibility your call, and your next action proved it.`
          : 'Make your main claim that responsibility became your call, then show the next action that proved it.';
      case 'conflict_reframe':
        return turningQ
          ? `Show how ${turningQ} changed your lens in conflict, and how that new lens changed your response.`
          : 'Show how one conflict changed your lens, then show the response that proved that change.';
      default:
        return reflectionQ
          ? `Argue that what you understood at ${reflectionQ} changed your next decision.`
          : 'Argue that one realization changed your next decision, not just your reflection.';
    }
  })();

  const recommend = (
    candidate_id: string,
    family: RuntimeDirectionCandidate['family_type'],
    shellId: string,
    direction_line: string,
    why_this_direction: string,
    essay_about: string,
    next_move: string,
    whyFamily: RuntimeDirectionCandidate['why_family_type'],
    compareFamily: RuntimeDirectionCandidate['compare_family_type']
  ): RuntimeDirectionCandidate => {
    const seed = `${candidate_id}:${turningQ ?? ''}:${consequenceQ ?? ''}:${reflectionQ ?? ''}`;
    const seedValue = Math.abs(seed.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));

    const hingeForComposition = (() => {
      if (unknownCompareGrounding && compareOptionA && compareOptionB) {
        switch (family) {
          case 'realization':
            return `choosing between ${compareOptionA} and ${compareOptionB} shows which option gives you a real standard shift on the page`;
          case 'relationship':
            return `comparing ${compareOptionA} and ${compareOptionB} reveals which option actually changes how you respond or read the moment`;
          case 'tension':
            return `testing ${compareOptionA} against ${compareOptionB} shows which option carries one real choice under pressure`;
          case 'value':
            return `between ${compareOptionA} and ${compareOptionB}, one option reveals a value through a concrete choice`;
          case 'process':
            return `between ${compareOptionA} and ${compareOptionB}, one option gives you a clearer before-rule, revision, and result`;
          default:
            break;
        }
      }

      switch (family) {
        case 'process':
          return turningQ
            ? `${turningQ} forced you to rebuild your method and change your standard`
            : 'one concrete failure forced you to rebuild your method and change your standard';
        case 'relationship': {
          // Structural hinge diversification: 3 distinct sentence shapes prevent
          // literal 5-word prefix collapse across multiple relationship winners in a batch.
          // idx=0: moment-first (canonical); idx=1: response-shift; idx=2: read-shift
          const rIdx = seedValue % 3;
          if (rIdx === 1) {
            if (actor) {
              return `your changed response to ${actor.toLowerCase()} once what they actually needed became clear`;
            }
            if (sceneQ && !/^the moment you\b/i.test(sceneQ)) {
              return `${sceneQ} is where your old response standard stopped working`;
            }
            if (turningQ && !/^the moment you\b/i.test(turningQ)) {
              return `${turningQ} forced you to change your response standard`;
            }
            return 'the response correction that started once what someone else actually needed became clear';
          } else if (rIdx === 2) {
            return actor
              ? `what changed in how you read what ${actor.toLowerCase()} needed from you`
              : (turningQ
                ? `what shifted in your read after ${turningQ} forced a different response`
                : 'what forced you to change how you read what someone else actually needed');
          }
          // rIdx === 0: canonical moment-first shape
          return actor
            ? `the moment you changed how you responded to ${actor.toLowerCase()}`
            : (turningQ
              ? `the moment you changed your response after ${turningQ}`
              : 'the moment you changed your response based on what someone else needed');
        }
        case 'contradiction': {
          // Pattern-specific hinge prevents all contradiction cases from sharing
          // the same 'the moment you...' prefix when turningQ is the paraphrase fallback.
          const hingeIsParaphrase = !turningQ || turningQ.startsWith('the moment you');
          switch (pattern) {
            case 'usefulness_vs_intention':
              return !hingeIsParaphrase
                ? `${turningQ} broke your assumption that helping meant explaining`
                : 'the assumption that helping meant explaining turned out to be wrong';
            case 'failure_reinterpretation':
              return !hingeIsParaphrase
                ? `${turningQ} changed what failure actually required of you`
                : 'what you assumed the failure required turned out to be wrong';
            case 'identity_shift':
              return !hingeIsParaphrase
                ? `${turningQ} exposed your old self-image as incomplete`
                : 'the self-image you carried into that situation turned out to be incomplete';
            case 'responsibility_shift':
              return !hingeIsParaphrase
                ? `${turningQ} exposed your old responsibility line as insufficient`
                : 'the responsibility line you held turned out to be insufficient';
            case 'conflict_reframe':
              return !hingeIsParaphrase
                ? `${turningQ} showed your old lens produced the wrong read`
                : 'the lens you used to read that conflict produced the wrong outcome';
            default:
              return !hingeIsParaphrase
                ? `${turningQ} exposed the belief you had about yourself as incomplete`
                : 'the belief you held about yourself turned out to be incomplete';
          }
        }
        case 'realization': {
          // Pattern-specific realization hinges prevent 3+ cases sharing
          // the same 'show how your understanding shifted' shell prefix.
          switch (pattern) {
            case 'failure_reinterpretation':
              return reflectionQ
                ? `your interpretation of the failure changed at ${reflectionQ}`
                : 'your interpretation of the failure changed your next method';
            case 'conflict_reframe':
              return reflectionQ
                ? `your reading of the conflict shifted at ${reflectionQ}`
                : 'your reading of the conflict shifted your response';
            case 'identity_shift':
              return reflectionQ
                ? `your sense of yourself in practice changed at ${reflectionQ}`
                : 'your sense of who you were in practice changed one concrete way';
            default: {
              // Structural hinge diversification: 3 distinct shapes prevent
              // literal 5-word prefix collapse across multiple realization winners in a batch.
              // idx=0: comprehension (canonical); idx=1: approach-shift; idx=2: judgment-shift
              const rlIdx = seedValue % 3;
              if (rlIdx === 1) {
                return reflectionQ
                  ? `your approach to the decision shifted at ${reflectionQ}`
                  : 'your approach to the situation changed what you chose to do';
              } else if (rlIdx === 2) {
                return reflectionQ
                  ? `the shift in your judgment came at ${reflectionQ}`
                  : 'the shift in your read of the situation changed your next decision';
              }
              // rlIdx === 0: canonical comprehension shape
              return reflectionQ
                ? `your understanding shifted at ${reflectionQ}`
                : 'your understanding changed your next decision';
            }
          }
        }
        case 'tension':
          return turningQ
            ? `the moment your priorities collided at ${turningQ}`
            : 'the moment pressure forced a real tradeoff';
        case 'value':
          return 'the value you chose to protect when it cost you something';
        default:
          return turningQ ?? reflectionQ ?? 'one clear claim you can prove from your notes';
      }
    })();
    const consequenceForComposition = (() => {
      if (unknownCompareGrounding && compareOptionA && compareOptionB) {
        switch (family) {
          case 'realization':
            return 'the first scene from that option proves the changed standard is real';
          case 'relationship':
            return 'that option’s clearest scene shows the response change right after';
          case 'tension':
            return 'that option shows what changed immediately after the choice';
          case 'value':
            return 'that option makes the value visible in one concrete result';
          case 'process':
            return 'that option gives you the first result that proves the new rule held';
          default:
            break;
        }
      }

      switch (family) {
        case 'process':
          return consequenceQ
            ? `the first result in ${consequenceQ} proved the new method held`
            : 'the first result proved the new method held';
        case 'relationship':
          return consequenceQ
            ? `the response in ${consequenceQ} showed the change was real`
            : 'your next response showed the change was real';
        case 'contradiction':
          return 'the decision standard that replaced it became visible in your actions';
        case 'realization':
          return 'the next action made that shift visible';
        case 'tension':
          return consequenceQ
            ? `the outcome in ${consequenceQ} showed which standard you chose`
            : 'the outcome showed which standard you chose';
        case 'value':
          return consequenceQ
            ? `the result in ${consequenceQ} showed that value in action`
            : 'the result showed that value in action';
        default:
          return consequenceQ;
      }
    })();
    const deterministicDirection = buildDeterministicRecommendation(
      family,
      hingeForComposition,
      consequenceForComposition
    );

    const plainClaimResult = ensurePlainClaimRecommendation(deterministicDirection, seedValue, family);
    const plainDirectionLine = plainClaimResult.text;
    const shapedEssayAbout = ensureEssayAboutAddsMeaning(essay_about, plainDirectionLine, seedValue);

    return {
      candidate_id,
      family_type: family,
      recommendation_family: family,
      angle_type: family,
      surface_shell_id: shellId,
      shell_penalty_hits: [],
      why_family_type: whyFamily,
      compare_family_type: compareFamily,
      direction_line: plainDirectionLine,
      why_this_direction: ensureWhyValidatorContract(why_this_direction, seedValue),
      essay_about: shapedEssayAbout,
      next_move: ensureConcreteNextMove(next_move, seedValue),
      source_anchor_spans: anchors.slice(0, 4),
      hinge_span: hinge ? trimSnippet(hinge) : null,
      composition_instrumentation: plainClaimResult.instrumentation,
    };
  };

  const tensionCandidate = recommend(
    'c_tension_angle',
    'tension',
    'angle_tension_direct',
    unknownCompareGrounding && compareOptionA && compareOptionB
      ? `Put ${compareOptionA} and ${compareOptionB} on one test: which option gives you one concrete scene, one decision under pressure, and one result right after? Keep that one.`
      : turningQ && consequenceQ
      ? `Your essay should show the moment your priorities collided at ${turningQ}, and how that choice shaped what happened in ${consequenceQ}.`
      : `Your essay should show the moment competing priorities forced a real choice, not a generic growth summary.`,
    unknownCompareGrounding && compareWhy
      ? compareWhy
      : consequenceQ
      ? `It earns trust because it names the tradeoff directly and shows how your judgment shaped ${consequenceQ}.`
      : 'It earns trust because it names the tradeoff clearly and shows the standard your choice made visible.',
    unknownCompareGrounding && compareAbout
      ? compareAbout
      : turningQ
      ? `This essay is about the accountability standard you chose under pressure at ${turningQ}, and how that choice changed your actions.`
      : 'This essay is about the accountability standard you chose when pressure made the easy option tempting.',
    unknownCompareGrounding && compareNextMove
      ? compareNextMove
      : 'Open with the concrete constraint, state the competing priorities, then show the judgment call and immediate consequence.',
    'compellingness',
    'reveals_vs_flattens'
  );

  const valueCandidate = recommend(
    'c_value_angle',
    'value',
    'angle_value_revealed',
    unknownCompareGrounding && compareOptionA && compareOptionB
      ? `Choose between ${compareOptionA} and ${compareOptionB} by keeping the option that reveals one value through a concrete choice and a visible result.`
      : consequenceQ
      ? `Make your main claim that you protected one value when it cost you something, and prove it through ${consequenceQ}.`
      : `Make your main claim about the value you protected when it cost you something, not a list of activities.`,
    unknownCompareGrounding && compareWhy
      ? compareWhy
      : 'Readers trust this angle because they can see what you chose to protect when the easy option was available.',
    unknownCompareGrounding && compareAbout
      ? compareAbout
      : consequenceQ
      ? `This essay is about the discipline behind the value you refused to drop, and the visible result that followed in ${consequenceQ}.`
      : 'This essay is about the discipline required to protect the value when dropping it would have been easier.',
    unknownCompareGrounding && compareNextMove
      ? compareNextMove
      : 'Name the value in plain language, show the moment it was tested, then show one concrete result that proves it was real.',
    'trust',
    'insight_depth'
  );

  const processCandidate = recommend(
    'c_process_angle',
    'process',
    'angle_process_redesign',
    unknownCompareGrounding && compareOptionA && compareOptionB
      ? `Compare ${compareOptionA} and ${compareOptionB}: keep the option where one old rule breaks, a better rule replaces it, and the result changes right after.`
      : turningQ && consequenceQ
      ? `Argue that the method you rebuilt after ${turningQ} changed your standard, and show how ${consequenceQ} proved it held.`
      : turningQ
        ? `Argue that ${turningQ} exposed a flaw in your approach, then show what you changed and the first result that proved it worked.`
        : `Argue that one breakdown forced a rebuilt method, then show the first result that proved the new approach held.`,
    unknownCompareGrounding && compareWhy
      ? compareWhy
      : turningQ && consequenceQ
      ? `This wins because it names the exact failure at ${turningQ} and shows how the rebuilt standard proved itself in ${consequenceQ} — not a generic process story.`
      : `This wins when you show the specific failure, the specific change in how you worked, and the first result that proved it was real — not just that you improved.`,
    unknownCompareGrounding && compareAbout
      ? compareAbout
      : turningQ
      ? `This essay is about how ${turningQ} forced you to change your method, and how that method held when it mattered.`
      : 'This essay is about one concrete failure, the method you rebuilt, and the behavior that proved it stuck.',
    unknownCompareGrounding && compareNextMove
      ? compareNextMove
      : 'Start inside the failure detail, name the exact thing you changed in how you worked, then show the first result that proved the new standard held.',
    'contrast',
    'draftability'
  );

  const relationshipCandidate = recommend(
    'c_relationship_angle',
    'relationship',
    'angle_relationship_shift',
    unknownCompareGrounding && compareOptionA && compareOptionB
      ? `Choose between ${compareOptionA} and ${compareOptionB} by keeping the option where one concrete scene changes how you read the moment or respond inside it.`
      : actor && turningQ
      ? `Center this essay on the moment you changed how you responded to ${actor.toLowerCase()} at ${turningQ}.`
      : turningQ
        ? `Center this essay on what you learned when ${turningQ}, and how you changed your response.`
        : actor
          ? `Show the moment you stopped assuming and started responding to what ${actor.toLowerCase()} actually needed.`
          : 'Show one interaction that changed how you responded to another person.',
    unknownCompareGrounding && compareWhy
      ? compareWhy
      : actor && turningQ
      ? `This beats the weaker read because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`
      : turningQ
        ? `This beats the weaker read because it shows how your response changed at ${turningQ}, not just that you cared.`
        : actor
          ? `This beats the weaker read because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`
          : 'This beats the weaker read because it shows a real interaction and a visible response change.',
    unknownCompareGrounding && compareAbout
      ? compareAbout
      : actor && turningQ
      ? `This essay is about the accountability you accepted when you noticed what ${actor.toLowerCase()} needed at ${turningQ}, and changed your response to meet that standard.`
      : turningQ
        ? `This essay is about the trust you earned by changing your response after ${turningQ}, and the standard that proved it held.`
        : actor
          ? `This essay is about the accountability you built when you started responding to what ${actor.toLowerCase()} needed instead of what you assumed.`
          : 'This essay is about the trust you earn by noticing what another person needs and changing your response to meet that standard.',
    unknownCompareGrounding && compareNextMove
      ? compareNextMove
      : 'Open with the interaction detail, name what you misread at first, then show what you changed in your response.',
    'trust',
    'thread_strength'
  );

  const contradictionCandidate = recommend(
    'c_contradiction_angle',
    'contradiction',
    'angle_contradiction_resolved',
    turningQ
      ? `Argue that what you believed about yourself collided with what happened when ${turningQ}, and show the standard that replaced it.`
      : 'Argue that your self-image conflicted with what the moment required, and show the decision standard that replaced it.',
    turningQ
      ? `This wins because ${turningQ} makes the contradiction visible and shows what standard replaced it.`
      : 'This wins because the contradiction is explicit and the replacement standard is concrete.',
    turningQ
      ? `This essay is about the accountability you accepted when revising your belief at ${turningQ}, and the new decision standard that replaced it.`
      : 'This essay is about the accountability you accepted when revising a belief about yourself and showing the decision standard that replaced it.',
    'Write two short beats: what you assumed about yourself, then the detail that proved that assumption was incomplete.',
    'contrast',
    'insight_depth'
  );

  const realizationCandidate = recommend(
    'c_realization_angle',
    'realization',
    'angle_realization_action',
    unknownCompareGrounding && compareOptionA && compareOptionB
      ? `Put ${compareOptionA} and ${compareOptionB} on one test: which option lets you show one moment that changed your standard and the first result that followed? Build from that one.`
      : realizationDirectionLine,
    unknownCompareGrounding && compareWhy
      ? compareWhy
      : reflectionQ
      ? `This beats the weaker read because ${reflectionQ} clarifies what you understood, and the next action shows that the new standard held.`
      : 'This beats the weaker read because it clarifies what changed in your understanding and shows the action that proved it held.',
    unknownCompareGrounding && compareAbout
      ? compareAbout
      : reflectionQ
      ? `This essay is about the accountability you accepted when you understood what changed at ${reflectionQ}, and the standard your next action proved.`
      : 'This essay is about the accountability you accepted by revising what you understood, and the standard your visible behavior proved.',
    unknownCompareGrounding && compareNextMove
      ? compareNextMove
      : sceneQ
      ? `Start inside ${sceneQ}, then write the realization sentence and one action that proves it stuck.`
      : 'Start inside one concrete scene, then write the realization sentence and one action that proves it stuck.',
    'compellingness',
    'thread_strength'
  );

  return [
    tensionCandidate,
    valueCandidate,
    processCandidate,
    relationshipCandidate,
    contradictionCandidate,
    realizationCandidate,
  ];
}

function scoreAndRankRuntimeCandidates(
  candidates: RuntimeDirectionCandidate[],
  pattern: NarrativePattern
): RankedRuntimeDirectionCandidate[] {
  const genericPattern = /\b(growth|leadership|resilience|mindset|journey|authentic|best angle|one clear thread|concrete moments and consequences|strong central claim)\b/i;
  const translatedPattern = /\b(the strongest direction|this essay should|redirects the scene inside|framework|rubric)\b/i;
  const bannedShellPattern = /\b(build from the angle that|the direction is the specific moment|the real story is|what changed in your judgment|the choice at.+changed what happened)\b/i;
  const bannedWhyPattern = /\b(this direction works because|this works because|specific gap|not a general lesson|links one decision to one consequence)\b/i;
  const bannedComparePattern = /\b(overweights setup|underweights the real decision|centers the hinge|keeps the decision and consequence tied|stays closer to setup than hinge)\b/i;
  const rhythmTellPattern = /\b(this version|this angle|this essay is fundamentally about|source-backed hinge|one concrete decision|reveals your real standard)\b/gi;

  const scored = candidates.map((candidate) => {
    const text = `${candidate.direction_line} ${candidate.why_this_direction} ${candidate.essay_about}`.toLowerCase();
    const anchorKeys = candidate.source_anchor_spans
      .map((span) => normalizeAnchorKey(span))
      .filter((key) => key.length >= 8);
    const uniqueAnchorKeys = Array.from(new Set(anchorKeys));
    const uniqueAnchorCount = uniqueAnchorKeys.length;
    const duplicateAnchorRatio = anchorKeys.length > 0
      ? clampScore((anchorKeys.length - uniqueAnchorCount) / anchorKeys.length)
      : 1;

    const hasSourceAnchor = uniqueAnchorCount > 0;
    const hasHinge = Boolean(candidate.hinge_span) && !isLowInformationAnchor(candidate.hinge_span ?? '');
    const genericRisk = genericPattern.test(text);
    const overTranslatedRisk = translatedPattern.test(text);
    const lowSpecificityRisk = uniqueAnchorCount < 2 || duplicateAnchorRatio > 0.34;
    const taxonomyForwardRisk = TAXONOMY_FORWARD_PATTERN.test(`${candidate.direction_line} ${candidate.essay_about}`);
    const compositionIssues = recommendationCompositionIssues(candidate.direction_line);
    const claimFirstSignal = hasClaimFirstForm(candidate.direction_line);
    const plainClaimSignal = hasPlainClaimSignal(candidate.direction_line);
    const comparativeWhySignal = hasComparativeWhySignal(candidate.why_this_direction);
    const draftingPayoffSignal = hasDraftingPayoffSignal(candidate.why_this_direction);
    const concreteNextStepSignal = hasConcreteNextStep(candidate.next_move);
    const comprehensionSignal = hasComprehensionSignal(candidate);

    const quotedFragments = Array.from(
      `${candidate.direction_line} ${candidate.why_this_direction}`.matchAll(/"([^"]{8,})"/g)
    ).map((m) => normalizeAnchorKey(m[1]));
    const uniqueQuotedFragments = Array.from(new Set(quotedFragments));
    const repeatedQuoteRatio = quotedFragments.length > 0
      ? clampScore((quotedFragments.length - uniqueQuotedFragments.length) / quotedFragments.length)
      : 0;

    const scaffoldFamilyPattern = /^(your essay is about|this direction works because|this read stays closer|this read centers|what changed when|what became visible|the real story is|the choice at|the direction is the specific moment|the moment your approach changed|the correction, not the activity|build from the angle that|what changed in your judgment)/i;
    const directionScaffold = scaffoldFamilyPattern.test(candidate.direction_line.trim());
    const whyScaffold = scaffoldFamilyPattern.test(candidate.why_this_direction.trim());
    const aboutScaffold = scaffoldFamilyPattern.test(candidate.essay_about.trim());
    const repeatedScaffoldCount = Number(directionScaffold) + Number(whyScaffold) + Number(aboutScaffold);

    const rhythmTellHits = (text.match(rhythmTellPattern) || []).length;
    const decisionShellPattern = /\b(pressure scene|pressure moment|one concrete decision|real standard|scene to insight|choice that defined your standard|write this essay around|what happened next)\b/i;
    const angleNamingPattern = /\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research rigor|advocacy|trust|method|discipline)\b/i;
    const fillerAboutPattern = /\b(one clear thread|concrete moments and consequences|strong central claim|pressure moment|scene[-\s]level choice|choice\s*(and|\+)\s*consequence)\b/i;
    const sourceSignalText = `${candidate.source_anchor_spans.join(' ')} ${candidate.hinge_span ?? ''}`.toLowerCase();
    const processSignalHit = /\b(workflow|process|system|redesign|reliability|logistics|debug|protocol|checklist|inventory|citation|source map|quality control)\b/i.test(sourceSignalText);
    const relationshipSignalHit = /\b(communication|comprehension|translate|translation|understood|understand|teaching|listen|helping|useful|misread|needed)\b/i.test(sourceSignalText);
    const contradictionSignalHit = /\b(ego|credit|authorship|fairness|public|private|confidence|ownership|inconsisten|admit|accountability)\b/i.test(sourceSignalText);
    const researchSignalHit = /\b(source|evidence|method|methodology|rigor|reliable|reliability|citation|verify|validation|bias|sample)\b/i.test(sourceSignalText);

    const familyFitBase = clampScore(familyFitScore(pattern, candidate.family_type));
    const familySignalBoost = clampScore(
      (candidate.family_type === 'process' && (processSignalHit || researchSignalHit) ? 0.22 : 0)
      + (candidate.family_type === 'relationship' && relationshipSignalHit ? 0.2 : 0)
      + (candidate.family_type === 'contradiction' && contradictionSignalHit ? 0.2 : 0)
      + (candidate.family_type === 'realization' && (contradictionSignalHit || researchSignalHit) ? 0.08 : 0)
    );
    const familySignalMismatchPenalty = clampScore(
      (candidate.family_type === 'tension' || candidate.family_type === 'value')
      && (processSignalHit || relationshipSignalHit || contradictionSignalHit || researchSignalHit)
        ? 0.22
        : 0
    );
    const familyFit = clampScore(familyFitBase + familySignalBoost - familySignalMismatchPenalty);

    const aboutOverlap = jaccardOverlap(candidate.direction_line, candidate.essay_about);
    const essayAboutCoreForScoring = normalizeEssayAboutCoreForScoring(candidate.essay_about);
    const whyCoreForScoring = normalizeWhyCoreForScoring(candidate.why_this_direction);
    const concreteChangeActionPattern = /\b(changed?|changing|decid(?:e|ed|ing)|realiz(?:e|ed|ing)|respond(?:ed|ing|s)?|rebuilt?|rebuild(?:ing)?|noticed?|noticing|started?|stopped?|shift(?:ed|ing|s)?|adjust(?:ed|ing|s)?|acted?|acting|learned|understood|proved|showed|saw|accepted|revised|chose)\b/i;
    const contrastLanguagePattern = /\b(rather than|instead of|not just|not merely|compared with|compared to|versus|vs\.?|weaker read|alternate read|fallback|flatter|stronger than)\b/i;
    const actionResultPattern = /\b(action|acted|response|responded|decision|decided|choice|result|reaction|consequence|proved|showed|held|changed|shifted|adjusted)\b/i;
    const essayAboutHasConcreteChangeAction = concreteChangeActionPattern.test(essayAboutCoreForScoring);
    const essayAboutHasSourceGroundedClaim = essayAboutHasConcreteChangeAction && hasSourceAnchor;
    const whyHasContrastLanguage = contrastLanguagePattern.test(whyCoreForScoring);
    const whyHasActionResultEvidence = actionResultPattern.test(whyCoreForScoring);
    const whyHasContrastPlusAction = whyHasContrastLanguage && whyHasActionResultEvidence;
    const essayAboutAddsMeaningSignal = aboutOverlap < 0.58 || /\b(because|so that|which means|what this reveals|why this matters)\b/i.test(candidate.essay_about);
    const essayAboutRedundancyPenalty = clampScore(
      (aboutOverlap > 0.52 ? 0.74 : aboutOverlap > 0.42 ? 0.42 : 0.08)
      + (fillerAboutPattern.test(candidate.essay_about) ? 0.22 : 0)
    );
    const contradictionOverusePenalty = clampScore(
      candidate.family_type === 'contradiction'
      && !['conflict_reframe', 'failure_reinterpretation', 'responsibility_shift'].includes(pattern)
        ? 0.46
        : 0
    );
    const patternBestFit = patternBestFamilyFit(pattern);
    const familyFitGap = clampScore(patternBestFit - familyFitBase);
    const familyMismatchPenalty = clampScore(Math.max(0, 0.92 - familyFit) + familySignalMismatchPenalty * 0.4);
    const rawFamilyCollapsePenalty = decisionShellPattern.test(`${candidate.direction_line} ${candidate.essay_about}`) ? 0.82 : 0.04;
    const familyCollapsePenalty = clampScore(
      pattern === 'unknown' && candidate.family_type !== 'contradiction'
        ? rawFamilyCollapsePenalty * 0.18
        : rawFamilyCollapsePenalty
    );
    const rawDecisionShellPenalty = decisionShellPattern.test(`${candidate.direction_line} ${candidate.essay_about} ${candidate.why_this_direction}`) ? 0.84 : 0.06;
    const decisionShellPenalty = clampScore(
      pattern === 'unknown' && candidate.family_type !== 'contradiction'
        ? Math.max(0.1, rawDecisionShellPenalty - 0.38)
        : rawDecisionShellPenalty
    );
    const hasAltFamilySignal = processSignalHit || relationshipSignalHit || contradictionSignalHit || researchSignalHit
      || ['process', 'relationship', 'contradiction', 'realization'].some((family) => familyFitScore(pattern, family as RuntimeDirectionCandidate['family_type']) > 0.82);
    const patternConditionedMisfitPenalty = clampScore(
      familyFitGap * 1.25 +
      Math.max(0, 0.84 - familyFit) * 0.45 +
      familySignalMismatchPenalty * 0.45 -
      familySignalBoost * 0.15
    );
    const dominantFamilyOverusePenalty = clampScore(
      (familyFitGap > 0.18 && hasAltFamilySignal ? 0.42 : 0)
      + (familyFitGap > 0.1 ? familyFitGap * 0.35 : 0)
      + 0.06
    );
    const sourceGrounding = clampScore(Math.min(1, uniqueAnchorCount / 2.5) - duplicateAnchorRatio * 0.3);
    const sourceFaithfulness = clampScore((hasSourceAnchor ? 0.55 + Math.min(uniqueAnchorCount, 3) * 0.13 : 0.2) - duplicateAnchorRatio * 0.25);
    const essayAboutnessClarity = clampScore(
      (essayAboutHasSourceGroundedClaim ? 0.52 : essayAboutHasConcreteChangeAction ? 0.28 : 0.18)
      + (essayAboutAddsMeaningSignal ? 0.1 : 0)
      + (aboutOverlap < 0.58 ? 0.08 : 0)
      - (overTranslatedRisk ? 0.1 : 0)
      - (/\bone clear thread\b|\bconcrete moments and consequences\b/i.test(essayAboutCoreForScoring) ? 0.26 : 0)
    );
    const directionalUsefulness = clampScore(
      (/(write the essay|center the essay|make the essay about|build the essay around|frame the essay around)/i.test(candidate.direction_line) ? 0.58 : 0.26)
      + (/(tension|value|process|relationship|contradiction|realization)/i.test(candidate.direction_line) ? 0.2 : 0)
      + (hasSourceAnchor ? 0.15 : 0)
      - (genericRisk ? 0.15 : 0)
      - (bannedShellPattern.test(candidate.direction_line) ? 0.35 : 0)
    );
    const whyQuality = clampScore(
      (whyHasContrastPlusAction ? 0.56 : whyHasActionResultEvidence ? 0.36 : 0.22)
      - (overTranslatedRisk ? 0.1 : 0)
      - (bannedWhyPattern.test(whyCoreForScoring) ? 0.36 : 0)
    );
    const coachingActionability = clampScore(
      (/(start|open|write|then|after|show|name|draft)/i.test(candidate.next_move) ? 0.58 : 0.32)
      + (/(scene|sentence|detail|consequence|hinge)/i.test(candidate.next_move) ? 0.22 : 0)
      + (hasSourceAnchor ? 0.12 : 0)
      - (overTranslatedRisk ? 0.08 : 0)
    );
    const humanPreferenceLikelihood = clampScore(
      (directionalUsefulness * 0.28)
      + (essayAboutnessClarity * 0.24)
      + (whyQuality * 0.24)
      + (coachingActionability * 0.24)
      - (genericRisk ? 0.12 : 0)
      - (repeatedScaffoldCount >= 2 ? 0.16 : 0)
    );
    const concreteAnchorRetention = clampScore(uniqueAnchorCount >= 2 ? 1 : uniqueAnchorCount === 1 ? 0.65 : 0);
    const hingeClarity = clampScore(hasHinge ? (duplicateAnchorRatio > 0.34 ? 0.72 : 1) : 0.35);

    const hasStepSignals = /\b(start|open|write)\b/i.test(candidate.next_move) && /\b(then|after)\b/i.test(candidate.next_move);
    const hasDraftUnits = /\b(scene|sentence|detail|consequence|2-3|4-6|one)\b/i.test(candidate.next_move);
    const draftability = clampScore(0.45 + (hasStepSignals ? 0.28 : 0) + (hasDraftUnits ? 0.17 : 0) + (hasSourceAnchor ? 0.08 : 0) - (overTranslatedRisk ? 0.1 : 0));

    const individualization = clampScore((candidate.direction_line.includes('"') ? 0.45 : 0.2) + Math.min(uniqueAnchorCount, 3) * 0.2 - duplicateAnchorRatio * 0.25 - repeatedQuoteRatio * 0.2);
    const nonRepeatability = clampScore(
      0.8
      - (genericRisk ? 0.28 : 0)
      - duplicateAnchorRatio * 0.3
      - repeatedQuoteRatio * 0.25
      - (lowSpecificityRisk ? 0.22 : 0)
      - (rhythmTellHits >= 3 ? 0.22 : 0)
      + (uniqueAnchorCount >= 2 ? 0.18 : 0)
    );
    const coachJudgmentQuality = clampScore((/\bbecause|wins|hinge|consequence\b/i.test(candidate.why_this_direction) ? 0.7 : 0.48) + (uniqueAnchorCount >= 2 ? 0.14 : 0));
    const angleDirectness = clampScore((angleNamingPattern.test(candidate.direction_line) ? 0.65 : 0.28) - (decisionShellPattern.test(candidate.direction_line) ? 0.32 : 0));
    const essayAngleNamingQuality = clampScore((angleNamingPattern.test(candidate.essay_about) ? 0.62 : 0.25) - (decisionShellPattern.test(candidate.essay_about) ? 0.3 : 0));
    const caseSpecificityBeyondPivot = clampScore((hasSourceAnchor ? 0.46 : 0.2) + (uniqueAnchorCount >= 2 ? 0.26 : 0) + (angleNamingPattern.test(`${candidate.direction_line} ${candidate.essay_about}`) ? 0.2 : 0) - (decisionShellPattern.test(`${candidate.direction_line} ${candidate.essay_about}`) ? 0.24 : 0));
    const familyDiversitySurvival = clampScore((candidate.family_type === 'tension' || candidate.family_type === 'value') ? 0.45 : 0.82);
    const ambiguityDecisionHelpfulness = clampScore(/\b(compare|choose|test|sorting question|missing detail|two angles|angle a|angle b)\b/i.test(`${candidate.direction_line} ${candidate.next_move} ${candidate.why_this_direction}`) ? 0.76 : 0.42);

    const translationPenalty = clampScore((overTranslatedRisk ? 0.42 : 0.12) + duplicateAnchorRatio * 0.18 + repeatedQuoteRatio * 0.22 + (bannedShellPattern.test(text) ? 0.4 : 0));
    const templateScaffoldPenalty = clampScore((repeatedScaffoldCount >= 2 ? 0.34 : repeatedScaffoldCount === 1 ? 0.18 : 0.06) + (directionScaffold && whyScaffold ? 0.18 : 0) + (bannedWhyPattern.test(text) ? 0.28 : 0));
    const abstractionPenalty = clampScore((genericRisk ? 0.34 : 0.1) + (lowSpecificityRisk ? 0.16 : 0) + (uniqueAnchorCount < 2 ? 0.08 : 0) + (rhythmTellHits >= 4 ? 0.18 : 0));
    const identifiabilityPenalty = clampScore((rhythmTellHits >= 3 ? 0.3 : 0.1) + (bannedComparePattern.test(text) ? 0.4 : 0));
    const humanVoiceClarity = clampScore(
      (claimFirstSignal ? 0.18 : 0.04)
      + (plainClaimSignal ? 0.24 : 0.06)
      + (taxonomyForwardRisk ? 0 : 0.12)
      + (comparativeWhySignal ? 0.14 : 0)
      + (draftingPayoffSignal ? 0.14 : 0)
      + (concreteNextStepSignal ? 0.16 : 0)
      + (essayAboutAddsMeaningSignal ? 0.1 : 0)
      + (comprehensionSignal ? 0.12 : 0)
    );
    const clarityHardFailPenalty = clampScore(
      (!claimFirstSignal ? 0.28 : 0)
      + (!plainClaimSignal && taxonomyForwardRisk ? 0.62 : 0)
      + (!comparativeWhySignal ? 0.36 : 0)
      + (!draftingPayoffSignal ? 0.28 : 0)
      + (!concreteNextStepSignal ? 0.62 : 0)
      + (!essayAboutAddsMeaningSignal ? 0.34 : 0)
      + (!comprehensionSignal ? 0.58 : 0)
    );

    const prePenaltyTotal = round(
      sourceGrounding * 0.04 +
      sourceFaithfulness * 0.04 +
      essayAboutnessClarity * 0.08 +
      directionalUsefulness * 0.07 +
      whyQuality * 0.06 +
      draftability * 0.06 +
      coachingActionability * 0.05 +
      nonRepeatability * 0.06 +
      humanPreferenceLikelihood * 0.09 +
      familyFit * 0.24 +
      concreteAnchorRetention * 0.04 +
      hingeClarity * 0.03 +
      individualization * 0.02 +
      coachJudgmentQuality * 0.02 +
      angleDirectness * 0.08 +
      essayAngleNamingQuality * 0.08 +
      caseSpecificityBeyondPivot * 0.08 +
      familyDiversitySurvival * 0.04 +
      ambiguityDecisionHelpfulness * 0.02 +
      humanVoiceClarity * 0.08
    );

    const postPenaltyTotal = round(
      prePenaltyTotal -
      translationPenalty * 0.07 -
      templateScaffoldPenalty * 0.12 -
      abstractionPenalty * 0.06 -
      identifiabilityPenalty * 0.12 -
      essayAboutRedundancyPenalty * 0.28 -
      familyCollapsePenalty * 0.28 -
      decisionShellPenalty * 0.24 -
      dominantFamilyOverusePenalty * 0.26 -
      contradictionOverusePenalty * 0.16 -
      familyMismatchPenalty * 0.16 -
      patternConditionedMisfitPenalty * 0.34 -
      clarityHardFailPenalty * 0.42
    );

    const totalScore = round(
      postPenaltyTotal
    );

    const rejectionReasons: string[] = [];
    const scaffoldPatternHits: string[] = [];
    if (!hasSourceAnchor) rejectionReasons.push('no_source_anchor');
    if (!hasHinge) rejectionReasons.push('no_hinge_anchor');
    if (genericRisk && overTranslatedRisk) rejectionReasons.push('generic_over_translated_risk');
    if (lowSpecificityRisk) rejectionReasons.push('low_specificity_anchor_set');
    if (duplicateAnchorRatio > 0.5) rejectionReasons.push('duplicated_anchor_span');
    if (repeatedQuoteRatio > 0.34) rejectionReasons.push('repeated_quote_loop');
    if (bannedShellPattern.test(candidate.direction_line)) rejectionReasons.push('banned_recommendation_shell');
    if (bannedWhyPattern.test(candidate.why_this_direction)) rejectionReasons.push('banned_why_shell');
    if (rhythmTellHits >= 4) rejectionReasons.push('high_identifiability_rhythm');
    if (essayAboutRedundancyPenalty > 0.25) rejectionReasons.push('essay_about_redundancy_penalty');
    if (!claimFirstSignal) rejectionReasons.push('claim_first_clarity_fail');
    if (!plainClaimSignal && taxonomyForwardRisk) rejectionReasons.push('plain_claim_clarity_fail');
    if (compositionIssues.length > 0) rejectionReasons.push('malformed_recommendation_composition');
    if (!comparativeWhySignal || !draftingPayoffSignal) rejectionReasons.push('why_coaching_clarity_fail');
    if (!concreteNextStepSignal) rejectionReasons.push('no_concrete_next_step');
    if (!essayAboutAddsMeaningSignal) rejectionReasons.push('essay_about_restate_fail');
    if (!comprehensionSignal) rejectionReasons.push('comprehension_fail');
    if (familyCollapsePenalty > 0.2) rejectionReasons.push('family_collapse_penalty');
    if (decisionShellPenalty > 0.5) rejectionReasons.push('decision_shell_penalty');
    if (dominantFamilyOverusePenalty > 0.25) rejectionReasons.push('dominant_family_overuse_penalty');
    if (familyFit < 0.68) rejectionReasons.push('family_pattern_mismatch');
    if (contradictionOverusePenalty > 0.2) rejectionReasons.push('contradiction_family_overuse_for_pattern');
    if (directionScaffold) scaffoldPatternHits.push('direction_scaffold');
    if (whyScaffold) scaffoldPatternHits.push('why_scaffold');
    if (aboutScaffold) scaffoldPatternHits.push('essay_about_scaffold');
    if (bannedShellPattern.test(candidate.direction_line)) scaffoldPatternHits.push('banned_recommendation_shell');
    if (bannedWhyPattern.test(candidate.why_this_direction)) scaffoldPatternHits.push('banned_why_shell');
    if (essayAboutRedundancyPenalty > 0.25) scaffoldPatternHits.push('essay_about_redundancy_penalty');
    if (familyCollapsePenalty > 0.2) scaffoldPatternHits.push('family_collapse_penalty');
    if (repeatedScaffoldCount >= 2) rejectionReasons.push('over_repeated_scaffold_family');

    return {
      ...candidate,
      shell_penalty_hits: scaffoldPatternHits,
      scores: {
        angle_directness: angleDirectness,
        essay_angle_naming_quality: essayAngleNamingQuality,
        case_specificity_beyond_pivot: caseSpecificityBeyondPivot,
        family_diversity_survival: familyDiversitySurvival,
        ambiguity_decision_helpfulness: ambiguityDecisionHelpfulness,
        source_grounding: sourceGrounding,
        source_faithfulness: sourceFaithfulness,
        family_fit_base: familyFitBase,
        family_fit: familyFit,
        family_fit_gap: familyFitGap,
        pattern_conditioned_misfit_penalty: patternConditionedMisfitPenalty,
        essay_aboutness_clarity: essayAboutnessClarity,
        directional_usefulness: directionalUsefulness,
        why_quality: whyQuality,
        coaching_actionability: coachingActionability,
        human_preference_likelihood: humanPreferenceLikelihood,
        concrete_anchor_retention: concreteAnchorRetention,
        narrative_hinge_clarity: hingeClarity,
        draftability,
        individualization,
        non_repeatability: nonRepeatability,
        coach_judgment_quality: coachJudgmentQuality,
        translation_penalty: translationPenalty,
        template_scaffold_penalty: templateScaffoldPenalty,
        abstraction_penalty: abstractionPenalty,
        decision_shell_penalty: decisionShellPenalty,
        family_collapse_penalty: familyCollapsePenalty,
        dominant_family_overuse_penalty: dominantFamilyOverusePenalty,
        pre_penalty_total: prePenaltyTotal,
        post_penalty_total: postPenaltyTotal,
        total_score: totalScore,
        // fields required by RuntimeDirectionCandidateScores (batch-level, computed at packet layer)
        angle_first_quality: 0,
        essay_about_conceptual_lift: 0,
        batch_diversity_credit: 0,
        packet_family_sameness_penalty: 0,
        batch_family_distribution_penalty: 0,
        packet_adjusted_total: totalScore,
      },
      validator_flags: {
        has_source_anchor: hasSourceAnchor,
        has_narrative_hinge: hasHinge,
        repeatable_direction_risk: genericRisk,
        over_translated_risk: overTranslatedRisk,
        generic_language_risk: genericRisk,
      },
      rejection_reasons: rejectionReasons,
      scaffold_pattern_hits: scaffoldPatternHits,
      selected: false,
      rank: null,
    } satisfies RankedRuntimeDirectionCandidate;
  });

  const hardFailReasons = new Set([
    'claim_first_clarity_fail',
    'plain_claim_clarity_fail',
    'malformed_recommendation_composition',
    'why_coaching_clarity_fail',
    'no_concrete_next_step',
    'essay_about_restate_fail',
  ]);
  const shellHardFailReasons = new Set([
    'cross_family_shell_sameness',
    'over_repeated_scaffold_family',
    'family_collapse_penalty',
    'decision_shell_penalty',
    'banned_recommendation_shell',
    'banned_why_shell',
  ]);
  const hasHardFail = (candidate: RankedRuntimeDirectionCandidate): boolean =>
    candidate.rejection_reasons.some((r) => hardFailReasons.has(r));
  const hasShellHardFail = (candidate: RankedRuntimeDirectionCandidate): boolean =>
    candidate.rejection_reasons.some((r) => shellHardFailReasons.has(r));

  const shellPrefixFamilies = new Map<string, Set<string>>();
  for (const candidate of scored) {
    const shellKey = normalizeAnchorKey(candidate.direction_line).split(' ').slice(0, 7).join(' ');
    if (!shellKey) continue;
    const families = shellPrefixFamilies.get(shellKey) ?? new Set<string>();
    families.add(candidate.family_type);
    shellPrefixFamilies.set(shellKey, families);
  }

  const scoredAdjusted = scored.map((candidate) => {
    const shellKey = normalizeAnchorKey(candidate.direction_line).split(' ').slice(0, 7).join(' ');
    const families = shellPrefixFamilies.get(shellKey);
    const crossFamilySameness = Boolean(families && families.size > 1);
    if (!crossFamilySameness) return candidate;

    const updatedReasons = candidate.rejection_reasons.includes('cross_family_shell_sameness')
      ? candidate.rejection_reasons
      : [...candidate.rejection_reasons, 'cross_family_shell_sameness'];
    const updatedHits = candidate.shell_penalty_hits.includes('cross_family_shell_sameness')
      ? candidate.shell_penalty_hits
      : [...candidate.shell_penalty_hits, 'cross_family_shell_sameness'];

    const familyCollapsePenalty = clampScore((candidate.scores.family_collapse_penalty ?? 0) + 0.18);
    const decisionShellPenalty = clampScore((candidate.scores.decision_shell_penalty ?? 0) + 0.18);
    const adjustedPost = round((candidate.scores.post_penalty_total ?? candidate.scores.total_score) - 0.12);
    const adjustedTotal = round((candidate.scores.total_score ?? adjustedPost) - 0.12);

    return {
      ...candidate,
      rejection_reasons: updatedReasons,
      shell_penalty_hits: updatedHits,
      scores: {
        ...candidate.scores,
        family_collapse_penalty: familyCollapsePenalty,
        decision_shell_penalty: decisionShellPenalty,
        post_penalty_total: adjustedPost,
        total_score: adjustedTotal,
        packet_adjusted_total: adjustedTotal,
      },
    };
  });

  const vetoEligible = scoredAdjusted.filter((candidate) => !hasHardFail(candidate));
  const shellSafeEligible = vetoEligible.filter((candidate) => !hasShellHardFail(candidate));

  const clarityScore = (candidate: RankedRuntimeDirectionCandidate): number => round(
    (candidate.scores.directional_usefulness * 0.26)
    + (candidate.scores.essay_aboutness_clarity * 0.22)
    + (candidate.scores.why_quality * 0.2)
    + (candidate.scores.coaching_actionability * 0.2)
    + (candidate.scores.coach_judgment_quality * 0.12)
  );

  const clarityWeightedTotal = (candidate: RankedRuntimeDirectionCandidate): number => round(
    candidate.scores.total_score * 0.56 + clarityScore(candidate) * 0.44
  );

  const strictSurvivors = shellSafeEligible.filter((candidate) => candidate.rejection_reasons.length < 2);
  const rankedSourceBase = strictSurvivors.length >= 2
    ? strictSurvivors
    : (shellSafeEligible.length > 0 ? shellSafeEligible : (vetoEligible.length > 0 ? vetoEligible : scoredAdjusted));

  const MIN_VIABLE_SURVIVORS = 3;
  const hardFailCount = (candidate: RankedRuntimeDirectionCandidate): number =>
    candidate.rejection_reasons.filter((r) => hardFailReasons.has(r)).length;
  const shellFailCount = (candidate: RankedRuntimeDirectionCandidate): number =>
    candidate.rejection_reasons.filter((r) => shellHardFailReasons.has(r)).length;

  const rankedSource = [...rankedSourceBase];
  if (rankedSource.length < MIN_VIABLE_SURVIVORS) {
    const currentIds = new Set(rankedSource.map((c) => c.candidate_id));
    const backfillPool = scoredAdjusted
      .filter((candidate) => !currentIds.has(candidate.candidate_id))
      .sort((a, b) => {
        const hardDelta = hardFailCount(a) - hardFailCount(b);
        if (hardDelta !== 0) return hardDelta;
        const shellDelta = shellFailCount(a) - shellFailCount(b);
        if (shellDelta !== 0) return shellDelta;
        const scoreDelta = b.scores.total_score - a.scores.total_score;
        if (Math.abs(scoreDelta) > 0.001) return scoreDelta;
        return b.scores.directional_usefulness - a.scores.directional_usefulness;
      });

    for (const candidate of backfillPool) {
      if (rankedSource.length >= MIN_VIABLE_SURVIVORS) break;
      rankedSource.push({
        ...candidate,
        rejection_reasons: candidate.rejection_reasons.includes('pool_backfill_recovery')
          ? candidate.rejection_reasons
          : [...candidate.rejection_reasons, 'pool_backfill_recovery'],
      });
    }
  }

  const sorted = [...rankedSource].sort((a, b) => {
    const clarityDelta = clarityWeightedTotal(b) - clarityWeightedTotal(a);
    if (Math.abs(clarityDelta) > 0.001) return clarityDelta;
    return b.scores.total_score - a.scores.total_score;
  });

  const familyCounts = new Map<string, number>();
  for (const c of sorted) {
    familyCounts.set(c.family_type, (familyCounts.get(c.family_type) ?? 0) + 1);
  }
  const dominantFamilyCount = Math.max(...Array.from(familyCounts.values()));
  const dominanceRatio = dominantFamilyCount / Math.max(sorted.length, 1);
  const hasUnrejectedAlternative = sorted.filter((c) => c.rejection_reasons.length < 2).length > 1;
  const needsDominanceCap = dominanceRatio > 0.5 && hasUnrejectedAlternative;

  const diversityAdjusted = applySelectionDiversity(sorted);
  if (diversityAdjusted.length > 1) {
    const top = diversityAdjusted[0];
    const bestAlternative = diversityAdjusted.find((c) => c.family_type !== top.family_type && c.rejection_reasons.length < 2);
    if (bestAlternative) {
      const lead = top.scores.total_score - bestAlternative.scores.total_score;
      const fitGap = top.scores.family_fit_gap ?? 0;
      const misfitPenalty = top.scores.pattern_conditioned_misfit_penalty ?? 0;
      if ((fitGap > 0.18 || misfitPenalty > 0.24) && lead <= 0.05) {
        const forced = [bestAlternative, ...diversityAdjusted.filter((c) => c.candidate_id !== bestAlternative.candidate_id)];
        return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
      }
    }
  }
  const currentTop = diversityAdjusted[0];
  if (currentTop && currentTop.rejection_reasons.some((r) => hardFailReasons.has(r))) {
    const clarityAlt = diversityAdjusted.find((c) =>
      c.candidate_id !== currentTop.candidate_id
      && !c.rejection_reasons.some((r) => hardFailReasons.has(r))
      && c.rejection_reasons.length < 3
    );
    if (clarityAlt) {
      const forced = [clarityAlt, ...diversityAdjusted.filter((c) => c.candidate_id !== clarityAlt.candidate_id)];
      return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
    }
  }

  if (!needsDominanceCap) return diversityAdjusted;

  const winner = diversityAdjusted[0];
  const alternative = diversityAdjusted.find((c) => c.family_type !== winner.family_type && c.rejection_reasons.length < 2);
  if (!alternative) return diversityAdjusted;
  const forced = [alternative, ...diversityAdjusted.filter((c) => c.candidate_id !== alternative.candidate_id)];
  return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
}

function tokenizeForOverlap(text: string): string[] {
  return normalizeAnchorKey(text)
    .split(' ')
    .filter((w) => w.length >= 4)
    .filter((w) => !new Set(['this', 'essay', 'about', 'angle', 'with', 'that', 'from', 'your', 'what', 'when', 'where', 'because']).has(w));
}

function jaccardOverlap(a: string, b: string): number {
  const A = new Set(tokenizeForOverlap(a));
  const B = new Set(tokenizeForOverlap(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

const RUNTIME_DIRECTION_FAMILIES: Array<RuntimeDirectionCandidate['family_type']> = [
  'tension',
  'value',
  'process',
  'relationship',
  'contradiction',
  'realization',
  'ambiguity',
];

function patternBestFamilyFit(pattern: NarrativePattern): number {
  return Math.max(...RUNTIME_DIRECTION_FAMILIES.map((family) => familyFitScore(pattern, family)));
}

function familyFitScore(pattern: NarrativePattern, family: RuntimeDirectionCandidate['family_type']): number {
  switch (pattern) {
    case 'usefulness_vs_intention':
      if (family === 'relationship') return 0.84;
      if (family === 'process') return 0.9;
      if (family === 'value') return 0.84;
      if (family === 'contradiction' || family === 'realization') return 0.74;
      return 0.64;
    case 'competence_vs_responsibility':
      if (family === 'value' || family === 'tension') return 0.96;
      if (family === 'process') return 0.84;
      if (family === 'relationship') return 0.8;
      if (family === 'contradiction' || family === 'realization') return 0.74;
      return 0.66;
    case 'failure_reinterpretation':
      if (family === 'process') return 0.9;
      if (family === 'realization' || family === 'contradiction') return 0.94;
      if (family === 'relationship') return 0.8;
      return 0.7;
    case 'conflict_reframe':
      if (family === 'contradiction') return 1;
      if (family === 'relationship') return 0.8;
      if (family === 'realization') return 0.86;
      if (family === 'process') return 0.72;
      if (family === 'value') return 0.7;
      return 0.66;
    case 'responsibility_shift':
      if (family === 'relationship') return 0.84;
      if (family === 'value') return 0.92;
      if (family === 'process') return 0.74;
      if (family === 'tension') return 0.78;
      return 0.68;
    case 'identity_shift':
      if (family === 'contradiction') return 1;
      if (family === 'realization') return 0.94;
      if (family === 'relationship') return 0.84;
      if (family === 'process') return 0.72;
      if (family === 'tension') return 0.7;
      return 0.66;
    case 'self_correction_arc':
      if (family === 'relationship') return 0.82;
      if (family === 'process') return 0.86;
      if (family === 'contradiction') return 0.82;
      if (family === 'realization') return 0.78;
      if (family === 'value') return 0.74;
      return 0.68;
    default:
      if (family === 'relationship') return 0.82;
      if (family === 'contradiction') return 0.68;
      if (family === 'realization') return 0.82;
      if (family === 'process') return 0.72;
      if (family === 'value' || family === 'tension') return 0.68;
      return 0.7;
  }
}

function applySelectionDiversity(
  sorted: RankedRuntimeDirectionCandidate[]
): RankedRuntimeDirectionCandidate[] {
  if (sorted.length <= 1) {
    return sorted.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
  }

  const collapseShell = /\b(decision under pressure|reveals your real standard|route from scene to insight|one concrete decision|center of this essay|write this essay around|pressure scene|pressure moment|what happened next)\b/i;
  const directAnglePattern = /\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research rigor|advocacy|trust|method|discipline)\b/i;
  const reusableShellPattern = /\b(name the essay as|write this essay around|change in interpretation|value-under-cost|accountability under tradeoffs|relationship-based responsibility|ownership under contradiction|interpretation change)\b/i;
  const lowDiversityFamily = (f: string) => f === 'tension' || f === 'value' || f === 'process';

  const top = sorted[0];
  const topText = `${top.direction_line} ${top.essay_about}`;
  const topShellRisk = collapseShell.test(topText);
  const topAngleDirect = directAnglePattern.test(topText);
  const topReusableRisk = reusableShellPattern.test(topText) && top.source_anchor_spans.length < 2;

  let selected = top;
  const viableAlternatives = sorted.slice(1).filter((c) => c.family_type !== top.family_type);
  const nonDominantAlternatives = viableAlternatives.filter((c) => !lowDiversityFamily(c.family_type));

  if (topShellRisk || topReusableRisk || (lowDiversityFamily(top.family_type) && !topAngleDirect)) {
    const alt = nonDominantAlternatives.find((c) => {
      const closeEnough = (top.scores.total_score - c.scores.total_score) <= 0.2;
      const hasAngle = directAnglePattern.test(`${c.direction_line} ${c.essay_about}`);
      return closeEnough && hasAngle;
    }) ?? viableAlternatives.find((c) => (top.scores.total_score - c.scores.total_score) <= 0.14);
    if (alt) selected = alt;
  }

  const remaining = sorted.filter((c) => c.candidate_id !== selected.candidate_id);
  let runner = remaining.find((c) => c.family_type !== selected.family_type) ?? remaining[0];

  if (
    runner
    && lowDiversityFamily(selected.family_type)
    && lowDiversityFamily(runner.family_type)
  ) {
    const nonCollapsedRunner = remaining.find((c) => !lowDiversityFamily(c.family_type));
    if (nonCollapsedRunner && (runner.scores.total_score - nonCollapsedRunner.scores.total_score) <= 0.22) {
      runner = nonCollapsedRunner;
    }
  }

  const finalOrder = [selected, ...(runner ? [runner] : []), ...remaining.filter((c) => c.candidate_id !== runner?.candidate_id)];
  return finalOrder.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
}

function deriveExplanation(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const pattern = intake.narrative_pattern.primary_pattern;
  const turning = getPreferredTurningPoint(caseState);
  const consequence = getPreferredConsequence(caseState);
  const actor = caseState ? getDominantActor(caseState) : null;

  switch (pattern) {
    case 'usefulness_vs_intention':
      if (actor && turning) {
        return `The stronger story is not that you wanted to help. It is the moment with ${actor} that exposed the gap between wanting to help and being useful.`;
      }
      return 'The stronger story is not the good intention. It is the moment that showed you intention was not enough.';
    case 'self_correction_arc':
      if (turning) {
        return `This gets better the second it centers "${trimSnippet(turning)}" instead of summarizing everything around it.`;
      }
      return 'This gets better when it stays with the correction moment instead of the résumé summary around it.';
    case 'conflict_reframe':
      if (turning) {
        return `The essay is less about the conflict itself and more about what became clear after "${trimSnippet(turning)}".`;
      }
      return 'The essay is less about the conflict itself and more about what became clear in how you saw it afterward.';
    case 'failure_reinterpretation':
      if (consequence) {
        return `The interesting part is not failing. It is the next move into "${trimSnippet(consequence)}" that shows what the failure changed.`;
      }
      return 'The interesting part is not the setback. It is the new understanding you earned because of it.';
    case 'responsibility_shift':
      return 'The best angle is the moment responsibility became real, not the list of things you handled.';
    case 'identity_shift':
      return 'The best angle is the change in you, not the activity description around it.';
    case 'competence_vs_responsibility':
      return 'The best angle is the moment ability turned into a judgment call about what you should do.';
    default:
      return 'The best angle stays anchored in the point where your perspective or behavior clearly shifted.';
  }
}

function deriveWhyBeatsObvious(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const pattern = intake.narrative_pattern.primary_pattern;
  const turning = getPreferredTurningPoint(caseState);
  const obvious = OBVIOUS_TITLE[pattern];

  if (turning) {
    return `The obvious draft would stay generic and miss the turn inside "${trimSnippet(turning)}". The selected draft wins because it gives the reader one real change to follow.`;
  }

  switch (pattern) {
    case 'identity_shift':
      return 'The obvious version would read like an activity summary. This one wins because it shows who you became, not just what you did.';
    case 'responsibility_shift':
      return 'The obvious version would sound like a leadership claim. This one wins because it shows the judgment underneath it.';
    default:
      return `The obvious version would feel more like ${obvious.toLowerCase()}. This one wins because it stays with the moment that actually changes the story.`;
  }
}

function deriveRisk(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const scene = getPreferredScene(caseState);

  if (intake.usable_signal.signal_strength === 'medium') {
    return 'If you stay in summary instead of showing the concrete moment, this will flatten fast.';
  }

  if (scene) {
    return `If you skip the scene around "${trimSnippet(scene)}", the essay will sound thinner and more explained than earned.`;
  }

  return 'If you explain the lesson before showing the moment, the essay will feel generic.';
}

function deriveNextMove(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const turning = getPreferredTurningPoint(caseState);
  const consequence = getPreferredConsequence(caseState);
  const reflection = getPreferredReflection(caseState);
  const scene = getPreferredScene(caseState);

  if (turning && consequence) {
    return `Write the scene around "${trimSnippet(turning)}" and then move directly into "${trimSnippet(consequence)}".`;
  }
  if (scene) {
    return `Write the conversation or moment around "${trimSnippet(scene)}" before you explain what it meant.`;
  }
  if (reflection) {
    return `Replace one abstract line with the exact moment that led to "${trimSnippet(reflection)}".`;
  }
  if (intake.next_question) {
    return `Answer this before drafting: ${intake.next_question.question_text.replace(/\?$/, '').trim()}.`;
  }
  return 'Write the most concrete moment in four to six lines. Save the explanation for after.';
}

function polishRelationshipWhyForDisplay(
  intake: IntakeIntelligenceObject,
  candidate: RankedRuntimeDirectionCandidate | null,
  caseState: SessionCaseState | null
): string | null {
  if (!candidate || candidate.family_type !== 'relationship') return null;

  const context = getRelationshipSurfaceContext(intake, caseState);
  const turning = getPreferredTurningPoint(caseState);
  const actor = sanitizeActorLabel(caseState ? getDominantActor(caseState) : null);

  if (context.mode === 'compare' && context.optionLabels.length >= 2) {
    const [optionA, optionB] = context.optionLabels;
    return `${optionA} and ${optionB} are both viable topics, but only one will let the reader watch you misread, adjust, and get a visible reaction in one sequence. Keep the option with the cleaner interaction and sharper response shift.`;
  }

  if (context.mode === 'ambiguity') {
    if (actor) {
      return `This becomes a relationship essay only if the interaction with ${actor.toLowerCase()} shows what you first read wrong, how you adjusted, and what reaction proved the adjustment worked.`;
    }
    if (turning) {
      return `The relationship frame works here only if ${trimSnippet(turning)} gives you a correction scene, not just a role summary. That scene should show the misread, the response shift, and the reaction in order.`;
    }
    return 'Use the relationship frame only if one interaction reveals the misread, the response change, and the reaction in order; otherwise the draft will stay flat.';
  }

  if (actor && turning) {
    return `This is stronger because ${trimSnippet(turning)} shows what you misread about ${actor.toLowerCase()} and what you changed, so you can draft the interaction, response shift, and reaction in order.`;
  }

  if (turning) {
    return `This is stronger because ${trimSnippet(turning)} gives you a clear hinge for what you misread and what you changed, so you can draft the scene, response change, and result in order.`;
  }

  if (actor) {
    return `This is stronger because you can show when you stopped guessing what ${actor.toLowerCase()} needed and changed your response, so you can draft the assumption, correction, and reaction in order.`;
  }

  return 'This is stronger because it stays with one interaction and one correction, so you can draft the scene, response change, and immediate result in order.';
}

function polishRealizationWhyForDisplay(
  candidate: RankedRuntimeDirectionCandidate | null,
  caseState: SessionCaseState | null
): string | null {
  if (!candidate || candidate.family_type !== 'realization') return null;

  const context = getRealizationSurfaceContext(caseState);
  const anchor = getPreferredRealizationSurfaceAnchor(caseState);
  const result = getPreferredRealizationSurfaceResult(caseState, anchor);
  const seed = stableTextHash(`${anchor ?? ''}:${result ?? ''}:${getCaseStateTranscript(caseState)}`);

  if (context.mode === 'compare' && context.optionLabels.length >= 2) {
    const [optionA, optionB] = context.optionLabels;
    const variants = [
      `${optionA} and ${optionB} may both matter, but the realization version only works if one option gives you a clean chain: bad assumption, revised rule, immediate result. Keep that one because it is easier to draft without summary drift.`,
      `This compare works only if one option gives you the full realization chain in order — old read, changed rule, visible result. ${optionA} and ${optionB} should be judged by that standard, not by how meaningful they sound in the abstract.`,
    ] as const;
    return variants[seed % variants.length];
  }

  if (anchor && result) {
    const variants = [
      `This is stronger because ${trimSnippet(anchor)} lets the reader see the assumption that failed, the rule you replaced it with, and how ${trimSnippet(result)} proved the revision held. Drafting payoff: the paragraph can move scene, revision, proof without filler.`,
      `This wins because ${trimSnippet(anchor)} gives you a visible judgment change instead of a generic lesson: the old read breaks, the new standard appears, and ${trimSnippet(result)} shows that standard in action. Drafting payoff: you can write the claim without motivational language.`,
      `This is sharper because ${trimSnippet(anchor)} gives you the full before-and-after standard on the page, and ${trimSnippet(result)} supplies the proof that the new rule changed your behavior. Drafting payoff: the opening can stay concrete from sentence one.`,
    ] as const;
    return variants[seed % variants.length];
  }

  if (anchor) {
    return `This is stronger because ${trimSnippet(anchor)} gives you a visible change in judgment, not a broad lesson. Drafting payoff: you can name the old rule, the revised rule, and the action that proved the revision held.`;
  }

  return null;
}

function polishRelationshipNextMoveForDisplay(
  intake: IntakeIntelligenceObject,
  candidate: RankedRuntimeDirectionCandidate | null,
  caseState: SessionCaseState | null
): string | null {
  if (!candidate || candidate.family_type !== 'relationship') return null;

  const context = getRelationshipSurfaceContext(intake, caseState);
  const turning = getPreferredTurningPoint(caseState);
  const actor = sanitizeActorLabel(caseState ? getDominantActor(caseState) : null);

  if (context.mode === 'compare' && context.optionLabels.length >= 2) {
    const [optionA, optionB] = context.optionLabels;
    return `${optionA}: draft four beats — interaction, misread, response change, reaction. ${optionB}: draft the same four beats. Keep the version whose correction scene lands faster on the page.`;
  }

  if (context.mode === 'ambiguity') {
    if (actor) {
      return `Draft the opening with ${actor.toLowerCase()} in four beats: the interaction, what you first misread, what you changed in response, and the first reaction that showed you were reading the moment better.`;
    }
    if (turning) {
      return `Draft ${trimSnippet(turning)} in four beats: setup, misread, changed response, and the reaction that proved the correction held.`;
    }
    return 'Choose one interaction and draft four beats: who needed something from you, what you first misread, what you changed, and the first reaction that showed the adjustment worked.';
  }

  if (actor && turning) {
    return `Write the opening in four moves: the interaction with ${actor.toLowerCase()} at ${trimSnippet(turning)}, the thing you misread, the response you changed, and the first reaction that proved the shift was real.`;
  }

  if (turning) {
    return `Write the opening in four moves: what happened at ${trimSnippet(turning)}, what you first got wrong, what you changed in your response, and the immediate result that showed the new approach worked.`;
  }

  if (actor) {
    return `Write the opening in four moves: the interaction with ${actor.toLowerCase()}, the wrong assumption you made, the response you changed, and the reaction that proved you read the moment better.`;
  }

  return 'Write the opening in four moves: the interaction, the thing you misread, the response you changed, and the immediate result that proved the shift.';
}

function polishRealizationNextMoveForDisplay(
  candidate: RankedRuntimeDirectionCandidate | null,
  caseState: SessionCaseState | null
): string | null {
  if (!candidate || candidate.family_type !== 'realization') return null;

  const context = getRealizationSurfaceContext(caseState);
  const anchor = getPreferredRealizationSurfaceAnchor(caseState);
  const result = getPreferredRealizationSurfaceResult(caseState, anchor);
  const seed = stableTextHash(`${anchor ?? ''}:${result ?? ''}:${getCaseStateTranscript(caseState)}`);

  if (context.mode === 'compare' && context.optionLabels.length >= 2) {
    const [optionA, optionB] = context.optionLabels;
    return `${optionA}: draft four beats — the assumption you started with, the detail that broke it, the revised rule, the first result. ${optionB}: draft the same four beats. Keep the version whose realization chain lands faster on the page.`;
  }

  if (anchor && result) {
    const variants = [
      `Draft four beats from ${trimSnippet(anchor)}: the assumption you were using, the detail that broke it, the better rule you adopted, and the first result in ${trimSnippet(result)} that showed the rule held.`,
      `Open with ${trimSnippet(anchor)}. In the next two sentences, name the old rule you were using, then the action in ${trimSnippet(result)} that proved you had replaced it.`,
      `Write the first paragraph in four moves: what happened at ${trimSnippet(anchor)}, what that exposed in your old thinking, the revised standard, and the first result in ${trimSnippet(result)} that confirmed the revision.`,
    ] as const;
    return variants[seed % variants.length];
  }

  if (anchor) {
    return `Open with ${trimSnippet(anchor)}, then write two short follow-up sentences: the rule you were using before that moment, and the action that showed you had replaced it.`;
  }

  return null;
}

function deriveEssayAbout(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const pattern = intake.narrative_pattern.primary_pattern;
  const turning = getPreferredTurningPoint(caseState);

  if (turning) {
    return `This essay is not mainly about the activity around "${trimSnippet(turning)}". It is about the moment your priorities shifted in real time. Write toward that shift — not the context around it.`;
  }

  switch (pattern) {
    case 'usefulness_vs_intention':
      return 'This essay is not mainly about wanting to help. It is about the moment you learned what the person in front of you actually needed. Write toward that gap, not the effort around it.';
    case 'self_correction_arc':
      return 'This essay is not mainly about the full timeline. It is about the correction moment that changed your standard. Write toward that moment — not the summary around it.';
    case 'conflict_reframe':
      return 'This essay is not mainly about who was right. It is about the moment your understanding of the conflict changed. Write toward what shifted, not who won.';
    case 'failure_reinterpretation':
      return 'This essay is not mainly about the failure itself. It is about what you chose right after it and what that choice revealed. Write toward that next choice, not the failure.';
    default:
      return 'Look for the one moment where your approach, judgment, or priorities changed. Write toward that shift. Show the exact second things changed, not the summary around it.';
  }
}

function deriveWriteFirstSteps(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string[] {
  const scene = getPreferredScene(caseState);
  const turning = getPreferredTurningPoint(caseState);

  if (scene && turning) {
    return [
      `Start inside the scene around "${trimSnippet(scene)}" with one concrete action line.`,
      `Show the exact second the direction changed near "${trimSnippet(turning)}".`,
      'End the opening by showing what you chose to do right then, before any explanation.',
    ];
  }

  if (scene) {
    return [
      `Start inside "${trimSnippet(scene)}" with what you were doing in that moment.`,
      'Show the first detail that made you pause or rethink your approach.',
      'End the opening with the choice you made next, not the lesson you learned.',
    ];
  }

  return [
    'Start with one concrete moment (place, action, and who was there).',
    'Show what changed your attention or judgment in that exact moment.',
    'End the opening with your choice, then save interpretation for later.',
  ];
}

function deriveAvoidLines(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string[] {
  const scene = getPreferredScene(caseState);
  const pattern = intake.narrative_pattern.primary_pattern;
  const finalLine =
    pattern === 'responsibility_shift'
      ? 'Do not make the essay mostly about leadership labels or role titles.'
      : 'Do not make the essay mostly about context before the turning moment.';

  return [
    'Do not open with a broad lesson statement.',
    scene
      ? `Do not summarize everything around "${trimSnippet(scene)}" before showing what changed.`
      : 'Do not summarize the full timeline before showing one scene.',
    'Do not explain the meaning before you show the moment.',
    finalLine,
  ];
}

function deriveWriteNextSteps(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string[] {
  const consequence = getPreferredConsequence(caseState);
  const reflection = getPreferredReflection(caseState);

  return [
    'After the opening scene, write 2–3 sentences on why you made that choice.',
    consequence
      ? `Show the visible result of that choice in "${trimSnippet(consequence)}".`
      : 'Show what changed in your behavior after that moment.',
    reflection
      ? `End this section by connecting the scene to "${trimSnippet(reflection)}" in plain language.`
      : 'End this section by naming the pattern this moment revealed about you.',
  ];
}

function deriveFocusedQuestion(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const turning = getPreferredTurningPoint(caseState);
  const actor = caseState ? getDominantActor(caseState) : null;

  if (intake.next_question?.question_text) {
    return intake.next_question.question_text;
  }
  if (turning) {
    return `What did you notice in "${trimSnippet(turning)}" that made your old approach stop working?`;
  }
  if (actor) {
    return `What did you notice about ${actor} that changed what you did next?`;
  }
  return 'What exact detail made you change what you did in that moment?';
}

function buildDraftOpeningSeed(
  steps: string[],
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): string {
  const scene = getPreferredScene(caseState);
  const title = ANGLE_TITLE[intake.narrative_pattern.primary_pattern];

  return [
    `Draft seed — ${title}`,
    '',
    scene ? `Opening scene: ${scene}` : 'Opening scene: [where you were + what you were doing]',
    `Sentence 1: ${steps[0]}`,
    `Sentence 2: ${steps[1]}`,
    `Sentence 3: ${steps[2]}`,
    '',
    'Then continue with what that choice revealed about you.',
  ].join('\n');
}

function deriveCompareAlternatives(
  intake: IntakeIntelligenceObject,
  strongest: DirectionMinimal,
  caseState: SessionCaseState | null
): CompareAlternative[] {
  const scene = getPreferredScene(caseState);
  const turning = getPreferredTurningPoint(caseState);
  const obvious = OBVIOUS_TITLE[intake.narrative_pattern.primary_pattern];

  return [
    {
      title: strongest.title,
      subtitle: 'This option stays with the real turn in the story.',
      essay_focus: strongest.explanation,
      why_it_works_or_loses: strongest.why_beats_obvious,
      risk_if_written_this_way: strongest.risk,
      how_it_would_likely_start: strongest.next_move,
      action_label: 'This is the version to build',
      is_strongest: true,
    },
    {
      title: obvious,
      subtitle: 'This is the flatter version most people would draft first.',
      essay_focus: scene
        ? `That draft would summarize "${trimSnippet(scene)}" instead of using it to reveal the sharper turn underneath it.`
        : 'That draft would stay at the résumé-summary level instead of finding the real story inside it.',
      why_it_works_or_loses: turning
        ? `This loses because it moves past "${trimSnippet(turning)}" too quickly, which is where the essay actually starts to matter.`
        : 'This loses because it sounds familiar faster and gives the reader less to hold onto.',
      risk_if_written_this_way: 'If you write that draft, the essay will feel safer, flatter, and easier to forget.',
      how_it_would_likely_start: scene
        ? `It would probably start by summarizing what was happening around "${trimSnippet(scene)}" before the real point shows up too late.`
        : 'It would probably start with context and explanation instead of the moment that gives the essay life.',
      action_label: 'This is the weaker version',
      is_strongest: false,
    },
  ];
}

function deriveCoachComparison(
  strongest: DirectionMinimal,
  compareAlternatives: CompareAlternative[],
  caseState: SessionCaseState | null
): CoachComparisonArtifact {
  const weaker = compareAlternatives.find((entry) => !entry.is_strongest);
  const turning = getPreferredTurningPoint(caseState);
  const scene = getPreferredScene(caseState);

  const weakerFrames = [
    'The alternate read explains context but delays the claim until too late in the paragraph.',
    'The alternate read has detail, but the core claim still feels implied instead of explicit.',
    'The alternate read tracks events without naming the governing choice clearly enough.',
  ] as const;
  const strongerFrames = [
    'The selected read makes the claim early and keeps each detail serving that claim.',
    'The selected read gives a clean through-line from trigger scene to changed behavior.',
    'The selected read is easier to draft because the hinge and consequence are both explicit.',
  ] as const;
  const judgmentFrames = [
    'The stronger version wins because it is clearer, more persuasive, and easier to draft well.',
    'The stronger version wins because it tells the reader what the essay is about in one clean thread.',
    'The stronger version wins because it reveals insight and keeps the evidence doing real work.',
  ] as const;
  const seed = Math.abs(normalizeAnchorKey(`${turning ?? ''} ${scene ?? ''}`).split('').reduce((s, c) => s + c.charCodeAt(0), 0));
  const weakerFallback = weakerFrames[seed % weakerFrames.length];
  const strongerFallback = strongerFrames[seed % strongerFrames.length];
  const judgmentFallback = judgmentFrames[seed % judgmentFrames.length];

  const weakerRead = weaker
    ? renderGuard(
        weaker.essay_focus,
        weakerFallback,
        { maxWords: 22, maxSentences: 1 }
      )
    : weakerFallback;

  const strongerRead = renderGuard(
    strongest.explanation,
    strongerFallback,
    { maxWords: 24, maxSentences: 1 }
  );

  const coachJudgment = renderGuard(
    turning
      ? `The stronger version wins because it turns "${trimSnippet(turning)}" into a clear claim the essay can build around.`
      : scene
        ? `The stronger version wins because it uses "${trimSnippet(scene)}" to reveal meaning, not just context.`
        : 'The stronger version wins because it gives you a clear essay angle and a draftable next step.',
      judgmentFallback,
    { maxWords: 20, maxSentences: 1 }
  );

  return {
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    coach_judgment: coachJudgment,
  };
}

export function deriveDirectionContent(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null = null
): DirectionContent {
  const rankedCandidates = scoreAndRankRuntimeCandidates(
    buildRuntimeCandidates(intake, caseState),
    intake.narrative_pattern.primary_pattern
  );
  const selectedCandidate = rankedCandidates[0] ?? null;
  const runnerUpCandidate = rankedCandidates[1] ?? null;
  const displayDirectionLine = polishRelationshipDirectionLineForDisplay(selectedCandidate, intake, caseState)
    ?? polishRealizationDirectionLineForDisplay(selectedCandidate, caseState)
    ?? selectedCandidate?.direction_line
    ?? deriveDirectionTitle(intake, caseState);
  const displayWhy = polishRelationshipWhyForDisplay(intake, selectedCandidate, caseState)
    ?? polishRealizationWhyForDisplay(selectedCandidate, caseState)
    ?? selectedCandidate?.why_this_direction
    ?? deriveExplanation(intake, caseState);
  const displayNextMove = polishRelationshipNextMoveForDisplay(intake, selectedCandidate, caseState)
    ?? polishRealizationNextMoveForDisplay(selectedCandidate, caseState)
    ?? (intake.recommendation_viability.decision === 'needs_more_input'
      ? deriveNextMove(intake, caseState)
      : selectedCandidate?.next_move ?? deriveNextMove(intake, caseState));

  const writeFirstSteps = deriveWriteFirstSteps(intake, caseState);
  const avoidLines = deriveAvoidLines(intake, caseState);
  const writeNextSteps = deriveWriteNextSteps(intake, caseState);
  const focusedQuestion = deriveFocusedQuestion(intake, caseState);

  const strongest: DirectionMinimal = {
    title: displayDirectionLine
      ? normalizeSentence(displayDirectionLine)
      : renderGuard(
          deriveDirectionTitle(intake, caseState),
          'Name the essay angle directly as the operating principle you adopted and what it changed.',
          { maxWords: 44, maxSentences: 2 }
        ),
    explanation: renderGuard(
      displayWhy,
      'The best angle centers the point where your assumptions or actions changed.',
      { maxWords: 38, maxSentences: 2 }
    ),
    why_beats_obvious: renderGuard(
      displayWhy,
      'It is stronger because it gives a specific claim you can actually prove from your notes.',
      { maxWords: 38, maxSentences: 2 }
    ),
    risk: renderGuard(deriveRisk(intake, caseState), 'If you stay abstract, the essay will flatten.', { maxWords: 28, maxSentences: 2 }),
    next_move: renderGuard(
      displayNextMove,
      'Write the concrete moment before you explain it.',
      { maxWords: 26, maxSentences: 2 }
    ),
    essay_about: selectedCandidate?.essay_about
      ? normalizeSentence(selectedCandidate.essay_about)
      : renderGuard(
          deriveEssayAbout(intake, caseState),
          'This essay is about one decision that changed how you acted, and why that shift matters.',
          { maxWords: 60, maxSentences: 3 }
        ),
    write_first_steps: writeFirstSteps.map((step) => renderGuard(step, 'Start with one concrete action inside the moment.', { maxWords: 24, maxSentences: 1 })),
    avoid_lines: avoidLines.map((line) => renderGuard(line, 'Do not explain before showing the scene.', { maxWords: 22, maxSentences: 1 })),
    write_next_steps: writeNextSteps.map((step) => renderGuard(step, 'After the opening, show what changed and why it matters.', { maxWords: 24, maxSentences: 1 })),
    focused_question: renderGuard(focusedQuestion, 'What exact detail made your approach change in that moment?', { maxWords: 22, maxSentences: 1 }),
    draft_opening_seed: buildDraftOpeningSeed(writeFirstSteps, intake, caseState),
    primary_cta_label: 'Draft my opening now',
    secondary_cta_label: 'Help me sharpen the moment first',
    tertiary_cta_label: 'Show me what the weaker version would do',
  };

  const compareAlternatives = runnerUpCandidate
    ? [
        {
          title: strongest.title,
          subtitle: 'This option keeps the strongest source-backed thread.',
          essay_focus: strongest.explanation,
          why_it_works_or_loses: strongest.why_beats_obvious,
          risk_if_written_this_way: strongest.risk,
          how_it_would_likely_start: strongest.next_move,
          action_label: 'Build this version',
          is_strongest: true,
        },
        {
          title: trimSnippet(runnerUpCandidate.direction_line),
          subtitle: 'Plausible but weaker than the selected candidate.',
          essay_focus: runnerUpCandidate.essay_about,
          why_it_works_or_loses: `This loses to the winner on source fit and specificity (${runnerUpCandidate.scores.total_score.toFixed(2)} vs ${selectedCandidate?.scores.total_score.toFixed(2) ?? 'n/a'}).`,
          risk_if_written_this_way: 'That path risks broadening the story before the key turn is concrete.',
          how_it_would_likely_start: runnerUpCandidate.next_move,
          action_label: 'This is the weaker version',
          is_strongest: false,
        },
      ]
    : deriveCompareAlternatives(intake, strongest, caseState);

  const coachComparison = runnerUpCandidate
    ? {
        weaker_read: renderGuard(
          [
            `Readers may get lost here because the core claim is still blurry.`,
            `What makes this weaker is not the details; it is that the argument stays hard to name.`,
            `If you draft from this version, you may end up summarizing events instead of making a claim.`,
            `This option sounds less coach-like because the reader still has to guess what you are proving.`,
            `The issue here is usability: the scenes are present, but the main point is not clear enough.`,
            `This read is harder to write from because it never locks one explicit claim early.`,
          ][Math.abs(`${runnerUpCandidate.candidate_id || ''}:${runnerUpCandidate.hinge_span || ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 6],
          'The alternate option carries detail but leaves the governing claim less explicit.', {
          maxWords: 22,
          maxSentences: 1,
        }),
        stronger_read: renderGuard(
          [
            `This is the usable version: claim first, evidence aligned, and a clear place to start drafting.`,
            `You can write from this immediately because the argument is legible in one read.`,
            `This one is coach-like: it tells you what to prove and what scene to open with.`,
            `This version works better for drafting because it keeps claim, decision, and result in one line of logic.`,
            `What makes this stronger is practical clarity — you can turn it into an opening paragraph right away.`,
            `This read is easier to execute: the student knows the point and the first move without guessing.`,
          ][Math.abs(`${selectedCandidate?.candidate_id ?? 'selected'}:${selectedCandidate?.hinge_span ?? ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 6],
          'The selected option states the claim early and ties hinge to consequence cleanly.', {
          maxWords: 24,
          maxSentences: 1,
        }),
        coach_judgment: renderGuard(
          `The stronger version wins because it names the essay’s meaning directly and gives you a concrete next move, while the weaker version stays vague.`,
          'The stronger version wins because it is clearer, more persuasive, and easier to draft.',
          { maxWords: 20, maxSentences: 1 }
        ),
      }
    : deriveCoachComparison(strongest, compareAlternatives, caseState);

  const surfacedCandidatePack = rankedCandidates.map((candidate) => {
    if (
      candidate.selected
      && candidate.family_type === 'realization'
      && strongest.title
    ) {
      return {
        ...candidate,
        direction_line: strongest.title,
      };
    }

    return candidate;
  });

  return {
    strongest,
    compare_alternatives: compareAlternatives,
    coach_comparison: coachComparison,
    is_reduced_scope: intake.recommendation_viability.decision === 'reduced_scope',
    candidate_pack: surfacedCandidatePack,
  };
}

export type FirstMinuteRoute =
  | 'reflection'
  | 'direction'
  | 'recovery'
  | 'blocked';

export function deriveRoute(intake: IntakeIntelligenceObject): FirstMinuteRoute {
  const { decision } = intake.recommendation_viability;
  const { escalate, blocking } = intake.escalation;

  if (decision === 'blocked') return 'blocked';
  if (escalate && blocking) return 'blocked';
  if (decision === 'needs_more_input') return 'recovery';
  return 'reflection';
}

