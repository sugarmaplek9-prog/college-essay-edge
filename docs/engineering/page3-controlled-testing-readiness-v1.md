# Page 3 Controlled Testing Readiness V1

## Purpose

This document defines the next phase after Page 3 remediation: protect the current release candidate, run controlled product testing on real student-note style inputs, and distinguish true new failure classes from benchmark noise.

## Release candidate rule

Before any Page 3 code change is accepted:

- Run `npm run test:first-minute:surface-gates` if the change touches Page 3 or Page 4 surface files
- Run `npm run eval:page3:rc`
- Confirm RC status remains pass
- If RC status fails, classify the failure before making additional Page 3 changes
- Do not bypass the suite for small wording or template edits

## Formal surface gatekeepers

The following named tests are the formal gatekeepers for Page 3 / Page 4 surface changes:

- `src/__tests__/unit/page3-surface-integrity.spec.ts`
- `src/__tests__/unit/opening-coach-ordering.spec.ts`
- `src/__tests__/unit/opening-coach.spec.ts`

Run them through:

- `npm run test:first-minute:surface-gates`

These tests are the required CI boundary for changes touching:

- `src/lib/fm/canonicalPage3Payload.ts`
- `src/lib/fm/openingCoach.ts`
- Page 3 / Page 4 route files under `src/app/start/direction`, `src/app/start/opening`, or `src/app/start/reflecting`
- related first-minute surface components under `src/components/firstMinute`

Policy:

- no ad hoc Page 3 / Page 4 surface pass unless one of these named tests fails first
- otherwise, a surface change requires explicit approval as a scoped product correction
- do not reopen ranking, routing, or broader remediation work under this surface gate

## Controlled testing lane

Use `npm run eval:page3:controlled` for product-only real-case testing.

Default inputs:

- `scripts/data/page3-controlled-testing-lane-v1.sample.json`

Default outputs:

- `evaluation_outputs/page3_controlled_testing_v1/CONTROLLED_TESTING_SUMMARY_V1.json`
- `evaluation_outputs/page3_controlled_testing_v1/CONTROLLED_TESTING_SUMMARY_V1.md`

Each case should capture:

- raw input
- route trace
- final surfaced recommendation packet
- candidate instrumentation
- fallback usage
- thin coverage signal
- suppressed strong candidates
- operator notes

## Instrumentation plan

For each controlled-testing case, record:

- winner ID and family
- candidates generated
- strict survivor count
- fallback-path usage (`_shadow` or equivalent fallback candidate participation)
- weak coverage (`strict_survivor_count < 3`)
- suppressed strong candidates (high-scoring alternatives rejected by validation)
- recommendation prefix and semantic shell
- route trace and final route category
- operator notes and review notes

Batch-level monitoring should include:

- family distribution
- top literal prefixes
- top semantic shells
- fallback rate
- thin-coverage rate

## Broader validation plan

### Phase 1 — controlled pilot

Run 24 real cases total:

- 8 messy blank-page / unclear-center cases
- 8 partial-draft or over-written cases
- 8 compare / split-choice / mixed-signal cases

Quality bar for pilot continuation:

- no RC regression on frozen suite
- no new cross-case collapse pattern
- at least 20/24 cases judged operator-usable without immediate manual rescue
- fallback-path usage remains explainable rather than dominant
- no single recommendation prefix or semantic shell becomes obviously concentrated in the pilot batch

### Phase 2 — expanded controlled run

If Phase 1 passes, run 40 additional real cases with the same instrumentation and review protocol.

## Review process

For each controlled-testing batch:

1. Run the harness and export JSON + markdown outputs
2. Review surfaced recommendation, essay_about, why_this_direction, stronger/weaker comparison, and next step
3. Mark each case as:
   - landed
   - usable but needs coaching polish
   - structurally weak
   - failure
4. Add operator notes describing why
5. Separate isolated misses from repeated failure patterns

## Failure categorization

Any new issue found in controlled testing should be categorized before remediation:

- routing failure
- zero-candidate / thin-candidate coverage failure
- fallback overreach or fallback absence
- malformed recommendation composition
- weak why_this_direction
- comparison surface failure
- evidence grounding failure
- template concentration / trust erosion
- isolated case-specific weakness

## Distinguishing new failures from benchmark noise

Treat a problem as a new failure class only if at least one of the following is true:

- it appears in 2 or more controlled-testing cases with a shared mechanism
- it would reasonably be expected to trigger the frozen RC gates but does not
- it reveals a product-surface defect not represented in the current three layers

Do not reopen a broad Page 3 remediation loop for a single isolated miss without pattern evidence.

## Current blockers

No hard engineering blocker prevents controlled product testing.

Current operational constraints:

- the heuristic evaluator remains a guardrail, not final quality authority
- broader testing still requires operator review discipline
- the controlled lane should be run against the same build under evaluation, ideally via the RC validator build or an explicitly provided `PRODUCT_URL`
