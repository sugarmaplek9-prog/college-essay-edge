import type { RepresentationPageContract } from '@/lib/representation/contracts';
import { cta, block, defaultCarryForwardKeys } from '@/lib/representation/pageBuilders/helpers';

export function buildRecoveryPage(input: {
  pageId: string;
  pageRole: 'recovery' | 'blocked';
  title: string;
  message: string;
  issues: string[];
  restartRoute?: string;
}): RepresentationPageContract {
  return {
    pageRole: input.pageRole,
    pageId: input.pageId,
    title: input.title,
    blocks: [
      block('recovery', `${input.pageId}-recovery`, {
        label: 'Recovery required',
        title: input.title,
        message: input.message,
        issues: input.issues,
      }),
    ],
    primaryCta: cta({
      id: `${input.pageId}-restart`,
      label: 'Return to start',
      actionType: 'recovery',
      targetRoute: input.restartRoute ?? '/start',
      analyticsEvent: `${input.pageId}_restart`,
      variant: 'primary',
    }),
    secondaryCta: null,
    requiredInputs: [],
    carryForwardKeys: defaultCarryForwardKeys(),
  };
}
