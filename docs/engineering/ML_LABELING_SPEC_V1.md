# ML_LABELING_SPEC_V1
## The College Admissions Edge
### v1 ML Labeling Specification

---

## 1. Purpose

This document defines the structured labels the product will capture so the system can improve over time through disciplined learning.

It exists to answer this question:

> What exactly should the system record from outputs, reviews, outcomes, and failures so future ML can improve the product without weakening its standards?

This is not a generic annotation framework.
It is the product’s learning substrate.

---

## 2. Core Labeling Principle

The system should learn from product-defined quality, not from raw model output alone.

That means labels must reflect:

- product value
- student specificity
- authenticity
- anti-generic performance
- workflow usefulness
- real failure patterns

**Core rule**

Do not collect labels because they are easy. Collect labels because they teach the system what the product means by quality.

---

## 3. Label Families

The labeling system should include six families:

- artifact quality labels
- uniqueness labels
- authenticity labels
- failure-pattern labels
- outcome labels
- review-confidence labels

---

## 4. Artifact Quality Labels

### Primary quality label

- `world_class`
- `strong`
- `acceptable`
- `weak`
- `fail`

### Definition

This is the overall human or benchmark judgment of the artifact relative to the product standard.

### Rule

This label must not be assigned based on polish alone.

---

## 5. Uniqueness Labels

### Values

- `commodity_like`
- `lightly_personalized`
- `meaningfully_individualized`
- `deeply_student_specific`

### Definition

Measures how specific the output is to the actual student and whether it feels interchangeable with outputs for other students.

### Rule

This is one of the most strategically important label families in the product.

---

## 6. Authenticity Labels

### Values

- `authenticity_safe`
- `mild_authenticity_risk`
- `high_authenticity_risk`

### Definition

Measures whether the output stays within student-authorship boundaries and avoids synthetic overreach.

### Common triggers

- rewrite drift
- over-polish
- voice replacement
- ready-to-submit language

---

## 7. Substitution-Risk Labels

### Values

- `high_substitution_risk`
- `moderate_substitution_risk`
- `low_substitution_risk`

### Definition

Measures how easily a similar result could likely be reproduced through free AI or basic prompting outside the product.

### Rule

A low-quality but well-structured artifact can still be high substitution risk.

---

## 8. Failure-Pattern Labels

These labels identify why an artifact is weak.

### Approved v1 failure labels

- `trait_list_output`
- `generic_praise_block`
- `school_agnostic_angle`
- `templated_school_fit`
- `weak_decision_pressure`
- `duplicate_option_set`
- `ghostwriting_drift`
- `final_prose_risk`
- `over_polish_risk`
- `resume_recap_bias`
- `thin_overlap_reasoning`
- `non_actionable_diagnosis`
- `low_specificity_feedback`
- `fake_variety_output`
- `context_mismatch`
- `needs_more_input_should_have_triggered`

### Rule

Failure labels should be additive. A single artifact may carry multiple labels.

---

## 9. Outcome Labels

These labels reflect what happened after the artifact was shown.

### Approved v1 outcome labels

- `user_selected_recommendation`
- `user_ignored_output`
- `user_regenerated`
- `user_followed_next_step`
- `user_changed_direction`
- `user_revised_draft`
- `review_escalated`
- `benchmark_candidate`
- `false_pass`
- `false_block`

### Definition

These are critical for later usefulness modeling and routing optimization.

---

## 10. Review-Confidence Labels

### Values

- `high_confidence_review`
- `medium_confidence_review`
- `low_confidence_review`

### Definition

Indicates reviewer certainty in the assigned labels.

### Why this matters

Not all human reviews are equally strong. Confidence should be captured so later ML systems can weight labels appropriately.

---

## 11. Module-Specific Label Emphasis

Different modules should emphasize different label families.

### Edge Snapshot

High importance:

- uniqueness
- anti-generic failure labels
- substitution risk

### Story Vault Analysis

High importance:

- story-value failure labels
- uniqueness
- decision usefulness

### Narrative Direction Selection

High importance:

- weak decision pressure
- fake variety
- user_selected_recommendation

### Outline Generation

High importance:

- final_prose_risk
- duplicate_option_set
- structure usefulness

### Essay Feedback

High importance:

- low_specificity_feedback
- generic_praise_block
- ghostwriting_drift
- user_revised_draft

### Supplement Angle Suggestion

High importance:

- school_agnostic_angle
- templated_school_fit
- overlap-aware usefulness
- substitution risk

### Overlap Warning

High importance:

- thin_overlap_reasoning
- package usefulness
- user_changed_direction

---

## 12. Label Record Structure

Each labeled artifact should store at minimum:

- artifact_id
- module_id
- labeler_id
- label_source (`human_review`, `benchmark`, `validator`, `derived_outcome`)
- quality_label
- uniqueness_label
- authenticity_label
- substitution_risk_label
- failure_labels[]
- outcome_labels[]
- review_confidence
- notes
- created_at

---

## 13. Label Source Hierarchy

When multiple label sources exist, the system should preserve them separately.

### Order of interpretive strength

1. benchmark-reviewed label
2. escalation-review label
3. standard human review label
4. validator-derived signal
5. passive outcome-derived label

### Rule

Do not overwrite stronger labels with weaker inferred ones.

---

## 14. Labeling Rules

- labels must reflect product quality, not just stylistic preference
- labels should be sparse but meaningful
- labels must remain stable over time
- labels should map directly to benchmark and rubric logic
- labels should be interpretable by humans and usable by models

---

## 15. What These Labels Are For

These labels will later support:

- genericity prediction
- authenticity-risk prediction
- substitution-risk prediction
- reviewer queue prioritization
- benchmark candidate recommendation
- context bundle optimization
- module routing
- retry-worthiness scoring
- release regression detection

This is why the label system must stay disciplined now.

---

## 16. Final Directive

The labeling system is not metadata clutter.

It is the mechanism by which the product learns what makes an output:

- worth paying for
- specific to the student
- safe for authorship
- strategically useful
- clearly beyond generic AI

That is the point of labels in this system.
