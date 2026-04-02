# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V4_COMPILE_BOUND.md

## Status

This package is the **compile-bound follow-up** to the prior V4 stack-bound pass.

The last missing seam is now closed with the actual repository `realInputCorpusDb.ts` contract:
- `SqlExecutor`
- `SqlTransactionalClient`
- `RicDbCaseRow`
- `mapCaseRowToRecord()`
- `writeAuditLog()`

That means the RIC SQL adapter and audit sink can now target the real repository contract instead of a preserved placeholder seam.

---

## What changed versus V4 stack-bound

### Before
V4 stack-bound was correctly aligned to:
- Supabase auth boundary,
- App Router route shape,
- typed AI errors,
- current service pattern,

but it intentionally did **not** fake the missing DB utility layer.

### Now
With the uploaded `realInputCorpusDb.ts`, the following are now bound to the actual repository contract:

- `realInputCorpusPgAdapter.completed.ts`
- `realInputCorpusAudit.ts`
- route handler DB client seam documentation
- compile expectations around row mapping and audit logging

---

## Included files

- `realInputCorpusDb.ts`
- `realInputCorpusPgAdapter.completed.ts`
- `realInputCorpusAudit.ts`
- `realInputCorpusErrorBridge.ts`
- `realInputCorpusRouteHandlers.ts`
- `route.collection.ts`
- `route.case.ts`
- `20260318000002_real_input_corpus_substrate.sql`
- `REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V4_COMPILE_BOUND.md`

---

## What is now exact

1. **Case row mapping**
   Adapter now relies on the real `mapCaseRowToRecord()` contract, not an inferred shape.

2. **SQL client contract**
   Adapter and audit sink now align to:
   - `SqlExecutor`
   - `SqlTransactionalClient`
   from the repository file.

3. **Audit logging**
   The repository already exposes `writeAuditLog()`. The audit sink remains compatible with that contract and can be simplified further if desired.

---

## Remaining honest boundaries

This package is much tighter now, but still not a magical guarantee of zero edits because the archive did not include:

- the exact `realInputCorpusService.ts` implementation currently in repo,
- the exact `realInputCorpusService` constructor signature,
- the actual `assertReviewerAccess` helper or equivalent role guard,
- the actual SQL client factory path.

So this is now:
- **stack-bound**
- **DB-contract-bound**
- **route/auth/error aligned**

but still requires final in-repo wiring of:
- exact imports,
- exact service constructor,
- exact role guard.

That is a normal and honest final-mile integration state.

---

## Recommended next action in repo

1. Replace the current partial adapter with `realInputCorpusPgAdapter.completed.ts`
2. Replace or merge `realInputCorpusAudit.ts`
3. Wire the route examples into the real App Router endpoints
4. Swap placeholder auth guard imports for the real reviewer/admin permission helper
5. Run typecheck and Vitest
6. Execute staging end-to-end flow

At this point, the RIC substrate integration is no longer blocked by missing DB contract knowledge.
