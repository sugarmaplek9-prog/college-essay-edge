import { RepresentationCard } from '@/components/representation/blocks/shared';

export function DraftSeedBlock({
  content,
  draftText,
  onDraftChange,
}: {
  content: Record<string, unknown>;
  draftText?: string;
  onDraftChange?: (value: string) => void;
}) {
  const editable = Boolean(content.editable);
  const value = draftText ?? String(content.draftText ?? '');

  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Draft'} title={typeof content.title === 'string' ? content.title : undefined}>
      {editable ? (
        <textarea
          value={value}
          onChange={(event) => onDraftChange?.(event.target.value)}
          rows={typeof content.rows === 'number' ? content.rows : 10}
          style={{
            width: '100%',
            minHeight: '12rem',
            padding: '1rem',
            fontSize: '1rem',
            lineHeight: 1.65,
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-input)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            resize: 'vertical',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          aria-label={typeof content.ariaLabel === 'string' ? content.ariaLabel : 'Draft seed'}
        />
      ) : (
        <div style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.74)' }}>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{value}</p>
        </div>
      )}
      {content.status ? <p className="text-small" style={{ margin: '0.75rem 0 0', color: 'var(--color-text)' }}>{String(content.status)}</p> : null}
    </RepresentationCard>
  );
}

export default DraftSeedBlock;
