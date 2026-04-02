# PAGE THREE ROUTE DECISION MODEL V1

Date: 2026-03-24

## Purpose
Define the canonical `RouteDecision` model used before canonical page-3 payload generation.

## Model

```ts
type RouteDecision = {
  route_target: "direction" | "question" | "blank_page";
  route_confidence: "low" | "medium" | "high";
  route_reason_code: string;
  route_reason_detail: string;
  direction_generation_allowed: boolean;
  clarification_recommended: boolean;
  fallback_required: boolean;
};
```

## Mapping rules

- `blocked` → `blank_page`, `direction_generation_allowed=false`, `fallback_required=true`
- `blank_page_intake` → `blank_page`, `direction_generation_allowed=false`, `clarification_recommended=true`
- `clarification` → `question`, `direction_generation_allowed=true`, `clarification_recommended=true`
- `direction_light`/`direction_full` → `direction`, `direction_generation_allowed=true`

## Unknown demotion rule
`unknown` classification is diagnostic only. It lowers confidence and increases audit visibility, but does not auto-veto direction generation.

## Implementation
- [src/lib/fm/canonicalPage3Payload.ts](src/lib/fm/canonicalPage3Payload.ts)
- [src/app/api/intake/session/route.ts](src/app/api/intake/session/route.ts)
