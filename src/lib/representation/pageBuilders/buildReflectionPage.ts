import { buildJourneySessionContract } from '@/lib/representation/handoff/buildHandoffContract';
import { block, cta, defaultCarryForwardKeys, type RepresentationPageBuild } from '@/lib/representation/pageBuilders/helpers';

export function buildReflectionPage(): RepresentationPageBuild {
  const pageContract = {
    pageRole: 'reflection' as const,
    pageId: 'reflection-alias',
    title: 'The decision is ready.',
    subtitle: 'Use this stop to trust the call, then move straight into the live direction screen.',
    blocks: [
      block('page_intro', 'reflection-intro', {
        eyebrow: 'The decision',
        title: 'The decision is ready.',
        subtitle: 'This stop exists to move you into the live direction screen without losing trust or momentum.',
        support: 'Build from this direction on the next page instead of restarting the decision.',
      }),
      block('handoff_summary', 'reflection-summary', {
        label: 'Why we can trust this call',
        title: 'What is true right now.',
        summary: 'The strongest angle is already selected. This route is only a fast handoff into the live recommendation.',
        bullets: ['You are not deciding again here.', 'Next stop: the live direction screen.', 'That page shows why it wins and what to draft next.'],
      }),
      block('next_move', 'reflection-next', {
        label: 'Next move',
        title: 'Build from this direction.',
        bestNextStep: 'Open the live direction screen now, then draft from the same hinge.',
        support: 'Keep moving forward. Do not restart the intake unless the direction feels wrong.',
      }),
    ],
    primaryCta: cta({
      id: 'reflection-go-direction',
      label: 'Build from this direction',
      actionType: 'route',
      targetRoute: '/start/direction',
      analyticsEvent: 'reflection_go_direction',
      variant: 'primary',
      requiredStateKeys: [],
    }),
    secondaryCta: cta({
      id: 'reflection-return-start',
      label: 'Return to start',
      actionType: 'route',
      targetRoute: '/start',
      analyticsEvent: 'reflection_return_start',
      variant: 'secondary',
      requiredStateKeys: [],
    }),
    requiredInputs: [],
    carryForwardKeys: defaultCarryForwardKeys(),
  };

  return {
    pageContract,
    availableStateKeys: [],
    journeySessionContract: buildJourneySessionContract({
      sessionId: 'reflection-alias',
      currentPage: pageContract,
      selectedDirection: null,
      compareOptions: [],
      handoffState: null,
      recoveryState: null,
      availableStateKeys: [],
      currentRoute: '/start/reflecting',
      priorRoutes: ['/start'],
      nextRoutes: ['/start/direction'],
    }),
  };
}
