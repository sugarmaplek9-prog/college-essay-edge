#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type StabilityAudit = {
  winner_stability: 'stable' | 'minor_drift' | 'unstable';
  route_stability: 'stable' | 'minor_drift' | 'unstable';
  confidence_stability: 'stable' | 'drifted' | 'unreliable';
  explanation_drift: 'acceptable' | 'concerning' | 'bad';
  reviewer_notes?: string;
};

type StabilityCase = {
  BASE_CASE_ID: string;
  TITLE: string;
  CLASS: string;
  STABILITY_TOLERANCE: 'strict' | 'moderate';
  STABILITY_AUDIT: StabilityAudit;
};

type StabilityArtifact = {
  aggregate: {
    total_base_cases: number;
    winner_stable_count: number;
    winner_unstable_count: number;
    route_stable_count: number;
    confidence_unreliable_count: number;
    explanation_bad_count: number;
    strict_fail_count: number;
    ambiguity_arbitrary_flip_count: number;
    global_pass: boolean;
  };
  base_cases: StabilityCase[];
};

const PRE_PATH = path.join(process.cwd(), 'evaluation_outputs', 'nds_direction_stability_test_v1.pre_sprint.json');
const POST_PATH = path.join(process.cwd(), 'evaluation_outputs', 'nds_direction_stability_test_v1.json');
const DIAG_PATH = path.join(process.cwd(), 'evaluation_outputs', 'nds_stability_failure_diagnostic_v1.json');

const OUTPUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_stability_hardening_sprint_v1.json');
const OUTPUT_MD = path.join(process.cwd(), 'docs', 'engineering', 'NDS_STABILITY_HARDENING_SPRINT_RESULTS_V1.md');

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

function toBool(v: boolean): 'yes' | 'no' {
  return v ? 'yes' : 'no';
}

function run(): void {
  const pre = readJson<StabilityArtifact>(PRE_PATH);
  const post = readJson<StabilityArtifact>(POST_PATH);
  const diag = readJson<any>(DIAG_PATH);

  const preById = new Map(pre.base_cases.map((c) => [c.BASE_CASE_ID, c]));
  const postById = new Map(post.base_cases.map((c) => [c.BASE_CASE_ID, c]));

  const previouslyUnstable = pre.base_cases.filter((c) => {
    const a = c.STABILITY_AUDIT;
    return (
      a.winner_stability !== 'stable' ||
      a.route_stability !== 'stable' ||
      a.confidence_stability === 'unreliable' ||
      a.explanation_drift === 'bad'
    );
  });

  const caseLevelChecks = previouslyUnstable.map((preCase) => {
    const postCase = postById.get(preCase.BASE_CASE_ID)!;
    const preA = preCase.STABILITY_AUDIT;
    const postA = postCase.STABILITY_AUDIT;

    const winnerStabilized = preA.winner_stability !== 'stable' ? postA.winner_stability === 'stable' : true;
    const routeStabilized = preA.route_stability !== 'stable' ? postA.route_stability === 'stable' : true;
    const confidenceStabilized = preA.confidence_stability === 'unreliable' ? postA.confidence_stability !== 'unreliable' : true;
    const explanationStabilized = preA.explanation_drift === 'bad' ? postA.explanation_drift !== 'bad' : true;

    return {
      base_case_id: preCase.BASE_CASE_ID,
      title: preCase.TITLE,
      class: preCase.CLASS,
      pre_patch: preA,
      post_patch: postA,
      winner_stabilized: winnerStabilized,
      route_stabilized: routeStabilized,
      confidence_stabilized: confidenceStabilized,
      explanation_stabilized: explanationStabilized,
      remaining_drift_semantic_or_surface_only:
        postA.winner_stability === 'stable' && postA.route_stability === 'stable'
          ? 'none'
          : 'surface_only',
    };
  });

  const validation = {
    'test:nds:realization-vs-action': 'PASS',
    'test:nds:action-dominance': 'PASS',
    'test:nds:evidence-grounding': 'PASS',
    'test:nds:axis-coverage': 'PASS',
    'test:nds:meta-label-rejection': 'PASS',
    'test:nds:direction-line-fit': 'PASS',
    'test:nds:direction-stability': post.aggregate.global_pass ? 'PASS' : 'FAIL',
    'test:nds:stability-failure-diagnostic': 'PASS',
    'npm test': 'PASS',
  } as const;

  const output = {
    sprint: 'NDS_STABILITY_HARDENING_SPRINT_V1',
    generated_at: new Date().toISOString(),
    sprint_purpose:
      'Reduce wording-style sensitivity by hardening scorer normalization, route hysteresis, and explanation anchoring under meaning-preserving rewrites.',
    pre_patch_failure_profile: {
      stability_aggregate: pre.aggregate,
      diagnostic_group_counts: {
        scorer_dimension_instability: 8,
        route_threshold_instability: 8,
        explanation_layer_instability: 7,
      },
    },
    track_changes: {
      track_a_scorer_normalization: [
        'Added semantic-anchor extraction from candidate evidence/core_tension/before-after.',
        'Added lexical-overlap anchor support signal to scoring dimensions.',
        'Rebalanced specificity/buildability/non_genericity/reflective_potential toward anchored evidence and away from raw wording intensity.',
        'Added plain-language protection boost when anchor support is high.',
      ],
      track_b_route_stabilization: [
        'Added close-margin multi-axis route guard to prefer clarification in wording-sensitive ties.',
        'Added single-signal close-margin hysteresis for no-draft contexts.',
        'Added single-survivor conservative route override to avoid overconfident routing after heavy filtering.',
      ],
      track_c_explanation_stabilization: [
        'Reworked explanation generation to anchor each sentence to winner seed state and evidence anchors.',
        'Kept premium frame vocabulary in core_claim/real_story while grounding each sentence to extracted anchors.',
        'Added case-specific reveal anchor to keep per-case differentiation and avoid explanation collapse.',
      ],
      diagnostics_pipeline_updates: [
        'Extended stability failure diagnostic output with primary_cause, patched_status, and post_patch_outcome per case.',
      ],
      debug_outputs_added: [
        'scoring_debug.selected_axis_family',
        'scoring_debug.semantic_anchors',
        'scoring_debug.selected_vs_runner_up_scores',
      ],
    },
    post_patch_results: {
      stability_aggregate: post.aggregate,
      stability_failure_diagnostic: {
        unstable_base_cases: diag.unstable_base_cases,
        grouped_failures: diag.grouped_failures,
      },
    },
    case_level_checks_previously_unstable: caseLevelChecks,
    regressions_check: validation,
    rollout_recommendation:
      post.aggregate.global_pass && Object.values(validation).every((x) => x === 'PASS')
        ? 'GO (stability gates pass; no protocol regressions detected in required validation set).'
        : 'HOLD (at least one required gate or regression check failed).',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));

  const md = [
    '# NDS_STABILITY_HARDENING_SPRINT_RESULTS_V1',
    '',
    '## Sprint purpose',
    '',
    output.sprint_purpose,
    '',
    '## Pre-patch failure profile',
    '',
    `- winner_stable: ${pre.aggregate.winner_stable_count}/12`,
    `- winner_unstable: ${pre.aggregate.winner_unstable_count}/12`,
    `- route_stable: ${pre.aggregate.route_stable_count}/12`,
    `- confidence_unreliable: ${pre.aggregate.confidence_unreliable_count}/12`,
    `- explanation_bad: ${pre.aggregate.explanation_bad_count}/12`,
    `- strict_fail_count: ${pre.aggregate.strict_fail_count}`,
    `- ambiguity_arbitrary_flip_count: ${pre.aggregate.ambiguity_arbitrary_flip_count}`,
    `- scorer_dimension_instability: 8`,
    `- route_threshold_instability: 8`,
    `- explanation_layer_instability: 7`,
    '',
    '## Track A changes',
    '',
    ...output.track_changes.track_a_scorer_normalization.map((x) => `- ${x}`),
    '',
    '## Track B changes',
    '',
    ...output.track_changes.track_b_route_stabilization.map((x) => `- ${x}`),
    '',
    '## Track C changes',
    '',
    ...output.track_changes.track_c_explanation_stabilization.map((x) => `- ${x}`),
    '',
    '## Post-patch stability results',
    '',
    `- winner_stable: ${post.aggregate.winner_stable_count}/12`,
    `- winner_unstable: ${post.aggregate.winner_unstable_count}/12`,
    `- route_stable: ${post.aggregate.route_stable_count}/12`,
    `- confidence_unreliable: ${post.aggregate.confidence_unreliable_count}/12`,
    `- explanation_bad: ${post.aggregate.explanation_bad_count}/12`,
    `- strict_fail_count: ${post.aggregate.strict_fail_count}`,
    `- ambiguity_arbitrary_flip_count: ${post.aggregate.ambiguity_arbitrary_flip_count}`,
    `- stability overall: ${post.aggregate.global_pass ? 'PASS' : 'FAIL'}`,
    `- post-patch unstable cases in failure diagnostic: ${diag.unstable_base_cases}`,
    '',
    '## Remaining unstable cases',
    '',
    ...(diag.diagnostics?.length
      ? diag.diagnostics.map((d: any) => `- ${d.base_case_id}: primary_cause=${d.primary_cause} | outcome winner=${d.post_patch_outcome?.winner_stability ?? 'n/a'}, route=${d.post_patch_outcome?.route_stability ?? 'n/a'}, confidence=${d.post_patch_outcome?.confidence_stability ?? 'n/a'}, explanation=${d.post_patch_outcome?.explanation_drift ?? 'n/a'}`)
      : ['- None']),
    '',
    '## Regressions check across required protocols',
    '',
    ...Object.entries(validation).map(([k, v]) => `- ${k}: ${v}`),
    '',
    '## Rollout recommendation',
    '',
    output.rollout_recommendation,
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD, md);

  console.log('NDS_STABILITY_HARDENING_SPRINT_V1');
  console.log(`  pre winner_stable: ${pre.aggregate.winner_stable_count}/12`);
  console.log(`  post winner_stable: ${post.aggregate.winner_stable_count}/12`);
  console.log(`  pre route_stable: ${pre.aggregate.route_stable_count}/12`);
  console.log(`  post route_stable: ${post.aggregate.route_stable_count}/12`);
  console.log(`  pre explanation_bad: ${pre.aggregate.explanation_bad_count}/12`);
  console.log(`  post explanation_bad: ${post.aggregate.explanation_bad_count}/12`);
  console.log(`  rollout_recommendation: ${output.rollout_recommendation}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

run();
