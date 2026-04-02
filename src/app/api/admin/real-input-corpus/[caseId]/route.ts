import { createRicCaseHandlers } from '@/lib/real-input-corpus/realInputCorpusAppRouterFinal';
import { createSqlClient } from '@/lib/real-input-corpus/realInputCorpusDb';
import { assertReviewerAccess } from '@/lib/auth/assertReviewerAccess';

const handlers = createRicCaseHandlers({ createSqlClient, assertReviewerAccess });

export const GET = handlers.GET;

// Mount these in action-specific route.ts files as needed:
// export const POST = handlers.normalize;
// export const POST = handlers.attachRun;
// export const POST = (req, ctx) => handlers.submitReview(req, ctx, 'narrative_direction_selection');
// export const POST = handlers.adjudicate;
// export const POST = handlers.promote;
