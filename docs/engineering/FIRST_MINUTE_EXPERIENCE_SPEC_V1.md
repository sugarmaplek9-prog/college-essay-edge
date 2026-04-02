# First-Minute Product Experience Spec v1

## College Essay Edge

---

## 0. Product Objective

Within the first **30–60 seconds**, the product must make the **student** feel:

- calmer
- less stuck
- more understood
- more confident that this will save time

Within the first **2–3 minutes**, the product must make the **parent** feel:

- this is trustworthy
- this is structured
- this is different from generic AI
- this is worth paying for

The first-minute experience is not marketing decoration. It is the product's **trust anchor**.

---

## 1. Core Product Promise

The product must communicate one thing immediately:

> **You do not need your essay figured out to start.**

Supporting promise: **Start messy. We help you find the real story.**

This is the opposite of the market's common "get feedback on your essay" posture. Most visible tools emphasize rating, checking, or suggesting improvements after text exists. The first-minute experience must instead emphasize discovering the real story **before** the user wastes time drafting the wrong essay.

---

## 2. First-Minute Experience Principles

| Code | Principle | Rule |
|------|-----------|------|
| P1 | **Calm first** | No screen should make the student feel behind, judged, or overloaded. |
| P2 | **Value before effort** | The product must show intelligence before asking for too much input. |
| P3 | **One thing at a time** | No giant forms. No survey feel. No dashboard clutter in the first minute. |
| P4 | **Messy is welcome** | The UI must explicitly invite fragments, rough notes, partial drafts, and uncertainty. |
| P5 | **Human-feeling guidance** | The system must feel like it is noticing and guiding, not classifying and extracting. |
| P6 | **No chatbot framing** | Do not lead with a chat box as the primary product metaphor. That invites the wrong comparison. |

---

## 3. First-Minute Product Arc

The first minute must follow this emotional progression:

| Seconds | Emotional beat | Message to user |
|---------|----------------|-----------------|
| 0–10 | **Relief** | "I don't need to have this figured out." |
| 10–25 | **Permission** | "I can start with rough notes." |
| 25–45 | **Recognition** | "It's already seeing something real." |
| 45–60 | **Value** | "This is helping me faster than I expected." |

---

## 4. Website Architecture in the First Minute

Two surfaces are in scope:

### A. Public site
- Purpose: reduce friction, build trust, make the product feel premium and distinct
- Must not lead with chatbot UI
- Must not dump users into a dashboard

### B. Authenticated app
- Purpose: deliver the first value moment quickly, begin narrative discovery, produce a sharp early insight
- First screen: guided rough-notes intake
- Second screen: fast reflection (2–3 observations)
- Third screen: strongest direction result

The transition between them must feel **seamless**.

---

## 5. Homepage First-Screen Spec

### Hero Objective

Reduce pressure and communicate differentiated value in one glance.

### Hero Headline

Choose one of:

- **Option A:** You do not need your essay figured out to start.
- **Option B:** Start with rough notes. Leave with a stronger story direction.
- **Option C:** Find the real story before you waste time writing the wrong essay.

### Hero Subheadline

> College Essay Edge helps students turn messy notes, partial drafts, and half-formed ideas into a clear narrative direction — without writing the essay for them.

### CTAs

- **Primary:** Start with rough notes
- **Secondary:** See how it works

### Support Signals

Directly under the primary CTA, show three short trust/value lines:

1. Built for messy starts
2. Find your strongest angle fast
3. Guidance, not ghostwriting

### Visual Direction

**Do not use:**
- chat bubbles
- robot imagery
- flashy AI graphics
- cluttered dashboard mockups

**Use:**
- calm whitespace
- one clean product panel
- emotionally low-stress composition
- a single example of "rough notes → sharper direction"

---

## 6. "Why This Is Different" Value Strip

Immediately below the hero. Title:

> **More useful than generic AI. More calming than doing this alone.**

Three columns:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| **Start messy** | **Find the real angle** | **Move forward clearly** |
| Paste fragments, rough notes, or a partial draft. | The product identifies what your essay is actually about. | You get one strong direction and one smart next move. |

Do not mention "LLMs" or "advanced models" here.

---

## 7. First CTA Click Behavior

When the user clicks **Start with rough notes**:

- Do not dump them into a dashboard.
- Take them directly into the guided start screen (Screen 1).

---

## 8. Screen 1 — Guided Start Screen

### Objective

Remove fear and lower activation energy.

### Headline

> Messy is fine. That's what this is for.

### Supporting Copy

> Paste rough notes, fragments, a partial draft, or just the parts that keep coming back to you. You do not need to organize it first.

### Input Modes

Three tabs, only one visible by default:

| Tab | Label | Default? |
|-----|-------|----------|
| 1 | Rough notes | ✅ Default |
| 2 | Partial draft | |
| 3 | A few experiences | |

### Microcopy (below input)

Examples shown to reduce intimidation:

- "A conflict you still think about"
- "A moment you handled badly and changed"
- "A draft paragraph that feels almost right"
- "Three disconnected notes are enough to start"

### CTA

> **See what's here**

Not: submit / analyze / continue. "See what's here" feels lighter and more human.

---

## 9. Screen 2 — Fast Reflection Screen

### Objective

Deliver the first "this is helping" moment.

### Structure

- **Header:** What I'm seeing so far
- **Body:** Exactly 2–3 observations — not a report

### Observation Quality Bar

Examples of correct observation register:

> "There may be a stronger story here than the obvious activity angle."
> "I'm seeing a correction moment: the story gets stronger after the feedback."
> "This looks less like a volunteering essay and more like a responsibility story."

### Guardrail

Do not say:
- "We detected…"
- "Narrative pattern identified…"
- "Confidence score…"

### CTAs

- **Primary:** Show me the strongest direction
- **Optional secondary:** Ask me one clarifying question first

---

## 10. Screen 3 — Direction Result Screen

### Objective

Deliver immediate value strong enough to justify staying.

### Structure

| Section | Headline | Content |
|---------|----------|---------|
| 1 | **Strongest direction** | Angle title + 2–4 sentence explanation |
| 2 | **Why this beats the obvious version** | Short explanation only |
| 3 | **What could make this fall flat** | One concrete risk |
| 4 | **Best next move** | One high-value next step |

### CTA Cluster

- **Primary:** Use this direction
- **Secondary:** Compare it to another option
- **Tertiary:** Answer one question to sharpen it

### Design Rules

- No giant report
- One-screen comprehension
- High-value insight above the fold
- Premium, calm layout

---

## 11. Result Screen Voice Standard

### Tone

Calm. Specific. Strategic. Respectful.

### Tone is NOT

Salesy. Overexcited. Therapist-like. Admissions-consultant cheesy. AI-ish.

### Good Example

> The stronger story is not the activity itself. It is the moment your understanding changed.

### Bad Example

> This compelling narrative beautifully showcases your authentic growth and resilience.

---

## 12. Screen 4 — Compare Alternatives Screen

### Objective

Make the system feel smarter than generic AI by showing **why the strongest angle wins**.

### Show Only

- Strongest angle
- One obvious but weaker angle
- One additional alternate angle only if truly distinct

Do not show 3–5 equal options.

### Format Per Angle

| Field | Description |
|-------|-------------|
| What it's really about | Short description of the angle's core |
| Why it works or loses | Honest assessment |
| Failure mode | What happens if this one is chosen badly |

### Emotional Target

The user should think: *"Oh — I see why the obvious version is weaker."* That is premium value.

---

## 13. One-Question Recovery Screen

### When Triggered

Only when:
- evidence is truly thin
- a constrained direction is not yet trustworthy

### Screen Structure

- **Header:** I can help more if I know one thing
- **Explanation:** There's a possible direction here, but the fastest way to sharpen it is one question.
- **One question only** (e.g. "What changed in how you handled the situation after the feedback landed?")
- **CTA:** Answer this one question

### Required Feeling

- Useful
- Forward-moving
- Not blocked
- Not bureaucratic

---

## 14. Parent Reassurance Layer

Parents often arrive skeptical and cost-sensitive. Content that must be present across homepage and early product surfaces:

| Signal type | Copy |
|-------------|------|
| **Trust** | This helps students think better. It does not write the essay for them. |
| **Value** | Students get clearer direction faster, so they waste less time drafting the wrong essay. |
| **Process** | The system works from the student's own material and helps surface the strongest story already there. |

Placement locations:
- Homepage
- Pricing page
- FAQ
- Near checkout

---

## 15. What Makes This Unique

### Not Unique (Common Market Patterns)

- AI essay feedback
- Admissions-style suggestions
- Brainstorming help
- Editing support

### Unique to College Essay Edge

> Contamination-aware narrative discovery that starts from messy student input and identifies the strongest story direction before drafting.

**Public phrasing:** Find the real story before you start writing.

---

## 16. Differentiating Features to Surface in the First Minute

| Code | Feature | Description |
|------|---------|-------------|
| U1 | **Start messy onboarding** | Not "upload your essay." Not "get feedback." Start from fragments. |
| U2 | **Strongest direction before writing** | Not correction after draft. Direction before wasted effort. |
| U3 | **Why the obvious version is weaker** | Psychologically powerful and rare. |
| U4 | **One smart next move** | Not a list of suggestions. One move. |
| U5 | **Guidance, not ghostwriting** | Builds trust with students and parents. |

---

## 17. First-Minute Acceptance Criteria

### Students — within 60 seconds

Most users must say some version of:
- "This is easier than I expected."
- "This is actually helping."
- "This understands what I'm trying to do."
- "I'm less stuck."

### Parents — within 2–3 minutes

Most must say:
- "This feels trustworthy."
- "I can see the value."
- "This is not just another chatbot."
- "This would save time and stress."

---

## 18. UX Red Lines

Do not ship a first-minute experience that includes:

- More than one major decision on the first screen
- A large dashboard before value appears
- A visible confidence score
- Too many output options
- Long explanatory blocks
- Visible "AI detected" language
- A primary chatbot interaction frame

---

## 19. Engineering / Design Scope (First-Minute Tickets)

| Ticket | Scope |
|--------|-------|
| FM-01 | First-minute doctrine and UI guardrails |
| FM-02 | Homepage hero and differentiated value strip |
| FM-03 | "Why this is different" public value section |
| FM-04 | Rough-notes-first guided start screen |
| FM-05 | Connect guided start to intake intelligence orchestration |
| FM-06 | Fast reflection screen |
| FM-07 | Strongest direction result screen |
| FM-08 | Compare alternatives screen |
| FM-09 | One-question recovery screen |
| FM-10 | Parent reassurance content layer |
| FM-11 | Loading, latency, and transition behavior |
| FM-12 | First-minute product instrumentation |
| FM-13 | Mobile-responsive first-minute flow |
| FM-14 | Usability benchmark protocol |
| FM-15 | Internal acceptance review |

---

## 20. Final Build Doctrine

> The first minute should make the user feel: **lighter, clearer, and more hopeful — not busier.**

That is the real premium standard.
