# PAGE_THREE_PIPELINE_NARROW_ARCHITECTURE_UPGRADE_SPEC_V1.md

## Purpose

This spec is the required follow-on for Outcome B from `PAGE_THREE_PIPELINE_ARCHITECTURE_AUDIT_SPEC_V1.md`.

Goal: upgrade the active `/start` page-3 recommendation path with narrow architecture additions that close quality gaps without a full system rebuild.

---

## Outcome linkage

- Audit decision: **Outcome B — Architecture is partially sufficient; narrow pipeline additions are required**
- This file is mandatory per the audit hard rule.

---

## Targeted gaps to close

1. No robust page-3 candidate competition artifact in active `/start` path
2. No explicit page-3 rejection cascade before display
3. Source-anchor retention is insufficiently enforced in winning recommendation line
4. Weaker/stronger pair quality can be cosmetic rather than evidence-grounded
5. Observability does not capture full page-3 winner/runner-up/rejection trace
6. Page-3 quality thresholds are not a hard release gate

---

## Upgrade scope (narrow, not rebuild)

### In-scope
- Add explicit candidate pack generation for page-3 direction line in active `/start` flow
- Add scoring + ranking dimensions aligned to audit thresholds
- Add hard pre-display rejection gates
- Add stronger source-anchor retention constraints
- Add structured weaker/stronger selection from candidate set
- Add page-3 observability payload and logs
- Add page-3 evaluation gate script and thresholds

### Out-of-scope
- Full replacement of intake orchestration architecture
- Full UI redesign across all pages
- Migration of all flows to `/api/v1/ai/runs`

---

## Required architecture additions

## 1) Candidate pack in active page-3 path

Implement `Page3CandidatePack` generated after case-state derivation and before final direction copy render.

Minimum fields:
- `candidate_id`
- `direction_line`
- `source_anchor_spans[]`
- `hinge_span`
- `why_this_direction`
- `scores` by dimension
- `validator_flags`
- `rejection_reasons[]`
- `selected`

Minimum candidate count:
- target: 3
- hard floor: 2

---

## 2) Scoring/ranking dimensions (required)

Each candidate must score:
- `source_grounding`
- `source_faithfulness`
- `concrete_anchor_retention`
- `narrative_hinge_clarity`
- `draftability`
- `individualization`
- `non_repeatability`
- `coach_judgment_quality`
- `translation_penalty` (negative)
- `abstraction_penalty` (negative)

Ranking output must include:
- winner
- runner-up
- score margin

---

## 3) Pre-display rejection cascade

Reject candidates before display if any hard failure:
- no concrete source anchor
- banned abstraction pattern
- high repeatability risk
- no hinge evidence
- over-translation above threshold

If all candidates fail:
- route to clarification (`ask_question_before_showing`) with targeted hinge question.

---

## 4) Weaker/stronger pair grounding rules

Construct pair from ranked candidates, not template-only text.

Rules:
- weaker must be plausible and source-grounded
- stronger must be evidence-superior to weaker
- judgment must cite concrete differentiator (anchor or hinge)

---

## 5) Observability additions

Emit per page-3 generation event:
- `trace_id`
- `anchor_candidates_extracted`
- `hinge_candidates_extracted`
- full `candidate_pack`
- `selected_candidate_id`
- `runner_up_candidate_id`
- `score_margin`
- `rejected_candidates`
- `rejection_reasons`
- final rendered recommendation payload

Storage path:
- structured JSON logs first
- DB sink optional second phase

---

## 6) Evaluation gate

Create a page-3-specific eval gate script with hard thresholds:
- generic LLM baseline beat on source grounding/specificity/draftability/non-repeatability
- >=80% internal review pass on recommendation quality
- <10% abstract/over-translated/generic failures
- >=80% weaker/stronger pair usefulness
- >=80% evidence-card explanation quality

Release rule:
- fail any threshold => release blocked

---

## Implementation sequence

### Phase 1 — Candidate architecture in active flow
- Introduce candidate pack builder
- Introduce ranking dimensions + margin
- Wire selected winner to page-3 display payload

### Phase 2 — Rejection cascade + fallback routing
- Add hard rejection rules
- Add clarification fallback with hinge-targeted question

### Phase 3 — Pair and evidence quality hardening
- Derive weaker/stronger from candidate pack
- Enforce evidence-backed judgment text

### Phase 4 — Observability + eval gate
- Emit full page-3 generation trace
- Add threshold gate script and CI/task wiring

---

## Pass criteria

This upgrade is complete only if:
- candidate pack exists in active page-3 path
- winner selection is score-traceable
- hard rejection gates run before display
- weaker/stronger pair is candidate-grounded
- page-3 threshold gate passes and is required for release

---

## Deliverables

1. Code changes implementing candidate/ranking/rejection in active `/start` page-3 flow
2. Logging schema + emitted traces
3. Page-3 eval gate script + threshold report artifact
4. Updated release checklist requiring page-3 gate pass
