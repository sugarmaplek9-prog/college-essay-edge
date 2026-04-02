# V1_AI_SERVICE_API_SPEC

## 1. Purpose

This document defines the authoritative v1 AI service contract for College Essay Edge.

It answers a practical implementation question:

**How does the backend invoke bounded AI modules in a way that is deterministic, validator-enforced, persistence-safe, permission-safe, and reviewable?**

This spec is the backend contract for:

* module execution requests
* module execution responses
* validation result handling
* retry and fallback handling
* provider abstraction
* artifact persistence boundaries
* admin and review operations tied to AI artifacts

If implementation choices, route behavior, or service-layer assumptions conflict with this document, this document wins.

This is not a prompt document.
This is not a vendor integration note.
This is the production AI service contract.

---

## 2. API design doctrine

### 2.1 The AI service is not a chatbot endpoint

The AI service does not expose a generic “ask AI” surface.
It exposes bounded module execution against typed workflow purposes.

### 2.2 Generation is provisional

A model response is never product truth by itself.
The service must treat generation as provisional until validation and admissibility are complete.

### 2.3 Product logic owns the outcome

The model may generate.
The API decides whether the output becomes:

* accepted
* accepted as partial
* retried
* reduced
* converted to needs-more-input
* blocked

### 2.4 The service returns product artifacts, not provider-native output

The API returns stable, product-owned objects.
No frontend or product logic should depend on provider response shape.

### 2.5 Every execution must produce inspectable operational state

Every invocation must create a run record, validator state, outcome state, and provenance state.
If that evidence does not exist, the execution is incomplete.

---

## 3. v1 service boundary

The v1 AI service sits behind the main backend.

The frontend should **not** call the model provider directly.
The frontend should **not** assemble full AI context locally.
The frontend should **not** decide admissibility.
The frontend should **not** persist raw model output.

The correct v1 boundary is:

**Frontend → Application Backend → AI Service Layer → Provider Adapter(s) → Validator → Persistence → Product Response**

That boundary is required because orchestration, permissions, validation, and persistence are product logic, not UI logic.

---

## 4. Supported v1 modules

The API must support these launch modules:

* `edge_snapshot`
* `story_vault_analysis`
* `narrative_direction_selection`
* `essay_feedback`
* `supplement_angle_suggestion`

Deferred / disabled in v1 by default:

* `outline_generation`
* `overlap_warning`

The API should be built so deferred modules can be added later without contract redesign.

---

## 5. Canonical service responsibilities

The AI service is responsible for exactly these steps:

1. resolve requested module
2. check permissions and workflow eligibility
3. assemble context bundle
4. assess readiness
5. choose execution mode
6. compose provider request using versioned prompt package
7. invoke provider through abstraction layer
8. validate output
9. make admissibility decision
10. run retry/fallback logic if needed
11. normalize artifact
12. persist run, artifact, validator result, and provenance
13. return product-approved response object
14. optionally create review queue items

The AI service is **not** responsible for:

* direct UI rendering
* billing decisions
* general chat
* counselor-style freeform conversation
* long-term analytics dashboards

---

## 6. Invocation model

### 6.1 Invocation types

The service supports three invocation types:

* **explicit user invocation**
* **workflow-triggered invocation**
* **admin/system replay invocation**

### 6.2 Explicit user invocation

Used when a student intentionally requests module output.

Examples:

* “help me choose a direction”
* “analyze my stories”
* “give feedback on this draft”
* “suggest supplement angles”

### 6.3 Workflow-triggered invocation

Used when a product event should deterministically trigger a module.

Examples:

* onboarding completed → `edge_snapshot`
* story entry added or changed → optional `story_vault_analysis`
* draft saved and feedback requested → `essay_feedback`

### 6.4 Admin/system replay invocation

Used for:

* benchmark runs
* debugging
* regression checks
* controlled artifact regeneration

### 6.5 Synchronous vs asynchronous behavior

v1 should use a **hybrid** pattern:

* request accepted synchronously
* execution may complete synchronously for small/fast module calls
* execution may continue asynchronously for heavier or retried calls

The contract must support both without changing response shape.

### 6.6 Default v1 recommendation

Use **backend-created run + polling or refetch** rather than trying to force every module into one long synchronous HTTP request.

Reason:

* validators and retries may add latency
* persistence is mandatory
* review escalation may occur before final user delivery
* the product needs a stable run record immediately

---

## 7. Top-level API surface

The v1 AI service should expose these endpoint groups.

### 7.1 Execution endpoints

* `POST /v1/ai/runs`
* `GET /v1/ai/runs/{run_id}`
* `GET /v1/ai/runs/{run_id}/artifact`
* `POST /v1/ai/runs/{run_id}/retry`

### 7.2 Artifact endpoints

* `GET /v1/ai/artifacts/{artifact_id}`
* `POST /v1/ai/artifacts/{artifact_id}/select`
* `GET /v1/ai/subjects/{entity_type}/{entity_id}/artifacts`

### 7.3 Admin / review endpoints

* `GET /v1/admin/review-queue`
* `GET /v1/admin/review-queue/{queue_item_id}`
* `POST /v1/admin/reviews`
* `POST /v1/admin/artifacts/{artifact_id}/labels`
* `POST /v1/admin/artifacts/{artifact_id}/benchmark-candidate`

### 7.4 Internal service endpoints

Optional internal-only boundaries:

* `POST /internal/v1/ai/validate`
* `POST /internal/v1/ai/providers/execute`
* `POST /internal/v1/ai/context-bundles`

These should not be exposed to the public client.

---

## 8. Canonical create-run endpoint

### 8.1 Endpoint

`POST /v1/ai/runs`

### 8.2 Purpose

Create a new AI execution run for a bounded module against a specific subject entity.

### 8.3 Request shape

```json
{
  "module": "narrative_direction_selection",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "essay_proj_123"
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
    "request_id": "req_123"
  }
}
```

### 8.4 Request field definitions

#### `module`

Canonical module identifier.
Must exist in `module_registry`.

#### `subject`

The primary entity the module is acting on.
The service resolves the rest of the context server-side.

#### `trigger`

Typed reason for invocation.
This is operationally important and must not be replaced with a vague free-text reason.

#### `requested_mode`

Optional requested execution posture.
Allowed values:

* `standard`
* `reduced_scope`
* `diagnostic_only`
* `refresh`

The service may override this based on readiness and policy.

#### `options.max_retries`

Client hint only.
Service-enforced retry cap still applies.

#### `options.allow_fallback_provider`

Allows provider fallback only if policy and module configuration permit it.

#### `options.force_refresh`

Used to bypass cached/canonical artifact reuse if policy permits.

#### `options.create_review_if_flagged`

Defaults to true for launch modules.

#### `client_context`

Operational metadata for tracing only.
Never used as primary product context.

### 8.5 Request validation rules

Reject the request before generation if:

* `module` is unknown or disabled
* subject entity does not exist
* actor is not permitted to run the module
* workflow state does not support the module
* required subject inputs are missing
* role boundary would be violated

### 8.6 Create-run response

```json
{
  "run_id": "run_123",
  "module": "narrative_direction_selection",
  "status": "queued",
  "execution_mode": "standard",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "essay_proj_123"
  },
  "created_at": "2026-03-11T19:00:00Z"
}
```

### 8.7 HTTP status guidance

* `201 Created` for accepted run creation
* `400 Bad Request` for malformed request
* `403 Forbidden` for permission or role boundary failure
* `404 Not Found` for missing subject
* `409 Conflict` for invalid workflow state or conflicting in-flight run policy
* `422 Unprocessable Entity` for insufficient required inputs before execution

---

## 9. Run-status endpoint

### 9.1 Endpoint

`GET /v1/ai/runs/{run_id}`

### 9.2 Purpose

Return the full product-visible execution status for one run.

### 9.3 Canonical response shape

```json
{
  "run_id": "run_123",
  "module": "narrative_direction_selection",
  "status": "completed",
  "execution_mode": "standard",
  "readiness_state": "ready",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "essay_proj_123"
  },
  "artifact_id": "artifact_456",
  "validator_result_id": "val_789",
  "review_queue_item_id": null,
  "attempt_count": 1,
  "created_at": "2026-03-11T19:00:00Z",
  "started_at": "2026-03-11T19:00:02Z",
  "completed_at": "2026-03-11T19:00:07Z"
}
```

### 9.4 Allowed run statuses

* `queued`
* `running`
* `completed`
* `partial`
* `needs_more_input`
* `failed_validation`
* `blocked`
* `system_error`

These are service statuses.
They are not identical to module artifact status.

---

## 10. Artifact retrieval endpoint

### 10.1 Endpoint

`GET /v1/ai/runs/{run_id}/artifact`

### 10.2 Purpose

Return the product-approved artifact and attached enforcement state for a completed or partial run.

### 10.3 Canonical response shape

```json
{
  "run": {
    "run_id": "run_123",
    "module": "narrative_direction_selection",
    "status": "completed",
    "execution_mode": "standard",
    "readiness_state": "ready"
  },
  "artifact": {
    "id": "artifact_456",
    "module": "narrative_direction_selection",
    "schema_version": "v1.0",
    "status": "success",
    "summary": "Three plausible directions found; one clearly strongest.",
    "data": {},
    "warnings": [],
    "meta": {
      "selected": false,
      "is_canonical_for_subject": true,
      "created_at": "2026-03-11T19:00:07Z"
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
```

### 10.4 Product rule

The artifact returned here must already be:

* normalized
* validated
* admissible
* persistence-safe
* provider-agnostic

Never return raw provider output from this endpoint.

---

## 11. Canonical module artifact envelope

All successful or partially successful module responses must use the common artifact envelope.

```json
{
  "module": "string",
  "schema_version": "string",
  "status": "success | partial | needs_more_input | failed_validation",
  "summary": "string",
  "data": {},
  "warnings": [],
  "meta": {}
}
```

### 11.1 Field rules

#### `module`

Must exactly match the requested module ID.

#### `schema_version`

Must match the validated module schema version.

#### `status`

Allowed values:

* `success`
* `partial`
* `needs_more_input`
* `failed_validation`

#### `summary`

High-signal synopsis for UI display and list views.
Never provider-native rambling.

#### `data`

Module-specific structured payload.
Must conform to the module output schema.

#### `warnings`

Structured warnings intended for product handling.

#### `meta`

Provider-agnostic operational metadata safe for downstream product use.

### 11.2 Meta minimums

`meta` should support at least:

```json
{
  "artifact_id": "artifact_456",
  "run_id": "run_123",
  "is_canonical_for_subject": true,
  "selected_by_user": false,
  "review_required": false,
  "render_version": "v1",
  "created_at": "2026-03-11T19:00:07Z"
}
```

---

## 12. Module request resolution rules

The service should be **subject-driven**, not free-text driven.

That means most module requests should be based on entity IDs plus trigger type, not giant client-side assembled payloads.

### 12.1 Why this is the correct v1 design

It keeps:

* permissions centralized
* context assembly centralized
* provenance correct
* retries reproducible
* benchmarking possible
* client contracts stable

### 12.2 Allowed request inputs

The client may send:

* module ID
* subject entity reference
* trigger type
* execution options
* tracing metadata

The client should **not** be required to send:

* full prompt text
* full stitched context bundle
* validator rule selection
* provider choice
* schema version

Those are service-owned concerns.

---

## 13. Subject entity rules by module

### 13.1 `edge_snapshot`

**Primary subject**

* `student_profile`

**Required context resolved server-side**

* onboarding responses
* core student profile
* relevant story inventory if available

### 13.2 `story_vault_analysis`

**Primary subject**

* `student_profile`

**Required context**

* active story entries
* existing project links if relevant

### 13.3 `narrative_direction_selection`

**Primary subject**

* `essay_project`

**Required context**

* student profile
* relevant story entries
* existing Edge Snapshot if available
* existing selected direction state if refresh

### 13.4 `essay_feedback`

**Primary subject**

* `essay_draft_version`

**Required context**

* parent essay project
* draft text
* relevant direction or story context if available

### 13.5 `supplement_angle_suggestion`

**Primary subject**

* `supplement_project`

**Required context**

* institution
* prompt text / prompt category
* student profile
* relevant personal statement context if available

---

## 14. Context assembly contract

Context assembly must happen inside the service.

### 14.1 Internal context bundle shape

```json
{
  "bundle_id": "bundle_123",
  "module": "essay_feedback",
  "subject": {
    "entity_type": "essay_draft_version",
    "entity_id": "draft_123"
  },
  "included_context": [],
  "excluded_context": [],
  "compressed_context": {},
  "readiness_state": "medium_readiness",
  "context_scores": {
    "context_readiness_score": 0.72,
    "authenticity_risk_score": 0.12
  },
  "created_at": "2026-03-11T19:00:04Z"
}
```

### 14.2 Readiness classes

Internal readiness classes:

* `high_readiness`
* `medium_readiness`
* `low_readiness`

Persisted run-level readiness states should be normalized into:

* `ready`
* `reduced`
* `insufficient_input`
* `stale_context`
* `blocked`

### 14.3 Readiness behavior

* `high_readiness` → standard generation usually allowed
* `medium_readiness` → standard or reduced-scope based on module and policy
* `low_readiness` → convert to reduced-scope, diagnostic-only, or needs-more-input

### 14.4 Hard rule

Weak evidence must not be padded with confident output.

---

## 15. Execution mode contract

The API must support these execution modes.

### 15.1 `standard`

Normal module generation when context is sufficient.

### 15.2 `reduced_scope`

Used when a narrower artifact can still be strong.

Examples:

* 2 supplement angles instead of 4
* 2 narrative lanes instead of 3

### 15.3 `diagnostic_only`

Used when diagnosis is better than recommendation.

Examples:

* identify why a draft is weak
* identify missing story depth before recommending directions

### 15.4 `needs_more_input`

Used when the correct product move is to stop and ask for better source material.

### 15.5 `refresh`

Used when the subject already has prior artifacts and regeneration is explicitly allowed.

---

## 16. Provider abstraction contract

The API must isolate provider-specific behavior behind a provider adapter interface.

### 16.1 Required provider adapter interface

```ts
interface AiProviderAdapter {
  execute(request: ProviderExecutionRequest): Promise<ProviderExecutionResult>
}
```

### 16.2 Canonical provider request

```json
{
  "provider_key": "openai_primary",
  "model_key": "gpt-x",
  "prompt_package": {
    "module": "essay_feedback",
    "version": "essay_feedback_prompt_v1.0",
    "components": {}
  },
  "schema_contract": {
    "module": "essay_feedback",
    "schema_version": "v1.0"
  },
  "execution_mode": "standard",
  "timeout_ms": 30000
}
```

### 16.3 Canonical provider execution result

```json
{
  "provider_key": "openai_primary",
  "model_key": "gpt-x",
  "raw_output": {},
  "token_usage": {
    "input_tokens": 1800,
    "output_tokens": 700
  },
  "latency_ms": 4200,
  "provider_request_id": "prov_req_123"
}
```

### 16.4 Hard rule

Provider adapters may return raw output internally.
The AI service must never expose that raw output directly to the client-facing contract.

### 16.5 v1 provider strategy

v1 should support:

* one primary provider
* optional one fallback provider

Do not build a dynamic multi-provider optimization engine into launch-critical paths.

---

## 17. Validation contract

Validation is mandatory for every generated artifact.

### 17.1 Internal validator input

```json
{
  "module": "essay_feedback",
  "schema_version": "v1.0",
  "execution_mode": "standard",
  "context_readiness": "medium_readiness",
  "artifact": {},
  "subject": {
    "entity_type": "essay_draft_version",
    "entity_id": "draft_123"
  }
}
```

### 17.2 Canonical validator result

```json
{
  "module": "essay_feedback",
  "validator_version": "v1.0",
  "structural_pass": true,
  "semantic_pass": false,
  "brand_pass": false,
  "authenticity_pass": true,
  "decision": "retry_tightened",
  "failure_codes": [
    "unranked_priorities",
    "generic_praise_block",
    "low_specificity_feedback"
  ],
  "severity": "high",
  "notes": [
    "Revision priorities are present but insufficiently differentiated."
  ]
}
```

### 17.3 Decision classes

Allowed validator decisions:

* `accept`
* `accept_partial`
* `retry_tightened`
* `retry_reduced_scope`
* `convert_to_needs_more_input`
* `block`

### 17.4 Hard rule

No user-visible success path may bypass validator evaluation.

---

## 18. Admissibility mapping

The service must map validator outcomes into final run/artifact outcomes.

### 18.1 Canonical mapping

| Validator decision            | Run status              | Artifact status             | User-visible behavior                  |
| ----------------------------- | ----------------------- | --------------------------- | -------------------------------------- |
| `accept`                      | `completed`             | `success`                   | show full artifact                     |
| `accept_partial`              | `partial`               | `partial`                   | show reduced artifact + warnings       |
| `retry_tightened`             | `running` then resolved | none yet or superseded      | retry with tighter instructions        |
| `retry_reduced_scope`         | `running` then resolved | none yet or superseded      | retry with narrower target             |
| `convert_to_needs_more_input` | `needs_more_input`      | `needs_more_input`          | ask for more material                  |
| `block`                       | `blocked`               | `failed_validation` or none | do not show generated success artifact |

### 18.2 Important nuance

A blocked generation may still create a run record and validator result.
It should not create a successful canonical artifact.

---

## 19. Retry and fallback contract

Retries must be bounded, stateful, and reason-aware.

### 19.1 Retry endpoint

`POST /v1/ai/runs/{run_id}/retry`

### 19.2 Retry request shape

```json
{
  "retry_mode": "retry_tightened",
  "reason": "manual_request",
  "options": {
    "allow_fallback_provider": true,
    "max_additional_attempts": 1
  }
}
```

### 19.3 Allowed retry modes

* `retry_tightened`
* `retry_reduced_scope`
* `refresh`

### 19.4 Retry rules

* no blind identical retry
* every retry must change something material
* retry cap must be enforced per run chain
* retries must preserve provenance

### 19.5 Fallback rules

Fallback may include:

* tighter schema instructions
* reduced candidate count
* diagnostic-only conversion
* needs-more-input conversion
* fallback provider invocation

Fallback may **not** include:

* relaxing authenticity boundaries
* allowing prose that should have been blocked
* hiding validator failures behind optimistic summaries

---

## 20. Needs-more-input contract

The needs-more-input path is a first-class API outcome.
It is not an error.

### 20.1 Canonical response shape

```json
{
  "run": {
    "run_id": "run_123",
    "module": "narrative_direction_selection",
    "status": "needs_more_input",
    "execution_mode": "needs_more_input",
    "readiness_state": "insufficient_input"
  },
  "artifact": {
    "id": "artifact_456",
    "module": "narrative_direction_selection",
    "schema_version": "v1.0",
    "status": "needs_more_input",
    "summary": "There is not enough story depth yet to recommend a strong direction.",
    "data": {
      "missing_inputs": [
        "story_specificity",
        "personal_change_evidence"
      ],
      "next_steps": [
        "Add two story entries with concrete scenes.",
        "Explain what changed in your thinking or behavior."
      ]
    },
    "warnings": [],
    "meta": {}
  },
  "validator": {
    "decision": "convert_to_needs_more_input",
    "severity": "medium",
    "failure_codes": ["insufficient_input_depth"]
  }
}
```

### 20.2 Hard rule

Needs-more-input should be honest, specific, and non-flattering.
Do not pad thin evidence with broad encouragement.

---

## 21. Failed-validation and blocked contract

### 21.1 Failed-validation retrieval behavior

If a run resolves to blocked or failed validation, the client may retrieve run state and a safe enforcement summary, but not raw blocked output.

### 21.2 Canonical safe blocked response

```json
{
  "run": {
    "run_id": "run_123",
    "module": "essay_feedback",
    "status": "blocked"
  },
  "artifact": null,
  "validator": {
    "decision": "block",
    "severity": "high",
    "failure_codes": [
      "ghostwriting_drift",
      "final_prose_risk"
    ],
    "notes": [
      "Output crossed the coaching boundary and should not be shown."
    ]
  },
  "review": {
    "queued": true,
    "queue_item_id": "rq_123"
  }
}
```

---

## 22. Artifact selection endpoint

### 22.1 Endpoint

`POST /v1/ai/artifacts/{artifact_id}/select`

### 22.2 Purpose

Capture explicit user selection of a ranked item inside an artifact.

### 22.3 Request shape

```json
{
  "selected_item_id": "direction_2",
  "selection_context": "direction_choice"
}
```

### 22.4 Behavior

The service should:

* verify the artifact is selectable
* verify the item exists in artifact payload
* create an `artifact_selection_event`
* update canonical project pointers if applicable
* preserve historical artifact state

### 22.5 Response shape

```json
{
  "artifact_id": "artifact_456",
  "selected_item_id": "direction_2",
  "selection_context": "direction_choice",
  "updated_subject": {
    "entity_type": "essay_project",
    "entity_id": "essay_proj_123"
  },
  "status": "recorded"
}
```

---

## 23. Subject-artifact listing endpoint

### 23.1 Endpoint

`GET /v1/ai/subjects/{entity_type}/{entity_id}/artifacts`

### 23.2 Purpose

Return historical and canonical artifacts associated with a subject.

### 23.3 Query parameters

* `module`
* `canonical_only`
* `include_superseded`
* `include_validator`
* `limit`

### 23.4 Default behavior

Default to returning canonical-first artifacts, newest first.

---

## 24. Permission and boundary enforcement

The AI service must enforce role and ownership boundaries before execution and before artifact retrieval.

### 24.1 Core rules

* students may invoke modules on their own eligible subjects
* supporting adults may view linked student outputs where explicitly permitted
* supporting adults may not impersonate student authorship through AI execution where policy disallows it
* admins may inspect artifacts, runs, labels, and review records

### 24.2 Hard rule

Permission checks happen **before** context assembly and **before** artifact retrieval.

### 24.3 Forbidden pattern

Do not rely on frontend role gating as the primary control.
The service must enforce the boundary itself.

---

## 25. Persistence contract

Persistence is required for every run, whether the outcome is success, partial, needs-more-input, or blocked.

### 25.1 Persist on run creation

Create:

* `ai_runs` row

### 25.2 Persist after context assembly

Create or attach:

* `context_bundle_snapshots` row if enabled
* updated readiness state on run

### 25.3 Persist after validation

Create:

* `validator_results` row
* `retry_decisions` row if applicable

### 25.4 Persist after admissible output

Create:

* `ai_artifacts` row
* `artifact_subject_links`
* optional `artifact_selection_events` later on explicit user action

### 25.5 Persist after review escalation

Create:

* `review_queue_items` row if flagged

### 25.6 Hard persistence rules

* invalid output may be stored only as internal run evidence, not as successful artifact state
* canonical subject pointers may only point to admissible artifacts
* a run is incomplete if validator and provenance state are missing

---

## 26. Provenance contract

Every persisted run and artifact must be traceable to:

* module ID
* module version or registry state
* prompt bundle version
* schema version
* validator version
* provider key
* model key
* execution mode
* readiness state
* retry count

### 26.1 Why this is non-negotiable

Without provenance, the system cannot support:

* regression debugging
* benchmark comparison
* false-pass / false-block analysis
* ML-readiness later

---

## 27. Admin and review API surface

### 27.1 Review queue list

`GET /v1/admin/review-queue`

#### Query params

* `status`
* `priority`
* `module`
* `queue_reason`
* `assigned_reviewer_user_id`
* `limit`

#### Response shape

```json
{
  "items": [
    {
      "queue_item_id": "rq_123",
      "artifact_id": "artifact_456",
      "module": "essay_feedback",
      "queue_reason": "authenticity_risk",
      "priority": "high",
      "status": "open",
      "created_at": "2026-03-11T19:10:00Z"
    }
  ]
}
```

### 27.2 Review queue item detail

`GET /v1/admin/review-queue/{queue_item_id}`

Must return:

* artifact envelope
* validator result
* subject summary
* provenance summary
* existing labels
* benchmark link state if any

### 27.3 Create review

`POST /v1/admin/reviews`

```json
{
  "artifact_id": "artifact_456",
  "review_queue_item_id": "rq_123",
  "review_type": "standard",
  "review_summary": "Output was strategically useful but too polished in one section.",
  "notes": "Flag for authenticity tuning."
}
```

### 27.4 Create labels

`POST /v1/admin/artifacts/{artifact_id}/labels`

```json
{
  "label_source": "human_review",
  "quality_label": "useful_but_soft",
  "uniqueness_label": "moderately_distinct",
  "authenticity_label": "borderline_polished",
  "substitution_risk_label": "medium",
  "failure_labels": ["generic_language"],
  "outcome_labels": ["user_selected_recommendation"],
  "review_confidence": "high",
  "notes": "Needed stronger evidence grounding."
}
```

### 27.5 Promote benchmark candidate

`POST /v1/admin/artifacts/{artifact_id}/benchmark-candidate`

```json
{
  "module": "essay_feedback",
  "case_name": "Strong draft but generic praise failure",
  "why_this_case_matters": "Useful for catching false-positive validator passes."
}
```

---

## 28. Error contract

The AI service must expose stable product errors.
Do not leak provider-native error payloads.

### 28.1 Canonical error shape

```json
{
  "error": {
    "code": "module_not_eligible",
    "message": "This module cannot run for the current subject state.",
    "details": {
      "module": "narrative_direction_selection",
      "subject_entity_type": "essay_project"
    },
    "request_id": "req_123"
  }
}
```

### 28.2 Recommended error codes

* `unknown_module`
* `module_disabled`
* `subject_not_found`
* `forbidden`
* `role_boundary_violation`
* `module_not_eligible`
* `missing_required_input`
* `run_conflict`
* `validation_blocked`
* `review_required_before_display`
* `system_error`
* `provider_timeout`
* `provider_unavailable`

### 28.3 Hard rule

Provider-specific failures must be translated into stable product error or run-status state.

---

## 29. Idempotency and conflict rules

### 29.1 Create-run idempotency

The service should support idempotency keys for create-run requests from the frontend.

### 29.2 Conflict rules

The service may reject or coalesce concurrent runs when:

* same module
* same subject
* same actor
* same trigger
* same freshness window

### 29.3 Canonical policy recommendation

In v1, prefer:

* one active in-flight run per module per subject
* explicit refresh to bypass cached/canonical reuse

---

## 30. Caching and artifact reuse policy

The service may reuse an existing canonical artifact when all of the following are true:

* same module
* same subject
* no relevant context changes
* no force refresh requested
* artifact still policy-valid

### 30.1 Important rule

Reused artifact delivery must still be represented as product state, not as an invisible shortcut.
The run may record `refresh = false` and `reused_artifact_id` in provenance.

---

## 31. Observability contract

Every run should emit enough metadata to support:

* incident debugging
* benchmark analysis
* false-pass / false-block analysis
* usefulness evaluation
* retry effectiveness evaluation

### 31.1 Minimum observability fields

* `run_id`
* `module`
* `subject_entity_type`
* `subject_entity_id`
* `trigger_type`
* `execution_mode`
* `readiness_state`
* `attempt_count`
* `final_decision`
* `provider_key`
* `model_key`
* `latency_ms`
* `artifact_id`
* `review_queue_item_id`

---

## 32. Security and privacy rules

### 32.1 No provider leakage to UI contract

The client contract must not depend on vendor-native field names, moderation objects, or raw completions.

### 32.2 No cross-student context contamination

Context assembly must be scoped strictly to the authorized student and linked entities.

### 32.3 No hidden role escalation through AI calls

A supporting adult cannot gain broader access by invoking modules against unowned or unauthorized student entities.

### 32.4 No blocked output display

Blocked or ghostwriting-risk outputs must not be displayed just because they exist internally.

---

## 33. Suggested internal service layering

For implementation, structure the AI service into these internal components:

* `ModuleResolver`
* `EligibilityGuard`
* `ContextAssembler`
* `ReadinessEvaluator`
* `PromptPackageBuilder`
* `ProviderExecutor`
* `ValidatorEngine`
* `AdmissibilityDecider`
* `RetryFallbackManager`
* `ArtifactNormalizer`
* `ArtifactRepository`
* `ReviewEscalationService`

Do not collapse all of this into one giant route handler.

---

## 34. Minimal end-to-end example

### 34.1 Request

`POST /v1/ai/runs`

```json
{
  "module": "essay_feedback",
  "subject": {
    "entity_type": "essay_draft_version",
    "entity_id": "draft_123"
  },
  "trigger": {
    "type": "user_action",
    "name": "essay_feedback_requested"
  },
  "requested_mode": "standard",
  "options": {
    "max_retries": 1,
    "allow_fallback_provider": true,
    "create_review_if_flagged": true
  }
}
```

### 34.2 Final successful retrieval

```json
{
  "run": {
    "run_id": "run_123",
    "module": "essay_feedback",
    "status": "completed",
    "execution_mode": "standard",
    "readiness_state": "ready"
  },
  "artifact": {
    "id": "artifact_456",
    "module": "essay_feedback",
    "schema_version": "v1.0",
    "status": "success",
    "summary": "The draft has a promising core but one revision priority stands out clearly.",
    "data": {
      "revision_priorities": [],
      "strengths": [],
      "watchouts": [],
      "next_steps": []
    },
    "warnings": [],
    "meta": {
      "is_canonical_for_subject": true,
      "selected_by_user": false
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
    "failure_codes": []
  },
  "review": {
    "queued": false,
    "queue_item_id": null
  }
}
```

---

## 35. Non-negotiables

1. No generic AI endpoint in v1.
2. No frontend-direct provider calls.
3. No raw model output as product response.
4. No success without validation.
5. No blocked output displayed to users.
6. No artifact persistence without run/provenance context.
7. No review workflow outside the API/data contract.
8. No provider abstraction leakage into UI behavior.
9. No retry without a real logic change.
10. No module execution that bypasses permissions, workflow eligibility, or authenticity boundaries.

---

## 36. Final directive

Build the v1 AI service as a deterministic execution layer, not a thin LLM wrapper.

The correct service shape is:

* typed module invocation
* server-owned context assembly
* readiness-aware execution mode selection
* provider-agnostic generation
* validator-enforced admissibility
* artifact-first persistence
* explicit retry/fallback behavior
* reviewable admin operations
* provenance everywhere

That is the v1 AI service standard.
