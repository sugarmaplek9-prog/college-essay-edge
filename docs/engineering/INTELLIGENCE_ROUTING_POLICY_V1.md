# INTELLIGENCE_ROUTING_POLICY_V1
## The College Admissions Edge
### v1 Intelligence Routing Policy

---

## 1. Purpose

This document defines how the product decides:

- which module to run
- when to run it
- when not to run it
- when to retry
- when to narrow scope
- when to ask for more input
- when to stop

This is the decision policy that keeps the system from behaving like an open-ended chatbot.

---

## 2. Core Routing Principle

The system should route based on workflow need, not on user proximity to an AI surface.

**Core rule**

Do not run intelligence just because the user is on a screen. Run intelligence only when a bounded product job is actually needed.

---

## 3. Routing Layers

Routing should happen across four decision layers:

- trigger routing
- module routing
- quality routing
- fallback routing

---

## 4. Trigger Routing

The system should only invoke modules from defined trigger types.

### Approved trigger types

- `artifact_created`
- `artifact_updated`
- `user_initiated`
- `state_change`
- `system_refresh`

### Examples

- onboarding completed → Edge Snapshot eligible
- new story saved → Story Vault Analysis refresh eligible
- user asks for direction help → Narrative Direction Selection eligible
- draft submitted → Essay Feedback eligible
- supplement prompt opened with enough context → Supplement Angle Suggestion eligible

---

## 5. Launch Module Routing Map

### Edge Snapshot

Run when:

- onboarding is completed
- discovery responses materially change

Do not run when:

- only essay drafts changed
- supplement state changed alone

### Story Vault Analysis

Run when:

- story entries are added or edited
- user requests story analysis

Do not run when:

- no Story Vault material exists

### Narrative Direction Selection

Run when:

- there is enough discovery/story material
- user requests help choosing a direction

Do not run when:

- source material is too thin
- no plausible narrative signals exist

### Outline Generation

Run when:

- a direction has been selected

Do not run when:

- no direction exists
- selected direction is too vague

### Essay Feedback

Run when:

- a draft exists and is submitted for review

Do not run when:

- draft is too fragmentary for meaningful diagnosis

### Supplement Angle Suggestion

Run when:

- school + prompt exist
- enough student context exists to ground angles

Do not run when:

- prompt exists but no usable student material exists

### Overlap Warning

Run when:

- multiple essay artifacts exist
- package state changed materially

Do not run when:

- only one essay artifact exists

---

## 6. Quality Routing Before Generation

Before generation, the system must assess readiness.

### Readiness states

- `high_readiness`
- `medium_readiness`
- `low_readiness`

### Routing behavior

**High readiness**

- Run module in standard mode.

**Medium readiness**

- Run module in reduced-scope mode if needed.

**Low readiness**

- Do not force normal generation.
- Convert to:
  - `needs_more_input`
  - or narrower diagnostic mode

**Rule**

Weak context should route to honesty, not to generic filler.

---

## 7. Execution Modes

- `standard_generation`
  - Use when full bounded output is appropriate.
- `reduced_scope`
  - Use when a smaller artifact is safer or sharper than a broad one.
- `diagnostic_only`
  - Use when the system should analyze rather than recommend.
- `needs_more_input`
  - Use when source quality is too weak.
- `refresh_mode`
  - Use when recalculating an existing artifact after a state change.

---

## 8. Retry Routing

Retries should be routed by failure type.

- **Structural failure**
  - Retry with tighter schema pressure.
- **Semantic weakness**
  - Retry with fewer items and stronger decision pressure.
- **Brand/genericity weakness**
  - Retry with stronger anti-generic constraints.
- **Authenticity weakness**
  - Do not broaden. Narrow to diagnosis or block.

### Retry limits

Maximum retries per invocation should be bounded.
If retries do not improve quality, route to fallback.

---

## 9. Fallback Routing

Fallback must preserve truth.

### Safe fallback outcomes

- fewer stronger outputs
- partial structured output
- needs-more-input
- diagnostic-only output

### Unsafe fallback outcomes

- motivational filler
- fake certainty
- polished but empty output
- hidden rewrite behavior

---

## 10. Provider Routing for v1

Keep this simple in v1.

### v1 policy

- one primary provider
- one optional fallback provider only if necessary
- routing policy remains product-owned
- no dynamic black-box provider routing in v1

### Why

The goal of v1 is differentiated quality, not infrastructure complexity.

---

## 11. Review Routing

The system should route certain artifacts into review queues.

Route to review if:

- genericity risk is high
- authenticity risk is high
- validator outcome is borderline
- core moat module produced low-confidence output
- post-change artifact needs checking
- artifact is benchmark candidate quality
- artifact appears false-pass or false-block

---

## 12. Routing Priorities

When routing conflicts exist, prioritize:

1. authenticity protection
2. anti-generic protection
3. student-specific usefulness
4. clean structural output
5. speed or convenience

This should stay true product-wide.

---

## 13. Final Directive

Routing is where the system decides whether it behaves like a disciplined product or a generic assistant.

The purpose of this policy is to ensure:

- the right module runs
- at the right time
- with the right scope
- under the right constraints
- and stops when truth is weak

That is the routing standard for v1.
