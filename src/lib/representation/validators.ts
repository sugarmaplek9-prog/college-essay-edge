import {
  CARRY_FORWARD_KEYS,
  type RepresentationBlockContract,
  type RepresentationCtaContract,
  type RepresentationHandoffContract,
  type RepresentationJourneySessionContract,
  type RepresentationPageContract,
  type RepresentationValidationResult,
} from '@/lib/representation/contracts';
import { REQUIRED_BLOCKS_BY_PAGE_ROLE } from '@/lib/representation/blockRegistry';

function ok(): RepresentationValidationResult {
  return { valid: true, issues: [] };
}

function fail(issues: string[]): RepresentationValidationResult {
  return { valid: issues.length === 0, issues };
}

export function validateCtaContract(cta: RepresentationCtaContract | null | undefined): RepresentationValidationResult {
  if (!cta) return ok();

  const issues: string[] = [];
  if (!cta.id.trim()) issues.push('cta.id is required');
  if (!cta.label.trim()) issues.push('cta.label is required');
  if (!cta.analyticsEvent.trim()) issues.push('cta.analyticsEvent is required');
  if ((cta.actionType === 'route' || cta.actionType === 'route_and_mutation' || cta.actionType === 'recovery') && !cta.targetRoute?.trim()) {
    issues.push(`cta ${cta.id} requires targetRoute for actionType ${cta.actionType}`);
  }
  return fail(issues);
}

export function validateBlockContract(block: RepresentationBlockContract): RepresentationValidationResult {
  const issues: string[] = [];
  if (!block.blockId.trim()) issues.push('block.blockId is required');
  if (!block.visible) return ok();

  const content = block.content ?? {};
  switch (block.blockType) {
    case 'page_intro':
      if (typeof content.title !== 'string' || !content.title.trim()) issues.push(`${block.blockId}: page_intro requires title`);
      break;
    case 'recommendation':
      if (typeof content.primaryClaim !== 'string' || !content.primaryClaim.trim()) issues.push(`${block.blockId}: recommendation requires primaryClaim`);
      break;
    case 'evidence':
      if (!Array.isArray(content.items) || content.items.length === 0) issues.push(`${block.blockId}: evidence requires items`);
      break;
    case 'risk':
      if (typeof content.whatCouldFail !== 'string' || !content.whatCouldFail.trim()) issues.push(`${block.blockId}: risk requires whatCouldFail`);
      break;
    case 'next_move':
      if (typeof content.bestNextStep !== 'string' || !content.bestNextStep.trim()) issues.push(`${block.blockId}: next_move requires bestNextStep`);
      break;
    case 'compare':
      if (typeof content.stronger !== 'string' || typeof content.weaker !== 'string') issues.push(`${block.blockId}: compare requires stronger and weaker`);
      break;
    case 'handoff_summary':
      if (typeof content.summary !== 'string' || !content.summary.trim()) issues.push(`${block.blockId}: handoff_summary requires summary`);
      break;
    case 'draft_seed':
      if (typeof content.draftText !== 'string') issues.push(`${block.blockId}: draft_seed requires draftText`);
      break;
    case 'recovery':
      if (typeof content.message !== 'string' || !content.message.trim()) issues.push(`${block.blockId}: recovery requires message`);
      break;
    case 'cta_group':
      if (!Array.isArray(content.ctas)) issues.push(`${block.blockId}: cta_group requires ctas`);
      break;
    case 'student_truth':
      if (typeof content.summary !== 'string' && !Array.isArray(content.items)) issues.push(`${block.blockId}: student_truth requires summary or items`);
      break;
  }

  return fail(issues);
}

export function validatePageContract(page: RepresentationPageContract): RepresentationValidationResult {
  const issues: string[] = [];
  if (!page.pageId.trim()) issues.push('page.pageId is required');
  if (!page.title.trim()) issues.push('page.title is required');

  const requiredBlocks = REQUIRED_BLOCKS_BY_PAGE_ROLE[page.pageRole] ?? [];
  const visibleBlockTypes = new Set(page.blocks.filter((block) => block.visible).map((block) => block.blockType));
  for (const blockType of requiredBlocks) {
    if (!visibleBlockTypes.has(blockType)) {
      issues.push(`page ${page.pageId} missing required block ${blockType}`);
    }
  }

  for (const block of page.blocks) {
    issues.push(...validateBlockContract(block).issues);
  }

  issues.push(...validateCtaContract(page.primaryCta).issues);
  issues.push(...validateCtaContract(page.secondaryCta).issues);

  const unknownCarryKeys = page.carryForwardKeys.filter((key) => !CARRY_FORWARD_KEYS.includes(key as never));
  if (unknownCarryKeys.length > 0) {
    issues.push(`page ${page.pageId} uses unknown carryForwardKeys: ${unknownCarryKeys.join(', ')}`);
  }

  return fail(issues);
}

export function validateHandoffContract(handoff: RepresentationHandoffContract | null | undefined): RepresentationValidationResult {
  if (!handoff) return ok();
  const issues: string[] = [];
  if (!handoff.fromPageId.trim()) issues.push('handoff.fromPageId is required');
  if (!handoff.toPageId.trim()) issues.push('handoff.toPageId is required');
  if (!handoff.selectedDirectionId.trim()) issues.push('handoff.selectedDirectionId is required');
  if (!handoff.primaryClaim.trim()) issues.push('handoff.primaryClaim is required');
  if (!handoff.whyThisWins.trim()) issues.push('handoff.whyThisWins is required');
  if (!handoff.whatCouldFail.trim()) issues.push('handoff.whatCouldFail is required');
  if (!handoff.bestNextStep.trim()) issues.push('handoff.bestNextStep is required');
  if (!Array.isArray(handoff.evidenceLines) || handoff.evidenceLines.length === 0) issues.push('handoff.evidenceLines is required');
  return fail(issues);
}

export function validateJourneySessionContract(session: RepresentationJourneySessionContract): RepresentationValidationResult {
  const issues: string[] = [];
  if (!session.sessionId.trim()) issues.push('session.sessionId is required');
  if (!session.representationVersion.trim()) issues.push('session.representationVersion is required');
  issues.push(...validatePageContract(session.currentPage).issues);
  issues.push(...validateHandoffContract(session.handoffState).issues);
  if ((session.currentPage.pageRole === 'recommendation' || session.currentPage.pageRole === 'comparison' || session.currentPage.pageRole === 'opening_build' || session.currentPage.pageRole === 'workspace') && !session.selectedDirection) {
    issues.push(`session ${session.sessionId} requires selectedDirection for page role ${session.currentPage.pageRole}`);
  }
  return fail(issues);
}

export function hasRequiredStateKeys(cta: RepresentationCtaContract | null | undefined, availableStateKeys: string[]): boolean {
  if (!cta) return true;
  return cta.requiredStateKeys.every((key) => availableStateKeys.includes(key));
}
