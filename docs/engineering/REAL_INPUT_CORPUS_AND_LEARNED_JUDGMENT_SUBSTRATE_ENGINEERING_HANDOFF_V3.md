# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V3.md

## Purpose

v3 extends the substrate handoff with executable integration scaffolding beyond schema/types/contracts.

## Included additions

- DB utility layer:
  - src/lib/real-input-corpus/realInputCorpusDb.ts
  - src/lib/real-input-corpus/realInputCorpusTransactions.ts
  - src/lib/real-input-corpus/realInputCorpusPgAdapter.ts
- Handler layer:
  - src/lib/real-input-corpus/realInputCorpusHandlers.ts
- Seed fixtures:
  - src/lib/real-input-corpus/ndsReviewSeedFixtures.ts
- Unit tests:
  - src/__tests__/unit/realInputCorpusService.test.ts
  - src/__tests__/unit/realInputCorpusHandlers.test.ts

## v3 execution status in this repo

- Added deterministic export and validation/service modules in prior step (v2).
- Added DB/transaction/adapter scaffolding and handler scaffolding in this step.
- Added fixture + unit tests for service and handlers.

## Next required engineering work

1. Implement remaining SQL-backed methods in `RealInputCorpusPgAdapter`.
2. Wire handlers into API routes under app router.
3. Add integration tests against a real test DB.
4. Add deterministic export regression tests against real pack data.

## Guardrails

- Keep lifecycle transitions fail-closed.
- Keep request validation server-side and strict.
- Keep export serialization deterministic.
- Keep audit log writes on all mutating operations.
