# AI_VALIDATOR_RULES_V1

## The College Admissions Edge

## v1 AI Output Validation, Enforcement, and Quality Gate Rules

## 1. Purpose

This document defines the validation and enforcement system for AI-generated outputs in v1 of The College Admissions Edge.

It exists to answer a critical production question:

How does the product decide whether an AI output is good enough, safe enough, sharp enough, and authentic enough to be shown to a user?

That question is central to product quality because The College Admissions Edge does not win by merely producing fluent outputs.
It wins by producing outputs that are:

strategically useful

admissions-native

authenticity-protective

structurally reliable

more selective than generic AI

less flattering, less bloated, and less fake than free chatbot behavior

This document defines the rules by which AI output is:

accepted

rejected

retried

reduced

degraded

or blocked from the interface

This validator layer is not a cosmetic QA step.
It is one of the product’s main control systems.

2. Core validator principle

The model is allowed to generate.
The product is not required to trust it.

Every AI output must pass through a quality gate before it becomes product-visible state.

The validator exists because fluent output is not the same as product-quality output.

Core rule

No output becomes user-facing merely because the model returned something well-written.

The validator is the system that decides whether the output is:

structurally valid

meaningfully specific

strategically useful

non-generic

non-ghostwritten

module-appropriate

strong enough to justify UI display

3. Validator philosophy
3.1 Validation is enforcement, not formatting

The validator is not just checking whether keys exist.
It is enforcing product standards.

3.2 The validator protects the brand

If the output sounds like generic AI, the validator should treat that as a product failure, not a minor style issue.

3.3 The validator protects authenticity

If the output drifts toward replacement authorship, over-polish, or submission-ready prose, it must be constrained or blocked.

3.4 The validator protects decision quality

A vague output that avoids ranking, hedges excessively, or generates bloated options is not “safe.”
It is low-value and should be rejected or narrowed.

3.5 The validator must be more disciplined than the model

The validator should be stricter, sharper, and less forgiving than the generator.

4. What this document governs

This document governs:

validation layers

pass / fail criteria

severity classes

failure codes

retry triggers

fallback rules

module-specific validation rules

anti-generic detection rules

anti-ghostwriting rules

ranking enforcement

duplicate detection

admissibility thresholds

validator architecture design

ML-assisted validation evolution path

This document does not define:

prompt copy

root output schemas

context assembly rules

UI presentation details

vendor-specific moderation policies

5. Validation architecture overview

Every AI output should pass through a validator stack composed of four layers.

Layer 1 — Structural validation

Does the output conform to the required schema and field contract?

Layer 2 — Semantic validation

Does the output actually perform the module’s job?

Layer 3 — Brand and authenticity validation

Does the output sound and behave like The College Admissions Edge rather than generic AI?

Layer 4 — Admissibility decision

Given all validator results, should the output be:

accepted

accepted as partial

retried

reduced in scope

converted to needs-more-input

blocked

The first three layers inspect.
The fourth decides.

6. Validator operating model

The validator should be implemented as a decision engine, not a single yes/no check.

Each module response should produce a validator result object containing:

pass/fail by layer

failure codes

severity

retry recommendation

fallback recommendation

admissibility decision

Canonical validator result shape
{
  "module": "essay_feedback",
  "validator_version": "v1.0",
  "structural_pass": true,
  "semantic_pass": false,
  "brand_pass": false,
  "decision": "retry_tightened",
  "failure_codes": [
    "unranked_priorities",
    "generic_praise_block",
    "low_specificity_feedback"
  ],
  "severity": "high",
  "notes": [
    "Feedback references strengths without grounding them in draft evidence.",
    "Revision priorities are present but insufficiently differentiated."
  ]
}

This validator result is operational state.
It is not chain-of-thought.
It is not a model explanation.
It is a product enforcement artifact.

7. Validation decision classes

Every validation outcome should resolve into one of the following decision classes.

7.1 accept

Use when output is complete, compliant, and strong enough for intended module use.

7.2 accept_partial

Use when output is meaningfully useful but intentionally reduced.

Example:
two strong narrative lanes returned instead of three.

7.3 retry_tightened

Use when the output is close enough to salvage, but requires tighter constraints.

Example:
valid schema, weak differentiation, too much hedging.

7.4 retry_reduced_scope

Use when the module asked for too much and should retry with narrower output demand.

Example:
requested four angle suggestions but only two can be generated without becoming generic.

7.5 convert_to_needs_more_input

Use when source material is genuinely too thin to support differentiated output.

7.6 block

Use when the output violates core product standards and should not be shown or persisted as success.

Example:
ghostwriting drift, schema breakdown, or severe genericity.

8. Severity classes

Failure codes should carry severity because not all failures mean the same thing.

low

Minor quality issue.
May still permit acceptance or partial acceptance.

medium

Meaningful weakness.
Usually requires retry or scope reduction.

high

Strong product failure.
Usually blocks output or forces fallback.

critical

Policy-boundary or integrity failure.
Must block.

Examples:

submission-ready ghostwriting

fabricated school-specific reasoning

final polished supplement prose

structural collapse with no usable artifact

9. Structural validation rules

Structural validation checks whether the output conforms to the schema contract.

9.1 Structural pass requirements

An output passes structural validation only if:

root envelope exists

required keys exist

required nested keys exist

field types are correct

enums are legal

arrays satisfy count bounds

ranking fields are present where required

IDs are present where required

required recommendation fields are populated

no prohibited field substitutions occurred

9.2 Structural failure examples

missing recommended_direction_id

direction_candidates is empty in a success response

rank missing from ranked items

overlap_level contains unsupported value

revision_priorities provided as one prose paragraph instead of itemized objects

9.3 Structural rule

A structurally invalid output cannot be accepted as success.

It may only become:

retry_tightened

retry_reduced_scope

block

depending on failure severity.

10. Semantic validation rules

Semantic validation checks whether the output actually performs the job of the module.

This is where many “technically valid” outputs should still fail.

10.1 Core semantic questions

For each module, ask:

Did the output narrow the decision space?

Did it take a stance where the product requires one?

Did it produce genuinely distinct options?

Did it diagnose something real rather than speaking abstractly?

Did it use admissions-specific reasoning?

Did it operate on the supplied material, not generic assumptions?

Did it give the student something actionable without replacing authorship?

10.2 Semantic failure examples

three direction candidates that are variations of the same idea

essay feedback that says “be more reflective” without saying where or why

supplement angles that could fit almost any school

overlap warnings that simply report topic repetition without narrative analysis

snapshot themes that reduce to “hardworking,” “passionate,” and “resilient”

10.3 Semantic rule

A semantically weak output may be structurally valid and still fail the product.

11. Brand and authenticity validation rules

This layer determines whether the output feels like The College Admissions Edge.

11.1 Brand-pass requirements

The output must be:

selective rather than sprawling

evidence-based rather than flattering

admissions-native rather than generic writing-advice

coaching-oriented rather than replacement-oriented

sharp rather than padded

specific rather than trait-heavy

trustworthy rather than overconfident

11.2 Brand failure examples

generic praise blocks

vague “you have a powerful story” language

chatbot-style encouragement

soft all-options-are-good framing

inflated polish

school-fit claims that sound templated

artificially balanced language where one option is clearly stronger

11.3 Authenticity failure examples

near-finished admissions prose

fully drafted supplement answer content

polished emotional insights that likely exceed student-authored material

voice-replacement behavior disguised as feedback

over-interpretation of thin story evidence

11.4 Rule

If the output could plausibly be mistaken for free chatbot behavior, brand validation should fail.

12. Admissibility model

The validator should not treat every failure equally.
Instead, admissibility should depend on the combination of failure types.

12.1 Acceptable combinations

Examples of outputs that may still be accepted:

structural pass + semantic pass + brand pass

structural pass + semantic pass + minor low-severity brand warning

structural pass + partial semantic weakness if the module is intentionally reduced and marked partial

12.2 Unacceptable combinations

Examples that should not be accepted:

structural fail of a required ranked field

semantic fail for a choice module that does not take a stance

brand fail due to generic filler across core fields

authenticity fail due to ghostwriting drift

multiple medium failures across distinct layers

any critical failure

13. Canonical failure code system

The validator should use stable failure codes.
These codes should be reusable across modules where possible.

13.1 Structural failure codes

missing_required_field

invalid_enum_value

rank_missing

empty_required_array

invalid_root_status

malformed_nested_item

schema_contract_mismatch

13.2 Semantic failure codes

duplicate_option_set

insufficient_distinction

weak_decision_pressure

missing_recommendation_logic

low_specificity_feedback

school_agnostic_angle

trait_list_output

non_actionable_diagnosis

thin_overlap_reasoning

resume_recap_bias

13.3 Brand and authenticity failure codes

generic_praise_block

flattery_padding

chatbot_tone_drift

hedged_noncommittal_output

generic_growth_language

ghostwriting_drift

final_prose_risk

false_polish_risk

templated_school_fit

motivational_filler

13.4 Input-quality and context failure codes

insufficient_input_depth

missing_anchor_story

low_context_signal

conflicting_context_inputs

context_staleness_risk

14. Anti-generic detection rules

This is one of the most important layers in the system.

The product should treat genericity as a first-class failure mode.

14.1 Genericity definition

An output is generic when it could plausibly be produced for a large number of users with minimal change.

Genericity often appears as:

broad trait framing

praise without evidence

abstract advice detached from user material

familiar admissions clichés

bloated option sets

symmetrical ranking language

explanations that sound polished but say little

14.2 Genericity signals

The validator should detect signals such as:

repeated use of generic traits like “resilient,” “hardworking,” “passionate,” “driven” without grounded evidence

praise phrases not tied to actual content

explanations that remain one layer above the student’s real material

options whose wording differs but underlying concept does not

advice that could apply to almost any essay

school-fit rationales that do not contain school-specific reasoning structure

sentence-level filler that softens critique without adding insight

14.3 Genericity rule

If multiple genericity signals appear in core output fields, the response should fail brand validation.

15. Anti-ghostwriting rules

The product must not cross from coaching into authorship replacement.

15.1 Ghostwriting drift indicators

full polished paragraphs that read submission-ready

complete answers to supplement prompts

line-level rewrites that substantially replace the student’s voice

reflection language more polished than the source material supports

ending lines that sound crafted for admissions impact rather than student development

15.2 Validator response

If ghostwriting drift is detected:

severity = high or critical depending on extent

decision = block or retry_tightened

output must not be accepted as success

15.3 Rule

The product may help students see what to improve.
It may not silently do the writing for them.

16. Ranking enforcement rules

Ranking is central to differentiation.

Many weak AI products generate options without meaningful judgment.
The College Admissions Edge should not.

16.1 Ranking-required modules

At minimum, ranking must be enforced for:

Edge Snapshot themes

direction candidates

outline options

revision priorities

supplement angles

differentiation suggestions where applicable

16.2 Ranking failure conditions

Fail if:

no rank field exists

all options are described as equally strong

recommendation exists without justification

ranking language does not match actual content

ordering and stated recommendation conflict

16.3 Ranking rule

If the product task is helping a user choose, the validator must require evidence of real prioritization.

17. Distinct-option rules

A common failure mode is “fake variety”:
multiple options that are really the same idea wearing different clothes.

17.1 Distinctness requirement

Option sets must differ in substance, not just labels.

Examples of required substantive distinction:

different narrative center

different reflection arc

different structural movement

different school-fit logic

different package function

17.2 Duplicate detection signals

The validator should flag near-duplication if options share too many of the following:

same core thesis

same evidence base

same reflection point

same practical recommendation

same structural logic

17.3 Decision rule

If option duplication materially reduces choice value, trigger:

duplicate_option_set

insufficient_distinction

Then retry with fewer stronger options if salvageable.

18. Specificity threshold rules

The product should treat specificity as a measurable quality signal.

18.1 Specificity means

The output points to:

actual student material

actual structural issue

actual narrative risk

actual school-fit reasoning

actual package conflict

It does not stay at the level of general writing commentary.

18.2 Low-specificity examples

“show more reflection”

“make it more personal”

“this is a strong topic”

“you have a compelling story”

“connect more deeply to the school”

18.3 Specificity rule

Core explanatory fields should fail semantic validation if they remain generic after one layer of scrutiny.

19. Module-specific validation rules
19.1 Edge Snapshot

Fail if:

fewer than 2 meaningful themes without justified needs_more_input

themes collapse into generic traits

direction candidates are near-duplicates

missing elements are filler rather than real discovery gaps

High-risk codes:

trait_list_output

insufficient_distinction

generic_growth_language

19.2 Story Vault Analysis

Fail if:

strongest stories are selected without narrative reasoning

clusters are vague or arbitrary

weak material is labeled weak without explanation

underused angles are generic reframings

High-risk codes:

resume_recap_bias

low_specificity_feedback

duplicate_option_set

19.3 Narrative Direction Selection

Fail if:

no clear recommendation exists

recommendation exists but why-it-is-best logic is thin

candidates are not materially distinct

weaker directions are padded into equality

High-risk codes:

weak_decision_pressure

missing_recommendation_logic

insufficient_distinction

hedged_noncommittal_output

19.4 Outline Generation

Fail if:

options are structurally indistinct

output drifts into essay prose

outlines read like generic templates

no explanation of why the structure works

High-risk codes:

duplicate_option_set

final_prose_risk

non_actionable_diagnosis

19.5 Essay Feedback

Fail if:

praise dominates critique

revision priorities are unranked or weakly ranked

comments could apply to almost any essay

feedback rewrites instead of diagnoses

risk tags are missing where needed

High-risk codes:

generic_praise_block

low_specificity_feedback

ghostwriting_drift

non_actionable_diagnosis

19.6 Supplement Angle Suggestion

Fail if:

angles are school-agnostic

angles simply restate the personal statement

caution notes are empty or fake

angle recommendations do not show package awareness

High-risk codes:

school_agnostic_angle

templated_school_fit

overlap_risk

missing_recommendation_logic

19.7 Overlap Warning

Fail if:

overlap is treated as lexical similarity only

repeated elements are named vaguely

differentiation suggestions do not meaningfully change package function

the validator cannot distinguish coherence from redundancy

High-risk codes:

thin_overlap_reasoning

low_specificity_feedback

non_actionable_diagnosis

20. Retry strategy rules

The validator should not always retry the same way.
Retry strategy should depend on failure class.

20.1 Retry for structural failures

Use when schema shape broke but task remains valid.

Response:

reissue with stronger schema emphasis

keep context mostly unchanged

reduce optional fields if needed

20.2 Retry for semantic weakness

Use when output is too vague, duplicative, or weakly ranked.

Response:

add stronger decision pressure

reduce output count

require sharper contrast across options

require explanation tied to source material

20.3 Retry for brand drift

Use when output feels like generic AI.

Response:

tighten anti-generic instruction

remove praise-heavy framing

force evidence-grounded language

cap verbosity more aggressively

20.4 Do not retry indefinitely

After a bounded number of retries, the system should degrade.
Repeated low-quality retries usually indicate weak source material or poor task fit.

21. Fallback rules

Fallback should preserve product honesty.

21.1 Safe fallbacks

fewer stronger items

partial response with explicit limits

needs-more-input state

request for stronger story material

narrow diagnostic output instead of broad recommendation output

21.2 Unsafe fallbacks

motivational filler

fake certainty

placeholder content disguised as insight

extra prose added to hide weakness

finished writing produced because structured output failed

22. ML-assisted validation: is machine learning possible here?

Yes.
Not only possible — eventually desirable.

But it should be introduced with discipline.

The best architecture is not:
“replace validators with a vague AI judge.”

The better architecture is:

Stage 1 — deterministic and heuristic validation

Start with:

schema checks

field counts

duplicate detection heuristics

phrase-pattern flags

ranking enforcement

rule-based ghostwriting checks

module-specific failure logic

This should be v1.

Stage 2 — model-assisted classifier signals

Add model-assisted validators for hard-to-capture signals such as:

genericity probability

distinctness quality

authenticity risk

school-specificity confidence

package-overlap quality

rewrite-vs-diagnose boundary detection

These should not replace deterministic checks.
They should contribute additional confidence signals.

Stage 3 — learned quality scoring from product data

Once you have enough reviewed outputs and user interaction data, you can train or fine-tune internal scorers for things like:

acceptance probability

regenerate probability

usefulness prediction

genericity risk

over-polish risk

recommendation quality

likely user trust

Stage 4 — ranking and routing optimization

Eventually ML can help decide:

whether to retry

how many options to request

which context bundle is most predictive

which validator thresholds produce best user outcomes

which module versions outperform others

23. ML design rule

Machine learning should enhance the validator layer, not weaken it.

The goal is not “AI checking AI.”
The goal is a quality enforcement system that gets smarter over time.

That means:

deterministic rules remain the backbone

heuristics handle known product-pattern failures

model-assisted scoring handles fuzzy judgment zones

learned systems optimize thresholds once data exists

This is the right long-term architecture if you want “AI without the AI” — meaning the product feels more like an intelligent system than a chatbot.

24. Proposed validator scoring model

For v1, a practical scoring model can coexist with pass/fail logic.

Each output may receive subscores:

structure_score (0–100)

specificity_score (0–100)

distinctness_score (0–100)

authenticity_score (0–100)

admissions_reasoning_score (0–100)

brand_fit_score (0–100)

Then combine into a decision profile, not just a single number.

Important rule

A high average score should not override critical failures.

Example:
A very polished output with strong structure should still fail if ghostwriting_drift = critical.

25. Observability requirements for validators

To improve quality over time, log:

module

schema version

validator version

failure codes

retry count

decision result

output status

user regeneration behavior

selection / acceptance behavior where available

manual QA labels if reviewed

eventual downstream success signals

This creates the data foundation for smarter validators later.

26. Human review standards

Human reviewers should use validator results as support, not a substitute for judgment.

When reviewing borderline outputs, ask:

Would this feel noticeably better than free AI?

Did this help the student choose or revise meaningfully?

Is this anchored in the student’s real material?

Is the product coaching, not replacing?

Did the validator miss a genericity pattern?

Did the validator over-penalize something genuinely useful?

This human layer becomes especially valuable for training future ML-assisted validators.

27. Anti-patterns to avoid

Do not build validator architecture as:

schema-only enforcement

one generic “quality score”

a black-box AI judge with no interpretable failure codes

style policing without product reasoning

a system that allows polished ghostwriting because it “scores well”

retry loops with no bounded decision logic

generic sentiment checks mistaken for brand validation

A weak validator layer creates a generic AI product even if the prompts are strong.

28. World-class validator standard

A world-class validator system should do all of the following:

reject structurally valid but strategically weak output

detect genericity as a product failure

protect authenticity boundaries

force ranking where judgment is the product

distinguish coherence from repetition

distinguish diagnosis from ghostwriting

create useful retry behavior instead of random repetition

become smarter over time through observed product data

make the AI layer feel less like a chatbot and more like a disciplined decision engine

That is the standard.

29. Non-negotiables

No output becomes user-facing merely because it is fluent.

Structural validity alone is never enough.

Genericity is a product failure, not a cosmetic flaw.

Ghostwriting drift must be treated as high-severity or critical.

Choice-oriented modules must show real decision pressure.

Retry behavior must depend on failure class, not blind repetition.

The validator layer should be designed now so it can later incorporate ML-assisted scoring without losing control or interpretability.

30. Recommended next artifacts

Create next:

CONTEXT_ASSEMBLY_SPEC_V1.md

AI_EVALUATION_RUBRIC_V1.md

AI_SERVICE_ORCHESTRATION_V1.md

PROMPT_VERSIONING_AND_CHANGELOG_V1.md

Final directive

The validator layer is where The College Admissions Edge stops being “an app that uses AI” and starts becoming a real product system.

Prompts may influence quality.
Schemas may shape quality.
But validators enforce quality.

If prompt architecture defines how the system is asked to think,
and schema architecture defines what the system is allowed to return,
then validator architecture defines:

what the product is willing to stand behind.
