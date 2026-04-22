import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import { buildHandoffContract } from '@/lib/representation/handoff/buildHandoffContract';
import { buildDownstreamDirectionSurfaceCopy } from '@/lib/representation/pageBuilders/buildDownstreamDirectionSurfaceCopy';
import { block, buildSessionFromLiveState, cta, defaultCarryForwardKeys, type RepresentationPageBuild } from '@/lib/representation/pageBuilders/helpers';

export function buildComparisonPage(state: LiveDirectionSessionState): RepresentationPageBuild {
  const surfaceCopy = buildDownstreamDirectionSurfaceCopy(state);
  const pageContract = {
    pageRole: 'comparison' as const,
    pageId: 'direction-comparison',
    title: 'The stronger path.',
    subtitle: 'One version keeps the turn visible. The weaker path explains it too early.',
    blocks: [
      block('page_intro', 'compare-intro', {
        eyebrow: 'The stronger path',
        title: 'The stronger path.',
        subtitle: 'The weaker path loses because it explains the meaning too early.',
        support: 'Use this screen to decide what makes it stronger before you draft.',
      }),
      block('compare', 'compare-block', {
        label: 'The stronger path vs the weaker path',
        stronger: surfaceCopy.compareStronger,
        weaker: surfaceCopy.compareWeaker,
        judgment: `What makes it stronger: ${surfaceCopy.compareJudgment} Why it loses: the weaker path explains the lesson before the scene has done the work.`,
      }),
      block('next_move', 'compare-next', {
        label: 'Sharpen the difference first',
        title: 'What makes it stronger',
        bestNextStep: 'Build from the stronger path.',
        support: 'Only ask a question first if both versions still sound equally true.',
      }),
      block('cta_group', 'compare-related-ctas', {
        label: 'Related actions',
        ctas: [
          cta({ id: 'compare-back', label: 'Return to direction', actionType: 'route', targetRoute: '/start/direction', requiredStateKeys: ['selected_direction_id'], analyticsEvent: 'compare_back', variant: 'ghost' }),
        ],
      }),
    ],
    primaryCta: cta({
      id: 'compare-build-stronger',
      label: 'Build from the stronger path',
      actionType: 'route',
      targetRoute: '/start/direction',
      requiredStateKeys: ['selected_direction_id'],
      analyticsEvent: 'compare_build_stronger',
      variant: 'primary',
    }),
    secondaryCta: cta({
      id: 'compare-sharpen-difference',
      label: 'Sharpen the difference first',
      actionType: 'route_and_mutation',
      targetRoute: '/start/question',
      requiredStateKeys: ['selected_direction_id', 'compare_option_present'],
      analyticsEvent: 'compare_sharpen_difference',
      variant: 'secondary',
    }),
    requiredInputs: ['selected_direction_id', 'compare_option_present'],
    carryForwardKeys: defaultCarryForwardKeys(),
  };

  return buildSessionFromLiveState({
    state,
    pageContract,
    handoffState: buildHandoffContract({ fromPageId: pageContract.pageId, toPageId: 'direction-recommendation', state }),
    currentRoute: '/start/compare',
    priorRoutes: ['/start', '/start/direction'],
    nextRoutes: ['/start/direction', '/start/question'],
  });
}
