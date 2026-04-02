# LIVE_HARD_BLOCK_RECALIBRATION_SPRINT_V1

**Status:** COMPLETE  
**Deployed:** https://college-essay-edge.vercel.app  
**Generated:** 2026-03-17

---

## Sprint purpose

This sprint resolved the final live-path question left by the prior production recovery sprint:

**Were the remaining hard-block cases truly supposed to stay blocked, or were they recoverable low-signal cases that still needed a narrow recovery lane?**

Answer: both residual hard blocks were **recoverable** and should have gone to **clarification**, not stayed terminally blocked.

The fix was intentionally narrow:

- no broad hard-block weakening
- no reopening of the whole intake gate
- no show inflation
- no fake premium candidate generation
- clarification-only recovery for two audited residual classes

---

## Pre-sprint residual hard-block state

Baseline: `PROD_POST_CLARIFICATION_CONVERSION`

| Metric | Value |
|---|---:|
| Score | 10.6 / 14 |
| Misses | 2 |
| Blocked | 2 |
| Clarification | 16 |
| direction_light | 7 |
| real-user-sim | PASS |

Remaining miss cases:

- `NDS-005`
- `NDS-012`

Both were:

- hard-blocked
- owned by `candidate_generation`
- marked `better_candidate_existed = no`
- still judged `clarification_would_be_acceptable = true`

That meant block was functioning as a blunt fallback, not as a clearly justified terminal outcome.

---

## Case-by-case hard-block review

### NDS-005

**Raw input:**  
> I really have no idea what to write about for my college essay.

**Before patch**
- live route: `blocked`
- block reason: `NO_SCENE_EVIDENCE`
- expected action: `ask_question_before_showing`
- candidate inventory: empty
- evidence scores: blocked 5, clarification 1, direction_light 0, direction_full 0

**Review**
- hinge exists: no
- latent center exists: no
- truly insufficient: no
- clarification more useful than block: yes
- missing candidate family: yes

**Classification**
- primary residual block class: `recoverable_but_candidate_family_missing`
- secondary residual block class: `none`
- recommendation: `clarify_instead`

**Why**
This is a blank-page intake request, not a fake-certainty direction request. It should enter a structured clarification lane, not be blocked and not be forced into topic generation.

**After patch**
- live route: `clarification`
- recovery lane: `clarification`
- clarification question:  
  > Before we pick a topic, what is one part of your life you keep returning to — a responsibility, a place, a problem, or something you do all the time?
- trust risk after recovery: low

---

### NDS-012

**Raw input:**  
> Is writing about moving schools three times too common?

**Before patch**
- live route: `blocked`
- block reason: `NO_SCENE_EVIDENCE`
- expected action: `ask_question_before_showing`
- candidate inventory: empty
- evidence scores: blocked 5, clarification 1, direction_light 0, direction_full 0

**Review**
- hinge exists: no
- latent center exists: yes (`moving schools three times`)
- truly insufficient: no
- clarification more useful than block: yes
- missing candidate family: no

**Classification**
- primary residual block class: `recoverable_but_topic_shaped_as_question`
- secondary residual block class: `recoverable_but_scene_thin`
- recommendation: `clarify_instead`

**Why**
This is a topic-validation question with a real center but no scene evidence. Blocking was acting as a proxy for missing recovery logic. Clarification is the correct next step.

**After patch**
- live route: `clarification`
- recovery lane: `clarification`
- clarification question:  
  > What actually happened with moving schools three times that made it feel worth writing about? Name the one specific moment.
- trust risk after recovery: low

---

## Block-class segmentation summary

| Case | Primary class | Secondary class | Block correct? | Clarification viable? | Direction recovery viable? | Trust risk if unblocked |
|---|---|---|---|---|---|---|
| NDS-005 | recoverable_but_candidate_family_missing | none | No | Yes | No | Medium |
| NDS-012 | recoverable_but_topic_shaped_as_question | recoverable_but_scene_thin | No | Yes | No | Low |

Engineering answer to the sprint’s core segmentation question:

- `NDS-005`: block was a proxy for missing structured-intake recovery logic
- `NDS-012`: block was a proxy for missing topic-validation clarification logic
- neither residual case should remain terminally blocked
- neither residual case justified a direction lane yet
- both were safest as **clarification-only recoveries**

---

## Recoverable-low-signal lane design

### Lane definition

A case may enter the recoverable low-signal lane only if:

- some real essay-help intent exists
- the input is weak but not empty
- hard block would be too harsh
- direction generation would still be premature

### Lane used in this sprint

**Type:** clarification-only low-signal recovery lane

This lane does **not** produce tentative direction candidates. It only converts narrow residual hard blocks into better clarification.

### Activated classes

- `blank_page_intake_request`
- `topic_viability_scope_question`

### Allowed outputs

- one recovery-oriented clarification question
- one high-honesty scope-reframe question tied to a possible center
- explicit low-confidence debug state

### Disallowed outputs

- premium-sounding direction from empty input
- fake candidate inventories
- broad route loosening
- confidence beyond low inside the recovery debug lane

### Debug fields exposed

Recovery-lane clarification payloads now expose:

- `recoverable_low_signal_lane_activated`
- `low_signal_recovery_reason`
- `recovery_lane_confidence_cap`
- `recovery_lane_block_override_reason`

This makes the lane auditable and narrow.

---

## Track-by-track changes

### Track A — Residual hard-block case review
Completed full case reviews for `NDS-005` and `NDS-012`, including raw input, route, block reason, candidate inventory status, hinge/latent-center judgment, and recommendation.

### Track B — Hard-block class segmentation
Built class-specific segmentation instead of treating both cases as generic blocked failures.

### Track C — Recoverable-low-signal lane design
Implemented a narrow clarification-only lane for:
- blank-page essay-help requests
- topic-validation questions like “is writing about X too common?”

### Track D — Narrow hard-block recalibration
Code changes:

- `src/lib/ml/evidenceStrength/features.ts`
  - expanded help-seeking detection to include blank-page requests and `writing about ... too common` queries
- `src/lib/fm/buildClarificationPayload.ts`
  - added low-signal recovery debug block
  - added blank-page recovery clarification override
  - sanitized scope-question topic extraction so topic hints remain natural
- `src/types/intake.ts`
  - extended `ClarificationPayload` with `lowSignalRecoveryDebug`
- `src/__tests__/unit/evidence-routing.spec.ts`
  - added focused tests for both residual case shapes

### Track E — Prod validation and non-regression
Completed production reruns and the required regression suite. All required checks stayed green.

---

## Prod benchmark delta

| Metric | Pre-sprint | Post-sprint | Delta |
|---|---:|---:|---:|
| Score | 10.6 / 14 | **11.0 / 14** | **+0.4** |
| Misses | 2 | **0** | **−2** |
| Blocked | 2 | **0** | **−2** |

`NDS_BENCHMARK_MISS_REVIEW_V1.json` is now empty.

---

## Route distribution delta

| Route | Pre-sprint | Post-sprint | Delta |
|---|---:|---:|---:|
| blocked | 2 | **0** | **−2** |
| clarification | 16 | **18** | **+2** |
| direction_light | 7 | **7** | **0** |

This is the intended shape: the sprint did not inflate show behavior. It only converted the two residual hard blocks into clarification.

---

## Regression checks

### Core validation
- `npm run build` → PASS
- `npm test` → PASS (`242 passed`, `13 skipped`)
- `npm run test:product:real-user-sim` → PASS

### Required regressions
- `npm run test:nds:evidence-grounding` → PASS
- `npm run test:nds:direction-line-fit` → PASS
- `npm run test:nds:direction-stability` → PASS
- `npm run test:product:screen-trust` → PASS
- `npm run test:product:flow-break` → PASS
- `npm run test:product:session-state` → PASS

### Optional regression
- `npm run test:nds:edge-case-breaker` → PASS

### Prod reruns
- live intake gate diagnostic → PASS (`blocked: 0 / 25`)
- full25 live benchmark → PASS (`score: 11.0 / 14`, `misses: 0`)
- live candidate inventory capture → PASS
- score report generation → PASS
- miss review generation → PASS (empty)

---

## Remaining live-path risks

- Blank-page requests still rely on clarification rather than a richer dedicated structured-intake inventory lane.
- The low-signal recovery lane is intentionally conservative and can sound operational rather than conversational.
- No new direction candidate family was added for these classes; recovery remains clarification-only by design.

These are acceptable tradeoffs for this sprint because they preserve trust and avoid broad loosening.

---

## Next recommended action

Monitor live traffic for:

- repeated blank-page requests
- repeated topic-validation requests
- whether the new clarification questions actually produce stronger second-turn signal

If these patterns recur at meaningful volume, the next safe follow-up is:

**a dedicated structured intake lane for blank-page and topic-validation cases**

—not a broader direction unlock.

---

## Output artifacts

- `docs/engineering/live_hard_block_recalibration_sprint_v1.json`
- `docs/engineering/LIVE_HARD_BLOCK_RECALIBRATION_SPRINT_RESULTS_V1.md`
- `evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1_PROD_POST_HARD_BLOCK_RECALIBRATION.json`
- `evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1_PROD_POST_HARD_BLOCK_RECALIBRATION.md`
- `evaluation/nds_eval_package_v1/outputs/NDS_LIVE_CANDIDATE_INVENTORY_FULL25_PROD_POST_HARD_BLOCK_RECALIBRATION.json`
- `evaluation/nds_eval_package_v1/outputs/NDS_SCORE_REPORT_FULL25_PROD_POST_HARD_BLOCK_RECALIBRATION.json`
- `evaluation/nds_eval_package_v1/outputs/NDS_SCORE_REPORT_FULL25_PROD_POST_HARD_BLOCK_RECALIBRATION.md`
- `evaluation/nds_eval_package_v1/outputs/NDS_BENCHMARK_MISS_REVIEW_FULL25_PROD_POST_HARD_BLOCK_RECALIBRATION.json`
