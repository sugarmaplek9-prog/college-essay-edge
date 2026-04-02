# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V4_FINAL.md

## Status

This is the **final V4 compile-oriented integration package** for the real-input corpus + learned-judgment substrate, based on the actual uploaded repository files:

- `realInputCorpusDb.ts`
- `realInputCorpusService.ts`
- `realInputCorpusService.test.ts`

This package is no longer guessing the service boundary. It is aligned to the real contract:

- `RicRepository`
- `RicAuditSink`
- `RealInputCorpusService`
- `RicValidationError`
- `RicLifecycleError`
- actor-aware service methods
- repo-export normalization path for eval-pack export

---

## What is now exact

### Service constructor
The real service constructor is:

```ts
new RealInputCorpusService(repo, audit)
```

### Exact service methods
The real service exposes:

- `createCase(actorId, input)`
- `normalizeCase(actorId, caseId, input)`
- `attachRun(actorId, caseId, input)`
- `decideReviewQueue(inputs)`
- `submitCaseReview(actorId, caseId, productSurface, input)`
- `detectReviewDisagreement(input)`
- `adjudicateCase(actorId, caseId, input)`
- `promoteCase(actorId, caseId, input)`
- `createEvalPack(actorId, input)`
- `exportEvalPack(evalPackId)`
- `getReviewQueue(query?)`
- `getCaseDetail(caseId)`

### Repository contract
The real repository interface requires:

- case creation
- case lookup
- normalization
- run attachment
- review submission
- adjudication
- promotion
- eval-pack creation
- eval-pack retrieval
- eval-pack export
- review queue retrieval
- case detail retrieval

### Audit contract
The audit sink requires:

- `write({ actorId, actionType, targetTable, targetId?, caseId?, payload? })`

---

## What this package includes

1. the real uploaded source-of-truth files
2. stack-bound App Router integration aligned to the real service contract
3. audit sink bound to the real DB utility helper
4. route examples ready for repo placement
5. an adapter implementation skeleton aligned to the real `RicRepository` interface

---

## Remaining honest boundaries

There are still final-mile repo specifics that were not uploaded in full:

- the exact existing `realInputCorpusPgAdapter.ts` implementation file in repo
- the exact SQL client factory implementation behind `createSqlClient()`
- the exact reviewer/admin authorization helper path
- the exact route mount paths you want for admin RIC endpoints

So this package is now:

- **DB-contract-bound**
- **service-contract-bound**
- **test-shape-bound**
- **route/auth pattern-bound**

That is the correct world-class posture: exact where known, explicit where still repo-local.

---

## Recommended repo placement

```text
db/migrations/20260318000002_real_input_corpus_substrate.sql

src/lib/real-input-corpus/realInputCorpusDb.ts
src/lib/real-input-corpus/realInputCorpusAudit.ts
src/lib/real-input-corpus/realInputCorpusErrorBridge.ts
src/lib/real-input-corpus/realInputCorpusAppRouterFinal.ts
src/lib/real-input-corpus/realInputCorpusPgAdapter.final.ts

src/app/api/admin/real-input-corpus/route.ts
src/app/api/admin/real-input-corpus/[caseId]/route.ts

src/types/realInputCorpusService.ts
src/__tests__/real-input-corpus/realInputCorpusService.test.ts
```

---

## Final integration sequence

1. replace placeholder imports with actual repo paths
2. wire `createSqlClient()` to your actual SQL client implementation
3. wire reviewer/admin permission helper
4. replace partial adapter with the final adapter implementation
5. mount App Router handlers
6. run typecheck
7. run Vitest
8. run staging end-to-end
