# Sprint 2 — Context Assembler + Prompt/Validator v1

## Engineer-Facing Execution Package (Linear)

## Sprint objective

Implement the first production-capable intelligence path for Narrative Direction Selection.

At the end of Sprint 2, the system must be able to:
- load the correct subject and source inputs for an essay_project
- assemble a bounded, deterministic context pack
- classify readiness honestly
- execute the Narrative Direction Selection module against that context
- validate the output structurally and semantically
- persist either:
  - accepted artifact
  - partial artifact
  - needs-more-input artifact
  - blocked result with no user-visible artifact leakage

This sprint is not about general AI infrastructure.
This sprint is about making one module work correctly.

---

## Sprint 2 implementation order (must follow exactly)

1. implement context source resolution
2. implement context assembler normalization
3. implement readiness evaluation
4. implement module execution contract
5. implement prompt bundle v1
6. implement provider adapter call path
7. implement structural validator
8. implement semantic validator
9. implement decision mapping
10. wire worker to real assembler + prompt + validator
11. persist artifact provenance links
12. add automated tests for all above

Do not start frontend work from this sprint package.

---

## Non-negotiable implementation rules

Engineering must follow these rules exactly:
- Build only for narrative_direction_selection
- Build only for subject_entity_type = essay_project
- Do not generalize for other modules yet
- Do not add open-ended context ingestion
- Do not expose raw model prompts or raw model outputs in public API
- Do not permit parent/advisor material to outrank student-authored material by default
- Do not treat missing information as permission to fabricate specificity
- Do not silently degrade from weak evidence into generic confidence
- Do not allow validator-passing output that lacks a clear winner
- Do not allow validator-passing output that has fake variety across options

---

## Section 1 — Context Assembler

### Ticket CA-01

**Title:** Resolve bounded source inputs for Narrative Direction Selection  
**Type:** Backend / Domain  
**Priority:** P0  
**Dependencies:** Sprint 1 complete

**Purpose**

Given an essay_project subject, resolve the exact allowed source records for this module.

**Required source inputs**

The assembler may load only the following source classes for v1:
- essay_project
- student_profile
- story_entries or equivalent rough-input records tied to the student/project
- essay_draft_version only if designated current or explicitly attached to the project
- school-specific context only if already available as canonical project-linked data

**Required exclusions**

The assembler must exclude:
- rejected artifacts
- superseded artifacts unless refresh logic explicitly requires historical comparison
- archived or deleted story entries
- notes not linked to the same student/project
- parent/advisor notes unless they are explicitly labeled and separately typed
- stale draft versions when a newer current draft exists
- unrelated supplement context
- cross-project context

**Resolution contract**

Input:

{
  "module": "narrative_direction_selection",
  "subject_entity_type": "essay_project",
  "subject_entity_id": "UUID",
  "student_user_id": "UUID"
}

Output internal object:

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

**Required behavior**
- resolution must be deterministic
- current draft must be selected by canonical pointer or latest valid current flag, not “most recent row” guesswork
- school context must be included only if linked to the current essay project or target school
- if no current draft exists, continue without draft context
- if no story entries exist, continue only if minimal rough-input equivalent exists elsewhere
- do not fail hard for optional source absence

**Out of scope**
- readiness scoring
- normalization
- prompt formatting

**Acceptance criteria**
- valid essay_project resolves bounded source set
- stale or unrelated sources are excluded
- source resolution returns stable structure
- missing optional sources do not crash resolution

**Test cases**
- project with story entries only
- project with current draft
- project with stale draft + current draft
- project with school context
- project with no optional context

---

### Ticket CA-02

**Title:** Build normalized context pack for Narrative Direction Selection  
**Type:** Backend / Domain  
**Priority:** P0  
**Dependencies:** CA-01

**Purpose**

Transform resolved canonical sources into a compact, bounded, model-ready context object.

**Required output shape**

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

**Required normalization rules**
- collapse duplicate story entries into one normalized signal when they clearly refer to the same event
- preserve at most the top relevant story signals required for the module; recommended max = 8
- preserve at most the top relevant draft signals; recommended max = 5
- preserve at most the top relevant school signals; recommended max = 3
- convert long raw input into concise normalized summaries
- keep provenance for every normalized signal via source_id and source_type
- rank recency explicitly
- separate student-core facts from story evidence
- do not include decorative biography summaries
- do not convert thin notes into overconfident synthesized claims

**Required exclusions**

Do not emit:
- unbounded raw text dumps
- duplicate signals with different wording
- generic personality labels unsupported by evidence
- derived claims without traceable provenance

**Out of scope**
- readiness decision
- prompt execution

**Acceptance criteria**
- normalized pack matches schema exactly
- each signal keeps provenance
- duplicate event inputs are collapsed correctly
- output remains bounded in size

**Test cases**
- repeated same-event notes
- thin rough notes
- rich rough notes
- draft-only signal presence
- conflicting story notes

---

### Ticket CA-03

**Title:** Classify context readiness for Narrative Direction Selection  
**Type:** Backend / Domain  
**Priority:** P0  
**Dependencies:** CA-02

**Purpose**

Determine whether the assembled context supports:
- standard generation
- reduced-scope generation
- needs-more-input flow
- blocked execution

**Required output**

{
  "readiness_state": "ready|reduced|insufficient_input|blocked",
  "execution_mode": "standard|reduced_scope|needs_more_input",
  "reasons": [
    "canonical_reason_code"
  ],
  "recommended_recovery_question_type": "turning_point|stakes|why_change|specificity_gap|null"
}

**Required rules**

ready
- Use when:
  - there is enough evidence to support a ranked recommendation
  - at least one story signal contains a change/tension/turning-point indicator
  - evidence is not dominated by generic resume facts only

reduced
- Use when:
  - evidence is present but narrow
  - recommendation may still be attempted with constrained output
  - likely fewer strong alternatives available

insufficient_input
- Use when:
  - inputs are too thin for a trustworthy recommendation
  - context is mostly generic facts, labels, or activities
  - story signals do not show meaningful change, tension, or consequence

blocked
- Use when:
  - project inaccessible
  - subject invalid
  - required canonical source missing in a way that makes execution nonsensical
  - policy or workflow state forbids module execution

**Required reason codes**

Use canonical codes only:
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

**Required behavior**
- readiness must be deterministic given same normalized context
- readiness cannot use model output to justify itself
- blocked must be reserved for hard failure/policy cases only
- insufficient input must still allow downstream needs-more-input artifact path

**Out of scope**
- wording of recovery question
- model call

**Acceptance criteria**
- readiness evaluator returns one state and one execution mode
- reason codes are canonical
- same input returns same readiness result

**Test cases**
- rich story signal → ready
- narrow but usable signal → reduced
- activity list only → insufficient_input
- inaccessible subject → blocked

---

## Section 2 — Module Execution Contract

### Ticket MD-01

**Title:** Create module executor contract for Narrative Direction Selection  
**Type:** Backend / Worker  
**Priority:** P0  
**Dependencies:** CA-03

**Purpose**

Create a strict internal interface between worker and module logic.

**Required function signature**

Engineering may adapt to language/framework, but the execution contract must contain the following inputs:

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

**Required outputs**

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

**Required behavior**
- module executor must not know about HTTP
- module executor must not write directly to public API responses
- module executor must return a candidate payload for validation
- raw provider response may be stored internally if your system already supports it, but not in ai_artifacts

**Out of scope**
- validator logic
- persistence logic

**Acceptance criteria**
- worker can call module executor with structured input
- executor returns candidate payload and execution metadata
- executor is isolated from transport layer concerns

---

## Section 3 — Prompt Bundle v1

### Ticket PR-01

**Title:** Build prompt bundle v1 for Narrative Direction Selection  
**Type:** Backend / Prompt  
**Priority:** P0  
**Dependencies:** MD-01

**Purpose**

Create the first locked prompt package for the module.

**Prompt objective**

The model must produce:
- one clear best direction
- meaningful alternatives
- evidence-grounded reasoning
- one clear next move
- no hedging that collapses the recommendation

**Required prompt inputs**

Prompt builder must consume only:
- execution mode
- normalized context pack
- output schema contract

**Required prompt constraints**

Prompt instructions must enforce:
- choose a winner
- alternatives must be meaningfully distinct
- every claim must be grounded in provided evidence
- no invented facts
- no generic admissions praise
- no equal ranking
- no “it depends” framing unless routed to needs-more-input mode
- keep language concise and direct

**Required output target**

Prompt must instruct the model to produce a JSON object matching the exact candidate payload schema.

Candidate payload schema for accepted result:

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

Candidate payload schema for needs-more-input mode:

{
  "status": "needs_more_input",
  "best_direction": null,
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "string"
}

**Required prompt variants**

Implement three variants only:
- standard
- reduced_scope
- needs_more_input

standard
- Ask for:
  - 1 winner
  - 2 to 3 alternatives
  - evidence anchors
  - next move

reduced_scope
- Ask for:
  - 1 winner if defensible
  - 1 to 2 alternatives max
  - more constrained claims
  - no inflated confidence

needs_more_input
- Ask for:
  - no winner
  - no fake alternative set
  - one brief explanation of what is unclear
  - exactly one recovery question

**Out of scope**
- prompt experimentation framework
- multi-model orchestration
- agentic tools

**Acceptance criteria**
- prompt builder produces deterministic prompt structure
- prompt variant selected by execution mode
- output target schema included explicitly
- tests verify prompt contains required constraints and correct variant behavior

---

### Ticket PR-02

**Title:** Execute prompt bundle v1 through provider adapter  
**Type:** Backend / Provider  
**Priority:** P0  
**Dependencies:** PR-01

**Purpose**

Connect module executor to actual model invocation path.

**Required behavior**
- accept prompt builder output
- call configured provider/model
- capture provider key, model key, latency, and token usage
- return raw response and extracted candidate payload for validation
- support one configured retry only for malformed JSON or transport failure
- do not silently retry on semantically poor output

**Required extraction rules**
- parse model output as JSON
- reject output that is not valid JSON object
- reject output missing top-level status
- return extraction failure in structured form for validator/decision layer

**Out of scope**
- fallback provider arbitration beyond single configured fallback if already supported
- benchmarking logic

**Acceptance criteria**
- provider adapter executes prompt successfully
- malformed JSON path handled deterministically
- retry behavior limited to transport or parse failure
- execution metadata returned to module executor

---

## Section 4 — Validator v1

### Ticket VA-01

**Title:** Validate Narrative Direction Selection candidate payload structure  
**Type:** Backend / Validator  
**Priority:** P0  
**Dependencies:** PR-02, BE-01 from Sprint 1

**Purpose**

Reject malformed or incomplete model outputs before semantic evaluation.

**Required checks for status = success**
- best_direction present
- best_direction.id present
- best_direction.title non-empty
- best_direction.summary non-empty
- best_direction.why_it_wins non-empty
- best_direction.main_risk non-empty
- best_direction.next_move non-empty
- alternatives present and array
- at least 1 alternative exists
- all alternative ids unique
- no alternative id equals best_direction.id
- each alternative has non-empty title, why_it_loses, risk
- evidence_anchors present and array
- at least 1 evidence anchor exists
- recovery_question must be null

**Required checks for status = needs_more_input**
- best_direction = null
- alternatives = []
- evidence_anchors = []
- recovery_question non-empty string

**Required failure codes**

Use canonical codes only:
- INVALID_JSON
- MISSING_STATUS
- MISSING_BEST_DIRECTION
- MISSING_NEXT_MOVE
- MISSING_ALTERNATIVES
- EMPTY_ALTERNATIVES
- DUPLICATE_DIRECTION_ID
- MISSING_EVIDENCE_ANCHORS
- INVALID_NEEDS_MORE_INPUT_SHAPE

**Out of scope**
- judging content quality
- tone analysis

**Acceptance criteria**
- structural validator returns pass/fail and failure codes
- malformed payloads are consistently rejected
- success and needs-more-input shapes are both supported
- test suite covers each failure code

---

### Ticket VA-02

**Title:** Validate Narrative Direction Selection semantic quality  
**Type:** Backend / Validator  
**Priority:** P0  
**Dependencies:** VA-01, CA-02, CA-03

**Purpose**

Reject outputs that are structurally valid but product-weak.

**Required semantic checks**

Clear winner check
- Reject if:
  - winner and alternatives are materially the same
  - ranking is effectively flat
  - language indicates indecision without needs-more-input routing
- Canonical failure code:
  - NO_CLEAR_WINNER

Fake variety check
- Reject if:
  - alternatives are paraphrases of same core direction
  - title changes but underlying angle is unchanged
- Canonical failure code:
  - FAKE_VARIETY

Evidence grounding check
- Reject or downgrade if:
  - why-it-wins claims are not traceable to context signals
  - evidence anchors do not support main claims
  - invented specifics appear
- Canonical failure codes:
  - UNGROUNDED_REASONING
  - INVENTED_DETAIL

Genericity check
- Reject or downgrade if:
  - output relies on generic trait framing
  - uses decorative praise instead of evidence-based reasoning
  - next move is generic enough to be reusable across many cases
- Canonical failure code:
  - GENERIC_OUTPUT

Needs-more-input honesty check
- Reject success output and convert to needs-more-input if:
  - context readiness is insufficient but output claims confidence
  - output pretends differentiation where evidence is thin
- Canonical failure code:
  - SHOULD_HAVE_BEEN_NEEDS_MORE_INPUT

**Validator decision outputs**

Validator must return one of:
- accept
- accept_partial
- convert_to_needs_more_input
- block

**Required mapping guidance**
- use accept only when output is strong enough to show to user
- use accept_partial only if output is usable but visibly constrained
- use convert_to_needs_more_input when structure may be valid but confidence is not earned
- use block when output is too weak, too generic, ungrounded, or unsafe for product quality

**Out of scope**
- brand polish scoring beyond obvious genericity and tone failure
- human review queue routing

**Acceptance criteria**
- semantic validator returns decision plus failure codes
- validator can downgrade success to needs-more-input
- validator can block fake-variety outputs

**Test cases**
- clear winner
- fake variety
- generic praise
- invented detail
- thin input producing dishonest confidence

---

### Ticket VA-03

**Title:** Compose validator_results rows from structural and semantic validation  
**Type:** Backend / Validator  
**Priority:** P0  
**Dependencies:** VA-01, VA-02

**Purpose**

Convert validator findings into the exact persisted validator_results contract used in Sprint 1.

**Required persisted fields**

Must populate:
- structural_pass
- semantic_pass
- brand_pass
- authenticity_pass
- admissibility_decision
- highest_severity
- failure_codes_json
- warning_codes_json
- needs_more_input_reason_code

**Required behavior**
- structural failure must always imply non-accept decision
- semantic failure may produce block or convert_to_needs_more_input
- needs_more_input_reason_code must be populated when decision is convert_to_needs_more_input
- severity must reflect worst observed issue

**Out of scope**
- persistence mechanics already handled in Sprint 1
- review queue creation

**Acceptance criteria**
- validator composer outputs exact DB-ready structure
- decision mapping is deterministic
- failure and warning codes are canonical
- tests cover each decision type

---

## Section 5 — Worker Integration

### Ticket WK-01

**Title:** Wire worker to real Narrative Direction Selection execution flow  
**Type:** Backend / Worker  
**Priority:** P0  
**Dependencies:** CA-03, MD-01, PR-02, VA-03

**Purpose**

Replace Sprint 1 stub execution path with actual module logic.

**Required worker phases**
- load queued run
- mark running
- resolve sources
- build normalized context pack
- evaluate readiness
- determine execution mode
- if blocked:
  - write validator_results-equivalent blocked result
  - set run terminal state to blocked
  - do not generate
- if needs-more-input mode:
  - execute needs-more-input prompt path or direct deterministic recovery path if implemented
- execute provider call for standard or reduced-scope mode
- run structural validator
- run semantic validator
- compose validator result
- persist validator result
- if admissible:
  - persist artifact
  - persist artifact_subject_links
- update ai_runs terminal state
- set completed_at

**Required run-state mapping**
- accept → completed
- accept_partial → partial
- convert_to_needs_more_input → needs_more_input
- block → failed_validation or blocked depending on reason:
  - use blocked for hard readiness/policy failure
  - use failed_validation for quality failure after generation
- infra/provider error → system_error

**Required artifact-state mapping**
- accept → success
- accept_partial → partial
- convert_to_needs_more_input → needs_more_input

**Out of scope**
- multi-turn recovery loop persistence
- human review routing
- stale-state UI

**Acceptance criteria**
- worker executes real path end-to-end
- blocked runs do not call provider
- admissible outputs create artifacts
- failed validation does not leak raw output
- provenance links are written for used sources
- run terminal states are correct

---

### Ticket WK-02

**Title:** Write artifact_subject_links from actual assembler provenance  
**Type:** Backend / Worker  
**Priority:** P1  
**Dependencies:** WK-01

**Purpose**

Persist exact provenance used by the module, not just primary subject.

**Required links for accepted or partial artifacts**

Must write:
- one primary_subject link for the essay_project
- one evidence_source link for each normalized story signal source actually used
- one evidence_source link for current draft if used
- one school_context link if school context used
- one selected_dependency link only if refresh mode later uses prior selected artifact

**Required behavior**
- write only sources actually included in final context pack
- do not write every possible source row
- do not write duplicate links

**Out of scope**
- selection events
- historical backfill

**Acceptance criteria**
- provenance rows reflect actual used context
- no duplicate links
- artifact can be audited back to source entities

---

## Section 6 — Automated Test Coverage

### Ticket TEST-06

**Title:** Test source resolution and normalized context pack builder  
**Type:** QA / Backend  
**Priority:** P0  
**Dependencies:** CA-01, CA-02

**Test coverage required**
- project with multiple story entries
- duplicate same-event notes collapse correctly
- stale draft excluded when current draft exists
- school context included only when linked
- unrelated project data excluded
- bounded output size enforced

**Acceptance criteria**
- tests pass deterministically
- provenance preserved in normalized outputs

---

### Ticket TEST-07

**Title:** Test readiness classification and execution mode mapping  
**Type:** QA / Backend  
**Priority:** P0  
**Dependencies:** CA-03

**Test coverage required**
- rich story context → ready / standard
- narrow but usable context → reduced / reduced_scope
- activity-list-only input → insufficient_input / needs_more_input
- blocked project access → blocked
- stale draft conflict reason code when applicable

**Acceptance criteria**
- same input always yields same readiness result
- reason codes match contract

---

### Ticket TEST-08

**Title:** Test prompt bundle variants and provider execution path  
**Type:** QA / Backend  
**Priority:** P0  
**Dependencies:** PR-01, PR-02

**Test coverage required**
- standard variant contains winner-selection constraints
- reduced-scope variant constrains overclaiming
- needs-more-input variant suppresses winner output
- malformed JSON response handled deterministically
- single retry occurs only on transport/parse failure

**Acceptance criteria**
- prompt variants behave exactly by mode
- provider adapter returns normalized execution metadata

---

### Ticket TEST-09

**Title:** Test Narrative Direction Selection validator v1  
**Type:** QA / Backend  
**Priority:** P0  
**Dependencies:** VA-01, VA-02, VA-03

**Test coverage required**
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

**Acceptance criteria**
- each canonical failure code covered
- each validator decision covered
- composer returns DB-ready result

---

### Ticket TEST-10

**Title:** Test full worker execution path for Narrative Direction Selection v1  
**Type:** QA / Backend  
**Priority:** P0  
**Dependencies:** WK-01, WK-02

**Test coverage required**
- ready context → accepted artifact
- reduced context → partial or accepted constrained artifact
- insufficient input → needs-more-input artifact
- blocked subject → blocked run with no provider call
- structurally invalid model output → failed_validation
- semantically weak fake-variety output → failed_validation
- provenance links written correctly for accepted artifact

**Acceptance criteria**
- full module path works end-to-end
- terminal states and persisted data match contract exactly

---

## Required engineering output contracts

### Candidate payload contract from model layer

{
  "status": "success|needs_more_input",
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

### Persisted artifact rules

Engineering must persist only validated, admissible output to ai_artifacts.

Never persist raw provider output in ai_artifacts.

### Public API rules

Engineering must never expose:
- raw prompt text
- raw provider output
- blocked candidate payloads
- failed-validation candidate payloads

---

## Exact execution order for the team

Use this order exactly:
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

## Sprint 2 exit gate

Do not proceed to evaluation pack or frontend expansion until all are true:
- context resolution is bounded and deterministic
- normalized context pack is stable and provenance-preserving
- readiness classification is honest and repeatable
- module executor produces structured candidate payloads
- prompt bundle supports standard, reduced, and needs-more-input modes
- structural validator catches malformed outputs
- semantic validator catches fake variety, genericity, weak grounding, and dishonest confidence
- worker persists only admissible artifacts
- provenance links are written correctly
- all Sprint 2 tests are passing

---

## Immediate handoff sentence for engineering leadership

Implement Sprint 2 exactly as the bounded Narrative Direction Selection intelligence path: deterministic source resolution, normalized context assembly, honest readiness classification, locked prompt bundle v1, provider adapter execution, structural + semantic validation, and worker integration that persists only validated artifacts with provenance.
