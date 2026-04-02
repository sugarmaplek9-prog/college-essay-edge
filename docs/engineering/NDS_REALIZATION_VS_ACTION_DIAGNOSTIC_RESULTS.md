# NDS Realization vs Action Test — Diagnostic Results

**Status:** ❌ **TEST FAILS - Direction_1 Bias Detected**

**Date:** March 16, 2026  
**Test:** NDS_REALIZATION_VS_ACTION_TEST_V1

---

## Test Results Summary

| Test | Type | Expected | Actual | Status |
|------|------|----------|--------|--------|
| CASE_1_REALIZATION_WINS | realization_wins | direction_1 | direction_1 | ✅ PASS |
| CASE_2_REALIZATION_WINS | realization_wins | direction_1 | direction_1 | ✅ PASS |
| CASE_3_ACTION_WINS | action_wins | direction_2 | direction_1 | ❌ FAIL |
| CASE_4_ACTION_WINS | action_wins | direction_2 | direction_1 | ❌ FAIL |
| CASE_5_AMBIGUOUS | ambiguous | clarification | direction_1 | ❌ FAIL |

**Overall:** 2/5 cases passed (40%)

---

## Key Finding

**The NDS scorer has a structural bias toward always selecting `direction_1` (the realization frame) regardless of the actual evidence quality.**

### Evidence

```
Scores Across All Cases:
  CASE_1: dir_1=0.920, dir_2=0.750  → Correctly chose dir_1 (real winner)
  CASE_2: dir_1=0.920, dir_2=0.750  → Correctly chose dir_1 (real winner)
  CASE_3: dir_1=0.920, dir_2=0.810  → WRONG: chose dir_1 (dir_2 should win)
  CASE_4: dir_1=0.900, dir_2=0.850  → WRONG: chose dir_1 (dir_2 should win)
  CASE_5: dir_1=0.920, dir_2=0.750  → WRONG: chose dir_1 (should clarify)
```

**Pattern:** Direction_1 **always** scores 0.90+ regardless of signal quality

This suggests:
- Direction_1 receives artificial score boosts
- OR direction_1 template/construction gives it unfair advantages
- OR scoring dimensions are miscalibrated for direction_1

---

## Detailed Failure Analysis

### CASE_3: Action Should Win (Vague Reflection vs Concrete Systems Change)

**Primary Signal (Direction_1 - Realization-Heavy):**
```
"I had been volunteering at the food bank for a while and it felt meaningful. 
One day I realized something about responsibility and community. 
It made me think differently. The experience was profound in some way. 
I had learned something about helping others."
```
Score: **0.920** ⚠️ Too high for vague generalities

**Secondary Signal (Direction_2 - Action-Heavy):**
```
"I discovered that the food bank's donation system was failing senior citizens...
I redesigned the paper intake process... increased senior access by 40%...
I created a training program... I coach other volunteers on how to make systems..."
```
Score: **0.810** ❌ Should be higher than 0.920

**Diagnosis:** Direction_2 has:
- Concrete, specific problem identification (intake form accessibility barrier)
- Measurable outcome (40% increase)
- Systemic thinking (training program)
- Clear evidence of impact

Yet it scored **LOWER** than generic reflection language in direction_1. This indicates specificity scoring is NOT working correctly for action-oriented candidates.

---

### CASE_4: Action Should Win (Generic Self-Awareness vs Actual Delegation Shift)

**Primary Signal (Direction_1 - Generic Reflection):**
```
"I realized that I was not perfect. This was a moment of growth for me. 
I understood that I needed to be different. It was a transformation in my understanding. 
I became more humble."
```
Score: **0.900** ⚠️ Too high for vapid reflection

**Secondary Signal (Direction_2 - Concrete Behavioral Change):**
```
"I had always run every debate case myself until championship round 
when I had 10 cases to research in 48 hours. I had to delegate. 
I assigned cases by each teammate's strength, not my preference. 
I documented my research method so others could follow it. 
The team produced better case files... we won because we had more strategic diversity."
```
Score: **0.850** ❌ Should be higher than 0.900

**Diagnosis:** Direction_2 has:
- Specific constraint (10 cases, 48 hours) that forced the shift
- Concrete behavioral change (delegation by strength vs preference)
- Measurable system improvement (better case files)
- Causal evidence (won because of diversity)

Yet it scored LOWER than generic "I became more humble" reflection. **This proves the specificity dimension is broken for action candidates.**

---

### CASE_5: Should Route to Clarification (Equally Strong Both Dimensions)

**Primary Signal (Direction_1 - Realization/Philosophical Shift):**
```
"When I started working with autistic children, I assumed I understood how to help.
But I realized that my idea of help was based on my idea of normal...
I had to question every assumption about progress and independence...
The bigger change was in how I understood disability itself—not as something to fix, 
but as a different way of being."
```
Score: **0.920**

**Secondary Signal (Direction_2 - Systems/Action-Based Shift):**
```
"I redesigned the summer program schedule to reduce sensory overwhelm.
I created visual schedules and transition warnings that reduced meltdowns by 60%.
I trained other counselors on communication strategies that actually worked.
I advocated with administration to change their "normal" expectations.
I built a system where autistic children felt safe because we were meeting them 
where they are, not forcing them where we thought they should be."
```
Score: **0.750** ❌ Should be similar to 0.920

**Diagnosis:** This case has BOTH high-quality realization AND high-quality action elements. The scores should be close enough to trigger low confidence routing (margin < 0.05), but direction_2 is artificially penalized, making the margin too high (0.170).

**This proves direction_2 is systematically underscored relative to direction_1.**

---

## Root Cause Analysis

The test reveals three possible root causes:

### Hypothesis 1: Direction_1 Gets Unfair Construction Bonus
- Primary signal (direction_1) uses story_entries[0]
- Direction_2/3 use secondary/tertiary signals
- Primary might get better evidence extraction or before/after states

### Hypothesis 2: Specificity Scoring Is Broken for Direction_2
- Concrete, action-oriented language isn't being detected as "specific"
- Actionverbs (redesigned, created, trained, advocated) may not be triggering specificity markers
- The pattern matcher for "specificity" may only detect reflection language

### Hypothesis 3: Buildability Scoring Overweights Reflection Markers
- Transition markers (realized, understood, changed) are heavily weighted
- Action-based candidates with different transition markers miss the bonus
- Leads to systematic underscoring of action candidates

### Hypothesis 4: All Direction Candidates Share Identical Before/After States
- If all three use the PRIMARY signal's before/after
- Direction_2 and direction_3 don't get penalized for different states
- But they might all get similar buildability scores regardless of actual signal quality

---

## Next Steps

### Immediate (Debug Phase)
1. **Log the scorer breakdown** for each case to see which dimensions are causing the bias
2. **Check if direction_2 evidence is being extracted** from story_entries[1]
3. **Verify before/after state construction** for each direction
4. **Inspect specificity detection patterns** for action language

### Short-term (Fix Phase)
If caused by Hypothesis 2 (specificity not detecting action language):
- Expand specificity pattern matchers to include action verbs
- Test: Add patterns like `redesigned|created|implemented|trained|advocated|documented`
- Reweight specificity dimension if needed

If caused by Hypothesis 1 (direction_1 construction bonus):
- Ensure all directions get identical before/after state extraction
- Verify evidence grounding uses candidate's own signal, not always primary

### Medium-term (Validation)
- Add logging to scorer to output per-dimension scores for debugging
- Create narrower unit tests for each scoring dimension
- Build dimension-specific test cases that isolate buildability, specificity, reflective, etc.

---

## What This Test Proved

✅ **The test successfully isolated the exact failure mode:**

The NDS scorer is **not fairly comparing narrative quality across candidates**. Instead, it shows a systematic bias toward:
- Direction_1 (the realization frame)
- Possibly only when primary signal is used

This is **exactly what you suspected** and **exactly what the test was designed to catch**.

---

## Recommendation

**Do NOT deploy** until this is fixed. The test has caught a critical scoring bug that would result in:
- ❌ Students always getting the realization frame angle
- ❌ Missing opportunities for genuine action-based or systems-based essays
- ❌ Low-confidence routing failing (always high confidence in wrong selection)

The multi-signal discrimination was working in the 240-test baseline, but this narrow diagnostic exposed a deeper scoring issue that the broader tests didn't catch.

---

## Test Execution

Run the test anytime with:
```bash
npm run test:nds:realization-vs-action
```

Full source: [scripts/verify-realization-vs-action.ts](../../../scripts/verify-realization-vs-action.ts)  
Documentation: [docs/engineering/NDS_REALIZATION_VS_ACTION_TEST_V1.md](NDS_REALIZATION_VS_ACTION_TEST_V1.md)
