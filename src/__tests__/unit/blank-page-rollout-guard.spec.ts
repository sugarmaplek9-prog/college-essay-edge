import { describe, expect, it } from 'vitest';
import type { BlankPageClassification } from '@/types/intake';
import { evaluateBlankPageRollout, getBlankPageRolloutConfig } from '@/lib/release/blankPageRolloutGuard';

const baseClassification: BlankPageClassification = {
  blank_page_intake_detected: true,
  blank_page_mode: 'topic_probe',
  blank_page_trigger_signals: ['topic_only_intent'],
  blank_page_recovery_reason: 'recoverable_topic_probe',
  blank_page_confidence: 'high',
  top_level_blank_page_route: 'needs_structured_blank_page_intake',
};

describe('blank page rollout guard', () => {
  it('is safe default-off when env is absent', () => {
    const config = getBlankPageRolloutConfig({});
    expect(config.enabled).toBe(false);
  });

  it('falls back to clarification when rollout is disabled', () => {
    const decision = evaluateBlankPageRollout({
      requestedMode: 'blank_page_intake',
      blankPageClassification: baseClassification,
      environment: 'production',
      env: {},
    });

    expect(decision.activateBlankPageLane).toBe(false);
    expect(decision.effectiveMode).toBe('clarification');
    expect(decision.reason).toBe('rollout_disabled');
  });

  it('activates when config and classification satisfy narrow conditions', () => {
    const decision = evaluateBlankPageRollout({
      requestedMode: 'blank_page_intake',
      blankPageClassification: baseClassification,
      environment: 'production',
      env: {
        BLANK_PAGE_ROLLOUT_ENABLED: 'true',
        BLANK_PAGE_ROLLOUT_ALLOWED_MODES: 'topic_probe,theme_probe',
        BLANK_PAGE_ROLLOUT_MIN_CONFIDENCE: 'medium',
        BLANK_PAGE_ROLLOUT_ALLOWED_ENVS: 'production',
      },
    });

    expect(decision.activateBlankPageLane).toBe(true);
    expect(decision.effectiveMode).toBe('blank_page_intake');
    expect(decision.reason).toBe('activated');
  });

  it('blocks activation when confidence is below floor', () => {
    const decision = evaluateBlankPageRollout({
      requestedMode: 'blank_page_intake',
      blankPageClassification: {
        ...baseClassification,
        blank_page_confidence: 'low',
      },
      environment: 'production',
      env: {
        BLANK_PAGE_ROLLOUT_ENABLED: 'true',
        BLANK_PAGE_ROLLOUT_ALLOWED_MODES: 'topic_probe',
        BLANK_PAGE_ROLLOUT_MIN_CONFIDENCE: 'high',
        BLANK_PAGE_ROLLOUT_ALLOWED_ENVS: 'production',
      },
    });

    expect(decision.activateBlankPageLane).toBe(false);
    expect(decision.reason).toBe('confidence_below_minimum');
  });
});
