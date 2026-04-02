# First-Minute Product Experience — Linear/Jira Backlog

## College Essay Edge

---

## EPIC

**Title:** First-Minute Product Experience v1
**Type:** Epic
**Priority:** P0

**Description:**
Implement the first-minute website and product experience for College Essay Edge so that students feel calmer, less stuck, and more understood within 30–60 seconds, and parents feel trust and value within 2–3 minutes.

The experience must start from messy input, deliver useful insight quickly, show a strongest narrative direction, explain why the obvious version is weaker, and give one high-value next move.

The experience must not feel like a chatbot, a giant form, or a generic AI product.

**Sprint Exit Gate:**
- homepage clearly differentiates product and reduces pressure
- first CTA takes users into a rough-notes-first guided start
- fast reflection screen returns 2–3 intelligent observations quickly
- direction result screen shows strongest direction, weaker obvious angle, one risk, and one next move
- compare screen makes the product feel smarter than generic AI
- one-question recovery loop feels helpful rather than blocking
- parent reassurance is visible and credible
- first-minute instrumentation is live
- design and copy feel calm, premium, and non-AI-gimmicky

---

## Recommended Execution Order

Execute in this exact order:

FM-01 → FM-02 → FM-03 → FM-04 → FM-05 → FM-06 → FM-07 → FM-09 → FM-08 → FM-10 → FM-11 → FM-12 → FM-13 → FM-14 → FM-15

**Can run in parallel:**
- FM-02 and FM-03 after doctrine is locked
- FM-10 once public/product messaging stabilizes
- FM-11 once flows are structurally defined
- FM-12 alongside implementation
- FM-13 once screens exist
- FM-14 can be written before all implementation is complete

**Must not run in parallel:**
- FM-05 before guided start is implemented
- FM-06 / FM-07 / FM-09 before intake integration exists
- FM-08 before direction result screen exists
- FM-15 before instrumentation and full flow exist

---

## Ticket FM-01

**Title:** Define first-minute experience doctrine and UI guardrails
**Type:** Product / UX
**Priority:** P0
**Estimate:** 3 points
**Dependencies:** None

**Description:**
Create the canonical product doctrine for the first-minute experience so design and engineering do not drift into chatbot patterns, clutter, or burden-heavy flows.

**Implementation Scope:**

Define and lock:
- first-minute emotional goals by second-band (0–10s / 10–25s / 25–45s / 45–60s)
- product tone rules (calm, specific, strategic, respectful — not salesy, not AI-ish)
- UX red lines (large dashboard before value, visible confidence scores, chatbot-first frame, multiple major decisions on screen 1)
- chat-avoidance rules (no chat box as primary product metaphor, no AI-assistant imagery in hero)
- value-before-effort rule (product must show intelligence before asking for significant input)
- rough-notes-first doctrine (default input mode is fragments, not polished text)
- parent reassurance doctrine (trust content must not make the student experience feel parental or controlling)

Must produce guardrail definitions explicit enough to review designs against:

Prohibited patterns:
- chatbot-first UI
- large dashboard before value
- giant intake form on screen 1
- confidence-score-first experience (e.g. "Confidence: 87%")
- AI-marketing gimmicks (robot, sparkle, brain icons in hero position)
- "We detected…" language in reflection copy
- more than one major decision on screen 1

**Out of Scope:**
- final UI implementation
- copywriting for specific screens

**Acceptance Criteria:**
- doctrine document exists in engineering/design-usable format
- guardrails are explicit enough to fail a design review against
- doctrine includes all six principles (P1–P6) from spec
- prohibited patterns list is unambiguous
- emotional arc by second-band is documented
- product voice standard (good/bad examples) is included

---

## Ticket FM-02

**Title:** Implement public homepage hero and differentiated value strip
**Type:** Frontend / Marketing Product
**Priority:** P0
**Estimate:** 5 points
**Dependencies:** FM-01

**Description:**
Build the public homepage top section so users immediately understand that they can start messy, get value fast, and are not entering another generic AI product.

**Implementation Scope:**

Hero must include:
- headline (one of three approved options from spec §5)
- subheadline: "College Essay Edge helps students turn messy notes, partial drafts, and half-formed ideas into a clear narrative direction — without writing the essay for them."
- primary CTA: **Start with rough notes** → routes to guided start screen (FM-04)
- secondary CTA: **See how it works**
- three trust/value support lines directly under primary CTA:
  1. Built for messy starts
  2. Find your strongest angle fast
  3. Guidance, not ghostwriting

Value strip immediately below hero must include:

| Column | Header | Body |
|--------|--------|------|
| 1 | Start messy | Paste fragments, rough notes, or a partial draft. |
| 2 | Find the real angle | The product identifies what your essay is actually about. |
| 3 | Move forward clearly | You get one strong direction and one smart next move. |

Value strip title: "More useful than generic AI. More calming than doing this alone."

Design constraints:
- No chat bubbles
- No robot imagery
- No flashy AI graphics
- No cluttered dashboard mockups
- Use: calm whitespace, one clean product panel, low-stress composition
- Single example panel showing "rough notes → sharper direction" concept

**Out of Scope:**
- full pricing page
- FAQ
- full information architecture beyond hero/value strip

**Acceptance Criteria:**
- homepage hero is implemented and live
- primary CTA routes correctly into guided start flow
- secondary CTA routes to explainer/how-it-works anchor or page
- all three trust/value lines visible below primary CTA without scroll
- value strip is immediately below hero and visually coherent
- no chat bubble or AI-assistant visual metaphor in hero
- visual design is calm and premium — passes FM-01 guardrail review
- page renders correctly on desktop-width viewport

---

## Ticket FM-03

**Title:** Implement "Why this is different" public value section
**Type:** Frontend / Product Marketing
**Priority:** P0
**Estimate:** 4 points
**Dependencies:** FM-02

**Description:**
Build the first public-facing value explanation section immediately below the hero value strip. This is the section that earns trust from skeptical parents and differentiates the product from generic AI in 20–30 seconds.

**Implementation Scope:**

Three required value blocks:

**Block 1 — Start messy**
> Paste fragments, rough notes, or a partial draft. You don't need to organize it first.

**Block 2 — Find the real angle**
> The product identifies what your essay is actually about — not what seems obvious.

**Block 3 — Move forward clearly**
> You get one strong direction and one smart next move. Not a list of suggestions.

Design requirements:
- Each block: icon or visual anchor, short headline, one-to-two sentence body
- Plain language — no jargon, no AI buzzwords
- Visually low-stress
- Student and parent legible
- Reinforces: low stress, premium guidance, no ghostwriting

No jargon or AI buzzwords permitted. Do not use: "LLMs", "models", "AI-powered", "intelligent engine", "confidence score."

**Out of Scope:**
- full feature catalog
- pricing logic
- "how it works" step-by-step breakdown

**Acceptance Criteria:**
- value section is implemented and visually coherent immediately below hero strip
- three blocks each communicate one concrete product difference
- no jargon or AI buzzwords appear in any block
- section supports trust-building within first 20–30 seconds of page load
- passes FM-01 guardrail review

---

## Ticket FM-04

**Title:** Implement rough-notes-first guided start screen
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 8 points
**Dependencies:** FM-01, FM-02

**Description:**
Build the first in-product screen users see immediately after clicking the primary CTA from the homepage. This screen sets the emotional tone for the entire product experience. It must be calm, direct, and low-friction.

**Implementation Scope:**

Screen structure:

**Headline:**
> Messy is fine. That's what this is for.

**Supporting copy:**
> Paste rough notes, fragments, a partial draft, or just the parts that keep coming back to you. You do not need to organize it first.

**Input modes — three tabs:**

| Tab | Label | Default? | Placeholder |
|-----|-------|----------|-------------|
| 1 | Rough notes | ✅ | "Start with whatever you have. It doesn't need to be organized." |
| 2 | Partial draft | | "Paste a paragraph or section you've already started." |
| 3 | A few experiences | | "Describe two or three moments that keep coming back to you." |

Default visible tab: **Rough notes**

**Microcopy below input (examples shown to reduce intimidation):**
- "A conflict you still think about"
- "A moment you handled badly and changed"
- "A draft paragraph that feels almost right"
- "Three disconnected notes are enough to start"

**CTA:**
> **See what's here**

Not: submit / analyze / continue / process / upload

**Design rules:**
- Screen must not feel like a form
- No visible field labels ("Name:", "Activity:", "Topic:")
- No required fields
- No progress bar on this screen
- CTA is lightweight — "See what's here" implies curiosity, not transaction

**State handling:**
- If input is empty: CTA remains visible but shows soft encouragement ("Even a few words is enough to start")
- If input is very short (< 20 chars): allow submission, route to one-question recovery (FM-09)
- If input is sufficient: route to fast reflection (FM-06 after FM-05 processing)

**Out of Scope:**
- full student dashboard
- saved projects view
- narrative result generation (handled by FM-05)

**Acceptance Criteria:**
- default tab is Rough notes
- screen does not feel like a form or survey
- all four example microcopy items render below input
- CTA reads "See what's here"
- empty-state and short-input states handled gracefully
- screen passes FM-01 guardrail review for burden and calm
- user can submit with minimal input without error

---

## Ticket FM-05

**Title:** Connect guided start screen to intake intelligence orchestration
**Type:** Backend / Frontend Integration
**Priority:** P0
**Estimate:** 8 points
**Dependencies:** FM-04, Narrative Intake Intelligence Layer (INTAKE-17)

**Description:**
Wire the guided start input into the intake intelligence orchestration system (`runIntakeOrchestrator`) so the product can return fast reflections and a narrative direction path from real user input.

**Implementation Scope:**

**Input payload assembly:**
Map guided start screen fields to `IntakeSessionInput`:
- rough notes → `story_entries` (treat as unstructured story text)
- partial draft → `draft_text` + `draft_id`
- experiences tab → multiple `story_entries`
- input mode (tab) → stored in session metadata

**API route:** `POST /api/intake/session`

Request:
```typescript
{
  input_mode: 'rough_notes' | 'partial_draft' | 'experiences';
  raw_text: string;
  session_id?: string;         // if resuming
  student_user_id: string;
  subject_entity_id: string;
}
```

Response:
```typescript
{
  intake_result: IntakeIntelligenceObject;
  route: 'reflection' | 'recovery' | 'blocked';
}
```

**Routing rules:**
| Intake result state | Route |
|---------------------|-------|
| `success` or `reduced_scope` | → fast reflection screen (FM-06) |
| `needs_more_input` | → one-question recovery (FM-09) |
| `blocked` or escalation | → graceful blocked state with human framing |

**State handling must cover:**
- loading state: immediate optimistic transition to processing screen (FM-11)
- error state: graceful fallback — do not surface raw error to user
- no raw model internals shown to user under any path
- `IntakeIntelligenceObject` persisted to session store for use in FM-06 / FM-07

**Out of Scope:**
- final essay writing flow
- billing / subscription gate
- account management

**Acceptance Criteria:**
- screen submits real user input successfully
- backend returns `IntakeIntelligenceObject` and routing decision
- all three routing states (reflection / recovery / blocked) work correctly
- no raw model output or internal field names visible to user
- intake result is available for FM-06 and FM-07 consumption
- API route is authenticated
- session is persisted for later continuation

---

## Ticket FM-06

**Title:** Implement fast reflection screen
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 6 points
**Dependencies:** FM-05

**Description:**
Build the intermediate reflection screen that delivers the first "this is helping" moment. This screen must appear quickly and return 2–3 intelligent observations that feel more useful than a summary.

**Implementation Scope:**

**Screen structure:**

Header:
> What I'm seeing so far

Body:
- Exactly 2–3 observations derived from `IntakeIntelligenceObject`
- Each observation is one sentence
- Observations are not a report — they are sharp, specific, human-register insights

**Observation generation rules:**
Map `IntakeIntelligenceObject` fields to human-readable observations:

| Condition | Example observation |
|-----------|---------------------|
| `signal_strength = high` + `primary_pattern = self_correction_arc` | "I'm seeing a correction moment: the story gets stronger after the feedback." |
| `signal_strength = medium` + `narrative_pattern.confidence = medium` | "There may be a stronger story here than the obvious activity angle." |
| `authorship_signal = mixed` | "Some of this reads like your voice, and some doesn't yet — that's useful to know." |
| `primary_pattern = identity_shift` | "This looks less like an activity essay and more like a 'who I became' story." |
| `primary_pattern = responsibility_shift` | "What keeps coming through is not what you did, but how the role changed." |
| `next_question != null` + `signal_strength = low` | "There's something here, but one answer would sharpen it fast." |
| `primary_pattern = failure_reinterpretation` | "The interesting part isn't the outcome — it's what the failure revealed." |
| `primary_pattern = conflict_reframe` | "This isn't really a conflict story — it's a 'what I understood differently' story." |

**Prohibited language in any observation:**
- "We detected…"
- "Narrative pattern identified…"
- "Confidence score…"
- "The AI found…"
- "Analysis complete…"
- Any percentage or numeric score

**CTAs:**
- **Primary:** Show me the strongest direction
- **Optional secondary:** Ask me one clarifying question first (shown when `next_question != null`)

**Performance requirement:**
Reflection screen must not feel slow. If backend processing exceeds 1.5s, show FM-11 loading state immediately. Target: reflection observations visible within 2s of submission.

**Out of Scope:**
- full history/state browser
- multi-session compare

**Acceptance Criteria:**
- reflection screen renders with 2–3 observations
- observations are mapped from real `IntakeIntelligenceObject` data — not static placeholders
- observations feel specific and human-register — not summary-style
- prohibited language does not appear
- user can advance to strongest direction in one click
- secondary CTA visible when `next_question` is non-null
- screen passes FM-01 guardrail review

---

## Ticket FM-07

**Title:** Implement strongest direction result screen
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 8 points
**Dependencies:** FM-05, FM-06

**Description:**
Build the first core value screen showing the strongest narrative direction. This screen must deliver immediate value strong enough to justify the user continuing, paying, and returning.

**Implementation Scope:**

**Required sections:**

**Section 1 — Strongest direction**
- Headline: *Strongest direction*
- Content: angle title + 2–4 sentence explanation
- Derived from: `IntakeIntelligenceObject.narrative_pattern.primary_pattern` + direction synthesis

**Section 2 — Why this beats the obvious version**
- Headline: *Why this beats the obvious version*
- Content: 2–3 sentences explaining what the obvious angle would miss
- Must be concrete, not generic ("Most essays about debate focus on wins. This one is about what changed.")

**Section 3 — What could make this fall flat**
- Headline: *What could make this fall flat*
- Content: One specific risk sentence
- Derived from: `escalation_decision`, `contamination_risk`, pattern ambiguity flags

**Section 4 — Best next move**
- Headline: *Best next move*
- Content: One high-value concrete next step
- Derived from: `next_question` if non-null, or standard next-step for pattern

**CTA cluster:**
- **Primary:** Use this direction
- **Secondary:** Compare it to another option → routes to FM-08
- **Tertiary:** Answer one question to sharpen it → routes to FM-09

**Design rules:**
- No giant report
- One-screen comprehension — all four sections visible without excessive scroll on desktop
- High-value insight (Section 1) above fold
- Premium, calm layout
- Sections separated clearly but not padded into a lengthy document

**Voice standard:**
The language in every section must be:
- Calm, specific, strategic, respectful
- Must not sound: salesy, overexcited, therapist-like, AI-ish

Good: *The stronger story is not the activity itself. It is the moment your understanding changed.*
Bad: *This compelling narrative beautifully showcases your authentic growth and resilience.*

**Out of Scope:**
- draft-writing tool
- essay editor
- payment wall logic (direction result is available before paywall for conversion)

**Acceptance Criteria:**
- all four sections render with real content from `IntakeIntelligenceObject`
- strongest direction is clearly visible and meaningfully specific
- why-it-beats-the-obvious section is concrete, not generic
- one risk and one next move are visible without requiring scroll
- CTA cluster is present: Use / Compare / Sharpen
- Compare CTA routes to FM-08
- screen passes FM-01 guardrail review for voice and clutter

---

## Ticket FM-08

**Title:** Implement compare alternatives screen
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 6 points
**Dependencies:** FM-07

**Description:**
Build the compare screen that makes the product feel smarter than generic AI by showing why the strongest angle wins — and why the obvious one loses.

**Implementation Scope:**

**Show only:**
- The strongest angle (from FM-07)
- One obvious but weaker angle
- Optionally one alternate angle only if it is genuinely distinct from both above

Do not show 3–5 equal-weight options. Do not present this as a menu.

**Format per angle card:**

| Field | Description |
|-------|-------------|
| **What it's really about** | One sentence describing the angle's actual core |
| **Why it works** (strongest) / **Why it loses** (weaker) | One honest sentence |
| **Failure mode if chosen** | What goes wrong if this is pursued without the real story |

**Strongest angle card:**
- Visually distinct: heavier weight, cleaner framing
- Should feel like the obvious winner after reading all three

**Weaker/obvious angle card:**
- Labeled: *Obvious but weaker*
- Failure mode must be specific: "Most essays that lead with the activity title never escape the resume register."

**Layout:**
- Cards side by side on desktop, stacked on mobile
- No equal visual weighting between strongest and weaker
- No checkboxes or multi-select — this is not a choice menu

**Emotional target:**
User should think: *"Oh — I see why the obvious version is weaker."* That feeling is the product's competitive moat.

**Out of Scope:**
- arbitrary multi-option exploration
- user-generated angle creation
- more than three angles under any condition

**Acceptance Criteria:**
- compare screen shows strongest angle + at least one weaker angle
- each card includes what-it's-about, why-it-works/loses, and failure mode
- strongest angle is visually dominant
- weaker angle is honestly framed — not diplomatically neutral
- compare experience feels strategic and decisive, not confusing
- screen passes FM-01 guardrail review

---

## Ticket FM-09

**Title:** Implement one-question recovery screen
**Type:** Frontend / Product
**Priority:** P0
**Estimate:** 6 points
**Dependencies:** FM-05

**Description:**
Build the recovery experience for cases where intake intelligence routes to `needs_more_input` — meaning the input is thin but not hopeless, and one high-value question can unlock a trustworthy direction.

**Implementation Scope:**

**Required screen components:**

Header:
> I can help more if I know one thing

Explanation:
> There's a possible direction here, but the fastest way to sharpen it is one answer.

Question display:
- Exactly **one question** rendered as the focal element
- Question sourced from `IntakeIntelligenceObject.next_question.question_text`
- If `next_question` is null, use a high-information-gain default question

Example question:
> What changed in how you handled the situation after the feedback landed?

CTA:
> **Answer this one question**

**After answer submission:**
- Re-submit to `POST /api/intake/session` with new input appended
- Route to FM-06 (fast reflection) with updated `IntakeIntelligenceObject`

**Required behavior:**
- No blocking form feel — this is a single text input, not a multi-field form
- No multi-question escalation: never show more than one question on this screen
- Preserve momentum and trust throughout
- Soft reassurance available below CTA: "You can always skip this and see what we have so far."

**Question is sourced from:**
`IntakeIntelligenceObject.next_question.question_text`
mapped from the `QuestionType` → human-register question text (same mapping as `QUESTION_BANK` in `question-selector.ts`)

**Out of Scope:**
- multi-turn chat conversation
- long diagnostic survey
- multi-question escalation flow

**Acceptance Criteria:**
- exactly one question shown
- question is sourced from `IntakeIntelligenceObject.next_question`
- explanation is present and feels helpful, not bureaucratic
- "skip" option is available and routes to direction result with available signal
- answer submission re-runs intake and routes to reflection
- screen passes FM-01 calm/guardrail review

---

## Ticket FM-10

**Title:** Implement parent reassurance content layer
**Type:** Frontend / Product Marketing
**Priority:** P0
**Estimate:** 5 points
**Dependencies:** FM-02, FM-03, FM-07

**Description:**
Build the trust layer for parents without making the product feel parent-first to students. Parents arrive skeptical and cost-sensitive. The right content reduces concern around authenticity, value, and differentiation from ghostwriting.

**Implementation Scope:**

**Three required trust statements** (must appear on homepage and result screen):

| Statement type | Copy |
|----------------|------|
| **Trust** | "This helps students think better. It does not write the essay for them." |
| **Value** | "Students get clearer direction faster, so they waste less time drafting the wrong essay." |
| **Process** | "The system works from the student's own material and helps surface the strongest story already there." |

**Placement requirements:**

| Surface | Placement |
|---------|-----------|
| Homepage | Below value strip or in dedicated "For parents" subsection |
| Direction result screen | Subtle footer-area trust note |
| Pricing page | Prominent section near price display |
| FAQ / support area | Dedicated parent FAQ block |

**Design constraints:**
- Trust content must feel restrained and confident — not defensive or overexplaining
- Must not make the student-facing experience feel parental or controlling
- Parent content on homepage should be visually secondary to student CTA
- Do not use "Your child's college essay" framing — it reads as condescending to students who are the primary user

**Out of Scope:**
- full parent dashboard
- family account model
- parent-specific authentication

**Acceptance Criteria:**
- all three trust statements are present and visible without scroll on homepage
- trust statements appear on direction result screen
- pricing page has prominent parent reassurance block
- content does not appear defensive or salesy
- student-first visual hierarchy maintained on all screens
- passes FM-01 guardrail review for tone and control-level

---

## Ticket FM-11

**Title:** Implement first-minute loading, latency, and transition behavior
**Type:** Frontend / UX Engineering
**Priority:** P0
**Estimate:** 5 points
**Dependencies:** FM-05, FM-06, FM-07

**Description:**
Ensure the first-minute flow feels smooth, calm, and fast even when backend processing occurs. Perceived speed is as important as actual speed in this flow. Users must never feel abandoned or confused during transitions.

**Implementation Scope:**

**Loading state after "See what's here" submission:**

Show a calm intermediate state immediately (< 200ms) with copy such as:
> "Reading what you shared…"

Then progress to:
> "Finding the strongest thread…"

Then (if still processing):
> "Almost there…"

**Copy rules for all loading states:**
- No technical language ("processing", "running model", "analyzing input")
- No AI-forward language ("AI is thinking", "GPT is working")
- No passive waiting ("Please wait…")
- Must feel intentional and curated — like a skilled person reviewing notes

**Transition rules:**
- Fade or slide transitions between screens — no hard cuts
- Reflection screen must appear within 2s of submission on typical connection
- If processing exceeds 3s: show progress copy, not spinner-only
- If processing exceeds 8s: graceful timeout fallback with human message ("Let's try a slightly different start.")

**Optimistic transitions:**
- Navigate to intermediate screen immediately on submit
- Populate result screen as data arrives — do not hold entire screen until all sections ready
- Section 1 (strongest direction) populates first; sections 2–4 follow

**Out of Scope:**
- backend performance optimization
- edge caching strategy
- CDN configuration

**Acceptance Criteria:**
- no blank/spinner-only state lasts more than 1s without copy
- all loading copy is calm and human-register
- transitions between screens feel intentional and smooth
- timeout fallback is implemented and tested
- optimistic section-by-section loading works on direction result screen
- passes FM-01 guardrail review for loading copy

---

## Ticket FM-12

**Title:** Implement first-minute product instrumentation
**Type:** Product Analytics / Platform
**Priority:** P0
**Estimate:** 6 points
**Dependencies:** FM-04 through FM-11

**Description:**
Instrument the first-minute experience so the team can evaluate whether the product is actually calming, useful, and low-friction in production. This is the measurement system for the product's trust anchor.

**Implementation Scope:**

**Events to track:**

| Event name | When fired | Key properties |
|------------|-----------|----------------|
| `fm_homepage_cta_click` | Primary CTA clicked | `cta_variant`, `session_id` |
| `fm_guided_start_view` | Guided start screen loaded | `session_id`, `referrer` |
| `fm_input_mode_selected` | Tab switched | `mode: rough_notes\|partial_draft\|experiences` |
| `fm_input_first_char` | First keystroke in input | `session_id`, `input_mode` |
| `fm_submitted` | "See what's here" clicked | `session_id`, `input_length`, `input_mode` |
| `fm_reflection_view` | Fast reflection screen loaded | `session_id`, `latency_ms` |
| `fm_reflection_to_direction` | Primary CTA on reflection clicked | `session_id` |
| `fm_direction_view` | Direction result screen loaded | `session_id`, `latency_ms`, `viability_decision` |
| `fm_direction_used` | "Use this direction" clicked | `session_id` |
| `fm_compare_opened` | Compare screen opened | `session_id` |
| `fm_recovery_view` | One-question recovery screen loaded | `session_id`, `question_type` |
| `fm_recovery_answered` | Recovery question answered and submitted | `session_id` |
| `fm_abandoned` | User left during first-minute flow | `session_id`, `last_screen`, `time_on_flow_ms` |
| `fm_save_or_continue` | User saved or returned to continue | `session_id` |
| `fm_parent_content_view` | Parent trust section scrolled into view | `surface` |

**Derived metrics (computable from events):**
- Time to first input (homepage load → first keystroke)
- Time to first reflection (load → `fm_reflection_view`)
- Time to first direction (load → `fm_direction_view`)
- Abandonment rate per screen
- Recovery screen usage rate
- Compare screen open rate
- Direction-used rate (conversion signal)

**Implementation notes:**
- Use existing analytics infrastructure (Supabase or event logger)
- All events must include `session_id` and `timestamp`
- No PII in event properties — use `session_id` only, not `student_user_id` in analytics payload
- Events must survive page refresh (session-level deduplication)

**Out of Scope:**
- advanced BI dashboards
- attribution modeling
- A/B test infrastructure

**Acceptance Criteria:**
- all 15 events fire correctly in production
- funnel can be reconstructed: homepage CTA → input → reflection → direction
- latency-to-value is measurable from events
- abandonment bottlenecks are identifiable by screen
- no PII in event payload
- event schema is documented

---

## Ticket FM-13

**Title:** Implement mobile-responsive first-minute flow
**Type:** Frontend / UX Engineering
**Priority:** P1
**Estimate:** 5 points
**Dependencies:** FM-04 through FM-11

**Description:**
Ensure the first-minute experience remains calm, useful, and visually coherent on mobile-width devices. A significant portion of first-time users will arrive on mobile — the experience must not degrade.

**Implementation Scope:**

**Responsive behavior required for:**
- Homepage hero and value strip (FM-02, FM-03)
- Guided start screen (FM-04)
- Fast reflection screen (FM-06)
- Direction result screen (FM-07)
- Compare alternatives screen (FM-08)
- One-question recovery screen (FM-09)

**Mobile rules:**
- No stacked clutter: sections must reduce, not stack indefinitely
- No hidden primary CTA behind scroll on initial view
- No text density explosion on small screens (max 2–3 sentences per visual block)
- Compare screen cards stack vertically on mobile — strongest angle on top
- Input area must be at least 120px tall and not obstructed by keyboard
- Tab navigation on guided start is scrollable, not hidden

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640–1024px
- Desktop: > 1024px

**Out of Scope:**
- mobile-native app
- push notifications
- native gesture patterns

**Acceptance Criteria:**
- all first-minute screens render correctly at 390px width (iPhone viewport)
- visual hierarchy remains clear on mobile
- primary CTA is visible without scroll on every screen at 390px
- input area functions correctly on mobile keyboard open
- compare screen cards stack cleanly
- passes FM-01 guardrail review at mobile viewport

---

## Ticket FM-14

**Title:** Add first-minute usability benchmark protocol
**Type:** Product / QA / Research
**Priority:** P0
**Estimate:** 4 points
**Dependencies:** FM-12

**Description:**
Create the benchmark protocol for testing whether the first-minute experience actually achieves its emotional and value goals. This protocol is the measurement instrument for the sprint exit gate.

**Implementation Scope:**

**Usability test protocol must cover:**

Two participant groups:
- Students (target: age 16–18, any familiarity with college essays)
- Parents (target: parents of college-bound students, skeptical of AI tools)

**Session structure:**
1. Cold start: participant loads homepage with no explanation
2. Observe: first-click behavior, first-scroll behavior, first expression
3. Prompt: "Go ahead and try to use it as you normally would."
4. Capture: time to first meaningful reaction, points of confusion, emotional friction moments
5. Post-session questions (see below)

**Required post-session benchmark questions:**

For students:
1. Did this feel easy to start?
2. Did this reduce your stress about the essay?
3. Did this help you understand your essay better?
4. Did this feel different from generic AI tools?
5. Would you use this again?

For parents:
1. Do you trust this?
2. Can you see the value?
3. Does this feel different from generic AI?
4. Would you pay for this?
5. Are you concerned it writes the essay for them?

**Scoring:**
- Each question rated 1–5
- Target: ≥ 4/5 average on questions 1, 2, 4 for students; 1, 2, 3 for parents
- Individual friction moments logged and categorized by screen

**Out of Scope:**
- recruiting panel
- external research agency
- compensated participants (v1 protocol is internal/friends-and-family)

**Acceptance Criteria:**
- protocol document is runnable by any team member with no additional briefing
- benchmark questions map clearly to product acceptance criteria from spec §17
- results can be compared across iterations to track improvement
- protocol includes both student and parent groups
- scoring rubric is explicit

---

## Ticket FM-15

**Title:** Run first-minute experience internal acceptance review
**Type:** Product / QA
**Priority:** P0
**Estimate:** 4 points
**Dependencies:** FM-02 through FM-14

**Description:**
Run the full first-minute experience end to end against the product doctrine and classify it as one of: accepted / accepted with limitations / partial / rework required. Produce a written classification with evidence.

**Implementation Scope:**

**Review must cover each flow:**
- Homepage: hero, value strip, differentiated value section
- Guided start screen
- Fast reflection screen
- Strongest direction result screen
- Compare alternatives screen
- One-question recovery screen
- Parent reassurance content
- Instrumentation events (fire check)
- Mobile responsiveness
- Loading and transition behavior

**Output classification per dimension:**

| Dimension | Rating options |
|-----------|---------------|
| Calming quality | Accepted / Partial / Rework |
| Clarity | Accepted / Partial / Rework |
| Value speed (time to useful output) | Accepted / Partial / Rework |
| Trust / parent reassurance | Accepted / Partial / Rework |
| Chatbot risk | Accepted / Partial / Rework |
| Burden risk | Accepted / Partial / Rework |
| Mobile quality | Accepted / Partial / Rework |
| Instrumentation completeness | Accepted / Partial / Rework |

**Overall classification:**
- **Accepted**: all dimensions Accepted
- **Accepted with limitations**: ≤ 2 dimensions Partial, 0 Rework
- **Partial**: any dimension Rework but core flow works
- **Rework required**: core flow broken or chatbot risk / burden risk rated Rework

**Output:**
Written review document with:
- overall classification
- dimension-by-dimension ratings with evidence
- prioritized issue list by severity (critical / major / minor)
- explicit next-step recommendation (ship / fix-and-rerun / full rework)

**Out of Scope:**
- public beta launch decision
- payment conversion decision
- A/B test configuration

**Acceptance Criteria:**
- review covers all 15 FM tickets
- all eight dimensions are classified
- issues are categorized by severity
- overall classification is honest, not optimistic by default
- next-step recommendation is explicit and actionable
- review document is stored in `docs/engineering/`

---

## Phase Exit Interpretation

This first-minute scope is **complete only when:**

- the homepage reduces pressure immediately
- users can start with messy notes
- useful reflection appears quickly
- strongest direction feels valuable fast
- compare flow clarifies why the strongest angle wins
- one-question recovery preserves momentum
- parents see trust and value
- the experience does not feel like a chatbot or a burden
- first-minute behavior is measurable
- internal acceptance review passes

---

## One-Line Handoff for Engineering Leadership

> Implement the First-Minute Product Experience as a calm, premium, rough-notes-first web flow that helps students feel clearer and less stuck within 60 seconds, shows parents trustworthy value within minutes, and makes College Essay Edge feel unmistakably different from generic AI or chat-based essay tools.
