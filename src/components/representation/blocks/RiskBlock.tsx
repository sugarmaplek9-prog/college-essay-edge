import { RepresentationCard } from '@/components/representation/blocks/shared';

export function RiskBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Risk'} title={typeof content.title === 'string' ? content.title : undefined}>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
        {String(content.whatCouldFail ?? '')}
      </p>
    </RepresentationCard>
  );
}

export default RiskBlock;
