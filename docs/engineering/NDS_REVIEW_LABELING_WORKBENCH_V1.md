# NDS Review Labeling Workbench — V1

**Document ID:** `NDS_REVIEW_LABELING_WORKBENCH_V1`
**Status:** Specification
**Version:** 1.0
**Parent spec:** `NDS_LEARNED_JUDGMENT_SYSTEM_V1`
**Schema contract:** `NDS_LEARNED_JUDGMENT_DATA_SCHEMA_V1`
**Last updated:** 2025-07

---

## Purpose

This document specifies the internal review labeling workbench — the tooling, workflow, and quality standards by which human reviewers assess NDS outputs and produce the gold-label training data that drives all learned models.

The workbench is an internal tool (not user-facing). Its output is `nds_human_labels` rows. The quality of those rows directly determines the quality of every downstream model. This spec must be treated as a first-class product requirement.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Review Tiers](#2-review-tiers)
3. [Case Presentation Spec](#3-case-presentation-spec)
4. [Label Schema (Workbench View)](#4-label-schema-workbench-view)
5. [Workflow Specification](#5-workflow-specification)
6. [Adjudication Protocol](#6-adjudication-protocol)
7. [Reviewer Onboarding and Calibration](#7-reviewer-onboarding-and-calibration)
8. [Label Quality Monitoring](#8-label-quality-monitoring)
9. [Queue Management Spec](#9-queue-management-spec)
10. [Anti-Patterns and Reviewer Guidance](#10-anti-patterns-and-reviewer-guidance)
11. [Technical Implementation Notes](#11-technical-implementation-notes)
12. [Quality Targets](#12-quality-targets)

---

## 1. Design Philosophy

### 1.1 Why this matters

The NDS learned judgment system is only as good as its labels. A model trained on ambiguous, inconsistently applied, or motivated labels will learn the wrong things — it will optimize for reviewer convenience rather than student outcomes.

The workbench must:
- Make the task unambiguous for reviewers
- Make fast review possible without sacrificing quality
- Surface the full context a reviewer needs (not more, not less)
- Catch systematic reviewer drift before it contaminates training data
- Log everything needed to audit any label, any time

### 1.2 What reviewers are asked to do

Reviewers make judgments about **whether the system's behavior was correct** given the student's actual input. They are not asked to rate whether they personally like the direction. They are not asked to rewrite the output. They are asked:

1. Was the routing decision (show / clarify / block) the right call?
2. Was the selected candidate the best available?
3. Was there a better candidate the system failed to select?
4. Was there no good candidate at all in the set?
5. Did the output respect and reflect the student's actual voice and situation?
6. Would the student understand and trust this output?

These are assessable, learnable questions with meaningful variation. They map directly to the failure classes identified in the attribution triage.

### 1.3 What reviewers are NOT asked to do

- Rewrite direction lines or explanations.
- Judge grammar or prose style.
- Evaluate the student's essay quality.
- Predict future outcomes.
- Rate the system's helpfulness on an open-ended scale without anchors.

---

## 2. Review Tiers

The workbench operates three labeling tiers. Every case in the review queue is assigned a tier before reviewers see it. Tier assignment is automatic and based on signals described in §9.

### Tier 1: High-Value Review

**Definition:** Cases that are expected to contribute disproportionately to training data quality. Cases are assigned high-value if any of the following hold:
- The run's `route_taken` is `'show'` AND `route_confidence < 0.6`
- The selected candidate has `is_generic = true` AND `is_selected = true`
- The NDS system's candidate set has `set_all_generic = true`
- The run was previously labeled as `trust_verdict = 'borderline'` by another reviewer
- The case falls in a known failure cluster (as identified by a recent evaluation sprint)

**Reviewer requirement:** High-value cases must be reviewed by a **trained reviewer** only (not first-week reviewers). Minimum review time: 3 minutes. Minimum completeness: all fields required (no skips permitted).

**Adjudication:** All high-value cases receive a second review by an independent reviewer. Disagreements are escalated to the adjudicator. See §6.

**Target volume:** 20–30% of queue at any given time.

---

### Tier 2: Standard Review

**Definition:** All other labeled cases that don't qualify for high-value but are not clearly low-signal. This is the bulk of the labeling workload.

**Reviewer requirement:** Any trained reviewer. Minimum review time: 90 seconds. Required fields: all case-level and candidate-level labels. Output-level and trust labels may be provided at reduced granularity (see §4 for which fields are optional at this tier).

**Adjudication:** Standard cases receive a second review only when the first reviewer flags `confidence_level = 'low'` or leaves `reviewer_notes` indicating uncertainty.

**Target volume:** 60–70% of queue.

---

### Tier 3: Lightweight Review

**Definition:** Cases where full review is not cost-effective. Assigned to:
- Shadow runs (from `is_shadow_run = true`) where no user interaction occurred
- Runs with very high system confidence (`route_confidence > 0.92`) and no generic candidates
- Runs from batch regression evaluation (not live user sessions)

**Reviewer requirement:** Any reviewer. Only case-level and candidate-level labels required. Output-level and trust labels optional.

**Adjudication:** Not required unless a subsequent model evaluation reveals high error rates in this tier's labels.

**Target volume:** 10–15% of queue.

---

## 3. Case Presentation Spec

The workbench must present the following information to the reviewer in a single scrollable view, organized as specified below.

### 3.1 Section 1: Input context (read-only)

```
STUDENT INPUT
─────────────────────────────────────────────────────
[Full essay text, rendered as plain text with line breaks preserved]

Word count: {input_word_count}
Specificity score: {input_specificity_score} (0–1)
Narrative signal count: {input_narrative_signal_count}
Surface-only flag: {input_surface_only_flag}
Contradiction detected: {input_contradiction_detected}
Indirect signal present: {input_has_indirect_signal}
```

**Rendering notes:**
- Essay text is shown in full, unedited, unformatted (no syntax highlighting, no margin markers).
- Specificity score and other derived signals are shown numerically with a 0–1 scale indicator. No traffic-light color coding — reviewers must not be anchored by system pre-judgments.
- The `contradiction_detected` flag is shown but its meaning is not explained inline; reviewers learn the definitions during calibration training.

### 3.2 Section 2: System decision (read-only)

```
SYSTEM DECISION
─────────────────────────────────────────────────────
Routing: {route_taken}  (confidence: {route_confidence})
NDS version: {nds_version}
```

**Rendering notes:**
- Route confidence is shown as a decimal (e.g., `0.74`), not as a percentage or bar chart.
- No "good/bad" visual framing of the routing decision — the reviewer determines correctness.

### 3.3 Section 3: All candidates (read-only, ranked order)

For each candidate, in order by `candidate_rank`:

```
CANDIDATE {n}  {is_selected ? "[SELECTED]" : ""}
─────────────────────────────────────────────────────
Direction: {direction_label} — {direction_line}

Explanation:
{explanation_text}

Signals: generic={is_generic} | premium={is_premium} | contradiction={is_contradiction}
         scene_anchor={scene_anchor_present} | indirect_signal={indirect_signal_used}
Specificity: {direction_specificity_score}
Grounding: {explanation_grounding_score}
```

**Rendering notes:**
- All candidates are always shown, not just the selected one. Reviewers need full context to assess `better_candidate_existed`.
- Signal flags are shown exactly as above (binary labels, no color coding, no icons).
- The selected candidate is visually distinguished by the `[SELECTED]` marker only — no other emphasis.

### 3.4 Section 4: Label form (interactive)

See §4 for full field specification. The form follows Section 3 immediately in the same scroll view.

---

## 4. Label Schema (Workbench View)

This section specifies every field in the label form, organized by label group. Required/optional status is per-tier.

### 4.1 Routing assessment

| Field | Type | Tier 1 | Tier 2 | Tier 3 | Description |
|-------|------|--------|--------|--------|-------------|
| `route_verdict` | `correct / incorrect / borderline` | Required | Required | Required | Was this routing decision the right call? |
| `route_correct_would_be` | `show / clarify / block` | If incorrect | If incorrect | Optional | What should the route have been? |
| `clarification_better` | Boolean | Required | Required | Optional | Would clarify have been better than show? |

**Anchor definitions for `route_verdict`:**

- **`correct`:** Given everything visible in the input, this was the best routing decision. There may be imperfections in the output, but the routing itself was sound.
- **`borderline`:** Reasonable people could disagree. Either show or clarify would have been defensible. Use this when the call was close but not clearly wrong.
- **`incorrect`:** The routing was clearly wrong. A different route would have produced a meaningfully better student experience.

### 4.2 Candidate quality assessment

| Field | Type | Tier 1 | Tier 2 | Tier 3 | Description |
|-------|------|--------|--------|--------|-------------|
| `no_good_candidate` | Boolean | Required | Required | Required | Was there **no** acceptable candidate in the full set? |
| `selected_candidate_quality` | `good / acceptable / poor / harmful` | Required | Required | Required | Quality of the selected (or rank-1) candidate |
| `better_candidate_existed` | Boolean | Required | Required | Required | Was a non-selected candidate clearly better? |
| `better_candidate_id` | UUID select | If true | If true | If true | Which candidate was better? |

**Anchor definitions for `selected_candidate_quality`:**

- **`good`:** This direction is well-grounded in the student's actual input, specific to their situation, and would give them clear, useful guidance.
- **`acceptable`:** This direction is usable. It's not ideal but a student following it would not be misled. Noticeable weaknesses but no serious flaws.
- **`poor`:** This direction is generic, misleading, or weakly grounded. Following it would likely not help the student and might lead them in the wrong direction.
- **`harmful`:** This direction could actively damage the student's essay or their confidence. Includes: false premium framing that erases the student's actual voice, contradictions of evidence in the essay, directions that would push the student toward a worse essay.

**Anchor definitions for `no_good_candidate`:**

- Mark TRUE if you would not recommend **any** of the candidates shown. Even the best one in the set would result in a poor or harmful outcome.
- Mark FALSE if at least one candidate (selected or not) is at `acceptable` quality or better.
- Do not mark TRUE simply because the set could have been better. Mark TRUE only when every candidate fails the acceptable bar.

### 4.3 Failure classification

| Field | Type | Tier 1 | Tier 2 | Tier 3 | Description |
|-------|------|--------|--------|--------|-------------|
| `case_failure_class` | enum | Required if incorrect | Required if incorrect | Optional | Root cause of the failure |

**Failure class definitions:**

| Class | Definition |
|-------|------------|
| `candidate_generation` | The core problem is that no good candidate existed. The LLM did not generate a strong, grounded direction from this input. Scoring, routing, and explanation are secondary to this root failure. |
| `trust_calibration` | A reasonable candidate existed, but the output presentation (direction line phrasing, explanation quality) undermined trust or obscured the candidate's genuine value. |
| `routing_calibration` | The candidate set was acceptable, but the system chose the wrong route (e.g., showed when it should have clarified, or blocked when it could have shown). |
| `none` | The case was a success, or the failure is too ambiguous to assign. |

### 4.4 Output quality assessment

| Field | Type | Tier 1 | Tier 2 | Tier 3 | Description |
|-------|------|--------|--------|--------|-------------|
| `direction_line_accurate` | Boolean | Required | Required | Optional | Is the direction line factually/logically accurate given the essay? |
| `direction_line_grounded` | Boolean | Required | Required | Optional | Does it reference a specific scene, detail, or attribute from the essay? |
| `direction_line_premium_flag` | Boolean | Required | Required | Optional | Does it use prestige/virtue framing without grounding? |
| `direction_line_flattening` | Boolean | Required | Required | Optional | Does it flatten or generalize the student's distinct voice? |
| `explanation_accurate` | Boolean | Required | Required | Optional | Is the explanation factually correct re: the student's input? |
| `explanation_grounded` | Boolean | Required | Required | Optional | Does the explanation cite or clearly draw from the essay? |
| `explanation_adds_value` | Boolean | Required | Required | Optional | Does the explanation add genuinely useful guidance? |

**Anchor definition for `direction_line_premium_flag`:**

Mark TRUE when the direction line sounds impressive or prestigious but is not anchored in something the student actually wrote. Examples: "leadership excellence through adversity," "intellectual depth revealed through curiosity," "resilience through challenge" — when no specific instance of these is present in the essay. Mark FALSE if the line directly names or alludes to a specific scene.

**Anchor definition for `direction_line_flattening`:**

Mark TRUE when the direction line could have been written for any student who wrote a roughly similar topic. It could be copy-pasted into 100 different essays without modification. It says nothing specific about this student. Mark FALSE if a student who did not write this essay could not plausibly use this direction.

### 4.5 Trust and helpfulness assessment

| Field | Type | Tier 1 | Tier 2 | Tier 3 | Description |
|-------|------|--------|--------|--------|-------------|
| `trust_verdict` | `trusted / untrusted / borderline` | Required | Required | Optional | Would a student correctly trust this output? |
| `helpfulness_verdict` | `helpful / neutral / harmful` | Required | Required | Optional | Net effect on student's essay progress |
| `false_premium_present` | Boolean | Required | Required | Optional | Is false premium language present anywhere in the output? |
| `student_voice_preserved` | Boolean | Required | Required | Optional | Does the output reflect and protect the student's actual voice? |

**Anchor definitions for `trust_verdict`:**

- **`trusted`:** A student who trusts this output and follows it would likely end up in a better place. The output earns its trust.
- **`borderline`:** The output is not obviously trustworthy or untrustworthy. Following it might go either way depending on the student.
- **`untrusted`:** A student who trusts and follows this output would likely be led astray — toward a more generic, less authentic essay, or toward a direction that doesn't fit their actual material.

### 4.6 Reviewer metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `confidence_level` | `high / medium / low` | Always | Reviewer's confidence in their own labels |
| `reviewer_notes` | Text | Optional | Free text for ambiguous cases, edge cases, or flags |

**Guidance on `confidence_level`:**

- **`high`:** You are certain about all your labels. No material ambiguity in the case.
- **`medium`:** You have a clear view but there are one or two things you're uncertain about (e.g., a specific flag's applicability).
- **`low`:** You reviewed the case but you genuinely don't know whether the labels you selected are correct. The case should go to adjudication.

---

## 5. Workflow Specification

### 5.1 Queue entry

Cases enter the review queue through one of three paths:

1. **Live run ingestion:** Every NDS run from a live user session is eligible. Cases are sampled into the queue at a rate determined by current training data needs (see §9.2).
2. **Evaluation sprint ingestion:** Runs from evaluation sprint outputs are bulk-loaded into the high-value tier for post-sprint labeling.
3. **Shadow run ingestion:** Runs tagged `is_shadow_run = true` are loaded into the lightweight tier automatically.

### 5.2 Reviewer assignment

- High-value cases: assigned to a named trained reviewer by the queue manager. Reviewer does not know the tier at assignment time — they see only the case. After review, a second reviewer is automatically assigned.
- Standard cases: self-assigned from the queue (reviewer claims next available case).
- Lightweight cases: self-assigned.

### 5.3 Review flow

```
Case claimed
   ↓
Section 1 displayed (input context)
   ↓
Reviewer reads input. (No label form visible yet.)
   ↓
[Reviewer clicks "Proceed to decision"]
   ↓
Section 2 + Section 3 displayed (system decision + all candidates)
   ↓
Reviewer reads system output.
   ↓
[Reviewer clicks "Begin labeling"]
   ↓
Label form displayed (Section 4)
   ↓
Reviewer fills labels, top-to-bottom
   ↓
Form validation runs (required fields, constraint checks — see §5.4)
   ↓
[Reviewer clicks "Submit"]
   ↓
Label written to nds_human_labels
Case removed from queue
```

**The two-step reveal (input before output) is required.** The reviewer must form an initial read of the student's input before seeing what the system produced. This prevents anchoring on the system output when assessing input quality, and produces more accurate `no_good_candidate` labels (reviewers have considered what a good candidate should look like before seeing what was generated).

### 5.4 Form validation rules

The following validations run client-side before submission is permitted:

1. `route_correct_would_be` must be set if `route_verdict = 'incorrect'`.
2. `better_candidate_id` must be set if `better_candidate_existed = true`.
3. `better_candidate_id` must be `NULL` if `better_candidate_existed = false`.
4. `better_candidate_id` must reference a candidate from this run with `is_selected = false`.
5. `no_good_candidate = true` is blocked if `selected_candidate_quality IN ('good', 'acceptable')`. Reviewer must resolve the contradiction before submitting.
6. `case_failure_class` must be set if `route_verdict = 'incorrect'`.
7. `confidence_level = 'low'` triggers a confirmation modal: "Low confidence labels will be held for adjudication. Are you sure you want to submit? Alternatively, add notes describing what made this case difficult." Reviewer must explicitly confirm or add notes.

### 5.5 Session management

- A reviewer session has a hard limit of 60 minutes before the current claimed-but-unsubmitted case is released back to the queue.
- In-progress labels are auto-saved locally every 30 seconds.
- A reviewer cannot claim more than 3 cases simultaneously.

---

## 6. Adjudication Protocol

### 6.1 What triggers adjudication

A case enters the adjudication workflow when any of the following occur:

| Trigger | Description |
|---------|-------------|
| High-value tier | Automatically (all high-value cases receive two reviews) |
| Low-confidence first review | `confidence_level = 'low'` on first submission |
| Reviewer-flagged uncertainty | Reviewer explicitly flags in `reviewer_notes`: "needs adjudication" |
| Multi-reviewer disagreement | Two independent reviews disagree on `route_verdict` or `no_good_candidate` |
| Model anomaly flag | A subsequent model evaluation flags the run as a potential label error |

### 6.2 Adjudication workflow

```
Adjudication triggered
   ↓
Two independent reviewer labels retrieved
   ↓
Agreement check on core labels (route_verdict, no_good_candidate, selected_candidate_quality)
   ↓
If all three agree: auto-adjudicated, use agreed values
   ↓
If any disagree: case assigned to adjudicator
   ↓
Adjudicator sees both reviewer labels side-by-side (blinded — no reviewer IDs shown)
   ↓
Adjudicator reviews case using full presentation spec
   ↓
Adjudicator either selects one reviewer's labels or writes new adjudicated labels
   ↓
New label row written with is_adjudicated = true, adjudicator_id set
```

### 6.3 Adjudicator requirements

- Must have completed at least 200 standard reviews and passed the calibration test (§7.2).
- Must not have previously reviewed the same case in any tier.
- Adjudicator identity is revealed in the audit log but not to other reviewers.

### 6.4 Escalation path

If an adjudicator is uncertain about a case, they may escalate to a "senior adjudicator" designation. There must always be at least one senior adjudicator available. Senior adjudicators are the canonical source of truth for edge case definitions — their decisions are used to update reviewer training materials.

---

## 7. Reviewer Onboarding and Calibration

### 7.1 Required onboarding curriculum

Before a new reviewer labels any live cases, they must complete:

1. **Conceptual module (60 min):** Read `NDS_LEARNED_JUDGMENT_SYSTEM_V1` §1–§9. Pass a written comprehension check (10 questions, 90% required to pass).

2. **Anchor definition training (30 min):** Walk through all anchor definitions in §4 of this document. For each label, review 5 pre-labeled calibration cases with known gold labels. Reviewer must match gold labels with 80% accuracy.

3. **Practice set (40 cases):** Label 40 cases from a held-out calibration set with known gold labels. The workbench shows gold labels after each submission. Review any case where the reviewer's labels differed from gold.

4. **Calibration test (20 cases):** Label 20 cases with gold labels unknown to the reviewer. Must achieve:
   - `route_verdict` accuracy ≥ 85%
   - `no_good_candidate` accuracy ≥ 90%
   - `selected_candidate_quality` accuracy ≥ 80% (treating adjacent grades as partial credit: `good/acceptable` agreement = 0.5)

5. **Sign-off:** Calibration test results reviewed by an existing reviewer. If any metric is below threshold, additional practice is required before live access is granted.

### 7.2 Ongoing calibration

- Every 30 days, each active reviewer is served 5 calibration cases (interspersed in their normal queue, unlabeled from their perspective).
- These are gold-labeled cases from the calibration set.
- Reviewer drift is monitored. If any core metric drops below 80%, the reviewer is removed from the high-value tier and placed in a re-calibration workflow before being restored.

### 7.3 Calibration set maintenance

The calibration set is maintained as a separate, labeled dataset of cases with fully adjudicated gold labels. It must contain:

| Category | Minimum count |
|----------|--------------|
| Clear successes | 30 |
| `no_good_candidate` cases | 25 |
| `better_candidate_existed` cases | 20 |
| False premium cases | 20 |
| Flattening cases | 15 |
| Ambiguous/borderline cases | 20 |
| **Total** | **≥ 130 cases** |

The calibration set is reviewed and refreshed every 90 days.

---

## 8. Label Quality Monitoring

### 8.1 Metrics tracked per reviewer (updated daily)

| Metric | Formula | Alert threshold |
|--------|---------|----------------|
| `route_verdict_agreement` | Agreement rate with adjudicated truth on cases that went to adjudication | < 80% |
| `no_good_candidate_agreement` | Same, for `no_good_candidate` label | < 85% |
| `calibration_accuracy` | Score on monthly calibration probes | < 80% |
| `label_speed_median` | Median seconds per case (by tier) | Tier 1 < 90s |
| `low_confidence_rate` | Rate of `confidence_level = 'low'` submissions | > 20% |
| `skip_rate` | Rate of skipping optional fields | — (monitored, not alerted) |

### 8.2 Metrics tracked per case (updated at adjudication)

| Metric | Tracked |
|--------|---------|
| `inter_reviewer_agreement` | For cases with two reviews: agreement on core labels |
| `adjudication_rate` | Rate at which cases that received two reviews required adjudicator intervention |
| `label_flip_rate` | Rate at which a second review changed a core label from the first |

### 8.3 Dataset-level quality metrics (computed per training job)

Before any training job can proceed, the following must hold:

| Metric | Required value |
|--------|---------------|
| Fraction of training labels with `confidence_level IN ('high', 'medium')` | ≥ 90% |
| Fraction of training labels that are adjudicated or agreement-confirmed | ≥ 75% (for high-value tier labels) |
| Inter-reviewer agreement rate on `route_verdict` | ≥ 82% (measured on overlapping reviews) |
| Inter-reviewer agreement rate on `no_good_candidate` | ≥ 88% |
| Calibration set accuracy, most recent 30-day probe (averaged across active reviewers) | ≥ 83% |

If any of these thresholds is not met, the training job is blocked and a label quality review is triggered before re-running.

---

## 9. Queue Management Spec

### 9.1 Tier assignment algorithm

Cases are assigned tiers at ingestion time by the following rule sequence (first match wins):

```
IF any of:
  - route_confidence < 0.6 AND route_taken = 'show'
  - set_all_generic = true
  - input_specificity_score < 0.3
  - case is from a recent evaluation sprint with failure flags
THEN tier = 'high_value'

ELSE IF any of:
  - is_shadow_run = true
  - route_confidence > 0.92
  - session_context indicates integration test or synthetic session
THEN tier = 'lightweight'

ELSE tier = 'standard'
```

### 9.2 Sampling rate

Not every run is ingested into the review queue. The sampling policy is:

| Run type | Default sampling rate | Notes |
|----------|----------------------|-------|
| Live user runs, high-value criteria | 100% | No sampling — always ingest |
| Live user runs, standard criteria | 15% | Random sample. Adjust up if training data is short. |
| Live user runs, lightweight criteria | 5% | Random sample. |
| Evaluation sprint runs (all tiers) | 100% | Always ingest for evaluation sprint outputs |
| Shadow runs | 10% | Random sample, unless shadow anomaly detected |

Sampling rates are configurable in a `review_queue_config` table (not defined in this spec). Changes to sampling rates must be logged with a justification.

### 9.3 Queue prioritization

Within a tier, cases are prioritized by:

1. Cases from active evaluation sprints (sorted by sprint start time, oldest first)
2. Cases where `set_all_generic = true`
3. Cases from the most recent 7 days
4. All other cases, FIFO

### 9.4 Queue backlog policy

If the standard-tier queue backlog exceeds 500 unreviewed cases:
- Sampling rate for new standard cases drops to 10%.
- A backlog alert is surfaced to the review lead.
- If backlog exceeds 1000 cases: sampling drops to 5% and a sprint labeling session is scheduled.

---

## 10. Anti-Patterns and Reviewer Guidance

The following are the most common labeling errors, identified from calibration data. All reviewers must read this section.

### AP-1: Anchoring on system output

**Error:** Reviewer reads the system output first (despite the two-step reveal), then retroactively interprets the student input through the lens of what the system produced.

**Result:** `no_good_candidate = false` and `route_verdict = correct` labels are systematically biased toward the system's choices. The model learns to maintain status quo rather than improve.

**Correct behavior:** Always read the input fully before looking at the candidates. Ask yourself: "What direction would I expect a good system to produce for this input?" before seeing what was actually produced.

---

### AP-2: Using `borderline` as a hedge

**Error:** Reviewer marks `route_verdict = 'borderline'` frequently to avoid committing to `incorrect` even when the route was clearly wrong.

**Result:** Training dataset is filled with unresolvable ambiguity. Model receives mixed signal on clear failure cases.

**Correct behavior:** Reserve `borderline` for cases where you genuinely believe both `show` and `clarify` would have been defensible. If one route is clearly better — even slightly — use `correct` or `incorrect`.

---

### AP-3: Penalizing imperfect explanations as `no_good_candidate`

**Error:** Reviewer marks `no_good_candidate = true` because the explanation text is weak, even though the direction itself is sound.

**Result:** `no_good_candidate` labels are inflated. The no-good-candidate detector trains on mislabeled signal.

**Correct behavior:** `no_good_candidate` refers to the candidate direction's quality and grounding, not the explanation quality. If the direction is `acceptable`, the candidate is not "no good." Weak explanations are captured by `explanation_adds_value = false`, not by `no_good_candidate = true`.

---

### AP-4: Conflating `better_candidate_existed` with `no_good_candidate`

**Error:** Reviewer marks both `no_good_candidate = true` AND `better_candidate_existed = true`.

**Result:** Contradictory labels (if no good candidate existed, there is no better candidate either).

**Correct behavior:** These are mutually exclusive. `no_good_candidate = true` means the entire set failed. `better_candidate_existed = true` means the set had a better option that wasn't selected. The form validation catches this, but understanding the distinction prevents confusion before submission.

---

### AP-5: Labeling based on essay topic rather than direction quality

**Error:** Reviewer marks directions about "leadership" or "community" as `is_premium_flag = true` simply because those topics sound generic, without checking whether the direction is grounded in the actual essay.

**Result:** Calibrated features in `nds_candidates.is_premium` don't match reviewer labels in `nds_human_labels.direction_line_premium_flag`, contaminating training signal.

**Correct behavior:** Premium flag is about the absence of scene-level grounding, not about topic genre. A leadership direction grounded in a specific moment from the essay is not false premium. A leadership direction not grounded in anything is false premium. Judge the grounding, not the topic.

---

## 11. Technical Implementation Notes

These are binding technical requirements for whoever implements the workbench tooling.

### 11.1 Data access

- The workbench reads from `nds_runs` and `nds_candidates` via the Supabase read role.
- The workbench writes to `nds_human_labels` via the Supabase application service role.
- The workbench must never write to `nds_runs`, `nds_candidates`, or `nds_training_snapshots`.
- All writes are atomic per label submission (one `INSERT` per submit event, never partial writes).

### 11.2 Essay text display

- Essay text must be displayed as-is, including any HTML entities decoded. No processing, sanitization for display, or reformatting.
- If `essay_word_count > 800`, the essay is truncated at 800 words with a visible continuation indicator. The reviewer may expand to full text.

### 11.3 Reviewer session isolation

- No two reviewers may claim the same case simultaneously.
- Case claim is implemented as a row-level lock in a `nds_queue_claims` table (claim expires after 60 minutes if not submitted).

### 11.4 Auditability requirements

Every label submission must log:
- `reviewer_id`, `labeled_at` (UTC), `review_duration_seconds`
- `workbench_version` (version of the workbench UI that produced this label)
- All label values at time of submission (stored in `nds_human_labels` as written — no post-submission modification)

### 11.5 Performance requirement

- Case presentation page must load within 800ms (p95) once a case is claimed.
- Form submission must complete and confirm to reviewer within 500ms.
- Queue page (list of available cases) must load within 1s.

---

## 12. Quality Targets

These are the system-level targets that define whether the labeling workbench is functioning correctly. They must be measured and reported monthly.

| Target | Required value |
|--------|---------------|
| Overall reviewer calibration accuracy (monthly probes, all active reviewers, all tiers) | ≥ 83% |
| Inter-reviewer agreement on `route_verdict` | ≥ 82% |
| Inter-reviewer agreement on `no_good_candidate` | ≥ 88% |
| High-value tier adjudication rate | ≤ 25% (fraction requiring adjudicator intervention) |
| Reviewer drift rate (fraction of active reviewers showing calibration decline in rolling 30 days) | ≤ 10% |
| Queue backlog (standard tier) | ≤ 300 unreviewed cases at any time |
| Label completeness rate (fraction of submitted labels with all required fields complete by tier) | ≥ 98% |
| Training label quality gate pass rate (fraction of training jobs where dataset quality metrics pass on first check) | ≥ 90% |

---

*End of NDS_REVIEW_LABELING_WORKBENCH_V1*
