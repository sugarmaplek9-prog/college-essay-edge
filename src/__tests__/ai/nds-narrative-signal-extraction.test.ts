import { describe, expect, it } from 'vitest';
import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(stories: string[]): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-narrative-1',
      student_user_id: 'user-narrative-1',
      title: 'Narrative extraction test',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-narrative-1',
      first_name: 'Test',
      last_name: 'Student',
      grade: 12,
      interests: ['community'],
    },
    story_entries: stories.map((body, idx) => ({
      id: `story_${idx + 1}`,
      title: `Story ${idx + 1}`,
      body,
      category: 'activity',
    })),
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: stories.length,
      has_current_draft: false,
      has_school_context: false,
    },
  };
}

describe('NDS narrative signal extraction (Step 1)', () => {
  it('Test A: detects strong self-correction arc with mistake, feedback, pivot, behavior change, and impact', () => {
    const story =
      'I handled this situation poorly at first. After feedback from my advisor, that was the moment I realized I needed to adapt my approach. I changed my approach and it affected others on the team.';

    const context = buildNdsNormalizedContextPack(makeSources([story]));
    const signal = context.story_signals[0].narrative_signal;

    expect(signal.pattern).toBe('self_correction_arc');
    expect(['high', 'medium']).toContain(signal.pattern_confidence);
    expect(signal.feedback_present).toBe(true);
    expect(signal.pivot_present).toBe(true);
    expect(signal.behavior_change_present).toBe(true);
    expect(signal.impact_on_others_present).toBe(true);
    expect(context.story_signals[0].event_summary.toLowerCase()).toContain('ineffective approach');
    expect(context.story_signals[0].change_signal.toLowerCase()).toContain('corrected');
  });

  it('Test B: detects mistake + adaptation without explicit turning-point phrase', () => {
    const story =
      'I got it wrong in my first approach. Someone challenged me and I adapted my approach to handle it differently for my group.';

    const context = buildNdsNormalizedContextPack(makeSources([story]));
    const signal = context.story_signals[0].narrative_signal;

    expect(signal.pattern).toBe('self_correction_arc');
    expect(signal.pattern_confidence).toBe('medium');
    expect(signal.behavior_change_present).toBe(true);
  });

  it('Test C: detects pattern consistently across repeated similar story entries', () => {
    const storyA =
      'I made a mistake early, then after feedback I changed my approach and that affected the team dynamic.';
    const storyB =
      'My first instinct was wrong. After feedback from a teammate I responded differently, and it changed how people worked with me.';

    const context = buildNdsNormalizedContextPack(makeSources([storyA, storyB]));

    expect(context.story_signals.length).toBeGreaterThanOrEqual(1);
    context.story_signals.forEach((storySignal: (typeof context.story_signals)[number]) => {
      expect(storySignal.narrative_signal.pattern).toBe('self_correction_arc');
      expect(storySignal.narrative_signal.behavior_change_present).toBe(true);
    });
  });

  it('Test D: generic activity note stays unknown', () => {
    const story = 'I volunteered at a clinic and learned a lot.';
    const context = buildNdsNormalizedContextPack(makeSources([story]));

    expect(context.story_signals[0].narrative_signal.pattern).toBe('unknown');
  });

  it('Test E: achievement-only note stays unknown', () => {
    const story = 'I led the robotics team and won a competition.';
    const context = buildNdsNormalizedContextPack(makeSources([story]));

    expect(context.story_signals[0].narrative_signal.pattern).toBe('unknown');
  });

  it('Test F: weak reflection without behavior change stays unknown', () => {
    const story = 'I had a meaningful experience and learned something.';
    const context = buildNdsNormalizedContextPack(makeSources([story]));

    expect(context.story_signals[0].narrative_signal.pattern).toBe('unknown');
  });
});
