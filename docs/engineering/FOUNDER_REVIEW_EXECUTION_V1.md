# Founder Review Execution V1

Date: 2026-04-01

## Purpose

This memo converts the current founder review into repo-level operating direction.

It defines what the next phase is, what work is now secondary, and what evidence must be produced before the product can be considered beyond this stage.

This is not a new surface-polish brief.
This is not a request to reopen Page 3 or Page 4.
This is an execution directive for the next proof phase.

## Founder decision now in force

The current phase is not complete until College Essay Edge clearly and repeatedly proves that Narrative Direction Selection delivers better narrative-direction judgment than free AI on messy real student input.

The operating priority is now:

1. protect the existing Page 3 / Page 4 boundary
2. shift active execution toward proof of advantage
3. judge new work by whether it improves evidence of trust, judgment, or comparative superiority

## Boundary that remains frozen

The Page 3 / Page 4 surface freeze remains active.

Required gate:

- `npm run test:first-minute:surface-gates`

Formal gatekeeper tests:

- `src/__tests__/unit/page3-surface-integrity.spec.ts`
- `src/__tests__/unit/opening-coach-ordering.spec.ts`
- `src/__tests__/unit/opening-coach.spec.ts`

Rule:

- do not reopen Page 3 / Page 4 surfaces unless a named gate fails first or product explicitly approves a narrowly scoped correction
- do not use wording cleanup as a reason to reopen these surfaces
- do not smuggle ranking, routing, or broad remediation back in through surface work

## Active question for the next phase

The next serious product question is:

**Does NDS produce meaningfully better narrative-direction judgment than free AI on real messy student cases?**

All near-term product evaluation work should help answer that question with evidence.

## Approved workstreams

The default approved workstreams for this phase are:

### 1. Comparison evaluation

- run controlled product comparisons against free AI baselines
- use messy, mixed-signal, and low-signal real-case inputs rather than cleaned showcase prompts
- capture both winner choice and explanation quality, not just one of them

### 2. Human review and adjudication

- produce blind or structured review packets for human judgment
- separate isolated misses from repeated failure classes
- require operator notes when a case is marked weak or failed

### 3. Evidence pack production

- maintain repeatable output bundles showing inputs, surfaced packet, baseline comparison, and review outcome
- make founder review depend on durable artifacts rather than anecdotal examples

### 4. Failure-class escalation

- escalate only defects that change judgment quality, trustworthiness, evidence anchoring, or comparative advantage
- treat surface quality as controlled unless a named regression fails or a product-truth defect is found

## Non-default work

The following should not become the normal workstream during this phase unless explicitly approved:

- wording cleanup
- helper-line refinement
- cosmetic Page 3 / Page 4 polishing
- broad surface rewrites
- copy-only improvement passes that do not change trust, conversion, or judgment quality

## Required proof artifacts

The next phase should produce a recurring proof packet with at least the following:

1. NDS versus free-AI comparison batch on real messy cases
2. reviewer-scored blind or structured comparison results
3. case-level rationale for NDS wins, ties, and losses
4. repeated-failure clustering rather than anecdotal miss lists
5. explicit statement of whether the current batch strengthens or weakens the claim of advantage

## Evidence requirements

For a comparison batch to count as meaningful founder-review evidence, it should show:

- real student-note style inputs
- mixed signal quality rather than curated strong-only cases
- baseline outputs from free AI under a documented prompt protocol
- human-reviewable packet outputs, not hidden internal scores only
- batch-level summary plus case-level review notes

## Phase exit scorecard

The phase is not complete unless founder review can credibly say yes to all of the following:

- the strongest direction is specific and differentiated
- the explanation is evidence-anchored and trustworthy
- the next move feels like real coaching
- the experience is visibly better than free AI
- messy real-input cases show repeated advantage
- engineering effort is concentrated on proof, not polish drift

## Execution rule for engineering

When choosing between candidate tasks, prefer the task that most directly improves one of these:

- comparative evidence
- trust in judgment quality
- clarity of repeated failure classes
- founder confidence in NDS advantage on messy input

If a task mainly improves polish without moving those outcomes, it is secondary by default.