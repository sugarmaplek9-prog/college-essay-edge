'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildEvent, fireFmEvent } from '@/lib/fm/events';
import {
  FM_CLARIFICATION_PAYLOAD_KEY,
  getCoachMemory,
  setCoachMemory,
  setResumeDraft,
} from '@/lib/fm/clientSession';
import { readLiveDirectionSession, type LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import type { ProductMode } from '@/types/intake';
import type { CoachMemoryState } from '@/lib/fm/coachBehavior';
import { InteriorPageShell } from '@/components/firstMinute/InteriorFlowSystem';
import RenderPageFromContract from '@/components/representation/renderPageFromContract';
import type { RepresentationCtaContract } from '@/lib/representation/contracts';
import { buildRecommendationPage } from '@/lib/representation/pageBuilders/buildRecommendationPage';
import { buildRecoveryPage } from '@/lib/representation/pageBuilders/buildRecoveryPage';
import { buildRecoverySession } from '@/lib/representation/pageBuilders/helpers';

export function DirectionRepresentationPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<LiveDirectionSessionState | null>(null);
  const [recoveryIssues, setRecoveryIssues] = useState<string[] | null>(null);

  useEffect(() => {
    const productMode = (sessionStorage.getItem('fm_product_mode') as ProductMode | null) ?? 'direction_full';

    if (productMode === 'blocked') {
      router.replace('/start/blocked');
      return;
    }

    if (productMode === 'clarification' || productMode === 'blank_page_intake') {
      router.replace('/start/question');
      return;
    }

    const result = readLiveDirectionSession(sessionStorage);
    if (!result.ok) {
      setRecoveryIssues(result.issues);
      return;
    }

    setSessionState(result.state);

    const { name, payload } = buildEvent('fm_direction_view', 'direction', {
      pattern: result.state.intelligence.narrative_pattern.primary_pattern,
      viability: result.state.intelligence.recommendation_viability.decision,
      reduced_scope: result.state.directionContent.is_reduced_scope,
    });
    fireFmEvent(name, payload);
  }, [router]);

  if (recoveryIssues) {
    const pageContract = buildRecoveryPage({
      pageId: 'direction-recommendation-recovery',
      pageRole: 'recovery',
      title: 'Live selected-direction packet is missing or malformed.',
      message: 'The recommendation page only renders from the live selected-direction contract. That contract is missing or malformed, so the page is failing closed.',
      issues: recoveryIssues,
    });
    const build = buildRecoverySession({
      sessionId: 'direction-recovery',
      pageContract,
      currentRoute: '/start/direction',
      priorRoutes: ['/start'],
      nextRoutes: ['/start'],
      reasonCode: 'missing-direction-contract',
      message: 'Direction contract is unavailable.',
      issues: recoveryIssues,
    });

    return (
      <InteriorPageShell maxWidth="42rem">
        <RenderPageFromContract
          pageContract={build.pageContract}
          journeySessionContract={build.journeySessionContract}
          availableStateKeys={build.availableStateKeys}
          onSelectCta={(cta) => cta.targetRoute && router.push(cta.targetRoute)}
        />
      </InteriorPageShell>
    );
  }

  if (!sessionState) {
    return <Skeleton message="Loading selected direction…" />;
  }

  const liveState = sessionState;
  const build = buildRecommendationPage(liveState);

  function handleCta(cta: RepresentationCtaContract) {
    if (cta.id === 'direction-draft-opening') {
      const seedDraft = liveState.openingDraft || liveState.selectedDirection.evidenceLines[0]?.quote || '';
      setResumeDraft(seedDraft);
      sessionStorage.setItem('fm_opening_draft', seedDraft);
      const priorMemory = getCoachMemory<CoachMemoryState>();
      if (priorMemory) {
        setCoachMemory({
          ...priorMemory,
          current_stage: 'opening',
        });
      }
    }

    if (cta.id === 'direction-sharpen') {
      sessionStorage.setItem(
        FM_CLARIFICATION_PAYLOAD_KEY,
        JSON.stringify({
          possibleAngleLabel: 'Sharpening the selected direction',
          whyNotLockedYet: `${liveState.selectedDirection.whyWins} ${liveState.selectedDirection.risk}`,
          missingDetailTargets: ['direction_sharpening'],
          primaryQuestion: liveState.directionContent.strongest.focused_question,
          returnTarget: 'direction',
        }),
      );
    }

    if (cta.targetRoute) {
      router.push(cta.targetRoute);
    }
  }

  return (
    <InteriorPageShell maxWidth="44rem">
      <RenderPageFromContract
        pageContract={build.pageContract}
        journeySessionContract={build.journeySessionContract}
        availableStateKeys={build.availableStateKeys}
        onSelectCta={handleCta}
      />
    </InteriorPageShell>
  );
}

function Skeleton({ message }: { message: string }) {
  return (
    <main
      data-app-eval-ready="pending"
      style={{
        minHeight: '100svh',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p className="text-body" style={{ color: 'var(--color-muted)' }}>
        {message}
      </p>
    </main>
  );
}
