# RAPID_TEST_FEEDBACK_AND_PATCH_WORKFLOW_V1

## College Essay Edge

## Purpose

This document defines the standard execution loop for interpreting testing feedback, diagnosing failures, implementing corrections in Visual Studio Code, and verifying fixes quickly without creating debugging chaos.

This is not a general engineering philosophy document.  
It is an execution document for moving from test output to validated patch as fast as possible.

Use this workflow for:

- NDS scoring failures
- output schema mismatches
- case-level prediction errors
- parser issues
- scorer integration defects
- UI or API contract mismatches
- regression findings
- quality-control failures during evaluation

---

## 1. Core operating principle

Do not debug emotionally.  
Do not patch broadly.  
Do not refactor during active failure handling unless the failure itself requires it.

Every issue must follow this sequence:

1. Capture the exact failure
2. Classify the failure
3. Define the expected behavior
4. Identify likely root cause
5. Make the smallest responsible patch
6. Re-run the original failing test
7. Run a small regression smoke set
8. Log outcome

This is the standard correction loop.

---

## 2. Standard correction loop

### Step 1 — Capture exact failure

Before touching code, capture:

- exact command run
- exact error or scoring output
- exact case IDs involved
- exact input file used
- exact expected behavior
- exact observed behavior

Do not rely on memory.  
Do not paraphrase loosely.  
Save the real output.

Preferred terminal pattern:

```bash
python scripts/score_predictions.py --predictions outputs/NDS_PREDICTIONS_TEMPLATE.jsonl > outputs/test_run.log 2>&1
```

Or for Python tests:

```bash
pytest > outputs/test_run.log 2>&1
```

Or for JS/TS tests:

```bash
npm test > outputs/test_run.log 2>&1
```

If the failure is in app execution rather than formal tests:

```bash
python app.py > outputs/app_run.log 2>&1
```

---

### Step 2 — Classify the failure

Every issue must be assigned one primary category.

#### A. Spec failure
The code does not match the required product, scoring, routing, or schema specification.

Examples:
- required output field missing
- wrong JSON shape
- scorer expects different contract
- routing policy violated

#### B. Logic failure
The code runs but the result is wrong.

Examples:
- wrong narrative direction selected
- confidence incorrect
- evidence tags wrong
- ranking logic broken

#### C. Data failure
The input cases, labels, fixtures, or templates are malformed, inconsistent, or incomplete.

Examples:
- malformed JSONL
- missing gold label
- bad case annotation
- incorrect template shape

#### D. Integration failure
Individual parts work, but handoff between components fails.

Examples:
- frontend payload mismatches backend
- scorer cannot read generator output
- parser transforms fields incorrectly
- API schema drift

#### E. Quality failure
The issue is not immediate breakage, but brittleness or maintainability that threatens delivery.

Examples:
- duplicated logic
- hardcoded values
- fragile parsing
- hidden assumptions
- unclear naming causing repeated errors

Only assign more than one category if truly necessary.  
Primary category drives patch strategy.

---

### Step 3 — Define expected behavior

Before editing code, write one exact sentence:

**Expected behavior:** what should have happened?

Examples:

- Prediction rows should include all fields required by the scorer.
- NDS should output one allowed direction label and a valid confidence value.
- Parser should preserve case_id without renaming or dropping it.
- Frontend should send payload matching the backend contract.

Do not begin patching until expected behavior is explicit.

---

### Step 4 — Localize likely ownership

Do not search the whole repository blindly.  
Identify the layer that most likely owns the defect.

Possible ownership layers:

- input ingestion
- case parser
- transformation layer
- model invocation layer
- output serializer
- scorer
- UI display layer
- API request/response contract
- config/environment layer

Then identify the smallest file set likely involved.

Examples:

- serializer issue → `prediction_writer.py`
- scorer issue → `score_predictions.py`
- case loading issue → `inspect_cases.py`
- schema mismatch → generator + scorer boundary files

---

### Step 5 — Identify likely root cause

Use structured diagnosis, not guesswork.

Ask:

1. Is the input wrong?
2. Is the transformation wrong?
3. Is the output format wrong?
4. Is the test harness wrong?
5. Is the spec outdated or inconsistent?
6. Is this isolated or systemic?

Write root cause as a short hypothesis, for example:

- Output generator is still emitting legacy schema.
- Confidence normalization is missing.
- Case parser drops `reasoning_summary` when null.
- Scorer expects new field names not yet implemented in generator.

Do not label a root cause as confirmed until verification supports it.

---

### Step 6 — Patch narrowly

The patch rule is:

**Change the smallest amount of code necessary to restore correct behavior.**

Avoid:

- opportunistic refactors
- style cleanups during active failure correction
- renaming unrelated functions
- restructuring working modules
- changing multiple systems unless required

Good patch example:

- add missing required field to serializer
- normalize one broken enum
- fix one parsing branch
- update one contract mapping

Bad patch example:

- rewrite entire generation pipeline for one missing field
- refactor routing architecture during a scorer mismatch
- redesign prompts during a parsing defect

---

### Step 7 — Verify in the right order

Always verify in this order:

#### 1. Re-run original failing case
Confirm the exact issue is fixed.

#### 2. Re-run nearby smoke set
Use a small representative pack to catch obvious regressions.

For NDS current smoke set:

- NDS-001
- NDS-004
- NDS-005
- NDS-010
- NDS-016

#### 3. Re-run broader suite only after smoke passes
Do not jump to full suite first.

This preserves speed and prevents wasted time.

---

### Step 8 — Log outcome

Every issue must end with one of these statuses:

- Closed
- Partially fixed
- Needs deeper refactor
- Needs spec clarification
- Needs data cleanup
- Deferred

Log what changed, why, and how it was verified.

---

## 3. Standard VS Code operating setup

Use this workspace structure:

```text
/project-root
  /docs
    RAPID_TEST_FEEDBACK_AND_PATCH_WORKFLOW_V1.md
    TEST_FEEDBACK_LOG.md
    PATCH_PLAN.md
    BUG_FIX_CHECKLIST.md
  /outputs
    test_run.log
    app_run.log
```

Recommended editor layout:

- left pane: active source file
- top right: `outputs/test_run.log`
- bottom right: `docs/PATCH_PLAN.md`

This gives a stable debugging station.

---

## 4. Required support documents

Create and maintain these files.

### A. `BUG_FIX_CHECKLIST.md`

```md
# BUG FIX CHECKLIST

## 1. Capture exact failure
- [ ] Save full error output or scoring feedback
- [ ] Save command used to generate issue
- [ ] Save input file / case ID / test conditions
- [ ] Confirm issue is reproducible

## 2. Classify issue
- [ ] Spec failure
- [ ] Logic failure
- [ ] Data failure
- [ ] Integration failure
- [ ] Quality failure

## 3. Define expected behavior
- [ ] What should have happened?
- [ ] Which spec or file defines correct behavior?
- [ ] Is the issue isolated or systemic?

## 4. Root cause
- [ ] Input problem?
- [ ] Prompt/problem framing issue?
- [ ] Parsing/transformation bug?
- [ ] Model routing issue?
- [ ] Scoring mismatch?
- [ ] Output schema mismatch?

## 5. Patch plan
- [ ] Smallest possible fix identified
- [ ] File(s) to edit identified
- [ ] No unnecessary refactor included
- [ ] Risk of side effects noted

## 6. Verification
- [ ] Re-run original failing test
- [ ] Re-run nearby related tests
- [ ] Confirm no regression
- [ ] Log result in TEST_FEEDBACK_LOG.md

## 7. Decision
- [ ] Close
- [ ] Needs deeper refactor
- [ ] Needs spec change
- [ ] Needs data cleanup
```

---

### B. `TEST_FEEDBACK_LOG.md`

```md
# TEST FEEDBACK LOG

## Issue ID: 2026-03-17-001
**Date:** 2026-03-17
**Command Run:** `python scripts/score_predictions.py --predictions outputs/NDS_PREDICTIONS_TEMPLATE.jsonl`
**Input / Case IDs:** NDS-001, NDS-004, NDS-005
**Observed Behavior:** scorer rejected 3 outputs due to missing required field `reasoning_summary`
**Expected Behavior:** all predictions should match required scoring schema
**Issue Type:** Spec failure
**Root Cause Hypothesis:** prediction writer is emitting legacy schema
**Files Likely Involved:** `scripts/make_blank_predictions.py`, `src/lib/...`
**Patch Decision:** update output builder to emit current required schema
**Verification Step:** rerun scorer on same cases
**Result:** pending
```

---

### C. `PATCH_PLAN.md`

```md
# PATCH PLAN

## Active Issue
Issue ID: 2026-03-17-001

## Problem
Prediction output schema does not match scorer requirements.

## Correct Behavior
Each prediction row must include:
- case_id
- predicted_direction
- confidence
- reasoning_summary
- evidence_tags

## Smallest Fix
Update prediction serialization layer only.
Do not change scoring script.
Do not refactor unrelated generation code.

## Files To Edit
- `src/.../prediction_writer.py`
- `scripts/make_blank_predictions.py`

## Patch Steps
1. Locate serializer used for prediction rows.
2. Compare actual emitted keys vs required keys.
3. Add missing required fields.
4. Preserve existing field names still used elsewhere only if backward compatibility is needed.
5. Regenerate output file.
6. Re-run scorer.

## Regression Risk
Medium if downstream readers expect old schema.

## Done When
Scorer runs cleanly on smoke set with no schema errors.
```

---

## 5. Failure intake template

Whenever new testing feedback appears, normalize it into this format before coding:

```md
ISSUE:
[paste exact error or bad scoring result]

CONTEXT:
[file name(s) involved]
[command run]
[what you expected]

GOAL:
[fix only this issue]
[do not refactor unrelated code]

OUTPUT NEEDED:
1. root cause
2. exact patch plan
3. copy/paste code
4. verification command
```

This template is the fastest way to convert raw feedback into an actionable patch cycle.

---

## 6. Standard implementation rules

### Rule 1 — Reproduce before editing
If the issue cannot be reproduced, do not patch yet.

### Rule 2 — One active issue at a time
Do not mix multiple unrelated failures into one patch.

### Rule 3 — Patch lowest responsible layer
Fix the layer that owns the defect, not the symptom layer if avoidable.

### Rule 4 — No broad refactors during active triage
Open a separate refactor item if architecture cleanup is needed.

### Rule 5 — Verify against original failure first
Never assume fix success because the code “looks right.”

### Rule 6 — Always preserve failing examples
A failing case is an asset, not an annoyance.

### Rule 7 — Write down expected behavior before patching
If expected behavior is vague, implementation quality will be vague.

---

## 7. Fast diagnosis questions

Before coding, answer these five questions:

1. What exactly failed?
2. What should have happened?
3. Which file most likely owns the behavior?
4. What is the smallest patch that could fix it?
5. How will I verify the fix in under five minutes?

If those questions are not answerable, diagnosis is not mature enough yet.

---

## 8. Common failure patterns for NDS and evaluation systems

### Pattern A — Output schema mismatch
Symptoms:
- scorer rejects rows
- missing fields
- wrong field names
- invalid enum values

Action:
- compare emitted row shape to scoring contract
- patch serializer only if possible

### Pattern B — Allowed label mismatch
Symptoms:
- scorer says invalid direction
- case prediction not in allowed set

Action:
- inspect enum normalization
- inspect label map
- patch validation or mapping logic

### Pattern C — Confidence range failure
Symptoms:
- confidence out of bounds
- format inconsistent
- score penalties tied to confidence field

Action:
- normalize confidence before output
- enforce allowed numeric format

### Pattern D — Case parser loss
Symptoms:
- missing case_id
- missing essay content
- missing annotations
- null fields unexpectedly appearing downstream

Action:
- inspect ingestion and transformation layers
- identify where field is dropped

### Pattern E — Scorer/generator drift
Symptoms:
- generator updated but scorer still expects old contract
- scorer updated but template generator not updated

Action:
- compare both ends of the contract
- patch one side or both deliberately
- record contract version in docs

---

## 9. What not to do

Do not do the following during active failure handling:

- “clean up” unrelated files
- rename modules for style
- rewrite prompts without evidence
- patch multiple unrelated problems together
- jump directly to full-suite reruns
- trust memory instead of logs
- patch without writing expected behavior
- assume every failure is a code problem

Some failures are spec failures.  
Some are data failures.  
Some are evaluation harness failures.  
Treating all failures as coding failures wastes time.

---

## 10. Rapid execution protocol for use with ChatGPT

When using ChatGPT to accelerate correction, provide:

- exact failure output
- command run
- file names involved
- expected behavior
- instruction to avoid unrelated refactor

Use this message format:

```md
ISSUE:
[paste exact error or failing behavior]

CONTEXT:
[command run]
[files involved]
[expected behavior]

CONSTRAINTS:
-fix only this issue
-no broad refactor
-preserve current architecture unless necessary

NEEDED:
1. issue classification
2. root cause hypothesis
3. exact patch steps
4. copy/paste code
5. verification commands
```

Expected response should produce:

- issue type
- likely root cause
- exact file target
- minimal patch
- verification sequence
- regression checks

This is the preferred AI-assisted correction workflow.

---

## 11. Recommended smoke-test policy

For every patch:

### First
Re-run the original failing case.

### Second
Run the 5-case smoke pack.

### Third
Only after smoke passes, run broader evaluation set.

This should be the default rule unless the failure affects infrastructure broadly enough that full rerun is immediately required.

---

## 12. Escalation rules

Escalate beyond simple patching if any of the following are true:

- same issue repeats across multiple patches
- expected behavior is unclear or contradictory
- fix requires changing contract across multiple systems
- patch would create high regression risk
- failure indicates architecture defect rather than local bug
- scorer and generation logic are out of version sync

When escalation is needed, create a separate engineering decision item rather than forcing a local patch.

---

## 13. Definition of done for a correction cycle

A correction cycle is done only when all of the following are true:

- exact failure was reproduced
- issue category assigned
- expected behavior written clearly
- smallest responsible patch implemented
- original failing case passes
- smoke set passes
- result logged
- no obvious regression introduced

If any one of these is missing, the issue is not truly closed.

---

## 14. Immediate implementation recommendation

Add the following to your current repo now:

1. `docs/RAPID_TEST_FEEDBACK_AND_PATCH_WORKFLOW_V1.md`
2. `docs/BUG_FIX_CHECKLIST.md`
3. `docs/TEST_FEEDBACK_LOG.md`
4. `docs/PATCH_PLAN.md`
5. `outputs/.gitkeep` if needed to preserve log directory

Then use this as the standard debugging and correction protocol for NDS and later Essay Feedback.

---

## 15. Final operating principle

Speed does not come from coding faster.  
Speed comes from reducing ambiguity.

The fastest teams do not guess faster.  
They reduce the number of wrong edits.

This workflow is designed to make correction mechanical, narrow, and verifiable so progress compounds instead of thrashing.
