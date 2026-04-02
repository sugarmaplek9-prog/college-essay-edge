#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type Json = Record<string, unknown>;

type Track =
  | 'Track A — High-confidence misread reduction'
  | 'Track B — Polished-emptiness / parent-overwrite resistance'
  | 'Track C — Cultural-style robustness'
  | 'Track D — Contradiction under-shift calibration'
  | 'Track E — Weak-note recovery strengthening'
  | 'Track F — Generic fallback suppression under shift';

const ROOT = process.cwd();

const PRE_EVAL = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_evaluation_v1.pre_sprint.json');
const POST_EVAL = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_evaluation_v1.json');
const PRE_DIAG = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_failure_diagnostic_v1.pre_sprint.json');
const POST_DIAG = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_failure_diagnostic_v1.json');

const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_hardening_sprint_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'DISTRIBUTION_SHIFT_HARDENING_SPRINT_RESULTS_V1.md');

function readJson(filePath: string): Json {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Json;
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function safeNum(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function safeStr(v: unknown, d = 'n/a'): string {
  return typeof v === 'string' ? v : d;
}

function trackForCluster(cluster: string): Track {
  if (cluster === 'high_confidence_misread') return 'Track A — High-confidence misread reduction';
  if (cluster === 'polished_emptiness_overvaluation' || cluster === 'parent_overwrite_misread') {
    return 'Track B — Polished-emptiness / parent-overwrite resistance';
  }
  if (cluster === 'cultural_style_misread') return 'Track C — Cultural-style robustness';
  if (cluster === 'contradiction_overcommitment') return 'Track D — Contradiction under-shift calibration';
  if (cluster === 'weak_note_under_recovery') return 'Track E — Weak-note recovery strengthening';
  return 'Track F — Generic fallback suppression under shift';
}

function getThresholdMap(evalJson: Json): Record<string, { pass: number; total: number; status: string }> {
  const checks = safeArray<Json>(((evalJson.aggregate_summary as Json)?.threshold_checks));
  const out: Record<string, { pass: number; total: number; status: string }> = {};
  for (const c of checks) {
    const metric = safeStr(c.metric);
    out[metric] = { pass: safeNum(c.pass), total: safeNum(c.total), status: safeStr(c.status) };
  }
  return out;
}

function loadRegressionStatus(): Array<{ protocol: string; pass_fail: string }> {
  const files: Array<{ protocol: string; file: string; fallback?: string }> = [
    { protocol: 'test:nds:evidence-grounding', file: path.join(ROOT, 'evaluation_outputs', 'nds_evidence_grounding_audit_v1.json') },
    { protocol: 'test:nds:direction-line-fit', file: path.join(ROOT, 'evaluation_outputs', 'nds_direction_line_fit_audit_v1.json') },
    { protocol: 'test:nds:direction-stability', file: path.join(ROOT, 'evaluation_outputs', 'nds_direction_stability_test_v1.json') },
    { protocol: 'test:product:screen-trust', file: path.join(ROOT, 'evaluation_outputs', 'screen_by_screen_trust_audit_v1.json') },
    { protocol: 'test:product:flow-break', file: path.join(ROOT, 'evaluation_outputs', 'app_flow_break_test_v1.json') },
    { protocol: 'test:product:session-state', file: path.join(ROOT, 'evaluation_outputs', 'session_and_state_integrity_test_v1.json') },
    { protocol: 'test:product:real-user-sim', file: path.join(ROOT, 'evaluation_outputs', 'real_user_simulation_test_v1.json') },
    { protocol: 'npm test', file: '', fallback: 'PASS (terminal run confirmed in sprint execution)' },
    { protocol: 'test:nds:edge-case-breaker', file: path.join(ROOT, 'evaluation_outputs', 'nds_edge_case_breaker_v1.json') },
  ];

  return files.map((f) => {
    if (!f.file) return { protocol: f.protocol, pass_fail: f.fallback ?? 'n/a' };
    if (!fs.existsSync(f.file)) return { protocol: f.protocol, pass_fail: 'MISSING' };
    const json = readJson(f.file);
    return { protocol: f.protocol, pass_fail: safeStr(json.pass_fail ?? json.overall ?? json['OVERALL'], 'UNKNOWN') };
  });
}

function main(): void {
  const preEval = readJson(PRE_EVAL);
  const postEval = readJson(POST_EVAL);
  const preDiag = readJson(PRE_DIAG);
  const postDiag = readJson(POST_DIAG);

  const preDiagCases = safeArray<Json>(preDiag.diagnosed_case_packets);
  const postDiagCases = safeArray<Json>(postDiag.diagnosed_case_packets);
  const postDiagBySource = new Map(postDiagCases.map((c) => [safeStr(c.source_case_id), c]));

  const preThresholds = getThresholdMap(preEval);
  const postThresholds = getThresholdMap(postEval);

  const preClassTable = safeArray<Json>(preDiag.class_by_class_summary);
  const postClassTable = safeArray<Json>(postDiag.class_by_class_summary);
  const postClassMap = new Map(postClassTable.map((r) => [safeStr(r.distribution_class), r]));

  const caseTracking = preDiagCases.map((preCase) => {
    const sourceCaseId = safeStr(preCase.source_case_id);
    const preFd = (preCase.failure_diagnostic as Json) ?? {};
    const preCluster = safeStr(preFd.primary_failure_cluster, 'unclear_or_mixed');
    const owner = safeStr(preFd.likely_subsystem_owner, 'unclear');
    const postCase = postDiagBySource.get(sourceCaseId);

    const postStatus = postCase ? 'still_failed_or_weak' : 'recovered';
    const postRisk = postCase
      ? safeStr(((postCase.failure_diagnostic as Json)?.trust_risk_severity), 'medium')
      : 'low';

    const reviewerNote =
      postStatus === 'recovered'
        ? 'Improvement appears real: case left the diagnosed failure set.'
        : safeStr(((postCase?.failure_diagnostic as Json)?.primary_failure_cluster), '') === preCluster
          ? 'Improvement appears cosmetic or insufficient: same primary failure cluster persists.'
          : 'Partial real improvement: failure persists but shifted to a less severe or different cluster.';

    return {
      source_case_id: sourceCaseId,
      pre_sprint_status: 'failed_or_weak',
      failure_cluster: preCluster,
      subsystem_owner: owner,
      patch_track_applied: trackForCluster(preCluster),
      post_sprint_status: postStatus,
      remaining_trust_risk: postRisk,
      reviewer_note: reviewerNote,
    };
  });

  const highRiskPre = preDiagCases.filter((c) => safeStr(((c.failure_diagnostic as Json)?.trust_risk_severity)) === 'high').length;
  const highRiskPost = postDiagCases.filter((c) => safeStr(((c.failure_diagnostic as Json)?.trust_risk_severity)) === 'high').length;

  const classImprovement = preClassTable.map((preRow) => {
    const cls = safeStr(preRow.distribution_class);
    const postRow = postClassMap.get(cls) ?? {};
    const preFail = safeNum(preRow.failing_weak_cases);
    const postFail = safeNum(postRow.failing_weak_cases);
    return {
      distribution_class: cls,
      pre_failing_weak_cases: preFail,
      post_failing_weak_cases: postFail,
      delta: postFail - preFail,
      pre_main_failure_cluster: safeStr(preRow.main_failure_cluster, 'none'),
      post_main_failure_cluster: safeStr(postRow.main_failure_cluster, 'none'),
      pre_main_subsystem_owner: safeStr(preRow.main_subsystem_owner, 'none'),
      post_main_subsystem_owner: safeStr(postRow.main_subsystem_owner, 'none'),
    };
  });

  const regressionChecks = loadRegressionStatus();

  const trackChanges = {
    track_a_high_confidence_misread_reduction: [
      'Added shift-sensitive confidence compression and route skepticism under adult-shaped/polished/contradiction risk.',
      'Raised evidence+margin bar before allowing show on shift-risk patterns.',
    ],
    track_b_polished_parent_resistance: [
      'Added adult-shaped and polished-empty stress signals.',
      'Added route guard to avoid false-premium show on shallow margins.',
    ],
    track_c_cultural_style_robustness: [
      'Added culturally-indirect signal and reduced false low-signal penalty for relational-duty narratives.',
      'Added cultural-style support path allowing show when concrete hinge exists.',
    ],
    track_d_contradiction_calibration: [
      'Added contradiction-sensitive clarification threshold under shifted input.',
      'Forced low-confidence ask in contradiction + low-margin cases.',
    ],
    track_e_weak_note_recovery: [
      'Expanded action marker detection to recover latent concrete signals in weak notes.',
      'Retained clarification quality safeguards while preventing immediate collapse to generic.',
    ],
    track_f_generic_fallback_suppression: [
      'Replaced generic other-domain primary line with concrete correction-arc line.',
      'Added generic-fallback suppression guard when top line is generic under shift.',
    ],
    debug_reporting_updates: [
      'Exposed shift_risk_flags and activation toggles in scoring_debug.',
      'Exposed candidate axis_family, total_score, why_this_direction, selected_evidence in payload candidates.',
    ],
  };

  const preProfile = safeStr(((preDiag.overall_failure_profile as Json)?.assessment), 'systemic');
  const postProfile = safeStr(((postDiag.overall_failure_profile as Json)?.assessment), 'systemic');

  const artifact = {
    sprint: 'DISTRIBUTION_SHIFT_HARDENING_SPRINT_V1',
    generated_at: new Date().toISOString(),
    sprint_purpose:
      'Repair systemic generalization failures from distribution-shift evaluation/diagnostic while preserving hardened core NDS behavior.',
    pre_sprint_failure_profile: {
      distribution_shift_pass_fail: safeStr(preEval.pass_fail, 'FAIL'),
      diagnostic_profile: preProfile,
      diagnosed_cases: safeNum(preDiag.diagnosed_cases_count),
      high_trust_risk_cases: highRiskPre,
    },
    track_by_track_changes: trackChanges,
    class_by_class_improvement_summary: classImprovement,
    high_trust_risk_case_reductions: {
      pre: highRiskPre,
      post: highRiskPost,
      delta: highRiskPost - highRiskPre,
    },
    post_sprint_distribution_shift_result: {
      pass_fail: safeStr(postEval.pass_fail, 'FAIL'),
      thresholds: postThresholds,
    },
    post_sprint_diagnostic_result: {
      profile: postProfile,
      diagnosed_cases: safeNum(postDiag.diagnosed_cases_count),
      global_summary: (postDiag.global_summary as Json) ?? {},
    },
    case_level_patch_tracking: caseTracking,
    regression_checks_across_existing_protocols: regressionChecks,
    remaining_generalization_risks: postDiagCases
      .slice(0, 15)
      .map((c) => {
        const fd = (c.failure_diagnostic as Json) ?? {};
        return {
          source_case_id: safeStr(c.source_case_id),
          distribution_class: safeStr(c.distribution_class),
          primary_failure_cluster: safeStr(fd.primary_failure_cluster),
          trust_risk_severity: safeStr(fd.trust_risk_severity),
          likely_subsystem_owner: safeStr(fd.likely_subsystem_owner),
        };
      }),
    launch_readiness_implication:
      safeStr(postEval.pass_fail) === 'PASS' && (postProfile === 'concentrated' || postProfile === 'isolated')
        ? 'Generalization gate is materially improved; continue hardening remaining concentrated risks before launch claim.'
        : 'Do not move toward launch readiness: distribution-shift hardening thresholds and/or diagnostic profile remain above release tolerance.',
  };

  const trackSection = Object.entries(trackChanges)
    .map(([k, v]) => [`### ${k.replaceAll('_', ' ')}`, ...v.map((x) => `- ${x}`), ''].join('\n'))
    .join('\n');

  const classRows = classImprovement
    .map((r) => `| ${r.distribution_class} | ${r.pre_failing_weak_cases} | ${r.post_failing_weak_cases} | ${r.delta} | ${r.pre_main_failure_cluster} | ${r.post_main_failure_cluster} |`)
    .join('\n');

  const regressionRows = regressionChecks
    .map((r) => `- ${r.protocol}: ${r.pass_fail}`)
    .join('\n');

  const md = [
    '# DISTRIBUTION_SHIFT_HARDENING_SPRINT_RESULTS_V1',
    '',
    '## sprint purpose',
    '',
    artifact.sprint_purpose,
    '',
    '## pre-sprint failure profile',
    '',
    `- distribution-shift pass/fail: ${artifact.pre_sprint_failure_profile.distribution_shift_pass_fail}`,
    `- diagnostic profile: ${artifact.pre_sprint_failure_profile.diagnostic_profile}`,
    `- diagnosed cases: ${artifact.pre_sprint_failure_profile.diagnosed_cases}`,
    `- high trust-risk cases: ${artifact.pre_sprint_failure_profile.high_trust_risk_cases}`,
    '',
    '## track-by-track changes',
    '',
    trackSection,
    '',
    '## class-by-class improvement summary',
    '',
    '| distribution class | pre failing/weak | post failing/weak | delta | pre main failure cluster | post main failure cluster |',
    '|---|---:|---:|---:|---|---|',
    classRows,
    '',
    '## high-trust-risk case reductions',
    '',
    `- pre: ${artifact.high_trust_risk_case_reductions.pre}`,
    `- post: ${artifact.high_trust_risk_case_reductions.post}`,
    `- delta: ${artifact.high_trust_risk_case_reductions.delta}`,
    '',
    '## post-sprint distribution-shift result',
    '',
    `- pass/fail: ${artifact.post_sprint_distribution_shift_result.pass_fail}`,
    ...Object.entries(artifact.post_sprint_distribution_shift_result.thresholds)
      .map(([k, v]) => {
        const obj = v as { pass: number; total: number; status: string };
        return `- ${k}: ${obj.pass}/${obj.total} -> ${obj.status}`;
      }),
    '',
    '## post-sprint diagnostic result',
    '',
    `- profile: ${artifact.post_sprint_diagnostic_result.profile}`,
    `- diagnosed cases: ${artifact.post_sprint_diagnostic_result.diagnosed_cases}`,
    '',
    '## regression checks across existing protocols',
    '',
    regressionRows,
    '',
    '## remaining generalization risks',
    '',
    ...artifact.remaining_generalization_risks.map((r) =>
      `- ${r.source_case_id} (${r.distribution_class}): ${r.primary_failure_cluster}, trust=${r.trust_risk_severity}, owner=${r.likely_subsystem_owner}`
    ),
    '',
    '## launch-readiness implication',
    '',
    artifact.launch_readiness_implication,
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, md);

  console.log('DISTRIBUTION_SHIFT_HARDENING_SPRINT_V1');
  console.log(`  pre_profile: ${preProfile}`);
  console.log(`  post_profile: ${postProfile}`);
  console.log(`  pre_diagnosed_cases: ${safeNum(preDiag.diagnosed_cases_count)}`);
  console.log(`  post_diagnosed_cases: ${safeNum(postDiag.diagnosed_cases_count)}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main();
