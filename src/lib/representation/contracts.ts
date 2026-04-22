export const REPRESENTATION_VERSION = 'representation-layer-v1';

export type RepresentationPageRole =
  | 'intake'
  | 'reflection'
  | 'recommendation'
  | 'comparison'
  | 'opening_build'
  | 'workspace'
  | 'recovery'
  | 'blocked';

export type RepresentationBlockType =
  | 'page_intro'
  | 'student_truth'
  | 'recommendation'
  | 'evidence'
  | 'risk'
  | 'next_move'
  | 'compare'
  | 'handoff_summary'
  | 'draft_seed'
  | 'recovery'
  | 'cta_group';

export type RepresentationCtaActionType = 'route' | 'mutation' | 'route_and_mutation' | 'recovery';

export type RepresentationRoutePlan = {
  currentRoute: string;
  priorRoutes: string[];
  nextRoutes: string[];
};

export type RepresentationSelectedDirectionContract = {
  selectedDirectionId: string;
  selectedDirectionLabel: string;
  primaryClaim: string;
  evidenceLines: string[];
  whyThisWins: string;
  whatCouldFail: string;
  bestNextStep: string;
  openingSeed?: string;
  originatingCaseOrSessionId: string;
  representationVersion: string;
};

export type RepresentationCompareOptionContract = {
  optionId: string;
  label: string;
  whyItLosesOrWins: string;
  risk: string;
  isSelected: boolean;
};

export type RepresentationRecoveryContract = {
  reasonCode: string;
  message: string;
  issues: string[];
  restartRoute: string;
};

export type RepresentationCtaContract = {
  id: string;
  label: string;
  actionType: RepresentationCtaActionType;
  targetRoute?: string;
  requiredStateKeys: string[];
  analyticsEvent: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

export type RepresentationBlockContract = {
  blockType: RepresentationBlockType;
  blockId: string;
  visible: boolean;
  content: Record<string, unknown>;
};

export type RepresentationPageContract = {
  pageRole: RepresentationPageRole;
  pageId: string;
  title: string;
  subtitle?: string;
  blocks: RepresentationBlockContract[];
  primaryCta: RepresentationCtaContract | null;
  secondaryCta?: RepresentationCtaContract | null;
  requiredInputs: string[];
  carryForwardKeys: string[];
};

export type RepresentationHandoffContract = {
  fromPageId: string;
  toPageId: string;
  selectedDirectionId: string;
  primaryClaim: string;
  evidenceLines: string[];
  whyThisWins: string;
  whatCouldFail: string;
  bestNextStep: string;
  openingSeed?: string;
};

export type RepresentationJourneySessionContract = {
  sessionId: string;
  representationVersion: string;
  routePlan: RepresentationRoutePlan;
  selectedDirection: RepresentationSelectedDirectionContract | null;
  compareOptions: RepresentationCompareOptionContract[];
  currentPage: RepresentationPageContract;
  handoffState: RepresentationHandoffContract | null;
  recoveryState: RepresentationRecoveryContract | null;
  availableStateKeys: string[];
};

export type RepresentationValidationResult = {
  valid: boolean;
  issues: string[];
};

export const CARRY_FORWARD_KEYS = [
  'selected_direction_id',
  'selected_direction_label',
  'primary_claim',
  'evidence_lines',
  'why_this_wins',
  'what_could_fail',
  'best_next_step',
  'opening_seed',
  'originating_case_or_session_id',
  'representation_version',
] as const;

export type CarryForwardKey = (typeof CARRY_FORWARD_KEYS)[number];
