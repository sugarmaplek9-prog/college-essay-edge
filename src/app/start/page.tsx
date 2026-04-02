'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';
import { emitBlankPageModeAssigned } from '@/lib/telemetry/blankPageEvents';
import {
  appendContinuationNotes,
  buildCaseTranscript,
  createSessionCaseState,
  mergeContinuationText,
  normalizeStudentText,
  syncCaseStateWithIntelligence,
  type CaseQuestionRecord,
} from '@/lib/fm/case-state';
import {
  clearResumeDraft,
  getResumeDraft,
  getStoredCaseState,
  getStoredIntelligence,
  persistSessionResponse,
} from '@/lib/fm/clientSession';
import type { SessionApiResponse } from '@/types/intake';

function StartPageContent() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Reading what you shared…');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageTitle = 'Paste rough notes, a partial paragraph, or one moment you keep returning to.';

  const pageIntro = 'You do not need a polished idea yet. Bring the raw material.';

  const inputPlaceholder = 'Paste notes, a rough paragraph, or one moment.';

  const submitLabel = 'Find the strongest direction';

  useEffect(() => {
    const { name, payload } = buildEvent('fm_start_view', 'start');
    fireFmEvent(name, payload);

    const resumeDraft = getResumeDraft();
    if (resumeDraft) {
      setText(resumeDraft);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const length = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(length, length);
        }
      });
    }
  }, []);

  function handleFocus() {
    const { name, payload } = buildEvent('fm_input_focus', 'start');
    fireFmEvent(name, payload);
  }

  function startLoadingMessages() {
    const sequence = [
      { delay: 2500, message: 'Finding the strongest thread…' },
      { delay: 5000, message: 'Almost there…' },
      { delay: 8000, message: 'Taking a moment longer than usual…' },
    ];
    for (const step of sequence) {
      const t = setTimeout(() => {
        setLoadingMessage(step.message);
        if (step.delay === 8000) {
          // FM-11: 8s fallback event
          const { name, payload } = buildEvent('fm_loading_timeout', 'start', {
            elapsed_ms: 8000,
          });
          fireFmEvent(name, payload);
        }
      }, step.delay);
      // Store last timer ref for cleanup
      loadingTimerRef.current = t;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedInput = normalizeStudentText(text);
    if (normalizedInput.trim().length === 0) return;
    setSubmitError(null);

    const storedCaseState = getStoredCaseState();
    const storedIntelligence = getStoredIntelligence();
    const baseTranscript = storedCaseState ? buildCaseTranscript(storedCaseState) : '';
    const resumeDraft = getResumeDraft();
    const isContinuation = Boolean(storedCaseState && storedIntelligence && resumeDraft !== null);
    const mergedInput = isContinuation
      ? mergeContinuationText(baseTranscript, normalizedInput)
      : { mergedText: normalizedInput, appendedText: null };

    const wordCount = normalizedInput.trim().split(/\s+/).length;
    const { name: submitName, payload: submitPayload } = buildEvent(
      'fm_input_submit',
      'start',
      { input_word_count: wordCount }
    );
    fireFmEvent(submitName, submitPayload);

    setLoading(true);
    setLoadingMessage('Reading what you shared…');

    const { name: loadName, payload: loadPayload } = buildEvent('fm_loading_view', 'start');
    fireFmEvent(loadName, loadPayload);

    startLoadingMessages();

    const priorQuestionTypes = storedCaseState?.prior_questions_asked.map(
      (q: CaseQuestionRecord) => q.question_type
    ) ?? [];

    try {
      const res = await fetch('/api/intake/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isContinuation && storedCaseState && storedIntelligence
            ? {
                raw_input: mergedInput.mergedText,
                session_id: storedCaseState.session_id,
                subject_entity_id: storedIntelligence.subject_entity_id,
                prior_attempt_count: storedCaseState.prior_questions_asked.length,
                questions_asked: priorQuestionTypes,
              }
            : { raw_input: normalizedInput }
        ),
      });

      if (!res.ok) {
        throw new Error(`intake session failed: ${res.status}`);
      }

      const apiResponse: SessionApiResponse = await res.json();
      const { intake_intelligence: intelligence, product_mode } = apiResponse;
      const caseState = isContinuation && storedCaseState
        ? syncCaseStateWithIntelligence(
            mergedInput.appendedText
              ? appendContinuationNotes(storedCaseState, mergedInput.appendedText)
              : storedCaseState,
            intelligence
          )
        : createSessionCaseState(mergedInput.mergedText, intelligence);

      persistSessionResponse(apiResponse, caseState);
      clearResumeDraft();

      if (product_mode === 'blank_page_intake') {
        emitBlankPageModeAssigned({
          blankPageMode: apiResponse.blank_page_mode,
          productMode: product_mode,
          route: apiResponse.top_level_blank_page_route,
          confidence: apiResponse.blank_page_confidence,
          triggerSignals: apiResponse.blank_page_trigger_signals,
        });
      }

      // Route from product_mode — single source of truth
      switch (product_mode) {
        case 'blocked':
          router.push('/start/blocked');
          break;
        case 'blank_page_intake':
        case 'clarification':
          router.push('/start/question');
          break;
        case 'direction_light':
        case 'direction_full':
        default:
          router.push('/start/reflecting');
      }
    } catch (err) {
      console.error('[start] intake session error:', err);
      setLoading(false);
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      setSubmitError('We could not load your direction just now. Your notes are still here — please try again.');
    }
  }

  if (loading) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return (
    <>
      <style>{`
        @media (max-width: 48rem) {
          .start-page-grid {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
      <main
        style={{
          minHeight: '100svh',
          background:
            'radial-gradient(circle at 82% 16%, rgba(40, 76, 136, 0.14) 0%, rgba(40, 76, 136, 0.06) 18%, transparent 40%), linear-gradient(180deg, #faf6ef 0%, #f5f1ea 20%, #fbfaf7 54%, #ffffff 100%)',
          color: 'var(--color-text)',
          padding: 'clamp(3rem, 6vw, 4.5rem) var(--spacing-page) clamp(3.5rem, 8vw, 5rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 'auto 8% 18% auto',
            width: '18rem',
            height: '18rem',
            background: 'radial-gradient(circle, rgba(94, 120, 78, 0.12) 0%, rgba(94, 120, 78, 0.04) 42%, transparent 72%)',
            filter: 'blur(24px)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: '68rem', margin: '0 auto', width: '100%', position: 'relative' }}>
          <section
            className="start-page-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) minmax(14rem, 0.65fr)',
              gap: '2rem',
              alignItems: 'start',
            }}
          >
          <div style={{ minWidth: 0 }}>
            <h1
              className="text-title"
              style={{ marginBottom: '1.25rem', maxWidth: '36rem' }}
            >
              {pageTitle}
            </h1>

            <p
              className="text-body"
              style={{
                color: 'var(--color-muted)',
                marginBottom: '2rem',
                maxWidth: '40rem',
              }}
            >
              {pageIntro}
            </p>

            {submitError && (
              <div
                style={{
                  marginBottom: '1.5rem',
                  padding: '0.8rem 0.95rem',
                  border: '1px solid #d97706',
                  borderRadius: 'var(--radius-card)',
                  backgroundColor: '#fff7ed',
                }}
              >
                <p className="text-label" style={{ marginBottom: '0.35rem', color: '#9a3412' }}>
                  We hit a temporary loading issue
                </p>
                <p className="text-small" style={{ margin: 0, color: '#7c2d12' }}>
                  {submitError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(23, 58, 106, 0.32)';
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.88)';
                  handleFocus();
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(23, 58, 106, 0.18)';
                  e.currentTarget.style.backgroundColor = 'rgba(242, 247, 252, 0.64)';
                }}
                placeholder={inputPlaceholder}
                rows={7}
                style={{
                  width: '100%',
                  minHeight: '13rem',
                  padding: '1.1rem',
                  fontSize: '1rem',
                  lineHeight: 1.65,
                  border: '1.5px solid rgba(23, 58, 106, 0.18)',
                  borderRadius: 'var(--radius-input)',
                  backgroundColor: 'rgba(242, 247, 252, 0.64)',
                  color: 'var(--color-text)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s ease, background-color 0.2s ease',
                }}
                aria-label="Your notes or draft"
              />

              <button
                type="submit"
                disabled={text.trim().length === 0}
                style={{
                  marginTop: '1.2rem',
                  width: '100%',
                  padding: '0.95rem 1.5rem',
                  backgroundColor: text.trim().length > 0
                    ? '#173a6a'
                    : 'rgba(23, 58, 106, 0.1)',
                  color: text.trim().length > 0
                    ? 'var(--color-surface)'
                    : 'rgba(23, 58, 106, 0.35)',
                  border: '1px solid rgba(23, 58, 106, 0.12)',
                  borderRadius: 'var(--radius-input)',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: text.trim().length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  boxShadow: text.trim().length > 0 ? '0 12px 30px rgba(23, 58, 106, 0.16)' : 'none',
                }}
              >
                {submitLabel}
              </button>
            </form>
          </div>

          <MoatArtifact />
        </section>
      </div>
    </main>
    </>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<LoadingScreen message="Loading start page…" />}>
      <StartPageContent />
    </Suspense>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <main
      style={{
        minHeight: '100svh',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--spacing-page)',
      }}
    >
      <p
        className="text-body"
        style={{
          color: 'var(--color-muted)',
          maxWidth: '20rem',
          textAlign: 'center',
          transition: 'opacity 0.3s ease',
        }}
      >
        {message}
      </p>
    </main>
  );
}

function MoatArtifact() {
  return (
    <aside
      style={{
        border: '1px solid rgba(23, 58, 106, 0.12)',
        borderRadius: '1.3rem',
        backgroundColor: 'rgba(242, 247, 252, 0.68)',
        backdropFilter: 'blur(8px)',
        padding: '1.3rem',
        boxShadow: '0 16px 44px rgba(17, 24, 39, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <p className="text-label" style={{ margin: 0, color: '#173a6a', fontSize: '0.85rem', letterSpacing: '0.02em' }}>
        How College Essay Edge makes the call
      </p>
      
      <p
        className="text-small"
        style={{
          margin: 0,
          color: 'var(--color-text)',
          lineHeight: 1.6,
          fontSize: '0.95rem',
          fontWeight: 500,
        }}
      >
        Built from real reviewed essay cases, our ML-guided coaching is designed to choose stronger directions, catch generic mistakes early, and move you into a real draft start.
      </p>
      
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginTop: '0.3rem',
        }}
      >
        <ProofRow label="Learns from reviewed cases" />
        <ProofRow label="Chooses stronger directions" />
        <ProofRow label="Catches generic mistakes early" />
      </div>
    </aside>
  );
}

function ProofRow({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        paddingTop: '0.2rem',
      }}
    >
      <div
        style={{
          width: '4px',
          height: '4px',
          borderRadius: '50%',
          backgroundColor: '#173a6a',
          marginTop: '0.4rem',
          flexShrink: 0,
        }}
      />
      <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500, fontSize: '0.92rem' }}>
        {label}
      </p>
    </div>
  );
}
