'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';
import { FM_CASE_STATE_KEY, type SessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';
import type { CompareAlternative } from '@/lib/fm/direction';
import type { IntakeIntelligenceObject } from '@/types/intake';
import {
  FM_CLARIFICATION_PAYLOAD_KEY,
  getCoachMemory,
  setCoachMemory,
} from '@/lib/fm/clientSession';
import {
  buildCoachMemoryState,
  buildCoachResponse,
  deriveCoachBehaviorSignals,
  type CoachMemoryState,
  type CoachResponse,
} from '@/lib/fm/coachBehavior';
import { normalizeRenderText } from '@/lib/fm/output-quality';
import { InteriorPageShell, SurfaceCard, CTARegion, ghostCTA, primaryCTA, secondaryCTA } from '@/components/firstMinute/InteriorFlowSystem';

export default function ComparePage() {
  const router = useRouter();
  const [alternatives, setAlternatives] = useState<CompareAlternative[]>([]);
  const [strongest, setStrongest] = useState<CompareAlternative | null>(null);
  const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null);
  const [coachMemory, setCoachMemoryState] = useState<CoachMemoryState | null>(null);
  const [focusQuestion, setFocusQuestion] = useState<string>('What exact detail made your approach change in that moment?');

  useEffect(() => {
    const raw = sessionStorage.getItem('fm_intelligence');
    if (!raw) {
      router.replace('/start');
      return;
    }

    const intelligence: IntakeIntelligenceObject = JSON.parse(raw);
    const caseStateRaw = sessionStorage.getItem(FM_CASE_STATE_KEY);
    const caseState: SessionCaseState | null = caseStateRaw ? JSON.parse(caseStateRaw) : null;
    const content = deriveDirectionContent(intelligence, caseState);
    const strongestDirection = content.strongest;
    // Strongest first, then weaker alternatives
    const sorted = [...content.compare_alternatives].sort((a, b) =>
      a.is_strongest === b.is_strongest ? 0 : a.is_strongest ? -1 : 1
    );
    setAlternatives(sorted);
    setStrongest(sorted.find((entry) => entry.is_strongest) ?? null);
    setFocusQuestion(strongestDirection.focused_question);

    const priorMemory = getCoachMemory<CoachMemoryState>();
    const behavior = deriveCoachBehaviorSignals({
      stage: 'compare',
      intake: intelligence,
      strongest: strongestDirection,
      caseState,
      lastStudentAnswer: priorMemory?.last_student_answer ?? null,
    });
    const response = buildCoachResponse(
      behavior,
      strongestDirection,
      caseState,
      priorMemory?.last_student_answer ?? null
    );
    const memory = buildCoachMemoryState(
      {
        stage: 'compare',
        intake: intelligence,
        strongest: strongestDirection,
        caseState,
        lastStudentAnswer: priorMemory?.last_student_answer ?? null,
      },
      behavior,
      sorted.find((entry) => !entry.is_strongest)?.title ?? null
    );
    setCoachResponse(response);
    setCoachMemory(memory);
    setCoachMemoryState(memory);

    const { name, payload } = buildEvent('fm_compare_view', 'compare', {
      pattern: intelligence.narrative_pattern.primary_pattern,
    });
    fireFmEvent(name, payload);
  }, [router]);

  function handleSelect(alt: CompareAlternative) {
    const { name, payload } = buildEvent('fm_compare_select', 'compare', {
      route: alt.is_strongest ? 'strongest' : 'alternative',
    });
    fireFmEvent(name, payload);
    if (alt.is_strongest) {
      if (coachMemory) {
        setCoachMemory({
          ...coachMemory,
          current_stage: 'direction',
        });
      }
      router.push('/start/direction');
    } else {
      if (coachMemory) {
        setCoachMemory({
          ...coachMemory,
          current_stage: 'question',
          unresolved_ambiguity: focusQuestion,
          last_correction_made: 'weak_direction_fit',
        });
      }
      sessionStorage.setItem(
        FM_CLARIFICATION_PAYLOAD_KEY,
        JSON.stringify({
          possibleAngleLabel: 'Re-checking weaker path risk',
          whyNotLockedYet: 'That weaker version sounds plausible, but it usually flattens. Answer one question before you commit.',
          missingDetailTargets: ['direction_discrimination'],
          primaryQuestion: focusQuestion,
          returnTarget: 'direction',
        })
      );
      router.push('/start/question');
    }
  }

  if (alternatives.length === 0) return <Skeleton />;

  return (
    <InteriorPageShell maxWidth="44rem">
      <div>
        {coachResponse && (
          <SurfaceCard variant="coach" style={{ marginBottom: '1rem' }}>
            <p className="text-body" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
              {normalizeRenderText(coachResponse.diagnosis)}
            </p>
            {coachResponse.reaction && (
              <p className="text-small" style={{ margin: '0.4rem 0 0', color: 'var(--color-muted)' }}>
                {normalizeRenderText(coachResponse.reaction)}
              </p>
            )}
            <p className="text-small" style={{ margin: '0.4rem 0 0', color: 'var(--color-muted)' }}>
              {normalizeRenderText(coachResponse.instruction)}
            </p>
          </SurfaceCard>
        )}

        <p className="text-label" style={{ marginBottom: '0.55rem', color: 'var(--color-judgment-accent)' }}>
          The stronger path
        </p>

        <p className="text-small" style={{ color: 'var(--color-muted)', marginTop: 0, marginBottom: '1.1rem' }}>
          One of these has a real choice point. The other is setup.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {alternatives.map((alt, i) => (
            <AngleCard
              key={i}
              alt={alt}
              strongerMove={strongest?.how_it_would_likely_start ?? 'Start from the specific turning moment, then move into what changed.'}
              onSelect={() => handleSelect(alt)}
            />
          ))}
        </div>

        <button
          onClick={() => router.back()}
          style={ghostCTA}
        >
          ← Back to direction
        </button>
      </div>
    </InteriorPageShell>
  );
}

function AngleCard({
  alt,
  strongerMove,
  onSelect,
}: {
  alt: CompareAlternative;
  strongerMove: string;
  onSelect: () => void;
}) {
  return (
    <div
      style={{
        border: alt.is_strongest
          ? '1.8px solid rgba(23, 58, 106, 0.24)'
          : '1px solid rgba(17, 24, 39, 0.1)',
        borderLeft: alt.is_strongest
          ? '4px solid #173a6a'
          : '4px solid rgba(128, 94, 52, 0.3)',
        borderRadius: 'var(--radius-card-lg)',
        padding: '1.5rem',
        background: alt.is_strongest
          ? 'linear-gradient(160deg, rgba(232,239,249,0.7) 0%, rgba(242,247,252,0.9) 100%)'
          : 'rgba(250, 244, 236, 0.6)',
        boxShadow: alt.is_strongest
          ? '0 14px 32px rgba(23, 58, 106, 0.1)'
          : '0 4px 14px rgba(17, 24, 39, 0.04)',
        cursor: 'pointer',
        opacity: alt.is_strongest ? 1 : 0.82,
      }}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-label={`Select ${alt.title}`}
    >
      {alt.is_strongest && (
        <p className="text-label" style={{ marginBottom: '0.5rem', color: 'var(--color-judgment-accent)' }}>
          Stronger angle
        </p>
      )}

      {!alt.is_strongest && (
        <p className="text-label" style={{ marginBottom: '0.5rem', color: 'var(--color-muted)' }}>
          Weaker path
        </p>
      )}

      <h2
        className="text-title"
        style={{
          marginBottom: '0.75rem',
          fontWeight: alt.is_strongest ? 700 : 500,
          fontSize: alt.is_strongest ? undefined : '1.125rem',
        }}
      >
        {alt.title}
      </h2>

      <p className="text-small" style={{ color: 'var(--color-muted)', marginTop: '-0.25rem', marginBottom: '1rem' }}>
        {alt.subtitle}
      </p>

      <div style={{ display: 'grid', gap: '0.85rem' }}>
        <CompareBlock label="What this focuses on" body={alt.essay_focus} />
        <CompareBlock label={alt.is_strongest ? 'What makes it stronger' : 'Why it loses'} body={alt.why_it_works_or_loses} />
        <CompareBlock label="How it would start" body={alt.how_it_would_likely_start} />
      </div>

      <div
        style={{
          borderTop: '1px solid rgba(17, 24, 39, 0.1)',
          paddingTop: '0.75rem',
          marginTop: '1rem',
        }}
      >
        <p className="text-label" style={{ margin: 0, color: alt.is_strongest ? 'var(--color-judgment-accent)' : 'var(--color-muted)' }}>
          {alt.is_strongest ? 'Build from here →' : 'The risk in this path'}
        </p>
      </div>
    </div>
  );
}

function CompareBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-label" style={{ marginBottom: '0.25rem' }}>
        {label}
      </p>
      <p className="text-small" style={{ color: 'var(--color-muted)', margin: 0 }}>
        {body}
      </p>
    </div>
  );
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
        Loading…
      </p>
    </main>
  );
}
