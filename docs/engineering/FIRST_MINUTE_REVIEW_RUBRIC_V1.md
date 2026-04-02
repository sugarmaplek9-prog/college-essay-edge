# First-Minute Experience Review Rubric v1

## College Essay Edge

**Status: LOCKED**
**Version: v1**
**Applies to: FM-15 internal acceptance review and all iterative design reviews**

This rubric is the formal judgment instrument for the first-minute experience.
A screen or flow that "works" technically is not accepted unless it passes this rubric.
Every dimension must be rated. No dimension can be skipped.

---

## How to Use This Rubric

1. Run the full first-minute flow end-to-end on a fresh session.
2. Rate each dimension independently before discussing with others.
3. Record specific evidence for each rating.
4. Do not average across dimensions — each is a hard gate on its own.
5. A rating of **Rework** on any dimension blocks ship regardless of overall score.

---

## Rating Scale

| Rating | Meaning |
|--------|---------|
| **Accepted** | Dimension meets standard without qualification |
| **Partial** | Dimension mostly works but has a documented gap |
| **Rework** | Dimension fails standard — blocks ship |

---

## Dimension 1: Calming Quality

**What it measures:** Does the flow actively reduce student pressure, or does it create it?

**Accepted criteria (all must be true):**
- No screen contains more than one major decision
- No screen makes the user feel behind, judged, or rushed
- Progress toward a result is always visible or implied
- Blocked and partial states feel like guidance, not failure
- Loading states feel intentional, not abandoned
- Copy does not contain urgency, evaluation, or pressure language

**Partial:** One of the above is not true but is not on the entry screen.
**Rework:** Entry screen (homepage or guided start) fails any of the above.

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 2: Clarity

**What it measures:** Does the user know what the product does and what to do next at each step?

**Accepted criteria (all must be true):**
- Product promise is legible within 10 seconds on homepage
- CTA label tells the user what will happen, not just what to do
- Reflection screen clearly explains what the essay is really about, why that matters, and where the essay likely lives
- Direction result screen has unambiguous primary, secondary, and tertiary CTAs
- Compare screen clearly shows which angle wins and why
- Recovery screen has one question, one action, and one skip

**Partial:** One of the above is unclear but does not affect conversion path.
**Rework:** Primary CTA function is unclear, or direction result does not show a clear winner.

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 3: Direction Quality

**What it measures:** Does the direction result screen deliver a judgment that feels earned and specific?

**Accepted criteria (all must be true):**
- Angle title is specific to the student's material (not generic)
- Subtitle makes the angle understandable in plain English immediately
- "What this essay is really about" is understandable in one read
- "Why this is the strongest angle" names the stronger logic, not just the weaker comparison
- "How to build the essay" creates immediate forward motion
- "What could weaken this" is concrete and pattern-specific
- Next move is actionable and starts real progress
- Compare screen makes the strongest angle feel clearly superior without being dismissive
- No direction output sounds like generic AI essay feedback

**Partial:** One section is somewhat generic but the overall result feels specific.
**Rework:** Angle title is generic, or "why it beats the obvious" is diplomatic rather than honest.

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 4: Differentiation

**What it measures:** Could a user confuse this product with any other AI essay tool?

**Accepted criteria (all must be true):**
- Homepage hero communicates a different product category ("find the story before you write")
- No chat box, no AI-assistant imagery, no "feedback on your essay" framing anywhere in flow
- Reflection screen observations feel like human noticing, not machine classification
- Compare screen explicitly shows the weaker obvious angle — no other tool does this
- Voice throughout is calm/strategic, not excited/salesy/admissions-consultant
- Parent reassurance copy is present and builds on differentiation

**Partial:** One surface slips into generic AI framing but core flow is differentiated.
**Rework:** Homepage hero or reflection screen reads like a generic AI product.

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 5: Chatbot Risk

**What it measures:** Does the flow accidentally invite the chatbot comparison at any point?

**Accepted criteria (all of these must be absent):**
- No chat interface as primary interaction metaphor
- No turn-by-turn message thread anywhere in the first-minute flow
- No "AI is thinking" or equivalent loading copy
- No suggestion that the user can "ask anything"
- No "I'm an AI" or "As an AI" type language anywhere
- No chat bubble visual element in hero, reflection, or direction screens

**Partial:** Chat-style UI appears in a secondary surface that isn't part of the core first-minute path.
**Rework:** Any chat-style element appears on the homepage, guided start, reflection, or direction screens.

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 6: Burden Risk

**What it measures:** Does the flow ask more of the user than necessary before delivering value?

**Accepted criteria (all must be true):**
- User can proceed to reflection with a single input (no required second field)
- No multi-step form before the first value moment
- No required account creation before the first result
- No progress bar implying many steps remain
- No survey-style question pacing (one question per screen is for recovery only)
- Direction result screen does not require scrolling to reach the primary value

**Partial:** One friction point exists but is not on the critical path to first value.
**Rework:** Any required action before first value that is not "type something" and "click one CTA."

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 7: Mobile Quality

**What it measures:** Does the experience remain calm and useful at mobile width?

**Accepted criteria (all must be true):**
- Hero headline and primary CTA visible without scroll at 390px width
- Input area usable on mobile keyboard open
- Direction result — Section 1 visible without scroll at 390px
- Compare cards stack correctly (strongest first)
- No text overflow, no collapsed critical CTAs
- Loading states render correctly on mobile

**Partial:** One screen has minor layout issues that don't block the critical path.
**Rework:** Primary CTA or Section 1 direction not visible without scroll on mobile.

**Evidence field:** _(record specific observations here during review)_

---

## Dimension 8: Instrumentation

**What it measures:** Can the team measure whether the first-minute experience is working?

**Accepted criteria (all must be true):**
- All 15 events from FM-12 fire correctly in a test session
- Funnel from homepage CTA to direction result is reconstructable
- Latency from submission to reflection screen is measurable
- Abandonment screen is identifiable for each dropout
- No PII in any event payload

**Partial:** ≤ 3 events missing; funnel is still reconstructable.
**Rework:** Core funnel events missing (fm_submitted, fm_reflection_view, fm_direction_view).

**Evidence field:** _(record specific observations here during review)_

---

## Overall Classification

Fill in after all dimensions are rated individually.

| Dimension | Rating | Evidence summary |
|-----------|--------|-----------------|
| 1 — Calming quality | | |
| 2 — Clarity | | |
| 3 — Direction quality | | |
| 4 — Differentiation | | |
| 5 — Chatbot risk | | |
| 6 — Burden risk | | |
| 7 — Mobile quality | | |
| 8 — Instrumentation | | |

**Overall classification:**

| Result | Criteria |
|--------|----------|
| **Accepted** | All 8 dimensions: Accepted |
| **Accepted with limitations** | ≤ 2 dimensions Partial, 0 Rework |
| **Partial** | Any dimension Rework; core flow still navigable |
| **Rework required** | Dimension 5 (chatbot) or 6 (burden) rated Rework; or Dimensions 1, 2, or 3 rated Rework |

**This build's classification:** _______________

**Next-step recommendation:** *(Ship / Fix-and-rerun specific dimensions / Full rework)*

---

## Copy Compliance Check

Run this check in parallel with the dimension review.

Verify that the following prohibited strings are absent from all rendered surfaces:

- [ ] "We detected"
- [ ] "Analysis complete" / "Analysis results"
- [ ] "AI is thinking" / "AI found"
- [ ] "Confidence score" / any percentage value
- [ ] "Narrative pattern identified"
- [ ] "LLM" / "GPT" / any model name
- [ ] "Authentic" applied to the student
- [ ] "Compelling" applied to their story
- [ ] "Showcases"
- [ ] "Submit" on primary CTA
- [ ] "Generate"
- [ ] "What I'm seeing so far"
- [ ] Any loading copy from the prohibited list in FIRST_MINUTE_COPY_LOCK_V1.md §7

**Copy compliance:** Pass / Fail _______________

---

## Voice Quality Sample

During the review, capture 3 specific output strings from the live system and evaluate them:

**Sample 1 (from reflection screen):**
> _(paste observation here)_

Voice rating: Accepted / Partial / Rework

**Sample 2 (from direction result — angle explanation):**
> _(paste explanation here)_

Voice rating: Accepted / Partial / Rework

**Sample 3 (from direction result — why it beats the obvious):**
> _(paste comparison here)_

Voice rating: Accepted / Partial / Rework

**Overall voice quality:** _______________

---

## Review Sign-Off

Reviewed by: _______________
Date: _______________
Build: _______________
Classification: _______________
Next action: _______________
