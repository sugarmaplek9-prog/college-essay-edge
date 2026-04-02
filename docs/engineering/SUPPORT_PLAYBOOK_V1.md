# SUPPORT_PLAYBOOK_V1

## The College Admissions Edge

## v1 Support Operations Playbook

## 1. Purpose

This document defines how support operates for v1 of **The College Admissions Edge**.

It exists to make support:

* consistent
* trustworthy
* fast enough to be useful
* disciplined enough to protect privacy, billing, and permissions boundaries
* aligned with actual product behavior

This playbook is the operating layer above:

* `SUPPORT_RESPONSE_GUIDELINES_V1.md`
* `SUPPORT_MACROS_V1.md`
* `KNOWN_LIMITATIONS_V1.md`
* `INCIDENT_RESPONSE_PLAYBOOK_V1.md`

This document answers five practical questions:

* how support classifies incoming issues
* what support handles directly vs escalates
* how support responds without overpromising
* how support protects billing, privacy, and student-authorship boundaries
* how support measures whether support is functioning well

---

## 2. Scope

This playbook applies to support interactions involving:

* account access
* onboarding and snapshot issues
* billing and premium access questions
* Story Vault, essay, and supplement workflow questions
* supporting-adult linking and visibility
* school and deadline data questions
* email/reminder issues
* admin/support escalation handoff

This playbook does **not** replace:

* engineering debugging procedures
* incident response command structure for major incidents
* legal/privacy policy documents
* future human-advising workflows not in v1

---

## 3. Support mission

Support for The College Admissions Edge should do three things well:

1. **Protect trust**
   Users should get clear, honest answers.

2. **Move issues forward**
   Support should either resolve, clarify, or escalate — not stall.

3. **Protect the product model**
   Support should reinforce student authorship, correct permissions, and real v1 capabilities.

---

## 4. Support principles

### 4.1 Tell the truth

Never state something as fact unless it is verified.
Never claim a fix exists until it has been confirmed.
Never imply unsupported behavior is available.

### 4.2 Be calm and specific

Support should reduce anxiety, not add confusion.
The user should know what is happening and what happens next.

### 4.3 Respect the student-first model

The student is the owner of student-authored writing in v1.
Support must not blur this boundary.

### 4.4 Escalate trust-sensitive issues quickly

Billing, privacy, permissions, and data exposure issues should move fast.
These are not “wait and see” cases.

### 4.5 Separate what is broken from what is limited

A known limitation is not a defect.
A real defect should not be disguised as a limitation.

---

## 5. Support operating model

## 5.1 Support workflow

Every support issue should move through this sequence:

1. **Intake**
2. **Classification**
3. **Verification**
4. **Response**
5. **Escalation if needed**
6. **Follow-up**
7. **Closure or transfer to tracked defect/incident**

### Rule

No issue should remain in an ambiguous “someone is probably looking at it” state.

---

## 5.2 Support objectives by stage

### Intake

Capture what the user says clearly.

### Classification

Identify issue type and trust level.

### Verification

Determine what is known vs unknown.

### Response

Send a clear user-facing message with next step.

### Escalation

Route to the correct owner when support should not answer alone.

### Follow-up

Update the user when there is a meaningful new fact.

### Closure

Close only when:

* issue is resolved,
* user is correctly routed,
* or the issue is explicitly transferred into tracked internal work.

---

## 6. Support issue categories

Every issue should be assigned a category.

| Category                                | Description                                                        |
| --------------------------------------- | ------------------------------------------------------------------ |
| Auth / access                           | signup, login, password reset, redirects, role mismatch            |
| Billing / premium access                | checkout, paid-but-locked, billing portal, entitlement mismatch    |
| Onboarding                              | save/resume, step issues, completion issues                        |
| Snapshot                                | generation, readiness, output availability                         |
| Writing modules                         | Story Vault, essay, supplement save/generation/access issues       |
| Supporting-adult linking                | invites, linking, dashboard emptiness, summary visibility          |
| School / deadline data                  | school search, missing schools, wrong dates, partial data          |
| Notifications / reminders               | missing email, duplicate reminders, broken links                   |
| Admin / support diagnostics             | issue cannot be verified or diagnosed with current support tooling |
| Known limitation / expectation mismatch | user expects unsupported behavior                                  |

### Rule

Every support issue should have one primary category, even if multiple systems are involved.

---

## 7. Support severity model

Use this severity model for normal support operations.

## S1 — Trust-critical

Examples:

* privacy or permissions concern
* payment completed but premium access failed
* wrong user sees protected content
* likely raw student writing exposure

### Required action

* escalate immediately
* do not improvise
* treat as high priority

---

## S2 — Workflow-blocking

Examples:

* cannot sign in
* onboarding cannot proceed
* snapshot repeatedly fails
* paid user cannot access paid module
* parent link flow broken

### Required action

* investigate quickly
* escalate if not immediately explainable
* follow up clearly

---

## S3 — Friction / degraded experience

Examples:

* reminder missing
* dashboard state confusing
* feedback feels incomplete
* one module behaving inconsistently without total block

### Required action

* clarify, verify, or route
* may become escalation if repeated or systemic

---

## S4 — Low-severity / informational

Examples:

* known limitation question
* product expectation mismatch
* low-impact UI confusion

### Required action

* clarify supported behavior
* route user to correct workflow

---

## 8. Triage rules

## 8.1 What support can usually handle directly

Support can usually respond directly when the issue is:

* a known limitation
* a workflow clarification
* a billing-owner boundary explanation
* a supporting-adult visibility boundary explanation
* a school/deadline confidence explanation for a single record
* a request for clarification before escalation

## 8.2 What support should escalate quickly

Escalate quickly when the issue involves:

* payment/access mismatch
* privacy or permissions concern
* repeated onboarding save failures
* repeated snapshot generation failures
* draft data loss suspicion
* supporting-adult linking failure with verified account pair
* widespread deadline/data trust issue
* duplicate reminders
* broken reminder links
* anything support cannot verify with confidence

## 8.3 What support should treat as incident candidates

Potential incident candidates include:

* many users reporting the same auth issue
* broad snapshot failure pattern
* widespread premium unlock failures
* privacy leak or wrong-role content exposure
* large-scale reminder duplication or delivery failure

These should be routed into the incident process, not kept as isolated tickets.

---

## 9. Intake standard

For every new issue, support should capture:

* issue type
* what the user reported
* where in the product it happens
* whether it is reproducible
* account/role context if relevant
* whether it affects billing, permissions, deadlines, or notifications
* whether a screenshot or exact step is available

### Minimum intake questions

When needed, ask:

* Does this happen before login, after login, or inside the app?
* Which page or step is affected?
* What did you expect to happen?
* What happened instead?
* Did this happen once or repeatedly?

### Rule

Do not ask for unnecessary detail if the issue is already clearly escalation-worthy.

---

## 10. Verification rules

Support should separate:

* **what the user reported**
* **what support verified**
* **what remains unknown**

### Example

* User reported: payment completed but premium is still locked
* Verified: account exists, user is on correct role, premium route still gated
* Unknown: whether Stripe state and subscription sync are aligned

### Rule

Support must not collapse these into one statement.

---

## 11. Response standards

All support responses should include:

* acknowledgment
* current verified understanding
* next step
* escalation notice if applicable

### Good structure

“Thanks for reaching out. Based on what you described, this looks like **{issue type}**. We’ve confirmed **{known fact}** and still need to verify **{unknown}**. The next step is **{action}**.”

### Bad structure

“Sorry about that. It should be fixed soon.”

---

## 12. Macro selection rules

Use macros from `SUPPORT_MACROS_V1.md`, but apply them intentionally.

### Macro selection process

1. classify the issue
2. determine severity
3. confirm whether issue is known, verified, or still uncertain
4. choose macro that matches both issue type and certainty level
5. customize with verified facts and next step

### Rule

Never send a macro unchanged if:

* account state differs
* permissions context differs
* the issue is more severe than the macro assumes
* the macro would imply unsupported behavior

---

## 13. Escalation decision tree

## 13.1 Billing / entitlement

If payment and premium access do not align:

* treat as S1
* escalate immediately
* do not speculate whether payment succeeded or failed unless verified

## 13.2 Privacy / permissions

If a user may be seeing content they should not see:

* treat as S1
* escalate immediately
* do not ask the user to keep testing deeper access

## 13.3 Onboarding / snapshot

If a user cannot proceed or snapshot repeatedly fails:

* treat as S2
* gather exact step
* escalate if repeated or not immediately explainable

## 13.4 Writing modules

If data loss is suspected:

* treat as S2, potentially S1 if broad
* escalate quickly
* do not tell user to rewrite content from scratch unless absolutely necessary

## 13.5 Supporting-adult linking

If the issue is simple incomplete linking:

* support may clarify next step
  If the issue is broken linking or wrong visibility:
* escalate

## 13.6 School/deadline data

If one record appears wrong:

* support may acknowledge partial-data possibility and route for review
  If a pattern suggests systemic data problem:
* escalate to data/admin path

## 13.7 Notification/reminder issues

If reminder missing once:

* verify preferences/eligibility/delivery
  If reminder duplicate or broken at scale:
* escalate immediately

---

## 14. Support boundaries by issue type

## 14.1 What support must never promise

Support must never promise:

* ghostwriting
* parent editing inside app
* direct Common App synchronization
* perfect real-time deadline accuracy for every school
* guaranteed admissions outcomes
* unlimited human counseling in v1
* resolution timing that has not been confirmed

## 14.2 What support may explain clearly

Support may explain:

* supporting-adult visibility is summary-based
* school/deadline data may be partial or require source verification
* billing controls belong to the billing owner
* AI outputs are guided product features, not infallible judgments
* some generation flows can fail and may require retry or review

---

## 15. Internal handoff standard

When escalating, support must include a clean internal handoff.

Required format:

**Issue type:**
**Severity:**
**User impact:**
**What the user reported:**
**What support verified:**
**What remains unverified:**
**Account / role context:**
**Relevant timestamps:**
**Screenshots or reproduction detail:**
**Needed from engineering / ops / product:**
**Recommended user-facing next step:**

### Rule

If the handoff is vague, the issue slows down and trust erodes.

---

## 16. Response-time guidance

These are operating targets, not promises to users.

| Severity | First response target               | Escalation target                    | Follow-up expectation        |
| -------- | ----------------------------------- | ------------------------------------ | ---------------------------- |
| S1       | As fast as possible                 | Immediate                            | Frequent until stabilized    |
| S2       | Fast                                | Same day / immediate if reproducible | Clear next update window     |
| S3       | Reasonable business response window | As needed                            | Follow-up if unresolved      |
| S4       | Standard response window            | Usually not needed                   | Close with clear explanation |

### Rule

Do not give user-facing timing commitments unless the team can actually meet them.

---

## 17. Follow-up rules

Support should follow up when:

* issue was escalated
* a new verified fact exists
* user was asked to retry after a change
* issue is still open and next update was promised

Support should not send filler follow-ups that contain no new information.

### Good follow-up

“Thanks for your patience. We’ve now verified that the billing record and entitlement state were out of sync, and the team is correcting that path. We’ll send the next update once the access state is verified.”

### Bad follow-up

“Just checking in.”

---

## 18. Closure rules

A support issue may be closed when:

* the user confirms the issue is resolved
* support verifies the issue is resolved and the user has been asked to retry
* the issue has been correctly reclassified as a known limitation and the user has been given the supported workflow
* the issue has been fully transferred to tracked internal work with appropriate user communication

### Do not close if

* the issue is merely quieter
* no one verified the outcome
* the user is waiting on promised follow-up

---

## 19. Support QA checklist

Before sending any response, check:

* Is the tone calm and human?
* Is every factual claim verified?
* Did I avoid unsupported promises?
* Did I respect privacy and billing boundaries?
* Did I tell the user what happens next?
* If escalation is needed, is that explicit?
* If the issue is a known limitation, did I say so clearly?

---

## 20. Metrics for support health

Support should track at minimum:

* issue count by category
* issue count by severity
* billing/access issue volume
* permissions/privacy issue volume
* repeated onboarding/snapshot issue volume
* reminder/email issue volume
* average time to first response
* average time to escalation for S1/S2 issues
* top repeated support themes

### Rule

Repeated issues are product signals, not just support workload.

---

## 21. Review cadence

This playbook should be reviewed:

* before launch
* after the first week of live support volume
* after any major hotfix affecting support patterns
* after any incident involving trust, billing, or permissions

---

## 22. Non-negotiables

1. Support must not overpromise beyond verified product reality.
2. Support must escalate privacy, billing, and permissions issues quickly.
3. Support must preserve the student-first authorship model.
4. Support must distinguish clearly between known limitations and real defects.
5. Support must never leave the user without a next step.

---

## 23. Final directive

This playbook is the operating standard for support in v1.

A good support function does not just answer messages. It protects trust, protects boundaries, and helps the product improve by classifying reality accurately.

When in doubt:

* verify first
* say less, but say it clearly
* escalate when trust is at stake

---

## 24. Recommended next artifacts

Create next:

* `WEEK_1_METRICS_REVIEW_V1.md`
* `POSTMORTEM_TEMPLATE_V1.md`
* `V1_0_1_RELEASE_NOTES.md`
* `CUSTOMER_FAQ_V1.md`
