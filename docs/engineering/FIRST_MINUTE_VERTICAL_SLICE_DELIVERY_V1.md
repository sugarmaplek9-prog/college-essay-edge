# FIRST_MINUTE_VERTICAL_SLICE_V1

**Status:** Reset to product-first delivery
**Goal:** Reviewable first-minute experience in live browser
**Timeline:** Focused delivery, no multi-phase sprawl
**Owner:** Product + Engineering

---

## What We're Building Now

A tight, reviewable first-minute vertical slice with the real intake orchestrator behind it, protected by minimum critical-path automation only.

### Product Slice (Must Deliver)

- [ ] Homepage hero + value proposition strip
- [ ] Guided start screen (3 input tabs)
- [ ] Live intake orchestration integration
- [ ] Fast reflection screen (2–3 observations)
- [ ] Strongest direction screen (required sections)
- [ ] One-question recovery path
- [ ] Compare alternatives screen
- [ ] Preview/staging URL available for browser review

### Minimum Automation (Must Deliver)

- [ ] Success-path E2E test: homepage → guided start → reflection → strongest direction
- [ ] Recovery-path E2E test: guided start → one-question recovery → strongest direction
- [ ] Blocked-path E2E test: guided start → graceful blocked state
- [ ] Required-section checks for reflection + strongest-direction screens
- [ ] Runtime / console error checks on core first-minute flow
- [ ] Critical analytics event checks (view/click events firing)

### Explicitly Deferred Until After First-Minute Proof

- broad visual regression coverage
- large-scale UI anti-drift hardening
- extensive nightly infrastructure
- advanced performance/reporting systems
- non-essential edge-case automation
- fixtures F5, F6, F7, F8, F9 detailed coverage
- compare hierarchy visual tests
- mobile regression
- copy/phrase guardrails
- timeout/resilience hardening

---

## Execution Tracks (Minimal)

### Track A — Product Slice Delivery

| Priority | Component | Owner | Status | Blocker |
|----------|-----------|-------|--------|---------|
| 1 | Homepage hero + CTA | Frontend | Not started | Design/copy finalized |
| 2 | Guided start screen (3 tabs) | Frontend | Not started | Backend API contract |
| 3 | POST /api/intake/session contract + fixtures F1-F4 | Backend | Not started | None |
| 4 | Reflection screen rendering live responses | Frontend | Not started | Backend response shape |
| 5 | Strongest direction screen rendering live responses | Frontend | Not started | Backend response shape |
| 6 | One-question recovery + flow continuation | Frontend | Not started | Backend recovery logic |
| 7 | Compare screen (strongest + one weaker angle) | Frontend | Not started | Backend response shape |
| 8 | Staging deployment + preview URL | Platform | Not started | All above components |

### Track B — Minimum Critical-Path Automation

| Priority | Test | Owner | Status | Blocker |
|----------|------|-------|--------|---------|
| 1 | Success-path E2E (F1 fixture) | QA | Not started | Track A #1–7 |
| 2 | Recovery-path E2E (F3 fixture) | QA | Not started | Track A #1–6 |
| 3 | Blocked-path E2E (F4 fixture) | QA | Not started | Track A #1–5 |
| 4 | Reflection required-section checks | Frontend | Not started | Track A #4 |
| 5 | Strongest-direction required-section checks | Frontend | Not started | Track A #5 |
| 6 | Runtime / console error checks on core paths | Frontend | Not started | Track B #1–3 |
| 7 | Critical analytics event firing (smoke) | Analytics | Not started | Track B #1–3 |

---

## Success Criteria for This Phase

You can close this phase when:

1. **Homepage** loads and primary CTA routes to guided start
2. **Guided start** accepts input via 3 tabs and submits to real backend
3. **Intake orchestrator** responds with real routing decisions (success/recovery/blocked)
4. **Reflection** renders 2–3 real observations from the backend response
5. **Strongest direction** renders all required sections from backend response
6. **One-question recovery** accepts an answer and routes to updated direction
7. **Compare** renders strongest + weaker angle when available
8. **Preview/staging URL** is live and accessible in browser
9. **You can review all three paths**: strong case → thin case → blocked case
10. **Product feels** calm, useful, trustworthy, and clearly different from generic AI
11. **Three E2E tests** pass (success/recovery/blocked)
12. **Required sections** are enforced on reflection and direction
13. **No console errors** on core path
14. **Critical analytics events** fire for key actions

---

## Status Template (Use This Format)

```
## FIRST-MINUTE VERTICAL SLICE STATUS

**Reporting Date:** [date]
**Overall Status:** [Green/Yellow/Red]

### Product Slice

- [ ] Homepage implemented: yes/no
- [ ] Guided start implemented: yes/no
- [ ] Intake integration live: yes/no
- [ ] Reflection rendering real responses: yes/no
- [ ] Strongest direction rendering real responses: yes/no
- [ ] One-question recovery working: yes/no
- [ ] Compare screen working: yes/no
- [ ] Preview/staging URL available: yes/no

### Corrected Product Value

- [ ] User can state what the essay is really about: yes/no
- [ ] User can explain why the strongest angle wins: yes/no
- [ ] User knows what to do next immediately: yes/no
- [ ] Compare screen makes weaker angle lose clearly: yes/no
- [ ] Product feels distinct from generic AI writing help: yes/no

### Minimal Automation

- [ ] Success-path E2E: yes/no
- [ ] Recovery-path E2E: yes/no
- [ ] Blocked-path E2E: yes/no
- [ ] Required-section checks: yes/no
- [ ] Runtime/console checks: yes/no
- [ ] Critical analytics checks: yes/no

### Blockers

- [List any active blockers preventing progress]

### Next 24-48 Hours

- [Priority action 1]
- [Priority action 2]
- [Priority action 3]

### Deferred to Post-Proof Phase

- [Item 1]
- [Item 2]
- etc.
```

---

## What This Phase Is NOT

- ❌ A comprehensive QA infrastructure build
- ❌ Broad visual regression or styling guardrails
- ❌ Complete fixture coverage (F5–F9 are nice-to-have)
- ❌ Mobile regression testing
- ❌ Performance benchmarking and trend reporting
- ❌ Advanced resilience/timeout hardening
- ❌ Copy/phrase linting systems
- ❌ Nightly sweeps and trending
- ❌ Comprehensive analytics validation

---

## What This Phase IS

✅ A vertical slice of the real product experience  
✅ Real intake orchestration behind it  
✅ Reviewable in a browser  
✅ Three key paths proven to work  
✅ Minimum automation preventing obvious breakage  
✅ Ready for product/design/leadership review  

---

## Handoff to Phase 2

Once first-minute product proof is complete and reviewable:
- Collect feedback on feel, copy, flow
- Validate that it feels different from generic AI
- Get sign-off on core UX
- THEN invest in broad hardening, visual regression, and full QA infrastructure

The measurement for Phase 1 success is not "we built a big test plan."

The measurement is "I can open a live URL and the first-minute experience is reviewable, working, and feels right."

---

## Key Files / Artifacts to Create

By end of Phase 1:

1. **Schema definition** for POST /api/intake/session (request + response shape)
2. **Minimal fixture pack** (F1, F3, F4 only — strong case, thin recoverable, blocked)
3. **Three E2E test files** (success path, recovery path, blocked path) in Playwright
4. **Two component test files** (reflection required sections, strongest-direction required sections)
5. **Runtime error capture** (console/React error detection in E2E tests)
6. **Analytics event smoke test** (verify critical events fire)
7. **Staging URL** with live preview access
8. **This status document** updated weekly

---

## Not Included in Phase 1

- FM-AT-02 through FM-AT-39 from the large epic (deferred)
- Visual regression infrastructure
- Fixture F5–F9
- Copy guardrails and prohibited patterns
- Performance measurement systems
- Nightly test infrastructure
- Mobile testing
- Compare hierarchy checks
- Timeout/resilience tests beyond basic blocking
- Advanced analytics validation

---

## Phase 1 Hard Gate — Completion Criteria

**Phase 1 is complete ONLY if ALL of the following are true:**

### Deliverables Gate

1. ✅ **Preview/staging URL exists** — accessible, live, not behind auth
2. ✅ **Homepage through compare is reviewable in browser** — all screens load without errors
3. ✅ **Strong-input case works end-to-end** — submits successfully through reflection → direction → optional compare
4. ✅ **Thin-input recovery case works** — routes to one-question recovery, accepts answer, routes to updated direction
5. ✅ **Blocked case works** — routes to graceful blocked state (no crash, no hallucinated confidence)
6. ✅ **All 6 minimum automated checks pass** — success path, recovery path, blocked path, required sections, runtime errors, analytics events

### Review Gate

7. ✅ **Founder/product manual review has occurred** — decision maker has opened the live URL and verified the experience

---

## What NOT to Accept as Phase 1 Completion

❌ "We built a test infrastructure framework"  
❌ "We wrote a comprehensive test plan"  
❌ "We implemented most of the automation"  
❌ "The product mostly works, we'll fix edge cases in Phase 2"  
❌ "Tests pass locally but staging isn't ready yet"  
❌ "The URL exists but has a few issues"  
❌ "We haven't had product review yet but engineering thinks it's good"  

**Phase 1 is not complete until someone can click the link and review the full experience live.**

---

## Next Review Checklist

### At Next Review, Ask For:

- [ ] Preview/staging URL (working, live, no auth)
- [ ] Seeded test cases demonstrating:
  - [ ] Strong-input case (clear notes → reflection → direction)
  - [ ] Thin-input recovery case (minimal notes → recovery question → direction)
  - [ ] Blocked case (insufficient notes → graceful blocked state)
- [ ] All 6 minimum tests passing (with CI/test output showing passes)
- [ ] Status update in yes/no template format only

### Do Not Accept:

- "We're close"
- "Just need a few more days"
- "Everything works except [X]"
- Status updates in narrative format (require yes/no template only)
- URLs that require auth, have errors, or aren't fully functional

---

## Phase 1 → Phase 2 Gates

Phase 2 begins only after all seven hard gates above are met.

At that point, backlog FM-AT-06 through FM-AT-39 and begin broad QA hardening.

The test of whether the reset was real: **Can they hand you a live URL in the next sprint?**

If yes, the reset is real.  
If no, it was process theater.
