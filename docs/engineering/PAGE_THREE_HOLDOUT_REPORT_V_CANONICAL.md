# PAGE THREE HOLDOUT REPORT V CANONICAL

Date: 2026-03-24

## Run configuration
- Script: [scripts/page3-holdout-v2.mjs](scripts/page3-holdout-v2.mjs)
- Product URL: https://college-essay-edge.vercel.app
- Evaluator snapshot: `scripts/frozen/page3-evaluator-frozen-2026-03-23.mjs`
- Cases: 12

## Final tally
- Product wins: 11
- OpenAI wins: 1
- Ties: 0
- Unscored: 0

## Stability metrics
- Unknown rate: 8.3% (1/12)
- Runtime expected-pattern match rate: 66.7% (8/12)
- Build: pass
- Intake integration tests: 51/51 pass

## Canonicalization checks
- Product capture source uses canonical payload in session storage first.
- DOM extraction is fallback-only.
- Blind packet includes `essay_about` and `evidence_explanations` fields from canonical packet.

## Artifacts generated
- [evaluation_outputs/page3_holdout_v2/summary.json](evaluation_outputs/page3_holdout_v2/summary.json)
- [evaluation_outputs/page3_holdout_v2/PAGE3_HOLDOUT_V2.md](evaluation_outputs/page3_holdout_v2/PAGE3_HOLDOUT_V2.md)
- [evaluation_outputs/page3_holdout_v2/blind_review_packet.json](evaluation_outputs/page3_holdout_v2/blind_review_packet.json)
- [evaluation_outputs/page3_holdout_v2/BLIND_REVIEW_PACKET_V2.md](evaluation_outputs/page3_holdout_v2/BLIND_REVIEW_PACKET_V2.md)

## Gate readout
Automated holdout remains strong and stable after canonical server-payload refactor.
