# GO_LIVE_RUNBOOK_V1

## The College Admissions Edge

## v1 Production Launch Runbook

## 1. Purpose

This document is the minute-by-minute operational runbook for launching v1 of The College Admissions Edge.

It is designed to answer four questions in real time:

* what happens next
* who owns it
* what must be verified before proceeding
* when to stop, hold, or roll back

This runbook is not a strategy document.
It is not a checklist substitute.
It is the live execution script for launch day.

It must be used together with:

* `RELEASE_CHECKLIST_V1.md`
* support runbook
* rollback/recovery guidance
* production environment documentation

---

## 2. Launch command principles

1. One launch commander owns the timeline.
2. No step is assumed complete until explicitly confirmed.
3. No critical issue is “probably fine.” It is either understood or it is a hold.
4. The team must prefer a controlled delay over a sloppy launch.
5. Go-live communication must be concise, factual, and timestamped.

---

## 3. Launch roles

Fill these before launch starts.

| Role              | Primary Owner | Backup | Notes                                      |
| ----------------- | ------------- | ------ | ------------------------------------------ |
| Launch Commander  |               |        | Runs timeline, makes escalation calls      |
| Engineering Lead  |               |        | Owns code/deploy/migrations                |
| QA Lead           |               |        | Owns smoke tests and defect verification   |
| Ops / Infra Owner |               |        | Owns environment/provider/deploy health    |
| Billing Owner     |               |        | Owns Stripe and entitlement validation     |
| Data Owner        |               |        | Owns institutions/deadlines validation     |
| Support Owner     |               |        | Owns support readiness and incident intake |
| Product Owner     |               |        | Owns launch decision alignment             |

---

## 4. Launch communication channel

Define the official launch communication channel before starting.

| Item                      | Value |
| ------------------------- | ----- |
| Launch war room channel   |       |
| Video bridge / call link  |       |
| Incident escalation path  |       |
| Status doc location       |       |
| Release artifact location |       |

### Communication rule

Every critical step must be logged in the launch channel in this format:

`[TIME] [OWNER] [STEP] [STATUS] [NOTES]`

Example:
`08:42 ET | Eng Lead | Production deploy complete | GREEN | Build 1.0.0 deployed successfully`

---

## 5. Launch status vocabulary

Use only these status words during launch:

* **GREEN** = complete / healthy / proceed
* **YELLOW** = concern exists / monitor / proceed only if explicitly accepted
* **RED** = stop / do not proceed / rollback or fix required
* **HOLD** = pause execution until issue is resolved or decision is made

---

## 6. T-minus timeline overview

Use this as the master sequence.

| Phase   | Target Time  | Owner              | Goal                                                           |
| ------- | ------------ | ------------------ | -------------------------------------------------------------- |
| Phase 0 | T-60 to T-30 | All leads          | Assemble, confirm readiness                                    |
| Phase 1 | T-30 to T-15 | Eng/Ops            | Freeze deploy inputs and verify production config              |
| Phase 2 | T-15 to T-5  | Eng/Data           | Execute migrations and data validations                        |
| Phase 3 | T-5 to T+0   | Eng                | Deploy release candidate to production                         |
| Phase 4 | T+0 to T+15  | QA/Billing/Product | Execute smoke tests                                            |
| Phase 5 | T+15 to T+60 | All leads          | Monitor launch health and triage issues                        |
| Phase 6 | T+60+        | Product/Ops        | Confirm stable launch and transition to post-launch monitoring |

---

# 7. Detailed minute-by-minute runbook

## Phase 0 — Launch room assembly

### Target window

T-60 to T-30

### Goal

Confirm all people, decisions, and materials are in place before touching production.

### Steps

#### 0.1 Launch commander opens launch room

**Owner:** Launch Commander
**Action:** Confirm all required owners are present or delegated.
**Verification:** Role table completed.
**Stop condition:** Missing critical owner without delegate.

#### 0.2 Confirm release artifact versions

**Owner:** Engineering Lead
**Action:** State exact release artifact / commit / tag being launched.
**Verification:** One canonical release version identified.
**Stop condition:** More than one candidate or ambiguity about what is being deployed.

#### 0.3 Confirm release checklist status

**Owner:** Product Owner + QA Lead
**Action:** Review `RELEASE_CHECKLIST_V1.md` status and call out any Yellow/Red items.
**Verification:** All Red issues resolved or explicit no-go.
**Stop condition:** Any unresolved Red item.

#### 0.4 Confirm rollback owner and rollback reference

**Owner:** Ops / Infra Owner
**Action:** Identify previous known-good release and rollback owner.
**Verification:** Rollback path documented and verbally confirmed.
**Stop condition:** No clear rollback target.

#### 0.5 Confirm support readiness

**Owner:** Support Owner
**Action:** Confirm support coverage, runbook access, and escalation path.
**Verification:** Support owner can receive and triage incidents at launch.
**Stop condition:** No support coverage for launch window.

### Phase 0 exit criteria

* all roles assigned
* exact release identified
* rollback path confirmed
* release checklist is Green or acceptable Yellow by explicit signoff

---

## Phase 1 — Production configuration freeze and preflight

### Target window

T-30 to T-15

### Goal

Freeze launch inputs and verify production configuration before migrations or deploy.

### Steps

#### 1.1 Declare deployment freeze

**Owner:** Launch Commander
**Action:** Announce no unscheduled merges, config changes, or provider changes from this point onward.
**Verification:** Team acknowledges freeze.
**Stop condition:** Parallel untracked changes continue.

#### 1.2 Verify production environment variables

**Owner:** Ops / Infra Owner
**Action:** Validate all required env vars in production.
**Verify at minimum:**

* Supabase keys
* app URL
* Stripe keys and webhook secret
* Resend key
* AI key(s)
* callback URLs
  **Stop condition:** Missing, placeholder, or incorrect critical env var.

#### 1.3 Verify provider readiness

**Owner:** Billing Owner + Ops Owner
**Action:** Confirm:

* Stripe product/price correct
* webhook target correct
* Resend sender/domain valid
* Supabase auth callbacks valid
  **Stop condition:** Any provider misconfiguration affecting auth, billing, or email.

#### 1.4 Verify scheduled job configuration

**Owner:** Ops / Infra Owner
**Action:** Confirm scheduled jobs are configured and pointed at production-safe endpoints.
**Stop condition:** Cron/job config points to wrong environment or missing endpoints.

#### 1.5 Confirm admin/support access

**Owner:** Engineering Lead + Support Owner
**Action:** Ensure admin access works for at least one designated operator.
**Stop condition:** No working admin/operator account.

### Phase 1 exit criteria

* production configuration verified
* providers verified
* admin access verified
* deployment freeze active

---

## Phase 2 — Migrations and production data checks

### Target window

T-15 to T-5

### Goal

Apply or verify required migrations and confirm critical production data readiness.

### Steps

#### 2.1 Announce migration start

**Owner:** Engineering Lead
**Action:** Post migration start message in launch channel.
**Verification:** Launch Commander acknowledges.

#### 2.2 Apply production migrations

**Owner:** Engineering Lead
**Action:** Run required schema/RLS migrations in documented order.
**Verification:** Migration output captured.
**Stop condition:** Migration failure, partial migration, or unclear state.

#### 2.3 Validate critical tables and policies

**Owner:** Engineering Lead
**Action:** Confirm critical tables exist and key RLS policies are active.
**Verify at minimum:**

* user profiles
* student/support links
* subscriptions
* notification events
* institutions
* institution_deadlines
  **Stop condition:** Missing tables, broken policies, or unclear DB state.

#### 2.4 Execute or verify institution import/seed status

**Owner:** Data Owner
**Action:** Confirm institution dataset is loaded and searchable.
**Stop condition:** Institution search unusable or obviously incomplete for launch.

#### 2.5 Execute or verify deadline import/seed status

**Owner:** Data Owner
**Action:** Confirm launch-cycle deadlines are loaded and confidence states are present.
**Stop condition:** Deadline data absent, stale beyond acceptable threshold, or corrupted.

#### 2.6 Run high-priority data spot check

**Owner:** Data Owner + Product Owner
**Action:** Spot-check a small list of priority schools and deadlines.
**Verification:** Results are acceptable for launch.
**Stop condition:** High-priority schools clearly wrong without mitigation.

### Phase 2 exit criteria

* migrations successful
* key tables/policies verified
* institutions/deadlines acceptable for launch

---

## Phase 3 — Production deployment

### Target window

T-5 to T+0

### Goal

Deploy the approved release to production cleanly.

### Steps

#### 3.1 Confirm final go-ahead to deploy

**Owner:** Launch Commander + Engineering Lead
**Action:** Explicitly confirm that Phases 0–2 are Green.
**Stop condition:** Any unresolved Red or active Hold.

#### 3.2 Deploy production release

**Owner:** Engineering Lead
**Action:** Promote/deploy the approved release artifact to production.
**Verification:** Deployment completes successfully.
**Stop condition:** Failed deploy, partial deploy, or unexpected build/runtime issue.

#### 3.3 Verify application availability

**Owner:** Ops / Infra Owner
**Action:** Confirm production app is reachable and core routes render.
**Verify:**

* homepage
* login
* signup
* admin entry
  **Stop condition:** Production app unavailable or obviously broken.

#### 3.4 Announce go-live timestamp

**Owner:** Launch Commander
**Action:** Record official launch timestamp in launch channel.
**Verification:** Team acknowledges that smoke phase begins now.

### Phase 3 exit criteria

* production build deployed
* core routes reachable
* official go-live timestamp recorded

---

## Phase 4 — Immediate post-deploy smoke tests

### Target window

T+0 to T+15

### Goal

Verify the most important user and operator paths work in production.

### Steps

#### 4.1 Student smoke test

**Owner:** QA Lead
**Action:** Execute student smoke path:

* sign up / log in
* select student role
* onboarding entry
* snapshot access
* upgrade path
* premium route access
  **Stop condition:** Any core student path failure.

#### 4.2 Billing smoke test

**Owner:** Billing Owner
**Action:** Validate checkout and post-payment unlock behavior in production-safe way.
**Stop condition:** Payment succeeds but entitlement does not unlock correctly, or checkout fails.

#### 4.3 Supporting-adult smoke test

**Owner:** QA Lead + Product Owner
**Action:** Verify:

* supporting-adult link flow or existing linked path
* parent dashboard access
* progress summary
* deadlines summary
* no raw writing exposure
  **Stop condition:** Unauthorized visibility or broken supporting-adult path.

#### 4.4 Admin smoke test

**Owner:** Support Owner / Ops Owner
**Action:** Verify:

* admin login
* admin overview
* users view
* institutions/deadlines view
* analytics/support diagnostics basic availability
  **Stop condition:** Admin/support blind to system state.

#### 4.5 Notification/provider smoke test

**Owner:** Ops Owner
**Action:** Confirm:

* email provider responds
* a safe test notification path works if included in launch protocol
* webhook endpoints reachable
  **Stop condition:** Email/provider integration broken and invisible.

### Phase 4 exit criteria

* core student path works
* billing works
* supporting-adult path works
* admin/support visibility works

If any critical smoke step fails: **HOLD** and triage immediately.

---

## Phase 5 — First-hour monitoring and issue triage

### Target window

T+15 to T+60

### Goal

Watch launch health closely and respond to early issues before they compound.

### Monitoring cadence

Check every 10–15 minutes during first hour.

### Signals to review

#### 5.1 Availability

**Owner:** Ops Owner
Check:

* app reachable
* no elevated route-level failures
* no deployment instability

#### 5.2 Auth health

**Owner:** Engineering Lead
Check:

* signup success
* login success
* no role-selection anomalies

#### 5.3 Billing health

**Owner:** Billing Owner
Check:

* checkout starts
* checkout completes
* subscription records created
* premium unlock works
* no owner/non-owner billing visibility issues

#### 5.4 Snapshot and AI health

**Owner:** Engineering Lead + Product Owner
Check:

* snapshot generation success rate
* no malformed output failures
* no excessive latency breaking UX

#### 5.5 Notification health

**Owner:** Ops Owner
Check:

* notification events recorded
* failed sends visible
* no duplicate send spike

#### 5.6 Data health

**Owner:** Data Owner
Check:

* institution search behaving normally
* deadline pages not producing obvious invalid data states

#### 5.7 Support health

**Owner:** Support Owner
Check:

* incoming support issues
* recurring complaint patterns
* ability to diagnose issues from admin/support tooling

### Triage rule

Any issue discovered in first hour must be classified immediately as:

* monitor only
* hotfix required
* hold launch promotion/marketing
* rollback candidate

---

## Phase 6 — Transition to stable monitoring

### Target window

T+60 and beyond

### Goal

Move from minute-by-minute launch execution to structured post-launch operations.

### Steps

#### 6.1 Launch commander requests all-owner status call

**Owner:** Launch Commander
Each owner states:

* Green
* Yellow
* Red
  with one-sentence reason.

#### 6.2 Product owner confirms launch posture

**Owner:** Product Owner
Action:

* confirm stable launch
* or declare constrained launch
* or declare active incident state

#### 6.3 Support owner confirms incident intake mode

**Owner:** Support Owner
Action:

* confirm support coverage duration
* confirm issue capture location

#### 6.4 Create post-launch review timestamp

**Owner:** Launch Commander
Action:

* schedule 24-hour and/or 48-hour review checkpoint

### Phase 6 exit criteria

* launch state clearly declared
* monitoring ownership handed off
* post-launch review scheduled

---

# 8. Hold / stop / rollback decision rules

## 8.1 Immediate HOLD conditions

Trigger HOLD immediately if any of the following occurs:

* migrations fail or DB state is unclear
* app unavailable after deploy
* auth flow broken for new users
* payment succeeds but unlock fails
* permission leak or raw content exposure detected
* admin/support cannot inspect critical failures

## 8.2 Rollback candidate conditions

Consider rollback if any of the following occurs and cannot be resolved quickly:

* severe auth instability
* billing corruption or repeated payment/unlock mismatch
* data corruption affecting institutions/deadlines broadly
* reminder/email spam event
* critical route failures across core product flows

## 8.3 Yellow launch conditions

A Yellow launch may continue only with explicit acknowledgment if issues are:

* non-critical
* understood
* monitored
* documented with owner and mitigation

---

# 9. Live execution log template

Use this format during launch:

| Time (ET) | Owner | Phase/Step | Status | Notes |
| --------- | ----- | ---------- | ------ | ----- |
|           |       |            |        |       |
|           |       |            |        |       |
|           |       |            |        |       |

---

# 10. Launch-day smoke test worksheet

## Student path

| Check                     | Owner | Status | Notes |
| ------------------------- | ----- | ------ | ----- |
| Signup/login              |       |        |       |
| Role selection            |       |        |       |
| Onboarding entry          |       |        |       |
| Snapshot view             |       |        |       |
| Upgrade CTA               |       |        |       |
| Premium unlock            |       |        |       |
| Story Vault access        |       |        |       |
| Personal statement access |       |        |       |
| Supplements access        |       |        |       |

## Supporting-adult path

| Check                  | Owner | Status | Notes |
| ---------------------- | ----- | ------ | ----- |
| Link/invite path       |       |        |       |
| Dashboard access       |       |        |       |
| Progress summary       |       |        |       |
| Deadlines summary      |       |        |       |
| No raw writing leakage |       |        |       |

## Admin path

| Check               | Owner | Status | Notes |
| ------------------- | ----- | ------ | ----- |
| Admin login         |       |        |       |
| Admin overview      |       |        |       |
| User inspection     |       |        |       |
| Institution admin   |       |        |       |
| Deadline admin      |       |        |       |
| Analytics view      |       |        |       |
| Support diagnostics |       |        |       |

---

# 11. Launch-day monitoring worksheet

## First-hour repeated checks

| Time | Owner | Check                | Status | Notes |
| ---- | ----- | -------------------- | ------ | ----- |
|      |       | Availability         |        |       |
|      |       | Auth health          |        |       |
|      |       | Billing health       |        |       |
|      |       | Snapshot/AI health   |        |       |
|      |       | Notification health  |        |       |
|      |       | Data health          |        |       |
|      |       | Support issue volume |        |       |

---

# 12. Incident escalation template

Use this when a serious issue appears:

**Incident:**
**Detected at:**
**Detected by:**
**Severity:** Green / Yellow / Red
**User impact:**
**Likely scope:**
**Immediate mitigation:**
**Owner:**
**Decision:** Monitor / Hotfix / Hold / Rollback

---

# 13. Final launch declaration template

Use when deciding final launch posture.

**Launch decision:** GO / GO WITH MONITORED YELLOW RISKS / HOLD / ROLLBACK
**Time:**
**Declared by:**
**Summary:**
**Known issues at declaration:**
**Owners for follow-up:**

---

# 14. Non-negotiables

1. No critical production issue is “eyeballed” into acceptance.
2. No launch step is assumed complete without explicit confirmation.
3. No permission or billing issue is allowed to linger unclassified during launch.
4. No rollback decision is delayed just because effort has already been invested.
5. The launch commander controls sequencing; side-channel execution is not allowed.

---

# 15. Final directive

Use this runbook live during launch.

Do not compress it into memory. Do not rely on informal coordination. Do not skip logging.

A controlled launch is one in which the team can answer, at any moment:

* what just happened
* what is happening now
* what happens next
* who owns it
* whether it is safe to proceed

---

## 16. Recommended next artifacts

Create next:

* `POST_LAUNCH_REVIEW_V1.md`
* `DEFERRED_DEFECTS_V1.md`
* `V1_0_1_HOTFIX_PLAN.md`
* `INCIDENT_RESPONSE_PLAYBOOK_V1.md`
