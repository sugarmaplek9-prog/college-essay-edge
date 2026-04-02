# NDS_ADJUDICATION_WORKFLOW_V1

## Purpose
Turns the corpus into a consistent gold-label benchmark.

## Roles
- Reviewer A: first-pass labeler
- Reviewer B: blind second-pass labeler
- Adjudicator: resolves disagreement
- Owner: updates benchmark and release notes

## Workflow
1. Reviewer A reads the case only.
2. Reviewer A proposes:
   - action
   - best direction
   - rejected directions
   - clarification need
3. Reviewer B does the same independently.
4. Compare labels.
5. If disagreement is minor, adjudicator resolves.
6. If disagreement reveals unclear schema, update the rubric before continuing.
7. Freeze case once final label is approved.
8. Add released case to benchmark set.

## Non-negotiables
- Do not allow vague “both are fine” labels on forced-choice cases.
- On topic-selection cases, require an explicit winner.
- On sensitive-topic cases, require explicit risk notation.
- On blank-page cases, require explicit intake/clarification behavior.

## Agreement targets
- Reviewer agreement on action >= 90%
- Reviewer agreement on best direction >= 80%
- Disagreement on red-team cases triggers taxonomy review, not just case resolution

## Escalate when
- a case exposes a missing action enum
- a case exposes a missing risk flag
- a case cannot be scored under the current rubric
