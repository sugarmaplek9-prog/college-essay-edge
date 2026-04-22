import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import {
  CARRY_FORWARD_KEYS,
  type CarryForwardKey,
  type RepresentationBlockContract,
  type RepresentationCtaContract,
  type RepresentationJourneySessionContract,
  type RepresentationPageContract,
  type RepresentationRecoveryContract,
} from '@/lib/representation/contracts';
import {
  buildAvailableStateKeys,
  buildCompareOptions,
  buildJourneySessionContract,
  buildRecoveryContract,
  buildSelectedDirectionContract,
} from '@/lib/representation/handoff/buildHandoffContract';

export type RepresentationPageBuild = {
  pageContract: RepresentationPageContract;
  journeySessionContract: RepresentationJourneySessionContract;
  availableStateKeys: string[];
};

export function defaultCarryForwardKeys(extra?: CarryForwardKey[]): string[] {
  const keys = [...CARRY_FORWARD_KEYS];
  for (const key of extra ?? []) {
    if (!keys.includes(key)) keys.push(key);
  }
  return [...keys];
}

export function cta(input: {
  id: string;
  label: string;
  actionType: RepresentationCtaContract['actionType'];
  targetRoute?: string;
  requiredStateKeys?: string[];
  analyticsEvent: string;
  variant?: RepresentationCtaContract['variant'];
}): RepresentationCtaContract {
  return {
    id: input.id,
    label: input.label,
    actionType: input.actionType,
    targetRoute: input.targetRoute,
    requiredStateKeys: input.requiredStateKeys ?? [],
    analyticsEvent: input.analyticsEvent,
    variant: input.variant,
  };
}

export function block(blockType: RepresentationBlockContract['blockType'], blockId: string, content: Record<string, unknown>, visible = true): RepresentationBlockContract {
  return { blockType, blockId, content, visible };
}

export function buildSessionFromLiveState(input: {
  state: LiveDirectionSessionState;
  pageContract: RepresentationPageContract;
  handoffState: RepresentationJourneySessionContract['handoffState'];
  recoveryState?: RepresentationRecoveryContract | null;
  currentRoute: string;
  priorRoutes: string[];
  nextRoutes: string[];
  draftText?: string;
}): RepresentationPageBuild {
  const availableStateKeys = buildAvailableStateKeys(input.state, input.draftText);
  return {
    pageContract: input.pageContract,
    availableStateKeys,
    journeySessionContract: buildJourneySessionContract({
      sessionId: input.state.canonicalPayload.session_id,
      currentPage: input.pageContract,
      selectedDirection: buildSelectedDirectionContract(input.state),
      compareOptions: buildCompareOptions(input.state),
      handoffState: input.handoffState,
      recoveryState: input.recoveryState ?? null,
      availableStateKeys,
      currentRoute: input.currentRoute,
      priorRoutes: input.priorRoutes,
      nextRoutes: input.nextRoutes,
    }),
  };
}

export function buildRecoverySession(input: {
  sessionId: string;
  pageContract: RepresentationPageContract;
  currentRoute: string;
  priorRoutes: string[];
  nextRoutes: string[];
  reasonCode: string;
  message: string;
  issues: string[];
  restartRoute?: string;
}): RepresentationPageBuild {
  const recoveryState = buildRecoveryContract(input.reasonCode, input.message, input.issues, input.restartRoute);
  return {
    pageContract: input.pageContract,
    availableStateKeys: [],
    journeySessionContract: buildJourneySessionContract({
      sessionId: input.sessionId,
      currentPage: input.pageContract,
      selectedDirection: null,
      compareOptions: [],
      handoffState: null,
      recoveryState,
      availableStateKeys: [],
      currentRoute: input.currentRoute,
      priorRoutes: input.priorRoutes,
      nextRoutes: input.nextRoutes,
    }),
  };
}
