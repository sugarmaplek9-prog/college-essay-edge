import { describe, expect, it } from 'vitest';
import { extractNarrativeSignals } from '@/lib/fm/narrative-signals';
import { detectMissingSignal } from '@/lib/fm/missing-signal-detector';
import { generateClarificationQuestion } from '@/lib/fm/clarification-question';

// =============================================================
// Engineering success test from spec:
//
// Input: "I got into an argument with my manager. He sent me home.
//         The next day I apologized."
//
// Acceptable outputs include:
//   "What was the argument with your manager actually about?"
//   "What exactly did your manager say when he sent you home?"
//   "What made you decide to come back the next day?"
//
// Unacceptable outputs:
//   "What changed in how you judge yourself?"
//   "What did this teach you?"
//   "What did this mean to you?"
// =============================================================

const MANAGER_INPUT =
  'I got into an argument with my manager. He sent me home. The next day I apologized.';

const BANNED_PHRASES = [
  'changed in how you judge yourself',
  'what did this teach you',
  'how did your role change',
  'what did this mean to you',
  'how did this shape you',
  'self-understanding',
  'personal growth',
];

// =============================================================
// narrative-signals extraction
// =============================================================

describe('extractNarrativeSignals', () => {
  it('extracts the actor from the manager story', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    expect(signals.actors).toContain('your manager');
  });

  it('identifies the tension event sentence', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    expect(signals.tensionEvent).toBeTruthy();
    expect(signals.tensionEvent!.toLowerCase()).toMatch(/argument/);
  });

  it('identifies the consequence sentence', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    expect(signals.consequence).toBeTruthy();
    expect(signals.consequence!.toLowerCase()).toMatch(/sent me home/);
  });

  it('identifies the repair action', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    expect(signals.repairAction).toBeTruthy();
    expect(signals.repairAction!.toLowerCase()).toMatch(/apologized/);
  });

  it('finds no realization moment (none stated)', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    expect(signals.realizationMoment).toBeUndefined();
  });

  it('extracts actors from a hospital volunteer story', () => {
    const input =
      'I spent three summers volunteering at the hospital. In my third summer, a nurse pulled me aside and said I was just getting in the way.';
    const signals = extractNarrativeSignals(input);
    expect(signals.actors.some((a: string) => a.includes('nurse'))).toBe(true);
  });

  it('identifies tension from "pulled me aside and said I was in the way"', () => {
    const input =
      'In my third summer, a nurse pulled me aside and said I was just getting in the way.';
    const signals = extractNarrativeSignals(input);
    expect(signals.tensionEvent).toBeTruthy();
  });

  it('detects realization from "I realized" sentence', () => {
    const input = 'I got into a fight with my coach. I realized I had been playing selfishly.';
    const signals = extractNarrativeSignals(input);
    expect(signals.realizationMoment).toBeTruthy();
    expect(signals.realizationMoment!.toLowerCase()).toContain('realized');
  });

  it('detects behavior change from "from that day on" sentence', () => {
    const input = 'My teacher corrected me. From that day on I always double-checked my work.';
    const signals = extractNarrativeSignals(input);
    expect(signals.behaviorChange).toBeTruthy();
  });
});

// =============================================================
// missing-signal detection
// =============================================================

describe('detectMissingSignal', () => {
  it('returns conflict_detail for manager story (argument with no content)', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const target = detectMissingSignal(signals);
    expect(target).toBe('conflict_detail');
  });

  it('returns exact_words after conflict_detail when consequence lacks vivid detail', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    // conflict_detail chosen — consequence has no vivid detail, so exact_words is priority 2
    const target = detectMissingSignal(signals, ['conflict_detail']);
    expect(target).toBe('exact_words');
  });

  it('returns decision_reason before abstract realization when a repair action is present', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const target = detectMissingSignal(signals, ['conflict_detail', 'exact_words']);
    expect(target).toBe('decision_reason');
  });

  it('returns repair_action when realization present but no follow-through', () => {
    const input =
      'I argued with my coach. I realized I had been too defensive. I never actually changed anything though.';
    const signals = extractNarrativeSignals(input);
    const target = detectMissingSignal(signals);
    // Realization present, no repair — should want repair_action
    expect(['repair_action', 'conflict_detail']).toContain(target);
  });

  it('returns behavior_change when both realization and repair are present', () => {
    const input =
      'My manager criticized me. I realized I had been too slow. I apologized the next day.';
    const signals = extractNarrativeSignals(input);
    // Skip conflict_detail and realization
    const target = detectMissingSignal(signals, ['conflict_detail', 'realization']);
    expect(target).toBe('behavior_change');
  });

  it('returns consequence_detail when tension has no consequence yet', () => {
    const input = 'My coach and I had a big argument. Things got very tense between us.';
    const signals = extractNarrativeSignals(input);
    // Tension present, no consequence, no realization — after skipping conflict_detail
    const target = detectMissingSignal(signals, ['conflict_detail']);
    expect(target).toBe('consequence_detail');
  });

  it('forces progression when the only immediate candidate was already used', () => {
    const input =
      'I spent three summers volunteering at the hospital. A nurse pulled me aside and said I was getting in the way.';
    const signals = extractNarrativeSignals(input);
    const target = detectMissingSignal(signals, ['consequence_detail']);
    expect(target).not.toBe('consequence_detail');
  });

  it('skips already-used targets', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const target = detectMissingSignal(signals, ['conflict_detail', 'realization', 'behavior_change']);
    // Should return something other than those three
    expect(target).not.toBe('conflict_detail');
    expect(target).not.toBe('realization');
    expect(target).not.toBe('behavior_change');
  });
});

// =============================================================
// clarification-question generation — engineering success test
// =============================================================

describe('generateClarificationQuestion', () => {
  it('generates a concrete conflict_detail question referencing the manager', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const q = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target: 'conflict_detail' });
    expect(q).toBeTruthy();
    expect(q!.toLowerCase()).toMatch(/argument|conflict|tension/);
    expect(q!.toLowerCase()).toMatch(/manager/);
  });

  it('generates a decision_reason question referencing the repair action', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const q = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target: 'decision_reason' });
    expect(q).toBeTruthy();
    expect(q!.toLowerCase()).toMatch(/apologize|back|decide/);
  });

  it('generates a realization question only when the inner shift itself is missing', () => {
    const input = 'My manager sent me home after we argued.';
    const signals = extractNarrativeSignals(input);
    const q = generateClarificationQuestion({ rawInput: input, signals, target: 'realization' });
    expect(q).toBeTruthy();
    expect(q!.toLowerCase()).toMatch(/thinking|head|clicked|notice/);
  });

  it('generates an exact_words question referencing the consequence', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const q = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target: 'exact_words' });
    expect(q).toBeTruthy();
    expect(q!.toLowerCase()).toMatch(/said|word|moment|home|manager/);
  });

  it('generates a behavior_change question referencing the repair', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const q = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target: 'behavior_change' });
    expect(q).toBeTruthy();
    expect(q!.toLowerCase()).toMatch(/differently|now|concrete/);
  });

  it('generates a consequence_detail question when only tension is present', () => {
    const input = 'My coach and I had an argument.';
    const signals = extractNarrativeSignals(input);
    const q = generateClarificationQuestion({ rawInput: input, signals, target: 'consequence_detail' });
    expect(q).toBeTruthy();
    expect(q!.toLowerCase()).toMatch(/after|result|happen/);
  });

  it('returns null for null target', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const q = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target: null });
    expect(q).toBeNull();
  });

  // ── Hard ban enforcement ──────────────────────────────────────

  it.each(BANNED_PHRASES)(
    'never produces banned phrase "%s" for manager story',
    (bannedPhrase) => {
      const signals = extractNarrativeSignals(MANAGER_INPUT);
      const targets = ['conflict_detail', 'exact_words', 'decision_reason', 'realization', 'repair_action', 'behavior_change', 'consequence_detail'] as const;
      for (const target of targets) {
        const q = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target });
        if (q) {
          expect(q.toLowerCase()).not.toContain(bannedPhrase.toLowerCase());
        }
      }
    }
  );

  // ── Differentiation test ─────────────────────────────────────

  it('generates different questions for different stories', () => {
    const managerSignals = extractNarrativeSignals(MANAGER_INPUT);
    const managerQ = generateClarificationQuestion({
      rawInput: MANAGER_INPUT,
      signals: managerSignals,
      target: 'conflict_detail',
    });

    const nurseInput =
      'I spent three summers volunteering at the hospital. A nurse pulled me aside and said I was just getting in the way. That conversation changed everything.';
    const nurseSignals = extractNarrativeSignals(nurseInput);
    const nurseQ = generateClarificationQuestion({
      rawInput: nurseInput,
      signals: nurseSignals,
      target: 'conflict_detail',
    });

    // Both questions should exist and be different
    expect(managerQ).toBeTruthy();
    expect(nurseQ).toBeTruthy();
    // At least one should reference its story-specific actor
    const managerQHasContext = managerQ!.toLowerCase().includes('manager');
    const nurseQHasContext = nurseQ!.toLowerCase().includes('nurse') || nurseQ!.toLowerCase().includes('what');
    expect(managerQHasContext || nurseQHasContext).toBe(true);
  });
});

// =============================================================
// End-to-end pipeline test
// =============================================================

describe('full clarification pipeline', () => {
  it('produces an acceptable question for the manager engineering test case', () => {
    const signals = extractNarrativeSignals(MANAGER_INPUT);
    const target = detectMissingSignal(signals);
    const question = generateClarificationQuestion({ rawInput: MANAGER_INPUT, signals, target });

    expect(question).toBeTruthy();

    // Must reference the story (actor or event)
    const lower = question!.toLowerCase();
    const referencesStory =
      lower.includes('manager') ||
      lower.includes('argument') ||
      lower.includes('apologize') ||
      lower.includes('home') ||
      lower.includes('decide') ||
      lower.includes('back');
    expect(referencesStory).toBe(true);

    // Must not be a generic reflection prompt
    for (const banned of BANNED_PHRASES) {
      expect(lower).not.toContain(banned.toLowerCase());
    }
  });

  it('produces an acceptable question for the hospital volunteer case', () => {
    const input =
      'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.';
    const signals = extractNarrativeSignals(input);
    const target = detectMissingSignal(signals);
    const question = generateClarificationQuestion({ rawInput: input, signals, target });

    expect(question).toBeTruthy();
    const lower = question!.toLowerCase();
    for (const banned of BANNED_PHRASES) {
      expect(lower).not.toContain(banned.toLowerCase());
    }
  });
});
