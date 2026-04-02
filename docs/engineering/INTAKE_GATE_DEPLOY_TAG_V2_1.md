# INTAKE_GATE_DEPLOY_TAG_V2_1

- Deployed at: 2026-03-17
- Production alias: https://college-essay-edge.vercel.app
- Deployment inspect URL: https://vercel.com/college-edge/college-essay-edge/BCLF4q9B5h7Jn6SpCpAt5nPX3sH2
- Deployment URL: https://college-essay-edge-gbriltvoz-college-edge.vercel.app

## Tagged gate versions
- gate_feature_version: `gate_features_v2_1`
- scoring_calibration_version: `gate_scoring_v2_1`
- route_logic_version: `route_logic_v2_1`

## Runtime verification sample
- Endpoint: `POST /api/intake/session`
- Verified response includes:
  - `evidence_strength.gate_version.gate_feature_version`
  - `evidence_strength.gate_version.scoring_calibration_version`
  - `evidence_strength.gate_version.route_logic_version`

## Post-deploy ladder artifacts
- `evaluation/nds_eval_package_v1/outputs/LIVE_INTAKE_GATE_DIAGNOSTIC_V1_PROD_POST_GATE_RECALIBRATION.md`
- `evaluation/nds_eval_package_v1/outputs/NDS_PREDICTIONS_FULL25_CURRENT_NDS_PROD_POST_GATE_RECALIBRATION.jsonl`
- `evaluation/nds_eval_package_v1/outputs/NDS_LIVE_CANDIDATE_INVENTORY_FULL25_PROD_POST_GATE_RECALIBRATION.json`
- `evaluation/nds_eval_package_v1/outputs/NDS_SCORE_REPORT_FULL25_PROD_POST_GATE_RECALIBRATION.md`
- `evaluation/nds_eval_package_v1/outputs/NDS_BENCHMARK_MISS_REVIEW_FULL25_PROD_POST_GATE_RECALIBRATION.json`
