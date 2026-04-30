import { RepresentationCard } from '@/components/representation/blocks/shared';

export function NextMoveBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Next move'} title={typeof content.title === 'string' ? content.title : undefined} tone="primary">
      <p className="text-small" style={{ margin: '0 0 0.35rem', color: 'var(--color-text)', fontWeight: 700, fontSize: '1rem' }}>
        {String(content.bestNextStep ?? '')}
      </p>
      {content.support ? <p className="text-small" style={{ margin: 0 }}>{String(content.support)}</p> : null}
    </RepresentationCard>
  );
}

export default NextMoveBlock;
