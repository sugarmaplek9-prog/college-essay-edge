#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources, NdsCandidateScores } from '../src/types/ai';

type VersionId = 'A' | 'B' | 'C' | 'D';

type StabilityPacket = {
  BASE_CASE_ID: string;
  TITLE: string;
  CLASS: string;
  EXPECTED_OUTCOME: string;
  STABILITY_TOLERANCE: 'strict' | 'moderate';
  REVIEWER_INTENT_NOTE: string;
  VERSION_A: { raw_input: string };
  VERSION_B: { raw_input: string };
  VERSION_C: { raw_input: string };
  VERSION_D: { raw_input: string };
  STABILITY_AUDIT: {
    winner_stability: 'stable' | 'minor_drift' | 'unstable';
    route_stability: 'stable' | 'minor_drift' | 'unstable';
    confidence_stability: 'stable' | 'drifted' | 'unreliable';
    explanation_drift: 'acceptable' | 'concerning' | 'bad';
  };
};

type StabilityOutput = {
  base_cases: StabilityPacket[];
};

type CandidateRow = {
  candidate_id: string;
  direction_line: string;
  selected: boolean;
  scores: NdsCandidateScores;
};

type VersionOutcome = {
  version_id: VersionId;
  raw_input: string;
  selected_candidate_id: string;
  selected_direction_line: string;
  confidence_band: string;
  route_decision: string;
  top_score: number;
  runner_up_score: number;
  score_margin: number;
  all_candidates: CandidateRow[];
  all_candidate_dimension_scores: Array<{
    candidate_id: string;
    scores: Record<string, unknown>;
  }>;
  selected_explanation: string;
  selected_evidence: string[];
  selected_axis_family: string;
  degraded_input_mode: boolean;
  trust_mode: string;
  explanation_restraint_mode: boolean;
  fallback_contaminated: boolean;
  candidate_support_density: string;
  family_confidence: string;
  clarification_reason: string;
  clarification_specificity: string;
};

type ScoreDelta = {
  [K in keyof NdsCandidateScores]: number;
};

type UnstableDiagnostic = {
  base_case_id: string;
  title: string;
  class: string;
  expected_outcome: string;
  stability_tolerance: 'strict' | 'moderate';
  baseline_labels: StabilityPacket['STABILITY_AUDIT'];
  outcomes: Record<VersionId, VersionOutcome>;
  score_deltas_by_dimension: {
    vs_version_A_selected: Record<Exclude<VersionId, 'A'>, ScoreDelta>;
    flip_versions_selected_vs_A_winner_in_same_version: Array<{
      version_id: Exclude<VersionId, 'A'>;
      selected_id: string;
      baseline_winner_id: string;
      delta: ScoreDelta;
    }>;
  };
  winner_flip_reason: string;
  route_flip_reason: string;
  explanation_drift_reason: string;
  reviewer_note: {
    semantic_drift: boolean;
    surface_only_drift: boolean;
    scorer_bug: boolean;
    explanation_bug: boolean;
    confidence_bug: boolean;
    note: string;
  };
  primary_cause: 'scorer_dimension_instability' | 'route_threshold_instability' | 'explanation_layer_instability';
  regression_primary_cause:
    | 'degraded_mode_overtrigger'
    | 'trust_mode_overtrigger'
    | 'explanation_restraint_overtrigger'
    | 'fallback_penalty_overtrigger'
    | 'clarification_guard_overtrigger'
    | 'candidate_recovery_overtrigger'
    | 'route_threshold_shift'
    | 'unknown';
  regression_secondary_cause:
    | 'degraded_mode_overtrigger'
    | 'trust_mode_overtrigger'
    | 'explanation_restraint_overtrigger'
    | 'fallback_penalty_overtrigger'
    | 'clarification_guard_overtrigger'
    | 'candidate_recovery_overtrigger'
    | 'route_threshold_shift'
    | 'unknown';
  new_edge_flag_triggered: 'yes' | 'no';
  should_have_stayed_standard_mode: 'yes' | 'no';
  patched_status: 'patched_in_sprint_v1' | 'pending';
  post_patch_outcome: {
    winner_stability: StabilityPacket['STABILITY_AUDIT']['winner_stability'];
    route_stability: StabilityPacket['STABILITY_AUDIT']['route_stability'];
    confidence_stability: StabilityPacket['STABILITY_AUDIT']['confidence_stability'];
    explanation_drift: StabilityPacket['STABILITY_AUDIT']['explanation_drift'];
  };
  subsystem_group: Array<'scorer-dimension instability' | 'route-threshold instability' | 'explanation-layer instability'>;
};

type DiagnosticOutput = {
  protocol: 'NDS_STABILITY_FAILURE_DIAGNOSTIC_V1';
  generated_at: string;
  source_stability_artifact: string;
  total_base_cases: number;
  unstable_base_cases: number;
  diagnostics: UnstableDiagnostic[];
  grouped_failures: {
    scorer_dimension_instability: string[];
    route_threshold_instability: string[];
    explanation_layer_instability: string[];
  };
};

const STABILITY_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_direction_stability_test_v1.json');
const OUTPUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_stability_failure_diagnostic_v1.json');
const OUTPUT_MD = path.join(process.cwd(), 'docs', 'engineering', 'NDS_STABILITY_FAILURE_DIAGNOSTIC_RESULTS_V1.md');

const SCORE_DIMENSIONS: Array<keyof NdsCandidateScores> = [
  'student_specificity',
  'evidence_grounding',
  'non_genericity',
  'buildability',
  'distinctness',
  'scene_strength',
  'reflective_potential',
  'explanation_coherence',
  'clarification_need',
  'total_score',
];

function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function getScoreDelta(a: NdsCandidateScores, b: NdsCandidateScores): ScoreDelta {
  const delta = {} as ScoreDelta;
  for (const dim of SCORE_DIMENSIONS) {
    delta[dim] = Number(((a?.[dim] ?? 0) - (b?.[dim] ?? 0)).toFixed(3));
  }
  return delta;
}

function inferAxis(lineOrText: string): string {
  const t = lineOrText.toLowerCase();
  if (/listening|person in front|relationship|listened|care meant/.test(t)) return 'relationship_or_listening';
  if (/redesign|system|workflow|tracker|process/.test(t)) return 'system_redesign';
  if (/delegat|distributed|bottleneck|shared ownership|handoff/.test(t)) return 'delegation';
  if (/pattern|stopped repeating|wrong pattern|habit/.test(t)) return 'pattern_breaking';
  if (/identity|who i was becoming|self|self-concept|fixer/.test(t)) return 'identity_transformation';
  if (/responsibility|owed/.test(t)) return 'responsibility';
  return 'unclassified';
}

function extractExplanation(payload: Record<string, unknown>): string {
  const best = (payload.best_direction ?? {}) as Record<string, unknown>;
  return [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .map((x) => normalize(String(x)))
    .join(' ');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function jaccard(a: string, b: string): number {
  const A = new Set(tokenize(a));
  const B = new Set(tokenize(b));
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter += 1;
  return inter / (A.size + B.size - inter);
}

function buildInput(baseCaseId: string, title: string, version: VersionId, rawInput: string): NdsResolvedSources {
  return {
    essay_project: {
      id: `diag_${baseCaseId}_${version}`,
      student_user_id: `diag_${baseCaseId}`,
      title: `${title} (${version})`,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `diag_${baseCaseId}`,
      first_name: 'StabilityDiag',
      last_name: baseCaseId,
      grade: 11,
      interests: [],
    },
    story_entries: [
      {
        id: `${baseCaseId}_${version}_1`,
        title: `${baseCaseId} ${version}`,
        body: rawInput,
        category: null,
      },
    ],
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: 1,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

async function runVersion(packet: StabilityPacket, version: VersionId): Promise<VersionOutcome> {
  const rawInput = packet[`VERSION_${version}` as const].raw_input;
  const context = buildNdsNormalizedContextPack(buildInput(packet.BASE_CASE_ID, packet.TITLE, version, rawInput));
  const execution = await executeNdsModule({
    run_id: `diag_${packet.BASE_CASE_ID}_${version}`,
    module_key: 'narrative_direction_selection',
    execution_mode: 'standard',
    context_pack: context,
    module_versions: {
      prompt_version: 'v1',
      schema_version: 'v1',
      validator_version: 'v1',
    },
  });

  const payload = (execution.candidate_payload ?? {}) as Record<string, unknown>;
  const candidatesRaw = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidatesRaw.find((c) => c.selected === true) ?? candidatesRaw[0] ?? null;
  const scoreSummary = (payload.score_summary ?? {}) as Record<string, unknown>;
  const scoringDebug = (payload.scoring_debug ?? {}) as Record<string, unknown>;
  const selectedValidatorFlags = (selected?.validator_flags ?? {}) as Record<string, unknown>;

  const allCandidates: CandidateRow[] = candidatesRaw.map((c) => ({
    candidate_id: String(c.candidate_id ?? ''),
    direction_line: normalize(String(c.direction_line ?? '')),
    selected: Boolean(c.selected),
    scores: (c.scores ?? {}) as NdsCandidateScores,
  }));
  const allCandidateDimensionScores = candidatesRaw.map((c) => ({
    candidate_id: String(c.candidate_id ?? ''),
    scores: (c.scores ?? {}) as Record<string, unknown>,
  }));

  const selectedEvidence = ((selected?.evidence_spans ?? []) as Array<Record<string, unknown>>)
    .map((x) => normalize(String(x.text ?? '')))
    .filter(Boolean);

  return {
    version_id: version,
    raw_input: rawInput,
    selected_candidate_id: String(selected?.candidate_id ?? 'n/a'),
    selected_direction_line: normalize(String(selected?.direction_line ?? '')),
    confidence_band: String(payload.confidence_band ?? 'n/a'),
    route_decision: String(payload.route_decision ?? 'n/a'),
    top_score: Number(scoreSummary.top_score ?? 0),
    runner_up_score: Number(scoreSummary.runner_up_score ?? 0),
    score_margin: Number(scoreSummary.score_margin ?? 0),
    all_candidates: allCandidates,
    all_candidate_dimension_scores: allCandidateDimensionScores,
    selected_explanation: extractExplanation(payload),
    selected_evidence: selectedEvidence,
    selected_axis_family: String(scoringDebug.selected_axis_family ?? inferAxis(String(selected?.direction_line ?? ''))),
    degraded_input_mode: Boolean(selectedValidatorFlags.degraded_input_mode ?? false),
    trust_mode: String(scoringDebug.trust_mode ?? 'standard'),
    explanation_restraint_mode: Boolean(scoringDebug.explanation_restraint_mode ?? false),
    fallback_contaminated: Boolean(selectedValidatorFlags.fallback_contaminated ?? false),
    candidate_support_density: String(selectedValidatorFlags.candidate_support_density ?? 'n/a'),
    family_confidence: String(selectedValidatorFlags.family_confidence ?? 'n/a'),
    clarification_reason: String(scoringDebug.clarification_reason ?? 'n/a'),
    clarification_specificity: String(scoringDebug.clarification_specificity ?? 'n/a'),
  };
}

function findById(candidates: CandidateRow[], id: string): CandidateRow | null {
  return candidates.find((c) => c.candidate_id === id) ?? null;
}

function biggestDims(delta: ScoreDelta, topN = 3): Array<{ dim: keyof NdsCandidateScores; value: number }> {
  return [...SCORE_DIMENSIONS]
    .map((dim) => ({ dim, value: delta[dim] }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, topN);
}

function winnerFlipReason(outcomes: Record<VersionId, VersionOutcome>): {
  reason: string;
  flipDeltas: UnstableDiagnostic['score_deltas_by_dimension']['flip_versions_selected_vs_A_winner_in_same_version'];
} {
  const baseline = outcomes.A;
  const flipDeltas: UnstableDiagnostic['score_deltas_by_dimension']['flip_versions_selected_vs_A_winner_in_same_version'] = [];
  const reasons: string[] = [];

  for (const v of ['B', 'C', 'D'] as const) {
    const current = outcomes[v];
    if (current.selected_candidate_id === baseline.selected_candidate_id) continue;

    const selected = findById(current.all_candidates, current.selected_candidate_id);
    const baselineWinnerHere = findById(current.all_candidates, baseline.selected_candidate_id);

    if (!selected) {
      reasons.push(`${v}: selected candidate missing from candidate table.`);
      continue;
    }

    if (!baselineWinnerHere) {
      reasons.push(`${v}: baseline winner (${baseline.selected_candidate_id}) is absent/rejected, forcing a winner flip.`);
      continue;
    }

    const delta = getScoreDelta(selected.scores, baselineWinnerHere.scores);
    flipDeltas.push({
      version_id: v,
      selected_id: selected.candidate_id,
      baseline_winner_id: baseline.selected_candidate_id,
      delta,
    });
    const tops = biggestDims(delta)
      .map((d) => `${d.dim}:${d.value > 0 ? '+' : ''}${d.value.toFixed(3)}`)
      .join(', ');
    reasons.push(`${v}: ${selected.candidate_id} outranks ${baseline.selected_candidate_id}; strongest score deltas = ${tops}.`);
  }

  return {
    reason: reasons.length > 0 ? reasons.join(' ') : 'No winner flip across versions.',
    flipDeltas,
  };
}

function routeFlipReason(outcomes: Record<VersionId, VersionOutcome>): string {
  const A = outcomes.A;
  const reasons: string[] = [];

  for (const v of ['B', 'C', 'D'] as const) {
    const cur = outcomes[v];
    if (cur.route_decision === A.route_decision) continue;

    const confShift = `${A.confidence_band}→${cur.confidence_band}`;
    const marginShift = `${A.score_margin.toFixed(3)}→${cur.score_margin.toFixed(3)}`;

    if (cur.route_decision === 'ask_question_before_showing') {
      reasons.push(`${v}: route flipped to clarification because confidence dropped to ${cur.confidence_band} (band shift ${confShift}, margin ${marginShift}).`);
    } else if (cur.route_decision === 'show_strongest_direction') {
      reasons.push(`${v}: route flipped to show strongest because confidence rose to ${cur.confidence_band} (band shift ${confShift}, margin ${marginShift}).`);
    } else {
      reasons.push(`${v}: route changed ${A.route_decision}→${cur.route_decision} (confidence ${confShift}, margin ${marginShift}).`);
    }
  }

  return reasons.length > 0 ? reasons.join(' ') : 'No route flip across versions.';
}

function explanationDriftReason(outcomes: Record<VersionId, VersionOutcome>): string {
  const A = outcomes.A;
  const reasons: string[] = [];
  const axisA = inferAxis(`${A.selected_direction_line} ${A.selected_explanation}`);

  for (const v of ['B', 'C', 'D'] as const) {
    const cur = outcomes[v];
    const sim = jaccard(A.selected_explanation, cur.selected_explanation);
    const axisCur = inferAxis(`${cur.selected_direction_line} ${cur.selected_explanation}`);
    if (sim < 0.22) {
      if (axisCur !== axisA) {
        reasons.push(`${v}: low explanation similarity (${sim.toFixed(3)}) with axis change ${axisA}→${axisCur}.`);
      } else {
        reasons.push(`${v}: low explanation similarity (${sim.toFixed(3)}) without axis change; explanation phrasing is unstable.`);
      }
    }
  }

  return reasons.length > 0 ? reasons.join(' ') : 'Explanation drift is within acceptable range for wording rewrites.';
}

function isUnstableCase(packet: StabilityPacket): boolean {
  const a = packet.STABILITY_AUDIT;
  return (
    a.winner_stability === 'unstable' ||
    a.route_stability === 'unstable' ||
    a.confidence_stability === 'unreliable' ||
    a.explanation_drift === 'bad'
  );
}

function buildReviewerNote(
  packet: StabilityPacket,
  outcomes: Record<VersionId, VersionOutcome>,
  winnerReason: string,
  routeReason: string,
  explanationReason: string,
): UnstableDiagnostic['reviewer_note'] {
  const A = outcomes.A;
  const axisAInput = inferAxis(A.raw_input);
  let semanticDrift = false;

  for (const v of ['B', 'C', 'D'] as const) {
    const axisInput = inferAxis(outcomes[v].raw_input);
    if (axisInput !== 'unclassified' && axisAInput !== 'unclassified' && axisInput !== axisAInput) {
      semanticDrift = true;
      break;
    }
  }

  const surfaceOnlyDrift = !semanticDrift;
  const scorerBug = packet.STABILITY_AUDIT.winner_stability !== 'stable' && surfaceOnlyDrift;
  const confidenceBug =
    (packet.STABILITY_AUDIT.route_stability !== 'stable' || packet.STABILITY_AUDIT.confidence_stability === 'unreliable') &&
    surfaceOnlyDrift;
  const explanationBug = packet.STABILITY_AUDIT.explanation_drift !== 'acceptable' && surfaceOnlyDrift;

  const note = [
    `semantic_drift=${semanticDrift ? 'yes' : 'no'}`,
    `surface_only_drift=${surfaceOnlyDrift ? 'yes' : 'no'}`,
    scorerBug ? `scorer bug signal: ${winnerReason}` : 'scorer bug signal: none',
    confidenceBug ? `confidence/route bug signal: ${routeReason}` : 'confidence/route bug signal: none',
    explanationBug ? `explanation bug signal: ${explanationReason}` : 'explanation bug signal: none',
  ].join(' | ');

  return {
    semantic_drift: semanticDrift,
    surface_only_drift: surfaceOnlyDrift,
    scorer_bug: scorerBug,
    explanation_bug: explanationBug,
    confidence_bug: confidenceBug,
    note,
  };
}

function buildMarkdown(report: DiagnosticOutput): string {
  const scorerRows = report.diagnostics.filter((d) => d.subsystem_group.includes('scorer-dimension instability'));
  const routeRows = report.diagnostics.filter((d) => d.subsystem_group.includes('route-threshold instability'));
  const explRows = report.diagnostics.filter((d) => d.subsystem_group.includes('explanation-layer instability'));

  return [
    '# NDS_STABILITY_FAILURE_DIAGNOSTIC_RESULTS_V1',
    '',
    '## Purpose',
    '',
    'Bridge failed stability outputs to specific subsystems by identifying the score dimensions, route thresholds, and explanation behavior that caused wording-sensitive flips.',
    '',
    '## Scope',
    '',
    `- base cases in source artifact: ${report.total_base_cases}`,
    `- unstable base cases diagnosed: ${report.unstable_base_cases}`,
    '',
    '## Failure grouping',
    '',
    `- scorer-dimension instability: ${report.grouped_failures.scorer_dimension_instability.length}`,
    `- route-threshold instability: ${report.grouped_failures.route_threshold_instability.length}`,
    `- explanation-layer instability: ${report.grouped_failures.explanation_layer_instability.length}`,
    '',
    '## Scorer-dimension instability cases',
    '',
    ...(scorerRows.length === 0 ? ['- None'] : scorerRows.map((r) => `- ${r.base_case_id}: ${r.winner_flip_reason}`)),
    '',
    '## Route-threshold instability cases',
    '',
    ...(routeRows.length === 0 ? ['- None'] : routeRows.map((r) => `- ${r.base_case_id}: ${r.route_flip_reason}`)),
    '',
    '## Explanation-layer instability cases',
    '',
    ...(explRows.length === 0 ? ['- None'] : explRows.map((r) => `- ${r.base_case_id}: ${r.explanation_drift_reason}`)),
    '',
    '## Per-case diagnostics',
    '',
    ...report.diagnostics.flatMap((d) => [
      `### ${d.base_case_id} — ${d.title}`,
      `- class: ${d.class}`,
      `- expected_outcome: ${d.expected_outcome}`,
      `- stability_tolerance: ${d.stability_tolerance}`,
      `- primary_cause: ${d.primary_cause}`,
      `- patched_status: ${d.patched_status}`,
      `- post_patch_outcome: winner=${d.post_patch_outcome.winner_stability}, route=${d.post_patch_outcome.route_stability}, confidence=${d.post_patch_outcome.confidence_stability}, explanation=${d.post_patch_outcome.explanation_drift}`,
      '',
      'A/B/C/D outcomes',
      `- A: winner=${d.outcomes.A.selected_candidate_id}, route=${d.outcomes.A.route_decision}, confidence=${d.outcomes.A.confidence_band}, margin=${d.outcomes.A.score_margin.toFixed(3)}`,
      `- B: winner=${d.outcomes.B.selected_candidate_id}, route=${d.outcomes.B.route_decision}, confidence=${d.outcomes.B.confidence_band}, margin=${d.outcomes.B.score_margin.toFixed(3)}`,
      `- C: winner=${d.outcomes.C.selected_candidate_id}, route=${d.outcomes.C.route_decision}, confidence=${d.outcomes.C.confidence_band}, margin=${d.outcomes.C.score_margin.toFixed(3)}`,
      `- D: winner=${d.outcomes.D.selected_candidate_id}, route=${d.outcomes.D.route_decision}, confidence=${d.outcomes.D.confidence_band}, margin=${d.outcomes.D.score_margin.toFixed(3)}`,
      '',
      'Winner-flip reason',
      `- ${d.winner_flip_reason}`,
      '',
      'Route-flip reason',
      `- ${d.route_flip_reason}`,
      '',
      'Explanation-drift reason',
      `- ${d.explanation_drift_reason}`,
      '',
      'Reviewer note',
      `- semantic drift: ${d.reviewer_note.semantic_drift}`,
      `- surface-only drift: ${d.reviewer_note.surface_only_drift}`,
      `- scorer bug: ${d.reviewer_note.scorer_bug}`,
      `- explanation bug: ${d.reviewer_note.explanation_bug}`,
      `- confidence bug: ${d.reviewer_note.confidence_bug}`,
      `- note: ${d.reviewer_note.note}`,
      '',
      'Score deltas by dimension (vs Version A selected winner)',
      `- B: ${JSON.stringify(d.score_deltas_by_dimension.vs_version_A_selected.B)}`,
      `- C: ${JSON.stringify(d.score_deltas_by_dimension.vs_version_A_selected.C)}`,
      `- D: ${JSON.stringify(d.score_deltas_by_dimension.vs_version_A_selected.D)}`,
      '',
    ]),
  ].join('\n');
}

async function run(): Promise<void> {
  if (!fs.existsSync(STABILITY_JSON)) {
    throw new Error(`Required stability artifact not found: ${STABILITY_JSON}`);
  }

  const parsed = JSON.parse(fs.readFileSync(STABILITY_JSON, 'utf8')) as StabilityOutput;
  const allBaseCases = parsed.base_cases ?? [];
  const unstableCases = allBaseCases.filter(isUnstableCase);

  const diagnostics: UnstableDiagnostic[] = [];

  for (const packet of unstableCases) {
    const outcomesList = await Promise.all((['A', 'B', 'C', 'D'] as VersionId[]).map((v) => runVersion(packet, v)));
    const outcomes: Record<VersionId, VersionOutcome> = {
      A: outcomesList.find((x) => x.version_id === 'A')!,
      B: outcomesList.find((x) => x.version_id === 'B')!,
      C: outcomesList.find((x) => x.version_id === 'C')!,
      D: outcomesList.find((x) => x.version_id === 'D')!,
    };

    const baseSelected = findById(outcomes.A.all_candidates, outcomes.A.selected_candidate_id)?.scores;
    const bSelected = findById(outcomes.B.all_candidates, outcomes.B.selected_candidate_id)?.scores;
    const cSelected = findById(outcomes.C.all_candidates, outcomes.C.selected_candidate_id)?.scores;
    const dSelected = findById(outcomes.D.all_candidates, outcomes.D.selected_candidate_id)?.scores;

    const vsA = {
      B: getScoreDelta(bSelected ?? ({} as NdsCandidateScores), baseSelected ?? ({} as NdsCandidateScores)),
      C: getScoreDelta(cSelected ?? ({} as NdsCandidateScores), baseSelected ?? ({} as NdsCandidateScores)),
      D: getScoreDelta(dSelected ?? ({} as NdsCandidateScores), baseSelected ?? ({} as NdsCandidateScores)),
    };

    const winDiag = winnerFlipReason(outcomes);
    const routeReason = routeFlipReason(outcomes);
    const explReason = explanationDriftReason(outcomes);
    const reviewer = buildReviewerNote(packet, outcomes, winDiag.reason, routeReason, explReason);

    const groups: UnstableDiagnostic['subsystem_group'] = [];
    if (reviewer.scorer_bug) groups.push('scorer-dimension instability');
    if (reviewer.confidence_bug) groups.push('route-threshold instability');
    if (reviewer.explanation_bug) groups.push('explanation-layer instability');

    const primaryCause: UnstableDiagnostic['primary_cause'] = reviewer.scorer_bug
      ? 'scorer_dimension_instability'
      : reviewer.confidence_bug
        ? 'route_threshold_instability'
        : 'explanation_layer_instability';

    const anyDegradedMode = outcomesList.some((o) => o.degraded_input_mode);
    const anyTrustMode = outcomesList.some((o) => o.trust_mode === 'degraded_input');
    const anyRestraint = outcomesList.some((o) => o.explanation_restraint_mode);
    const anyFallback = outcomesList.some((o) => o.fallback_contaminated);
    const anyClarifyGuard = outcomesList.some((o) => o.clarification_reason !== 'n/a' && o.clarification_reason !== 'clarify_shift');

    const regressionPrimaryCause: UnstableDiagnostic['regression_primary_cause'] = anyDegradedMode
      ? 'degraded_mode_overtrigger'
      : anyTrustMode
        ? 'trust_mode_overtrigger'
        : anyRestraint
          ? 'explanation_restraint_overtrigger'
          : anyFallback
            ? 'fallback_penalty_overtrigger'
            : reviewer.confidence_bug
              ? 'route_threshold_shift'
              : anyClarifyGuard
                ? 'clarification_guard_overtrigger'
                : 'unknown';

    const regressionSecondaryCause: UnstableDiagnostic['regression_secondary_cause'] = anyClarifyGuard
      ? 'clarification_guard_overtrigger'
      : reviewer.scorer_bug
        ? 'candidate_recovery_overtrigger'
        : reviewer.confidence_bug
          ? 'route_threshold_shift'
          : 'unknown';

    const newEdgeFlagTriggered: UnstableDiagnostic['new_edge_flag_triggered'] =
      anyDegradedMode || anyTrustMode || anyRestraint || anyFallback || anyClarifyGuard ? 'yes' : 'no';
    const shouldHaveStayedStandardMode: UnstableDiagnostic['should_have_stayed_standard_mode'] =
      packet.CLASS !== 'ambiguity_prone' && newEdgeFlagTriggered === 'yes' ? 'yes' : 'no';

    diagnostics.push({
      base_case_id: packet.BASE_CASE_ID,
      title: packet.TITLE,
      class: packet.CLASS,
      expected_outcome: packet.EXPECTED_OUTCOME,
      stability_tolerance: packet.STABILITY_TOLERANCE,
      baseline_labels: packet.STABILITY_AUDIT,
      outcomes,
      score_deltas_by_dimension: {
        vs_version_A_selected: vsA,
        flip_versions_selected_vs_A_winner_in_same_version: winDiag.flipDeltas,
      },
      winner_flip_reason: winDiag.reason,
      route_flip_reason: routeReason,
      explanation_drift_reason: explReason,
      reviewer_note: reviewer,
      primary_cause: primaryCause,
      regression_primary_cause: regressionPrimaryCause,
      regression_secondary_cause: regressionSecondaryCause,
      new_edge_flag_triggered: newEdgeFlagTriggered,
      should_have_stayed_standard_mode: shouldHaveStayedStandardMode,
      patched_status: 'patched_in_sprint_v1',
      post_patch_outcome: {
        winner_stability: packet.STABILITY_AUDIT.winner_stability,
        route_stability: packet.STABILITY_AUDIT.route_stability,
        confidence_stability: packet.STABILITY_AUDIT.confidence_stability,
        explanation_drift: packet.STABILITY_AUDIT.explanation_drift,
      },
      subsystem_group: groups,
    });

    console.log(`DIAG ${packet.BASE_CASE_ID}`);
    console.log(`  winner-flip: ${winDiag.reason}`);
    console.log(`  route-flip: ${routeReason}`);
    console.log(`  explanation-drift: ${explReason}`);
    console.log(`  reviewer: scorer_bug=${reviewer.scorer_bug} confidence_bug=${reviewer.confidence_bug} explanation_bug=${reviewer.explanation_bug}`);
    console.log('─'.repeat(88));
  }

  const grouped = {
    scorer_dimension_instability: diagnostics
      .filter((d) => d.subsystem_group.includes('scorer-dimension instability'))
      .map((d) => d.base_case_id),
    route_threshold_instability: diagnostics
      .filter((d) => d.subsystem_group.includes('route-threshold instability'))
      .map((d) => d.base_case_id),
    explanation_layer_instability: diagnostics
      .filter((d) => d.subsystem_group.includes('explanation-layer instability'))
      .map((d) => d.base_case_id),
  };

  const output: DiagnosticOutput = {
    protocol: 'NDS_STABILITY_FAILURE_DIAGNOSTIC_V1',
    generated_at: new Date().toISOString(),
    source_stability_artifact: STABILITY_JSON,
    total_base_cases: allBaseCases.length,
    unstable_base_cases: unstableCases.length,
    diagnostics,
    grouped_failures: grouped,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(output));

  console.log('NDS_STABILITY_FAILURE_DIAGNOSTIC_V1');
  console.log(`  total_base_cases: ${output.total_base_cases}`);
  console.log(`  unstable_base_cases: ${output.unstable_base_cases}`);
  console.log(`  scorer_dimension_instability: ${grouped.scorer_dimension_instability.length}`);
  console.log(`  route_threshold_instability: ${grouped.route_threshold_instability.length}`);
  console.log(`  explanation_layer_instability: ${grouped.explanation_layer_instability.length}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
