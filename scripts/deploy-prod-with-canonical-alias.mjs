import { spawnSync } from 'node:child_process';
import { buildSourceSnapshotSha, resolveSourceRevision, writeDeploymentProvenance } from './founder-served-provenance.mjs';

const CANONICAL_HOST = 'college-essay-edge.vercel.app';
const EXACT_DEPLOYMENT_REGEX = /https:\/\/college-essay-edge-[a-z0-9-]+-college-edge\.vercel\.app/gi;
const PRODUCTION_LINE_REGEX = /Production:\s*(https:\/\/[a-z0-9-]+\.vercel\.app)/gi;
const DEPLOYMENT_ID_REGEX = /\bid\s+(dpl_[A-Za-z0-9]+)/;

function runNpx(args, label) {
  const result = spawnSync('npx', args, {
    cwd: process.cwd(),
    encoding: 'utf-8',
  });

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const combined = `${stdout}\n${stderr}`;

  if (stdout) process.stdout.write(stdout);
  if (stderr) process.stderr.write(stderr);

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }

  return combined;
}

function extractDeploymentUrl(deployOutput) {
  const productionLineMatches = Array.from(deployOutput.matchAll(PRODUCTION_LINE_REGEX)).map((m) => m[1]);
  const exactMatches = Array.from(deployOutput.matchAll(EXACT_DEPLOYMENT_REGEX)).map((m) => m[0]);

  const fromProductionLine = [...productionLineMatches].reverse().find((url) => url.includes('college-essay-edge-'));
  if (fromProductionLine) return fromProductionLine;

  if (exactMatches.length > 0) return exactMatches[exactMatches.length - 1];
  return null;
}

function extractDeploymentId(inspectOutput) {
  const match = inspectOutput.match(DEPLOYMENT_ID_REGEX);
  return match?.[1] ?? null;
}

function main() {
  const sourceRevision = resolveSourceRevision({ requireCommitSha: true });
  console.log('[release] Deploying production candidate...');
  const deployOutput = runNpx(['vercel', 'deploy', '--prod', '--yes'], 'production deploy');

  const deployedUrl = extractDeploymentUrl(deployOutput);
  if (!deployedUrl) {
    throw new Error('Could not extract exact deployment URL from deploy output.');
  }

  console.log(`[release] Deploy output URL: ${deployedUrl}`);
  console.log(`[release] Setting canonical alias: ${CANONICAL_HOST} -> ${deployedUrl}`);
  runNpx(['vercel', 'alias', 'set', deployedUrl, CANONICAL_HOST], 'canonical alias set');

  console.log(`[release] Inspecting exact deployment: ${deployedUrl}`);
  const exactInspect = runNpx(['vercel', 'inspect', deployedUrl], 'exact deployment inspect');
  const deploymentId = extractDeploymentId(exactInspect);
  if (!deploymentId) {
    throw new Error('Could not extract deployment ID from exact deployment inspect output.');
  }

  console.log(`[release] Inspecting canonical hostname: ${CANONICAL_HOST}`);
  const canonicalInspect = runNpx(['vercel', 'inspect', CANONICAL_HOST], 'canonical inspect');

  if (!canonicalInspect.includes(deploymentId)) {
    throw new Error(
      `Canonical hostname does not resolve to deployed candidate. Expected deployment ID ${deploymentId}.`
    );
  }

  console.log('[release] ✅ Deploy complete: canonical alias verified.');
  console.log(`[release] canonical=${CANONICAL_HOST}`);
  console.log(`[release] deployment=${deployedUrl}`);
  console.log(`[release] deployment_id=${deploymentId}`);

  const provenance = writeDeploymentProvenance({
    target: 'production',
    canonical_url: `https://${CANONICAL_HOST}`,
    deployed_url: deployedUrl,
    production_url: `https://${CANONICAL_HOST}`,
    preview_url: null,
    deployment_id: deploymentId,
    aliases: [`https://${CANONICAL_HOST}`],
    commit_sha: sourceRevision.commit_sha,
    commit_sha_source: sourceRevision.commit_sha_source,
    source_snapshot_sha: sourceRevision.source_snapshot_sha ?? buildSourceSnapshotSha(),
  });
  console.log(`[release] provenance_record=${provenance.timestamp}-production.json`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[release] ❌ ${message}`);
  process.exit(1);
}
