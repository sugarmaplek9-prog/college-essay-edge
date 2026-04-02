# POST_LAUNCH_REVIEW_V1

## The College Admissions Edge

## 24–72 Hour Post-Launch Review

## 1. Purpose

This document is the structured review framework for the first 24–72 hours after launch.

It exists to answer five questions:

* Did the launch actually work in the real world?
* Where did users succeed, stall, or fail?
* What broke or degraded under production conditions?
* What needs immediate correction in v1.0.1?
* What should be monitored versus fixed now?

This document is not a general retrospective.
It is the operational and product truth document for the immediate post-launch window.

It must be used to:

* assess launch health
* summarize real-world product behavior
* triage defects
* prioritize hotfixes
* inform the v1.0.1 plan

---

## 2. Review timing

### Required checkpoints

* **T+24 hours** — initial launch health review
* **T+48 hours** — deeper product and support review
* **T+72 hours** — decision checkpoint for v1.0.1 priorities

If issues are severe, the first review may be pulled earlier.

---

## 3. Review owners

| Area                       | Primary Owner | Backup | Status |
| -------------------------- | ------------- | ------ | ------ |
| Product review             |               |        |        |
| Engineering review         |               |        |        |
| QA review                  |               |        |        |
| Billing/entitlement review |               |        |        |
| Data quality review        |               |        |        |
| Support review             |               |        |        |
| Analytics review           |               |        |        |

Each section below should be assigned and completed by an owner.

---

## 4. Launch posture summary

Complete this first.

| Item                      | Value                |
| ------------------------- | -------------------- |
| Launch date/time          |                      |
| Current review checkpoint | T+24 / T+48 / T+72   |
| Current overall status    | Green / Yellow / Red |
| Release version           |                      |
| Known active incidents    |                      |
| Rollback considered?      | Yes / No             |
| If yes, why not executed? |                      |

### Summary narrative

Write a concise factual summary of the first 24–72 hours:

* What went well
* What did not go well
* What the product actually experienced in production
* Whether the launch posture is stable, unstable, or constrained

---

## 5. Core product health review

## 5.1 Availability and stability

| Check                                  | Owner | Status | Notes |
| -------------------------------------- | ----- | ------ | ----- |
| App availability acceptable            |       |        |       |
| No major route-level outages           |       |        |       |
| No deployment instability after launch |       |        |       |
| No widespread runtime failures         |       |        |       |
| Error rates acceptable                 |       |        |       |

### Findings

Document any outages, instability, or error patterns.

---

## 5.2 Auth and access control health

| Check                                                   | Owner | Status | Notes |
| ------------------------------------------------------- | ----- | ------ | ----- |
| Signup success acceptable                               |       |        |       |
| Login success acceptable                                |       |        |       |
| Role selection functioning correctly                    |       |        |       |
| Student route protection functioning correctly          |       |        |       |
| Supporting-adult route protection functioning correctly |       |        |       |
| Admin route protection functioning correctly            |       |        |       |
| No permission leak identified                           |       |        |       |
| No raw writing leakage identified                       |       |        |       |

### Findings

Summarize any auth, role, or permissions issues.

### Severity

* Green = no meaningful issues
* Yellow = low-frequency issues with workaround
* Red = any permission leak or major auth instability

---

## 5.3 Billing and entitlement health

| Check                                      | Owner | Status | Notes |
| ------------------------------------------ | ----- | ------ | ----- |
| Checkout starts successfully               |       |        |       |
| Checkout completion rate acceptable        |       |        |       |
| Subscription sync working                  |       |        |       |
| Premium unlock after payment working       |       |        |       |
| Free users remain properly gated           |       |        |       |
| Billing portal works for owners            |       |        |       |
| Non-owners cannot access billing controls  |       |        |       |
| No material entitlement mismatch incidents |       |        |       |

### Findings

Summarize any payment, unlock, or entitlement defects.

### Immediate action flag

Mark any billing/entitlement issue that requires hotfix:

* Yes
* No

---

## 5.4 Notification and reminder health

| Check                                      | Owner | Status | Notes |
| ------------------------------------------ | ----- | ------ | ----- |
| Verification/welcome emails working        |       |        |       |
| Onboarding reminders working               |       |        |       |
| Snapshot-ready notifications working       |       |        |       |
| Milestone emails working                   |       |        |       |
| Deadline reminders working                 |       |        |       |
| Notification events persisted consistently |       |        |       |
| Duplicate reminder behavior absent         |       |        |       |
| Supporting-adult preferences respected     |       |        |       |

### Findings

Summarize send failures, duplicate behavior, or user-facing issues.

### Severity

Any duplicate-send or invisible-failure pattern should be at least Yellow and possibly Red.

---

## 5.5 Data quality health — institutions and deadlines

| Check                                           | Owner | Status | Notes |
| ----------------------------------------------- | ----- | ------ | ----- |
| Institution search functioning correctly        |       |        |       |
| Institution dataset coverage acceptable         |       |        |       |
| Obvious duplicate schools manageable            |       |        |       |
| Deadline records rendering acceptably           |       |        |       |
| Confidence states visible and meaningful        |       |        |       |
| High-priority school data spot checks passed    |       |        |       |
| Missing/partial deadline fallback UX acceptable |       |        |       |

### Findings

Summarize actual data issues seen in production.

### Action flag

Does data quality require immediate patching before broader promotion?

* Yes
* No

---

## 6. Funnel and conversion review

## 6.1 Top-of-funnel review

| Metric                    | Value | Owner | Notes |
| ------------------------- | ----: | ----- | ----- |
| Landing page visits       |       |       |       |
| CTA clicks                |       |       |       |
| Signup starts             |       |       |       |
| Signup completions        |       |       |       |
| Role selections completed |       |       |       |

### Questions

* Is traffic turning into account creation at an acceptable rate?
* Is there friction at signup or role selection?
* Is there evidence of copy/positioning confusion?

---

## 6.2 Onboarding and snapshot funnel review

| Metric                           | Value | Owner | Notes |
| -------------------------------- | ----: | ----- | ----- |
| Onboarding started               |       |       |       |
| Onboarding completed             |       |       |       |
| Onboarding completion rate       |       |       |       |
| Snapshot generation started      |       |       |       |
| Snapshot generation success rate |       |       |       |
| Snapshot viewed                  |       |       |       |

### Questions

* Where are students dropping out of onboarding?
* Are text-heavy questions creating friction?
* Is snapshot generation fast and stable enough?
* Does the snapshot feel compelling enough to continue?

---

## 6.3 Upgrade and paid conversion review

| Metric                | Value | Owner | Notes |
| --------------------- | ----: | ----- | ----- |
| Upgrade prompt viewed |       |       |       |
| Upgrade CTA clicked   |       |       |       |
| Checkout started      |       |       |       |
| Checkout completed    |       |       |       |
| Paid activation rate  |       |       |       |

### Questions

* Is the free-to-paid handoff working?
* Are users falling out before checkout or after checkout?
* Is there friction in upgrade messaging or billing UX?

---

## 6.4 Premium module usage review

| Metric                     | Value | Owner | Notes |
| -------------------------- | ----: | ----- | ----- |
| Story Vault viewed         |       |       |       |
| Story entries created      |       |       |       |
| Story analysis requested   |       |       |       |
| Personal statement started |       |       |       |
| Feedback requested         |       |       |       |
| Supplements viewed         |       |       |       |
| Supplements created        |       |       |       |

### Questions

* Which premium module is being used first most often?
* Are students meaningfully engaging after payment?
* Is there evidence of confusion after unlock?

---

## 6.5 Supporting-adult funnel review

| Metric                              | Value | Owner | Notes |
| ----------------------------------- | ----: | ----- | ----- |
| Supporting-adult invites initiated  |       |       |       |
| Supporting-adult onboarding started |       |       |       |
| Supporting-adult links completed    |       |       |       |
| Parent dashboard views              |       |       |       |
| Parent deadlines views              |       |       |       |

### Questions

* Are students actually inviting supporting adults?
* Are supporting adults completing the link flow?
* Is the supporting-adult experience being used after linking?

---

## 7. User behavior and friction review

## 7.1 Student friction points

Document the top student friction points observed in the first 24–72 hours.

| Friction Point | Severity | Evidence | Proposed Action |
| -------------- | -------- | -------- | --------------- |
|                |          |          |                 |
|                |          |          |                 |
|                |          |          |                 |

Examples may include:

* onboarding fatigue
* snapshot load uncertainty
* unclear upgrade value
* draft editor confusion
* supplement route confusion

---

## 7.2 Supporting-adult friction points

| Friction Point | Severity | Evidence | Proposed Action |
| -------------- | -------- | -------- | --------------- |
|                |          |          |                 |
|                |          |          |                 |
|                |          |          |                 |

Examples may include:

* confusing link flow
* unclear dashboard state
* billing-visibility confusion
* expectation mismatch about writing visibility

---

## 7.3 Operational friction points

| Friction Point | Severity | Evidence | Proposed Action |
| -------------- | -------- | -------- | --------------- |
|                |          |          |                 |
|                |          |          |                 |
|                |          |          |                 |

Examples may include:

* admin/support cannot diagnose issue fast enough
* reminder failure visibility is weak
* data correction flow too slow

---

## 8. Support load review

## 8.1 Support volume summary

| Metric                        | Value | Owner | Notes |
| ----------------------------- | ----: | ----- | ----- |
| Total support issues received |       |       |       |
| Critical issues               |       |       |       |
| High-priority issues          |       |       |       |
| Repeated issue pattern count  |       |       |       |

---

## 8.2 Top support issue categories

| Category                        | Count | Severity | Notes |
| ------------------------------- | ----: | -------- | ----- |
| Auth/login                      |       |          |       |
| Billing/unlock                  |       |          |       |
| Onboarding                      |       |          |       |
| Snapshot                        |       |          |       |
| Story Vault                     |       |          |       |
| Essay workflow                  |       |          |       |
| Supplements                     |       |          |       |
| Parent/supporting-adult linking |       |          |       |
| Deadlines/data quality          |       |          |       |
| Notifications/emails            |       |          |       |

### Questions

* Which issues are one-offs vs systemic?
* Which issues are product design problems vs bugs?
* Which issues should trigger immediate messaging or UX adjustments?

---

## 9. Defect triage review

## 9.1 Critical defects

| Defect | Area | Severity | Status | Owner | Fix Target |
| ------ | ---- | -------- | ------ | ----- | ---------- |
|        |      | Critical |        |       |            |
|        |      | Critical |        |       |            |

### Rule

Any unresolved critical defect must be reviewed explicitly with product + engineering + QA.

---

## 9.2 High-priority defects

| Defect | Area | Severity | Status | Owner | Fix Target |
| ------ | ---- | -------- | ------ | ----- | ---------- |
|        |      | High     |        |       |            |
|        |      | High     |        |       |            |
|        |      | High     |        |       |            |

---

## 9.3 Deferred issues

| Issue | Reason Deferred | Owner | Review Date |
| ----- | --------------- | ----- | ----------- |
|       |                 |       |             |
|       |                 |       |             |

---

## 10. v1.0.1 hotfix prioritization

This section determines what gets fixed immediately.

## 10.1 Hotfix candidate list

| Candidate | Area | Why It Matters | Severity | Recommended Action |
| --------- | ---- | -------------- | -------- | ------------------ |
|           |      |                |          |                    |
|           |      |                |          |                    |
|           |      |                |          |                    |

## 10.2 Hotfix decision rules

A v1.0.1 candidate should usually qualify if it does one or more of the following:

* fixes a core funnel break
* fixes a billing/unlock defect
* fixes a permission or visibility defect
* reduces severe onboarding/dropoff friction
* fixes misleading or damaging school/deadline data behavior
* materially reduces support burden in the first week

## 10.3 v1.0.1 scope decision

| Decision                    | Owner | Notes |
| --------------------------- | ----- | ----- |
| Minimal hotfix only         |       |       |
| Focused hotfix + UX cleanup |       |       |
| Broader stabilization patch |       |       |

### Selected v1.0.1 items

| Item | Owner | Target Date |
| ---- | ----- | ----------- |
|      |       |             |
|      |       |             |
|      |       |             |

---

## 11. What is working well

Document what is clearly working well in production.

| Area | Evidence | Why It Matters |
| ---- | -------- | -------------- |
|      |          |                |
|      |          |                |
|      |          |                |

Examples:

* high onboarding completion
* strong snapshot engagement
* smooth upgrade flow
* good parent adoption
* low support burden in a module

This section matters because it prevents overreacting and breaking strong areas unnecessarily.

---

## 12. What needs monitoring, not immediate fixing

| Item | Why Monitor Instead of Fix Now | Owner | Review Date |
| ---- | ------------------------------ | ----- | ----------- |
|      |                                |       |             |
|      |                                |       |             |

Use this section to separate:

* genuine launch blockers
  from
* issues that simply need more data

---

## 13. Product and operational recommendations

## 13.1 Product recommendations

List product/UX changes recommended based on launch behavior.

| Recommendation | Priority | Owner | Notes |
| -------------- | -------- | ----- | ----- |
|                |          |       |       |
|                |          |       |       |

## 13.2 Operational recommendations

List operational/support/data recommendations recommended based on launch behavior.

| Recommendation | Priority | Owner | Notes |
| -------------- | -------- | ----- | ----- |
|                |          |       |       |
|                |          |       |       |

---

## 14. Final review summary

Complete this section last.

### Overall launch health

* Green
* Yellow
* Red

### Summary statement

Write a concise executive summary of the first 24–72 hours:

* overall health
* top wins
* top problems
* what happens next

### Required decisions

| Decision                               | Owner | Status | Notes |
| -------------------------------------- | ----- | ------ | ----- |
| Continue normal rollout                |       |        |       |
| Limit promotion until fixes land       |       |        |       |
| Ship v1.0.1 hotfix                     |       |        |       |
| Pause specific feature/module exposure |       |        |       |

---

## 15. Non-negotiables

1. Do not let anecdote override production evidence without reason.
2. Do not call the launch healthy if billing, permissions, or supportability are unstable.
3. Do not bury critical defects inside "monitoring" language.
4. Do not turn the first post-launch review into a vague retrospective; make explicit decisions.
5. Do not leave v1.0.1 undefined after identifying urgent issues.

---

## 16. Final directive

This review must result in decisions, not just observations.

By the end of the 24–72 hour review window, the team should know:

* whether launch is stable
* what the real user friction points are
* what the support burden looks like
* what gets fixed immediately in v1.0.1
* what can be monitored safely over time

---

## 17. Recommended next artifacts

Create next:

* `DEFERRED_DEFECTS_V1.md`
* `V1_0_1_HOTFIX_PLAN.md`
* `INCIDENT_RESPONSE_PLAYBOOK_V1.md`
* `WEEK_1_METRICS_REVIEW_V1.md`