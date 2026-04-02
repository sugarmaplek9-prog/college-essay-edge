# V1_SCOPE_LOCK

## 1. Purpose

This document locks the real launch scope for College Essay Edge v1.

Its job is to remove ambiguity before build starts.

It defines:

* what ships in v1
* what does not ship in v1
* what remains manual in v1
* what is automated in v1
* what is explicitly out of scope
* what "done" means at the scope level

This is not a strategy document.
This is a build-control document.

If implementation, design, or planning decisions conflict with this file, this file wins unless the scope lock is formally revised.

---

## 2. Core v1 Principle

v1 should ship as a narrower, disciplined system that produces clearly differentiated value in a few high-value workflow moments.

It should not try to feel broad.
It should not try to look like a general AI counselor.
It should not try to maximize AI surface area.

The v1 goal is simple:

> help students make better essay decisions than they would with free AI, while protecting authenticity and avoiding generic output.

This scope lock follows the release rule that v1 should be narrow, bounded, reviewable, and worth paying for in a small number of critical jobs. This aligns with the release quality gate, which requires explicit launch modules, bounded schemas, validator coverage, and clear agreement on what v1 is in under a few minutes.

---

## 3. v1 Product Definition

College Essay Edge v1 is an admissions-support product that helps a student:

* understand which stories are strongest
* choose a sharper narrative direction
* get structured feedback on an essay draft
* generate stronger supplement angles
* see missing or underused material early

v1 does this through bounded modules, structured outputs, validation, fallback behavior, and selective human review.

v1 is not a general-purpose writing assistant.
It is not a ghostwriter.
It is not a chatbot-first product.
It is not an all-in-one college planning platform.

This matches the routing policy, which states that intelligence should run only when a bounded product job is actually needed, not merely because a user is on a screen.

---

## 4. Locked Launch Modules

The following modules are in locked v1 launch scope.

### 4.1 Edge Snapshot

**Purpose**
Create an early discovery synthesis from onboarding and related student inputs.

**Why it is in scope**
It helps narrow the essay possibility space early and improves downstream module quality.

**v1 job**
Surface likely personal themes, promising directions, and missing discovery ingredients.

**v1 boundaries**
It must clarify.
It must not sprawl into broad personality commentary or motivational coaching.

### 4.2 Story Vault Analysis

**Purpose**
Analyze stored story material and identify the strongest story candidates and underused assets.

**Why it is in scope**
It improves the upstream quality of the whole system and gives the student a clearer inventory of usable material.

**v1 job**
Review story entries, highlight promising candidates, and show what is thin, repetitive, or underdeveloped.

**v1 boundaries**
It must analyze and rank.
It must not fabricate depth where source material is weak.

### 4.3 Narrative Direction Selection

**Purpose**
Help the student choose among plausible personal statement directions.

**Why it is in scope**
This is one of the highest-value decision moments in the entire workflow and a strong place for product differentiation.

**v1 job**
Return a small set of ranked direction candidates with recommendation pressure and evidence-based reasoning.

**v1 boundaries**
It must take a stance.
It must not produce broad brainstorming lists or treat all options as equally strong.

### 4.4 Essay Feedback

**Purpose**
Provide structured revision guidance on an existing draft.

**Why it is in scope**
This is a core paid-value workflow, but it must remain coaching rather than rewrite behavior.

**v1 job**
Diagnose the draft, rank revision priorities, explain why they matter, and recommend next-step improvements.

**v1 boundaries**
It must prioritize and coach.
It must not rewrite the essay for the student.
It must not return submission-ready prose.

### 4.5 Supplement Angle Suggestion

**Purpose**
Help the student identify stronger angles for school-specific supplements.

**Why it is in scope**
It extends value beyond the personal statement and increases package-level usefulness.

**v1 job**
Given school, prompt, and student context, return ranked supplement angles with school-aware reasoning.

**v1 boundaries**
It must stay angle-level and strategy-level.
It must not produce final answers or generic why-school templates.

These modules match the recommended minimum launch set in the release gate and align with the routing map, which defines when each is eligible to run and when it should stop or fall back.

---

## 5. Deferred / Non-Launch Modules

The following are explicitly not required for v1 launch.

### 5.1 Outline Generation

**Decision**
Deferred or treated as light support only if it is unusually easy and clearly safe.

**Reason**
It risks drifting from structure support into disguised authorship. It is not required to prove the core value of v1.

**v1 rule**
Do not block launch on Outline Generation.
If included at all, it must remain structure-first and authenticity-safe.

### 5.2 Overlap Warning

**Decision**
Deferred to v1.1 unless implementation is straightforward and quality is strong.

**Reason**
It is valuable, but it is not necessary to prove the first paid-value wedge.

**v1 rule**
Do not expand package-comparison complexity unless it is cheap, clear, and reliable.

### 5.3 Any additional AI modules not listed in Section 4

**Decision**
Out of launch scope.

**Reason**
v1 needs disciplined scope, not breadth.

The release gate explicitly favors a narrower system with real edge over a broader system with weak differentiation.

---

## 6. Manual in v1

The following remain intentionally manual or human-assisted in v1.

### 6.1 Quality review of flagged artifacts

Artifacts with high genericity risk, authenticity risk, borderline validator outcomes, or core-module low confidence should route into review rather than being trusted blindly.

### 6.2 Benchmark candidate promotion and review

Strong or instructive real artifacts should be manually reviewed and promoted into benchmark or evaluation sets where appropriate.

### 6.3 Review labeling and failure interpretation

Reviewers label genericity, authenticity risk, substitution risk, false-pass, false-block, and related quality signals. This is required by the release quality gate and supports future learning readiness.

### 6.4 Scope judgment for borderline product behavior

If a module risks crossing into ghostwriting, overreach, or polished filler, the correct v1 answer is manual review, reduced scope, or blocking behavior rather than product expansion.

### 6.5 Operational quality ownership

A named owner must inspect outputs, review failures, and maintain launch quality discipline. This is a release requirement, not an optional ops improvement.

### 6.6 Certain support and admin decisions

Support macros, benchmark curation, failure triage, and launch-readiness interpretation remain human-controlled in v1.

---

## 7. Automated in v1

The following should be automated in v1.

### 7.1 Authenticated product workflows

Users can sign in, maintain core profile state, and access their own product workflows according to app permissions.

### 7.2 Core data capture and persistence

The system stores student profile data, story vault entries, essay projects, supplement projects, AI artifacts, validator outcomes, and version provenance.

### 7.3 Triggered module execution

Modules run from defined triggers such as user initiation, artifact creation, artifact update, state change, or controlled system refresh.

### 7.4 Readiness-based routing

Before generation, the system evaluates readiness and routes to standard generation, reduced scope, diagnostic mode, refresh mode, or needs-more-input behavior. Weak context must route to honesty instead of filler.

### 7.5 Structured module generation

The AI layer returns bounded structured artifacts rather than unconstrained prose blobs. All modules use a common root envelope with explicit status handling such as `success`, `partial`, `needs_more_input`, and `failed_validation`.

### 7.6 Validation, retry, and fallback

Every generated artifact must pass validator checks. Structural validity alone is never enough. Retry and fallback behavior must be bounded, purposeful, and failure-class aware.

### 7.7 Artifact persistence and provenance logging

Only approved artifacts become canonical product state. The system stores module metadata, schema version, validator version, execution metadata, and related provenance required for learning readiness.

### 7.8 Permission enforcement before generation

Role, boundary, and access rules are enforced before module execution. Generation is not allowed to bypass permission decisions.

---

## 8. Explicitly Out of Scope for v1

The following are out of scope unless later promoted by formal scope change.

### 8.1 General chatbot behavior

No open-ended "ask anything" AI surface is part of v1.
The product should invoke bounded modules, not a general helper.

### 8.2 Full essay writing or ghostwriting

No module may generate submission-ready personal statements or supplements as a primary behavior.
No core workflow may depend on replacement authorship. This is a hard release blocker.

### 8.3 Broad brainstorming without ranking

The product should not generate large undifferentiated option lists. Choice modules must rank and recommend.

### 8.4 Dynamic multi-provider optimization

v1 uses one primary provider and at most one fallback provider if necessary. Product-owned routing remains simple in v1.

### 8.5 Complex internal ML ranking systems in launch-critical paths

v1 should be architected to learn later, but it does not need advanced learned ranking models to launch.

### 8.6 Large internal review platform build-out

A lightweight review tool, queue, or admin table is enough for v1. Heavy internal platform work is out of scope.

### 8.7 Non-core adjacent product expansion

The following are not v1 launch goals:

* full application management
* admissions calendar planning system
* scholarship platform
* counselor CRM
* broad college search product
* family collaboration suite beyond minimal linked access
* deep analytics dashboards beyond basic quality and execution observability

### 8.8 Deletion and edge-case account-management breadth

Where the permissions matrix already marks functionality as not in v1, it stays out of scope unless legally required or operationally blocking. Examples include self-service destructive flows that are marked `No v1`.

---

## 9. v1 Operating Boundaries

### 9.1 Product shape

v1 is a bounded workflow product with AI inside it.
It is not an AI-first conversation shell.

### 9.2 Output shape

v1 ships validated structured artifacts.
It does not ship raw model prose as product truth.

### 9.3 Quality shape

v1 must prefer:

* fewer stronger outputs
* sharper ranking
* stricter authenticity boundaries
* honest needs-more-input states
* visible failure handling

It must reject:

* motivational filler
* polished but empty language
* broad praise
* school-name token insertion mistaken for specificity
* hidden rewrite behavior

These boundaries are consistent with validator rules and release quality gates that define genericity as a product failure and ghostwriting drift as a high-severity issue.

---

## 10. Done Means What

v1 scope is considered locked only when all of the following are true:

### 10.1 Launch modules are fixed

The five launch modules in Section 4 are the working launch set.
No additional module may silently enter scope.

### 10.2 Deferred modules are genuinely deferred

Outline Generation and Overlap Warning do not block launch unless formally promoted.

### 10.3 Manual vs automated lines are understood

The team can clearly describe what the system does automatically and where human review still matters.

### 10.4 Every launch module has bounded contracts

Each launch module must have:

* a defined trigger
* defined required inputs
* a bounded schema
* validator coverage
* retry/fallback behavior
* persistence behavior
* a clear user-visible purpose

This is consistent with the orchestration and schema architecture already defined.

### 10.5 Everyone can describe v1 quickly

Product and engineering should be able to explain in under two minutes:

* what the product does
* which modules launch
* what is deferred
* what stays manual
* what is not allowed

If they cannot, scope is not actually locked.

This directly matches the release gate test that scope must be describable in under a few minutes.

---

## 11. Scope Change Rules

After this document is accepted, scope changes should be rare.

A change is allowed only if at least one of the following is true:

* a current launch module cannot work without it
* a release-quality gate cannot be passed without it
* a legal, safety, or permissions issue requires it
* a severe implementation blocker makes the current scope impossible

A change is not justified because:

* it sounds valuable
* it feels more complete
* it is strategically interesting
* it may matter later
* a competitor might have it

If a proposed addition does not directly help build, test, or ship v1, it should be rejected.

---

## 12. Final Directive

Build v1 as a narrow, disciplined product with five launch modules:

* Edge Snapshot
* Story Vault Analysis
* Narrative Direction Selection
* Essay Feedback
* Supplement Angle Suggestion

Keep Outline Generation optional and safe.
Keep Overlap Warning deferred unless easy.
Keep human review lightweight but real.
Keep authenticity and anti-generic protection as hard boundaries.

The job of v1 is not to look comprehensive.
The job of v1 is to produce a small number of outputs that feel clearly more useful, more honest, and more student-specific than free AI.

That is the scope lock for v1.
