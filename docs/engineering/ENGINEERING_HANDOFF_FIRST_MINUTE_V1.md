# ENGINEERING HANDOFF — FIRST-MINUTE VERTICAL SLICE

**Owner:** Engineering Lead  
**Date:** Now  
**Review Date:** [Next sync]

---

## What We Need by Next Review

### Deliverables (Non-negotiable)

1. **Preview/staging URL** — Live, working, no auth required, accessible in browser
2. **Three seeded review cases** demonstrating the core paths:
   - Strong case: clear input → reflection → strongest direction (+ compare optional)
   - Thin recovery case: minimal input → one-question recovery → updated direction
   - Blocked case: insufficient input → graceful blocked state (no crash)
3. **All 6 minimum tests passing** — CI output showing passes
4. **Status using template only** — Use the yes/no template from FIRST_MINUTE_VERTICAL_SLICE_DELIVERY_V1.md

### What "Done" Looks Like

- I can click the URL
- I can run through all three paths without errors
- Reflection and direction screens render real backend responses
- One-question recovery flow works
- Tests pass in CI
- I've reviewed it and signed off

---

## What's NOT Needed Yet

❌ Visual regression coverage  
❌ Edge-case hardening  
❌ Mobile testing  
❌ Performance benchmarking  
❌ Advanced analytics  
❌ Nightly infrastructure  
❌ Narrative status updates (template only)  

---

## Next Review Format

Provide only this:

```
## FIRST-MINUTE VERTICAL SLICE STATUS

**Date:** [date]

### Product Slice

- [ ] Homepage implemented: yes/no
- [ ] Guided start implemented: yes/no
- [ ] Intake integration live: yes/no
- [ ] Reflection rendering real responses: yes/no
- [ ] Strongest direction rendering real responses: yes/no
- [ ] One-question recovery working: yes/no
- [ ] Compare screen working: yes/no
- [ ] Preview/staging URL available: yes/no

### Minimal Automation

- [ ] Success-path E2E: yes/no
- [ ] Recovery-path E2E: yes/no
- [ ] Blocked-path E2E: yes/no
- [ ] Required-section checks: yes/no
- [ ] Runtime/console checks: yes/no
- [ ] Critical analytics checks: yes/no

**Preview URL:** [link]

**Blockers:** [list, or "none"]
```

---

## The Real Test

Can you hand me a live URL where I can review the first-minute experience?

**If yes:** The reset is real.  
**If no:** This was process theater.

That's the only metric that matters for Phase 1.
