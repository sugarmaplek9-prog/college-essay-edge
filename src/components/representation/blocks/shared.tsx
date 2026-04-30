import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import type { RepresentationCtaContract } from '@/lib/representation/contracts';

export function blockCardStyle(tone: 'default' | 'primary' | 'warning' = 'default'): CSSProperties {
  if (tone === 'primary') {
    return {
      border: '1px solid rgba(23, 58, 106, 0.16)',
      background: 'rgba(242, 247, 252, 0.88)',
      boxShadow: '0 16px 30px rgba(23, 58, 106, 0.06)',
    };
  }

  if (tone === 'warning') {
    return {
      border: '1px solid rgba(146, 64, 14, 0.18)',
      background: 'rgba(254, 243, 199, 0.52)',
      boxShadow: '0 10px 24px rgba(146, 64, 14, 0.04)',
    };
  }

  return {
    border: '1px solid rgba(17, 24, 39, 0.08)',
    background: 'rgba(255,255,255,0.84)',
    boxShadow: '0 8px 22px rgba(17, 24, 39, 0.04)',
  };
}

export function RepresentationCard({
  label,
  title,
  children,
  tone = 'default',
}: {
  label?: string;
  title?: string;
  children: ReactNode;
  tone?: 'default' | 'primary' | 'warning';
}) {
  return (
    <section style={{ borderRadius: '1.2rem', padding: '0.9rem 0.95rem', ...blockCardStyle(tone) }}>
      {label ? (
        <p className="text-label" style={{ margin: '0 0 0.26rem', color: tone === 'warning' ? 'var(--color-caution)' : 'var(--color-judgment-accent)' }}>
          {label}
        </p>
      ) : null}
      {title ? (
        <h2 className="text-title" style={{ margin: '0 0 0.3rem', lineHeight: 1.16 }}>
          {title}
        </h2>
      ) : null}
      <div className="text-body" style={{ color: 'var(--color-muted)', lineHeight: 1.58 }}>{children}</div>
    </section>
  );
}

export function InlineCta({
  cta,
  enabled,
  onSelect,
}: {
  cta: RepresentationCtaContract;
  enabled: boolean;
  onSelect?: (cta: RepresentationCtaContract) => void;
}) {
  const commonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    textDecoration: 'none',
    marginTop: '0.4rem',
    color: enabled ? 'var(--color-judgment-accent)' : 'var(--color-muted)',
    fontWeight: 700,
    fontSize: '0.95rem',
    cursor: enabled ? 'pointer' : 'not-allowed',
  };

  if (cta.actionType === 'route' && cta.targetRoute && enabled) {
    return <Link href={cta.targetRoute} style={commonStyle}>{cta.label} →</Link>;
  }

  return (
    <button
      type="button"
      onClick={() => enabled && onSelect?.(cta)}
      disabled={!enabled}
      style={{
        ...commonStyle,
        background: 'transparent',
        border: 'none',
        padding: 0,
      }}
    >
      {cta.label} →
    </button>
  );
}
