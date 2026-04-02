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
