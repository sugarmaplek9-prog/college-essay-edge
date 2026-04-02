#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type DistributionClass =
  | 'weak_student_low_skill'
  | 'parent_overwritten_adult_shaped'
  | 'over_polished_hollow'
  | 'contradictory_multi_center'
  | 'culturally_indirect_non_default'
  | 'achievement_stacked_emotionally_thin'
  | 'messy_real_style_note_dump';

type PrimaryFailureCluster =
  | 'high_confidence_misread'
  | 'polished_emptiness_overvaluation'
  | 'parent_overwrite_misread'
  | 'cultural_style_misread'
  | 'contradiction_overcommitment'
  | 'weak_note_under_recovery'
  | 'generic_fallback_under_shift'
  | 'line_fit_degradation_under_shift'
  | 'grounding_degradation_under_shift'
  | 'unclear_or_mixed';

type SecondaryFailureCluster = PrimaryFailureCluster | 'none';

type SubsystemOwner =
  | 'candidate_generation'
  | 'scorer'
  | 'routing_calibration'
  | 'direction_line_generation'
  | 'explanation_layer'
  | 'trust_calibration'
  | 'multi_subsystem'
  | 'unclear';

type TrustRiskSeverity = 'low' | 'medium' | 'high';

type StudentReaction =
  | 'feels_understood'
  | 'mixed'
  | 'feels_flattened'
  | 'feels_misread'
  | 'feels_overpraised_but_not_helped'
  | 'likely_to_disengage';

type SeverityProfile = 'isolated' | 'concentrated' | 'systemic';

type Packet = Record<string, unknown>;

const ROOT = process.cwd();
const INPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_evaluation_v1.json');
const INPUT_MD = path.join(ROOT, 'docs', 'engineering', 'DISTRIBUTION_SHIFT_EVALUATION_RESULTS_V1.md');
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'distribution_shift_failure_diagnostic_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'DISTRIBUTION_SHIFT_FAILURE_DIAGNOSTIC_RESULTS_V1.md');

const ALL_CLASSES: DistributionClass[] = [
  'weak_student_low_skill',
  'parent_overwritten_adult_shaped',
  'over_polished_hollow',
  'contradictory_multi_center',
  'culturally_indirect_non_default',
  'achievement_stacked_emotionally_thin',
  'messy_real_style_note_dump',
];

function readJson(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, unknown>;
}

function readText(filePath: string): string {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function asString(v: unknown, fallback = 'n/a'): string {
  return typeof v === 'string' ? v : fallback;
}

function asNumber(v: unknown, fallback = 0): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function countBy<T extends string>(items: T[]): Record<T, number> {
  const out = {} as Record<T, number>;
  for (const item of items) out[item] = (out[item] ?? 0) + 1;
  return out;
}

function modeFromMap(counts: Record<string, number>, fallback: string): string {
  const entries = Object.entries(counts);
  if (entries.length === 0) return fallback;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? fallback;
}

function isNotClearlyHealthy(packet: Packet): boolean {
  const e = (packet.evaluation ?? {}) as Record<string, unknown>;
  return (
    asString(e.action_correctness, 'incorrect') !== 'correct'
    || asString(e.output_trustworthiness, 'not_trustworthy') !== 'trustworthy'
    || asString(e.distribution_fit_robustness, 'weak') === 'weak'
    || asString(e.line_fit, 'misfit') === 'misfit'
    || asString(e.grounding_sufficiency, 'insufficient') === 'insufficient'
    || asString(e.student_reaction_prediction, 'feels_flattened_or_misread') === 'feels_flattened_or_misread'
    || asString(e.cultural_style_fit, 'n/a') === 'misread_due_to_style'
  );
}

function primaryCluster(packet: Packet): PrimaryFailureCluster {
  const runtime = (packet.runtime_result ?? {}) as Record<string, unknown>;
  const e = (packet.evaluation ?? {}) as Record<string, unknown>;
  const distributionClass = asString(packet.distribution_class) as DistributionClass;
  const mainFailureCluster = asString(packet.main_failure_cluster, '');
  const expected = asString(packet.expected_best_action, 'show_strongest_direction');

  const route = asString(runtime.route_decision, 'unknown');
  const confidence = asString(runtime.confidence_band, 'unknown');
  const actionCorrectness = asString(e.action_correctness, 'incorrect');

  if (route === 'show_strongest_direction' && confidence === 'high' && actionCorrectness === 'incorrect') return 'high_confidence_misread';
  if (asString(e.line_fit, 'partial_fit') === 'misfit') return 'line_fit_degradation_under_shift';
  if (asString(e.grounding_sufficiency, 'borderline') === 'insufficient') return 'grounding_degradation_under_shift';
  if (asString(e.cultural_style_fit, 'n/a') === 'misread_due_to_style') return 'cultural_style_misread';
  if (distributionClass === 'parent_overwritten_adult_shaped' && asString(e.output_trustworthiness, 'questionable') !== 'trustworthy') return 'parent_overwrite_misread';
  if (distributionClass === 'over_polished_hollow' && (mainFailureCluster.includes('polished') || asString(packet.main_trap, '').includes('polished'))) return 'polished_emptiness_overvaluation';
  if (distributionClass === 'contradictory_multi_center' && expected !== 'show_strongest_direction' && route === 'show_strongest_direction') return 'contradiction_overcommitment';
  if (distributionClass === 'weak_student_low_skill' && actionCorrectness !== 'correct') return 'weak_note_under_recovery';
  if (mainFailureCluster.includes('generic_fallback') || asString(packet.main_trap, '').includes('generic')) return 'generic_fallback_under_shift';
  if (mainFailureCluster.includes('polished')) return 'polished_emptiness_overvaluation';
  if (mainFailureCluster.includes('weak_note')) return 'weak_note_under_recovery';
  if (mainFailureCluster.includes('contradiction')) return 'contradiction_overcommitment';
  if (mainFailureCluster.includes('cultural')) return 'cultural_style_misread';

  return 'unclear_or_mixed';
}

function secondaryCluster(packet: Packet, primary: PrimaryFailureCluster): SecondaryFailureCluster {
  const e = (packet.evaluation ?? {}) as Record<string, unknown>;
  const runtime = (packet.runtime_result ?? {}) as Record<string, unknown>;
  const options: PrimaryFailureCluster[] = [];

  if (asString(e.line_fit, 'partial_fit') === 'misfit') options.push('line_fit_degradation_under_shift');
  if (asString(e.grounding_sufficiency, 'borderline') === 'insufficient') options.push('grounding_degradation_under_shift');
  if (asString(e.cultural_style_fit, 'n/a') === 'misread_due_to_style') options.push('cultural_style_misread');
  if (asString(runtime.route_decision, 'unknown') === 'show_strongest_direction' && asString(runtime.confidence_band, 'unknown') === 'high' && asString(e.action_correctness, 'incorrect') === 'incorrect') {
    options.push('high_confidence_misread');
  }
  if (asString(packet.main_trap, '').includes('generic') || asString(packet.main_failure_cluster, '').includes('generic')) options.push('generic_fallback_under_shift');

  const alt = options.find((x) => x !== primary);
  return alt ?? 'none';
}

function ownerFor(cluster: PrimaryFailureCluster, packet: Packet): SubsystemOwner {
  const e = (packet.evaluation ?? {}) as Record<string, unknown>;

  if (cluster === 'high_confidence_misread') return 'routing_calibration';
  if (cluster === 'polished_emptiness_overvaluation') return 'scorer';
  if (cluster === 'parent_overwrite_misread') return 'trust_calibration';
  if (cluster === 'cultural_style_misread') return 'scorer';
  if (cluster === 'contradiction_overcommitment') return 'routing_calibration';
  if (cluster === 'weak_note_under_recovery') return 'candidate_generation';
  if (cluster === 'generic_fallback_under_shift') return 'candidate_generation';
  if (cluster === 'line_fit_degradation_under_shift') return 'direction_line_generation';
  if (cluster === 'grounding_degradation_under_shift') return 'explanation_layer';

  const fails = [
    asString(e.action_correctness, 'correct') !== 'correct',
    asString(e.output_trustworthiness, 'trustworthy') !== 'trustworthy',
    asString(e.line_fit, 'strong_fit') === 'misfit',
    asString(e.grounding_sufficiency, 'sufficient') === 'insufficient',
  ].filter(Boolean).length;

  if (fails >= 3) return 'multi_subsystem';
  return 'unclear';
}

function trustRisk(packet: Packet, primary: PrimaryFailureCluster): TrustRiskSeverity {
  const runtime = (packet.runtime_result ?? {}) as Record<string, unknown>;
  const e = (packet.evaluation ?? {}) as Record<string, unknown>;

  const highConfidenceWrong = asString(runtime.route_decision) === 'show_strongest_direction'
    && asString(runtime.confidence_band) === 'high'
    && asString(e.action_correctness) === 'incorrect';

  if (
    highConfidenceWrong
    || asString(e.output_trustworthiness) === 'not_trustworthy'
    || asString(e.student_reaction_prediction) === 'feels_flattened_or_misread'
    || primary === 'parent_overwrite_misread'
    || primary === 'cultural_style_misread'
  ) return 'high';

  if (
    asString(e.action_correctness) !== 'correct'
    || asString(e.output_trustworthiness) !== 'trustworthy'
    || asString(e.distribution_fit_robustness) === 'weak'
  ) return 'medium';

  return 'low';
}

function studentReaction(packet: Packet, primary: PrimaryFailureCluster, risk: TrustRiskSeverity): StudentReaction {
  const runtime = (packet.runtime_result ?? {}) as Record<string, unknown>;
  const e = (packet.evaluation ?? {}) as Record<string, unknown>;
  const sourceReaction = asString(e.student_reaction_prediction, 'mixed');

  if (sourceReaction === 'feels_understood') return 'feels_understood';
  if (sourceReaction === 'mixed' && asString(runtime.route_decision) === 'show_strongest_direction' && asString(e.output_trustworthiness) === 'questionable') {
    return 'feels_overpraised_but_not_helped';
  }

  if (sourceReaction === 'feels_flattened_or_misread') {
    if (risk === 'high' && (primary === 'high_confidence_misread' || primary === 'parent_overwrite_misread')) return 'likely_to_disengage';
    if (primary === 'cultural_style_misread' || primary === 'line_fit_degradation_under_shift') return 'feels_misread';
    return 'feels_flattened';
  }

  return 'mixed';
}

function fixPriorityForCluster(cluster: PrimaryFailureCluster): number {
  if (cluster === 'high_confidence_misread') return 1;
  if (cluster === 'polished_emptiness_overvaluation' || cluster === 'parent_overwrite_misread') return 2;
  if (cluster === 'cultural_style_misread') return 3;
  if (cluster === 'contradiction_overcommitment') return 4;
  if (cluster === 'weak_note_under_recovery') return 5;
  if (cluster === 'generic_fallback_under_shift') return 6;
  return 6;
}

function classifyFailureProfile(
  diagnosed: Array<Record<string, unknown>>,
  classSummary: Array<Record<string, unknown>>,
): { profile: SeverityProfile; explanation: string } {
  const total = diagnosed.length;
  const classCounts = classSummary.map((x) => Number(x.failing_weak_cases ?? 0));
  const nonZero = classCounts.filter((x) => x > 0).length;
  const sorted = [...classCounts].sort((a, b) => b - a);
  const top2 = (sorted[0] ?? 0) + (sorted[1] ?? 0);
  const top2Ratio = total > 0 ? top2 / total : 0;

  if (total <= 6 && nonZero <= 2) {
    return {
      profile: 'isolated',
      explanation: 'Failures are rare and low-spread across classes, indicating isolated weaknesses rather than broad generalization collapse.',
    };
  }

  if (top2Ratio >= 0.65 || nonZero <= 3) {
    return {
      profile: 'concentrated',
      explanation: 'Failures are clustered in a small set of distribution classes, indicating focused hardening is needed in specific shift regimes.',
    };
  }

  return {
    profile: 'systemic',
    explanation: 'Failures are distributed across many classes, indicating broad generalization weakness rather than localized drift.',
  };
}

function buildMarkdown(args: {
  overallProfile: SeverityProfile;
  overallExplanation: string;
  classSummary: Array<Record<string, unknown>>;
  clusterCounts: Record<string, number>;
  ownerCounts: Record<string, number>;
  highRiskCases: Array<Record<string, unknown>>;
  top10: string[];
  patchSequence: string[];
  passFail: 'PASS' | 'FAIL';
  diagnosedCount: number;
  totalCount: number;
}): string {
  const classTable = args.classSummary
    .map((r) => `| ${String(r.distribution_class)} | ${String(r.severity)} | ${String(r.pass_fail_concentration)} | ${String(r.main_failure_cluster)} | ${String(r.main_subsystem_owner)} | P${String(r.fix_priority)} |`)
    .join('\n');

  const clusterLines = Object.entries(args.clusterCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- ${k}: ${v}`);

  const ownerLines = Object.entries(args.ownerCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `- ${k}: ${v}`);

  return [
    '# DISTRIBUTION_SHIFT_FAILURE_DIAGNOSTIC_RESULTS_V1',
    '',
    '## protocol purpose',
    '',
    'Convert failed distribution-shift evaluation output into a precise failure-attribution map with subsystem ownership and patch order.',
    '',
    '## overall failure profile',
    '',
    `- assessment: **${args.overallProfile}**`,
    `- explanation: ${args.overallExplanation}`,
    `- diagnosed cases: ${args.diagnosedCount}/${args.totalCount}`,
    '',
    '## class-by-class summary',
    '',
    '| distribution class | severity | pass/fail concentration | main failure cluster | likely subsystem owner | fix priority |',
    '|---|---|---|---|---|---|',
    classTable,
    '',
    '## failure clusters by count',
    '',
    ...(clusterLines.length > 0 ? clusterLines : ['- none']),
    '',
    '## subsystem ownership summary',
    '',
    ...(ownerLines.length > 0 ? ownerLines : ['- none']),
    '',
    '## high-trust-risk cases',
    '',
    ...(args.highRiskCases.length > 0
      ? args.highRiskCases.map((x) => `- ${String(x.source_case_id)} (${String(x.distribution_class)}): ${String(x.primary_failure_cluster)} -> ${String(x.likely_student_reaction)}`)
      : ['- none']),
    '',
    '## top 10 generalization trust breaks',
    '',
    ...args.top10.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## recommended patch sequence',
    '',
    ...args.patchSequence.map((x, i) => `${i + 1}. ${x}`),
    '',
    '## product readiness implications',
    '',
    args.passFail === 'PASS'
      ? 'Diagnostic indicates distribution-shift profile is manageable, but review high-risk queue before launch decisions.'
      : 'Do not move toward launch readiness. Concentrated or systemic trust-risk failures require patch sprint closure first.',
    '',
  ].join('\n');
}

function main(): void {
  const sourceJson = readJson(INPUT_JSON);
  const sourceMd = readText(INPUT_MD);

  const packets = asArray<Packet>(sourceJson.packets);
  if (packets.length !== 60) {
    throw new Error(`Expected 60 source cases, got ${packets.length}`);
  }

  const classCoverage = new Set(packets.map((p) => asString(p.distribution_class)));
  for (const cls of ALL_CLASSES) {
    if (!classCoverage.has(cls)) throw new Error(`Missing class in source artifact: ${cls}`);
  }

  const diagnosedSource = packets.filter(isNotClearlyHealthy);

  const casePackets = diagnosedSource.map((p, idx) => {
    const runtime = (p.runtime_result ?? {}) as Record<string, unknown>;
    const primary = primaryCluster(p);
    const secondary = secondaryCluster(p, primary);
    const owner = ownerFor(primary, p);
    const risk = trustRisk(p, primary);
    const reaction = studentReaction(p, primary, risk);

    return {
      case_id: `DSFD_${String(idx + 1).padStart(2, '0')}`,
      source_case_id: asString(p.case_id),
      distribution_class: asString(p.distribution_class),
      input_shape_summary: asString(p.input_shape_summary),
      main_trap: asString(p.main_trap),
      expected_best_action: asString(p.expected_best_action),
      runtime_result: {
        selected_candidate_id: asString(runtime.selected_candidate_id),
        selected_axis_family: asString(runtime.selected_axis_family),
        direction_line: asString(runtime.direction_line),
        confidence_band: asString(runtime.confidence_band),
        route_decision: asString(runtime.route_decision),
        top_score: asNumber(runtime.top_score),
        runner_up_score: asNumber(runtime.runner_up_score),
        score_margin: asNumber(runtime.score_margin),
      },
      candidates: asArray<Record<string, unknown>>(p.candidates).map((c) => ({
        candidate_id: asString(c.candidate_id),
        direction_line: asString(c.direction_line),
        total_score: asNumber(c.total_score),
        validator_flags: asArray<unknown>(c.validator_flags).map((x) => String(x)),
      })),
      output_context: {
        selected_explanation: asString(p.selected_explanation),
        selected_evidence: asArray<Record<string, unknown>>(p.selected_evidence).map((e) => ({ quote: asString(e.quote), note: asString(e.note) })),
        clarification_question: p.clarification_question ?? null,
        blocked_message: p.blocked_message ?? null,
      },
      failure_diagnostic: {
        primary_failure_cluster: primary,
        secondary_failure_cluster: secondary,
        likely_subsystem_owner: owner,
        trust_risk_severity: risk,
        likely_student_reaction: reaction,
        reviewer_notes: `Expected action=${asString(p.expected_best_action)}; observed route=${asString(runtime.route_decision)}; trust label=${asString(((p.evaluation ?? {}) as Record<string, unknown>).output_trustworthiness)}.`,
      },
    };
  });

  const clusterCounts = countBy(casePackets.map((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) as PrimaryFailureCluster));
  const ownerCounts = countBy(casePackets.map((c) => asString(((c.failure_diagnostic as Record<string, unknown>).likely_subsystem_owner)) as SubsystemOwner));
  const highRiskCases = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).trust_risk_severity)) === 'high');

  const classSummary = ALL_CLASSES.map((cls) => {
    const all = packets.filter((p) => asString(p.distribution_class) === cls);
    const weak = casePackets.filter((p) => asString(p.distribution_class) === cls);

    const actionCorrect = all.filter((p) => asString(((p.evaluation ?? {}) as Record<string, unknown>).action_correctness) === 'correct').length;
    const trustworthy = all.filter((p) => asString(((p.evaluation ?? {}) as Record<string, unknown>).output_trustworthiness) === 'trustworthy').length;

    const weakPrimary = weak.map((w) => asString(((w.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)));
    const weakOwner = weak.map((w) => asString(((w.failure_diagnostic as Record<string, unknown>).likely_subsystem_owner)));
    const weakRisk = weak.map((w) => asString(((w.failure_diagnostic as Record<string, unknown>).trust_risk_severity)));

    const riskSummary = `high:${weakRisk.filter((x) => x === 'high').length}, medium:${weakRisk.filter((x) => x === 'medium').length}, low:${weakRisk.filter((x) => x === 'low').length}`;

    const concentration = weak.length === 0 ? 'healthy' : weak.length >= Math.ceil(all.length * 0.5) ? 'concentrated' : 'scattered';
    const severity = weak.length === 0 ? 'isolated' : weak.length >= Math.ceil(all.length * 0.6) ? 'systemic' : weak.length >= 2 ? 'concentrated' : 'isolated';

    const mainCluster = modeFromMap(countBy(weakPrimary), 'none');
    const mainOwner = modeFromMap(countBy(weakOwner), 'none');
    const fixPriority = fixPriorityForCluster((mainCluster as PrimaryFailureCluster) || 'unclear_or_mixed');

    return {
      distribution_class: cls,
      total_cases: all.length,
      failing_weak_cases: weak.length,
      action_correctness_pass_rate: `${((actionCorrect / Math.max(1, all.length)) * 100).toFixed(1)}%`,
      trustworthiness_pass_rate: `${((trustworthy / Math.max(1, all.length)) * 100).toFixed(1)}%`,
      main_failure_cluster: mainCluster,
      main_subsystem_owner: mainOwner,
      trust_risk_summary: riskSummary,
      recommended_fix_priority: fixPriority,
      severity,
      pass_fail_concentration: concentration,
      fix_priority: fixPriority,
    };
  });

  const overall = classifyFailureProfile(casePackets, classSummary as Array<Record<string, unknown>>);

  const highConfidenceMisreadCount = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'high_confidence_misread').length;
  const culturalStyleMisreadCount = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'cultural_style_misread').length;
  const parentOverwriteMisreadCount = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'parent_overwrite_misread').length;
  const polishedOvervaluationCount = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'polished_emptiness_overvaluation').length;
  const contradictionOvercommitCount = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'contradiction_overcommitment').length;
  const weakNoteUnderRecoveryCount = casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'weak_note_under_recovery').length;

  const top10 = [...casePackets]
    .sort((a, b) => {
      const ra = asString(((a.failure_diagnostic as Record<string, unknown>).trust_risk_severity));
      const rb = asString(((b.failure_diagnostic as Record<string, unknown>).trust_risk_severity));
      const pa = ra === 'high' ? 2 : ra === 'medium' ? 1 : 0;
      const pb = rb === 'high' ? 2 : rb === 'medium' ? 1 : 0;
      return pb - pa;
    })
    .slice(0, 10)
    .map((c) => `${asString(c.source_case_id)} (${asString(c.distribution_class)}): ${asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster))} -> ${asString(((c.failure_diagnostic as Record<string, unknown>).likely_student_reaction))}`);
  while (top10.length < 10) top10.push(`coverage_fill_${top10.length + 1}: no additional diagnosed trust break`);

  const patchSequence = [
    'Priority 1: high-confidence misreads.',
    'Priority 2: polished-emptiness and parent-overwrite overvaluation.',
    'Priority 3: cultural-style misreads.',
    'Priority 4: contradiction overcommitment under shift.',
    'Priority 5: weak-note under-recovery.',
    'Priority 6: generic fallback drift under shifted inputs.',
  ];

  const humanReviewCases = casePackets.filter((c) => {
    const fd = (c.failure_diagnostic ?? {}) as Record<string, unknown>;
    const primary = asString(fd.primary_failure_cluster);
    const reaction = asString(fd.likely_student_reaction);
    return (
      asString(fd.trust_risk_severity) === 'high'
      || primary === 'high_confidence_misread'
      || primary === 'parent_overwrite_misread'
      || primary === 'cultural_style_misread'
      || reaction === 'feels_misread'
      || reaction === 'likely_to_disengage'
    );
  }).map((c) => {
    const fd = (c.failure_diagnostic ?? {}) as Record<string, unknown>;
    const primary = asString(fd.primary_failure_cluster);
    return {
      source_case_id: asString(c.source_case_id),
      what_system_got_wrong: `Primary failure cluster: ${primary}.`,
      what_user_would_likely_feel: asString(fd.likely_student_reaction),
      correct_action_should_have_been: asString(c.expected_best_action),
      fix_domain:
        primary === 'high_confidence_misread' || primary === 'contradiction_overcommitment'
          ? 'calibration'
          : primary === 'line_fit_degradation_under_shift' || primary === 'grounding_degradation_under_shift'
            ? 'copy'
            : primary === 'weak_note_under_recovery' || primary === 'generic_fallback_under_shift'
              ? 'engine'
              : 'flow',
    };
  });

  const sourcePassFail: 'PASS' | 'FAIL' = String((sourceJson.pass_fail ?? 'FAIL')) === 'PASS' ? 'PASS' : 'FAIL';

  const artifact = {
    protocol: 'DISTRIBUTION_SHIFT_FAILURE_DIAGNOSTIC_V1',
    generated_at: new Date().toISOString(),
    diagnostic_inputs: {
      source_json: INPUT_JSON,
      source_markdown: INPUT_MD,
      source_pass_fail: sourcePassFail,
      source_markdown_summary_line: sourceMd.split('\n').find((x) => x.includes('**FAIL**') || x.includes('**PASS**')) ?? 'n/a',
    },
    total_cases: packets.length,
    diagnosed_cases_count: casePackets.length,
    diagnosed_case_packets: casePackets,
    class_by_class_summary: classSummary,
    global_summary: {
      total_failed_weak_cases: casePackets.length,
      failure_count_by_cluster: clusterCounts,
      failure_count_by_subsystem_owner: ownerCounts,
      high_trust_risk_cases_count: highRiskCases.length,
      high_confidence_misread_count: highConfidenceMisreadCount,
      cultural_style_misread_count: culturalStyleMisreadCount,
      parent_overwrite_misread_count: parentOverwriteMisreadCount,
      polished_emptiness_overvaluation_count: polishedOvervaluationCount,
      contradiction_overcommitment_count: contradictionOvercommitCount,
      weak_note_under_recovery_count: weakNoteUnderRecoveryCount,
    },
    overall_failure_profile: {
      assessment: overall.profile,
      explanation: overall.explanation,
    },
    class_by_class_severity_table: classSummary.map((r) => ({
      distribution_class: r.distribution_class,
      severity: r.severity,
      pass_fail_concentration: r.pass_fail_concentration,
      main_failure_cluster: r.main_failure_cluster,
      likely_subsystem_owner: r.main_subsystem_owner,
      fix_priority: r.fix_priority,
    })),
    top_10_generalization_failures: top10,
    patch_sequence: patchSequence,
    human_review_required: {
      high_trust_risk_cases: highRiskCases.map((x) => asString(x.source_case_id)),
      high_confidence_misread_cases: casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'high_confidence_misread').map((c) => asString(c.source_case_id)),
      parent_overwrite_misread_cases: casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'parent_overwrite_misread').map((c) => asString(c.source_case_id)),
      cultural_style_misread_cases: casePackets.filter((c) => asString(((c.failure_diagnostic as Record<string, unknown>).primary_failure_cluster)) === 'cultural_style_misread').map((c) => asString(c.source_case_id)),
      feels_misread_or_disengage_cases: casePackets.filter((c) => {
        const r = asString(((c.failure_diagnostic as Record<string, unknown>).likely_student_reaction));
        return r === 'feels_misread' || r === 'likely_to_disengage';
      }).map((c) => asString(c.source_case_id)),
      review_packets: humanReviewCases,
    },
    pass_fail: sourcePassFail,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown({
    overallProfile: overall.profile,
    overallExplanation: overall.explanation,
    classSummary: classSummary as Array<Record<string, unknown>>,
    clusterCounts,
    ownerCounts,
    highRiskCases: highRiskCases as Array<Record<string, unknown>>,
    top10,
    patchSequence,
    passFail: artifact.pass_fail,
    diagnosedCount: casePackets.length,
    totalCount: packets.length,
  }));

  console.log('DISTRIBUTION_SHIFT_FAILURE_DIAGNOSTIC_V1');
  console.log(`  source_pass_fail: ${sourcePassFail}`);
  console.log(`  diagnosed_cases: ${casePackets.length}/${packets.length}`);
  console.log(`  overall_failure_profile: ${overall.profile}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main();
