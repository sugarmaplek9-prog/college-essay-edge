# MODULE_OUTPUT_SCHEMAS_V1

## The College Admissions Edge

## v1 Module Output Schema Specification

## 1. Purpose

This document defines the canonical output contracts for AI-powered modules in v1 of The College Admissions Edge.

It exists to answer a deceptively important product question:

What, exactly, is the AI allowed to return to the application?

That question is foundational because the product does not ship model prose.
It ships validated product artifacts.

This document defines the required structure, constraints, and semantics for those artifacts so that:

AI outputs can be reliably rendered in the UI

validators can enforce quality consistently

persistence logic can store structured state safely

retries and fallbacks can behave deterministically

engineering can implement module behavior without depending on model improvisation

the product remains differentiated from generic chatbot output

This is not merely a formatting reference.
It is part of the product control system.

2. Core schema principle

The College Admissions Edge does not treat AI output as “an answer.”

It treats AI output as:

a bounded decision artifact produced for a specific module, under a constrained contract, for a specific workflow purpose.

That means every schema must do more than describe shape.
It must also encode:

product intent

decision pressure

ranking expectations

quantity discipline

authenticity boundaries

fallback behavior

UI mapping logic

failure semantics

A weak schema says:
“return some fields.”

A strong product schema says:
“return exactly the kind of artifact this workflow needs, in the quantity and structure that best supports judgment.”

3. What this document governs

This document governs, for each AI module:

schema purpose

artifact type

invocation context

required inputs

optional inputs

output object structure

required keys

field semantics

constraints

ranking rules

count limits

nullability behavior

failure states

partial-output rules

persistence notes

UI rendering notes

validator hooks

This document does not define:

prompt text

validator implementation logic

context assembly algorithms

route-level orchestration

vendor-specific response formats

Those belong in adjacent documents.

4. Schema philosophy
4.1 Product artifacts, not prose blobs

Schemas must force structured product output rather than letting the model return an essay-shaped paragraph.

4.2 Constrained quantity is part of quality

Too many options reduce trust.
A smaller set of ranked, well-justified artifacts feels more intelligent.

4.3 Ranking is not optional where judgment is the product

If the module exists to help the student choose, the schema must force the system to take a stance.

4.4 Every field must earn its place

If a field does not support user decision-making, validation, persistence, or rendering, it should not exist.

4.5 Schemas protect authenticity

The shape of the schema should make ghostwriting harder and coaching easier.

5. Global schema rules

These rules apply to all AI module outputs unless a module-specific exception is explicitly defined.

5.1 Root object requirement

All module outputs must return a single root object.

No freeform text-only output is allowed as the root response for a production module.

5.2 Stable keys only

All keys must be stable, explicit, and version-safe.

Do not rely on synonyms such as:

recommendations in one module and suggestions in another if they mean the same thing

issues in one module and weaknesses in another if they represent the same concept

If semantics differ, field names may differ.
If semantics are the same, the contract should stay stable.

5.3 No hidden meaning in ordering unless specified

Array order should not imply rank unless the schema explicitly says rank is encoded by order or by a rank field.

Preferred approach:
use both deterministic ordering and an explicit rank.

5.4 Bounded counts

Every list field should have a defined max count.
Unbounded list generation is prohibited for user-facing production modules.

5.5 Field length discipline

Each text field should have:

a semantic purpose

a preferred length range

a practical upper bound

This is not just for tokens.
It is for product sharpness.

5.6 Explainability over verbosity

Schemas should favor short, high-signal explanations over long rationales.

5.7 No final-submission prose fields

Production schemas may support:

diagnosis

prioritization

structure

angle selection

reflection prompts

revision guidance

They may not support fields whose natural use is “paste directly into a college application as final prose.”

5.8 Machine-usable failure states

When output quality is weak, the response should degrade into structured failure or partial-success states rather than vague emptiness.

6. Canonical root envelope

All AI modules should return a common root envelope around the module-specific payload.

This creates cross-module consistency and cleaner orchestration.

6.1 Canonical envelope
{
  "module": "string",
  "schema_version": "string",
  "status": "success | partial | needs_more_input | failed_validation",
  "summary": "string",
  "data": {},
  "warnings": [],
  "meta": {}
}
6.2 Root field definitions
module

The canonical module identifier.

Examples:

edge_snapshot

story_vault_analysis

narrative_direction_selection

outline_generation

essay_feedback

supplement_angle_suggestion

overlap_warning

schema_version

The schema version used to validate the response.

Example:
"v1.0"

status

Allowed values:

success

partial

needs_more_input

failed_validation

Meaning

success: output is complete enough for intended UI behavior

partial: some usable artifacts exist, but one or more sections are intentionally reduced

needs_more_input: the system cannot provide strong output without stronger source material

failed_validation: generation occurred but did not meet quality bar and should not be treated as successful product output

summary

A short product-facing synthesis of the result.
This is not a conversational reply.
It is a UI-supporting summary sentence or short paragraph.

data

Module-specific structured payload.

warnings

Structured warning objects or warning strings depending on module complexity.
Preferred for v1: warning objects.

meta

Operational metadata safe for product use.
Should not expose vendor-specific internals to UI by default.

6.3 Root envelope constraints

module, schema_version, status, summary, and data are required.

warnings may be empty but must exist.

meta may be empty but must exist.

summary must not be motivational filler.

summary must synthesize actual module conclusions.

7. Common shared field types

To reduce drift, these shared field structures should be reused across modules where applicable.

7.1 Ranked item
{
  "id": "string",
  "title": "string",
  "rank": 1,
  "confidence": "high | medium | low",
  "reason": "string"
}
Notes

confidence is optional in v1 but recommended where inference uncertainty matters.

reason must be evidence-based, not generic filler.

7.2 Warning object
{
  "code": "string",
  "message": "string",
  "severity": "low | medium | high"
}

Examples:

thin_reflection_risk

overlap_risk

insufficient_story_depth

weak_school_fit

genericity_risk

7.3 Evidence note
{
  "source_type": "onboarding | story_vault | draft | supplement | school_context | inferred",
  "note": "string"
}

Used when the product needs to show why a recommendation exists without exposing chain-of-thought.

7.4 Revision priority item
{
  "id": "string",
  "rank": 1,
  "priority": "high | medium | low",
  "issue": "string",
  "why_it_matters": "string",
  "recommended_action": "string"
}
8. Status semantics

The status system is part of the product behavior, not just a technical field.

8.1 success

Use when:

the main artifact set is complete

ranking requirements are satisfied

validators pass

output is strong enough to drive intended UI state

8.2 partial

Use when:

some useful artifacts were produced

one or more lower-priority sections were reduced or omitted

the user can still move forward meaningfully

Example:
two strong narrative directions were found, but a third could not be generated without becoming generic.

8.3 needs_more_input

Use when:

the system lacks sufficient story depth, specificity, or context

generating a confident result would require generic filler

the correct product behavior is to request stronger input

8.4 failed_validation

Use when:

generation occurred

the output violated schema, quality, or policy requirements

the result should not be exposed as valid module output

This status should usually trigger retry or internal fallback rather than surface directly.

9. Module schema specifications
9.1 Edge Snapshot
Module ID

edge_snapshot

Purpose

Infer the strongest likely personal themes, promising narrative directions, and missing discovery ingredients from early student inputs.

Artifact type

Discovery synthesis artifact

This module narrows narrative possibility space.
It should feel clarifying, not expansive.

Required inputs

onboarding signal summary

Optional inputs

selected interests

activity summary

challenge/growth reflections

school preference summary

Output schema
{
  "module": "edge_snapshot",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The strongest material centers on curiosity-through-action, a pattern of self-driven growth, and one potentially strong identity-adjacent theme that needs more specificity.",
  "data": {
    "strongest_themes": [
      {
        "id": "theme_1",
        "title": "Curiosity turned into initiative",
        "rank": 1,
        "why_it_stands_out": "The student repeatedly describes moving from interest into action rather than staying at the level of preference.",
        "evidence_notes": [
          {
            "source_type": "onboarding",
            "note": "Multiple responses connect interest with self-started experimentation or building."
          }
        ]
      }
    ],
    "direction_candidates": [
      {
        "id": "direction_1",
        "title": "From passive interest to self-directed builder",
        "rank": 1,
        "summary": "A narrative about becoming someone who acts on curiosity rather than waiting for formal permission or structure.",
        "why_strong": "This direction has movement, agency, and a likely reflection arc.",
        "risk": "Could become generic if the story evidence stays too résumé-like."
      }
    ],
    "missing_elements": [
      {
        "id": "missing_1",
        "label": "Specific turning-point moment",
        "why_it_matters": "Without one grounded moment, the strongest direction may remain thematic rather than vivid."
      }
    ]
  },
  "warnings": [],
  "meta": {}
}
Required data fields

strongest_themes

direction_candidates

missing_elements

Constraints
strongest_themes

min: 2

max: 3

must be ranked

titles must not be generic trait labels alone

each item must include why_it_stands_out

direction_candidates

min: 2

max: 3

must be distinct

must be ranked

each must include a real risk

missing_elements

min: 1

max: 3

must identify what is absent, not repeat strengths as pseudo-gaps

UI notes

strongest_themes maps to key insight cards

direction_candidates maps to recommended lanes

missing_elements maps to “what to strengthen next”

Failure behavior

Use needs_more_input if onboarding responses are too thin to produce at least two non-generic themes.

9.2 Story Vault Analysis
Module ID

story_vault_analysis

Purpose

Identify which stored stories actually carry narrative energy, reflection potential, and strategic usefulness.

Artifact type

Story signal map

This module does not simply list good stories.
It distinguishes between:

vivid stories

reflective stories

overused stories

weak stories

hidden strong stories

Required inputs

Story Vault entries

Optional inputs

story categories

strength tags

usage state

snapshot themes

Output schema
{
  "module": "story_vault_analysis",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The strongest story material is concentrated in two clusters: moments where the student had to rethink how they operate, and experiences where responsibility changed their self-understanding.",
  "data": {
    "strongest_story_candidates": [
      {
        "id": "story_1",
        "title": "Rebuilding after an early failure",
        "rank": 1,
        "why_it_works": "It contains tension, decision-making, and an internal shift rather than just achievement.",
        "reflection_potential": "high",
        "usage_state": "unused"
      }
    ],
    "theme_clusters": [
      {
        "id": "cluster_1",
        "label": "Responsibility changed self-perception",
        "stories_in_cluster": ["story_1", "story_3"],
        "why_this_cluster_matters": "These stories point toward identity movement rather than activity description."
      }
    ],
    "underused_angles": [
      {
        "id": "angle_1",
        "label": "Moments of changed judgment",
        "why_underused": "Several stories imply growth in judgment, but the student has not framed them that way yet."
      }
    ],
    "weak_or_flat_material": [
      {
        "id": "flat_1",
        "label": "Award recap story",
        "why_weak": "The event may matter personally, but the current framing is almost entirely achievement summary."
      }
    ],
    "next_recommendation": {
      "label": "Develop the top two reflective stories before selecting a final personal statement lane",
      "reason": "The strongest material exists, but it needs sharper retrieval and detail capture."
    }
  },
  "warnings": [],
  "meta": {}
}
Constraints
strongest_story_candidates

min: 2

max: 5

must be ranked

must not simply mirror user-entered strength tags without reasoning

theme_clusters

min: 1

max: 4

cluster labels must be meaningful

clusters must reflect story patterning, not arbitrary grouping

underused_angles

max: 3

weak_or_flat_material

max: 3

weakness must be explained, not merely asserted

UI notes

this module should support both overview and drill-down surfaces

story cards should be linkable from IDs

Failure behavior

Use partial if strong candidates can be identified but clustering quality is low due to limited inventory.

9.3 Narrative Direction Selection
Module ID

narrative_direction_selection

Purpose

Help the student choose the strongest personal statement lane from multiple plausible options.

Artifact type

Ranked direction decision artifact

This module must take a stance.

Required inputs

onboarding signal summary

strongest story material

Optional inputs

snapshot themes

prior essay state

selected interests

Output schema
{
  "module": "narrative_direction_selection",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The strongest personal statement direction is the one built around changed judgment, because it offers the most movement, reflection depth, and room for a distinctive voice.",
  "data": {
    "direction_candidates": [
      {
        "id": "direction_1",
        "title": "Changed judgment under pressure",
        "rank": 1,
        "summary": "A narrative centered on how a demanding situation changed the way the student makes decisions.",
        "why_strong": "It creates internal movement, allows genuine reflection, and avoids résumé-forward framing.",
        "risk": "Needs one precise scene or the insight may feel abstract."
      },
      {
        "id": "direction_2",
        "title": "Building confidence through repeated action",
        "rank": 2,
        "summary": "A narrative about becoming more self-directed through repeated effort and initiative.",
        "why_strong": "It offers a coherent arc and connects well to existing story material.",
        "risk": "This lane is more common and could drift toward generic growth language."
      }
    ],
    "recommended_direction_id": "direction_1",
    "decision_rationale": {
      "why_this_is_best": "It provides the strongest mix of tension, self-examination, and admissions-relevant distinctiveness.",
      "why_others_rank_lower": [
        "The second lane is solid but more familiar in structure.",
        "A third possible lane was excluded because it depended too heavily on achievement recap."
      ]
    }
  },
  "warnings": [],
  "meta": {}
}
Constraints
direction_candidates

min: 2

max: 4

all candidates must be genuinely distinct

rank must be unique

each item requires title, summary, why_strong, risk

recommended_direction_id

required if status = success

must match one candidate ID

decision_rationale

required

must explain selection logic, not restate rank

UI notes

one direction should display as recommended

others should display as alternatives, not equal peers

Failure behavior

Use partial if only two valid directions can be produced and a third would be too weak or duplicative.

9.4 Outline Generation
Module ID

outline_generation

Purpose

Convert a selected narrative direction into strong structural options without generating full admissions prose.

Artifact type

Structural planning artifact

Required inputs

selected direction

Optional inputs

strongest supporting stories

snapshot signals

prior outline notes

Output schema
{
  "module": "outline_generation",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The strongest structure opens inside a moment of uncertainty, then expands outward to show how the student’s way of thinking changed.",
  "data": {
    "outline_options": [
      {
        "id": "outline_1",
        "label": "Pressure first, insight second",
        "rank": 1,
        "opening_move": "Begin inside the key moment before the student knew how to respond.",
        "core_tension": "The student realizes their old approach is no longer enough.",
        "reflection_path": "Move from immediate reaction to what changed internally afterward.",
        "ending_direction": "End with a more mature way of seeing responsibility or judgment.",
        "why_this_structure_works": "It creates motion early and gives reflection a natural landing point."
      }
    ]
  },
  "warnings": [],
  "meta": {}
}
Constraints
outline_options

min: 2

max: 3

must be ranked

options must differ structurally, not just cosmetically

no full paragraphs of essay prose

each option must explain why the structure works

UI notes

best used as selectable outline cards

should support student choosing one path, not blending all of them by default

Failure behavior

Use needs_more_input if no selected direction exists or if the chosen direction is too vague to structure.

9.5 Essay Feedback
Module ID

essay_feedback

Purpose

Deliver high-signal critique that improves the student’s draft without replacing authorship.

Artifact type

Revision diagnosis artifact

Required inputs

current draft

Optional inputs

selected direction

selected outline

story context

prior revision goals

Output schema
{
  "module": "essay_feedback",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The draft has a promising core situation, but the current version explains the experience faster than it lets the reader feel its stakes or understand what changed inside the writer.",
  "data": {
    "what_is_working": [
      {
        "id": "working_1",
        "label": "Clear central situation",
        "why_it_works": "The reader can identify what the essay is about relatively early."
      }
    ],
    "what_is_weak": [
      {
        "id": "weak_1",
        "label": "Reflection arrives too generally",
        "why_it_is_weak": "The draft names growth but does not show how the student’s thinking actually changed."
      }
    ],
    "what_is_missing": [
      {
        "id": "missing_1",
        "label": "A sharper turning point",
        "why_it_matters": "Without a moment of internal shift, the essay reads more like summary than transformation."
      }
    ],
    "revision_priorities": [
      {
        "id": "priority_1",
        "rank": 1,
        "priority": "high",
        "issue": "The internal change is underdeveloped.",
        "why_it_matters": "This is the core of what admissions readers need to understand.",
        "recommended_action": "Rewrite the middle section around the moment when the student realized their original approach was insufficient."
      }
    ],
    "next_steps": [
      {
        "id": "step_1",
        "rank": 1,
        "action": "Identify one exact moment where the student’s understanding changed.",
        "purpose": "This will give the draft a stronger reflective center."
      }
    ],
    "risk_tags": [
      "thin_reflection_risk"
    ]
  },
  "warnings": [],
  "meta": {}
}
Constraints
what_is_working

max: 3

praise must be evidence-based

generic encouragement is prohibited

what_is_weak

min: 1

max: 4

each weakness must include explanation

what_is_missing

max: 3

revision_priorities

min: 1

max: 3

must be ranked

must identify highest-leverage issues first

next_steps

min: 1

max: 5

must be concrete and non-ghostwriting

risk_tags

Allowed examples:

thin_reflection_risk

cliche_risk

resume_recap_risk

generic_opening_risk

overexplaining_risk

underdeveloped_voice_risk

UI notes

priorities should lead the screen

praise should be smaller than critique in visual weight

next steps should be operational, not performative

Failure behavior

Use needs_more_input if the draft is too short or fragmentary to diagnose meaningfully.

9.6 Supplement Angle Suggestion
Module ID

supplement_angle_suggestion

Purpose

Recommend school-specific, prompt-specific angles that strengthen the application package without lazily repeating the personal statement.

Artifact type

Ranked angle recommendation artifact

Required inputs

institution

supplement prompt text

Optional inputs

prompt category

personal statement summary

Story Vault strongest material

supplement set context

Output schema
{
  "module": "supplement_angle_suggestion",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The strongest angle is the one that connects the student’s pattern of initiative to this school’s collaborative, build-oriented culture without repeating the personal statement’s central reflection arc.",
  "data": {
    "recommended_angles": [
      {
        "id": "angle_1",
        "angle_title": "Where initiative becomes contribution",
        "rank": 1,
        "why_it_fits": "This angle aligns with the school’s emphasis on hands-on collaboration and gives the student room to show fit through action rather than generic admiration.",
        "supporting_story_material": "A story where the student built or improved something with others.",
        "caution_note": "Avoid turning this into a generic 'why this school' list."
      }
    ],
    "overlap_assessment": {
      "overlap_level": "low",
      "note": "This angle complements the current personal statement rather than repeating its main emotional center."
    }
  },
  "warnings": [],
  "meta": {}
}
Constraints
recommended_angles

min: 2

max: 4

must be ranked

must be school-aware

must be prompt-aware

must not merely repackage the personal statement thesis

each item must include a real caution note

overlap_assessment

required if personal statement context exists

overlap levels allowed:

low

moderate

high

UI notes

strongest angle should display first

caution notes should be visible, not hidden

Failure behavior

Use needs_more_input if the school prompt is too vague or if no relevant student material exists to ground an angle.

9.7 Overlap Warning
Module ID

overlap_warning

Purpose

Detect when the application package is repeating the same narrative payload too often.

Artifact type

Narrative redundancy diagnostic

Required inputs

personal statement draft or summary

at least one supplement draft or summary

Optional inputs

additional supplements

dominant application themes

Output schema
{
  "module": "overlap_warning",
  "schema_version": "v1.0",
  "status": "success",
  "summary": "The current package has healthy thematic coherence, but two essays are leaning on the same underlying message about growth through challenge, which reduces differentiation.",
  "data": {
    "overlap_level": "moderate",
    "repeated_elements": [
      {
        "id": "repeat_1",
        "label": "Growth-through-adversity framing",
        "where_it_repeats": [
          "personal_statement",
          "supplement_why_major"
        ],
        "why_it_repeats": "Both essays rely on the same emotional lesson rather than showing different dimensions of the student."
      }
    ],
    "why_it_matters": "Admissions readers do not need identical proof of growth across multiple essays. Repetition narrows the application’s range.",
    "differentiation_suggestions": [
      {
        "id": "diff_1",
        "rank": 1,
        "suggestion": "Shift the supplement toward intellectual energy or contribution rather than personal resilience.",
        "why_this_helps": "It expands the package rather than repeating the same internal arc."
      }
    ]
  },
  "warnings": [],
  "meta": {}
}
Constraints
overlap_level

Allowed values:

low

moderate

high

repeated_elements

min: 1 if overlap is moderate or high

max: 4

differentiation_suggestions

min: 1 if overlap is moderate or high

max: 3

must be strategic, not just “pick a different topic”

UI notes

overlap should be explained in human strategy terms

this is not a plagiarism or text-similarity feature

the UI should reinforce that coherence is good, repetition is costly

Failure behavior

Use needs_more_input if there is not enough artifact coverage to compare themes.

10. Common warning codes

The following warning codes are approved for v1 cross-module use:

genericity_risk

thin_reflection_risk

resume_recap_risk

overlap_risk

weak_school_fit

low_story_specificity

underdeveloped_turning_point

insufficient_input_depth

duplicate_option_risk

structure_without_tension_risk

Modules may define additional codes later, but v1 should stay disciplined.

11. Nullability and omission rules
11.1 Prefer omission over meaningless nulls in nested items

Bad:

{
  "risk": null
}

Better:
do not allow the item unless a meaningful risk can be generated.

For required fields, absence should trigger validation failure or partial-status handling.

11.2 Root fields should always exist

The following root fields must always exist:

module

schema_version

status

summary

data

warnings

meta

11.3 Empty arrays are allowed only when semantically valid

Example:
warnings: [] is fine.

But:
direction_candidates: [] is not valid for a successful narrative direction response.

12. Partial-output rules

Partial output is permitted only when it is still product-meaningful.

Examples of acceptable partial output:

two strong direction candidates instead of three

one missing element omitted because the system would otherwise invent filler

strong revision priorities returned even if secondary praise fields were reduced

Examples of unacceptable partial output:

a success response with no ranked candidates

a direction module with options but no recommendation

essay feedback with only compliments and no critique

supplement angles with school-agnostic ideas

13. Persistence rules
13.1 Persist structured artifacts, not raw generation by default

The application should primarily persist:

module ID

schema version

validated output object

validator result

prompt/version references

timestamps

user action outcomes if available

13.2 Do not persist low-quality output as successful module state

If status is failed_validation, it must not be saved as canonical product output.

13.3 Persist recommendation identity where workflow depends on selection

Example:
if a student selects a recommended direction, the selected direction ID and its originating module version should be stored.

14. UI contract principles

Schemas are not backend-only artifacts.
They define user experience.

14.1 One schema field should map cleanly to one UI concept

Avoid fields that require heavy interpretation by the frontend.

14.2 The UI should reinforce judgment

Ranked items should look ranked.
Recommended items should look recommended.
Warnings should look consequential.

14.3 The UI should not make weak outputs appear stronger than they are

If output is partial, the UI should not present it as full confidence.

15. Validator hook expectations

Every module schema should support validator checks across three layers:

A. Structural validity

Are all required fields present and properly typed?

B. Semantic validity

Do the contents satisfy the module’s actual purpose?

C. Brand validity

Does the output feel like The College Admissions Edge rather than generic AI?

Examples:

direction candidates must not be near-duplicates

essay feedback must not include generic praise filler

supplement angles must be school-aware

snapshot themes must not collapse into horoscope-style traits

16. Anti-patterns to prevent through schema design

Do not design schemas that encourage:

open-ended brainstorming

quantity inflation

vague “insight” fields without operational use

fields that invite final polished admissions prose

soft hedging that avoids ranking

generic praise blocks

model improvisation in place of product logic

A strong schema should make low-value output harder to generate.

17. World-class schema standard

A world-class module schema should do all of the following:

force clarity

reward selectivity

support validation

map directly to UI

make generic output harder

preserve authenticity boundaries

keep the system honest when context is weak

feel specific to admissions strategy, not generic AI product design

A weak schema produces outputs that feel interchangeable with consumer chatbot behavior.

A strong schema makes the product’s reasoning feel deliberate, structured, and distinctly its own.

18. Non-negotiables

No production module may rely on freeform raw prose as its user-facing contract.

All choice-oriented modules must encode ranking explicitly.

All critique modules must prioritize actionable diagnosis over praise.

No schema may normalize final-submission ghostwriting behavior.

If a schema makes generic output easy, the schema is poorly designed.

Partial output is acceptable only if it remains product-useful.

Schema design is part of product differentiation, not just implementation hygiene.
