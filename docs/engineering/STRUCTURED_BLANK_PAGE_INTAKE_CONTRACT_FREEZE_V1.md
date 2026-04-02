# STRUCTURED_BLANK_PAGE_INTAKE_CONTRACT_FREEZE_V1

Status: Frozen control document (do-not-drift)

Frozen at: 2026-03-18

Scope: Structured blank-page intake lane (Phase 1–5 contract surfaces)

## 1) Canonical top-level routes (Phase 1)

| Route | Meaning (frozen) | Product mode outcome |
|---|---|---|
| `ready_for_nds` | Student has enough directional signal; do not enter blank-page recovery lane. | `direction_light` or `direction_full` by scorer |
| `needs_structured_blank_page_intake` | Recoverable low-signal state; must enter structured blank-page lane. | `blank_page_intake` |
| `true_block` | Too-thin/unusable input; cannot safely recover in current turn. | `blocked` |

Contract owner: `classifyBlankPageIntake()` in [src/lib/ml/evidenceStrength/model.ts](src/lib/ml/evidenceStrength/model.ts).

## 2) Canonical blank-page modes (Phase 1 classification, Phase 2 payload)

| `blank_page_mode` | Meaning (frozen) |
|---|---|
| `topic_probe` | Topic exists but moment/hinge is missing. |
| `theme_probe` | Theme/trait framing exists but lived evidence is missing. |
| `activity_probe` | Activity domain exists but personal center/ownership is missing. |
| `scope_reframe` | Student asks topic-worthiness/scope validity instead of extracting signal. |
| `blank_page_discovery` | No viable topic candidate yet; discovery prompt is required. |
| `too_thin_to_recover` | Signal is too thin/unusable for bounded recovery; fallback path only. |

Type owner: [src/types/intake.ts](src/types/intake.ts)

## 3) Frozen payload field meanings (Phase 2)

Canonical object: `blank_page_intake_payload`

| Field | Frozen meaning |
|---|---|
| `product_mode` | Must be `blank_page_intake` while in lane. |
| `blank_page_mode` | Phase 1-assigned mode; adapter/UI must not reinterpret mode semantics. |
| `recovery_question_primary` | Primary deterministic recovery prompt to answer now. |
| `recovery_question_secondary` | Optional alternate/follow-up prompt, not a separate semantic route. |
| `recovery_confidence` | Confidence in selected recovery mode/prompt. |
| `missing_signal_type` | Specific missing-signal category for the lane turn. |
| `why_not_ready_for_direction` | Canonical reason direction is not yet safe. |
| `next_step_type` | UI interaction contract (what student should do next). |
| `reassurance_copy` | Supportive copy only; must not replace canonical reason fields. |
| `example_answer_shape` | Formatting guidance only. |
| `what_good_signal_would_look_like` | Quality bar guidance only. |
| `topic_candidate` | Extracted topical candidate when present. |
| `question_family_primary` | Prompt diagnostic family label for primary question. |
| `question_family_secondary` | Prompt diagnostic family label for secondary question. |
| `selected_template_id` | Deterministic template trace identifier. |

Payload builder owner: [src/lib/fm/buildBlankPagePayload.ts](src/lib/fm/buildBlankPagePayload.ts)

## 4) Frozen post-answer route meanings (Phase 4)

| `post_answer_route` | Meaning (frozen) | Allowed behavior |
|---|---|---|
| `direction_light` | Recovered signal is sufficient for cautious forward movement. | Continue via server response; no client coercion. |
| `second_recovery_question` | Partial recovery; one bounded follow-up question is justified. | Remain in lane; generate depth-2 payload. |
| `clarification` | Signal remains insufficient for direction; hand off with context preserved. | Continue via clarification path only. |
| `too_thin_to_recover` | Recovery budget exhausted or incoherent answer. | Bounded fallback; do not fake-forward. |

Route decision owner: [src/lib/fm/resolveBlankPagePostAnswerRoute.ts](src/lib/fm/resolveBlankPagePostAnswerRoute.ts)

Route mapping owner: [src/lib/fm/handleBlankPageAnswer.ts](src/lib/fm/handleBlankPageAnswer.ts)

## 5) Recovery depth rules (Phase 4)

Frozen rules:
1. Depth starts at 1 when lane is initialized.
2. Depth is capped at 2 (`Math.min(2, activeDepth + 1)`).
3. `second_recovery_question` is disallowed when exhausted or depth >= 2.
4. Exhaustion implies no loop recurrence.
5. `too_thin_to_recover` is terminal for the lane turn.

State owner: [src/lib/fm/handleBlankPageAnswer.ts](src/lib/fm/handleBlankPageAnswer.ts), [src/lib/fm/case-state.ts](src/lib/fm/case-state.ts)

## 6) Telemetry event names (Phase 5)

Frozen blank-page lifecycle events:
- `blank_page_mode_assigned`
- `blank_page_question_rendered`
- `blank_page_answer_submitted`
- `blank_page_to_direction_conversion`
- `blank_page_to_second_question`
- `blank_page_to_clarification`
- `blank_page_to_block`
- `blank_page_abandon`
- `blank_page_continue`

Event name owner: [src/lib/fm/events.ts](src/lib/fm/events.ts)

Emission owner: [src/lib/telemetry/blankPageEvents.ts](src/lib/telemetry/blankPageEvents.ts)

Required diagnostics (frozen minimum where applicable):
- `product_mode`
- `blank_page_mode`
- `missing_signal_type`
- `next_step_type`
- `post_answer_route`
- `blank_page_recovery_depth`
- `blank_page_recovery_exhausted`
- `question_family_primary`
- `question_family_secondary`
- `selected_template_id`

## 7) Eval source-governance rules (Phase 5)

Frozen source taxonomy:
- `public_internet`
- `anonymized_product_input`
- `synthetic`
- `legacy_synthetic`

Frozen threshold:
- Real-input share (`public_internet` + `anonymized_product_input`) must be >= 0.70.

Governance owners:
- [src/lib/evals/schema/blankPageCaseSchema.ts](src/lib/evals/schema/blankPageCaseSchema.ts)
- [src/lib/evals/blankPage/sourceCompositionReport.ts](src/lib/evals/blankPage/sourceCompositionReport.ts)

Current run evidence:
- [evaluation_outputs/blank_page_phase5_eval_v1/blank-page-source-composition-report.json](evaluation_outputs/blank_page_phase5_eval_v1/blank-page-source-composition-report.json)

## 8) Freeze-change protocol

Any change to frozen contract surfaces requires:
1. Explicit update to this document.
2. Matching updates in code + tests.
3. Route mismatch re-review if route semantics changed.
4. New versioned freeze artifact (`..._V2.md`) when semantics change.

## 9) Phase freeze ledger (control state)

As of 2026-03-18:
- Phase 1 — Frozen
- Phase 2 — Frozen
- Phase 3 — Frozen
- Phase 4 — Frozen except mismatch-corrective fixes if newly evidenced
- Phase 5 — Frozen
- Phase 6 — Active rollout/validation preparation (not final-rollout approved)
