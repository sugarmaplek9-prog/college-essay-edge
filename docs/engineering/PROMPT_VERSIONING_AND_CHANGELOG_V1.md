# PROMPT_VERSIONING_AND_CHANGELOG_V1
## The College Admissions Edge
### v1 Prompt Versioning, Change Governance, Regression Control, and Learning Specification

---

## 1. Purpose

This document defines how The College Admissions Edge versions, governs, tests, promotes, tracks, and learns from prompt changes across the product.

It exists to answer a critical production question:

> How does the system evolve its prompt layer without drifting into generic output, hidden regressions, inconsistent module behavior, or weakened authenticity protection?

This question matters because prompts in this product are not copy.
They are not loose creative inputs.
They are part of the product's **operating logic.**

A prompt change can affect:

- student specificity
- admissions-native reasoning
- ranking sharpness
- ghostwriting risk
- validator pass rates
- context utilization
- distinctness of options
- brand fit
- substitution risk versus free AI
- and long-term trust in the product

That means prompt changes must be treated as **governed product changes**, not informal text edits.

This document defines the system for:

- prompt version naming
- prompt component versioning
- module-level release governance
- change categorization
- regression control
- evaluation and promotion standards
- change logging
- rollback rules
- experimental testing
- and future ML-assisted routing and optimization

This is one of the key documents that **protects the product from becoming generic over time.**

---

## 2. Core Versioning Principle

> A prompt is not "better" because it sounds better.
> A prompt is better only if it improves the product's outcomes under the rubric, validator system, and authenticity standard.

**Core rule**

> No prompt should be changed casually, invisibly, or without evaluable consequences.

The system should operate on this principle:

> **prompt changes are product-behavior changes**

That means every meaningful change must be:

- identifiable
- explainable
- testable
- reviewable
- reversible
- and measurable against product goals

This is how the product avoids prompt drift and protects its differentiation.

---

## 3. Strategic Role of Prompt Governance

In most AI products, prompt quality degrades over time because changes happen in a weak pattern:

- someone adds more instructions
- someone patches a bad output case
- someone tries to make it "nicer"
- someone softens a validator-triggering response
- someone adds more context
- nobody can explain what changed
- quality becomes inconsistent and generic

That is exactly what this system must prevent.

The College Admissions Edge is not trying to create "pretty good AI output."
It is trying to create:

- student-specific artifacts
- structured and ranked decision support
- authenticity-protective outputs
- better-than-free-AI reasoning
- product-consistent behavior across modules
- a system that gets **sharper** over time instead of softer

Prompt versioning is the governance layer that helps make that possible.

---

## 4. System Goals

The prompt versioning system must achieve the following.

### 4.1 Controlled Evolution
Prompt behavior must improve intentionally rather than drift.

### 4.2 Regression Visibility
The team must be able to identify when a prompt change makes output more generic, softer, flatter, less authentic, or less useful.

### 4.3 Module Consistency
Each module should evolve without losing overall product identity.

### 4.4 Reproducibility
The team must be able to trace an output back to the prompt version that produced it.

### 4.5 Rollback Readiness
Weak prompt changes must be reversible.

### 4.6 Experimentation Discipline
The system should allow controlled experimentation without creating production instability.

### 4.7 ML-Ready Evolution
Versioning data should later support learned routing, prompt selection, regression prediction, and quality optimization.

---

## 5. Governance Doctrine

The prompt system should be governed by the following doctrine.

### 5.1 Prompt Layers Are Product Components
They are not incidental instructions.
They are part of the system's controlled behavior.

### 5.2 The Product's Value Is Not "the AI"
The value is the structure, judgment, context discipline, authenticity protection, and differentiation encoded through the system.

### 5.3 Prompt Changes Must Be Attributable
If output changed, the system should be able to explain which component changed.

### 5.4 Smaller Changes Are Better Than Opaque Rewrites
Incremental evolution is easier to evaluate than large undocumented prompt churn.

### 5.5 Genericity Is a Regression
If a change increases substitution risk versus free AI, it is a meaningful product failure even if outputs remain fluent.

### 5.6 Prompting Is Not the Whole System
Prompt versioning must work in coordination with:
- context assembly
- schemas
- validators
- orchestration
- evaluation rubric
- telemetry
- and future ML-assisted quality loops

---

## 6. What Is Being Versioned

The prompt system should not be versioned as one giant string.
It should be versioned as a **set of components.**

### 6.1 Versioned Prompt Components

Each module invocation may depend on the following versioned elements:

| Component | Description |
|---|---|
| global identity prompt | Core product voice and authenticity posture |
| authenticity guard prompt | Authorship and ghostwriting protections |
| module objective prompt | What this specific module is trying to do |
| decision-rules prompt | How to rank, choose, and apply judgment |
| context formatting prompt | How to interpret and use the context bundle |
| output schema prompt | Expected output shape and field contracts |
| forbidden-patterns prompt | What is not allowed in this output |
| retry modifier prompt | Adjusted instructions for second attempt |
| fallback modifier prompt | Instructions for degraded or narrow mode |

**Rule**

> Component-level versioning is preferable to opaque full-prompt blobs because it supports traceability, debugging, regression isolation, experiment design, and targeted improvement.

### 6.2 Versioned Companion Components

Prompt changes should be tracked in relation to:

- schema version
- validator version
- context assembly version
- module orchestration version

**Why this matters**

A prompt may not be the true reason output changed.
Sometimes the real shift is:
- stronger context
- tighter validators
- changed retry logic
- different context compression
- revised schema pressure

Prompt governance should therefore be **prompt-centered but system-aware.**

---

## 7. Canonical Versioning Model

Each prompt-bearing module should carry version references across at least four dimensions:

- `module_version`
- `prompt_version`
- `schema_version`
- `validator_version`

**Recommended optional extensions:**

- `context_assembly_version`
- `orchestration_version`
- `experiment_version`

**Example:**

```
essay_feedback_module_v1.0
essay_feedback_prompt_v1.3
essay_feedback_schema_v1.1
essay_feedback_validator_v1.2
essay_feedback_context_v1.0
```

This makes output provenance inspectable.

---

## 8. Prompt Naming Convention

Prompt versions should follow a stable naming convention.

### 8.1 Recommended Format

```
<module>_<component>_v<major>.<minor>
```

**Examples:**

```
edge_snapshot_global_identity_v1.0
edge_snapshot_objective_v1.2
essay_feedback_forbidden_patterns_v1.1
supplement_angle_decision_rules_v1.3
narrative_direction_retry_modifier_v1.0
```

### 8.2 Major Version Increments

Increment the major version when a change **meaningfully alters product behavior.**

**Examples:**
- new module framing
- new authorship boundary
- major output-style shift
- meaningful change to ranking behavior
- change to the module's strategic objective
- significant anti-generic enforcement changes
- migration to substantially different prompt architecture

### 8.3 Minor Version Increments

Increment the minor version when a change is **targeted and compatible** with the current module behavior.

**Examples:**
- clearer ranking instruction
- sharper anti-generic phrasing
- improved field wording
- better distinction pressure
- tighter caution handling
- better retry instruction
- refined school-fit guardrails

### 8.4 Patch-Level Guidance

You may optionally use patch versions if operationally useful, but do not create version complexity without reason.

**Recommended use:** only when you need to track extremely small edits inside a stable minor version.

Example: `v1.2.1`

For v1, major/minor may be enough if change discipline is strong.

---

## 9. Change Classes

Every prompt change should be categorized by change type.

### 9.1 Identity Change

Affects global product voice, anti-generic tone, or authenticity posture.

**Risk level:** High

**Review requirement:** Strong review required across modules because the impact can be broad.

### 9.2 Objective Change

Affects what the module is trying to do.

**Examples:**
- changing a module from broad exploration to forced ranking
- shifting essay feedback from commentary to revision prioritization

**Risk level:** High

### 9.3 Constraint Change

Changes behavioral boundaries.

**Examples:**
- stronger anti-flattery instruction
- stronger ghostwriting prohibition
- new limits on option counts
- stronger "take a stance" requirement

**Risk level:** Medium to high depending on scope

### 9.4 Output-Shaping Change

Changes expected structure pressure or explanatory style.

**Examples:**
- tighter field-length pressure
- stronger evidence grounding requirement
- more compact explanation requests

**Risk level:** Medium

### 9.5 Retry/Fallback Change

Changes how the system behaves after weak output.

**Risk level:** Medium

### 9.6 Context-Formatting Change

Changes how approved context is presented to the model.

**Examples:**
- switching from raw story list to ranked story summary
- changing school metadata formatting
- changing draft summary framing

**Risk level:** Medium to high because it can materially affect reasoning quality

---

## 10. Prompt Registry Requirements

The system should maintain a **prompt registry** as a canonical source of truth.

Each registry entry should include:

| Field | Description |
|---|---|
| prompt component name | Stable identifier for the component |
| module | Which module this belongs to |
| version | Current version string |
| status | draft / candidate / approved / deprecated / rolled_back |
| change class | Category of change |
| owner | Responsible party |
| created date | When this version was created |
| promoted date | When this version entered production |
| prior version reference | Previous version for traceability |
| summary of change intent | Why this change was made |
| expected impact | What should improve |
| associated schema version | Companion schema version |
| associated validator version | Companion validator version |
| associated evaluation results | Review outcomes |
| rollback reference | Previous stable version if rollback is needed |

**Rule**

> No production prompt should exist without a registry entry.

---

## 11. Prompt Lifecycle States

Each prompt component should exist in one of the following states.

| State | Meaning |
|---|---|
| `draft` | Still under development. Not eligible for production. |
| `candidate` | Ready for controlled evaluation. |
| `approved` | Approved for production use. |
| `deprecated` | No longer used for new executions but retained for traceability. |
| `rolled_back` | Removed from active use due to regression or product failure. |

This lifecycle helps prevent invisible prompt mutation.

---

## 12. Change Proposal Requirements

Any meaningful prompt change should include a **change proposal**, even if lightweight.

Each proposal should define:

- module
- prompt component(s) affected
- current version
- proposed version
- problem being solved
- expected improvement
- main regression risks
- evaluation plan
- rollout plan
- rollback plan

**Rule**

> Prompt edits must have an explicit reason tied to product quality, not vague intuition.

---

## 13. Change Intent Categories

Every change proposal should identify its main intended outcome.

**Examples:**

- reduce genericity
- increase student specificity
- sharpen ranking pressure
- reduce ghostwriting drift
- improve school specificity
- improve distinctness of options
- reduce verbosity
- improve validator pass quality
- improve low-readiness degradation behavior
- improve alignment with rubric scores

This helps later analysis.

---

## 14. Evaluation Requirements Before Promotion

A prompt should not be promoted because it "seems better."
It should be promoted because it **performs better** against the product's quality standard.

### 14.1 Required Evaluation Dimensions

Before production promotion, evaluate changes against:

- student specificity
- authenticity preservation
- admissions-specific reasoning
- anti-generic performance
- decision value
- validator pass quality
- substitution risk versus free AI
- uniqueness label quality

These map directly to the evaluation rubric.

### 14.2 Required Comparison Modes

Prompt changes should be evaluated using one or more of the following:

**A. Benchmark artifact comparison**
Run the new prompt against a fixed internal benchmark set.

**B. Side-by-side human review**
Compare old vs new outputs without bias toward the newer version.

**C. Validator outcome comparison**
Check whether the change improves pass quality or reduces failure codes.

**D. Behavioral telemetry comparison**
Where enough data exists, compare user actions such as acceptance, regeneration, or abandonment.

**E. Controlled experiment**
Run a scoped experiment before full promotion.

### 14.3 Promotion Rule

A prompt version should be promoted only if it **improves or preserves** the core product moat dimensions:

- non-generic quality
- student specificity
- authenticity
- admissions-native reasoning

> A change that improves polish but weakens those dimensions should not be promoted.

---

## 15. Regression Definition

A regression is any prompt-driven change that makes the product meaningfully worse, **even if outputs remain fluent or well-structured.**

### 15.1 Regression Categories

**Genericity regression**
Output becomes more templated, broader, flatter, or more reusable across students.

**Authenticity regression**
Output becomes more polished than the student's material supports or drifts toward authorship replacement.

**Decision regression**
Output becomes less selective, less ranked, or less useful for choosing next steps.

**Admissions-logic regression**
Output becomes more like generic writing help and less like an admissions product.

**Brand regression**
Tone drifts toward chatbot softness, flattery, or canned reassurance.

**Stability regression**
Outputs become less consistent across similar inputs.

**Validator regression**
The prompt increasingly produces outputs that fail validators or require more retries.

### 15.2 Core Rule

> A prompt change that increases genericity is a serious regression, even if users initially perceive the output as "nicer."

That kind of regression is especially dangerous because it can disguise product decline.

---

## 16. Change Log Standard

Every promoted prompt change should be recorded in a structured changelog.

Each changelog entry should include:

- date
- module
- component name
- old version
- new version
- change class
- reason for change
- expected behavior shift
- observed effect after rollout
- known risks
- rollback reference if applicable

**Example format:**

```
Date: 2026-03-11
Module: narrative_direction_selection
Component: decision_rules_prompt
Old Version: v1.1
New Version: v1.2
Change Class: constraint change
Reason: Candidate outputs were too evenly framed and lacked clear recommendation pressure.
Expected Shift: Sharper ranking, stronger recommendation logic, lower substitution risk.
Observed Effect: Improved reviewer scores on decision value and reduced hedged_noncommittal_output failures.
Known Risk: Overcorrection may narrow valid alternative directions too aggressively.
```

This is the level of seriousness the system should have.

---

## 17. Rollback Rules

Rollback must be treated as a **normal product-control tool**, not as failure theater.

### 17.1 Rollback Triggers

Rollback should be considered when a new prompt version causes:

- increased genericity
- worse authenticity scores
- increased ghostwriting risk
- lower validator pass rates
- weaker student-specificity scores
- worse user acceptance or increased regeneration
- more frequent fallback behavior
- broader inconsistency across similar inputs

### 17.2 Rollback Requirements

A rollback procedure should include:

- target version to restore
- modules affected
- whether dependent versions must also revert
- telemetry review period
- artifact traceability notes
- documentation update

### 17.3 Rule

> The system should be able to identify exactly which prompt version produced which output artifacts, so rollback can be operationally meaningful rather than vague.

---

## 18. Benchmark Set Requirements

To protect quality, prompt versions should be evaluated on a **benchmark set** of representative student cases.

### 18.1 Benchmark Set Purpose

The benchmark set exists to test for:

- genericity drift
- uniqueness quality
- authenticity drift
- module consistency
- failure on thin inputs
- failure on strong inputs
- performance across narrative types
- performance across school-fit contexts
- package-level reasoning consistency

### 18.2 Benchmark Case Diversity

The benchmark set should include:

- students with strong story depth
- students with thin material
- students with common applicant profiles
- students with unusual profiles
- cases with cliché risk
- cases with overlap risk
- cases with weak school-fit evidence
- cases with high narrative promise but weak draft execution

**Rule**

> A prompt that only performs well on ideal cases is not production-ready.

---

## 19. Experimentation Framework

The system should allow controlled experimentation without allowing random drift.

### 19.1 Experiment Types

**A. Offline evaluation experiment**
Run versions against benchmark cases.

**B. Internal reviewer comparison**
Use human evaluation before user exposure.

**C. Limited production exposure**
Expose a candidate version to a small controlled segment.

**D. Module-specific experiment**
Test only one prompt component within one module.

### 19.2 Experiment Requirements

Each experiment should define:

- hypothesis
- affected module(s)
- candidate versions
- success metrics
- regression watch metrics
- decision deadline
- promotion / rollback rule

### 19.3 Rule

> Do not run experiments whose success criterion is merely "sounds better."
> Success must be tied to product metrics and rubric dimensions.

---

## 20. Prompt Provenance Requirements

Every persisted output artifact should record enough metadata to trace its provenance.

**Recommended provenance fields:**

| Field | Description |
|---|---|
| module ID | Which module produced this |
| module version | Module version at time of execution |
| prompt version(s) | All prompt component versions used |
| schema version | Schema version in effect |
| validator version | Validator version in effect |
| context assembly version | Context assembly rules in effect |
| execution timestamp | When the output was generated |
| experiment flag | Whether this was part of a controlled experiment |

This is essential for:
- debugging
- incident review
- regression analysis
- ML training quality
- prompt routing optimization later

---

## 21. Machine Learning Evolution Path

Yes — prompt versioning and governance should be designed so the system can eventually become more adaptive and intelligent.

But the right path is not: "let ML mutate prompts freely."

That would be dangerous and opaque.

The right path is: **use structured prompt governance as the backbone, then let data improve selection and optimization over time.**

### 21.1 Stage 1 — Governed Manual Versioning

v1 should rely on:
- human-authored prompt components
- explicit version tracking
- structured benchmark review
- rubric-based comparison
- validator-informed regression detection
- controlled promotion and rollback

This creates a stable base.

### 21.2 Stage 2 — Telemetry-Informed Change Prioritization

Use production data to identify where prompt changes are most needed.

**Examples:**
- modules with high substitution risk
- modules with high retry rates
- modules with low decision-value scores
- modules with repeated genericity flags
- modules with weak user follow-through

This helps prioritize improvement work.

### 21.3 Stage 3 — ML-Assisted Prompt Routing

Once enough labeled data exists, the system may use learned models to help choose:

- which prompt variant performs best for which case type
- which retry prompt is most likely to improve a specific failure class
- which context formatting style yields better student specificity
- which prompt composition patterns reduce genericity for certain module inputs

**Important rule**

> ML may assist prompt selection.
> It should not bypass version governance.

### 21.4 Stage 4 — Regression Prediction and Adaptive Optimization

At greater scale, ML may help predict:

- likely genericity risk from a new prompt change
- likely validator failure patterns
- expected user usefulness by prompt version
- likely substitution risk
- likely need for reduced-scope mode
- which student profiles benefit from which prompt variant families

This is where the system becomes increasingly intelligent without becoming uncontrolled.

---

## 22. ML Design Rule

Machine learning should improve:

- prompt selection
- routing
- evaluation prioritization
- regression detection
- prompt-context matching
- retry-strategy selection

It should **not** replace:

- product-defined authenticity boundaries
- schema contracts
- validator rules
- version traceability
- rollback discipline
- human review on high-impact changes

> The correct architecture is: **governed prompts first, learned optimization second.**

That gives you compounding improvement without losing control.

---

## 23. Anti-Generic Governance Standard

Because your biggest enemy is genericity, the prompt governance system should explicitly track **anti-generic performance** as a first-class product measure.

Each change review should ask:

- Did this increase substitution risk?
- Did this make the output more reusable across students?
- Did this soften decision pressure?
- Did this increase generic praise?
- Did this reduce distinctness?
- Did this flatten school-specific reasoning?
- Did this make the product easier to imitate with a free AI prompt?

**Rule**

> A prompt change that makes the system easier to imitate is strategically suspicious even if immediate output quality seems acceptable.

That is a real product insight and should be treated seriously.

---

## 24. Reviewer Questions for Prompt Changes

Before approving a change, reviewers should ask:

- What exact problem is this change solving?
- Is the problem actually prompt-related?
- Could the same improvement be better handled by context, schema, validator, or orchestration changes?
- Does the new version improve student specificity?
- Does it reduce genericity?
- Does it strengthen or weaken authenticity?
- Does it improve decision value?
- Does it reduce or increase substitution risk?
- Can we explain why it is better?
- Can we roll it back safely if needed?

These questions prevent random prompt tweaking from masquerading as product progress.

---

## 25. Anti-Patterns to Avoid

Do not manage prompts as:

- unversioned text in code
- giant monolithic prompt rewrites
- silent edits with no changelog
- "just add more instructions" behavior
- regressions masked by nicer tone
- prompt-first fixes when the real issue is context or validation
- black-box adaptive prompt mutation
- experiments with no benchmark or evaluation rubric
- production prompt drift with no provenance trail

These are some of the fastest ways to destroy differentiation.

---

## 26. World-Class Governance Standard

A world-class prompt governance system should do all of the following:

- treat prompts as product-control components
- make every meaningful change visible
- tie prompt changes to actual product outcomes
- detect regressions in genericity and authenticity
- preserve traceability from artifact back to version
- support rigorous rollback
- enable controlled experimentation
- create structured data for future ML-assisted optimization
- defend the product against slow drift toward commodity AI behavior

That is the standard.

---

## 27. Non-Negotiables

- Prompt changes are product changes.
- No meaningful production prompt change may be unversioned.
- No prompt should be promoted without evaluation against anti-generic, authenticity, and student-specificity standards.
- Genericity regression is a serious product regression.
- Prompt version provenance must be attached to persisted artifacts.
- Machine learning may assist optimization later, but version governance must remain explicit and controlled.
- The goal of this system is not to make the AI sound better. The goal is to make the product harder to imitate and more useful to the student.

---

## 28. Recommended Next Artifacts

Create next:

1. `AI_MODULE_REGISTRY_V1.md`
2. `QUALITY_MONITORING_DASHBOARD_SPEC_V1.md`
3. `EXAMPLE_OUTPUT_BENCHMARKS_V1.md`
4. `MODEL_PROVIDER_ABSTRACTION_SPEC_V1.md`

---

## Final Directive

The College Admissions Edge will not stay differentiated by writing one good prompt.

It will stay differentiated by building a governed system that:

- knows what quality means
- knows what generic looks like
- knows when a change helps
- knows when a change hurts
- and gets better over time without losing its identity

If prompt architecture defines *how* the system is asked to think,
if context assembly defines *what* the system is allowed to know,
if schemas define *what* the system is allowed to return,
if validators define *what* the product is willing to trust,
if orchestration defines *how* the whole engine runs,
and if the evaluation rubric defines *how* quality is judged,

then prompt versioning and changelog governance define:

> **how the product evolves without becoming generic.**

And that is exactly the discipline a real moat requires.
