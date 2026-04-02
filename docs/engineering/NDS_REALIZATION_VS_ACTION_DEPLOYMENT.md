# NDS Narrow Diagnostic Test — Summary

## What You Now Have

**Test Name:** `NDS_REALIZATION_VS_ACTION_TEST_V1`

**Location:** 
- Implementation: [scripts/verify-realization-vs-action.ts](../../../scripts/verify-realization-vs-action.ts)
- Documentation: [docs/engineering/NDS_REALIZATION_VS_ACTION_TEST_V1.md](NDS_REALIZATION_VS_ACTION_TEST_V1.md)

**Run Command:**
```bash
npm run test:nds:realization-vs-action
```

## Purpose

Isolate one specific unresolved risk:

> **Does the scorer prefer candidates with genuine realization/essay-center quality, or does it just pick the candidate that sounds most concrete?**

This is much sharper than another broad 20-case sweep because it directly tests the exact failure mode you were seeing in FLIP2/FLIP3.

## Test Design

**5 carefully paired cases:**

| # | Type | Signals | Expected | Purpose |
|---|------|---------|----------|---------|
| 1 | realization_wins | Primary: deep insight<br/>Secondary: concrete but shallow | direction_1 | Realization clearly wins |
| 2 | realization_wins | Primary: differentiated insight<br/>Secondary: impressive but generic | direction_1 | Realization wins over action buzz |
| 3 | action_wins | Primary: vague reflection<br/>Secondary: concrete center | direction_2 | Action wins when it has true center |
| 4 | action_wins | Primary: generic self-awareness<br/>Secondary: shows actual shift | direction_2 | Action wins over vapid reflection |
| 5 | ambiguous | Primary: both dimensions present equally<br/>Secondary: both dimensions present equally | clarification | Routing to ambiguity handling |

## Pass Criteria (All Must Be True)

✅ CASE_1 (realization): direction_1 wins  
✅ CASE_2 (realization): direction_1 wins  
✅ CASE_3 (action): direction_2 wins  
✅ CASE_4 (action): direction_2 wins  
✅ CASE_5 (ambiguous): routes to clarification (low confidence)  

**Plus:**
- No candidate wins ONLY because it used more concrete verbs
- No candidate loses ONLY because its reflection language was less action-heavy
- Confidence bands correctly detect ambiguity

## Example Output

```
TEST: CASE_1_REALIZATION_WINS_DEEP_INSIGHT
Description: Realization should clearly win. Action candidate is concrete but shallow.

SCORING BREAKDOWN:

Direction_1 (Realization):
  Specificity: 0.750
  Buildability: 0.850
  Reflective: 0.900
  TOTAL: 0.833

Direction_2 (Action):
  Specificity: 0.820  ← higher but still loses
  Buildability: 0.700
  Reflective: 0.600
  TOTAL: 0.707

DECISION:
  Selected: direction_1
  Confidence: high
  Margin: 0.126
  ✅ Realization correctly selected
```

## Failure Modes to Watch

If the test fails, it will tell you exactly what's wrong:

| Failure | Meaning | Fix |
|---------|---------|-----|
| Action wins both realization cases | Specificity overvalues action verbs | Reduce specificity weight or recalibrate |
| Realization wins both action cases | Buildability bonus too strong | Adjust transition marker bonus |
| All 5 route to strongest_direction | No ambiguity detection | Confidence band threshold too high |
| All 5 route to clarification | Confidence band threshold too low | Adjust margin calculation |

## Integration with Broader Testing

This test is **complementary** to the existing 240-test suite:

- **Existing suite**: Validates module integration, domain angles, premium writing
- **This test**: Validates the specific scoring discrimination problem

**If this narrow test fails**, the module isn't ready.  
**If this test passes but broader tests fail**, there's an integration issue to debug.

## Next Steps

1. **Run the test:**
   ```bash
   npm run test:nds:realization-vs-action
   ```

2. **Review output:**
   - Check each case's DECISION section
   - Verify all cases show expected winners
   - Look for score margins and confidence bands

3. **If all cases pass:**
   - ✅ Ready for staging deployment
   - Add this to pre-release checklist
   - Enable feature flag `nds_multi_signal_discrimination`

4. **If any case fails:**
   - Review the failure analysis at bottom of output
   - Check specific dimension scores (specificity vs buildability vs reflective)
   - May need to adjust weights or recalibrate transition markers

## Technical Notes

- **Uses:** Real NDS module execution (not mocked scorer)
- **Signals:** Maps to story_entries in NdsResolvedSources
- **Output:** Extracts direction_scores and confidence from candidate_payload
- **Validation:** Compares against expected winners and routes

## Files Modified

- ✅ [scripts/verify-realization-vs-action.ts](../../../scripts/verify-realization-vs-action.ts) — Test implementation
- ✅ [docs/engineering/NDS_REALIZATION_VS_ACTION_TEST_V1.md](NDS_REALIZATION_VS_ACTION_TEST_V1.md) — Test documentation
- ✅ [package.json](../../../package.json) — Added npm script `test:nds:realization-vs-action`

## Verification Checklist

Before running:
- [ ] All 240 existing tests passing
- [ ] TypeScript compilation clean
- [ ] NDS module working (prior tests passing)

After running:
- [ ] Review each case's output
- [ ] Verify confidence bands make sense
- [ ] Check score margins (should be > 0.10 for high confidence)
- [ ] Confirm no bias against either realization or action language
