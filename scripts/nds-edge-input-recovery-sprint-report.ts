#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type CandidateFairness = 'fair' | 'degraded' | 'broken';
type OutputTrustworthiness = 'trustworthy' | 'questionable' | 'not_trustworthy';

type Packet = {
  case_id: string;
  case_class: string;
  runtime_result: {
    route_decision: string;
    confidence_band: string;
  };
  edge_case_audit: {
    behavior_correctness: 'correct' | 'borderline' | 'incorrect';
    candidate_fairness_under_edge_input: CandidateFairness;
    output_trustworthiness: OutputTrustworthiness;
    route_matches_correct_action: boolean;
    remediation_buckets: string[];
    candidate_failure_clusters: string[];
    pre_patch_outcome?: {
      route: string;
      candidate_quality: CandidateFairness;
      trustworthiness: OutputTrustworthiness;
    } | null;
    post_patch_outcome?: {
      route: string;
      candidate_quality: CandidateFairness;
      trustworthiness: OutputTrustworthiness;
    } | null;
    remaining_failure?: string | null;
  };
};

type BreakerArtifact = {
  protocol: string;
  generated_at: string;
  aggregate: {
    total_cases: number;
    behavior_correct_count: number;
    bluff_high_count: number;
    candidate_broken_count: number;
    trustworthiness_trustworthy_count: number;
    route_action_match_count: number;
    caution_cases_correct_count: number;
    low_signal_or_contradiction_overbluff_count: number;
    pass: boolean;
  };
  packets: Packet[];
};

const ROOT = process.cwd();
const BREAKER_JSON = path.join(ROOT, 'evaluation_outputs', 'nds_edge_case_breaker_v1.json');
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'nds_edge_input_recovery_sprint_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'NDS_EDGE_INPUT_RECOVERY_SPRINT_RESULTS_V1.md');

function thresholdStatus(value: number, predicate: boolean): 'PASS' | 'FAIL' {
  return predicate ? 'PASS' : 'FAIL';
}

function run(): void {
  if (!fs.existsSync(BREAKER_JSON)) {
    throw new Error('Missing nds_edge_case_breaker_v1.json. Run edge-case breaker first.');
  }

  const breaker = JSON.parse(fs.readFileSync(BREAKER_JSON, 'utf8')) as BreakerArtifact;
  const packets = breaker.packets ?? [];

  const preFailures = packets.filter((p) => {
    const pre = p.edge_case_audit.pre_patch_outcome;
    return pre
      ? pre.candidate_quality === 'broken' || pre.trustworthiness !== 'trustworthy'
      : p.edge_case_audit.candidate_fairness_under_edge_input === 'broken' || p.edge_case_audit.output_trustworthiness !== 'trustworthy';
  });

  const caseLevelDiff = packets.map((p) => ({
    case_id: p.case_id,
    pre_patch_route: p.edge_case_audit.pre_patch_outcome?.route ?? 'n/a',
    post_patch_route: p.runtime_result.route_decision,
    pre_patch_candidate_quality: p.edge_case_audit.pre_patch_outcome?.candidate_quality ?? 'n/a',
    post_patch_candidate_quality: p.edge_case_audit.candidate_fairness_under_edge_input,
    pre_patch_trustworthiness: p.edge_case_audit.pre_patch_outcome?.trustworthiness ?? 'n/a',
    post_patch_trustworthiness: p.edge_case_audit.output_trustworthiness,
    reviewer_fix_quality_note:
      p.edge_case_audit.pre_patch_outcome && p.edge_case_audit.pre_patch_outcome.route !== p.runtime_result.route_decision
        ? 'route changed; verify this is quality gain, not extra caution'
        : 'quality change appears structural (candidate/output level)',
  }));

  const failureBuckets = {
    candidate_generation_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('candidate_generation_failure')).length,
    clarification_quality_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('clarification_quality_failure')).length,
    trust_output_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('trust_output_failure')).length,
    fallback_behavior_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('fallback_behavior_failure')).length,
    axis_collision_failure: packets.filter((p) => p.edge_case_audit.remediation_buckets.includes('axis_collision_failure')).length,
  };

  const remainingFailureClusters = packets
    .filter((p) => p.edge_case_audit.remaining_failure)
    .map((p) => ({
      case_id: p.case_id,
      remaining_failure: p.edge_case_audit.remaining_failure,
      candidate_failure_clusters: p.edge_case_audit.candidate_failure_clusters,
    }));

  const exit = {
    behavior_correct: {
      value: breaker.aggregate.behavior_correct_count,
      threshold: '>= 20',
      status: thresholdStatus(breaker.aggregate.behavior_correct_count, breaker.aggregate.behavior_correct_count >= 20),
    },
    bluff_high: {
      value: breaker.aggregate.bluff_high_count,
      threshold: '<= 2',
      status: thresholdStatus(breaker.aggregate.bluff_high_count, breaker.aggregate.bluff_high_count <= 2),
    },
    candidate_broken: {
      value: breaker.aggregate.candidate_broken_count,
      threshold: '<= 3',
      status: thresholdStatus(breaker.aggregate.candidate_broken_count, breaker.aggregate.candidate_broken_count <= 3),
    },
    trustworthy: {
      value: breaker.aggregate.trustworthiness_trustworthy_count,
      threshold: '>= 18',
      status: thresholdStatus(breaker.aggregate.trustworthiness_trustworthy_count, breaker.aggregate.trustworthiness_trustworthy_count >= 18),
    },
    route_action_match: {
      value: breaker.aggregate.route_action_match_count,
      threshold: '>= 21',
      status: thresholdStatus(breaker.aggregate.route_action_match_count, breaker.aggregate.route_action_match_count >= 21),
    },
    caution_cases_correct: {
      value: breaker.aggregate.caution_cases_correct_count,
      threshold: '>= 9',
      status: thresholdStatus(breaker.aggregate.caution_cases_correct_count, breaker.aggregate.caution_cases_correct_count >= 9),
    },
    low_signal_or_contradiction_overbluff: {
      value: breaker.aggregate.low_signal_or_contradiction_overbluff_count,
      threshold: '= 0',
      status: thresholdStatus(
        breaker.aggregate.low_signal_or_contradiction_overbluff_count,
        breaker.aggregate.low_signal_or_contradiction_overbluff_count === 0,
      ),
    },
  };

  const allExitPass = Object.values(exit).every((item) => item.status === 'PASS');

  const sprintArtifact = {
    sprint: 'NDS_EDGE_INPUT_RECOVERY_SPRINT_V1',
    generated_at: new Date().toISOString(),
    source_protocol: breaker.protocol,
    pre_patch_failure_profile: {
      inferred_pre_fail_case_count: preFailures.length,
      notes: 'Derived from embedded pre_patch_outcome in current edge-case packets when available.',
    },
    track_changes: {
      track_a_candidate_recovery: [
        'degraded-input candidate mode and low-signal family restriction',
        'axis-level deduplication and duplication risk metadata',
        'fallback contamination penalties and support-density/family-confidence controls',
      ],
      track_b_clarification_quality: [
        'typed clarification reasons (low_signal, overloaded_input, two_competing_centers, fallback_risk)',
        'specificity guard to regenerate generic clarification questions',
        'collision-aware clarification prompt generation',
      ],
      track_c_trust_output: [
        'trust-preserving explanation restraint mode under degraded input',
        'debug exposure for trust_mode, output_assertiveness, confidence-fit',
        'conditional explanation language when evidence certainty is low',
      ],
    },
    post_patch_edge_case_results: breaker.aggregate,
    remaining_failure_clusters: remainingFailureClusters,
    failure_buckets: failureBuckets,
    case_level_deltas: caseLevelDiff,
    regressions_check: {
      blocker_detected: !allExitPass,
      notes: allExitPass
        ? 'Edge-case thresholds passed. Validate core protocol stack to confirm no regressions.'
        : 'Edge-case thresholds not fully met. Rollout remains blocked.',
    },
    rollout_recommendation: allExitPass ? 'GO' : 'BLOCK',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(sprintArtifact, null, 2));

  const md = [
    '# NDS_EDGE_INPUT_RECOVERY_SPRINT_RESULTS_V1',
    '',
    '## sprint purpose',
    '',
    'Harden NDS recovery quality under weak, weird, contradictory, and overloaded input without collapsing into generic over-caution.',
    '',
    '## pre-patch failure profile',
    '',
    `- inferred pre-patch failing/untrustworthy cases: ${preFailures.length}`,
    '',
    '## Track A changes',
    '',
    '- degraded-input candidate mode + low-signal family restriction',
    '- candidate deduplication and duplication-risk metadata',
    '- fallback contamination controls and family-confidence weighting',
    '',
    '## Track B changes',
    '',
    '- typed clarification reasons tied to actual ambiguity',
    '- clarification specificity guard/regeneration',
    '- overloaded and collision-targeted clarification prompts',
    '',
    '## Track C changes',
    '',
    '- trust-preserving explanation restraint mode under degraded input',
    '- confidence-fit and assertiveness debug channels',
    '- lower over-assertion under weak evidence while preserving utility',
    '',
    '## post-patch edge-case results',
    '',
    `- behavior_correct: ${breaker.aggregate.behavior_correct_count}/24 (${exit.behavior_correct.status})`,
    `- bluff_high: ${breaker.aggregate.bluff_high_count}/24 (${exit.bluff_high.status})`,
    `- candidate_broken: ${breaker.aggregate.candidate_broken_count}/24 (${exit.candidate_broken.status})`,
    `- trustworthy: ${breaker.aggregate.trustworthiness_trustworthy_count}/24 (${exit.trustworthy.status})`,
    `- route_action_match: ${breaker.aggregate.route_action_match_count}/24 (${exit.route_action_match.status})`,
    `- caution_cases_correct: ${breaker.aggregate.caution_cases_correct_count}/10 (${exit.caution_cases_correct.status})`,
    `- low_signal_or_contradiction_overbluff: ${breaker.aggregate.low_signal_or_contradiction_overbluff_count} (${exit.low_signal_or_contradiction_overbluff.status})`,
    '',
    '## remaining failure clusters',
    '',
    ...(remainingFailureClusters.length === 0
      ? ['- none']
      : remainingFailureClusters.map((f) => `- ${f.case_id}: ${String(f.remaining_failure)} | clusters=${f.candidate_failure_clusters.join(', ')}`)),
    '',
    '## regressions check',
    '',
    `- edge-input exit thresholds: ${allExitPass ? 'PASS' : 'FAIL'}`,
    '- full regression stack must be checked via required protocol reruns and full test suite.',
    '',
    '## rollout recommendation',
    '',
    `**${allExitPass ? 'GO' : 'BLOCK'}**`,
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD, md);

  console.log('NDS_EDGE_INPUT_RECOVERY_SPRINT_V1');
  console.log(`  rollout_recommendation: ${allExitPass ? 'GO' : 'BLOCK'}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);

  if (!allExitPass) process.exit(1);
}

run();
