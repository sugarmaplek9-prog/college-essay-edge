import React from 'react';

type BlankPageAnswerBoxProps = {
  answer: string;
  submitting: boolean;
  submitError: string | null;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel: string;
  placeholder: string;
};

export function BlankPageAnswerBox(props: BlankPageAnswerBoxProps) {
  return (
    <div data-testid="blank-page-answer-box">
      <textarea
        data-testid="blank-page-answer-input"
        value={props.answer}
        onChange={(event) => props.onAnswerChange(event.target.value)}
        rows={4}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '1rem',
          fontSize: '1rem',
          lineHeight: 1.6,
          border: '1.5px solid var(--color-border)',
          borderRadius: 'var(--radius-input)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          resize: 'vertical',
          fontFamily: 'inherit',
          outline: 'none',
          boxSizing: 'border-box',
        }}
        aria-label="Blank-page recovery answer"
        placeholder={props.placeholder}
        disabled={props.submitting}
      />

      {props.submitError && (
        <p data-testid="blank-page-submit-error" className="text-small" style={{ margin: '0.6rem 0 0 0', color: 'var(--color-caution)' }}>
          {props.submitError}
        </p>
      )}

      <button
        data-testid="blank-page-submit-cta"
        type="button"
        onClick={props.onSubmit}
        disabled={props.answer.trim().length < 5 || props.submitting}
        style={{
          marginTop: '0.9rem',
          width: '100%',
          padding: '0.875rem 1.5rem',
          backgroundColor: props.answer.trim().length >= 5 && !props.submitting
            ? 'var(--color-text)'
            : 'var(--color-border)',
          color: props.answer.trim().length >= 5 && !props.submitting
            ? 'var(--color-surface)'
            : 'var(--color-subtle)',
          border: 'none',
          borderRadius: 'var(--radius-input)',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: props.answer.trim().length >= 5 && !props.submitting ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        {props.submitting ? 'Submitting response…' : props.submitLabel}
      </button>
    </div>
  );
}
