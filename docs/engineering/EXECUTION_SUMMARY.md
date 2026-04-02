# FIRST-MINUTE VERTICAL SLICE — EXECUTION SUMMARY

**Status:** Implementation ready
**Timeline:** 5–7 business days to live URL
**Scope:** Focused delivery, no sprawl
**Owner:** Engineering team

---

## What We're Building

A tight, reviewable first-minute product experience with the real intake orchestrator behind it, protected by minimum critical-path automation.

**Deliverable:** A live preview/staging URL where you can:
- Open homepage
- Submit rough notes through guided start
- See reflection with 2–3 observations
- See strongest direction with all 4 required sections
- Test recovery path (one-question)
- Test blocked state (graceful exit)
- Test compare screen (strongest + weaker angle)

---

## Why This Approach

The goal is **product proof, not process theater.**

We're not building:
- ❌ A 39-ticket QA infrastructure epic
- ❌ Visual regression for every screen
- ❌ Nightly test sweeps
- ❌ Edge-case hardening
- ❌ Performance benchmarking

We're building:
- ✅ The real vertical slice
- ✅ Three seeded paths (strong, recovery, blocked)
- ✅ Minimum regression protection (3 E2E tests + checks)
- ✅ A live URL to review
- ✅ Quick manual validation

**Success = you can click the link and the product works.**

---

## Implementation Plan (5–7 Days)

### Day 1 (Today) — Review + Verify
- [ ] Frontend engineer reviews all product screens for production readiness
- [ ] Backend engineer verifies POST `/api/intake/session` returns correct shapes
- [ ] Create test fixtures (F1, F3, F4) ✅ Done
- [ ] Create unit tests for required sections ✅ Done

### Day 2 (Tomorrow) — Manual Testing + Playwright Setup
- [ ] QA manually tests all 3 paths (F1, F3, F4) in local browser
- [ ] Frontend engineer installs Playwright and configures E2E tests
- [ ] Run unit tests locally — should all pass
- [ ] Run E2E tests locally — 3 paths should pass

### Day 3 (Wednesday) — Analytics + Fixes
- [ ] Analytics engineer verifies critical events fire
- [ ] Any defects found in manual testing → quick fixes
- [ ] All tests passing locally
- [ ] Staging deployment preparation

### Day 4 (Thursday) — Deployment + Product Review
- [ ] Deploy to staging (morning)
- [ ] Verify staging URL is live and accessible
- [ ] Smoke test all 3 paths in staging
- [ ] Founder/product reviews staging URL (afternoon)
- [ ] Document feedback (if any)

### Day 5 (Friday) — Sign-Off + Documentation
- [ ] Fix any feedback from product review
- [ ] Final test run in staging
- [ ] All 3 paths working, no errors
- [ ] Phase 1 sign-off: ✅ Complete
- [ ] Phase 2 planning begins

---

## Artifacts Created

### Documentation
✅ `FIRST_MINUTE_VERTICAL_SLICE_DELIVERY_V1.md` — Scope + hard gates
✅ `IMPLEMENTATION_ROADMAP_VERTICAL_SLICE.md` — Technical implementation plan
✅ `DEPLOYMENT_CHECKLIST.md` — Day-by-day execution steps

### Code
✅ `src/__tests__/fixtures/orchestrator-responses.ts` — F1, F3, F4 fixtures
✅ `src/__tests__/unit/required-sections.spec.ts` — Vitest unit tests
✅ `src/__tests__/e2e/success-path.spec.ts` — Playwright E2E scaffold

### Configuration
(To be added) `playwright.config.ts` — Playwright configuration

---

## What Was Already Built (Don't Rebuild)

✅ Homepage hero + CTA (`src/app/page.tsx`)
✅ Guided start screen (`src/app/start/page.tsx`)
✅ POST `/api/intake/session` API (`src/app/api/intake/session/route.ts`)
✅ Reflection screen (`src/app/start/reflecting/page.tsx`)
✅ Strongest direction screen (`src/app/start/direction/page.tsx`)
✅ Compare screen (`src/app/start/compare/page.tsx`)
✅ One-question recovery UI (`src/app/start/question/page.tsx`)
✅ Blocked state screen (`src/app/start/blocked/page.tsx`)
✅ Analytics event infrastructure (`src/lib/fm/events.ts`)
✅ Intake orchestrator (`src/lib/ai/modules/narrative-intake/`)

---

## What Needs Completion

| Task | Owner | Status | Effort |
|------|-------|--------|--------|
| Product screen review | Frontend | Ready | 2 hours |
| Orchestrator response verification | Backend | Ready | 1 hour |
| Manual path testing (F1, F3, F4) | QA | Ready | 3 hours |
| Playwright setup + config | Frontend | Ready | 1 hour |
| E2E test implementation | QA/Frontend | Ready | 4 hours |
| Analytics event verification | Analytics | Ready | 1 hour |
| Staging deployment | Platform/DevOps | Ready | 2 hours |
| Product review | Founder/Product | Scheduled | 1 hour |
| Documentation + sign-off | Engineering | Ready | 1 hour |
| **Total** | **Team** | **Ready** | **~16 hours** |

---

## Phase 1 Hard Gate

You cannot declare Phase 1 complete unless **ALL** of these are true:

1. ✅ Preview/staging URL exists (live, accessible)
2. ✅ Homepage through compare is reviewable in browser
3. ✅ Strong-input case (F1) works end-to-end
4. ✅ Thin-input recovery case (F3) works end-to-end
5. ✅ Blocked case (F4) works end-to-end
6. ✅ All 6 minimum automated checks pass (E2E + unit tests)
7. ✅ Founder/product has manually reviewed and signed off

**No partial credit. No "we're close." All seven gates must be true.**

---

## Next Action

**Tomorrow morning, engineering lead:**

1. **Schedule brief sync (15 min):**
   - Frontend: "Are all product screens production-ready?"
   - Backend: "Is orchestrator endpoint returning correct shapes?"
   - QA: "Are you ready to manual-test 3 paths?"

2. **Confirm team capacity:**
   - Can you deliver staging URL by Thursday EOD?
   - Any blockers in the way?

3. **Kick off:**
   - Assign Day 1 tasks
   - Get to work

---

## If You Get Stuck

Common issues and quick fixes:

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| "Orchestrator returning wrong shape" | Response schema mismatch | Compare actual response to IntakeIntelligenceObject type definition |
| "E2E tests not finding elements" | Selectors wrong | Use browser dev tools, inspect actual HTML, update selectors |
| "Reflection not rendering" | sessionStorage not populated | Verify POST response is stored correctly, check sessionStorage.getItem() |
| "Analytics events not firing" | Event function not called | Check event builder in `src/lib/fm/events.ts`, add console.log() calls |
| "Staging URL 404" | Deployment failed | Check CI logs, verify build succeeded, confirm environment variables set |

---

## Success Looks Like

**Thursday evening:**

You open a link like `https://staging.collegeessayedge.com/`

You:
1. See homepage
2. Click "Let's start"
3. Paste: "I spent three summers volunteering..."
4. Click submit
5. See reflection with observations
6. Click continue
7. See direction with all sections
8. Click compare
9. See strongest + weaker angle
10. Feel: "This is calm, smart, clearly better than generic AI."

**No dead ends. No crashes. No errors.**

**That's Phase 1 complete.**

---

## Phase 2 Gates

After Phase 1 sign-off, you can immediately begin:

- Broad visual regression testing
- Mobile testing
- Fixtures F5–F9
- Advanced error/resilience testing
- Copy guardrails
- Performance benchmarking
- Nightly full-case sweeps

But **not until Phase 1 gates are all met.**

---

## Key Documents for Engineering

1. **Product Delivery:** [FIRST_MINUTE_VERTICAL_SLICE_DELIVERY_V1.md](docs/engineering/FIRST_MINUTE_VERTICAL_SLICE_DELIVERY_V1.md)
2. **Implementation:** [IMPLEMENTATION_ROADMAP_VERTICAL_SLICE.md](docs/engineering/IMPLEMENTATION_ROADMAP_VERTICAL_SLICE.md)
3. **Day-by-Day:** [DEPLOYMENT_CHECKLIST.md](docs/engineering/DEPLOYMENT_CHECKLIST.md)
4. **Fixtures:** [src/__tests__/fixtures/orchestrator-responses.ts](src/__tests__/fixtures/orchestrator-responses.ts)
5. **Unit Tests:** [src/__tests__/unit/required-sections.spec.ts](src/__tests__/unit/required-sections.spec.ts)

---

## Measurement for Success

**The real test is whether you can hand me a live URL soon.**

- **If yes:** Reset is real. Product delivery is happening.
- **If no:** This was process theater.

That's the only metric that matters.

**Go build it.**
