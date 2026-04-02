#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type JsonObject = Record<string, unknown>;

const ROOT = process.cwd();
const EDGE_JSON = path.join(ROOT, 'evaluation_outputs', 'nds_edge_case_breaker_v1.json');
const STABILITY_JSON = path.join(ROOT, 'evaluation_outputs', 'nds_direction_stability_test_v1.json');
const DIAG_JSON = path.join(ROOT, 'evaluation_outputs', 'nds_stability_failure_diagnostic_v1.json');
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'nds_edge_stability_reconciliation_sprint_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'NDS_EDGE_STABILITY_RECONCILIATION_SPRINT_RESULTS_V1.md');

function readJson(filePath: string): JsonObject {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonObject;
}

function main(): void {
  const edge = readJson(EDGE_JSON);
  const stability = readJson(STABILITY_JSON);
  const diag = readJson(DIAG_JSON);

  const edgeAggregate = edge.aggregate as JsonObject;
  const stabilityAggregate = stability.aggregate as JsonObject;
  const diagnostics = (diag.diagnostics ?? []) as JsonObject[];

  // Baseline from post-edge-sprint regressed state observed before reconciliation.
  const preReconciliation = {
    edge_case_metrics: {
      behavior_correct: 23,
      bluff_high: 0,
      candidate_broken: 0,
      trustworthy: 22,
      route_action_match: 23,
      caution_cases_correct: 10,
      low_signal_or_contradiction_overbluff: 0,
    },
    stability_metrics: {
      winner_stable: 6,
      winner_unstable: 5,
      route_stable: 3,
      confidence_unreliable: 9,
      explanation_bad: 6,
      strict_fail_count: 8,
      ambiguity_arbitrary_flip_count: 3,
    },
    stability_failure_diagnostic: {
      unstable_base_cases: 11,
      scorer_dimension_instability: 5,
      route_threshold_instability: 6,
      explanation_layer_instability: 5,
    },
  };

  const postReconciliation = {
    edge_case_metrics: {
      behavior_correct: Number(edgeAggregate.behavior_correct_count ?? 0),
      bluff_high: Number(edgeAggregate.bluff_high_count ?? 0),
      candidate_broken: Number(edgeAggregate.candidate_broken_count ?? 0),
      trustworthy: Number(edgeAggregate.trustworthiness_trustworthy_count ?? 0),
      route_action_match: Number(edgeAggregate.route_action_match_count ?? 0),
      caution_cases_correct: Number(edgeAggregate.caution_cases_correct_count ?? 0),
      low_signal_or_contradiction_overbluff: Number(edgeAggregate.low_signal_or_contradiction_overbluff_count ?? 0),
    },
    stability_metrics: {
      winner_stable: Number(stabilityAggregate.winner_stable_count ?? 0),
      winner_unstable: Number(stabilityAggregate.winner_unstable_count ?? 0),
      route_stable: Number(stabilityAggregate.route_stable_count ?? 0),
      confidence_unreliable: Number(stabilityAggregate.confidence_unreliable_count ?? 0),
      explanation_bad: Number(stabilityAggregate.explanation_bad_count ?? 0),
      strict_fail_count: Number(stabilityAggregate.strict_fail_count ?? 0),
      ambiguity_arbitrary_flip_count: Number(stabilityAggregate.ambiguity_arbitrary_flip_count ?? 0),
    },
    stability_failure_diagnostic: {
      unstable_base_cases: Number(diag.unstable_base_cases ?? 0),
      scorer_dimension_instability: ((diag.grouped_failures as JsonObject)?.scorer_dimension_instability as unknown[] | undefined)?.length ?? 0,
      route_threshold_instability: ((diag.grouped_failures as JsonObject)?.route_threshold_instability as unknown[] | undefined)?.length ?? 0,
      explanation_layer_instability: ((diag.grouped_failures as JsonObject)?.explanation_layer_instability as unknown[] | undefined)?.length ?? 0,
    },
  };

  const regressionAttributionSummary = diagnostics.map((d) => ({
    base_case_id: String(d.base_case_id ?? 'n/a'),
    regression_primary_cause: String(d.regression_primary_cause ?? 'unknown'),
    regression_secondary_cause: String(d.regression_secondary_cause ?? 'unknown'),
    new_edge_flag_triggered: String(d.new_edge_flag_triggered ?? 'no'),
    should_have_stayed_standard_mode: String(d.should_have_stayed_standard_mode ?? 'no'),
  }));

  const previouslyRegressedCases = diagnostics.map((d) => ({
    base_case_id: String(d.base_case_id ?? 'n/a'),
    pre_edge_sprint_result: 'not_archived_in_artifacts',
    post_edge_sprint_regressed_result: 'unstable',
    post_reconciliation_result: 'improved_or_still_unstable',
    edge_flags_active: {
      new_edge_flag_triggered: String(d.new_edge_flag_triggered ?? 'no'),
      should_have_stayed_standard_mode: String(d.should_have_stayed_standard_mode ?? 'no'),
    },
    reviewer_note: String(d.regression_primary_cause ?? 'unknown'),
  }));

  const artifact = {
    sprint: 'NDS_EDGE_STABILITY_RECONCILIATION_SPRINT_V1',
    generated_at: new Date().toISOString(),
    pre_reconciliation_failure_profile: preReconciliation,
    post_reconciliation_profile: postReconciliation,
    regression_attribution_summary: regressionAttributionSummary,
    track_b_scoping_changes: [
      'Edge mode activation tightened to stronger degraded-input signals only.',
      'Trust/explanation restraint constrained to weak or polished-empty inputs.',
      'Standard-mode protection applied to avoid edge-flag overtrigger on coherent paraphrases.',
      'Fallback and candidate-recovery penalties scoped to real contamination signals.',
    ],
    case_level_reporting: previouslyRegressedCases,
    remaining_unstable_cases: diagnostics.map((d) => String(d.base_case_id ?? 'n/a')),
    remaining_weak_edge_cases:
      ((edge.packets as JsonObject[] | undefined) ?? [])
        .filter((p) => String(((p.edge_case_audit as JsonObject)?.remaining_failure ?? '')) !== '' && String(((p.edge_case_audit as JsonObject)?.remaining_failure ?? '')) !== 'null')
        .map((p) => String(p.case_id ?? 'n/a')),
    rollout_recommendation:
      Number(edgeAggregate.behavior_correct_count ?? 0) >= 21 &&
      Number(edgeAggregate.candidate_broken_count ?? 0) <= 2 &&
      Number(stabilityAggregate.winner_stable_count ?? 0) >= 9 &&
      Number(stabilityAggregate.route_stable_count ?? 0) >= 9
        ? 'GO'
        : 'BLOCK',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));

  const md = [
    '# NDS_EDGE_STABILITY_RECONCILIATION_SPRINT_RESULTS_V1',
    '',
    '## sprint purpose',
    '',
    'Reconcile edge-input recovery gains with paraphrase stability so both protocol families remain rollout-safe.',
    '',
    '## pre-reconciliation failure profile',
    '',
    `- edge behavior_correct: ${preReconciliation.edge_case_metrics.behavior_correct}/24`,
    `- edge candidate_broken: ${preReconciliation.edge_case_metrics.candidate_broken}/24`,
    `- stability winner_stable: ${preReconciliation.stability_metrics.winner_stable}/12`,
    `- stability route_stable: ${preReconciliation.stability_metrics.route_stable}/12`,
    `- stability diagnostic unstable_base_cases: ${preReconciliation.stability_failure_diagnostic.unstable_base_cases}`,
    '',
    '## regression attribution summary',
    '',
    ...regressionAttributionSummary.map(
      (r) =>
        `- ${r.base_case_id}: primary=${r.regression_primary_cause}, secondary=${r.regression_secondary_cause}, edge_flag=${r.new_edge_flag_triggered}, should_stay_standard=${r.should_have_stayed_standard_mode}`,
    ),
    '',
    '## Track B scoping changes',
    '',
    ...artifact.track_b_scoping_changes.map((x) => `- ${x}`),
    '',
    '## edge-case metrics before/after',
    '',
    `- behavior_correct: ${preReconciliation.edge_case_metrics.behavior_correct} -> ${postReconciliation.edge_case_metrics.behavior_correct}`,
    `- bluff_high: ${preReconciliation.edge_case_metrics.bluff_high} -> ${postReconciliation.edge_case_metrics.bluff_high}`,
    `- candidate_broken: ${preReconciliation.edge_case_metrics.candidate_broken} -> ${postReconciliation.edge_case_metrics.candidate_broken}`,
    `- trustworthy: ${preReconciliation.edge_case_metrics.trustworthy} -> ${postReconciliation.edge_case_metrics.trustworthy}`,
    `- route_action_match: ${preReconciliation.edge_case_metrics.route_action_match} -> ${postReconciliation.edge_case_metrics.route_action_match}`,
    `- caution_cases_correct: ${preReconciliation.edge_case_metrics.caution_cases_correct} -> ${postReconciliation.edge_case_metrics.caution_cases_correct}`,
    `- low_signal_or_contradiction_overbluff: ${preReconciliation.edge_case_metrics.low_signal_or_contradiction_overbluff} -> ${postReconciliation.edge_case_metrics.low_signal_or_contradiction_overbluff}`,
    '',
    '## stability metrics before/after',
    '',
    `- winner_stable: ${preReconciliation.stability_metrics.winner_stable} -> ${postReconciliation.stability_metrics.winner_stable}`,
    `- winner_unstable: ${preReconciliation.stability_metrics.winner_unstable} -> ${postReconciliation.stability_metrics.winner_unstable}`,
    `- route_stable: ${preReconciliation.stability_metrics.route_stable} -> ${postReconciliation.stability_metrics.route_stable}`,
    `- confidence_unreliable: ${preReconciliation.stability_metrics.confidence_unreliable} -> ${postReconciliation.stability_metrics.confidence_unreliable}`,
    `- explanation_bad: ${preReconciliation.stability_metrics.explanation_bad} -> ${postReconciliation.stability_metrics.explanation_bad}`,
    `- strict_fail_count: ${preReconciliation.stability_metrics.strict_fail_count} -> ${postReconciliation.stability_metrics.strict_fail_count}`,
    `- ambiguity_arbitrary_flip_count: ${preReconciliation.stability_metrics.ambiguity_arbitrary_flip_count} -> ${postReconciliation.stability_metrics.ambiguity_arbitrary_flip_count}`,
    '',
    '## remaining unstable cases',
    '',
    ...(artifact.remaining_unstable_cases.length > 0
      ? artifact.remaining_unstable_cases.map((c) => `- ${c}`)
      : ['- none']),
    '',
    '## remaining weak edge cases',
    '',
    ...(artifact.remaining_weak_edge_cases.length > 0
      ? artifact.remaining_weak_edge_cases.map((c) => `- ${c}`)
      : ['- none']),
    '',
    '## final rollout recommendation',
    '',
    `**${artifact.rollout_recommendation}**`,
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD, md);

  console.log('NDS_EDGE_STABILITY_RECONCILIATION_SPRINT_V1');
  console.log(`  rollout_recommendation: ${artifact.rollout_recommendation}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main();
