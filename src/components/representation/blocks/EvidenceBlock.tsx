import { RepresentationCard } from '@/components/representation/blocks/shared';

export function EvidenceBlock({ content }: { content: Record<string, unknown> }) {
  const items = Array.isArray(content.items) ? content.items : [];
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Evidence'} title={typeof content.title === 'string' ? content.title : undefined}>
      <div style={{ display: 'grid', gap: '0.45rem' }}>
        {items.map((item, index) => {
          const value = item as { quote?: string; explanation?: string; label?: string; text?: string };
          return (
            <div key={`${index}-${value.quote ?? value.label ?? 'evidence'}`} style={{ display: 'grid', gap: '0.15rem' }}>
              {value.label ? <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>{value.label}</p> : null}
              {value.quote ? <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 600 }}>“{value.quote}”</p> : null}
              {value.text ? <p className="text-small" style={{ margin: 0, color: 'var(--color-text)' }}>{value.text}</p> : null}
              {value.explanation ? <p className="text-small" style={{ margin: 0 }}>{value.explanation}</p> : null}
            </div>
          );
        })}
      </div>
    </RepresentationCard>
  );
}

export default EvidenceBlock;
