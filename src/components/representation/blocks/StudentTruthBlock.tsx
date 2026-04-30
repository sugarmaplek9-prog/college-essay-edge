import { RepresentationCard } from '@/components/representation/blocks/shared';

export function StudentTruthBlock({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Student truth'} title={typeof content.title === 'string' ? content.title : undefined} tone="primary">
      {content.summary ? <p style={{ margin: '0 0 0.45rem', color: 'var(--color-text)' }}>{String(content.summary)}</p> : null}
      {items.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          {items.map((item, index) => (
            <p key={`${index}-${String(item)}`} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(23, 58, 106, 0.16)' }}>
              {String(item)}
            </p>
          ))}
        </div>
      ) : null}
    </RepresentationCard>
  );
}

export default StudentTruthBlock;
