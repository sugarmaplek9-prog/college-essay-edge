import React from 'react';

type BlankPageSupportFieldsProps = {
  reassuranceCopy: string | null;
  exampleAnswerShape: string | null;
  whatGoodSignalWouldLookLike: string | null;
};

export function BlankPageSupportFields(props: BlankPageSupportFieldsProps) {
  const items = [
    props.reassuranceCopy
      ? { label: 'Reassurance', value: props.reassuranceCopy }
      : null,
    props.exampleAnswerShape
      ? { label: 'How to answer', value: props.exampleAnswerShape }
      : null,
    props.whatGoodSignalWouldLookLike
      ? { label: 'What strong signal looks like', value: props.whatGoodSignalWouldLookLike }
      : null,
  ].filter((item): item is { label: string; value: string } => item !== null);

  if (items.length === 0) return null;

  return (
    <section
      data-testid="blank-page-support-fields"
      style={{
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding: '0.95rem',
        backgroundColor: 'var(--color-surface)',
        marginBottom: '1rem',
      }}
    >
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {items.map((item) => (
          <li key={item.label}>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', fontWeight: 600 }}>
              {item.label}
            </p>
            <p className="text-small" style={{ margin: '0.2rem 0 0 0', color: 'var(--color-text)' }}>
              {item.value}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
