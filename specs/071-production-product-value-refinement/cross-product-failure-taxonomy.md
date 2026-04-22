# Cross-Product Failure Taxonomy — 071 Production Product Value Refinement

## Purpose

This taxonomy captures shared product failures exposed by the live production baseline. These are not isolated page bugs. They are cross-product value failures that reduce clarity, premium posture, and trust across route families.

## Top shared failure classes

### 1. Route-family incompleteness

Symptoms:
- Public trust routes return 404.
- Workspace / execution routes are absent in the live product.
- The product promise widens rhetorically, then disappears structurally.

Why it matters:
- Missing route families make the product feel unfinished.
- Premium value collapses when the system cannot show where the decision goes next.

### 2. Handoff discontinuity

Symptoms:
- Selected-direction logic is strongest at the recommendation moment, but weakly preserved afterward.
- Recommendation, evidence, and next move do not consistently persist into durable execution surfaces.
- The user is asked to trust a system that does not yet visibly carry its own judgment forward.

Why it matters:
- A serious product must feel continuous.
- If the judgment does not survive the handoff, the value feels generic even when the first decision is strong.

### 3. Value density concentration

Symptoms:
- The homepage and first recommendation moment carry most of the product’s value signal.
- Downstream routes do not yet return enough visible structure, saved state, or next-action density.

Why it matters:
- World-class products do not feel impressive in one place and thin everywhere else.
- The whole journey must keep earning trust.

### 4. Weak “what happens next” posture

Symptoms:
- The system can explain what it is, but too often under-explains what the next action is and why it helps now.
- Supportive boundary copy exists, but is unevenly distributed.

Why it matters:
- Forward motion is part of premium feel.
- Users should repeatedly feel clearer, not merely informed.

### 5. Trust posture too concentrated on the homepage

Symptoms:
- The homepage presents the serious, authorship-safe posture well enough.
- Public trust routes and downstream workspace routes do not reinforce that same seriousness because they are missing or incomplete.

Why it matters:
- Premium products do not rely on one page to carry the whole trust burden.
- Trust must survive route changes.

### 6. Output usefulness trails output intelligence

Symptoms:
- The result surfaces can sound smart and discriminating.
- But the product does not yet consistently turn that judgment into persistent artifacts, next moves, and package-level continuation.

Why it matters:
- Users do not pay for intelligence theater.
- They pay for judgment that moves their real work forward.

## Prioritized taxonomy for this lane

The integrated refinement pass should focus on these four issues only:

1. Route-family incompleteness
2. Handoff discontinuity
3. Weak “what happens next” posture
4. Trust posture too concentrated on the homepage

## Out of scope for this taxonomy

- ML tuning
- blind-holdout regressions
- isolated copy preference debates
- page-by-page aesthetic polish without route-family value impact
