import type { SessionCaseState } from '@/lib/fm/case-state';
import { getDominantScene, getDominantTurningPoint } from '@/lib/fm/case-state';
import type { CompareAlternative, DirectionMinimal } from '@/lib/fm/direction';
import type { IntakeIntelligenceObject } from '@/types/intake';

export type CoachInterventionType = 'diagnose' | 'reject' | 'ask' | 'build' | 'critique' | 'advance';
export type CoachStudentState = 'blank_page_student' | 'achievement_clutter_student' | 'sensitive_topic_hesitation_student' | 'prestige_optimizing_student' | 'nearly_there_student' | 'default_student';
export type CoachEscalationLevel = 'low' | 'medium' | 'high';
export type GenericnessRisk = 'low' | 'medium' | 'high';
export type QuestionGoal = 'none' | 'concrete_moment' | 'turning_point' | 'choice' | 'revealing_detail' | 'good_vs_generic_distinction';
export type CorrectionTarget = 'none' | 'resume_language' | 'meaning_too_early' | 'scene_missing' | 'weak_specificity' | 'generic_helping_language' | 'weak_direction_fit';
export type NextMoveType = 'start_opening' | 'answer_question' | 'revise_for_specificity' | 'write_next_paragraph' | 'continue_draft';
export type CoachConfidence = 'low' | 'medium' | 'high';
export type CoachStage = 'direction' | 'opening' | 'question' | 'compare';

export interface CoachBehaviorSignals {
  coach_intervention_type: CoachInterventionType[];
  coach_student_state: CoachStudentState;
  coach_escalation_level: CoachEscalationLevel;
  genericness_risk: GenericnessRisk;
  needs_question: boolean;
  question_goal: QuestionGoal;
  correction_target: CorrectionTarget;
  next_move_type: NextMoveType;
  coach_confidence: CoachConfidence;
}

export interface CoachResponse {
  diagnosis: string;
  instruction: string;
  support?: string;
  reaction?: string;
}

export interface CoachMemoryState {
  current_stage: CoachStage;
  chosen_direction: string;
  weak_alternative: string | null;
  last_student_answer: string | null;
  unresolved_ambiguity: string | null;
  genericness_flags: string[];
  last_correction_made: string | null;
}

export interface DeriveCoachBehaviorInput {
  stage: CoachStage;
  intake: IntakeIntelligenceObject;
  strongest: DirectionMinimal;
  caseState: SessionCaseState | null;
  draftText?: string;
  lastStudentAnswer?: string | null;
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
}

function normalizeText(input: string | null | undefined): string {
  return (input ?? '').trim().toLowerCase();
}

function deriveStudentState(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null,
  draftText: string
): CoachStudentState {
  const raw = normalizeText(draftText || caseState?.raw_inputs.map((entry) => entry.text).join(' ') || '');

  if (intake.recommendation_viability.decision === 'needs_more_input' || intake.usable_signal.signal_strength === 'low') {
    return 'blank_page_student';
  }

  if (/(award|captain|president|founded|leader|leadership|internship|nonprofit|volunteer hours|resume)/.test(raw)) {
    return 'achievement_clutter_student';
  }

  if (/(ivy|prestigious|impressive|top school|admissions officer|stand out|elite)/.test(raw)) {
    return 'prestige_optimizing_student';
  }

  if (/(death|grief|hospital bed|abuse|trauma|diagnosis|funeral|depression)/.test(raw)) {
    return 'sensitive_topic_hesitation_student';
  }

  if (caseState && getDominantScene(caseState) && getDominantTurningPoint(caseState)) {
    return 'nearly_there_student';
  }

  return 'default_student';
}

function deriveGenericnessRisk(
  stage: CoachStage,
  strongest: DirectionMinimal,
  caseState: SessionCaseState | null,
  draftText: string
): GenericnessRisk {
  const raw = normalizeText(draftText);
  const dominantScene = caseState ? getDominantScene(caseState) : null;
  const genericSignals = countMatches(raw, [
    /i learned/,
    /this taught me/,
    /made me realize/,
    /leadership/,
    /service/,
    /helping others/,
    /passion/,
    /community/,
    /resilience/,
  ]);

  if (stage === 'opening' && genericSignals >= 2) return 'high';
  if (stage === 'opening' && raw.length > 0 && !dominantScene) return 'high';
  if (stage === 'question') return 'medium';
  if (strongest.avoid_lines.some((line) => /broad lesson|full timeline|meaning before/i.test(line))) {
    return genericSignals > 0 ? 'medium' : 'low';
  }

  return genericSignals > 0 ? 'medium' : 'low';
}

function deriveCorrectionTarget(genericnessRisk: GenericnessRisk, draftText: string, caseState: SessionCaseState | null): CorrectionTarget {
  const raw = normalizeText(draftText);
  const dominantScene = caseState ? getDominantScene(caseState) : null;

  if (/(leadership|captain|president|award|resume)/.test(raw)) return 'resume_language';
  if (/(i learned|this taught me|made me realize)/.test(raw)) return 'meaning_too_early';
  if (!dominantScene || /thing|stuff|experience|journey/.test(raw)) return 'scene_missing';
  if (/(helping|care|service)/.test(raw) && genericnessRisk !== 'low') return 'generic_helping_language';
  if (genericnessRisk !== 'low') return 'weak_specificity';
  return 'none';
}

function deriveQuestionGoal(caseState: SessionCaseState | null, correctionTarget: CorrectionTarget): QuestionGoal {
  if (correctionTarget === 'scene_missing') return 'concrete_moment';
  if (correctionTarget === 'meaning_too_early') return 'choice';
  if (correctionTarget === 'generic_helping_language') return 'good_vs_generic_distinction';
  const firstMissing = caseState?.missing_details[0];
  if (firstMissing === 'turning_point') return 'turning_point';
  if (firstMissing === 'actor' || firstMissing === 'scene') return 'revealing_detail';
  return 'none';
}

function deriveInterventionTypes(stage: CoachStage, escalation: CoachEscalationLevel, needsQuestion: boolean): CoachInterventionType[] {
  if (stage === 'question') return ['diagnose', 'ask'];
  if (stage === 'compare') return escalation === 'high' ? ['diagnose', 'reject', 'critique', 'advance'] : ['diagnose', 'critique', 'advance'];
  if (escalation === 'high') return needsQuestion ? ['reject', 'critique', 'ask'] : ['reject', 'critique', 'advance'];
  if (escalation === 'medium') return needsQuestion ? ['diagnose', 'critique', 'ask'] : ['diagnose', 'build', 'advance'];
  return ['diagnose', 'build', 'advance'];
}

export function deriveCoachBehaviorSignals(input: DeriveCoachBehaviorInput): CoachBehaviorSignals {
  const draftText = input.draftText ?? '';
  const coach_student_state = deriveStudentState(input.intake, input.caseState, draftText);
  const genericness_risk = deriveGenericnessRisk(input.stage, input.strongest, input.caseState, draftText);
  const correction_target = deriveCorrectionTarget(genericness_risk, draftText, input.caseState);
  const needs_question = input.stage === 'question' || genericness_risk === 'high';
  const question_goal = needs_question ? deriveQuestionGoal(input.caseState, correction_target) : 'none';

  let coach_escalation_level: CoachEscalationLevel = 'low';
  if (genericness_risk === 'high' || coach_student_state === 'prestige_optimizing_student' || coach_student_state === 'achievement_clutter_student') {
    coach_escalation_level = 'high';
  } else if (needs_question || genericness_risk === 'medium' || coach_student_state === 'blank_page_student') {
    coach_escalation_level = 'medium';
  }

  return {
    coach_intervention_type: deriveInterventionTypes(input.stage, coach_escalation_level, needs_question),
    coach_student_state,
    coach_escalation_level,
    genericness_risk,
    needs_question,
    question_goal,
    correction_target,
    next_move_type: input.stage === 'opening'
      ? needs_question ? 'revise_for_specificity' : 'write_next_paragraph'
      : input.stage === 'question'
        ? 'answer_question'
        : input.stage === 'compare'
          ? 'continue_draft'
        : 'start_opening',
    coach_confidence: input.intake.narrative_pattern.confidence === 'high' ? 'high' : input.intake.narrative_pattern.confidence === 'medium' ? 'medium' : 'low',
  };
}

export interface CompareCoachNarrative {
  diagnosis: string;
  mistake: string;
  strongerMove: string;
}

export function buildCompareCoachNarrative(
  alternative: CompareAlternative,
  strongerMove: string
): CompareCoachNarrative {
  if (alternative.is_strongest) {
    return {
      diagnosis: 'The stronger version works because it stays on the real turning point.',
      mistake: 'The weaker version fails because it reaches the lesson before it earns the moment.',
      strongerMove: strongerMove || 'Go back and keep the moment, not the message.',
    };
  }

  return {
    diagnosis: 'The weaker version fails because it sounds broad before it sounds lived.',
    mistake: 'The real mistake is broad framing language instead of one real scene.',
    strongerMove: 'The stronger version works because it starts from the real choice. Go back and keep the moment, not the message.',
  };
}

function buildReactionLine(lastStudentAnswer?: string | null): string | undefined {
  const value = normalizeText(lastStudentAnswer);
  if (!value) return undefined;

  if (/(i learned|this taught me|made me realize)/.test(value)) {
    return 'You are starting with the lesson. That is weaker because it explains before the scene.';
  }
  if (/(leadership|captain|president|award|resume)/.test(value)) {
    return 'This sounds like résumé language right now. Keep the real moment, not the role label.';
  }
  if (/(helping|care|service|community)/.test(value)) {
    return 'Do not turn this into a caring-about-people essay. Use the exact moment that tested your approach.';
  }

  return 'That detail belongs in the opening. Keep the same center, make it more specific.';
}

export function buildCoachResponse(
  signals: CoachBehaviorSignals,
  strongest: DirectionMinimal,
  caseState: SessionCaseState | null,
  lastStudentAnswer?: string | null
): CoachResponse {
  const scene = caseState ? getDominantScene(caseState) : null;
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const reaction = buildReactionLine(lastStudentAnswer);

  switch (signals.correction_target) {
    case 'resume_language':
      return {
        diagnosis: 'This is still too broad. It is drifting into résumé language.',
        instruction: 'Cut the role labels. Start with the exact moment where your approach changed.',
        support: 'We already know the direction. Now we need the scene.',
        reaction,
      };
    case 'meaning_too_early':
      return {
        diagnosis: 'You are explaining too early.',
        instruction: 'Keep the first concrete line. Cut the early lesson line. Show the exact interruption in the scene first.',
        support: turning ? `The opening should pivot at "${turning}" before the reflection shows up.` : 'The opening should pivot inside the scene before the reflection shows up.',
        reaction,
      };
    case 'scene_missing':
      return {
        diagnosis: 'That is not the real center yet. You are naming an idea, not showing a moment.',
        instruction: 'Go back and write what you were doing just before things changed, then show the exact shift.',
        support: scene ? `Start in "${scene}" and let the meaning come later.` : 'Start in the scene and let the meaning come later.',
        reaction,
      };
    case 'generic_helping_language':
      return {
        diagnosis: 'This version is weaker because it sounds like a broad helping essay.',
        instruction: 'Name the exact choice that proved what useful actually meant here.',
        support: `Do not summarize the whole experience. ${strongest.essay_about}`,
        reaction,
      };
    case 'weak_specificity':
      return {
        diagnosis: 'That is closer, but it is still too broad.',
        instruction: 'Keep the material and replace one summary line with the exact detail that makes the scene real.',
        support: 'Do not change the essay. Tighten the moment.',
        reaction,
      };
    default:
      return {
        diagnosis: signals.next_move_type === 'write_next_paragraph'
          ? 'Right material. Now push past the setup into what that choice changed.'
          : 'That is usable. Now start with the moment, not the meaning.',
        instruction: signals.next_move_type === 'write_next_paragraph'
          ? strongest.write_next_steps[0]
          : strongest.write_first_steps[0],
        reaction,
      };
  }
}

export function buildCoachMemoryState(
  input: DeriveCoachBehaviorInput,
  signals: CoachBehaviorSignals,
  weakAlternative: string | null
): CoachMemoryState {
  return {
    current_stage: input.stage,
    chosen_direction: input.strongest.title,
    weak_alternative: weakAlternative,
    last_student_answer: input.lastStudentAnswer ?? null,
    unresolved_ambiguity: signals.needs_question ? input.strongest.focused_question : null,
    genericness_flags: signals.genericness_risk === 'high'
      ? [signals.correction_target]
      : signals.genericness_risk === 'medium'
        ? [signals.correction_target].filter((value) => value !== 'none')
        : [],
    last_correction_made: signals.correction_target === 'none' ? null : signals.correction_target,
  };
}