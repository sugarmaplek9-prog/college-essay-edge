import fs from 'node:fs';
import path from 'node:path';

const DECISION_ORDER: Record<string, number> = {
  'approve': 5,
  'approve with minor edits': 4,
  'usable but weak': 3,
  'not usable': 2,
  'unsafe or off-policy': 1,
};

const SCORE_DIMENSIONS = [
  'authenticity_preservation',
  'narrative_specificity',
  'directional_usefulness',
  'non_genericness',
  'strategic_differentiation',
  'student_fit',
  'clarity_of_recommendation',
  'evidence_grounded_interpretation',
  'actionability',
  'safety_policy_compliance',
] as const;

type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];

type FailureTag = {
  tag: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
};

type ReviewRow = {
  reviewer_id: string;
  case_id: string;
  decision_category: string;
  scores: Record<ScoreDimension, number>;
  failure_modes: FailureTag[];
  rationale: string;
  gold_candidate: boolean;
  generalizable_learning: boolean;
};

async function main(): Promise<void> {
  const dir = path.join(process.cwd(), 'evaluation', 'intake', 'ric_human_reviews');
  const files = fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.csv'))
        .filter((f) => !f.startsWith('reviewer_template'))
    : [];

  if (files.length === 0) {
    console.log('RIC_HUMAN_AGGREGATE_NO_DATA', JSON.stringify({ message: 'No reviewer CSV files found', dir }));
    return;
  }

  const rows: ReviewRow[] = [];
  const invalidRows: Array<{ file: string; rowIndex: number; issues: string[] }> = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8').trim();
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) continue;

    const header = splitCsv(lines[0]);
    const column = new Map<string, number>(header.map((name, idx) => [name.trim(), idx]));

    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      const cols = splitCsv(line);

      const issues: string[] = [];
      const reviewer_id = getCol(cols, column, 'reviewer_id');
      const case_id = getCol(cols, column, 'case_id');
      const decision_category = getCol(cols, column, 'decision_category').toLowerCase();

      if (!reviewer_id) issues.push('missing reviewer_id');
      if (!case_id) issues.push('missing case_id');
      if (!(decision_category in DECISION_ORDER)) issues.push('invalid decision_category');

      const scores = {} as Record<ScoreDimension, number>;
      for (const dim of SCORE_DIMENSIONS) {
        const raw = getCol(cols, column, dim);
        const score = Number(raw);
        if (!Number.isInteger(score) || score < 1 || score > 5) {
          issues.push(`invalid ${dim}`);
        }
        scores[dim] = score;
      }

      const failure_modes = parseFailureModes(getCol(cols, column, 'failure_modes'));
      const rationale = getCol(cols, column, 'rationale');
      const gold_candidate = parseBool(getCol(cols, column, 'gold_candidate'));
      const generalizable_learning = parseBool(getCol(cols, column, 'generalizable_learning'));

      if (rationale.trim().length === 0) {
        issues.push('missing rationale');
      }

      if (issues.length > 0) {
        invalidRows.push({ file, rowIndex: i + 1, issues });
        continue;
      }

      rows.push({
        reviewer_id,
        case_id,
        decision_category,
        scores,
        failure_modes,
        rationale,
        gold_candidate,
        generalizable_learning,
      });
    }
  }

  if (invalidRows.length > 0) {
    const outPath = path.join(process.cwd(), 'evaluation_outputs', 'ric_human_calibration_invalid_rows_v1.json');
    fs.writeFileSync(outPath, JSON.stringify({ generated_at: new Date().toISOString(), invalidRows }, null, 2), 'utf-8');
    console.error('RIC_HUMAN_AGGREGATE_INVALID_ROWS', JSON.stringify({ invalidCount: invalidRows.length, outPath }));
    process.exit(1);
  }

  const byCase = new Map<string, ReviewRow[]>();
  for (const row of rows) {
    const bucket = byCase.get(row.case_id) ?? [];
    bucket.push(row);
    byCase.set(row.case_id, bucket);
  }

  const disagreementRate = calcDecisionDisagreementRate(byCase);
  const unstableDimensions = calcDimensionInstability(byCase);
  const recurringFailureModes = calcFailureRecurrence(rows);
  const failureModeDisagreement = calcFailureModeDisagreement(byCase);
  const goldConvergence = calcGoldConvergence(byCase);
  const rationaleQuality = calcRationaleQuality(rows);
  const adjudicationQueue = buildAdjudicationQueue(byCase);
  const passDecision = derivePassDecision({
    disagreementRate,
    unstableDimensions,
    failureModeDisagreementRate: failureModeDisagreement.case_level_disagreement_rate,
    rationaleLowRate: rationaleQuality.low_quality_rate,
    goldAgreementRate: goldConvergence.gold_agreement_rate,
  });

  const structured = {
    generated_at: new Date().toISOString(),
    reviewer_file_count: files.length,
    reviewer_ids: [...new Set(rows.map((r) => r.reviewer_id))],
    review_row_count: rows.length,
    case_count: byCase.size,
    case_ids: [...byCase.keys()],
    reviewer_decisions: rows.map((r) => ({
      reviewer_id: r.reviewer_id,
      case_id: r.case_id,
      decision_category: r.decision_category,
      scores: r.scores,
      failure_modes: r.failure_modes,
      gold_candidate: r.gold_candidate,
      generalizable_learning: r.generalizable_learning,
      rationale: r.rationale,
    })),
    measurements: {
      disagreement_rate: Number(disagreementRate.toFixed(3)),
      unstable_dimensions: unstableDimensions,
      failure_mode_recurrence: recurringFailureModes,
      failure_mode_disagreement: failureModeDisagreement,
      gold_candidate_convergence: goldConvergence,
      rationale_quality: rationaleQuality,
    },
    adjudication: {
      triggered_case_count: adjudicationQueue.length,
      triggered_cases: adjudicationQueue,
    },
    run_decision: passDecision,
  };

  const report = {
    generated_at: structured.generated_at,
    packet_composition: {
      reviewer_file_count: files.length,
      reviewer_ids: structured.reviewer_ids,
      case_count: byCase.size,
      case_ids: [...byCase.keys()],
    },
    disagreement_rate: Number(disagreementRate.toFixed(3)),
    unstable_dimensions: unstableDimensions,
    recurring_failure_modes: recurringFailureModes,
    failure_mode_disagreement: failureModeDisagreement,
    gold_candidate_observations: goldConvergence,
    adjudication_notes: {
      triggered_case_count: adjudicationQueue.length,
      triggered_cases: adjudicationQueue,
    },
    pass_fail_result: passDecision,
    required_rubric_changes: suggestRubricChanges(unstableDimensions, failureModeDisagreement, rationaleQuality),
  };

  const outDir = path.join(process.cwd(), 'evaluation_outputs');
  fs.mkdirSync(outDir, { recursive: true });

  const structuredPath = path.join(outDir, 'ric_reviewer_calibration_human_v1.json');
  const reportPath = path.join(outDir, 'RIC_REVIEWER_CALIBRATION_REVIEW_V1.md');

  fs.writeFileSync(structuredPath, JSON.stringify(structured, null, 2), 'utf-8');
  fs.writeFileSync(reportPath, toMarkdownReport(report), 'utf-8');

  const shouldWriteClarifications = passDecision.decision !== 'A_pass';
  let clarificationsPath: string | null = null;
  if (shouldWriteClarifications) {
    clarificationsPath = path.join(outDir, 'RIC_REVIEW_RUBRIC_CLARIFICATIONS_V1.md');
    fs.writeFileSync(
      clarificationsPath,
      toClarificationsMarkdown(report.required_rubric_changes as string[], passDecision),
      'utf-8',
    );
  }

  console.log('RIC_HUMAN_CALIBRATION_REPORT', JSON.stringify(report));
  console.log(
    'RIC_HUMAN_CALIBRATION_ARTIFACTS',
    JSON.stringify({ structuredPath, reportPath, clarificationsPath }),
  );
}

function getCol(cols: string[], column: Map<string, number>, name: string): string {
  const idx = column.get(name);
  if (idx === undefined) return '';
  return (cols[idx] ?? '').trim();
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

function parseFailureModes(raw: string): FailureTag[] {
  return raw
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [left, right] = part.split(':').map((s) => s.trim());
      const severity = right === 'low' || right === 'medium' || right === 'high' || right === 'critical' ? right : 'unknown';
      return { tag: left || part, severity };
    });
}

function parseBool(raw: string): boolean {
  return raw.toLowerCase() === 'true';
}

function calcDecisionDisagreementRate(byCase: Map<string, ReviewRow[]>): number {
  const cases = [...byCase.values()];
  if (cases.length === 0) return 0;
  const disagreed = cases.filter((rows) => {
    const scores = rows.map((r) => DECISION_ORDER[r.decision_category] ?? 0);
    if (scores.length < 2) return false;
    const spread = Math.max(...scores) - Math.min(...scores);
    return spread >= 2 || scores.includes(1);
  }).length;
  return disagreed / cases.length;
}

function calcDimensionInstability(
  byCase: Map<string, ReviewRow[]>,
): Array<{ dimension: string; avg_variance: number; large_disagreement_frequency: number }> {
  return SCORE_DIMENSIONS
    .map((dim) => {
      const variances: number[] = [];
      let large = 0;
      let observed = 0;

      for (const rows of byCase.values()) {
        const values = rows.map((r) => r.scores[dim]).filter((v) => Number.isFinite(v));
        if (values.length < 2) continue;
        const spread = Math.max(...values) - Math.min(...values);
        variances.push(spread);
        observed += 1;
        if (spread >= 2) large += 1;
      }

      const avg = variances.length ? variances.reduce((a, b) => a + b, 0) / variances.length : 0;
      return {
        dimension: dim,
        avg_variance: Number(avg.toFixed(3)),
        large_disagreement_frequency: observed === 0 ? 0 : Number((large / observed).toFixed(3)),
      };
    })
    .sort((a, b) => b.avg_variance - a.avg_variance);
}

function calcFailureRecurrence(rows: ReviewRow[]): Array<{ failure_tag: string; count: number; severity_breakdown: Record<string, number> }> {
  const counts = new Map<string, { count: number; severity: Map<string, number> }>();

  for (const row of rows) {
    for (const failure of row.failure_modes) {
      const item = counts.get(failure.tag) ?? { count: 0, severity: new Map<string, number>() };
      item.count += 1;
      item.severity.set(failure.severity, (item.severity.get(failure.severity) ?? 0) + 1);
      counts.set(failure.tag, item);
    }
  }

  return [...counts.entries()]
    .map(([failure_tag, item]) => ({
      failure_tag,
      count: item.count,
      severity_breakdown: Object.fromEntries(item.severity.entries()),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function calcFailureModeDisagreement(byCase: Map<string, ReviewRow[]>): {
  case_level_disagreement_rate: number;
  most_inconsistent_failure_modes: Array<{ failure_tag: string; disagreement_count: number }>;
} {
  let disagree = 0;
  const tagDisagreeCount = new Map<string, number>();

  for (const rows of byCase.values()) {
    if (rows.length < 2) continue;

    const reviewerTags = rows.map((r) => new Set(r.failure_modes.map((f) => f.tag)));
    const union = new Set<string>();
    const intersection = new Set<string>(reviewerTags[0]);

    reviewerTags.forEach((set) => {
      set.forEach((tag) => union.add(tag));
    });

    for (const tag of [...intersection]) {
      if (!reviewerTags.every((set) => set.has(tag))) {
        intersection.delete(tag);
      }
    }

    const jaccard = union.size === 0 ? 1 : intersection.size / union.size;
    if (jaccard < 1) {
      disagree += 1;
      for (const tag of union) {
        const seenBy = reviewerTags.filter((set) => set.has(tag)).length;
        if (seenBy > 0 && seenBy < reviewerTags.length) {
          tagDisagreeCount.set(tag, (tagDisagreeCount.get(tag) ?? 0) + 1);
        }
      }
    }
  }

  return {
    case_level_disagreement_rate: byCase.size === 0 ? 0 : Number((disagree / byCase.size).toFixed(3)),
    most_inconsistent_failure_modes: [...tagDisagreeCount.entries()]
      .map(([failure_tag, disagreement_count]) => ({ failure_tag, disagreement_count }))
      .sort((a, b) => b.disagreement_count - a.disagreement_count)
      .slice(0, 10),
  };
}

function calcGoldConvergence(byCase: Map<string, ReviewRow[]>): {
  both_yes_rate: number;
  gold_agreement_rate: number;
  any_gold_nomination_rate: number;
} {
  const cases = [...byCase.values()];
  if (cases.length === 0) {
    return { both_yes_rate: 0, gold_agreement_rate: 0, any_gold_nomination_rate: 0 };
  }

  const bothYes = cases.filter((rows) => rows.length >= 2 && rows.every((r) => r.gold_candidate)).length;
  const agreement = cases.filter((rows) => {
    const votes = rows.map((r) => r.gold_candidate);
    return votes.every((v) => v === true) || votes.every((v) => v === false);
  }).length;
  const anyNom = cases.filter((rows) => rows.some((r) => r.gold_candidate)).length;

  return {
    both_yes_rate: Number((bothYes / cases.length).toFixed(3)),
    gold_agreement_rate: Number((agreement / cases.length).toFixed(3)),
    any_gold_nomination_rate: Number((anyNom / cases.length).toFixed(3)),
  };
}

function calcRationaleQuality(rows: ReviewRow[]): {
  average_word_count: number;
  low_quality_count: number;
  low_quality_rate: number;
} {
  if (rows.length === 0) return { average_word_count: 0, low_quality_count: 0, low_quality_rate: 0 };

  const wordsPerReview = rows.map((row) => row.rationale.trim().split(/\s+/).filter(Boolean).length);
  const lowQualityCount = wordsPerReview.filter((count) => count < 12).length;

  return {
    average_word_count: Number((wordsPerReview.reduce((a, b) => a + b, 0) / wordsPerReview.length).toFixed(2)),
    low_quality_count: lowQualityCount,
    low_quality_rate: Number((lowQualityCount / rows.length).toFixed(3)),
  };
}

function buildAdjudicationQueue(byCase: Map<string, ReviewRow[]>): Array<{ case_id: string; triggers: string[] }> {
  const queue: Array<{ case_id: string; triggers: string[] }> = [];

  for (const [case_id, rows] of byCase.entries()) {
    if (rows.length < 2) continue;

    const triggers: string[] = [];
    const decisionScores = rows.map((r) => DECISION_ORDER[r.decision_category] ?? 0);
    const decisionSpread = Math.max(...decisionScores) - Math.min(...decisionScores);

    if (decisionSpread >= 2 || decisionScores.includes(1)) {
      triggers.push('decision_band_disagreement');
    }

    const keyDims: ScoreDimension[] = ['non_genericness', 'student_fit', 'actionability', 'strategic_differentiation'];
    const keyLargeVariance = keyDims.some((dim) => {
      const vals = rows.map((r) => r.scores[dim]);
      return Math.max(...vals) - Math.min(...vals) >= 2;
    });
    if (keyLargeVariance) {
      triggers.push('large_dimension_variance');
    }

    const goldVotes = rows.map((r) => r.gold_candidate);
    if (!(goldVotes.every((v) => v) || goldVotes.every((v) => !v))) {
      triggers.push('gold_disagreement');
    }

    const safetyVals = rows.map((r) => r.scores.safety_policy_compliance);
    if (Math.max(...safetyVals) - Math.min(...safetyVals) >= 2 || decisionScores.includes(1)) {
      triggers.push('safety_disagreement');
    }

    const reviewerTags = rows.map((r) => new Set(r.failure_modes.map((f) => f.tag)));
    const union = new Set<string>();
    reviewerTags.forEach((s) => s.forEach((t) => union.add(t)));
    const allAgreeOnTags = [...union].every((tag) => reviewerTags.every((set) => set.has(tag)));
    if (!allAgreeOnTags) {
      triggers.push('taxonomy_disagreement');
    }

    if (triggers.length > 0) {
      queue.push({ case_id, triggers });
    }
  }

  return queue;
}

function derivePassDecision(input: {
  disagreementRate: number;
  unstableDimensions: Array<{ dimension: string; avg_variance: number; large_disagreement_frequency: number }>;
  failureModeDisagreementRate: number;
  rationaleLowRate: number;
  goldAgreementRate: number;
}): {
  decision: 'A_pass' | 'B_conditional_pass' | 'C_fail';
  rationale: string[];
} {
  const unstableMajor = input.unstableDimensions.filter((d) => d.large_disagreement_frequency >= 0.4).length;

  if (
    input.disagreementRate > 0.65 ||
    input.rationaleLowRate > 0.35 ||
    unstableMajor >= 5 ||
    input.goldAgreementRate < 0.35
  ) {
    return {
      decision: 'C_fail',
      rationale: [
        'Reviewer judgments are not stable enough for proof gating.',
        'Run must pause for rubric/taxonomy clarification and re-calibration.',
      ],
    };
  }

  if (
    input.disagreementRate > 0.4 ||
    unstableMajor >= 2 ||
    input.failureModeDisagreementRate > 0.35 ||
    input.rationaleLowRate > 0.2
  ) {
    return {
      decision: 'B_conditional_pass',
      rationale: [
        'Calibration produced usable signals but has focal instability.',
        'Proceed only after clarifying unstable dimensions/taxonomy areas.',
      ],
    };
  }

  return {
    decision: 'A_pass',
    rationale: [
      'Reviewer judgment is stable and interpretable for this packet.',
      'Proceed to first human-reviewed proof packet.',
    ],
  };
}

function suggestRubricChanges(
  unstableDimensions: Array<{ dimension: string; avg_variance: number; large_disagreement_frequency: number }>,
  failureModeDisagreement: {
    case_level_disagreement_rate: number;
    most_inconsistent_failure_modes: Array<{ failure_tag: string; disagreement_count: number }>;
  },
  rationaleQuality: { average_word_count: number; low_quality_count: number; low_quality_rate: number },
): string[] {
  const changes: string[] = [];

  const topUnstable = unstableDimensions.filter((d) => d.large_disagreement_frequency >= 0.3).slice(0, 3);
  for (const dim of topUnstable) {
    changes.push(`Clarify scoring anchors/examples for ${dim.dimension} (high disagreement frequency).`);
  }

  if (failureModeDisagreement.case_level_disagreement_rate > 0.35) {
    changes.push('Add boundary examples for overlapping failure tags to reduce taxonomy disagreement.');
  }

  if (failureModeDisagreement.most_inconsistent_failure_modes.length > 0) {
    const top = failureModeDisagreement.most_inconsistent_failure_modes[0].failure_tag;
    changes.push(`Define explicit inclusion/exclusion criteria for failure tag: ${top}.`);
  }

  if (rationaleQuality.low_quality_rate > 0.2) {
    changes.push('Require minimum rationale specificity rubric (scene evidence + decision reason + risk).');
  }

  if (changes.length === 0) {
    changes.push('No rubric changes required for this packet.');
  }

  return changes;
}

function toMarkdownReport(report: {
  generated_at: string;
  packet_composition: Record<string, unknown>;
  disagreement_rate: number;
  unstable_dimensions: Array<{ dimension: string; avg_variance: number; large_disagreement_frequency: number }>;
  recurring_failure_modes: Array<{ failure_tag: string; count: number; severity_breakdown: Record<string, number> }>;
  failure_mode_disagreement: {
    case_level_disagreement_rate: number;
    most_inconsistent_failure_modes: Array<{ failure_tag: string; disagreement_count: number }>;
  };
  gold_candidate_observations: {
    both_yes_rate: number;
    gold_agreement_rate: number;
    any_gold_nomination_rate: number;
  };
  adjudication_notes: { triggered_case_count: number; triggered_cases: Array<{ case_id: string; triggers: string[] }> };
  pass_fail_result: { decision: 'A_pass' | 'B_conditional_pass' | 'C_fail'; rationale: string[] };
  required_rubric_changes: string[];
}): string {
  const unstableTop = report.unstable_dimensions
    .slice(0, 5)
    .map((d) => `- ${d.dimension}: avg_variance=${d.avg_variance}, large_disagreement_frequency=${d.large_disagreement_frequency}`)
    .join('\n');

  const failureTop = report.recurring_failure_modes
    .slice(0, 10)
    .map((f) => `- ${f.failure_tag}: ${f.count}`)
    .join('\n');

  const adjudicationTop = report.adjudication_notes.triggered_cases
    .slice(0, 20)
    .map((c) => `- ${c.case_id}: ${c.triggers.join(', ')}`)
    .join('\n');

  const requiredChanges = report.required_rubric_changes.map((c) => `- ${c}`).join('\n');
  const decisionRationale = report.pass_fail_result.rationale.map((r) => `- ${r}`).join('\n');

  return [
    '# RIC_REVIEWER_CALIBRATION_REVIEW_V1',
    '',
    `Generated: ${report.generated_at}`,
    '',
    '## Packet composition',
    '',
    `- ${JSON.stringify(report.packet_composition)}`,
    '',
    '## Reviewer stability and disagreement',
    '',
    `- overall disagreement rate: ${report.disagreement_rate}`,
    '',
    '## Unstable dimensions',
    '',
    unstableTop || '- none',
    '',
    '## Recurring failure modes',
    '',
    failureTop || '- none',
    '',
    '## Failure mode disagreement',
    '',
    `- case-level disagreement rate: ${report.failure_mode_disagreement.case_level_disagreement_rate}`,
    '',
    '## Gold-candidate observations',
    '',
    `- both yes rate: ${report.gold_candidate_observations.both_yes_rate}`,
    `- gold agreement rate: ${report.gold_candidate_observations.gold_agreement_rate}`,
    `- any nomination rate: ${report.gold_candidate_observations.any_gold_nomination_rate}`,
    '',
    '## Adjudication notes',
    '',
    `- triggered case count: ${report.adjudication_notes.triggered_case_count}`,
    adjudicationTop || '- none',
    '',
    '## Pass/fail result',
    '',
    `- decision: ${report.pass_fail_result.decision}`,
    decisionRationale,
    '',
    '## Required rubric changes',
    '',
    requiredChanges,
    '',
  ].join('\n');
}

function toClarificationsMarkdown(
  clarifications: string[],
  decision: { decision: 'A_pass' | 'B_conditional_pass' | 'C_fail'; rationale: string[] },
): string {
  const lines = clarifications.map((c) => `- ${c}`).join('\n');
  const rationale = decision.rationale.map((r) => `- ${r}`).join('\n');
  return [
    '# RIC_REVIEW_RUBRIC_CLARIFICATIONS_V1',
    '',
    `Calibration decision: ${decision.decision}`,
    '',
    'Decision rationale:',
    rationale,
    '',
    'Required clarifications before next packet:',
    lines || '- none',
    '',
  ].join('\n');
}

function calcFailureClusters(rows: ReviewRow[]): Array<{ failure_tag: string; count: number }> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const failure of row.failure_modes) {
      counts.set(failure.tag, (counts.get(failure.tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([failure_tag, count]) => ({ failure_tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

main().catch((error) => {
  console.error('RIC_HUMAN_AGGREGATE_FAILED', error);
  process.exit(1);
});
