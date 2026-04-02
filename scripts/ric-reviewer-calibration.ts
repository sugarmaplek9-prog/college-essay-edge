import fs from 'node:fs';
import path from 'node:path';
import {
  CASE_DIR,
  loadCases,
  runNdsEvaluation,
  type EvaluationCase,
  type NdsEvalRunRecord,
} from '@/lib/ai/evaluation/pack';

type ReviewerId = 'reviewer_alpha' | 'reviewer_beta' | 'reviewer_gamma';

type CalibrationRow = {
  case_id: string;
  reviewer_id: ReviewerId;
  decision: 'approve' | 'approve_with_minor_edits' | 'usable_but_weak' | 'not_usable';
  scores: {
    directional_usefulness: number;
    non_genericness: number;
    actionability: number;
    student_fit: number;
  };
  failure_modes: string[];
  promote_to_gold: boolean;
};

function pickCases(all: EvaluationCase[], count = 15): EvaluationCase[] {
  return all.slice(0, count);
}

function scoreFromPayload(
  payload: Record<string, unknown>,
  reviewer: ReviewerId,
): CalibrationRow['scores'] {
  const bestDirection = (payload.best_direction as Record<string, unknown> | undefined) ?? {};
  const alternatives = Array.isArray(payload.alternatives) ? payload.alternatives.length : 0;
  const anchors = Array.isArray(payload.evidence_anchors) ? payload.evidence_anchors.length : 0;

  const baseDirectional = bestDirection.angle_title ? 4 : 2;
  const baseGeneric = alternatives >= 2 ? 4 : 3;
  const baseActionability = typeof bestDirection.next_move === 'string' && bestDirection.next_move.length > 24 ? 4 : 2;
  const baseFit = anchors > 0 ? 4 : 3;

  const reviewerBias: Record<ReviewerId, number> = {
    reviewer_alpha: 0,
    reviewer_beta: -1,
    reviewer_gamma: 1,
  };

  const delta = reviewerBias[reviewer];

  return {
    directional_usefulness: clamp(baseDirectional + delta),
    non_genericness: clamp(baseGeneric + (reviewer === 'reviewer_beta' ? -1 : 0)),
    actionability: clamp(baseActionability + (reviewer === 'reviewer_gamma' ? 1 : 0)),
    student_fit: clamp(baseFit + (reviewer === 'reviewer_alpha' ? 1 : 0)),
  };
}

function clamp(v: number): number {
  return Math.max(1, Math.min(5, v));
}

function decide(scores: CalibrationRow['scores']): CalibrationRow['decision'] {
  const avg =
    (scores.directional_usefulness +
      scores.non_genericness +
      scores.actionability +
      scores.student_fit) /
    4;
  if (avg >= 4.6) return 'approve';
  if (avg >= 4.0) return 'approve_with_minor_edits';
  if (avg >= 3.0) return 'usable_but_weak';
  return 'not_usable';
}

function inferFailures(scores: CalibrationRow['scores']): string[] {
  const failures: string[] = [];
  if (scores.non_genericness <= 2) failures.push('generic_or_resume_restatement');
  if (scores.actionability <= 2) failures.push('weak_or_non_actionable_direction');
  if (scores.student_fit <= 2) failures.push('misaligned_student_fit');
  if (scores.directional_usefulness <= 2) failures.push('direction_too_vague');
  return failures;
}

async function main(): Promise<void> {
  const all = loadCases(CASE_DIR);
  const selected = pickCases(all, 15);
  const nds = await runNdsEvaluation(selected);

  const reviewers: ReviewerId[] = ['reviewer_alpha', 'reviewer_beta', 'reviewer_gamma'];
  const rows: CalibrationRow[] = [];

  for (const run of nds as NdsEvalRunRecord[]) {
    for (const reviewer of reviewers) {
      const payload = run.artifact_payload as unknown as Record<string, unknown>;
      const scores = scoreFromPayload(payload, reviewer);
      const decision = decide(scores);
      rows.push({
        case_id: run.case_id,
        reviewer_id: reviewer,
        decision,
        scores,
        failure_modes: inferFailures(scores),
        promote_to_gold: decision === 'approve' && scores.non_genericness >= 4 && scores.actionability >= 4,
      });
    }
  }

  const byCase = new Map<string, CalibrationRow[]>();
  for (const row of rows) {
    const bucket = byCase.get(row.case_id) ?? [];
    bucket.push(row);
    byCase.set(row.case_id, bucket);
  }

  const disagreementCount = [...byCase.values()].filter((bucket) => new Set(bucket.map((b) => b.decision)).size > 1).length;
  const disagreementRate = disagreementCount / byCase.size;

  const dimensionAverages = averageDimensions(rows);
  const weakDimensions = Object.entries(dimensionAverages)
    .filter(([, v]) => v < 3.8)
    .sort((a, b) => a[1] - b[1]);

  const failureCounts = new Map<string, number>();
  for (const row of rows) {
    for (const fm of row.failure_modes) {
      failureCounts.set(fm, (failureCounts.get(fm) ?? 0) + 1);
    }
  }
  const recurringFailureModes = [...failureCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  const goldCandidates = [...byCase.entries()]
    .filter(([, bucket]) => bucket.filter((b) => b.promote_to_gold).length >= 2)
    .map(([caseId]) => caseId);

  const report = {
    generated_at: new Date().toISOString(),
    case_count: byCase.size,
    reviewer_count: reviewers.length,
    disagreement_rate: Number(disagreementRate.toFixed(3)),
    weak_dimensions: weakDimensions.map(([name, score]) => ({ dimension: name, avg_score: Number(score.toFixed(2)) })),
    recurring_failure_modes: recurringFailureModes.map(([failure_mode, count]) => ({ failure_mode, count })),
    gold_promotion_candidates: goldCandidates,
    note: 'Calibration uses deterministic reviewer profiles to surface structured disagreement patterns before live reviewer pass.',
  };

  const outDir = path.join(process.cwd(), 'evaluation_outputs');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'ric_reviewer_calibration_pack_v1.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');

  console.log('RIC_CALIBRATION_REPORT', JSON.stringify(report));
  console.log(`Saved ${outPath}`);
}

function averageDimensions(rows: CalibrationRow[]): Record<string, number> {
  const sums: Record<string, number> = {
    directional_usefulness: 0,
    non_genericness: 0,
    actionability: 0,
    student_fit: 0,
  };

  for (const row of rows) {
    sums.directional_usefulness += row.scores.directional_usefulness;
    sums.non_genericness += row.scores.non_genericness;
    sums.actionability += row.scores.actionability;
    sums.student_fit += row.scores.student_fit;
  }

  return {
    directional_usefulness: sums.directional_usefulness / rows.length,
    non_genericness: sums.non_genericness / rows.length,
    actionability: sums.actionability / rows.length,
    student_fit: sums.student_fit / rows.length,
  };
}

main().catch((error) => {
  console.error('RIC_CALIBRATION_FAILED', error);
  process.exit(1);
});
