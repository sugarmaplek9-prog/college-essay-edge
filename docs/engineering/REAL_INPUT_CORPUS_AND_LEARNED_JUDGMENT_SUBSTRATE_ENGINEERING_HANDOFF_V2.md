# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V2.md

> Superseded by [docs/engineering/REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V3.md](docs/engineering/REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V3.md).

## Purpose

This handoff applies the v2 repo-ready artifact set for the real-input corpus + learned-judgment substrate.

Included artifacts:

1. `db/migrations/001_real_input_corpus_substrate.sql`
2. `src/types/realInputCorpus.ts`
3. `src/types/api/realInputCorpusApi.ts`
4. `src/types/realInputCorpusExport.ts`
5. `src/types/realInputCorpusSchemas.ts`
6. `src/types/realInputCorpusService.ts`

---

## What changed in v2

v2 extends v1 with three additional runtime-focused modules:

- export determinism helpers (`realInputCorpusExport.ts`),
- payload validation schemas (`realInputCorpusSchemas.ts`),
- service orchestration layer (`realInputCorpusService.ts`).

These additions close the gap between type-only contracts and executable service behavior.

---

## Execution checklist

- migration file present and wired in migration runner,
- domain and API types present,
- validation helpers added for request guards,
- deterministic export normalizer/serializer added,
- service-layer orchestration scaffolded,
- type checks pass for added files.

---

## Required next integration steps

1. wire `RicRepository` implementation to your DB layer,
2. wire `RicAuditSink` to persistent audit log writes,
3. call validation methods in API route handlers,
4. enforce lifecycle transitions through service methods,
5. add integration tests for queueing, review, adjudication, and export determinism.

---

## Guardrails

- fail closed on invalid payloads,
- no lifecycle bypass from API routes,
- no eval-pack export without deterministic normalization,
- no gold promotion outside lifecycle preconditions,
- no silent write paths outside audit logging.
