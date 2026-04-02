# FIRST-MINUTE PRODUCT IMPLEMENTATION ROADMAP

**Status:** Code implementation phase
**Goal:** Live preview/staging URL with working first-minute vertical slice
**Tech Stack:** Next.js 15 + React 19 + Vitest + Playwright
**Current Date:** March 12, 2026

---

## Codebase Status

### Already Implemented ✅

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| Homepage hero + CTA | `src/app/page.tsx` | ✅ Complete | Route → `/start` |
| Guided start screen (3 tabs) | `src/app/start/page.tsx` | ✅ Complete | Input → POST `/api/intake/session` |
| POST /api/intake/session | `src/app/api/intake/session/route.ts` | ✅ Complete | Auth + orchestrator call |
| Reflection screen | `src/app/start/reflecting/page.tsx` | ✅ Complete | Derives observations from intelligence |
| Strongest direction screen | `src/app/start/direction/page.tsx` | ✅ Complete | Derives content + compare alternatives |
| Compare screen | `src/app/start/compare/page.tsx` | ✅ Complete | Shows strongest + weaker options |
| One-question recovery | `src/app/start/question/page.tsx` | 🟡 Partial | Needs UI update + answer flow |
| Blocked state screen | `src/app/start/blocked/page.tsx` | 🟡 Partial | Needs user-friendly exit messaging |
| Analytics event infrastructure | `src/lib/fm/events.ts` | ✅ Complete | Event builder + firing |
| Intake orchestrator | `src/lib/ai/modules/narrative-intake/` | ✅ Complete | Produces IntakeIntelligenceObject |

### What Needs Completion Before Phase 1 Gate

1. **One-question recovery screen** — Update UI, confirm it accepts answer and routes correctly
2. **Blocked state screen** — Ensure messaging is calm and non-technical
3. **Test fixtures** — Create F1, F3, F4 fixtures (strong case, thin recovery, blocked)
4. **Playwright E2E tests** — 3 core paths + 4 check suites (required sections, runtime errors, analytics)
5. **Staging deployment** — Deploy to preview/staging URL
6. **Test all 3 paths** — Verify success, recovery, blocked paths work end-to-end

---

## Implementation Checklist

### Track A — Product UI Completion

- [ ] **A1:** One-question recovery screen UI review and updates (`src/app/start/question/page.tsx`)
- [ ] **A2:** Blocked state screen UI review and updates (`src/app/start/blocked/page.tsx`)
- [ ] **A3:** Test homepage → guided start → submit flow (smoke manual test)
- [ ] **A4:** Test reflection screen rendering (with real F1 fixture response)
- [ ] **A5:** Test direction screen rendering (with real F1 fixture response)
- [ ] **A6:** Test recovery path (with F3 fixture)
- [ ] **A7:** Test blocked path (with F4 fixture)

### Track B — Test Fixtures (Minimal)

- [ ] **B1:** Define F1 fixture (strong case) — rough notes with clear signal
- [ ] **B2:** Define F3 fixture (thin recovery) — minimal notes requiring one question
- [ ] **B3:** Define F4 fixture (blocked) — insufficient input, graceful exit
- [ ] **B4:** Store fixtures in `src/__tests__/fixtures/orchestrator-responses.ts`
- [ ] **B5:** Verify fixtures return correct `recommendation_viability.decision` values

### Track C — Playwright E2E Tests

- [ ] **C1:** Success-path E2E test (`src/__tests__/e2e/success-path.spec.ts`)
  - Homepage load
  - CTA click → `/start`
  - Input + submit with F1 fixture
  - Verify reflection renders
  - Verify direction renders required sections
  - Test CTAs (use direction, compare, sharpen question)
  
- [ ] **C2:** Recovery-path E2E test (`src/__tests__/e2e/recovery-path.spec.ts`)
  - Homepage → guided start → submit with F3
  - Route to `/start/question`
  - Exactly one question renders
  - Answer + submit
  - Route to updated direction
  
- [ ] **C3:** Blocked-path E2E test (`src/__tests__/e2e/blocked-path.spec.ts`)
  - Homepage → guided start → submit with F4
  - Route to `/start/blocked`
  - No crash, safe messaging
  - No blank state

- [ ] **C4:** Required-section checks (unit/component tests)
  - Reflection: header "What I'm seeing so far", 2–3 observations, CTA exists
  - Direction: all 4 required sections present (strongest direction, why it beats obvious, watch-outs, next move)

- [ ] **C5:** Runtime/console error checks
  - No uncaught exceptions during paths
  - No React fatal errors
  - No missing critical resources

- [ ] **C6:** Critical analytics event checks
  - `homepage_view` fires on load
  - `homepage_primary_cta_click` fires on CTA click
  - `fm_start_view` fires on guided start load
  - `fm_input_submit` fires on submission
  - `fm_reflection_view` fires on reflection load
  - `fm_direction_view` fires on direction load
  - `fm_compare_view` fires on compare load (if accessed)
  - `fm_question_view` fires on recovery question load (if needed)

### Track D — CI/Deployment

- [ ] **D1:** Vitest configured for E2E tests (Playwright integration)
- [ ] **D2:** `npm run test` runs all 3 E2E paths + checks
- [ ] **D3:** CI pipeline configured (GitHub Actions or similar)
- [ ] **D4:** Staging deployment configured
- [ ] **D5:** Preview/staging URL accessible and live
- [ ] **D6:** All 3 paths testable in staging

---

## File Structure to Create

```
src/__tests__/
├── e2e/
│   ├── success-path.spec.ts          ← F1 fixture path
│   ├── recovery-path.spec.ts         ← F3 fixture path
│   └── blocked-path.spec.ts          ← F4 fixture path
│
├── fixtures/
│   └── orchestrator-responses.ts      ← F1, F3, F4 fixtures
│
└── unit/
    └── required-sections.spec.ts      ← Reflection + direction checks
```

---

## Fixtures Required

### F1 — Strong Case
```typescript
Input: "I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service."

Expected orchestrator output:
{
  recommendation_viability: { decision: 'success' },
  next_question: null,
  escalation: { escalate: false, blocking: false },
  narrative_pattern: { primary_pattern: 'self_correction_arc' },
  // ... full IntakeIntelligenceObject
}
```

### F3 — Thin Recovery Case
```typescript
Input: "I don't know where to start. I like sports but I'm not great at them."

Expected orchestrator output:
{
  recommendation_viability: { decision: 'needs_more_input' },
  next_question: {
    question_type: 'scene_detail',
    question_text: "Tell me about a specific moment in sports where something surprised you or made you think differently."
  },
  // ... full IntakeIntelligenceObject
}
```

### F4 — Blocked Case
```typescript
Input: "I'm good at everything."

Expected orchestrator output:
{
  recommendation_viability: { decision: 'blocked' },
  escalation: { escalate: true, blocking: true },
  // ... full IntakeIntelligenceObject
}
```

---

## Success Criteria (Phase 1 Hard Gate)

### Deliverables Checklist
- [ ] Preview/staging URL is live and accessible
- [ ] Homepage loads without errors
- [ ] Guided start accepts input and submits
- [ ] F1 fixture path: submit → reflection → direction → compare all render
- [ ] F3 fixture path: submit → recovery question → answer → updated direction
- [ ] F4 fixture path: submit → blocked state (no crash)
- [ ] All required sections present on reflection and direction
- [ ] No console errors on any path
- [ ] All critical analytics events fire
- [ ] All 3 E2E tests pass in CI
- [ ] Manual review completed by founder/product

### Test Output Format
```
PASS  src/__tests__/e2e/success-path.spec.ts
  ✓ F1: Strong case routes correctly (1.2s)
  ✓ F1: Reflection renders required sections (800ms)
  ✓ F1: Direction renders required sections (900ms)
  ✓ F1: Compare screen shows strongest + weaker (600ms)

PASS  src/__tests__/e2e/recovery-path.spec.ts
  ✓ F3: Thin input routes to recovery (950ms)
  ✓ F3: Exactly one question rendered (450ms)
  ✓ F3: Answer submission continues flow (1.1s)

PASS  src/__tests__/e2e/blocked-path.spec.ts
  ✓ F4: Blocked input routes to safe state (800ms)
  ✓ F4: No crash or blank state (500ms)

PASS  src/__tests__/unit/required-sections.spec.ts
  ✓ Reflection has required header
  ✓ Reflection has 2-3 observations
  ✓ Direction has all 4 required sections
  ✓ No console errors during paths

PASS  src/__tests__/analytics.spec.ts
  ✓ Homepage view event fires
  ✓ CTA click event fires
  ✓ Submit event fires with word count
  ✓ Reflection view event fires
  ✓ Direction view event fires
  ✓ Critical events all present in sequence

Tests:      43 passed
Time:       ~15s
```

---

## Implementation Order (Sequential)

1. **Review + update one-question recovery screen** (A1)
2. **Review + update blocked state screen** (A2)
3. **Create test fixtures** (B1–B5)
4. **Create success-path E2E test** (C1)
5. **Create recovery-path E2E test** (C2)
6. **Create blocked-path E2E test** (C3)
7. **Create required-section checks** (C4)
8. **Create runtime/console error checks** (C5)
9. **Create analytics event checks** (C6)
10. **Configure CI and deployment** (D1–D6)
11. **Manual testing of all 3 paths** (A3–A7)
12. **Deploy to staging** + get preview URL
13. **Manual product review** + sign-off

---

## What NOT to Build Yet

❌ Visual regression snapshots  
❌ Mobile testing  
❌ Fixtures F5–F9  
❌ Timeout/error resilience tests  
❌ Performance benchmarking  
❌ Advanced analytics dashboards  
❌ Nightly infrastructure  
❌ Copy guardrails/linting  

---

## Next Action

Start with Track A (product screen review) in parallel with Track B (fixtures).

Once screens are confirmed working, immediately move to Track C (tests).

Staging deployment happens after all tests pass locally.
