# NDS_CORPUS_REALISM_AUDIT_SPEC_V1

**Detailed audit methodology for corpus composition verification**  
**Implements section 10 of NDS_REAL_INPUT_CORPUS_POLICY_V1**

---

## Purpose

This document specifies the standardized realism audit procedure required before any NDS corpus snapshot can be approved for primary benchmark, training, or learned-judgment use.

The realism audit is the enforcement mechanism for the 70/30 real/synthetic threshold rule.

---

## 1. AUDIT SCOPE

A realism audit must be run on:

- Any new primary benchmark corpus
- Any corpus being promoted from secondary to gold status
- Any training snapshot before learned-judgment model ingestion
- Any corpus used for release-gate claims
- Any corpus used for learned-judgment promotion decisions

Audits are optional but recommended for:

- secondary regression suites
- tooling test sets
- demo corpora

---

## 2. AUDIT INPUTS

The audit consumes:

1. **Corpus file** — JSON/JSONL corpus with all required provenance fields
2. **Privacy review metadata** — approval status for each case
3. **Adjudication status** — reviewer labels (if applicable)
4. **Privacy policy link** — for cross-reference

---

## 3. REQUIRED AUDIT REPORT SECTIONS

### 3.1 Coverage Metrics

Generate and report:

#### Source composition
| source_type | count | % |
|---|---:|---:|
| public_internet | N | X% |
| anonymized_product_input | N | X% |
| legacy_internal_synthetic | N | X% |
| hybrid_composite | N | X% |
| unknown/missing | N | X% |
| **TOTAL** | N | 100% |

**Real-source subtotal:** public_internet + anonymized_product_input = X%

#### Transformation composition
| transformation_level | count | % |
|---|---:|---:|
| raw | N | X% |
| lightly_normalized | N | X% |
| redacted | N | X% |
| excerpted | N | X% |
| hybrid_composite | N | X% |
| heavily_rewritten | N | X% |
| unknown/missing | N | X% |
| **TOTAL** | N | 100% |

#### Adjudication coverage
| adjudication_status | count | % |
|---|---:|---:|
| gold_ready | N | X% |
| benchmark_only | N | X% |
| needs_adjudication | N | X% |
| rejected_for_gold | N | X% |
| unknown/missing | N | X% |
| **TOTAL** | N | 100% |

#### Privacy review coverage
| privacy_review_status | count | % |
|---|---:|---:|
| approved | N | X% |
| pending | N | X% |
| rejected | N | X% |
| unknown/missing | N | X% |
| **TOTAL** | N | 100% |

#### Gold training eligibility
| eligible_for_gold_training | count | % |
|---|---:|---:|
| yes | N | X% |
| no | N | X% |
| unknown/missing | N | X% |
| **TOTAL** | N | 100% |

### 3.2 Source Diversity Metrics

Report:

- **Unique source_origin values** — count distinct origin families represented
  - Example: "Reddit admissions thread", "College Confidential essay forum", "anonymized product intake", etc.
  - Threshold: should have >= 3 distinct origins for realistic diversity

- **Top 3 most common source origins** — by case count
  - Alert if single origin dominates >40%

- **Duplication analysis**
  - Cases with identical text (hash-based)
  - Cases with >90% text overlap
  - Flag if duplication >5%

### 3.3 Transformation Risk Assessment

For each transformation_level, report:

- **raw**
  - Count
  - % of total
  - Status: ✓ no risk to gold use

- **lightly_normalized**
  - Count
  - % of total
  - Status: ✓ acceptable for gold use

- **redacted**
  - Count
  - % of total
  - Status: ✓ acceptable for gold use

- **excerpted**
  - Count
  - % of total
  - Status: ✓ acceptable for gold use

- **hybrid_composite**
  - Count
  - % of total
  - Real-source grounding check: % with source provenance preserved
  - Status: ⚠ conditional — only gold-eligible if provenance preserved

- **heavily_rewritten**
  - Count
  - % of total
  - Status: ✗ ineligible for gold training (may use for testing only)

### 3.4 Class Representation Analysis

Report presence of real-world input diversity:

| Input class | present? | example count |
|---|---|---|
| Weak note patterns | Y/N | N |
| Rough essay-help questions | Y/N | N |
| Contradictory/multi-center inputs | Y/N | N |
| Parent-overwritten or adult-shaped inputs | Y/N | N |
| Over-polished but hollow inputs | Y/N | N |
| Culturally indirect or understated storytelling | Y/N | N |
| Family/duty-centered stories | Y/N | N |
| Achievement-stacked but emotionally thin inputs | Y/N | N |
| Messy note dumps | Y/N | N |
| Uncertainty/scope doubt inputs | Y/N | N |

**Standard**: real-world corpora should represent >= 6 of these 10 classes.

---

## 4. PASS/FAIL GATE CRITERIA

A corpus snapshot passes the realism audit (and is eligible for gold/primary use) **only if all of the following hold**:

### 4.1 Mandatory thresholds (ALL must pass)

- ✓ Real-source share >= 70% (public_internet + anonymized_product_input)
- ✓ legacy_internal_synthetic <= 30%
- ✓ heavily_rewritten <= 10%
- ✓ privacy_review_status = approved for 100% of cases
- ✓ No more than 5% missing provenance fields
- ✓ No single source_origin > 40% (unless unavoidable for safety/availability reasons)
- ✓ Duplication rate <= 5%
- ✓ >= 3 distinct source origins represented

### 4.2 Strong recommendations (should pass; log as warnings if not)

- ✓ Real-source share >= 80%
- ✓ legacy_internal_synthetic <= 20%
- ✓ heavily_rewritten <= 5%
- ✓ Real-world input diversity >= 6 of 10 classes
- ✓ adjudication_status coverage >= 90% for training-eligible cases

---

## 5. AUDIT OUTPUT REPORT

Generate a structured audit report with:

```json
{
  "audit_id": "audit-20260317-v1",
  "corpus_name": "NDS_GOLD_LABEL_PACK_V1",
  "audit_date": "2026-03-17",
  "total_cases_audited": 25,
  "source_composition": {
    "public_internet": { "count": 20, "pct": 80 },
    "anonymized_product_input": { "count": 3, "pct": 12 },
    "legacy_internal_synthetic": { "count": 2, "pct": 8 },
    "real_source_total_pct": 92
  },
  "transformation_composition": {
    "raw": { "count": 15, "pct": 60 },
    "lightly_normalized": { "count": 7, "pct": 28 },
    "redacted": { "count": 2, "pct": 8 },
    "heavily_rewritten": { "count": 1, "pct": 4 }
  },
  "adjudication_coverage": {
    "gold_ready": { "count": 23, "pct": 92 },
    "benchmark_only": { "count": 2, "pct": 8 }
  },
  "privacy_review_coverage": {
    "approved": { "count": 25, "pct": 100 }
  },
  "gold_training_eligibility": {
    "yes": { "count": 23, "pct": 92 },
    "no": { "count": 2, "pct": 8 }
  },
  "source_diversity": {
    "unique_origins": 5,
    "top_3_origins": [
      { "origin": "Reddit admissions thread", "count": 10, "pct": 40 },
      { "origin": "College Confidential essay forum", "count": 6, "pct": 24 },
      { "origin": "anonymized product intake", "count": 3, "pct": 12 }
    ]
  },
  "duplication_analysis": {
    "exact_duplicates": 0,
    "high_overlap_pairs": 0,
    "duplication_rate_pct": 0
  },
  "real_world_class_coverage": {
    "weak_note_patterns": true,
    "rough_questions": true,
    "contradictory_inputs": true,
    "parent_shaped_inputs": true,
    "over_polished_hollow": true,
    "culturally_indirect": false,
    "family_duty_centered": true,
    "achievement_stacked_thin": true,
    "messy_notes": true,
    "uncertainty_inputs": true,
    "covered_classes": 9,
    "target_classes": 10
  },
  "gate_result": "PASS",
  "gate_violations": [],
  "recommendations": [
    "Consider sourcing 1-2 more culturally indirect cases for stronger class coverage"
  ]
}
```

---

## 6. AUDIT ENFORCEMENT

The realism audit is **blocking**. 

A corpus snapshot cannot proceed to:

- gold training ingestion
- primary benchmark publication
- learned-judgment promotion decision

until:

1. Audit is generated
2. Audit passes all mandatory thresholds
3. Audit report is attached to the dataset record
4. Audit report is referenced in benchmark/training documentation

---

## 7. AUDIT CADENCE

- **New corpora**: Required before first use
- **Expanded corpora**: Required before snapshot release
- **Refreshed corpora**: Required after 50%+ content change
- **Legacy corpus promotion**: Required if promoting to gold status

---

## 8. AUDIT DOCUMENTATION REQUIREMENT

Every benchmark report and training snapshot must include a "Corpus Audit" section:

```
## Corpus Audit Summary

Real-source composition: 92% (public_internet 80%, anonymized_product_input 12%)
Synthetic composition: 8%
Audit status: PASS
Audit reference: audit-20260317-v1
```

---

## 9. FAILURE HANDLING

If an audit fails mandatory thresholds:

1. **Document the failure** in the audit report
2. **Do not proceed** with gold training or primary benchmark use
3. **Identify gaps** (e.g., "legacy_internal_synthetic is 35%, exceeds 30% limit")
4. **Remediation plan**: source additional real-input cases or downgrade synthetic cases
5. **Re-audit after remediation**

---

## 10. AUDIT TOOLING REQUIREMENTS

Build or integrate tooling to:

- ✓ Parse corpus JSON/JSONL
- ✓ Extract provenance fields
- ✓ Check for missing fields
- ✓ Compute composition percentages
- ✓ Detect duplicates (text hash)
- ✓ Generate coverage metrics
- ✓ Emit structured audit report (JSON)
- ✓ Format human-readable audit summary
- ✓ Evaluate against gate criteria
- ✓ Emit pass/fail decision
