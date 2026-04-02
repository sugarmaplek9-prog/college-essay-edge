# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_MILESTONE_NOTE_V1

**Date:** 2026-03-17  
**Scope:** Structured blank-page intake, Phase 1  
**Derived from:** `STRUCTURED_BLANK_PAGE_INTAKE_BUILD_BACKLOG_V1`

## Internal milestone

- **Owner:** First-minute engineering / intake routing
- **Phase number:** 1 — Detection and mode assignment
- **Files to touch:**
  - `src/lib/ml/evidenceStrength/features.ts`
  - `src/lib/ml/evidenceStrength/model.ts`
  - `src/app/api/intake/session/route.ts`
  - `src/types/intake.ts` (only if Phase 1 introduces new debug fields in the response contract)
- **Done conditions:**
  - blank-page-like inputs classify into the supported classes: `topic_only`, `theme_only`, `activity_only`, `scope_uncertain`, `blank_page`, `too_thin_to_recover`
  - eligible cases route into structured blank-page intake instead of blunt block or fake direction
  - non-blank-page directional inputs continue to follow the current clarification / direction paths
  - route behavior is deterministic and does not inflate blocked outcomes
- **Test commands:**
  - `npx vitest run src/__tests__/unit/evidence-routing.spec.ts src/__tests__/unit/first-minute-threshold.spec.ts --reporter=basic`
  - `npm run build`
  - `npm run test:product:real-user-sim`
- **Rollback note:**
  - if routing quality regresses, remove the blank-page route branch from `src/app/api/intake/session/route.ts` and keep any new detection signals debug-only; the safe fallback is the current `clarification` / `blocked` / `direction_*` flow
