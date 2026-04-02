# NDS_REAL_INPUT_CORPUS_POLICY_V1

**Gold-standard corpus governance spec**  
**MIT-level engineering policy**  
**Status: Mandatory system policy**

Applies to all future NDS benchmarks, evaluations, labeling corpora, and learned-judgment training sets.

---

## Purpose

This policy exists to stop NDS from being evaluated, hardened, or trained primarily on internally fabricated cases.

That practice creates a dangerous illusion:

- AI invents the cases
- AI is tested against AI-shaped language
- AI appears stronger than it really is
- the product overfits to synthetic structure instead of real student language

This policy sets a new gold standard:

**From this point forward, real external or anonymized real-user inputs are the primary source of truth for NDS corpus building.**

Synthetic/internal cases may still exist, but only as secondary support material.

**This is not a preference. It is a data-governance requirement.**

---

## 1. CORE PRINCIPLE

**Real input first. Synthetic second.**

That is the rule.

NDS must be evaluated and improved against:

- real public student essay-help questions
- real rough-note style inputs
- real draft excerpts
- real public admissions-discussion inputs
- anonymized real product inputs

**Not mainly against:**

- invented benchmark prose
- model-written "representative" cases
- internally imagined idealized student language

---

## 2. WHY THIS POLICY EXISTS

### 2.1 Synthetic-case distortion risk

Internally generated cases create predictable distortions:

- cleaner narrative structure than real users provide
- more explicit reflection than real students naturally write
- more benchmark-friendly ambiguity than real ambiguity
- stronger "AI-readable" hinge sentences
- cleaner failure categories than the real world
- overrepresentation of the team's own narrative assumptions

This produces:

- fake confidence
- fake benchmark gains
- weak real-world generalization
- overestimation of product quality

### 2.2 Product truth standard

A world-class product must be tested on:

- what real students actually say
- how real students actually ask for help
- how rough, weak, contradictory, parent-shaped, indirect, and emotionally uneven inputs actually look

That is the only trustworthy standard.

---

## 3. SCOPE

This policy applies to all NDS-related corpora used for:

- benchmark harnesses
- regression suites
- distribution-shift evaluations
- live benchmark ladders
- learned-judgment labeling
- reranker training
- route-calibration training
- trust/helpfulness model training
- shadow-mode audits
- release-gate evaluations

It applies to:

- new corpora
- refreshed corpora
- expanded corpora
- promotion of legacy corpora into "gold" status

---

## 4. CORPUS SOURCE TAXONOMY

Every NDS case must be assigned exactly one `source_type`.

### Allowed source_type values

#### A. public_internet

Real publicly accessible user content, such as:

- public essay-help posts
- public student forum questions
- public admissions discussion threads
- public draft excerpts
- public "what should I write about?" questions

#### B. anonymized_product_input

Real user input collected through the product and fully anonymized/redacted.

#### C. legacy_internal_synthetic

Internally created, synthetic, model-generated, or hand-authored benchmark cases.

#### D. hybrid_composite

A case built from multiple real-source examples and lightly composed into a single test artifact, with provenance preserved.

---

## 5. GOLD-STANDARD SOURCE RULE

### 5.1 Primary corpus rule

Any corpus used as a primary benchmark, evaluation set, or learned-judgment training set must be predominantly real-input sourced.

**Required threshold:**

At least **70% of cases** must be:

- `public_internet`
- or `anonymized_product_input`

**Strong preference threshold:**

Target **80%+ real-input sourcing** whenever possible.

### 5.2 Synthetic cap

`legacy_internal_synthetic` cases may not exceed **30%** of any primary corpus.

These cases are allowed only for:

- adversarial traps
- regression reproduction
- rare failure coverage
- specific known pattern coverage not yet present in real-source collections

They may not dominate the corpus.

### 5.3 Gold training rule

No case may be used as gold training data unless it is:

- `public_internet`
- or `anonymized_product_input`
- or `hybrid_composite` with preserved real-source grounding

and also has:

- provenance
- transformation metadata
- adjudication status
- review acceptance

`legacy_internal_synthetic` cases are not gold by default.

---

## 6. REQUIRED PROVENANCE FIELDS

Every case must include the following metadata.

### Required fields

- `case_id`
- `source_type`
- `source_origin`
- `source_reference`
- `capture_date`
- `collector_id` or `collection_process_id`
- `transformation_level`
- `adjudication_status`
- `privacy_review_status`
- `eligible_for_gold_training`

### Field definitions

#### source_origin

A human-readable origin family, such as:

- `Reddit admissions thread`
- `College Confidential essay forum`
- `public blog comment`
- `anonymized product intake`
- `archived essay-help board`

#### source_reference

Must be one of:

- raw URL
- archive URL
- internal provenance id
- connector record id
- stored source hash (if the URL cannot be retained directly)

#### capture_date

Date the case was ingested.

#### transformation_level

Allowed values:

- `raw`
- `lightly_normalized`
- `redacted`
- `excerpted`
- `hybrid_composite`
- `heavily_rewritten`

#### adjudication_status

Allowed values:

- `benchmark_only`
- `needs_adjudication`
- `gold_ready`
- `rejected_for_gold`

#### privacy_review_status

Allowed values:

- `pending`
- `approved`
- `rejected`

#### eligible_for_gold_training

Allowed values:

- `yes`
- `no`

---

## 7. TRANSFORMATION POLICY

### 7.1 Allowed transformations

The following are allowed:

- name redaction
- location redaction
- school redaction
- family-name redaction
- formatting cleanup
- excerpting to the relevant essay-help portion
- splitting very long threads into the actual user-input span
- minor typo cleanup only when it does not alter the input shape materially

### 7.2 Not allowed for gold corpus

The following are **not allowed** if the case is intended for gold use:

- rewriting into cleaner English
- strengthening weak reflection
- adding explicit hinges the user did not provide
- inventing better structure
- merging synthetic reflection into real user text
- converting awkward notes into benchmark prose
- translating weak signal into stronger signal (unless separately preserved as augmentation only)

### 7.3 Heavily rewritten cases

Any case with `transformation_level = heavily_rewritten` is automatically:

- `eligible_for_gold_training = no`

It may still be used for:

- tooling tests
- UI demos
- non-gold regression coverage

---

## 8. PRIVACY AND SAFETY REQUIREMENTS

### 8.1 Public internet cases

Public-source cases may be used only if:

- they are genuinely public
- no platform terms are violated
- identifiable personal details are redacted where appropriate
- the case is handled according to internal privacy standards

### 8.2 Product-input cases

Anonymized product inputs may be used only if:

- user privacy policy permits it
- data is fully anonymized/redacted
- internal review approves inclusion
- no directly identifying content remains in the training/eval case

### 8.3 Prohibited content handling

Cases containing high-risk or inappropriate content must be:

- excluded
- or specially flagged and isolated according to existing safety policy

---

## 9. CORPUS CLASS COMPOSITION RULES

Primary corpora must reflect real-world diversity, not only source diversity.

Every serious NDS corpus should attempt to include real examples of:

- weak note patterns
- rough essay-help questions
- contradictory/multi-center inputs
- parent-overwritten or adult-shaped inputs
- over-polished but hollow inputs
- culturally indirect or understated storytelling
- family/duty-centered stories
- achievement-stacked but emotionally thin inputs
- messy note dumps
- "I like this topic but I'm not sure it says enough about me" style uncertainty

**A corpus that is 80% real but still only contains clean, articulate internet examples is not good enough.**

---

## 10. DATASET GOVERNANCE RULES

### 10.1 Corpus realism gate

Before any dataset snapshot is approved for benchmark or training use, run a realism audit with at least:

- % `public_internet`
- % `anonymized_product_input`
- % `legacy_internal_synthetic`
- % `heavily_rewritten`
- source diversity count
- duplication rate
- distribution class diversity
- average transformation level
- adjudication coverage
- privacy review coverage

**If the realism gate fails, the snapshot cannot be used for:**

- gold training
- primary benchmark claims
- learned-judgment promotion decisions

### 10.2 Required realism thresholds

#### Gold or primary benchmark snapshot

- real-source share (`public_internet` + `anonymized_product_input`) **≥ 70%**
- `legacy_internal_synthetic` **≤ 30%**
- `heavily_rewritten` **≤ 10%**
- `privacy_review_status` = `approved` for **100%**
- `adjudication_status` = `gold_ready` for all training-eligible cases

#### Strong target

- real-source share **≥ 80%**
- synthetic **≤ 20%**

---

## 11. LEGACY CORPUS POLICY

### 11.1 Legacy synthetic cases are not deleted

They remain valuable for:

- regression traps
- reproducible failure cases
- adversarial checks
- protocol smoke tests
- specific hard-to-source patterns

### 11.2 But they are downgraded

They must be tagged:

- `source_type = legacy_internal_synthetic`
- `eligible_for_gold_training = no` (unless explicitly re-approved through a separate process)

### 11.3 Reporting rule

All benchmark reports must explicitly state source composition, including legacy synthetic percentage.

**No major evaluation report may hide synthetic dominance.**

---

## 12. REVIEWER WORKBENCH REQUIREMENTS

The review tooling must show the reviewer:

- the redacted input text actually used
- the source type
- the transformation level
- the provenance reference or internal source id
- adjudication status
- whether the case is benchmark-only or gold-eligible

**This prevents reviewers from unknowingly labeling heavily massaged or synthetic cases as if they were raw user inputs.**

---

## 13. LEARNED-JUDGMENT TRAINING RULES

### 13.1 Training eligibility rule

A case may enter a learned-judgment training snapshot only if:

- source type is approved
- privacy review is approved
- transformation level is acceptable
- adjudication status is `gold_ready`
- label completeness is sufficient

### 13.2 Synthetic exclusion default

`legacy_internal_synthetic` cases must default to:

- `eligible_for_gold_training = no`

If an exception is desired, it must be explicitly documented and justified.

### 13.3 Separate augmentation lane

If synthetic cases are used for augmentation, they must be:

- isolated
- tagged
- measurable
- never blended invisibly into the primary gold corpus

---

## 14. BENCHMARK REPORTING REQUIREMENTS

Every major NDS evaluation artifact must include a source composition section.

### Required fields in the report

- total case count
- % `public_internet`
- % `anonymized_product_input`
- % `legacy_internal_synthetic`
- % `hybrid_composite`
- % `heavily_rewritten`
- adjudication coverage
- gold-eligible share
- privacy-review coverage

**This must appear in:**

- benchmark reports
- distribution-shift reports
- learned-judgment training snapshot reports
- release-gate reports

---

## 15. ENGINEERING IMPLEMENTATION REQUIREMENTS

### 15.1 Data model updates

Add or enforce the following fields in case schemas:

- `source_type`
- `source_origin`
- `source_reference`
- `capture_date`
- `transformation_level`
- `adjudication_status`
- `privacy_review_status`
- `eligible_for_gold_training`

### 15.2 Corpus ingestion pipeline

Build or extend ingestion tooling to support:

- source capture
- provenance recording
- redaction
- transformation tracking
- deduplication
- privacy review queueing
- adjudication queueing

### 15.3 Snapshot pipeline enforcement

Snapshot generation must enforce realism gates automatically and emit a realism audit summary.

---

## 16. ACCEPTANCE THRESHOLDS

This policy is considered implemented only if:

- ✓ all new NDS case schemas contain the required provenance fields
- ✓ all future corpora report source composition
- ✓ primary benchmark/training corpora meet real-source thresholds
- ✓ legacy synthetic cases are clearly tagged and capped
- ✓ realism gate exists and is enforced before snapshot approval
- ✓ reviewers can see source and transformation metadata in the workbench

---

## 17. FAILURE CONDITIONS

This policy fails if:

- new primary corpora are still mostly synthetic
- provenance is missing
- source composition is not reported
- heavily rewritten cases silently enter gold training
- synthetic/internal cases are blended into gold without disclosure
- reviewers label cases without seeing their source/transformation status

---

## 18. RELEASE RULE

**Do not claim world-class NDS evaluation or learned-judgment quality if the underlying corpus is still primarily internally generated.**

A world-class product cannot be built on fake-case dominance.

---

## 19. REQUIRED ARTIFACTS

### Core policy doc

- `NDS_REAL_INPUT_CORPUS_POLICY_V1.md` ← this document

### Optional supporting docs

- `NDS_CORPUS_REALISM_AUDIT_SPEC_V1.md` — detailed audit methodology
- `NDS_PUBLIC_SOURCE_INGESTION_WORKFLOW_V1.md` — ingestion pipeline spec
- `NDS_GOLD_TRAINING_ELIGIBILITY_RULES_V1.md` — training case filtering rules

---

## 20. BUILD SUMMARY

**This is the gold standard.**

The product should no longer be allowed to:

- mostly invent its own test world
- mostly evaluate itself on internally shaped cases
- mostly learn from synthetic narrative structure

**From now on, the standard is:**

**real inputs first, provenance always, adjudication before gold, synthetic only as secondary support.**

That is how you build a trustworthy, world-class NDS system.
