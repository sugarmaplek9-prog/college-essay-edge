'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { FM_CASE_STATE_KEY, type SessionCaseState } from '@/lib/fm/case-state';
import {
  FM_PRODUCT_MODE_KEY,
  getOpeningDraft,
  getCoachMemory,
  setOpeningDraft,
  setCoachMemory,
  setResumeDraft,
} from '@/lib/fm/clientSession';
import {
  deriveOpeningCoachModel,
  deriveOpeningDraftReview,
  type OpeningCoachModel,
} from '@/lib/fm/openingCoach';
import { normalizeRenderText } from '@/lib/fm/output-quality';
import type { IntakeIntelligenceObject, ProductMode } from '@/types/intake';
import type { CoachMemoryState } from '@/lib/fm/coachBehavior';
import {
  CompareArtifact,
  CTARegion,
  InteriorPageShell,
  KeepCutReplaceModule,
  SurfaceCard,
  primaryCTA,
  primaryCTADisabled,
  secondaryCTA,
} from '@/components/firstMinute/InteriorFlowSystem';
import { shouldPersonalize } from '@/lib/fm/signal-confidence';
import { generateModelInformedFeedback, isDraftSubstantialEnoughForFeedback } from '@/lib/fm/draft-feedback-generator';

export default function OpeningPage() {
  const router = useRouter();
  const [model, setModel] = useState<OpeningCoachModel | null>(null);
  const [intelligence, setIntelligence] = useState<IntakeIntelligenceObject | null>(null);
  const [caseState, setCaseState] = useState<SessionCaseState | null>(null);
  const [draft, setDraft] = useState('');
  const [coachMemory, setCoachMemoryState] = useState<CoachMemoryState | null>(null);
  const [personalizationLevel, setPersonalizationLevel] = useState<'high_personalization' | 'fallback_scaffold'>('fallback_scaffold');
  const [modelFeedback, setModelFeedback] = useState<ReturnType<typeof generateModelInformedFeedback>>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem('fm_intelligence');
    if (!raw) {
      router.replace('/start');
      return;
    }

    const parsedIntelligence: IntakeIntelligenceObject = JSON.parse(raw);
    const caseStateRaw = sessionStorage.getItem(FM_CASE_STATE_KEY);
    const parsedCaseState: SessionCaseState | null = caseStateRaw ? JSON.parse(caseStateRaw) : null;
    const productMode = (sessionStorage.getItem(FM_PRODUCT_MODE_KEY) as ProductMode | null) ?? 'direction_full';

    // Set personalization level based on signal strength
    const signalStrength = parsedIntelligence.usable_signal.signal_strength;
    setPersonalizationLevel(shouldPersonalize(signalStrength) ? 'high_personalization' : 'fallback_scaffold');

    if (productMode === 'blocked') {
      router.replace('/start/blocked');
      return;
    }

    if (productMode === 'clarification' || productMode === 'blank_page_intake') {
      router.replace('/start/question');
      return;
    }

    const nextModel = deriveOpeningCoachModel(parsedIntelligence, parsedCaseState);
    const storedDraft = getOpeningDraft();

    setIntelligence(parsedIntelligence);
    setCaseState(parsedCaseState);
    setModel(nextModel);
    setDraft(storedDraft ?? nextModel.initialDraft);
    setCoachMemory(nextModel.coachMemory);
    setCoachMemoryState(getCoachMemory<CoachMemoryState>() ?? nextModel.coachMemory);
  }, [router]);

  const liveReview = useMemo(() => {
    if (!intelligence || !model) return null;
    
    // Generate model-informed feedback if draft is substantial and signal is strong
    if (personalizationLevel === 'high_personalization' && isDraftSubstantialEnoughForFeedback(draft)) {
      const feedback = generateModelInformedFeedback(
        draft,
        intelligence.narrative_pattern.primary_pattern,
        caseState,
        intelligence.usable_signal.signal_strength
      );
      setModelFeedback(feedback);
    }
    
    return deriveOpeningDraftReview({
      intake: intelligence,
      caseState,
      draftText: draft,
    });
  }, [intelligence, caseState, draft, model]);

  if (!model) {
    return <Skeleton />;
  }

  const isStrongInterpretiveOpening = model.helperLine !== 'Write the first four lines.';
  const draftLines = draft
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const showLineByLine = !isStrongInterpretiveOpening || draftLines.length >= 2;

  function handleSave() {
    if (!model) return;

    setOpeningDraft(draft);
    setResumeDraft(draft);
    setCoachMemory({
      ...model.coachMemory,
      current_stage: 'opening',
      last_student_answer: draft,
    });
    sessionStorage.setItem(
      'fm_skip_reflection_bridge',
      'Opening saved. Keep going with the next paragraph while the scene is still fresh.'
    );
    router.push('/start?entry=draft');
  }

  function handleRefine() {
    if (!model) return;
    const activeModel = model;

    const activeBehavior = liveReview?.behavior ?? activeModel.behavior;
    const activeDiagnosis = liveReview?.coachResponse.diagnosis ?? activeModel.coachResponse.diagnosis;

    setOpeningDraft(draft);
    setCoachMemory({
      ...activeModel.coachMemory,
      current_stage: 'question',
      last_student_answer: draft,
      last_correction_made: activeBehavior.correction_target === 'none' ? 'weak_specificity' : activeBehavior.correction_target,
    });
    sessionStorage.setItem(
      'fm_clarification_payload',
      JSON.stringify({
        possibleAngleLabel: 'Sharpening your opening',
        whyNotLockedYet: `${activeDiagnosis} ${activeModel.whyWeakMicroFeedback}`,
        missingDetailTargets: ['opening_specificity'],
        primaryQuestion: activeModel.refinementQuestion,
        returnTarget: 'opening',
        coachBehavior: activeBehavior,
      })
    );
    router.push('/start/question');
  }

  return (
    <InteriorPageShell maxWidth="42rem">
      <div>
        <section style={{ marginBottom: '1.4rem' }}>
          <p className="text-label" style={{ marginBottom: '0.45rem', color: 'var(--color-judgment-accent)' }}>
            Draft the opening
          </p>
          <h1
            style={{
              margin: '0 0 0.55rem',
              fontSize: 'clamp(1.55rem, 4vw, 2.1rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}
          >
            Start where the story changes.
          </h1>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            {normalizeRenderText(liveReview?.coachResponse.diagnosis ?? model.coachResponse.diagnosis)}
          </p>
        </section>

        <CompareArtifact
          label="What this opening needs"
          weaker={normalizeRenderText(liveReview?.comparison.weaker ?? model.openingComparison.weaker)}
          stronger={normalizeRenderText(liveReview?.comparison.stronger ?? model.openingComparison.stronger)}
          judgment={normalizeRenderText(liveReview?.comparison.judgment ?? model.openingComparison.judgment)}
        />

        <SurfaceCard label={isStrongInterpretiveOpening ? 'Build from the evidence' : 'Draft this opening'} variant="task" style={{ padding: '1.05rem 1.1rem' }}>
          {model.helperLine !== 'Write the first four lines.' && (
            <p className="text-small" style={{ margin: '0 0 0.8rem', color: 'var(--color-muted)' }}>
              {normalizeRenderText(model.helperLine)}
            </p>
          )}

          {model.starterLine && (
            <div
              style={{
                borderRadius: 'var(--radius-card)',
                border: '1px solid rgba(23, 58, 106, 0.14)',
                background: 'rgba(232, 239, 249, 0.56)',
                padding: '0.8rem 0.9rem',
                marginBottom: '0.8rem',
              }}
            >
              <p className="text-label" style={{ marginBottom: '0.35rem', color: 'var(--color-judgment-accent)' }}>
                {isStrongInterpretiveOpening ? 'Start with the moment that still felt normal' : 'Start inside the moment'}
              </p>
              <p className="text-body" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
                {normalizeRenderText(model.starterLine)}
              </p>
            </div>
          )}

          <div style={{ display: 'grid', gap: '0.45rem', marginBottom: '0.85rem' }}>
            {model.scaffoldSteps.map((step, index) => (
              <div
                key={`step-${index}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.35rem 1fr',
                  gap: '0.7rem',
                  alignItems: 'start',
                }}
              >
                <div
                  style={{
                    width: '1.35rem',
                    height: '1.35rem',
                    borderRadius: '999px',
                    background: index === 0 ? '#173a6a' : 'rgba(23, 58, 106, 0.12)',
                    color: index === 0 ? 'white' : '#173a6a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>
                <p className="text-small" style={{ margin: 0, color: 'var(--color-text)' }}>
                  {normalizeRenderText(step)}
                </p>
              </div>
            ))}
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            placeholder={model.helperLine}
            style={textareaStyle}
            aria-label="Opening draft"
          />
        </SurfaceCard>

        {showLineByLine ? <KeepCutReplaceModule rows={liveReview?.sentenceFeedback ?? []} /> : null}

        <div
          style={{
            display: 'grid',
            gap: '0.9rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
            marginBottom: '0.25rem',
          }}
        >
          <SurfaceCard label="What to prove next" variant="evidence" style={{ marginBottom: 0 }}>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
              {normalizeRenderText(model.nextParagraphInstruction)}
            </p>
            <p className="text-small" style={{ margin: '0.5rem 0 0', color: 'var(--color-muted)' }}>
              {normalizeRenderText(model.nextParagraphExpectation)}
            </p>
          </SurfaceCard>

          <SurfaceCard label="Do not flatten it" variant="warning" style={{ marginBottom: 0 }}>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              {model.antiGenericWarnings.slice(0, 4).map((warning, index) => (
                <p
                  key={`warning-${index}`}
                  className="text-small"
                  style={{ margin: 0, color: 'rgba(146, 64, 14, 0.86)' }}
                >
                  {normalizeRenderText(warning)}
                </p>
              ))}
            </div>
          </SurfaceCard>
        </div>

        <CTARegion>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', fontStyle: 'italic' }}>
            {normalizeRenderText(model.refinementQuestion)}
          </p>
          <button
            onClick={handleSave}
            disabled={draft.trim().length === 0}
            style={draft.trim().length > 0 ? primaryCTA : primaryCTADisabled}
          >
            Save this opening
          </button>

          <button onClick={handleRefine} style={secondaryCTA}>
            Make this sharper
          </button>
        </CTARegion>
      </div>
    </InteriorPageShell>
  );
}

const textareaStyle: CSSProperties = {
  width: '100%',
  minHeight: '12rem',
  padding: '1rem',
  fontSize: '1rem',
  lineHeight: 1.65,
  border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-text)',
  resize: 'vertical',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

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
        Building your opening scaffold…
      </p>
    </main>
  );
}