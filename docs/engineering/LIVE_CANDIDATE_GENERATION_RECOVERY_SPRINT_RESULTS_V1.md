# LIVE_CANDIDATE_GENERATION_RECOVERY_SPRINT_RESULTS_V1

## sprint purpose
Recover live candidate-generation quality now that intake gate over-blocking is no longer dominant.

## pre-sprint live benchmark state
- blocked: 3
- clarification: 19
- direction_light: 3
- candidate inventory > 0: 3
- full25 score: 9.8 / 14
- misses: 9
- miss-owner split: {"candidate_generation": 9}

## pass-through case review summary
- Reviewed pass-through cases NDS-003, NDS-004, NDS-018 using live candidate inventory and miss-review artifacts.
- Added explicit option-ranking candidate generation for live direction-light construction.
- Added false-premium suppression hooks and generation debug fields.
- Directional candidate inventories became case-specific (no longer generic-only provisional lines).

## track-by-track changes
- Track A: Added pass-through candidate construction in [src/lib/fm/buildLightDirectionPayload.ts](src/lib/fm/buildLightDirectionPayload.ts).
- Track B: Added indirect hinge detection, family/duty indicator, weak-note recovery flags, and contradiction diversity marker in light generation debug.
- Track C: Added false-premium suppression checks in candidate construction.
- Track D: Added clarification missing-signal tags in [src/lib/fm/buildClarificationPayload.ts](src/lib/fm/buildClarificationPayload.ts).
- Track E: Deployed to prod and reran intake diagnostic, full25 benchmark, inventory capture, score report, and miss review.

## live benchmark delta
- score: 9.8 → 9.88 (+0.08)
- misses: 9 → 8 (-1)

## live candidate inventory delta
- inventory > 0 cases: 3 → 3 (+0)
- Direction-light cases now expose richer candidate sets (3 → 5 entries on pass-through cases).

## miss-owner delta
- before: {"candidate_generation": 9}
- after: {"candidate_generation": 7, "selection_or_reranking": 1}

## regression checks across hardened protocols
- PASS: test:nds:evidence-grounding
- PASS: test:nds:direction-line-fit
- PASS: test:nds:direction-stability
- PASS: test:product:screen-trust
- PASS: test:product:flow-break
- PASS: test:product:session-state
- FAIL: test:product:real-user-sim
- PASS: npm test

## remaining live-path risks
- Scope-correction prompts remain clarification-heavy for some show-expected cases.
- One residual option-ranking miss has shifted to selection/reranking (better candidate existed).
- A blocked high-risk guidance case remains.

## next recommended action
Run a focused selection/reranking micro-sprint for option-ranking cases and a narrow scope-correction route-support patch, then rerun prod ladder.
