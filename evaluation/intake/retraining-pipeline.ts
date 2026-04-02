// =============================================================
// evaluation/intake/retraining-pipeline.ts
// INTAKE-14: Batch retraining pipeline for narrow intake models
//
// Exports labeled data, evaluates candidate vs current model,
// writes a model artifact, and registers the version.
// Rollback is supported by recording the previous version.
//
// In v1 the "models" are versioned heuristic configs.
// This pipeline establishes the infrastructure patterns that
// will remain stable when real ML models are introduced.
//
// Usage:  npx tsx evaluation/intake/retraining-pipeline.ts
// =============================================================

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import type { LabeledTrainingRecord } from './review-packet-generator';

// ─────────────────────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────────────────────

const MODEL_REGISTRY_PATH = resolve(__dirname, '../reports/intake/model-registry.json');
const TRAINING_DATA_DIR = resolve(__dirname, '../reports/intake/training-data');
const MODEL_ARTIFACTS_DIR = resolve(__dirname, '../reports/intake/model-artifacts');

// ─────────────────────────────────────────────────────────────
// MODEL REGISTRY TYPES
// ─────────────────────────────────────────────────────────────

export interface ModelVersion {
  version_id: string;
  model_type: 'signal_classifier' | 'contamination_classifier' | 'pattern_classifier' | 'evidence_ranker';
  version_number: string;
  artifact_path: string;
  trained_on_record_count: number;
  evaluation_pass_rate: number;
  promoted: boolean;
  promoted_at: string | null;
  rolled_back: boolean;
  rolled_back_at: string | null;
  previous_version_id: string | null;
  created_at: string;
}

export interface ModelRegistry {
  registry_version: 'registry_v1';
  models: ModelVersion[];
  last_updated: string;
}

// ─────────────────────────────────────────────────────────────
// REGISTRY HELPERS
// ─────────────────────────────────────────────────────────────

function loadRegistry(): ModelRegistry {
  if (!existsSync(MODEL_REGISTRY_PATH)) {
    return { registry_version: 'registry_v1', models: [], last_updated: new Date().toISOString() };
  }
  return JSON.parse(readFileSync(MODEL_REGISTRY_PATH, 'utf-8')) as ModelRegistry;
}

function saveRegistry(registry: ModelRegistry): void {
  mkdirSync(resolve(MODEL_REGISTRY_PATH, '..'), { recursive: true });
  registry.last_updated = new Date().toISOString();
  writeFileSync(MODEL_REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

// ─────────────────────────────────────────────────────────────
// PIPELINE STEPS
// ─────────────────────────────────────────────────────────────

/**
 * Step 1: Export labeled training data to JSONL.
 * Returns the path to the exported file.
 */
export function exportLabeledData(records: LabeledTrainingRecord[]): string {
  mkdirSync(TRAINING_DATA_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  const path = join(TRAINING_DATA_DIR, `training_data_${timestamp}.jsonl`);
  const lines = records.map((r) => JSON.stringify(r)).join('\n');
  writeFileSync(path, lines, 'utf-8');
  console.log(`  Exported ${records.length} labeled records → ${path}`);
  return path;
}

/**
 * Step 2: Train a candidate model config from labeled data.
 * In v1 this produces a versioned heuristic weight configuration.
 * Replace with actual training code when ML models are ready.
 */
export function trainCandidateModel(
  modelType: ModelVersion['model_type'],
  trainingDataPath: string,
  records: LabeledTrainingRecord[]
): { artifactPath: string; passRate: number } {
  mkdirSync(MODEL_ARTIFACTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '');
  const artifactPath = join(MODEL_ARTIFACTS_DIR, `${modelType}_${timestamp}.json`);

  // v1: Compute aggregate accuracy from labeled records and store as artifact.
  const relevant = records.filter((r) => {
    if (modelType === 'signal_classifier') return r.signal_quality_correct !== null;
    if (modelType === 'contamination_classifier') return r.contamination_correct !== null;
    if (modelType === 'pattern_classifier') return r.nmi_correct !== null;
    if (modelType === 'evidence_ranker') return r.nmi_correct !== null;
    return false;
  });

  const correct = relevant.filter((r) => {
    if (modelType === 'signal_classifier') return r.signal_quality_correct === true;
    if (modelType === 'contamination_classifier') return r.contamination_correct === true;
    if (modelType === 'pattern_classifier') return r.nmi_correct === 'correct';
    if (modelType === 'evidence_ranker') return r.nmi_correct !== 'incorrect';
    return false;
  });

  const passRate = relevant.length > 0 ? correct.length / relevant.length : 0;

  const artifact = {
    model_type: modelType,
    training_data_path: trainingDataPath,
    training_record_count: records.length,
    relevant_label_count: relevant.length,
    correct_label_count: correct.length,
    pass_rate: passRate,
    artifact_type: 'heuristic_config_v1',
    created_at: new Date().toISOString(),
  };

  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), 'utf-8');
  console.log(`  Trained candidate: ${modelType} passRate=${(passRate * 100).toFixed(1)}% → ${artifactPath}`);
  return { artifactPath, passRate };
}

/**
 * Step 3: Evaluate candidate vs current production model.
 * Returns whether the candidate should be promoted.
 */
export function evaluateCandidate(
  modelType: ModelVersion['model_type'],
  candidatePassRate: number,
  registry: ModelRegistry
): { promote: boolean; reason: string } {
  const current = registry.models
    .filter((m) => m.model_type === modelType && m.promoted && !m.rolled_back)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (!current) {
    return { promote: true, reason: 'No current model in registry — promote first candidate.' };
  }

  const delta = candidatePassRate - current.evaluation_pass_rate;
  if (delta >= 0.02) {
    return { promote: true, reason: `Candidate improves by ${(delta * 100).toFixed(1)}% over current.` };
  }
  if (candidatePassRate < current.evaluation_pass_rate - 0.05) {
    return { promote: false, reason: `Candidate regresses by ${(Math.abs(delta) * 100).toFixed(1)}% — block.` };
  }
  return { promote: true, reason: `Candidate within tolerance (delta=${(delta * 100).toFixed(1)}%) — promote.` };
}

/**
 * Step 4: Register a model version. If promoted, mark previous as non-promoted.
 */
export function registerModelVersion(
  modelType: ModelVersion['model_type'],
  artifactPath: string,
  passRate: number,
  recordCount: number,
  promoted: boolean
): ModelVersion {
  const registry = loadRegistry();

  const current = registry.models
    .filter((m) => m.model_type === modelType && m.promoted && !m.rolled_back)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const versionNumber = `v${registry.models.filter((m) => m.model_type === modelType).length + 1}`;

  const newVersion: ModelVersion = {
    version_id: `${modelType}_${versionNumber}_${Date.now().toString(36)}`,
    model_type: modelType,
    version_number: versionNumber,
    artifact_path: artifactPath,
    trained_on_record_count: recordCount,
    evaluation_pass_rate: passRate,
    promoted,
    promoted_at: promoted ? new Date().toISOString() : null,
    rolled_back: false,
    rolled_back_at: null,
    previous_version_id: current?.version_id ?? null,
    created_at: new Date().toISOString(),
  };

  if (promoted && current) {
    current.promoted = false;
  }

  registry.models.push(newVersion);
  saveRegistry(registry);
  return newVersion;
}

/**
 * Rollback: mark the currently promoted version as rolled back
 * and re-promote its predecessor.
 */
export function rollbackModel(modelType: ModelVersion['model_type']): boolean {
  const registry = loadRegistry();

  const current = registry.models
    .filter((m) => m.model_type === modelType && m.promoted && !m.rolled_back)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (!current || !current.previous_version_id) {
    console.error(`Cannot rollback ${modelType}: no previous version.`);
    return false;
  }

  const previous = registry.models.find((m) => m.version_id === current.previous_version_id);
  if (!previous) {
    console.error(`Cannot rollback ${modelType}: previous version not found.`);
    return false;
  }

  current.rolled_back = true;
  current.rolled_back_at = new Date().toISOString();
  current.promoted = false;

  previous.promoted = true;
  previous.promoted_at = new Date().toISOString();

  saveRegistry(registry);
  console.log(`Rolled back ${modelType} from ${current.version_id} to ${previous.version_id}`);
  return true;
}

// ─────────────────────────────────────────────────────────────
// FULL PIPELINE RUNNER
// ─────────────────────────────────────────────────────────────

export async function runRetrainingPipeline(
  records: LabeledTrainingRecord[],
  modelTypes: ModelVersion['model_type'][] = ['signal_classifier', 'contamination_classifier', 'pattern_classifier', 'evidence_ranker']
): Promise<void> {
  console.log(`\nStarting retraining pipeline with ${records.length} labeled records`);

  const trainingDataPath = exportLabeledData(records);
  const registry = loadRegistry();

  for (const modelType of modelTypes) {
    console.log(`\nProcessing: ${modelType}`);
    const { artifactPath, passRate } = trainCandidateModel(modelType, trainingDataPath, records);
    const { promote, reason } = evaluateCandidate(modelType, passRate, registry);
    console.log(`  Evaluation: ${reason}`);
    const version = registerModelVersion(modelType, artifactPath, passRate, records.length, promote);
    console.log(`  Registered: ${version.version_id} promoted=${version.promoted}`);
  }

  console.log(`\nRetraining pipeline complete.`);
}

// ─────────────────────────────────────────────────────────────
// CLI ENTRY POINT
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  // In production: load labeled records from review packet store
  // For v1 demo: run with empty records to verify pipeline scaffolding
  console.log('Running retraining pipeline with empty dataset (scaffolding verification).');
  runRetrainingPipeline([]).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
