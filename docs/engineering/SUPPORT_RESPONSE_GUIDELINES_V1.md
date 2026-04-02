# SUPPORT_RESPONSE_GUIDELINES_V1

## The College Admissions Edge

## v1 Support Tone, Boundaries, and Response Standards

## 1. Purpose

This document defines the official support response standards for v1.

It exists to ensure that every support interaction is:

* accurate
* calm
* helpful
* consistent
* aligned with product reality
* aligned with permissions and privacy boundaries

This document should be used by anyone responding to users about:

* account issues
* onboarding problems
* snapshot questions
* billing and access issues
* supporting-adult linking
* school/deadline data questions
* reminders and emails
* feature expectations and limitations

This is not a technical troubleshooting manual.
It is the behavioral and communication standard for support.

---

## 2. Core support principles

### 2.1 Tell the truth

Never tell a user something is supported if it is not.
Never imply a fix has happened if it has not.
Never guess when certainty matters.

### 2.2 Be calm and specific

Support should be reassuring without being vague.
Do not use defensive language.
Do not use corporate filler.

### 2.3 Protect trust first

If billing, permissions, or privacy are involved, support must be especially careful, factual, and prompt.

### 2.4 Respect boundaries

Support must not promise actions that violate the student-first model, permissions rules, or known product limitations.

### 2.5 Route correctly

Not every issue should be “solved” in the support message itself.
Some issues need escalation, diagnosis, or engineering review.

---

## 3. Support tone standard

Support tone should be:

* clear
* respectful
* direct
* calm
* warm but not gushy
* confident but not overpromising

Support tone should not be:

* robotic
* defensive
* overly casual
* vague
* salesy
* patronizing

### Good tone example

“Thanks for flagging this. I can see why that would be frustrating. Here’s what’s happening and what to do next.”

### Bad tone example

“We apologize for any inconvenience this may have caused and appreciate your patience while we investigate this matter.”

---

## 4. General support response structure

Most support replies should follow this structure:

1. **Acknowledge the issue clearly**
2. **State what is known**
3. **State what the user can do now**
4. **State what support is doing next, if applicable**
5. **Avoid promises unless confirmed**

### Standard pattern

* acknowledgment
* explanation
* next step
* escalation if needed

### Example

“Thanks for reaching out. It looks like your account is still on the free plan, which is why Story Vault is locked. The next step is to check whether your payment completed successfully in the billing flow. If it did and the feature still looks locked, we’ll need to review the billing state on our side.”

---

## 5. Non-negotiable support rules

1. Do not promise features that v1 does not support.
2. Do not promise parents/supporting adults they can edit student writing in the app.
3. Do not state that school/deadline data is always perfect or live-synced.
4. Do not promise guaranteed admissions results.
5. Do not claim a billing issue is fixed until it is verified.
6. Do not speculate about root cause when the cause is not confirmed.
7. Do not reveal internal-only system details, secrets, or raw provider metadata.
8. Do not share one user’s information with another linked user beyond allowed visibility.

---

## 6. Privacy and permissions guidance

## 6.1 Student content boundaries

Support must understand and reinforce:

* supporting adults do not edit student writing in v1
* supporting adults do not view raw student Story Vault content in v1
* supporting adults receive summary-based visibility only

### Approved phrasing

“Right now, the supporting-adult experience is designed around progress and deadline visibility rather than direct writing access.”

### Not approved

“Parents should be able to see everything eventually, so we can probably enable that.”

---

## 6.2 Linked-account boundaries

Support must not disclose student details to an unlinked adult.
Support must not assume family relationship without system-confirmed link state.

### Approved phrasing

“To view that student’s progress in the app, the account needs to be explicitly linked first.”

---

## 6.3 Billing ownership boundaries

Only the billing owner should be directed to billing-control actions.
A linked non-owner should not be told they can access the billing portal if they cannot.

### Approved phrasing

“Billing controls are available to the account owner. If you’re linked to the student but not the billing owner, the portal may not appear on your side.”

---

## 7. Known limitation response guidance

When a user asks for something v1 does not support:

### Required response pattern

1. state the current behavior honestly
2. explain the supported workflow if one exists
3. do not imply hidden functionality

### Example — no Common App sync

“Right now, v1 does not sync directly with a Common App account. The school planner is an internal planning tool, so application details need to be managed within the app rather than pulled automatically from an outside admissions portal.”

### Example — no parent draft editing

“Right now, supporting adults can track progress and deadlines, but the writing workflows remain student-owned in the app.”

---

## 8. Issue-type response guidance

## 8.1 Auth and account access issues

### Typical issues

* cannot sign up
* cannot log in
* password reset not working
* account stuck after role selection

### Support goals

* clarify where the user is blocked
* determine whether issue is user input, auth flow, or app state
* avoid exposing internal auth details unnecessarily

### Good response pattern

“Thanks for flagging this. To help narrow it down, please confirm whether the issue happens at sign-in, after sign-in, or when trying to reset the password. If you’re able to get into the account but then get redirected incorrectly, that may be a role or session-state issue rather than a password issue.”

### Escalate when

* user cannot authenticate at all after normal checks
* issue appears broad or repeated across multiple users
* role/session state appears corrupted

---

## 8.2 Billing and premium access issues

### Typical issues

* paid but still locked
* checkout failed
* billing portal missing
* wrong user sees/does not see billing controls

### Support goals

* confirm whether payment completed
* separate checkout issue from entitlement issue
* avoid guessing whether the payment succeeded unless verified

### Good response pattern

“Thanks for reaching out. If your payment completed but premium access still looks locked, that usually points to a billing-state or entitlement-sync issue rather than the product module itself. The next step is for us to verify the subscription state tied to the account.”

### Escalate immediately when

* payment was charged but unlock failed
* wrong user appears to have premium access
* billing owner/non-owner visibility is incorrect in a way that affects account control

---

## 8.3 Onboarding issues

### Typical issues

* onboarding answers not saving
* stuck on a step
* returned to wrong step
* completed onboarding but did not reach snapshot

### Support goals

* determine whether it is save-state, session-state, or snapshot-state issue
* avoid telling user to re-enter everything unless necessary

### Good response pattern

“Thanks for flagging that. If your onboarding answers are not resuming correctly, that may mean the save state did not persist as expected. We’ll want to check whether the session completed partially, fully, or failed to write the latest step.”

### Escalate when

* repeated save/resume failures
* multiple users report same issue
* onboarding completion does not transition correctly

---

## 8.4 Snapshot issues

### Typical issues

* snapshot never appears
* snapshot generation fails
* snapshot looks incomplete

### Support goals

* distinguish loading delay from actual generation failure
* avoid describing AI as infallible

### Good response pattern

“Your snapshot should move from in-progress to ready once generation completes successfully. If it remains stuck or fails repeatedly, that needs review on our side because the issue is likely in the generation or persistence step, not in your account actions.”

### Escalate when

* repeated generation failure
* malformed or empty output
* broad snapshot degradation across users

---

## 8.5 Story Vault, essay, and supplement issues

### Typical issues

* cannot access paid module
* drafts not saving
* feedback or suggestions not generating
* overlap warnings confusing

### Support goals

* determine whether issue is access, save state, or AI generation
* avoid promising instantaneous AI results

### Good response pattern

“If the workspace opens but your latest changes do not persist, that points to a save-state issue. If the draft is present but the feedback never appears, that points to a generation or response-state issue instead.”

### Escalate when

* draft data loss suspected
* paid module inaccessible for entitled user
* repeated AI generation failures in one module

---

## 8.6 Supporting-adult linking issues

### Typical issues

* invite never received
* account not linking correctly
* dashboard empty after linking
* can see too much or too little

### Support goals

* confirm whether invite exists
* confirm whether accounts are actually linked
* respect privacy boundaries

### Good response pattern

“It looks like the supporting-adult experience depends on a completed account link. If that link did not complete correctly, the dashboard may stay empty even if the account was created successfully.”

### Escalate when

* link appears completed but no visibility exists
* unlinked adult sees student data
* linked adult sees raw student writing

---

## 8.7 School and deadline data questions

### Typical issues

* school missing
* deadline missing
* deadline seems wrong
* school status confusion

### Support goals

* acknowledge confidence limits honestly
* avoid claiming all data is live-synced or perfectly verified

### Good response pattern

“School and deadline data are structured inside the app, but some records may be partial or require confirmation against the school source. If you’re seeing a date that looks incorrect, we should review the specific institution and admissions cycle rather than assume the whole planner is wrong.”

### Escalate when

* a high-priority school has incorrect data
* multiple schools show incorrect cycle dates
* admin correction path is needed

---

## 8.8 Notifications and reminder issues

### Typical issues

* email not received
* duplicate reminders
* wrong reminder timing
* broken reminder link

### Support goals

* distinguish provider delivery issue from eligibility/preference issue
* treat duplicate reminders seriously

### Good response pattern

“If you expected a reminder and did not receive one, the issue may be eligibility timing, preferences, or email delivery rather than the core workflow itself. If you received duplicates, that is more likely a reminder logic or deduplication problem and we should treat it directly.”

### Escalate immediately when

* duplicate reminder pattern appears
* broken reminder links send users to wrong place
* many users fail to receive important reminder emails

---

## 9. Escalation rules for support

Support should escalate rather than improvise when the issue involves:

* billing/unlock mismatch
* permission or privacy concerns
* data exposure risk
* repeated onboarding or save-state failures
* repeated snapshot/generation failures
* wrong deadline data for important schools
* duplicate reminder sends
* admin/support visibility gaps that block diagnosis

### Escalation template

**Issue type:**
**User impact:**
**What user reported:**
**What support verified:**
**Severity guess:**
**Needed from engineering/ops/product:**

---

## 10. Support response templates

## 10.1 Acknowledgment template

“Thanks for reaching out. I can see why that would be frustrating.”

## 10.2 Clarification template

“To make sure we’re looking at the right issue, can you confirm whether this happens before login, after login, or once you’re already inside the app?”

## 10.3 Known limitation template

“Right now, v1 supports X, but it does not currently support Y. The current supported workflow is Z.”

## 10.4 Escalation template

“Thanks for flagging this. Based on what you described, this looks like something that needs internal review rather than a quick settings fix. We’re escalating it for a closer look.”

## 10.5 Billing caution template

“If payment completed but access did not update correctly, we need to verify the billing and entitlement state directly before we can confirm resolution.”

## 10.6 Privacy boundary template

“For privacy reasons, that view is limited unless the account is explicitly linked and the product surface supports that level of access.”

---

## 11. Language to avoid

Avoid phrases like:

* “It should be fine now” unless verified
* “That feature exists somewhere” when uncertain
* “The AI probably got confused” as a hand-wave
* “We guarantee…” unless truly guaranteed
* “Parents can just go in and edit it”
* “All deadlines are always current”
* “Try again later” without context or next step

Better alternatives:

* “Here’s what we know right now…”
* “This appears to be…”
* “The next step is…”
* “That is not part of the current v1 behavior…”
* “We need to verify that directly…”

---

## 12. When support should not answer alone

Support should stop and escalate when:

* a user reports another user’s data appearing in their account
* a user was charged but cannot access premium features
* a user claims a parent can see writing they should not see
* a user claims reminders are being sent repeatedly
* a school/deadline issue appears systemic rather than isolated
* support lacks enough system visibility to verify the claim

### Rule

Uncertainty in a high-trust area is a reason to escalate, not improvise.

---

## 13. Internal consistency rules

Support responses must stay aligned with:

* `KNOWN_LIMITATIONS_V1.md`
* permissions matrix
* release and post-launch documents
* hotfix plan and deferred defects where relevant

If one internal document says a behavior is limited, support must not contradict it.

---

## 14. Review cadence

This document should be reviewed:

* before launch
* after the first week of support volume
* after any major hotfix affecting user-facing behavior
* when support patterns show repeated confusion or expectation mismatch

---

## 15. Non-negotiables

1. Support must not overpromise.
2. Support must not guess in billing, privacy, or permissions cases.
3. Support must not blur the student-first authorship boundary.
4. Support must explain known limitations honestly.
5. Support must escalate high-trust issues quickly and clearly.

---

## 16. Final directive

This document is the tone-and-truth standard for support.

A good support response should leave the user with:

* a clear understanding of what is happening
* a realistic expectation of what the product does
* a concrete next step
* confidence that the issue is being handled appropriately

That is more important than sounding polished or trying to appear instantly certain.

---

## 17. Recommended next artifacts

Create next:

* `V1_0_1_RELEASE_NOTES.md`
* `WEEK_1_METRICS_REVIEW_V1.md`
* `POSTMORTEM_TEMPLATE_V1.md`
* `SUPPORT_MACROS_V1.md`
