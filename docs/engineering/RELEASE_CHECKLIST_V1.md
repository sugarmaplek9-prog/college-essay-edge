# RELEASE_CHECKLIST_V1

## The College Admissions Edge

## v1 Production Release Checklist

## 1. Purpose

This document is the authoritative release checklist for v1.

It exists to ensure that launch is:

* controlled
* auditable
* repeatable
* cross-functional
* not dependent on memory or improvisation

This checklist must be used for:

* release candidate validation
* final launch decision
* launch-day execution
* post-launch monitoring
* rollback decision-making if required

If there is a conflict between an ad hoc launch decision and this checklist, this checklist wins unless a documented leadership override is made.

---

## 2. Release scope

This checklist covers:

* environment readiness
* database and migration readiness
* billing/provider readiness
* auth and permissions readiness
* notification readiness
* data readiness
* smoke testing
* launch-day monitoring
* rollback readiness
* go/no-go signoff

This checklist does **not** replace:

* sprint tickets
* QA test plans
* security review artifacts
* operational runbooks

It is the final release-control layer.

---

## 3. Release status definitions

### Green

Ready to launch. No known critical blockers.

### Yellow

Launch possible but only with explicit signoff on documented risks.

### Red

Do not launch. One or more critical blockers remain unresolved.

---

## 4. Release roles and owners

Assign named owners before launch.

| Function               | Owner | Backup | Status |
| ---------------------- | ----- | ------ | ------ |
| Product owner          |       |        |        |
| Engineering lead       |       |        |        |
| QA lead                |       |        |        |
| Ops / deployment owner |       |        |        |
| Billing/provider owner |       |        |        |
| Support owner          |       |        |        |

All release sections below must have an owner.

---

## 5. Pre-release readiness checklist

## 5.1 Product readiness

| Check                                                  | Owner | Status | Notes |
| ------------------------------------------------------ | ----- | ------ | ----- |
| PRD v1 is final and current                            |       |        |       |
| Engineering Build Spec v1 is final and current         |       |        |       |
| Implementation Plan v1 is final and current            |       |        |       |
| Sprint 01–08 artifacts exist and reflect shipped scope |       |        |       |
| Scope of v1 launch is explicitly frozen                |       |        |       |
| Deferred features are documented                       |       |        |       |
| Deferred defects are documented                        |       |        |       |

### Gate

Must be Green before release.

---

## 5.2 Environment readiness

| Check                                          | Owner | Status | Notes |
| ---------------------------------------------- | ----- | ------ | ----- |
| Production environment exists                  |       |        |       |
| Preview environment works                      |       |        |       |
| Production URL is final                        |       |        |       |
| Callback URLs are correct                      |       |        |       |
| `NEXT_PUBLIC_APP_URL` is correct in production |       |        |       |
| No placeholder env vars remain                 |       |        |       |
| Secrets are stored only in environment config  |       |        |       |
| Environment values are documented              |       |        |       |

### Gate

Any missing or incorrect production environment variable is Red.

---

## 5.3 Database and migration readiness

| Check                                                                    | Owner | Status | Notes |
| ------------------------------------------------------------------------ | ----- | ------ | ----- |
| `DATABASE_SCHEMA_V1.sql` applied in production-compatible migration form |       |        |       |
| `DATABASE_RLS_POLICIES_V1.sql` applied                                   |       |        |       |
| Institution seed/import path validated                                   |       |        |       |
| Deadline seed/import path validated                                      |       |        |       |
| All migrations run successfully on staging/preview equivalent            |       |        |       |
| Migration order is documented                                            |       |        |       |
| Rollback or recovery plan for failed migration exists                    |       |        |       |
| RLS behavior spot-checked after migrations                               |       |        |       |

### Gate

Any migration failure risk without recovery plan is Red.

---

## 5.4 Auth and permission readiness

| Check                                               | Owner | Status | Notes |
| --------------------------------------------------- | ----- | ------ | ----- |
| Signup works                                        |       |        |       |
| Login works                                         |       |        |       |
| Logout works                                        |       |        |       |
| Password reset works                                |       |        |       |
| Role selection works                                |       |        |       |
| Student route protection works                      |       |        |       |
| Supporting-adult route protection works             |       |        |       |
| Admin route protection works                        |       |        |       |
| RLS blocks unauthorized resource access             |       |        |       |
| Free vs paid access checks are server-side enforced |       |        |       |
| Supporting adults cannot view raw student writing   |       |        |       |
| Non-admin users cannot access admin views or APIs   |       |        |       |

### Gate

Any permission or auth leak is Red.

---

## 5.5 Billing and entitlement readiness

| Check                                              | Owner | Status | Notes |
| -------------------------------------------------- | ----- | ------ | ----- |
| Stripe product and price are correct               |       |        |       |
| Checkout session endpoint works                    |       |        |       |
| Billing portal endpoint works                      |       |        |       |
| Webhook endpoint is configured correctly           |       |        |       |
| Webhook signature verification works               |       |        |       |
| Subscription state sync works                      |       |        |       |
| Paid unlocks work after successful payment         |       |        |       |
| Free users remain gated from paid features         |       |        |       |
| Non-owner cannot access billing portal             |       |        |       |
| Cancel / past_due / unpaid states behave correctly |       |        |       |

### Gate

Any payment success without correct unlock behavior is Red.

---

## 5.6 Notification and reminder readiness

| Check                                                   | Owner | Status | Notes |
| ------------------------------------------------------- | ----- | ------ | ----- |
| Email provider is configured in production              |       |        |       |
| Required templates render correctly                     |       |        |       |
| Onboarding reminder job works                           |       |        |       |
| Snapshot-ready notification works                       |       |        |       |
| Milestone notification flow works                       |       |        |       |
| Deadline reminder job works                             |       |        |       |
| Notification events persist for sends/failures          |       |        |       |
| Duplicate-send safeguards work                          |       |        |       |
| Supporting-adult notification preferences are respected |       |        |       |
| No raw writing content appears in emails                |       |        |       |

### Gate

Duplicate reminder risk or invisible send failures are Red.

---

## 5.7 School and deadline data readiness

| Check                                                      | Owner | Status | Notes |
| ---------------------------------------------------------- | ----- | ------ | ----- |
| Institution dataset loaded                                 |       |        |       |
| Institution search works                                   |       |        |       |
| Obvious duplicates reviewed                                |       |        |       |
| Deadline dataset loaded for launch cycle                   |       |        |       |
| Verified/partial/stale states are visible                  |       |        |       |
| High-priority school spot checks completed                 |       |        |       |
| Missing/partial deadline fallback UX works                 |       |        |       |
| Admin can inspect and correct institution/deadline records |       |        |       |

### Gate

Severely unreliable school/deadline data for key launch schools is Yellow or Red depending on severity.

---

## 5.8 Core workflow readiness

| Check                                            | Owner | Status | Notes |
| ------------------------------------------------ | ----- | ------ | ----- |
| Student onboarding works end to end              |       |        |       |
| Edge Snapshot works end to end                   |       |        |       |
| Upgrade flow works end to end                    |       |        |       |
| Story Vault works end to end                     |       |        |       |
| Personal statement workflow works end to end     |       |        |       |
| Supplements workflow works end to end            |       |        |       |
| Supporting-adult dashboard works end to end      |       |        |       |
| Dashboard/progress states update correctly       |       |        |       |
| Major empty/loading/error states are implemented |       |        |       |
| Mobile and desktop usability are acceptable      |       |        |       |

### Gate

Any broken core user journey is Red.

---

## 5.9 Admin and support readiness

| Check                                      | Owner | Status | Notes |
| ------------------------------------------ | ----- | ------ | ----- |
| Admin overview is useful                   |       |        |       |
| Admin user inspection is useful            |       |        |       |
| Institution admin tooling works            |       |        |       |
| Deadline admin tooling works               |       |        |       |
| Audit event visibility works               |       |        |       |
| Notification failure visibility works      |       |        |       |
| Support diagnostics work for common issues |       |        |       |
| Support runbook exists                     |       |        |       |
| Launch-day support coverage is assigned    |       |        |       |

### Gate

Lack of support visibility into critical failures is Red.

---

## 5.10 Analytics and observability readiness

| Check                                     | Owner | Status | Notes |
| ----------------------------------------- | ----- | ------ | ----- |
| Funnel analytics are visible              |       |        |       |
| Upgrade funnel analytics are visible      |       |        |       |
| Supporting-adult link funnel is visible   |       |        |       |
| Reminder funnel is visible                |       |        |       |
| Critical operational failures are visible |       |        |       |
| Event taxonomy is cleaned and stable      |       |        |       |
| Smoke test results are visible            |       |        |       |

### Gate

If the team cannot tell whether the product is healthy after launch, status is Yellow or Red depending on severity.

---

## 6. Test and QA checklist

## 6.1 Automated test readiness

| Check                             | Owner | Status | Notes |
| --------------------------------- | ----- | ------ | ----- |
| Unit tests pass                   |       |        |       |
| Integration tests pass            |       |        |       |
| End-to-end tests pass             |       |        |       |
| Core launch smoke test passes     |       |        |       |
| Admin operational flow E2E passes |       |        |       |

### Gate

Failing release-blocking automated tests are Red.

---

## 6.2 Manual QA readiness

| Check                                                          | Owner | Status | Notes |
| -------------------------------------------------------------- | ----- | ------ | ----- |
| Desktop student flows manually verified                        |       |        |       |
| Mobile student flows manually verified                         |       |        |       |
| Desktop supporting-adult flows manually verified               |       |        |       |
| Mobile supporting-adult flows manually verified                |       |        |       |
| Admin routes manually verified                                 |       |        |       |
| Billing flows manually verified in production-like environment |       |        |       |
| Notification templates manually verified                       |       |        |       |
| Permission boundaries manually spot-checked                    |       |        |       |

### Gate

Manual QA gaps in core workflows are Yellow or Red depending on severity.

---

## 6.3 Defect triage status

| Category                    | Critical Open | High Open | Medium Open | Low Open | Notes |
| --------------------------- | ------------: | --------: | ----------: | -------: | ----- |
| Auth / permissions          |               |           |             |          |       |
| Billing / entitlements      |               |           |             |          |       |
| Onboarding / snapshot       |               |           |             |          |       |
| Story Vault                 |               |           |             |          |       |
| Personal statement          |               |           |             |          |       |
| Supplements                 |               |           |             |          |       |
| Supporting-adult experience |               |           |             |          |       |
| Notifications / reminders   |               |           |             |          |       |
| Institutions / deadlines    |               |           |             |          |       |
| Admin / support             |               |           |             |          |       |

### Gate

Any unresolved critical defect requires explicit go/no-go review.

---

## 7. Migration execution checklist

Complete this before release migration is run.

| Check                                                | Owner | Status | Notes |
| ---------------------------------------------------- | ----- | ------ | ----- |
| Migration order reviewed                             |       |        |       |
| Production backup/recovery posture confirmed         |       |        |       |
| Estimated migration impact reviewed                  |       |        |       |
| Maintenance window decision made if needed           |       |        |       |
| Seed/import sequence reviewed                        |       |        |       |
| Admin data-validation steps after migration prepared |       |        |       |

### Migration execution log

| Step                        | Performed By | Time | Result | Notes |
| --------------------------- | ------------ | ---- | ------ | ----- |
| Apply schema migrations     |              |      |        |       |
| Apply RLS migrations        |              |      |        |       |
| Run institution seed/import |              |      |        |       |
| Run deadline seed/import    |              |      |        |       |
| Validate key tables         |              |      |        |       |
| Validate RLS                |              |      |        |       |

### Gate

Failed or partially understood migrations are Red.

---

## 8. Provider readiness checklist

## 8.1 Auth provider / Supabase

| Check                            | Owner | Status | Notes |
| -------------------------------- | ----- | ------ | ----- |
| Auth configured correctly        |       |        |       |
| Email auth behavior verified     |       |        |       |
| Password reset behavior verified |       |        |       |
| Callback URLs verified           |       |        |       |
| Database reachable and healthy   |       |        |       |

## 8.2 Billing provider / Stripe

| Check                                   | Owner | Status | Notes |
| --------------------------------------- | ----- | ------ | ----- |
| Product/price verified                  |       |        |       |
| Webhook configured                      |       |        |       |
| Portal works                            |       |        |       |
| Test and/or live modes are not confused |       |        |       |

## 8.3 Email provider / Resend

| Check                                | Owner | Status | Notes |
| ------------------------------------ | ----- | ------ | ----- |
| Domain/sender configuration verified |       |        |       |
| Templates render correctly           |       |        |       |
| Send failures are visible            |       |        |       |

### Gate

Provider misconfiguration for auth, billing, or email is Red.

---

## 9. Launch-day smoke tests

Run these after final deployment and migrations.

## 9.1 Student smoke path

| Check                     | Owner | Status | Notes |
| ------------------------- | ----- | ------ | ----- |
| Sign up new student       |       |        |       |
| Select student role       |       |        |       |
| Complete onboarding       |       |        |       |
| Reach snapshot            |       |        |       |
| Upgrade successfully      |       |        |       |
| Access Story Vault        |       |        |       |
| Access personal statement |       |        |       |
| Access supplements        |       |        |       |
| Access school planner     |       |        |       |

## 9.2 Supporting-adult smoke path

| Check                                  | Owner | Status | Notes |
| -------------------------------------- | ----- | ------ | ----- |
| Create/link supporting-adult account   |       |        |       |
| Access parent dashboard                |       |        |       |
| View progress summary                  |       |        |       |
| View deadlines summary                 |       |        |       |
| Confirm no raw writing content visible |       |        |       |

## 9.3 Admin smoke path

| Check                          | Owner | Status | Notes |
| ------------------------------ | ----- | ------ | ----- |
| Admin login works              |       |        |       |
| Admin overview renders         |       |        |       |
| Users view works               |       |        |       |
| Institutions admin works       |       |        |       |
| Deadlines admin works          |       |        |       |
| Analytics view works           |       |        |       |
| Support diagnostics view works |       |        |       |

### Gate

If smoke tests fail in critical flows, status is Red.

---

## 10. Launch-day monitoring plan

## 10.1 First-hour checks

| Metric / Signal                     | Owner | Frequency | Status | Notes |
| ----------------------------------- | ----- | --------- | ------ | ----- |
| App uptime/basic availability       |       |           |        |       |
| Auth/signup success                 |       |           |        |       |
| Billing checkout success            |       |           |        |       |
| Post-payment unlock success         |       |           |        |       |
| Snapshot generation success/failure |       |           |        |       |
| Notification failure rate           |       |           |        |       |
| Core route error rate               |       |           |        |       |

## 10.2 First-day checks

| Metric / Signal                  | Owner | Frequency | Status | Notes |
| -------------------------------- | ----- | --------- | ------ | ----- |
| Onboarding completion rate       |       |           |        |       |
| Snapshot view rate               |       |           |        |       |
| Upgrade conversion rate          |       |           |        |       |
| Story Vault usage                |       |           |        |       |
| Essay usage                      |       |           |        |       |
| Supplements usage                |       |           |        |       |
| Supporting-adult link completion |       |           |        |       |
| Reminder send failures           |       |           |        |       |
| Support ticket/issue count       |       |           |        |       |

### Rule

Monitoring owners must be explicitly assigned before launch.

---

## 11. Rollback and incident readiness

## 11.1 Rollback decision triggers

Rollback or immediate release stop should be considered if any of the following occur:

* widespread auth failure
* permission leak or data exposure
* billing success without unlock, or incorrect unlock
* severe migration/data corruption issue
* severe notification spam issue
* admin/support inability to inspect critical failures

## 11.2 Rollback preparation checklist

| Check                                         | Owner | Status | Notes |
| --------------------------------------------- | ----- | ------ | ----- |
| Rollback owner assigned                       |       |        |       |
| Previous deploy reference identified          |       |        |       |
| Migration recovery approach understood        |       |        |       |
| Provider config rollback impact reviewed      |       |        |       |
| Communications plan exists if rollback needed |       |        |       |

## 11.3 Incident response notes

| Scenario            | Immediate Action | Owner | Notes |
| ------------------- | ---------------- | ----- | ----- |
| Auth outage         |                  |       |       |
| Billing failure     |                  |       |       |
| Permission leak     |                  |       |       |
| Notification spam   |                  |       |       |
| Deadline data issue |                  |       |       |

---

## 12. Go / no-go signoff matrix

Complete only after all prior sections are reviewed.

| Area                        | Owner | Status (Green/Yellow/Red) | Notes |
| --------------------------- | ----- | ------------------------- | ----- |
| Product readiness           |       |                           |       |
| Engineering readiness       |       |                           |       |
| QA readiness                |       |                           |       |
| Billing/provider readiness  |       |                           |       |
| Data readiness              |       |                           |       |
| Notification readiness      |       |                           |       |
| Admin/support readiness     |       |                           |       |
| Launch operations readiness |       |                           |       |

### Final release decision

| Decision | Owner | Time | Notes |
| -------- | ----- | ---- | ----- |
| GO       |       |      |       |
| NO-GO    |       |      |       |

### Rule

If any area is Red, default decision is **NO-GO** unless explicit leadership override is documented.

---

## 13. Post-launch review checklist

Complete within 24–72 hours after launch.

| Check                                      | Owner | Status | Notes |
| ------------------------------------------ | ----- | ------ | ----- |
| Core user funnel reviewed                  |       |        |       |
| Billing funnel reviewed                    |       |        |       |
| Supporting-adult flow reviewed             |       |        |       |
| Reminder/notification performance reviewed |       |        |       |
| Critical incidents reviewed                |       |        |       |
| Top support issues summarized              |       |        |       |
| Immediate v1.0.1 fixes identified          |       |        |       |
| Deferred backlog reprioritized             |       |        |       |

---

## 14. Non-negotiables

1. Do not launch without a completed launch-day smoke test.
2. Do not launch without explicit owner assignment for monitoring and support.
3. Do not launch with known unresolved critical permission or billing defects.
4. Do not launch without rollback readiness.
5. Do not rely on memory for launch execution; use this checklist live.

---

## 15. Final directive

This checklist must be reviewed and completed in real time during release preparation and launch.

A launch is not considered controlled unless:

* this checklist is completed,
* the signoff matrix is filled out,
* and the go/no-go decision is explicitly recorded.

---

## 16. Recommended next artifacts

Create next:

* `GO_LIVE_RUNBOOK_V1.md`
* `POST_LAUNCH_REVIEW_V1.md`
* `DEFERRED_DEFECTS_V1.md`
* `V1_0_1_HOTFIX_PLAN.md`