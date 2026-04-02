#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type Json = Record<string, unknown>;

type ManualAssessment = {
  routeShouldHaveHappened: string;
  betterCandidateAlreadyExisted: boolean;
  noGoodCandidateExisted: boolean;
  clarificationBetterThanAnyAvailableCandidate: boolean;
  lineOrExplanationWorsenedFailure: boolean;
  lineOrExplanationTurnedBorderlineIntoWorseFailure: boolean;
  primaryFailureMechanism:
    | 'candidate_generation'
    | 'routing_calibration'
    | 'trust_calibration'
    | 'explanation_layer';
  notes: string;
};

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'evaluation_outputs');
const DOCS = path.join(ROOT, 'docs', 'engineering');

const EVAL_JSON = path.join(OUT, 'distribution_shift_evaluation_v1.json');
const PATTERN_JSON = path.join(OUT, 'distribution_shift_pattern_diagnostic_v1.json');
const OUT_JSON = path.join(OUT, 'high_trust_risk_attribution_triage_v1.json');
const OUT_MD = path.join(DOCS, 'HIGH_TRUST_RISK_ATTRIBUTION_TRIAGE_V1.md');

const MANUAL_ASSESSMENTS: Record<string, ManualAssessment> = {
  DSE_02: {
    routeShouldHaveHappened: 'ask_question_before_showing',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'Only a generic robotics/teamwork center was generated, then the explanation invented a stronger causal arc than the note supports.',
  },
  DSE_03: {
    routeShouldHaveHappened: 'blocked_or_needs_more_input',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'The candidate set never found a real scene-level center; the explanation upgrades generic virtues into a fake correction arc.',
  },
  DSE_05: {
    routeShouldHaveHappened: 'ask_question_before_showing',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'The system treated repeated growth claims as a usable hinge, but no trustworthy candidate existed.',
  },
  DSE_12: {
    routeShouldHaveHappened: 'blocked_or_needs_more_input',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: true,
    primaryFailureMechanism: 'trust_calibration',
    notes:
      'The ask route is safer than show, but the generated “plausible center” still over-legitimizes polished emptiness that should have been blocked.',
  },
  DSE_15: {
    routeShouldHaveHappened: 'show_strongest_direction',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: false,
    clarificationBetterThanAnyAvailableCandidate: false,
    lineOrExplanationWorsenedFailure: false,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'routing_calibration',
    notes:
      'The selected system-redesign candidate is already usable and evidence-grounded; the failure is over-caution, not candidate quality.',
  },
  DSE_16: {
    routeShouldHaveHappened: 'blocked_or_needs_more_input',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: true,
    primaryFailureMechanism: 'trust_calibration',
    notes:
      'No candidate is grounded enough to show, and even the ask output still frames the prose as if a plausible center already exists.',
  },
  DSE_17: {
    routeShouldHaveHappened: 'show_strongest_direction',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: false,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'The engine missed the family-duty center entirely; both generated candidates stay generic, so the real fix is better candidate recovery.',
  },
  DSE_18: {
    routeShouldHaveHappened: 'show_strongest_direction',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: true,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'A true causal hinge never makes it into the candidate set, and the “plausible center” wording makes the weak ask output feel even flatter.',
  },
  DSE_22: {
    routeShouldHaveHappened: 'ask_question_before_showing',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'trust_calibration',
    notes:
      'The system should have clarified before showing; neither available candidate is grounded enough, and the output amplifies the false-premium surface.',
  },
  DSE_32: {
    routeShouldHaveHappened: 'ask_question_before_showing',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'The contradiction never gets converted into competing concrete candidates, so the engine shows a flattened listening winner instead of clarifying.',
  },
  DSE_40: {
    routeShouldHaveHappened: 'ask_question_before_showing',
    betterCandidateAlreadyExisted: false,
    noGoodCandidateExisted: true,
    clarificationBetterThanAnyAvailableCandidate: true,
    lineOrExplanationWorsenedFailure: true,
    lineOrExplanationTurnedBorderlineIntoWorseFailure: false,
    primaryFailureMechanism: 'candidate_generation',
    notes:
      'The engine overreads culturally indirect duty language into a high-confidence conflict/listening story that is not actually present.',
  },
};

function readJson(filePath: string): Json {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as Json;
}

function arr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function str(value: unknown, fallback = 'n/a'): string {
  return typeof value === 'string' ? value : fallback;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function pct(count: number, total: number): string {
  if (!total) return '0.0%';
  return `${((count / total) * 100).toFixed(1)}%`;
}

function titleize(mechanism: ManualAssessment['primaryFailureMechanism']): string {
  if (mechanism === 'candidate_generation') return 'Candidate generation';
  if (mechanism === 'routing_calibration') return 'Routing calibration';
  if (mechanism === 'trust_calibration') return 'Trust calibration';
  return 'Explanation layer';
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

function main(): void {
  const evalJson = readJson(EVAL_JSON);
  const patternJson = readJson(PATTERN_JSON);

  const packets = arr<Json>(evalJson.packets);
  const packetsById = new Map(packets.map((packet) => [str(packet.case_id), packet]));

  const highTrustResiduals = arr<Json>(patternJson.high_trust_risk_residuals);
  const cases = highTrustResiduals.map((item) => {
    const caseId = str(item.source_case_id);
    const packet = packetsById.get(caseId);
    if (!packet) throw new Error(`Missing evaluation packet for ${caseId}`);

    const manual = MANUAL_ASSESSMENTS[caseId];
    if (!manual) throw new Error(`Missing manual assessment for ${caseId}`);

    const runtime = (packet.runtime_result as Json) ?? {};
    const candidates = arr<Json>(packet.candidates);
    const selectedCandidateId = str(runtime.selected_candidate_id);

    const topNonSelected = candidates
      .filter((candidate) => str(candidate.candidate_id) !== selectedCandidateId)
      .slice(0, 2)
      .map((candidate) => ({
        candidate_id: str(candidate.candidate_id),
        direction_line: str(candidate.direction_line),
        total_score: num(candidate.total_score),
      }));

    return {
      source_case_id: caseId,
      distribution_class: str(packet.distribution_class),
      primary_behavioral_pattern: str(item.primary_behavioral_pattern),
      raw_input: str(packet.raw_input),
      selected_candidate: {
        candidate_id: selectedCandidateId,
        direction_line: str(runtime.direction_line),
        axis_family: str(runtime.selected_axis_family),
        score: num(candidates.find((candidate) => str(candidate.candidate_id) === selectedCandidateId)?.total_score),
      },
      top_two_non_selected_candidates: topNonSelected,
      route_taken: str(runtime.route_decision),
      route_should_have_happened: manual.routeShouldHaveHappened,
      better_candidate_already_existed: manual.betterCandidateAlreadyExisted,
      no_good_candidate_existed: manual.noGoodCandidateExisted,
      clarification_better_than_any_available_candidate: manual.clarificationBetterThanAnyAvailableCandidate,
      line_or_explanation_worsened_failure: manual.lineOrExplanationWorsenedFailure,
      line_or_explanation_turned_borderline_into_worse_failure:
        manual.lineOrExplanationTurnedBorderlineIntoWorseFailure,
      primary_failure_mechanism: manual.primaryFailureMechanism,
      notes: manual.notes,
    };
  });

  const total = cases.length;
  const betterCandidateCount = cases.filter((item) => item.better_candidate_already_existed).length;
  const noGoodCandidateCount = cases.filter((item) => item.no_good_candidate_existed).length;
  const clarificationReplaceShowCount = cases.filter(
    (item) => item.route_taken === 'show_strongest_direction' && item.clarification_better_than_any_available_candidate
  ).length;
  const lineBorderlineCount = cases.filter(
    (item) => item.line_or_explanation_turned_borderline_into_worse_failure
  ).length;

  const mechanismCounts = cases.reduce<Record<string, number>>((acc, item) => {
    acc[item.primary_failure_mechanism] = (acc[item.primary_failure_mechanism] ?? 0) + 1;
    return acc;
  }, {});

  const recommendation = {
    next_sprint_type: 'candidate generation sprint',
    why:
      'Most high-trust-risk residuals fail because the engine never produces a trustworthy candidate for weak-note, culturally indirect, family-duty, or contradictory inputs. The reranker has almost no recoverable wins to select from.',
    supporting_signals: [
      `${noGoodCandidateCount}/${total} cases had no good candidate in the current set.`,
      `${betterCandidateCount}/${total} cases had an already-available better non-selected candidate.`,
      `${clarificationReplaceShowCount}/${total} cases should have replaced show with clarification; this is a secondary routing guardrail, not the main frontier.`,
    ],
    explicitly_not_recommended_as_primary: [
      'scorer/reranker sprint',
      'line/explanation repair sprint',
      'benchmark cleanup sprint',
    ],
    secondary_follow_on:
      'Add a narrow routing guardrail that forces clarification when the candidate set is generic, contradictory, or premium-sounding without scene-level support.',
  };

  const artifact = {
    protocol: 'HIGH_TRUST_RISK_ATTRIBUTION_TRIAGE_V1',
    generated_at: new Date().toISOString(),
    source_artifacts: {
      evaluation_json: EVAL_JSON,
      pattern_diagnostic_json: PATTERN_JSON,
    },
    case_count: total,
    cases,
    aggregate_percentages: {
      failures_where_better_candidate_already_existed: {
        count: betterCandidateCount,
        total,
        percent: pct(betterCandidateCount, total),
      },
      failures_where_no_good_candidate_existed: {
        count: noGoodCandidateCount,
        total,
        percent: pct(noGoodCandidateCount, total),
      },
      failures_where_clarification_should_have_replaced_show: {
        count: clarificationReplaceShowCount,
        total,
        percent: pct(clarificationReplaceShowCount, total),
      },
      failures_where_line_or_explanation_worsened_borderline_choice: {
        count: lineBorderlineCount,
        total,
        percent: pct(lineBorderlineCount, total),
      },
      cases_where_line_or_explanation_worsened_failure_at_all: {
        count: cases.filter((item) => item.line_or_explanation_worsened_failure).length,
        total,
        percent: pct(
          cases.filter((item) => item.line_or_explanation_worsened_failure).length,
          total
        ),
      },
    },
    primary_failure_mechanism_counts: Object.fromEntries(
      Object.entries(mechanismCounts).map(([key, value]) => [key, { count: value, percent: pct(value, total) }])
    ),
    recommendation,
  };

  const lines: string[] = [
    '# HIGH TRUST RISK ATTRIBUTION TRIAGE V1',
    '',
    `Generated: ${artifact.generated_at}`,
    '',
    '## Summary',
    '',
    `- High-trust-risk cases reviewed: ${total}`,
    `- Better candidate already existed: ${betterCandidateCount}/${total} (${pct(betterCandidateCount, total)})`,
    `- No good candidate existed: ${noGoodCandidateCount}/${total} (${pct(noGoodCandidateCount, total)})`,
    `- Clarification should have replaced show: ${clarificationReplaceShowCount}/${total} (${pct(clarificationReplaceShowCount, total)})`,
    `- Line/explanation worsened an otherwise borderline choice: ${lineBorderlineCount}/${total} (${pct(lineBorderlineCount, total)})`,
    '',
    '## Next Sprint Recommendation',
    '',
    `- Recommended next sprint: ${recommendation.next_sprint_type}`,
    `- Why: ${recommendation.why}`,
    `- Secondary follow-on: ${recommendation.secondary_follow_on}`,
    '',
    '## Case-by-case Attribution',
    '',
  ];

  for (const item of cases) {
    lines.push(`### ${item.source_case_id} — ${item.primary_behavioral_pattern}`);
    lines.push('');
    lines.push(`- Route taken: ${item.route_taken}`);
    lines.push(`- Route that should have happened: ${item.route_should_have_happened}`);
    lines.push(
      `- Selected candidate: ${item.selected_candidate.candidate_id} — ${item.selected_candidate.direction_line}`
    );
    lines.push(
      `- Top non-selected candidates: ${item.top_two_non_selected_candidates.length ? item.top_two_non_selected_candidates.map((candidate) => `${candidate.candidate_id} — ${candidate.direction_line}`).join(' | ') : 'none'}`
    );
    lines.push(`- Better candidate already existed: ${yesNo(item.better_candidate_already_existed)}`);
    lines.push(`- No good candidate existed: ${yesNo(item.no_good_candidate_existed)}`);
    lines.push(
      `- Clarification better than any available candidate: ${yesNo(item.clarification_better_than_any_available_candidate)}`
    );
    lines.push(`- Line/explanation worsened failure: ${yesNo(item.line_or_explanation_worsened_failure)}`);
    lines.push(`- Primary failure mechanism: ${titleize(item.primary_failure_mechanism)}`);
    lines.push(`- Notes: ${item.notes}`);
    lines.push('');
  }

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(artifact, null, 2)}\n`);
  fs.writeFileSync(OUT_MD, `${lines.join('\n')}\n`);

  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
}

main();