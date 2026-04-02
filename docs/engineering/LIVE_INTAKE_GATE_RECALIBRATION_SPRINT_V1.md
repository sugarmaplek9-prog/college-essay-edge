# LIVE_INTAKE_GATE_RECALIBRATION_SPRINT_V1

**Product:** College Essay Edge  
**Status:** Immediate repair sprint (pre-candidate-generation in live path)  
**Date:** 2026-03-17

## Purpose

Recalibrate live intake gating so recoverable inputs are not blocked before downstream narrative-direction logic can operate.

This sprint addresses the currently dominant live-path failure:

- universal/near-universal over-blocking at intake
- overfiring `NO_SCENE_EVIDENCE`
- collapse of recoverable cases into `blocked`

This sprint is intentionally ordered **before** downstream candidate-generation/reranker work in live production routing.

---

## Evidence base (why this sprint now)

From [evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1.md](evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1.md):

- 25/25 benchmark cases routed to `blocked`
- block reason `NO_SCENE_EVIDENCE` in 25/25
- low-signal marker `signal_strength=none` in 25/25
- contradiction markers effectively absent
- 18/25 cases acceptable for `ask_question_before_showing`
- 7/25 cases expected `show_strongest_direction`

Conclusion: live intake gate is over-blocking and preventing normal path execution.

---

## Sprint objective

Ensure live intake gate behavior obeys this policy:

1. **Recoverable thin-signal** → `ask_question_before_showing`
2. **Thin but directional enough** → `show_strongest_direction`
3. **Truly insufficient/unusable** → `blocked_or_needs_more_input`

---

## Priority targets

### Priority 1 — Reduce false `NO_SCENE_EVIDENCE` overfire

Implement gating logic so absence of fully formed scene detail does not automatically imply hard block.

### Priority 2 — Separate recoverable-thin from truly unusable

Introduce a recoverability decision lane that distinguishes:

- no scene yet, but coherent topic/question signal exists
- no meaningful signal (noise, incoherent, too short, no topic/question intent)

### Priority 3 — Route thin essay-help questions to clarify

For question-form inputs with topical content and essay intent, default to:

- `ask_question_before_showing`

instead of hard block.

### Priority 4 — Permit directional pass-through for subset of strong prompts

Allow `show_strongest_direction` when signals indicate usable directional framing despite limited scene detail.

---

## Scope

### In scope

- live intake gating thresholds/rules
- route decision boundary between `blocked` and `clarification`
- selective pass-through to `direction_light`/`direction_full` lane
- telemetry needed to diagnose route decisions

### Out of scope

- reranker training
- candidate-generation redesign
- trust/helpfulness model changes
- shadow-mode ML deployment changes

---

## Required implementation changes

## 1) Add recoverable-thin-signal lane

Create explicit boolean/score feature:

- `recoverable_thin_signal`

Suggested criteria (initial):

- input length above minimal threshold
- essay-help intent present (question or comparison framing)
- at least one topic noun cluster present
- not contradiction-dominated
- not contamination/high-risk failure case

If true and `scene_specificity` is low, prefer `clarification` over `blocked`.

## 2) Recalibrate `NO_SCENE_EVIDENCE` handling

`NO_SCENE_EVIDENCE` should become a **clarification trigger** by default, not a block trigger.

Block should require stronger conditions, e.g.:

- `NO_SCENE_EVIDENCE` + `NO_SIGNAL_DETECTED` + below minimum intent/structure thresholds

## 3) Clarify vs block decision policy

Introduce deterministic policy (v1):

- if truly unusable signal → `blocked`
- else if low scene specificity + recoverable → `clarification`
- else if directional sufficiency passes threshold → `show_strongest_direction`

## 4) Directional pass-through conditions

Permit `show_strongest_direction` when:

- user provides explicit compare/select topic framing
- topic candidates are concrete enough
- contamination risk low
- contradiction markers low

---

## Instrumentation requirements

For each intake route decision, log:

- route selected
- route confidence
- scene specificity
- ambiguity
- recoverable-thin-signal flag
- block reason codes
- clarify reason codes
- pass-through reason codes

This is mandatory for post-patch validation.

---

## Benchmark rerun protocol (required)

After patching, rerun full 25-case live benchmark:

1. regenerate live predictions with candidate inventory capture
2. score current NDS run
3. score generic baseline run
4. regenerate miss-review artifacts
5. rerun live gate diagnostic

Primary rerun artifacts:

- `NDS_PREDICTIONS_FULL25_CURRENT_NDS.jsonl`
- `NDS_LIVE_CANDIDATE_INVENTORY_FULL25.json`
- `NDS_SCORE_REPORT_CURRENT_NDS_FULL25.json`
- `NDS_BENCHMARK_MISS_REVIEW_CURRENT_NDS_FULL25.json`
- `LIVE_INTAKE_GATE_DIAGNOSTIC_V1.json`

---

## Acceptance criteria

Sprint is complete only if all pass:

1. Block rate on benchmark 25-case set drops from 25/25 to a mixed distribution.
2. `NO_SCENE_EVIDENCE` no longer implies automatic block.
3. At least the previously identified recoverable subset routes to `ask_question_before_showing`.
4. A non-zero subset routes to `show_strongest_direction` when expected by benchmark target action.
5. Candidate inventory is non-empty for at least some non-blocked cases.
6. Route-decision telemetry fields are present for all 25 cases.

---

## Success metrics

Track at minimum:

- `blocked_rate`
- `clarification_rate`
- `show_rate`
- `false_block_count` (cases expected non-block but blocked)
- `recoverable_to_clarify_count`
- `nonblocked_candidate_inventory_count`

---

## Risks and mitigations

1. **Over-correction to show**  
   Mitigation: conservative pass-through thresholds; prioritize `clarify` over `show` when uncertain.

2. **Under-correction (still over-blocking)**  
   Mitigation: explicit hard rule making `NO_SCENE_EVIDENCE` a clarify-default signal.

3. **New routing instability**  
   Mitigation: deterministic lane logic + route telemetry + benchmark rerun diff checks.

---

## Delivery order

1. Implement recoverable-thin-signal feature and route policy updates
2. Add/verify route telemetry logging
3. Run full live benchmark rerun
4. Publish recalibration report with before/after routing distribution

---

## Bottom line

This sprint treats the current bottleneck as an intake-gate calibration problem, not a downstream candidate-quality problem.

The system must first stop over-blocking recoverable cases before additional candidate-generation or reranker work can be fairly evaluated in live routing.
