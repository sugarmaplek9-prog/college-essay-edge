import type {
  BlankPageMode,
  BlankPagePostAnswerRoute,
  BlankPageQuestionFamily,
  IntakeIntelligenceObject,
  NarrativePattern,
  QuestionType,
} from '@/types/intake';

export const FM_CASE_STATE_KEY = 'fm_case_state';

export type CaseMissingDetail =
  | 'scene'
  | 'turning_point'
  | 'consequence'
  | 'reflection'
  | 'actor';

export interface CaseQuestionRecord {
  id: string;
  question_type: QuestionType;
  missing_detail: CaseMissingDetail;
  question_text: string;
  topic_key: string;
  asked_at: string;
  answered: boolean;
  answer_text: string | null;
}

export interface GeneratedSharpeningQuestion {
  id: string;
  question_type: QuestionType;
  missing_detail: CaseMissingDetail;
  question_text: string;
  topic_key: string;
}

export interface SessionCaseState {
  version: 'fm_case_state_v1';
  session_id: string;
  narrative_pattern: NarrativePattern;
  viability: IntakeIntelligenceObject['recommendation_viability']['decision'];
  raw_inputs: Array<{
    source: 'start' | 'sharpening' | 'continuation';
    text: string;
    added_at: string;
  }>;
  extracted: {
    actors: string[];
    scenes: string[];
    turning_points: string[];
    consequences: string[];
    reflections: string[];
  };
  missing_details: CaseMissingDetail[];
  prior_questions_asked: CaseQuestionRecord[];
  current_question: GeneratedSharpeningQuestion | null;
  blank_page_recovery: {
    blank_page_recovery_depth: number;
    blank_page_recovery_exhausted: boolean;
    blank_page_previous_mode: BlankPageMode | null;
    blank_page_previous_question_family: BlankPageQuestionFamily | null;
    blank_page_previous_route_after_answer: BlankPagePostAnswerRoute | null;
    post_answer_route: BlankPagePostAnswerRoute | null;
    post_answer_route_reason: string | null;
    recovered_signal_summary: string | null;
    blank_page_answer_history: Array<{
      asked_question: string;
      answer_text: string;
      route_after_answer: BlankPagePostAnswerRoute;
      route_reason: string;
      answered_at: string;
    }>;
  };
}

const COMMON_WORDS = new Set([
  'the', 'and', 'that', 'with', 'from', 'this', 'have', 'your', 'they', 'were',
  'when', 'what', 'where', 'after', 'about', 'there', 'their', 'would', 'could',
  'should', 'because', 'into', 'just', 'then', 'than', 'them', 'been', 'being',
  'some', 'more', 'much', 'like', 'really', 'very', 'still', 'also', 'only',
  'story', 'essay', 'moment', 'thing', 'stuff', 'notes', 'paragraph', 'rough',
  'good', 'great', 'work', 'help', 'helping', 'changed', 'change', 'realized',
]);

const PATTERN_PRIORITIES: Record<NarrativePattern, CaseMissingDetail[]> = {
  self_correction_arc: ['turning_point', 'scene', 'consequence', 'reflection', 'actor'],
  usefulness_vs_intention: ['turning_point', 'consequence', 'reflection', 'scene', 'actor'],
  identity_shift: ['turning_point', 'reflection', 'scene', 'consequence', 'actor'],
  responsibility_shift: ['turning_point', 'consequence', 'actor', 'reflection', 'scene'],
  failure_reinterpretation: ['turning_point', 'reflection', 'consequence', 'scene', 'actor'],
  conflict_reframe: ['scene', 'turning_point', 'actor', 'reflection', 'consequence'],
  competence_vs_responsibility: ['turning_point', 'reflection', 'consequence', 'scene', 'actor'],
  unknown: ['scene', 'turning_point', 'consequence', 'reflection', 'actor'],
};

export function normalizeStudentText(rawInput: string): string {
  return rawInput
    .replace(/\s+/g, ' ')
    .replace(/\bi\b/g, 'I')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/([,.;!?])(\S)/g, '$1 $2')
    .trim();
}

export function createSessionCaseState(
  rawInput: string,
  intelligence: IntakeIntelligenceObject
): SessionCaseState {
  const normalized = normalizeStudentText(rawInput);
  const extracted = extractCaseSignals(normalized);

  const baseState: SessionCaseState = {
    version: 'fm_case_state_v1',
    session_id: intelligence.intake_session_id,
    narrative_pattern: intelligence.narrative_pattern.primary_pattern,
    viability: intelligence.recommendation_viability.decision,
    raw_inputs: [{ source: 'start', text: normalized, added_at: new Date().toISOString() }],
    extracted,
    missing_details: [],
    prior_questions_asked: [],
    current_question: null,
    blank_page_recovery: {
      blank_page_recovery_depth: 0,
      blank_page_recovery_exhausted: false,
      blank_page_previous_mode: null,
      blank_page_previous_question_family: null,
      blank_page_previous_route_after_answer: null,
      post_answer_route: null,
      post_answer_route_reason: null,
      recovered_signal_summary: null,
      blank_page_answer_history: [],
    },
  };

  const missing = deriveMissingDetails(baseState);
  const question = generateSharpeningQuestion({ ...baseState, missing_details: missing });

  return {
    ...baseState,
    missing_details: missing,
    current_question: question,
  };
}

export function refreshSessionCaseState(state: SessionCaseState): SessionCaseState {
  const combined = buildCaseTranscript(state);
  const extracted = extractCaseSignals(combined);
  const nextState = {
    ...state,
    extracted,
  };
  const missing = deriveMissingDetails(nextState);
  const question = generateSharpeningQuestion({ ...nextState, missing_details: missing });
  return {
    ...nextState,
    missing_details: missing,
    current_question: question,
  };
}

export function applySharpeningAnswer(
  state: SessionCaseState,
  answer: string
): SessionCaseState {
  const normalized = normalizeStudentText(answer);
  const questions = [...state.prior_questions_asked];
  const current = state.current_question;

  if (current) {
    questions.push({
      id: current.id,
      question_type: current.question_type,
      missing_detail: current.missing_detail,
      question_text: current.question_text,
      topic_key: current.topic_key,
      asked_at: new Date().toISOString(),
      answered: true,
      answer_text: normalized,
    });
  }

  return refreshSessionCaseState({
    ...state,
    raw_inputs: [...state.raw_inputs, { source: 'sharpening', text: normalized, added_at: new Date().toISOString() }],
    prior_questions_asked: questions,
    current_question: null,
  });
}

export function appendContinuationNotes(
  state: SessionCaseState,
  notes: string
): SessionCaseState {
  const normalized = normalizeStudentText(notes);
  if (!normalized) return refreshSessionCaseState(state);

  return refreshSessionCaseState({
    ...state,
    raw_inputs: [
      ...state.raw_inputs,
      {
        source: 'continuation',
        text: normalized,
        added_at: new Date().toISOString(),
      },
    ],
  });
}

export function syncCaseStateWithIntelligence(
  state: SessionCaseState,
  intelligence: IntakeIntelligenceObject
): SessionCaseState {
  return refreshSessionCaseState({
    ...state,
    session_id: intelligence.intake_session_id,
    narrative_pattern: intelligence.narrative_pattern.primary_pattern,
    viability: intelligence.recommendation_viability.decision,
  });
}

export function markQuestionSkipped(state: SessionCaseState): SessionCaseState {
  const current = state.current_question;
  if (!current) return state;

  return refreshSessionCaseState({
    ...state,
    prior_questions_asked: [
      ...state.prior_questions_asked,
      {
        id: current.id,
        question_type: current.question_type,
        missing_detail: current.missing_detail,
        question_text: current.question_text,
        topic_key: current.topic_key,
        asked_at: new Date().toISOString(),
        answered: false,
        answer_text: null,
      },
    ],
    current_question: null,
  });
}

export function shouldRouteToRecovery(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): boolean {
  if (!state) {
    return intelligence.recommendation_viability.decision === 'needs_more_input';
  }

  if (intelligence.recommendation_viability.decision === 'blocked') {
    return false;
  }

  return Boolean(state.current_question) && state.missing_details.length > 0;
}

export function shouldGateToClarification(
  intelligence: IntakeIntelligenceObject,
  state: SessionCaseState | null
): boolean {
  if (intelligence.recommendation_viability.decision === 'blocked') return false;

  const weakSignal = intelligence.usable_signal.signal_strength !== 'high';
  const lowPatternConfidence = intelligence.narrative_pattern.confidence === 'low';
  const weakSceneEvidence = intelligence.authorship_signal.student_scene_evidence !== 'present';
  const elevatedContamination = intelligence.authorship_signal.contamination_risk === 'high';

  const missingScene = !state || state.extracted.scenes.length === 0;
  const missingTurn = !state || state.extracted.turning_points.length === 0;
  const missingConsequence = !state || state.extracted.consequences.length === 0;
  const structuralGapCount = [missingScene, missingTurn, missingConsequence].filter(Boolean).length;

  return (
    weakSignal ||
    lowPatternConfidence ||
    weakSceneEvidence ||
    elevatedContamination ||
    structuralGapCount >= 2
  );
}

export function buildCaseTranscript(state: SessionCaseState): string {
  return state.raw_inputs.map((item) => item.text).join(' ');
}

export function mergeContinuationText(
  existingText: string,
  submittedText: string
): { mergedText: string; appendedText: string | null } {
  const existing = normalizeStudentText(existingText);
  const submitted = normalizeStudentText(submittedText);

  if (!existing) {
    return {
      mergedText: submitted,
      appendedText: submitted || null,
    };
  }

  if (!submitted || submitted === existing) {
    return {
      mergedText: existing,
      appendedText: null,
    };
  }

  if (submitted.startsWith(existing)) {
    const appended = submitted.slice(existing.length).trim();
    return {
      mergedText: submitted,
      appendedText: appended || null,
    };
  }

  if (submitted.includes(existing)) {
    const appended = submitted.replace(existing, ' ').replace(/\s+/g, ' ').trim();
    return {
      mergedText: submitted,
      appendedText: appended || null,
    };
  }

  if (existing.includes(submitted)) {
    return {
      mergedText: existing,
      appendedText: null,
    };
  }

  return {
    mergedText: `${existing} ${submitted}`.trim(),
    appendedText: submitted,
  };
}

export function getDominantScene(state: SessionCaseState): string | null {
  return state.extracted.scenes[0] ?? null;
}

export function getDominantTurningPoint(state: SessionCaseState): string | null {
  return state.extracted.turning_points[0] ?? null;
}

export function getDominantConsequence(state: SessionCaseState): string | null {
  return state.extracted.consequences[0] ?? null;
}

export function getDominantReflection(state: SessionCaseState): string | null {
  return state.extracted.reflections[0] ?? null;
}

export function getDominantActor(state: SessionCaseState): string | null {
  return state.extracted.actors.find((actor) => !/^I$/i.test(actor)) ?? state.extracted.actors[0] ?? null;
}

export function getQuestionTextFromState(state: SessionCaseState | null): string | null {
  return state?.current_question?.question_text ?? null;
}

export function ensureBlankPageRecoveryInitialized(
  state: SessionCaseState,
  mode: BlankPageMode,
  questionFamily: BlankPageQuestionFamily | null
): SessionCaseState {
  const nextDepth = Math.max(1, state.blank_page_recovery.blank_page_recovery_depth || 0);

  return {
    ...state,
    blank_page_recovery: {
      ...state.blank_page_recovery,
      blank_page_recovery_depth: nextDepth,
      blank_page_previous_mode: mode,
      blank_page_previous_question_family: questionFamily,
    },
  };
}

function extractCaseSignals(text: string) {
  const sentences = splitIntoSentences(text);
  const actors = extractActors(text);
  const scenes = uniqueSentences(sentences.filter((sentence) => /\b(when|after|during|night|summer|day|conversation|room|team|competition|hospital|coach|teacher|nurse|friend|because)\b/i.test(sentence) || sentence.split(/\s+/).length >= 12));
  const turning_points = uniqueSentences(sentences.filter((sentence) => /\b(realized|changed|learned|understood|when|but|until|told me|pulled me aside|stopped|started)\b/i.test(sentence)));
  const consequences = uniqueSentences(sentences.filter((sentence) => /\b(after that|afterward|since then|so I|I started|I stopped|I changed|led to|which meant|the next time|ever since)\b/i.test(sentence)));
  const reflections = uniqueSentences(sentences.filter((sentence) => /\b(I learned|I realized|I understood|I now|I see|changed how I|made me realize|showed me)\b/i.test(sentence)));

  return {
    actors,
    scenes: scenes.length > 0 ? scenes : sentences.slice(0, 1),
    turning_points,
    consequences,
    reflections,
  };
}

function deriveMissingDetails(state: SessionCaseState): CaseMissingDetail[] {
  const missing = new Set<CaseMissingDetail>();
  const { extracted } = state;

  if (extracted.scenes.length === 0) missing.add('scene');
  if (extracted.turning_points.length === 0) missing.add('turning_point');
  if (extracted.consequences.length === 0) missing.add('consequence');
  if (extracted.reflections.length === 0) missing.add('reflection');
  if (extracted.actors.length <= 1) missing.add('actor');

  return PATTERN_PRIORITIES[state.narrative_pattern].filter((detail) => missing.has(detail));
}

function generateSharpeningQuestion(state: SessionCaseState): GeneratedSharpeningQuestion | null {
  for (const detail of state.missing_details) {
    const question = buildQuestionForDetail(state, detail);
    if (!question) continue;
    if (isSemanticallyDuplicate(question, state.prior_questions_asked)) continue;
    return question;
  }
  return null;
}

function buildQuestionForDetail(
  state: SessionCaseState,
  detail: CaseMissingDetail
): GeneratedSharpeningQuestion | null {
  const actor = getDominantActor(state);
  const scene = getDominantScene(state);
  const turning = getDominantTurningPoint(state);
  const topic = deriveTopicKey(state);

  if (detail === 'scene') {
    return {
      id: crypto.randomUUID(),
      question_type: 'scene_detail',
      missing_detail: detail,
      topic_key: `${detail}:${topic}`,
      question_text: actor
        ? `What exactly happened in the moment with ${actor} — what was said or done first, and what did you notice right away?`
        : `What exactly happened in the most important moment here — where were you, what was said or done, and what did you notice first?`,
    };
  }

  if (detail === 'turning_point') {
    return {
      id: crypto.randomUUID(),
      question_type: 'turning_point',
      missing_detail: detail,
      topic_key: `${detail}:${topic}`,
      question_text: scene
        ? `In that moment — "${trimSnippet(scene)}" — what made you realize the story meant something different than you first thought?`
        : `What was the exact moment this stopped being a simple activity or experience and became a real turning point for you?`,
    };
  }

  if (detail === 'consequence') {
    return {
      id: crypto.randomUUID(),
      question_type: 'consequence',
      missing_detail: detail,
      topic_key: `${detail}:${topic}`,
      question_text: turning
        ? `After "${trimSnippet(turning)}", what did you do differently the next time that proves the moment actually changed you?`
        : `What changed in what you did next that proves this moment mattered beyond the moment itself?`,
    };
  }

  if (detail === 'reflection') {
    return {
      id: crypto.randomUUID(),
      question_type: 'motivation',
      missing_detail: detail,
      topic_key: `${detail}:${topic}`,
      question_text: `What did this change in how you judge yourself, your role, or what counts as doing this well now?`,
    };
  }

  if (detail === 'actor') {
    return {
      id: crypto.randomUUID(),
      question_type: 'relationship',
      missing_detail: detail,
      topic_key: `${detail}:${topic}`,
      question_text: `Who else mattered in this moment, and what did their reaction make you see that you had missed before?`,
    };
  }

  return null;
}

function isSemanticallyDuplicate(
  question: GeneratedSharpeningQuestion,
  prior: CaseQuestionRecord[]
): boolean {
  const nextTokens = tokenSet(question.question_text);

  return prior.some((item) => {
    if (item.topic_key === question.topic_key) return true;
    if (item.missing_detail === question.missing_detail) {
      const priorTokens = tokenSet(item.question_text);
      const overlap = [...nextTokens].filter((token) => priorTokens.has(token)).length;
      const baseline = Math.max(1, Math.min(nextTokens.size, priorTokens.size));
      return overlap / baseline >= 0.65;
    }
    return false;
  });
}

function extractActors(text: string): string[] {
  const matches = text.match(/\b(my\s+[a-z]+|the\s+[a-z]+|a\s+[a-z]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) ?? [];
  return [...new Set(matches
    .map((match) => match.trim())
    .filter((match) => match.length > 1)
    .filter((match) => !COMMON_WORDS.has(match.toLowerCase()))
  )].slice(0, 6);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function uniqueSentences(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()))].slice(0, 4);
}

function tokenSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 3)
      .filter((token) => !COMMON_WORDS.has(token))
  );
}

function deriveTopicKey(state: SessionCaseState): string {
  const transcript = buildCaseTranscript(state).toLowerCase();
  const weighted = transcript
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 3)
    .filter((token) => !COMMON_WORDS.has(token));

  const counts = new Map<string, number>();
  for (const token of weighted) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return top?.[0] ?? state.narrative_pattern;
}

function trimSnippet(text: string): string {
  return text.length > 90 ? `${text.slice(0, 87).trim()}…` : text;
}