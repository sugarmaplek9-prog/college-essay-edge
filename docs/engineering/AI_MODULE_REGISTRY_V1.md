# AI_MODULE_REGISTRY_V1
## The College Admissions Edge
### v1 AI Module Registry, Control Surface, and Differentiated Capability Index

---

## 1. Purpose

This document defines the canonical registry for all AI-powered modules in v1 of The College Admissions Edge.

It exists to answer a central product question:

> What AI-bearing capabilities actually exist in the system, what does each one do, what boundaries govern it, and how do those modules collectively create a differentiated product rather than a generic AI layer?

This matters because a product does not become defensible by merely "having AI."
It becomes defensible when the AI layer is broken into clear, bounded, strategically distinct modules that:

- perform different jobs
- use different context bundles
- produce different artifact types
- serve different workflow moments
- obey different validation rules
- and contribute different forms of product value

This registry is the source of truth for that system.

It defines, for every module:

- module identity
- product purpose
- workflow stage
- invocation rules
- input dependencies
- output artifact type
- schema contract
- validator linkage
- context bundle class
- orchestration mode
- fallback behavior
- success signals
- differentiation role
- ML evolution potential

This document is not a prompt list.
It is not a UI route list.
It is not a vendor integration note.

It is the **operational map of the product intelligence layer.**

---

## 2. Core Registry Principle

A module is not "a place where AI helps."

A module is:

> a bounded product capability that transforms a specific set of student and workflow inputs into a constrained, validated artifact for a specific admissions purpose.

That means the registry should only include modules that have:

- a clear purpose
- a distinct job
- bounded inputs
- bounded outputs
- a defined workflow role
- measurable success conditions
- clear non-generic value

**Core rule**

> If a capability cannot be described as a distinct product function with a unique job, it should not be treated as a real module.

This rule matters because generic AI products often create pseudo-modules that are really just:

- the same prompt with new labels
- the same advice surfaced in different places
- broad "assistant" behavior disguised as product features

That is what this registry is designed to prevent.

---

## 3. Strategic Role of the Registry

The module registry is one of the most important documents in the system because it prevents:

- module sprawl
- prompt reuse masquerading as feature breadth
- unclear ownership
- overlapping capability definitions
- silent drift toward generic assistant behavior
- weak evaluation coverage
- inability to know where quality is strong or weak
- inability to prioritize ML investment intelligently

The registry also makes it possible to answer strategic questions such as:

- Which modules drive the most differentiated value?
- Which modules are at highest risk of genericity?
- Which modules are best suited for ML-assisted optimization?
- Which modules have the strongest student-specificity potential?
- Which modules rely most on cross-artifact reasoning?
- Which modules are core to the product moat versus merely supportive?

Without a registry, the AI layer becomes difficult to govern.
With a registry, the AI layer becomes an **operating system.**

---

## 4. System Goals

The registry must achieve the following.

### 4.1 Canonical Visibility
Provide a single source of truth for all AI-bearing modules.

### 4.2 Capability Separation
Make module boundaries explicit so the system does not drift into generic assistant behavior.

### 4.3 Product Differentiation Mapping
Clarify what makes each module uniquely valuable.

### 4.4 Operational Governance
Support versioning, testing, telemetry, and ownership.

### 4.5 Quality Accountability
Make it possible to measure which modules are strong, weak, generic, unstable, or underperforming.

### 4.6 ML-Readiness
Identify where machine learning can later improve ranking, routing, personalization, and quality without erasing product control.

---

## 5. Registry Doctrine

The registry should follow the following doctrine.

### 5.1 Modules Are Product Functions, Not Prompt Wrappers
A module should exist because the workflow needs a distinct capability, not because a prompt can be written for it.

### 5.2 Every Module Must Justify Its Existence
If a module is not clearly different in product role, it likely should not exist.

### 5.3 Each Module Must Add Non-Generic Value
A module should improve a decision, reveal a pattern, sharpen a structure, or protect authenticity in a way that is hard to get from free AI.

### 5.4 Modules Should Be Measured by Output Quality, Not Invocation Count
High usage does not necessarily mean high product value.

### 5.5 Modules Should Be Designed to Get Smarter
The registry should anticipate future learning systems:
- context ranking
- retry optimization
- personalization
- genericity prediction
- module routing
- prompt variant selection

---

## 6. What Qualifies as a Module

A capability qualifies as a module only if it satisfies **all** of the following:

- a specific workflow role
- a bounded task
- a distinct output artifact
- a defined schema contract
- a defined context bundle
- a defined validator relationship
- a distinct evaluation standard
- meaningful product value

**Examples of valid modules:**
- Edge Snapshot
- Story Vault Analysis
- Narrative Direction Selection
- Outline Generation
- Essay Feedback
- Supplement Angle Suggestion
- Overlap Warning

**Examples of invalid pseudo-modules:**
- "general essay help"
- "college advice assistant"
- "improve my writing"
- "brainstorm more ideas"
- "ask AI anything about your application"

These are generic assistant surfaces, not differentiated product modules.

---

## 7. Registry Schema

Each registry entry should include the following fields.

### 7.1 Core Identity Fields
- `module_id`
- `module_name`
- `status`
- `module_version`
- `owner`
- `priority_tier`

### 7.2 Functional Fields
- `primary_purpose`
- `workflow_stage`
- `product_surface`
- `trigger_type`
- `execution_mode`
- `user_role_scope`

### 7.3 Intelligence Fields
- `context_bundle_class`
- `cross_artifact_dependency_level`
- `schema_contract`
- `validator_profile`
- `fallback_profile`
- `retry_profile`

### 7.4 Quality and Differentiation Fields
- `differentiation_role`
- `genericity_risk_level`
- `student_specificity_potential`
- `authenticity_sensitivity`
- `substitution_risk`
- `expected_output_uniqueness`

### 7.5 Telemetry and Learning Fields
- `success_signals`
- `failure_signals`
- `primary_quality_metrics`
- `ml_evolution_path`
- `optimization_priority`

### 7.6 Lifecycle and Governance Fields
- `prompt_version_family`
- `schema_version`
- `validator_version`
- `context_assembly_version`
- `benchmark_coverage_status`
- `last_reviewed`
- `promotion_state`

This field structure ensures the registry is **operational, not decorative.**

---

## 8. Registry Field Definitions

### 8.1 `module_id`
Stable canonical system identifier.

Example: `narrative_direction_selection`

### 8.2 `module_name`
Human-readable name.

Example: `Narrative Direction Selection`

### 8.3 `status`

| Value | Meaning |
|---|---|
| `planned` | Not yet in development |
| `building` | Actively in development |
| `internal_testing` | Under internal evaluation |
| `limited_release` | In scoped production release |
| `production` | Fully live |
| `deprecated` | No longer active |

### 8.4 `priority_tier`

| Value | Meaning |
|---|---|
| `core_moat` | Most tied to product differentiation against free AI |
| `high_value_support` | High product value, slightly more infrastructural |
| `workflow_support` | Supports continuity and workflow progression |
| `experimental` | Under evaluation for future addition |

### 8.5 `primary_purpose`
A one- or two-sentence statement of what product value the module creates.

This should be **precise and product-centered**, not vague.

### 8.6 `workflow_stage`

Examples: `discovery`, `story_development`, `direction_selection`, `structuring`, `draft_revision`, `supplement_strategy`, `package_strategy`

### 8.7 `trigger_type`

Examples: `user_initiated`, `state_change`, `system_refresh`, `artifact_created`, `artifact_updated`

### 8.8 `execution_mode`

Examples: `standard_generation`, `reduced_scope`, `diagnostic_only`, `needs_more_input`, `refresh_mode`

### 8.9 `context_bundle_class`
The named context package type the module depends on.

Examples: `snapshot_discovery_bundle`, `story_vault_signal_bundle`, `direction_selection_bundle`, `essay_feedback_bundle`, `supplement_angle_bundle`, `package_overlap_bundle`

### 8.10 `cross_artifact_dependency_level`

| Value | Meaning |
|---|---|
| `low` | Module performs mostly on immediate inputs |
| `medium` | Module depends on a few upstream artifacts |
| `high` | Module strongly depends on multiple prior artifacts |
| `critical` | Module quality is only possible through cross-artifact reasoning |

### 8.11 `validator_profile`
The validator ruleset family associated with the module.

Example: `essay_feedback_validator_profile_v1`

### 8.12 `differentiation_role`
A short explanation of why this module matters strategically.

**This is one of the most important fields in the registry.**

It should answer: *What does this module do that makes the product harder to imitate?*

### 8.13 `genericity_risk_level`

Values: `low` / `moderate` / `high` / `very_high`

Some modules are naturally more vulnerable to genericity than others.
This field helps prioritize attention.

### 8.14 `student_specificity_potential`

Values: `moderate` / `high` / `very_high`

This estimates how much the module can and should produce outputs unique to the individual student.

### 8.15 `substitution_risk`

Values: `low` / `moderate` / `high`

This reflects how easily a user might reproduce similar value with free AI.

This is **strategically critical.**

### 8.16 `expected_output_uniqueness`

Values: `lightly_personalized` / `meaningfully_individualized` / `deeply_student_specific`

### 8.17 `ml_evolution_path`
A short description of how machine learning could later improve the module without replacing product control.

---

## 9. Canonical Registry Template

Below is the recommended structure for a registry entry.

```json
{
  "module_id": "essay_feedback",
  "module_name": "Essay Feedback",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Provide structured, high-signal revision diagnosis that improves the student's draft without replacing authorship.",
  "workflow_stage": "draft_revision",
  "product_surface": "essay_workspace",
  "trigger_type": ["user_initiated", "artifact_updated"],
  "execution_mode": ["standard_generation", "reduced_scope", "needs_more_input"],
  "user_role_scope": ["student"],
  "context_bundle_class": "essay_feedback_bundle",
  "cross_artifact_dependency_level": "high",
  "schema_contract": "essay_feedback_schema_v1.0",
  "validator_profile": "essay_feedback_validator_profile_v1.0",
  "fallback_profile": "essay_feedback_fallback_v1.0",
  "retry_profile": "essay_feedback_retry_v1.0",
  "differentiation_role": "Turns feedback into ranked, student-specific revision priorities rather than generic writing commentary.",
  "genericity_risk_level": "high",
  "student_specificity_potential": "very_high",
  "authenticity_sensitivity": "critical",
  "substitution_risk": "moderate",
  "expected_output_uniqueness": "deeply_student_specific",
  "success_signals": [
    "student applies revision priorities",
    "lower regeneration rate",
    "improved reviewer specificity scores"
  ],
  "failure_signals": [
    "generic praise",
    "rewrite drift",
    "unranked critique",
    "high abandonment"
  ],
  "primary_quality_metrics": [
    "student_specificity_score",
    "authenticity_preservation_score",
    "decision_value_score",
    "anti_generic_score"
  ],
  "ml_evolution_path": "Later use learned scoring for revision-priority usefulness, context relevance weighting, and genericity-risk prediction.",
  "optimization_priority": "high",
  "prompt_version_family": "essay_feedback_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

## 10. Registry Entries for v1 Core Modules

---

### 10.1 Edge Snapshot

```json
{
  "module_id": "edge_snapshot",
  "module_name": "Edge Snapshot",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Infer the student's strongest likely themes, narrative assets, and discovery gaps from early input in a way that is sharper and more selective than generic personality summarization.",
  "workflow_stage": "discovery",
  "product_surface": "onboarding_completion / discovery_dashboard",
  "trigger_type": ["artifact_created", "artifact_updated", "system_refresh"],
  "execution_mode": ["standard_generation", "reduced_scope", "needs_more_input"],
  "user_role_scope": ["student"],
  "context_bundle_class": "snapshot_discovery_bundle",
  "cross_artifact_dependency_level": "medium",
  "schema_contract": "edge_snapshot_schema_v1.0",
  "validator_profile": "edge_snapshot_validator_profile_v1.0",
  "fallback_profile": "edge_snapshot_fallback_v1.0",
  "retry_profile": "edge_snapshot_retry_v1.0",
  "differentiation_role": "Transforms raw discovery inputs into ranked, non-generic narrative signal, helping the student see what actually has essay potential instead of receiving generic trait feedback.",
  "genericity_risk_level": "high",
  "student_specificity_potential": "high",
  "authenticity_sensitivity": "high",
  "substitution_risk": "moderate",
  "expected_output_uniqueness": "meaningfully_individualized",
  "success_signals": [
    "student proceeds into direction exploration",
    "strong reviewer scores on specificity",
    "low trait-list failure rate"
  ],
  "failure_signals": [
    "horoscope-style summaries",
    "cliché trait framing",
    "vague 'you are resilient' outputs",
    "high regenerate rate"
  ],
  "primary_quality_metrics": [
    "student_specificity_score",
    "admissions_specific_reasoning_score",
    "decision_value_score",
    "anti_generic_score"
  ],
  "ml_evolution_path": "Use learned discovery-pattern scoring to improve theme ranking, missing-element identification, and early genericity-risk prediction.",
  "optimization_priority": "high",
  "prompt_version_family": "edge_snapshot_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

### 10.2 Story Vault Analysis

```json
{
  "module_id": "story_vault_analysis",
  "module_name": "Story Vault Analysis",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Identify which saved stories have real narrative energy, reflective value, and strategic usefulness, rather than treating all story inventory as equally promising.",
  "workflow_stage": "story_development",
  "product_surface": "story_vault_workspace",
  "trigger_type": ["artifact_created", "artifact_updated", "user_initiated"],
  "execution_mode": ["standard_generation", "reduced_scope", "refresh_mode"],
  "user_role_scope": ["student"],
  "context_bundle_class": "story_vault_signal_bundle",
  "cross_artifact_dependency_level": "medium",
  "schema_contract": "story_vault_analysis_schema_v1.0",
  "validator_profile": "story_vault_analysis_validator_profile_v1.0",
  "fallback_profile": "story_vault_analysis_fallback_v1.0",
  "retry_profile": "story_vault_analysis_retry_v1.0",
  "differentiation_role": "Creates one of the strongest sources of product moat by distinguishing résumé material from true narrative material and uncovering underused student-specific story potential.",
  "genericity_risk_level": "moderate",
  "student_specificity_potential": "very_high",
  "authenticity_sensitivity": "high",
  "substitution_risk": "low",
  "expected_output_uniqueness": "deeply_student_specific",
  "success_signals": [
    "student selects stronger stories",
    "increased story reuse quality in later modules",
    "strong reviewer scores on specificity and usefulness"
  ],
  "failure_signals": [
    "award-summary bias",
    "weak story clustering",
    "shallow labeling of 'strong' stories",
    "low downstream usefulness"
  ],
  "primary_quality_metrics": [
    "student_specificity_score",
    "specificity_and_grounding_score",
    "distinctness_of_options_score",
    "overall_leverage_score"
  ],
  "ml_evolution_path": "Use learned story-value ranking, reflection-depth estimation, and story-cluster optimization based on downstream outcomes.",
  "optimization_priority": "very_high",
  "prompt_version_family": "story_vault_analysis_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

### 10.3 Narrative Direction Selection

```json
{
  "module_id": "narrative_direction_selection",
  "module_name": "Narrative Direction Selection",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Help the student choose the strongest personal statement lane through ranked, evidence-based comparison rather than broad brainstorming.",
  "workflow_stage": "direction_selection",
  "product_surface": "essay_planning / direction_selection_workspace",
  "trigger_type": ["user_initiated", "state_change"],
  "execution_mode": ["standard_generation", "reduced_scope", "needs_more_input"],
  "user_role_scope": ["student"],
  "context_bundle_class": "direction_selection_bundle",
  "cross_artifact_dependency_level": "high",
  "schema_contract": "narrative_direction_selection_schema_v1.0",
  "validator_profile": "narrative_direction_selection_validator_profile_v1.0",
  "fallback_profile": "narrative_direction_selection_fallback_v1.0",
  "retry_profile": "narrative_direction_selection_retry_v1.0",
  "differentiation_role": "This module converts discovery into decision. Its job is not to generate more possibilities, but to reduce ambiguity and identify the strongest lane for this specific student.",
  "genericity_risk_level": "high",
  "student_specificity_potential": "very_high",
  "authenticity_sensitivity": "high",
  "substitution_risk": "moderate",
  "expected_output_uniqueness": "deeply_student_specific",
  "success_signals": [
    "direction selection confidence",
    "lower abandonment at planning stage",
    "strong reviewer scores on decision value",
    "low 'all options feel the same' feedback"
  ],
  "failure_signals": [
    "fake variety",
    "no clear recommendation",
    "generic growth-lane repetition",
    "hedge-heavy ranking"
  ],
  "primary_quality_metrics": [
    "decision_value_score",
    "distinctness_of_options_score",
    "student_specificity_score",
    "admissions_specific_reasoning_score"
  ],
  "ml_evolution_path": "Use learned ranking to improve direction prioritization, distinctness scoring, and recommendation confidence calibration.",
  "optimization_priority": "very_high",
  "prompt_version_family": "narrative_direction_selection_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

### 10.4 Outline Generation

```json
{
  "module_id": "outline_generation",
  "module_name": "Outline Generation",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "high_value_support",
  "primary_purpose": "Translate a selected direction into strong structural options without drifting into draft writing or formulaic essay templates.",
  "workflow_stage": "structuring",
  "product_surface": "essay_structure / outline_workspace",
  "trigger_type": ["state_change", "user_initiated"],
  "execution_mode": ["standard_generation", "reduced_scope", "needs_more_input"],
  "user_role_scope": ["student"],
  "context_bundle_class": "outline_generation_bundle",
  "cross_artifact_dependency_level": "medium",
  "schema_contract": "outline_generation_schema_v1.0",
  "validator_profile": "outline_generation_validator_profile_v1.0",
  "fallback_profile": "outline_generation_fallback_v1.0",
  "retry_profile": "outline_generation_retry_v1.0",
  "differentiation_role": "Protects the product from generic essay-template behavior by turning narrative direction into structure without ghostwriting the actual essay.",
  "genericity_risk_level": "moderate",
  "student_specificity_potential": "high",
  "authenticity_sensitivity": "critical",
  "substitution_risk": "moderate",
  "expected_output_uniqueness": "meaningfully_individualized",
  "success_signals": [
    "student selects structure and advances",
    "low formula-template reviewer flags",
    "low prose-drift validator failures"
  ],
  "failure_signals": [
    "disguised drafting",
    "structurally duplicated options",
    "template-feeling outlines",
    "low student confidence in outline selection"
  ],
  "primary_quality_metrics": [
    "structural_fit_score",
    "authenticity_preservation_score",
    "distinctness_of_options_score",
    "decision_value_score"
  ],
  "ml_evolution_path": "Use learned structure-fit scoring to identify which outline patterns best support certain direction types and revision outcomes.",
  "optimization_priority": "medium_high",
  "prompt_version_family": "outline_generation_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

### 10.5 Essay Feedback

```json
{
  "module_id": "essay_feedback",
  "module_name": "Essay Feedback",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Provide student-specific revision diagnosis that improves essay quality through ranked critique and next-step clarity without replacing authorship.",
  "workflow_stage": "draft_revision",
  "product_surface": "essay_workspace / draft_review_interface",
  "trigger_type": ["user_initiated", "artifact_updated"],
  "execution_mode": ["standard_generation", "reduced_scope", "diagnostic_only", "needs_more_input"],
  "user_role_scope": ["student"],
  "context_bundle_class": "essay_feedback_bundle",
  "cross_artifact_dependency_level": "high",
  "schema_contract": "essay_feedback_schema_v1.0",
  "validator_profile": "essay_feedback_validator_profile_v1.0",
  "fallback_profile": "essay_feedback_fallback_v1.0",
  "retry_profile": "essay_feedback_retry_v1.0",
  "differentiation_role": "One of the most strategically important modules. It must deliver critique that is sharper, more admissions-native, and more authentic than free AI while never crossing into rewrite behavior.",
  "genericity_risk_level": "high",
  "student_specificity_potential": "very_high",
  "authenticity_sensitivity": "critical",
  "substitution_risk": "moderate",
  "expected_output_uniqueness": "deeply_student_specific",
  "success_signals": [
    "lower regeneration rate",
    "students revise using ranked priorities",
    "strong reviewer scores on specificity and leverage",
    "strong authenticity-preservation scores"
  ],
  "failure_signals": [
    "generic praise",
    "broad essay tips",
    "rewrite drift",
    "over-polite filler",
    "non-actionable critique"
  ],
  "primary_quality_metrics": [
    "student_specificity_score",
    "authenticity_preservation_score",
    "decision_value_score",
    "anti_generic_score"
  ],
  "ml_evolution_path": "Use learned scoring for revision priority usefulness, authenticity-risk prediction, and context-to-feedback relevance optimization.",
  "optimization_priority": "very_high",
  "prompt_version_family": "essay_feedback_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

### 10.6 Supplement Angle Suggestion

```json
{
  "module_id": "supplement_angle_suggestion",
  "module_name": "Supplement Angle Suggestion",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Recommend school-specific, prompt-specific, package-aware angles that help the student avoid generic supplements and lazy repetition of the personal statement.",
  "workflow_stage": "supplement_strategy",
  "product_surface": "supplement_planning_workspace",
  "trigger_type": ["user_initiated", "artifact_created", "state_change"],
  "execution_mode": ["standard_generation", "reduced_scope", "needs_more_input", "refresh_mode"],
  "user_role_scope": ["student"],
  "context_bundle_class": "supplement_angle_bundle",
  "cross_artifact_dependency_level": "critical",
  "schema_contract": "supplement_angle_suggestion_schema_v1.0",
  "validator_profile": "supplement_angle_suggestion_validator_profile_v1.0",
  "fallback_profile": "supplement_angle_suggestion_fallback_v1.0",
  "retry_profile": "supplement_angle_suggestion_retry_v1.0",
  "differentiation_role": "This module is a major anti-generic weapon. It must produce angles that are not just 'why this school' ideas, but student-specific, package-aware strategic choices.",
  "genericity_risk_level": "very_high",
  "student_specificity_potential": "very_high",
  "authenticity_sensitivity": "high",
  "substitution_risk": "high_if_weak_low_if_done_well",
  "expected_output_uniqueness": "deeply_student_specific",
  "success_signals": [
    "students select angles with confidence",
    "lower overlap with personal statement",
    "strong reviewer scores on school specificity and uniqueness",
    "low templated-school-fit flags"
  ],
  "failure_signals": [
    "school-agnostic recommendations",
    "prompt-generic angle sets",
    "repeated personal statement thesis",
    "fake school specificity"
  ],
  "primary_quality_metrics": [
    "student_specificity_score",
    "admissions_specific_reasoning_score",
    "anti_generic_score",
    "decision_value_score"
  ],
  "ml_evolution_path": "Use learned school-fit relevance scoring, package-overlap prediction, and student-story-to-prompt matching.",
  "optimization_priority": "very_high",
  "prompt_version_family": "supplement_angle_suggestion_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

### 10.7 Overlap Warning

```json
{
  "module_id": "overlap_warning",
  "module_name": "Overlap Warning",
  "status": "production",
  "module_version": "v1.0",
  "owner": "product_ai",
  "priority_tier": "core_moat",
  "primary_purpose": "Detect narrative redundancy across the application package and help the student preserve range, coherence, and strategic differentiation.",
  "workflow_stage": "package_strategy",
  "product_surface": "application_package_review / supplement_review",
  "trigger_type": ["artifact_updated", "system_refresh", "state_change"],
  "execution_mode": ["diagnostic_only", "refresh_mode", "needs_more_input"],
  "user_role_scope": ["student"],
  "context_bundle_class": "package_overlap_bundle",
  "cross_artifact_dependency_level": "critical",
  "schema_contract": "overlap_warning_schema_v1.0",
  "validator_profile": "overlap_warning_validator_profile_v1.0",
  "fallback_profile": "overlap_warning_fallback_v1.0",
  "retry_profile": "overlap_warning_retry_v1.0",
  "differentiation_role": "One of the clearest package-level differentiators in the product. Free AI rarely reasons across the whole application strategically; this module should.",
  "genericity_risk_level": "moderate",
  "student_specificity_potential": "high",
  "authenticity_sensitivity": "medium_high",
  "substitution_risk": "low",
  "expected_output_uniqueness": "meaningfully_individualized",
  "success_signals": [
    "package differentiation improves",
    "lower thematic redundancy across essays",
    "strong reviewer scores on strategic usefulness"
  ],
  "failure_signals": [
    "lexical-similarity behavior",
    "vague overlap diagnosis",
    "no meaningful differentiation suggestions",
    "confusion between coherence and redundancy"
  ],
  "primary_quality_metrics": [
    "admissions_specific_reasoning_score",
    "specificity_and_grounding_score",
    "decision_value_score",
    "overall_leverage_score"
  ],
  "ml_evolution_path": "Use learned cross-essay thematic mapping, overlap-severity scoring, and suggestion ranking for package diversification.",
  "optimization_priority": "high",
  "prompt_version_family": "overlap_warning_prompt_family_v1",
  "schema_version": "v1.0",
  "validator_version": "v1.0",
  "context_assembly_version": "v1.0",
  "benchmark_coverage_status": "covered",
  "last_reviewed": "2026-03-11",
  "promotion_state": "approved"
}
```

---

## 11. Registry-Level Strategic Segmentation

To help the team prioritize investment, modules should be grouped by strategic role.

### 11.1 Core Moat Modules

These are the modules most responsible for making the product meaningfully better than generic AI:

| Module | Primary Differentiation |
|---|---|
| `story_vault_analysis` | Distinguishes résumé material from narrative material |
| `narrative_direction_selection` | Converts discovery into a clear, ranked decision |
| `essay_feedback` | Student-specific ranked critique without ghostwriting |
| `supplement_angle_suggestion` | Package-aware, school-specific angle strategy |
| `overlap_warning` | Strategic package-level narrative differentiation |

**Why they matter:** These modules create the deepest value through student-specificity, package reasoning, ranking, authenticity protection, and cross-artifact intelligence.

### 11.2 High-Value Support Modules

These matter a great deal, but are slightly more infrastructural or transitional:

| Module | Primary Role |
|---|---|
| `edge_snapshot` | Converts raw discovery into narrative signal |
| `outline_generation` | Translates direction into structure without ghostwriting |

**Why they matter:** They create continuity and momentum and help the user move from raw material into usable structure.

### 11.3 Future Experimental Candidates

The registry should later leave room for modules such as:

- essay opening diagnosis
- reflection depth analyzer
- cliché risk detector
- school-fit evidence gap detector
- revision progress tracker
- student voice drift detector

**Rule**

> Do not promote experimental capabilities into core modules without bounded purpose and real differentiation logic.

---

## 12. Unique-Output Standard by Module

Every module should be held to an expected uniqueness bar.

| Module | Minimum Expected Uniqueness |
|---|---|
| `edge_snapshot` | `meaningfully_individualized` |
| `story_vault_analysis` | `deeply_student_specific` |
| `narrative_direction_selection` | `deeply_student_specific` |
| `outline_generation` | `meaningfully_individualized` |
| `essay_feedback` | `deeply_student_specific` |
| `supplement_angle_suggestion` | `deeply_student_specific` |
| `overlap_warning` | `meaningfully_individualized` |

**Core rule**

> If a module repeatedly produces outputs below its uniqueness bar, it is not meeting the product standard.

This is one of the most important operating ideas in the registry.

---

## 13. Genericity Risk Strategy

Some modules are more dangerous than others when they regress.

**Highest genericity risk modules:**

| Module | Risk Driver |
|---|---|
| `supplement_angle_suggestion` | High user comparison vs free AI; school-fit prompts invite templates |
| `essay_feedback` | Generic praise and broad advice patterns are pervasive in free AI |
| `edge_snapshot` | Trait-language summarization is a default free-AI behavior |
| `narrative_direction_selection` | Brainstorm-mode is the free-AI default; selection pressure requires discipline |

These should receive:
- tighter benchmark coverage
- tighter evaluator scrutiny
- stronger validator attention
- earlier ML investment for genericity reduction

**Why this matters:** These are the modules users will compare most directly against free AI. If these drift toward genericity, the product moat weakens fastest.

---

## 14. Machine Learning Evolution Strategy by Module

Machine learning should not be treated as a vague platform layer.
It should be **mapped concretely module by module.**

### 14.1 Story-Centric Modules

For modules like `story_vault_analysis` and `narrative_direction_selection`, ML can later improve:
- story ranking
- reflection-depth estimation
- latent theme clustering
- story-to-direction mapping
- uniqueness prediction

### 14.2 Draft-Centric Modules

For modules like `essay_feedback` and `outline_generation`, ML can later improve:
- revision priority usefulness prediction
- genericity-risk prediction
- context relevance ranking
- structure-fit scoring
- authenticity-risk detection

### 14.3 Package-Centric Modules

For modules like `supplement_angle_suggestion` and `overlap_warning`, ML can later improve:
- prompt-to-story matching
- school-fit evidence scoring
- package-overlap prediction
- differentiation suggestion ranking
- cross-artifact coherence scoring

### 14.4 Registry Rule

> The registry should explicitly mark where ML investment is expected to create the most differentiated value, rather than treating ML as a generic horizontal add-on.

---

## 15. Operational Use Cases of the Registry

The module registry should support at least the following operational tasks:

- release planning
- benchmark coverage planning
- validator prioritization
- telemetry review
- ownership assignment
- regression investigations
- ML roadmap planning
- experiment targeting
- identifying duplicate module concepts
- identifying missing product capabilities

This is why the registry must stay **concrete.**

---

## 16. Reviewer Questions for the Registry

When deciding whether a module belongs in the product, ask:

- Does this module have a unique product job?
- Does it create value beyond free AI?
- Is its output expected to be genuinely student-specific?
- Does it have a bounded schema and validator profile?
- Does it fit a real workflow stage?
- Does it protect authenticity?
- Does it support product learning over time?
- Is it core to the moat or just superficially AI-shaped?

These questions should guide expansion decisions.

---

## 17. Anti-Patterns to Avoid

Do not allow the registry to become:

- a feature wishlist
- a prompt inventory disguised as architecture
- a catch-all list of "places AI appears"
- a generic assistant roadmap
- a bag of overlapping modules
- a static document with no operational use
- an abstraction layer with no measurement or ownership
- an ML roadmap with no product boundaries

A weak registry makes it easier for the product to drift toward genericity.

---

## 18. World-Class Registry Standard

A world-class module registry should do all of the following:

- define real capability boundaries
- clarify what each module uniquely contributes
- make the moat legible
- expose where genericity risk is highest
- make student-specificity an explicit module expectation
- connect modules to schemas, validators, context bundles, and telemetry
- support governance and experimentation
- guide where machine learning can meaningfully improve the product
- prevent the intelligence layer from collapsing into generic assistant behavior

That is the standard.

---

## 19. Non-Negotiables

- Every production AI module must have a canonical registry entry.
- Every module must have a bounded purpose and bounded output artifact.
- Modules that do not create differentiated value should not exist.
- Student-specificity and anti-generic performance must be explicit registry concerns.
- The registry must identify which modules are core to the moat.
- The registry must remain open to ML-assisted optimization without surrendering product control.
- The product's value remains in structured judgment, authenticity protection, and differentiated content — not in generic AI presence.

---

## 20. Recommended Next Artifacts

Create next:

1. `QUALITY_MONITORING_DASHBOARD_SPEC_V1.md`
2. `EXAMPLE_OUTPUT_BENCHMARKS_V1.md`
3. `MODEL_PROVIDER_ABSTRACTION_SPEC_V1.md`
4. `ML_EVOLUTION_ROADMAP_V1.md`

---

## Final Directive

The College Admissions Edge will not become world-class by having "AI features."

It becomes world-class by building a system of bounded, purposeful, measured modules that:

- do different jobs,
- reason in different ways,
- use different evidence,
- protect the student differently,
- and together produce a product that is harder to imitate than generic AI platforms.

If prompt architecture defines *how* the system is asked to think,
if context assembly defines *what* it is allowed to know,
if schemas define *what* it is allowed to return,
if validators define *what* the product is willing to trust,
if orchestration defines *how* the system runs,
if the rubric defines *how* quality is judged,
and if prompt governance defines *how* the system evolves,

then the module registry defines:

> **what the intelligence layer actually is.**

And that is exactly the document that keeps the system from dissolving into generic AI behavior over time.
