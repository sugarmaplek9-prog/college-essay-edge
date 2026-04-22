import { RepresentationCard } from '@/components/representation/blocks/shared';

export function RecoveryBlock({ content }: { content: Record<string, unknown> }) {
  const issues = Array.isArray(content.issues) ? content.issues : [];
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Recovery required'} title={typeof content.title === 'string' ? content.title : undefined} tone="warning">
      <p className="text-small" style={{ margin: '0 0 0.55rem', color: 'var(--color-text)', fontWeight: 600 }}>
        {String(content.message ?? '')}
      </p>
      <div style={{ display: 'grid', gap: '0.4rem' }}>
        {issues.map((issue, index) => (
          <p key={`${index}-${String(issue)}`} className="text-small" style={{ margin: 0 }}>{String(issue)}</p>
        ))}
      </div>
    </RepresentationCard>
  );
}

export default RecoveryBlock;
