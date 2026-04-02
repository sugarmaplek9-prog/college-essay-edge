# DEPLOYMENT + NEXT STEPS — FIRST-MINUTE VERTICAL SLICE

**Status:** Implementation phase active
**Timeline to Live URL:** 5–7 business days
**Current Blockers:** (to be updated)

---

## What's Ready to Build On

✅ Homepage + hero complete
✅ Guided start screen complete  
✅ POST `/api/intake/session` endpoint complete
✅ Reflection screen complete
✅ Direction screen complete
✅ Compare screen complete
✅ Analytics event infrastructure complete
✅ Intake orchestrator complete
✅ Test fixtures created (F1, F3, F4)
✅ Unit tests for required sections created
✅ E2E test scaffold created (Playwright)

---

## Immediate Next Steps (Priority Order)

### 1. Review Product Screens (Today)

**Review the following and confirm they're production-ready:**

- [ ] `src/app/page.tsx` — Homepage hero messaging and CTA
- [ ] `src/app/start/page.tsx` — Guided start UI (all 3 tabs working)
- [ ] `src/app/start/reflecting/page.tsx` — Reflection screen styling
- [ ] `src/app/start/direction/page.tsx` — Direction screen sections + CTAs
- [ ] `src/app/start/compare/page.tsx` — Compare screen hierarchy
- [ ] `src/app/start/question/page.tsx` — One-question recovery screen UI
- [ ] `src/app/start/blocked/page.tsx` — Blocked state messaging

**Action:** Frontend engineer + designer review each screen. Confirm copy, layout, styling are correct. Document any changes needed.

---

### 2. Verify Orchestrator Responses (Today/Tomorrow)

**Confirm that POST `/api/intake/session` returns correct `IntakeIntelligenceObject`:**

Manual test:
```bash
curl -X POST http://localhost:3000/api/intake/session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [test-token]" \
  -d '{
    "raw_input": "I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service."
  }'
```

Expected response fields:
- `intake_session_id`
- `usable_signal.usable_signal` = `true`
- `recommendation_viability.decision` = `'success'` or `'reduced_scope'`
- `narrative_pattern.primary_pattern` (not `'unknown'`)
- `trusted_evidence.ranking` (array with at least 1 item)

**Action:** Backend engineer confirms orchestrator endpoint is returning correct shape. Document any differences from `IntakeIntelligenceObject` type.

---

### 3. Test All Three Paths Manually (Tomorrow)

**In local browser (`http://localhost:3000`):**

#### Path 1: Strong Case (F1)
```
1. Homepage loads
2. Click primary CTA → /start
3. Enter: "I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service."
4. Click submit
5. Should route to /start/reflecting
6. Should see "What I'm seeing so far" header + 2-3 observations
7. Click continue → /start/direction
8. Should see: "Strongest direction" + "Why it beats the obvious" + "What could make this fall flat" + "Best next move"
9. Should see CTAs: Use, Compare, Sharpen
10. Click Compare → /start/compare
11. Should see strongest + weaker angle
```

**Action:** QA runs path, documents any dead-ends or errors. Screenshots each screen.

#### Path 2: Thin Recovery (F3)
```
1. Start from /start
2. Enter: "I don't know where to start. I like sports but I'm not great at them."
3. Submit
4. Should route to /start/question
5. Should see exactly one question
6. Enter an answer
7. Submit
8. Should route to /start/direction with updated content
```

**Action:** QA runs path, confirms recovery flow works.

#### Path 3: Blocked (F4)
```
1. Start from /start
2. Enter: "I'm good at everything."
3. Submit
4. Should route to /start/blocked
5. Should see calm messaging, no crash
```

**Action:** QA runs path, confirms graceful exit.

---

### 4. Install and Configure Playwright (Tomorrow Afternoon)

```bash
npm install -D @playwright/test
npx playwright install
```

Create `playwright.config.ts` at workspace root:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

**Action:** Frontend engineer installs Playwright and configures tests to run.

---

### 5. Run Unit Tests Locally (Tomorrow Evening)

```bash
npm run test -- required-sections.spec.ts
```

Should pass all 20+ tests on fixture contracts.

**Action:** Verify all unit tests pass. Fix any failures related to fixture shape.

---

### 6. Run E2E Tests Locally (End of Tomorrow)

```bash
npm run test:e2e
```

Expected result: All 3 paths (success, recovery, blocked) pass.

**Troubleshooting:**
- If routes wrong: Check `src/app/start/page.tsx` routing logic
- If sections missing: Check component render logic in reflecting/direction pages
- If timeouts: Increase wait times in test or fix mock intercept

**Action:** Frontend engineer debugs any failing tests. All 3 paths should pass.

---

### 7. Verify Analytics Events (End of Wednesday)

Confirm critical events fire during E2E tests:

```typescript
// In E2E test, capture events:
page.on('console', (msg) => console.log(msg));
// Should see events logged to console:
// - fm_homepage_view
// - fm_cta_click (homepage)
// - fm_start_view
// - fm_input_submit
// - fm_reflection_view
// - fm_direction_view
// - (fm_compare_view if compare accessed)
```

**Action:** Analytics engineer verifies event schema and payloads match contract.

---

### 8. Deploy to Staging (Thursday Morning)

**Steps:**

1. **Build optimized bundle:**
   ```bash
   npm run build
   ```

2. **Deploy to staging environment:**
   - If using Vercel: `vercel deploy --prod --scope [workspace]`
   - If using other: Deploy to staging URL (e.g., `https://staging.collegeessayedge.com`)

3. **Verify staging deployment:**
   ```bash
   curl https://[staging-url]/ | grep "You do not need"
   ```

4. **Run smoke test in staging:**
   - Open staging URL in browser
   - Test F1 path manually
   - Take screenshots

5. **Get preview/staging URL:**
   - Share with product/founder
   - Format: `https://[staging-url]/` (no auth required)

**Action:** Platform/DevOps engineer deploys and confirms staging URL is live.

---

### 9. Product Review (Thursday Afternoon)

**Give founder/product:**

```
Preview URL: [staging URL]

Test cases to try:
1. Strong case (F1): [copy-paste input]
2. Thin recovery (F3): [copy-paste input]
3. Blocked (F4): [copy-paste input]

Expected outcomes:
F1 → reflection → direction → compare (all sections visible)
F3 → recovery question → answer → updated direction
F4 → graceful blocked state (no crash)
```

**Founder/product reviews:**
- Copy tone and voice
- Screen layout and hierarchy
- Experience calm and trustworthiness
- No chatbot/generic AI feel
- All paths work without errors

**Action:** Document feedback. If major issues, add to defect backlog for quick fixes.

---

### 10. Final Status Update (Friday Morning)

**Create status document:**

```markdown
## FIRST-MINUTE VERTICAL SLICE — PHASE 1 DELIVERY

**Date:** [Date]
**Overall Status:** ✅ COMPLETE

### Product Slice
- [x] Homepage implemented: yes
- [x] Guided start implemented: yes
- [x] Intake integration live: yes
- [x] Reflection rendering real responses: yes
- [x] Strongest direction rendering real responses: yes
- [x] One-question recovery working: yes
- [x] Compare screen working: yes
- [x] Preview/staging URL available: yes

### Minimal Automation
- [x] Success-path E2E: yes (PASS)
- [x] Recovery-path E2E: yes (PASS)
- [x] Blocked-path E2E: yes (PASS)
- [x] Required-section checks: yes (PASS)
- [x] Runtime/console checks: yes (PASS)
- [x] Critical analytics checks: yes (PASS)

### Staging URL
**Preview:** https://[staging-url]/

**Manual Review:** Completed by [Founder/Product]
- [x] Experience reviewed
- [x] All three paths work
- [x] User understands what the essay is really about
- [x] User understands why the strongest angle wins
- [x] User knows what to do next immediately
- [x] Compare makes the flatter obvious version lose clearly
- [x] Feel is calm, trustworthy, distinct from generic AI
- [x] Sign-off: Approved to move to Phase 2

### Deferred to Phase 2
- Visual regression
- Mobile testing
- Advanced hardening
- Performance benchmarking
- Edge-case fixtures (F5-F9)

### Phase 2 Kickoff
Ready to invest in broad QA hardening, visual regression, and full fixture coverage.
```

---

## Final Checklist for Phase 1 Completion

- [ ] All 3 paths tested and working in staging
- [ ] No console errors on any path
- [ ] All unit tests passing
- [ ] All E2E tests passing
- [ ] Analytics events verified
- [ ] Preview URL is live and accessible
- [ ] Founder/product has reviewed and signed off
- [ ] Status document updated
- [ ] README with test instructions updated
- [ ] CI pipeline running all tests

---

## If Something Breaks

**Debugging workflow:**

1. **Local dev test:** Run `npm run dev`, manually test path
2. **Check console:** Look for errors in browser dev tools
3. **Run tests:** `npm run test` + `npm run test:e2e`
4. **Check logs:** Verify orchestrator is returning expected response shape
5. **Isolate:** Which screen is failing? Which part of the flow?
6. **Fix:** Update component or fixture
7. **Re-test:** All three paths
8. **Redeploy:** To staging if needed

---

## Success = Live URL

The hard gate for Phase 1:

✅ **I can open a live URL and review the first-minute experience**

If you can't, Phase 1 is not complete.

If you can, Phase 2 begins immediately.
