# PAGE THREE EVALUATOR ALIGNMENT SPEC V1

Date: 2026-03-24

## Goal
Evaluator, UI, and blind packet consume the same canonical page-3 object.

## Canonical source
`sessionStorage.fm_canonical_page3_payload` (originating from server response field `canonical_page3_payload`).

## Runtime changes
1. Server route now returns canonical payload for each intake session.
2. Reflecting and direction pages render recommendation packet from canonical payload.
3. Holdout runner reads canonical payload from browser session storage and uses:
   - `recommendation_packet.displayed_recommendation`
   - `essay_about`
   - `why_this_direction`
   - `weaker_read`
   - `stronger_read`
   - `evidence_lines`
   - `evidence_explanations`

## Script updated
- [scripts/page3-holdout-v2.mjs](scripts/page3-holdout-v2.mjs)

## Alignment rule
No DOM regex extraction is authoritative when canonical payload exists; DOM scraping is fallback-only.
