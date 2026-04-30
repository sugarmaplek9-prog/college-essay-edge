import { RepresentationCard } from '@/components/representation/blocks/shared';

export function CompareBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Compare'} title={typeof content.title === 'string' ? content.title : undefined}>
      <div style={{ display: 'grid', gap: '0.6rem' }}>
        <div>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Stronger read</p>
          <p className="text-small" style={{ margin: '0.25rem 0 0', color: 'var(--color-text)' }}>{String(content.stronger ?? '')}</p>
        </div>
        <div>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-caution)' }}>Weaker read</p>
          <p className="text-small" style={{ margin: '0.25rem 0 0', color: 'var(--color-text)' }}>{String(content.weaker ?? '')}</p>
        </div>
        {content.judgment ? <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 600 }}>{String(content.judgment)}</p> : null}
      </div>
    </RepresentationCard>
  );
}

export default CompareBlock;
