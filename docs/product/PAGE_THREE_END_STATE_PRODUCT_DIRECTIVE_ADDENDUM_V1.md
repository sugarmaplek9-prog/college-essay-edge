# Addendum to PAGE_THREE_END_STATE_PRODUCT_DIRECTIVE_V1

This addendum does not replace the existing directive.
The existing directive remains the locked definition of the page 3 product target.

This addendum clarifies execution of the next-step loop so progress continues without repeated back-and-forth.

## Purpose

The following steps are directionally correct and now mandatory as a closed loop:

- deploy to production
- run fresh holdout evaluation
- verify system gates still pass
- run human blind review as a decision gate

These are not pause points for new interpretation.

## Closed Execution Rule (after each runtime-level improvement)

1. **Deploy the current runtime change**
   - Push the current build when ready for real packet generation and comparison.
   - Do not stop at “ready to push.”

2. **Run a fresh runtime-generated holdout evaluation**
   - Use a fresh packet generated from the actual runtime path.
   - Do not rely on stale packets.
   - Do not use packet-side rescue.

3. **Verify locked system gates still pass**
   - Includes pool health, survivor floor, repetition controls, and all locked runtime/system validity requirements.
   - Product improvement does not count if system validity is broken.

4. **Run human blind review on the fresh packet**
   - Required on the fresh packet produced by the current runtime.
   - Not passive monitoring.

5. **Use blind review as product-match check against the locked end state**
   - recommendation is clear in one read
   - essay_about adds real meaning
   - why_this_direction explains why this angle wins
   - weaker/stronger is usable and not evaluator-speak
   - next action is concrete
   - overall result sounds like a sharp coach, not an AI taxonomy engine

6. **Make a decision and continue immediately**
   - If targeted failure class improved and gates remain green: continue directly to next runtime-level fix.
   - If targeted failure class did not improve: call it a miss and move to next runtime-level fix.
   - Do not stop to ask permission to continue.

## Clarification replacing “monitor human blind review”

Human blind review is a **decision gate**, not passive observation.

It must answer:

- did output move closer to locked page 3 end state
- did targeted failure class improve
- is product still trailing or still identifiable as templated/weaker side

It is **not**:

- general observation
- open-ended discussion
- waiting period before asking for more direction

## Success Criteria (both required)

1. **System validity remains intact**
   - runtime path valid
   - packet provenance valid
   - locked gates green

2. **Blind review shows product-state improvement**
   - targeted output failure visibly improved
   - result better matches locked page 3 coaching experience

## Required Iteration Report Format

After each iteration, report only:

- change made
- locked failure class targeted
- fresh packet evidence
- fresh tally
- gate status
- next runtime action

Do not report open-ended updates such as:

- ready to push
- monitoring
- thoughts
- should we continue
- we think this helped

## Escalation Rule

Only stop and escalate if there is evidence current runtime architecture cannot reach the locked page 3 end state.

Required evidence:

- repeated survival of same failure class across multiple clean runtime iterations
- fresh packet evidence that failure remains
- system gates still green
- clear reason current generation path is blocker

Until that evidence exists, continue iterating.

## Final Instruction

The existing Page Three End State Product Directive remains the product target.

This addendum defines the execution contract:

- deploy
- run fresh holdout
- verify system gates
- run blind review as decision gate
- continue immediately based on evidence
- escalate only when architecture evidence justifies it

Do not pause between these steps for additional interpretation.
