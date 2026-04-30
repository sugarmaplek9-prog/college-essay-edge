import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import { buildDownstreamDirectionSurfaceCopy } from '@/lib/representation/pageBuilders/buildDownstreamDirectionSurfaceCopy';
import { block, buildSessionFromLiveState, cta, defaultCarryForwardKeys, type RepresentationPageBuild } from '@/lib/representation/pageBuilders/helpers';

type WorkspaceTab = 'direction' | 'drafts' | 'feedback';

function countWords(text: string): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return normalized.split(/\s+/).length;
}

export function buildWorkspacePage(state: LiveDirectionSessionState, tab: WorkspaceTab, entry?: string): RepresentationPageBuild {
  const selected = state.selectedDirection;
  const surfaceCopy = buildDownstreamDirectionSurfaceCopy(state);
  const draftWords = countWords(state.openingDraft);
  const draftPresent = Boolean(state.openingDraft.trim());
  const primaryWorkspaceAction = draftPresent ? 'Edit the saved opening' : 'Edit the saved opening';
  const primaryWorkspaceTarget = '/start/opening';
  const secondaryWorkspaceAction = 'Open the next package workspace';

  const pageContract = {
    pageRole: 'workspace' as const,
    pageId: 'workspace-personal-statement',
    title: 'Personal Statement Workspace',
    subtitle: 'One live direction. One live draft. No invented feedback.',
    blocks: [
      block('page_intro', 'workspace-intro', {
        title: 'Personal Statement Workspace',
        subtitle: 'One live direction. One live draft. One next move.',
        support: entry === 'opening-handoff' ? 'Your saved opening is now the live draft.' : 'Keep moving the same direction forward.',
      }),
      block('handoff_summary', 'workspace-handoff', {
        label: 'Workflow progression',
        title: 'Same direction. Same draft.',
        summary: 'The first-minute choice carried into this workspace, so the next move stays specific.',
        bullets: [
          `Now: ${tab === 'direction' ? 'check the recommendation pressure' : tab === 'drafts' ? 'edit the saved opening' : 'decide whether feedback is worth asking for yet'}`,
          `Direction carried forward: ${surfaceCopy.workspaceDirectionLabel}`,
          `After that: move the same hinge into supplements when the draft feels real.`,
        ],
      }, entry === 'opening-handoff'),
      block('recommendation', 'workspace-direction', {
        label: 'Selected direction',
        title: surfaceCopy.directionTitle,
        primaryClaim: surfaceCopy.primaryClaim,
        whyThisWins: `Why it still wins: ${surfaceCopy.whyThisWins}`,
      }),
      block('student_truth', 'workspace-feedback-truth', {
        label: 'Feedback',
        title: 'No live feedback artifact yet.',
        summary: draftWords < 80
          ? 'Feedback remains unavailable until a live artifact exists.'
          : 'Feedback remains unavailable until a live artifact exists.',
        items: [
          `Next action: ${draftPresent ? 'Edit the saved opening and keep the hinge visible.' : 'Write the opening from the selected direction.'}`,
          'Boundary: coaching, not a rewrite engine. Authorship stays with the student.',
        ],
      }),
      block('draft_seed', 'workspace-draft', {
        label: 'Drafts',
        title: draftPresent ? 'Live draft' : 'No live draft yet.',
        draftText: draftPresent ? state.openingDraft : 'Save an opening from the first-minute flow before treating this workspace like a draft surface.',
        editable: false,
        status: draftPresent
          ? 'Best next action: edit the saved opening before you widen the package.'
          : 'Best next action: write the opening from the selected direction.',
      }),
      block('next_move', 'workspace-next', {
        label: 'Next move',
        title: 'Do this next.',
        bestNextStep: draftPresent ? 'Edit the saved opening, then open the next package workspace.' : 'Write the opening first, then carry the same hinge forward.',
        support: 'The workspace is only useful if it helps you move forward now.',
      }),
    ],
    primaryCta: cta({
      id: 'workspace-primary',
      label: primaryWorkspaceAction,
      actionType: 'route',
      targetRoute: primaryWorkspaceTarget,
      requiredStateKeys: ['selected_direction_id'],
      analyticsEvent: 'workspace_primary_action',
      variant: 'primary',
    }),
    secondaryCta: cta({
      id: 'workspace-secondary',
      label: secondaryWorkspaceAction,
      actionType: 'route',
      targetRoute: '/app/supplements',
      requiredStateKeys: ['selected_direction_id', 'next_step_visible'],
      analyticsEvent: 'workspace_next_package_secondary',
      variant: 'secondary',
    }),
    requiredInputs: ['selected_direction_id', 'primary_claim', 'opening_seed'],
    carryForwardKeys: defaultCarryForwardKeys(),
  };

  return buildSessionFromLiveState({
    state,
    pageContract,
    handoffState: {
      fromPageId: 'opening-build',
      toPageId: pageContract.pageId,
      selectedDirectionId: state.canonicalPayload.candidate_debug.winner_id,
      primaryClaim: selected.recommendationText,
      evidenceLines: selected.evidenceLines.map((item) => item.quote),
      whyThisWins: selected.whyWins,
      whatCouldFail: selected.risk,
      bestNextStep: selected.bestNextMove,
      openingSeed: state.openingDraft,
    },
    currentRoute: '/app/personal-statement',
    priorRoutes: ['/start', '/start/direction', '/start/opening'],
    nextRoutes: ['/start/opening', '/app/supplements', '/start/compare'],
  });
}
