import type {
  NdsNormalizedContextPack,
  NdsReadinessResult,
  ReadinessReasonCode,
} from '@/types/ai';

function hasMeaningfulStorySignal(contextPack: NdsNormalizedContextPack): boolean {
  return contextPack.story_signals.some((s: { event_summary: string; evidence_strength: 'high' | 'medium' | 'low' }) => {
    if (s.evidence_strength === 'high' || s.evidence_strength === 'medium') return true;
    return s.event_summary.trim().length >= 80;
  });
}

export function evaluateNdsReadiness(
  contextPack: NdsNormalizedContextPack
): NdsReadinessResult {
  const reasons: ReadinessReasonCode[] = [];

  if (contextPack.story_signals.length === 0) {
    reasons.push('NO_STORY_SIGNAL');
  }

  if (!hasMeaningfulStorySignal(contextPack) && contextPack.story_signals.length > 0) {
    reasons.push('THIN_INPUT');
  }

  const draftUsable = contextPack.draft_signals.some(
    (d: { strength: 'high' | 'medium' | 'low' }) => d.strength === 'high' || d.strength === 'medium'
  );

  const storyChangeWeak = contextPack.story_signals.length > 0 && contextPack.story_signals.every(
    (s: { change_signal: string }) => s.change_signal.toLowerCase().includes('limited')
  );
  if (contextPack.story_signals.length > 0 && storyChangeWeak && !draftUsable) {
    reasons.push('NO_CHANGE_SIGNAL');
  }

  if (reasons.length === 0) {
    return {
      readiness_state: 'ready',
      execution_mode: 'standard',
      reasons: ['SUFFICIENT_FOR_STANDARD'],
      recommended_recovery_question_type: null,
    };
  }

  if (contextPack.story_signals.length > 0 || draftUsable) {
    return {
      readiness_state: 'reduced',
      execution_mode: 'reduced_scope',
      reasons: reasons.includes('SUFFICIENT_FOR_REDUCED') ? reasons : [...reasons, 'SUFFICIENT_FOR_REDUCED'],
      recommended_recovery_question_type: 'specificity_gap',
    };
  }

  return {
    readiness_state: 'insufficient_input',
    execution_mode: 'needs_more_input',
    reasons,
    recommended_recovery_question_type: contextPack.story_signals.length === 0 ? 'turning_point' : 'why_change',
  };
}
