# INCIDENT_RESPONSE_PLAYBOOK_V1

## The College Admissions Edge

## Production Incident Response Playbook

## 1. Purpose

This document defines the official incident response framework for v1 of The College Admissions Edge.

It exists to answer six questions during a production problem:

* What counts as an incident?
* How severe is it?
* Who owns the response?
* What happens first?
* How do we contain, recover, and communicate?
* What must happen after the incident is over?

This is not a general support guide.
This is not a vague escalation note.
This is the operational playbook for responding to real production incidents.

It must be used for:

* live user-impacting production issues
* major provider failures
* permission or data exposure issues
* billing/unlock failures
* notification/reminder failures with meaningful user impact
* system instability requiring coordinated response

---

## 2. Incident response principles

1. Protect users first.
2. Contain before optimizing.
3. Facts before assumptions.
4. One incident commander at a time.
5. Use explicit severity, not emotional language.
6. Log actions and times as they happen.
7. If trust, privacy, or billing is involved, escalate immediately.

---

## 3. What counts as an incident

An incident is any production issue that materially affects:

* availability
* authentication/access
* billing or entitlement correctness
* privacy or data visibility
* core user workflows
* deadline/data trust
* notifications/reminders at meaningful scale
* admin/support operational visibility

Examples:

* signup/login stops working
* payments succeed but premium access does not unlock
* supporting adults can see raw student writing
* deadlines display corrupted or misleading data broadly
* reminder jobs spam users
* app is up, but a major route crashes for most users

Not every support ticket is an incident.
If a problem is isolated, low-severity, and non-systemic, it may remain a support issue rather than an incident.

---

## 4. Severity framework

Use these severity levels only.

## SEV-1 — Critical incident

A production issue with severe user, trust, revenue, or privacy impact.

Examples:

* auth failure affecting many users
* permission leak / data exposure
* payment or entitlement corruption affecting active users
* broad outage or core app unusable
* large-scale notification spam event

### Required response

* immediate incident declaration
* incident commander assigned immediately
* all relevant owners engaged immediately
* containment begins immediately
* rollback considered immediately

---

## SEV-2 — High incident

A serious production issue affecting an important workflow, but not full system trust collapse.

Examples:

* onboarding broken for a meaningful subset of users
* snapshot generation broadly failing
* parent linking broken for many users
* deadline reminder failures with meaningful user impact
* major admin/support visibility failure during active support load

### Required response

* incident declaration
* incident commander assigned
* time-boxed containment and recovery effort
* clear owner for mitigation

---

## SEV-3 — Moderate incident

A real production issue with noticeable impact, but not requiring full emergency response.

Examples:

* high-friction bug in one premium module
* isolated deadline data rendering problem
* low-volume billing edge case with workaround
* repeated but non-critical notification failure

### Required response

* owner assigned
* issue tracked explicitly
* decide whether incident response or hotfix path is more appropriate

---

## SEV-4 — Low incident / operational issue

A minor production problem or operational irregularity that does not materially harm trust or core product use.

Examples:

* small admin UX issue
* low-severity analytics inconsistency
* minor copy bug with no functional risk

### Required response

* track and route to support / deferred defect / next patch
* no war-room response required

---

## 5. Incident roles

Assign these roles for any SEV-1 or SEV-2 incident.

| Role                 | Primary Owner | Backup | Responsibility                                         |
| -------------------- | ------------- | ------ | ------------------------------------------------------ |
| Incident Commander   |               |        | Owns response coordination and decision flow           |
| Engineering Lead     |               |        | Owns technical diagnosis and fix path                  |
| Ops / Infra Owner    |               |        | Owns deploy, provider, runtime, and monitoring health  |
| Product Owner        |               |        | Owns user-impact judgment and product tradeoffs        |
| Support Owner        |               |        | Owns user-facing support coordination                  |
| Billing Owner        |               |        | Owns Stripe/billing incidents when relevant            |
| Data Owner           |               |        | Owns institution/deadline data incidents when relevant |
| Communications Owner |               |        | Owns internal/external status messaging when needed    |

### Rule

Only one Incident Commander at a time.

---

## 6. Incident lifecycle

Every incident must pass through these stages:

1. **Detection**
2. **Classification**
3. **Declaration**
4. **Containment**
5. **Diagnosis**
6. **Mitigation / Recovery**
7. **Validation**
8. **Resolution**
9. **Post-incident review**

---

## 7. First 15 minutes procedure

Use this for any SEV-1 or SEV-2 incident.

### Step 1 — Confirm this is real

**Owner:** First responder

* gather the first concrete signal
* verify whether issue reproduces
* identify likely affected surface

### Step 2 — Assign provisional severity

**Owner:** First responder + nearest lead

* classify as SEV-1 / SEV-2 / SEV-3 / SEV-4
* if unsure, bias toward higher severity until clarified

### Step 3 — Declare incident

**Owner:** Incident Commander or first acting lead

* open incident in official channel
* state severity, affected area, current known impact

### Step 4 — Assign command roles

**Owner:** Incident Commander

* assign engineering lead
* assign ops owner if needed
* assign billing/data/support owners if relevant

### Step 5 — Stop risky parallel changes

**Owner:** Incident Commander

* freeze unrelated deploys/merges if incident scope warrants it

### Step 6 — Begin containment

**Owner:** Engineering/Ops lead

* disable, gate, or isolate failing surface if needed
* do not wait for perfect root cause before containing user harm

### Step 7 — Start action log

**Owner:** Incident scribe or commander

* record timestamped actions, decisions, observations

---

## 8. Containment rules

Containment comes before elegance.

Examples of acceptable containment actions:

* disable a broken route/module temporarily
* gate a premium surface if entitlement behavior is wrong
* pause reminder jobs if duplicate sends are happening
* hide or freeze a deadline data view if corruption is suspected
* disable supporting-adult access if privacy boundary is unclear
* rollback a deploy if trust/revenue path is broken

### Rule

A degraded but safe product is better than a live broken product.

---

## 9. Response playbooks by incident type

## 9.1 Auth / access incident

### Examples

* signup broken
* login broken
* role mismatch loops
* protected routes accessible incorrectly

### Immediate actions

* verify auth provider health
* verify callback/config changes
* test with known accounts
* determine whether issue is broad or role-specific
* contain by disabling problematic route flows if needed

### Escalate immediately if

* most users cannot authenticate
* wrong users can access protected data

---

## 9.2 Permission / privacy incident

### Examples

* supporting adult can view raw student writing
* student can access another student’s records
* admin-only route visible to non-admin users

### Immediate actions

* treat as SEV-1 unless clearly limited and contained
* stop affected route or feature immediately if needed
* verify route protection, API protection, and RLS behavior
* preserve evidence and exact reproduction path
* notify product/engineering leadership immediately

### Rule

Any credible privacy or permission leak is urgent.

---

## 9.3 Billing / entitlement incident

### Examples

* checkout fails broadly
* payment succeeds but premium access does not unlock
* free user receives premium access incorrectly
* billing portal exposed incorrectly

### Immediate actions

* check Stripe provider health and webhook delivery
* inspect subscription and entitlement records
* determine whether issue is checkout, webhook, or resolver layer
* contain by pausing upgrade CTA or premium unlock path if needed

### Escalate immediately if

* money is taken without correct access
* broad entitlement corruption exists

---

## 9.4 Core funnel incident

### Examples

* onboarding save/resume broken
* snapshot generation failing broadly
* upgrade CTA broken
* personal statement or supplements route crashes for paid users

### Immediate actions

* identify exact failing step
* assess how many users are blocked
* preserve analytics/support evidence
* contain by gating broken workflow if needed

---

## 9.5 Institution / deadline data incident

### Examples

* deadline dates wrong for many schools
* institution search returning bad results
* stale or corrupted data shown without fallback

### Immediate actions

* determine whether issue is display, import, or source-data layer
* validate against source metadata/admin tools
* contain by marking surfaces partial, hiding unreliable data, or prioritizing manual correction

### Rule

If data cannot be trusted, say less rather than showing false precision.

---

## 9.6 Notification / reminder incident

### Examples

* duplicate reminders sent
* broken email links
* snapshot-ready emails never sent
* deadline reminders missing or failing broadly

### Immediate actions

* pause scheduled jobs if duplicate or harmful behavior is suspected
* inspect notification events and provider logs
* identify whether issue is eligibility logic, provider send, or dedupe failure

### Escalate immediately if

* users are being spammed
* reminder links send users to broken or unsafe routes

---

## 9.7 Admin / support visibility incident

### Examples

* support cannot inspect user state
* notification failures invisible
* admin views broken during active incident

### Immediate actions

* restore support visibility if possible
* identify whether data still exists but UI is broken versus true observability gap
* use DB/provider fallbacks if needed until tooling is restored

---

## 10. Incident declaration template

Use this when declaring an incident.

**Incident ID:**
**Time detected:**
**Severity:** SEV-1 / SEV-2 / SEV-3 / SEV-4
**Incident Commander:**
**Affected area:**
**Known user impact:**
**Current hypothesis:**
**Containment status:** Not started / In progress / Contained
**Next update time:**

---

## 11. Action log template

Record all meaningful actions in order.

| Time (ET) | Owner | Action | Result | Notes |
| --------- | ----- | ------ | ------ | ----- |
|           |       |        |        |       |
|           |       |        |        |       |
|           |       |        |        |       |

---

## 12. Communication rules

## 12.1 Internal communication

### Required

* all incident actions in official incident channel
* timestamped updates
* severity stated clearly
* facts separated from hypotheses

### Avoid

* side-channel decisions
* unlogged verbal-only decisions
* “I think it’s fixed” without validation

---

## 12.2 External / user-facing communication

Use only when needed and approved by the appropriate owner.

### Principles

* be factual
* do not speculate
* do not over-promise timing
* explain impact clearly
* explain next step if users need to do something

### When to consider user-facing communication

* auth outage
* billing/unlock issue affecting paid users
* reminder/email spam event
* data trust issue with meaningful user impact

---

## 13. Escalation rules

Escalate immediately to leadership if any of the following is true:

* potential privacy or security exposure
* payments are being taken incorrectly
* broad user lockout
* rollback may be required
* issue remains unresolved beyond initial containment window

### Escalation table

| Situation                             | Escalate To                                       | Timing    |
| ------------------------------------- | ------------------------------------------------- | --------- |
| Privacy/permission leak               | Product + Engineering leadership immediately      | Immediate |
| Billing corruption                    | Product + Billing owner + Engineering immediately | Immediate |
| Broad outage                          | Product + Engineering + Ops immediately           | Immediate |
| Data trust issue affecting many users | Product + Data owner immediately                  | Immediate |
| Spam/notification incident            | Product + Ops + Support immediately               | Immediate |

---

## 14. Recovery validation checklist

Before declaring incident resolved, verify:

| Check                                                  | Owner | Status | Notes |
| ------------------------------------------------------ | ----- | ------ | ----- |
| Root cause reasonably understood                       |       |        |       |
| Containment removed safely or replaced with stable fix |       |        |       |
| Affected route/module works again                      |       |        |       |
| No permission/privacy regression remains               |       |        |       |
| Billing/entitlement behavior correct if relevant       |       |        |       |
| Notifications/jobs safe to resume if paused            |       |        |       |
| Support/admin visibility restored                      |       |        |       |
| No new adjacent breakage detected                      |       |        |       |

### Rule

Do not declare “resolved” based only on code merge or deploy. Validate live behavior.

---

## 15. Resolution declaration template

Use this when the incident is resolved.

**Incident ID:**
**Resolved at:**
**Declared by:**
**Root cause summary:**
**Containment used:**
**Fix applied:**
**User impact summary:**
**Follow-up required:** Yes / No
**Postmortem required:** Yes / No

---

## 16. Post-incident review requirements

A post-incident review is required for:

* every SEV-1
* every SEV-2
* repeated SEV-3 issues in the same area
* any incident involving privacy, billing, or trust

### Post-incident review must answer

* what happened
* when it started
* how it was detected
* how long users were affected
* why it happened
* how it was contained
* how it was fixed
* what should change to prevent recurrence

### Output artifacts

Possible outputs:

* hotfix candidate
* deferred defect entry
* runbook update
* monitoring improvement
* test coverage improvement

---

## 17. Incident severity-to-response matrix

| Severity | Commander Required | Live Channel Required | Executive Escalation | Rollback Consideration | Postmortem Required |
| -------- | -----------------: | --------------------: | -------------------: | ---------------------: | ------------------: |
| SEV-1    |                Yes |                   Yes |                  Yes |                    Yes |                 Yes |
| SEV-2    |                Yes |                   Yes |              Usually |                  Often |                 Yes |
| SEV-3    |            Usually |                   Yes |         Case-by-case |                   Rare |           Sometimes |
| SEV-4    |                 No |              Optional |                   No |                     No |                  No |

---

## 18. Common incident anti-patterns

Do not:

* keep severity artificially low to avoid escalation
* keep shipping unrelated code during a live major incident
* assume provider is at fault without evidence
* declare fix before validating end-to-end user behavior
* bury privacy or billing issues inside general bug language
* let the incident channel become vague or unstructured

---

## 19. Non-negotiables

1. Any credible permission/privacy issue is treated urgently.
2. Any billing/unlock mismatch is treated as a trust issue, not a minor bug.
3. Containment comes before elegance.
4. Incidents must be logged in real time.
5. Resolution requires live validation, not just code changes.

---

## 20. Final directive

During a production incident, this playbook is the operating standard.

The team should always be able to say:

* what severity this is
* who is in command
* what users are experiencing
* what containment is active
* what must happen next

If the team cannot answer those questions clearly, the response is not under control.

---

## 21. Recommended next artifacts

Create next:

* `V1_0_1_RELEASE_NOTES.md`
* `WEEK_1_METRICS_REVIEW_V1.md`
* `KNOWN_LIMITATIONS_V1.md`
* `POSTMORTEM_TEMPLATE_V1.md`