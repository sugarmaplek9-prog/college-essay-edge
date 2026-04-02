# V1_ADMIN_REVIEW_WORKFLOW

## 1. Purpose

This document defines the authoritative v1 admin review workflow for College Essay Edge.

It is the quality-operations truth for:

* what gets flagged for review
* what reviewers see
* what they are allowed to do
* what gets labeled
* what gets escalated
* what becomes benchmark material
* what becomes a launch blocker
* how review actions are stored and preserved

This is not a support inbox process.
This is not a generic moderation policy.
This is not a vague “human in the loop” statement.

This is the operating system that allows the product to:

* protect authenticity
* detect genericity
* catch false passes
* catch false blocks
* learn from real usage
* defend paid-value quality over time

The release gate is explicit: if the team cannot inspect flagged outputs, label failures, capture benchmark candidates, and see post-launch failure patterns, release fails.

---

## 2. Core review doctrine

### 2.1 Review is a product control system

Review is not an afterthought layered on top of a finished AI product.
It is one of the product’s core control systems.

The validator enforces before display.
The review workflow inspects, interprets, escalates, and teaches the system what quality failures look like in the real world. The validator decides admissibility, but review is required to inspect failures, log false passes and false blocks, and turn real artifacts into benchmark and learning assets.

### 2.2 Review protects the moat

The product does not win by being broadly fluent.
It wins by being:

* more decisive
* less generic
* more student-specific
* more authenticity-protective
* more strategically useful

That means review must focus on the outputs most likely to feel replaceable, over-polished, school-agnostic, hedged, bloated, or substitution-prone. The release gate explicitly names repeated ghostwriting drift, school-agnostic supplement behavior, direction outputs that fail to choose, generic praise-dominated feedback, unresolved benchmark failures, and high substitution risk in core moat modules as launch blockers.

### 2.3 Review is not the same as blocking

Many items should be reviewed without being hidden from the student.

The workflow must distinguish:

* **non-blocking review**
* **blocking review**
* **benchmark review**
* **post-change review**
* **escalation review**

### 2.4 Review records must be structured and permanent

The data model already requires first-class records for queue items, reviews, labels, benchmark links, and provenance. Review actions must live in the product data model, not in Slack, notes, or memory.

---

## 3. Goals of the v1 review workflow

The admin review workflow exists to do five jobs well.

### 3.1 Inspect risk-bearing outputs

Reviewers must be able to inspect artifacts that are:

* authenticity-risky
* genericity-risky
* validator-borderline
* high substitution risk
* likely benchmark candidates
* likely false passes
* likely false blocks

### 3.2 Convert observations into durable labels

The labeling system is not metadata clutter. It is the mechanism by which the product learns what is truly useful, distinct, safe, and worth paying for. Labels must be structured, sparse, stable, and interpretable.

### 3.3 Escalate serious quality failures quickly

The workflow must surface repeated or high-severity failures as operational issues, not just isolated artifact notes.

### 3.4 Promote real artifacts into benchmark assets

Benchmark candidates must be capturable from real usage, not invented only in theory. The release and learning-readiness gates explicitly require this.

### 3.5 Preserve an audit trail for release and regression review

The team must be able to answer:

* what failed
* how often
* in which modules
* with what validator pattern
* with what label pattern
* whether the issue is getting better or worse

---

## 4. Review actors and permissions

### 4.1 Student

Student users are never reviewers in the admin workflow.
They may create artifacts, receive outputs, and generate passive outcome signals, but they do not label review records or resolve queue items.

### 4.2 Supporting adult

Supporting adults are not reviewers in v1.
Their role remains linked visibility, not internal quality control or student-output adjudication.

### 4.3 Reviewer

A reviewer is an internal quality operator allowed to:

* inspect queue items
* read artifacts, validator results, and provenance
* submit review records
* apply human-review labels
* mark false pass / false block
* recommend escalation
* recommend benchmark promotion

### 4.4 Quality owner

The quality owner is responsible for:

* queue health
* label consistency
* benchmark candidate discipline
* post-change review process
* anti-generic standard enforcement

The release gate explicitly requires one named owner responsible for quality review operations and one person defending anti-generic standards.

### 4.5 Admin

Admins may:

* inspect all review artifacts
* assign or reassign queue items
* resolve escalations
* approve benchmark candidate promotion
* review false-pass / false-block patterns
* participate in release gate review

---

## 5. What creates a review queue item

This is the most important operational decision in the entire review workflow.

### 5.1 Review queue creation sources

A queue item may be created from any of these sources:

1. validator-driven flagging
2. routing / fallback-driven flagging
3. module-specific heuristic thresholds
4. admin/manual escalation
5. benchmark candidate nomination
6. false-pass report
7. false-block report
8. post-change sampling rule

### 5.2 Canonical queue reasons

Use these queue reasons in v1:

* `genericity_risk`
* `authenticity_risk`
* `validator_borderline`
* `benchmark_candidate`
* `manual_escalation`
* `false_pass_report`
* `false_block_report`

These align with the API and data model contracts and should not be replaced with ad hoc free-text categories.

### 5.3 Automatic queue creation rules

Create a queue item automatically when any of the following are true:

#### A. Validator result is high-severity or critical but artifact remains visible

This is usually a **non-blocking** or **borderline** review case.

#### B. Validator decision is `accept_partial`

Any partial artifact in a core launch module should be review-eligible if the failure reason touches moat quality rather than only structural incompleteness.

#### C. Artifact triggers core launch-blocker patterns

Examples:

* ghostwriting drift
* final prose risk
* school-agnostic supplement behavior
* direction output that fails to choose
* essay feedback dominated by generic praise
* fake variety in ranked options

These patterns are explicitly named by validator rules, module label emphasis, and the release gate.

#### D. Output is strategically strong enough to become a benchmark candidate

Strong artifacts are not only for user delivery. Some should be promoted into benchmark cases or examples.

#### E. A reviewer, admin, or system marks an item as likely false pass or false block

The release gate explicitly requires both to be loggable.

#### F. Post-change sampling rule says it must be reviewed

When prompts, validators, schema versions, or provider behavior change materially, a post-change review sample must be created.

### 5.4 Queue creation severity classes

For operational purposes, classify queue items into three urgency levels:

* `routine`
* `priority`
* `critical`

Map those internally to API/data-model priorities:

* `low`
* `medium`
* `high`
* `urgent`

### 5.5 Blocking vs non-blocking queue rules

#### Non-blocking review

Use when:

* artifact is visible to the student
* issue is meaningful but not unsafe
* team wants to label, learn, or benchmark it

Examples:

* output is useful but soft
* direction ranking is acceptable but weakly differentiated
* supplement angle is decent but not as school-aware as desired

#### Blocking review

Use when:

* artifact should not be shown as a success state
* output risks authenticity breach or severe product misbehavior
* validator failure is serious enough to block or should have blocked

Examples:

* ghostwriting drift
* ready-to-submit supplement behavior
* over-polished replacement authorship
* structurally invalid but wrongly surfaced output

---

## 6. What reviewers see in the queue list

The queue list must help reviewers triage quality risk fast.

### 6.1 Required queue list fields

Every row should show:

* queue item ID
* module
* queue reason
* priority
* status
* created time
* student-safe subject summary
* validator severity summary
* artifact status
* assigned reviewer
* benchmark candidate badge if applicable

### 6.2 Reviewer triage filters

Reviewers must be able to filter by:

* status
* priority
* module
* queue reason
* assigned reviewer
* date range
* validator severity
* label presence/absence
* benchmark-candidate status

### 6.3 Queue sort default

Default sort should be:

1. urgent authenticity-risk items
2. high-priority validator-borderline items on moat modules
3. false-pass reports
4. benchmark candidates
5. routine labeling backlog

---

## 7. What reviewers see in the detail view

The review detail view is where the workflow becomes real.

### 7.1 Required detail sections

The API already requires the detail endpoint to return:

* artifact envelope
* validator result
* subject summary
* provenance summary
* existing labels
* benchmark link state if any

This workflow locks the detail view into the following panels.

### 7.2 Panel A — Artifact panel

Show:

* module name
* artifact status
* artifact summary
* structured payload render
* warnings
* canonical / historical state
* user-selected state if any

### 7.3 Panel B — Validator panel

Show:

* validator version
* structural / semantic / brand / authenticity pass/fail
* admissibility decision
* severity
* failure codes
* warning codes
* needs-more-input reason if applicable

The validator is a decision engine, not a yes/no check, so reviewers need layer visibility.

### 7.4 Panel C — Context / subject panel

Show a concise summary of:

* student profile context relevant to this artifact
* subject entity type and ID
* project or draft context
* linked story evidence if applicable
* institution/prompt context for supplement workflows

Do **not** require reviewers to reconstruct user context from raw database rows.

### 7.5 Panel D — Provenance panel

Show:

* module ID
* prompt bundle version
* schema version
* validator version
* provider key
* model key
* execution mode
* readiness state
* retry count
* fallback applied yes/no

This is required because provenance must support regression debugging, benchmark comparison, false-pass analysis, and ML-readiness later.

### 7.6 Panel E — Label history panel

Show all existing labels in source hierarchy order:

1. benchmark-reviewed
2. escalation-review
3. standard human review
4. validator-derived
5. passive outcome-derived

### 7.7 Panel F — Related history panel

When relevant, show:

* previous artifact for same subject/module
* prior reviewer decisions
* whether current item likely represents regression or improvement

### 7.8 Panel G — Benchmark panel

Show:

* already linked benchmark cases if any
* benchmark candidate status
* benchmark promotion controls

---

## 8. Reviewer actions

The review workflow should give reviewers a sharp, limited set of actions.

### 8.1 Required reviewer actions

Reviewers must be able to:

* add review summary
* add structured labels
* mark false pass
* mark false block
* escalate
* resolve
* mark benchmark candidate
* attach reviewer confidence

### 8.2 Optional reviewer actions

Reviewers may be allowed to:

* request rerun
* request tighter validation
* request reduced-scope behavior in future
* mark item for post-change sampling pool

These are operational signals, not direct model-control buttons in v1.

### 8.3 Actions reviewers should not have in v1

Reviewers should **not** directly:

* edit the artifact payload as product truth
* rewrite student-facing output
* silently replace blocked output with reviewer-authored content
* override permissions
* backfill provenance manually

---

## 9. Mandatory label workflow

The labeling system is central to the review workflow and must not be treated as optional.

### 9.1 Required label fields on human review

Every human-reviewed item should capture at minimum:

* `artifact_id`
* `module_id`
* `label_source = human_review`
* `quality_label`
* `uniqueness_label`
* `authenticity_label`
* `substitution_risk_label`
* `failure_labels[]`
* `outcome_labels[]` where applicable
* `review_confidence`
* `notes`
* `created_at`

### 9.2 Required label rules

Labels must:

* reflect product quality, not stylistic preference
* be sparse but meaningful
* remain stable over time
* map to benchmark and rubric logic
* stay interpretable by humans and models

### 9.3 Source hierarchy rule

Do not overwrite stronger labels with weaker ones.
Preserve each label record separately.

### 9.4 Review confidence rule

Every human review should include reviewer confidence:

* `high_confidence_review`
* `medium_confidence_review`
* `low_confidence_review`

### 9.5 Module-specific label emphasis

Reviewers should emphasize different failure families by module.

#### Edge Snapshot

High emphasis:

* uniqueness
* anti-generic failures
* substitution risk

#### Story Vault Analysis

High emphasis:

* story-value failures
* uniqueness
* decision usefulness

#### Narrative Direction Selection

High emphasis:

* weak decision pressure
* fake variety
* user_selected_recommendation

#### Essay Feedback

High emphasis:

* low_specificity_feedback
* generic_praise_block
* ghostwriting_drift
* user_revised_draft

#### Supplement Angle Suggestion

High emphasis:

* school_agnostic_angle
* templated_school_fit
* overlap-aware usefulness
* substitution risk

This module-specific emphasis is critical because the product fails differently by module.

---

## 10. False pass and false block handling

This is one of the most important world-class behaviors in the system.

### 10.1 False pass definition

A false pass is an artifact that was admitted or shown but should not have been trusted as strongly as it was.

Examples:

* generic but fluent artifact accepted as success
* borderline ghostwriting behavior shown to the user
* supplement angle accepted despite being school-agnostic
* direction artifact shown despite fake variety and no real recommendation pressure

### 10.2 False block definition

A false block is an artifact that was blocked or degraded too aggressively when it likely had acceptable or high value.

Examples:

* sharp but safe feedback blocked as ghostwriting
* specific direction artifact reduced unnecessarily
* useful partial artifact converted to needs-more-input when it could have been surfaced

### 10.3 Required false-pass / false-block actions

When a reviewer identifies either:

* add outcome label `false_pass` or `false_block`
* capture failure labels and notes
* preserve validator result alongside reviewer judgment
* include item in regression / calibration review

These outcome labels are explicitly approved and critical for later routing optimization.

### 10.4 Escalation threshold

Repeated false passes in a moat module should automatically elevate to quality-owner review.
Repeated false blocks should trigger validator calibration review.

---

## 11. Benchmark candidate capture workflow

This is where review becomes a long-term product advantage.

### 11.1 Why benchmark capture exists

The release gate requires benchmark coverage, real benchmark testing, and no unresolved critical benchmark failure patterns. Real artifacts must be promotable into benchmark material.

### 11.2 What should become benchmark candidates

Promote an artifact when it is:

* an unusually strong example of paid-value behavior
* an unusually clear example of generic failure
* an unusually clear authenticity-risk edge case
* a strong false-pass example
* a strong false-block example
* a representative hard case for a moat module

### 11.3 Reviewer promotion action

When promoting a benchmark candidate, the reviewer must supply at minimum:

* module
* case name
* why this case matters
* what a reviewer should notice
* what the validator should catch
* whether it is a gold example, failure example, or comparison example

These fields align directly with the case annotation guide, which requires benchmark cases to encode why the case matters, world-class target behavior, acceptable floor behavior, likely generic failure, what a reviewer should notice, and what the validator should catch.

### 11.4 Benchmark link types

Use only these link types:

* `source_candidate`
* `gold_example`
* `failure_example`
* `comparison_example`

### 11.5 Benchmark review rule

Benchmark promotion is not automatic gold status.
A promoted candidate still requires benchmark review before being treated as a canonical benchmark exemplar.

---

## 12. Escalation framework

Escalation exists to separate routine artifact review from system-level quality risk.

### 12.1 Escalation classes

Use four escalation classes:

* `artifact_escalation`
* `module_pattern_escalation`
* `release_blocker_escalation`
* `benchmark_gap_escalation`

### 12.2 Escalate immediately when

Any of the following should create immediate escalation:

* repeated ghostwriting drift
* repeated school-agnostic supplement behavior
* repeated direction outputs that fail to choose
* essay feedback repeatedly dominated by generic praise
* repeated high substitution-risk ratings in moat modules
* a validator pattern causing many false blocks or false passes
* benchmark hard cases not being outperformed

These are not subjective preferences. They are explicit release blocker patterns.

### 12.3 Escalation outputs

Every escalation should produce:

* escalation summary
* affected module(s)
* affected artifact IDs or sample set
* dominant failure labels
* dominant validator codes
* severity recommendation
* recommended next action

### 12.4 Escalation owners

#### Artifact escalation owner

Quality owner or assigned reviewer lead.

#### Module pattern escalation owner

Quality owner + engineering owner.

#### Release blocker escalation owner

Product owner + engineering owner + quality owner + anti-generic standards owner.

#### Benchmark gap escalation owner

Quality owner + benchmark owner.

---

## 13. Post-change review workflow

This is required by the release gate and should not be skipped after prompt, validator, schema, or provider changes.

### 13.1 Changes that trigger post-change review

* prompt bundle version change
* schema version change
* validator version change
* provider/model change
* routing policy change
* major fallback behavior change

### 13.2 Post-change review sample

For each meaningful change, review a targeted sample across:

* all launch modules touched
* at least one strong historical case
* at least one known generic-failure case
* at least one authenticity-sensitive case

### 13.3 Post-change review outputs

Record:

* improved / neutral / worse judgment
* new false-pass patterns if any
* new false-block patterns if any
* whether benchmark rerun is required
* whether release status is threatened

---

## 14. Queue resolution rules

A queue item can resolve in only one of these ways:

* `resolved_labeled`
* `resolved_escalated`
* `resolved_benchmark_promoted`
* `resolved_false_pass_logged`
* `resolved_false_block_logged`
* `resolved_duplicate/no_action`

Do not allow silent disappearance from the queue.

### 14.1 Minimum resolution record

Every resolution must leave behind:

* who resolved it
* when
* what labels were applied
* whether it escalated
* whether it was benchmark-promoted
* whether it was false-pass/false-block
* free-text notes

---

## 15. Operational SLAs for v1

v1 does not need enterprise process bureaucracy, but it does need discipline.

### 15.1 Suggested SLA targets

* urgent authenticity-risk item: same day
* high-priority moat-module item: within 1 business day
* benchmark candidate review: within 3 business days
* routine labeling backlog: within 5 business days

### 15.2 Why this matters

A review workflow with no tempo quickly becomes decorative.

---

## 16. Review metrics that actually matter

Do not drown the team in vanity metrics.
Track these:

* queue volume by module and reason
* queue aging by priority
* false-pass count by module
* false-block count by module
* benchmark candidates promoted by module
* repeated failure-label clusters
* repeated validator-code clusters
* post-change regression count
* proportion of core-module artifacts reviewed

### 16.1 Metrics that matter more than raw volume

The key question is not “how many items are reviewed?”
It is:

* are the important failures visible?
* are benchmark assets improving?
* are repeated quality failures shrinking?
* are moat modules becoming less replaceable?

---

## 17. Required data records

The review workflow must persist to the first-class data model using at least:

* `review_queue_items`
* `artifact_reviews`
* `artifact_labels`
* `benchmark_cases`
* `benchmark_case_artifact_links`
* `benchmark_runs`
* `benchmark_reviews`

The data model already treats these as mandatory, not optional.

### 17.1 Persistence rules

* no review record without artifact ID
* no label overwrite of stronger source labels
* no benchmark promotion without reason metadata
* no review completion without notes or labels
* no successful release claim without operational review data available

---

## 18. Review flow by item type

### 18.1 Standard flagged artifact

1. queue item created
2. reviewer opens detail view
3. reviewer inspects artifact, validator, provenance
4. reviewer labels quality/authenticity/uniqueness/substitution risk
5. reviewer resolves or escalates

### 18.2 Benchmark candidate artifact

1. queue item created or reviewer marks candidate
2. reviewer inspects why case matters
3. reviewer adds benchmark metadata
4. reviewer promotes to benchmark candidate
5. benchmark owner later approves or rejects canonical benchmark use

### 18.3 False-pass artifact

1. queue item created via report or reviewer discovery
2. reviewer confirms false pass
3. reviewer labels artifact
4. reviewer escalates if pattern repeats
5. item added to regression or calibration review set

### 18.4 False-block artifact

1. queue item created via report or reviewer discovery
2. reviewer confirms false block
3. reviewer labels artifact
4. reviewer routes issue for validator or threshold calibration

### 18.5 Post-change sampled artifact

1. item sampled after system change
2. reviewer compares current behavior to expected target or historical known case
3. reviewer records improved / neutral / worse judgment
4. escalate if regression appears material

---

## 19. What the review workflow must never become

Do not let the workflow degrade into:

* a generic customer-support inbox
* a place where reviewers rewrite outputs manually
* an unstructured note pile with no labels
* a benchmark dump with no case discipline
* a passive archive no one uses for release decisions
* a place where authenticity failures are discussed but not encoded

If review cannot affect labeling, escalation, benchmarking, and release quality decisions, it is not doing its job.

---

## 20. Final directive

Build the v1 admin review workflow as the product’s quality-control operating system.

It must allow the team to:

* inspect the right outputs
* label them consistently
* distinguish non-blocking from blocking review
* catch false passes and false blocks
* escalate repeated moat failures
* promote real benchmark candidates
* preserve provenance and auditability
* support release decisions with evidence instead of vibes

The review workflow is not overhead.
It is the mechanism that keeps College Essay Edge from becoming another fluent, generic, hard-to-improve AI product.

That is the v1 admin review workflow standard.
