# Output Presentation Rules v1

## College Essay Edge — First-Minute Experience

**Status: LOCKED**
**Applies to: all first-minute product output surfaces (FM-06, FM-07, FM-08, FM-09)**

These rules govern how intake intelligence outputs are translated into visible product content.
They sit between the `IntakeIntelligenceObject` and the rendered UI.
No output can bypass these rules.

---

## 1. Observation Rendering Rules (FM-06)

### 1.1 Count

Render exactly **2–3 observations**. Never 1, never 4+.

If only 1 observation can be derived from the intake result: suppress the reflection screen and route directly to direction result with a single bridging sentence.

### 1.2 Derivation Table

Derive observations from `IntakeIntelligenceObject` using this priority table:

| Priority | Condition | Observation template |
|----------|-----------|---------------------|
| 1 | `primary_pattern = self_correction_arc` AND `signal_strength = high` | "I'm seeing a correction moment: the story gets stronger after the feedback, not before." |
| 2 | `primary_pattern = identity_shift` | "This looks less like an activity essay and more like a 'who I became' story." |
| 3 | `primary_pattern = responsibility_shift` | "What keeps coming through is not what you did, but how the role changed." |
| 4 | `primary_pattern = failure_reinterpretation` | "The interesting part isn't the outcome — it's what the failure revealed." |
| 5 | `primary_pattern = conflict_reframe` | "This isn't really a conflict story. It's a 'what I understood differently' story." |
| 6 | `primary_pattern = usefulness_vs_intention` | "There's a gap here between what you intended and what actually happened. That gap is the essay." |
| 7 | `primary_pattern = competence_vs_responsibility` | "The stronger story may not be about being good at this — it may be about what you chose to do with that." |
| 8 | `authorship_signal = mixed` | "Some of this reads like your voice, and some doesn't yet — that's useful to know." |
| 9 | `signal_strength = medium` AND `narrative_pattern.confidence = medium` | "There may be a stronger story here than the obvious activity angle." |
| 10 | `next_question != null` AND `signal_strength = low` | "There's something here, but one answer would sharpen it fast." |
| 11 | `trusted_evidence.trusted_evidence_rank[0] = story_entry` (not draft) | "The strongest material isn't in the draft — it's in the notes." |

**Selection rule:** Pick the highest-priority 2–3 observations that apply. If fewer than 2 match: use generic observations at positions 9 and 10 as floor.

### 1.3 What Observations Are Not

Observations are not a summary of the student's notes.
Observations are not compliments.
Observations are not instructions.
They are moments of noticing — specific enough to feel intelligent, short enough to feel immediate.

---

## 2. Direction Content Generation Rules (FM-07)

### 2.1 Section 1 — Strongest Direction

**Angle title:** Derive from `primary_pattern` using this map:

| Pattern | Default angle title |
|---------|-------------------|
| `self_correction_arc` | The Correction Moment |
| `identity_shift` | The Shift in How You Saw Yourself |
| `responsibility_shift` | The Moment You Changed the Role |
| `failure_reinterpretation` | What the Failure Revealed |
| `conflict_reframe` | What You Understood Differently |
| `usefulness_vs_intention` | The Gap Between What You Meant and What Happened |
| `competence_vs_responsibility` | Beyond Being Good at It |
| `unknown` | The Thread Worth Following |

**Angle explanation:** 2–4 sentences. Must:
- Name what the essay is actually about (not what the activity is)
- State why this angle is more interesting than the surface version
- Be written in present-tense, direct register
- Not exceed 80 words

### 2.2 Section 2 — Why This Beats the Obvious Version

Must:
- Identify the "obvious version" by name (e.g. "Most debate essays focus on competition results.")
- State specifically what the obvious version would miss
- Be 2 sentences maximum

Must not:
- Be generic ("This approach is more personal and meaningful")
- Complement the student ("Your story is too rich for the obvious angle")
- Use the word "authentic" or "compelling"

### 2.3 Section 3 — What Could Make This Fall Flat

Must:
- Name one specific, concrete failure mode
- Be one sentence
- Use direct language ("If the essay stays in your head and never lands in a scene, the reader won't follow.")

Must not:
- Be vague ("If you don't write it well, it won't work")
- Be multiple risks
- Sound like a warning label

Derive from:
- `contamination_risk = high` → "If the language stays polished and abstract, the reader won't trust it's your voice."
- `signal_strength = medium` → "If the correction moment stays implied rather than shown, the essay loses its anchor."
- `narrative_pattern.confidence = low` → "If the angle isn't confirmed before drafting, you risk writing toward the wrong story."
- `escalation.escalate = true` (advisory) → "There are two competing stories here — make sure you're telling the right one."
- default → "If the essay explains the insight rather than showing the moment it arrived, the voice disappears."

### 2.4 Section 4 — Best Next Move

Must:
- Be exactly one sentence
- Be specific to the current pattern
- Start with an action verb

Derive from `next_question` if non-null: rephrase as a next-move action.
If `next_question = null`: use this map:

| Pattern | Default next move |
|---------|------------------|
| `self_correction_arc` | Write the scene where the feedback landed — just the moment, nothing before it. |
| `identity_shift` | Write two sentences: how you saw the role before, and how you see it now. |
| `responsibility_shift` | Write the moment you decided to stop solving it alone. |
| `failure_reinterpretation` | Write one sentence about what you now know that you couldn't have known without the failure. |
| `conflict_reframe` | Write the moment after the conflict, not the conflict itself. |
| `usefulness_vs_intention` | Write the moment you first noticed the gap between what you meant and what happened. |
| `competence_vs_responsibility` | Write the moment the question shifted from "can you?" to "should you?" |
| `unknown` | Write the moment that keeps coming back to you — just the facts, no interpretation yet. |

---

## 3. Compare Screen Presentation Rules (FM-08)

### 3.1 Angle Count

Always show exactly:
- 1 strongest angle (from FM-07, direction unchanged)
- 1 obvious-but-weaker angle
- 1 additional alternate only if `secondary_patterns` contains a pattern with `confidence = medium` and it is distinct from both above

Never show more than 3 angles under any condition.

### 3.2 Obvious-But-Weaker Angle Derivation

| Primary pattern | Obvious weaker angle | Why it loses |
|-----------------|---------------------|--------------|
| `self_correction_arc` | The Accomplishment Essay | Focuses on what you achieved rather than what changed — leaves out the part that's actually interesting. |
| `identity_shift` | The Activity Description Essay | Describes what you did without saying what it revealed about who you are. |
| `responsibility_shift` | The Leadership Essay | Centers being in charge rather than the moment you understood what leadership required. |
| `failure_reinterpretation` | The Obstacle Essay | Frames the failure as something to overcome rather than something that taught you something new. |
| `conflict_reframe` | The Both-Sides Essay | Tries to be balanced rather than showing what the conflict actually changed. |
| `usefulness_vs_intention` | The Service Essay | Focuses on impact delivered rather than the gap between intention and reality. |
| `competence_vs_responsibility` | The Skills Essay | Lists what you can do rather than what you chose to do with it and why. |
| `unknown` | The Activity Summary | Describes the activity rather than the story inside it. |

### 3.3 Failure Mode Field

The `If you chose this` field (failure mode) must be:
- Specific to the angle, not generic
- One sentence
- Written with the directness of a trusted advisor, not an AI disclaimer

Good: "Most essays that lead with the competition results never escape the resume register."
Bad: "This approach may not fully showcase your unique strengths."

### 3.4 Visual Hierarchy

The strongest angle card must be visually dominant:
- Higher typographic weight on angle title
- Full-width or larger card on desktop
- Top position on mobile stack
- No visual treatment that implies it is one of several equal options

---

## 4. Recovery Screen Rules (FM-09)

### 4.1 Question Selection

Use `IntakeIntelligenceObject.next_question.question_text` verbatim.

If `next_question` is null (routing error — should not reach FM-09), use:
> What changed for you after the thing you're describing happened?

### 4.2 Question Display

- Render as a centered block quotation, typographically distinct
- Not inside a form label
- Not preceded by "Question:"
- No question number

### 4.3 Input Size

Single text area, minimum 80px height, no character counter visible in default state.

---

## 5. State Routing Rules

These routing decisions are strict and not overridable by frontend logic.

| `recommendation_viability.decision` | `escalation.escalate` | Route |
|--------------------------------------|-----------------------|-------|
| `success` | false | FM-06 → FM-07 |
| `reduced_scope` | false | FM-06 → FM-07 (reduced context) |
| `needs_more_input` | false | FM-09 |
| `blocked` | any | Graceful blocked state (see §6) |
| any | true AND `blocking = true` | Graceful blocked state (see §6) |
| any | true AND `blocking = false` | FM-07 with advisory flag visible to operator, not student |

### 5.1 Reduced Scope Presentation Difference

When `viability = reduced_scope`:
- Section 2 ("Why this beats the obvious version") remains visible
- Section 3 risk is drawn from reduced-scope-specific failure modes
- Section 4 next move is always the first clarifying question type for the pattern
- No visible indicator that this is "reduced scope" — the student should not feel like they got a downgrade

---

## 6. Graceful Blocked State

When routing to blocked state, never show:

- "Blocked"
- "Insufficient input"
- Error code
- System state name

Show instead:

**Header:**
> We need a little more to work with

**Body:**
> What you shared gives us a starting point, but the fastest way to move forward is to answer one question — or add a bit more.

**CTAs:**
- Primary: `Add more notes`
- Secondary: `Answer one question`

---

## 7. Content Length Caps

| Element | Maximum |
|---------|---------|
| Observation (per observation) | 1 sentence, ≤ 25 words |
| Angle title | 6 words |
| Angle explanation | 4 sentences, ≤ 80 words |
| Why it beats the obvious version | 2 sentences |
| What could make this fall flat | 1 sentence |
| Best next move | 1 sentence |
| Compare card — why it loses/works | 1 sentence |
| Compare card — failure mode | 1 sentence |
| Recovery explanation | 2 sentences |

These are product-quality caps, not technical limits. Exceeding them means the copy is not sharp enough.

---

## 8. Field Suppression Rules

If a required field cannot be populated from the `IntakeIntelligenceObject`:

| Missing data | Suppression rule |
|-------------|-----------------|
| No `primary_pattern` (unknown) | Use "The Thread Worth Following" angle title and default next move |
| No `next_question` | Suppress tertiary CTA on FM-07; skip to best-next-move default map |
| `school_context_use = ignore` | Do not mention school context on FM-07 under any condition |
| `escalation.escalate = true` AND `blocking = false` | Do not surface the advisory flag to the student |
| `trusted_evidence` rank is empty | Do not render evidence attribution on any visible surface |

---

## 9. Prohibited Presentation Patterns

In addition to the copy prohibitions in FIRST_MINUTE_COPY_LOCK_V1.md, the following presentation patterns are prohibited:

| Pattern | Reason |
|---------|--------|
| Displaying `signal_strength` value to user | Exposes internal scoring |
| Displaying `contamination_risk` value to user | Exposes internal scoring |
| Displaying `taxonomy_version` to user | Internal metadata |
| Showing multiple equal-weight direction options | Dilutes judgment signal |
| Showing a progress bar during intake | Creates survey feel |
| Showing character count as a pressure signal | Fails P1 (calm first) |
| Showing multiple CTAs of equal visual weight | Fails P3 (one thing at a time) |
| Rendering reflection as a bulleted list | Feels like a report, not noticing |
| Using accordion or expandable sections on FM-07 | Hides primary value |
| Pagination on any first-minute screen | Creates survey feel |
