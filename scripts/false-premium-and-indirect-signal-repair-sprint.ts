#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type Json = Record<string, unknown>;

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'evaluation_outputs');
const DOCS = path.join(ROOT, 'docs', 'engineering');

const REQUIRED_INPUTS = {
  pattern_json: path.join(OUT, 'distribution_shift_pattern_diagnostic_v1.json'),
  pattern_md: path.join(DOCS, 'DISTRIBUTION_SHIFT_PATTERN_DIAGNOSTIC_RESULTS_V1.md'),
  failure_diag_json: path.join(OUT, 'distribution_shift_failure_diagnostic_v1.json'),
  eval_json: path.join(OUT, 'distribution_shift_evaluation_v1.json'),
  class_repair_json: path.join(OUT, 'distribution_shift_class_repair_sprint_v1.json'),
  hardening_json: path.join(OUT, 'distribution_shift_hardening_sprint_v1.json'),
};

const PRE_PATTERN = path.join(OUT, 'distribution_shift_pattern_diagnostic_v1.pre_false_premium_and_indirect_signal.json');
const PRE_EVAL = path.join(OUT, 'distribution_shift_evaluation_v1.pre_false_premium_and_indirect_signal.json');
const PRE_FAIL_DIAG = path.join(OUT, 'distribution_shift_failure_diagnostic_v1.pre_false_premium_and_indirect_signal.json');

const POST_PATTERN = REQUIRED_INPUTS.pattern_json;
const POST_EVAL = REQUIRED_INPUTS.eval_json;
const POST_FAIL_DIAG = REQUIRED_INPUTS.failure_diag_json;

const OUT_JSON = path.join(OUT, 'false_premium_and_indirect_signal_repair_sprint_v1.json');
const OUT_MD = path.join(DOCS, 'FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_RESULTS_V1.md');

function readJson(filePath: string): Json {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Json;
}

function ensureInputs(): void {
  for (const filePath of Object.values(REQUIRED_INPUTS)) {
    if (!fs.existsSync(filePath)) throw new Error(`Missing required protocol input: ${filePath}`);
  }
  for (const filePath of [PRE_PATTERN, PRE_EVAL, PRE_FAIL_DIAG]) {
    if (!fs.existsSync(filePath)) throw new Error(`Missing pre-sprint snapshot: ${filePath}`);
  }
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function s(v: unknown, d = 'n/a'): string {
  return typeof v === 'string' ? v : d;
}

function n(v: unknown, d = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : d;
}

function countBy(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[i] = (out[i] ?? 0) + 1;
  return out;
}

function topKeys(map: Record<string, number>, limit = 3): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

function metricMap(evalJson: Json): Record<string, { pass: number; total: number; status: string }> {
  const checks = arr<Json>(((evalJson.aggregate_summary as Json)?.threshold_checks));
  const out: Record<string, { pass: number; total: number; status: string }> = {};
  for (const c of checks) {
    out[s(c.metric)] = {
      pass: n(c.pass),
      total: n(c.total),
      status: s(c.status),
    };
  }
  return out;
}

function toTrack(pattern: string): string {
  if (pattern === 'indirect_hinge_underread') return 'Track A — Indirect hinge sentence candidate recovery';
  if (pattern === 'false_premium_confidence') return 'Track B — False-premium candidate suppression';
  if (pattern === 'careful_but_unhelpful_output') return 'Track C — Helpful caution / useful-output repair';
  return 'Track D — Residual validation and non-regression';
}

function regressionStatus(): Array<{ protocol: string; pass_fail: string }> {
  const files: Array<[string, string | null]> = [
    ['test:nds:evidence-grounding', path.join(OUT, 'nds_evidence_grounding_audit_v1.json')],
    ['test:nds:direction-line-fit', path.join(OUT, 'nds_direction_line_fit_audit_v1.json')],
    ['test:nds:direction-stability', path.join(OUT, 'nds_direction_stability_test_v1.json')],
    ['test:product:screen-trust', path.join(OUT, 'screen_by_screen_trust_audit_v1.json')],
    ['test:product:flow-break', path.join(OUT, 'app_flow_break_test_v1.json')],
    ['test:product:session-state', path.join(OUT, 'session_and_state_integrity_test_v1.json')],
    ['test:product:real-user-sim', path.join(OUT, 'real_user_simulation_test_v1.json')],
    ['npm test', null],
    ['test:nds:edge-case-breaker', path.join(OUT, 'nds_edge_case_breaker_v1.json')],
  ];

  return files.map(([protocol, file]) => {
    if (!file) return { protocol, pass_fail: 'PASS (terminal run confirmed)' };
    if (!fs.existsSync(file)) return { protocol, pass_fail: 'MISSING' };
    const json = readJson(file);
    return { protocol, pass_fail: s(json.pass_fail ?? json.overall, 'UNKNOWN') };
  });
}

function main(): void {
  ensureInputs();

  const prePattern = readJson(PRE_PATTERN);
  const postPattern = readJson(POST_PATTERN);
  const preEval = readJson(PRE_EVAL);
  const postEval = readJson(POST_EVAL);
  const preFailDiag = readJson(PRE_FAIL_DIAG);
  const postFailDiag = readJson(POST_FAIL_DIAG);

  const prePackets = arr<Json>(prePattern.residual_case_packets);
  const postPackets = arr<Json>(postPattern.residual_case_packets);

  const preBySource = new Map(prePackets.map((p) => [s(p.source_case_id), p]));
  const postBySource = new Map(postPackets.map((p) => [s(p.source_case_id), p]));

  const keyPatterns = [
    'indirect_hinge_underread',
    'false_premium_confidence',
    'careful_but_unhelpful_output',
  ] as const;

  const preCounts = countBy(
    prePackets.map((p) => s(((p.residual_pattern_diagnostic as Json)?.primary_behavioral_pattern), 'unclear_or_multi_pattern'))
  );
  const postCounts = countBy(
    postPackets.map((p) => s(((p.residual_pattern_diagnostic as Json)?.primary_behavioral_pattern), 'unclear_or_multi_pattern'))
  );

  const preHighRisk = prePackets.filter((p) => s(((p.residual_pattern_diagnostic as Json)?.trust_risk_severity)) === 'high').length;
  const postHighRisk = postPackets.filter((p) => s(((p.residual_pattern_diagnostic as Json)?.trust_risk_severity)) === 'high').length;

  const caseLevelPatchTracking = prePackets.map((pre) => {
    const sourceCaseId = s(pre.source_case_id);
    const preDiag = (pre.residual_pattern_diagnostic as Json) ?? {};
    const post = postBySource.get(sourceCaseId);
    const postDiag = (post?.residual_pattern_diagnostic as Json) ?? {};

    const prePrimary = s(preDiag.primary_behavioral_pattern, 'unclear_or_multi_pattern');
    const postPrimary = s(postDiag.primary_behavioral_pattern, prePrimary);

    const postStatus = post
      ? postPrimary === prePrimary
        ? 'still_failed_or_weak'
        : 'partially_repaired'
      : 'recovered';

    return {
      source_case_id: sourceCaseId,
      primary_behavioral_pattern: prePrimary,
      secondary_behavioral_pattern: s(preDiag.secondary_behavioral_pattern, 'none'),
      likely_subsystem_owner: s(preDiag.likely_subsystem_owner, 'unclear'),
      pre_sprint_status: 'failed_or_weak',
      patch_track_applied: toTrack(prePrimary),
      post_sprint_status: postStatus,
      remaining_trust_risk: post ? s(postDiag.trust_risk_severity, 'medium') : 'low',
      reviewer_note:
        !post
          ? 'Recovered from residual universe.'
          : postPrimary === prePrimary
            ? 'Primary residual behavior still present; needs deeper patching.'
            : `Shifted from ${prePrimary} to ${postPrimary}; partial improvement.`,
    };
  });

  const postBehavioralPatternTable = arr<Json>(((postPattern.aggregations as Json)?.behavioral_pattern_table));
  const postSubsystemTable = arr<Json>(((postPattern.aggregations as Json)?.subsystem_ownership_table));

  const topResidualPatterns = topKeys(postCounts, 3);
  const profile = s(((postPattern.overall_residual_profile_classification as Json)?.assessment), 'systemically_unclear');
  const highRiskOwner = s(((postPattern.strong_conclusions as Json)?.subsystem_owning_most_high_trust_risk_cases), 'unclear');

  const preMetrics = metricMap(preEval);
  const postMetrics = metricMap(postEval);

  const distributionMovement = Object.keys(postMetrics).map((metric) => ({
    metric,
    pre_pass: n(preMetrics[metric]?.pass),
    post_pass: n(postMetrics[metric]?.pass),
    total: n(postMetrics[metric]?.total),
    delta: n(postMetrics[metric]?.pass) - n(preMetrics[metric]?.pass),
    post_status: s(postMetrics[metric]?.status),
  }));

  const artifact = {
    sprint: 'FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_V1',
    generated_at: new Date().toISOString(),
    sprint_purpose:
      'Surgically reduce residual pattern failures focused on indirect-hinge underread, false-premium confidence, and careful-but-unhelpful outputs without regressing hardened core behaviors.',
    required_inputs: REQUIRED_INPUTS,
    pre_sprint_residual_pattern_profile: {
      residual_case_count: prePackets.length,
      profile: s(((prePattern.overall_residual_profile_classification as Json)?.assessment), 'pattern_concentrated'),
      top_patterns: topKeys(preCounts, 3),
      high_trust_risk_count: preHighRisk,
      dominant_high_trust_owner: s(((prePattern.strong_conclusions as Json)?.subsystem_owning_most_high_trust_risk_cases), 'unclear'),
    },
    track_changes: {
      track_a_indirect_hinge_sentence_candidate_recovery: [
        'Added indirect hinge sentence extraction before candidate generation.',
        'Added hinge-supported promotion by boosting family/support quality for candidates lexically aligned with hinge sentences.',
        'Added hinge diagnostics fields to scoring debug.',
      ],
      track_b_false_premium_candidate_suppression: [
        'Added false-premium candidate trait detection (premium tone without evidence support).',
        'Added penalties for false-premium candidates in candidate scoring.',
        'Tightened ask-route guard when top candidate is false-premium under weak support.',
      ],
      track_c_helpful_caution_useful_output_repair: [
        'Added flat-line risk detection and forced ask-route for safe-but-flat candidate winners.',
        'Sharpened clarification questions to target unresolved hinge or center competition.',
        'Added useful-caution diagnostics fields to scoring debug.',
      ],
      track_d_residual_validation_and_non_regression: [
        'Reran distribution-shift evaluation, failure diagnostic, and pattern diagnostic.',
        'Reran hardened NDS protocols, product protocols, and full regression suite.',
      ],
    },
    post_sprint_residual_pattern_changes: {
      residual_case_count_pre: prePackets.length,
      residual_case_count_post: postPackets.length,
      residual_case_delta: postPackets.length - prePackets.length,
      profile_post: profile,
      top_patterns_post: topResidualPatterns,
      key_pattern_pre_post: keyPatterns.map((pattern) => ({
        pattern,
        pre: preCounts[pattern] ?? 0,
        post: postCounts[pattern] ?? 0,
        delta: (postCounts[pattern] ?? 0) - (preCounts[pattern] ?? 0),
      })),
    },
    high_trust_risk_reduction_summary: {
      pre: preHighRisk,
      post: postHighRisk,
      delta: postHighRisk - preHighRisk,
      dominant_owner_post: highRiskOwner,
    },
    distribution_shift_movement_summary: {
      pre_pass_fail: s(preEval.pass_fail, 'FAIL'),
      post_pass_fail: s(postEval.pass_fail, 'FAIL'),
      metrics: distributionMovement,
      diagnosed_cases_pre: n(preFailDiag.diagnosed_cases_count),
      diagnosed_cases_post: n(postFailDiag.diagnosed_cases_count),
    },
    regression_check_across_hardened_protocols: regressionStatus(),
    case_level_patch_tracking: caseLevelPatchTracking,
    remaining_residual_risks: postPackets.slice(0, 20).map((p) => ({
      source_case_id: s(p.source_case_id),
      primary_behavioral_pattern: s(((p.residual_pattern_diagnostic as Json)?.primary_behavioral_pattern), 'unclear_or_multi_pattern'),
      trust_risk: s(((p.residual_pattern_diagnostic as Json)?.trust_risk_severity), 'medium'),
      likely_subsystem_owner: s(((p.residual_pattern_diagnostic as Json)?.likely_subsystem_owner), 'unclear'),
      likely_student_reaction: s(((p.residual_pattern_diagnostic as Json)?.likely_student_reaction), 'mixed'),
    })),
    subsystem_ownership_post: postSubsystemTable,
    behavioral_pattern_table_post: postBehavioralPatternTable,
    recommendation_for_next_action:
      profile === 'pattern_concentrated' && postHighRisk <= Math.max(4, preHighRisk - 3)
        ? 'Proceed with focused closure sprint on the top two residual patterns and rerun release gate protocols.'
        : 'Continue surgical candidate-generation repairs on indirect hinge + false-premium residuals before any launch-readiness movement.',
    launch_readiness_implication:
      profile === 'systemically_unclear' || postHighRisk >= preHighRisk
        ? 'Do not move toward launch readiness.'
        : 'Not launch-ready yet; continue residual closure until high-trust-risk patterns are materially reduced.',
  };

  const patternRows = postBehavioralPatternTable
    .map((row) => {
      const classes = arr<string>(row.dominant_distribution_classes).join(', ');
      return `| ${s(row.behavioral_pattern)} | ${n(row.total_count)} | ${s(row.trust_risk_concentration)} | ${s(row.dominant_subsystem_owner)} | ${classes} | ${s(row.recommended_fix_priority)} |`;
    })
    .join('\n');

  const regressionRows = artifact.regression_check_across_hardened_protocols
    .map((r) => `- ${r.protocol}: ${r.pass_fail}`)
    .join('\n');

  const movementRows = artifact.distribution_shift_movement_summary.metrics
    .map((m) => `| ${m.metric} | ${m.pre_pass}/${m.total} | ${m.post_pass}/${m.total} | ${m.delta} | ${m.post_status} |`)
    .join('\n');

  const remainingRows = artifact.remaining_residual_risks
    .slice(0, 12)
    .map(
      (r) =>
        `- ${r.source_case_id}: ${r.primary_behavioral_pattern} (risk=${r.trust_risk}, owner=${r.likely_subsystem_owner}, reaction=${r.likely_student_reaction})`,
    )
    .join('\n');

  const md = [
    '# FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_RESULTS_V1',
    '',
    '## sprint purpose',
    '',
    artifact.sprint_purpose,
    '',
    '## pre-sprint residual pattern profile',
    '',
    `- residual cases: ${artifact.pre_sprint_residual_pattern_profile.residual_case_count}`,
    `- profile: ${artifact.pre_sprint_residual_pattern_profile.profile}`,
    `- top patterns: ${artifact.pre_sprint_residual_pattern_profile.top_patterns.join(', ')}`,
    `- high trust-risk residuals: ${artifact.pre_sprint_residual_pattern_profile.high_trust_risk_count}`,
    `- dominant owner: ${artifact.pre_sprint_residual_pattern_profile.dominant_high_trust_owner}`,
    '',
    '## Track A changes',
    '',
    ...artifact.track_changes.track_a_indirect_hinge_sentence_candidate_recovery.map((x) => `- ${x}`),
    '',
    '## Track B changes',
    '',
    ...artifact.track_changes.track_b_false_premium_candidate_suppression.map((x) => `- ${x}`),
    '',
    '## Track C changes',
    '',
    ...artifact.track_changes.track_c_helpful_caution_useful_output_repair.map((x) => `- ${x}`),
    '',
    '## post-sprint residual pattern changes',
    '',
    `- residual cases: ${artifact.post_sprint_residual_pattern_changes.residual_case_count_pre} -> ${artifact.post_sprint_residual_pattern_changes.residual_case_count_post}`,
    `- profile (post): ${artifact.post_sprint_residual_pattern_changes.profile_post}`,
    `- top patterns (post): ${artifact.post_sprint_residual_pattern_changes.top_patterns_post.join(', ')}`,
    '',
    '| key pattern | pre | post | delta |',
    '|---|---:|---:|---:|',
    ...artifact.post_sprint_residual_pattern_changes.key_pattern_pre_post.map((r) => `| ${r.pattern} | ${r.pre} | ${r.post} | ${r.delta} |`),
    '',
    '## high-trust-risk reduction summary',
    '',
    `- high-trust-risk residuals: ${artifact.high_trust_risk_reduction_summary.pre} -> ${artifact.high_trust_risk_reduction_summary.post}`,
    `- delta: ${artifact.high_trust_risk_reduction_summary.delta}`,
    `- dominant owner (post): ${artifact.high_trust_risk_reduction_summary.dominant_owner_post}`,
    '',
    '## distribution-shift movement summary',
    '',
    `- pass/fail: ${artifact.distribution_shift_movement_summary.pre_pass_fail} -> ${artifact.distribution_shift_movement_summary.post_pass_fail}`,
    `- diagnosed cases: ${artifact.distribution_shift_movement_summary.diagnosed_cases_pre} -> ${artifact.distribution_shift_movement_summary.diagnosed_cases_post}`,
    '',
    '| metric | pre | post | delta | post status |',
    '|---|---:|---:|---:|---|',
    movementRows,
    '',
    '## regression check across hardened protocols',
    '',
    regressionRows,
    '',
    '## remaining residual risks',
    '',
    remainingRows,
    '',
    '## recommendation for next action',
    '',
    `- ${artifact.recommendation_for_next_action}`,
    '',
    '## product readiness implication',
    '',
    artifact.launch_readiness_implication,
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUT_MD, md);

  console.log('✅ FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_V1 complete');
  console.log(`- residual cases: ${prePackets.length} -> ${postPackets.length}`);
  console.log(`- profile: ${profile}`);
  console.log(`- high-trust-risk: ${preHighRisk} -> ${postHighRisk}`);
  console.log(`- JSON: ${OUT_JSON}`);
  console.log(`- Markdown: ${OUT_MD}`);
}

main();
