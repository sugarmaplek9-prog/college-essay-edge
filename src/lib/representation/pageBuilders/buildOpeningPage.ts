import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import { buildHandoffContract } from '@/lib/representation/handoff/buildHandoffContract';
import { buildDownstreamDirectionSurfaceCopy } from '@/lib/representation/pageBuilders/buildDownstreamDirectionSurfaceCopy';
import { block, buildSessionFromLiveState, cta, defaultCarryForwardKeys, type RepresentationPageBuild } from '@/lib/representation/pageBuilders/helpers';

export function buildOpeningPage(state: LiveDirectionSessionState, draftText: string): RepresentationPageBuild {
  const selected = state.selectedDirection;
  const surfaceCopy = buildDownstreamDirectionSurfaceCopy(state);
  const paragraphItems = selected.evidenceLines.map((item, index) => ({
    label: index === 0 ? 'Anchor' : index === 1 ? 'Shift' : 'Meaning',
    text: index === 0
      ? 'Open inside the scene detail that proves the turn.'
      : index === 1
        ? 'Let the interruption or correction change the direction of the paragraph.'
        : 'Name what changed only after the scene has landed.',
  }));

  const trimmedDraft = draftText.trim();
  const pageContract = {
    pageRole: 'opening_build' as const,
    pageId: 'opening-build',
    title: 'Draft the opening.',
    subtitle: surfaceCopy.directionTitle,
    blocks: [
      block('page_intro', 'opening-intro', {
        eyebrow: 'Draft the opening',
        title: 'Draft the opening.',
        subtitle: surfaceCopy.directionTitle,
        support: surfaceCopy.openingSupport,
      }),
      block('recommendation', 'opening-direction', {
        label: 'What this opening needs',
        title: 'What this paragraph has to prove',
        primaryClaim: surfaceCopy.primaryClaim,
        whyThisWins: `Build from the evidence: ${surfaceCopy.whyThisWins}`,
      }),
      block('evidence', 'opening-structure', {
        label: 'What the paragraph must do',
        items: paragraphItems,
      }),
      block('evidence', 'opening-evidence', {
        label: 'Source lines to keep on the page',
        items: selected.evidenceLines.map((item) => ({ quote: item.quote, explanation: item.explanation })),
      }),
      block('draft_seed', 'opening-draft', {
        label: 'Live opening draft',
        draftText,
        editable: true,
        rows: 10,
        ariaLabel: 'Opening draft',
        status: trimmedDraft
          ? 'This exact draft is what the workspace will carry forward.'
          : 'No draft is saved yet.',
      }),
      block('next_move', 'opening-next', {
        label: 'Next after this save',
        title: 'What to prove next.',
        bestNextStep: surfaceCopy.bestNextStep,
        support: 'Save opening and continue to workspace.',
      }),
      block('handoff_summary', 'opening-handoff', {
        label: 'What happens after save',
        summary: `Continue into the Personal Statement workspace with this same direction and draft. ${surfaceCopy.workspaceSummary}`,
        bullets: [
          'You should see one live draft there.',
          'The authorship boundary stays visible.',
          'The hinge should stay intact.',
        ],
      }),
      block('cta_group', 'opening-related-ctas', {
        label: 'If you want to check the handoff',
        ctas: [
          cta({ id: 'opening-workspace-link', label: 'Open workspace', actionType: 'route', targetRoute: '/app/personal-statement?tab=drafts&entry=opening-handoff', requiredStateKeys: ['selected_direction_id', 'opening_seed'], analyticsEvent: 'opening_workspace_link', variant: 'ghost' }),
        ],
      }),
    ],
    primaryCta: cta({
      id: 'opening-save-workspace',
      label: 'Save opening and continue to workspace',
      actionType: 'route_and_mutation',
      targetRoute: '/app/personal-statement?tab=drafts&entry=opening-handoff',
      requiredStateKeys: ['selected_direction_id'],
      analyticsEvent: 'opening_save_workspace',
      variant: 'primary',
    }),
    secondaryCta: cta({
      id: 'opening-sharpen',
      label: 'Sharpen this opening',
      actionType: 'route_and_mutation',
      targetRoute: '/start/question',
      requiredStateKeys: ['selected_direction_id'],
      analyticsEvent: 'opening_sharpen',
      variant: 'secondary',
    }),
    requiredInputs: ['selected_direction_id', 'evidence_lines', 'primary_claim'],
    carryForwardKeys: defaultCarryForwardKeys(),
  };

  return buildSessionFromLiveState({
    state,
    pageContract,
    handoffState: buildHandoffContract({ fromPageId: pageContract.pageId, toPageId: 'workspace-personal-statement', state, openingSeed: draftText }),
    currentRoute: '/start/opening',
    priorRoutes: ['/start', '/start/direction'],
    nextRoutes: ['/app/personal-statement', '/start/question'],
    draftText,
  });
}
