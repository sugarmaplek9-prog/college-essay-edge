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
import { FM_CANONICAL_PAGE3_PAYLOAD_KEY, getCoachMemory, setCoachMemory, setResumeDraft } from '@/lib/fm/clientSession';
import type { IntakeIntelligenceObject, ProductMode } from '@/types/intake';
import type { CanonicalPage3Payload } from '@/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1';
import { deriveDirectionContent } from '@/lib/fm/direction';
import type { DirectionContent } from '@/lib/fm/direction';
import { deriveOpeningCoachModel } from '@/lib/fm/openingCoach';
import type { OpeningCoachModel } from '@/lib/fm/openingCoach';
import { normalizeRenderText } from '@/lib/fm/output-quality';
import {
  buildCoachMemoryState,
  buildCoachResponse,
  deriveCoachBehaviorSignals,
  type CoachMemoryState,
  type CoachResponse,
} from '@/lib/fm/coachBehavior';
import { CompareArtifact, CTARegion, EvidenceCard, InteriorPageShell, OpeningDirectiveArtifact, SurfaceCard, ghostCTA, primaryCTA, secondaryCTA } from '@/components/firstMinute/InteriorFlowSystem';
import { shouldPersonalize } from '@/lib/fm/signal-confidence';
import { getPatternGuidance } from '@/lib/fm/pattern-guidance';

interface EvidenceInsight {
  quote: string;
  meaning: string;
}

export default function DirectionPage() {
  const router = useRouter();
  const [content, setContent] = useState<DirectionContent | null>(null);
  const [openingModel, setOpeningModel] = useState<OpeningCoachModel | null>(null);
  const [bridgingSentence, setBridgingSentence] = useState<string | null>(null);
  const [coachResponse, setCoachResponse] = useState<CoachResponse | null>(null);
  const [coachMemory, setCoachMemoryState] = useState<CoachMemoryState | null>(null);
  const [personalizationLevel, setPersonalizationLevel] = useState<'high_personalization' | 'fallback_scaffold'>('fallback_scaffold');
  const [caseState, setCaseState] = useState<SessionCaseState | null>(null);
  const [canonicalPayload, setCanonicalPayload] = useState<CanonicalPage3Payload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('fm_intelligence');
    if (!raw) {
      router.replace('/start');
      return;
    }

    const intelligence: IntakeIntelligenceObject = JSON.parse(raw);
    const caseStateRaw = sessionStorage.getItem(FM_CASE_STATE_KEY);
    const caseState: SessionCaseState | null = caseStateRaw ? JSON.parse(caseStateRaw) : null;
    const canonicalRaw = sessionStorage.getItem(FM_CANONICAL_PAGE3_PAYLOAD_KEY);
    const canonical: CanonicalPage3Payload | null = canonicalRaw ? JSON.parse(canonicalRaw) : null;
    const productMode = (sessionStorage.getItem('fm_product_mode') as ProductMode | null) ?? 'direction_full';

    // Set personalization level based on signal strength
    const signalStrength = intelligence.usable_signal.signal_strength;
    setPersonalizationLevel(shouldPersonalize(signalStrength) ? 'high_personalization' : 'fallback_scaffold');
    setCaseState(caseState);
    setCanonicalPayload(canonical);

    if (productMode === 'blocked') {
      router.replace('/start/blocked');
      return;
    }

    if (productMode === 'clarification' || productMode === 'blank_page_intake') {
      router.replace('/start/question');
      return;
    }

    const derived = deriveDirectionContent(intelligence, caseState);
  const derivedOpening = deriveOpeningCoachModel(intelligence, caseState);
    setContent(derived);
  setOpeningModel(derivedOpening);

    const strongest = derived.strongest;
    const behavior = deriveCoachBehaviorSignals({
      stage: 'direction',
      intake: intelligence,
      strongest,
      caseState,
      lastStudentAnswer: getCoachMemory<CoachMemoryState>()?.last_student_answer ?? null,
    });
    const response = buildCoachResponse(
      behavior,
      strongest,
      caseState,
      getCoachMemory<CoachMemoryState>()?.last_student_answer ?? null
    );
    const memory = buildCoachMemoryState(
      {
        stage: 'direction',
        intake: intelligence,
        strongest,
        caseState,
        lastStudentAnswer: getCoachMemory<CoachMemoryState>()?.last_student_answer ?? null,
      },
      behavior,
      derived.compare_alternatives.find((entry) => !entry.is_strongest)?.title ?? null
    );
    setCoachResponse(response);
    setCoachMemory(memory);
    setCoachMemoryState(memory);

    const bridge = sessionStorage.getItem('fm_skip_reflection_bridge');
    if (bridge) {
      setBridgingSentence(bridge);
      sessionStorage.removeItem('fm_skip_reflection_bridge');
    }

    const { name, payload } = buildEvent('fm_direction_view', 'direction', {
      pattern: intelligence.narrative_pattern.primary_pattern,
      viability: intelligence.recommendation_viability.decision,
      reduced_scope: derived.is_reduced_scope,
    });
    fireFmEvent(name, payload);
  }, [router]);

  if (!content || !openingModel) return <Skeleton />;

  const { strongest, compare_alternatives, coach_comparison } = content;
  const recommendationPacket = canonicalPayload?.recommendation_packet;
  const canCompare = compare_alternatives.length >= 2;
  const evidenceItems = buildEvidenceInsights(content, caseState, strongest, canonicalPayload);
  const decisionHeadline = buildDecisionHeadline(recommendationPacket?.displayed_recommendation, strongest.title);
  const decisionWhy = normalizeRenderText(recommendationPacket?.why_this_direction || strongest.explanation);
  const nextMove = buildTopNextMove(
    recommendationPacket?.first_coaching_step,
    recommendationPacket?.next_step,
    openingModel.nextParagraphInstruction,
    strongest.next_move
  );
  const essayAbout = normalizeRenderText(recommendationPacket?.essay_about || strongest.essay_about);

  return (
    <InteriorPageShell maxWidth="42rem">
      <div>
        {bridgingSentence && (
          <p className="text-small" style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
            {bridgingSentence}
          </p>
        )}

        <section style={{ marginBottom: '1.5rem' }}>
          <p className="text-label" style={{ marginBottom: '0.45rem', color: 'var(--color-judgment-accent)' }}>
            The decision
          </p>
          <h1
            style={{
              margin: '0 0 0.45rem',
              fontSize: 'clamp(1.55rem, 4vw, 2.1rem)',
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}
          >
            {decisionHeadline}
          </h1>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            {decisionWhy}
          </p>
          <SurfaceCard label="Next move" variant="judgment" style={{ marginTop: '1rem', marginBottom: 0 }}>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
              {nextMove}
            </p>
            <p className="text-small" style={{ margin: '0.45rem 0 0', color: 'var(--color-muted)' }}>
              {essayAbout}
            </p>
          </SurfaceCard>
        </section>

        <CompareArtifact
          label="Why this wins"
          weaker={normalizeRenderText(recommendationPacket?.weaker_read || coach_comparison.weaker_read)}
          stronger={normalizeRenderText(recommendationPacket?.stronger_read || coach_comparison.stronger_read)}
        />

        <OpeningDirectiveArtifact
          seedLine={normalizeRenderText(openingModel.starterLine ?? strongest.draft_opening_seed)}
          steps={openingModel.scaffoldSteps.map((step) => normalizeRenderText(step))}
          whyItWins={normalizeRenderText(recommendationPacket?.why_this_direction || strongest.why_beats_obvious)}
          nextMove={normalizeRenderText(openingModel.nextParagraphInstruction || strongest.next_move)}
          avoidLines={openingModel.antiGenericWarnings.map((line) => normalizeRenderText(line))}
        />

        <details
          style={{
            marginBottom: '1rem',
            borderRadius: 'var(--radius-card-lg)',
            border: '1px solid rgba(17, 24, 39, 0.08)',
            background: 'rgba(255,255,255,0.72)',
            padding: '0.9rem 1rem',
          }}
        >
          <summary
            className="text-label"
            style={{ color: 'var(--color-judgment-accent)', cursor: 'pointer' }}
          >
            Support from your notes
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.85rem' }}>
            {evidenceItems.map((item, index) => (
              <EvidenceCard
                key={`${item.quote}-${index}`}
                fragment={item.quote}
                explanation={item.meaning}
              />
            ))}
          </div>
        </details>

        {personalizationLevel === 'high_personalization' && content && (
          <details
            style={{
              marginBottom: '1rem',
              borderRadius: 'var(--radius-card-lg)',
              border: '1px solid rgba(23, 58, 106, 0.1)',
              background: 'rgba(23, 58, 106, 0.04)',
              padding: '0.9rem 1rem',
            }}
          >
            <summary
              className="text-label"
              style={{ color: 'var(--color-judgment-accent)', cursor: 'pointer' }}
            >
              Extra strategy notes
            </summary>
            <section style={{ marginTop: '0.85rem' }}>
              <PatternSpecificGuidanceSection pattern={content.strongest.primary_cta_label} caseState={caseState} />
            </section>
          </details>
        )}

        <CTARegion>
          <button
            onClick={() => {
              setResumeDraft(openingModel.initialDraft || strongest.draft_opening_seed);
              if (coachMemory) {
                setCoachMemory({
                  ...coachMemory,
                  current_stage: 'opening',
                });
              }
              router.push('/start/opening');
            }}
            style={primaryCTA}
          >
            {strongest.primary_cta_label}
          </button>

          <div style={{ display: 'grid', gap: '0.4rem' }}>
            {strongest.focused_question && (
              <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                {normalizeRenderText(strongest.focused_question)}
              </p>
            )}
            <button
              onClick={() => {
                if (coachMemory) {
                  setCoachMemory({
                    ...coachMemory,
                    current_stage: 'question',
                    unresolved_ambiguity: strongest.focused_question,
                  });
                }
                router.push('/start/question');
              }}
              style={secondaryCTA}
            >
              {strongest.secondary_cta_label}
            </button>
          </div>

          {canCompare && (
            <button
              onClick={() => {
                const { name, payload } = buildEvent('fm_compare_view', 'direction');
                fireFmEvent(name, payload);
                if (coachMemory) {
                  setCoachMemory({
                    ...coachMemory,
                    current_stage: 'compare',
                  });
                }
                router.push('/start/compare');
              }}
              style={ghostCTA}
            >
              {strongest.tertiary_cta_label}
            </button>
          )}
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
        Finding the strongest thread…
      </p>
    </main>
  );
}

function PatternSpecificGuidanceSection({
  pattern,
  caseState,
}: {
  pattern: string;
  caseState: SessionCaseState | null;
}) {
  // Extract narrative pattern from intelligence (passed via context)
  const raw = typeof window !== 'undefined' ? sessionStorage.getItem('fm_intelligence') : null;
  const intelligence = raw ? JSON.parse(raw) : null;
  const narrativePattern = intelligence?.narrative_pattern?.primary_pattern;

  if (!narrativePattern) return null;

  const guidance = getPatternGuidance(narrativePattern, caseState);

  return (
    <div>
      <p className="text-label" style={{ marginBottom: '0.5rem', color: 'var(--color-judgment-accent)' }}>
        How to approach this direction
      </p>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div>
          <p className="text-small" style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Opening strategy
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            {guidance.opening_strategy}
          </p>
        </div>
        <div>
          <p className="text-small" style={{ margin: '0 0 0.25rem', fontWeight: 600, color: 'var(--color-text)' }}>
            Key principle
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            {guidance.key_principle}
          </p>
        </div>
      </div>
    </div>
  );
}

function buildEvidenceInsights(
  content: DirectionContent,
  caseState: SessionCaseState | null,
  strongest: DirectionContent['strongest'],
  canonicalPayload: CanonicalPage3Payload | null
): EvidenceInsight[] {
  const canonicalLines = canonicalPayload?.recommendation_packet.evidence_lines ?? [];
  const canonicalExplanations = canonicalPayload?.recommendation_packet.evidence_explanations ?? [];
  if (canonicalLines.length > 0) {
    return canonicalLines.slice(0, 3).map((line, index) => ({
      quote: clip(line),
      meaning:
        canonicalExplanations[index] ||
        'This is source language the selected direction is explicitly built from.',
    }));
  }

  const insights: EvidenceInsight[] = [];
  const addInsight = (quote: string, meaning: string) => {
    const clipped = clip(quote);
    if (!clipped || insights.some((item) => item.quote === clipped)) return;
    insights.push({ quote: clipped, meaning });
  };
  const selectedCandidate = content.candidate_pack?.find((candidate) => candidate.selected);
  const selectedAnchors = selectedCandidate?.source_anchor_spans ?? [];

  for (const anchor of selectedAnchors.slice(0, 3)) {
    addInsight(anchor, 'This is source language the selected direction is explicitly built from.');
  }

  if (insights.length >= 3) {
    return insights;
  }

  const scene = caseState ? getDominantScene(caseState) : null;
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const consequence = caseState ? getDominantConsequence(caseState) : null;

  if (scene) {
    addInsight(scene, 'Keep the setup concrete enough that the turn has somewhere to happen.');
  }

  if (turning) {
    addInsight(turning, 'This is the hinge sentence the recommendation should keep returning to.');
  }

  if (consequence) {
    addInsight(consequence, 'This proves what changed after the hinge instead of just naming a lesson.');
  }

  if (insights.length < 3 && caseState) {
    const transcript = caseState.raw_inputs
      .map((entry) => entry.text)
      .join(' ')
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 3);

    for (const line of transcript) {
      if (insights.length >= 3) break;
      addInsight(line, 'This is source language worth preserving instead of translating into theme words.');
    }
  }

  if (insights.length === 0) {
    addInsight(strongest.essay_about, 'This is the story thread the page is trying to protect.');
  }

  return insights.slice(0, 3);
}

function clip(text: string): string {
  const value = text.trim().replace(/^"+|"+$/g, '');
  if (!value) return '';
  return value.length > 120 ? `${value.slice(0, 117).trim()}…` : value;
}

function buildDecisionHeadline(primary: string | null | undefined, fallback: string): string {
  const normalized = normalizeRenderText(primary || fallback);
  const firstSentence = normalized.match(/^.*?[.!?](?=\s|$)/)?.[0]?.trim();
  return firstSentence || normalized;
}

function buildTopNextMove(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const normalized = normalizeRenderText(candidate || '');
    if (normalized) {
      return normalized;
    }
  }

  return 'Draft the opening around one scene, one decision, and one immediate result.';
}
