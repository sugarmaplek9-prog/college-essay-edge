# SPRINT_03_TICKETS

## The College Admissions Edge

## Sprint 03 — Billing, Entitlements, Paid Unlocks, Story Vault, Student Dashboard v1

## 1. Sprint objective

Sprint 03 converts the product from a free onboarding-and-snapshot experience into a functioning paid application.

At the end of this sprint, the application must support:

* Stripe billing integration
* checkout session creation
* billing portal access
* subscription state synchronization
* server-side entitlement resolution
* paid unlock behavior across premium routes
* Story Vault CRUD
* Story Vault analysis
* upgraded student dashboard behavior for free vs paid states

This sprint creates the first complete commercial product loop:
**discover value 1 upgrade 1 unlock premium access 1 use Story Vault inside paid experience**

This sprint does **not** attempt to complete:

* personal statement drafting workflow
* supplements workflow
* full school planner implementation
* parent dashboard implementation
* reminder jobs
* advanced admin operations

The output of Sprint 03 is a working paid product foundation with the first premium module delivered.

---

## 2. Sprint success criteria

Sprint 03 is successful only if all of the following are true:

* user can initiate checkout from upgrade points
* successful payment updates subscription state correctly
* paid entitlements unlock premium routes and actions
* billing portal can be opened by account owner
* free users remain gated from paid features
* Story Vault can create, edit, list, and delete story entries
* Story Vault analysis works and returns structured output
* student dashboard reflects free vs paid state correctly
* no entitlement leakage exists between free and paid users
* billing and entitlement flows are test-covered

---

## 3. Sprint scope

### Included

* Stripe integration
* checkout flow
* billing portal flow
* billing webhook handling
* subscription state persistence
* server-side entitlement resolver finalization for v1 paid baseline
* paid route unlock behavior
* Story Vault route implementation
* Story Vault CRUD APIs and UI
* Story Vault analysis API and UI
* student dashboard refinement
* billing and Story Vault analytics

### Excluded

* personal statement workspace
* supplement workflow
* school planner full institution selection flow
* parent dashboard
* reminder cron jobs
* institution/deadline admin tooling

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

# 5. Sprint 03 tickets

## T3-001 1 Configure Stripe project and application keys

### Purpose

Establish billing provider integration baseline.

### Implementation notes

* create Stripe product and price for v1 paid plan
* configure environment variables:

  * secret key
  * publishable key
  * webhook secret
  * price id(s)
* add billing config module in `lib/billing/`
* document local Stripe testing approach

### Dependencies

Sprint 01 environment foundation

### Acceptance criteria

* Stripe keys are configured in local, preview, and production environments
* v1 paid plan product/price exists
* billing config is centralized in code

---

## T3-002 1 Implement checkout session creation endpoint

### Purpose

Allow upgrade flow to create Stripe checkout sessions.

### Implementation notes

Implement:

* `POST /api/billing/create-checkout-session`

Requirements:

* authenticated only
* valid role required
* determine account owner correctly
* create checkout session for v1 plan
* include success and cancel URLs
* pass enough metadata to reconcile subscription state later

### Dependencies

T3-001

### Acceptance criteria

* authenticated user can create checkout session
* invalid or unauthenticated requests are rejected
* session routes user to Stripe checkout

---

## T3-003 1 Implement billing portal session endpoint

### Purpose

Allow billing owner to manage subscription through provider portal.

### Implementation notes

Implement:

* `POST /api/billing/create-portal-session`

Requirements:

* account owner only or admin
* validate customer id exists
* return portal session URL safely

### Dependencies

T3-001

### Acceptance criteria

* billing owner can launch portal session
* non-owner cannot access billing portal endpoint

---

## T3-004 1 Implement Stripe webhook handler

### Purpose

Synchronize subscription state into app database.

### Implementation notes

Implement:

* `POST /api/billing/webhook`

Handle at minimum:

* checkout completion
* subscription created
* subscription updated
* subscription canceled
* payment failure states as relevant

Update `subscriptions` table appropriately.
Create audit events where needed.

### Dependencies

T3-001, T3-002

### Acceptance criteria

* webhook signature is verified
* subscription records are created/updated correctly
* duplicate webhook deliveries do not corrupt state

---

## T3-005 1 Implement billing service layer

### Purpose

Centralize Stripe and subscription business logic.

### Implementation notes

Create service methods for:

* create checkout session
* create portal session
* map Stripe state to internal subscription state
* create/update subscription record
* resolve billing owner id
* fetch current billing status

### Dependencies

T3-002, T3-003, T3-004

### Acceptance criteria

* billing logic is not scattered across route handlers
* webhook and app routes share the same billing service layer

---

## T3-006 1 Finalize entitlement resolver against live subscription state

### Purpose

Replace provisional paid gating with live billing-based entitlements.

### Implementation notes

* update entitlement resolver to read from `subscriptions`
* define authoritative paid states for unlock behavior
* expose shared helpers for:

  * isPaid
  * canUseStoryVault
  * canUseEssayWorkspace later
  * canUseSupplements later
  * canAccessParentDashboard later
* ensure resolver is server-side authoritative

### Dependencies

T3-004, T3-005

### Acceptance criteria

* paid status resolves from persisted subscription state
* free users remain free without billing record
* canceled/past_due states resolve deterministically

---

## T3-007 1 Implement paid upgrade flow from snapshot and premium gates

### Purpose

Connect product upgrade prompts to real checkout.

### Implementation notes

* wire upgrade CTA from snapshot page to checkout initiation
* wire premium route UpgradeGate CTA to checkout initiation
* preserve intended destination when useful
* provide clean cancel-return behavior from checkout

### Dependencies

T3-002, T3-006

### Acceptance criteria

* upgrade CTA starts real checkout flow
* canceling checkout returns user cleanly to product
* successful purchase leads to premium state behavior

---

## T3-008 1 Implement billing status retrieval endpoint

### Purpose

Expose current subscription/entitlement state to app shell and settings.

### Implementation notes

Implement:

* `GET /api/billing/status`

Requirements:

* authenticated only
* owner/admin scoped
* return clean internal billing state, not raw provider payloads

### Dependencies

T3-005, T3-006

### Acceptance criteria

* billing state can be fetched safely
* raw Stripe internals are not leaked to UI unnecessarily

---

## T3-009 1 Build billing UI primitives

### Purpose

Create the UI layer for paid conversion and billing status.

### Implementation notes

Build/refine:

* `UpgradeModal`
* `UpgradePageSection`
* `CheckoutSummaryCard`
* `BillingStatusBadge`
* `BillingPortalButton`

Ensure components match premium UX tone.

### Dependencies

Sprint 01 component foundation, T3-007, T3-008

### Acceptance criteria

* billing UI components exist and are reusable
* components are integrated into snapshot and dashboard surfaces

---

## T3-010 1 Refine student dashboard for free vs paid state

### Purpose

Make dashboard reflect users real product state.

### Implementation notes

For free users:

* show snapshot completion state
* show upgrade prompts
* show limited progress summary
* show locked premium cards clearly

For paid users:

* show Story Vault access
* show progress and next-step cards
* show premium state cleanly

Refine:

* `StudentDashboardHeader`
* `StudentDashboardGrid`
* `DashboardUpgradePromptCard`
* `DashboardProgressCard`
* `NextStepCard`

### Dependencies

T3-006, T3-009

### Acceptance criteria

* dashboard clearly differentiates free and paid users
* premium modules appear unlocked immediately after successful payment sync

---

## T3-011 1 Implement Story Vault data service layer

### Purpose

Create business logic for story management.

### Implementation notes

Build service methods for:

* list story entries
* create story entry
* update story entry
* soft-delete story entry
* mark story strength/status
* fetch story analysis context

### Dependencies

Sprint 01 schema + RLS foundation

### Acceptance criteria

* Story Vault business logic is centralized
* route handlers do not duplicate core CRUD logic

---

## T3-012 1 Implement Story Vault API endpoints

### Purpose

Expose Story Vault CRUD through protected APIs.

### Implementation notes

Implement:

* `GET /api/story-vault`
* `POST /api/story-vault`
* `PATCH /api/story-vault/:id`
* `DELETE /api/story-vault/:id`

Requirements:

* authenticated
* student owner or admin
* paid entitlement required
* soft delete where schema supports it
* validation for title/body/category

### Dependencies

T3-011, T3-006

### Acceptance criteria

* paid student can CRUD own story entries
* free student cannot use CRUD endpoints successfully
* student cannot access another students story entries

---

## T3-013 1 Build Story Vault UI route

### Purpose

Deliver the first real premium workspace.

### Implementation notes

Implement `/app/story-vault` with:

* `StoryVaultHeader`
* `StoryVaultGrid`
* `StoryEntryCard`
* `StoryEntryEditorModal` or panel
* `StoryVaultEmptyState`
* route-level `UpgradeGate` for free users

Required actions:

* add story
* edit story
* delete story
* see status/strength/use tags

### Dependencies

T3-012, Sprint 01 component foundation

### Acceptance criteria

* paid student can use Story Vault page end to end
* free student sees clean upgrade gate
* empty state is intentional and premium

---

## T3-014 1 Implement Story Vault story strength/status editing

### Purpose

Allow story assets to be managed meaningfully, not just stored as plain text.

### Implementation notes

Support editable fields for:

* category
* theme tags
* strength level
* story status
* used flags

### Dependencies

T3-012, T3-013

### Acceptance criteria

* student can update story metadata
* story card reflects changes immediately or after successful save

---

## T3-015 1 Implement Story Vault analysis service

### Purpose

Generate premium analysis from saved story set.

### Implementation notes

Build analysis service that:

* reads saved story entries
* clusters likely themes
* identifies strongest stories
* identifies underused angles
* returns structured output for UI

Required output structure:

* strongest themes
* strongest story candidates
* underused angles
* next recommendations

### Dependencies

T3-011

### Acceptance criteria

* Story Vault analysis service exists and is typed
* output is structured and reusable in UI

---

## T3-016 1 Implement Story Vault analysis endpoint

### Purpose

Expose premium story analysis to the route.

### Implementation notes

Implement:

* `POST /api/story-vault/analyze`

Requirements:

* paid student owner or admin only
* reject empty vault gracefully
* persist analysis output if product chooses, or return safely if transient in v1

### Dependencies

T3-015, T3-006

### Acceptance criteria

* analysis endpoint returns structured result
* empty-vault request returns safe product state

---

## T3-017 1 Build Story Vault analysis UI

### Purpose

Display premium value inside Story Vault.

### Implementation notes

Build and integrate:

* `StoryAnalysisPanel`
* `StoryAnalysisSummaryCard`
* loading/failure states for analysis

### Dependencies

T3-016, T3-013

### Acceptance criteria

* paid student can trigger analysis from Story Vault
* analysis is readable, structured, and useful
* loading/error states are clean

---

## T3-018 1 Implement premium route unlock behavior after successful payment

### Purpose

Ensure paid transition feels immediate and coherent.

### Implementation notes

* after successful checkout return or refreshed billing state:

  * premium routes should unlock
  * dashboard should update accordingly
  * Story Vault should become usable
* define refresh/revalidation strategy after checkout completion

### Dependencies

T3-004, T3-006, T3-007, T3-013

### Acceptance criteria

* newly paid users do not remain stuck behind stale free gating
* unlock behavior is deterministic and stable

---

## T3-019 1 Implement billing and Story Vault analytics events

### Purpose

Track the first paid funnel and first premium usage funnel.

### Implementation notes

Add events for:

* checkout_started
* checkout_completed
* checkout_canceled
* billing_portal_opened
* story_vault_viewed
* story_created
* story_updated
* story_deleted
* story_analysis_requested
* story_analysis_completed

### Dependencies

T3-007, T3-013, T3-017

### Acceptance criteria

* billing and premium usage funnel events are emitted centrally
* usage of first paid module is measurable

---

## T3-020 1 Add integration tests for billing synchronization

### Purpose

Protect the highest-risk commercial logic in this sprint.

### Implementation notes

Add integration tests for:

* checkout session creation authorization
* webinar state mapping
* subscription record creation/update
* entitlement resolution from subscription state
* billing portal authorization

### Dependencies

T3-004, T3-005, T3-006

### Acceptance criteria

* critical billing sync logic is automated-test covered
* entitlement regressions are detectable

---

## T3-021 1 Add integration tests for Story Vault CRUD

### Purpose

Protect the first premium content workflow.

### Implementation notes

Add integration tests for:

* create story
* list story
* update story
* soft delete story
* unauthorized access denial
* free-user gating denial

### Dependencies

T3-012

### Acceptance criteria

* Story Vault CRUD is integration-tested
* ownership and entitlement enforcement are covered

---

## T3-022 1 Add integration tests for Story Vault analysis contract

### Purpose

Protect premium AI output structure.

### Implementation notes

Add tests for:

* analysis request with sufficient stories
* analysis request with empty vault
* invalid AI output handling
* response schema validation

### Dependencies

T3-016

### Acceptance criteria

* Story Vault analysis contract is test-covered
* invalid output cannot silently break UI assumptions

---

## T3-023 1 Add end-to-end test for free-to-paid upgrade flow

### Purpose

Verify the first revenue path works in practice.

### Implementation notes

Create E2E test for:

* complete free funnel up to snapshot
* click upgrade CTA
* simulate checkout success in test environment
* return to app
* confirm premium route unlock
* enter Story Vault

### Dependencies

T3-018

### Acceptance criteria

* end-to-end upgrade flow is test-covered
* post-payment unlock behavior is validated automatically

---

## T3-024 1 Add end-to-end test for Story Vault paid usage flow

### Purpose

Verify first premium module is usable end to end.

### Implementation notes

Create E2E test for:

* paid student enters Story Vault
* creates story
* edits story
* triggers analysis
* sees analysis result

### Dependencies

T3-017

### Acceptance criteria

* Story Vault premium usage path is test-covered

---

## T3-025 1 Sprint 03 QA and hardening pass

### Purpose

Stabilize the first commercial release slice.

### Implementation notes

Validate:

* checkout errors do not leave broken UI state
* stale entitlement issues are resolved cleanly
* Story Vault saves feel responsive
* Story Vault analysis latency is handled well
* upgrade prompts are consistent across surfaces
* mobile and desktop layouts remain coherent
* no runtime errors on billing and Story Vault routes

### Dependencies

All prior Sprint 03 tickets

### Acceptance criteria

* no critical billing defects remain
* no critical entitlement defects remain
* no critical Story Vault defects remain
* paid product loop is stable enough for next module work

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T3-001
* T3-002
* T3-003
* T3-004
* T3-005
* T3-006

## Wave 2

* T3-007
* T3-008
* T3-009
* T3-010
* T3-018

## Wave 3

* T3-011
* T3-012
* T3-013
* T3-014
* T3-015
* T3-016
* T3-017

## Wave 4

* T3-019
* T3-020
* T3-021
* T3-022
* T3-023
* T3-024
* T3-025

---

# 7. Sprint 03 deliverable checklist

At sprint close, confirm all of the following:

* [ ] Stripe configured
* [ ] checkout session endpoint works
* [ ] billing portal endpoint works
* [ ] webhook handler works
* [ ] subscription records sync correctly
* [ ] entitlement resolver uses live subscription data
* [ ] upgrade CTA starts real checkout
* [ ] premium routes unlock after successful payment
* [ ] student dashboard reflects free vs paid status
* [ ] Story Vault CRUD works
* [ ] Story Vault analysis works
* [ ] billing analytics events exist
* [ ] Story Vault analytics events exist
* [ ] integration tests cover billing sync
* [ ] integration tests cover Story Vault CRUD and analysis
* [ ] E2E covers free-to-paid flow
* [ ] E2E covers Story Vault paid usage

---

# 8. Non-negotiables for Sprint 03

1. Do not trust client-side state alone for premium unlocks.
2. Do not expose premium Story Vault APIs to free users.
3. Do not allow billing owner ambiguity in checkout/portal flows.
4. Do not let stale subscription state trap paid users behind upgrade gates.
5. Do not move to Sprint 04 if the paid unlock path is unstable.

---

# 9. Recommended next artifact

Create next:
**SPRINT_04_TICKETS.md**

Sprint 04 should cover:

* personal statement workspace
* narrative direction selection
* outline generation
* draft editor
* essay feedback pipeline
* version history
* revision checklist