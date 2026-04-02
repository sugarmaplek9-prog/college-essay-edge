# SPRINT_07_TICKETS

## The College Admissions Edge

## Sprint 07 — Reminder Infrastructure, Onboarding Emails, Deadline Emails, Milestone Emails, Notification Hardening, Observability Refinement

## 1. Sprint objective

Sprint 07 delivers the core operational messaging and observability layer for v1.

At the end of this sprint, the application must support:

* reminder job infrastructure
* onboarding reminder emails
* snapshot-ready and milestone emails
* deadline reminder emails
* notification event hardening
* supporting-adult notification behavior where appropriate
* admin/operational visibility into notification outcomes
* analytics and observability refinement for critical workflows

This sprint creates the first proactive product loop:
**user stops engaging → system nudges intelligently → student/supporting adult returns → deadlines and progress remain visible and actionable**

This sprint does **not** attempt to complete:

* advanced CRM-like messaging
* push notifications/mobile messaging
* counselor broadcast workflows
* complex campaign automation
* machine-learning notification optimization

The output of Sprint 07 is a reliable notification and reminder backbone that makes the product feel active, accountable, and operationally mature.

---

## 2. Sprint success criteria

Sprint 07 is successful only if all of the following are true:

* reminder job infrastructure runs reliably in development and deployed environments
* onboarding reminder emails can be triggered for incomplete onboarding states
* deadline reminder emails can be triggered from school/deadline data
* snapshot-ready and milestone emails can be generated from product events
* notification events are stored consistently in the database
* failed notification sends are captured visibly
* notification preferences are respected where applicable
* admin/ops visibility exists for notification failures and volumes
* reminder and notification flows are test-covered

---

## 3. Sprint scope

### Included

* reminder job infrastructure
* scheduled notification job endpoints
* onboarding reminder logic
* snapshot-ready notification logic
* milestone notification logic
* deadline reminder logic
* Resend email integration hardening
* notification event persistence improvements
* observability and operational visibility for notification outcomes
* analytics refinement for reminders and re-engagement flows

### Excluded

* SMS/push notification channels
* advanced campaign orchestration
* multi-language messaging
* A/B testing framework for emails
* support inbox/case management tooling beyond basic observability

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

# 5. Sprint 07 tickets

## T7-001 — Configure reminder job infrastructure

### Purpose

Create the system-level foundation for scheduled notification execution.

### Implementation notes

* define cron/scheduled job approach for deployed environment
* ensure local development/testing path exists
* set up scheduled entry points for:

  * onboarding reminders
  * deadline reminders
  * milestone notifications if job-based
* document environment configuration and invocation behavior

### Dependencies

Sprint 01 deployment foundation

### Acceptance criteria

* scheduled job infrastructure is configured
* jobs can be invoked safely in development and deployment environments
* execution entry points are documented

---

## T7-002 — Harden email provider integration

### Purpose

Make transactional email integration production-ready.

### Implementation notes

* finalize Resend integration setup
* centralize email send utility in `lib/email/`
* define provider error handling strategy
* validate environment variable handling
* ensure safe logging without leaking sensitive data

### Dependencies

Sprint 01 provider scaffolding

### Acceptance criteria

* email utility is centralized and reusable
* provider failures are surfaced cleanly
* environment configuration is stable

---

## T7-003 — Build email template baseline set

### Purpose

Create the first complete production email template set.

### Implementation notes

Implement/refine templates for:

* verify email
* welcome email
* invite parent/supporting adult
* onboarding reminder
* snapshot ready
* upgrade confirmation
* milestone email
* deadline reminder
* billing confirmation if not already completed

Templates should be:

* visually consistent
* lightweight
* brand-aligned
* readable on mobile

### Dependencies

T7-002

### Acceptance criteria

* required email templates exist
* templates render consistently
* template copy is on-brand and professional

---

## T7-004 — Implement notification service layer

### Purpose

Centralize notification creation, send execution, and event persistence.

### Implementation notes

Build service methods for:

* create notification event
* send email notification
* mark notification sent
* mark notification failed
* mark notification read if used in app
* filter by notification preferences
* deduplicate notifications where required

### Dependencies

T7-002, schema foundation for `notification_events`

### Acceptance criteria

* notification logic is centralized
* send execution and event persistence are not scattered across feature modules

---

## T7-005 — Refine notification event persistence model in implementation

### Purpose

Ensure event records are created consistently across all notification types.

### Implementation notes

Standardize event creation for:

* auth-related emails
* invite-related emails
* onboarding reminders
* snapshot ready
* milestone emails
* deadline reminders
* billing confirmations

Ensure each event records:

* recipient user id
* type
* payload metadata
* send status
* failure reason if applicable

### Dependencies

T7-004

### Acceptance criteria

* notification events are created consistently
* failure metadata is captured when sends fail

---

## T7-006 — Implement onboarding reminder eligibility service

### Purpose

Determine which users should receive onboarding reminder nudges.

### Implementation notes

Build service that identifies users who:

* started onboarding
* did not complete onboarding
* meet reminder timing threshold
* have not opted out if preference applies
* have not already received too many recent reminders

### Dependencies

Sprint 02 onboarding data complete, T7-004

### Acceptance criteria

* onboarding reminder eligibility logic is deterministic
* duplicate or spammy reminders are avoided

---

## T7-007 — Implement onboarding reminder job endpoint

### Purpose

Execute onboarding reminder sends through scheduled job path.

### Implementation notes

Implement/refine:

* `POST /api/notifications/reminder-job`

For onboarding reminder mode:

* fetch eligible users
* send onboarding reminder emails
* persist notification events/outcomes
* log failures without crashing full batch

### Dependencies

T7-006

### Acceptance criteria

* onboarding reminder job runs successfully
* eligible users receive reminder sends
* failed sends do not stop whole job execution

---

## T7-008 — Implement snapshot-ready notification flow

### Purpose

Notify student when their free Edge Snapshot is ready if asynchronous timing warrants it.

### Implementation notes

Build trigger logic so that when snapshot status changes to ready:

* eligible student can receive snapshot-ready notification
* notification event is persisted
* duplicate ready emails are prevented

### Dependencies

Sprint 02 snapshot pipeline, T7-004

### Acceptance criteria

* snapshot-ready email flow works deterministically
* duplicate snapshot-ready emails are avoided

---

## T7-009 — Implement milestone notification eligibility service

### Purpose

Support milestone-based product nudges and confirmations.

### Implementation notes

Define milestone events such as:

* onboarding completed
* Story Vault started or completed threshold
* personal statement first feedback completed
* supplements first completion threshold

Build service that determines when milestone notification should fire and to whom.

### Dependencies

Sprints 02–06 product milestones, T7-004

### Acceptance criteria

* milestone logic is explicit and deterministic
* milestone notifications can be triggered from consistent event rules

---

## T7-010 — Implement milestone notification sending flow

### Purpose

Send milestone emails for student and/or supporting-adult visibility where appropriate.

### Implementation notes

* wire milestone triggers into notification service
* respect role and visibility boundaries
* do not send raw writing content in milestone emails

### Dependencies

T7-009

### Acceptance criteria

* milestone emails send for configured milestone events
* content remains summary-based and on-brand

---

## T7-011 — Implement deadline reminder eligibility service

### Purpose

Determine which student/school deadlines need proactive reminders.

### Implementation notes

Build service that identifies upcoming deadlines based on:

* student school list
* institution deadlines
* application type
* chosen reminder windows
* notification preferences

Support example reminder windows like:

* 14 days before
* 7 days before
* 3 days before
* 1 day before

### Dependencies

school planner/deadline integration from earlier sprints, T7-004

### Acceptance criteria

* deadline reminder eligibility logic is deterministic
* missing/partial deadline data is handled safely
* duplicate reminders for same deadline window are avoided

---

## T7-012 — Implement deadline reminder job endpoint

### Purpose

Execute deadline reminders through scheduled job path.

### Implementation notes

Implement/refine:

* `POST /api/notifications/deadline-job`

Behavior:

* fetch eligible deadline reminders
* send to correct recipient(s)
* persist notification outcomes
* continue batch processing on partial failures

### Dependencies

T7-011

### Acceptance criteria

* deadline reminder job runs successfully
* reminder sends persist correctly
* failures are captured without full job failure

---

## T7-013 — Implement supporting-adult reminder preference filtering

### Purpose

Ensure buyer-side communications are opt-in aware and role-appropriate.

### Implementation notes

Respect supporting-adult preferences for:

* progress updates
* milestone notifications
* deadline notifications

Ensure supporting adults do not receive raw writing content or overly invasive notifications.

### Dependencies

Sprint 06 notification preferences, T7-004

### Acceptance criteria

* supporting-adult preferences are honored
* notification rules stay aligned with summary-only visibility model

---

## T7-014 — Implement in-app notification retrieval baseline (optional lightweight)

### Purpose

Provide basic visibility into notification history without building a full inbox product.

### Implementation notes

If included in v1, implement lightweight retrieval for own notification history using existing `notification_events`.
Can be settings- or profile-adjacent rather than full inbox.

### Dependencies

T7-004, existing notification schema

### Acceptance criteria

* if implemented, users can view basic recent notification history safely
* no overbuilt inbox complexity is introduced

---

## T7-015 — Build admin notification observability view

### Purpose

Give operators visibility into notification health.

### Implementation notes

Add or refine admin surface showing:

* send volume by type
* failed sends
* recent notification events
* reminder job outcomes

Could live under `/admin/support` and/or `/admin/analytics`.

### Dependencies

T7-005

### Acceptance criteria

* admin can inspect notification event health
* failed sends are visible without querying raw DB manually

---

## T7-016 — Refine analytics for re-engagement and reminder funnel

### Purpose

Measure whether proactive messaging improves return behavior.

### Implementation notes

Add events for:

* onboarding_reminder_sent
* onboarding_reminder_opened/clicked if tracked
* snapshot_ready_sent
* milestone_email_sent
* deadline_reminder_sent
* reminder_job_run_completed
* reminder_job_run_failed
* return_after_reminder if attributable

### Dependencies

T7-007 through T7-012

### Acceptance criteria

* reminder funnel events are emitted through central analytics interface
* operational and product teams can measure reminder behavior

---

## T7-017 — Implement notification deduplication safeguards

### Purpose

Prevent accidental notification spam.

### Implementation notes

Define deduplication strategy for:

* same notification type
* same recipient
* same related object/window
* same execution window

Apply dedupe to onboarding reminders, deadline reminders, and snapshot-ready notifications.

### Dependencies

T7-004, T7-006, T7-011

### Acceptance criteria

* duplicate sends are prevented in normal execution paths
* repeated job execution does not spam users

---

## T7-018 — Implement notification failure and retry strategy

### Purpose

Make reminder infrastructure resilient under provider or transient failures.

### Implementation notes

Define behavior for:

* transient provider failures
* malformed payloads
* invalid/missing email addresses
* partial batch failures

At minimum:

* mark failure in `notification_events`
* surface failure in admin view
* support safe manual or automatic retry strategy as appropriate

### Dependencies

T7-004, T7-015

### Acceptance criteria

* failures are captured cleanly
* failure handling does not hide send problems
* retry strategy is documented and minimally implemented where needed

---

## T7-019 — Add integration tests for onboarding reminder eligibility and sending

### Purpose

Protect the first reminder workflow.

### Implementation notes

Add tests for:

* eligible onboarding user receives reminder
* completed onboarding user does not receive reminder
* duplicate reminder prevention works
* send failure is persisted correctly

### Dependencies

T7-006, T7-007, T7-017

### Acceptance criteria

* onboarding reminder flow is integration-tested
* duplicate/spam prevention is covered

---

## T7-020 — Add integration tests for deadline reminder eligibility and sending

### Purpose

Protect the most operationally important reminder workflow.

### Implementation notes

Add tests for:

* upcoming deadline generates reminder
* missing/partial deadline data is handled safely
* duplicate deadline reminders are prevented per window
* send failures are captured correctly

### Dependencies

T7-011, T7-012, T7-017

### Acceptance criteria

* deadline reminder flow is integration-tested
* partial deadline edge cases are covered

---

## T7-021 — Add integration tests for notification event lifecycle

### Purpose

Protect persistence and observability assumptions.

### Implementation notes

Add tests for:

* event created before/with send
* status updated to sent
* status updated to failed
* metadata stored correctly
* admin visibility can read event records

### Dependencies

T7-005, T7-015

### Acceptance criteria

* notification event lifecycle is integration-tested
* event-state transitions are reliable

---

## T7-022 — Add end-to-end test for onboarding reminder recovery path

### Purpose

Verify the user can return to the product after a reminder nudge.

### Implementation notes

Create E2E test for:

* incomplete onboarding user receives reminder trigger path
* user follows reminder path back into app
* onboarding resumes at correct place

### Dependencies

T7-007

### Acceptance criteria

* onboarding reminder recovery flow is test-covered end to end

---

## T7-023 — Add end-to-end test for deadline reminder path

### Purpose

Verify deadline reminders connect back into the correct product context.

### Implementation notes

Create E2E test for:

* user with upcoming deadline receives reminder path
* user follows reminder link/path
* user lands in meaningful school/deadline context

### Dependencies

T7-012

### Acceptance criteria

* deadline reminder path is test-covered end to end

---

## T7-024 — Refine notification copy and cadence rules

### Purpose

Ensure reminders feel premium and helpful rather than spammy.

### Implementation notes

Review and refine:

* subject lines
* reminder timing language
* milestone tone
* deadline urgency tone
* supporting-adult copy boundaries

Document cadence assumptions for v1.

### Dependencies

T7-003, T7-006, T7-011

### Acceptance criteria

* copy is on-brand, calm, and actionable
* cadence rules are documented and reasonable

---

## T7-025 — Sprint 07 QA and hardening pass

### Purpose

Stabilize reminder and notification infrastructure before admin/ops refinement expands further.

### Implementation notes

Validate:

* job execution reliability
* no duplicate sends under normal repeated runs
* failed sends are visible in admin views
* reminder links land in correct product context
* supporting-adult preferences are respected
* no raw writing content leaks through emails
* no runtime errors across reminder-related flows

### Dependencies

All prior Sprint 07 tickets

### Acceptance criteria

* no critical notification workflow defects remain
* no critical duplicate-send defects remain
* no critical observability gaps remain
* reminder system is stable enough for next sprint

---

# 6. Recommended implementation order inside sprint

## Wave 1

* T7-001
* T7-002
* T7-003
* T7-004
* T7-005

## Wave 2

* T7-006
* T7-007
* T7-008
* T7-009
* T7-010
* T7-011
* T7-012

## Wave 3

* T7-013
* T7-014
* T7-015
* T7-016
* T7-017
* T7-018
* T7-024

## Wave 4

* T7-019
* T7-020
* T7-021
* T7-022
* T7-023
* T7-025

---

# 7. Sprint 07 deliverable checklist

At sprint close, confirm all of the following:

* [ ] reminder job infrastructure configured
* [ ] Resend/email integration hardened
* [ ] email template baseline complete
* [ ] notification service layer exists
* [ ] notification events persist consistently
* [ ] onboarding reminder eligibility logic works
* [ ] onboarding reminder job works
* [ ] snapshot-ready notification works
* [ ] milestone notification logic works
* [ ] deadline reminder eligibility logic works
* [ ] deadline reminder job works
* [ ] supporting-adult preferences are respected
* [ ] admin notification observability view exists
* [ ] analytics events exist for reminder flows
* [ ] deduplication safeguards exist
* [ ] failure/retry strategy exists
* [ ] integration tests cover onboarding reminders
* [ ] integration tests cover deadline reminders
* [ ] integration tests cover notification event lifecycle
* [ ] E2E covers onboarding reminder recovery
* [ ] E2E covers deadline reminder path

---

# 8. Non-negotiables for Sprint 07

1. Do not send duplicate reminders under normal retry/job conditions.
2. Do not send reminders without persisting notification events.
3. Do not leak raw student writing content in any email surface.
4. Do not ignore supporting-adult preference settings where applicable.
5. Do not move to the next sprint if notification failures are invisible operationally.

---

# 9. Recommended next artifact

Create next:
**SPRINT_08_TICKETS.md**

Sprint 08 should cover:

* admin operations refinement
* institution/deadline admin tooling improvements
* analytics dashboard refinement
* audit event visibility
* support diagnostics
* launch hardening and release checklist
