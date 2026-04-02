#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type Json = Record<string, unknown>;

type BehavioralPattern =
  | 'false_premium_confidence'
  | 'indirect_hinge_underread'
  | 'low_explicit_reflection_penalty'
  | 'respectable_but_flat_winner'
  | 'weak_note_latent_signal_miss'
  | 'contradiction_shallow_competition'
  | 'clarification_too_late'
  | 'careful_but_unhelpful_output'
  | 'line_fit_emotional_miss'
  | 'grounded_but_wrong_center'
  | 'benchmark_mismatch_or_borderline'
  | 'unclear_or_multi_pattern';

type SubsystemOwner =
  | 'candidate_generation'
  | 'scorer'
  | 'routing_calibration'
  | 'direction_line_generation'
  | 'explanation_layer'
  | 'trust_calibration'
  | 'benchmark_or_labeling'
  | 'multi_subsystem'
  | 'unclear';

type TrustRisk = 'low' | 'medium' | 'high';

type StudentReaction =
  | 'feels_understood'
  | 'mixed'
  | 'feels_flattened'
  | 'feels_misread'
  | 'feels_overpraised_but_not_helped'
  | 'likely_to_disengage';

type NextFixType =
  | 'scorer_patch'
  | 'routing_patch'
  | 'line_generation_patch'
  | 'explanation_patch'
  | 'trust_calibration_patch'
  | 'benchmark_review'
  | 'multi_layer_patch';

type ResidualPacket = {
  case_id: string;
  source_case_id: string;
  distribution_class: string;
  input_shape_summary: string;
  main_trap: string;
  runtime_result: {
    selected_candidate_id: string;
    selected_axis_family: string;
    direction_line: string;
    confidence_band: string;
    route_decision: string;
    top_score: number;
    runner_up_score: number;
    score_margin: number;
  };
  output_context: {
    selected_explanation: string;
    selected_evidence: unknown[];
    clarification_question: string | null;
    blocked_message: string | null;
  };
  residual_pattern_diagnostic: {
    primary_behavioral_pattern: BehavioralPattern;
    secondary_behavioral_pattern: BehavioralPattern | 'none';
    likely_subsystem_owner: SubsystemOwner;
    trust_risk_severity: TrustRisk;
    likely_student_reaction: StudentReaction;
    best_next_fix_type: NextFixType;
    reviewer_notes: string;
  };
};

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'evaluation_outputs');
const DOCS_DIR = path.join(ROOT, 'docs', 'engineering');

const REQUIRED_INPUTS = {
  eval_json: path.join(OUT_DIR, 'distribution_shift_evaluation_v1.json'),
  eval_md: path.join(DOCS_DIR, 'DISTRIBUTION_SHIFT_EVALUATION_RESULTS_V1.md'),
  fail_diag_json: path.join(OUT_DIR, 'distribution_shift_failure_diagnostic_v1.json'),
  fail_diag_md: path.join(DOCS_DIR, 'DISTRIBUTION_SHIFT_FAILURE_DIAGNOSTIC_RESULTS_V1.md'),
  hardening_json: path.join(OUT_DIR, 'distribution_shift_hardening_sprint_v1.json'),
  hardening_md: path.join(DOCS_DIR, 'DISTRIBUTION_SHIFT_HARDENING_SPRINT_RESULTS_V1.md'),
  class_repair_json: path.join(OUT_DIR, 'distribution_shift_class_repair_sprint_v1.json'),
  class_repair_md: path.join(DOCS_DIR, 'DISTRIBUTION_SHIFT_CLASS_REPAIR_SPRINT_RESULTS_V1.md'),
};

const OUTPUT_JSON = path.join(OUT_DIR, 'distribution_shift_pattern_diagnostic_v1.json');
const OUTPUT_MD = path.join(DOCS_DIR, 'DISTRIBUTION_SHIFT_PATTERN_DIAGNOSTIC_RESULTS_V1.md');

function readJson(filePath: string): Json {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Json;
}

function ensureRequiredInputs(): void {
  for (const p of Object.values(REQUIRED_INPUTS)) {
    if (!fs.existsSync(p)) throw new Error(`Missing required protocol input: ${p}`);
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

function lc(v: unknown): string {
  return s(v, '').toLowerCase();
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((x) => text.includes(x));
}

function countBy(items: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) out[i] = (out[i] ?? 0) + 1;
  return out;
}

function topKeys(map: Record<string, number>, topN = 3): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([k]) => k);
}

function mode(map: Record<string, number>, d = 'unclear'): string {
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? d;
}

function trustRank(v: TrustRisk): number {
  if (v === 'high') return 3;
  if (v === 'medium') return 2;
  return 1;
}

function calcPriority(count: number, high: number): string {
  if (high >= 3 || count >= 8) return 'P1';
  if (high >= 1 || count >= 4) return 'P2';
  return 'P3';
}

function toStudentReaction(evalReaction: string, trust: TrustRisk, routeDecision: string, confidenceBand: string): StudentReaction {
  if (evalReaction === 'feels_understood') return 'feels_understood';
  if (evalReaction === 'mixed') return 'mixed';
  if (evalReaction === 'likely_to_disengage') return 'likely_to_disengage';
  if (evalReaction === 'feels_flattened_or_misread') {
    if ((confidenceBand === 'high' || confidenceBand === 'medium') && routeDecision === 'show_strongest_direction') {
      return 'feels_overpraised_but_not_helped';
    }
    return 'feels_flattened';
  }
  if (trust === 'high') return 'feels_misread';
  return 'mixed';
}

function mapOwner(rawOwner: string): SubsystemOwner {
  const owner = rawOwner as SubsystemOwner;
  const allowed: SubsystemOwner[] = [
    'candidate_generation',
    'scorer',
    'routing_calibration',
    'direction_line_generation',
    'explanation_layer',
    'trust_calibration',
    'benchmark_or_labeling',
    'multi_subsystem',
    'unclear',
  ];
  return allowed.includes(owner) ? owner : 'unclear';
}

function mapPatternAndOwner(args: {
  distributionClass: string;
  mainTrap: string;
  inputShape: string;
  selectedExplanation: string;
  directionLine: string;
  confidenceBand: string;
  routeDecision: string;
  expectedBestAction: string;
  evalAction: string;
  evalTrust: string;
  evalLineFit: string;
  evalGrounding: string;
  evalReaction: string;
  evalCulturalFit: string;
  existingCluster: string;
  existingOwner: string;
  scoreMargin: number;
}): {
  primary: BehavioralPattern;
  secondary: BehavioralPattern | 'none';
  owner: SubsystemOwner;
  fixType: NextFixType;
} {
  const text = [
    lc(args.mainTrap),
    lc(args.inputShape),
    lc(args.selectedExplanation),
    lc(args.directionLine),
    lc(args.existingCluster),
  ].join(' | ');

  const routeIsOverconfident =
    args.routeDecision === 'show_strongest_direction' &&
    (args.confidenceBand === 'high' || args.confidenceBand === 'medium') &&
    (args.evalTrust !== 'trustworthy' || args.evalReaction === 'feels_flattened_or_misread');

  const benchmarkMismatch =
    args.evalAction === 'correct' &&
    args.evalTrust !== 'not_trustworthy' &&
    args.evalLineFit !== 'misfit' &&
    args.evalGrounding !== 'insufficient' &&
    (args.evalReaction === 'mixed' || args.evalReaction === 'feels_understood');

  let primary: BehavioralPattern = 'unclear_or_multi_pattern';
  let secondary: BehavioralPattern | 'none' = 'none';

  if (benchmarkMismatch) {
    primary = 'benchmark_mismatch_or_borderline';
  } else if (
    args.distributionClass === 'contradictory_multi_center' ||
    hasAny(text, ['contradiction', 'multi-center'])
  ) {
    primary = 'contradiction_shallow_competition';
  } else if (
    args.evalCulturalFit === 'misread_due_to_style' ||
    args.distributionClass === 'culturally_indirect_non_default' ||
    hasAny(text, ['indirect', 'understated', 'duty', 'listening'])
  ) {
    primary = 'indirect_hinge_underread';
  } else if (hasAny(text, ['weak note', 'weak scene', 'vague growth']) || args.existingCluster === 'weak_note_under_recovery') {
    primary = 'weak_note_latent_signal_miss';
  } else if (
    hasAny(text, ['cannot pinpoint', 'not strong writer', 'hesitant']) ||
    args.existingCluster === 'generic_fallback_under_shift'
  ) {
    primary = 'low_explicit_reflection_penalty';
  } else if (args.evalLineFit === 'misfit') {
    primary = 'line_fit_emotional_miss';
  } else if (routeIsOverconfident || hasAny(text, ['false confidence', 'high_confidence_misread', 'polished'])) {
    primary = 'false_premium_confidence';
  } else if (
    args.evalGrounding === 'sufficient' &&
    (args.evalTrust === 'not_trustworthy' || args.evalAction === 'incorrect') &&
    args.evalLineFit !== 'strong_fit'
  ) {
    primary = 'grounded_but_wrong_center';
  } else if (
    args.routeDecision === 'ask_question_before_showing' &&
    (args.evalTrust !== 'trustworthy' || args.evalReaction === 'feels_flattened_or_misread')
  ) {
    primary = 'careful_but_unhelpful_output';
  } else if (
    (args.expectedBestAction === 'ask_question_before_showing' || args.expectedBestAction === 'blocked_or_needs_more_input') &&
    args.routeDecision === 'show_strongest_direction'
  ) {
    primary = 'clarification_too_late';
  } else if (args.evalReaction === 'feels_flattened_or_misread') {
    primary = 'respectable_but_flat_winner';
  }

  if (
    primary !== 'clarification_too_late' &&
    (args.expectedBestAction === 'ask_question_before_showing' || args.expectedBestAction === 'blocked_or_needs_more_input') &&
    args.routeDecision === 'show_strongest_direction'
  ) {
    secondary = 'clarification_too_late';
  } else if (
    primary !== 'line_fit_emotional_miss' &&
    args.evalReaction === 'feels_flattened_or_misread' &&
    args.evalLineFit !== 'strong_fit'
  ) {
    secondary = 'line_fit_emotional_miss';
  } else if (
    primary !== 'respectable_but_flat_winner' &&
    args.evalReaction === 'feels_flattened_or_misread' &&
    args.scoreMargin < 0.1
  ) {
    secondary = 'respectable_but_flat_winner';
  }

  const ownerFromPattern: Partial<Record<BehavioralPattern, SubsystemOwner>> = {
    false_premium_confidence: 'trust_calibration',
    indirect_hinge_underread: 'candidate_generation',
    low_explicit_reflection_penalty: 'scorer',
    respectable_but_flat_winner: 'scorer',
    weak_note_latent_signal_miss: 'candidate_generation',
    contradiction_shallow_competition: 'routing_calibration',
    clarification_too_late: 'routing_calibration',
    careful_but_unhelpful_output: 'explanation_layer',
    line_fit_emotional_miss: 'direction_line_generation',
    grounded_but_wrong_center: 'multi_subsystem',
    benchmark_mismatch_or_borderline: 'benchmark_or_labeling',
    unclear_or_multi_pattern: 'unclear',
  };

  const fixTypeByPattern: Record<BehavioralPattern, NextFixType> = {
    false_premium_confidence: 'trust_calibration_patch',
    indirect_hinge_underread: 'multi_layer_patch',
    low_explicit_reflection_penalty: 'scorer_patch',
    respectable_but_flat_winner: 'scorer_patch',
    weak_note_latent_signal_miss: 'multi_layer_patch',
    contradiction_shallow_competition: 'routing_patch',
    clarification_too_late: 'routing_patch',
    careful_but_unhelpful_output: 'explanation_patch',
    line_fit_emotional_miss: 'line_generation_patch',
    grounded_but_wrong_center: 'multi_layer_patch',
    benchmark_mismatch_or_borderline: 'benchmark_review',
    unclear_or_multi_pattern: 'multi_layer_patch',
  };

  const mappedExistingOwner = mapOwner(args.existingOwner);
  let owner: SubsystemOwner = ownerFromPattern[primary] ?? 'unclear';

  if (owner === 'unclear' && mappedExistingOwner !== 'unclear') owner = mappedExistingOwner;
  if (primary === 'benchmark_mismatch_or_borderline') owner = 'benchmark_or_labeling';

  return {
    primary,
    secondary,
    owner,
    fixType: fixTypeByPattern[primary],
  };
}

function classifyResidualProfile(patternCounts: Record<string, number>, total: number): 'diffuse' | 'pattern_concentrated' | 'systemically_unclear' {
  const sorted = Object.values(patternCounts).sort((a, b) => b - a);
  const top1 = sorted[0] ?? 0;
  const top3 = (sorted[0] ?? 0) + (sorted[1] ?? 0) + (sorted[2] ?? 0);

  if (total === 0) return 'diffuse';

  if (top3 / total >= 0.65 && top1 / total >= 0.2) return 'pattern_concentrated';
  if (top1 / total <= 0.18 && Object.keys(patternCounts).length >= 7) return 'diffuse';
  return 'systemically_unclear';
}

function main(): void {
  ensureRequiredInputs();

  const evalJson = readJson(REQUIRED_INPUTS.eval_json);
  const failDiagJson = readJson(REQUIRED_INPUTS.fail_diag_json);
  const classRepairJson = readJson(REQUIRED_INPUTS.class_repair_json);

  const evalPackets = arr<Json>(evalJson.packets);
  const evalByCase = new Map(evalPackets.map((p) => [s(p.case_id), p]));

  const diagnosedCases = arr<Json>(failDiagJson.diagnosed_case_packets);
  const classRepairDiagnosed = n((classRepairJson.post_sprint_diagnostic_result as Json)?.diagnosed_cases, diagnosedCases.length);

  const residualUniverse = diagnosedCases
    .map((d) => {
      const sourceCaseId = s(d.source_case_id);
      const ev = evalByCase.get(sourceCaseId) ?? {};
      const evaluation = (ev.evaluation as Json) ?? {};

      const include =
        s(evaluation.action_correctness) !== 'correct' ||
        s(evaluation.output_trustworthiness) !== 'trustworthy' ||
        s(evaluation.distribution_fit_robustness) === 'weak' ||
        s(evaluation.line_fit) === 'misfit' ||
        s(evaluation.grounding_sufficiency) === 'insufficient' ||
        s(evaluation.student_reaction_prediction) === 'feels_flattened_or_misread' ||
        s(evaluation.cultural_style_fit) === 'misread_due_to_style';

      return {
        diagnosed: d,
        evalPacket: ev,
        evaluation,
        include,
      };
    })
    .filter((x) => x.include);

  const packets: ResidualPacket[] = residualUniverse.map((item, idx) => {
    const d = item.diagnosed;
    const ev = item.evalPacket;
    const evaluation = item.evaluation;

    const runtime = ((d.runtime_result as Json) ?? (ev.runtime_result as Json) ?? {}) as Json;
    const outputCtx = ((d.output_context as Json) ?? {}) as Json;
    const existingFd = (d.failure_diagnostic as Json) ?? {};

    const confidenceBand = s(runtime.confidence_band, 'low');
    const routeDecision = s(runtime.route_decision, 'ask_question_before_showing');
    const evalTrust = s(evaluation.output_trustworthiness, 'questionable');

    const trust: TrustRisk = (() => {
      const t = s(existingFd.trust_risk_severity, 'medium');
      if (t === 'high' || t === 'medium' || t === 'low') return t;
      return 'medium';
    })();

    const mapped = mapPatternAndOwner({
      distributionClass: s(d.distribution_class, s(ev.distribution_class)),
      mainTrap: s(d.main_trap, s(ev.main_trap)),
      inputShape: s(d.input_shape_summary, s(ev.input_shape_summary)),
      selectedExplanation: s(outputCtx.selected_explanation, s(ev.selected_explanation, '')),
      directionLine: s(runtime.direction_line),
      confidenceBand,
      routeDecision,
      expectedBestAction: s(d.expected_best_action, s(ev.expected_best_action)),
      evalAction: s(evaluation.action_correctness),
      evalTrust,
      evalLineFit: s(evaluation.line_fit),
      evalGrounding: s(evaluation.grounding_sufficiency),
      evalReaction: s(evaluation.student_reaction_prediction),
      evalCulturalFit: s(evaluation.cultural_style_fit),
      existingCluster: s(existingFd.primary_failure_cluster),
      existingOwner: s(existingFd.likely_subsystem_owner),
      scoreMargin: n(runtime.score_margin),
    });

    const reaction = toStudentReaction(
      s(evaluation.student_reaction_prediction),
      trust,
      routeDecision,
      confidenceBand,
    );

    const sourceCaseId = s(d.source_case_id, s(ev.case_id));
    const packet: ResidualPacket = {
      case_id: `DSPD_${String(idx + 1).padStart(2, '0')}`,
      source_case_id: sourceCaseId,
      distribution_class: s(d.distribution_class, s(ev.distribution_class)),
      input_shape_summary: s(d.input_shape_summary, s(ev.input_shape_summary)),
      main_trap: s(d.main_trap, s(ev.main_trap)),
      runtime_result: {
        selected_candidate_id: s(runtime.selected_candidate_id),
        selected_axis_family: s(runtime.selected_axis_family),
        direction_line: s(runtime.direction_line),
        confidence_band: confidenceBand,
        route_decision: routeDecision,
        top_score: n(runtime.top_score),
        runner_up_score: n(runtime.runner_up_score),
        score_margin: n(runtime.score_margin),
      },
      output_context: {
        selected_explanation: s(outputCtx.selected_explanation, s(ev.selected_explanation, '')),
        selected_evidence: arr(outputCtx.selected_evidence ?? ev.selected_evidence),
        clarification_question: outputCtx.clarification_question == null ? null : s(outputCtx.clarification_question),
        blocked_message: outputCtx.blocked_message == null ? null : s(outputCtx.blocked_message),
      },
      residual_pattern_diagnostic: {
        primary_behavioral_pattern: mapped.primary,
        secondary_behavioral_pattern: mapped.secondary,
        likely_subsystem_owner: mapped.owner,
        trust_risk_severity: trust,
        likely_student_reaction: reaction,
        best_next_fix_type: mapped.fixType,
        reviewer_notes: [
          `Expected action: ${s(d.expected_best_action, s(ev.expected_best_action))}; observed route: ${routeDecision}.`,
          `Primary pattern mapped from residual cues and prior failure cluster (${s(existingFd.primary_failure_cluster, 'none')}).`,
        ].join(' '),
      },
    };

    return packet;
  });

  const patternCounts = countBy(packets.map((p) => p.residual_pattern_diagnostic.primary_behavioral_pattern));
  const subsystemCounts = countBy(packets.map((p) => p.residual_pattern_diagnostic.likely_subsystem_owner));
  const classCounts = countBy(packets.map((p) => p.distribution_class));

  const patternTable = Object.entries(patternCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([pattern, count]) => {
      const rows = packets.filter((p) => p.residual_pattern_diagnostic.primary_behavioral_pattern === pattern);
      const high = rows.filter((p) => p.residual_pattern_diagnostic.trust_risk_severity === 'high').length;
      const owner = mode(countBy(rows.map((r) => r.residual_pattern_diagnostic.likely_subsystem_owner)), 'unclear');
      const classes = topKeys(countBy(rows.map((r) => r.distribution_class)), 3);
      return {
        behavioral_pattern: pattern,
        total_count: count,
        high_trust_risk_count: high,
        trust_risk_concentration: `${high}/${count}`,
        dominant_subsystem_owner: owner,
        dominant_distribution_classes: classes,
        recommended_fix_priority: calcPriority(count, high),
      };
    });

  const subsystemTable = Object.entries(subsystemCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([owner, count]) => {
      const rows = packets.filter((p) => p.residual_pattern_diagnostic.likely_subsystem_owner === owner);
      const high = rows.filter((p) => p.residual_pattern_diagnostic.trust_risk_severity === 'high').length;
      return {
        subsystem_owner: owner,
        owned_residual_count: count,
        high_trust_risk_count: high,
        top_behavioral_patterns: topKeys(countBy(rows.map((r) => r.residual_pattern_diagnostic.primary_behavioral_pattern)), 3),
      };
    });

  const classPatternTable = Object.entries(classCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([distributionClass, totalCount]) => {
      const rows = packets.filter((p) => p.distribution_class === distributionClass);
      return {
        distribution_class: distributionClass,
        total_residual_cases: totalCount,
        dominant_behavioral_patterns: topKeys(countBy(rows.map((r) => r.residual_pattern_diagnostic.primary_behavioral_pattern)), 3),
      };
    });

  const residualProfile = classifyResidualProfile(patternCounts, packets.length);

  const highTrustRiskResiduals = packets.filter((p) => p.residual_pattern_diagnostic.trust_risk_severity === 'high');

  const top10TrustBreaks = [...packets]
    .sort((a, b) => {
      const trustDelta = trustRank(b.residual_pattern_diagnostic.trust_risk_severity) - trustRank(a.residual_pattern_diagnostic.trust_risk_severity);
      if (trustDelta !== 0) return trustDelta;
      return b.runtime_result.score_margin - a.runtime_result.score_margin;
    })
    .slice(0, 10)
    .map((p) => ({
      source_case_id: p.source_case_id,
      distribution_class: p.distribution_class,
      primary_behavioral_pattern: p.residual_pattern_diagnostic.primary_behavioral_pattern,
      trust_risk_severity: p.residual_pattern_diagnostic.trust_risk_severity,
      likely_student_reaction: p.residual_pattern_diagnostic.likely_student_reaction,
      likely_subsystem_owner: p.residual_pattern_diagnostic.likely_subsystem_owner,
    }));

  const benchmarkMismatchCandidates = packets
    .filter((p) => p.residual_pattern_diagnostic.primary_behavioral_pattern === 'benchmark_mismatch_or_borderline')
    .map((p) => ({
      source_case_id: p.source_case_id,
      distribution_class: p.distribution_class,
      rationale: 'Residual behavior appears borderline/acceptable under product judgment despite rule-labeled weakness.',
    }));

  const humanReviewCases = packets
    .filter((p) => {
      const diag = p.residual_pattern_diagnostic;
      return (
        diag.trust_risk_severity === 'high' ||
        diag.primary_behavioral_pattern === 'false_premium_confidence' ||
        diag.primary_behavioral_pattern === 'indirect_hinge_underread' ||
        diag.primary_behavioral_pattern === 'line_fit_emotional_miss' ||
        diag.likely_student_reaction === 'likely_to_disengage' ||
        diag.primary_behavioral_pattern === 'benchmark_mismatch_or_borderline'
      );
    })
    .map((p) => {
      const borderline = p.residual_pattern_diagnostic.primary_behavioral_pattern === 'benchmark_mismatch_or_borderline';
      const nextRepair = p.residual_pattern_diagnostic.best_next_fix_type;
      return {
        source_case_id: p.source_case_id,
        primary_behavioral_pattern: p.residual_pattern_diagnostic.primary_behavioral_pattern,
        likely_student_reaction: p.residual_pattern_diagnostic.likely_student_reaction,
        failure_real_or_borderline: borderline ? 'borderline' : 'real_failure',
        evaluator_strictness_view: borderline ? 'possibly_too_strict' : 'reasonable',
        correct_next_repair: nextRepair,
      };
    });

  const top3Patterns = patternTable.slice(0, 3).map((x) => x.behavioral_pattern);
  const highRiskOwner = mode(countBy(highTrustRiskResiduals.map((r) => r.residual_pattern_diagnostic.likely_subsystem_owner)), 'unclear');

  const sprintName = (() => {
    const p = top3Patterns;
    if (p.includes('false_premium_confidence') && p.includes('indirect_hinge_underread')) {
      return 'FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_V1';
    }
    if (p.includes('weak_note_latent_signal_miss') && p.includes('respectable_but_flat_winner')) {
      return 'WEAK_SIGNAL_AND_WINNER_QUALITY_REPAIR_SPRINT_V1';
    }
    return 'RESIDUAL_PATTERN_SURGICAL_REPAIR_SPRINT_V1';
  })();

  const artifact = {
    protocol: 'DISTRIBUTION_SHIFT_PATTERN_DIAGNOSTIC_V1',
    generated_at: new Date().toISOString(),
    purpose:
      'Diagnose residual distribution-shift failures by behavioral pattern (not class), with subsystem ownership, trust risk concentration, and next surgical sprint recommendation.',
    required_inputs: REQUIRED_INPUTS,
    residual_case_universe: {
      expected_from_class_repair: classRepairDiagnosed,
      diagnosed_cases_available: diagnosedCases.length,
      inclusion_rule_matched_cases: residualUniverse.length,
      inclusion_rule:
        'Included if any: action_correctness!=correct OR output_trustworthiness!=trustworthy OR distribution_fit_robustness==weak OR line_fit==misfit OR grounding_sufficiency==insufficient OR student_reaction_prediction==feels_flattened_or_misread OR cultural_style_fit==misread_due_to_style.',
    },
    overall_residual_profile_classification: {
      assessment: residualProfile,
      explanation:
        residualProfile === 'pattern_concentrated'
          ? 'Residual failures now cluster into a small set of recurring behavioral patterns suitable for a surgical sprint.'
          : residualProfile === 'diffuse'
            ? 'Residual failures are low-count and spread across many patterns.'
            : 'Residual failures still do not cluster cleanly enough; further diagnostic slicing is required.',
    },
    residual_case_packets: packets,
    aggregations: {
      behavioral_pattern_table: patternTable,
      subsystem_ownership_table: subsystemTable,
      distribution_class_pattern_table: classPatternTable,
    },
    high_trust_risk_residuals: highTrustRiskResiduals.map((p) => ({
      source_case_id: p.source_case_id,
      distribution_class: p.distribution_class,
      primary_behavioral_pattern: p.residual_pattern_diagnostic.primary_behavioral_pattern,
      likely_subsystem_owner: p.residual_pattern_diagnostic.likely_subsystem_owner,
      likely_student_reaction: p.residual_pattern_diagnostic.likely_student_reaction,
    })),
    top_10_remaining_generalization_trust_breaks: top10TrustBreaks,
    benchmark_mismatch_candidates: benchmarkMismatchCandidates,
    human_review_required_set: {
      required_case_count: humanReviewCases.length,
      cases: humanReviewCases,
    },
    strong_conclusions: {
      are_remaining_failures_systemic_or_pattern_concentrated: residualProfile,
      top_3_residual_behavioral_patterns: top3Patterns,
      subsystem_owning_most_high_trust_risk_cases: highRiskOwner,
      exact_next_sprint_recommendation: sprintName,
    },
    release_rule_implication:
      residualProfile === 'systemically_unclear' || highTrustRiskResiduals.length >= 6
        ? 'Do not move toward launch readiness: residual profile still too risky or insufficiently concentrated.'
        : 'Residual profile appears concentrated enough for a narrow surgical sprint before reconsidering readiness.',
  };

  const patternRows = patternTable
    .map(
      (r) =>
        `| ${r.behavioral_pattern} | ${r.total_count} | ${r.trust_risk_concentration} | ${r.dominant_subsystem_owner} | ${r.dominant_distribution_classes.join(', ')} | ${r.recommended_fix_priority} |`,
    )
    .join('\n');

  const subsystemRows = subsystemTable
    .map(
      (r) =>
        `| ${r.subsystem_owner} | ${r.owned_residual_count} | ${r.high_trust_risk_count} | ${r.top_behavioral_patterns.join(', ')} |`,
    )
    .join('\n');

  const topBreakRows = top10TrustBreaks
    .map(
      (r, i) =>
        `${i + 1}. ${r.source_case_id} (${r.distribution_class}) — ${r.primary_behavioral_pattern}; risk=${r.trust_risk_severity}; reaction=${r.likely_student_reaction}; owner=${r.likely_subsystem_owner}`,
    )
    .join('\n');

  const benchmarkRows =
    benchmarkMismatchCandidates.length === 0
      ? '- none flagged in this run'
      : benchmarkMismatchCandidates
          .map((x) => `- ${x.source_case_id} (${x.distribution_class}): ${x.rationale}`)
          .join('\n');

  const casePacketsMd = packets
    .map((p) => {
      const diag = p.residual_pattern_diagnostic;
      return [
        `### CASE_ID: ${p.case_id}`,
        `SOURCE_CASE_ID: ${p.source_case_id}`,
        `DISTRIBUTION_CLASS: ${p.distribution_class}`,
        '',
        'INPUT_SHAPE_SUMMARY:',
        p.input_shape_summary,
        '',
        'MAIN_TRAP:',
        p.main_trap,
        '',
        'RUNTIME_RESULT:',
        `- selected_candidate_id: ${p.runtime_result.selected_candidate_id}`,
        `- selected_axis_family: ${p.runtime_result.selected_axis_family}`,
        `- direction_line: ${p.runtime_result.direction_line}`,
        `- confidence_band: ${p.runtime_result.confidence_band}`,
        `- route_decision: ${p.runtime_result.route_decision}`,
        `- top_score: ${p.runtime_result.top_score}`,
        `- runner_up_score: ${p.runtime_result.runner_up_score}`,
        `- score_margin: ${p.runtime_result.score_margin}`,
        '',
        'OUTPUT_CONTEXT:',
        `- selected_explanation: ${p.output_context.selected_explanation}`,
        `- selected_evidence: ${JSON.stringify(p.output_context.selected_evidence)}`,
        `- clarification_question: ${p.output_context.clarification_question ?? 'none'}`,
        `- blocked_message: ${p.output_context.blocked_message ?? 'none'}`,
        '',
        'RESIDUAL_PATTERN_DIAGNOSTIC:',
        `- primary_behavioral_pattern: ${diag.primary_behavioral_pattern}`,
        `- secondary_behavioral_pattern: ${diag.secondary_behavioral_pattern}`,
        `- likely_subsystem_owner: ${diag.likely_subsystem_owner}`,
        `- trust_risk_severity: ${diag.trust_risk_severity}`,
        `- likely_student_reaction: ${diag.likely_student_reaction}`,
        `- best_next_fix_type: ${diag.best_next_fix_type}`,
        `- reviewer_notes: ${diag.reviewer_notes}`,
        '',
      ].join('\n');
    })
    .join('\n');

  const md = [
    '# DISTRIBUTION_SHIFT_PATTERN_DIAGNOSTIC_RESULTS_V1',
    '',
    '## protocol purpose',
    '',
    artifact.purpose,
    '',
    '## residual case universe',
    '',
    `- expected from class-repair artifact: ${artifact.residual_case_universe.expected_from_class_repair}`,
    `- diagnosed cases available: ${artifact.residual_case_universe.diagnosed_cases_available}`,
    `- inclusion-rule matched cases: ${artifact.residual_case_universe.inclusion_rule_matched_cases}`,
    '',
    '## overall residual profile classification',
    '',
    `- assessment: ${artifact.overall_residual_profile_classification.assessment}`,
    `- explanation: ${artifact.overall_residual_profile_classification.explanation}`,
    '',
    '## behavioral pattern table',
    '',
    '| behavioral pattern | total count | high-risk concentration | dominant subsystem owner | dominant classes | fix priority |',
    '|---|---:|---:|---|---|---|',
    patternRows,
    '',
    '## subsystem ownership table',
    '',
    '| subsystem owner | owned residual count | high trust-risk count | top behavioral patterns |',
    '|---|---:|---:|---|',
    subsystemRows,
    '',
    '## high-trust-risk residuals',
    '',
    ...highTrustRiskResiduals.map(
      (p) =>
        `- ${p.source_case_id} (${p.distribution_class}) — ${p.residual_pattern_diagnostic.primary_behavioral_pattern}; owner=${p.residual_pattern_diagnostic.likely_subsystem_owner}; reaction=${p.residual_pattern_diagnostic.likely_student_reaction}`,
    ),
    '',
    '## top 10 remaining generalization trust breaks',
    '',
    topBreakRows,
    '',
    '## benchmark-mismatch candidates',
    '',
    benchmarkRows,
    '',
    '## recommended next sprint',
    '',
    `- recommended sprint: ${sprintName}`,
    `- top 3 residual patterns: ${top3Patterns.join(', ')}`,
    `- owner of most high-trust-risk residuals: ${highRiskOwner}`,
    '',
    '## product readiness implication',
    '',
    artifact.release_rule_implication,
    '',
    '## per-case residual packets',
    '',
    casePacketsMd,
  ].join('\n');

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, md);

  console.log('✅ DISTRIBUTION_SHIFT_PATTERN_DIAGNOSTIC_V1 complete');
  console.log(`- residual cases diagnosed: ${packets.length}`);
  console.log(`- overall profile: ${artifact.overall_residual_profile_classification.assessment}`);
  console.log(`- top patterns: ${top3Patterns.join(', ')}`);
  console.log(`- recommended sprint: ${sprintName}`);
  console.log(`- JSON: ${OUTPUT_JSON}`);
  console.log(`- Markdown: ${OUTPUT_MD}`);
}

main();
