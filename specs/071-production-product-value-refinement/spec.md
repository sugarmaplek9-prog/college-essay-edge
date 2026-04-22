# Spec — 071 Production Product Value Refinement

## Feature slug

`071-production-product-value-refinement`

## Issue linkage

Repository policy requires GitHub issue linkage for meaningful changes. I cannot create or link the issue from this environment, so this lane must be attached to the next issue and PR by the repo owner.

## Problem

Production is now live on the canonical alias and is the new baseline.

The product has already cleared:

- model repair
- served UX cleanup
- readiness review
- canonical deployment

The active question is no longer whether the system can work. The active question is whether the live product feels like one serious, premium, trustworthy system across the full route-family journey.

The current live baseline still has whole-product value gaps:

1. public trust routes are incomplete on production
2. downstream workspace routes are absent on production
3. selected-direction value does not persist strongly enough across recommendation → opening → workspace
4. trust / authorship-safe / next-step posture is too concentrated on the homepage instead of distributed across the product

## Governing inputs

Use only:

- the live canonical production site
- the fresh founder served packet
- the cleared readiness / release proof set
- the current production deployment baseline

## Goals

1. Make the live product feel complete across route families instead of impressive only in isolated moments.
2. Make direction-family outputs feel like durable product artifacts with clearer handoff continuity.
3. Restore the missing public trust and workspace families so the product promise is visible after the landing page.
4. Increase perceived value density, trust, and forward motion without reopening ML or deployment lanes.
5. Re-run founder-style served evaluation after one integrated refinement pass.

## In scope

- public trust family: `/`, `/how-it-works`, `/faq`, `/about`, `/start`
- direction family: `/start/direction`, `/start/compare`, `/start/reflecting`, `/start/blocked`, `/start/opening`
- workspace / execution family: `/app`, `/app/personal-statement`, downstream workspace surfaces needed to make the app feel coherent
- support / reassurance language where it improves route-family continuity and explicit next-step guidance
- one integrated representation / shell / handoff pass that improves product-wide continuity
- served revalidation after implementation

## Out of scope

- ML tuning or recommender repair unless production exposes a real judgment failure
- blind-holdout lanes
- deployment / publish work for this lane
- isolated page-by-page copy churn
- aesthetic polish that does not improve clarity, value density, forward motion, trust, specificity, voice, or emotional payoff

## Integrated refinement targets

### 1. Complete the missing route families

Production must include:

- `/how-it-works`
- `/faq`
- `/about`
- `/app`
- `/app/personal-statement`
- the downstream workspace surfaces needed for coherent student navigation

These routes must feel connected to the live product point of view rather than like detached add-ons.

### 2. Promote contract-driven direction continuity

The direction family should render as one connected decision system with:

- clearer page jobs
- stronger recommendation / evidence / risk / next-move persistence
- cleaner recovery posture when live handoff state is missing
- explicit carry-forward into opening and workspace surfaces

### 3. Make the workspace family feel premium and action-driving

The workspace layer should:

- show the current best next move quickly
- preserve the selected direction and live draft state
- make downstream package work feel connected rather than generic
- keep authorship boundaries visible

### 4. Distribute trust and reassurance across the system

The public trust shell and student workspace shell should reinforce:

- what the system does now
- what happens next
- why the guidance is useful
- why the product remains coaching rather than ghostwriting

## Acceptance criteria

1. The live baseline is documented in a route-family audit and failure taxonomy.
2. Public trust routes exist and reinforce the homepage point of view.
3. Workspace routes exist and make the app feel like a real continuation of the first-minute system.
4. Direction-family recommendation / compare / opening / reflection surfaces render as one coherent contract-driven product layer.
5. The strongest next action is obvious on the new workspace family.
6. Trust / authorship-safe copy is distributed more consistently across public and workspace families.
7. `npm run build` succeeds on the refined candidate.
8. Founder-style served evaluation is rerun after the refinement pass.
9. The revalidation packet shows the product is clearer, more premium, and more action-driving without reopening ML repair.
