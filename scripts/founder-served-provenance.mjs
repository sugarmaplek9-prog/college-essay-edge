import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';

export const CANONICAL_CASES_PATH = path.join(process.cwd(), 'evaluation', 'cases', 'founder_served_case_pack_canonical_v1.json');
export const DEPLOY_PROVENANCE_DIR = path.join(process.cwd(), 'evaluation_outputs', 'founder_served_review', 'deploy_provenance');
const SNAPSHOT_INPUTS = [
  path.join(process.cwd(), 'package.json'),
  path.join(process.cwd(), 'src', 'app', 'start', 'direction', 'page.tsx'),
  path.join(process.cwd(), 'src', 'app', 'start', 'opening', 'page.tsx'),
  path.join(process.cwd(), 'src', 'app', 'start', 'question', 'page.tsx'),
  path.join(process.cwd(), 'src', 'components', 'firstMinute', 'InteriorFlowSystem.tsx'),
  path.join(process.cwd(), 'src', 'lib', 'fm', 'canonicalPage3Payload.ts'),
  path.join(process.cwd(), 'src', 'lib', 'fm', 'direction.ts'),
];

export function normalizeText(value) {
  return String(value ?? '').trim();
}

export function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function buildSourceSnapshotSha(casesPath = CANONICAL_CASES_PATH) {
  const hasher = crypto.createHash('sha256');
  for (const filePath of [casesPath, ...SNAPSHOT_INPUTS]) {
    if (!fs.existsSync(filePath)) continue;
    hasher.update(`FILE:${path.relative(process.cwd(), filePath)}\n`);
    hasher.update(fs.readFileSync(filePath));
    hasher.update('\n');
  }
  return hasher.digest('hex');
}

function readGitSha() {
  try {
    return normalizeText(execSync('git rev-parse HEAD', { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return null;
  }
}

function isCommitLike(value) {
  return /^[0-9a-f]{7,40}$/i.test(normalizeText(value));
}

function extractCommitCandidates(value, found = []) {
  if (!value) return found;
  if (typeof value === 'string' && isCommitLike(value)) {
    found.push(normalizeText(value));
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) extractCommitCandidates(item, found);
    return found;
  }
  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (/(commit|sha)/i.test(key) && typeof nested === 'string' && isCommitLike(nested)) {
        found.push(normalizeText(nested));
      }
      extractCommitCandidates(nested, found);
    }
  }
  return found;
}

function readProvenanceRecords() {
  if (!fs.existsSync(DEPLOY_PROVENANCE_DIR)) return [];
  const files = fs.readdirSync(DEPLOY_PROVENANCE_DIR).filter((name) => name.endsWith('.json')).sort();
  const records = [];
  for (const fileName of files) {
    const filePath = path.join(DEPLOY_PROVENANCE_DIR, fileName);
    try {
      records.push(JSON.parse(fs.readFileSync(filePath, 'utf8')));
    } catch {
      // ignore malformed provenance records
    }
  }
  return records;
}

function findMatchingProvenanceRecord({ deployedUrl = '', deploymentMetadata = null }) {
  const normalizedUrl = normalizeText(deployedUrl);
  const deploymentId = normalizeText(deploymentMetadata?.deployment_id);
  return readProvenanceRecords()
    .reverse()
    .find((record) => {
      const urls = [
        normalizeText(record.deployed_url),
        normalizeText(record.production_url),
        normalizeText(record.preview_url),
        ...((record.aliases ?? []).map((entry) => normalizeText(entry))),
      ].filter(Boolean);
      return (deploymentId && normalizeText(record.deployment_id) === deploymentId) || (normalizedUrl && urls.includes(normalizedUrl));
    }) ?? null;
}

export function resolveSourceRevision({ casesPath = CANONICAL_CASES_PATH, deployedUrl = '', deploymentMetadata = null, requireCommitSha = true } = {}) {
  const envCommitSha = normalizeText(process.env.GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA);
  const sourceSnapshotSha = buildSourceSnapshotSha(casesPath);

  if (envCommitSha) {
    return { commit_sha: envCommitSha, commit_sha_source: 'environment', source_snapshot_sha: sourceSnapshotSha };
  }

  const gitCommitSha = readGitSha();
  if (gitCommitSha) {
    return { commit_sha: gitCommitSha, commit_sha_source: 'git', source_snapshot_sha: sourceSnapshotSha };
  }

  const deploymentCommitCandidates = extractCommitCandidates(deploymentMetadata);
  if (deploymentCommitCandidates.length > 0) {
    return { commit_sha: deploymentCommitCandidates[0], commit_sha_source: 'deployment_metadata', source_snapshot_sha: sourceSnapshotSha };
  }

  const provenanceRecord = findMatchingProvenanceRecord({ deployedUrl, deploymentMetadata });
  if (provenanceRecord?.commit_sha) {
    return {
      commit_sha: normalizeText(provenanceRecord.commit_sha),
      commit_sha_source: `deploy_provenance:${normalizeText(provenanceRecord.target || 'unknown')}`,
      source_snapshot_sha: sourceSnapshotSha,
    };
  }

  if (requireCommitSha) {
    throw new Error(
      'Missing commit SHA. Provide GIT_SHA (or COMMIT_SHA / VERCEL_GIT_COMMIT_SHA), run from a git checkout, or use a deploy provenance record written by the canonical deploy flow.'
    );
  }

  return { commit_sha: null, commit_sha_source: 'missing', source_snapshot_sha: sourceSnapshotSha };
}

export function writeDeploymentProvenance(record) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTarget = normalizeText(record.target || 'unknown') || 'unknown';
  const data = {
    timestamp,
    ...record,
  };
  writeJson(path.join(DEPLOY_PROVENANCE_DIR, `${timestamp}-${safeTarget}.json`), data);
  writeJson(path.join(DEPLOY_PROVENANCE_DIR, `latest-${safeTarget}.json`), data);
  return data;
}
