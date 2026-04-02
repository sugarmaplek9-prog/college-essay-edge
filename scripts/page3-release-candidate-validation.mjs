import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'evaluation_outputs', 'page3_release_candidate_v1');
const CONTRACT_PATH = path.join(ROOT, 'scripts', 'data', 'frozen', 'page3-release-candidate-contract-v1.json');
const MULTILAYER_REPORT_PATH = path.join(ROOT, 'evaluation_outputs', 'page3_layers', 'MULTILAYER_VALIDATION_REPORT_V1.json');
const WHY_AUDIT_PATH = path.join(OUT_DIR, 'WHY_CONTRACT_ALIGNMENT_AUDIT_V2.json');
const RC_STATUS_JSON = path.join(OUT_DIR, 'PAGE3_RC_STATUS_V1.json');
const RC_STATUS_MD = path.join(OUT_DIR, 'PAGE3_RC_STATUS_V1.md');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

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
  return res;
}

function runCommand(command, args, label) {
  const res = spawnSync(command, args, {
    cwd: ROOT,
    env: process.env,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status})\n${res.stdout}\n${res.stderr}`);
  }
  return res;
}

async function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status >= 200 && res.status < 500) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function withManagedProductUrl(run) {
  if (process.env.PRODUCT_URL) {
    return run(process.env.PRODUCT_URL);
  }

  const port = process.env.PAGE3_RC_PORT ?? '3399';
  const url = `http://127.0.0.1:${port}`;
  runCommand('npm', ['run', 'build'], 'page3 rc build');

  const server = spawn('npm', ['run', 'start', '--', '-p', port], {
    cwd: ROOT,
    env: process.env,
    stdio: 'ignore',
  });

  try {
    await waitForUrl(`${url}/start`);
    return await run(url);
  } finally {
    server.kill('SIGTERM');
  }
}

function getLayer(report, id) {
  const layer = report.layers.find((entry) => entry.id === id);
  if (!layer) throw new Error(`Missing layer in multilayer report: ${id}`);
  return layer;
}

function getZeroCandidateCases(summaryPath) {
  const summary = readJson(summaryPath);
  return (summary.rows ?? [])
    .filter((row) => Number(row?.product?.canonical_payload?.candidate_debug?.candidates_generated ?? 0) === 0)
    .map((row) => row.case_id);
}

async function main() {
  ensureDir(OUT_DIR);

  await withManagedProductUrl(async (productUrl) => {
    runNodeScript(
      path.join(ROOT, 'scripts', 'page3-multilayer-validation-v3.mjs'),
      { PRODUCT_URL: productUrl },
      'page3 multilayer validation'
    );

    runNodeScript(
      path.join(ROOT, 'scripts', 'page3-why-contract-audit-v2.mjs'),
      { OUT_DIR },
      'page3 why-contract audit'
    );
  });

  const contract = readJson(CONTRACT_PATH);
  const report = readJson(MULTILAYER_REPORT_PATH);
  const whyAudit = readJson(WHY_AUDIT_PATH);

  const layerA = getLayer(report, 'layer_a_frozen_regression');
  const layerB = getLayer(report, 'layer_b_unseen_validation');
  const layerC = getLayer(report, 'layer_c_messy_realworld');

  const layerBZeroCandidateCases = getZeroCandidateCases(path.join(layerB.out_dir, 'summary.json'));

  const checks = {
    layer_a_parity_reference_ok: Boolean(layerA.parity_reference_complete),
    layer_a_tally_ok: layerA.parity_reference_complete
      ? JSON.stringify(layerA.final_tally) === JSON.stringify(contract.pass_fail_contract.layer_a.expected_final_tally)
      : true,
    layer_a_collapse_ok: Number(layerA.pool_integrity?.collapse_cases ?? 999) <= Number(contract.pass_fail_contract.layer_a.collapse_cases_max),
    layer_a_packet_ok: layerA.packet_validation?.packet_valid_for_review === contract.pass_fail_contract.layer_a.packet_valid_for_review,
    layer_a_dominant_family_ok: Number(layerA.pool_integrity?.dominant_family_ratio ?? 1) <= Number(contract.pass_fail_contract.layer_a.dominant_family_ratio_max),

    layer_b_collapse_ok: Number(layerB.pool_integrity?.collapse_cases ?? 999) <= Number(contract.pass_fail_contract.layer_b.collapse_cases_max),
    layer_b_packet_ok: layerB.packet_validation?.packet_valid_for_review === contract.pass_fail_contract.layer_b.packet_valid_for_review,
    layer_b_zero_candidate_ok: layerBZeroCandidateCases.length <= Number(contract.pass_fail_contract.layer_b.zero_candidate_cases_max),
    layer_b_dominant_family_ok: Number(layerB.pool_integrity?.dominant_family_ratio ?? 1) <= Number(contract.pass_fail_contract.layer_b.dominant_family_ratio_max),

    layer_c_collapse_ok: Number(layerC.pool_integrity?.collapse_cases ?? 999) <= Number(contract.pass_fail_contract.layer_c.collapse_cases_max),
    layer_c_packet_ok: layerC.packet_validation?.packet_valid_for_review === contract.pass_fail_contract.layer_c.packet_valid_for_review,
    layer_c_dominant_family_ok: Number(layerC.pool_integrity?.dominant_family_ratio ?? 1) <= Number(contract.pass_fail_contract.layer_c.dominant_family_ratio_max),

    all_layers_packet_valid_ok: report.summary?.all_layers_packet_valid === contract.pass_fail_contract.cross_layer.all_layers_packet_valid,
    all_layers_no_collapse_ok: report.summary?.all_layers_no_collapse === contract.pass_fail_contract.cross_layer.all_layers_no_collapse,
    why_contract_alignment_ok: Boolean(whyAudit.counts?.contract_alignment_ok) === contract.pass_fail_contract.cross_layer.why_contract_alignment_ok,
    major_new_malformed_composition_artifacts_ok: layerA.packet_validation.failed_gates.length === 0
      && layerB.packet_validation.failed_gates.length === 0
      && layerC.packet_validation.failed_gates.length === 0,
  };

  const failedChecks = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const status = {
    generated_at: new Date().toISOString(),
    release_candidate_id: contract.release_candidate_id,
    validation_command: contract.validation_command,
    contract_path: CONTRACT_PATH,
    multilayer_report_path: MULTILAYER_REPORT_PATH,
    why_contract_audit_path: WHY_AUDIT_PATH,
    checks,
    failed_checks: failedChecks,
    rc_pass: failedChecks.length === 0,
    benchmark_loss_condition: Boolean(layerA.benchmark_loss_condition),
    benchmark_loss_reason: layerA.benchmark_loss_reason ?? null,
    layer_details: {
      layer_a: layerA,
      layer_b: {
        ...layerB,
        zero_candidate_cases: layerBZeroCandidateCases,
      },
      layer_c: layerC,
    },
    why_contract: {
      contract_alignment_ok: Boolean(whyAudit.counts?.contract_alignment_ok),
      comparative_failures: Number(whyAudit.counts?.comparative_failures ?? 0),
      payoff_failures: Number(whyAudit.counts?.payoff_failures ?? 0),
    },
    summary: report.summary,
  };

  fs.writeFileSync(RC_STATUS_JSON, JSON.stringify(status, null, 2));

  const md = [
    '# Page 3 Release Candidate Status V1',
    '',
    `- release_candidate_id: ${status.release_candidate_id}`,
    `- generated_at: ${status.generated_at}`,
    `- rc_pass: ${status.rc_pass}`,
    `- failed_checks: ${failedChecks.join(', ') || 'none'}`,
    '',
    '## Cross-layer summary',
    `- all_layers_packet_valid: ${report.summary?.all_layers_packet_valid}`,
    `- all_layers_no_collapse: ${report.summary?.all_layers_no_collapse}`,
    `- frozen_regression_ok: ${report.summary?.frozen_regression_ok}`,
    `- why_contract_alignment_ok: ${Boolean(whyAudit.counts?.contract_alignment_ok)}`,
    '',
    '## Layer details',
    `- Layer A tally: ${JSON.stringify(layerA.final_tally)} | collapse=${layerA.pool_integrity.collapse_cases} | packet_valid=${layerA.packet_validation.packet_valid_for_review}`,
    `- Layer A parity: status=${layerA.parity_status} | parity_reference_complete=${layerA.parity_reference_complete} | parity_reference_available_count=${layerA.parity_reference_available_count} | benchmark_loss_condition=${Boolean(layerA.benchmark_loss_condition)}`,
    `- Layer B tally: ${JSON.stringify(layerB.final_tally)} | collapse=${layerB.pool_integrity.collapse_cases} | packet_valid=${layerB.packet_validation.packet_valid_for_review} | zero_candidate_cases=${layerBZeroCandidateCases.length}`,
    `- Layer C tally: ${JSON.stringify(layerC.final_tally)} | collapse=${layerC.pool_integrity.collapse_cases} | packet_valid=${layerC.packet_validation.packet_valid_for_review}`,
    '',
    '## Contract checks',
    ...Object.entries(checks).map(([name, ok]) => `- ${name}: ${ok ? 'PASS' : 'FAIL'}`),
    '',
  ].join('\n');

  fs.writeFileSync(RC_STATUS_MD, `${md}\n`);
  console.log(JSON.stringify({ out_json: RC_STATUS_JSON, out_md: RC_STATUS_MD, rc_pass: status.rc_pass, failed_checks: failedChecks }, null, 2));
  if (!status.rc_pass) process.exitCode = 2;
}

main().catch((error) => {
  console.error('[page3-rc] fatal:', error);
  process.exit(1);
});
