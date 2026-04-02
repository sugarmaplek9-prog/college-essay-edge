// =============================================================
// evaluation/intake/drift-monitor.ts
// INTAKE-15: Drift monitoring and threshold alerts for intake models
//
// Computes drift metrics from the intake log buffer and alerts
// when decision distributions shift materially.
//
// Monitored metrics:
//   - contamination false-positive/negative rate
//   - NMI rate by difficulty bucket
//   - pattern distribution shifts
//   - question usefulness degradation
//   - escalation rate shifts
// =============================================================

import { writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import type { IntakeFeatureLogRecord } from '../../src/types/intake';

// ─────────────────────────────────────────────────────────────
// THRESHOLDS
// ─────────────────────────────────────────────────────────────

export const DRIFT_THRESHOLDS = {
  /** Alert when NMI rate moves more than this from baseline. */
  nmi_rate_delta_alert: 0.10,
  /** Alert when contamination high rate exceeds this absolute value. */
  contamination_high_rate_alert: 0.40,
  /** Alert when escalation rate exceeds this value. */
  escalation_rate_alert: 0.15,
  /** Alert when any single pattern dominates above this rate. */
  pattern_concentration_alert: 0.60,
} as const;

// ─────────────────────────────────────────────────────────────
// METRIC TYPES
// ─────────────────────────────────────────────────────────────

export interface DriftMetrics {
  computed_at: string;
  record_count: number;
  nmi_rate: number;
  nmi_rate_delta_from_baseline: number | null;
  contamination_high_rate: number;
  escalation_rate: number;
  pattern_distribution: Record<string, number>;
  dominant_pattern: string;
  dominant_pattern_rate: number;
  signal_strength_distribution: Record<string, number>;
  alerts: DriftAlert[];
}

export interface DriftAlert {
  alert_id: string;
  metric: string;
  current_value: number;
  threshold: number;
  message: string;
  severity: 'warning' | 'critical';
  triggered_at: string;
}

// ─────────────────────────────────────────────────────────────
// BASELINE STORE
// In production: loaded from a durable store (e.g. Supabase table).
// In v1: in-memory baseline set on first compute.
// ─────────────────────────────────────────────────────────────

let baseline: { nmi_rate: number } | null = null;

export function setBaseline(metrics: DriftMetrics): void {
  baseline = { nmi_rate: metrics.nmi_rate };
}

export function clearBaseline(): void {
  baseline = null;
}

// ─────────────────────────────────────────────────────────────
// METRIC COMPUTATION
// ─────────────────────────────────────────────────────────────

function computeDistribution(values: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] ?? 0) + 1;
  }
  const total = values.length;
  const rates: Record<string, number> = {};
  for (const [k, count] of Object.entries(counts)) {
    rates[k] = total > 0 ? count / total : 0;
  }
  return rates;
}

function buildAlert(
  alertId: string,
  metric: string,
  currentValue: number,
  threshold: number,
  message: string,
  severity: DriftAlert['severity']
): DriftAlert {
  return {
    alert_id: alertId,
    metric,
    current_value: currentValue,
    threshold,
    message,
    severity,
    triggered_at: new Date().toISOString(),
  };
}

export function computeDriftMetrics(records: IntakeFeatureLogRecord[]): DriftMetrics {
  if (records.length === 0) {
    return {
      computed_at: new Date().toISOString(),
      record_count: 0,
      nmi_rate: 0,
      nmi_rate_delta_from_baseline: null,
      contamination_high_rate: 0,
      escalation_rate: 0,
      pattern_distribution: {},
      dominant_pattern: 'unknown',
      dominant_pattern_rate: 0,
      signal_strength_distribution: {},
      alerts: [],
    };
  }

  const total = records.length;

  const nmiCount = records.filter(
    (r) => r.viability_decision.decision === 'needs_more_input' ||
      r.viability_decision.decision === 'blocked'
  ).length;
  const nmi_rate = nmiCount / total;

  const contamHighCount = records.filter(
    (r) => r.authorship_signal_decision.contamination_risk === 'high'
  ).length;
  const contamination_high_rate = contamHighCount / total;

  const escalationCount = records.filter((r) => r.escalation_decision.escalate).length;
  const escalation_rate = escalationCount / total;

  const patterns = records.map((r) => r.narrative_pattern_decision.primary_pattern);
  const pattern_distribution = computeDistribution(patterns);
  const dominant_pattern = Object.entries(pattern_distribution)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
  const dominant_pattern_rate = pattern_distribution[dominant_pattern] ?? 0;

  const signalStrengths = records.map((r) => r.usable_signal_decision.signal_strength);
  const signal_strength_distribution = computeDistribution(signalStrengths);

  const nmi_rate_delta_from_baseline = baseline !== null ? nmi_rate - baseline.nmi_rate : null;

  // ── Alert evaluation ───────────────────────────────────────
  const alerts: DriftAlert[] = [];

  if (nmi_rate_delta_from_baseline !== null && Math.abs(nmi_rate_delta_from_baseline) > DRIFT_THRESHOLDS.nmi_rate_delta_alert) {
    alerts.push(buildAlert(
      'nmi_rate_drift',
      'nmi_rate',
      nmi_rate,
      DRIFT_THRESHOLDS.nmi_rate_delta_alert,
      `NMI rate shifted by ${(Math.abs(nmi_rate_delta_from_baseline) * 100).toFixed(1)}% from baseline (${(baseline!.nmi_rate * 100).toFixed(1)}% → ${(nmi_rate * 100).toFixed(1)}%)`,
      Math.abs(nmi_rate_delta_from_baseline) > 0.20 ? 'critical' : 'warning'
    ));
  }

  if (contamination_high_rate > DRIFT_THRESHOLDS.contamination_high_rate_alert) {
    alerts.push(buildAlert(
      'contamination_rate_high',
      'contamination_high_rate',
      contamination_high_rate,
      DRIFT_THRESHOLDS.contamination_high_rate_alert,
      `Contamination high-risk rate ${(contamination_high_rate * 100).toFixed(1)}% exceeds ${(DRIFT_THRESHOLDS.contamination_high_rate_alert * 100).toFixed(0)}% threshold`,
      contamination_high_rate > 0.60 ? 'critical' : 'warning'
    ));
  }

  if (escalation_rate > DRIFT_THRESHOLDS.escalation_rate_alert) {
    alerts.push(buildAlert(
      'escalation_rate_high',
      'escalation_rate',
      escalation_rate,
      DRIFT_THRESHOLDS.escalation_rate_alert,
      `Escalation rate ${(escalation_rate * 100).toFixed(1)}% exceeds ${(DRIFT_THRESHOLDS.escalation_rate_alert * 100).toFixed(0)}% threshold`,
      escalation_rate > 0.30 ? 'critical' : 'warning'
    ));
  }

  if (dominant_pattern_rate > DRIFT_THRESHOLDS.pattern_concentration_alert) {
    alerts.push(buildAlert(
      'pattern_concentration',
      'dominant_pattern_rate',
      dominant_pattern_rate,
      DRIFT_THRESHOLDS.pattern_concentration_alert,
      `Pattern "${dominant_pattern}" dominates at ${(dominant_pattern_rate * 100).toFixed(1)}% — distribution may be collapsing`,
      'warning'
    ));
  }

  return {
    computed_at: new Date().toISOString(),
    record_count: total,
    nmi_rate,
    nmi_rate_delta_from_baseline,
    contamination_high_rate,
    escalation_rate,
    pattern_distribution,
    dominant_pattern,
    dominant_pattern_rate,
    signal_strength_distribution,
    alerts,
  };
}

// ─────────────────────────────────────────────────────────────
// REPORT GENERATOR
// ─────────────────────────────────────────────────────────────

const REPORTS_DIR = resolve(__dirname, '../reports/intake/drift');

export function persistDriftReport(metrics: DriftMetrics): string {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const timestamp = metrics.computed_at.replace(/[:.]/g, '');
  const path = join(REPORTS_DIR, `drift_report_${timestamp}.json`);
  writeFileSync(path, JSON.stringify(metrics, null, 2), 'utf-8');
  return path;
}

export function formatDriftReport(metrics: DriftMetrics): string {
  const alertLines = metrics.alerts.length > 0
    ? metrics.alerts.map((a) => `  [${a.severity.toUpperCase()}] ${a.message}`)
    : ['  No alerts.'];

  const patternLines = Object.entries(metrics.pattern_distribution)
    .sort((a, b) => b[1] - a[1])
    .map(([p, r]) => `    ${p.padEnd(30)} ${(r * 100).toFixed(1)}%`);

  return [
    '# Intake Drift Report',
    `Generated: ${metrics.computed_at}`,
    `Records analyzed: ${metrics.record_count}`,
    '',
    '## Key Rates',
    `  NMI rate:              ${(metrics.nmi_rate * 100).toFixed(1)}%${metrics.nmi_rate_delta_from_baseline != null ? ` (delta: ${(metrics.nmi_rate_delta_from_baseline * 100).toFixed(1)}%)` : ' (no baseline)'}`,
    `  Contamination high:    ${(metrics.contamination_high_rate * 100).toFixed(1)}%`,
    `  Escalation rate:       ${(metrics.escalation_rate * 100).toFixed(1)}%`,
    '',
    '## Pattern Distribution',
    ...patternLines,
    '',
    '## Alerts',
    ...alertLines,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// CLI ENTRY POINT
// ─────────────────────────────────────────────────────────────

if (require.main === module) {
  console.log('Drift monitor: no records in buffer (run after intake sessions are logged).');
  const empty = computeDriftMetrics([]);
  console.log(formatDriftReport(empty));
}
