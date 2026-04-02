# Sprint 1 Execution Backlog

## Narrative Direction Selection — Backend Foundation Only

## Sprint goal

Deliver the minimum backend vertical slice so the system can:
- create an AI run
- execute run lifecycle asynchronously
- persist validator + artifact state
- expose run/artifact retrieval endpoints
- persist explicit direction selection as first-class product state

## Definition of done (Sprint 1)

Sprint 1 is complete only when all are true:
1. Migrations apply cleanly in local, staging, and CI.
2. POST /v1/ai/runs creates a run and enqueues one job.
3. Worker moves queued runs to deterministic terminal state.
4. GET /v1/ai/runs/{run_id} returns execution state contract.
5. GET /v1/ai/runs/{run_id}/artifact returns validated artifact contract.
6. POST /v1/ai/artifacts/{artifact_id}/select persists event + project pointer.
7. Automated tests pass for schema, endpoints, worker transitions, and selection persistence.

## Phase gates

### Workstream A — Database migration
Exit gate A:
- migrations run clean
- schema matches contract
- required indexes and constraints exist

### Workstream B — Create-run API
Exit gate B:
- valid request returns 201
- invalid request/state returns correct 4xx
- duplicate active run returns 409

### Workstream C — Worker execution skeleton
Exit gate C:
- queued run deterministically reaches terminal state

### Workstream D — Retrieval endpoints
Exit gate D:
- frontend can poll run status and fetch validated artifact

### Workstream E — Selection endpoint
Exit gate E:
- selection persists and survives reload

---

# Ordered implementation package (execute in exact order)

## DB-01 — Create enums

### Ticket title
Create AI execution enums

### Purpose
Introduce all enum types required by run lifecycle, artifacts, validator outcomes, and selection context.

### Dependencies
None.

### Implementation scope
Create:
- run_trigger_type_enum
- subject_entity_type_enum
- execution_mode_enum
- run_readiness_state_enum
- run_status_enum
- artifact_status_enum
- artifact_link_role_enum
- selection_context_enum
- validator_decision_enum
- validator_severity_enum

Required enum values must match contract exactly (no extras, no renames).

### Out of scope
- table creation
- API code

### Acceptance criteria
- all enums created successfully
- names + values match contract exactly
- migration runs clean on empty DB
- migration is idempotent/safe for CI rollout sequence

### API/schema references
- Schema: AI spine enum contract (engineering directive Part 1.3)

### Test cases
- migration test asserts each enum exists
- migration test asserts each enum includes required values

---

## DB-02 — Create module_registry and seed narrative_direction_selection

### Ticket title
Create module registry + seed NDS module

### Purpose
Enforce canonical module identity resolution through module_registry.

### Dependencies
- DB-01

### Implementation scope
Create module_registry:
- id UUID PK
- module_key TEXT UNIQUE NOT NULL
- display_name TEXT NOT NULL
- is_enabled BOOLEAN NOT NULL DEFAULT true
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

Seed row:
- module_key = narrative_direction_selection
- display_name = Narrative Direction Selection

### Out of scope
- prompt bundles/version tables

### Acceptance criteria
- table exists with required columns/constraints
- unique(module_key) enforced
- seed row exists post-migration
- repeated migration does not duplicate seed row

### API/schema references
- POST /v1/ai/runs module resolution contract

### Test cases
- schema test verifies table + constraints
- schema test verifies seed row present + enabled

---

## DB-03 — Create ai_runs

### Ticket title
Create canonical run execution table

### Purpose
Persist one row per invocation attempt and separate run status from artifact status.

### Dependencies
- DB-01
- DB-02

### Implementation scope
Create ai_runs with full required columns, including:
- module_id FK -> module_registry(id)
- student_user_id FK -> users(id)
- trigger_type, subject_entity_type, execution_mode, readiness_state, status enums
- retry_count default 0 + check retry_count >= 0
- fallback/provider/model/version fields
- started_at/completed_at/created_at

Indexes:
- (student_user_id, created_at desc)
- (subject_entity_type, subject_entity_id, created_at desc)
- (module_id, created_at desc)
- (status, created_at desc)

### Out of scope
- queue table implementation

### Acceptance criteria
- table + indexes + check constraint created
- FK to module_registry valid
- FK to users valid
- valid inserts succeed
- retry_count < 0 rejected

### API/schema references
- POST /v1/ai/runs create contract
- GET /v1/ai/runs/{run_id} polling contract

### Test cases
- schema test validates indexes + constraints
- integration test inserts valid run
- negative test rejects retry_count = -1

---

## DB-04 — Create ai_artifacts

### Ticket title
Create canonical artifact table

### Purpose
Persist product-approved module output, preserving artifact history and canonical-subject pointer semantics.

### Dependencies
- DB-01
- DB-02
- DB-03

### Implementation scope
Create ai_artifacts with required fields including:
- unique run_id FK -> ai_runs(id)
- module_id FK -> module_registry(id)
- student_user_id FK -> users(id)
- artifact_status enum
- summary_text
- payload_json/warnings_json/meta_json
- canonical/selection flags
- render_version
- superseded_at

Indexes:
- (subject_entity_type, subject_entity_id, created_at desc)
- partial canonical lookup index where is_canonical_for_subject = true
- (run_id)
- (student_user_id, created_at desc)

Constraints:
- one artifact per run
- payload_json must be JSON object

### Out of scope
- raw provider response persistence

### Acceptance criteria
- table created with required columns
- unique(run_id) enforced
- canonical partial index exists
- payload object accepted
- payload array/scalar rejected

### API/schema references
- GET /v1/ai/runs/{run_id}/artifact contract

### Test cases
- schema test verifies unique(run_id)
- schema test verifies partial canonical index
- constraint test rejects non-object payload_json

---

## DB-05 — Create artifact_subject_links

### Ticket title
Create artifact provenance links table

### Purpose
Persist explicit context provenance for each artifact.

### Dependencies
- DB-01
- DB-04

### Implementation scope
Create artifact_subject_links:
- artifact_id FK -> ai_artifacts(id) ON DELETE CASCADE
- linked_entity_type enum
- linked_entity_id UUID
- link_role enum
- created_at

Indexes:
- (artifact_id)
- (linked_entity_type, linked_entity_id)

### Out of scope
- context-assembler decision logic

### Acceptance criteria
- table created correctly
- cascade delete works from ai_artifacts
- indexes exist and are queryable

### API/schema references
- Worker provenance persistence requirement

### Test cases
- FK cascade test
- index existence test

---

## DB-06 — Create artifact_selection_events

### Ticket title
Create selection event log table

### Purpose
Persist append-only explicit user selection history.

### Dependencies
- DB-01
- DB-04

### Implementation scope
Create artifact_selection_events:
- artifact_id FK -> ai_artifacts(id) ON DELETE CASCADE
- student_user_id FK -> users(id)
- selected_item_id TEXT NOT NULL
- selected_rank INTEGER NULL
- selection_context enum
- created_at

Indexes:
- (artifact_id, created_at desc)
- (student_user_id, created_at desc)

### Out of scope
- selection endpoint write logic

### Acceptance criteria
- table created correctly
- inserts succeed
- no destructive update/delete path introduced in service layer

### API/schema references
- POST /v1/ai/artifacts/{artifact_id}/select contract

### Test cases
- schema test validates table/FKs/indexes
- persistence test validates append-only event creation

---

## DB-07 — Create validator_results

### Ticket title
Create validator truth table

### Purpose
Persist structured validator outcomes independently from run and artifact states.

### Dependencies
- DB-01
- DB-02
- DB-03
- DB-04

### Implementation scope
Create validator_results with required fields including:
- run_id FK -> ai_runs(id) ON DELETE CASCADE
- artifact_id nullable FK -> ai_artifacts(id) ON DELETE SET NULL
- module_id FK -> module_registry(id)
- structural/semantic/brand/authenticity booleans
- admissibility_decision enum
- highest_severity enum
- failure/warning code arrays
- needs_more_input_reason_code
- created_at

Indexes:
- (run_id)
- (artifact_id)
- (module_id, created_at desc)

### Out of scope
- validator business logic details

### Acceptance criteria
- table created correctly
- nullable artifact_id supported
- JSON code arrays persist
- required indexes exist

### API/schema references
- worker phase: validator persistence

### Test cases
- schema test for nullable artifact_id + FKs
- insert tests for all decision enum variants

---

## DB-08 — Add essay_projects.selected_direction_artifact_id

### Ticket title
Add selected direction artifact pointer to essay_projects

### Purpose
Store first-class selected-direction pointer at essay project level.

### Dependencies
- DB-04

### Implementation scope
Add column if missing:
- selected_direction_artifact_id UUID NULL FK -> ai_artifacts(id)

Confirm essay_projects.student_user_id exists and remains required for ownership checks.

### Out of scope
- endpoint selection write flow

### Acceptance criteria
- column exists
- FK valid
- project can point to selected artifact
- prior artifact rows remain intact when pointer changes

### API/schema references
- POST /v1/ai/artifacts/{artifact_id}/select write behavior

### Test cases
- migration test for column/FK presence
- integration test updates pointer to a valid artifact

---

## API-01 — Implement POST /v1/ai/runs

### Ticket title
Implement create-run endpoint

### Purpose
Create NDS run entry point with strict validation + conflict policy + queue handoff.

### Dependencies
- DB-02
- DB-03
- DB-08

### Implementation scope
Implement endpoint:
- POST /v1/ai/runs

Required capabilities:
- request schema validation
- subject resolution (essay_project)
- module resolution (module_registry)
- ownership/access enforcement
- in-flight conflict check for queued/running runs
- readiness precheck + execution mode resolution
- insert ai_runs row with queued initial state
- enqueue one background job
- return 201 response contract

Error mapping:
- 400 malformed request
- 403 permission denied
- 404 subject not found
- 409 conflict (active run / invalid workflow)
- 422 insufficient input

### Out of scope
- worker generation/validator/artifact persistence logic

### Acceptance criteria
- valid request returns 201 + response contract
- invalid states return correct 4xx
- duplicate active run returns 409
- exactly one queue message produced per accepted request

### API/schema references
- POST /v1/ai/runs contract
- ai_runs schema

### Test cases
- valid request -> 201
- malformed payload -> 400
- unauthorized access -> 403
- missing subject -> 404
- active-run conflict -> 409
- insufficient input -> 422
- enqueue call count == 1

---

## JOB-01 — Implement queued-run worker skeleton

### Ticket title
Implement deterministic run worker skeleton

### Purpose
Prove queued run processing path and terminal status transitions before final prompt/context/validator logic.

### Dependencies
- API-01
- DB-07

### Implementation scope
Worker skeleton flow:
1. load run by run_id, assert status=queued
2. mark run status=running, started_at=now
3. call stub context assembler
4. call stub generation function
5. call stub validator function
6. write terminal status + completed_at
7. emit logs with trace/run identifiers

Terminal states supported in skeleton:
- completed
- needs_more_input
- failed_validation
- system_error

### Out of scope
- final context assembly
- real provider integration
- production validator semantics

### Acceptance criteria
- queued -> running transition occurs
- running -> terminal transition deterministic
- started_at/completed_at persisted
- system_error path handled safely
- duplicate processing prevented or idempotent-safe

### API/schema references
- ai_runs status lifecycle contract

### Test cases
- queued -> running -> completed
- queued -> running -> needs_more_input
- queued -> running -> failed_validation
- queued -> running -> system_error

---

## API-02 — Implement GET /v1/ai/runs/{run_id}

### Ticket title
Implement run polling endpoint

### Purpose
Expose execution state for frontend polling without artifact payload leakage.

### Dependencies
- JOB-01

### Implementation scope
Implement endpoint:
- GET /v1/ai/runs/{run_id}

Return contract fields:
- run_id/module/status/execution_mode/readiness_state
- subject entity
- artifact_id nullable
- validator_result_id nullable
- review_queue_item_id nullable
- attempt_count
- created_at/started_at/completed_at

Behavior rules:
- execution state only
- never return raw model output
- do not collapse artifact status into run status

### Out of scope
- artifact payload retrieval

### Acceptance criteria
- owner can fetch run state
- non-owner blocked
- missing run returns 404
- artifact_id null when no admissible artifact
- response matches contract

### API/schema references
- GET /v1/ai/runs/{run_id} contract

### Test cases
- owner success
- non-owner forbidden
- run not found -> 404
- no artifact -> artifact_id null

---

## API-03 — Implement GET /v1/ai/runs/{run_id}/artifact

### Ticket title
Implement artifact retrieval endpoint

### Purpose
Return validated, product-approved artifact + validator summary for a run.

### Dependencies
- JOB-01
- API-02

### Implementation scope
Implement endpoint:
- GET /v1/ai/runs/{run_id}/artifact

Required behavior:
- return validated artifact contract only
- never return raw provider output
- never expose blocked/failed-validation content
- if no admissible artifact, return consistent non-200 (recommended 404)

### Out of scope
- selection write behavior

### Acceptance criteria
- owner can retrieve artifact when present
- blocked content not exposed
- missing artifact returns consistent non-200 policy
- response matches contract schema

### API/schema references
- GET /v1/ai/runs/{run_id}/artifact contract
- ai_artifacts + validator_results

### Test cases
- success returns artifact + validator blocks
- blocked run does not leak artifact
- no admissible artifact -> 404 (or chosen standard)

---

## API-04 — Implement POST /v1/ai/artifacts/{artifact_id}/select

### Ticket title
Implement direction selection endpoint

### Purpose
Persist explicit direction choice event and update canonical project pointer.

### Dependencies
- DB-06
- DB-08
- API-03

### Implementation scope
Implement endpoint:
- POST /v1/ai/artifacts/{artifact_id}/select

Validation:
- artifact exists
- artifact belongs to authenticated student
- artifact module is narrative_direction_selection
- artifact status selectable by policy
- selected_item_id exists in artifact payload
- selection_context = direction_choice

Writes (single transaction requirement):
1. insert artifact_selection_events
2. update ai_artifacts.selected_by_user=true
3. update ai_artifacts.selected_item_id
4. update essay_projects.selected_direction_artifact_id

Return success contract:
- artifact_id
- selected_item_id
- status=recorded
- recorded_at

### Out of scope
- stale-state recomputation after future reruns

### Acceptance criteria
- valid selection persists event + flags + project pointer
- invalid selected_item_id rejected
- cross-user artifact selection forbidden
- atomicity preserved (no partial writes)

### API/schema references
- POST /v1/ai/artifacts/{artifact_id}/select contract
- artifact_selection_events + ai_artifacts + essay_projects

### Test cases
- valid select success path
- invalid option id -> 4xx
- cross-user artifact -> 403
- transaction rollback on injected failure

---

## TEST-01 — Add migration tests

### Ticket title
Add schema/migration contract tests

### Purpose
Prevent schema drift and deployment regressions.

### Dependencies
- DB-01 through DB-08

### Implementation scope
Add test suite validating:
- migration runs on empty DB
- all required enums exist
- all required tables exist
- required indexes + constraints exist
- module_registry seed row exists
- FKs are valid

### Out of scope
- API behavior

### Acceptance criteria
- CI fails on schema contract drift
- tests deterministic and repeatable

### API/schema references
- entire Phase 1 schema contract

### Test cases
- enum existence/value assertions
- table/constraint/index assertions
- seed row assertions

---

## TEST-02 — Add endpoint tests

### Ticket title
Add run + retrieval + selection endpoint tests

### Purpose
Lock API behavior for create-run, polling, artifact retrieval, and selection persistence.

### Dependencies
- API-01
- API-02
- API-03
- API-04

### Implementation scope
Add endpoint tests for:
- POST /v1/ai/runs
- GET /v1/ai/runs/{run_id}
- GET /v1/ai/runs/{run_id}/artifact
- POST /v1/ai/artifacts/{artifact_id}/select

### Out of scope
- real provider integration tests

### Acceptance criteria
- expected status codes and response contracts are enforced
- auth/ownership checks are enforced
- duplicate-run conflict behavior enforced

### API/schema references
- endpoint contracts for API-01 through API-04

### Test cases
- 201 create-run happy path
- 400/403/404/409/422 create-run error map
- polling success/non-owner/not-found
- artifact retrieval success/no-admissible-artifact
- selection success/invalid-id/cross-user

---

## TEST-03 — Add worker state-transition tests

### Ticket title
Add worker lifecycle tests

### Purpose
Guarantee deterministic worker state transitions and persistence side effects.

### Dependencies
- JOB-01

### Implementation scope
Add tests for transitions:
- queued -> running -> completed
- queued -> running -> needs_more_input
- queued -> running -> failed_validation
- queued -> running -> system_error

Verify:
- started_at/completed_at persistence
- validator_result write behavior
- admissible artifact persistence behavior
- blocked/raw leakage prevention

### Out of scope
- prompt quality
- real LLM output quality

### Acceptance criteria
- lifecycle transitions fully covered
- timestamps and terminal statuses asserted
- regression fails fast on transition drift

### API/schema references
- ai_runs lifecycle
- validator_results and ai_artifacts persistence rules

### Test cases
- one test per terminal path + persistence assertions

---

## TEST-04 — Add selection persistence tests

### Ticket title
Add selection persistence and atomicity tests

### Purpose
Guarantee explicit selection history and project pointer updates are correct and atomic.

### Dependencies
- API-04

### Implementation scope
Add tests that verify:
- valid selection inserts artifact_selection_events row
- ai_artifacts selection flags update correctly
- essay_projects pointer updates correctly
- invalid selected_item_id rejected
- cross-user access rejected
- partial-write rollback behavior under forced failure

### Out of scope
- stale/canonical recomputation policies for future sprints

### Acceptance criteria
- selection persistence behavior fully covered
- atomicity guarantees validated

### API/schema references
- POST /v1/ai/artifacts/{artifact_id}/select
- artifact_selection_events + ai_artifacts + essay_projects

### Test cases
- happy path persists all 3 write outcomes
- invalid input and ownership negatives
- rollback safety test

---

## Parallelization guidance

### Safe parallelization
- DB-05, DB-06, DB-07 after DB-04 is stable
- TEST-01 can proceed during late DB work
- API-03 may begin once worker persistence contracts are stable
- TEST-02 and TEST-04 may run alongside late API implementation

### Not safe to parallelize
- API-01 before DB-03 exists
- JOB-01 before API-01 exists
- API-04 before DB-06 and DB-08 exist

---

## Sprint 1 exit gate

Do not start context assembler depth work, final prompt logic, or production validator semantics until all are true:
1. run creation path works end-to-end
2. worker path reaches deterministic terminal states
3. artifact + validator persistence is correct
4. retrieval endpoints satisfy contract
5. selection persists transactionally
6. all Sprint 1 tests pass
