'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';
import {
  FM_CASE_STATE_KEY,
  getDominantConsequence,
  getDominantScene,
  getDominantTurningPoint,
  type SessionCaseState,
} from '@/lib/fm/case-state';
import { FM_CANONICAL_PAGE3_PAYLOAD_KEY } from '@/lib/fm/clientSession';
import type { IntakeIntelligenceObject, ProductMode } from '@/types/intake';
import type { CanonicalPage3Payload } from '@/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { normalizeRenderText, renderGuard } from '@/lib/fm/output-quality';
import { CompareArtifact, CTARegion, EvidenceCard, InteriorPageShell, SurfaceCard, ghostCTA, primaryCTA } from '@/components/firstMinute/InteriorFlowSystem';

interface FirstReadViewModel {
  strongestDirection: string;
  whyThisStandsOut: string;
  nextMove: string;
  evidenceItems: EvidenceInsight[];
  sharpenQuestion: string;
  coachComparison: {
    weaker: string;
    stronger: string;
    judgment: string;
  };
}

interface EvidenceInsight {
  quote: string;
  meaning: string;
}

export default function ReflectingPage() {
  const router = useRouter();
  const [viewModel, setViewModel] = useState<FirstReadViewModel | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('fm_intelligence');
    if (!raw) {
      router.replace('/start');
      return;
    }

    const parsed: IntakeIntelligenceObject = JSON.parse(raw);
    const caseStateRaw = sessionStorage.getItem(FM_CASE_STATE_KEY);
    const caseState: SessionCaseState | null = caseStateRaw ? JSON.parse(caseStateRaw) : null;
    const canonicalRaw = sessionStorage.getItem(FM_CANONICAL_PAGE3_PAYLOAD_KEY);
    const canonicalPayload: CanonicalPage3Payload | null = canonicalRaw ? JSON.parse(canonicalRaw) : null;

    // Use product_mode as the single routing authority
    const productMode = (sessionStorage.getItem('fm_product_mode') as ProductMode | null) ?? 'direction_full';

    if (productMode === 'blocked') {
      router.replace('/start/blocked');
      return;
    }

    if (productMode === 'clarification') {
      router.replace('/start/question');
      return;
    }

    setViewModel(buildFirstReadModel(parsed, caseState, canonicalPayload));

    const { name, payload } = buildEvent('fm_reflection_view', 'reflecting', {
      pattern: parsed.narrative_pattern.primary_pattern,
    });
    fireFmEvent(name, payload);
  }, [router]);

  function handleContinue() {
    const { name, payload } = buildEvent('fm_direction_view', 'reflecting');
    fireFmEvent(name, payload);
    router.push('/start/direction');
  }

  if (!viewModel) {
    return <Skeleton />;
  }

  return (
    <InteriorPageShell maxWidth="48rem">
      <div>
        <p className="text-label" style={{ marginBottom: '0.45rem', color: 'var(--color-judgment-accent)' }}>
          The decision
        </p>

        <h1
          style={{
            marginTop: 0,
            marginBottom: '1.5rem',
            fontSize: 'clamp(1.55rem, 4vw, 2.1rem)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--color-text)',
          }}
        >
          {viewModel.strongestDirection}
        </h1>

        <p className="text-small" style={{ margin: '0 0 1rem', color: 'var(--color-muted)' }}>
          {viewModel.whyThisStandsOut}
        </p>

        <SurfaceCard label="Next move" variant="judgment" style={{ marginBottom: '1rem' }}>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
            {viewModel.nextMove}
          </p>
        </SurfaceCard>

        <CompareArtifact
          label="Why this wins"
          weaker={viewModel.coachComparison.weaker}
          stronger={viewModel.coachComparison.stronger}
        />

        <details
          style={{
            marginBottom: '1.5rem',
            borderRadius: 'var(--radius-card-lg)',
            border: '1px solid rgba(17, 24, 39, 0.08)',
            background: 'rgba(255,255,255,0.72)',
            padding: '0.9rem 1rem',
          }}
        >
          <summary className="text-label" style={{ color: 'var(--color-judgment-accent)', cursor: 'pointer' }}>
            Support from your notes
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
            {viewModel.evidenceItems.map((item, index) => (
              <EvidenceCard
                key={`${item.quote}-${index}`}
                fragment={item.quote}
                explanation={item.meaning}
              />
            ))}
          </div>
        </details>

        <CTARegion>
          <button onClick={handleContinue} style={primaryCTA}>
            Build from this direction
          </button>

          <button
            onClick={() => {
              sessionStorage.setItem(
                'fm_clarification_payload',
                JSON.stringify({
                  possibleAngleLabel: 'Sharpening the strongest direction',
                  whyNotLockedYet: 'One targeted detail can make this direction more precise.',
                  missingDetailTargets: ['direction_sharpening'],
                  primaryQuestion: viewModel.sharpenQuestion,
                })
              );
              router.push('/start/question');
            }}
            style={ghostCTA}
          >
            Sharpen this first
          </button>
        </CTARegion>
      </div>
    </InteriorPageShell>
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
        Reading what you shared…
      </p>
    </main>
  );
}

function buildFirstReadModel(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null,
  canonicalPayload: CanonicalPage3Payload | null
): FirstReadViewModel {
  const content = deriveDirectionContent(intake, caseState);
  const strongest = content.strongest;
  const packet = canonicalPayload?.recommendation_packet;

  return {
    strongestDirection: renderGuard(
      normalizeRenderText(packet?.displayed_recommendation || strongest.title),
      'This essay should center the decision that most clearly reveals how you think under pressure.',
      { maxWords: 24, maxSentences: 1 }
    ),
    whyThisStandsOut: renderGuard(
      normalizeRenderText(packet?.why_this_direction || strongest.why_beats_obvious || strongest.explanation),
      'This angle works because it gives a clear claim, clear stakes, and a clear draft path.',
      { maxWords: 28, maxSentences: 2 }
    ),
    nextMove: renderGuard(
      normalizeRenderText(packet?.first_coaching_step || packet?.next_step || strongest.next_move),
      'Use one scene, one decision, and one immediate result to start the draft.',
      { maxWords: 28, maxSentences: 2 }
    ),
    evidenceItems: buildEvidenceInsights(caseState, strongest, canonicalPayload),
    sharpenQuestion: renderGuard(
      strongest.focused_question,
      'What exact detail shows the moment your approach changed?',
      { maxWords: 20, maxSentences: 1 }
    ),
    coachComparison: {
      weaker: packet?.weaker_read || content.coach_comparison.weaker_read,
      stronger: packet?.stronger_read || content.coach_comparison.stronger_read,
      judgment: content.coach_comparison.coach_judgment,
    },
  };
}

function buildEvidenceInsights(
  caseState: SessionCaseState | null,
  strongest: ReturnType<typeof deriveDirectionContent>['strongest'],
  canonicalPayload: CanonicalPage3Payload | null
): EvidenceInsight[] {
  const canonicalLines = canonicalPayload?.recommendation_packet.evidence_lines ?? [];
  const canonicalExplanations = canonicalPayload?.recommendation_packet.evidence_explanations ?? [];

  if (canonicalLines.length > 0) {
    return canonicalLines.slice(0, 3).map((quote, index) => ({
      quote: renderGuard(quote, quote, { maxWords: 26, maxSentences: 1 }),
      meaning: renderGuard(
        canonicalExplanations[index] || 'This source line supports the selected direction.',
        'This source line supports the selected direction.',
        { maxWords: 14, maxSentences: 1 }
      ),
    }));
  }

  const insights: EvidenceInsight[] = [];

  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const scene = caseState ? getDominantScene(caseState) : null;
  const consequence = caseState ? getDominantConsequence(caseState) : null;

  if (scene) {
    insights.push({
      quote: clip(scene),
      meaning: 'This is where the problem first becomes real.',
    });
  }

  if (turning) {
    insights.push({
      quote: clip(turning),
      meaning: 'This is the detail that turns the essay.',
    });
  }

  if (consequence) {
    insights.push({
      quote: clip(consequence),
      meaning: 'This line proves the choice had consequences.',
    });
  }

  if (insights.length < 2 && caseState) {
    const transcript = caseState.raw_inputs
      .map((entry) => entry.text)
      .join(' ')
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 2);

    for (const line of transcript) {
      if (insights.length >= 2) break;
      insights.push({
        quote: clip(line),
        meaning: 'This is a source note the direction stays close to.',
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      quote: strongest.essay_about,
      meaning: 'This is the story thread the direction protects.',
    });
  }

  return insights.slice(0, 3).map((item) => ({
    quote: renderGuard(item.quote, item.quote, { maxWords: 26, maxSentences: 1 }),
    meaning: renderGuard(item.meaning, item.meaning, { maxWords: 14, maxSentences: 1 }),
  }));
}

function clip(text: string): string {
  const value = text.trim().replace(/^"+|"+$/g, '');
  if (!value) return '';
  return value.length > 120 ? `${value.slice(0, 117).trim()}…` : value;
}
