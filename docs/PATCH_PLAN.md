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
