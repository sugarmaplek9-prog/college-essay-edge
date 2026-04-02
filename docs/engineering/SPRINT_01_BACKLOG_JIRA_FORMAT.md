# Sprint 1 Backlog — Linear/Jira Format

## EPIC

**Title:** Narrative Direction Selection — Backend Foundation  
**Priority:** P0  
**Description:**  
Implement the minimum backend required to support the Narrative Direction Selection vertical slice. This sprint covers database schema, run creation API, worker skeleton, artifact retrieval, selection persistence, and automated test coverage. It does not include final context assembly logic, final prompt strategy, or frontend implementation.

**Sprint Exit Gate:**
- schema migrations applied successfully
- AI run creation works
- worker can move run to terminal state
- artifact retrieval works
- direction selection persists correctly
- automated tests pass

---

## Ticket DB-01

**Title:** Create execution and artifact enums  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 2 points  
**Dependencies:** None

**Description:**  
Create all database enums required for AI run execution, artifact persistence, validator persistence, and selection state.

**Implementation Scope:**
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

Required values:

run_trigger_type_enum
- user_action
- artifact_created
- artifact_updated
- refresh
- admin_replay
- benchmark_run

subject_entity_type_enum
- student_profile
- story_entry
- essay_project
- essay_draft_version
- supplement_project
- supplement_draft_version

execution_mode_enum
- standard
- reduced_scope
- diagnostic_only
- needs_more_input
- refresh

run_readiness_state_enum
- ready
- reduced
- insufficient_input
- stale_context
- blocked

run_status_enum
- queued
- running
- completed
- partial
- needs_more_input
- failed_validation
- blocked
- system_error

artifact_status_enum
- success
- partial
- needs_more_input
- failed_validation
- blocked

artifact_link_role_enum
- primary_subject
- evidence_source
- selected_dependency
- overlap_context
- school_context

selection_context_enum
- direction_choice
- supplement_angle_choice
- story_candidate_choice
- revision_priority_ack

validator_decision_enum
- accept
- accept_partial
- retry_tightened
- retry_reduced_scope
- convert_to_needs_more_input
- block

validator_severity_enum
- low
- medium
- high
- critical

**Out of Scope:**
- tables
- API routes
- business logic

**Acceptance Criteria:**
- all enums exist in DB
- all enum values match contract exactly
- migration succeeds on empty DB
- migration is safe for CI and staging rollout

---

## Ticket DB-02

**Title:** Create module registry and seed narrative_direction_selection  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 2 points  
**Dependencies:** DB-01

**Description:**  
Create canonical module registry and seed the Narrative Direction Selection module.

**Implementation Scope:**
Create module_registry with:
- id UUID PK
- module_key TEXT UNIQUE NOT NULL
- display_name TEXT NOT NULL
- is_enabled BOOLEAN NOT NULL DEFAULT true
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

Seed:
- module_key = 'narrative_direction_selection'
- display_name = 'Narrative Direction Selection'

**Out of Scope:**
- prompt/version tables beyond module registry

**Acceptance Criteria:**
- module_registry exists
- module_key unique constraint exists
- narrative direction selection seed row exists
- repeated deploy does not duplicate seed row

---

## Ticket DB-03

**Title:** Create ai_runs table  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** DB-01, DB-02

**Description:**  
Create canonical execution table for all Narrative Direction Selection invocations.

**Implementation Scope:**
Create ai_runs with:
- id UUID PK
- module_id UUID NOT NULL REFERENCES module_registry(id)
- student_user_id UUID NOT NULL REFERENCES users(id)
- trigger_type run_trigger_type_enum NOT NULL
- subject_entity_type subject_entity_type_enum NOT NULL
- subject_entity_id UUID NOT NULL
- execution_mode execution_mode_enum NOT NULL
- readiness_state run_readiness_state_enum NOT NULL
- status run_status_enum NOT NULL
- retry_count INTEGER NOT NULL DEFAULT 0
- fallback_applied BOOLEAN NOT NULL DEFAULT false
- fallback_reason_code TEXT NULL
- provider_key TEXT NULL
- model_key TEXT NULL
- prompt_bundle_version_id UUID NULL
- schema_version_id UUID NULL
- validator_version_id UUID NULL
- started_at TIMESTAMPTZ NULL
- completed_at TIMESTAMPTZ NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- (student_user_id, created_at desc)
- (subject_entity_type, subject_entity_id, created_at desc)
- (module_id, created_at desc)
- (status, created_at desc)

Constraint:
- retry_count >= 0

**Out of Scope:**
- queue tables
- worker logic

**Acceptance Criteria:**
- table exists with exact fields
- indexes exist
- foreign keys resolve correctly
- negative retry count rejected

---

## Ticket DB-04

**Title:** Create ai_artifacts table  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** DB-01, DB-02, DB-03

**Description:**  
Create canonical approved artifact storage for validated product-facing outputs.

**Implementation Scope:**
Create ai_artifacts with:
- id UUID PK
- run_id UUID NOT NULL UNIQUE REFERENCES ai_runs(id)
- module_id UUID NOT NULL REFERENCES module_registry(id)
- student_user_id UUID NOT NULL REFERENCES users(id)
- subject_entity_type subject_entity_type_enum NOT NULL
- subject_entity_id UUID NOT NULL
- artifact_status artifact_status_enum NOT NULL
- summary_text TEXT NOT NULL
- payload_json JSONB NOT NULL
- warnings_json JSONB NOT NULL DEFAULT '[]'::jsonb
- meta_json JSONB NOT NULL DEFAULT '{}'::jsonb
- is_canonical_for_subject BOOLEAN NOT NULL DEFAULT false
- selected_by_user BOOLEAN NOT NULL DEFAULT false
- selected_item_id TEXT NULL
- render_version TEXT NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- superseded_at TIMESTAMPTZ NULL

Indexes:
- (subject_entity_type, subject_entity_id, created_at desc)
- partial index on (subject_entity_type, subject_entity_id) where is_canonical_for_subject = true
- (run_id)
- (student_user_id, created_at desc)

Rules:
- one artifact per run
- payload must be object-shaped JSON

**Out of Scope:**
- raw provider storage
- artifact generation logic

**Acceptance Criteria:**
- table exists with exact fields
- unique run-to-artifact enforced
- canonical partial index exists
- object payload persists successfully

---

## Ticket DB-05

**Title:** Create artifact_subject_links table  
**Type:** Backend / Database  
**Priority:** P1  
**Estimate:** 2 points  
**Dependencies:** DB-01, DB-04

**Description:**  
Create explicit provenance table for source entities contributing to an artifact.

**Implementation Scope:**
Create artifact_subject_links with:
- id UUID PK
- artifact_id UUID NOT NULL REFERENCES ai_artifacts(id) ON DELETE CASCADE
- linked_entity_type subject_entity_type_enum NOT NULL
- linked_entity_id UUID NOT NULL
- link_role artifact_link_role_enum NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- (artifact_id)
- (linked_entity_type, linked_entity_id)

**Out of Scope:**
- logic that decides which links to store

**Acceptance Criteria:**
- table exists
- cascade delete works
- indexes exist

---

## Ticket DB-06

**Title:** Create artifact_selection_events table  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 2 points  
**Dependencies:** DB-01, DB-04

**Description:**  
Create append-only selection history for user direction choice.

**Implementation Scope:**
Create artifact_selection_events with:
- id UUID PK
- artifact_id UUID NOT NULL REFERENCES ai_artifacts(id) ON DELETE CASCADE
- student_user_id UUID NOT NULL REFERENCES users(id)
- selected_item_id TEXT NOT NULL
- selected_rank INTEGER NULL
- selection_context selection_context_enum NOT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- (artifact_id, created_at desc)
- (student_user_id, created_at desc)

**Out of Scope:**
- selection API logic

**Acceptance Criteria:**
- table exists
- inserts succeed
- no destructive update path introduced

---

## Ticket DB-07

**Title:** Create validator_results table  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** DB-01, DB-02, DB-03, DB-04

**Description:**  
Create structured validator persistence separate from runs and artifacts.

**Implementation Scope:**
Create validator_results with:
- id UUID PK
- run_id UUID NOT NULL REFERENCES ai_runs(id) ON DELETE CASCADE
- artifact_id UUID NULL REFERENCES ai_artifacts(id) ON DELETE SET NULL
- module_id UUID NOT NULL REFERENCES module_registry(id)
- validator_version_id UUID NULL
- structural_pass BOOLEAN NOT NULL
- semantic_pass BOOLEAN NOT NULL
- brand_pass BOOLEAN NOT NULL
- authenticity_pass BOOLEAN NOT NULL
- admissibility_decision validator_decision_enum NOT NULL
- highest_severity validator_severity_enum NOT NULL
- failure_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb
- warning_codes_json JSONB NOT NULL DEFAULT '[]'::jsonb
- needs_more_input_reason_code TEXT NULL
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

Indexes:
- (run_id)
- (artifact_id)
- (module_id, created_at desc)

**Out of Scope:**
- validator logic

**Acceptance Criteria:**
- table exists
- nullable artifact_id supported
- JSON arrays persist correctly
- indexes exist

---

## Ticket DB-08

**Title:** Add selected_direction_artifact_id to essay_projects  
**Type:** Backend / Database  
**Priority:** P0  
**Estimate:** 1 point  
**Dependencies:** DB-04

**Description:**  
Add canonical project pointer to the selected direction artifact.

**Implementation Scope:**
Add field if missing:
- selected_direction_artifact_id UUID NULL REFERENCES ai_artifacts(id)

Confirm essay_projects.student_user_id exists.

**Out of Scope:**
- selection write logic

**Acceptance Criteria:**
- column exists
- FK works
- project row can point to artifact

---

## Ticket API-01

**Title:** Implement POST /v1/ai/runs request validation  
**Type:** Backend / API  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** DB-02, DB-03, DB-08

**Description:**  
Create entry point for Narrative Direction Selection execution and validate request contract.

**Implementation Scope:**
Implement POST /v1/ai/runs

Request shape:

{
  "module": "narrative_direction_selection",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "UUID"
  },
  "trigger": {
    "type": "user_action",
    "name": "direction_help_requested"
  },
  "requested_mode": "standard",
  "options": {
    "max_retries": 1,
    "allow_fallback_provider": true,
    "force_refresh": false,
    "create_review_if_flagged": true
  },
  "client_context": {
    "ui_surface": "essay_workspace",
    "request_id": "opaque-client-request-id"
  }
}

Validate:
- malformed payload
- unsupported module
- unsupported subject entity type
- missing entity id
- invalid enums
- permission failure

Error mapping:
- 400
- 403
- 404
- 409
- 422

**Out of Scope:**
- run creation persistence
- worker enqueue
- generation logic

**Acceptance Criteria:**
- valid contract passes validation
- invalid module rejected
- invalid subject rejected
- unauthorized user rejected
- response bodies follow API standard

---

## Ticket API-02

**Title:** Implement ai_runs creation, precheck, and enqueue flow  
**Type:** Backend / API  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** API-01

**Description:**  
Complete POST /v1/ai/runs server-side logic.

**Implementation Scope:**
Flow:
- resolve module from registry
- resolve essay_project
- verify actor access
- compute pre-run readiness state
- determine execution mode
- enforce one active run for (module, subject) in queued or running
- create ai_runs row
- enqueue job
- return 201

Initial ai_runs values:
- status = queued
- retry_count = 0
- fallback_applied = false
- provider_key = null
- model_key = null
- started_at = null
- completed_at = null

Response shape:

{
  "run_id": "UUID",
  "module": "narrative_direction_selection",
  "status": "queued",
  "execution_mode": "standard",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "UUID"
  },
  "created_at": "ISO_TIMESTAMP"
}

**Out of Scope:**
- context assembly
- prompt execution
- artifact creation

**Acceptance Criteria:**
- valid request creates ai_run
- active-run conflict returns 409
- readiness state persisted
- queue called exactly once
- success response matches contract exactly

---

## Ticket JOB-01

**Title:** Implement queued-run worker skeleton and state transitions  
**Type:** Backend / Worker  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** API-02, DB-07

**Description:**  
Build asynchronous worker skeleton for processing queued runs.

**Implementation Scope:**
Worker flow:
- load queued run
- assert status is queued
- mark running, set started_at
- call stubbed context assembly
- call stubbed module execution
- call stubbed validator
- write terminal run state
- set completed_at

Supported terminal states in skeleton:
- completed
- needs_more_input
- failed_validation
- system_error

**Out of Scope:**
- real prompt logic
- real provider integration
- final validator semantics

**Acceptance Criteria:**
- queued run transitions to running
- running run reaches terminal state
- timestamps persist correctly
- worker handles system error path cleanly
- duplicate execution prevented or safely idempotent

---

## Ticket JOB-02

**Title:** Persist stub validator_results and admissible artifacts from worker  
**Type:** Backend / Worker  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** JOB-01, DB-04, DB-05, DB-07

**Description:**  
Enable worker to persist validator and artifact outputs even before final module logic exists.

**Implementation Scope:**
On simulated accepted result:
- create validator_results
- create ai_artifacts
- create artifact_subject_links with at least primary subject

On simulated needs-more-input result:
- create validator_results
- create ai_artifacts with status needs_more_input

On blocked/failure path:
- create validator_results
- do not expose blocked/raw content

**Out of Scope:**
- final artifact text quality
- final evidence linking logic

**Acceptance Criteria:**
- accepted run creates validator + artifact
- needs-more-input run creates correct artifact
- blocked/failure content not leaked
- terminal state maps correctly from validator decision

---

## Ticket BE-01

**Title:** Implement Narrative Direction Selection payload contract v1  
**Type:** Backend / Domain  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** DB-04, JOB-02

**Description:**  
Lock initial artifact payload shape for frontend and API stability.

**Implementation Scope:**
Accepted payload:

{
  "status": "success",
  "best_direction": {
    "id": "direction_1",
    "title": "string",
    "summary": "string",
    "why_it_wins": "string",
    "main_risk": "string",
    "next_move": "string"
  },
  "alternatives": [
    {
      "id": "direction_2",
      "title": "string",
      "why_it_loses": "string",
      "risk": "string"
    }
  ],
  "evidence_anchors": [
    {
      "label": "string",
      "source_type": "story_entry",
      "source_id": "UUID_OR_NULL"
    }
  ],
  "recovery_question": null
}

Needs-more-input payload:

{
  "status": "needs_more_input",
  "best_direction": null,
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What changed for you after this event?"
}

Rules:
- best_direction.id required on success
- alternative ids unique
- evidence anchors required on accepted artifact
- selection endpoint must validate against ids in payload

**Out of Scope:**
- final model prompting
- content scoring

**Acceptance Criteria:**
- payload schema implemented in code
- retrieval endpoint returns exact structure
- selection validation can resolve selected_item_id against payload

---

## Ticket API-03

**Title:** Implement GET /v1/ai/runs/{run_id}  
**Type:** Backend / API  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** JOB-01

**Description:**  
Create polling endpoint for run execution state.

**Implementation Scope:**
Response shape:

{
  "run_id": "UUID",
  "module": "narrative_direction_selection",
  "status": "completed",
  "execution_mode": "standard",
  "readiness_state": "ready",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "UUID"
  },
  "artifact_id": "UUID_OR_NULL",
  "validator_result_id": "UUID_OR_NULL",
  "review_queue_item_id": null,
  "attempt_count": 1,
  "created_at": "ISO_TIMESTAMP",
  "started_at": "ISO_TIMESTAMP",
  "completed_at": "ISO_TIMESTAMP_OR_NULL"
}

Rules:
- execution state only
- no raw model output
- run state separate from artifact state

**Out of Scope:**
- artifact payload retrieval

**Acceptance Criteria:**
- owner can retrieve run state
- non-owner denied
- missing run returns 404
- null artifact id returned when no admissible artifact exists

---

## Ticket API-04

**Title:** Implement GET /v1/ai/runs/{run_id}/artifact  
**Type:** Backend / API  
**Priority:** P0  
**Estimate:** 4 points  
**Dependencies:** JOB-02, API-03, BE-01

**Description:**  
Return validated artifact and validator state for a completed run.

**Implementation Scope:**
Response shape:

{
  "run": {
    "run_id": "UUID",
    "module": "narrative_direction_selection",
    "status": "completed",
    "execution_mode": "standard",
    "readiness_state": "ready"
  },
  "artifact": {
    "id": "UUID",
    "module": "narrative_direction_selection",
    "schema_version": "v1.0",
    "status": "success",
    "summary": "Three plausible directions found; one clearly strongest.",
    "data": {},
    "warnings": [],
    "meta": {
      "selected": false,
      "is_canonical_for_subject": true,
      "created_at": "ISO_TIMESTAMP"
    }
  },
  "validator": {
    "validator_version": "v1.0",
    "structural_pass": true,
    "semantic_pass": true,
    "brand_pass": true,
    "authenticity_pass": true,
    "decision": "accept",
    "severity": "low",
    "failure_codes": [],
    "notes": []
  },
  "review": {
    "queued": false,
    "queue_item_id": null
  }
}

Rules:
- return only validated artifact
- no raw provider output
- no blocked content leakage

**Out of Scope:**
- user selection

**Acceptance Criteria:**
- owner can retrieve artifact
- missing artifact handled consistently
- blocked or failed validation content never exposed
- contract matches exactly

---

## Ticket API-05

**Title:** Implement POST /v1/ai/artifacts/{artifact_id}/select  
**Type:** Backend / API  
**Priority:** P0  
**Estimate:** 4 points  
**Dependencies:** DB-06, DB-08, API-04

**Description:**  
Persist explicit user direction choice.

**Implementation Scope:**
Request:

{
  "selected_item_id": "direction_1",
  "selected_rank": 1,
  "selection_context": "direction_choice"
}

Validation:
- artifact exists
- artifact owned by authenticated user
- artifact module is narrative_direction_selection
- selected item exists in artifact payload
- selection context is direction_choice

Transactional writes:
- insert artifact_selection_events
- update ai_artifacts.selected_by_user = true
- update ai_artifacts.selected_item_id
- update essay_projects.selected_direction_artifact_id

Success response:

{
  "artifact_id": "UUID",
  "selected_item_id": "direction_1",
  "status": "recorded",
  "recorded_at": "ISO_TIMESTAMP"
}

**Out of Scope:**
- stale-state logic after future edits

**Acceptance Criteria:**
- selection event inserted
- artifact flags updated
- essay project pointer updated
- invalid selected_item_id rejected
- transaction atomic
- cross-user selection forbidden

---

## Ticket TEST-01

**Title:** Add migration and schema tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** DB-01 through DB-08

**Description:**  
Add test coverage for migrations and schema integrity.

**Implementation Scope:**
Verify:
- migrations run on empty DB
- required tables exist
- required enums exist
- required indexes exist
- module registry seed exists
- foreign keys valid

**Out of Scope:**
- API behavior

**Acceptance Criteria:**
- CI fails on schema drift
- schema test suite deterministic

---

## Ticket TEST-02

**Title:** Add POST /v1/ai/runs API tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** API-01, API-02

**Description:**  
Add automated coverage for create-run request validation and persistence.

**Implementation Scope:**
Test:
- valid request returns 201
- malformed request returns 400
- unauthorized returns 403
- nonexistent project returns 404
- duplicate active run returns 409
- insufficient input returns 422
- enqueue called once

**Out of Scope:**
- worker internals

**Acceptance Criteria:**
- create-run behavior fully covered
- test results deterministic

---

## Ticket TEST-03

**Title:** Add worker state-transition tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 4 points  
**Dependencies:** JOB-01, JOB-02

**Description:**  
Add automated coverage for worker lifecycle and persistence behavior.

**Implementation Scope:**
Test:
- queued → running → completed
- queued → running → needs_more_input
- queued → running → failed_validation
- queued → running → system_error
- validator persisted correctly
- artifact persisted when admissible
- no blocked/raw content leakage

**Out of Scope:**
- real model provider integration

**Acceptance Criteria:**
- worker transitions fully covered
- timestamps and terminal states asserted

---

## Ticket TEST-04

**Title:** Add retrieval API tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** API-03, API-04

**Description:**  
Add automated coverage for run-state polling and artifact retrieval.

**Implementation Scope:**
Test:
- owner can fetch run state
- non-owner denied
- missing run returns 404
- completed run returns artifact id
- no admissible artifact handled consistently
- artifact retrieval never exposes raw or blocked content

**Out of Scope:**
- selection persistence

**Acceptance Criteria:**
- retrieval contracts fully covered
- endpoint responses stable

---

## Ticket TEST-05

**Title:** Add selection persistence tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** API-05

**Description:**  
Add automated coverage for direction selection write path.

**Implementation Scope:**
Test:
- valid selection inserts event
- artifact flags update
- essay project pointer updates
- invalid option id rejected
- cross-user access rejected
- transaction rollback on failure

**Out of Scope:**
- future stale-state handling

**Acceptance Criteria:**
- selection write behavior fully covered
- no partial writes on failed transaction path

---

## Recommended execution order

Use this exact order:
1. DB-01
2. DB-02
3. DB-03
4. DB-04
5. DB-05
6. DB-06
7. DB-07
8. DB-08
9. API-01
10. API-02
11. JOB-01
12. JOB-02
13. BE-01
14. API-03
15. API-04
16. API-05
17. TEST-01
18. TEST-02
19. TEST-03
20. TEST-04
21. TEST-05

## Safe parallelization

Can run in parallel:
- DB-05, DB-06, DB-07 after DB-04 stabilizes
- TEST-01 alongside final DB work
- API-03 and API-04 once JOB-02 and BE-01 contracts are stable
- TEST-04 and TEST-05 alongside late API work

Should not run in parallel:
- API-02 before DB foundation exists
- JOB-02 before artifact and validator tables exist
- API-05 before selection table and project pointer field exist

## Sprint 1 exit gate

Do not move to Sprint 2 until all are true:
- run can be created
- run can be processed asynchronously
- validator and artifact persistence works
- run/artifact retrieval works
- selection persists transactionally
- all tests are green
