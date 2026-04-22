import { RepresentationCard } from '@/components/representation/blocks/shared';

export function RecommendationBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Recommendation'} title={typeof content.title === 'string' ? content.title : undefined} tone="primary">
      {content.primaryClaim ? (
        <p className="text-small" style={{ margin: '0 0 0.35rem', color: 'var(--color-text)', fontWeight: 700, fontSize: '1rem' }}>
          {String(content.primaryClaim)}
        </p>
      ) : null}
      {content.whyThisWins ? <p className="text-small" style={{ margin: 0 }}>{String(content.whyThisWins)}</p> : null}
    </RepresentationCard>
  );
}

export default RecommendationBlock;
