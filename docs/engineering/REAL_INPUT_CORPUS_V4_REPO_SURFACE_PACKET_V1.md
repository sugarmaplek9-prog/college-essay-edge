# REAL_INPUT_CORPUS_V4_REPO_SURFACE_PACKET_V1.md

## Purpose

This packet executes the V4 integration input request by documenting the **actual repository integration surface** in College Essay Edge.

Date: 2026-03-18

---

## 1) Project root structure + framework/config files

### Root (top-level)
- .env.example
- .env.phase6.prod
- .env.test.local
- db/
- docs/
- evaluation/
- evaluation_outputs/
- package.json
- package-lock.json
- playwright.config.ts
- postcss.config.mjs
- scripts/
- src/
- supabase/
- tsconfig.json
- vitest.config.ts

### Required files (present)
- package.json
- package-lock.json
- tsconfig.json
- vitest.config.ts

### Framework config findings
- next.config.*: not present
- vite.config.*: not present
- jest.config.*: not present
- drizzle.config.*: not present
- prisma/schema.prisma: not present

---

## 2) Database layer (actual)

### Supabase client/auth DB access
- src/lib/supabase/server.ts
  - createAuthClient() for user-scoped DB access
  - createServiceClient() for service-role access

### Existing schema migration layer
- supabase/migrations/20260311000001_ai_spine_schema.sql
  - Defines AI spine enums/tables for ai_runs, ai_artifacts, validator_results, etc.
- supabase/migrations/ (directory present)

### New RIC migration in repo
- db/migrations/001_real_input_corpus_substrate.sql

### RIC DB integration scaffolding added
- src/lib/real-input-corpus/realInputCorpusDb.ts
- src/lib/real-input-corpus/realInputCorpusTransactions.ts
- src/lib/real-input-corpus/realInputCorpusPgAdapter.ts

Notes:
- Current production data access pattern is Supabase client + table RPC style from route/service modules.
- No Prisma/Drizzle usage detected.

---

## 3) Route/API layer (actual)

### App Router API surface
- src/app/api/intake/session/route.ts
- src/app/api/v1/ai/runs/route.ts
- src/app/api/v1/ai/runs/[run_id]/route.ts
- src/app/api/v1/ai/runs/[run_id]/artifact/route.ts
- src/app/api/v1/ai/artifacts/[artifact_id]/select/route.ts

### Route conventions observed
- Next.js App Router route handlers (export async function GET/POST)
- NextRequest / NextResponse pattern
- Inline request validation functions inside route files
- Error mapping by typed service errors to HTTP status codes

---

## 4) Auth/permissions layer (actual)

### Auth setup
- src/lib/supabase/server.ts
  - Cookie-backed auth client via createServerClient
- API routes call db.auth.getUser() for authentication

### Permission pattern
- Ownership checks in service/route path (example: ai run creation and selection routes)
- No centralized role middleware (reviewer/admin role model not yet present)
- No middleware.ts auth gate file detected

---

## 5) Validation/schema layer (actual)

### Existing app pattern
- Manual per-route validation functions in API handlers
  - e.g., validateCreateRunRequest(), validateSelectRequest(), validateRequest()

### RIC runtime validation layer added
- src/types/realInputCorpusSchemas.ts
  - validates create/normalize/run/review/adjudicate/promote/eval-pack payloads

### Zod/central schema framework
- No dedicated zod-based central validation layer detected in current integration surface.

---

## 6) Existing service-layer patterns (representative)

- src/lib/ai/run-service.ts
- src/lib/ai/artifact-service.ts
- src/lib/ai/selection-service.ts
- src/lib/ai/modules/narrative-intake/intake-orchestrator (called by intake route)
- src/lib/ai/modules/narrative-direction-selection/module-executor.ts

Pattern characteristics:
- Route handler thin orchestration + typed service modules
- Supabase client injected into service functions
- Explicit typed error classes in src/lib/ai/errors.ts

---

## 7) Test harness (actual)

### Config
- vitest.config.ts
  - Node environment
  - include: src/__tests__/**/*.{test,spec}.ts (excluding e2e folder)

### Existing tests
- src/__tests__/unit/evidence-routing.spec.ts
- src/__tests__/ai/nds-premium-angle-writing.test.ts
- src/__tests__/fixtures/orchestrator-responses.ts

### RIC tests added
- src/__tests__/unit/realInputCorpusService.test.ts
- src/__tests__/unit/realInputCorpusHandlers.test.ts

---

## 8) Environment/config model (actual)

### Observed model
- Direct process.env reads in runtime modules (no central env parser module)
- Example:
  - src/lib/supabase/server.ts (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
  - src/lib/release/blankPageRolloutGuard.ts (BLANK_PAGE_ROLLOUT_* flags)

### Env files at root
- .env.example
- .env.phase6.prod
- .env.test.local

---

## 9) Existing admin/reviewer UI surface

Findings:
- No src/app/admin/** detected
- No src/components/admin/** detected
- No src/components/ui/** design-system folder detected

Current component surface:
- src/components/firstMinute/

Implication:
- Reviewer/admin UI for RIC likely needs fresh App Router surfaces or reuse of current product UI patterns from first-minute flow.

---

## 10) Current NDS implementation surface (actual)

### Core NDS module path
- src/lib/ai/modules/narrative-direction-selection/
  - context-assembler.ts
  - module-executor.ts
  - normalize-context.ts
  - prompt-builder.ts
  - readiness.ts
  - source-resolution.ts
  - validator.ts

### Runtime orchestration and API entry
- src/app/api/v1/ai/runs/route.ts
- src/lib/ai/run-service.ts
- src/lib/ai/worker/execute-run.ts
- src/lib/ai/selection-service.ts
- src/app/api/v1/ai/artifacts/[artifact_id]/select/route.ts

### Types
- src/types/ai.ts

---

## 11) Existing review/evaluation artifacts in code

### Code-level eval/review-adjacent surfaces
- src/lib/evals/blankPage/
- src/lib/evals/schema/
- src/__tests__/unit/* (blank-page routing, telemetry, release-input checks)

### Scripted eval/report surfaces
- scripts/nds-*.ts
- scripts/product-*.ts
- evaluation/
- evaluation_outputs/

### RIC review/eval substrate surfaces added
- src/types/realInputCorpus.ts
- src/types/api/realInputCorpusApi.ts
- src/types/realInputCorpusExport.ts
- src/types/realInputCorpusService.ts
- src/types/realInputCorpusSchemas.ts
- src/lib/real-input-corpus/*

---

## 12) Migration and code ownership conventions (observed)

### Migration conventions currently present
- Supabase migration naming style: timestamp prefix
  - supabase/migrations/20260311000001_ai_spine_schema.sql
- Additional RIC migration currently added under db/migrations/001_real_input_corpus_substrate.sql

### Command surface (from package.json)
- install: npm install
- dev: npm run dev
- build: npm run build
- lint: npm run lint
- test: npm run test
- test watch: npm run test:watch
- coverage: npm run test:coverage

Note:
- No dedicated `typecheck` npm script currently defined.

---

## 13) Exact file list (fast-path set)

### Core stack
- package.json
- package-lock.json
- tsconfig.json
- vitest.config.ts

### DB
- src/lib/supabase/server.ts
- supabase/migrations/20260311000001_ai_spine_schema.sql
- db/migrations/001_real_input_corpus_substrate.sql
- src/lib/real-input-corpus/realInputCorpusDb.ts
- src/lib/real-input-corpus/realInputCorpusTransactions.ts
- src/lib/real-input-corpus/realInputCorpusPgAdapter.ts

### API
- src/app/api/intake/session/route.ts
- src/app/api/v1/ai/runs/route.ts
- src/app/api/v1/ai/runs/[run_id]/route.ts
- src/app/api/v1/ai/runs/[run_id]/artifact/route.ts
- src/app/api/v1/ai/artifacts/[artifact_id]/select/route.ts

### Auth
- src/lib/supabase/server.ts

### Services
- src/lib/ai/run-service.ts
- src/lib/ai/artifact-service.ts
- src/lib/ai/selection-service.ts
- src/lib/ai/errors.ts

### Validation/types
- src/types/ai.ts
- src/types/realInputCorpus.ts
- src/types/api/realInputCorpusApi.ts
- src/types/realInputCorpusSchemas.ts
- src/types/realInputCorpusService.ts
- src/types/realInputCorpusExport.ts

### Tests
- vitest.config.ts
- src/__tests__/unit/evidence-routing.spec.ts
- src/__tests__/ai/nds-premium-angle-writing.test.ts
- src/__tests__/unit/realInputCorpusService.test.ts
- src/__tests__/unit/realInputCorpusHandlers.test.ts
- src/__tests__/fixtures/orchestrator-responses.ts

### NDS flow
- src/lib/ai/modules/narrative-direction-selection/module-executor.ts
- src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts
- src/lib/ai/modules/narrative-direction-selection/context-assembler.ts
- src/lib/ai/modules/narrative-direction-selection/normalize-context.ts

---

## 14) Integration constraints discovered (important for V4)

1. DB access is Supabase client-centric, not generic SQL pool-centric.
2. Auth and ownership are enforced at route/service boundaries using db.auth.getUser().
3. Validation style is currently function-based and route-local; no global schema framework.
4. No existing reviewer/admin UI shell to plug into directly.
5. No centralized env parsing module; config reads are local process.env checks.
6. Existing AI services already use typed error classes + HTTP code mapping; V4 should match this style.

---

## 15) V4 execution state in this repo

V4 prerequisite visibility requirement is now satisfied by this packet.

What is already integrated:
- RIC schema/types/API contracts
- deterministic export helper
- validation layer
- service orchestration layer
- handler scaffolding
- DB adapter scaffolding
- unit tests for service/handlers

What still needs real runtime binding:
- complete Supabase-backed adapter methods in realInputCorpusPgAdapter
- real API routes for RIC endpoints under src/app/api/**
- explicit reviewer/adjudicator/admin role enforcement model
- integration tests against a real DB-backed test path

---

## 16) Recommended immediate next pass (V4 implementation)

1. Implement adapter methods in src/lib/real-input-corpus/realInputCorpusPgAdapter.ts using current Supabase access style.
2. Add route handlers in src/app/api/real-input-corpus/** matching existing Next route conventions.
3. Reuse typed errors + map to HTTP status in same pattern as AI routes.
4. Add DB-backed tests for lifecycle transitions and promotion guards.
5. Define minimal role checks (reviewer/adjudicator/admin) consistent with current auth model.
