# EPIC

**Title:** Narrative Direction Selection — Context Assembler + Prompt/Validator v1  
**Type:** Epic  
**Priority:** P0  
**Description:**  
Implement the first production-capable intelligence path for Narrative Direction Selection. This sprint covers bounded source resolution, normalized context assembly, readiness evaluation, module execution contract, prompt bundle v1, provider adapter execution, structural validation, semantic validation, worker integration, provenance persistence, and automated test coverage.  
This sprint does not include frontend changes, evaluation-pack operations, broad multi-module abstraction, or generalized orchestration beyond this module.

## Sprint Exit Gate

- source resolution is bounded and deterministic
- normalized context pack is stable and provenance-preserving
- readiness classification is repeatable and honest
- prompt bundle supports standard, reduced, and needs-more-input modes
- provider adapter returns structured candidate payloads
- structural and semantic validators work and persist canonical results
- worker persists only admissible artifacts and provenance links
- all Sprint 2 tests pass

---

## Ticket CA-01

**Title:** Resolve bounded source inputs for Narrative Direction Selection  
**Type:** Backend / Domain  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** Sprint 1 complete

**Description:**  
Implement server-side source resolution for module = narrative_direction_selection and subject_entity_type = essay_project. This component must load only the allowed canonical sources for the module and exclude stale, irrelevant, rejected, or cross-project material.

**Implementation Scope:**  
Given:
- module = narrative_direction_selection
- subject_entity_type = essay_project
- subject_entity_id = UUID
- student_user_id = UUID

Load only:
- essay_project
- student_profile
- story_entries or equivalent rough-input records tied to the same student/project
- essay_draft_version only if designated current or canonically attached
- school-specific context only if canonically linked to the project or target school

Explicitly exclude:
- rejected artifacts
- superseded artifacts unless future refresh logic explicitly requires historical comparison
- archived/deleted story entries
- notes not linked to same student/project
- parent/advisor material unless separately typed and explicitly allowed
- stale draft versions when a newer current draft exists
- unrelated supplement context
- cross-project context

**Required Output Contract:**

{
  "essay_project": {},
  "student_profile": {},
  "story_entries": [],
  "current_draft": {},
  "school_context": {},
  "source_meta": {
    "story_entry_count": 0,
    "has_current_draft": false,
    "has_school_context": false
  }
}

**Out of Scope:**
- readiness scoring
- normalization
- prompt formatting
- model execution

**Acceptance Criteria:**
- valid essay_project resolves a bounded source set
- stale or unrelated sources are excluded
- current draft selected by canonical pointer or current flag, not heuristic guesswork
- optional source absence does not cause hard failure
- same input state returns same resolved source set

unit tests cover:
- project with story entries only
- project with current draft
- project with stale + current draft
- project with linked school context
- project with no optional context

---

## Ticket CA-02

**Title:** Build normalized context pack for Narrative Direction Selection  
**Type:** Backend / Domain  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** CA-01

**Description:**  
Transform resolved canonical sources into a compact, bounded, provenance-preserving context pack for model execution. The output must be deterministic and schema-stable.

**Implementation Scope:**  
Convert source resolution output into the normalized context pack below.

**Required Output Shape:**

{
  "module": "narrative_direction_selection",
  "subject": {
    "entity_type": "essay_project",
    "entity_id": "UUID"
  },
  "student_core": {
    "name": null,
    "grade_level": null,
    "intended_majors": [],
    "core_interests": [],
    "identity_notes": []
  },
  "story_signals": [
    {
      "source_id": "UUID",
      "source_type": "story_entry",
      "event_summary": "string",
      "change_signal": "string",
      "evidence_strength": "high|medium|low",
      "recency_rank": 1
    }
  ],
  "draft_signals": [
    {
      "source_id": "UUID",
      "source_type": "essay_draft_version",
      "signal_summary": "string",
      "strength": "high|medium|low"
    }
  ],
  "school_signals": [
    {
      "source_id": "UUID",
      "target_school": "string",
      "signal_summary": "string"
    }
  ],
  "context_gaps": [],
  "assembler_meta": {
    "story_signal_count": 0,
    "draft_signal_count": 0,
    "school_signal_count": 0,
    "used_current_draft": false
  }
}

**Normalization Rules:**
- collapse duplicate story entries describing the same event into one normalized signal
- preserve at most top relevant story signals; recommended max = 8
- preserve at most top relevant draft signals; recommended max = 5
- preserve at most top relevant school signals; recommended max = 3
- summarize long raw inputs into concise signal summaries
- preserve provenance for every emitted signal
- assign explicit recency rank for story signals
- separate student-core facts from story evidence
- do not emit decorative biography summaries
- do not turn thin notes into overconfident synthesized claims

**Explicit Exclusions:**
- unbounded raw text dumps
- duplicated signals with different wording
- generic personality claims unsupported by evidence
- derived claims lacking source provenance

**Out of Scope:**
- readiness decision
- prompt execution
- validator logic

**Acceptance Criteria:**
- normalized pack matches schema exactly
- each signal retains source_id and source_type
- duplicate same-event notes collapse correctly
- output remains bounded in size

tests cover:
- repeated same-event notes
- thin rough notes
- rich rough notes
- draft-only signal presence
- conflicting story notes

---

## Ticket CA-03

**Title:** Classify context readiness for Narrative Direction Selection  
**Type:** Backend / Domain  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** CA-02

**Description:**  
Implement deterministic readiness classification that decides whether the module should run in standard, reduced_scope, needs_more_input, or blocked mode.

**Implementation Scope:**  
Given normalized context, return:

{
  "readiness_state": "ready|reduced|insufficient_input|blocked",
  "execution_mode": "standard|reduced_scope|needs_more_input",
  "reasons": [
    "canonical_reason_code"
  ],
  "recommended_recovery_question_type": "turning_point|stakes|why_change|specificity_gap|null"
}

**Required Rules:**

ready
- enough evidence to support a ranked recommendation
- at least one story signal shows change, tension, or turning point
- evidence is not just resume facts

reduced
- evidence exists but is narrow
- constrained recommendation still defensible
- likely fewer strong alternatives available

insufficient_input
- input too thin for trustworthy recommendation
- mostly generic facts, labels, or activities
- story signals do not show change, tension, or consequence

blocked
- inaccessible subject
- invalid subject
- required canonical source missing in a way that makes execution nonsensical
- policy/workflow state forbids execution

**Canonical Reason Codes:**
- NO_STORY_SIGNAL
- ONLY_ACTIVITY_LIST
- NO_CHANGE_SIGNAL
- THIN_INPUT
- STALE_DRAFT_CONFLICT
- MISSING_SUBJECT
- ACCESS_DENIED
- WORKFLOW_BLOCKED
- SUFFICIENT_FOR_STANDARD
- SUFFICIENT_FOR_REDUCED

**Out of Scope:**
- wording of recovery question
- prompt execution
- provider call

**Acceptance Criteria:**
- one readiness state and one execution mode always returned
- reason codes are canonical strings only
- same normalized context always returns same result

tests cover:
- rich story context → ready / standard
- narrow but usable context → reduced / reduced_scope
- activity list only → insufficient_input / needs_more_input
- inaccessible subject → blocked

---

## Ticket MD-01

**Title:** Create Narrative Direction Selection module executor contract  
**Type:** Backend / Domain  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** CA-03

**Description:**  
Create the strict internal execution contract between worker orchestration and module logic.

**Implementation Scope:**  
Executor input must include:

{
  "run_id": "UUID",
  "module_key": "narrative_direction_selection",
  "execution_mode": "standard|reduced_scope|needs_more_input",
  "context_pack": {},
  "module_versions": {
    "prompt_version": "v1",
    "schema_version": "v1",
    "validator_version": "v1"
  }
}

Executor output must include:

{
  "provider_key": "string",
  "model_key": "string",
  "raw_response": {},
  "candidate_payload": {},
  "execution_meta": {
    "latency_ms": 0,
    "token_usage": {},
    "fallback_applied": false
  }
}

Rules:
- executor must not know about HTTP
- executor must not write public API responses
- executor must return candidate payload for validation
- raw provider response may be stored internally only if existing internal infra supports it; never persist to ai_artifacts

**Out of Scope:**
- persistence
- validation
- API response composition

**Acceptance Criteria:**
- worker can call executor with structured input
- executor returns candidate payload plus execution metadata
- transport layer is isolated from module logic

---

## Ticket PR-01

**Title:** Build prompt bundle v1 for Narrative Direction Selection  
**Type:** Backend / AI  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** MD-01

**Description:**  
Implement the first locked prompt package for Narrative Direction Selection. The prompt must produce one clear best direction, grounded alternatives, evidence anchors, and one next move, or route to needs-more-input honestly.

**Implementation Scope:**  
Prompt builder may consume only:
- execution mode
- normalized context pack
- output schema contract

Prompt must enforce:
- choose a winner
- alternatives must be meaningfully distinct
- every claim grounded in provided evidence
- no invented facts
- no generic admissions praise
- no equal ranking
- no “it depends” framing unless in needs-more-input mode
- concise/direct language

**Candidate Payload Schema — Success:**

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
      "source_type": "story_entry|essay_draft_version|student_profile|school_context",
      "source_id": "UUID|null"
    }
  ],
  "recovery_question": null
}

**Candidate Payload Schema — Needs More Input:**

{
  "status": "needs_more_input",
  "best_direction": null,
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "string"
}

**Required Variants:**
- standard
- reduced_scope
- needs_more_input

standard
- 1 winner
- 2 to 3 alternatives
- evidence anchors
- next move

reduced_scope
- 1 winner only if defensible
- 1 to 2 alternatives max
- constrained claims
- no inflated confidence

needs_more_input
- no winner
- no fake alternative set
- one brief explanation of what is unclear
- exactly one recovery question

**Out of Scope:**
- prompt experimentation platform
- multi-model orchestration
- agentic tools

**Acceptance Criteria:**
- prompt builder produces deterministic structure
- correct variant selected by execution mode
- schema target explicitly embedded in prompt
- tests verify required constraints per variant

---

## Ticket PR-02

**Title:** Execute prompt bundle v1 through provider adapter  
**Type:** Backend / AI  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** PR-01

**Description:**  
Connect prompt builder to real model invocation path and normalize provider output into candidate payload plus execution metadata.

**Implementation Scope:**  
Provider adapter must:
- accept prompt builder output
- call configured provider/model
- capture provider key, model key, latency, token usage
- return raw response and extracted candidate payload
- support one retry only for malformed JSON or transport failure
- not silently retry semantically weak output

**Extraction Rules:**
- parse model output as JSON
- reject non-object JSON
- reject output missing top-level status
- return structured extraction failure for downstream validation/decision mapping

**Out of Scope:**
- benchmarking
- broad fallback arbitration beyond one configured fallback if already supported
- output quality judgment

**Acceptance Criteria:**
- provider call executes successfully for valid prompt
- malformed JSON handled deterministically
- retry limited to parse/transport failure
- execution metadata returned to executor

---

## Ticket VA-01

**Title:** Validate Narrative Direction Selection candidate payload structure  
**Type:** Backend / Validator  
**Priority:** P0  
**Estimate:** 4 points  
**Dependencies:** PR-02, Sprint 1 payload contract

**Description:**  
Implement structural validator for Narrative Direction Selection candidate payloads.

**Implementation Scope:**

For status = success, require:
- best_direction present
- best_direction.id present
- non-empty title
- non-empty summary
- non-empty why_it_wins
- non-empty main_risk
- non-empty next_move
- alternatives present and array
- at least 1 alternative
- unique alternative ids
- no alternative id equal to best direction id
- every alternative has non-empty title, why_it_loses, risk
- evidence_anchors present and array
- at least 1 evidence anchor
- recovery_question = null

For status = needs_more_input, require:
- best_direction = null
- alternatives = []
- evidence_anchors = []
- non-empty recovery_question

**Canonical Failure Codes:**
- INVALID_JSON
- MISSING_STATUS
- MISSING_BEST_DIRECTION
- MISSING_NEXT_MOVE
- MISSING_ALTERNATIVES
- EMPTY_ALTERNATIVES
- DUPLICATE_DIRECTION_ID
- MISSING_EVIDENCE_ANCHORS
- INVALID_NEEDS_MORE_INPUT_SHAPE

**Out of Scope:**
- content quality
- tone analysis
- semantic judgment

**Acceptance Criteria:**
- validator returns pass/fail plus canonical failure codes
- malformed payloads consistently rejected
- both success and needs-more-input shapes supported
- tests cover each failure code

---

## Ticket VA-02

**Title:** Validate Narrative Direction Selection semantic quality  
**Type:** Backend / Validator  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** VA-01, CA-02, CA-03

**Description:**  
Implement semantic validator that rejects or downgrades structurally valid but product-weak outputs.

**Implementation Scope:**

Required semantic checks:

Clear winner check  
Reject if:
- winner and alternatives are materially the same
- ranking is effectively flat
- wording signals indecision without needs-more-input routing

Failure code:
- NO_CLEAR_WINNER

Fake variety check  
Reject if:
- alternatives are paraphrases of same core direction
- title differs but underlying angle does not

Failure code:
- FAKE_VARIETY

Evidence grounding check  
Reject or downgrade if:
- why-it-wins claims are not traceable to context signals
- evidence anchors do not support main claims
- invented specifics appear

Failure codes:
- UNGROUNDED_REASONING
- INVENTED_DETAIL

Genericity check  
Reject or downgrade if:
- output relies on generic trait framing
- decorative praise replaces evidence-based reasoning
- next move is generic/reusable across many cases

Failure code:
- GENERIC_OUTPUT

Needs-more-input honesty check  
Reject success output and convert to needs-more-input if:
- readiness is insufficient but output claims confidence
- output pretends differentiation where evidence is thin

Failure code:
- SHOULD_HAVE_BEEN_NEEDS_MORE_INPUT

**Allowed Decisions:**
- accept
- accept_partial
- convert_to_needs_more_input
- block

**Decision Guidance:**
- accept: strong enough for user display
- accept_partial: usable but constrained
- convert_to_needs_more_input: structure valid, confidence not earned
- block: too weak, too generic, ungrounded, or unfit for product display

**Out of Scope:**
- human review routing
- copy polish beyond obvious genericity/tone failure

**Acceptance Criteria:**
- semantic validator returns decision plus canonical failure codes
- success can be downgraded to needs-more-input
- fake-variety outputs are blocked

tests cover:
- clear winner
- fake variety
- generic praise
- invented detail
- thin input with dishonest confidence

---

## Ticket VA-03

**Title:** Compose persisted validator_results rows from validation outputs  
**Type:** Backend / Validator  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** VA-01, VA-02

**Description:**  
Convert structural and semantic validator outputs into the exact validator_results persistence contract created in Sprint 1.

**Implementation Scope:**  
Populate:
- structural_pass
- semantic_pass
- brand_pass
- authenticity_pass
- admissibility_decision
- highest_severity
- failure_codes_json
- warning_codes_json
- needs_more_input_reason_code

Rules:
- structural failure cannot produce accept
- semantic failure may produce block or convert-to-needs-more-input
- needs_more_input_reason_code required when decision is convert_to_needs_more_input
- severity reflects worst observed issue

**Out of Scope:**
- DB write mechanics
- review queue creation

**Acceptance Criteria:**
- composer returns DB-ready object matching schema
- decision mapping deterministic
- canonical failure/warning codes only
- tests cover each decision type

---

## Ticket WK-01

**Title:** Replace worker stubs with real Narrative Direction Selection execution flow  
**Type:** Backend / Worker  
**Priority:** P0  
**Estimate:** 8 points  
**Dependencies:** CA-03, MD-01, PR-02, VA-03

**Description:**  
Replace Sprint 1 worker stubs with the real bounded execution path for Narrative Direction Selection.

**Implementation Scope:**  
Worker must:
- load queued run
- mark running
- resolve sources
- build normalized context pack
- evaluate readiness
- determine execution mode
- if blocked:
  - persist blocked validator result
  - set run terminal state blocked
  - do not call provider
- if needs-more-input mode:
  - execute needs-more-input prompt path or deterministic recovery path if implemented
- execute provider call for standard/reduced-scope
- run structural validator
- run semantic validator
- compose validator result
- persist validator result
- if admissible:
  - persist artifact
  - persist artifact_subject_links
- update terminal run state
- set completed_at

**Run-State Mapping:**
- accept → completed
- accept_partial → partial
- convert_to_needs_more_input → needs_more_input
- block → blocked for hard readiness/policy failure, otherwise failed_validation
- infra/provider error → system_error

**Artifact-State Mapping:**
- accept → success
- accept_partial → partial
- convert_to_needs_more_input → needs_more_input

**Out of Scope:**
- multi-turn recovery persistence
- human review routing
- stale-state UI behavior

**Acceptance Criteria:**
- blocked runs do not call provider
- admissible outputs create artifacts
- failed validation does not leak raw output
- correct terminal run states persisted
- worker executes full bounded path end to end

---

## Ticket WK-02

**Title:** Persist artifact_subject_links from actual assembler provenance  
**Type:** Backend / Worker  
**Priority:** P1  
**Estimate:** 3 points  
**Dependencies:** WK-01

**Description:**  
Persist exact provenance used by the module, not merely the primary subject.

**Implementation Scope:**  
For accepted/partial artifacts, write:
- one primary_subject link for the essay_project
- one evidence_source link for each normalized story signal source actually used
- one evidence_source link for current draft if used
- one school_context link if used
- one selected_dependency link only if future refresh mode uses prior selected artifact

Rules:
- write only sources actually included in final context pack
- do not write every possible source row
- do not write duplicate links

**Out of Scope:**
- selection events
- historical backfill

**Acceptance Criteria:**
- provenance rows reflect actual used context
- no duplicate links
- accepted artifact auditable back to source entities

---

## Ticket TEST-06

**Title:** Add source resolution and normalization tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** CA-01, CA-02

**Description:**  
Add automated coverage for source resolution and normalized context pack building.

**Implementation Scope:**  
Test:
- multiple story entries
- duplicate same-event notes collapse
- stale draft excluded when current draft exists
- school context included only when linked
- unrelated project data excluded
- bounded output size enforced

**Out of Scope:**
- readiness
- prompt execution

**Acceptance Criteria:**
- tests pass deterministically
- provenance preserved in normalized output assertions

---

## Ticket TEST-07

**Title:** Add readiness evaluator tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 2 points  
**Dependencies:** CA-03

**Description:**  
Add automated coverage for readiness classification and execution mode mapping.

**Implementation Scope:**  
Test:
- rich story context → ready / standard
- narrow but usable context → reduced / reduced_scope
- activity-list-only input → insufficient_input / needs_more_input
- blocked project access → blocked
- stale draft conflict reason code when applicable

**Out of Scope:**
- prompt content
- provider call

**Acceptance Criteria:**
- same input always yields same readiness result
- reason codes match contract exactly

---

## Ticket TEST-08

**Title:** Add prompt builder and provider adapter tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 3 points  
**Dependencies:** PR-01, PR-02

**Description:**  
Add automated coverage for prompt variants and provider execution behavior.

**Implementation Scope:**  
Test:
- standard variant contains winner-selection constraints
- reduced-scope variant limits overclaiming
- needs-more-input variant suppresses winner output
- malformed JSON handled deterministically
- single retry occurs only on transport/parse failure

**Out of Scope:**
- semantic validation

**Acceptance Criteria:**
- prompt variants behave exactly by execution mode
- provider adapter returns normalized execution metadata

---

## Ticket TEST-09

**Title:** Add structural and semantic validator tests  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 4 points  
**Dependencies:** VA-01, VA-02, VA-03

**Description:**  
Add automated coverage for structural validator, semantic validator, and validator result composer.

**Implementation Scope:**  
Test:
- missing best direction
- missing next move
- empty alternatives
- duplicate ids
- no clear winner
- fake variety
- invented detail
- generic output
- dishonest confidence on thin input
- proper conversion to needs-more-input

**Out of Scope:**
- provider behavior
- API retrieval

**Acceptance Criteria:**
- every canonical failure code covered
- every validator decision covered
- composer returns DB-ready structure

---

## Ticket TEST-10

**Title:** Add end-to-end worker execution tests for Narrative Direction Selection v1  
**Type:** QA / Backend  
**Priority:** P0  
**Estimate:** 5 points  
**Dependencies:** WK-01, WK-02

**Description:**  
Add end-to-end backend tests covering the real module execution path.

**Implementation Scope:**  
Test:
- ready context → accepted artifact
- reduced context → constrained accepted/partial artifact
- insufficient input → needs-more-input artifact
- blocked subject → blocked run with no provider call
- structurally invalid model output → failed_validation
- semantically weak fake-variety output → failed_validation
- provenance links written correctly for accepted artifact

**Out of Scope:**
- frontend rendering
- evaluation pack scoring

**Acceptance Criteria:**
- full module path works end to end
- terminal states and persisted data match contract exactly

---

## Required Execution Order

Engineering should execute in this exact order:
1. CA-01
2. CA-02
3. CA-03
4. MD-01
5. PR-01
6. PR-02
7. VA-01
8. VA-02
9. VA-03
10. WK-01
11. WK-02
12. TEST-06
13. TEST-07
14. TEST-08
15. TEST-09
16. TEST-10

---

## Parallelization Guidance

Safe parallel work:
- TEST-06 can begin once CA-02 stabilizes
- TEST-07 can begin once CA-03 stabilizes
- TEST-08 can begin once prompt and provider contracts are stable
- TEST-09 can be built alongside validator implementation
- WK-02 can begin after worker integration contract is stable

Not safe to parallelize:
- PR-02 before PR-01 exists
- VA-02 before VA-01 exists
- WK-01 before context assembler, executor, prompt path, and validator contracts exist

---

## Sprint 2 Exit Gate

Do not proceed to evaluation pack or further product expansion until all are true:
- source resolution is bounded and deterministic
- normalized context pack is stable and provenance-preserving
- readiness classification is honest and repeatable
- prompt bundle supports all three modes
- provider adapter returns structured candidate payloads
- structural validator rejects malformed outputs
- semantic validator rejects fake variety, genericity, weak grounding, and dishonest confidence
- worker persists only admissible artifacts
- provenance links are correctly written
- all tests pass

---

## One-Line Handoff for Engineering Leadership

Implement Sprint 2 as the bounded Narrative Direction Selection intelligence path: deterministic source resolution, normalized context assembly, readiness classification, locked prompt bundle v1, provider execution, structural and semantic validation, and worker integration that persists only validated artifacts with provenance.
