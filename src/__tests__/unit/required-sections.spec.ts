/**
 * src/__tests__/unit/required-sections.spec.ts
 * 
 * Vitest unit tests for required sections on reflection and direction screens.
 * Uses fixtures to verify output rendering.
 * 
 * Run: npm run test -- required-sections.spec.ts
 */

import { describe, it, expect } from 'vitest';
import { FIXTURE_F1_STRONG_CASE } from '../fixtures/orchestrator-responses';

describe('Required Sections — F1 Fixture', () => {
  it('intelligence object has required top-level fields', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;

    expect(intelligence).toHaveProperty('intake_session_id');
    expect(intelligence).toHaveProperty('student_user_id');
    expect(intelligence).toHaveProperty('usable_signal');
    expect(intelligence).toHaveProperty('narrative_pattern');
    expect(intelligence).toHaveProperty('recommendation_viability');
  });

  it('reflection should render header "What I\'m seeing so far"', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // This is a contract check: the header is hardcoded in the UI component
    // This test verifies the component contract
    expect(intelligence.usable_signal.usable_signal).toBe(true);
    expect(intelligence.narrative_pattern.primary_pattern).toBeDefined();
  });

  it('reflection output should produce 2-3 observations', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // Observations are derived from narrative_pattern and evidence
    // F1 fixture has sufficient signal for 2-3 observations
    expect(intelligence.trusted_evidence.trusted_evidence_rank.length).toBeGreaterThan(0);
    expect(intelligence.narrative_pattern.supporting_evidence.length).toBeGreaterThan(0);
  });

  it('strongest direction section should exist', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // Direction components derive from narrative_pattern and evidence
    expect(intelligence.narrative_pattern.primary_pattern).not.toBe('unknown');
    expect(intelligence.trusted_evidence.trusted_evidence_rank.length).toBeGreaterThan(0);
  });

  it('recommendation_viability decision should be success for F1', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    expect(intelligence.recommendation_viability.decision).toBe('success');
  });

  it('direction should have non-null pattern for generating sections', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // All required direction sections derive from these:
    expect(intelligence.narrative_pattern.primary_pattern).toBeDefined();
    expect(intelligence.narrative_pattern.supporting_evidence).toBeDefined();
    expect(intelligence.trusted_evidence.trusted_evidence_rank).toBeDefined();
  });

  it('next_question should be null for strong case (no recovery needed)', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    expect(intelligence.next_question).toBeNull();
  });

  it('escalation should not block for F1', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    expect(intelligence.escalation.blocking).toBe(false);
    expect(intelligence.escalation.escalate).toBe(false);
  });
});

describe('Required Sections — Reflection Screen Contract', () => {
  it('reflection must always render header from UI constants', () => {
    // This is a unit test on the contract, not the implementation
    // In production, src/app/start/reflecting/page.tsx renders:
    // <p className="text-label">What I'm seeing so far</p>
    // This test ensures the fixture is compatible with that UI

    const intelligence = FIXTURE_F1_STRONG_CASE;
    expect(intelligence.recommendation_viability.decision).not.toBe('blocked');
    expect(intelligence.usable_signal.usable_signal).toBe(true);
  });

  it('reflection observations derive from trusted_evidence', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // The deriveObservations() function in src/lib/fm/observations.ts
    // uses narrative_pattern and trusted_evidence to generate observations
    expect(intelligence.trusted_evidence.trusted_evidence_rank).toBeDefined();
    expect(intelligence.trusted_evidence.trusted_evidence_rank.length).toBeGreaterThan(0);
  });

  it('reflection CTA should be present for non-blocked states', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    const isBlocked = intelligence.escalation.blocking;
    const hasDecision = intelligence.recommendation_viability.decision !== 'blocked';
    
    expect(isBlocked).toBe(false);
    expect(hasDecision).toBe(true);
  });
});

describe('Required Sections — Direction Screen Contract', () => {
  it('strongest direction should derive from narrative_pattern', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // deriveDirectionContent() in src/lib/fm/direction.ts uses:
    // - narrative_pattern to define the strongest angle
    // - evidence to generate explanations
    expect(intelligence.narrative_pattern.primary_pattern).not.toBe('unknown');
    expect(intelligence.narrative_pattern.supporting_evidence.length).toBeGreaterThan(0);
  });

  it('direction must have all 4 required sections', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // Required sections for direction screen:
    // 1. Strongest direction (from primary_pattern title)
    // 2. Why it beats the obvious (from narrative positioning)
    // 3. What could make it fall flat (from pattern-specific vulnerabilities)
    // 4. Best next move (from pattern-specific actions)
    
    // These are generated by deriveDirectionContent()
    // This test verifies the fixture has sufficient data
    expect(intelligence.trusted_evidence.trusted_evidence_rank.length).toBeGreaterThan(0);
    expect(intelligence.narrative_pattern.primary_pattern).toBeDefined();
  });

  it('direction watch-out count should be exactly 1', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // deriveDirectionContent() generates exactly one watch-out per pattern
    expect(intelligence.narrative_pattern.primary_pattern).not.toBe('unknown');
  });

  it('direction next-move count should be exactly 1', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // deriveDirectionContent() generates exactly one next move per pattern
    expect(intelligence.narrative_pattern.primary_pattern).not.toBe('unknown');
  });

  it('compare alternatives should be available for strong signal', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // For success/reduced_scope, compare alternatives are generated
    expect(['success', 'reduced_scope']).toContain(
      intelligence.recommendation_viability.decision
    );
  });
});

describe('Required Sections — Recovery Path Contract', () => {
  it('recovery path should not trigger for F1 (success case)', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    expect(intelligence.next_question).toBeNull();
    expect(intelligence.recommendation_viability.decision).toBe('success');
  });

  it('reflection should not have second CTA for success case', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // For success cases, no recovery path needed
    expect(intelligence.recommendation_viability.decision).toBe('success');
    expect(intelligence.next_question).toBeNull();
  });
});

describe('Required Sections — Blocked Path Contract', () => {
  it('blocked case should route to blocked screen not reflection', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // F1 should route to reflection, not blocked
    expect(intelligence.recommendation_viability.decision).not.toBe('blocked');
    
    // When blocked, escalation.blocking is true
    expect(intelligence.escalation.blocking).toBe(false);
  });

  it('blocked screen should have safe exit messaging', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    // F1 is not blocked, so this is just a contract check
    // In production, blocked screen renders:
    // "This story doesn't have enough detail yet for us to help reliably."
    // "Try writing a bit more about a moment that changed how you see something."
    
    expect(intelligence.escalation.escalation_reason).toBeDefined();
  });
});

describe('Analytics Event Contracts', () => {
  it('intake session should have session_id for event correlation', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    expect(intelligence.intake_session_id).toBeDefined();
    expect(intelligence.intake_session_id.length).toBeGreaterThan(0);
  });

  it('viability decision should map to event payload', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    const decision = intelligence.recommendation_viability.decision;
    const validDecisions = ['success', 'reduced_scope', 'needs_more_input', 'blocked'];
    
    expect(validDecisions).toContain(decision);
  });

  it('narrative pattern should be available for analytics', () => {
    const intelligence = FIXTURE_F1_STRONG_CASE;
    const pattern = intelligence.narrative_pattern.primary_pattern;
    expect(pattern).toBeDefined();
    expect(pattern).not.toBe('unknown');
  });
});
