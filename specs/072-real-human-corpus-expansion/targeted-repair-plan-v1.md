# Targeted Repair Plan — V1

Date: 2026-04-26

## Status

- Source of evidence: `072-real-human-corpus-expansion` blind human review
- Review outcome: `NDS_MODEST_ADVANTAGE`
- Current posture: analysis and repair planning only

## Evaluation standard going forward

All internal model or product-quality changes must use repeatable evaluation methods.

Every repair iteration must include:

- fixed input set
- written rubric
- pass / fail threshold
- repeatable run command
- artifacted result
- pattern summary
- GitHub PR evidence

Founder review is reserved for:

- user-facing output quality
- business or release judgment
- approving or changing standards
- exceptions flagged by evaluation

## Failure class 1 — repeated correction-arc templating

### Evidence from 072 review

- The blind review found repeated use of the same correction arc across unrelated cases.
- This was visible in modest-win cases such as `NSB-FS-006`, `NSB-FS-014`, `NSB-FS-016`, `NSB-FS-020`, and `NSB-FS-021`.

### Expected product behavior

- Narrative framing should match the actual case shape rather than forcing every case into a mistake-then-correction structure.
- Different story types should surface different reasoning patterns when the evidence demands it.

### Prohibited patch behavior

- Do not hard-code alternative templates on a case-by-case basis.
- Do not merely replace one universal stock frame with another.

### Acceptance criteria

- On a fixed regression set, outputs show materially more than one dominant reasoning shape.
- The proportion of cases receiving a justified non-correction frame increases where appropriate.
- Reviewer pattern summary no longer flags correction-arc overuse as a leading defect.

### Regression test or evaluation method

- Fixed input set: the frozen `072` blind cohort plus a small visible holdback of similar strong cases
- Rubric: case-shape fit, narrative specificity, and over-templating rate
- Threshold: no more than `3 / 9` blind-cohort cases flagged for inappropriate correction-arc framing
- Repeatable run command: repair evaluation command to be defined in the implementation PR before code changes land
- Required artifacts: per-case review table, pattern summary, and PR evidence

## Failure class 2 — awkward or truncated phrasing

### Evidence from 072 review

- The review repeatedly noted clunky, awkward, or truncated language in otherwise-correct outputs.
- This weakened trust in cases such as `NSB-FS-005`, `NSB-FS-013`, `NSB-FS-016`, and `NSB-FS-021`.

### Expected product behavior

- Output should read as polished premium coaching with complete, coherent sentences.
- Compression should preserve meaning instead of producing cut-off phrasing.

### Prohibited patch behavior

- Do not bolt on cosmetic string cleanup after weak reasoning.
- Do not optimize only for fluency while preserving genericness underneath.

### Acceptance criteria

- Blind or semi-blind reviewers no longer cite truncated or clunky wording as a recurring weakness.
- Sentence-level coherence passes across all evaluated cases in the fixed test set.
- At least `8 / 9` evaluated cases are rated fluent enough to feel premium rather than obviously templated.

### Regression test or evaluation method

- Fixed input set: frozen `072` blind cohort
- Rubric: fluency, completeness of thought, and trust/polish signal
- Threshold: `0` truncated outputs and at least `8 / 9` cases passing fluency review
- Repeatable run command: to be defined in the repair PR with artifact capture
- Required artifacts: packet, scorer notes, failure tally, pattern summary

## Failure class 3 — insufficiently decisive admissions judgment

### Evidence from 072 review

- NDS won all `9` cases, but only `2` felt clearly better.
- Most wins were accurate yet landed in the somewhat-better range rather than obvious premium-coaching superiority.

### Expected product behavior

- When NDS identifies the right direction, it should express the judgment with sharper prioritization and cleaner contrast.
- The reader should see why one direction is the real essay, not just one acceptable option among many.

### Prohibited patch behavior

- Do not achieve “decisiveness” by becoming overconfident without stronger evidence use.
- Do not remove nuance or uncertainty where the student material is genuinely ambiguous.

### Acceptance criteria

- On the fixed test set, the share of `clearly better` blind judgments increases without increasing invalid or overreaching outputs.
- Reviewers consistently report stronger conviction and clearer prioritization.

### Regression test or evaluation method

- Fixed input set: frozen `072` blind cohort
- Rubric: decisiveness, evidence-backed prioritization, and usefulness of contrast against weaker angles
- Threshold: at least `4 / 9` cases judged clearly better while keeping invalid cases at `0`
- Repeatable run command: defined and artifacted in the future repair PR
- Required artifacts: blind packet, locked score sheet, decoded summary, pattern memo

## Failure class 4 — wins that are correct but not yet obvious enough

### Evidence from 072 review

- Several cases were judged as NDS wins because the baseline was generic, but the margin did not feel unmistakable.
- This pattern appeared across most of the somewhat-better wins.

### Expected product behavior

- The better output should separate quickly and obviously on first read through specificity, sharper reasoning, and more useful next steps.
- Reviewers should not have to infer superiority mainly by noticing the baseline is weak.

### Prohibited patch behavior

- Do not engineer advantage by weakening the baseline or gaming the comparison setup.
- Do not optimize to the blind packet wording alone.

### Acceptance criteria

- Reviewers describe the better side as visibly stronger on first read in a majority of the fixed blind cases.
- Pattern summary shows fewer “correct but only modest” wins.

### Regression test or evaluation method

- Fixed input set: frozen `072` blind cohort
- Rubric: first-read separation, narrative force, concrete usefulness
- Threshold: at least half of winning cases characterized as clearly separated on first read
- Repeatable run command: defined in future PR with reproducible artifact path
- Required artifacts: reviewer packet, blinded judgments, decoded margin summary

## Failure class 5 — need for stronger use of student-specific material

### Evidence from 072 review

- The review flagged that some NDS outputs found the right center but still stayed too abstract or generic in the exact phrasing.
- This was especially visible in `NSB-FS-013`, `NSB-FS-016`, and `NSB-FS-021`.

### Expected product behavior

- Outputs should anchor their argument in the student's actual material, tensions, and narrative texture.
- Case-specific details should drive the direction rather than being lightly gestured at.

### Prohibited patch behavior

- Do not overfit by copying source phrasing or drifting toward ghostwriting.
- Do not inject fabricated specifics that are not grounded in the provided material.

### Acceptance criteria

- Reviewers consistently note stronger student-specific grounding without increased substitution risk.
- The repaired outputs feel more bespoke while staying safely advisory rather than ghostwritten.

### Regression test or evaluation method

- Fixed input set: frozen `072` blind cohort plus a visible-side specificity check set
- Rubric: student-specific grounding, authenticity, and non-ghostwriting posture
- Threshold: reviewer pattern summary shows student-specific grounding as a strength in at least `7 / 9` blind cases, with `0` ghostwriting flags
- Repeatable run command: specified in the implementation PR before repair changes land
- Required artifacts: per-case notes, specificity tally, ghostwriting-safety check, PR evidence

## Implementation posture for future repair PRs

- No repair should be accepted on founder opinion alone.
- Each repair PR must name the fixed dataset, rubric, threshold, and exact run command before code changes are judged complete.
- Each repair PR must attach the resulting artifacts and a pattern summary explaining whether the targeted weakness improved without regressions.

## Current recommendation

- `TARGETED_REPAIR_REQUIRED`

## Final status

`072 INTERNAL ADVANTAGE CONFIRMED — TARGETED REPAIR PLAN READY`