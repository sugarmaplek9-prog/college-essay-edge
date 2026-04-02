# SPRINT_04_TICKETS

## The College Admissions Edge

## Sprint 04 — Personal Statement Workspace, Narrative Direction, Outline Generation, Draft Editor, Feedback, Version History

## 1. Sprint objective

Sprint 04 delivers the first full writing workflow for the product.

At the end of this sprint, the application must support:

* personal statement workspace access for paid students
* narrative direction selection
* outline generation and outline selection
* draft editor with autosave
* structured AI feedback for personal statements
* revision checklist behavior
* version history for essay drafts
* dashboard and progress state updates reflecting essay workflow progress

This sprint creates the first real high-value paid admissions-writing experience:
**unlock premium access 1 choose narrative direction 1 generate outline 1 draft essay 1 receive structured feedback 1 revise with tracked history**

This sprint does **not** attempt to complete:

* supplements workflow
* school-specific prompt orchestration
* school planner completion
* parent dashboard expansion
* reminder cron jobs
* advanced admin content tools

The output of Sprint 04 is a working personal statement product loop.

---

## 2. Sprint success criteria

Sprint 04 is successful only if all of the following are true:

* paid student can enter personal statement workspace
* student can choose or change narrative direction
* outline generation returns structured options
* student can select an outline and begin drafting
* draft editor autosaves reliably
* AI feedback returns structured output using the required contract
* version history records draft states correctly
* revision checklist updates based on draft/feedback state
* free students remain gated from this workflow
* writing workflow is test-covered end to end

---

## 3. Sprint scope

### Included

* personal statement route implementation
* narrative direction selection flow
* outline generation service and UI
* draft editor UI and persistence
* essay project CRUD/update behavior
* AI feedback service and UI
* essay version history
* revision checklist
* dashboard/progress integration for essay status
* analytics for essay workflow usage

### Excluded

* supplements workflow
* school-specific essay mapping
* parent writing visibility
* collaboration or commenting tools
* live co-editing
* interview prep or scholarship workflows

---

## 4. Ticket format

Each ticket below includes:

* ID
* title
* purpose
* implementation notes
* dependencies
* acceptance criteria

---

# 5. Sprint 04 tickets

## T4-001 — Implement personal statement route shell and premium gating

### Purpose

Establish the route entry point and page shell for the personal statement module.

### Implementation notes

* implement `/app/personal-statement`
* use `StudentAppLayout`
* apply `RouteGuardShell`
* enforce student role + paid entitlement
* display premium upgrade state for free users
* show correct empty/loading state for paid users with no essay yet

### Dependencies

Sprint 03 entitlement system complete

### Acceptance criteria

* free student sees clean upgrade gate
* paid student can enter workspace
* route protection is consistent across middleware, page, and API layers

---

## T4-002 — Implement essay project service layer

### Purpose

Create centralized business logic for personal statement workflow.

### Implementation notes

Build service methods for:

* get current essay project
* create essay project
* update essay project
* set narrative direction
* save outline selection
* save draft text
* compute essay status
* create version snapshot
* fetch version history

### Dependencies

Sprint 01 schema foundation

### Acceptance criteria

* essay workflow business logic is centralized
* route handlers do not duplicate core essay state logic

---

## T4-003 — Implement personal statement API endpoints

### Purpose

Expose essay project operations through protected endpoints.

### Implementation notes

Implement:

* `GET /api/essays/current`
* `POST /api/essays/create`
* `PATCH /api/essays/:id`
* `GET /api/essays/:id/versions`

Requirements:

* authenticated only
* student owner or admin only
* paid entitlement required
* validation for all mutable fields

### Dependencies

T4-002, Sprint 03 entitlement system

### Acceptance criteria

* paid student can create and update own essay project
* free student cannot use essay APIs successfully
* student cannot access another student’s essay project

---

## T4-004 — Implement narrative direction recommendation service

### Purpose

Generate or derive candidate essay directions from existing student context.

### Implementation notes

Build service that reads:

* onboarding answers
* snapshot results
* Story Vault entries if present

Returns structured narrative direction candidates, including:

* direction title
* summary of angle
* why it may be strong
* potential risk or weakness

### Dependencies

Sprint 02 snapshot, Sprint 03 Story Vault

### Acceptance criteria

* service returns structured direction options
* output is typed and validated
* empty/weak source data is handled gracefully

---

## T4-005 — Implement narrative direction selection UI

### Purpose

Allow student to choose the strongest essay direction before drafting.

### Implementation notes

Build and integrate:

* `PersonalStatementHeader`
* `NarrativeDirectionSelector`
* direction cards with select action
* ability to revisit/change direction later

### Dependencies

T4-004

### Acceptance criteria

* paid student can view multiple direction options
* student can select one direction
* selected direction persists to essay project

---

## T4-006 — Implement outline generation service

### Purpose

Generate structured outline options from selected narrative direction.

### Implementation notes

Build service that takes:

* selected narrative direction
* student context
* relevant story assets if available

Returns structured outline options with fields such as:

* opening idea
* turning point
* reflection arc
* closing direction

Must return 2–3 viable outline options.

### Dependencies

T4-005

### Acceptance criteria

* outline service returns structured outline options
* output is validated before persistence/display
* empty or invalid direction input is rejected safely

---

## T4-007 — Implement outline generation endpoint

### Purpose

Expose premium outline generation to the essay workspace.

### Implementation notes

Implement:

* `POST /api/essays/:id/generate-outline`

Requirements:

* authenticated
* student owner or admin only
* paid entitlement required
* selected direction required

### Dependencies

T4-006

### Acceptance criteria

* outline endpoint returns structured outline options
* invalid access or missing direction returns explicit error

---

## T4-008 — Build outline selection UI

### Purpose

Enable student to choose one generated outline and move into drafting.

### Implementation notes

Build and integrate:

* `OutlineOptionCard`
* `OutlineSelectionPanel`
* selected outline state
* regenerate outline option if product allows in v1

### Dependencies

T4-007

### Acceptance criteria

* student can review outline options
* student can select one outline
* chosen outline persists to essay project

---

## T4-009 — Build draft editor pane

### Purpose

Create the core writing surface for the personal statement.

### Implementation notes

Build `DraftEditorPane` with:

* large editable text area
* save state indicator
* section header/context
* autosave support
* optional character/word count display if useful
* no overcomplicated formatting toolbar for v1

### Dependencies

T4-008

### Acceptance criteria

* student can write and edit draft text
* editor feels stable on desktop and mobile
* save state is visible and trustworthy

---

## T4-010 — Implement draft autosave and persistence logic

### Purpose

Prevent data loss in the most important paid writing workflow.

### Implementation notes

* autosave after changes using reasonable debounce
* save through essay update endpoint
* update save state indicator
* handle save failure explicitly
* preserve draft on refresh/logout/login

### Dependencies

T4-003, T4-009

### Acceptance criteria

* draft text persists reliably
* save-state behavior is clear
* reload restores most recent saved draft
* save failures do not silently discard work

---

## T4-011 — Implement essay version snapshot creation

### Purpose

Track major draft states for revision history.

### Implementation notes

Define strategy for version creation, for example:

* manual save snapshot action
* snapshot on feedback request
* snapshot on significant autosave milestones

At minimum, ensure version rows are created in `essay_versions` in a deterministic way.

### Dependencies

T4-002, T4-010

### Acceptance criteria

* version records are created predictably
* version history is queryable for a project

---

## T4-012 — Build version history UI

### Purpose

Allow student to review previous essay versions.

### Implementation notes

Build and integrate:

* `EssayVersionHistoryPanel`
* version list with timestamps/version numbers
* current version indicator
* read-only inspection of prior versions in v1

### Dependencies

T4-011

### Acceptance criteria

* student can view version history
* version list is understandable and ordered correctly
* no accidental overwrite of prior version records

---

## T4-013 — Implement essay feedback service

### Purpose

Generate structured AI critique for personal statements.

### Implementation notes

Build service that reads:

* current draft text
* selected direction
* chosen outline
* available student context

Required output contract:

* what_is_working
* what_is_weak
* what_is_missing
* next_steps

Must also support:

* cliché detection
* vague-claim detection
* missing reflection prompts
* authenticity-oriented critique language

### Dependencies

T4-010

### Acceptance criteria

* essay feedback service returns structured output only
* invalid or malformed AI output is rejected safely
* service does not generate ghostwritten final essays

---

## T4-014 — Implement essay feedback endpoint

### Purpose

Expose structured feedback generation to the essay route.

### Implementation notes

Implement:

* `POST /api/essays/:id/request-feedback`

Requirements:

* authenticated
* student owner or admin only
* paid entitlement required
* non-empty draft required
* feedback persisted to `essay_feedback`
* optionally create version snapshot before feedback request

### Dependencies

T4-013

### Acceptance criteria

* student can request feedback on valid draft
* empty draft request returns product-safe error
* feedback is persisted and retrievable

---

## T4-015 — Build essay feedback UI panel

### Purpose

Display structured feedback in a clear, actionable way.

### Implementation notes

Build and integrate:

* `EssayFeedbackPanel`
* `EssayFeedbackLoadingState`
* sections for:

  * what is working
  * what is weak
  * what is missing
  * next steps

### Dependencies

T4-014

### Acceptance criteria

* feedback is readable and structured
* UI does not dump a giant wall of text
* loading and error states are clean

---

## T4-016 — Implement revision checklist logic

### Purpose

Turn feedback into action-oriented workflow instead of passive commentary.

### Implementation notes

Build logic for `RevisionChecklist` that can represent items such as:

* strengthen opening
* add specific detail
* deepen reflection
* reduce cliché language
* clarify turning point

Check目录 at around 80k tokens; the created file continues but due to length I truncated earlier maybe mid content: we need entire file. I will finish writing with the rest of tickets and waves etc. likely the create_file command truncated the response due to token limit? It wrote full text though as we see ends at 