# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V4_SERVICE_ALIGNED.md

## Status

This package is the **service-aligned V4 refinement**.

The latest archive added two crucial repository truths:

1. the actual `realInputCorpusDb.ts` utility contract,
2. the actual `realInputCorpusHandlers.ts` service-call signature pattern.

That means the integration is now aligned to:

- real DB utility contract,
- real case-row mapper,
- real audit helper,
- real handler/service method signatures,
- real repository-native validation/lifecycle error classes.

---

## What changed

### 1. Service boundary is now exact
The archive shows the service methods are called as:

- `createCase(actorId, body)`
- `normalizeCase(actorId, caseId, body)`
- `attachRun(actorId, caseId, body)`
- `submitCaseReview(actorId, caseId, productSurface, body)`
- `adjudicateCase(actorId, caseId, body)`
- `promoteCase(actorId, caseId, body)`
- `createEvalPack(actorId, body)`
- `exportEvalPack(evalPackId)`

This package updates the App Router integration layer to match that actual boundary instead of the earlier inferred one.

### 2. Error mapping is now repo-native
The archive confirms the repository already uses:
- `RicValidationError`
- `RicLifecycleError`

for local RIC error handling.

This package preserves that pattern and only layers App Router transport around it.

### 3. Remaining boundary
The actual `realInputCorpusService.ts` implementation file itself still was not included, so this pass is:
- DB-contract-bound,
- service-signature-bound,
- handler-pattern-bound,

but not yet fully implementation-bound.

That is still the correct honest posture.

---

## Included files

- `realInputCorpusDb.ts`
- `realInputCorpusAppRouterBound.ts`
- `realInputCorpusAudit.ts`
- `realInputCorpusPgAdapter.notes.md`
- `REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V4_SERVICE_ALIGNED.md`

---

## What to do next

If you upload the actual `realInputCorpusService.ts`, I can finish the final in-repo compile pass with:
- route files that call the real constructor exactly,
- adapter methods matched to the real repository interface,
- compile-credible integration instead of signature-bound integration.
