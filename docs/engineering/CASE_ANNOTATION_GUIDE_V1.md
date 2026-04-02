# CASE_ANNOTATION_GUIDE_V1
## The College Admissions Edge
### v1 Case Annotation Guide

---

## 1. Purpose

This guide defines how benchmark cases and reviewed artifacts should be annotated so they are:

- useful to humans
- useful to validators
- useful to benchmarking
- useful to future ML systems

Without disciplined annotation, examples become subjective and lose operational value.

---

## 2. Core Annotation Principle

Annotation should explain why an output is strong, weak, generic, risky, or valuable.

It should not merely say:

- “good”
- “bad”
- “strong”
- “weak”

**Core rule**

Every annotation should teach the system and the team something reusable about product quality.

---

## 3. What Annotations Are For

Annotations support:

- reviewer calibration
- benchmark library quality
- validator tuning
- release review
- regression analysis
- ML label quality

That means annotations must be concise, structured, and product-specific.

---

## 4. Required Annotation Fields

Every annotated case or artifact should include:

- `case_summary`
- `why_this_case_matters`
- `world_class_behavior_target`
- `acceptable_behavior_floor`
- `most_likely_generic_failure`
- `most_likely_authenticity_failure` (if relevant)
- `what_a_reviewer_should_notice`
- `what_the_validator_should_catch`
- `uniqueness_expectation`
- `substitution_risk_interpretation`

---

## 5. Annotation Rules

### Rule 1 — Write to the Product Standard

Annotations should reference student specificity, authenticity, decision value, and anti-generic behavior.

### Rule 2 — Avoid Vague Praise

**Bad annotation:**

“This is strong and insightful.”

**Better annotation:**

“This is strong because it identifies the student’s real narrative center without falling back on trait language.”

### Rule 3 — Name the Actual Failure Mode

**Bad annotation:**

“This could be better.”

**Better annotation:**

“This fails because it treats two meaningfully unequal directions as equally strong.”

### Rule 4 — Focus on Leverage

A good annotation identifies the most important thing the product got right or wrong.

### Rule 5 — Stay Human-Readable

Annotations should help reviewers quickly understand the case. They should not become opaque internal jargon.

---

## 6. Annotation Categories

### Strength Annotation

Explains why an output is strong.

### Weakness Annotation

Explains why an output is weak.

### Genericity Annotation

Explains what makes the output feel like commodity AI.

### Authenticity Annotation

Explains where the output risks replacing the student’s voice or authorship.

### Decision Annotation

Explains whether the output meaningfully helped the student choose, revise, or move forward.

### Substitution Annotation

Explains how easily the output could be replicated outside the product.

---

## 7. Example Annotation Prompts for Reviewers

Use prompts like:

- What exactly makes this feel specific to this student?
- What makes this feel replaceable?
- What did the system correctly prioritize?
- Where did it avoid a generic default?
- Where did it become too polished?
- What would a free AI tool likely do here?
- What did the product do better than that?

These prompts keep annotations sharp.

---

## 8. Annotation Standards by Artifact Class

### World-Class Artifact

Annotation should explain:

- what makes it uniquely strong
- why it would be hard to imitate
- what product behavior should be preserved

### Acceptable Artifact

Annotation should explain:

- why it passes
- where it still lacks edge
- why it is not yet benchmark-best

### Generic Failure Artifact

Annotation should explain:

- what makes it generic
- what stronger behavior should have happened instead

### Authenticity Failure Artifact

Annotation should explain:

- how the system overreached
- what the right boundary-preserving behavior would have been

---

## 9. Annotation Style Guide

Use:

- plain, precise language
- short paragraphs or compact bullets internally if needed
- direct reference to product value

Do not use:

- empty praise
- vague “insightful/helpful/strong” language
- generic writing advice
- overlong commentary that obscures the core point

---

## 10. Annotation Quality Check

A strong annotation should answer all three:

- what happened
- why it matters
- what the system should learn from it

If one is missing, the annotation is weak.

---

## 11. Final Directive

The benchmark library and review system will only be as strong as the annotations attached to them.

A good annotation turns an example into product intelligence.

That is the standard.
