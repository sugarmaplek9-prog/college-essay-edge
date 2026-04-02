# Result-Audit Runbook (Execution)

## Scope
This package is for result-audit mode only.
- No Sprint 3 work.
- No launch claims from this run.

## Artifacts in this folder
- `BLIND_REVIEW_SCORECARD_TEMPLATE.md`
- `blind_review_10.case_ids.json`
- `blind_review_10.packet.md`
- `blind_review_10.decode.json`
- `nmi_calibration_audit_table.csv`
- `NMI_CALIBRATION_AUDIT_GUIDE.md`
- `HEAD_OF_ENGINEERING_DIRECTIVE.txt`

## Blind review execution steps
1. Assign minimum 2 independent reviewers (preferred 3).
2. Distribute only:
   - `blind_review_10.packet.md`
   - `BLIND_REVIEW_SCORECARD_TEMPLATE.md`
3. Reviewers score independently with no discussion until all scorecards are complete.
4. Collect completed scorecards.
5. Decode A/B using `blind_review_10.decode.json` after scoring lock.
6. Aggregate results:
   - clear wins, slight wins, ties, baseline wins, both weak
   - trust/genericity/willingness-to-pay majorities

## Blind-review acceptance thresholds
### Strong acceptance signal
- NDS clearly/slightly wins >= 7/10
- NDS wins >= 2/3 strong
- NDS wins >= 2/3 medium
- NDS does not lose majority of weak/red-team

### Caution signal
- NDS wins 5 or 6 of 10
- frequent "both weak"
- wins mostly by caution, not usefulness

### Failure signal
- NDS wins <= 4/10
- baseline wins weak-input honesty
- baseline wins premium feel/usefulness
- reviewers say outputs are too similar

## NMI calibration execution steps
1. Assign reviewers to complete all rows in `nmi_calibration_audit_table.csv`.
2. Apply decision rules in `NMI_CALIBRATION_AUDIT_GUIDE.md`.
3. Produce required summaries:
   - NMI by difficulty
   - NMI correctness counts
   - primary-cause breakdown
   - user-helpfulness breakdown
4. Map top causes to remediation layer (readiness, validator, prompt, context assembly).

## Combined final judgment labels
- Clearly sharper than baseline
- Promising but not yet strong enough
- Too conservative / under-calibrated
- Not yet better than baseline
