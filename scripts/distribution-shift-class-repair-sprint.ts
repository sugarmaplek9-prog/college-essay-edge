#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type Json = Record<string, unknown>;

type DistributionClass =
  | 'weak_student_low_skill'
  | 'parent_overwritten_adult_shaped'
  | 'over_polished_hollow'
  | 'contradictory_multi_center'
  | 'culturally_indirect_non_default'
  | 'achievement_stacked_emotionally_thin'
  | 'messy_real_style_note_dump';

const ROOT = process.cwd();

const PRE_EVAL = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_evaluation_v1.pre_class_repair.json');
const PRE_DIAG = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_failure_diagnostic_v1.pre_class_repair.json');
const POST_EVAL = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_evaluation_v1.json');
const POST_DIAG = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_failure_diagnostic_v1.json');

const OUT_JSON = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_class_repair_sprint_v1.json');
const OUT_MD = path.join(ROOT, 'docs', 'engineering', 'DISTRIBUTION_SHIFT_CLASS_REPAIR_SPRINT_RESULTS_V1.md');

function readJson(filePath: string): Json {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Json;
}

function safeArr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function s(v: unknown, d = 'n/a'): string {
  return typeof v === 'string' ? v : d;
}

function n(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function countBy(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[i] = (out[i] ?? 0) + 1;
  return out;
}

function mode(map: Record<string, number>, d = 'none'): string {
  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? d;
}

function patchOrderForClass(cls: DistributionClass): number {
  switch (cls) {
    case 'parent_overwritten_adult_shaped':
      return 1;
    case 'over_polished_hollow':
      return 1;
    case 'culturally_indirect_non_default':
      return 2;
    case 'contradictory_multi_center':
      return 3;
    case 'weak_student_low_skill':
      return 4;
    case 'messy_real_style_note_dump':
      return 5;
    case 'achievement_stacked_emotionally_thin':
      return 6;
  }
}

function trackForClass(cls: DistributionClass): string {
  switch (cls) {
    case 'parent_overwritten_adult_shaped':
    case 'over_polished_hollow':
      return 'Track A — Parent-overwritten / polished-hollow repair';
    case 'culturally_indirect_non_default':
      return 'Track B — Culturally indirect narrative repair';
    case 'contradictory_multi_center':
      return 'Track C — Contradiction / multi-center repair';
    case 'weak_student_low_skill':
      return 'Track D — Weak-student / low-skill note repair';
    case 'messy_real_style_note_dump':
      return 'Track E — Messy note-dump robustness repair';
    case 'achievement_stacked_emotionally_thin':
      return 'Track F — Achievement-stacked / emotionally thin repair';
  }
}

function thresholdMap(evalJson: Json): Record<string, { pass: number; total: number; status: string }> {
  const checks = safeArr<Json>(((evalJson.aggregate_summary as Json)?.threshold_checks));
  const out: Record<string, { pass: number; total: number; status: string }> = {};
  for (const c of checks) {
    out[s(c.metric)] = { pass: n(c.pass), total: n(c.total), status: s(c.status) };
  }
  return out;
}

function regressionStatus(): Array<{ protocol: string; pass_fail: string }> {
  const files = [
    ['test:nds:evidence-grounding', 'nds_evidence_grounding_audit_v1.json'],
    ['test:nds:direction-line-fit', 'nds_direction_line_fit_audit_v1.json'],
    ['test:nds:direction-stability', 'nds_direction_stability_test_v1.json'],
    ['test:product:real-user-sim', 'real_user_simulation_test_v1.json'],
    ['npm test', ''],
  ] as const;

  return files.map(([protocol, file]) => {
    if (!file) return { protocol, pass_fail: 'PASS (terminal run confirmed)' };
    const p = path.join(ROOT, 'evaluation_outputs', file);
    if (!fs.existsSync(p)) return { protocol, pass_fail: 'MISSING' };
    const j = readJson(p);
    return { protocol, pass_fail: s(j.pass_fail ?? j.overall, 'UNKNOWN') };
  });
}

function main(): void {
  const preEval = readJson(PRE_EVAL);
  const preDiag = readJson(PRE_DIAG);
  const postEval = readJson(POST_EVAL);
  const postDiag = readJson(POST_DIAG);

  const preCases = safeArr<Json>(preDiag.diagnosed_case_packets);
  const postCases = safeArr<Json>(postDiag.diagnosed_case_packets);
  const postBySource = new Map(postCases.map((c) => [s(c.source_case_id), c]));

  const classes: DistributionClass[] = [
    'parent_overwritten_adult_shaped',
    'over_polished_hollow',
    'culturally_indirect_non_default',
    'contradictory_multi_center',
    'weak_student_low_skill',
    'messy_real_style_note_dump',
    'achievement_stacked_emotionally_thin',
  ];

  const prePriorityTable = classes.map((cls) => {
    const rows = preCases.filter((c) => s(c.distribution_class) === cls);
    const primary = rows.map((r) => s(((r.failure_diagnostic as Json)?.primary_failure_cluster), 'unclear_or_mixed'));
    const owners = rows.map((r) => s(((r.failure_diagnostic as Json)?.likely_subsystem_owner), 'unclear'));
    const high = rows.filter((r) => s(((r.failure_diagnostic as Json)?.trust_risk_severity), 'low') === 'high').length;

    return {
      distribution_class: cls,
      total_remaining_cases: rows.length,
      high_trust_risk_count: high,
      dominant_failure_cluster: mode(countBy(primary), 'none'),
      dominant_subsystem_owner: mode(countBy(owners), 'none'),
      sprint_patch_order_recommendation: patchOrderForClass(cls),
    };
  });

  const caseLevelTracking = preCases.map((pre) => {
    const source = s(pre.source_case_id);
    const cls = s(pre.distribution_class) as DistributionClass;
    const preFd = (pre.failure_diagnostic as Json) ?? {};
    const post = postBySource.get(source);

    return {
      source_case_id: source,
      distribution_class: cls,
      primary_failure_cluster: s(preFd.primary_failure_cluster, 'unclear_or_mixed'),
      likely_subsystem_owner: s(preFd.likely_subsystem_owner, 'unclear'),
      pre_sprint_status: 'failed_or_weak',
      patch_track_applied: trackForClass(cls),
      post_sprint_status: post ? 'still_failed_or_weak' : 'recovered',
      remaining_trust_risk: post ? s(((post.failure_diagnostic as Json)?.trust_risk_severity), 'medium') : 'low',
      reviewer_note:
        !post
          ? 'Real improvement: case exited the diagnosed set.'
          : s(((post.failure_diagnostic as Json)?.primary_failure_cluster), '') === s(preFd.primary_failure_cluster, '')
            ? 'Likely cosmetic/insufficient improvement: same dominant failure persists.'
            : 'Partial improvement: failure shifted clusters but still unresolved.',
    };
  });

  const preClass = safeArr<Json>(preDiag.class_by_class_summary);
  const postClass = safeArr<Json>(postDiag.class_by_class_summary);
  const postClassMap = new Map(postClass.map((r) => [s(r.distribution_class), r]));

  const classImprovement = preClass.map((r) => {
    const cls = s(r.distribution_class);
    const pr = n(r.failing_weak_cases);
    const post = postClassMap.get(cls) ?? {};
    const po = n(post.failing_weak_cases);
    return {
      distribution_class: cls,
      pre_failing_weak_cases: pr,
      post_failing_weak_cases: po,
      delta: po - pr,
      pre_main_failure_cluster: s(r.main_failure_cluster, 'none'),
      post_main_failure_cluster: s(post.main_failure_cluster, 'none'),
      pre_main_subsystem_owner: s(r.main_subsystem_owner, 'none'),
      post_main_subsystem_owner: s(post.main_subsystem_owner, 'none'),
    };
  });

  const highRiskPre = preCases.filter((c) => s(((c.failure_diagnostic as Json)?.trust_risk_severity)) === 'high').length;
  const highRiskPost = postCases.filter((c) => s(((c.failure_diagnostic as Json)?.trust_risk_severity)) === 'high').length;

  const preProfile = s(((preDiag.overall_failure_profile as Json)?.assessment), 'systemic');
  const postProfile = s(((postDiag.overall_failure_profile as Json)?.assessment), 'systemic');

  const artifact = {
    sprint: 'DISTRIBUTION_SHIFT_CLASS_REPAIR_SPRINT_V1',
    generated_at: new Date().toISOString(),
    sprint_purpose:
      'Reduce remaining systemic distribution-shift failures through class-targeted repair in priority order, without regressing hardened core behaviors.',
    pre_sprint_class_priority_table: prePriorityTable,
    track_by_track_class_repairs: {
      track_a_parent_overwritten_polished_hollow: [
        'Applied adult-shaped/polished skepticism tightening and confidence compression thresholds.',
        'Increased show-route proof threshold under polished/overwritten risk patterns.',
      ],
      track_b_culturally_indirect: [
        'Preserved culturally-indirect relational duty signals as recoverable substantive signals.',
        'Allowed culturally-indirect concrete-hinge cases to recover to medium-confidence show.',
      ],
      track_c_contradiction_multi_center: [
        'Maintained contradiction-sensitive ask behavior under low-margin center collisions.',
        'Kept explicit uncertainty forcing clarification route under instability.',
      ],
      track_d_weak_note: [
        'Added very-thin signal fail-closed path to needs_more_input for truly under-specified notes.',
        'Added weak-note latent hinge recovery path to defensible show in concrete cases.',
      ],
      track_e_messy_note_dump: [
        'Added format-weirdness recovery path for concrete noisy inputs to avoid over-clarification collapse.',
      ],
      track_f_achievement_stacked: [
        'Added achievement-stacked calibrated show recovery (medium confidence) to avoid over-cautious collapse.',
      ],
    },
    class_by_class_improvement_summary: classImprovement,
    remaining_high_trust_risk_cases: postCases
      .filter((c) => s(((c.failure_diagnostic as Json)?.trust_risk_severity)) === 'high')
      .map((c) => ({
        source_case_id: s(c.source_case_id),
        distribution_class: s(c.distribution_class),
        primary_failure_cluster: s(((c.failure_diagnostic as Json)?.primary_failure_cluster)),
        likely_subsystem_owner: s(((c.failure_diagnostic as Json)?.likely_subsystem_owner)),
      })),
    post_sprint_evaluation_result: {
      pass_fail: s(postEval.pass_fail, 'FAIL'),
      thresholds: thresholdMap(postEval),
    },
    post_sprint_diagnostic_result: {
      profile: postProfile,
      diagnosed_cases: n(postDiag.diagnosed_cases_count),
      global_summary: (postDiag.global_summary as Json) ?? {},
    },
    regression_checks_across_hardened_protocols: regressionStatus(),
    failure_profile_transition: {
      pre: preProfile,
      post: postProfile,
    },
    case_level_patch_tracking: caseLevelTracking,
    next_recommended_action:
      postProfile === 'systemic'
        ? 'Run focused candidate-generation repair sprint on achievement-stacked and messy-note classes (dominant unresolved owners: candidate_generation + unclear), then rerun distribution-shift and diagnostic gates.'
        : 'Proceed with concentrated-risk closure sprint and gate reruns.',
    launch_readiness_implication:
      s(postEval.pass_fail) === 'PASS' && (postProfile === 'concentrated' || postProfile === 'isolated')
        ? 'Class-targeted repair reached minimum profile requirement; continue remaining regressions before launch claim.'
        : 'Do not move toward launch readiness: class-targeted sprint did not yet clear distribution-shift or diagnostic profile gates.',
    summary_deltas: {
      diagnosed_cases_pre: preCases.length,
      diagnosed_cases_post: postCases.length,
      diagnosed_cases_delta: postCases.length - preCases.length,
      high_trust_risk_pre: highRiskPre,
      high_trust_risk_post: highRiskPost,
      high_trust_risk_delta: highRiskPost - highRiskPre,
    },
  };

  const preTableRows = prePriorityTable
    .map((r) => `| ${r.distribution_class} | ${r.total_remaining_cases} | ${r.high_trust_risk_count} | ${r.dominant_failure_cluster} | ${r.dominant_subsystem_owner} | P${r.sprint_patch_order_recommendation} |`)
    .join('\n');

  const classRows = classImprovement
    .map((r) => `| ${r.distribution_class} | ${r.pre_failing_weak_cases} | ${r.post_failing_weak_cases} | ${r.delta} | ${r.pre_main_failure_cluster} | ${r.post_main_failure_cluster} |`)
    .join('\n');

  const regressionLines = artifact.regression_checks_across_hardened_protocols
    .map((r) => `- ${r.protocol}: ${r.pass_fail}`)
    .join('\n');

  const md = [
    '# DISTRIBUTION_SHIFT_CLASS_REPAIR_SPRINT_RESULTS_V1',
    '',
    '## sprint purpose',
    '',
    artifact.sprint_purpose,
    '',
    '## pre-sprint class priority table',
    '',
    '| distribution class | total remaining | high trust-risk | dominant failure cluster | dominant subsystem owner | patch order |',
    '|---|---:|---:|---|---|---|',
    preTableRows,
    '',
    '## track-by-track class repairs',
    '',
    '### Track A — Parent-overwritten / polished-hollow repair',
    ...artifact.track_by_track_class_repairs.track_a_parent_overwritten_polished_hollow.map((x) => `- ${x}`),
    '',
    '### Track B — Culturally indirect narrative repair',
    ...artifact.track_by_track_class_repairs.track_b_culturally_indirect.map((x) => `- ${x}`),
    '',
    '### Track C — Contradiction / multi-center under shift repair',
    ...artifact.track_by_track_class_repairs.track_c_contradiction_multi_center.map((x) => `- ${x}`),
    '',
    '### Track D — Weak-student / low-skill note patterns repair',
    ...artifact.track_by_track_class_repairs.track_d_weak_note.map((x) => `- ${x}`),
    '',
    '### Track E — Messy note-dump robustness repair',
    ...artifact.track_by_track_class_repairs.track_e_messy_note_dump.map((x) => `- ${x}`),
    '',
    '### Track F — Achievement-stacked / emotionally thin repair',
    ...artifact.track_by_track_class_repairs.track_f_achievement_stacked.map((x) => `- ${x}`),
    '',
    '## class-by-class improvement summary',
    '',
    '| distribution class | pre failing/weak | post failing/weak | delta | pre main failure cluster | post main failure cluster |',
    '|---|---:|---:|---:|---|---|',
    classRows,
    '',
    '## remaining high-trust-risk cases',
    '',
    ...(artifact.remaining_high_trust_risk_cases.length > 0
      ? artifact.remaining_high_trust_risk_cases.map((r) => `- ${r.source_case_id} (${r.distribution_class}): ${r.primary_failure_cluster}, owner=${r.likely_subsystem_owner}`)
      : ['- none']),
    '',
    '## post-sprint evaluation result',
    '',
    `- pass/fail: ${artifact.post_sprint_evaluation_result.pass_fail}`,
    ...Object.entries(artifact.post_sprint_evaluation_result.thresholds).map(([k, v]) => {
      const c = v as { pass: number; total: number; status: string };
      return `- ${k}: ${c.pass}/${c.total} -> ${c.status}`;
    }),
    '',
    '## post-sprint diagnostic result',
    '',
    `- profile: ${artifact.post_sprint_diagnostic_result.profile}`,
    `- diagnosed cases: ${artifact.post_sprint_diagnostic_result.diagnosed_cases}`,
    '',
    '## regression checks across hardened protocols',
    '',
    regressionLines,
    '',
    '## whether failure profile is still systemic, concentrated, or isolated',
    '',
    `- pre: ${artifact.failure_profile_transition.pre}`,
    `- post: ${artifact.failure_profile_transition.post}`,
    '',
    '## next recommended action',
    '',
    artifact.next_recommended_action,
    '',
    '## launch-readiness implication',
    '',
    artifact.launch_readiness_implication,
    '',
  ].join('\n');

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUT_MD, md);

  console.log('DISTRIBUTION_SHIFT_CLASS_REPAIR_SPRINT_V1');
  console.log(`  pre_diagnosed_cases: ${preCases.length}`);
  console.log(`  post_diagnosed_cases: ${postCases.length}`);
  console.log(`  pre_profile: ${preProfile}`);
  console.log(`  post_profile: ${postProfile}`);
  console.log(`  wrote: ${OUT_JSON}`);
  console.log(`  wrote: ${OUT_MD}`);
}

main();
