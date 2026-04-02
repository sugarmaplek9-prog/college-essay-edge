# Founder Served Output Verification Canonical V1

Date: 2026-04-01

## Purpose

This document defines the single supported served-output verification path for founder review.

The output that counts is the rendered text on the deployed website, verified through the canonical package entrypoint.

See [docs/engineering/ENGINEERING_WORKSPACE_STANDARD_V1.md](docs/engineering/ENGINEERING_WORKSPACE_STANDARD_V1.md) for the repo-level workspace and completion standard.

## Official command

Run:

- `npm run verify:served:founder`

Environment inputs:

- `PRODUCT_URL` or `PRODUCT_URLS` — one or more deployed .vercel
.next
node_modules
.venv

# Generated verification and testch.nexut and whe.venv

# Geta
# G doplaywright-report
test-results
outputs
eva `test-results
outTHoutputs
evaidevalua pevaluation/runs

cy
# Build artiffaidist
coverage
tmOUcovR_tmp

# OU
#DIR*.log
*.tmp
*.swp
.DS_Stortp*.tmat*.swop.DS_al**/.DS_SMIEOF
cat <<'HAca` — debug-only escape hatch; not valid for final closure

Default case pack:

- `evaluation/cases/founder_served_case_pack_canonical_v1.json`

Canonical verifier:

- `scripts/founder-served-verification-canonical.mjs`

Canonical deploy path:

- `npm run deploy:prod:canonical`

Deploy provenance contract:

- Resolve commit SHA from git when available
- Resolve commit SHA from deploy metadata when available
- Require explicit `GIT_SHA` when neither source is available
- Write deploy provenance records to `evaluation_outputs/founder_served_review/deploy_provenance/`

Legacy founder verification variants and the legacy v1 founder pack/doc path are removed from the supported repo workflow.

## Required artifacts per run

For every run, the bundle must include:

- preview URL
- production URL if promoted
- commit SHA
- exact case IDs tested
- screenshots
- full rendered text
- packet/render match result
- explicit served pass/fail and final pass/fail

## Completion rule

No Page 3 / Page 4 change is called fixed unless all of the following are true:

1. local tests pass
2. `npm run test:first-minute:surface-gates` passes
3. preview deploy is live
4. `npm run verify:served:founder` passes on preview with complete traceability
5. production deploy is live
6. `npm run verify:served:founder` passes on production with complete traceability

Anything less is a candidate, not a fix.
