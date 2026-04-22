import type { RepresentationCtaContract } from '@/lib/representation/contracts';
import { InlineCta, RepresentationCard } from '@/components/representation/blocks/shared';

export function CTAGroupBlock({
  content,
  availableStateKeys,
  onSelect,
}: {
  content: Record<string, unknown>;
  availableStateKeys: string[];
  onSelect?: (cta: RepresentationCtaContract) => void;
}) {
  const ctas = (Array.isArray(content.ctas) ? content.ctas : []) as RepresentationCtaContract[];
  return (
    <RepresentationCard label={typeof content.label === 'string' ? content.label : 'Related actions'} title={typeof content.title === 'string' ? content.title : undefined}>
      <div style={{ display: 'grid', gap: '0.05rem' }}>
        {ctas.map((cta) => (
          <InlineCta
            key={cta.id}
            cta={cta}
            enabled={cta.requiredStateKeys.every((key) => availableStateKeys.includes(key))}
            onSelect={onSelect}
          />
        ))}
      </div>
    </RepresentationCard>
  );
}

export default CTAGroupBlock;
