# NDS_GOLD_TRAINING_ELIGIBILITY_RULES_V1

**Case filtering and acceptance rules for learned-judgment training corpus**  
**Implements section 13 of NDS_REAL_INPUT_CORPUS_POLICY_V1**

---

## Purpose

This document specifies the deterministic rules for determining whether an individual case is eligible for inclusion in a learned-judgment training snapshot.

These rules implement the principle: **only gold-ready, real-sourced, approved cases enter learned-judgment training data.**

---

## 1. ELIGIBILITY DECISION TREE

A case is eligible for gold training if and only if **all of the following hold**:

```
┌─ source_type approved?
│  ├─ public_internet → YES
│  ├─ anonymized_product_input → YES
│  ├─ hybrid_composite → YES (if provenance preserved)
│  └─ legacy_internal_synthetic → NO (by default)
│
├─ privacy_review_status?
│  ├─ approved → CONTINUE
│  ├─ pending → SKIP
│  └─ rejected → NO
│
├─ transformation_level acceptable?
│  ├─ raw → YES
│  ├─ lightly_normalized → YES
│  ├─ redacted → YES
│  ├─ excerpted → YES
│  ├─ hybrid_composite → YES (if provenance preserved)
│  └─ heavily_rewritten → NO
│
├─ adjudication_status?
│  ├─ gold_ready → CONTINUE
│  ├─ benchmark_only → NO
│  ├─ needs_adjudication → NO
│  └─ rejected_for_gold → NO
│
├─ Labels complete?
│  ├─ all required labels present → YES
│  ├─ >= 1 label missing → NO
│
├─ eligible_for_gold_training?
│  ├─ yes → ELIGIBLE
│  ├─ no → NOT ELIGIBLE
│
└─ RESULT: ELIGIBLE or SKIP
```

---

## 2. FIELD-BY-FIELD RULES

### 2.1 source_type rule

#### Gold-eligible source types

| source_type | eligible | notes |
|---|---|---|
| `public_internet` | **YES** | Real public content, no synthetic generation |
| `anonymized_product_input` | **YES** | Real user input, fully anonymized, privacy approved |
| `hybrid_composite` | **CONDITIONAL** | YES only if `source_provenance_preserved = true` and all component sources are approved |
| `legacy_internal_synthetic` | **NO** (default) | Synthetic by definition; not gold-eligible unless explicitly re-approved |

#### Special case: legacy_internal_synthetic re-approval

A `legacy_internal_synthetic` case may be marked `eligible_for_gold_training = yes` only if:

1. Explicit **exception document** exists justifying inclusion
2. Exception is signed by **data governance lead and model lead**
3. Exception references:
   - specific pedagogical or safety reason for inclusion
   - evidence that synthetic case fills a real gap not covered by real sources
   - commit that synthetic share will not exceed 20% of final training set
4. Exception is **logged and reported** in training snapshot summary

**By default:** always mark legacy_internal_synthetic as `eligible_for_gold_training = no`.

### 2.2 privacy_review_status rule

Training data must **never** contain cases with unreviewed or rejected privacy status.

| privacy_review_status | eligible | action |
|---|---|---|
| `approved` | **YES** | ACCEPT |
| `pending` | **NO** | SKIP (queue for privacy review, re-attempt next snapshot) |
| `rejected` | **NO** | REJECT (do not include; mark as permanently ineligible) |

#### Privacy review requirements

For each case, privacy review must verify:

- ✓ No direct personal identifiers remain (name, email, social handles)
- ✓ No indirect identifiers that could re-identify (unique school + activity combos)
- ✓ No sensitive health/family information that violates policy
- ✓ No contact information
- ✓ Redaction is complete and consistent

---

### 2.3 transformation_level rule

The transformation applied to a case determines its gold eligibility.

| transformation_level | eligible | rationale |
|---|---|---|
| `raw` | **YES** | Unmodified user input; purest form |
| `lightly_normalized` | **YES** | Only formatting/encoding cleanup; input shape preserved |
| `redacted` | **YES** | Identifiers removed; input integrity maintained |
| `excerpted` | **YES** | Relevant portion extracted; input authenticity preserved |
| `hybrid_composite` | **CONDITIONAL** | YES only if real-source components preserved and documented |
| `heavily_rewritten` | **NO** | Modified beyond minimal cleanup; not trustworthy gold |

#### heavily_rewritten disqualification

Any case with `transformation_level = heavily_rewritten`:

- **automatic**: `eligible_for_gold_training = no`
- May still use for: testing, demos, secondary regression suites
- Cannot use for: learned-judgment training, primary benchmarks, gold claims

Examples of heavy rewrites that disqualify:

- "Cleaned up the grammar/syntax to be more academically polished"
- "Reworded the reflection to be more explicit/introspective"
- "Merged student notes with synthesized hinges"
- "Rewrote awkward phrasing into clearer structure"
- "Added stronger narrative arc than the original"

---

### 2.4 adjudication_status rule

A human adjudicator must have reviewed the case and marked its readiness for gold use.

| adjudication_status | eligible | notes |
|---|---|---|
| `gold_ready` | **YES** | Adjudicator approved for training use |
| `benchmark_only` | **NO** | Approved for evaluation but not training |
| `needs_adjudication` | **NO** | Not yet reviewed; skip for now |
| `rejected_for_gold` | **NO** | Explicitly rejected; do not attempt to train |

#### Adjudication statuses explained

**gold_ready**
- Human reviewer inspected case
- Confirmed: substantive, safe, private, real-sourced, authentic
- Case is approved for learned-judgment training

**benchmark_only**
- Case is suitable for evaluation/testing
- Not suitable for training (e.g., edge case, atypical pattern, adversarial trap)
- Keep separate from training corpus

**needs_adjudication**
- Case has not been reviewed yet
- Queue for adjudication in next review cycle
- Skip for now

**rejected_for_gold**
- Case explicitly rejected for training
- Reasons: low signal, safety concern, privacy issue, synthetic dominance, heavy rewrites
- Do not attempt to include

---

### 2.5 Label completeness rule

Before inclusion in training, verify:

- ✓ Case has action label (e.g., "show_strongest_direction", "ask_question_before_showing")
- ✓ Direction label (if action = show_strongest_direction)
- ✓ Explanation label (if applicable)
- ✓ No missing required fields

If **any** required label is missing, mark `eligible_for_gold_training = no` and queue for labeling.

---

### 2.6 eligible_for_gold_training explicit rule

The final determination field `eligible_for_gold_training` must be **explicitly set** on every case.

| value | meaning |
|---|---|
| `yes` | Case passes all rules; approved for gold training |
| `no` | Case fails one or more rules; skip for training |

This field is **not** inferred; it must be set explicitly based on the above rules.

---

## 3. TRAINING CORPUS ASSEMBLY RULES

### 3.1 Snapshot construction

When building a training snapshot, include **only cases where `eligible_for_gold_training = yes`**.

```python
training_cases = [c for c in all_cases if c['eligible_for_gold_training'] == 'yes']
```

### 3.2 Composition requirements

The resulting training snapshot must satisfy:

- ✓ Real-source share (public_internet + anonymized_product_input) **≥ 70%**
- ✓ legacy_internal_synthetic **≤ 30%** (only if explicitly re-approved)
- ✓ heavily_rewritten **≤ 5%**
- ✓ privacy_review_status = approved for **100%**
- ✓ adjudication_status = gold_ready for **100%** (or benchmark_only if secondary)

If composition fails thresholds, **do not proceed**. Re-source missing cases.

### 3.3 Synthetic isolation (if used)

If any legacy_internal_synthetic cases are included:

1. Tag them separately in the dataset
2. Monitor their influence on model behavior
3. Report synthetic share in model cards
4. Track whether synthetic cases cause overfit patterns

---

## 4. FILTERING ALGORITHM

```typescript
function isEligibleForGoldTraining(case: NdsCase): boolean {
  // Rule 1: Source type
  if (case.source_type === 'legacy_internal_synthetic' && 
      case.eligible_for_gold_training !== 'yes') {
    return false;
  }
  
  // Rule 2: Privacy review
  if (case.privacy_review_status !== 'approved') {
    return false;
  }
  
  // Rule 3: Transformation level
  if (case.transformation_level === 'heavily_rewritten') {
    return false;
  }
  
  // Rule 4: Adjudication
  if (case.adjudication_status !== 'gold_ready') {
    return false;
  }
  
  // Rule 5: Labels
  if (!hasAllRequiredLabels(case)) {
    return false;
  }
  
  // Rule 6: Explicit eligibility flag
  if (case.eligible_for_gold_training !== 'yes') {
    return false;
  }
  
  return true;
}
```

---

## 5. LABELING REQUIREMENTS FOR GOLD TRAINING

Before a case enters training, it must have:

### 5.1 Action label

One of:

- `show_strongest_direction`
- `ask_question_before_showing`
- `blocked_or_needs_more_input`

Required always.

### 5.2 Direction label (conditional)

If action = `show_strongest_direction`, must have:

- `best_direction` — direction recommendation (e.g., "failure with intellectual growth")

### 5.3 Explanation label (conditional)

If available:

- `explanation` — brief rationale for the direction

### 5.4 Signal labels (optional but encouraged)

If adjudicator annotated:

- `signal_type` — e.g., "concrete_hinge", "strong_authorship", "weak_scene_evidence"
- `confidence` — adjudicator's confidence (high/medium/low)

---

## 6. QUALITY GATES BEFORE MODEL TRAINING

Before feeding training snapshot to a learned-judgment model, run:

1. **Composition audit** (section 10 of NDS_REAL_INPUT_CORPUS_POLICY_V1)
   - Verify real-source ≥ 70%
   - Verify adjudication 100% gold_ready
   - Verify privacy review 100% approved

2. **Label coverage check**
   - Verify action label 100% coverage
   - Verify direction label coverage for show cases
   - Flag any missing labels

3. **Stratification check** (if applicable)
   - If stratified sampling: verify strata are represented
   - Avoid skew toward high-signal easy cases

4. **Duplication check**
   - Verify no exact duplicates in training set
   - Verify no near-duplicates that would cause data leak into test

---

## 7. TRAINING SNAPSHOT DOCUMENTATION

Every training snapshot must include metadata:

```json
{
  "snapshot_id": "nds_gold_training_v1_20260317",
  "generated_at": "2026-03-17T12:00:00Z",
  "total_cases": 180,
  "eligibility_summary": {
    "total_evaluated": 240,
    "gold_eligible": 180,
    "rejected": 60,
    "rejection_reasons": {
      "privacy_review_pending": 20,
      "legacy_synthetic_not_approved": 15,
      "needs_adjudication": 12,
      "heavily_rewritten": 8,
      "other": 5
    }
  },
  "source_composition": {
    "public_internet": { "count": 135, "pct": 75 },
    "anonymized_product_input": { "count": 36, "pct": 20 },
    "legacy_internal_synthetic": { "count": 9, "pct": 5 }
  },
  "label_coverage": {
    "action_label_coverage": "100%",
    "direction_label_coverage_show_cases": "100%",
    "explanation_label_coverage": "95%"
  },
  "quality_gates_passed": [
    "composition_audit_pass",
    "label_coverage_check_pass",
    "duplication_check_pass"
  ]
}
```

---

## 8. REJECTION TRACKING

Maintain a rejection log for transparency:

| case_id | rejection_reason | referenced_rule | reviewer | date |
|---|---|---|---|---|
| PSI-20260317-045 | heavily_rewritten | 2.3 | reviewer-001 | 2026-03-17 |
| APS-20260317-012 | needs_adjudication | 2.4 | [auto] | 2026-03-17 |

Report monthly: "X cases rejected, Y% due to transformation level, Z% pending adjudication, etc."

---

## 9. LEGACY SYNTHETIC EXCEPTION PROCESS

If you want to include a `legacy_internal_synthetic` case in gold training:

1. **Document exception**
   ```
   Exception ID: EXC-20260317-001
   Case ID: SYNTH-legacy-abc123
   Justification: "Specific adversarial pattern (parent-overwritten input) 
                   not yet sourced from public corpus; temporary inclusion to cover gap."
   Approved by: data_governance_lead, model_lead
   Date: 2026-03-17
   Limit: not to exceed 5% of training set
   Sunset: review after 2 iterations for replacement with real-source equivalent
   ```

2. **Tag case**
   - Mark: `eligible_for_gold_training = yes` (overriding default)
   - Add field: `exception_reference = "EXC-20260317-001"`

3. **Track in snapshot**
   - Report exception in training metadata
   - Monitor its impact on model behavior

4. **Sunset plan**
   - Set review date to replace with real-sourced equivalent

---

## 10. IMPLEMENTATION CHECKLIST

Build tooling to:

- ✓ Filter cases by eligibility rules
- ✓ Generate rejected case report (with reasons)
- ✓ Run composition audit on resulting snapshot
- ✓ Check label coverage
- ✓ Detect duplicates
- ✓ Log all rejections
- ✓ Emit training snapshot with metadata
- ✓ Flag any policy violations

---

## 11. FAILURE CONDITIONS

Do not proceed with model training if:

- ✗ Real-source share < 70%
- ✗ Privacy review not 100% approved
- ✗ Adjudication not 100% complete for gold_ready cases
- ✗ Any case missing required labels
- ✗ Composition audit fails
- ✗ Exceptions exist but not documented and approved
- ✗ Rejection tracking not available

---

## 12. GOLD TRAINING STANDARD

**Bottom line:** A learned-judgment model trained on gold corpus can only be trustworthy if:

1. Cases are real-sourced (70%+)
2. Cases are privacy-approved (100%)
3. Cases are adjudicated gold-ready (100% for training)
4. Cases are minimally transformed
5. All cases explicitly marked eligible
6. Composition audited and reported
7. No exceptions hiding synthetic dominance

This is the standard for building world-class NDS training data.
