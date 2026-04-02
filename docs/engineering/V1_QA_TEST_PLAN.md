# V1_QA_TEST_PLAN

## 1. Purpose

This document defines the authoritative v1 QA test plan for College Essay Edge.

It is the launch-readiness truth for:

* what must be tested before release
* how each launch module is tested
* how authenticity and genericity boundaries are tested
* how flow/state behavior is tested
* how AI execution, validation, fallback, and review behavior are tested
* how benchmark and release-gate evidence is collected
* what counts as pass, fail, blocker, regression, or acceptable known limitation

This is not a lightweight checklist.
This is not a generic QA template.
This is the operating test plan for a bounded AI product where output quality, state correctness, reviewability, and release safety all matter.

If launch readiness claims conflict with this document, this document wins.

---

## 2. QA doctrine

### 2.1 v1 is not “tested” because the app runs

A functioning UI and successful API calls do not prove launch readiness.

v1 is only tested when the system has shown that it can:

* produce useful outputs in launch modules
* reject or reduce weak outputs honestly
* protect authenticity boundaries
* avoid genericity in core moat workflows
* preserve correct workflow and artifact state
* create review and benchmark evidence when needed
* surface failures in a visible, diagnosable way

The release gate is explicit that launch is not allowed simply because the app “works.” It requires distinct outputs, authenticity protection, benchmark performance, review flow functionality, and visible regressions.

### 2.2 QA must test the real product contract

The system under test is not just the frontend.
It is the combined contract of:

* scope lock
* data model
* AI service API
* user flow/state map
* admin review workflow
* validator rules
* module output schemas
* permissions
* release gate

### 2.3 QA must test both correctness and product quality

Traditional correctness is necessary but insufficient.

This QA plan tests two classes of truth:

* **system correctness**
* **product quality truth**

Both matter.

### 2.4 Weak-input honesty is a feature, not a failure

Needs-more-input and reduced-scope behavior are valid, important outcomes when context is weak.
QA must verify that the system stops honestly instead of filling gaps with polished nonsense. The orchestration and API contracts both require readiness-aware execution and a first-class needs-more-input path.

---

## 3. Test scope

This QA plan covers the full locked v1:

* Edge Snapshot
* Story Vault Analysis
* Narrative Direction Selection
* Essay Feedback
* Supplement Angle Suggestion

It also covers required support systems:

* onboarding and profile completion
* story and draft persistence
* stale/canonical/selected state behavior
* AI run lifecycle
* validator outcomes
* retry/fallback behavior
* review queue creation
* reviewer labeling workflow
* benchmark candidate capture
* permissions and access boundaries

Deferred modules such as Outline Generation and Overlap Warning are not launch blockers unless formally promoted into scope.

---

## 4. QA layers

The v1 QA plan is organized into seven layers.

1. Module behavior tests
2. State and flow tests
3. AI execution and validator tests
4. Authenticity and genericity boundary tests
5. Review and benchmark workflow tests
6. Permissions and role-boundary tests
7. Release-gate and regression tests

---

## 5. Test environments and evidence requirements

### 5.1 Required environments

At minimum, QA should run in:

* local/dev for rapid iteration
* staging/pre-release for integrated validation
* controlled beta environment if distinct from staging

### 5.2 Evidence required for any test cycle

Every serious QA cycle must preserve:

* build/version identifier
* prompt bundle version(s)
* schema version(s)
* validator version(s)
* provider/model identifier(s)
* test run date/time
* environment
* tester name or automation ID
* sample artifact IDs
* failed test artifacts and notes

This is required because provenance is part of the product contract, not optional logging.

### 5.3 Evidence preservation rule

No important failure should exist only in a screenshot or Slack message.
It must map to artifact IDs, run IDs, or benchmark case IDs.

---

## 6. Test data strategy

### 6.1 Test data categories

Build QA fixtures across at least these categories:

* high-readiness strong student context
* medium-readiness usable but incomplete context
* low-readiness thin context
* authenticity-sensitive draft cases
* genericity-prone supplement cases
* ambiguous story inventory cases
* high-performing known benchmark cases
* previously failing regression cases

### 6.2 Test fixture structure

Every fixture should define:

* student profile
* onboarding state
* story inventory state
* essay project state if relevant
* draft versions if relevant
* supplement project state if relevant
* expected readiness class
* module-specific risk notes

### 6.3 Gold, gray, and red fixtures

Use three fixture classes:

* **gold fixtures** — strong cases where the system should clearly perform well
* **gray fixtures** — borderline cases where reduction/needs-more-input behavior matters
* **red fixtures** — failure-prone cases that should trigger blocks, review, or validator catches

---

## 7. Module test matrix

Each launch module must be tested through the same core matrix.

### 7.1 Core scenario matrix per module

For every launch module, test at least:

1. valid strong-input success path
2. medium-input acceptable path
3. low-input needs-more-input path
4. partial-result path
5. blocked path where applicable
6. stale-state path
7. historical/canonical preservation path
8. review-trigger path
9. retry/fallback path if validator requires it
10. permissions-boundary path

---

## 8. Edge Snapshot test plan

### 8.1 Success-path tests

Verify that with strong onboarding/profile input the module:

* creates a run
* resolves readiness correctly
* returns a valid Edge Snapshot artifact
* stores artifact and validator result
* surfaces strongest themes and missing discovery areas
* makes artifact current on Home/Profile surfaces

### 8.2 Medium-input tests

Verify that the module can still return a useful but bounded artifact without inventing depth.

### 8.3 Needs-more-input tests

Verify that when onboarding context is too thin:

* run status resolves to `needs_more_input`
* artifact status resolves to `needs_more_input`
* missing-input guidance is specific
* the UI routes user to the correct next step

### 8.4 Stale tests

Verify that material profile/story changes after a snapshot mark downstream snapshot state as stale rather than silently current.

### 8.5 Quality tests

Check for:

* generic personality summary drift
* vague “you are unique” language
* over-broad thematic claims unsupported by context

---

## 9. Story Vault Analysis test plan

### 9.1 Success-path tests

Verify that with a sufficient story inventory the module:

* identifies strongest story candidates
* identifies underused material
* identifies weak/repetitive areas
* persists artifact + validator result correctly
* links to the right story-entry context when applicable

### 9.2 Low-depth tests

Verify that vague or repetitive story entries do not produce falsely confident rankings.

### 9.3 Needs-more-input tests

Verify that the system asks for more specificity or evidence of change when appropriate.

### 9.4 Stale tests

Verify that adding/editing stories after analysis marks the analysis stale.

### 9.5 Quality tests

Check for:

* fabricated strength claims
* fake ranking variety
* failure to distinguish between stronger and weaker story material

---

## 10. Narrative Direction Selection test plan

### 10.1 Success-path tests

Verify that with strong profile/story context the module:

* returns a ranked direction artifact
* takes a real stance
* provides evidence-based reasoning
* allows explicit user selection
* records selection event
* updates essay project canonical direction pointers

### 10.2 Selection-state tests

Verify:

* selection required state before choice
* selected state after choice
* historical artifact preservation after refresh or replacement

### 10.3 Low-input tests

Verify that thin context does not result in broad brainstorming disguised as ranking.

### 10.4 Stale tests

Verify that meaningful story/profile changes cause selected direction state to become stale while preserving historical selection visibility.

### 10.5 Critical quality tests

Check specifically for:

* weak decision pressure
* fake variety among options
* options that are merely rephrased versions of each other
* hedging language that avoids recommending a winner

The release gate explicitly treats direction outputs that fail to choose and outputs that feel like broad brainstorming rather than strong product judgment as blockers.

---

## 11. Essay Feedback test plan

### 11.1 Success-path tests

Verify that with a current draft version the module:

* runs against the correct draft version
* returns ranked revision priorities
* distinguishes strengths, weaknesses, and next steps
* stores feedback artifact against the right draft version
* makes feedback available in the Feedback workspace

### 11.2 Draft-version tests

Verify:

* correct linkage to current draft version
* historical preservation of older feedback artifacts
* stale feedback behavior when current draft changes

### 11.3 Low-input / too-early draft tests

Verify that incomplete or too-thin drafts route to partial or needs-more-input appropriately.

### 11.4 Block tests

Verify that outputs drifting toward rewrite/ghostwriting behavior are blocked or non-admissible.

### 11.5 Critical quality tests

Check specifically for:

* generic praise dominance
* low-specificity feedback
* rewrite drift
* final prose risk
* replacement-authorship behavior

The scope lock explicitly prohibits rewrite behavior, and the validator/release stack treats ghostwriting drift and generic-praise feedback as serious failures.

---

## 12. Supplement Angle Suggestion test plan

### 12.1 Success-path tests

Verify that with school + prompt + sufficient student context the module:

* returns ranked angles
* reflects school/prompt awareness
* stores selectable angle artifact
* allows angle selection and canonical project update

### 12.2 Input completeness tests

Verify failures for:

* missing school
* missing prompt
* weak personal context

### 12.3 Stale tests

Verify that important profile/personal-statement changes can make angle artifacts stale.

### 12.4 Critical quality tests

Check specifically for:

* school-agnostic angles
* templated school-fit language
* surface-level school-name token swaps
* overlap-insensitive angle behavior if overlap hints are available

The release gate explicitly treats repeated school-agnostic supplement behavior as a launch blocker.

---

## 13. State and flow QA plan

These tests verify that product state behaves correctly across workspaces.

## 13.1 Onboarding → Edge Snapshot

Verify:

* onboarding incomplete users are not treated as fully ready
* onboarding completion unlocks Edge Snapshot pathway
* snapshot result affects Home state correctly

## 13.2 Story Vault → Direction Selection

Verify:

* Story Vault improvements can improve direction readiness
* Story Vault changes can stale prior direction artifacts

## 13.3 Direction Selection → Drafting

Verify:

* selecting a direction updates essay project state
* selected direction is visible in Personal Statement workspace

## 13.4 Draft update → feedback stale

Verify:

* saving a new current draft version marks prior feedback stale
* feedback history remains accessible

## 13.5 Supplement project creation → angle suggestion

Verify:

* missing prompt/school states behave correctly
* ready state appears only when minimum required input exists

## 13.6 Global UI state tests

Every major workspace must be tested for:

* empty state
* loading state
* success/result state
* selection-required state
* saved state
* stale state
* needs-more-input state
* blocked state
* error state
* review-affected state

These states are explicitly required by the flow/state map and must not be treated as edge decoration.

---

## 14. AI execution and API QA plan

## 14.1 Create-run tests

Verify `POST /v1/ai/runs` for:

* valid request creation
* unknown module rejection
* disabled module rejection
* missing subject rejection
* invalid workflow state rejection
* permission denial
* insufficient required input rejection

## 14.2 Run-status tests

Verify run lifecycle states:

* queued
* running
* completed
* partial
* needs_more_input
* failed_validation
* blocked
* system_error

### 14.3 Artifact retrieval tests

Verify:

* valid artifact retrieval for completed runs
* partial artifact retrieval behavior
* needs-more-input retrieval behavior
* blocked retrieval behavior returns safe summary, not blocked content

### 14.4 Selection endpoint tests

Verify `POST /v1/ai/artifacts/{artifact_id}/select` for:

* valid item selection
* invalid item rejection
* wrong user/permission rejection
* canonical state update
* selection event persistence

### 14.5 Retry endpoint tests

Verify `POST /v1/ai/runs/{run_id}/retry` for:

* allowed retry modes
* retry cap enforcement
* materially changed retry config
* no blind identical retry
* provenance preservation across retries

### 14.6 Idempotency and conflict tests

Verify:

* idempotency key handling on create-run
* conflict behavior for duplicate in-flight runs on same module/subject
* force refresh behavior when explicitly allowed

These API behaviors are locked in the AI service spec and are launch-critical, not optional niceties.

---

## 15. Validator and admissibility QA plan

## 15.1 Structural validation tests

Verify that malformed payloads fail schema validation.

## 15.2 Semantic validation tests

Verify module-specific quality failures such as:

* unranked direction outputs
* low-specificity essay feedback
* school-agnostic supplement angles
* fake variety among ranked options

## 15.3 Brand/authenticity validation tests

Verify catches for:

* ghostwriting drift
* final prose risk
* over-polished substitute authorship
* brand-violating filler language

## 15.4 Admissibility mapping tests

Verify mapping from validator decisions into run/artifact/user-visible outcomes:

* `accept`
* `accept_partial`
* `retry_tightened`
* `retry_reduced_scope`
* `convert_to_needs_more_input`
* `block`

### 15.5 False-pass / false-block QA tests

Run curated cases where:

* validator should block but currently might pass
* validator should accept but currently might block

These must be logged and compared to human review outcomes. False passes and false blocks are explicitly critical to release and post-launch improvement.

---

## 16. Retry, fallback, and reduced-scope QA plan

## 16.1 Retry behavior tests

Verify that retry occurs only when allowed by validator decision or explicit retry flow.

## 16.2 Reduced-scope tests

Verify that reduced-scope mode:

* narrows output honestly
* remains useful
* does not pretend to be a full result

## 16.3 Needs-more-input conversion tests

Verify that weak context converts to needs-more-input rather than a fake-success artifact.

## 16.4 Fallback-provider tests

If fallback provider is enabled, verify:

* fallback invocation is recorded
* provenance is preserved
* final artifact still conforms to product schema
* UI never exposes provider-specific differences

---

## 17. Authenticity boundary QA plan

This is one of the highest-priority QA layers in the entire product.

## 17.1 Core authenticity tests

Test that the system does **not**:

* write final personal statements as default product behavior
* write final supplement answers as default product behavior
* turn essay feedback into paragraph-level rewrite service
* cross from coaching into substitute authorship

## 17.2 Ghostwriting edge-case suite

Build a specific suite of red fixtures designed to tempt rewrite behavior.

Examples:

* weak draft with obvious rewrite opportunities
* extremely thin supplement prompt asking for a full answer
* user context that invites polished generic narrative generation

## 17.3 Pass condition

The system must block, reduce, or redirect these cases without leaking forbidden output as success content.

The release gate explicitly treats unresolved ghostwriting drift in core modules as launch-blocking.

---

## 18. Genericity boundary QA plan

This is the second highest-priority QA layer.

## 18.1 Core genericity tests

Test for:

* generic praise
* school-name token swap specificity theater
* broad “you have many strong qualities” language
* direction outputs that hedge instead of choose
* supplement angles that could fit many schools
* fake variety in ranked options
* feedback that sounds smart but says little

## 18.2 Module-specific genericity expectations

### Narrative Direction Selection

Must show clear recommendation pressure.

### Essay Feedback

Must produce specific revision priorities, not praise-heavy commentary.

### Supplement Angle Suggestion

Must show real school/prompt fit, not template reuse.

### Edge Snapshot / Story Vault Analysis

Must identify genuine evidence patterns, not personality-flavored filler.

## 18.3 Pass condition

Core moat modules must consistently produce outputs that feel materially less generic than free AI for the same class of inputs.

The release gate explicitly demands that at least one module feel clearly worth paying for and that genericity be under control.

---

## 19. Review workflow QA plan

## 19.1 Queue creation tests

Verify queue items are created correctly for:

* genericity risk
* authenticity risk
* validator borderline
* benchmark candidate
* false pass
* false block
* manual escalation

## 19.2 Blocking vs non-blocking tests

Verify:

* non-blocking flagged artifact can remain visible while review is queued
* blocking artifact is not shown as success content

## 19.3 Reviewer detail tests

Verify detail view provides:

* artifact
* validator result
* subject/context summary
* provenance summary
* label history
* benchmark link state

## 19.4 Review action tests

Verify reviewers can:

* submit review
* add labels
* mark false pass
* mark false block
* escalate
* promote benchmark candidate
* resolve queue items correctly

## 19.5 Persistence tests

Verify all review actions persist to first-class data records and preserve history.

The admin review workflow explicitly defines this as a core operating system, not optional ops tooling.

---

## 20. Labeling QA plan

## 20.1 Label schema tests

Verify required label fields exist and are stored correctly:

* quality label
* uniqueness label
* authenticity label
* substitution risk label
* failure labels
* outcome labels
* review confidence
* notes

## 20.2 Label hierarchy tests

Verify stronger label sources are not overwritten by weaker sources.

## 20.3 Module emphasis tests

Verify module-specific label emphasis can be captured and queried.

Examples:

* `weak_decision_pressure`
* `low_specificity_feedback`
* `school_agnostic_angle`
* `generic_praise_block`
* `ghostwriting_drift`

These label families are part of the official labeling spec and must be testable as real product data.

---

## 21. Benchmark QA plan

## 21.1 Benchmark case integrity tests

Verify benchmark cases contain:

* why this case matters
* target world-class behavior
* acceptable floor behavior
* likely generic failure
* what a reviewer should notice
* what the validator should catch

These are required by the case annotation guide.

## 21.2 Benchmark run tests

Verify the live system can be run against benchmark cases and store:

* run linkage
* artifact linkage
* benchmark review status
* benchmark review outcome

## 21.3 Benchmark promotion tests

Verify reviewers can promote real artifacts into benchmark candidates with required metadata.

## 21.4 Benchmark pass standard

At minimum, launch modules should pass benchmark review at acceptable or better levels on the curated v1 benchmark set, with no unresolved critical benchmark failures. The release gate explicitly requires this.

---

## 22. Permissions and role-boundary QA plan

## 22.1 Student permissions

Verify students can:

* create and edit their own inputs
* run eligible modules on their own entities
* select directions/angles on their own projects
* view their own artifacts and project states

## 22.2 Supporting-adult permissions

Verify supporting adults can only perform explicitly allowed view/access actions and cannot operate as substitute authors or reviewers.

## 22.3 Admin permissions

Verify admins can access review and benchmark surfaces without crossing into user-role confusion.

## 22.4 Boundary-failure tests

Verify the service rejects:

* cross-student access
* supporting-adult authoring where forbidden
* unauthorized admin/review actions

Permissions enforcement must occur at the service boundary, not only in UI logic.

---

## 23. Data model integrity QA plan

## 23.1 Canonical vs historical tests

Verify that:

* only one canonical artifact exists per subject/module when expected
* historical artifacts remain preserved
* selection events do not erase history

## 23.2 Draft/version tests

Verify:

* current draft pointer behavior
* append-only draft history expectations
* feedback linked to correct draft version

## 23.3 Provenance integrity tests

Verify each run/artifact stores:

* prompt bundle version
* schema version
* validator version
* provider/model identity
* readiness state
* retry count
* fallback info if applicable

## 23.4 Review persistence tests

Verify review, labels, benchmark links, and queue state persist correctly and are queryable.

---

## 24. Regression QA plan

## 24.1 What must always be regression-tested before release or major change

* all launch-module strong-input success paths
* all moat-module genericity cases
* all authenticity edge cases
* all false-pass and false-block benchmark cases
* stale-state transitions for core workflows
* review queue creation on flagged artifacts
* blocked artifact retrieval behavior

## 24.2 Trigger events for full regression

Run a full regression cycle when any of these change:

* prompt bundle version
* schema version
* validator version
* provider/model
* routing policy
* fallback rules
* permissions behavior
* selection/canonical persistence logic

The admin review workflow and release gate both require post-change review and visible regression handling.

---

## 25. Release-gate QA checklist mapping

Before launch, QA must explicitly certify these gates.

### 25.1 Scope gate

* only launch modules in scope
* deferred modules not silently required

### 25.2 Contract gate

* data model implemented enough for required v1 flows
* AI API contract working end to end
* state map behavior observable in product
* admin review workflow operable

### 25.3 Quality gate

* genericity under acceptable control
* authenticity boundaries hold
* no repeated unresolved blocker patterns

### 25.4 Benchmark gate

* core benchmark set run against real stack
* no unresolved critical benchmark failures

### 25.5 Review gate

* flagged outputs create queue items correctly
* reviewers can inspect, label, escalate, and promote candidates

### 25.6 Worth-paying-for gate

At least one moat module must feel clearly differentiated and valuable under QA and benchmark review, not merely “functional.” The release gate explicitly requires this.

---

## 26. Severity classification for QA failures

Use these levels:

### `P0 — launch blocker`

Examples:

* ghostwriting drift in core workflow
* repeated school-agnostic supplement outputs
* blocked artifacts leaking as success content
* direction module failing to choose in core cases
* no working review queue for flagged outputs

### `P1 — serious but possibly containable`

Examples:

* stale state not updating reliably
* partial artifacts rendering as full success
* major label persistence issue
* benchmark candidate promotion failure

### `P2 — quality degradation`

Examples:

* weaker-than-target specificity
* noisy but non-breaking review metadata issue
* suboptimal but correct loading/error copy

### `P3 — polish / non-core`

Examples:

* UI wording issue
* low-priority display inconsistency

---

## 27. Pass / fail standard

### 27.1 A test cycle passes only if

* all P0 issues are closed
* no unresolved repeated P1 issue threatens a launch module’s core value
* benchmark evidence is at acceptable-or-better levels
* review workflow is operational
* regressions are visible and understood
* at least one moat module clearly demonstrates non-generic paid-value behavior

### 27.2 A test cycle fails if

* the system works technically but quality blockers remain
* genericity is still visibly uncontrolled in moat modules
* authenticity violations still appear in realistic cases
* benchmark failures are unreviewed
* review flow exists in theory but not in operation

---

## 28. Suggested execution cadence

### 28.1 During implementation

* per-module smoke testing continuously
* weekly integrated QA sweep

### 28.2 Before beta

* full integrated QA run
* benchmark run
* post-change review sample
* release-gate certification review

### 28.3 During controlled beta

* daily triage on flagged outputs
* weekly false-pass / false-block review
* weekly benchmark candidate review

---

## 29. Final directive

Run QA like this is a real product, not a demo.

The job of QA is not merely to prove that the app can generate outputs.
The job of QA is to prove that v1:

* behaves correctly
* fails honestly
* protects authenticity
* resists genericity in moat workflows
* preserves real state correctly
* creates reviewable evidence
* survives benchmark scrutiny
* is strong enough to justify paid use in a narrow, real workflow

That is the v1 QA test standard.
