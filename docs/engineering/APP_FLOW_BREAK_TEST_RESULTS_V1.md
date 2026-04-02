# APP_FLOW_BREAK_TEST_RESULTS_V1

## protocol purpose

Validate full end-to-end journey integrity so transitions preserve trust, clarity, and actionability across branches and recovery states.

## scenario inventory

- AFB_01 (strong)
- AFB_02 (strong)
- AFB_03 (strong)
- AFB_04 (action)
- AFB_05 (action)
- AFB_06 (clarification)
- AFB_07 (clarification)
- AFB_08 (low_signal)
- AFB_09 (low_signal)
- AFB_10 (contradiction)
- AFB_11 (contradiction)
- AFB_12 (failure_retry)

## overall pass/fail summary

**PASS**
- flow_coherence_strong: 11/12 (need 9) -> PASS
- transition_quality_strong: 11/12 (need 9) -> PASS
- trust_continuity_maintained: 11/12 (need 9) -> PASS
- next_step_clarity_clear: 11/12 (need 10) -> PASS
- overall_journey_trustworthiness: 11/12 (need 9) -> PASS
- high_severity_flows_max_2: 11/12 (need 10) -> PASS
- special_flows_trust_continuity: 6/7 (need 6) -> PASS
- special_flows_next_action_clear: 6/7 (need 6) -> PASS

## high-severity flows

- AFB_07: RESULT_SCREEN (SSTA_04) — Result shown when clarification was expected.

## likely bail points

- AFB_01: No obvious early bail point.
- AFB_02: No obvious early bail point.
- AFB_03: No obvious early bail point.
- AFB_04: No obvious early bail point.
- AFB_05: No obvious early bail point.
- AFB_06: No obvious early bail point.
- AFB_07: RESULT_SCREEN (SSTA_04) — Result shown when clarification was expected.
- AFB_08: No obvious early bail point.
- AFB_09: No obvious early bail point.
- AFB_10: No obvious early bail point.
- AFB_11: No obvious early bail point.
- AFB_12: No obvious early bail point.

## issue clusters

- entry_branching_confusion: 0
- input_expectation_confusion: 2
- clarification_flow_weakness: 1
- result_to_action_disconnect: 0
- recovery_state_weakness: 1
- tone_continuity_fragmentation: 8
- flow_state_bug_hidden_ux_bug: 0

## per-flow severity table

| Flow ID | Flow Class | Severity | Main issue cluster | Likely bail point | Fix owner | Fix priority |
|---|---|---|---|---|---|---|
| AFB_01 | strong | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_02 | strong | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_03 | strong | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_04 | action | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_05 | action | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_06 | clarification | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_07 | clarification | high | clarification_flow_weakness | RESULT_SCREEN (SSTA_04) — Result shown when clarification was expected. | frontend + product copy | P2 |
| AFB_08 | low_signal | low | input_expectation_confusion | No obvious early bail point. | frontend + product copy | P3 |
| AFB_09 | low_signal | low | input_expectation_confusion | No obvious early bail point. | frontend + product copy | P3 |
| AFB_10 | contradiction | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_11 | contradiction | low | tone_continuity_fragmentation | No obvious early bail point. | frontend + product copy | P4 |
| AFB_12 | failure_retry | low | recovery_state_weakness | No obvious early bail point. | frontend + product copy | P2 |

## top 10 journey trust breaks

1. AFB_01: No major flow break observed.
2. AFB_02: No major flow break observed.
3. AFB_03: No major flow break observed.
4. AFB_04: No major flow break observed.
5. AFB_05: No major flow break observed.
6. AFB_06: No major flow break observed.
7. AFB_07: Expected route ask_question_before_showing but observed show_strongest_direction.
8. AFB_08: No major flow break observed.
9. AFB_09: No major flow break observed.
10. AFB_10: No major flow break observed.

## recommended fix sequence

1. Priority 1 — result-to-action disconnects.
2. Priority 2 — clarification/blocked/retry trust breaks.
3. Priority 3 — branching and input expectation confusion.
4. Priority 4 — tone/continuity fragmentation.
5. Priority 5 — minor transition polish.

## product readiness implications

Flow integrity currently meets protocol thresholds.
