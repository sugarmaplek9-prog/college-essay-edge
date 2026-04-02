import React from 'react';
import type { BlankPageViewModel } from '@/types/intake';
import { BlankPageAnswerBox } from '@/components/firstMinute/BlankPageAnswerBox';
import { BlankPageSupportFields } from '@/components/firstMinute/BlankPageSupportFields';

type BlankPageIntakeViewProps = {
  viewModel: BlankPageViewModel;
  answer: string;
  submitting: boolean;
  submitError: string | null;
  onAnswerChange: (value: string) => void;
  onSubmit: () => void;
};

export function BlankPageIntakeView(props: BlankPageIntakeViewProps) {
  const { viewModel } = props;

  return (
    <section
      data-testid="blank-page-intake-view"
      data-render-state={viewModel.renderState}
      data-product-mode={viewModel.productMode}
      data-blank-page-mode={viewModel.blankPageMode}
      data-missing-signal-type={viewModel.missingSignalType}
      data-next-step-type={viewModel.nextStepType}
      data-recovery-confidence={viewModel.recoveryConfidence}
      data-selected-template-id={viewModel.selectedTemplateId}
      data-submission-state={viewModel.submissionState}
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '1.2rem',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      <p className="text-label" style={{ margin: 0, marginBottom: '0.75rem' }}>
        {/* Structural chrome only; not canonical payload meaning. */}
        {viewModel.isTooThinFallback
          ? 'We need one concrete starting point to continue.'
          : 'Structured blank-page recovery'}
      </p>

      <p className="text-small" style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--color-muted)' }}>
        {/* Structural chrome only; canonical semantics render in dedicated slots below. */}
        {viewModel.isTooThinFallback
          ? 'This is a bounded restart, not a rejection.'
          : 'Answer one focused question so we can produce non-generic direction.'}
      </p>

      <p
        className="text-small"
        data-testid="blank-page-why-not-ready"
        style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-muted)' }}
      >
        {/* Canonical why-not-ready explanation; do not substitute reassurance_copy here. */}
        {viewModel.whyNotReadyForDirection}
      </p>

      <blockquote
        data-testid="blank-page-primary-question"
        style={{
          borderLeft: '3px solid var(--color-accent)',
          paddingLeft: '1.25rem',
          margin: '0 0 1rem 0',
          fontStyle: 'italic',
          fontSize: '1.125rem',
          lineHeight: 1.65,
          color: 'var(--color-text)',
        }}
      >
        {viewModel.primaryQuestion}
      </blockquote>

      {viewModel.secondaryQuestion && (
        <p data-testid="blank-page-secondary-question" className="text-small" style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--color-muted)' }}>
          Optional second angle: {viewModel.secondaryQuestion}
        </p>
      )}

      <BlankPageSupportFields
        // Canonical support fields remain distinct from why-not-ready semantics.
        reassuranceCopy={viewModel.supportFields.reassuranceCopy}
        exampleAnswerShape={viewModel.supportFields.exampleAnswerShape}
        whatGoodSignalWouldLookLike={viewModel.supportFields.whatGoodSignalWouldLookLike}
      />

      <BlankPageAnswerBox
        answer={props.answer}
        submitting={props.submitting}
        submitError={props.submitError}
        onAnswerChange={props.onAnswerChange}
        onSubmit={props.onSubmit}
        submitLabel={viewModel.ctaLabel}
        placeholder={viewModel.isTooThinFallback
          ? 'Name one concrete event, responsibility, or challenge from the last year.'
          : 'Answer with one concrete moment or situation in 2–4 sentences.'}
      />
    </section>
  );
}
