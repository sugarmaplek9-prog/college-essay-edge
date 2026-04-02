# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_CLASSIFICATION_REVIEW_PACKET_V1

## 1. Document control

- **Product:** College Essay Edge
- **System area:** Structured Blank Page Intake
- **Phase:** Phase 1
- **Artifact type:** Classification review packet
- **Status:** Draft for execution
- **Intended consumers:** Founder, product lead, ML/review lead, prompt engineer, implementation engineer, QA, annotation reviewers
- **Primary objective:** Establish the exact human review, adjudication, calibration, and release-gating protocol for Phase 1 intake classification so the system can be tested, corrected, and trusted before broader rollout.

---

## 2. Why this packet exists

Phase 1 of Structured Blank Page Intake is not a generic UX form-processing layer. It is a **decision surface** that converts messy student inputs into a stable, reviewable classification state that downstream systems will trust.

If this layer is weak, every downstream output degrades:

- wrong narrative mode selection
- wrong prompt routing
- brittle personalization
- hallucinated certainty in ambiguous cases
- loss of student trust at the first meaningful interaction

This packet exists to prevent that failure mode.

It defines the exact review system required to answer five questions with rigor:

1. What exactly is the classifier being judged on?
2. How should humans label difficult or ambiguous cases?
3. How do we distinguish acceptable uncertainty from system weakness?
4. What error patterns are tolerable in Phase 1 and which are release blockers?
5. What evidence is required before this layer is allowed to ship?

This packet is therefore a **quality-control instrument**, not merely a testing checklist.

---

## 3. Relationship to adjacent artifacts

This review packet is subordinate to and must remain consistent with the following artifacts:

- `STRUCTURED_BLANK_PAGE_INTAKE_IMPLEMENTATION_PLAN_V1`
- `STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`
- `STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_IMPLEMENTATION_SPEC_V1`
- `structured_blank_page_intake_phase_1_implementation_spec_v1.json`
- `ML_LABELING_SPEC_V1`
- `CASE_ANNOTATION_GUIDE_V1`
- `RELEASE_QUALITY_GATE_CHECKLIST_V1`
- `INTELLIGENCE_ROUTING_POLICY_V1`

If any rule in this packet conflicts with a frozen upstream architecture or release-quality artifact, the conflict must be resolved explicitly and versioned. Silent drift is prohibited.

---

## 4. Phase 1 review objective

The objective of Phase 1 review is to determine whether the intake classification layer can do all of the following with sufficiently high reliability:

- identify the correct **intake state / mode** from user-provided inputs
- extract and classify the correct **signal family profile** from a structured blank page interaction
- distinguish between **clear**, **weak**, **ambiguous**, and **insufficient-evidence** cases
- avoid overclaiming confidence where evidence is thin
- produce deterministic, reviewable outputs under equivalent inputs
- expose failure patterns in a way that can be corrected systematically

Phase 1 review is successful only if the team can demonstrate that the intake classifier behaves like a disciplined, uncertainty-aware system rather than a persuasive but unstable AI layer.

---

## 5. Phase 1 classification unit under review

### 5.1 Review target

The unit under review is the classification behavior that maps structured blank page intake inputs into a normalized Phase 1 interpretation object.

### 5.2 Inputs under review

Inputs may include, depending on implementation:

- free-text student responses
- structured selections
- prior prompt context defined by the Phase 1 spec
- metadata permitted by policy
- missing-field patterns
- contradiction patterns across responses
- low-effort or evasive responses

### 5.3 Outputs under review

Outputs may include, depending on implementation:

- primary intake mode
- secondary or supporting mode tags
- signal family presence or absence
- ambiguity flags
- insufficiency flags
- contradiction flags
- recommended next-step route
- confidence band or confidence surrogate
- review notes / rationale object

### 5.4 Explicit non-goals for this packet

This packet does **not** review:

- final essay generation quality
- long-form essay feedback quality
- premium UX polish
- billing or entitlement logic
- non-Phase-1 downstream recommendation layers except where routing dependence creates a gating concern

---

## 6. Core review principles

All reviewers, engineers, and evaluators must follow these principles.

### 6.1 Truth over fluency

A terse correct classification is better than a fluent but wrong interpretation.

### 6.2 Evidence over intuition

Labels must be assigned based on observable evidence in the case, not on reviewer projection or “what the student probably meant.”

### 6.3 Uncertainty must be explicit

Where evidence is mixed, thin, contradictory, or low-signal, the correct behavior is to surface ambiguity or insufficiency, not to force precision.

### 6.4 Determinism matters

Equivalent inputs should yield materially equivalent classification outputs. Variation that changes routing or mode assignment without evidence change is a defect.

### 6.5 Reviewability is mandatory

Every judged case must be auditable by another reviewer after the fact.

### 6.6 Error asymmetry matters

Some mistakes are much worse than others. The packet prioritizes preventing errors that misdirect the student early, create false certainty, or corrupt downstream narrative work.

---

## 7. Review packet deliverables

A complete Phase 1 classification review packet must contain the following components.

### 7.1 Packet index

A top-level index listing all included materials, version numbers, owners, and last-updated timestamps.

### 7.2 Label schema reference

A concise but authoritative reference for:

- primary intake modes
- allowed secondary tags
- signal families
- ambiguity classes
- insufficiency classes
- contradiction classes
- escalation / human-review triggers

This reference must align with the implementation spec and labeling spec.

### 7.3 Gold-set case pack

A curated set of reviewed cases representing the real decision surface, not only clean examples.

Required composition:

- easy cases
- medium cases
- hard but resolvable cases
- ambiguous cases
- insufficient-evidence cases
- contradictory-input cases
- deceptive / low-effort cases
- edge cases likely to break deterministic routing

### 7.4 Adjudication notes

For each gold-set case, maintain a concise adjudication record showing:

- final label outcome
- why that label won
- what alternative label(s) were considered
- why they were rejected
- whether the case exposed a taxonomy weakness

### 7.5 Calibration set

A reviewer calibration subset used before broader evaluation begins.

### 7.6 Blind evaluation set

A held-out set for actual measurement. Reviewers and prompt engineers should not tune repeatedly on this set.

### 7.7 Error taxonomy

A normalized taxonomy of model failure patterns.

### 7.8 Scoring and acceptance sheet

A standardized scoring template for per-case judgment and release readiness.

### 7.9 Change log

Every meaningful packet change must be versioned, dated, and reason-coded.

---

## 8. Phase 1 label system to be reviewed

The exact labels must match the implementation spec. This packet does not invent a new taxonomy. It operationalizes the existing one for evaluation.

At minimum, the packet must support review across the following axes.

### 8.1 Primary mode label

Exactly one primary mode should be assigned unless the upstream spec explicitly permits a no-primary state.

Primary mode assignment must reflect the dominant actionable state of the student input, not merely the most emotionally salient phrase.

### 8.2 Secondary tag set

Secondary tags capture meaningful but non-dominant attributes that affect routing or interpretation.

Secondary tags must not be used as a crutch for avoiding a hard primary classification decision.

### 8.3 Signal family profile

The review packet must evaluate whether the classifier correctly detects the relevant signal families defined in Phase 1.

Examples of signal-family behavior that the packet must support, if present in the implementation spec:

- autobiographical specificity
- thematic directionality
- value or identity signal
- conflict / tension signal
- reflection depth
- agency signal
- concreteness vs abstraction
- emotional salience
- contradiction or instability markers

### 8.4 Ambiguity status

The system must be rewarded for correctly identifying genuinely ambiguous cases.

### 8.5 Insufficiency status

The system must be rewarded for correctly identifying cases with inadequate evidence rather than fabricating structure.

### 8.6 Review / escalation flag

If a case meets the defined threshold for human intervention, the packet must judge whether the flag was correctly raised.

---

## 9. Gold-set construction rules

### 9.1 Gold set purpose

The gold set is the system’s truth anchor for Phase 1 review. It is not merely a sample dataset. It is a deliberately designed benchmark that captures the actual operating environment.

### 9.2 Gold-set size

The exact case count may vary by available resources, but the packet should target a dataset large enough to support meaningful slicing by difficulty and failure type.

Recommended minimum for execution discipline:

- **Calibration set:** 20–30 cases
- **Gold adjudicated development set:** 75–150 cases
- **Blind evaluation set:** 50–100 cases

Smaller sets may be used temporarily, but release decisions based on extremely small sets should be treated as provisional.

### 9.3 Gold-set composition requirements

No gold set is acceptable if it is dominated by clean, obvious examples.

Target composition:

- 20–30% clean / high-signal cases
- 25–35% moderate cases with partial clarity
- 20–25% hard but resolvable cases
- 10–20% ambiguous cases
- 10–20% insufficient-evidence cases
- 5–15% contradiction / instability cases

Categories may overlap when appropriate.

### 9.4 Source diversity

Cases should vary across:

- essay maturity level
- writing ability level
- emotional directness
- topic specificity
- response effort quality
- student certainty level
- presence of cliché language
- fragmented vs polished expression

### 9.5 Anti-contamination rule

Cases used for major prompt iteration should not be over-recycled as the sole evidence of success. Hold-out data is mandatory.

---

## 10. Case format standard

Each reviewed case in the packet must use a standard format.

### 10.1 Required case fields

- `case_id`
- `source_group`
- `difficulty_band`
- `case_type`
- `input_payload`
- `expected_primary_mode`
- `expected_secondary_tags`
- `expected_signal_family_profile`
- `expected_ambiguity_status`
- `expected_insufficiency_status`
- `expected_escalation_flag`
- `adjudication_summary`
- `adjudication_rationale`
- `known_risks`
- `notes_for_reviewers`

### 10.2 Input payload handling

The payload must preserve the exact text and structured selections relevant to classification. Reviewers should never label from a paraphrase when the original is available.

### 10.3 Difficulty band definitions

- **Band A — Clear:** dominant signal is obvious, low ambiguity
- **Band B — Moderate:** one likely answer, but non-trivial competing interpretations exist
- **Band C — Hard:** requires close reading and disciplined taxonomy application
- **Band D — Ambiguous:** multiple interpretations remain materially plausible even after close reading
- **Band E — Insufficient:** evidence too weak to support a trustworthy primary interpretation

### 10.4 Case type tags

Recommended tags include:

- `clean_high_signal`
- `mixed_signal`
- `ambiguous`
- `insufficient`
- `contradictory`
- `low_effort`
- `emotionally_loaded`
- `overwritten`
- `cliche_heavy`
- `fragmented`
- `route_breaker_candidate`

---

## 11. Adjudication protocol

### 11.1 Why adjudication is necessary

Raw reviewer disagreement is not noise to be averaged away. It is diagnostic information.

The team must adjudicate disagreement to determine whether the issue lies in:

- the model
- the taxonomy
- the instructions
- the case itself
- reviewer inconsistency

### 11.2 Adjudication participants

Each non-trivial gold case should ideally involve:

- primary reviewer
- secondary reviewer
- adjudicator or review lead

### 11.3 Adjudication output

Every adjudicated case must end in one of the following states:

- **Resolved with stable label**
- **Resolved with ambiguity accepted as ground truth**
- **Resolved with insufficiency accepted as ground truth**
- **Taxonomy issue identified**
- **Case removed from benchmark**

### 11.4 Decision standard

The winning label should be the one best supported by the actual evidence and the frozen label definitions, not the one preferred by the senior-most person in the room.

### 11.5 When to modify the taxonomy

Taxonomy changes should be rare and justified only when repeated cases reveal a structural mismatch between reality and the current label framework.

---

## 12. Reviewer instructions

### 12.1 Reviewer job

The reviewer’s job is not to guess the student’s life story. The reviewer’s job is to classify the intake artifact in front of them using the allowed taxonomy and evidence only.

### 12.2 Review sequence

For each case, reviewers must follow this order:

1. Read the raw payload fully.
2. Identify the strongest observable signals.
3. Identify competing plausible interpretations.
4. Determine whether the evidence supports a single dominant primary mode.
5. Assign secondary tags only if independently justified.
6. Judge ambiguity and insufficiency explicitly.
7. Mark escalation if the defined trigger is met.
8. Record a brief rationale.

### 12.3 What reviewers must not do

Reviewers must not:

- reward eloquence over evidence
- infer hidden backstory not present in the input
- force a dominant label when ambiguity is real
- overuse ambiguity to avoid hard calls in resolvable cases
- use secondary tags to hide uncertainty
- re-interpret labels ad hoc on a per-case basis

### 12.4 Rationale requirements

Each rationale should be concise but specific enough that another reviewer can reconstruct the judgment.

Unacceptable rationale:

- “felt like mode X”
- “seems strongest”
- “overall vibe fits”

Acceptable rationale style:

- cites explicit evidence
- names the competing interpretation
- explains why ambiguity is or is not warranted

---

## 13. Error taxonomy

Every incorrect or unstable model output must be assigned at least one normalized error code.

### 13.1 Required error classes

#### E1 — Wrong primary mode

The dominant mode assignment is incorrect and would materially alter routing or downstream interpretation.

#### E2 — Missing dominant signal

The model failed to detect the strongest relevant signal family present in the case.

#### E3 — False dominant signal

The model elevated a weak or absent signal into a decisive classification factor.

#### E4 — Overconfidence under ambiguity

The case should have been marked ambiguous or low-confidence, but the system presented a decisive answer.

#### E5 — False ambiguity

The case was sufficiently clear, but the system avoided a valid decision by over-flagging ambiguity.

#### E6 — Failure to detect insufficiency

The input lacked enough evidence, but the system fabricated structure or certainty.

#### E7 — False insufficiency

The case contained enough evidence for a stable call, but the system incorrectly labeled it as insufficient.

#### E8 — Contradiction handling failure

The system failed to detect or properly respond to materially contradictory inputs.

#### E9 — Secondary tag distortion

Secondary labels were wrong in a way that meaningfully changes interpretation or route behavior.

#### E10 — Escalation failure

The system missed a case that required review or unnecessarily escalated a normal case.

#### E11 — Non-deterministic output drift

Equivalent or near-equivalent inputs produced materially different classifications without justified cause.

#### E12 — Rationale / observability defect

The system output could not be meaningfully reviewed because rationale or structured explanation was inadequate, inconsistent, or missing.

### 13.2 Severity bands

Each error must receive a severity rating:

- **S1 Critical:** release blocker; materially misroutes or misleads the student
- **S2 Major:** serious quality issue; weakens trust or downstream quality
- **S3 Moderate:** noticeable but recoverable issue
- **S4 Minor:** low-risk issue; does not materially change route or interpretation

### 13.3 Repeated-pattern escalation

A single S2 error may be tolerable depending on frequency. Repeated S2 patterns across the same slice should be treated as a gating concern.

---

## 14. Scoring framework

### 14.1 Why scoring exists

Scoring exists to support release judgment, not to create a false impression of mathematical precision.

### 14.2 Per-case scoring axes

Each blind-eval case should be scored across at least these axes:

- primary mode correctness
- secondary tag correctness
- signal family correctness
- ambiguity handling correctness
- insufficiency handling correctness
- escalation correctness
- rationale / reviewability quality
- determinism status, where applicable

### 14.3 Recommended scoring rubric

For each axis:

- **2 = correct / acceptable**
- **1 = partially correct / borderline**
- **0 = incorrect / unacceptable**

A binary pass/fail may also be recorded for critical axes.

### 14.4 Critical-axis rule

Primary mode correctness, ambiguity handling, insufficiency handling, and escalation correctness must be treated as critical axes.

A case may not receive an overall pass if a critical axis fails in a way that would materially harm routing.

### 14.5 Aggregate metrics

Recommended packet-level views:

- overall case pass rate
- critical-axis pass rate
- pass rate by difficulty band
- pass rate by case type
- ambiguity precision / recall surrogate
- insufficiency precision / recall surrogate
- escalation precision / recall surrogate
- severe error count by error class
- instability count

These metrics are for diagnosis and gating, not vanity.

---

## 15. Acceptance and release thresholds

Thresholds must remain aligned with the global release-quality framework. The values below define the expected Phase 1 posture.

### 15.1 Minimum qualitative standard

The classifier must behave like a disciplined educational product layer that knows when it knows, knows when it does not know, and can be corrected by humans without forensic guesswork.

### 15.2 Minimum quantitative release posture

Recommended minimums before Phase 1 is considered ready for broader internal use:

- **Overall blind-eval pass rate:** at or above 85%
- **Critical-axis pass rate:** at or above 92%
- **Band A/B cases:** at or above 95% primary-mode correctness
- **Band D/E cases:** overconfidence error rate kept very low and explicitly tracked
- **S1 critical errors:** zero unresolved release blockers
- **E11 non-determinism defects:** zero unresolved on frozen prompt/build inputs

These are starting thresholds. If actual user risk suggests a stricter bar, the stricter bar wins.

### 15.3 Mandatory no-ship conditions

Phase 1 must not ship if any of the following remain unresolved:

- repeated wrong-primary-mode failures on common case types
- frequent overconfidence in ambiguous or insufficient cases
- inability to explain why a classification was made
- prompt/build instability causing materially different outcomes on equivalent inputs
- escalation logic failing on defined high-risk cases
- gold-set disagreement so severe that the taxonomy itself remains unclear

---

## 16. Calibration protocol

### 16.1 Purpose

Calibration ensures reviewers are applying the taxonomy consistently before evaluation results are trusted.

### 16.2 Calibration process

1. Reviewers independently label the calibration subset.
2. Disagreement is analyzed.
3. Confusion clusters are documented.
4. Instructions are refined only if necessary.
5. A second pass is run if the first pass reveals major inconsistency.

### 16.3 Calibration success standard

Calibration is sufficient when disagreements are explainable, bounded, and not driven by basic taxonomy confusion.

If reviewers cannot reliably separate resolvable cases from ambiguous or insufficient cases, evaluation should pause until the framework is corrected.

---

## 17. Determinism and stability checks

Because this system is AI-mediated, review cannot rely only on one-shot correctness.

### 17.1 Required stability tests

For a meaningful subset of cases, rerun the classifier under the same frozen conditions and verify:

- same primary mode
- same ambiguity / insufficiency status
- same escalation behavior
- materially similar rationale structure

### 17.2 Near-equivalent perturbation tests

Where appropriate, test near-equivalent variants that should not change the route:

- punctuation changes
- whitespace changes
- harmless wording changes
- ordering shifts that do not change substance

### 17.3 Stability failure rule

If minor perturbations materially change routing or dominant classification without real semantic change, the issue must be logged as an E11 defect.

---

## 18. Slicing strategy for analysis

Blind-eval results must be sliced to reveal where the system is weak.

Required slices:

- by difficulty band
- by case type
- by primary mode
- by ambiguity status
- by insufficiency status
- by contradiction presence
- by response quality level
- by reviewer disagreement history

Optional but recommended:

- by prompt version
- by model version
- by route family
- by user demographic proxies only if policy-safe and genuinely useful

---

## 19. Human review escalation rules

The packet must explicitly identify what kinds of cases deserve human attention.

Recommended escalation triggers include:

- unresolved contradiction across inputs
- ambiguity that affects route selection materially
- insufficient evidence for trustworthy route assignment
- emotionally intense or atypical content where misclassification risk is unusually high
- model rationale inconsistency
- repeated instability on the same case

Human review should be used to preserve trust and learning quality, not as a blanket crutch for weak system design.

---

## 20. Review packet operating workflow

### 20.1 Before evaluation

- freeze implementation inputs for the review cycle
- freeze packet version
- confirm label definitions
- run reviewer calibration
- confirm blind set separation

### 20.2 During evaluation

- run blind cases
- capture structured outputs
- score against adjudicated truth
- assign error codes
- record severity
- flag unstable cases

### 20.3 After evaluation

- produce packet summary
- identify top failure clusters
- distinguish model issues from taxonomy issues
- propose corrective actions
- decide: ship, fix-and-rerun, or expand review set

---

## 21. Required output artifacts from each review cycle

Every formal review cycle should produce:

1. **Evaluation summary memo**
2. **Per-case scored sheet**
3. **Error cluster report**
4. **Determinism / stability report**
5. **Open issues list with owners**
6. **Release recommendation state**

Recommended release states:

- `PASS_FOR_PHASE_1_SCOPE`
- `PASS_WITH_RESTRICTIONS`
- `FIX_AND_RERUN_REQUIRED`
- `BLOCKED_BY_TAXONOMY`
- `BLOCKED_BY_DETERMINISM`

---

## 22. Packet governance

### 22.1 Ownership

One person must own packet integrity. One person must own adjudication quality. One person must own implementation follow-through. These may be different people, but the roles must be explicit.

### 22.2 Versioning

Every material change to:

- labels
- adjudication logic
- scoring rules
- thresholds
- blind-set composition
- reviewer instructions

must increment the packet version or recorded revision stamp.

### 22.3 Freeze discipline

Do not change packet rules mid-evaluation unless the run is explicitly invalidated and restarted.

---

## 23. Template structures

### 23.1 Per-case review template

```text
case_id:
source_group:
difficulty_band:
case_type_tags:
input_payload:

expected_primary_mode:
expected_secondary_tags:
expected_signal_families:
expected_ambiguity_status:
expected_insufficiency_status:
expected_escalation_flag:

model_output_summary:

score_primary_mode:
score_secondary_tags:
score_signal_families:
score_ambiguity:
score_insufficiency:
score_escalation:
score_reviewability:
score_determinism:

overall_case_result:
error_codes:
severity:
reviewer_notes:
adjudication_notes:
```

### 23.2 Evaluation summary template

```text
review_cycle_id:
packet_version:
implementation_version:
prompt_version:
model_version:

cases_evaluated:
overall_pass_rate:
critical_axis_pass_rate:

pass_rate_by_difficulty:
pass_rate_by_case_type:

critical_errors_open:
major_errors_open:
instability_cases:

top_failure_clusters:
release_recommendation:
required_actions_before_next_cycle:
owner_assignments:
```

---

## 24. MIT-level execution standard for this packet

This packet is only acceptable if it allows a technically serious team to do all of the following without ambiguity:

- build a gold benchmark
- train reviewers to consistency
- measure classification quality honestly
- detect instability instead of hiding it
- separate model failures from taxonomy failures
- make a real ship / no-ship decision
- improve the system through disciplined iteration

A packet that is eloquent but not executable fails this standard.

A packet that yields high scores on easy cases while missing uncertainty failures also fails this standard.

A packet that cannot survive adversarial review from a strong engineer, strong PM, or strong evaluator fails this standard.

---

## 25. Final release posture for Phase 1

Phase 1 classification should ship only when the evidence shows that it is:

- structurally understandable
- operationally testable
- reviewable by humans
- stable enough to trust
- honest about uncertainty
- strong enough on common cases
- bounded enough on edge cases

The bar for release is not perfection.

The bar is **disciplined trustworthiness**.

That is the correct standard for a first serious educational AI intake layer.
