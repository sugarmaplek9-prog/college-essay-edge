import Link from 'next/link';
import type { ReactNode } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
];

export function PublicSiteShell({
  eyebrow,
  title,
  subtitle,
  children,
  primaryCta,
  secondaryCta,
  focusQuestion,
  focusAnswer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  focusQuestion?: string;
  focusAnswer?: string;
}) {
  return (
    <main
      style={{
        minHeight: '100svh',
        background:
          'radial-gradient(circle at 10% 8%, rgba(83, 116, 182, 0.12), transparent 28%), radial-gradient(circle at 88% 14%, rgba(94, 120, 78, 0.08), transparent 30%), linear-gradient(180deg, #fbf8f2 0%, #f6f2eb 24%, #fbfaf7 56%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(1.4rem, 4vw, 2rem) var(--spacing-page) clamp(3rem, 6vw, 4rem)',
      }}
    >
      <div style={{ width: 'min(1040px, 100%)', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)', letterSpacing: '0.12em' }}>
              COLLEGE ESSAY EDGE
            </p>
            <p className="text-small" style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)' }}>
              Judgment-driven coaching before drafting.
            </p>
          </div>

          <nav aria-label="Public site" style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  textDecoration: 'none',
                  color: 'var(--color-judgment-accent)',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  padding: '0.5rem 0.8rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(23, 58, 106, 0.12)',
                  background: 'rgba(255,255,255,0.72)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </header>

        <section
          style={{
            display: 'grid',
            gap: '1rem',
            gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.9fr)',
            alignItems: 'start',
            marginBottom: '1.4rem',
          }}
        >
          <div
            style={{
              padding: '1.35rem',
              borderRadius: '1.45rem',
              border: '1px solid rgba(23, 58, 106, 0.1)',
              background: 'rgba(255,255,255,0.78)',
              boxShadow: '0 18px 36px rgba(17, 24, 39, 0.06)',
            }}
          >
            <p className="text-label" style={{ margin: '0 0 0.5rem', color: 'var(--color-judgment-accent)' }}>
              {eyebrow}
            </p>
            <h1 className="text-display" style={{ margin: '0 0 0.75rem', maxWidth: '12ch' }}>
              {title}
            </h1>
            <p className="text-body" style={{ margin: 0, maxWidth: '40rem', color: 'var(--color-muted)' }}>
              {subtitle}
            </p>
            {(primaryCta || secondaryCta) && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {primaryCta ? (
                  <Link
                    href={primaryCta.href}
                    style={{
                      textDecoration: 'none',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '999px',
                      background: 'var(--color-judgment-accent)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {primaryCta.label}
                  </Link>
                ) : null}
                {secondaryCta ? (
                  <Link
                    href={secondaryCta.href}
                    style={{
                      textDecoration: 'none',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '999px',
                      border: '1px solid rgba(23, 58, 106, 0.14)',
                      color: 'var(--color-judgment-accent)',
                      background: 'rgba(255,255,255,0.9)',
                      fontWeight: 700,
                    }}
                  >
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <aside
            style={{
              padding: '1.15rem',
              borderRadius: '1.35rem',
              border: '1px solid rgba(17, 24, 39, 0.08)',
              background: 'rgba(247, 249, 252, 0.82)',
              boxShadow: '0 10px 26px rgba(17, 24, 39, 0.04)',
            }}
          >
            <p className="text-label" style={{ margin: '0 0 0.45rem', color: 'var(--color-judgment-accent)' }}>
              One question this page should answer
            </p>
            <p style={{ margin: '0 0 0.45rem', fontSize: '1rem', lineHeight: 1.35, fontWeight: 700, color: 'var(--color-text)' }}>
              {focusQuestion ?? 'What happens after rough notes go in?'}
            </p>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.6 }}>
              {focusAnswer ?? 'Rough notes go in first, the direction call comes back first, and drafting happens only after the call is earned.'}
            </p>
          </aside>
        </section>

        <div style={{ display: 'grid', gap: '0.9rem' }}>{children}</div>
      </div>
    </main>
  );
}

export function PublicCard({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      style={{
        padding: '1.1rem 1.15rem',
        borderRadius: '1.15rem',
        border: '1px solid rgba(17, 24, 39, 0.08)',
        background: 'rgba(255,255,255,0.84)',
        boxShadow: '0 8px 24px rgba(17, 24, 39, 0.04)',
      }}
    >
      <p className="text-label" style={{ margin: '0 0 0.45rem', color: 'var(--color-judgment-accent)' }}>
        {label}
      </p>
      <h2 className="text-title" style={{ margin: '0 0 0.45rem' }}>
        {title}
      </h2>
      <div className="text-body" style={{ color: 'var(--color-muted)' }}>
        {children}
      </div>
    </section>
  );
}

export function PublicGrid({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.9rem',
      }}
    >
      {children}
    </div>
  );
}