# Plan — 072 Real Human Corpus Expansion

## Objective

Run `072` as the controlled real-human evidence program after `074` closure and `075` freeze: preserve the frozen first-pass truth artifacts, keep blind closed, treat the blind framework as complete for the current split, and use broader real-human evidence to create a future frozen split with fresh unseen blind cases.

## Architecture / workflow focus

### 1. Provenance-first intake contract

Define what a valid real-human case needs before it enters the corpus program:

- source URL and domain
- source class
- public-source posture
- human-authorship status
- provenance confidence
- permission status
- contamination status
- strength band
- input form
- bucket eligibility
- notes explaining acceptance or quarantine posture

### 2. Frozen split and execution posture

Preserve and document the locked first-pass buckets:

- visible
- blind
- quarantine

Frozen first-pass split:

- 15 visible
- 8 blind
- 2 quarantine

Current posture:

- visible packet executed and frozen
- `074` closed as a stop-state lane
- `075` frozen at visible closure
- blind framework exists but is non-executable for the current split because no unseen blind-assigned cases remain
- next move is broader evidence gathering and future split construction, not a new repair lane

### 3. Queue → provenance review → registry path

Create a repeatable acquisition path that does not fake certainty:

- candidate queue first
- provenance review before acceptance
- deduplication before registry entry
- intake completion before bucket assignment
- quarantine whenever provenance, permission, or contamination remains unclear

### 4. Storage and traceability

Ensure each case is URL-first and traceable from source to queue to registry to bucket to evaluation usage.

### 5. Execution protocol

Run each cycle in stages:

1. registry review and split freeze confirmation
2. visible grouped evaluation only
3. visible decision memo
4. single-lane decision only if one dominant family can be defined cleanly
5. blind only at an explicit later gate

Report results separately for:

- strong inputs
- medium inputs
- weak inputs

### 6. Broader evidence-gathering focus

Broader evidence gathering after `074` should bias toward cases that reduce bootstrap skew and test unresolved behavior honestly:

- additional rough public-human inputs
- stronger medium and weak representation
- more varied source domains beyond the initial official-example concentration
- enough recurrence evidence to decide whether the unresolved miss is an outlier or a real class
- a future blind roster containing fresh blind-assigned cases never exposed to repair work

### 7. Convergence tracking

Track whether the system is converging or fragmenting by measuring:

- number of newly appearing failure families
- whether reusable rule count is shrinking or growing
- whether broader expansion makes behavior more stable or more patch-driven
- whether unresolved misses recur under broader evidence strongly enough to justify a new lane

## Deliverable set

1. V2 execution directive
2. exact queue / intake / registry metadata contract
3. frozen split manifest
4. visible-first execution protocol
5. convergence log with post-`074` status
6. broader evidence-gathering tasks
7. future frozen split objective for fresh unseen blind coverage

## Verification approach

- verify the artifacts are internally consistent and use the V2 field model
- verify the frozen first pass remains frozen and blind remains closed
- verify the current blind framework is documented as complete but non-executable
- verify broader evidence gathering is framed as evidence collection, not implicit repair work

## Deployment note

No production deploy is required for this corpus-governance update.

## Current phase note — proof memo and targeted repair planning

Following the completed frozen blind execution and locked blind human review, the current `072` phase is analysis-only:

- summarize the blind-review evidence into a proof memo
- define a targeted repair plan for the modest-advantage pattern
- preserve the frozen split, existing outputs, and current product behavior unchanged

This phase does **not** rerun evaluation, edit NDS behavior, alter the frozen corpus, or make a public proof claim.
