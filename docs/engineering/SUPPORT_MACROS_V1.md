# SUPPORT_MACROS_V1

## The College Admissions Edge

## v1 Support Macros

## 1. Purpose

This document provides ready-to-use support macros for **The College Admissions Edge v1**.

These macros are designed to align with:

* current product behavior
* role and permission boundaries
* billing and entitlement rules
* known v1 limitations
* the brand standard of a calm, high-trust, premium support experience

These macros are templates, not scripts to send blindly.
Every message should be adjusted to match:

* verified facts
* the user’s actual account state
* the specific issue being reported
* the correct next step

---

## 2. Support principles

Before sending any macro:

1. **Verify the facts first.**
	Do not assume the issue, root cause, or account state.

2. **Do not promise unsupported behavior.**
	If v1 does not support something, say so clearly and respectfully.

3. **Do not claim resolution until it is confirmed.**
	“Under review” and “resolved” are not interchangeable.

4. **Escalate billing, privacy, permissions, and repeated failures quickly.**
	These are high-trust issues and should not linger in vague troubleshooting.

5. **Keep the tone calm, direct, and specific.**
	Avoid robotic phrasing, filler, or vague reassurance.

6. **Always give the user the next step.**
	Even if the issue is being escalated, the user should know what happens next.

---

## 3. Tone and style standard

Support for The College Admissions Edge should feel:

* calm
* polished
* human
* clear
* premium
* trustworthy

Support should not feel:

* defensive
* robotic
* overly casual
* corporate and empty
* salesy
* vague

### Preferred style

* short paragraphs
* plain language
* specific wording
* no jargon unless necessary
* no blame language

### Avoid phrases like

* “We apologize for any inconvenience”
* “Please be advised”
* “Kindly note”
* “It should be fixed now” unless verified
* “Try again later” without explanation

---

## 4. Macro usage rules

Use a macro only if:

* it matches the actual issue type
* it matches current product behavior
* it matches verified account state
* it does not overstate certainty

If a macro does not match verified reality, revise it before sending.

---

## 5. Universal macros

### M-001 — Initial acknowledgment

Thanks for reaching out. I can see why this is frustrating, and I’m here to help you work through it.

### M-002 — Clarification request

To make sure we’re solving the right issue, can you confirm where this happens: before login, after login, or once you’re already inside the app?

### M-003 — Escalation notice

Thanks for flagging this. Based on what you shared, this needs internal review rather than a quick settings fix. I’m escalating it now, and we’ll follow up with the next step once that review is complete.

### M-004 — Known limitation response

At the moment, v1 supports **{X}**, but it does not yet support **{Y}**. The supported workflow right now is **{Z}**.

### M-005 — Request for screenshot or exact reproduction step

To help us verify this accurately, please send a screenshot or the exact step where the issue occurs. That will help us separate a display issue from an account, access, or workflow issue.

### M-006 — Cannot verify yet

Thanks for the detail. We have not verified the root cause yet, so I don’t want to guess. We’re checking the relevant account and system state now.

---

## 6. Account and authentication macros

### M-101 — Login or access blocked

Thanks for reporting this. Please confirm whether the issue happens during sign-in, immediately after sign-in, or during password reset. If you can sign in but then land in the wrong place, that may point to a session or role issue rather than a password issue.

### M-102 — Password reset issue

Got it — thank you. Please try the reset flow once more and confirm two things: whether you receive the reset email, and whether the final reset step completes successfully. If either step fails, we’ll escalate for account-state review.

### M-103 — Unexpected redirect after login

Thanks for flagging this. If sign-in succeeds but you land in the wrong place, that usually points to a session, role, or routing issue. We’ll verify the account state and access path on our side.

### M-104 — Role or permission mismatch

What you’re describing may be a permissions mismatch rather than a login failure. We’re reviewing the account role and linked-access state before confirming the next step.

### M-105 — Account exists but flow is incomplete

Thanks for the detail. It looks like the account may exist, but the setup flow may not have completed cleanly. We’re reviewing whether the issue is in account creation, role assignment, or session state.

---

## 7. Billing and premium access macros

### M-201 — Paid but premium still locked

Thanks for reporting this. If payment completed but premium still appears locked, that usually points to a billing-state or entitlement-sync issue. We need to verify the subscription and entitlement status on our side before we confirm a fix.

### M-202 — Billing portal missing for non-owner

Billing controls are available to the billing owner account. If you’re linked to the student but are not the billing owner, the billing portal may not appear on your side.

### M-203 — Billing escalation

Thanks for flagging this. Because this involves payment and access alignment, we’re escalating it immediately for direct billing-state verification.

### M-204 — Avoiding premature billing promises

I want to be careful not to guess here. Until we verify the billing and entitlement records directly, I can’t confirm whether this is a payment issue, an access issue, or both.

### M-205 — Checkout did not complete

Thanks for reporting this. We first need to confirm whether checkout failed before payment completion or whether payment completed and the access state did not update afterward. Those are handled differently, so we want to verify the exact point of failure.

### M-206 — Billing owner boundary reminder

To protect account ownership and billing controls, some billing actions are only available to the account owner. If you’re linked to the student account but are not the billing owner, some billing controls may not appear for you.

---

## 8. Onboarding and snapshot macros

### M-301 — Onboarding not saving

Thanks for flagging this. If onboarding answers are not resuming correctly, that usually points to a save-state issue. We’ll check whether the latest session wrote fully, partially, or not at all.

### M-302 — Snapshot stuck or incomplete

Your snapshot should move from in progress to ready once generation finishes successfully. If it stays stuck or repeatedly fails, that needs internal review of the generation and persistence flow.

### M-303 — Snapshot delayed but not confirmed failed

We can see the snapshot has not completed as expected. We’re checking whether this is a temporary processing delay or a failed generation state before advising the next step.

### M-304 — Completed onboarding but no snapshot transition

Thanks for flagging this. If onboarding completed but the app did not move you into the snapshot flow correctly, we need to verify whether the onboarding state completed fully and whether the snapshot generation step was triggered afterward.

### M-305 — Onboarding step feels stuck

Thanks for reporting this. If a specific onboarding step is not advancing, we need to confirm whether the issue is with validation, save state, or the step transition itself. Please share the exact step where it stops so we can verify that path directly.

---

## 9. Writing module macros

### M-401 — Draft not saving

Thanks for reporting this. If the module opens but your latest draft changes do not persist, that suggests a save-state issue. We’ll review the write path and account state on our side.

### M-402 — Feedback or suggestions not generating

If your draft is present but feedback is not appearing, this is more likely a generation or response-state issue than an access issue. We’ll investigate that workflow directly.

### M-403 — Parent editing request not supported in v1

At the moment, supporting adults can view progress and deadlines, but writing workflows remain student-owned in v1. Parent editing inside the app is not currently supported.

### M-404 — Writing visible to wrong role concern

Thanks for flagging this. Access to writing content is role-sensitive, so we’re treating this as a permissions and privacy review rather than a normal display issue.

### M-405 — Story Vault unavailable

If Story Vault appears locked or unavailable, we first need to verify whether this is an access-state issue, a subscription-state issue, or a route-level problem. We’ll review the account and module access state before confirming the cause.

### M-406 — Essay feedback looks incomplete or weak

Thanks for flagging this. Feedback quality can vary depending on the draft content and generation outcome, so we first need to confirm whether the issue is with the generation result itself or whether the draft context provided too little signal for strong feedback.

### M-407 — Supplement guidance not matching school context

Thanks for reporting this. Supplement guidance should be tied to the selected school and prompt context. We’ll review whether the supplement record, school association, and guidance flow are aligned correctly.

---

## 10. Supporting-adult macros

### M-501 — Link required for visibility

To view student progress in the app, the account must be linked first. If linking did not complete successfully, the dashboard may remain empty or incomplete.

### M-502 — Privacy boundary reminder

For privacy reasons, supporting-adult access in v1 is summary-based. It does not include raw student writing or Story Vault entries.

### M-503 — Empty dashboard after linking attempt

Thanks for flagging this. If the dashboard is still empty after a linking attempt, we need to verify whether the link completed successfully and whether the correct role relationship was created.

### M-504 — Supporting-adult cannot see progress

Thanks for reporting this. We first need to confirm whether the account is linked correctly and whether the supporting-adult access state is active for that account. If either part is incomplete, the dashboard may not populate as expected.

### M-505 — Supporting-adult sees too much or too little

Thanks for flagging this. Supporting-adult access in v1 is intentionally limited to summary visibility, so we need to verify whether this is an expected boundary, a missing link-state issue, or a permissions mismatch.

---

## 11. School, deadline, and notification macros

### M-601 — Deadline data clarification

School and deadline data is structured in the app, but some records may still be partial or require source verification. If a specific date looks incorrect, we’ll review that institution and cycle directly.

### M-602 — Missing reminder email

If a reminder was expected but not received, the cause may relate to preference settings, eligibility timing, or delivery state. We’ll verify each of those paths before confirming what happened.

### M-603 — Duplicate reminders

Thanks for flagging this. Duplicate reminders are treated urgently because they can create confusion and reduce trust. We’re escalating this now to review reminder logic and deduplication behavior.

### M-604 — Notification expectation mismatch

Thanks for reporting this. We first need to confirm whether the reminder was eligible to send under the current notification rules, then whether delivery completed as expected.

### M-605 — School missing from planner

Thanks for flagging this. We’ll verify whether this is a search issue, a data-coverage issue, or a naming mismatch in the institution record. If it is missing from the current dataset, we’ll note that directly rather than guessing.

### M-606 — Specific school date appears incorrect

Thanks for reporting this. We’ll review that school and admissions cycle directly rather than guessing from the general planner behavior. If the record needs correction or source re-verification, we’ll treat it as a data-review issue.

### M-607 — Broken reminder link

Thanks for flagging this. Reminder links should return you to the correct context in the app, so we’re treating this as a notification-path issue rather than a normal navigation question.

---

## 12. Resolution and follow-up macros

### M-701 — Verified resolution

Thanks for your patience. We’ve verified that this issue is now resolved on our side. Please refresh and try again. If anything still looks off, reply here and we’ll continue right away.

### M-702 — Still under review

Thanks for your patience. This is still under active review, and I don’t want to overpromise before verification is complete. We’ll send the next update by **{time/date}**.

### M-703 — Partial improvement, not full confirmation

We’ve made progress on this, but I don’t want to call it fully resolved until the final behavior is verified. Please try the affected step again, and we’ll confirm from there.

### M-704 — Workaround provided, full fix pending

We do have a supported workaround for now: **{workaround}**. We’re still reviewing the underlying issue, so I don’t want to describe the root issue as fully resolved yet.

### M-705 — Issue reproduced and escalated

Thanks for your patience. We were able to reproduce the issue, so it has been escalated with verified detail rather than remaining a generic report. The next update will be tied to that internal review.

---

## 13. Internal escalation handoff template

Use the following format for internal escalation. Do **not** send this block directly to users.

**Issue type:**
**User impact:**
**What the user reported:**
**What support verified:**
**What has not been verified:**
**Severity / urgency:**
**Environment / account details:**
**Relevant timestamps:**
**Screenshots or reproduction details:**
**Needed from engineering / ops / product:**
**Recommended user-facing next step:**

---

## 14. Agent guardrails

Before sending any macro, confirm:

* Is every factual claim verified?
* Does the message reflect actual v1 behavior?
* Have unsupported features been avoided?
* Is the user told what happens next?
* Does the message sound calm, human, and specific?

If the answer to any of these is no, revise before sending.

---

## 15. Final rule

If a macro conflicts with current product behavior, permissions, policy, or verified account state, do not send it unchanged. Update it first so it matches reality.

The purpose of these macros is not to sound polished at all costs. The purpose is to protect trust, reduce confusion, and move the user toward the correct next step.

---

## 16. Recommended next artifacts

Create next:

* `V1_0_1_RELEASE_NOTES.md`
* `WEEK_1_METRICS_REVIEW_V1.md`
* `POSTMORTEM_TEMPLATE_V1.md`
* `SUPPORT_PLAYBOOK_V1.md`
