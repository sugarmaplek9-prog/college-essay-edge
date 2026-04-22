'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FM_CLARIFICATION_PAYLOAD_KEY,
  setCoachMemory,
  setOpeningDraft,
  setResumeDraft,
} from '@/lib/fm/clientSession';
import { readLiveDirectionSession, type LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import type { ProductMode } from '@/types/intake';
import { InteriorPageShell } from '@/components/firstMinute/InteriorFlowSystem';
import RenderPageFromContract from '@/components/representation/renderPageFromContract';
import type { RepresentationCtaContract } from '@/lib/representation/contracts';
import { buildOpeningPage } from '@/lib/representation/pageBuilders/buildOpeningPage';
import { buildRecoveryPage } from '@/lib/representation/pageBuilders/buildRecoveryPage';
import { buildRecoverySession } from '@/lib/representation/pageBuilders/helpers';

export function OpeningRepresentationPage() {
  const router = useRouter();
  const [sessionState, setSessionState] = useState<LiveDirectionSessionState | null>(null);
  const [draft, setDraft] = useState('');
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
    setDraft(result.state.openingDraft || result.state.selectedDirection.evidenceLines[0]?.quote || '');
  }, [router]);

  if (recoveryIssues) {
    const pageContract = buildRecoveryPage({
      pageId: 'opening-build-recovery',
      pageRole: 'recovery',
      title: 'Live opening handoff is missing or malformed.',
      message: 'The opening page only renders from the live selected-direction handoff. That handoff is missing or malformed, so the page is failing closed.',
      issues: recoveryIssues,
    });
    const build = buildRecoverySession({
      sessionId: 'opening-recovery',
      pageContract,
      currentRoute: '/start/opening',
      priorRoutes: ['/start', '/start/direction'],
      nextRoutes: ['/start'],
      reasonCode: 'missing-opening-contract',
      message: 'Opening contract is unavailable.',
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
    return <Skeleton />;
  }

  const liveState = sessionState;
  const build = buildOpeningPage(liveState, draft);

  function handleCta(cta: RepresentationCtaContract) {
    if (cta.id === 'opening-save-workspace') {
      setOpeningDraft(draft);
      setResumeDraft(draft);
      setCoachMemory({
        current_stage: 'opening',
        last_student_answer: draft,
      });
    }

    if (cta.id === 'opening-sharpen') {
      setOpeningDraft(draft);
      sessionStorage.setItem(
        FM_CLARIFICATION_PAYLOAD_KEY,
        JSON.stringify({
          possibleAngleLabel: 'Sharpening your opening',
          whyNotLockedYet: `${liveState.selectedDirection.whyWins} ${liveState.selectedDirection.risk}`,
          missingDetailTargets: ['opening_specificity'],
          primaryQuestion: liveState.directionContent.strongest.focused_question,
          returnTarget: 'opening',
        }),
      );
    }

    if (cta.targetRoute) {
      router.push(cta.targetRoute);
    }
  }

  return (
    <InteriorPageShell maxWidth="42rem">
      <RenderPageFromContract
        pageContract={build.pageContract}
        journeySessionContract={build.journeySessionContract}
        availableStateKeys={build.availableStateKeys}
        draftText={draft}
        onDraftChange={setDraft}
        onSelectCta={handleCta}
      />
    </InteriorPageShell>
  );
}

function Skeleton() {
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
        Loading opening workspace…
      </p>
    </main>
  );
}
