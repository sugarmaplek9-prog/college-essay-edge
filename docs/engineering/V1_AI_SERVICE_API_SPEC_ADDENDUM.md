# V1_AI_SERVICE_API_SPEC_ADDENDUM
College Essay Edge  
Narrative Direction Selection  
Candidate generation + scoring layer API addendum

## Status

Add after current Page 3 refinement is stable

## Purpose

This addendum defines the request/response contract for the Narrative Direction Selection scoring layer.

It is designed to work with the current product architecture and adds:

- multi-candidate generation
- candidate validation
- candidate scoring
- reranking
- confidence routing
- clarifying-question routing
- logging-ready structured outputs

This addendum does not replace the current AI service architecture. It extends it.

## 1. DESIGN RULES

### Rule 1

The service must generate multiple candidate directions, not one freeform strongest-direction paragraph.

### Rule 2

The service must return structured candidate objects, not prose blobs only.

### Rule 3

The service must support hard rejection, explicit scoring, and route decisioning.

### Rule 4

The frontend may show one strongest direction first, but the backend must preserve the richer ranked-candidate object.

### Rule 5

Student-facing phrasing may be generated, but selection must be based on explicit candidate evaluation.

## 2. SERVICE BOUNDARY

This addendum defines one module-level API surface:

### Primary operation

POST /ai/narrative-direction-selection/analyze

This operation:

- accepts student rough notes
- generates candidate directions
- validates them
- scores them
- selects best candidate
- returns strongest-direction artifact plus full candidate-scoring payload

## 3. REQUEST SCHEMA

### Endpoint

POST /ai/narrative-direction-selection/analyze

### Request body

```json
{
  "request_id": "string",
  "case_id": "string",
  "user_id": "string",
  "module": "narrative_direction_selection",
  "input": {
    "raw_text": "string",
    "entry_mode": "notes | draft",
    "source_language": "en",
    "application_context": {
      "essay_type": "personal_statement | supplemental | unknown",
      "word_limit_target": 650,
      "school_context": ["optional", "array", "of", "strings"]
    }
  },
  "generation_config": {
    "candidate_count_target": 3,
    "candidate_count_min": 2,
    "candidate_count_max": 4,
    "allow_question_first_route": true
  },
  "ui_contract": {
    "screen": "page_3_first_read_output",
    "require_student_readable_output": true,
    "ban_abstraction_heavy_direction_lines": true
  },
  "trace": {
    "prompt_version": "string",
    "module_version": "string",
    "scoring_version": "string"
  }
}
```

## 4. REQUEST FIELD RULES

### request_id

Unique per request.

### case_id

Stable identifier for this student case/session.

### user_id

User identifier or anonymized internal key.

### input.raw_text

Required.  
This is the student’s notes, paragraph, draft excerpt, or rough material.

### input.entry_mode

Required.  
Allowed values:

- notes
- draft

### application_context

Optional but recommended.  
Used to preserve future compatibility with broader essay workflows.

### generation_config.candidate_count_target

Recommended default: 3

### allow_question_first_route

If true, service may decide not to show strongest direction immediately and instead return a clarifying-question route.

## 5. RESPONSE SCHEMA OVERVIEW

The service must return:

- strongest-direction artifact for frontend
- full candidate set
- candidate scores
- rejection info
- routing decision
- confidence info
- trace/debug-safe metadata

### Response body

```json
{
  "request_id": "string",
  "case_id": "string",
  "status": "ok | regen_required | fail_closed",
  "route_decision": "show_strongest_direction | ask_question_before_showing | regen_candidates | fail_closed",
  "confidence_band": "high | medium | low",
  "top_candidate_id": "string",
  "score_summary": {
    "top_score": 0.0,
    "runner_up_score": 0.0,
    "score_margin": 0.0
  },
  "frontend_artifact": {},
  "candidates": [],
  "rejected_candidates": [],
  "clarifying_question": null,
  "trace": {
    "prompt_version": "string",
    "module_version": "string",
    "scoring_version": "string"
  }
}
```

## 6. FRONTEND ARTIFACT SCHEMA

This is the payload used to render Page 3.

```json
{
  "frontend_artifact": {
    "direction_label": "Your strongest direction is likely:",
    "direction_line": "string",
    "why_heading": "Why this stands out",
    "why_text": "string",
    "evidence_heading": "What in your notes points there",
    "evidence_items": [
      {
        "source_text": "string",
        "source_type": "quote | paraphrase",
        "meaning_note": "string"
      }
    ],
    "primary_cta": {
      "label": "Build from this direction",
      "action": "build_from_direction"
    },
    "secondary_cta": {
      "label": "Ask me one question to sharpen it first",
      "action": "ask_question"
    }
  }
}
```

### Frontend artifact rules

- direction_line must be concrete and student-readable
- why_text must be 2–4 sentences max
- evidence_items length must be 1 or 2
- meaning_note must explain what the line reveals, not give generic function labels

## 7. CANDIDATE OBJECT SCHEMA

Every candidate must be returned in structured form.

```json
{
  "candidate_id": "string",
  "direction_line": "string",
  "direction_summary": "string",
  "core_tension": "string",
  "before_state": "string",
  "after_state": "string",
  "evidence_spans": [
    {
      "text": "string",
      "start_char": 0,
      "end_char": 0
    }
  ],
  "why_strong": "string",
  "risk_if_chosen": "string",
  "clarifying_question_if_uncertain": "string",
  "scores": {
    "student_specificity": 0.0,
    "evidence_grounding": 0.0,
    "non_genericity": 0.0,
    "buildability": 0.0,
    "distinctness": 0.0,
    "scene_strength": 0.0,
    "reflective_potential": 0.0,
    "explanation_coherence": 0.0,
    "clarification_need": 0.0,
    "total_score": 0.0
  },
  "validator_flags": {
    "has_banned_abstraction": false,
    "is_too_generic": false,
    "has_clear_evidence": true,
    "is_distinct_from_others": true,
    "passes_minimum_quality": true
  },
  "rank": 1,
  "selected": true
}
```

## 8. CANDIDATE FIELD REQUIREMENTS

### direction_line

Required.  
This is the short student-facing angle line.

Must:

- name an actual essay angle
- be concrete
- be plain English
- avoid abstract AI-ish phrasing

Must not:

- rely on generic wrappers
- sound like model reasoning
- be a vague category label

### direction_summary

Required.  
Internal/structured summary of the angle in 1–3 sentences.

### core_tension

Required.  
A short description of the main tension or interpretive center.

### before_state / after_state

Required when applicable.  
Used to support clearer direction logic and later downstream drafting.

### evidence_spans

Required.  
At least 1 span, target 2.

### why_strong

Required.  
Internal explanation of why this candidate is strong.

### risk_if_chosen

Required.  
Describes likely weakness if this direction is pursued.

### clarifying_question_if_uncertain

Required unless candidate is very high-confidence and fully formed.

## 9. REJECTED CANDIDATE SCHEMA

Rejected candidates must not disappear silently.

```json
{
  "candidate_id": "string",
  "direction_line": "string",
  "rejection_reasons": [
    "generic_angle",
    "weak_evidence",
    "abstraction_heavy_language",
    "redundant_with_stronger_candidate"
  ]
}
```

### Allowed rejection reason enums

- generic_angle
- weak_evidence
- no_clear_scene_or_tension
- abstraction_heavy_language
- redundant_with_stronger_candidate
- schema_invalid
- explanation_not_grounded
- insufficient_distinctness

## 10. ROUTE DECISION CONTRACT

### show_strongest_direction

Use when:

- top candidate passes quality bar
- confidence sufficient
- route can safely render Page 3 strongest-direction artifact

### ask_question_before_showing

Use when:

- candidate set is promising but under-specified
- top candidate narrowly beats runner-up
- one question is likely to materially improve direction selection

### regen_candidates

Use when:

- candidate set is weak
- candidates are too generic
- candidates are not sufficiently distinct

### fail_closed

Use when:

- no valid candidate survives
- schema or evidence failure prevents safe output

## 11. CLARIFYING QUESTION SCHEMA

If route is ask_question_before_showing, return:

```json
{
  "clarifying_question": {
    "question_text": "string",
    "linked_candidate_id": "string",
    "question_reason": "disambiguate_tension | clarify_shift | strengthen_scene | resolve_candidate_tie"
  }
}
```

### Clarifying question rules

The question must:

- be tied to the top or near-top candidate
- be specific to this student’s material
- sharpen the likely strongest direction

Must not:

- be generic essay coaching
- ask broad reflection questions
- feel reusable across many students

## 12. SCORING CONTRACT

### Score range

All dimension scores must be floats in [0.0, 1.0].

### Required score fields

- student_specificity
- evidence_grounding
- non_genericity
- buildability
- distinctness
- scene_strength
- reflective_potential
- explanation_coherence
- clarification_need
- total_score

### Scoring note

clarification_need is not part of final weighted score by default. It is used in routing logic.

### Weighted total

Default weighted total:

```text
total_score =
0.24 * student_specificity +
0.20 * evidence_grounding +
0.16 * non_genericity +
0.14 * buildability +
0.10 * scene_strength +
0.08 * reflective_potential +
0.05 * distinctness +
0.03 * explanation_coherence
```

## 13. VALIDATOR FLAGS CONTRACT

Each candidate must expose machine-readable validator flags.

### Required flags

- has_banned_abstraction
- is_too_generic
- has_clear_evidence
- is_distinct_from_others
- passes_minimum_quality

### Minimum-quality rule

If passes_minimum_quality = false, candidate cannot be selected.

## 14. ABSTRACTION FILTER CONTRACT

The service must support anti-abstraction detection.

### Banned or risky direction-line phrasing

Reject or penalize when these appear as core angle language without concrete grounding:

- clearest direction
- strongest version
- shift in your role
- first instinct
- standard you now apply
- visible shift
- concrete after-effect
- what changed in that setting
- stronger center
- real turn

### Behavior

This should set:

- has_banned_abstraction = true

and typically trigger rejection or strong penalty

## 15. FRONTEND RENDERING RULES

The frontend must render from frontend_artifact, not from ad hoc recomposition of raw candidate data.

### Reason

This prevents:

- direction/evidence mismatch
- regenerated mush replacing scored candidate language
- drift between selected candidate and displayed page

### Exception

The frontend may style or truncate visually, but must not reinterpret the underlying chosen direction.

## 16. LOGGING CONTRACT

The service must emit loggable structured output.

### Required log object

```json
{
  "request_id": "string",
  "case_id": "string",
  "route_decision": "string",
  "confidence_band": "string",
  "top_candidate_id": "string",
  "candidate_count": 0,
  "rejected_candidate_count": 0,
  "candidates": [],
  "rejected_candidates": [],
  "frontend_artifact": {},
  "clarifying_question": null,
  "trace": {}
}
```

### Required persistence behavior

Store:

- request payload
- full candidate set
- scores
- selected candidate
- route decision
- rendered artifact
- follow-up user action if available

## 17. ERROR / FAIL-CLOSED CONTRACT

### If schema invalid

Return:

```json
{
  "status": "fail_closed",
  "route_decision": "fail_closed"
}
```

### If all candidates rejected

Return:

```json
{
  "status": "regen_required",
  "route_decision": "regen_candidates"
}
```

### If low-confidence but valid

Return:

```json
{
  "status": "ok",
  "route_decision": "ask_question_before_showing"
}
```

The system must never silently degrade into generic filler just to return something.

## 18. EXAMPLE RESPONSE — SHOW STRONGEST DIRECTION

```json
{
  "request_id": "req_123",
  "case_id": "case_456",
  "status": "ok",
  "route_decision": "show_strongest_direction",
  "confidence_band": "high",
  "top_candidate_id": "cand_2",
  "score_summary": {
    "top_score": 0.87,
    "runner_up_score": 0.73,
    "score_margin": 0.14
  },
  "frontend_artifact": {
    "direction_label": "Your strongest direction is likely:",
    "direction_line": "the moment you stopped trying to keep the room orderly and chose to stay beside her",
    "why_heading": "Why this stands out",
    "why_text": "This feels strongest because it moves from classroom setup into a choice that shows what mattered to you in that moment. Staying beside her gives the essay a clearer focus than a general summary of the scene.",
    "evidence_heading": "What in your notes points there",
    "evidence_items": [
      {
        "source_text": "I was lining up crayons next to a coloring book...",
        "source_type": "quote",
        "meaning_note": "This shows how focused you were on keeping the room orderly before your attention shifted."
      },
      {
        "source_text": "So I sat beside her as she colored.",
        "source_type": "quote",
        "meaning_note": "This is where the essay stops being about the room and starts being about your choice to stay with her."
      }
    ],
    "primary_cta": {
      "label": "Build from this direction",
      "action": "build_from_direction"
    },
    "secondary_cta": {
      "label": "Ask me one question to sharpen it first",
      "action": "ask_question"
    }
  },
  "candidates": [],
  "rejected_candidates": [],
  "clarifying_question": null,
  "trace": {
    "prompt_version": "p3.2",
    "module_version": "nds_v1",
    "scoring_version": "score_v1"
  }
}
```

## 19. EXAMPLE RESPONSE — ASK QUESTION BEFORE SHOWING

```json
{
  "request_id": "req_789",
  "case_id": "case_999",
  "status": "ok",
  "route_decision": "ask_question_before_showing",
  "confidence_band": "low",
  "top_candidate_id": "cand_1",
  "score_summary": {
    "top_score": 0.68,
    "runner_up_score": 0.65,
    "score_margin": 0.03
  },
  "frontend_artifact": null,
  "candidates": [],
  "rejected_candidates": [],
  "clarifying_question": {
    "question_text": "When you sat beside her, were you trying to calm the room down, or were you more focused on her specifically?",
    "linked_candidate_id": "cand_1",
    "question_reason": "resolve_candidate_tie"
  },
  "trace": {
    "prompt_version": "p3.2",
    "module_version": "nds_v1",
    "scoring_version": "score_v1"
  }
}
```

## 20. ENGINEERING ACCEPTANCE CRITERIA

This addendum is not implemented unless all of the following are true.

- POST /ai/narrative-direction-selection/analyze accepts structured input
- service generates 2–4 candidates
- candidates are returned as structured objects
- rejected candidates are surfaced with reasons
- score dimensions are explicit
- total score is explicit
- route decision is explicit
- confidence band is explicit
- strongest-direction frontend artifact is returned when appropriate
- clarifying-question artifact is returned when appropriate
- frontend artifact is derived from selected candidate, not recomposed ad hoc
- backend preserves full ranked-candidate state
- fail-closed / regen behavior exists
- logs are schema-compatible for later review/training

## 21. FAILURE CONDITIONS

Reject implementation if:

- service still effectively returns one prose blob
- candidates are not inspectable
- selection logic is opaque
- rejected candidates vanish silently
- clarifying question path is missing
- frontend artifact can drift from selected candidate
- route decision is implicit instead of explicit
- fail-closed behavior is absent
- current architecture is flattened into one shallow output path

## 22. BUILD SUMMARY

This addendum gives engineering the concrete API contract needed to add a scoring layer without damaging the current product.

It ensures the service can:

- generate multiple candidate directions
- score them explicitly
- choose the strongest one
- ask a clarifying question when needed
- preserve the richer backend intelligence contract
- render a clean frontend artifact from the selected candidate

This is the correct next step after stabilizing the current Page 3 output.
