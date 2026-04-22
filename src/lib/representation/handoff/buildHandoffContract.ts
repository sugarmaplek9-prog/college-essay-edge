import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import {
  REPRESENTATION_VERSION,
  type RepresentationCompareOptionContract,
  type RepresentationHandoffContract,
  type RepresentationJourneySessionContract,
  type RepresentationPageContract,
  type RepresentationRecoveryContract,
  type RepresentationSelectedDirectionContract,
} from '@/lib/representation/contracts';

function toOptionId(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'compare-option';
}

export function buildSelectedDirectionContract(state: LiveDirectionSessionState): RepresentationSelectedDirectionContract {
  return {
    selectedDirectionId: state.canonicalPayload.candidate_debug.winner_id,
    selectedDirectionLabel: state.selectedDirection.strongestDirection,
    primaryClaim: state.selectedDirection.recommendationText,
    evidenceLines: state.selectedDirection.evidenceLines.map((item) => item.quote),
    whyThisWins: state.selectedDirection.whyWins,
    whatCouldFail: state.selectedDirection.risk,
    bestNextStep: state.selectedDirection.bestNextMove,
    openingSeed: state.openingDraft || state.selectedDirection.evidenceLines[0]?.quote || '',
    originatingCaseOrSessionId: state.canonicalPayload.session_id,
    representationVersion: REPRESENTATION_VERSION,
  };
}

export function buildCompareOptions(state: LiveDirectionSessionState): RepresentationCompareOptionContract[] {
  const selected = buildSelectedDirectionContract(state);
  const base: RepresentationCompareOptionContract[] = [
    {
      optionId: selected.selectedDirectionId,
      label: selected.selectedDirectionLabel,
      whyItLosesOrWins: state.canonicalPayload.recommendation_packet.stronger_read,
      risk: selected.whatCouldFail,
      isSelected: true,
    },
  ];

  if (!state.compareAlternative) return base;

  base.push({
    optionId: toOptionId(state.compareAlternative.title),
    label: state.compareAlternative.title,
    whyItLosesOrWins: state.compareAlternative.why_it_works_or_loses,
    risk: state.compareAlternative.risk_if_written_this_way,
    isSelected: false,
  });

  return base;
}

export function buildAvailableStateKeys(state: LiveDirectionSessionState, draftText?: string): string[] {
  const selected = buildSelectedDirectionContract(state);
  const keys = [
    'selected_direction_id',
    'selected_direction_label',
    'primary_claim',
    'evidence_lines',
    'why_this_wins',
    'what_could_fail',
    'best_next_step',
    'originating_case_or_session_id',
    'representation_version',
  ];

  if ((draftText ?? state.openingDraft).trim()) {
    keys.push('opening_seed');
  }

  if (state.compareAlternative) {
    keys.push('compare_option_present');
  }

  if (state.openingDraft.trim()) {
    keys.push('workspace_draft');
  }

  if (state.selectedDirection.bestNextMove.trim()) {
    keys.push('next_step_visible');
  }

  return keys;
}

export function buildHandoffContract(input: {
  fromPageId: string;
  toPageId: string;
  state: LiveDirectionSessionState;
  openingSeed?: string;
}): RepresentationHandoffContract {
  const selected = buildSelectedDirectionContract(input.state);
  return {
    fromPageId: input.fromPageId,
    toPageId: input.toPageId,
    selectedDirectionId: selected.selectedDirectionId,
    primaryClaim: selected.primaryClaim,
    evidenceLines: selected.evidenceLines,
    whyThisWins: selected.whyThisWins,
    whatCouldFail: selected.whatCouldFail,
    bestNextStep: selected.bestNextStep,
    openingSeed: input.openingSeed ?? selected.openingSeed,
  };
}

export function buildRecoveryContract(reasonCode: string, message: string, issues: string[], restartRoute = '/start'): RepresentationRecoveryContract {
  return {
    reasonCode,
    message,
    issues,
    restartRoute,
  };
}

export function buildJourneySessionContract(input: {
  sessionId: string;
  currentPage: RepresentationPageContract;
  selectedDirection: RepresentationSelectedDirectionContract | null;
  compareOptions: RepresentationCompareOptionContract[];
  handoffState: RepresentationHandoffContract | null;
  recoveryState: RepresentationRecoveryContract | null;
  availableStateKeys: string[];
  currentRoute: string;
  priorRoutes: string[];
  nextRoutes: string[];
}): RepresentationJourneySessionContract {
  return {
    sessionId: input.sessionId,
    representationVersion: REPRESENTATION_VERSION,
    routePlan: {
      currentRoute: input.currentRoute,
      priorRoutes: input.priorRoutes,
      nextRoutes: input.nextRoutes,
    },
    selectedDirection: input.selectedDirection,
    compareOptions: input.compareOptions,
    currentPage: input.currentPage,
    handoffState: input.handoffState,
    recoveryState: input.recoveryState,
    availableStateKeys: input.availableStateKeys,
  };
}
