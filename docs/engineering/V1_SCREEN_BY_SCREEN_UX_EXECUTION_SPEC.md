# V1_SCREEN_BY_SCREEN_UX_EXECUTION_SPEC

## 1. Purpose

This document translates the premium UX and launch hardening plan into a screen-by-screen execution spec for v1.

It defines exactly how the product should behave on the most important user-facing surfaces so the experience becomes:

* faster to value
* sharper in judgment
* calmer under uncertainty
* more premium in delivery
* clearly more useful than generic AI in critical essay decisions

This is not a visual design file.
This is not a generic UX principles memo.
This is the product execution spec for the core user experience.

It focuses on the launch-critical surfaces only.

---

## 2. Scope of this spec

This spec covers:

* first-session entry flow
* first-session input flow
* first-session result flow
* Narrative Direction Selection screen behavior
* blocked and partial recovery patterns
* Essay Feedback result screen behavior
* parent-facing visibility surfaces

This spec intentionally ignores lower-priority surfaces that do not materially affect launch trust.

---

## 3. Primary UX objective

The first visible version of College Essay Edge must make the user feel four things quickly:

* I understand my options better.
* I know what to do next.
* This did not write for me.
* This is sharper than generic AI.

Every major screen in this spec exists to create one or more of those reactions.

---

## 4. Global execution rules

### 4.1 One main job per screen

Each screen should do one thing clearly.

Do not combine:

* recommendation
* system explanation
* multiple competing calls to action
* detailed workflow state
* dense history
* secondary admin logic

on the same primary surface.

### 4.2 Fast read first

Every result screen must begin with a compact, high-signal summary block.

That block should answer:

* what is strongest
* why
* what is risky or weak
* what to do next

### 4.3 Optional detail must stay below the fold

Evidence, alternatives, deeper notes, and historical detail should be available, but not required to understand the core recommendation.

### 4.4 Blocked and partial states are real product states

These states must feel like intelligent guidance, not failure screens.

### 4.5 Visible language must be short and decisive

No ceremonial copy.
No AI jargon.
No validator jargon.
No motivational filler.

### 4.6 Preserve dignity

No screen should make the user feel scolded, behind, or “not good enough.”
Honesty is required. Humiliation is not.

---

## 5. Screen 1 — First-session landing

## 5.1 Job of the screen

Get the user into the trust-anchor workflow immediately.

Not to explain the platform.
Not to showcase all modules.
Not to teach the architecture.

## 5.2 Primary screen content

### Headline

**Choose the strongest direction for your essay**

### Supporting line

Paste rough notes, a draft, or both. We’ll compare possible directions and recommend the strongest one.

### Primary action

**Start with rough material**

### Secondary action

**See an example result**

That secondary action should be lightweight and reassurance-oriented, not a long product tour.

## 5.3 What should not appear here

Do not show:

* all module cards
* dashboard metrics
* dense navigation
* extensive educational copy
* AI quality claims
* complex state explanations
* system terminology

## 5.4 Success condition

The user should understand in under 10 seconds:

* what the product will do first
* what they need to provide
* what kind of value they will get

---

## 6. Screen 2 — First-session input

## 6.1 Job of the screen

Collect the minimum input needed to produce the first meaningful direction recommendation.

## 6.2 Input structure

### Primary input area

Large paste field labeled:

**Paste rough notes or a draft**

Helper text:

Use rough notes, a draft, or a few story fragments. This does not need to be polished.

### Optional supporting field

**Anything else we should know?**

Examples:

* what story you keep circling back to
* what feels strongest or weakest
* what you are unsure about

### Primary CTA

**Compare directions**

## 6.3 Behavior rules

* rough, unpolished input must be welcomed
* optional context must stay optional
* no giant intake form
* no required multi-step profile before first value if not necessary

## 6.4 Dynamic helper behavior

If pasted material is very thin, show a subtle helper prompt beneath the CTA, not a blocking form.

Example:

You can still continue. Results will be stronger if you include one concrete moment or scene.

## 6.5 What should not happen here

Do not ask for:

* many structured sub-fields
* polished self-analysis
* multiple story categories
* full onboarding flow before first result

unless the user has no usable material at all.

## 6.6 Success condition

The user should feel:

* I can start rough
* I do not need to perform for the machine
* I am one action away from useful output

---

## 7. Screen 3 — First-session result (Narrative Direction Selection fast read)

## 7.1 Job of the screen

Create the first trust moment.

This screen must feel like judgment, not organization.

## 7.2 Required visual hierarchy

### Section A — Best direction

Label:

**Best direction**

One-sentence recommendation.

Example:

Focus on the shift from solving problems yourself to building systems other people could rely on.

### Section B — Why it wins

Two or three short bullets tied to the user’s material.

Example:

* Your robotics example and tutoring example point to the same pattern.
* This direction shows change, not just effort.
* It gives you a clearer through-line than the leadership-only angle.

### Section C — Main risk

One short warning.

Example:

Right now the story names the projects, but not the moment where your thinking changed.

### Section D — Next move

One concrete action.

Example:

Add one scene where you realized solving the immediate problem was not enough.

## 7.3 Primary CTA

**Use this direction**

## 7.4 Secondary actions

* **Compare other directions**
* **Answer one follow-up question to sharpen this**

## 7.5 What makes this screen premium

* short
* decisive
* evidence-based
* no fluff
* one clear recommendation

## 7.6 What makes this screen fail

* all options sound similar
* recommendation is hedged
* reasoning is generic admissions logic
* too much text before the answer
* no clear next move

---

## 8. Screen 4 — Compare alternatives

## 8.1 Job of the screen

Show that the recommendation is earned, not arbitrary.

## 8.2 Required structure

For each alternative:

* direction label
* one-sentence summary
* one sentence on why it loses

### Example structure

**Alternative 1: Leadership through mentorship**
Works because your tutoring story is credible, but it loses because it narrows the pattern too quickly and drops your strongest systems-building thread.

**Alternative 2: Resilience through pressure**
Works at the trait level, but it loses because it says what you endured more clearly than what changed.

## 8.3 Rule

There must always be a real winner.
Alternatives exist to increase trust, not to flatten the recommendation.

---

## 9. Narrative Direction Selection full result screen

## 9.1 Job of the screen

Support real decision-making and selection.

## 9.2 Screen sections

### Header

* project name
* current state: `selection required`, `selected`, or `stale`

### Fast read block

* Best direction
* Why it wins
* Main risk
* Next move

### Evidence anchors

Show the specific user material driving the recommendation.

Example:

This recommendation is based mostly on your robotics paragraph, the tutoring example, and the second anecdote about building a repeatable system.

### Compare alternatives

Collapsed by default, expandable.

### Sharpen this direction

One optional follow-up question or small set of prompts.

### Selection controls

* Use this direction
* Save for later
* Rerun if allowed

## 9.3 State behavior

### `selection_required`

Show clear winner, comparison options, and prominent selection CTA.

### `selected`

Show selected badge, current strategic anchor, and CTA to move into drafting.

### `stale`

Keep selected direction visible but clearly mark it stale.

Use copy like:

Your material changed after this recommendation. This direction may still work, but it should be reviewed before you build on it.

## 9.4 Hard rule

Never present direction results as broad ideation cards with equal weight.

---

## 10. Partial result pattern

## 10.1 Job of the pattern

Make incomplete output feel useful and premium.

## 10.2 Required structure

### What I can say now

One or two high-confidence observations.

### What is unclear

One precise description of what is missing.

### Fastest way to improve this

One high-leverage next step.

## 10.3 Example

**What I can say now**
You have two plausible directions: building systems for others and mentoring through problem-solving.

**What is unclear**
Neither direction is strong enough yet because the material names the activities, but not the turning point.

**Fastest way to improve this**
Add one moment where your approach changed from helping individually to designing something repeatable.

## 10.4 Rule

A partial result should still feel like a finished UX object, not a broken response.

---

## 11. Blocked / needs-more-input recovery screen

## 11.1 Job of the screen

Turn a stop into momentum.

## 11.2 Required structure

### Plain-language reason

Say what is missing without blame.

### One-question recovery

Ask the single most helpful question.

### Continue action

Provide a fast way to answer and rerun.

## 11.3 Example

**We can see the event, but not yet why it mattered.**

The strongest next step is to answer one question:

**What changed for you after this moment?**

Input field below.
CTA:

**Add this and sharpen the result**

## 11.4 What to avoid

Do not say:

* insufficient input
* cannot continue
* please provide more detail
* multiple missing items in a bullet dump

## 11.5 Premium rule

The blocked state should feel like a smart coach narrowing the problem, not a system rejecting the user.

---

## 12. Essay Feedback result screen

## 12.1 Job of the screen

Show the single highest-leverage revision insight without drifting into rewrite behavior.

## 12.2 Required visual hierarchy

### Section A — What’s working

One brief observation.

Example:

The opening scene has motion. It puts us somewhere real.

### Section B — Where the draft loses force

One direct diagnosis.

Example:

The middle shifts into explanation too early. We hear what you learned before we see the moment that caused it.

### Section C — Biggest fix

One concrete revision target.

Example:

Keep the explanation shorter and add one decision or reaction from that moment.

### Section D — Optional deeper notes

Collapsed by default.
Could include:

* Keep / Cut / Strengthen
* secondary concerns
* optional next-pass ideas

## 12.3 Primary CTA

**Revise with this in mind**

## 12.4 Secondary actions

* **See deeper notes**
* **Compare to current draft focus**

## 12.5 Hard rule

Do not flood the screen with ten comments.
The first visible version must surface the highest-value correction first.

## 12.6 Anti-ghostwriting rule

This screen may diagnose and direct.
It must not present rewritten essay text as the core value object.

---

## 13. Essay Feedback stale-state behavior

## 13.1 When stale occurs

If the current draft changes after feedback is generated, the feedback becomes stale.

## 13.2 User-facing behavior

Show:

**Feedback is based on an older draft**

Subtext:

Your current draft changed after this feedback was generated. Keep this as reference, or run feedback again on the latest version.

### Actions

* **Use as reference**
* **Run feedback on current draft**

## 13.3 Rule

Do not silently treat old feedback as current.

---

## 14. Parent-facing visibility surfaces

## 14.1 Job of the parent view

Give parents clarity and trust without making the student product feel surveilled.

## 14.2 Parent view should optimize for

* progress visibility
* understanding of boundaries
* confidence in what the product is and is not doing
* high-level next-step visibility

## 14.3 Parent view should not become

* the primary authoring surface
* a hidden control room over the student
* a duplicate of the student workspace

## 14.4 Recommended parent surface sections

### Progress snapshot

* current stage
* whether a direction has been selected
* whether a current draft exists
* whether supplement work has started

### Current recommendation summary

Short version of the student’s current anchor recommendation where permissions allow.

### Boundary reminder

Example:

This tool helps students choose and strengthen ideas. It does not write final essays for them.

### Suggested support prompt

Optional guidance for the parent on how to support without overtaking authorship.

Example:

Ask about the moment that changed their thinking, not just what they accomplished.

## 14.5 Hard rule

Do not make the student UI feel like it is reporting upward to the parent.

---

## 15. Result-copy system

## 15.1 Recommendation language

Use:

* This is the strongest direction.
* This angle gives you the clearest story.
* This option is more convincing because…

Avoid:

* This could be a compelling option.
* This may resonate strongly.
* This potentially offers a meaningful opportunity.

## 15.2 Uncertainty language

Use:

* I can see the topic, but not yet the turning point.
* There is enough here for a tentative read, not a strong recommendation.
* This has promise, but one key detail is still missing.

Avoid:

* Based on the available information, it appears that…
* Additional contextual detail may enhance the analysis.

## 15.3 Praise language

Use:

* This opening has energy.
* This detail feels real.
* This scene earns attention.

Avoid:

* This is powerful and authentic.
* This compelling reflection deeply resonates.

## 15.4 Revision language

Use:

* Cut the summary here.
* Name the decision you made.
* Keep the scene, shorten the explanation.

Avoid:

* Consider refining specificity and enhancing flow.

---

## 16. First three screens audit checklist

Before launch, test the first three screens against these questions:

* Can the user understand the first promise in under 10 seconds?
* Is the primary action obvious?
* Is the input burden low enough to start rough?
* Does the first result create a real recommendation, not a summary?
* Is the next step clear?
* Could the user describe the value in one sentence after seeing it?

If any answer is no, simplify again.

---

## 17. Accessibility execution rules for these screens

At minimum, these surfaces must support:

* clear heading order
* keyboard navigation
* visible focus states
* readable contrast
* linear reading order
* no color-only status meaning
* concise action labels
* predictable error and recovery messaging

The fast-read block, partial-result block, and blocked-state recovery block must all be understandable in a screen-reader-friendly linear sequence.

---

## 18. Launch implementation order

### Step 1

Implement first-session landing + input + fast-read result for Narrative Direction Selection.

### Step 2

Implement compare-alternatives screen with real winner logic.

### Step 3

Implement one-question recovery loop for partial/blocked direction results.

### Step 4

Implement Essay Feedback result screen with highest-leverage correction first.

### Step 5

Implement stale-state treatment for feedback and direction artifacts.

### Step 6

Implement parent-facing progress surface, if included in launch.

---

## 19. Definition of success for this spec

This spec is successful only if the implemented product creates the following reactions:

### Student reaction

* This got to the point quickly.
* It made a real call.
* It did not write for me.
* It told me what to do next.
* It felt sharper than generic AI.

### Parent reaction

* This feels serious.
* I can see progress.
* It respects authorship boundaries.

### Internal product reaction

* the screen hierarchy is simpler
* blocked states preserve momentum
* the first session is no longer intake-heavy
* visible language sounds premium and trustworthy

---

## 20. Final directive

Build the visible product so it feels simpler, sharper, and more premium than the engine underneath it.

Do not let the user experience expose the machinery.
Let it expose the value.

The launch-critical screens should feel:

* fast
* calm
* decisive
* evidence-based
* non-ghostwriting
* low-friction
* emotionally intelligent without being soft

That is the standard for the v1 screen-by-screen UX execution layer.
