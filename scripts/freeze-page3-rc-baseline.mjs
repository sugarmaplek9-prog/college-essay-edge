import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();
const RC_DIR = path.join(ROOT, 'evaluation_outputs', 'page3_release_candidate_v1');
const BASELINE_JSON = path.join(ROOT, 'scripts', 'data', 'frozen', 'page3-release-candidate-baseline-v1.json');
const BASELINE_MD = path.join(ROOT, 'scripts', 'data', 'frozen', 'page3-release-candidate-baseline-v1.md');
const CONTRACT_PATH = path.join(ROOT, 'scripts', 'data', 'frozen', 'page3-release-candidate-contract-v1.json');
const RC_STATUS_PATH = path.join(RC_DIR, 'PAGE3_RC_STATUS_V1.json');
const REPORT_PATH = path.join(ROOT, 'evaluation_outputs', 'page3_layers', 'MULTILAYER_VALIDATION_REPORT_V1.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function safeSha(filePath) {
  return fs.existsSync(filePath) ? sha256File(filePath) : null;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function countResidualComprehensionFailures(summaryPath) {
  const summary = readJson(summaryPath);
  let total = 0;
  for (const row of summary.rows ?? []) {
    for (const candidate of row?.product?.canonical_payload?.candidate_debug?.scores_by_candidate ?? []) {
      for (const reason of candidate.rejection_reasons ?? []) {
        if (reason === 'comprehension_fail') total += 1;
      }
    }
  }
  return total;
}

function main() {
  const contract = readJson(CONTRACT_PATH);
  const rcStatus = readJson(RC_STATUS_PATH);
  const report = readJson(REPORT_PATH);
  const layerB = report.layers.find((layer) => layer.id === 'layer_b_unseen_validation');
  const layerBSummaryPath = path.join(layerB.out_dir, 'summary.json');
  const residualComprehensionFailTotal = countResidualComprehensionFailures(layerBSummaryPath);

  const frozenAssets = {
    contract: relative(CONTRACT_PATH),
    layer_a_cases: contract.frozen_assets.layer_a_benchmark,
    layer_b_cases: contract.frozen_assets.layer_b_unseen_validation,
    layer_c_cases: contract.frozen_assets.layer_c_messy_validation,
    layer_runner: contract.frozen_assets.layer_runner,
    holdout_runner: contract.frozen_assets.holdout_runner,
    pool_integrity_audit: contract.frozen_assets.pool_integrity_audit,
    packet_validation_gate: contract.frozen_assets.packet_validation_gate,
    why_contract_audit: contract.frozen_assets.why_contract_audit,
    frozen_regression_standard: contract.frozen_assets.frozen_regression_standard,
    runtime_direction: 'src/lib/fm/direction.ts',
    runtime_canonical_payload: 'src/lib/fm/canonicalPage3Payload.ts'
  };

  const assetHashes = Object.fromEntries(
    Object.entries(frozenAssets).map(([name, relPath]) => {
      const abs = path.join(ROOT, relPath);
      return [name, { path: relPath, sha256: safeSha(abs) }];
    })
  );

  const baseline = {
    baseline_id: 'page3_release_candidate_baseline_v1',
    accepted_on: new Date().toISOString(),
    release_candidate_id: contract.release_candidate_id,
    source_contract_path: relative(CONTRACT_PATH),
    rc_status_path: relative(RC_STATUS_PATH),
    multilayer_report_path: relative(REPORT_PATH),
    accepted_state: {
      rc_pass: rcStatus.rc_pass,
      all_layers_packet_valid: report.summary?.all_layers_packet_valid,
      all_layers_no_collapse: report.summary?.all_layers_no_collapse,
      frozen_regression_ok: report.summary?.frozen_regression_ok,
      layer_results: report.layers.map((layer) => ({
        id: layer.id,
        label: layer.label,
        final_tally: layer.final_tally,
        collapse_cases: layer.pool_integrity?.collapse_cases,
        dominant_family_ratio: layer.pool_integrity?.dominant_family_ratio,
        packet_valid_for_review: layer.packet_validation?.packet_valid_for_review,
        failed_gates: layer.packet_validation?.failed_gates ?? []
      })),
      why_contract_alignment_ok: rcStatus.why_contract?.contract_alignment_ok ?? false,
      residual_comprehension_fail_total_layer_b: residualComprehensionFailTotal,
      recovered_unseen_cases: [
        { case_id: 'UV1_07', zero_candidate_failure_closed: true },
        { case_id: 'UV1_09', zero_candidate_failure_closed: true }
      ]
    },
    frozen_assets: assetHashes,
    accepted_residuals: [
      'Residual candidate-level comprehension_fail rejections still exist in Layer B diagnostics, but no longer produce collapse or packet invalidation.',
      'Layers B and C remain product-only decision layers in the RC suite because their OpenAI baseline cache is intentionally incomplete.'
    ],
    known_limitations: [
      'The frozen evaluator is heuristic and remains a guardrail, not the final human authority for product quality.',
      'The RC suite is strong for remediation protection but does not yet replace broader controlled product testing on real student notes.',
      'Controlled testing still needs operator review to judge landing quality, not just structural validity.'
    ],
    open_questions_for_controlled_testing: [
      'How often do real messy notes trigger fallback candidates without reducing trust in the surfaced recommendation?',
      'Do recommendation openings stay diverse in broader real-case batches beyond the current three layers?',
      'Are there new failure classes in long, partially drafted, or highly comparative inputs that the frozen layers do not cover?'
    ]
  };

  fs.writeFileSync(BASELINE_JSON, JSON.stringify(baseline, null, 2));

  const md = [
    '# Page 3 Release Candidate Baseline V1',
    '',
    `- baseline_id: ${baseline.baseline_id}`,
    `- accepted_on: ${baseline.accepted_on}`,
    `- release_candidate_id: ${baseline.release_candidate_id}`,
    `- rc_pass: ${baseline.accepted_state.rc_pass}`,
    `- all_layers_packet_valid: ${baseline.accepted_state.all_layers_packet_valid}`,
    `- all_layers_no_collapse: ${baseline.accepted_state.all_layers_no_collapse}`,
    `- frozen_regression_ok: ${baseline.accepted_state.frozen_regression_ok}`,
    `- residual_comprehension_fail_total_layer_b: ${baseline.accepted_state.residual_comprehension_fail_total_layer_b}`,
    '',
    '## Layer results',
    ...baseline.accepted_state.layer_results.map((layer) => `- ${layer.label}: tally=${JSON.stringify(layer.final_tally)}, collapse=${layer.collapse_cases}, dominant_family_ratio=${layer.dominant_family_ratio}, packet_valid=${layer.packet_valid_for_review}, failed_gates=${layer.failed_gates.join('|') || 'none'}`),
    '',
    '## Accepted residuals',
    ...baseline.accepted_residuals.map((item) => `- ${item}`),
    '',
    '## Known limitations',
    ...baseline.known_limitations.map((item) => `- ${item}`),
    '',
    '## Open questions for controlled testing',
    ...baseline.open_questions_for_controlled_testing.map((item) => `- ${item}`),
    '',
  ].join('\n');

  fs.writeFileSync(BASELINE_MD, `${md}\n`);
  console.log(JSON.stringify({ out_json: BASELINE_JSON, out_md: BASELINE_MD, baseline_id: baseline.baseline_id }, null, 2));
}

main();
