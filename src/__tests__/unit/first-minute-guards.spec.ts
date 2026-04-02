import { describe, expect, it } from 'vitest';
import { validateRenderableText } from '@/lib/fm/output-validator';
import { evaluateClarificationAnswer } from '@/lib/fm/answer-sufficiency';
import { renderGuard } from '@/lib/fm/output-quality';

describe('first-minute output validator', () => {
  it('rejects legacy generic direction headline', () => {
    const result = validateRenderableText('The strongest direction in your notes');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('banned_phrase');
  });

  it('rejects banned generic reflection language', () => {
    const result = validateRenderableText('What did this teach you about growth?');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('banned_phrase');
  });

  it('rejects AI/meta language', () => {
    const result = validateRenderableText('Our AI analysis suggests this essay lives in the turn in meaning.');
    expect(result.valid).toBe(false);
    expect(result.reasons).toContain('meta_ai_language');
  });

  it('allows short grounded direction text', () => {
    const result = validateRenderableText('The stronger story is the moment you chose to come back.');
    expect(result.valid).toBe(true);
  });

  it('forces renderGuard to fall back when text is blocked', () => {
    const guarded = renderGuard(
      'What did this teach you about growth?',
      'Write the conversation where he sent you home.',
      { maxWords: 12 }
    );
    expect(guarded.toLowerCase()).toContain('conversation');
    expect(guarded.toLowerCase()).not.toContain('growth');
  });
});

describe('clarification answer sufficiency', () => {
  it('rejects a generic weak answer', () => {
    const result = evaluateClarificationAnswer('I had time to reflect.');
    expect(result.sufficient).toBe(false);
    expect(result.reasons).toContain('generic_summary');
  });

  it('rejects an answer with no concrete detail', () => {
    const result = evaluateClarificationAnswer('I understood it better after that.');
    expect(result.sufficient).toBe(false);
    expect(result.reasons).toContain('missing_concrete_detail');
  });

  it('accepts an answer with exact words and action', () => {
    const result = evaluateClarificationAnswer('He said, "Go home for today," so I came back the next morning and apologized.');
    expect(result.sufficient).toBe(true);
  });
});
