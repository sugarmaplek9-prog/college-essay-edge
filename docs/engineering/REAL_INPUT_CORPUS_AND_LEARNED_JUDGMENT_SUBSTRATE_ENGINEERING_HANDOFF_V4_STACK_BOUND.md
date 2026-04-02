# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V4_STACK_BOUND.md

## Purpose

This package is a stack-bound V4 pass for the real-input corpus + learned-judgment substrate.

It is bound to the actual repository surface supplied in the archive:

- `src/lib/supabase/server.ts`
- `src/app/api/v1/ai/runs/route.ts`
- `src/lib/ai/run-service.ts`
- `src/lib/ai/errors.ts`
- `vitest.config.ts`
- partial `realInputCorpusPgAdapter.ts`
- `REAL_INPUT_CORPUS_V4_REPO_SURFACE_PACKET_V1.md`

## What is exact now

- Next.js App Router route posture
- route-level `createAuthClient()` and `db.auth.getUser()` authentication
- typed AI error mapping through the real `errors.ts` classes
- Vitest node-environment alignment
- timestamp-prefixed migration naming
- preservation of the existing `SqlTransactionalClient` seam from the partial adapter

## Critical honesty note

The archive did **not** include the implementation of:

- `realInputCorpusDb.ts`

The partial adapter depends on:

- `mapCaseRowToRecord`
- `RicDbCaseRow`
- `SqlTransactionalClient`

This package does **not** invent that file. It keeps that seam explicit.

That is the correct no-assumptions posture.

## Included files

- `realInputCorpusErrorBridge.ts`
- `realInputCorpusAudit.ts`
- `realInputCorpusRouteHandlers.ts`
- `route.collection.ts`
- `route.case.ts`
- `realInputCorpusPgAdapter.completed.ts`
- `realInputCorpusStackBound.test.ts`

## Recommended placement

```text
src/lib/real-input-corpus/realInputCorpusErrorBridge.ts
src/lib/real-input-corpus/realInputCorpusAudit.ts
src/lib/real-input-corpus/realInputCorpusRouteHandlers.ts
src/lib/real-input-corpus/realInputCorpusPgAdapter.ts
src/app/api/admin/real-input-corpus/route.ts
src/app/api/admin/real-input-corpus/[caseId]/route.ts
src/__tests__/unit/realInputCorpusStackBound.test.ts
```

## What to do next

1. Wire the missing `realInputCorpusDb.ts` seam.
2. Replace the partial adapter with `realInputCorpusPgAdapter.completed.ts`.
3. Mount the route examples in the actual App Router tree.
4. Replace the reviewer-access TODO with the repo's real authz helper.
5. Run typecheck and Vitest.
