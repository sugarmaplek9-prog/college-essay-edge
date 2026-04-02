// =============================================================
// evaluation/intake/eval-intake.ts
// INTAKE-12: Offline evaluation harness for intake intelligence decisions
//
// Runs the full intake orchestrator against the benchmark dataset,
// computes per-slice metrics, and generates a structured report.
//
// Usage:
//   npx tsx evaluation/intake/eval-intake.ts
// =============================================================

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { runIntakeOrchestrator } from '../../src/lib/ai/modules/narrative-intake/intake-orchestrator';
import type { IntakeSessionInput } from '../../src/types/intake';
import type { BenchmarkCase, BenchmarkCaseLabel } from './label-schema';

// ─────────────────────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────────────────────

const BENCHMARK_PATH = resolve(__dirname, 'benchmark-dataset.json');
const REPORTS_DIR = resolve(__dirname, '../reports/intake');

// ─────────────────────────────────────────────────────────────
// ADAPTER: BenchmarkCase → IntakeSessionInput
// ─────────────────────────────────────────────────────────────

function toSessionInput(c: BenchmarkCase): IntakeSessionInput {
  return {
    session_id: `eval_${c.case_id}`,
    student_user_id: `eval_student_${c.case_id}`,
    subject_entity_id: `eval_subject_${c.case_id}`,
    story_entries: c.story_entries.map((e) => ({
      id: e.id,
      title: e.title,
      text: e.text,
      project_id: `eval_project_${c.case_id}`,
      rejected: false,
    })),
    draft_text: c.draft_text,
    draft_id: c.draft_text ? `eval_draft_${c.case_id}` : null,
    school_context: c.school_context_notes
      ? { source_id: `eval_school_${c.case_id}`, target_school: 'Eval University', notes: c.school_context_notes }
      : null,
    student_profile: null,
    prior_attempt_count: c.prior_attempt_count,
    questions_asked: c.questions_asked as any[],
    rejected_source_ids: [],
    session_created_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────
// SCORER: Compare system output vs ground truth
// ─────────────────────────────────────────────────────────────

interface CaseResult {
  case_id: string;
  slice: string;
  ground_truth: BenchmarkCaseLabel;
  system_signal_strength: string;
  system_contamination_risk: string;
  system_primary_pattern: string;
  system_viability: string;
  system_escalated: boolean;
  signal_strength_match: boolean;
  contamination_match: boolean;
  pattern_match: boolean;
  viability_match: boolean;
  escalation_match: boolean;
  overall_pass: boolean;
}

function scoreCase(c: BenchmarkCase, intelligence: Awaited<ReturnType<typeof runIntakeOrchestrator>>): CaseResult {
  const gt = c.ground_truth;

  const signalStrengthMatch = intelligence.usable_signal.signal_strength === gt.signal_quality.signal_strength;
  const contaminationMatch = intelligence.authorship_signal.contamination_risk === gt.contamination.contamination_risk;
  const patternMatch = intelligence.narrative_pattern.primary_pattern === gt.pattern.primary_pattern;

  // Viability match: ground truth NMI correct = system should say NMI; incorrect = should not
  let viabilityMatch = true;
  if (gt.nmi_correctness === 'nmi_correct') {
    viabilityMatch = intelligence.recommendation_viability.decision === 'needs_more_input' ||
      intelligence.recommendation_viability.decision === 'blocked';
  } else if (gt.nmi_correctness === 'nmi_incorrect') {
    viabilityMatch = intelligence.recommendation_viability.decision !== 'needs_more_input' &&
      intelligence.recommendation_viability.decision !== 'blocked';
  }

  // Escalation match
  let escalationMatch = true;
  if (gt.escalation_correctness === 'correct_escalate') escalationMatch = intelligence.escalation.escalate;
  else if (gt.escalation_correctness === 'correct_no_escalate') escalationMatch = !intelligence.escalation.escalate;

  const overallPass = signalStrengthMatch && contaminationMatch && patternMatch && viabilityMatch && escalationMatch;

  return {
    case_id: c.case_id,
    slice: c.slice,
    ground_truth: gt,
    system_signal_strength: intelligence.usable_signal.signal_strength,
    system_contamination_risk: intelligence.authorship_signal.contamination_risk,
    system_primary_pattern: intelligence.narrative_pattern.primary_pattern,
    system_viability: intelligence.recommendation_viability.decision,
    system_escalated: intelligence.escalation.escalate,
    signal_strength_match: signalStrengthMatch,
    contamination_match: contaminationMatch,
    pattern_match: patternMatch,
    viability_match: viabilityMatch,
    escalation_match: escalationMatch,
    overall_pass: overallPass,
  };
}

// ─────────────────────────────────────────────────────────────
// REPORT GENERATOR
// ─────────────────────────────────────────────────────────────

function generateReport(results: CaseResult[]): string {
  const total = results.length;
  const passed = results.filter((r) => r.overall_pass).length;

  const sliceBreakdown: Record<string, { pass: number; total: number }> = {};
  for (const r of results) {
    if (!sliceBreakdown[r.slice]) sliceBreakdown[r.slice] = { pass: 0, total: 0 };
    sliceBreakdown[r.slice].total++;
    if (r.overall_pass) sliceBreakdown[r.slice].pass++;
  }

  const signalPass = results.filter((r) => r.signal_strength_match).length;
  const contamPass = results.filter((r) => r.contamination_match).length;
  const patternPass = results.filter((r) => r.pattern_match).length;
  const viabilityPass = results.filter((r) => r.viability_match).length;
  const escalationPass = results.filter((r) => r.escalation_match).length;

  const failures = results.filter((r) => !r.overall_pass);
  const failureLines = failures.map((r) =>
    `  ${r.case_id} [${r.slice}]\n` +
    `    signal: ${r.system_signal_strength} vs ${r.ground_truth.signal_quality.signal_strength} ${r.signal_strength_match ? '✓' : '✗'}\n` +
    `    contamination: ${r.system_contamination_risk} vs ${r.ground_truth.contamination.contamination_risk} ${r.contamination_match ? '✓' : '✗'}\n` +
    `    pattern: ${r.system_primary_pattern} vs ${r.ground_truth.pattern.primary_pattern} ${r.pattern_match ? '✓' : '✗'}\n` +
    `    viability: ${r.system_viability} | nmi_label: ${r.ground_truth.nmi_correctness} ${r.viability_match ? '✓' : '✗'}\n` +
    `    escalated: ${r.system_escalated} | escalation_label: ${r.ground_truth.escalation_correctness} ${r.escalation_match ? '✓' : '✗'}`
  );

  const sliceLines = Object.entries(sliceBreakdown).map(
    ([slice, counts]) =>
      `  ${slice.padEnd(25)} ${counts.pass}/${counts.total} (${Math.round((counts.pass / counts.total) * 100)}%)`
  );

  return [
    '# Intake Intelligence Evaluation Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    `Total: ${total} | Pass: ${passed} | Fail: ${total - passed} | Pass rate: ${Math.round((passed / total) * 100)}%`,
    '',
    '## Metric Breakdown',
    `  Signal strength:   ${signalPass}/${total}`,
    `  Contamination:     ${contamPass}/${total}`,
    `  Pattern:           ${patternPass}/${total}`,
    `  Viability (NMI):   ${viabilityPass}/${total}`,
    `  Escalation:        ${escalationPass}/${total}`,
    '',
    '## Slice Breakdown',
    ...sliceLines,
    '',
    failures.length > 0 ? '## Failures' : '## Failures: none',
    ...failureLines,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const cases: BenchmarkCase[] = JSON.parse(readFileSync(BENCHMARK_PATH, 'utf-8'));
  console.log(`Loaded ${cases.length} benchmark cases`);

  const results: CaseResult[] = [];

  for (const c of cases) {
    const input = toSessionInput(c);
    const intelligence = await runIntakeOrchestrator(input);
    const scored = scoreCase(c, intelligence);
    results.push(scored);

    const status = scored.overall_pass ? '✓' : '✗';
    console.log(`  ${status} ${c.case_id}: signal=${scored.system_signal_strength} contamination=${scored.system_contamination_risk} pattern=${scored.system_primary_pattern} viability=${scored.system_viability}`);
  }

  const report = generateReport(results);
  mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = join(REPORTS_DIR, `intake_eval_${new Date().toISOString().replace(/[:.]/g, '')}.md`);
  writeFileSync(reportPath, report, 'utf-8');

  console.log(`\n${report}`);
  console.log(`\nReport written to ${reportPath}`);

  const passed = results.filter((r) => r.overall_pass).length;
  if (passed < results.length * 0.7) {
    console.error(`Pass rate below 70% threshold. Review failures above.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
