'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';
import {
  applySharpeningAnswer,
  buildCaseTranscript,
  ensureBlankPageRecoveryInitialized,
  FM_CASE_STATE_KEY,
  getQuestionTextFromState,
  markQuestionSkipped,
  refreshSessionCaseState,
  shouldGateToClarification,
  syncCaseStateWithIntelligence,
  type CaseQuestionRecord,
  type SessionCaseState,
} from '@/lib/fm/case-state';
import {
  FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY,
  FM_CLARIFICATION_PAYLOAD_KEY,
  getCoachMemory,
  FM_INTELLIGENCE_KEY,
  FM_PRODUCT_MODE_KEY,
  getStoredIntelligence,
  persistSessionResponse,
  setCoachMemory,
} from '@/lib/fm/clientSession';
import { deriveCoachBehaviorSignals, buildCoachMemoryState, type CoachMemoryState } from '@/lib/fm/coachBehavior';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { evaluateClarificationAnswer } from '@/lib/fm/answer-sufficiency';
import { extractNarrativeSignals } from '@/lib/fm/narrative-signals';
import { detectMissingSignal, type MissingSignalTarget } from '@/lib/fm/missing-signal-detector';
import { generateClarificationQuestion } from '@/lib/fm/clarification-question';
import { isDuplicateQuestion } from '@/lib/fm/questionDeduper';
import { buildBlankPageViewModel, toSafeBlankPagePayload } from '@/lib/fm/blankPageViewModel';
import { handleBlankPageAnswer, mapApiResponseByPostAnswerRoute } from '@/lib/fm/handleBlankPageAnswer';
import {
  emitBlankPageAbandon,
  emitBlankPageAnswerSubmitted,
  emitBlankPageContinue,
  emitBlankPageQuestionRendered,
  emitBlankPageRouteTransition,
} from '@/lib/telemetry/blankPageEvents';
import { BlankPageIntakeView } from '@/components/firstMinute/BlankPageIntakeView';
import { InteriorPageShell } from '@/components/firstMinute/InteriorFlowSystem';
import type {
  BlankPageIntakePayload,
  ClarificationPayload,
  IntakeIntelligenceObject,
  ProductMode,
} from '@/types/intake';
import type { SessionApiResponse } from '@/types/intake';

const FALLBACK_CLARIFICATION_QUESTION = 'What exact detail shows the moment your approach changed?';

export default function QuestionPage() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [caseState, setCaseState] = useState<SessionCaseState | null>(null);
  const [intelligence, setIntelligence] = useState<IntakeIntelligenceObject | null>(null);
  const [gateMessage, setGateMessage] = useState<string>('');
  const [productMode, setProductMode] = useState<ProductMode>('clarification');
  const [clarificationPayload, setClarificationPayload] = useState<ClarificationPayload | null>(null);
  const [blankPagePayload, setBlankPagePayload] = useState<BlankPageIntakePayload | null>(null);
  const [blankPageSubmitError, setBlankPageSubmitError] = useState<string | null>(null);
  const [coachMemory, setCoachMemoryState] = useState<CoachMemoryState | null>(null);

  function resolveQuestionText(value: string | null | undefined): string {
    const normalized = (value ?? '').trim();
    return normalized.length > 6 ? normalized : FALLBACK_CLARIFICATION_QUESTION;
  }

  useEffect(() => {
    const raw = sessionStorage.getItem(FM_INTELLIGENCE_KEY);
    if (!raw) {
      router.replace('/start');
      return;
    }

    const intelligence: IntakeIntelligenceObject = JSON.parse(raw);
    setIntelligence(intelligence);
    setCoachMemoryState(getCoachMemory<CoachMemoryState>());
    const storedState = sessionStorage.getItem(FM_CASE_STATE_KEY);
    const parsedState: SessionCaseState | null = storedState ? JSON.parse(storedState) : null;
    const nextState = parsedState ? refreshSessionCaseState(parsedState) : null;

    const mode = (sessionStorage.getItem(FM_PRODUCT_MODE_KEY) as ProductMode | null) ?? 'clarification';
    setProductMode(mode);

    const blankRaw = sessionStorage.getItem(FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY);
    if (mode === 'blank_page_intake') {
      const payload = toSafeBlankPagePayload(blankRaw ? JSON.parse(blankRaw) : null);
      sessionStorage.setItem(FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY, JSON.stringify(payload));
      setBlankPagePayload(payload);
      setQuestion(resolveQuestionText(payload.recovery_question_primary));
      setGateMessage('');
      setBlankPageSubmitError(blankRaw ? null : 'We loaded a safe recovery prompt because the previous response was incomplete.');
      if (nextState) {
        const initializedState = ensureBlankPageRecoveryInitialized(
          nextState,
          payload.blank_page_mode,
          payload.question_family_primary
        );
        sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(initializedState));
        setCaseState(initializedState);
        emitBlankPageQuestionRendered({
          payload,
          recoveryDepth: initializedState.blank_page_recovery.blank_page_recovery_depth,
          supportFieldPresenceMap: {
            reassuranceCopy: Boolean(payload.reassurance_copy),
            exampleAnswerShape: Boolean(payload.example_answer_shape),
            whatGoodSignalWouldLookLike: Boolean(payload.what_good_signal_would_look_like),
          },
        });
      }
      const { name, payload: eventPayload } = buildEvent('fm_recovery_view', 'question');
      fireFmEvent(name, eventPayload);
      return;
    }

    // Load clarification payload if present
    const clarRaw = sessionStorage.getItem(FM_CLARIFICATION_PAYLOAD_KEY);
    if (clarRaw) {
      const clarPayload: ClarificationPayload = JSON.parse(clarRaw);
      setClarificationPayload(clarPayload);
      // Use the dynamic question from the clarification payload
      if (clarPayload.primaryQuestion) {
        setQuestion(resolveQuestionText(clarPayload.primaryQuestion));
        setGateMessage(clarPayload.whyNotLockedYet);
        if (nextState) {
          sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(nextState));
          setCaseState(nextState);
        }
        const { name, payload } = buildEvent('fm_recovery_view', 'question');
        fireFmEvent(name, payload);
        return;
      }
    }

    if (shouldGateToClarification(intelligence, nextState)) {
      setGateMessage("We don't know enough yet. One more real detail will make this useful.");
    }

    if (!nextState?.current_question) {
      router.replace('/start/blocked');
      return;
    }

    sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(nextState));
    setCaseState(nextState);
    setQuestion(resolveQuestionText(getQuestionTextFromState(nextState)));

    const { name, payload } = buildEvent('fm_recovery_view', 'question');
    fireFmEvent(name, payload);
  }, [router]);

  async function submitAnswer() {
    if (answer.trim().length < 5) return;

    setBlankPageSubmitError(null);
    setSubmitting(true);

    const wordCount = answer.trim().split(/\s+/).length;
    const { name, payload } = buildEvent('fm_recovery_submit', 'question', {
      input_word_count: wordCount,
    });
    fireFmEvent(name, payload);

    try {
      if (!caseState) {
        router.push('/start/direction');
        return;
      }

      if (productMode === 'blank_page_intake' && blankPagePayload) {
        emitBlankPageAnswerSubmitted({
          payload: blankPagePayload,
          recoveryDepth: caseState.blank_page_recovery.blank_page_recovery_depth,
          answerWordCount: wordCount,
          recoveryExhausted: caseState.blank_page_recovery.blank_page_recovery_exhausted,
        });
      }

      const activeIntelligence = intelligence ?? getStoredIntelligence();

      const shouldUseClarificationSufficiencyGate = productMode !== 'blank_page_intake';
      const sufficiency = evaluateClarificationAnswer(answer);
      if (shouldUseClarificationSufficiencyGate && !sufficiency.sufficient) {
        const archivedState = archiveCurrentQuestion(caseState);
        const transcript = buildCaseTranscript(archivedState);
        const priorQuestions = archivedState.prior_questions_asked.map((q) => q.question_text);
        const nextQuestionText = buildNextConcreteQuestion(transcript, priorQuestions);
        const nextState = nextQuestionText
          ? withDynamicQuestion(archivedState, nextQuestionText)
          : archivedState;

        sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(nextState));
        setCaseState(nextState);
        setQuestion(resolveQuestionText(nextQuestionText ?? question));
        setGateMessage('That is still too broad. Add one concrete detail — what was said, what you did, or what happened next?');
        if (activeIntelligence) {
          const strongest = deriveDirectionContent(activeIntelligence, nextState).strongest;
          const behavior = deriveCoachBehaviorSignals({
            stage: 'question',
            intake: activeIntelligence,
            strongest,
            caseState: nextState,
            draftText: answer,
            lastStudentAnswer: answer,
          });
          const memory = buildCoachMemoryState({
            stage: 'question',
            intake: activeIntelligence,
            strongest,
            caseState: nextState,
            draftText: answer,
            lastStudentAnswer: answer,
          }, behavior, null);
          setCoachMemory(memory);
          setCoachMemoryState(memory);
        }
        setSubmitting(false);
        return;
      }

      if (productMode === 'blank_page_intake' && blankPagePayload) {
        const blankPageResult = handleBlankPageAnswer({
          answerText: answer,
          caseState,
          activePayload: blankPagePayload,
        });

        sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(blankPageResult.updatedCaseState));
        setCaseState(blankPageResult.updatedCaseState);

        if (blankPageResult.postAnswerRoute === 'second_recovery_question' && blankPageResult.nextBlankPagePayload) {
          emitBlankPageRouteTransition({
            route: 'second_recovery_question',
            payload: blankPagePayload,
            recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
            recoveryExhausted: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_exhausted,
            routeReason: blankPageResult.decision.post_answer_route_reason,
          });
          sessionStorage.setItem(FM_PRODUCT_MODE_KEY, 'blank_page_intake');
          sessionStorage.setItem(FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY, JSON.stringify(blankPageResult.nextBlankPagePayload));
          setProductMode('blank_page_intake');
          setBlankPagePayload(blankPageResult.nextBlankPagePayload);
          setQuestion(resolveQuestionText(blankPageResult.nextBlankPagePayload.recovery_question_primary));
          setGateMessage('');
          setAnswer('');
          setSubmitting(false);
          return;
        }

        if (blankPageResult.postAnswerRoute === 'too_thin_to_recover' && blankPageResult.nextBlankPagePayload) {
          emitBlankPageRouteTransition({
            route: 'too_thin_to_recover',
            payload: blankPagePayload,
            recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
            recoveryExhausted: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_exhausted,
            routeReason: blankPageResult.decision.post_answer_route_reason,
          });
          emitBlankPageContinue({
            route: 'too_thin_to_recover',
            payload: blankPagePayload,
            recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
          });
          sessionStorage.setItem(FM_PRODUCT_MODE_KEY, 'blank_page_intake');
          sessionStorage.setItem(FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY, JSON.stringify(blankPageResult.nextBlankPagePayload));
          setProductMode('blank_page_intake');
          setBlankPagePayload(blankPageResult.nextBlankPagePayload);
          setQuestion(resolveQuestionText(blankPageResult.nextBlankPagePayload.recovery_question_primary));
          setGateMessage('');
          setAnswer('');
          setSubmitting(false);
          return;
        }

        const res = await fetch('/api/intake/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_input: blankPageResult.continuationBody.raw_input,
            session_id: blankPageResult.continuationBody.session_id,
            subject_entity_id: activeIntelligence?.subject_entity_id,
            prior_attempt_count: blankPageResult.continuationBody.prior_attempt_count,
            questions_asked: blankPageResult.continuationBody.questions_asked,
          }),
        });

        if (!res.ok) {
          throw new Error(`continuation session failed: ${res.status}`);
        }

        const rawApiResponse: SessionApiResponse = await res.json();
        const apiResponse = mapApiResponseByPostAnswerRoute({
          apiResponse: rawApiResponse,
          route: blankPageResult.postAnswerRoute,
        });

        const nextIntelligence = apiResponse.intake_intelligence;
        const syncedCaseState = syncCaseStateWithIntelligence(blankPageResult.updatedCaseState, nextIntelligence);
        persistSessionResponse(apiResponse, syncedCaseState);
        setCaseState(syncedCaseState);
        setIntelligence(nextIntelligence);
        setProductMode(apiResponse.product_mode);
        setClarificationPayload(apiResponse.clarification_payload ?? null);
        setBlankPagePayload(toSafeBlankPagePayload(apiResponse.blank_page_intake_payload ?? null));

        if (apiResponse.product_mode === 'clarification') {
          emitBlankPageRouteTransition({
            route: 'clarification',
            payload: blankPagePayload,
            recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
            recoveryExhausted: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_exhausted,
            routeReason: blankPageResult.decision.post_answer_route_reason,
          });
          emitBlankPageContinue({
            route: 'clarification',
            payload: blankPagePayload,
            recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
          });
          const nextQuestion = apiResponse.clarification_payload?.primaryQuestion ?? getQuestionTextFromState(syncedCaseState) ?? '';
          setQuestion(resolveQuestionText(nextQuestion));
          setGateMessage(blankPageResult.decision.post_answer_route_reason);
          setAnswer('');
          setSubmitting(false);
          return;
        }

        emitBlankPageRouteTransition({
          route: 'direction_light',
          payload: blankPagePayload,
          recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
          recoveryExhausted: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_exhausted,
          routeReason: blankPageResult.decision.post_answer_route_reason,
        });
        emitBlankPageContinue({
          route: 'direction_light',
          payload: blankPagePayload,
          recoveryDepth: blankPageResult.updatedCaseState.blank_page_recovery.blank_page_recovery_depth,
        });

        setSubmitting(false);
        router.push('/start/reflecting');
        return;
      }

      const updatedCaseState = applySharpeningAnswer(caseState, answer);
      const mergedTranscript = buildCaseTranscript(updatedCaseState);
      const priorQuestionTypes = updatedCaseState.prior_questions_asked.map(
        (q: CaseQuestionRecord) => q.question_type
      );

      const res = await fetch('/api/intake/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_input: mergedTranscript,
          session_id: updatedCaseState.session_id,
          subject_entity_id: activeIntelligence?.subject_entity_id,
          prior_attempt_count: updatedCaseState.prior_questions_asked.length,
          questions_asked: priorQuestionTypes,
        }),
      });

      if (!res.ok) {
        throw new Error(`continuation session failed: ${res.status}`);
      }

      const apiResponse: SessionApiResponse = await res.json();
      const nextIntelligence = apiResponse.intake_intelligence;
      const syncedCaseState = syncCaseStateWithIntelligence(updatedCaseState, nextIntelligence);
      persistSessionResponse(apiResponse, syncedCaseState);
      setCaseState(syncedCaseState);
      setIntelligence(nextIntelligence);
      setProductMode(apiResponse.product_mode);
      setClarificationPayload(apiResponse.clarification_payload ?? null);
      setBlankPagePayload(toSafeBlankPagePayload(apiResponse.blank_page_intake_payload ?? null));

      if (apiResponse.product_mode === 'blank_page_intake') {
        const safePayload = toSafeBlankPagePayload(apiResponse.blank_page_intake_payload ?? null);
        setBlankPagePayload(safePayload);
        const nextQuestion = safePayload.recovery_question_primary ?? getQuestionTextFromState(syncedCaseState) ?? '';
        setQuestion(resolveQuestionText(nextQuestion));
        setGateMessage('');
        setBlankPageSubmitError(null);
        setAnswer('');
        setSubmitting(false);
        return;
      }

      if (apiResponse.product_mode === 'clarification') {
        const nextQuestion = apiResponse.clarification_payload?.primaryQuestion ?? getQuestionTextFromState(syncedCaseState) ?? '';
        setQuestion(resolveQuestionText(nextQuestion));
        setGateMessage(apiResponse.clarification_payload?.whyNotLockedYet ?? "We don't know enough yet. One more real detail will make this useful.");
        setAnswer('');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);

      if (apiResponse.product_mode === 'blocked') {
        router.push('/start/blocked');
        return;
      }

      if (clarificationPayload?.returnTarget === 'opening') {
        const strongest = deriveDirectionContent(nextIntelligence, syncedCaseState).strongest;
        const behavior = deriveCoachBehaviorSignals({
          stage: 'opening',
          intake: nextIntelligence,
          strongest,
          caseState: syncedCaseState,
          lastStudentAnswer: answer,
        });
        const memory = buildCoachMemoryState({
          stage: 'opening',
          intake: nextIntelligence,
          strongest,
          caseState: syncedCaseState,
          lastStudentAnswer: answer,
        }, behavior, null);
        setCoachMemory(memory);
        sessionStorage.removeItem(FM_CLARIFICATION_PAYLOAD_KEY);
        router.push('/start/opening');
        return;
      }

      if (clarificationPayload?.returnTarget === 'direction') {
        const strongest = deriveDirectionContent(nextIntelligence, syncedCaseState).strongest;
        const behavior = deriveCoachBehaviorSignals({
          stage: 'direction',
          intake: nextIntelligence,
          strongest,
          caseState: syncedCaseState,
          lastStudentAnswer: answer,
        });
        const memory = buildCoachMemoryState({
          stage: 'direction',
          intake: nextIntelligence,
          strongest,
          caseState: syncedCaseState,
          lastStudentAnswer: answer,
        }, behavior, null);
        setCoachMemory(memory);
        sessionStorage.removeItem(FM_CLARIFICATION_PAYLOAD_KEY);
        router.push('/start/direction');
        return;
      }

      router.push('/start/reflecting');
    } catch (err) {
      console.error('[question] case-state update error:', err);
      if (productMode === 'blank_page_intake') {
        setBlankPageSubmitError('We could not submit yet. Your response is still here — please try again.');
      }
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void submitAnswer();
  }

  function handleSkip() {
    const { name, payload } = buildEvent('fm_direction_view', 'question');
    fireFmEvent(name, payload);
    if (caseState) {
      if (productMode === 'blank_page_intake' && blankPagePayload) {
        emitBlankPageAbandon({
          payload: blankPagePayload,
          recoveryDepth: caseState.blank_page_recovery.blank_page_recovery_depth,
          hadDraft: answer.trim().length > 0,
        });
      }
      const updatedState = markQuestionSkipped(caseState);
      sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(updatedState));
      if (intelligence && shouldGateToClarification(intelligence, updatedState) && updatedState.current_question) {
        setCaseState(updatedState);
        setQuestion(resolveQuestionText(getQuestionTextFromState(updatedState)));
        return;
      }
    }
    router.push('/start/direction');
  }

  if (!question) return <Skeleton />;

  if (productMode === 'blank_page_intake' && blankPagePayload) {
    const viewModel = buildBlankPageViewModel({
      payload: blankPagePayload,
      answerText: answer,
      isSubmitting: submitting,
      submitError: blankPageSubmitError,
    });

    return (
      <InteriorPageShell maxWidth="40rem">
        <div>
          <BlankPageIntakeView
            viewModel={viewModel}
            answer={answer}
            submitting={submitting}
            submitError={blankPageSubmitError}
            onAnswerChange={setAnswer}
            onSubmit={() => {
              void submitAnswer();
            }}
          />
        </div>
      </InteriorPageShell>
    );
  }

  return (
    <InteriorPageShell maxWidth="36rem">
      <div>
        <p
          className="text-label"
          style={{ marginBottom: '1.5rem', color: 'var(--color-judgment-accent)' }}
        >
          {productMode === 'blank_page_intake'
            ? 'One detail before we find your direction.'
            : clarificationPayload?.returnTarget === 'opening'
              ? 'We know the direction. We need the scene.'
              : clarificationPayload?.returnTarget === 'direction'
                ? 'You chose the weaker path. Answer this before committing.'
              : 'One detail sharpens the direction.'}
        </p>

        {gateMessage && (
          <p className="text-small" style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-muted)' }}>
            {gateMessage}
          </p>
        )}

        <blockquote
          style={{
            borderLeft: '3px solid var(--color-accent)',
            paddingLeft: '1.25rem',
            margin: '0 0 1.75rem 0',
            fontStyle: 'italic',
            fontSize: '1.125rem',
            lineHeight: 1.65,
            color: 'var(--color-text)',
          }}
        >
          {question}
        </blockquote>

        <form onSubmit={handleSubmit}>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '1rem',
              fontSize: '1rem',
              lineHeight: 1.65,
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-input)',
              backgroundColor: 'rgba(255,255,255,0.82)',
              color: 'var(--color-text)',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 4px 14px rgba(17, 24, 39, 0.04)',
            }}
            aria-label="Your answer"
            disabled={submitting}
          />

          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              type="submit"
              disabled={answer.trim().length < 5 || submitting}
              style={{
                padding: '0.9rem 1.5rem',
                backgroundColor: answer.trim().length >= 5 && !submitting
                  ? 'var(--color-text)'
                  : 'rgba(17, 24, 39, 0.1)',
                color: answer.trim().length >= 5 && !submitting
                  ? 'var(--color-surface)'
                  : 'rgba(17, 24, 39, 0.35)',
                border: 'none',
                borderRadius: 'var(--radius-input)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: answer.trim().length >= 5 && !submitting ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              {submitting ? 'Reading your answer…' : 'Use this detail'}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={submitting}
              style={{
                padding: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Skip for now
            </button>
          </div>
        </form>
      </div>
    </InteriorPageShell>
  );
}

function archiveCurrentQuestion(state: SessionCaseState): SessionCaseState {
  const current = state.current_question;
  if (!current) return state;

  return {
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
  };
}

function withDynamicQuestion(state: SessionCaseState, questionText: string): SessionCaseState {
  const template = state.prior_questions_asked[state.prior_questions_asked.length - 1] ?? state.current_question;

  return {
    ...state,
    current_question: {
      id: crypto.randomUUID(),
      question_type: template?.question_type ?? 'scene_detail',
      missing_detail: template?.missing_detail ?? 'scene',
      topic_key: `dynamic:${Date.now()}`,
      question_text: questionText,
    },
  };
}

function buildNextConcreteQuestion(
  transcript: string,
  priorQuestions: string[]
): string | null {
  const signals = extractNarrativeSignals(transcript);
  const usedTargets: Exclude<MissingSignalTarget, null>[] = [];

  for (let i = 0; i < 7; i += 1) {
    const target = detectMissingSignal(signals, usedTargets);
    if (!target || usedTargets.includes(target)) break;
    usedTargets.push(target);

    const candidate = generateClarificationQuestion({
      rawInput: transcript,
      signals,
      target,
      priorQuestions,
    });

    if (!candidate) continue;
    if (isDuplicateQuestion(candidate, { priorQuestions, priorTargets: usedTargets.map(String) })) continue;

    return candidate;
  }

  return null;
}

function Skeleton() {
  return (
    <main
      style={{
        minHeight: '100svh',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p className="text-body" style={{ color: 'var(--color-muted)' }}>
        Finding the right question…
      </p>
    </main>
  );
}
