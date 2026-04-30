# 072 Targeted Repair V2 Task Packet

Date: 2026-04-26

## Status

- Current status: `072 MODEST ADVANTAGE ACCEPTED — TARGETED REPAIR V2 REQUIRED`
- Required branch: `072-targeted-repair-v2-task-packet`
- Governing standard: `targeted-repair-plan-v2.md`
- Governing implementation contract: `targeted-repair-v2-implementation-plan.md`
- Scope of this packet: implementation planning only

## Scope lock

This packet translates the locked V2 standard into ordered engineering work.

It does **not** implement V2.

It does **not** rerun evaluation.

It does **not** modify product code, prior outputs, frozen artifacts, or accepted evaluation artifacts.

It does **not** weaken the V2 standard.

## Core implementation question

Every implementation task in this packet must improve one or more of these five behaviors:

1. admissions judgment quality
2. recommendation decisiveness
3. stronger-vs-obvious reasoning
4. premium coaching tone
5. student-specific evidence use

If a task does not move one or more of those behaviors, it is out of scope for V2.

## Locked evaluation target

V2 is successful only if the future implementation PR proves all of the following:

1. at least `4 of the 6` prior somewhat-better cases become clearly better
2. no prior clearly-better guardrail cases regress
3. no cases become ties
4. no cases become invalid
5. no case-specific hardcoding or frozen-case fingerprinting is introduced

## Locked target cases

### Primary V2 target cases

- `RHC-026`
- `RHC-028`
- `RHC-030`
- `RHC-001`
- `RHC-004`
- `RHC-005`

### Guardrail cases

Use the prior clearly-better cases as the no-regression guardrail packet.

## Target code areas

The implementation work should focus on the class-level NDS surfaces most likely to control judgment quality, decisiveness, contrast reasoning, tone, and evidence grounding.

### Primary runtime surfaces

- `src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts`
- `src/lib/ai/modules/narrative-direction-selection/validator.ts`
- `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`
- `src/lib/ai/modules/narrative-direction-selection/normalize-context.ts`
- `src/lib/ai/worker/execute-run.ts`
- `src/lib/ai/selection-service.ts`

### Direction-to-surface rendering surfaces

- `src/lib/fm/liveSessionDirection.ts`
- `src/lib/representation/pageBuilders/buildRecommendationPage.ts`
- `src/lib/representation/pageBuilders/buildComparisonPage.ts`
- `src/lib/representation/validators.ts`

### Evaluation and artifact surfaces to add or update

- `evaluation/scripts/run-072-targeted-repair-v2.ts`
- `evaluation/scripts/finalize-072-targeted-repair-v2-blind-review.ts` if blind decode is used
- `evaluation_outputs/072-real-human-corpus-expansion/072-targeted-repair-v2/`

## Ordered implementation tasks

### Task 1. Freeze the V2 evaluation packet

#### Goal

Lock the inputs, scoring model, and review flow before any runtime work begins.

#### Categories

- admissions judgment quality
- recommendation decisiveness
- stronger-vs-obvious reasoning
- premium coaching tone
- student-specific evidence use

#### Target files

- `specs/072-real-human-corpus-expansion/targeted-repair-plan-v2.md`
- `specs/072-real-human-corpus-expansion/targeted-repair-v2-implementation-plan.md`
- `specs/072-real-human-corpus-expansion/targeted-repair-v2-task-packet.md`

#### Work

- Write the final fixed packet definition using the six target cases and clearly-better guardrails.
- Lock the five-category `0 / 1 / 2` scoring rubric.
- Lock the final allowed V2 classifications.
- Lock the blind-review decode custody rule if blind comparison is used.

#### Definition of done

- The implementation PR can point to one frozen packet definition and one scoring rubric.
- No implementation ambiguity remains about what counts as pass, partial, failed, or invalid.

---

### Task 2. Map current runtime logic to the five V2 categories

#### Goal

Identify which runtime surfaces are responsible for each V2 behavior.

#### Categories

- all five categories

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts`
- `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`
- `src/lib/ai/modules/narrative-direction-selection/normalize-context.ts`
- `src/lib/ai/modules/narrative-direction-selection/validator.ts`
- `src/lib/ai/worker/execute-run.ts`
- `src/lib/ai/selection-service.ts`

#### Work

- Document where admissions-judgment language is formed.
- Document where strongest-direction ranking is formed.
- Document where stronger-vs-obvious contrast is generated.
- Document where tone constraints are enforced or missed.
- Document where student-specific evidence is selected or dropped.

#### Definition of done

- Every planned code change can be traced to one or more concrete runtime surfaces.
- No task depends on vague “make it better” reasoning.

---

### Task 3. Admissions judgment upgrade

#### Goal

Upgrade the system so it explains why the recommended direction matters to an admissions reader, not just why the story is personally meaningful.

#### Categories

- admissions judgment quality
- student-specific evidence use

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts`
- `src/lib/ai/modules/narrative-direction-selection/normalize-context.ts`
- `src/lib/ai/modules/narrative-direction-selection/validator.ts`

#### Work

- Strengthen the internal output contract so the best-direction explanation must name an applicant signal or admissions-relevant pattern.
- Reduce generic trait-label escape hatches such as growth / resilience / passion without admissions reasoning.
- Ensure the reasoning connects the student’s material to differentiated applicant value.

#### Test files to create or update

- Create `src/__tests__/ai/nds-targeted-repair-v2-admissions-judgment.test.ts`
- Update `src/__tests__/ai/nds-072-targeted-output-repair.test.ts`
- Update `src/__tests__/ai/selection.test.ts`

#### Definition of done

- The runtime cannot pass with topic-summary-only judgments.
- Tests fail when outputs rely on generic applicant-trait language without admissions relevance.

---

### Task 4. Recommendation decisiveness upgrade

#### Goal

Make the system recommend one best direction with clear hierarchy instead of behaving like a brainstormer.

#### Categories

- recommendation decisiveness
- admissions judgment quality

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts`
- `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`
- `src/lib/ai/selection-service.ts`
- `src/lib/fm/liveSessionDirection.ts`
- `src/lib/representation/pageBuilders/buildRecommendationPage.ts`

#### Work

- Strengthen the contract around one strongest direction.
- Reduce hedge-heavy or possibility-list phrasing in the winning recommendation path.
- Ensure next-step rendering preserves hierarchy instead of re-softening the recommendation.

#### Test files to create or update

- Create `src/__tests__/ai/nds-targeted-repair-v2-decisiveness.test.ts`
- Update `src/__tests__/unit/coach-behavior.spec.ts`
- Update `src/__tests__/unit/required-sections.spec.ts`

#### Definition of done

- The winning direction remains clearly primary through generation and rendering.
- Tests fail when the output slips into brainstorm-style or ambiguous recommendation language.

---

### Task 5. Stronger-vs-obvious contrast upgrade

#### Goal

Ensure the system names the weaker obvious essay and explains why the recommended version is stronger.

#### Categories

- stronger-vs-obvious reasoning
- admissions judgment quality

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts`
- `src/lib/ai/modules/narrative-direction-selection/validator.ts`
- `src/lib/representation/pageBuilders/buildComparisonPage.ts`

#### Work

- Tighten the prompt and validation rules around `why_it_beats_the_obvious_angle`.
- Require concrete contrast language rather than vague “more specific / less generic” filler.
- Preserve the contrast in any comparison-page or downstream rendered representation.

#### Test files to create or update

- Create `src/__tests__/ai/nds-targeted-repair-v2-contrast-reasoning.test.ts`
- Update `src/__tests__/ai/nds-domain-angle-construction.test.ts`
- Update `src/__tests__/unit/evidence-routing.spec.ts`

#### Definition of done

- The output explains both the weaker obvious version and the stronger recommended version.
- Tests fail when the contrast is present only as empty anti-generic wording.

---

### Task 6. Premium coaching tone upgrade

#### Goal

Remove mechanical, generic-AI, or therapy-like coaching tone from the strongest-direction output path.

#### Categories

- premium coaching tone
- recommendation decisiveness

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts`
- `src/lib/ai/modules/narrative-direction-selection/validator.ts`
- `src/lib/representation/pageBuilders/buildRecommendationPage.ts`
- `src/lib/representation/validators.ts`

#### Work

- Add tone-level guardrails against generic AI phrasing and repetitive recommendation formulas.
- Preserve calm, direct, high-judgment phrasing through representation rendering.
- Ensure premium tone is achieved through stronger reasoning, not cosmetic word swaps.

#### Test files to create or update

- Create `src/__tests__/ai/nds-targeted-repair-v2-premium-tone.test.ts`
- Update `src/__tests__/ai/nds-premium-angle-writing.test.ts`
- Update `src/__tests__/unit/opening-coach.spec.ts`

#### Definition of done

- Tests fail on banned or clearly generic phrasing patterns.
- Tone checks are coupled to reasoning quality, not just fluency.

---

### Task 7. Student-specific evidence grounding upgrade

#### Goal

Make the recommendation visibly depend on the student’s actual material so that swapping in another student would break the fit.

#### Categories

- student-specific evidence use
- admissions judgment quality
- stronger-vs-obvious reasoning

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/normalize-context.ts`
- `src/lib/ai/modules/narrative-direction-selection/module-executor.ts`
- `src/lib/ai/modules/narrative-direction-selection/validator.ts`
- `src/lib/fm/liveSessionDirection.ts`

#### Work

- Improve how the system selects, carries, and uses concrete student evidence.
- Require evidence to support the recommendation, not merely appear alongside it.
- Guard against shallow quote-lifting or fabricated specificity.

#### Test files to create or update

- Create `src/__tests__/ai/nds-targeted-repair-v2-student-grounding.test.ts`
- Update `src/__tests__/ai/nds-narrative-signal-extraction.test.ts`
- Update `src/__tests__/unit/first-minute-required-outputs.spec.ts`

#### Definition of done

- Tests fail when the same recommendation could fit multiple students with minimal noun swaps.
- The system can still pass authenticity and non-ghostwriting constraints.

---

### Task 8. Fingerprint and hardcoding prevention check

#### Goal

Prove that V2 improvements come from class-level behavior, not case-specific patching or frozen-case fingerprints.

#### Categories

- applies to all five categories as a validity guard

#### Target code areas

- `src/lib/ai/modules/narrative-direction-selection/**/*.ts`
- `src/lib/ai/**/*.ts`
- `evaluation/scripts/run-072-targeted-repair-v2.ts`

#### Work

- Add a static or unit-level check that rejects case-ID logic, frozen-case phrase detectors, or branch logic tied to known target examples.
- Require the implementation PR to report the hardcoding / fingerprint check result explicitly.

#### Test files to create or update

- Create `src/__tests__/ai/nds-targeted-repair-v2-fingerprint-guard.test.ts`
- Update `src/__tests__/ai/worker.test.ts`

#### Definition of done

- The implementation PR contains a passing hardcoding check.
- If any case-specific logic is found, the run must classify as `V2_INVALID`.

---

### Task 9. V2 scoring artifact generation

#### Goal

Produce the machine-readable scoring artifact required by the V2 standard.

#### Categories

- all five categories

#### Target code areas

- Create `evaluation/scripts/run-072-targeted-repair-v2.ts`
- `src/lib/ai/evaluation/pack.ts` if shared artifact plumbing is needed
- `evaluation_outputs/072-real-human-corpus-expansion/072-targeted-repair-v2/`

#### Work

- Build a repeatable evaluation runner for the locked V2 packet.
- Emit five-category scores per case.
- Emit before / after movement for the six target cases.
- Emit guardrail results and a final V2 classification.

#### Required evaluation command

- `npx tsx evaluation/scripts/run-072-targeted-repair-v2.ts`

#### Definition of done

- The command runs from a written protocol.
- It emits the machine-readable score artifact and a stable output directory.
- It does not edit accepted 072 outputs or frozen artifacts.

---

### Task 10. Blind comparison packet generation

#### Goal

Generate the blind comparison packet and protected decode required by the V2 standard if blind review is used.

#### Categories

- all five categories as review evidence

#### Target code areas

- `evaluation/scripts/run-072-targeted-repair-v2.ts`
- Create `evaluation/scripts/finalize-072-targeted-repair-v2-blind-review.ts` if decode finalization is separated
- `evaluation_outputs/072-real-human-corpus-expansion/072-targeted-repair-v2/`

#### Work

- Generate a blinded packet comparing baseline and repaired outputs.
- Keep decode protected until the blind scoring lock is complete.
- Emit packet manifest, reviewer packet, protected decode, and decoded summary after scoring lock.

#### Definition of done

- Reviewers can score blind without contamination.
- Decode occurs only after the review lock.
- Any early decode or contaminated packet forces `V2_INVALID`.

## Required test files to create or update

### New tests to create

- `src/__tests__/ai/nds-targeted-repair-v2-admissions-judgment.test.ts`
- `src/__tests__/ai/nds-targeted-repair-v2-decisiveness.test.ts`
- `src/__tests__/ai/nds-targeted-repair-v2-contrast-reasoning.test.ts`
- `src/__tests__/ai/nds-targeted-repair-v2-premium-tone.test.ts`
- `src/__tests__/ai/nds-targeted-repair-v2-student-grounding.test.ts`
- `src/__tests__/ai/nds-targeted-repair-v2-fingerprint-guard.test.ts`

### Existing tests likely to update

- `src/__tests__/ai/nds-072-targeted-output-repair.test.ts`
- `src/__tests__/ai/nds-domain-angle-construction.test.ts`
- `src/__tests__/ai/nds-premium-angle-writing.test.ts`
- `src/__tests__/ai/nds-narrative-signal-extraction.test.ts`
- `src/__tests__/ai/selection.test.ts`
- `src/__tests__/ai/worker.test.ts`
- `src/__tests__/unit/coach-behavior.spec.ts`
- `src/__tests__/unit/evidence-routing.spec.ts`
- `src/__tests__/unit/first-minute-required-outputs.spec.ts`
- `src/__tests__/unit/opening-coach.spec.ts`
- `src/__tests__/unit/required-sections.spec.ts`

## Required evaluation script or command

### Script to create

- `evaluation/scripts/run-072-targeted-repair-v2.ts`

### Optional decode-finalization script

- `evaluation/scripts/finalize-072-targeted-repair-v2-blind-review.ts`

### Required command

- `npx tsx evaluation/scripts/run-072-targeted-repair-v2.ts`

This command must be documented in the implementation PR before V2 code is judged complete.

## Required output artifacts

V2 must produce all of the following in a fresh output folder.

### Output folder

- `evaluation_outputs/072-real-human-corpus-expansion/072-targeted-repair-v2/`

### Required artifacts

- `targeted-repair-v2-implementation-summary.md`
- `targeted-repair-v2-evaluation-results.md`
- `targeted-repair-v2-pattern-summary.md`
- machine-readable five-category score artifact
- reviewer packet for blind comparison
- protected decode file if blind review is used
- before / after movement summary for the six target cases
- guardrail regression summary
- hardcoding / fingerprint check result
- final classification artifact using one of:
  - `V2_REPAIR_PASS`
  - `V2_PARTIAL_REPAIR`
  - `V2_REPAIR_FAILED`
  - `V2_INVALID`

## Guardrails against case-specific hardcoding

Implementation must not:

- patch outputs for individual target cases
- branch on case IDs
- add frozen-case phrase detectors
- hardcode wording keyed to known examples
- manually rewrite outputs
- optimize only for the six target cases without guardrails
- weaken the scoring packet or rewrite the evaluation standard

Every implementation PR must explicitly confirm:

- no case-ID branches
- no frozen-case fingerprints
- no manual output edits
- no packet contamination

If any of those checks fail, the final classification is `V2_INVALID`.

## Mapping from tasks to the five V2 categories

| Task | Admissions judgment | Decisiveness | Stronger-vs-obvious | Premium tone | Student-specific evidence |
| --- | --- | --- | --- | --- | --- |
| Freeze evaluation packet | X | X | X | X | X |
| Runtime mapping | X | X | X | X | X |
| Admissions judgment upgrade | X |  |  |  | X |
| Recommendation decisiveness upgrade | X | X |  |  |  |
| Stronger-vs-obvious contrast upgrade | X |  | X |  |  |
| Premium coaching tone upgrade |  | X |  | X |  |
| Student-specific grounding upgrade | X |  | X |  | X |
| Fingerprint / hardcoding prevention | X | X | X | X | X |
| V2 scoring artifact generation | X | X | X | X | X |
| Blind comparison packet generation | X | X | X | X | X |

## Definition of done by phase

### Packet-ready

- V2 inputs, scoring, and classification rules are locked.
- The engineering team has one task packet and one implementation plan.

### Code-ready

- Every planned code change maps to a category.
- Every planned code change has a regression test or evaluation check.

### Evaluation-ready

- The evaluation runner exists and uses the frozen V2 packet.
- The blind packet and decode flow are contamination-safe if blind review is used.

### Review-ready

- All required artifacts exist.
- Before / after movement is visible.
- Guardrail and hardcoding checks are explicit.
- Final V2 classification is stated exactly once.

## Final PR checklist

Open a PR titled:

`072 Targeted Repair V2`

The PR must state:

`V2 TARGETS CLEARLY-BETTER WINS — EXTERNAL ADVANTAGE CLAIMS NOT AUTHORIZED`

### Checklist

- [ ] V2 work stays inside the five-category standard
- [ ] No evaluation-standard changes were made during implementation
- [ ] Code changes are mapped to one or more V2 categories
- [ ] Tests are listed and passed
- [ ] `npx tsx evaluation/scripts/run-072-targeted-repair-v2.ts` is documented and run
- [ ] Five-category scores per case are attached
- [ ] Before / after movement for the six target cases is attached
- [ ] Guardrail regression check is attached
- [ ] Hardcoding / fingerprint check is attached
- [ ] Required output artifacts are attached
- [ ] Final classification is exactly one of:
  - `V2_REPAIR_PASS`
  - `V2_PARTIAL_REPAIR`
  - `V2_REPAIR_FAILED`
  - `V2_INVALID`
- [ ] No expanded external advantage claim is made
- [ ] No market-superiority claim is made

## Task-packet-only PR

Open a PR titled:

`072 Targeted Repair V2 Task Packet`

The PR must state:

`V2 IMPLEMENTATION TASK PACKET ONLY — NO CODE CHANGES`

## Final status

`072 TARGETED REPAIR V2 READY FOR IMPLEMENTATION`
