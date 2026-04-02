# NDS_LABELING_AND_DATA_PIPELINE_IMPLEMENTATION_PLAN_V1

**Product:** College Essay Edge  
**Status:** Immediate build plan (phase-1 learned judgment foundation)  
**Date:** 2026-03-17

## Purpose

This plan converts learned-judgment architecture into the first executable build sequence that makes the system real, reproducible, and testable.

Primary question:

**Can a learned reranker trained on our own reviewed candidate sets beat current heuristic winner selection offline without violating trust standards?**

This is a narrow substrate plan, not full ML rollout.

---

## Phase overview

Build order is fixed and non-negotiable:

1. Phase 0 — Schema and event contract freeze
2. Phase 1 — Runtime logging implementation
3. Phase 2 — Review labeling workbench implementation
4. Phase 3 — Snapshot pipeline implementation
5. Phase 4 — First labeled corpus creation
6. Phase 5 — Reranker dataset export + baseline benchmark
7. Phase 6 — Go / no-go decision for reranker v1 training

---

## Table contract summary

Required frozen tables:

- `nds_runs`
- `nds_candidates`
- `nds_human_labels`
- `nds_product_outcomes`
- `nds_training_snapshots`

Required frozen ids/relationships:

- `run_id`
- `candidate_id`
- `label_id` (review event id)
- `snapshot_id`

Required run-level persistence (minimum):

- raw input
- normalized context summary
- selected route
- selected candidate id
- selected output payload
- debug packet version
- prompt/model/schema versions

Required candidate-level persistence (minimum):

- candidate id
- run id
- position in set
- axis family
- direction line
- direction summary
- evidence payload
- heuristic scores
- validator flags
- selected/rejected state

---

## Logging contract summary

### Required runtime behavior

- Persist every run to `nds_runs`
- Persist every candidate to `nds_candidates`
- Persist reproducibility fields (prompt/schema/validator/feature versions + judgment mode)

### Reliability requirements

- Writes must be idempotent
- Candidate rows must not duplicate on retry
- Partial writes must be detectable and auditable
- Logging failures must be observable (never silent)

### Phase-1 completion gate

Phase 1 is complete only if:

- sampled live runs reconstruct exact candidate sets
- selected winner + route are reproducible from stored records
- required fields are complete in audit sample

---

## Review workflow summary

### Workbench minimum capabilities

- Reviewer identity
- Save progress
- Label persistence in `nds_human_labels`
- Disagreement tracking
- Adjudication-ready status
- Label versioning

### Reviewer-visible context

- raw student input
- metadata/class flags (if available)
- full candidate set
- selected candidate
- route decision
- line/explanation/evidence
- heuristic scores/debug flags (as appropriate)

### Required reviewer actions

- choose best candidate
- mark no-good-candidate
- mark correct route
- mark line fit
- mark grounding strength
- mark false-premium risk
- mark flattening risk
- mark usefulness
- mark student-feels-understood
- mark benchmark-borderline

### Tiering protocol

- **Tier 1:** primary reviewer labels all selected cases
- **Tier 2:** second reviewer audits high-risk/disagreement/shifted/borderline subsets
- **Tier 3:** adjudication resolves conflicts into gold state

---

## REAL INPUT CORPUS SOURCING POLICY (HARD RULE)

### Policy intent

Prevent fake confidence from synthetic/internal-only corpora.

### Core rule

From this point forward, all new primary learned-judgment training/evaluation corpora must come from:

1. `public_internet` sources (real public essay-help / student discussion inputs), or
2. `anonymized_product_input` (real product inputs with redaction).

Internally fabricated/model-generated cases are **not allowed as dominant gold corpus source**.

### Allowed source types

- public essay-help posts
- public student forum/admissions discussion posts
- public “what should I write about?” posts
- public rough-note / uncertain / weak-signal inputs

### Disallowed as primary gold source

- internally fabricated benchmark prose
- model-generated cases
- heavily rewritten synthetic composites

### Required provenance fields (per case)

- `source_type` (`public_internet` | `anonymized_product_input` | `legacy_internal_case`)
- `source_origin`
- `source_url_or_reference`
- `capture_date`
- `collection_method`
- `transformation_level` (`raw` | `lightly_normalized` | `redacted` | `composite_augmented`)
- `eligible_for_gold_training` (boolean)

### Gold eligibility rule

Case eligible for gold training only if:

- source is `public_internet` or `anonymized_product_input`
- provenance fields are complete
- redaction complete
- transformation preserves original input shape

### Legacy case rule

`legacy_internal_case` may be used for:

- regression
- adversarial/stress testing
- protocol scaffolding

But must be tagged `not_primary_gold` and must not dominate gold training data.

### First-500 corpus realism mix gate

For Phase 4 corpus:

- **>= 70%** real external/anonymized real product inputs
- **<= 30%** legacy internal cases

### Transformation constraints

Allowed:

- redaction of names/identifiers
- light formatting normalization
- institution/location masking
- excerpting long posts

Not allowed:

- rewriting into cleaner benchmark English
- artificial hinge strengthening
- adding details not present in source
- converting weak real input into strong synthetic input

### Snapshot realism gate (required)

Before snapshot approval for training, audit must pass:

- real-source percentage threshold
- synthetic percentage threshold
- transformation-level profile
- duplication rate threshold
- source diversity threshold
- class diversity threshold

If realism gate fails, snapshot is ineligible for model training.

---

## First 500-case corpus plan

Target: **>= 500 adjudication-ready cases**

Required slices:

- **Slice A (150):** core stable, clearly labelable anchor cases
- **Slice B (150):** difficult residual/shift/trust-risk/no-good-candidate cases
- **Slice C (100):** clarification/block/weak-signal cases
- **Slice D (100):** edge/borderline/disagreement cases

Required composition characteristics:

- in-distribution strong cases
- clarification cases
- weak-note cases
- contradiction cases
- polished-empty / parent-overwritten style cases
- culturally indirect cases
- shifted/distribution-break cases
- benchmark-borderline cases

Case counts only if label-complete:

- case-level labels
- route-level label
- candidate-level labels (all non-rejected candidates)
- output-level labels
- adjudication-ready state (or explicit approved single-review exception)

---

## Snapshot and benchmark plan

### Snapshot requirements

Each snapshot must persist:

- `snapshot_id`
- creation timestamp
- included run/candidate ids
- label coverage stats
- split definition (`train`/`val`/`test`, optional shift holdouts)
- feature extraction version
- exclusions applied
- dataset purpose (`reranker_v1_train`, etc.)

Snapshot immutability: once created, it cannot silently change.

### Baseline benchmark requirements

From immutable snapshot, compute heuristic baseline:

- heuristic top-1 agreement with gold best candidate
- heuristic no-good-candidate miss rate
- false-premium winner rate
- indirect-hinge miss rate
- line-fit miss rate
- flattening-risk rate

Output must define explicit reranker-v1 target metrics to beat.

---

## Go/no-go decision gate

### Go conditions

Proceed to reranker v1 training only if:

- dataset size sufficient
- label coverage complete enough
- disagreement within acceptable range
- baseline benchmark trustworthy
- no catastrophic schema/logging quality issues
- realism gate passed

### No-go conditions

Do not proceed if:

- noisy/shallow labels
- inconsistent candidate logging
- excessive unresolved conflicts
- benchmark corruption suspected
- realism gate fails

---

## Implementation order

Required packages:

1. **Migration/schema package** — migrations, schema docs, index docs
2. **Logging package** — runtime write path, validation checks, replay/audit utilities
3. **Review tooling package** — workbench UI, persistence, disagreement/adjudication support
4. **Snapshot package** — snapshot creator, metadata registry, export builder
5. **Benchmark package** — heuristic baseline evaluator + reranker-ready export generator

Ownership:

- Engineering: schema/logging/tooling/snapshots/exports
- Product/research/review leads: taxonomy QA, adjudication, corpus composition
- ML lead: feature spec enforcement, baseline definition, readiness decision

---

## Risks and mitigations

1. **Reviewer inconsistency corrupts labels**  
   Mitigation: calibration set, disagreement audits, adjudication rules

2. **Schema drift before corpus stabilizes**  
   Mitigation: Phase-0 freeze + strict versioning

3. **Logging incompleteness ruins dataset**  
   Mitigation: required-field validation + audit sampling + idempotent writes

4. **Overrepresentation of easy clean cases**  
   Mitigation: enforced slice mix + realism gate + shift quota

5. **Model learns polish preference over narrative quality**  
   Mitigation: explicit false-premium/flattening labels + difficult slice requirements

6. **Synthetic contamination of gold corpus**  
   Mitigation: hard source policy, provenance fields, <=30% legacy cap

---

## Acceptance thresholds

This implementation phase is complete only if all are true:

- schema frozen and deployed
- runtime logging live and audited
- review workbench usable by reviewers
- snapshot pipeline producing immutable datasets
- first 500-case corpus assembled and realism-gated
- heuristic baseline benchmark computed from immutable snapshot
- reranker training readiness decision made

If any is missing, phase is incomplete.

---

## Build summary

This plan is the practical bridge from documentation to a trainable system.

The product only becomes a true learned system when:

- runs are logged
- candidates are reviewed
- gold labels exist
- snapshots are reproducible
- baseline is measured
- reranker readiness is decided on trustworthy, real-input data
