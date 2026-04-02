# V1_0_1_HOTFIX_PLAN

## The College Admissions Edge

## v1.0.1 Stabilization and Hotfix Release Plan

## 1. Purpose

This document defines the operating plan for the first post-launch stabilization patch: **v1.0.1**.

It exists to answer six questions:

* What qualifies for the first hotfix release?
* What does **not** belong in v1.0.1?
* How are fixes prioritized?
* What order should fixes be implemented and verified in?
* What are the release risks of each change?
* What must be true before v1.0.1 ships?

This is not a backlog.
This is not a wishlist.
This is the controlled patch plan for the first post-launch correction cycle.

---

## 2. Hotfix philosophy

v1.0.1 is for **stabilization**, not expansion.

The goal is to:

* reduce user-facing breakage
* reduce support burden
* protect trust
* fix revenue-impacting issues
* fix permissions/security/data issues
* remove avoidable friction in the live product

The goal is **not** to:

* add large new features
* redesign the product
* bundle unrelated improvements
* reopen product strategy

### Rule

If a change does not materially improve stability, trust, conversion, permissions, billing, or supportability, it probably does not belong in v1.0.1.

---

## 3. v1.0.1 release posture

### Patch type

* Stabilization patch
* Limited-scope production release
* Fast follow to launch

### Recommended timing

* as soon as launch findings are validated and scoped
* only after the patch list is frozen
* only after regression risk is understood

### Default expectation

v1.0.1 should be **smaller and safer** than the initial launch release.

---

## 4. Inclusion criteria

A fix belongs in v1.0.1 if it meets one or more of the following:

### 4.1 Trust and security

* fixes permission leaks
* fixes raw-content exposure risk
* fixes auth/access control defects
* fixes admin-only access issues

### 4.2 Revenue and access control

* fixes checkout failure
* fixes post-payment unlock failure
* fixes billing owner / non-owner visibility bugs
* fixes entitlement mismatch or stale premium access

### 4.3 Core funnel stability

* fixes onboarding breakage
* fixes snapshot generation failure or severe degradation
* fixes critical free-to-paid handoff failures
* fixes premium route breakage for paid users

### 4.4 High-friction UX defects with measurable impact

* fixes severe onboarding dropoff caused by avoidable UX defect
* fixes a top support issue affecting many users
* fixes broken state transitions or route loops

### 4.5 Data trust

* fixes institution or deadline behaviors that materially mislead users
* fixes admin correction paths when wrong data cannot be corrected safely

### 4.6 Supportability and operations

* fixes invisible failures that support/admin cannot diagnose
* fixes missing auditability for critical production actions
* fixes duplicate notification/reminder behavior

---

## 5. Exclusion criteria

A change should usually **not** be included in v1.0.1 if it is primarily:

* a new feature
* a large redesign
* a speculative UX improvement without evidence
* a low-severity polish improvement
* a broad refactor with limited immediate user value
* a "nice to have" analytics enhancement
* a roadmap item disguised as a hotfix

### Examples of items that likely do not belong

* new modules not already launched
* deep visual redesigns
* major copy rewrites unless the copy causes conversion or support problems
* non-essential admin enhancements
* feature expansions for edge cases only

---

## 6. Prioritization model

All hotfix candidates must be scored using the following dimensions.

| Dimension       | Description                                       | Score Range |
| --------------- | ------------------------------------------------- | ----------: |
| User impact     | How badly it affects real users                   |         1–5 |
| Revenue impact  | How badly it affects conversion or paid access    |         1–5 |
| Trust/risk      | Whether it affects trust, privacy, or correctness |         1–5 |
| Support burden  | How much support load it creates                  |         1–5 |
| Fix complexity  | Estimated implementation complexity               |         1–5 |
| Regression risk | Likelihood of breaking other flows                |         1–5 |

### Prioritization rule

Prefer issues that are:

* high user impact
* high trust/revenue impact
* low-to-moderate fix complexity
* low-to-moderate regression risk

### Default order of importance

1. security / permissions / privacy
2. billing / entitlements
3. auth / onboarding / snapshot / core funnel
4. major data trust issues
5. high-volume support issues
6. targeted UX cleanup with measurable impact

---

## 7. Hotfix candidate intake table

Use this table to collect candidate items from the post-launch review.

| ID     | Candidate | Area | Why It Matters | Evidence | Included? | Priority | Notes |
| ------ | --------- | ---- | -------------- | -------- | --------- | -------- | ----- |
| HF-001 |           |      |                |          |           |          |       |
| HF-002 |           |      |                |          |           |          |       |
| HF-003 |           |      |                |          |           |          |       |
| HF-004 |           |      |                |          |           |          |       |
| HF-005 |           |      |                |          |           |          |       |

### Required evidence types

Candidate evidence should come from at least one of:

* production analytics
* support incidents
* QA reproduction
* admin/support diagnostics
* post-launch review findings

No hotfix item should be included solely because it "feels important" unless it is a leadership override.

---

## 8. Hotfix inclusion decision table

Use this to make the patch scope explicit.

| Candidate ID | Included in v1.0.1? | Reason Included / Excluded | Owner |
| ------------ | ------------------- | -------------------------- | ----- |
| HF-001       |                     |                            |       |
| HF-002       |                     |                            |       |
| HF-003       |                     |                            |       |
| HF-004       |                     |                            |       |
| HF-005       |                     |                            |       |

### Rule

Every candidate must have an explicit inclusion decision.

---

## 9. Recommended v1.0.1 patch buckets

Use these buckets to organize the release.

## 9.1 Bucket A — Must-fix before continuing promotion

Typical items:

* permission/access leak
* payment/unlock mismatch
* severe onboarding or snapshot failure
* critical support-diagnosis blind spot

### Rule

Any Bucket A item should normally block broader promotion until fixed.

---

## 9.2 Bucket B — High-value stabilization fixes

Typical items:

* repeated support burden issue
* high-friction UX defect in core path
* supporting-adult link instability
* major deadline/data presentation problem

### Rule

Bucket B should be included if patch size remains controlled.

---

## 9.3 Bucket C — Safe polish only if patch risk remains low

Typical items:

* minor UX cleanup
* low-risk copy clarification
* small dashboard clarity improvements

### Rule

Bucket C is optional and should be dropped first if scope grows.

---

## 10. Patch scope freeze

### Freeze rule

Once v1.0.1 scope is approved:

* no new hotfix candidates are added without explicit product + engineering approval
* no roadmap work is mixed into the release
* no "while we're here" features are added

### Page 3 / Page 4 surface freeze addendum

For Page 3 and Page 4 surface files, the freeze boundary is enforced by named regression gates, not memory.

Required gate:

* `npm run test:first-minute:surface-gates`

Formal gatekeeper tests:

* `src/__tests__/unit/page3-surface-integrity.spec.ts`
* `src/__tests__/unit/opening-coach-ordering.spec.ts`
* `src/__tests__/unit/opening-coach.spec.ts`

Rule:

* do not modify Page 3 / Page 4 surfaces unless a named gate fails first or product explicitly approves a narrowly scoped correction
* do not treat wording-only edits as exempt from the gate
* do not reopen ranking, routing, or broader cleanup under this freeze umbrella

CI enforcement:

* PRs touching `src/lib/fm/canonicalPage3Payload.ts`, `src/lib/fm/openingCoach.ts`, Page 3 / Page 4 route files, or related first-minute surface components must pass the `first-minute-surface-gates` workflow

### Freeze template

| Freeze Item                       | Owner | Time | Notes |
| --------------------------------- | ----- | ---- | ----- |
| Hotfix scope frozen               |       |      |       |
| Branch/release candidate created  |       |      |       |
| Deferred items moved out of patch |       |      |       |

---

## 11. Implementation sequencing

Use the following order by default.

### Sequence 1 — Access and trust fixes

Implement first:

* permission fixes
* auth issues
* role/route mismatches
* privacy visibility problems

### Sequence 2 — Billing and entitlement fixes

Implement next:

* checkout failures
* billing portal issues
* subscription sync issues
* post-payment unlock issues

### Sequence 3 — Core funnel fixes

Implement next:

* onboarding defects
* snapshot defects
* major route state or redirect defects

### Sequence 4 — Data and supportability fixes

Implement next:

* deadline/institution trust fixes
* admin/support visibility fixes
* reminder/notification duplication or failure-visibility fixes

### Sequence 5 — low-risk UX cleanup

Implement only if scope and regression risk remain controlled.

---

## 12. Hotfix implementation plan

Populate once scope is frozen.

| Sequence | Candidate ID | Change Summary | Owner | Complexity | Regression Risk | Notes |
| -------- | ------------ | -------------- | ----- | ---------: | --------------: | ----- |
| 1        |              |                |       |            |                 |       |
| 2        |              |                |       |            |                 |       |
| 3        |              |                |       |            |                 |       |
| 4        |              |                |       |            |                 |       |

---

## 13. Validation requirements per fix

Each included fix must define:

* how it will be tested
* which routes/modules are affected
* what regression risk exists
* whether analytics/support evidence should improve afterward

Use the template below.

| Candidate ID | Validation Method | Affected Areas | Regression Risk | Post-release Metric to Watch |
| ------------ | ----------------- | -------------- | --------------- | ---------------------------- |
| HF-001       |                   |                |                 |                              |
| HF-002       |                   |                |                 |                              |
| HF-003       |                   |                |                 |                              |

### Minimum validation levels

* critical permission or billing fixes require integration + manual verification
* core funnel fixes require integration + E2E if feasible
* admin/support fixes require at least manual operator validation

---

## 14. Hotfix test checklist

## 14.1 Required automated verification

| Check                                         | Owner | Status | Notes |
| --------------------------------------------- | ----- | ------ | ----- |
| Unit tests pass                               |       |        |       |
| Integration tests pass                        |       |        |       |
| Affected E2E tests pass                       |       |        |       |
| New regression tests added for included fixes |       |        |       |

---

## 14.2 Required manual verification

| Check                                               | Owner | Status | Notes |
| --------------------------------------------------- | ----- | ------ | ----- |
| Included fix reproduced before fix                  |       |        |       |
| Included fix verified after fix                     |       |        |       |
| No regression in adjacent flow                      |       |        |       |
| Admin/support view behavior verified where relevant |       |        |       |
| Billing/provider flow verified where relevant       |       |        |       |

---

## 15. Release risk review

Every included hotfix must be reviewed for risk before release.

| Candidate ID | Risk Summary | Risk Level (Low/Med/High) | Mitigation | Owner |
| ------------ | ------------ | ------------------------- | ---------- | ----- |
| HF-001       |              |                           |            |       |
| HF-002       |              |                           |            |       |
| HF-003       |              |                           |            |       |

### Rule

If a fix has high regression risk and low immediate value, it should usually be removed from v1.0.1.

---

## 16. Deferred items table

Any item excluded from v1.0.1 must be explicitly recorded.

| Candidate ID | Deferred To | Reason Deferred | Owner | Review Date |
| ------------ | ----------- | --------------- | ----- | ----------- |
|              |             |                 |       |             |
|              |             |                 |       |             |

### Rule

Nothing is "forgotten." It is either in the patch or explicitly deferred.

---

## 17. v1.0.1 release readiness checklist

Before shipping v1.0.1, confirm:

| Check                               | Owner | Status | Notes |
| ----------------------------------- | ----- | ------ | ----- |
| Patch scope frozen                  |       |        |       |
| Included fixes implemented          |       |        |       |
| Regression tests added where needed |       |        |       |
| Manual validation complete          |       |        |       |
| Release risk reviewed               |       |        |       |
| Deferred items documented           |       |        |       |
| Release notes drafted               |       |        |       |
| Go/no-go for v1.0.1 recorded        |       |        |       |

---

## 18. v1.0.1 release notes skeleton

Use this structure for the patch release notes.

### v1.0.1 summary

A concise explanation of what this patch addresses.

### Fixes included

* Fix 1
* Fix 2
* Fix 3

### Areas improved

* stability
* billing/access
* onboarding/conversion
* data trust
* supportability

### Notes

* Any known issues remaining
* Any operational follow-up after release

---

## 19. Post-patch monitoring plan

After v1.0.1 ships, monitor the exact issue classes it was meant to fix.

| Area         | Metric / Signal                    | Owner | Review Window | Notes |
| ------------ | ---------------------------------- | ----- | ------------- | ----- |
| Billing      | checkout success / unlock success  |       |               |       |
| Onboarding   | completion/dropoff                 |       |               |       |
| Snapshot     | generation success/failure         |       |               |       |
| Permissions  | support incidents / QA spot checks |       |               |       |
| Data trust   | deadline/institution issues        |       |               |       |
| Support load | issue volume by category           |       |               |       |

### Rule

A hotfix is not "done" just because it shipped. It must improve the targeted production signal.

---

## 20. Non-negotiables

1. Do not turn v1.0.1 into a stealth feature release.
2. Do not include fixes without evidence or an explicit reason.
3. Do not ship high-risk fixes without regression review.
4. Do not leave excluded items undocumented.
5. Do not call the patch successful unless post-release signals improve.

---

## 21. Final directive

v1.0.1 should be small, sharp, and corrective.

By the time this patch is scoped, the team should be able to say clearly:

* what problems it fixes
* why those problems matter
* why other items were excluded
* how success will be measured after release

If the patch cannot be explained that cleanly, the scope is probably too broad.

---

## 22. Recommended next artifacts

Create next:

* `DEFERRED_DEFECTS_V1.md`
* `INCIDENT_RESPONSE_PLAYBOOK_V1.md`
* `V1_0_1_RELEASE_NOTES.md`
* `WEEK_1_METRICS_REVIEW_V1.md`