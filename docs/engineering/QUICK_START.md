# ENGINEERING QUICK START — FIRST-MINUTE VERTICAL SLICE

**You have 3 core jobs:**

1. **Get it working** — All 3 paths (F1, F3, F4) in staging
2. **Protect it** — 6 minimum tests passing (3 E2E + checks)
3. **Get feedback** — Live URL for manual review

**Timeline: 5–7 days**

---

## The 3 Paths You're Building

### Path 1: Strong Case (F1)
```
Input: "I spent three summers volunteering at the hospital, 
        and I thought I was helping. In my third summer, 
        a nurse pulled me aside and said I was just getting in the way. 
        That conversation changed how I think about service."

Expected flow:
  Homepage → /start → submit → /reflecting → /direction → /compare
  
Expected state:
  - Reflection: header + 2–3 observations
  - Direction: 4 sections (strongest, why it beats obvious, watch-out, next move)
  - Compare: strongest card dominant, weaker alternative visible
```

### Path 2: Thin Recovery (F3)
```
Input: "I don't know where to start. I like sports but I'm not great at them."

Expected flow:
  Homepage → /start → submit → /question → answer → /direction (updated)
  
Expected state:
  - One question shown (exactly one)
  - After answer, direction renders with updated content
```

### Path 3: Blocked (F4)
```
Input: "I'm good at everything."

Expected flow:
  Homepage → /start → submit → /blocked
  
Expected state:
  - No crash
  - Safe messaging
  - User sees next-step guidance
```

---

## What You Need to Verify (In Order)

```
DONE? Task                                    Owner      Time
────────────────────────────────────────────────────────────────
[ ] 1. Review all product screens            Frontend    2h
[ ] 2. Verify orchestrator responses         Backend     1h
[ ] 3. Manually test F1 path                 QA         45m
[ ] 4. Manually test F3 path                 QA         30m
[ ] 5. Manually test F4 path                 QA         20m
[ ] 6. Fix any issues found                  Frontend    varies
[ ] 7. Install Playwright                    Frontend    30m
[ ] 8. Run unit tests locally                Frontend    15m
[ ] 9. Run E2E tests locally                 Frontend    15m
[ ] 10. Fix any test failures                Frontend    1-2h
[ ] 11. Verify analytics events              Analytics   30m
[ ] 12. Deploy to staging                    DevOps      30m
[ ] 13. Smoke test staging                   QA         20m
[ ] 14. Get live URL                         DevOps      5m
[ ] 15. Product review (async)               Founder     30m
[ ] 16. Final sign-off                       Team        15m
```

---

## Files You Already Have

**Product screens (already built):**
- `src/app/page.tsx` — Homepage
- `src/app/start/page.tsx` — Guided start
- `src/app/api/intake/session/route.ts` — Orchestrator endpoint
- `src/app/start/reflecting/page.tsx` — Reflection
- `src/app/start/direction/page.tsx` — Direction
- `src/app/start/compare/page.tsx` — Compare
- `src/app/start/question/page.tsx` — Recovery question
- `src/app/start/blocked/page.tsx` — Blocked state

**Tests you need to create/run:**
- `src/__tests__/fixtures/orchestrator-responses.ts` ✅ Created
- `src/__tests__/unit/required-sections.spec.ts` ✅ Created
- `src/__tests__/e2e/success-path.spec.ts` ✅ Scaffolded (needs Playwright)

---

## Minimal Test Requirements

**3 E2E tests (Playwright):**
1. F1 success path → all screens render correctly
2. F3 recovery path → one question → continue to direction
3. F4 blocked path → graceful exit, no crash

**3 Check suites (unit/integration):**
1. Required sections present (reflection header + observations)
2. Direction has all 4 required sections
3. No runtime errors during paths

**Exactly 6 checks. Nothing more for Phase 1.**

---

## How to Run Locally

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run all tests
npm run test                    # Unit tests (Vitest)
npm run test:e2e               # E2E tests (Playwright) — after setup

# Or run specific tests:
npm run test -- required-sections.spec.ts
npm run test:e2e -- success-path.spec.ts
```

---

## Test Fixtures

**Already created in `src/__tests__/fixtures/orchestrator-responses.ts`:**

```typescript
FIXTURE_F1_STRONG_CASE        // Clear signal → success
FIXTURE_F3_THIN_RECOVERY      // Minimal signal → needs_more_input
FIXTURE_F4_BLOCKED            // No signal → blocked
```

Each fixture is a complete `IntakeIntelligenceObject` that the orchestrator would return.

---

## Deployment Checklist

When you're ready to go live:

```bash
# Build
npm run build

# Deploy to staging (your DevOps command here)
# e.g., vercel deploy --prod

# Verify
curl https://staging-url.com/ | grep "You do not need"

# Test
npm run test:e2e --baseURL https://staging-url.com

# Result: Should see
# ✅ F1 success path PASS
# ✅ F3 recovery path PASS
# ✅ F4 blocked path PASS
```

---

## Phase 1 Success = All True

- [ ] Preview/staging URL exists
- [ ] Homepage → submit → reflection → direction works (F1)
- [ ] Minimal recovery path works (F3)
- [ ] Blocked path works gracefully (F4)
- [ ] All 3 E2E tests pass
- [ ] All required-section checks pass
- [ ] No console errors
- [ ] Analytics events fire correctly
- [ ] Founder/product has reviewed and approved
- [ ] You have a live URL to show

**If all are true, Phase 1 is done. Phase 2 begins Monday.**

---

## If Something Breaks

**Checklist:**
1. Run locally first: `npm run dev` + manual browser test
2. Check browser console for errors
3. Run unit tests: `npm run test`
4. Run E2E: `npm run test:e2e --debug` (pause and inspect)
5. Verify orchestrator: POST `/api/intake/session` and check response shape
6. Check sessionStorage: Are values being stored/retrieved?
7. Check selectors: Are elements visible in DOM?

**Most common issues:**
- Orchestrator response missing fields → fix fixture or response shape
- Route wrong → check routing logic in start/page.tsx
- Sections not rendering → check component props/state in reflecting/direction pages
- Tests timing out → increase wait times or fix mock intercepts

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server

# Testing
npm run test             # Run all Vitest unit tests
npm run test:watch      # Run tests in watch mode
npm run test:e2e        # Run Playwright E2E tests (after setup)
npm run test:e2e:debug  # Run E2E with debugger attached
npm run test:e2e:ui     # Run E2E with UI

# Build
npm run build           # Build for production
npm start              # Start production server

# Linting
npm run lint           # Lint and format
```

---

## The Only Real Test

**Can you hand me a live URL by Thursday EOD?**

If yes → Reset worked, you're building the product.
If no → Still process theater.

**Go.**
