import type { NdsModuleExecutionInput, NdsNormalizedContextPack, NdsPayload } from '@/types/ai';

export interface NdsEvalDimensionScores {
  groundedness: number;
  specificity: number;
  decisiveness: number;
  actionability: number;
}

export interface NdsEvalScoreResult {
  total: number;
  dimensions: NdsEvalDimensionScores;
  notes: string[];
}

export function buildFreeAiBaselinePayload(
  contextPack: NdsNormalizedContextPack,
  executionMode: NdsModuleExecutionInput['execution_mode']
): NdsPayload {
  if (executionMode === 'needs_more_input' || contextPack.story_signals.length === 0) {
    return {
      status: 'needs_more_input',
      best_direction: null,
      alternatives: [],
      evidence_anchors: [],
      depth_signals: {
        detected_tension: null,
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: 'Can you share a meaningful personal experience?',
    };
  }

  return {
    status: 'success',
    best_direction: {
      id: 'direction_1',
      angle_title: 'Direction 1',
      core_claim: 'Focus on a meaningful experience and what you learned.',
      why_this_is_the_real_story: 'It can be broadly compelling for admissions readers.',
      what_it_reveals_about_the_student: 'Shows persistence and maturity.',
      why_it_beats_the_obvious_angle: 'This angle appears strong at a high level.',
      main_risk_if_written_poorly: 'May feel generic.',
      next_move: 'Draft a personal statement paragraph.',
    },
    alternatives: [
      {
        id: 'direction_2',
        angle_title: 'Direction 2',
        what_this_angle_would_focus_on: 'A different meaningful experience with similar lessons.',
        why_it_is_weaker: 'Less compelling overall.',
        failure_mode: 'Could be too broad.',
      },
    ],
    evidence_anchors: [],
    depth_signals: {
      detected_tension: null,
      detected_shift: null,
      obvious_but_weaker_angle: null,
      essay_opportunity: null,
    },
    recovery_question: null,
  };
}

function scoreGroundedness(payload: NdsPayload): number {
  if (payload.status === 'needs_more_input') return 6;
  const anchors = payload.evidence_anchors.length;
  if (anchors >= 2) return 10;
  if (anchors === 1) return 8;
  return 3;
}

function scoreSpecificity(payload: NdsPayload): number {
  if (payload.status === 'needs_more_input') return 5;
  const title = payload.best_direction.angle_title.toLowerCase();
  const claimLen = payload.best_direction.core_claim.length;

  const genericTitle = /direction\s*\d|option\s*\d|essay direction/.test(title);
  if (genericTitle) return Math.min(4, Math.floor(claimLen / 30));

  if (claimLen >= 120) return 9;
  if (claimLen >= 80) return 8;
  if (claimLen >= 45) return 6;
  return 4;
}

function scoreDecisiveness(payload: NdsPayload): number {
  if (payload.status === 'needs_more_input') return 7;
  const depthSignalsPresent = Object.values(payload.depth_signals).some(
    (v) => typeof v === 'string' && v.trim().length > 0
  );
  if (payload.alternatives.length >= 2 && depthSignalsPresent) return 9;
  if (payload.alternatives.length === 1 && depthSignalsPresent) return 8;
  return 6;
}

function scoreActionability(payload: NdsPayload): number {
  if (payload.status === 'needs_more_input') {
    return payload.recovery_question.length > 20 ? 8 : 5;
  }

  const nextMoveLen = payload.best_direction.next_move.length;
  if (nextMoveLen >= 80) return 9;
  if (nextMoveLen >= 45) return 8;
  if (nextMoveLen >= 25) return 7;
  return 5;
}

export function scoreNdsPayload(payload: NdsPayload): NdsEvalScoreResult {
  const dimensions: NdsEvalDimensionScores = {
    groundedness: scoreGroundedness(payload),
    specificity: scoreSpecificity(payload),
    decisiveness: scoreDecisiveness(payload),
    actionability: scoreActionability(payload),
  };

  const totalRaw =
    dimensions.groundedness * 0.35 +
    dimensions.specificity * 0.30 +
    dimensions.decisiveness * 0.20 +
    dimensions.actionability * 0.15;

  const total = Math.round(totalRaw * 10) / 10;
  const notes: string[] = [];

  if (dimensions.groundedness < 6) notes.push('low_groundedness');
  if (dimensions.specificity < 6) notes.push('low_specificity');
  if (dimensions.actionability < 6) notes.push('low_actionability');

  return { total, dimensions, notes };
}
