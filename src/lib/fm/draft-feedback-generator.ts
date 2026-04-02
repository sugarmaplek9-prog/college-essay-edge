import type { IntakeIntelligenceObject, NarrativePattern } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';
import { getDominantTurningPoint, getDominantScene } from '@/lib/fm/case-state';

export interface DraftFeedbackInsight {
  lineText: string;
  verdict: 'keep' | 'strengthen' | 'rethink';
  reason: string;
  suggestion?: string;
}

/**
 * Analyzes student draft and generates model-informed feedback based on:
 * - Narrative pattern detected
 * - Dominant turning point/scene from case state
 * - Signal strength (determines depth of feedback)
 *
 * Falls back to generic guidance if draft is too short or pattern unclear.
 */
export function generateModelInformedFeedback(
  draftText: string,
  pattern: NarrativePattern,
  caseState: SessionCaseState | null,
  signalStrength: 'high' | 'medium' | 'low' | 'none'
): DraftFeedbackInsight[] {
  if (!draftText || draftText.trim().length < 40) {
    return [];
  }

  const lines = draftText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const scene = caseState ? getDominantScene(caseState) : null;

  const feedback: DraftFeedbackInsight[] = [];

  // Pattern-specific feedback rules
  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i];

    // Check for abstract opening (weakness across all patterns)
    if (
      i === 0 &&
      /^(I|we|my|our|the|when|if|after|before)\s+(have|had|realized|learned|understood|discovered|felt|saw|noticed|understood)/i.test(
        line
      )
    ) {
      feedback.push({
        lineText: line,
        verdict: 'rethink',
        reason: 'Starts with the lesson instead of the moment. Move the scene up.',
        suggestion: 'Begin with a concrete detail or action instead.',
      });
      continue;
    }

    // Check for concrete signal usage (strength)
    if (turning && line.toLowerCase().includes(turning.toLowerCase().slice(0, 20))) {
      feedback.push({
        lineText: line,
        verdict: 'keep',
        reason: 'You\'ve anchored to the turning point. This is strong.',
      });
      continue;
    }

    if (scene && line.toLowerCase().includes(scene.toLowerCase().slice(0, 20))) {
      feedback.push({
        lineText: line,
        verdict: 'keep',
        reason: 'You\'re showing the scene. Good foundation.',
      });
      continue;
    }

    // Pattern-specific checks
    if (pattern === 'usefulness_vs_intention') {
      if (
        /\b(help|wanted|tried|intended|meant|supposed)\b/i.test(line) &&
        !/\b(but|however|though|yet|instead|actually)\b/i.test(line)
      ) {
        feedback.push({
          lineText: line,
          verdict: 'strengthen',
          reason: 'You mention the intention, but show the gap. What happened instead?',
          suggestion: 'Add what actually happened or what was needed.',
        });
        continue;
      }
    }

    if (pattern === 'responsibility_shift') {
      if (/\b(chose|decided|made|picked|realized|understood)\b/i.test(line)) {
        feedback.push({
          lineText: line,
          verdict: 'keep',
          reason: 'You\'re showing a real choice. This grounds responsibility.',
        });
        continue;
      }
    }

    if (
      pattern === 'conflict_reframe' &&
      /\b(disagreed|argued|fought|conflicted|opposed)\b/i.test(line)
    ) {
      feedback.push({
        lineText: line,
        verdict: 'strengthen',
        reason: 'Show the conflict, but move quickly to what you learned. Keep it brief.',
      });
      continue;
    }
  }

  // If no detailed feedback found, return empty (will fall back to generic guidance)
  return feedback;
}

/**
 * Determines if draft is substantial enough for model-informed feedback
 */
export function isDraftSubstantialEnoughForFeedback(draftText: string): boolean {
  const wordCount = draftText.trim().split(/\s+/).length;
  return wordCount >= 30;
}
