# CONTEXT_ASSEMBLY_SPEC_V1
## The College Admissions Edge
### v1 Context Assembly, Selection, Compression, and Readiness Specification

---

## 1. Purpose

This document defines how The College Admissions Edge assembles, filters, prioritizes, compresses, and prepares context for AI-powered module execution in v1.

It exists to answer one of the most important product questions in the system:

> What information should the product give the reasoning layer, in what form, in what priority order, and under what constraints?

This question is foundational because differentiated AI products are not built only through prompts.
They are built through **context discipline.**

The model can only reason well on what it is given.
If the product gives it noisy, bloated, stale, contradictory, or weakly structured context, the result will drift toward generic output no matter how strong the prompt is.

This document defines the system by which context is:

- collected
- classified
- prioritized
- assembled
- compressed
- versioned
- freshness-checked
- role-filtered
- module-matched
- and prepared for validation-aware generation

This is not a retrieval note.
It is not a prompt helper.
It is part of the core product intelligence architecture.

---

## 2. Core Context Principle

The College Admissions Edge should never operate on the principle of:

> "give the model everything and hope it figures out what matters."

Instead, the system should operate on this principle:

> **Context is a curated decision substrate, not a text dump.**

That means context assembly must be:

- intentional
- bounded
- relevance-ranked
- workflow-aware
- freshness-aware
- authenticity-protective
- and eventually learnable through product data

**Core rule**

> The quality of an output depends not only on the model or prompt, but on whether the product delivered the right evidence, in the right shape, at the right time.

---

## 3. Strategic Role of Context Assembly

Context assembly is one of the product's clearest opportunities for differentiation.

Free AI tools usually rely on one of four weak context patterns:

1. the user pastes everything manually
2. the model sees only the latest message
3. the system stores everything but selects poorly
4. large context is passed without workflow structure

The College Admissions Edge should behave differently.

The system should feel like it understands:

- where the student is in the application journey
- which prior artifacts matter now
- which story material is strong vs weak
- what has already been selected
- what should not be repeated
- when the evidence is too thin for strong recommendations
- when old context should be excluded
- when context should be summarized instead of passed raw

This is one of the most important foundations for a product that feels like **intelligent admissions infrastructure**, not a chat wrapper.

---

## 4. System Goals

The context assembly layer must achieve the following.

### 4.1 Relevance Discipline
Pass only context that materially improves the current module decision.

### 4.2 Workflow Continuity
Preserve meaningful continuity across discovery, direction, outlining, drafting, and package-level reasoning.

### 4.3 Authenticity Protection
Prefer context that reflects the student's actual words, actual stories, and actual choices.

### 4.4 Noise Suppression
Exclude context that dilutes judgment, introduces contradiction, or encourages generic averaging.

### 4.5 Freshness Integrity
Prefer current artifacts over stale or superseded ones.

### 4.6 Structured Reasoning Support
Where possible, supply structured internal representations rather than large raw text payloads.

### 4.7 ML-Ready Architecture
Design context selection so it can eventually be improved by learned ranking, context scoring, and retrieval optimization without breaking interpretability or control.

---

## 5. Context Assembly Doctrine

The system should be designed around the following doctrine.

### 5.1 Context Is Not Memory
Not all stored product data should be eligible for current generation.

Stored state and active context are different things.

### 5.2 More Context Is Often Worse Context
Large context windows do not solve product reasoning problems.
They often hide them.

### 5.3 Current Workflow State Outranks Historical Breadth
The most current, task-relevant artifact should usually outrank broad historical context.

### 5.4 Structured Summaries Are Often Stronger Than Raw Text
The system should not over-rely on raw long-form material when a cleaner intermediate representation exists.

### 5.5 Missing Context Is Sometimes the Right Answer
If strong output requires context that does not exist, the system should degrade honestly rather than infer through genericity.

### 5.6 Context Assembly Must Remain Inspectable
Even if future ML improves ranking or selection, the system should remain explainable enough for product debugging and quality review.

---

## 6. Context Architecture Overview

Context assembly should be implemented as a pipeline with the following stages:

1. **Source discovery** — Identify all potentially relevant context sources for the invoked module.
2. **Eligibility filtering** — Remove sources that are not allowed, not current, not role-appropriate, or not materially relevant.
3. **Priority ordering** — Rank sources by module relevance and workflow significance.
4. **Conflict resolution** — Detect stale, contradictory, superseded, or overlapping artifacts.
5. **Compression and normalization** — Convert long-form material into structured internal summaries where appropriate.
6. **Bundle construction** — Assemble the final module-specific context package.
7. **Readiness scoring** — Evaluate whether the resulting bundle is strong enough for generation.
8. **Fallback or escalation if weak** — If context quality is too low, narrow the task, ask for more input, or degrade safely.

This should be treated as **product infrastructure**, not prompt-prep glue code.

---

## 7. Context Source Categories

The system should classify all context into explicit source categories.

### 7.1 Stable Profile Context
Relatively durable user state that changes infrequently.

**Examples:**
- grade level
- broad academic interests
- tentative major interests
- baseline extracurricular profile
- broad school preference signals

**Characteristics:**
- high persistence
- medium relevance
- rarely the top-priority source for a writing module
- useful for background framing, not dominant reasoning

---

### 7.2 Discovery Context
Inputs gathered during early narrative discovery.

**Examples:**
- onboarding long-form responses
- challenge/growth reflections
- values prompts
- identity prompts
- early self-description responses
- discovery interviews or structured questionnaire responses

**Characteristics:**
- medium to high value during early modules
- may become secondary once richer story assets and draft artifacts exist
- often benefits from compression into signal summaries

---

### 7.3 Story Asset Context
Structured story inventory and metadata.

**Examples:**
- Story Vault entries
- story category
- emotional or reflective depth tags
- strength tags
- usage state
- evidence of narrative tension
- underdeveloped story flags

**Characteristics:**
- one of the highest-value context types in the product
- often more important than generic profile information
- should be strongly structured and queryable

---

### 7.4 Writing Artifact Context
Current writing state for a given essay project.

**Examples:**
- selected narrative direction
- selected outline
- draft versions
- feedback summaries
- unresolved revision priorities
- draft-specific risk tags

**Characteristics:**
- highest-priority source for feedback and refinement modules
- freshness-sensitive
- should outrank older discovery artifacts when directly relevant

---

### 7.5 Application Context
School- and application-specific context.

**Examples:**
- institution
- supplement prompt
- prompt category
- application round or type
- package state
- other active essays
- known overlap signals

**Characteristics:**
- essential for supplement and package-level reasoning
- contextual rather than autobiographical
- can be weak if school data is shallow or generic

---

### 7.6 Relationship and Role Context
Context defining who is interacting with the product and what boundaries apply.

**Examples:**
- student vs supporting adult
- parent visibility limits
- student-owned workflow state
- summary-only mode
- authorship-sensitive permissions

**Characteristics:**
- not usually "reasoning material"
- essential for access control and behavior shaping
- must be enforced before the model call, not after

---

### 7.7 Derived Internal Context
System-generated internal artifacts created from prior user material.

**Examples:**
- onboarding signal summary
- ranked theme summary
- strongest-story cluster summary
- unresolved revision goals
- package theme map
- overlap summary
- context readiness score

**Characteristics:**
- critical for product differentiation
- should be preferred over repeated raw text when high-quality
- must remain traceable to source material
- should never hallucinate detail not supported by upstream evidence

---

## 8. Context Object Model

To keep the system controlled and ML-ready, each context artifact should carry metadata beyond raw content.

Each context object should ideally contain:

| Field | Description |
|---|---|
| `context_id` | Unique identifier for the context object |
| `context_type` | Category (stable_profile, discovery, story_asset, etc.) |
| `source_artifact_id` | ID of the upstream source artifact |
| `source_version` | Version of the upstream source |
| `created_at` | Creation timestamp |
| `updated_at` | Last update timestamp |
| `workflow_stage` | Stage at which this artifact is most relevant |
| `relevance_scope` | Which modules this artifact is eligible for |
| `freshness_state` | current / stale / superseded |
| `selection_priority` | Priority rank for bundle inclusion |
| `compression_state` | raw / compressed / summarized |
| `role_visibility` | student / supporting_adult / all |
| `content_payload` | The actual context content |

This metadata layer matters because context selection becomes much more reliable when sources are treated as **typed artifacts** rather than blobs.

---

## 9. Context Precedence Rules

When multiple sources are eligible, the system should prioritize them according to module purpose.

**Global precedence order**

Unless module-specific overrides apply, prioritize in this order:

1. current module artifact target inputs
2. explicitly selected user choices
3. current writing artifact context
4. strongest story asset context
5. current application context
6. derived internal summaries
7. discovery context
8. stable profile context
9. older historical outputs only if directly useful

**Interpretation**

This ordering reflects a core product belief:

> current, chosen, decision-relevant material should outrank broad background.

---

## 10. Freshness and Supersession Rules

Freshness is not just a timestamp issue.
It is a **workflow truth** issue.

### 10.1 Freshness Principle
> The most recent artifact is not always the best artifact,
> but stale artifacts should not silently dominate current reasoning.

### 10.2 Superseded Artifact Examples
- an old draft that has been replaced by a newer draft
- an early narrative lane no longer selected
- an outdated feedback artifact whose core issues were already resolved
- an older school context summary that has been updated

### 10.3 Freshness Rules
- selected artifacts outrank unselected alternatives
- latest accepted draft outranks prior draft versions
- unresolved feedback outranks resolved feedback
- current package state outranks old package assumptions
- context objects marked stale or superseded should not enter active context unless explicitly needed for comparison

### 10.4 Historical Exceptions
Historical artifacts may still be included if the task explicitly requires comparison, such as:
- overlap across essay versions
- revision progress tracking
- detecting drift from original direction
- explaining why a previously recommended lane was abandoned

---

## 11. Conflict Resolution Rules

Context may conflict.
The system must not blindly merge contradictions.

### 11.1 Common Conflict Types
- outdated selection vs current selection
- school context mismatch
- contradictory direction states
- duplicate story records with different metadata
- older feedback priorities conflicting with current draft reality
- parent-entered summary conflicting with student-entered detail

### 11.2 Resolution Hierarchy
When conflicts arise, resolve in this order:

1. explicit current student selection
2. latest workflow-bound artifact
3. latest validated derived summary
4. latest direct student-authored material
5. older or indirect summaries

### 11.3 Rule
> When conflict cannot be safely resolved, the context bundle should be marked as lower readiness and generation should narrow or degrade.

---

## 12. Context Inclusion Rules by Module

Each module should have a default context bundle definition.

### 12.1 Edge Snapshot

**Primary sources:**
- onboarding signal summary
- discovery responses
- selected interests and activities

**Secondary sources:**
- broad school preferences
- major preference notes

**Exclude unless necessary:**
- old draft text
- detailed supplement context
- outdated Story Vault tags if discovery has materially evolved

**Assembly goal:** Surface strongest likely themes and narrative lanes from early evidence without overfitting to incomplete writing artifacts.

---

### 12.2 Story Vault Analysis

**Primary sources:**
- Story Vault entries
- story strength tags
- usage state
- derived story summaries if available

**Secondary sources:**
- snapshot themes
- discovery signal summary

**Exclude unless necessary:**
- long draft text
- unrelated school prompts
- low-signal broad profile context

**Assembly goal:** Understand what story material actually carries narrative and reflective value.

---

### 12.3 Narrative Direction Selection

**Primary sources:**
- strongest story asset context
- snapshot outputs
- selected discovery summaries

**Secondary sources:**
- academic and identity profile context
- prior direction experiments if relevant

**Exclude unless necessary:**
- stale direction candidates
- low-quality historical outputs
- unrelated supplement prompts

**Assembly goal:** Force real comparison among the strongest plausible personal statement lanes.

---

### 12.4 Outline Generation

**Primary sources:**
- selected direction
- strongest supporting stories
- relevant reflection notes

**Secondary sources:**
- prior structure notes
- unresolved concerns about cliché or thin reflection

**Exclude unless necessary:**
- broad onboarding text
- unrelated story inventory
- school-specific supplement context

**Assembly goal:** Convert a chosen lane into structural options without dragging in irrelevant biography.

---

### 12.5 Essay Feedback

**Primary sources:**
- current draft
- selected direction
- selected outline
- unresolved revision priorities

**Secondary sources:**
- strongest relevant story context
- prior feedback summary if unresolved

**Exclude unless necessary:**
- early onboarding material not tied to the draft
- general school preference context
- unrelated Story Vault entries

**Assembly goal:** Diagnose the draft in its current intended form, not in the abstract.

---

### 12.6 Supplement Angle Suggestion

**Primary sources:**
- institution
- supplement prompt
- prompt category
- personal statement summary or dominant thesis
- strongest non-overlapping story material

**Secondary sources:**
- broader school list context
- application package theme map

**Exclude unless necessary:**
- old unrelated drafts
- non-applicable profile details
- stale school metadata

**Assembly goal:** Produce school-aware, prompt-aware, package-aware angle recommendations.

---

### 12.7 Overlap Warning

**Primary sources:**
- personal statement summary or draft
- relevant supplement summaries or drafts
- package theme map

**Secondary sources:**
- selected direction
- dominant story usage map

**Exclude unless necessary:**
- raw onboarding text
- broad profile information
- unrelated school context

**Assembly goal:** Compare narrative payload across artifacts rather than accumulating unrelated life context.

---

## 13. Context Compression Rules

Compression is one of the product's strongest design levers.

The goal is not to shorten context for convenience.
The goal is to convert raw material into **higher-signal, lower-noise** internal representations.

### 13.1 Compression Principles

**Preserve meaning, reduce waste**
Compression should remove noise, not flatten nuance.

**Preserve student truth**
Compression must not embellish the student's material.

**Preserve decision utility**
Compressed context should still help the target module perform better than raw text alone.

**Preserve traceability**
Compressed summaries should remain attributable to source artifacts.

### 13.2 What Should Usually Be Compressed
- long onboarding responses
- multiple story entries with overlapping themes
- prior feedback history
- multi-draft revision history
- school research notes
- package-level thematic summaries

### 13.3 What Should Often Remain Raw
- current draft under review
- current supplement prompt
- selected short story excerpt if scene-level reasoning matters
- exact user-selected direction label and summary

### 13.4 Recommended Compressed Representations

**Onboarding signal summary** — A structured artifact containing:
- strongest themes
- recurring motivations
- likely story lanes
- major missing details
- identity-sensitive caution flags

**Story cluster summary** — A structured artifact containing:
- story groups
- highest narrative energy stories
- overused story types
- reflection-rich vs résumé-heavy split

**Revision state summary** — A structured artifact containing:
- unresolved priorities
- already-addressed issues
- biggest remaining weakness
- risk tags

**Package theme map** — A structured artifact containing:
- dominant current themes
- where each theme appears
- overlap pressure areas
- underrepresented dimensions

---

## 14. Context Readiness Model

Not every assembled bundle is equally strong.

The system should **score context readiness** before generation.

### 14.1 Context Readiness Purpose
A readiness score helps determine whether the module should:
- proceed normally
- proceed in reduced scope
- retry assembly with different weighting
- return `needs_more_input`
- ask for stronger source material

### 14.2 Readiness Dimensions
Each assembled context bundle should be evaluated on:

| Dimension | Description |
|---|---|
| **relevance** | How closely the context matches the task |
| **specificity** | Whether the context includes concrete rather than abstract signal |
| **coverage** | Whether enough evidence exists for the module |
| **freshness** | Whether current artifacts dominate stale ones |
| **coherence** | Whether the bundle is internally non-contradictory |
| **authenticity signal strength** | Whether the material reflects real student material rather than thin summaries only |

### 14.3 Readiness States

| State | Meaning |
|---|---|
| `high_readiness` | Enough task-relevant, current, specific evidence exists for confident differentiated output |
| `medium_readiness` | Enough exists to proceed, but output may need narrower scope or stronger caution behavior |
| `low_readiness` | The bundle is too thin, stale, conflicting, or abstract for high-quality output |

---

## 15. Needs-More-Input Triggers from Context Assembly

Context assembly should be allowed to **stop generation before the model is called** when the bundle is too weak.

### 15.1 Examples of Strong Pre-Generation Triggers
- no anchor story exists for direction selection
- current draft is too fragmentary for essay feedback
- school prompt exists but no student material is available for grounded angle suggestion
- overlap comparison lacks enough artifact coverage
- only generic discovery context exists with no concrete narrative evidence

### 15.2 Rule
> The system should prefer a truthful "need stronger input" state over a generic output built from weak context.

---

## 16. Authenticity Preservation Rules in Context Assembly

Authenticity starts before generation.

If the wrong context is fed into the system, the output will drift toward artificial polish or false coherence.

### 16.1 Authenticity-First Source Preference
Prefer, in descending order:

1. direct student-authored material
2. selected student choices
3. structured summaries derived from student material
4. advisor or parent summary context only where permitted and clearly bounded
5. inferred context only where tightly constrained

### 16.2 Authenticity Risk Patterns
- over-reliance on polished derived summaries with no raw student anchor
- parent-entered framing replacing student voice
- system summaries that overstate insight not clearly present upstream
- repeated compression that removes tension, ambiguity, or specificity

### 16.3 Rule
> The product must not assemble context in a way that silently upgrades the student's voice into something more polished than their material supports.

---

## 17. Role-Based Context Boundaries

The system must respect who is using the feature.

### 17.1 Student Mode
Student-facing modules may use the full permitted student-owned context graph.

### 17.2 Supporting Adult Mode
Parent or support-user experiences should be limited to approved summary layers and should not expose student-private reflective content beyond allowed scope.

### 17.3 Advisor or Reviewer Mode
If such a mode exists later, context access should be explicit and permission-bound.

### 17.4 Rule
> Role filtering happens before active context assembly, not after generation.

---

## 18. Machine Learning Evolution Path

Yes — this layer should absolutely be built to become more intelligent over time.

But the system should evolve in a disciplined sequence.

### 18.1 Stage 1 — Deterministic Context Assembly
v1 should begin with:
- rule-based inclusion and exclusion
- module-specific source maps
- freshness rules
- precedence rules
- simple readiness scoring
- structured summary generation

This creates stable product behavior.

### 18.2 Stage 2 — Heuristic Weighting
Next, add scoring signals such as:
- source relevance weight
- story usefulness score
- draft salience score
- overlap pressure score
- school-context confidence
- unresolved issue relevance

These remain interpretable and product-controlled.

### 18.3 Stage 3 — Model-Assisted Context Ranking
Later, use model-assisted or learned scoring to improve:
- which stories are most relevant to a prompt
- which prior feedback items still matter
- which context bundle produces the strongest downstream outcomes
- which summary forms outperform raw text
- when compressed context should be replaced by raw excerpts

### 18.4 Stage 4 — Learned Context Optimization
At scale, trained internal systems can help predict:
- best context bundle size for each module
- strongest context mix for recommendation quality
- when to ask for more student detail
- which context patterns correlate with user trust, acceptance, and low regeneration rates
- which artifacts become stale fastest

---

## 19. ML Design Rule

Machine learning should improve selection, weighting, readiness scoring, and retrieval quality.

It should **not** become a black-box replacement for product control.

The right long-term architecture is:

- **rules** define hard boundaries
- **metadata** defines inspectable context objects
- **heuristics** provide structured scoring
- **learned systems** improve ranking and bundle quality over time

That gives you a system that can become increasingly intelligent without becoming generic or opaque.

---

## 20. Suggested Context Scoring Model

For v1, each eligible context object may be assigned internal scores such as:

| Score | Description |
|---|---|
| `module_relevance_score` | How relevant is this to the active module |
| `freshness_score` | How current is this artifact |
| `specificity_score` | How concrete vs abstract is the content |
| `authenticity_signal_score` | How closely tied to real student material |
| `selection_priority_score` | Priority rank for inclusion |
| `conflict_risk_score` | Risk of contradiction with other bundle members |
| `compression_quality_score` | Quality of compression if applicable |

These scores can initially be heuristic.
Later they can be refined through ML.

**Important rule**

> High aggregate score should not override hard exclusions.

For example: a highly relevant but role-ineligible context object must still be excluded.

---

## 21. Context Bundle Construction Rules

When building the final bundle, the system should:

- include required primary context
- include only necessary secondary context
- prefer compressed summaries for broad background
- preserve raw text for immediate target artifacts
- keep stale context out unless comparison is necessary
- record which artifacts entered the bundle
- record readiness assessment and key exclusions

This auditability matters for debugging and long-term ML evaluation.

---

## 22. Context Exclusion Rules

The system should explicitly exclude:

- superseded drafts unless comparison is required
- stale school context
- unrelated story assets
- resolved feedback items unless historical tracking is relevant
- parent summaries that overstep role permissions
- broad profile facts with no effect on the current module
- duplicated context in both raw and compressed form unless both are intentionally needed

**Rule**

> Unnecessary context is not harmless.
> It actively reduces output sharpness.

---

## 23. Observability Requirements

To improve context assembly over time, log:

- module invoked
- context bundle composition
- included context IDs
- excluded context IDs and reasons
- readiness level
- context token size or equivalent payload size
- compressed vs raw ratio
- stale-context suppression events
- retry or fallback caused by context weakness
- downstream validator outcomes
- user regeneration behavior
- user selection behavior where relevant

This creates the foundation for learned context optimization later.

---

## 24. Human Review Questions for Context Quality

When evaluating whether context assembly is working, reviewers should ask:

- Did the bundle include the right artifacts?
- Did it include too much?
- Did it omit the one artifact that clearly mattered most?
- Did stale context distort the output?
- Did compression preserve useful nuance?
- Did the bundle feel anchored in student truth?
- Would a narrower bundle have produced a sharper result?
- Was the system right to stop and ask for more input?

This review discipline matters before ML is introduced.

---

## 25. Anti-Patterns to Avoid

Do not build context assembly as:

- "include everything available"
- last-message-only reasoning
- memory masquerading as relevance
- raw text dumping
- stale artifact accumulation
- summary-over-summary-over-summary with no source anchor
- hidden role leakage
- prompt-first context design instead of workflow-first context design
- black-box retrieval that cannot be debugged

These are common reasons AI products feel generic even when the prompts look sophisticated.

---

## 26. World-Class Context Assembly Standard

A world-class context system should do all of the following:

- assemble only what materially matters
- preserve continuity without dragging dead history forward
- privilege student-authored truth
- compress wisely instead of blindly
- know when evidence is too weak
- know when a prior choice should dominate
- support ranking and validation downstream
- remain inspectable by the product team
- become smarter over time through structured signals and eventually ML-assisted selection

This is the standard that turns context into product intelligence.

---

## 27. Non-Negotiables

- Context assembly must be **workflow-driven**, not memory-driven.
- More context is not inherently better.
- Current selected artifacts must outrank broad historical material.
- Derived summaries must remain traceable to authentic source material.
- The system must prefer honesty about weak context over generic output.
- Role filtering must happen before the generation layer.
- The architecture must remain open to ML-assisted context ranking and readiness scoring without surrendering control or interpretability.

---

## 28. Recommended Next Artifacts

Create next:

1. `AI_EVALUATION_RUBRIC_V1.md`
2. `AI_SERVICE_ORCHESTRATION_V1.md`
3. `PROMPT_VERSIONING_AND_CHANGELOG_V1.md`
4. `AI_MODULE_REGISTRY_V1.md`

---

## Final Directive

In The College Admissions Edge, context is not just input.

It is one of the deepest control layers in the product.

Prompting matters.
Validation matters.
Schemas matter.

But context assembly determines whether the reasoning layer is operating on:

- truth or noise
- signal or clutter
- current reality or stale drift
- authentic student material or synthetic abstraction

If prompt architecture defines *how* the system is asked to think,
and validator architecture defines *what* the product is willing to trust,
then context assembly defines:

> **what the system is allowed to know before it makes a judgment.**

That is one of the deepest sources of product differentiation you can build.
