# PAGE THREE RUNTIME TRUTH MAP V2

Date: 2026-03-24

## Canonicalization status
- Server-owned canonical payload: ✅
- Client-side recommendation derivation: removed from authority path (fallback only) ✅
- Evaluator target aligned to canonical packet in holdout runner: ✅

## Core runtime chain
1. `/api/intake/session` receives raw input.
2. Orchestrator + evidence scoring execute.
3. `RouteDecision` is constructed.
4. Canonical payload is generated once on server.
5. Response includes `canonical_page3_payload`.
6. Client stores payload and renders from packet fields.
7. Holdout/blind packet generation reads canonical packet.

## Observable separation classes
- Routing failures
- Clarification-correct cases
- Fallback-driven cases
- Direction-surface losses
- Direction-surface wins

These classes are now representable from canonical routing + recommendation fields.

## Files
- [src/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1.ts](src/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1.ts)
- [src/lib/fm/canonicalPage3Payload.ts](src/lib/fm/canonicalPage3Payload.ts)
- [src/app/api/intake/session/route.ts](src/app/api/intake/session/route.ts)
- [src/app/start/reflecting/page.tsx](src/app/start/reflecting/page.tsx)
- [src/app/start/direction/page.tsx](src/app/start/direction/page.tsx)
