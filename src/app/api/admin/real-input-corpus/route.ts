import { createRicCollectionHandlers } from '@/lib/real-input-corpus/realInputCorpusAppRouterFinal';
import { createSqlClient } from '@/lib/real-input-corpus/realInputCorpusDb';
import { assertReviewerAccess } from '@/lib/auth/assertReviewerAccess';

const handlers = createRicCollectionHandlers({ createSqlClient, assertReviewerAccess });

export const GET = handlers.GET;
export const POST = handlers.POST;
