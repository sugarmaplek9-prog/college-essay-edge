# NDS Realization vs Action Test — Deployment Status

## Summary

You now have a **narrow, focused diagnostic test** that reveals a **critical scoring bug** in the NDS module.

### Status: ❌ BLOCKING ISSUE DETECTED

- ✅ Test harness created and running
- ✅ Test infrastructure working
- ✅ Diagnostic successfully isolates failure mode
- ❌ **NDS scorer fails 3 out of 5 test cases**
- ❌ **Direction_1 bias prevents fair multi-signal selection**

---

## What Was Built

### Test Harness
- **File:** [scripts/verify-realization-vs-action.ts](../../../scripts/verify-realization-vs-action.ts)
- **Run:** `npm run test:nds:realization-vs-action`
- **Type:** Narrow diagnostic (5 paired cases, not broad sweep)

### Test Cases
| # | Category | Expected Winner | Result |
|---|----------|-----------------|--------|
| 1 | Realization vs Action | direction_1 | ✅ Correct |
| 2 | Differentiated vs Impressive | direction_1 | ✅ Correct |
| 3 | Vague Reflection vs Concrete Systems | direction_2 | ❌ Wrong |
| 4 | Generic vs Behavioral Change | direction_2 | ❌ Wrong |
| 5 | Both Strong | clarification | ❌ Wrong |

### Documentation
- [NDS_REALIZATION_VS_ACTION_TEST_V1.md](NDS_REALIZATION_VS_ACTION_TEST_V1.md) — Test design & purpose
- [NDS_REALIZATION_VS_ACTION_DIAGNOSTIC_RESULTS.md](NDS_REALIZATION_VS_ACTION_DIAGNOSTIC_RESULTS.md) — Detailed failure analysis

---

## Critical Finding

**The NDS scorer has a structural bias: it always scores `direction_1` ≥ 0.90, regardless of signal quality.**

### Evidence
```
CASE_3 (Action should win):
  dir_1 (vague): 0.920 ✓ High confidence in wrong choice
  dir_2 (concrete): 0.810 ✗ Penalized for action language

CASE_4 (Action should win):
  dir_1 (generic): 0.900 ✓ High confidence in wrong choice  
  dir_2 (behavioral): 0.850 ✗ Penalized for action language

CASE_5 (Should clarify):
  dir_1 (realization): 0.920 ✓ Forced high-confidence decision
  dir_2 (systems): 0.750 ✗ Artificially low score
```

---

## Root Causes (Ordered by Likelihood)

### 1. Specificity Scoring Broken for Action Language
**Probability:** HIGH  
**Symptom:** Direction_2 scores 0.81-0.85 even with concrete achievements  
**Evidence:** Action candidates consistently underscored vs reflective

**Fix:** Check if specificity pattern matcher includes action verbs like:
- redesigned, created, implemented, trained, advocated, documented, coach, built

### 2. Direction_1 Gets Artificial Construction Bonus
**Probability:** MEDIUM  
**Symptom:** All direction_1 scores ≥ 0.90 across all cases  
**Evidence:** Unnaturally consistent high scores

**Fix:** Verify that direction_2/3 extract evidence from their own signal, not always primary

### 3. Buildability Overweights Reflection Markers
**Probability:** MEDIUM  
**Symptom:** Generic "realized" language gets 0.90 in CASE_4  
**Evidence:** Reflection transition markers boosting score too much

**Fix:** Check buildability weight and transition marker bonus calculation

---

## What To Do Now

### ⚠️ DO NOT DEPLOY
This test blocks deployment because:
- Multi-signal discrimination is broken
- Always selects direction_1 = useless recommendation system
- Clarification routing failing (always high confidence)

### Debug Phase (1-2 hours)
1. Run test and review failure patterns
2. Add detailed logging to scorer showing per-dimension breakdown
3. Check evidence extraction for direction_2 (using story_entries[1]?)
4. Verify specificity patterns for action language

### Fix Phase (2-4 hours)
- Likely: Add action verbs to specificity pattern matcher
- Possibly: Adjust dimension weights
- Verify before/after state construction
- Test the 5 cases again

### Validation Phase (1 hour)
- Rerun diagnostic test (all 5 cases should pass)
- Verify existing 240 tests still pass
- Check no regressions in premium angle writing

---

## Running the Test

### Quick Start
```bash
npm run test:nds:realization-vs-action
```

### Expected Output (When Passing)
```
✓ Realization cases select realization: ✅ PASS
✓ Action cases select action: ✅ PASS
✓ Ambiguous case routes to clarification: ✅ PASS

OVERALL: ✅ TEST PASSES
```

### Current Output (Failing)
```
✓ Realization cases select realization: ✅ PASS
✓ Action cases select action: ❌ FAIL  ← Direction_1 bias
✓ Ambiguous case routes to clarification: ❌ FAIL  ← Forced high confidence

OVERALL: ❌ TEST FAILS
```

---

## Related Documentation

- [NDS Multi-Signal Verification V1](NDS_MULTI_SIGNAL_VERIFICATION_V1.md) — Broader discrimination test (all 240 pass)
- [NDS Realization vs Action Test Design](NDS_REALIZATION_VS_ACTION_TEST_V1.md) — Full test documentation
- [NDS Realization vs Action Diagnostic Results](NDS_REALIZATION_VS_ACTION_DIAGNOSTIC_RESULTS.md) — Detailed failure analysis

---

## Technical Details

### Test Architecture
- Uses actual `executeNdsModule()`, not mocked scorer
- Maps test signals to NdsResolvedSources.story_entries
- Extracts scores from payload.candidates array
- Validates confidence band and route decisions

### Scoring Validation
- Compares total_score across candidates
- Calculates margin (difference between 1st and 2nd place)
- Routes to clarification if margin < 0.05

### Test Cases Rationale
- **CASE_1 & CASE_2:** Establish that realization CAN win (sanity check)
- **CASE_3 & CASE_4:** Test if action EVER wins (failure mode)
- **CASE_5:** Test if ambiguity triggers clarification (routing test)

---

## Timeline Impact

**Before Fix:**
- ❌ Cannot deploy multi-signal discrimination
- ❌ Feature flag stays OFF
- ❌ All students get primary signal only

**After Fix:**
- ✅ Deploy with confidence
- ✅ Enable feature flag gradually (5% → 25% → 50% → 100%)
- ✅ Multi-signal recommendation working correctly
- ✅ Low-confidence clarification routing working

**Estimated Debug+Fix Time:** 3-6 hours  
**Estimated Validation Time:** 1-2 hours

---

## Questions For Engineering

1. **Why is direction_1 always scoring 0.90+?** Is there an artificial boost?
2. **Is direction_2 evidence being extracted from story_entries[1]?** Or always from primary?
3. **What does the specificity pattern matcher look like?** Does it include action verbs?
4. **How is buildability bonus calculated?** What's the transition marker weight?
5. **Should we add logging to scorer to output dimension-level scores?**

---

## Success Criteria (To Know Fix Worked)

When you rerun the test:

```bash
npm run test:nds:realization-vs-action
```

You should see:
```
SUMMARY: 5/5 cases passed ← All cases pass

✓ Realization cases select realization: ✅ PASS
✓ Action cases select action: ✅ PASS
✓ Ambiguous case routes to clarification: ✅ PASS

OVERALL: ✅ TEST PASSES
```

And this must hold:
- ✅ CASE_3 direction_2 > direction_1
- ✅ CASE_4 direction_2 > direction_1  
- ✅ CASE_5 margin < 0.05 (triggers clarification)

---

## Final Note

This is exactly the diagnostic test you requested. It:
- ✅ Isolates the specific unresolved risk
- ✅ Avoids broad 20-case sweeps
- ✅ Catches the direction_1 bias failure mode
- ✅ Provides clear pass/fail criteria
- ✅ Blocks deployment until fixed

**Use it to fix the scorer. Then you're production-ready.**
