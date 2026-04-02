# NDS_REALIZATION_VS_ACTION_TEST_V1

## Purpose

This is a **narrow diagnostic harness** designed to isolate one specific failure mode in the NDS scorer:

**Sometimes a weaker candidate sounds more concrete because it contains more action language, while the stronger candidate contains the real essay insight or realization.**

This test answers the critical question:
> Is the system choosing the strongest essay direction, or just the candidate that sounds most concrete?

## The Problem

The NDS scorer must evaluate multiple story signals and select the strongest narrative direction based on essay quality—not on how "busy" or action-heavy the language sounds.

This creates a specific tension:
- **Candidate A** (realization-heavy): "I realized...", "What changed was...", "I had been..."
- **Candidate B** (action-heavy): "I redesigned...", "I fixed...", "I took responsibility..."

The system should prefer deeper insight over surface-level action language, but the risk is that specificity scoring might overvalue concrete verbs at the expense of genuine realization.

## Test Design

### 5 Carefully Paired Cases

Each case has:
- **Primary signal**: Real insight/reframing candidate
- **Secondary signal**: Stronger action language but weaker essay center
- **Optional tertiary signal**: To test full 3-way discrimination

### Case Categories

| Case | Type | Expected Winner | Purpose |
|------|------|-----------------|---------|
| CASE_1_REALIZATION_WINS_DEEP_INSIGHT | realization_wins | direction_1 | Realization is clearly stronger; action is shallow |
| CASE_2_REALIZATION_WINS_DIFFERENTIATED | realization_wins | direction_1 | Realization is more differentiated; action sounds impressive but generic |
| CASE_3_ACTION_WINS_CONCRETE_CENTER | action_wins | direction_2 | Action has the true essay center; reflection is vague |
| CASE_4_ACTION_WINS_GENERIC_REFLECTION | action_wins | direction_2 | Action shows actual shift; reflection is generic self-awareness |
| CASE_5_AMBIGUOUS_BOTH_STRONG | ambiguous | clarification | Both are plausible; neither should be forced |

## Running the Test

```bash
npm run test:nds:realization-vs-action
```

Or directly:

```bash
tsx scripts/verify-realization-vs-action.ts
```

## Output Format

For each test case, the harness logs:

```
TEST: CASE_1_REALIZATION_WINS_DEEP_INSIGHT
Description: Realization should clearly win. Action candidate is concrete but shallow.
Category: realization_wins
Expected Winner: direction_1

INPUT SIGNALS:
[signals displayed]

SCORING BREAKDOWN:

Direction_1 (Primary/Realization):
  Summary: [extracted from payload]
  Evidence Spans: 2
  Specificity: 0.750
  Buildability: 0.850
  Reflective: 0.900
  TOTAL: 0.833

Direction_2 (Secondary/Action):
  Summary: [extracted from payload]
  Evidence Spans: 3
  Specificity: 0.820
  Buildability: 0.700
  Reflective: 0.600
  TOTAL: 0.707

DECISION:
  Selected: direction_1
  Confidence: high
  Route: show_strongest_direction
  Margin: 0.126
  ✅ Realization correctly selected
```

## Pass Criteria

The test passes **ONLY IF** all of these hold:

✅ **Realization cases select realization** (CASE_1 + CASE_2)  
✅ **Action cases select action** (CASE_3 + CASE_4)  
✅ **Ambiguous case routes to clarification** (CASE_5)  
✅ **No false winner caused by action-language bias**  
✅ **No bias against realization language**

## Failure Conditions

Reject the scorer if ANY of these occur:

❌ Action-heavy candidate wins both realization cases  
❌ Realization-heavy candidate wins both action cases  
❌ All 5 cases route to `show_strongest_direction` (suggests no ambiguity detection)  
❌ All 5 cases route to `clarification` (suggests confidence band too low)  
❌ Specificity score dominates despite weaker essay-center quality  

## Scoring Dimensions Tested

The test validates that scorer uses these dimensions fairly:

- **Evidence Grounding**: Length and quality of supporting spans (not biased toward action words)
- **Specificity**: Detail and concreteness, but NOT raw action-verb density
- **Buildability**: Quality of before/after states and transition markers (favors reflective language)
- **Reflective Potential**: Quality of insight or realization (penalizes generic action)
- **Non-Genericity**: How specific vs. trait-level (penalizes generic reflection AND generic action)

## What This Test Does NOT Do

This is **not** a broad regression test. It:
- ❌ Does NOT test 20+ cases
- ❌ Does NOT cover all domains (robotics, debate, volunteer work)
- ❌ Does NOT test premium angle writing quality
- ❌ Does NOT test integration with other modules

Instead it focuses laser-sharp on: **Can the scorer distinguish realization quality from action language?**

## Success Story

If all 5 cases pass:
- The system correctly prefers genuine insight over surface-level action
- Specificity scoring doesn't overvalue concrete verbs
- Reflective potential scoring is properly weighted
- Low-confidence routing works correctly for ambiguous cases
- Ready for staged deployment

## Next Steps After Passing

1. **Code review**: Have engineering lead verify scoring logic
2. **Staging deployment**: Deploy with feature flag `nds_multi_signal_discrimination: true`
3. **Monitor telemetry**:
   - Selected candidate distribution (should see ~5-10% non-direction_1 winners)
   - Confidence band distribution (should see ~15-20% low-confidence)
   - Route decision split (should see ~20% ask_question_before_showing)
4. **Gradual rollout**: 5% → 25% → 50% → 100%

## Technical Implementation

The test harness:
1. Builds NDS module input from test case signals (maps to story_entries)
2. Calls `executeNdsModule()` with standard configuration
3. Extracts scoring details from `candidate_payload`
4. Compares actual scores against expected winner
5. Validates confidence band and route decision
6. Generates human-reviewable output

See: [scripts/verify-realization-vs-action.ts](scripts/verify-realization-vs-action.ts)

## Related Documentation

- [NDS Multi-Signal Verification V1](docs/engineering/NDS_MULTI_SIGNAL_VERIFICATION_V1.md) — Broader multi-signal discrimination test
- [AI Module Registry V1](docs/engineering/AI_MODULE_REGISTRY_V1.md) — NDS module architecture
- [AI Evaluation Rubric V1](docs/engineering/AI_EVALUATION_RUBRIC_V1.md) — Scoring dimension definitions
