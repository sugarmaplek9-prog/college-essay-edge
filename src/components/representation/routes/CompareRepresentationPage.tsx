'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildEvent, fireFmEvent } from '@/lib/fm/events';
import { FM_CLARIFICATION_PAYLOAD_KEY } from '@/lib/fm/clientSession';
import { readLiveDirectionSession, type LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import type { ProductMode } from '@/types/intake';
import { InteriorPageShell } from '@/components/firstMinute/InteriorFlowSystem';
import RenderPageFromContract from '@/components/representation/renderPageFromContract';
import { buildComparisonPage } from '@/lib/representation/pageBuilders/buildComparisonPage';
import { buildRecoveryPage } from '@/lib/representation/pageBuilders/buildRecoveryPage';
import { buildRecoverySession } from '@/lib/representation/pageBuilders/helpers';
import type { RepresentationCtaContract } from '@/lib/representation/contracts';

export function CompareRepresentationPage() {
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

    const { name, payload } = buildEvent('fm_compare_view', 'compare', {
      pattern: result.state.intelligence.narrative_pattern.primary_pattern,
    });
    fireFmEvent(name, payload);
  }, [router]);

  if (recoveryIssues) {
    const pageContract = buildRecoveryPage({
      pageId: 'direction-compare-recovery',
      pageRole: 'recovery',
      title: 'Live comparison state is missing or malformed.',
      message: 'The compare screen only renders from the live recommendation handoff. That handoff is missing or malformed, so the page is failing closed.',
      issues: recoveryIssues,
    });
    const build = buildRecoverySession({
      sessionId: 'compare-recovery',
      pageContract,
      currentRoute: '/start/compare',
      priorRoutes: ['/start', '/start/direction'],
      nextRoutes: ['/start'],
      reasonCode: 'missing-compare-contract',
      message: 'Compare state is unavailable.',
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
    return <Skeleton message="Loading comparison…" />;
  }

  const liveState = sessionState;
  const build = buildComparisonPage(liveState);

  function handleCta(cta: RepresentationCtaContract) {
    if (cta.id === 'compare-sharpen-difference') {
      sessionStorage.setItem(
        FM_CLARIFICATION_PAYLOAD_KEY,
        JSON.stringify({
          possibleAngleLabel: 'Sharpening the comparison',
          whyNotLockedYet: 'One detail can make the stronger path feel inevitable instead of plausible.',
          missingDetailTargets: ['direction_discrimination'],
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
