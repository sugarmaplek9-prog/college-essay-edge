import type { RepresentationBlockType, RepresentationPageRole } from '@/lib/representation/contracts';

export const REQUIRED_BLOCKS_BY_PAGE_ROLE: Record<RepresentationPageRole, RepresentationBlockType[]> = {
  intake: ['page_intro', 'cta_group'],
  reflection: ['page_intro', 'handoff_summary', 'next_move'],
  recommendation: ['page_intro', 'recommendation', 'evidence', 'risk', 'next_move'],
  comparison: ['page_intro', 'compare', 'next_move'],
  opening_build: ['page_intro', 'recommendation', 'evidence', 'draft_seed', 'next_move', 'handoff_summary'],
  workspace: ['page_intro', 'handoff_summary', 'recommendation', 'draft_seed', 'next_move'],
  recovery: ['recovery'],
  blocked: ['recovery'],
};

export function pageRoleForRoute(routeId: string): RepresentationPageRole | null {
  switch (routeId) {
    case '/start':
      return 'intake';
    case '/start/reflecting':
      return 'reflection';
    case '/start/direction':
      return 'recommendation';
    case '/start/compare':
      return 'comparison';
    case '/start/opening':
      return 'opening_build';
    case '/app/personal-statement':
      return 'workspace';
    case '/start/blocked':
      return 'blocked';
    default:
      return null;
  }
}
