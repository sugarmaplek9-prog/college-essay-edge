# NDS_BENCHMARK_OUTPUT_PACK_V1

## Purpose
Defines the exact output object NDS must produce during offline evaluation so results are comparable, scoreable, and failure-clusterable.

## Required output fields
1. `case_id`
2. `run_id`
3. `model_version`
4. `timestamp_utc`
5. `predicted_best_action`
6. `predicted_action` (legacy compatibility)
7. `predicted_best_direction`
8. `predicted_candidate_directions`
9. `predicted_rejected_directions`
10. `clarification_questions`
11. `confidence_band`
12. `risk_flags`
13. `one_sentence_rationale`
14. `full_rationale`
15. `needs_human_review`
16. `failure_annotation` (manual post-run classification fields)
17. `provenance` (`source_type`, `source_origin`, `source_reference`, `capture_date`, `transformation_level`, `adjudication_status`)

## Action enum
- `show_strongest_direction`
- `ask_question_before_showing`
- `blocked_or_needs_more_input`
- `no_good_candidate`

Legacy action labels may still appear in `predicted_action`, but must be mappable to the canonical set above.

## Hard rules
- Never return a best direction that is not grounded in the user request.
- If context is missing, say so explicitly.
- Do not pretend certainty on blank-page cases.
- Distinguish topic ranking from supplement instruction.
- Sensitive topics must surface risk, not just opportunity.

## Minimal JSON example
```json
{
  "case_id": "NDS-004",
  "run_id": "local-smoke-001",
  "model_version": "nds-v1",
  "timestamp_utc": "2026-03-17T00:00:00Z",
  "predicted_best_action": "show_strongest_direction",
  "predicted_action": "rank_candidates",
  "predicted_best_direction": "transit maps as urban systems curiosity",
  "predicted_candidate_directions": [
    "illness as resilience",
    "second place as ambition and revision",
    "transit maps as urban systems curiosity"
  ],
  "predicted_rejected_directions": [
    "illness as adversity center",
    "second place as generic perseverance"
  ],
  "clarification_questions": [
    "What do transit maps make you notice that other people miss?"
  ],
  "confidence_band": "medium",
  "risk_flags": [
    "topic_selection",
    "unusual_topic_opportunity"
  ],
  "one_sentence_rationale": "The transit-map topic is most distinctive if it reveals how the student thinks.",
  "full_rationale": "The unusual topic creates stronger intellectual signal than the emotionally heavier but more common alternatives.",
  "needs_human_review": false,
  "failure_annotation": {
    "failure_owner": "",
    "better_candidate_existed": "",
    "clarify_should_have_happened": "",
    "trust_risk": "",
    "likely_student_reaction": ""
  },
  "provenance": {
    "source_type": "public_internet",
    "source_origin": "CollegeVine",
    "source_reference": "https://www.collegevine.com/questions/53870/common-app-essay-topics",
    "capture_date": "",
    "transformation_level": "redacted",
    "adjudication_status": "needs_adjudication"
  }
}
```
