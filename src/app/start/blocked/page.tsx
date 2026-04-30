'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';
import { buildCaseTranscript } from '@/lib/fm/case-state';
import { getStoredCaseState, setResumeDraft } from '@/lib/fm/clientSession';
import { RepresentationContractScripts } from '@/components/representation/renderPageFromContract';
import { buildJourneySessionContract } from '@/lib/representation/handoff/buildHandoffContract';
import type { RepresentationPageContract } from '@/lib/representation/contracts';
import { CTARegion, InteriorHeaderBlock, InteriorPageShell, SurfaceCard, primaryCTA, secondaryCTA } from '@/components/firstMinute/InteriorFlowSystem';

const BLOCKED_PAGE_CONTRACT: RepresentationPageContract = {
  pageRole: 'blocked',
  pageId: 'start-blocked',
  title: 'We need a little more to work with',
  subtitle: 'One more concrete detail or one focused follow-up gets you back into the direction flow.',
  blocks: [
    {
      blockType: 'recovery',
      blockId: 'start-blocked-recovery',
      visible: true,
      content: {
        label: 'Why we paused',
        title: 'We need a little more to work with',
        message: 'The signal is still too broad to trust. Add one concrete detail or take one focused follow-up to unlock the next direction call.',
        issues: [
          'Missing piece: one concrete hinge we can test against your own words.',
          'Fastest recovery: add what was said, what you noticed, or what happened right after the turn.',
        ],
      },
    },
  ],
  primaryCta: {
    id: 'blocked-add-detail',
    label: 'Add one concrete detail',
    actionType: 'recovery',
    targetRoute: '/start',
    requiredStateKeys: [],
    analyticsEvent: 'blocked_add_detail',
    variant: 'primary',
  },
  secondaryCta: {
    id: 'blocked-answer-question',
    label: 'Answer one focused question',
    actionType: 'route',
    targetRoute: '/start/question',
    requiredStateKeys: [],
    analyticsEvent: 'blocked_answer_question',
    variant: 'secondary',
  },
  requiredInputs: [],
  carryForwardKeys: [],
};

const BLOCKED_SESSION_CONTRACT = buildJourneySessionContract({
  sessionId: 'start-blocked-session',
  currentPage: BLOCKED_PAGE_CONTRACT,
  selectedDirection: null,
  compareOptions: [],
  handoffState: null,
  recoveryState: {
    reasonCode: 'insufficient-specificity',
    message: 'The direction signal is still too broad.',
    issues: ['Add one concrete detail or answer one focused question.'],
    restartRoute: '/start',
  },
  availableStateKeys: [],
  currentRoute: '/start/blocked',
  priorRoutes: ['/start'],
  nextRoutes: ['/start', '/start/question'],
});

export default function BlockedPage() {
  const router = useRouter();

  useEffect(() => {
    const { name, payload } = buildEvent('fm_blocked_view', 'blocked');
    fireFmEvent(name, payload);
  }, []);

  function handleAddMoreNotes() {
    const caseState = getStoredCaseState();
    if (caseState) {
      setResumeDraft(buildCaseTranscript(caseState));
    }
    router.push('/start');
  }

  return (
    <InteriorPageShell maxWidth="36rem">
      <div>
        <RepresentationContractScripts
          pageContract={BLOCKED_PAGE_CONTRACT}
          journeySessionContract={BLOCKED_SESSION_CONTRACT}
        />
        <InteriorHeaderBlock
          eyebrow="We need one more concrete detail"
          title="We need a little more to work with"
          subtitle="You did not do anything wrong. We need one concrete hinge before we can trust the next direction call."
        />

        <SurfaceCard label="Why we paused here" variant="coach" style={{ marginBottom: '1rem' }}>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
            What you shared gives us a direction family, but not yet one hinge we can trust enough to build on.
          </p>
          <p className="text-small" style={{ margin: '0.45rem 0 0', color: 'var(--color-muted)' }}>
            Add what was said, what you noticed, or what happened right after the moment shifted.
          </p>
          <p className="text-small" style={{ margin: '0.45rem 0 0', color: '#173a6a', fontWeight: 500 }}>
            A usable answer sounds like: “I stopped trying to sound certain and noticed everyone else stop talking too.”
          </p>
        </SurfaceCard>

        <CTARegion>
          <button
            onClick={handleAddMoreNotes}
            style={primaryCTA}
          >
            Add one concrete detail
          </button>

          <button
            onClick={() => router.push('/start/question')}
            style={secondaryCTA}
          >
            Answer one focused question
          </button>
        </CTARegion>

        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.8rem' }}>
          <p className="text-small" style={{ margin: 0, color: '#173a6a', fontWeight: 500 }}>
            Add one concrete detail → go back to your notes and fill the missing hinge.
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            Answer one focused question → take the shortest route into a stronger direction call.
          </p>
        </div>
      </div>
    </InteriorPageShell>
  );
}
