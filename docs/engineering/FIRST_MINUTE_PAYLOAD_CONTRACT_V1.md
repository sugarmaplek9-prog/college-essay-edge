# First-Minute Payload Contract v1

## Purpose

This document is the working FE/BE contract for the corrected first-minute product slice.
It defines the derived result shape required to render the corrected homepage follow-through,
reflection reframe, strongest-direction actionability, and compare-screen judgment.

This contract does **not** require a major backend architecture change.
Fields may be generated directly by the orchestrator or derived from the canonical intake object,
but the frontend should be able to rely on these meanings.

---

## Canonical Input

Primary source object:

- `IntakeIntelligenceObject`

Existing canonical fields still drive routing:

- `recommendation_viability.decision`
- `escalation.blocking`
- `next_question`
- `narrative_pattern.primary_pattern`
- `usable_signal.signal_strength`

---

## Corrected Reflection Contract

These fields support the reflection screen and must render in plain English.

### Required reflection fields

- `what_this_is_really_about: string`
- `why_that_matters: string`
- `where_the_essay_lives: string`

### Field meanings

- `what_this_is_really_about`
  - the plain-English meaning of the material
  - should translate the material into a real essay center
  - must not sound like classification output

- `why_that_matters`
  - why this center is stronger or more revealing than the surface-level topic
  - should help the user understand why the angle matters strategically

- `where_the_essay_lives`
  - where the actual essay energy sits
  - usually names the moment, turn, correction, or realization that should anchor the draft

### Reflection copy rules

- ban phrases like:
  - `I'm seeing`
  - `we detected`
  - `narrative pattern identified`
  - `confidence score`
  - `model`
  - `AI analysis`
- reflection must read like strategic human guidance, not machine output

---

## Corrected Strongest-Direction Contract

These fields support the corrected strongest-direction screen.

### Required direction fields

- `angle_title: string`
- `angle_subtitle: string`
- `plain_english_theme: string`
- `why_this_is_strongest: string`
- `essay_build_steps: string[]`
- `risk_if_miswritten: string`
- `best_next_move: string`
- `opening_scene_hint: string`
- `turning_point_hint: string`
- `ending_hint: string`

### Field meanings

- `angle_title`
  - the named directional frame
  - may be more abstract, but must always be paired with subtitle + theme

- `angle_subtitle`
  - plain-English clarification under the title
  - should explain the title in one read

- `plain_english_theme`
  - what the essay is really about
  - should remove ambiguity immediately

- `why_this_is_strongest`
  - strategic explanation of why this angle beats the flatter obvious version
  - should sound judgment-forward, not diplomatic

- `essay_build_steps`
  - 3–5 short sequence steps
  - should create immediate forward motion toward a real draft

- `risk_if_miswritten`
  - what could weaken the essay if the user writes the angle badly
  - should be concrete and easy to understand

- `best_next_move`
  - one action the student can do immediately
  - should start real progress, not give vague encouragement

- `opening_scene_hint`
  - how the draft should likely begin

- `turning_point_hint`
  - where the internal or structural turn should occur

- `ending_hint`
  - what kind of ending should land the essay

---

## Corrected Compare Contract

Each compare card should feel like a real essay consequence, not a label.

### Required compare fields per card

- `title: string`
- `subtitle: string`
- `essay_focus: string`
- `why_it_works_or_loses: string`
- `risk_if_written_this_way: string`
- `how_it_would_likely_start: string`
- `action_label: string`
- `is_strongest: boolean`

### Compare rules

- the stronger card must feel decisively better
- the weaker card must lose for understandable reasons
- weaker card language must be honest, not diplomatic
- compare should create conviction, not balanced indecision

---

## Fallback Rules

- if optional sharpening support is absent, strongest-direction still renders fully
- if `next_question` exists, `best_next_move` may convert that question into an action
- if richer derived fields are not generated upstream, frontend derivation is acceptable as long as field meaning remains stable

---

## Review Gate

The payload contract is only acceptable if the rendered product makes the following true for a first-time user:

- they understand what the essay is really about
- they understand why the strongest angle wins
- they know what to do next
- they can see why the weaker version loses
- the experience does not feel like generic AI output