import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const ROOT = process.cwd();

const LAYERS = [
  {
    id: 'layer_a_frozen_regression',
    label: 'Layer A — Frozen Regression Benchmark',
    casesPath: path.join(ROOT, 'scripts', 'data', 'frozen', 'page3-holdout-v2-cases.frozen.json'),
    outDir: path.join(ROOT, 'evaluation_outputs', 'page3_layers', 'layer_a_frozen_regression_v1'),
  },
  {
    id: 'layer_b_unseen_validation',
    label: 'Layer B — Unseen Validation Set',
    casesPath: path.join(ROOT, 'scripts', 'data', 'page3-unseen-v1-cases.json'),
    outDir: path.join(ROOT, 'evaluation_outputs', 'page3_layers', 'layer_b_unseen_validation_v1'),
  },
  {
    id: 'layer_c_messy_realworld',
    label: 'Layer C — Messy Input Set',
    casesPath: path.join(ROOT, 'scripts', 'data', 'page3-messy-v1-cases.json'),
    outDir: path.join(ROOT, 'evaluation_outputs', 'page3_layers', 'layer_c_messy_realworld_v1'),
  },
];

const FROZEN_STANDARD_PATH = path.join(ROOT, 'scripts', 'data', 'frozen', 'page3-frozen-regression-standard-v1.json');
const OUT_ROOT = path.join(ROOT, 'evaluation_outputs', 'page3_layers');
const REPORT_JSON = path.join(OUT_ROOT, 'MULTILAYER_VALIDATION_REPORT_V1.json');
const REPORT_MD = path.join(OUT_ROOT, 'MULTILAYER_VALIDATION_REPORT_V1.md');

function runNodeScript(scriptPath, env, label) {
  const res = spawnSync('node', [scriptPath], {
    cwd: ROOT,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status})\n${res.stdout}\n${res.stderr}`);
  }

  return {
    stdout: res.stdout,
    stderr: res.stderr,
  };
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha256File(filePath) {
  return createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function writeProvenance(layer, summary) {
  const packetPath = path.join(layer.outDir, 'blind_review_packet.json');
  const keyPath = path.join(layer.outDir, 'blind_review_answer_key.json');
  const provenancePath = path.join(layer.outDir, 'blind_review_packet.provenance.json');

  const provenance = {
    generated_at: new Date().toISOString(),
    build_id: process.env.BUILD_ID ?? 'unknown_build',
    deploy_id: process.env.DEPLOY_ID ?? 'unknown_deploy',
    product_url: summary.product_url ?? process.env.PRODUCT_URL ?? 'https://college-essay-edge.vercel.app',
    run_directory: layer.outDir,
    source_current_summary: path.join(layer.outDir, 'summary.json'),
    source_baseline_summary: process.env.BASELINE_CACHE_SUMMARY
      ?? path.join(ROOT, 'evaluation_outputs', 'page3_delivery_bundle_v1', 'summary.json'),
    scored_case_count: Number(summary.scored_case_count ?? 0),
    baseline_complete: Boolean(summary.baseline_complete),
    case_count: Number(summary.case_count ?? 0),
    packet_hash_sha256: fs.existsSync(packetPath) ? sha256File(packetPath) : null,
    answer_key_hash_sha256: fs.existsSync(keyPath) ? sha256File(keyPath) : null,
    packet_source: summary.baseline_complete ? 'current_run_product + baseline_cache' : 'current_run_product_only',
  };

  fs.writeFileSync(provenancePath, JSON.stringify(provenance, null, 2));
}

function runLayer(layer) {
  ensureDir(layer.outDir);

  runNodeScript(
    path.join(ROOT, 'scripts', 'page3-holdout-v2.mjs'),
    {
      HOLDOUT_CASES_PATH: layer.casesPath,
      HOLDOUT_OUT_DIR: layer.outDir,
      HOLDOUT_LABEL: `${layer.label} (${new Date().toISOString().slice(0, 10)})`,
    },
    `${layer.id}: holdout`
  );

  const summary = readJson(path.join(layer.outDir, 'summary.json'));
  writeProvenance(layer, summary);

  runNodeScript(
    path.join(ROOT, 'scripts', 'page3-pool-integrity-audit-v1.mjs'),
    { HOLDOUT_OUT_DIR: layer.outDir },
    `${layer.id}: pool-integrity`
  );

  runNodeScript(
    path.join(ROOT, 'scripts', 'tmp_audit_shell_repetition.mjs'),
    { OUT_DIR: layer.outDir },
    `${layer.id}: shell-repetition`
  );

  runNodeScript(
    path.join(ROOT, 'scripts', 'page3-packet-validation-gate-v2.mjs'),
    { OUT_DIR: layer.outDir },
    `${layer.id}: packet-validation`
  );

  const pool = readJson(path.join(layer.outDir, 'POOL_INTEGRITY_AUDIT_V1.json'));
  const packet = readJson(path.join(layer.outDir, 'PACKET_VALIDATION_GATE_V2.json'));

  return {
    id: layer.id,
    label: layer.label,
    cases_path: layer.casesPath,
    out_dir: layer.outDir,
    final_tally: summary.final_tally,
    baseline_complete: summary.baseline_complete,
    scored_case_count: summary.scored_case_count,
    pool_integrity: {
      collapse_cases: pool.totals?.collapse_cases ?? null,
      dominant_family_ratio: pool.totals?.dominant_family_ratio ?? null,
    },
    packet_validation: {
      packet_valid_for_review: packet.packet_valid_for_review,
      failed_gates: packet.failed_gates ?? [],
    },
  };
}

function checkFrozenRegression(layerResult, frozenStandard) {
  const expected = frozenStandard.expected_final_tally;
  const required = frozenStandard.required_gates;

  const tallyOk =
    layerResult.final_tally?.product_wins === expected.product_wins
    && layerResult.final_tally?.openai_wins === expected.openai_wins
    && layerResult.final_tally?.ties === expected.ties
    && layerResult.final_tally?.unscored === expected.unscored;

  const poolOk =
    Number(layerResult.pool_integrity?.collapse_cases ?? 999) <= Number(required.pool_integrity_collapse_cases_max)
    && Number(layerResult.pool_integrity?.dominant_family_ratio ?? 1) <= Number(required.pool_integrity_dominant_family_ratio_max);

  const packetOk = layerResult.packet_validation?.packet_valid_for_review === Boolean(required.packet_valid_for_review);

  return {
    tally_ok: tallyOk,
    pool_ok: poolOk,
    packet_ok: packetOk,
    frozen_regression_ok: tallyOk && poolOk && packetOk,
  };
}

function main() {
  ensureDir(OUT_ROOT);
  const frozenStandard = readJson(FROZEN_STANDARD_PATH);

  const layerResults = LAYERS.map((layer) => runLayer(layer));
  const frozenLayer = layerResults.find((x) => x.id === 'layer_a_frozen_regression');
  const frozenCheck = frozenLayer ? checkFrozenRegression(frozenLayer, frozenStandard) : null;

  const report = {
    generated_at: new Date().toISOString(),
    frozen_standard_path: FROZEN_STANDARD_PATH,
    layers: layerResults,
    frozen_regression_check: frozenCheck,
    summary: {
      all_layers_packet_valid: layerResults.every((x) => x.packet_validation.packet_valid_for_review === true),
      all_layers_no_collapse: layerResults.every((x) => Number(x.pool_integrity.collapse_cases ?? 999) === 0),
      frozen_regression_ok: frozenCheck?.frozen_regression_ok ?? false,
    },
  };

  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2));

  const md = [
    '# Page 3 Multilayer Validation Report V1',
    '',
    `Generated: ${report.generated_at}`,
    `Frozen regression OK: ${report.summary.frozen_regression_ok}`,
    `All layers packet-valid: ${report.summary.all_layers_packet_valid}`,
    `All layers no-collapse: ${report.summary.all_layers_no_collapse}`,
    '',
    '## Layer results',
    ...report.layers.map((layer) => `- ${layer.label}: tally=${JSON.stringify(layer.final_tally)}, packet_valid=${layer.packet_validation.packet_valid_for_review}, collapse_cases=${layer.pool_integrity.collapse_cases}, dominant_family_ratio=${layer.pool_integrity.dominant_family_ratio}`),
    '',
    '## Frozen regression check',
    frozenCheck
      ? `- tally_ok=${frozenCheck.tally_ok}, pool_ok=${frozenCheck.pool_ok}, packet_ok=${frozenCheck.packet_ok}, frozen_regression_ok=${frozenCheck.frozen_regression_ok}`
      : '- unavailable',
    '',
  ].join('\n');

  fs.writeFileSync(REPORT_MD, md);

  console.log(JSON.stringify({ report_json: REPORT_JSON, report_md: REPORT_MD, frozen_regression_ok: report.summary.frozen_regression_ok }, null, 2));
}

main();
