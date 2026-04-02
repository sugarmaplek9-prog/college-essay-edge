# REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V1.md

> Superseded by [docs/engineering/REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V2.md](docs/engineering/REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V2.md).

## Purpose

This handoff converts the implementation spec into repo-ready artifacts that engineering can place directly into the codebase.

Included artifacts:

1. `001_real_input_corpus_substrate.sql`
2. `realInputCorpus.ts`
3. `realInputCorpusApi.ts`

These files are designed for a TypeScript application with PostgreSQL.

---

## Recommended repo placement

```text
db/migrations/001_real_input_corpus_substrate.sql
src/types/realInputCorpus.ts
src/types/api/realInputCorpusApi.ts
docs/engineering/REAL_INPUT_CORPUS_AND_LEARNED_JUDGMENT_SUBSTRATE_ENGINEERING_HANDOFF_V1.md
```

---

## Assumptions

- Database: PostgreSQL 14+
- ID strategy: `gen_random_uuid()`
- Timestamp standard: `timestamptz`
- API style: JSON over HTTP
- Domain model: strict enums + explicit validation
- Review scoring: integer-only 1-5
- Export requirement: deterministic ordering handled in service layer

---

## Implementation notes

### SQL posture
The schema is normalized and optimized for:
- auditability,
- versioned judgment capture,
- repeatable pack generation,
- explicit lifecycle control.

### TypeScript posture
The TypeScript files are separated into:
- domain-layer types,
- API-layer payloads.

This prevents API request/response drift from contaminating core domain types.

### Required engineering follow-up
After dropping these files into repo, engineering should:

1. wire migration into migration runner,
2. generate DB client types if used,
3. implement server-side validators mirroring the TS shapes,
4. build service methods for lifecycle transitions,
5. write integration tests for queueing, review submission, adjudication, and pack export.

---

## Required follow-on services

The following services should be implemented against this schema and type contract:

- `createCase()`
- `normalizeCase()`
- `attachRunToCase()`
- `decideReviewQueue()`
- `submitCaseReview()`
- `detectReviewDisagreement()`
- `adjudicateCase()`
- `promoteCaseToGold()`
- `createEvalPack()`
- `exportEvalPack()`

---

## Hard implementation rules

- Do not bypass enums with untyped string writes.
- Do not skip lifecycle transition checks in service logic.
- Do not allow review submission with partial scorecards.
- Do not allow gold promotion without preconditions.
- Do not use eval-pack exports from unresolved truth states.
- Do not mix API payload shape with persistence shape.

---

## Minimum test gates before merge

- migration applies cleanly on empty DB,
- migration rolls back cleanly if your framework supports down migrations,
- all foreign keys enforced,
- all enum constraints enforced,
- all unique indexes enforced,
- review submission blocks incomplete scorecards,
- adjudication required cases cannot be promoted directly,
- eval-pack export query returns deterministic order.

---

## Artifact summary

### 1. SQL migration
Defines:
- enum types,
- tables,
- indexes,
- unique constraints,
- basic integrity checks,
- update timestamp trigger.

### 2. Domain types
Defines:
- enums,
- records,
- score dimensions,
- lifecycle transition helpers,
- typed review submission model.

### 3. API contract types
Defines:
- request payloads,
- response payloads,
- queue responses,
- eval-pack responses,
- export payloads.

This handoff is only complete when the files are actually placed into the repo and wired into runtime validation and test coverage.
