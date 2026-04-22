import { RepresentationCard } from '@/components/representation/blocks/shared';

export function HandoffSummaryBlock({ content }: { content: Record<string, unknown> }) {
  const bullets = Array.isArray(content.bullets) ? content.bullets : [];
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Handoff'} title={typeof content.title === 'string' ? content.title : undefined} tone="primary">
      <p className="text-small" style={{ margin: '0 0 0.35rem', color: 'var(--color-text)', fontWeight: 700 }}>
        {String(content.summary ?? '')}
      </p>
      {bullets.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.35rem' }}>
          {bullets.map((item, index) => (
            <p key={`${index}-${String(item)}`} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(23, 58, 106, 0.16)' }}>
              {String(item)}
            </p>
          ))}
        </div>
      ) : null}
    </RepresentationCard>
  );
}

export default HandoffSummaryBlock;
