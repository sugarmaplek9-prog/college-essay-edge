# NDS_FAILURE_TAXONOMY_V1

## Purpose
Provides a stable language for classifying misses so engineering fixes the real bottleneck.

## Top-level failure classes
1. **Candidate Generation Failure**
   Better direction was not surfaced at all.
2. **Judgment Selection Failure**
   Strong candidate existed but wrong one was chosen.
3. **Clarification Failure**
   System should have asked for more context but did not, or asked when unnecessary.
4. **Routing Failure**
   Wrong macro action type selected.
5. **Trust-Risk Failure**
   Sensitive topic handled with poor caution or poor reframing.
6. **Explanation Failure**
   Final rationale was vague, generic, or strategically weak.
7. **Supplement Scope Failure**
   Personal statement logic applied to supplement, or vice versa.
8. **Overweighting Respectability**
   Picked polished/expected topic over more revealing distinctive topic.
9. **Overweighting Emotionality**
   Picked sad topic because it felt weighty, not because it was strategically best.
10. **Identity Reduction**
    Reduced applicant to diagnosis, identity label, or family hardship.

## Root-cause note
Most world-class improvement comes from separating candidate generation from selection. Do not treat all misses as a single “model quality” problem.

## Logging format
For every miss, log:
- `failure_class_primary`
- `failure_class_secondary`
- `root_cause_hypothesis`
- `recommended_fix_owner`
- `fix_priority`
- `did_explanation_make_it_worse`
