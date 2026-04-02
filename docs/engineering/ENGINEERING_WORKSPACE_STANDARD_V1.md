# Engineering Workspace Standard V1

Date: 2026-04-01

This note defines the operating standard that follows the closed deployment-mismatch incident. It is infrastructure hardening, not incident spillover.

## Canonical founder verification path

- Canonical verifier: `scripts/founder-served-verification-canonical.mjs`
- Canonical founder pack: `evaluation/cases/founder_served_case_pack_canonical_v1.json`
- Canonical npm entrypoint: `npm run verify:served:founder`
- Canonical production promotion path: `npm run deploy:prod:canonical`

There is one supported founder served-verification path. Do not add parallel verifier variants, alternate founder packs, or competing runbooks.

## Workspace requirement

Trust-critical verification work must run from one git-backed source-of-truth workspace.

- No detached copies
- No ambiguous sibling folders
- No non-provenance workspace for deploy or served verification
- The active workspace must resolve a real commit with `git rev-parse HEAD`, or the run must supply an explicit `GIT_SHA`

## Required execution sequence

The completion sequence is now standard:

1. implement
2. build
3. run named gates
4. deploy preview from that commit
5. run strict served verification on preview
6. promote production from the same commit
7. run strict served verification on production
8. only then call the work complete

Preview green is a candidate. Production green is complete.

## Required proof per promoted run

Every promoted served-verification bundle must include:

- preview URL
- commit SHA
- exact cases tested
- screenshots
- full rendered text
- packet/render match confirmation
- production smoke result when preview is promoted