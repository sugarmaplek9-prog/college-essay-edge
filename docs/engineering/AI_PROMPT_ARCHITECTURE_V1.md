# AI_PROMPT_ARCHITECTURE_V1

## The College Admissions Edge

## v1 AI Prompt, Context, Output, and Validation Architecture

## 1. Purpose

This document defines the production AI architecture for v1 of **The College Admissions Edge**.

It translates the standards established in `AI_OUTPUT_STANDARDS_V1.md` into an engineer-ready system for how AI outputs are triggered, framed, contextually grounded, generated, validated, ranked, constrained, and delivered inside the product.

This document exists to ensure that the AI layer is:

* productized rather than chat-like
* context-aware rather than prompt-only
* admissions-specific rather than general-purpose
* structurally reliable rather than freeform
* brand-consistent rather than model-default
* authenticity-protective rather than ghostwriting-oriented

This is one of the highest-leverage architecture documents in the product.

It governs:

* prompt layering
* context assembly
* module-specific AI flows
* output schemas
* ranking and prioritization behavior
* validator rules
* fallback rules
* anti-generic constraints
* implementation boundaries between application logic and model behavior

This document is not a prompt collection.
It is not a vendor playbook.
It is not an API reference.

It is the operating architecture for how The College Admissions Edge turns foundation-model capability into a differentiated admissions product.

---

## 2. Foundational architecture principle

The model should never behave like a general-purpose assistant dropped directly into the interface.

Every AI interaction in The College Admissions Edge must be treated as:

**a bounded product task with controlled context, explicit objective, structured output requirements, and post-generation enforcement.**

That distinction is foundational.

The product is not:
“ask AI a question and display the answer.”

The product is:
“assemble the right context, define the right admissions-specific task, require a constrained artifact, validate it, and only then deliver it to the user.”

### Core rule

The user should never feel that the app is “just sending my text to ChatGPT and pasting back a nicer answer.”

---

## 3. Product-level system goals

The AI architecture must achieve all of the following:

### 3.1 Product differentiation

Outputs must feel more structured, sharper, and more context-aware than free general AI.

### 3.2 Authenticity preservation

The system must help students sound more like themselves, not less.

### 3.3 Admissions-native reasoning

The system must reason like an admissions product, not like a generic writing tutor.

### 3.4 Workflow continuity

Each module must understand where the student is in the broader application journey.

### 3.5 Controlled quality

No raw model output should be trusted without structure and validation.

### 3.6 Reliable UI mapping

Outputs must map cleanly into product components.

### 3.7 Safe degradation

When context is weak, contradictory, or insufficient, the system must fail safely rather than fabricate quality.

### 3.8 Brand consistency

Every module must feel unmistakably like The College Admissions Edge, not like the model’s default style.

---

## 4. High-level architecture model

Each AI-powered feature in the product should follow this sequence:

1. **Trigger**
   A product event requests AI assistance.

2. **Context assembly**
   Relevant structured and text context is gathered.

3. **Context filtering and compression**
   Only the necessary signal is passed to the model.

4. **Task framing**
   The system defines the exact product task.

5. **Prompt layering**
   The generation call uses layered instructions, not one monolithic prompt.

6. **Structured generation**
   The model is asked to return schema-shaped output.

7. **Validation**
   Output is checked against schema, quality constraints, and forbidden patterns.

8. **Post-processing**
   Output may be ranked, trimmed, normalized, or tagged.

9. **Fallback if needed**
   If quality is insufficient, the system retries, simplifies, or degrades gracefully.

10. **UI delivery**
    Only validated product-ready output reaches the interface.

---

## 5. Architecture layers

The prompt system should be composed of five layers.

## 5.1 Layer 1 — Global brand and product identity layer

This layer encodes:

* product identity
* non-generic behavior
* ghostwriting boundary
* authenticity standards
* anti-chatbot rules
* tone discipline

This layer is shared across all modules.

### Function

It ensures that every downstream output still sounds like The College Admissions Edge.

### Responsibilities

* forbid final-submission ghostwriting
* enforce student-authorship model
* enforce productized behavior over open-ended assistant behavior
* enforce structured prioritization and ranking
* discourage generic praise and filler

---

## 5.2 Layer 2 — Module objective layer

This layer defines the job of the current module.

Examples:

* Edge Snapshot is identifying strongest themes and likely narrative lanes
* Story Vault analysis is extracting the strongest story signals
* Essay feedback is diagnosing narrative and reflection weaknesses
* Supplements is finding school-specific angles and overlap risk

### Function

It tells the model what specific product job it is performing now.

### Rule

Each module should have a distinct objective definition, not just a reused general writing prompt.

---

## 5.3 Layer 3 — Context layer

This layer contains user-specific and workflow-specific context.

Examples:

* onboarding responses
* snapshot results
* story entries
* selected narrative direction
* current draft text
* supplement prompt text
* institution metadata
* school list context
* application type

### Function

It grounds the output in actual user-specific product state.

### Rule

Only relevant context should be included. More context is not always better.

---

## 5.4 Layer 4 — Output contract layer

This layer defines the required structure of the result.

Examples:

* strongest_themes[]
* direction_candidates[]
* risks[]
* next_steps[]
* overlap_level
* revision_priorities[]

### Function

It forces the model to generate product artifacts, not chat responses.

### Rule

Outputs should be shaped by the UI contract, not by model improvisation.

---

## 5.5 Layer 5 — Constraint and validator layer

This layer defines:

* forbidden behaviors
* minimum specificity rules
* maximum count rules
* style restrictions
* fallback triggers

### Function

It protects the product from generic, bloated, off-brand, or unsafe output.

---

## 6. Context architecture

## 6.1 Context categories

The system should treat context as belonging to these categories:

### A. Stable profile context

Relatively durable user state.
Examples:

* grade
* academic profile
* interests
* baseline school preferences

### B. Discovery context

Narrative discovery inputs.
Examples:

* onboarding long-form answers
* snapshot result themes
* challenge and reflection responses

### C. Story asset context

Structured story material.
Examples:

* Story Vault entries
* story categories
* story strength tags
* story usage state

### D. Writing context

Current writing state.
Examples:

* selected narrative direction
* selected outline
* personal statement draft
* supplement draft
* essay feedback history

### E. Application context

School-specific and workflow-specific context.
Examples:

* institution name
* prompt text
* application type
* school list state
* deadlines summary

### F. Relationship and role context

Who is using the feature and what role restrictions apply.
Examples:

* student vs supporting adult
* student-owned workflow vs summary-only workflow

---

## 6.2 Context inclusion rules

Only include context that improves the current product decision.

### Include context when it changes the answer meaningfully

For example:

* essay feedback should know the chosen direction and outline
* supplement angle suggestion should know school + prompt + personal statement theme
* overlap checker should know personal statement + supplement set

### Do not include context just because it exists

Excess irrelevant context increases:

* token waste
* incoherence
* generic averaging behavior
* contradictory reasoning

---

## 6.3 Context precedence rules

When context conflicts or overload exists, prioritize in this order:

1. current module artifact
2. explicitly selected user choices
3. most relevant narrative context
4. stable onboarding/profile context
5. historical outputs only if directly useful

### Example

For essay feedback, current draft text outranks old snapshot summaries.

---

## 6.4 Context compression rules

Long-form user text should not always be passed raw.

The system should often compress upstream context into structured internal summaries before generation.

Examples:

* onboarding can be summarized into signal fields
* Story Vault can be summarized into strongest/weakest story clusters
* prior essay feedback can be reduced to unresolved revision points

### Rule

Use structured intermediate representations wherever possible.
This is one of the strongest ways to differentiate from “dump everything into the model.”

---

## 7. Prompt architecture pattern

Every module prompt should follow a common design pattern.

## 7.1 Canonical structure

1. **System identity block**
   Who the product is and how it should think.

2. **Module objective block**
   What this specific generation task is trying to do.

3. **Context block**
   Structured relevant user/application data.

4. **Decision rules block**
   How to prioritize, rank, and constrain output.

5. **Output schema block**
   Required return shape.

6. **Forbidden patterns block**
   What not to do.

### Rule

Avoid one giant prompt paragraph.
Prompts should be modular, inspectable, and versionable.

---

## 7.2 Prompt component design standard

Each module should have reusable prompt fragments rather than a single hardcoded prompt string.

Recommended components:

* `global_identity_prompt`
* `authenticity_guard_prompt`
* `module_objective_prompt`
* `context_formatter`
* `output_schema_prompt`
* `forbidden_patterns_prompt`
* `fallback_retry_prompt`

### Benefit

This makes the system:

* maintainable
* testable
* versionable
* consistent across modules

---

## 8. Global prompt layer requirements

The shared system layer should encode these principles:

### 8.1 Product identity

The system is a structured admissions-writing and planning intelligence engine.

### 8.2 Anti-generic behavior

The system must prefer sharper prioritization, stronger constraints, and admissions-specific judgment.

### 8.3 Anti-flattery behavior

The system must avoid generic praise and empty encouragement.

### 8.4 Ghostwriting prohibition

The system must not generate final submission-ready essays or supplements framed as completed answers.

### 8.5 Authenticity preference

The system must prefer real specificity, honest reflection, and narrative tension over polish inflation.

### 8.6 Product artifact preference

The system must return structured artifacts, not freeform conversation.

---

## 9. Module architecture specifications

# 9.1 Edge Snapshot architecture

## Objective

Infer strongest likely themes, directions, and gaps from student onboarding/discovery context.

## Input context

* onboarding signal summary
* selected interests / activities
* challenge / growth / identity answers
* school preference summary if relevant

## Prompt emphasis

* identify strongest likely narrative assets
* rank top themes
* identify missing ingredients
* avoid generic personality summaries

## Output schema

* `strongest_themes[]`
* `direction_candidates[]`
* `missing_elements[]`
* `summary`

## Validation focus

* at least 2–3 meaningful themes
* directions are distinct
* no horoscope-like traits list
* no generic “hardworking/resilient/passionate” filler

---

# 9.2 Story Vault analysis architecture

## Objective

Identify the strongest story assets and latent narrative patterns from saved story material.

## Input context

* story entries
* categories
* strength tags
* usage tags
* snapshot themes if helpful

## Prompt emphasis

* cluster story patterns
* detect narrative energy
* separate résumé content from reflective content
* identify underused strong material

## Output schema

* `strongest_story_candidates[]`
* `theme_clusters[]`
* `underused_angles[]`
* `weak_or_flat_material[]`
* `next_recommendation`

## Validation focus

* cluster names are meaningful
* recommended stories are evidence-backed
* weak material is explained, not just labeled weak

---

# 9.3 Narrative direction selection architecture

## Objective

Help the student select the strongest personal statement lane.

## Input context

* onboarding signal summary
* snapshot themes
* strongest Story Vault material
* prior essay project state if any

## Prompt emphasis

* generate 2–4 genuinely distinct narrative lanes
* rank them
* explain strengths and risks
* identify likely cliché or thin-reflection risk

## Output schema

* `direction_candidates[]` with:

  * `title`
  * `summary`
  * `why_strong`
  * `risk`
  * `rank`
* `recommended_direction_id`

## Validation focus

* directions are not near-duplicates
* a clear strongest recommendation exists
* weaker directions are not falsely framed as equally strong

---

# 9.4 Outline generation architecture

## Objective

Transform a chosen direction into strong structural options.

## Input context

* selected direction
* top supporting story material
* snapshot/Story Vault signals as needed

## Prompt emphasis

* structural logic, not essay prose
* alternative movement patterns
* opening tension, internal movement, reflection arc, ending direction

## Output schema

* `outline_options[]`

  * `label`
  * `opening_move`
  * `core_tension`
  * `reflection_path`
  * `ending_direction`
  * `why_this_structure_works`

## Validation focus

* max 2–3 options
* options differ meaningfully
* no five-paragraph essay template behavior

---

# 9.5 Essay feedback architecture

## Objective

Provide high-signal critique that improves the essay without writing it for the student.

## Input context

* current draft
* selected direction
* selected outline
* strongest relevant story context
* prior unresolved revision goals if present

## Prompt emphasis

* narrative quality diagnosis
* reflection diagnosis
* cliché detection
* specificity diagnosis
* strongest revision priorities first

## Output schema

* `what_is_working[]`
* `what_is_weak[]`
* `what_is_missing[]`
* `next_steps[]`
* `revision_priorities[]`
* optional `risk_tags[]`

## Validation focus

* feedback is specific to the actual draft
* no generic praise block
* no full rewrite behavior
* revision priorities are ranked

---

# 9.6 Supplement angle suggestion architecture

## Objective

Recommend prompt- and school-specific angles that strengthen the application package.

## Input context

* institution name and metadata
* supplement prompt text
* prompt category
* personal statement direction/summary
* Story Vault strongest material
* existing supplement set if useful

## Prompt emphasis

* school/prompt fit
* differentiated angles
* angle-to-story fit
* avoid repeating personal statement thesis lazily

## Output schema

* `recommended_angles[]`

  * `angle_title`
  * `why_it_fits`
  * `supporting_story_material`
  * `caution_note`
  * `rank`

## Validation focus

* recommendations are school/prompt aware
* not just generic brainstorm prompts
* includes caution when fit is weak or repetitive

---

# 9.7 Overlap warning architecture

## Objective

Protect the overall application from repeating the same narrative payload.

## Input context

* personal statement draft or summary
* supplement draft
* other supplement summaries/drafts as needed
* dominant themes from current application state

## Prompt emphasis

* detect thematic repetition, not just string similarity
* distinguish healthy coherence from redundancy
* explain narrative cost of repetition

## Output schema

* `overlap_level`
* `repeated_elements[]`
* `why_it_matters`
* `differentiation_suggestions[]`

## Validation focus

* overlap interpretation feels human and strategic
* warnings are not just similarity scores disguised as advice

---

## 10. Schema and output contract rules

## 10.1 Structured output only

All AI responses must be requested and validated in a structured format.

### Rule

No freeform plain-text-only response should directly power a user-facing module.

## 10.2 Stable keys

Every module should use stable named keys that map directly to UI components.

## 10.3 Count limits

The system should constrain output counts.
Examples:

* top 3 themes
* top 3 directions
* 2–3 outline options
* top 3 revision priorities

### Reason

Abundance feels generic. Constraint feels intelligent.

## 10.4 Length limits

Each field should have soft and hard expected lengths.
Long rambling explanations should be rejected or trimmed.

---

## 11. Validation architecture

## 11.1 Validation layers

Outputs should pass through at least three forms of validation:

### A. Schema validation

Does the output conform to required structure?

### B. Content quality validation

Does the output include the required specificity and ranking?

### C. Brand/policy validation

Does the output violate ghostwriting, genericity, or tone rules?

---

## 11.2 Validation failure triggers

Trigger failure if output contains:

* missing required sections
* unranked flat options where ranking is required
* generic personality praise
* submission-ready ghostwriting behavior
* overlong freeform blob behavior
* duplicate or near-duplicate options
* obvious cliché filler
* no admissions-specific reasoning

---

## 11.3 Validation remediation strategy

If validation fails:

1. retry with tighter constraint prompt
2. simplify output scope if needed
3. degrade to partial structured fallback
4. surface recoverable state in UI if necessary

### Rule

Never pass low-quality output just to avoid an empty state.

---

## 12. Retry and fallback architecture

## 12.1 Retry types

The system may retry with:

* stronger schema emphasis
* fewer output items
* stronger anti-generic constraints
* instruction to take a stance and rank more sharply

## 12.2 Safe fallback types

If generation still fails or remains weak:

* return fewer options
* return ranked partial output
* return structured “need stronger input” response
* route user toward supplying more story material

## 12.3 Unsafe fallback types

Do not:

* fill missing sections with generic filler
* substitute motivational fluff
* return fake certainty
* produce finished prose because the structured task failed

---

## 13. Anti-generic prompt constraints

Every module should contain explicit anti-generic constraints such as:

* do not use generic praise without evidence
* do not list all options as equally strong
* do not produce broad brainstorming lists
* do not repeat common admissions clichés unless diagnosing them
* do not use generic “hardworking/resilient/passionate” trait framing unless grounded and necessary
* do not write a polished final essay or final supplement

### Benefit

These constraints are one of the clearest ways to differentiate from free AI behavior.

---

## 14. Ranking logic architecture

Where the product requires ranking, ranking should be explicit both in prompt design and downstream logic.

### Examples

* themes should be ordered strongest to weakest
* directions should include explicit recommendation ranking
* revision priorities should be sorted by highest leverage first
* angle suggestions should rank best fit first

### Prompt rule

Do not ask for “some ideas.”
Ask for the strongest few options, ranked and explained.

---

## 15. Cross-artifact reasoning architecture

This is one of the most important differentiators in the product.

The system should reason across artifacts when relevant, including:

* onboarding → snapshot
* snapshot → Story Vault / direction selection
* Story Vault → essay direction
* direction + outline + draft → feedback
* personal statement + supplement set → overlap warnings
* school prompt + application package → angle selection

### Rule

Cross-artifact reasoning must be intentional, not accidental.
Only include relationships that improve the decision.

### Why it matters

This is one of the clearest places where The College Admissions Edge can outperform free AI.
Generic AI usually does not maintain strong structured multi-artifact application reasoning.

---

## 16. Prompt versioning architecture

Each production prompt set should be versioned.

Recommended versioning dimensions:

* module name
* prompt version
* schema version
* validator version

### Example

* snapshot_prompt_v1_2
* essay_feedback_schema_v1_1
* supplement_angle_validator_v1_0

### Benefit

This enables:

* controlled iteration
* debugging
* A/B comparison later if needed
* incident review when output quality changes

---

## 17. Observability and quality monitoring

The system should log enough metadata to inspect output quality without exposing raw user content more than necessary.

Recommended observability dimensions:

* module invoked
* context size/profile
* prompt version
* schema version
* validation pass/fail
* retry count
* fallback used or not
* user action after output (accepted, ignored, regenerated, etc.) where product signals exist

### Rule

You cannot improve differentiated AI quality if you cannot observe where it becomes generic, weak, or unstable.

---

## 18. Human review quality rubric

When reviewing outputs manually, use this rubric:

### 18.1 Distinctiveness

Could this have come from free ChatGPT with a simple prompt?
If yes, quality is too low.

### 18.2 Usefulness

Did the output narrow the decision space meaningfully?

### 18.3 Authenticity

Did the output preserve the student’s likely real voice and material?

### 18.4 Admissions-specificity

Does the output show real application logic, not generic writing logic alone?

### 18.5 Product fit

Does the output map cleanly into the intended UI and workflow?

---

## 19. Engineer implementation rules

## 19.1 Separate prompt design from route code

Prompt composition should live in dedicated AI service layers, not scattered inside page routes.

## 19.2 Separate context builders from prompt templates

Context assembly should be programmatic and testable.

## 19.3 Validate before persistence

Do not persist unusable output as if it were success.

## 19.4 Persist only what the product needs

Do not dump raw model interactions unnecessarily if structured output is enough.

## 19.5 Keep UI independent from vendor idiosyncrasies

The UI should depend on product schema, not raw model phrasing.

---

## 20. Anti-patterns to avoid

Do not build the AI layer as:

* one giant prompt per feature
* raw chat completion output pasted into UI
* “just add more context” architecture
* equally weighted option generators
* soft, vague, flattering essay feedback
* freeform brainstorming machines
* hidden ghostwriting
* model-first product design instead of workflow-first design

---

## 21. World-class quality bar

A world-class College Admissions Edge AI output should make a user think:

* “This understands what matters in the admissions process.”
* “This is sharper than generic AI.”
* “This is helping me make better choices, not just giving me more words.”
* “This sounds grounded and real.”
* “This protects my voice instead of replacing it.”

A failing output makes a user think:

* “This is generic.”
* “This sounds like ChatGPT.”
* “This is too polished and fake.”
* “This didn’t actually help me decide anything.”

---

## 22. Non-negotiables

1. No user-facing module may depend on raw unvalidated model prose.
2. No module may be architected as open-ended chatbot behavior.
3. No module may ghostwrite final admissions submissions.
4. The system must rank, prioritize, and constrain better than free AI.
5. Cross-context reasoning must be intentional and product-driven.
6. If the output could be mistaken for generic ChatGPT, the system has failed the standard.

---

## 23. Final directive

The AI architecture is not a layer of decoration.
It is a core engine of product differentiation.

The College Admissions Edge wins only if its AI layer feels:

* more structured
* more contextual
* more strategically useful
* more authenticity-protective
* more admissions-native
  than free general-purpose chat tools.

This architecture exists to make that difference real, repeatable, and shippable.

---

## 24. Recommended next artifacts

Create next:

* `POSTMORTEM_TEMPLATE_V1.md`
* `INTERNAL_ADMIN_RUNBOOK_V1.md`
* `V1_0_1_RELEASE_NOTES.md`
* `AI_EVALUATION_RUBRIC_V1.md`
* `MODULE_OUTPUT_SCHEMAS_V1.md`
* `AI_VALIDATOR_RULES_V1.md`
* `CONTEXT_ASSEMBLY_SPEC_V1.md`
