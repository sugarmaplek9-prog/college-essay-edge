# STRUCTURED_BLANK_PAGE_INTAKE_V1

**College Essay Edge**  
**First-minute recovery system for topic-only and scene-less users**  
**MIT-level engineering spec**  
**Status: Required product-system spec**  
**Program status: Post–live hard-block recalibration follow-on**

---

## Purpose

This spec defines a dedicated intake path for users who arrive with:

- no clear story yet
- only a topic
- only a trait/theme
- only a broad activity or interest
- uncertainty such as:
  - “I like this topic, but I’m not sure it says enough about me”
  - “I want to write about X, but I don’t know what the actual essay is”
  - “I have a few ideas, but none feels like a real story yet”

This is **not** the normal NDS path.
It is a **structured recovery lane** for users who are not ready for standard directional ranking yet, but are not truly blocked.

The goal is to turn:

**vague topic energy**  
into  
**recoverable narrative signal**

without:

- fake specificity
- false-premium direction
- over-blocking
- generic “say more” clarification

This is the productization of the successful low-signal clarification lane proven in live hard-block recalibration.

---

## 1. Core product goal

Help blank-page and topic-only users move from:

> “I have an idea but not a story”

to

> “I can now see the real center worth exploring.”

This system should:

- identify when the user is blank-page / topic-only
- avoid pretending a full direction already exists
- ask the right structured recovery question(s)
- extract usable narrative signal
- prepare the user for NDS direction generation once enough signal exists

This is **not** an essay-writing assistant.  
It is a **story-center discovery system**.

---

## 2. Product principle

**Do not force a direction before the story exists.**

That is the governing rule.

If the user has:

- a topic but no hinge
- an activity but no center
- an interest but no moment
- a trait but no lived signal

then the product should **not** act like it already knows the best essay direction.

Instead, it should:

- help the user surface the missing center
- identify the kind of signal that is missing
- ask the sharpest next question
- preserve dignity and forward motion

---

## 3. Why this system exists

The live hard-block recalibration sprint proved that some hard-block cases were actually:

- recoverable low-signal cases
- blank-page or scene-less users
- scope/reframe users
- topic-only users

These users were not best served by:

- hard block
- weak direction generation

They were best served by:

- structured clarification

This spec turns that ad hoc success into a **first-class product system**.

---

## 4. User types

This system must detect and handle the following user types differently.

### Type A — Topic-only
Examples:
- “I want to write about gardening.”
- “Can I write about coding?”
- “Can my essay be about volunteering?”

### Type B — Theme-only
Examples:
- “I want to show resilience.”
- “I want to write about growth.”
- “I want to show leadership.”

### Type C — Activity-only
Examples:
- “I’m between robotics and debate.”
- “I want to write about soccer.”
- “I did a lot of volunteering.”

### Type D — Scope-uncertain
Examples:
- “I don’t know if this says enough about me.”
- “I’m not sure this is deep enough.”
- “I have a topic but not a story.”

### Type E — Blank-page
Examples:
- “I have no idea what to write about.”
- “Nothing feels special enough.”
- “I don’t know where to start.”

---

## 5. Non-negotiable rules

### Rule 1
Do not produce a full-strength NDS direction when there is no real story signal yet.

### Rule 2
Do not hard block blank-page users unless the input is truly unusable.

### Rule 3
Do not ask generic filler questions like:

- “Can you say more?”
- “What did you learn?”
- “Can you add details?”

unless tied to a specific missing-signal type.

### Rule 4
Do not reward only polished users.
This path must work for weak, awkward, rough inputs.

### Rule 5
Do not collapse everything into the same prompt.
This must be structured and typed.

---

## 6. System objective

This system should classify the user into one of several blank-page intake modes and then produce the correct recovery behavior.

### Required modes

- `topic_probe`
- `theme_probe`
- `activity_probe`
- `scope_reframe`
- `blank_page_discovery`
- `too_thin_to_recover` (rare)

The mode should determine:

- question style
- number of prompts
- allowed next-step UI
- whether NDS can run after one answer or requires more discovery

---

## 7. Required detection layer

### 7.1 Blank-page intake classifier

Before standard NDS direction generation, run a detector that classifies the input as:

- `ready_for_nds`
- `needs_structured_blank_page_intake`
- `true_block`

#### Detection signals for `needs_structured_blank_page_intake`

Examples:

- topic nouns with no event signal
- trait language with no scene
- “can I write about X?”
- “I’m between X and Y”
- “I don’t know if this says enough about me”
- “I have no idea what to write about”
- broad activity listing without hinge
- extremely low scene evidence but real topic intent

#### Detection signals for `true_block`

Examples:

- incoherent input
- no usable topic intent
- empty/no-content input
- unsupported or irrelevant request type
- severe malformed state where no recovery question is possible

### 7.2 Required debug fields

Expose:

- `blank_page_intake_detected`
- `blank_page_mode`
- `blank_page_trigger_signals`
- `blank_page_recovery_reason`
- `blank_page_confidence`

---

## 8. Mode definitions

### 8.1 `topic_probe`

**Use when**  
The user offers a topic or area, but not a story.

Example:
- “I want to write about gardening.”

**Goal**  
Find the lived center behind the topic.

**Required question style**  
Ask for:

- a moment
- a change
- a conflict
- a responsibility
- a realization
- a person-centered detail

**Example output pattern**  
“Gardening can work — but not as a topic by itself. What I need to know is: was there a moment in gardening that changed how you saw yourself, another person, or what you were responsible for?”

### 8.2 `theme_probe`

**Use when**  
The user offers a theme like growth, resilience, leadership, identity.

Example:
- “I want to show resilience.”

**Goal**  
Move from abstract trait to lived event.

**Required question style**  
Ask for:

- the moment the trait became visible
- the actual situation
- the turning point
- what was at stake

**Example output pattern**  
“‘Resilience’ is not the essay yet. What matters is the moment where that quality became visible. What actually happened, and what changed because of it?”

### 8.3 `activity_probe`

**Use when**  
The user offers an activity, role, or domain but not the real center.

Example:
- “I want to write about robotics.”

**Goal**  
Separate activity topic from actual essay center.

**Required question style**  
Ask for:

- a surprising moment
- a failure or shift
- a conflict
- a person-dependent moment
- a decision that mattered

**Example output pattern**  
“Robotics might be the setting, but the essay is usually not ‘about robotics.’ Was there a moment inside it where your role changed, your assumptions broke, or you realized something you hadn’t seen before?”

### 8.4 `scope_reframe`

**Use when**  
The user already senses the problem:

- “I don’t know if this says enough about me.”

**Goal**  
Help them evaluate whether the topic contains real essay material.

**Required question style**  
Ask whether the topic reveals:

- change
- responsibility
- conflict
- a relationship
- a choice
- a shift in self-understanding

**Example output pattern**  
“The right question is not whether gardening is impressive enough. It’s whether there’s a moment inside it that reveals something real about how you think, care, change, or take responsibility.”

### 8.5 `blank_page_discovery`

**Use when**  
The user has no topic and no direction.

Example:
- “I have no idea what to write about.”

**Goal**  
Find promising story zones.

**Required question style**  
Ask structured discovery prompts across:

- moments of responsibility
- conflict
- embarrassment/failure
- care/duty
- changed assumptions
- becoming different from who they were before

**Example output pattern**  
“Let’s not start with ‘the best topic.’ Start with this: when have you felt more responsible than you expected to? Or when did something small end up changing how you thought or acted?”

### 8.6 `too_thin_to_recover`

**Use when**  
Even structured discovery cannot proceed.

**Goal**  
Fail usefully, not bluntly.

**Allowed response**  
A dignity-preserving recovery message with one structured restart path.

---

## 9. Required question system

### 9.1 Question design requirements

Every blank-page recovery question must be:

- targeted
- non-generic
- low-shame
- scene-seeking
- center-seeking
- brief enough to answer
- strong enough to produce next-step signal

### 9.2 Question categories

Questions must be drawn from structured families:

- `moment_question`
- `hinge_question`
- `responsibility_question`
- `person_over_task_question`
- `conflict_question`
- `change_question`
- `scope_reframe_question`
- `blank_page_discovery_question`

### 9.3 Banned question styles

Do not use:

- vague “tell me more”
- generic self-help phrasing
- admissions-cliché wording
- therapy-like overreach
- fake-premium introspection prompts

---

## 10. Required output contract

The blank-page intake response must return structured data, not just prose.

### Required payload fields

- `product_mode = blank_page_intake`
- `blank_page_mode`
- `why_not_ready_for_direction`
- `recovery_question_primary`
- `recovery_question_secondary` (optional)
- `missing_signal_type`
- `topic_candidate` (optional)
- `recovery_confidence`
- `next_step_type`

Allowed `next_step_type` values:

- `answer_question_then_run_nds`
- `answer_one_of_two_questions`
- `needs_more_discovery`
- `too_thin_to_recover`

### Optional UI-support fields

- `reassurance_copy`
- `example_answer_shape`
- `what_good_signal_would_look_like`

### Reference payload shape

```json
{
  "product_mode": "blank_page_intake",
  "blank_page_mode": "topic_probe",
  "why_not_ready_for_direction": "The topic is real, but there is not enough lived signal yet to rank an essay direction honestly.",
  "recovery_question_primary": "Was there a moment inside gardening where your role changed, your assumptions broke, or you realized something you had not seen before?",
  "recovery_question_secondary": "If not, was there a responsibility, conflict, or person-centered moment that made gardening matter more than it first seemed?",
  "missing_signal_type": "topic_without_hinge",
  "topic_candidate": "gardening",
  "recovery_confidence": "low",
  "next_step_type": "answer_question_then_run_nds",
  "reassurance_copy": "You are not blocked — we just need the real center behind the topic.",
  "example_answer_shape": "For example: 'One Saturday, my neighbor asked me to help rebuild her raised beds after a storm, and that changed how I saw gardening from hobby to responsibility.'",
  "what_good_signal_would_look_like": "A concrete moment, person, decision, conflict, or change in how you acted afterward.",
  "debug": {
    "blank_page_intake_detected": true,
    "blank_page_mode": "topic_probe",
    "blank_page_trigger_signals": [
      "topic_noun_present",
      "scene_evidence_absent",
      "help_seeking_question"
    ],
    "blank_page_recovery_reason": "topic_without_story_center",
    "blank_page_confidence": "medium"
  }
}
```

---

## 11. Required UI behavior

### 11.1 User-facing experience

The UI must clearly communicate:

- you are not blocked
- your topic may still work
- we just need the real center behind it
- the next question is supposed to help uncover that center

### 11.2 Tone requirements

Tone must be:

- respectful
- calm
- specific
- non-patronizing
- non-robotic
- not overly cheery
- not overly academic

### 11.3 Required CTA design

The next step should feel like:

> “answer this so we can find the story”

not

> “we don’t have enough information”

### 11.4 UI states

The interface should support:

- a dedicated blank-page intake card/header
- one primary recovery question
- optional secondary route only when it reduces abandonment
- reassuring copy that preserves dignity
- visible progress state: `Step 1: find the center`

---

## 12. Required conversion logic

### Goal

Once the user answers the blank-page recovery question, the system must know how to continue.

### Required paths after user answer

- if enough signal now exists → `direction_light` or full NDS prep
- if still weak but recoverable → another typed recovery question
- if still truly insufficient → low-shame block/restart path

### Important rule

Do **not** loop endlessly in blank-page mode.
There must be:

- progress
- escalation
- or useful stop

### Recommended turn policy

- max 1 structured recovery question before reevaluating NDS readiness
- max 2 blank-page turns before forced branch:
  - clarification with sharper typed prompt
  - or dignity-preserving restart path

### Post-answer decision contract

After each recovery answer, evaluate:

- `signal_gain_detected`
- `scene_evidence_present`
- `center_candidate_present`
- `hinge_candidate_present`
- `route_after_blank_page_answer`

---

## 13. Required debug / telemetry

Track at minimum:

- `blank_page_mode`
- `recovery_question_type`
- `answer_received`
- `post_answer_route`
- `blank_page_to_direction_conversion`
- `blank_page_to_clarification_repeat`
- `blank_page_to_block`
- `user_abandon_after_blank_page`
- `user_continue_after_blank_page`

### Additional recommended telemetry

- `blank_page_detection_confidence`
- `blank_page_trigger_signals`
- `recovery_question_token_length`
- `recovery_answer_signal_gain`
- `recovery_answer_scene_specificity_delta`
- `recovery_answer_hinge_detected`
- `recovery_mode_repeat_count`

These metrics are essential. This system is only good if it actually helps users move forward.

---

## 14. Required evaluation plan

Create a dedicated evaluation path for blank-page intake.

### Corpus requirement

Use real-input cases primarily from:

- public essay-help posts
- public “what should I write about?” posts
- anonymized real product inputs

**At least 70% real-input sourced.**

### Required test groups

- topic-only
- theme-only
- activity-only
- scope-uncertain
- blank-page
- weak-topic but recoverable
- truly insufficient

### Required evaluation dimensions

- recovery usefulness
- question specificity
- dignity / trust
- conversion to direction
- overblocking avoidance
- false direction avoidance

### Suggested benchmark outputs

For each case, capture:

- input class
- expected blank_page_mode
- recovery question quality
- whether question is typed correctly
- whether response preserves dignity
- whether post-answer route is appropriate
- whether system avoided false direction inflation

---

## 15. Required success metrics

This system is successful only if it materially improves:

- recovery usefulness for blank-page users
- conversion from topic-only to directional readiness
- reduction in unnecessary hard blocks
- real-user simulation on blank-page flows
- student trust in the first minute

### Anti-success rule

It does **not** count as success if more users get a show result but the result is fake, generic, or weak.

### Suggested operational thresholds

- hard-block rate on blank-page/topic-only traffic decreases materially
- typed-question specificity rating improves vs generic clarification baseline
- blank-page users who answer the first recovery prompt convert to stronger routes at a measurable rate
- false-direction rate does not increase
- real-user-sim remains PASS

---

## 16. Non-regression requirements

Any implementation must preserve:

- evidence grounding
- direction-line fit
- direction stability
- screen trust
- flow integrity
- session/state integrity
- real-user-sim

Especially:

this path must **not** degrade the strong clarification behavior already earned.

---

## 17. Required artifacts

Produce:

### JSON artifact
- `structured_blank_page_intake_v1.json`

### Markdown artifact
- `STRUCTURED_BLANK_PAGE_INTAKE_V1.md`

---

## 18. Failure conditions

This system fails if:

- it becomes generic advice
- it asks vague filler questions
- it overproduces false directions
- it creates user shame or confusion
- it loops without progress
- it uses mostly synthetic test cases
- it degrades real-user-sim or first-minute trust

---

## 19. Release criteria

Do not promote this path widely unless:

- it improves blank-page recovery
- it preserves trust
- it converts users toward real direction work
- it is validated primarily on real-input cases

### Minimum release gate

- dedicated blank-page eval set exists
- real-input sourcing threshold is met
- typed recovery questions pass review
- post-answer routing is auditable
- trust regressions are green
- no broad show inflation detected

---

## 20. Build summary

This system exists to solve a real product problem:

many users do not arrive with a story — they arrive with only a topic, a trait, an activity, or uncertainty.

A world-class product should not:

- block them
- fake a direction
- ask useless generic questions

It should help them find the real center.

That is what `STRUCTURED_BLANK_PAGE_INTAKE_V1` is for.
