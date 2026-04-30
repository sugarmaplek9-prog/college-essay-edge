# 072 Targeted Repair V2 — Pattern Summary

## Scope

- Review type: standardized V2 data review only
- Human review status: not injected in this loop
- Locked target cases: `RHC-026`, `RHC-028`, `RHC-030`, `RHC-001`, `RHC-004`, `RHC-005`
- Locked guardrail cases: `RHC-027`, `RHC-029`, `RHC-002`, `RHC-003`

## Locked rubric reference

This summary uses the five locked V2 categories from `specs/072-real-human-corpus-expansion/targeted-repair-plan-v2.md`:

1. admissions judgment quality
2. recommendation decisiveness
3. stronger-vs-obvious reasoning
4. premium coaching tone
5. student-specific evidence use

The plan defines category-level acceptance as scoring `2` on at least `4 of the 6` prior somewhat-better cases.

## Pattern-level result

The packet clears that threshold in all five categories.

- Admissions judgment quality: `6 / 6` target cases scored `2`
- Recommendation decisiveness: `5 / 6` target cases scored `2`
- Stronger-vs-obvious reasoning: `6 / 6` target cases scored `2`
- Premium coaching tone: `6 / 6` target cases scored `2`
- Student-specific evidence use: `6 / 6` target cases scored `2`

## What improved by class

- Admissions judgment is no longer carried by generic trait language; the packet now consistently frames the winning direction as differentiated applicant value.
- Stronger-vs-obvious reasoning is now explicit instead of soft; the outputs name what the obvious essay would overemphasize and what the stronger version lets the reader see.
- Premium coaching tone is consistently cleaner; the surfaced language avoids internal-mechanical phrasing and reads as direct recommendation language rather than system narration.
- Student-specific evidence use is consistently strong across the packet; every case received a grounding score of `2`, which means the recommendation visibly depends on case material.
- Recommendation decisiveness materially improved and clears the V2 acceptance signal, but it is the only category with remaining partials.

## Remaining weak pattern

Only one target case remains partial on one category:

- `RHC-030`: total `9`, partial only on recommendation decisiveness

Observed pattern:

- The residual weakness is not evidence grounding, contrast quality, admissions framing, or tone.
- The residual weakness is a slight dilution in winner hierarchy under emotionally charged material.
- This is a class-level presentation issue, not a packet-wide regression.

## Guardrail status

Guardrails remain strong overall.

- `RHC-002`, `RHC-027`, `RHC-029`: full `10 / 10`
- `RHC-003`: total `9`, partial only on recommendation decisiveness

Interpretation:

- No guardrail case regressed below the eval-runner pass floor.
- The same residual partial that appears in `RHC-030` also appears in one guardrail case, which reinforces that the remaining issue is a narrow decisiveness presentation pattern rather than a category collapse.

## Packet-level classification signal

- Prior somewhat-better cases now fully clear all five categories in `5 / 6` cases.
- The sixth target case still clears `4 / 5` categories and remains a strong machine win at total `9`.
- The packet classification remains `V2_REPAIR_PASS`.

## Conclusion

The V2 repair shows pattern improvement rather than anecdotal uplift. The dominant residual issue is limited to recommendation decisiveness in one target case and one guardrail case; all other category patterns clear the locked V2 threshold across the target packet.