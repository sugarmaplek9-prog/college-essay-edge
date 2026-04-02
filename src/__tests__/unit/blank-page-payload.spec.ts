import { describe, expect, it } from 'vitest';
import { buildBlankPagePayload } from '@/lib/fm/buildBlankPagePayload';
import type { BlankPageClassification, BlankPageMode } from '@/types/intake';

function makeClassification(mode: BlankPageMode): BlankPageClassification {
  if (mode === 'too_thin_to_recover') {
    return {
      blank_page_intake_detected: false,
      blank_page_mode: mode,
      blank_page_trigger_signals: ['empty_or_near_empty_input'],
      blank_page_recovery_reason: 'input_too_thin_or_unusable_for_recovery',
      blank_page_confidence: 'high',
      top_level_blank_page_route: 'true_block',
    };
  }

  return {
    blank_page_intake_detected: true,
    blank_page_mode: mode,
    blank_page_trigger_signals: ['topic_only_intent'],
    blank_page_recovery_reason: `recoverable_${mode}`,
    blank_page_confidence: 'medium',
    top_level_blank_page_route: 'needs_structured_blank_page_intake',
  };
}

describe('buildBlankPagePayload', () => {
  const bannedPatterns = [
    /tell me more/i,
    /can you elaborate/i,
    /what are you passionate about/i,
    /what makes you unique/i,
  ];

  it.each([
    ['topic_probe', 'missing_moment'],
    ['theme_probe', 'missing_lived_evidence'],
    ['activity_probe', 'missing_personal_center'],
    ['scope_reframe', 'missing_scope_frame'],
    ['blank_page_discovery', 'missing_topic_candidate'],
  ] as const)('builds typed payload for %s', (mode, expectedMissingSignal) => {
    const payload = buildBlankPagePayload({
      rawInput: 'Can I write about robotics for my essay?',
      blankPageClassification: makeClassification(mode),
    });

    expect(payload.product_mode).toBe('blank_page_intake');
    expect(payload.blank_page_mode).toBe(mode);
    expect(payload.recovery_question_primary.length).toBeGreaterThan(20);
    expect(payload.recovery_question_primary.endsWith('?')).toBe(true);
    expect(payload.missing_signal_type).toBe(expectedMissingSignal);
    expect(payload.why_not_ready_for_direction.length).toBeGreaterThan(12);
    expect(payload.selected_template_id.length).toBeGreaterThan(8);

    for (const pattern of bannedPatterns) {
      expect(payload.recovery_question_primary).not.toMatch(pattern);
    }
  });

  it('is deterministic for same input and mode', () => {
    const classification = makeClassification('theme_probe');
    const rawInput = 'I want to show leadership.';

    const first = buildBlankPagePayload({ rawInput, blankPageClassification: classification });
    const second = buildBlankPagePayload({ rawInput, blankPageClassification: classification });

    expect(first.recovery_question_primary).toBe(second.recovery_question_primary);
    expect(first.recovery_question_secondary).toBe(second.recovery_question_secondary);
    expect(first.selected_template_id).toBe(second.selected_template_id);
  });

  it('returns bounded fallback behavior for too_thin_to_recover', () => {
    const payload = buildBlankPagePayload({
      rawInput: 'hi',
      blankPageClassification: makeClassification('too_thin_to_recover'),
    });

    expect(payload.blank_page_mode).toBe('too_thin_to_recover');
    expect(payload.missing_signal_type).toBe('missing_recoverable_signal');
    expect(payload.next_step_type).toBe('provide_more_concrete_starting_point');
    expect(payload.recovery_question_primary.length).toBeGreaterThan(16);
    expect(payload.question_family_primary).toBeNull();
  });
});
