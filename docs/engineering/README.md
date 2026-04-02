# FIRST-MINUTE VERTICAL SLICE — MASTER INDEX

**Status:** Implementation phase active  
**Timeline:** 5–7 business days to live URL  
**Goal:** Reviewable first-minute product + minimum protective tests

---

## Core Documents (Read These First)

1. **[QUICK_START.md](QUICK_START.md)** ← **Start here**
   - 3 paths you're building
   - What to verify (in order)
   - Test commands
   - Phase 1 success criteria

2. **[EXECUTION_SUMMARY.md](EXECUTION_SUMMARY.md)**
   - Why this approach
   - 5–7 day implementation plan
   - What was already built
   - Common issues + fixes

3. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)**
   - Day-by-day execution steps
   - Manual testing workflow
   - Playwright setup instructions
   - Staging deployment process

4. **[IMPLEMENTATION_ROADMAP_VERTICAL_SLICE.md](IMPLEMENTATION_ROADMAP_VERTICAL_SLICE.md)**
   - Current codebase status
   - What's ready vs. what needs completion
   - File structure to create
   - Success criteria

5. **[FIRST_MINUTE_VERTICAL_SLICE_DELIVERY_V1.md](FIRST_MINUTE_VERTICAL_SLICE_DELIVERY_V1.md)**
   - Scope definition
   - Product slice checklist
   - Minimum automation requirements
   - Phase 1 hard gates

---

## Code Files (What You're Working With)

### Test Fixtures (Ready to Use)
- **[src/__tests__/fixtures/orchestrator-responses.ts](../../../src/__tests__/fixtures/orchestrator-responses.ts)**
  - `FIXTURE_F1_STRONG_CASE` — Clear signal, strong case
  - `FIXTURE_F3_THIN_RECOVERY` — Minimal signal, recovery needed
  - `FIXTURE_F4_BLOCKED` — No signal, graceful exit

### Tests (Ready to Run/Complete)
- **[src/__tests__/unit/required-sections.spec.ts](../../../src/__tests__/unit/required-sections.spec.ts)**
  - Unit tests for reflection + direction required sections
  - Run: `npm run test -- required-sections.spec.ts`

- **[src/__tests__/e2e/success-path.spec.ts](../../../src/__tests__/e2e/success-path.spec.ts)**
  - Playwright E2E test scaffold for F1 path
  - Install Playwright, update import paths, run: `npm run test:e2e`

### Product Screens (Already Built — Review)
- `src/app/page.tsx` — Homepage hero + CTA
- `src/app/start/page.tsx` — Guided start (3 input tabs)
- `src/app/start/reflecting/page.tsx` — Reflection screen
- `src/app/start/direction/page.tsx` — Strongest direction screen
- `src/app/start/compare/page.tsx` — Compare screen
- `src/app/start/question/page.tsx` — One-question recovery
- `src/app/start/blocked/page.tsx` — Blocked state

### Backend Orchestrator (Already Built — Verify)
- `src/app/api/intake/session/route.ts` — POST `/api/intake/session` endpoint
- `src/types/intake.ts` — `IntakeIntelligenceObject` type definition
- `src/lib/ai/modules/narrative-intake/` — Orchestrator implementation

---

## 3 Paths You're Testing

### F1 — Strong Case (Success Path)
```
Input: "I spent three summers volunteering at the hospital..."
Expected: homepage → /start → submit → /reflecting → /direction → /compare
Expected outcome: All screens render, all sections present, no errors
Test: src/__tests__/e2e/success-path.spec.ts
```

### F3 — Thin Recovery (Recovery Path)
```
Input: "I like sports but I'm not great at them."
Expected: homepage → /start → submit → /question → answer → /direction
Expected outcome: Exactly one question, answer continues flow
Test: (needs to be created) src/__tests__/e2e/recovery-path.spec.ts
```

### F4 — Blocked (Error Path)
```
Input: "I'm good at everything."
Expected: homepage → /start → submit → /blocked
Expected outcome: Graceful exit, safe messaging, no crash
Test: (needs to be created) src/__tests__/e2e/blocked-path.spec.ts
```

---

## 6 Minimum Tests You're Running

### E2E Tests (Playwright)
1. ✅ Success-path test (F1 fixture) — scaffolded, needs Playwright setup
2. 🟡 Recovery-path test (F3 fixture) — needs to be created
3. 🟡 Blocked-path test (F4 fixture) — needs to be created

### Unit/Contract Tests (Vitest)
4. ✅ Required sections checks — already created
5. 🟡 Runtime/console error checks — needs implementation
6. 🟡 Critical analytics event checks — needs implementation

**All 6 must pass for Phase 1.**

---

## The 5–7 Day Plan

| Day | Owner | Task | Output |
|-----|-------|------|--------|
| Today | Frontend | Review all product screens | Confirmation: "Production ready" |
| Today | Backend | Verify orchestrator responses | Confirmation: "Correct shape" |
| Tomorrow | QA | Manually test F1, F3, F4 paths | Manual test report |
| Tomorrow | Frontend | Install Playwright, run tests locally | All tests pass |
| Tomorrow | Analytics | Verify critical events fire | Event schema confirmed |
| Wednesday | Team | Fix any issues found | All paths working locally |
| Thursday | DevOps | Deploy to staging | Live staging URL |
| Thursday | Product | Manual review | Feedback + sign-off |
| Friday | Team | Final validation + documentation | Phase 1 complete |

---

## Phase 1 Hard Gates (All Must Be True)

1. ✅ Preview/staging URL exists (live, no auth)
2. ✅ Homepage → submit → reflection → direction works (F1 path)
3. ✅ Recovery question path works (F3 path)
4. ✅ Blocked state works gracefully (F4 path)
5. ✅ All 6 minimum tests pass in CI
6. ✅ No console/runtime errors on any path
7. ✅ Founder/product has reviewed and approved

**No partial credit. All 7 gates must be true.**

---

## What You're NOT Building (Phase 1)

❌ Visual regression snapshots  
❌ Mobile testing  
❌ Fixtures F5–F9  
❌ Timeout/resilience tests  
❌ Copy guardrails  
❌ Performance benchmarking  
❌ Nightly infrastructure  
❌ Broad hardening  

All of this happens in Phase 2, **after** the product proof is complete.

---

## Success = Live URL

**The real test:**

Can you hand me a live staging URL by Thursday EOD where I can:
- Click the link
- Go through F1 path (submit → reflection → direction)
- See all required sections
- Feel the product is calm, trustworthy, and clearly different from generic AI

If yes → Phase 1 complete, Phase 2 begins  
If no → Not done yet

---

## Key Commands

```bash
# Start development server
npm run dev

# Run unit tests
npm run test

# Install Playwright (do this)
npm install -D @playwright/test
npx playwright install

# Run E2E tests (after Playwright installed)
npm run test:e2e

# Build for production
npm run build

# Deploy (your command here)
vercel deploy --prod  # or equivalent
```

---

## Questions? Blockers?

**Check these in order:**

1. Does the orchestrator endpoint work locally?
   - Test manually: `curl -X POST http://localhost:3000/api/intake/session`
   - Check response shape matches `IntakeIntelligenceObject`

2. Do all 3 product screens render correctly?
   - Open browser, manually go through each path
   - Check browser console for errors

3. Do unit tests pass?
   - `npm run test -- required-sections.spec.ts`

4. Do E2E tests pass?
   - `npm run test:e2e` (after Playwright setup)

5. Is analytics event firing?
   - Check browser console when events fire
   - Verify payload structure

---

## Next Action for Engineering Lead

**Tomorrow morning, send this to the team:**

```
IMMEDIATE PRIORITY — FIRST-MINUTE VERTICAL SLICE

Goal: Live staging URL by Thursday EOD

Day 1 (Today):
- Frontend: Review all product screens for prod-readiness
- Backend: Verify orchestrator endpoint returns correct shapes
- QA: Prepare to manually test 3 paths tomorrow

Day 2 (Tomorrow):
- QA: Manual test F1, F3, F4 paths
- Frontend: Install Playwright, run tests locally
- Analytics: Verify events fire

Day 3 (Wednesday):
- Whole team: Fix any issues
- All 3 paths working locally
- All tests passing

Day 4 (Thursday):
- DevOps: Deploy to staging
- QA: Smoke test staging
- Team: Product review + feedback

Day 5 (Friday):
- Final validation
- Phase 1 sign-off

Docs: See QUICK_START.md in docs/engineering/

Questions? Ask before you start.
```

---

## Timeline Summary

| Timeline | Milestone |
|----------|-----------|
| Today | ✅ Docs created, fixtures ready |
| Tomorrow | 🟡 Manual testing complete |
| Wednesday | 🟡 All tests passing locally |
| Thursday | 🟡 Live staging URL + product review |
| Friday | 🟡 Phase 1 sign-off |

**5–7 days total.**

---

## Success Looks Like

**Thursday evening:**
- You open a URL
- Submit "I spent three summers volunteering..."
- See reflection + direction + compare
- Product feels calm, trustworthy, distinct
- All 3 paths work with no errors
- Manual review: ✅ Approved

**That's it. That's Phase 1.**

---

## Phase 2 (After Sign-Off)

Once Phase 1 is complete:
- Visual regression
- Mobile testing  
- Advanced hardening
- Nightly infrastructure
- Full QA suite

But not before Phase 1 gates are met.

---

**Start with [QUICK_START.md](QUICK_START.md).**

**Go build it.**
