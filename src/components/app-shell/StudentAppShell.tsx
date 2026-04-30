import Link from 'next/link';
import type { ReactNode } from 'react';

const navItems = [
  { href: '/app', label: 'Home' },
  { href: '/app/story-vault', label: 'Story Vault' },
  { href: '/app/personal-statement', label: 'Personal Statement' },
  { href: '/app/supplements', label: 'Supplements' },
  { href: '/app/profile', label: 'Profile' },
];

export function StudentAppShell({
  title,
  subtitle,
  activeNav,
  previewLinks,
  children,
}: {
  title: string;
  subtitle: string;
  activeNav: string;
  previewLinks?: Array<{ href: string; label: string; active?: boolean }>;
  children: ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: '100svh',
        background:
          'radial-gradient(circle at 14% 10%, rgba(83, 116, 182, 0.12), transparent 28%), radial-gradient(circle at 84% 16%, rgba(94, 120, 78, 0.08), transparent 32%), linear-gradient(180deg, #fbf8f2 0%, #f6f2eb 24%, #fbfaf7 56%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(1.3rem, 3vw, 1.8rem) var(--spacing-page) clamp(3rem, 6vw, 4rem)',
      }}
    >
      <div style={{ width: 'min(1120px, 100%)', margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            alignItems: 'flex-start',
            marginBottom: '1.35rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)', letterSpacing: '0.12em' }}>
              STUDENT WORKSPACE
            </p>
            <h1 className="text-display" style={{ margin: '0.25rem 0 0.45rem', fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
              {title}
            </h1>
            <p className="text-body" style={{ margin: 0, maxWidth: '42rem', color: 'var(--color-muted)' }}>
              {subtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.55rem', justifyItems: 'end' }}>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    padding: '0.45rem 0.75rem',
                    borderRadius: '999px',
                    border: item.label === activeNav ? '1px solid rgba(23, 58, 106, 0.16)' : '1px solid rgba(17, 24, 39, 0.08)',
                    background: item.label === activeNav ? 'rgba(232, 239, 249, 0.9)' : 'rgba(255,255,255,0.72)',
                    color: item.label === activeNav ? 'var(--color-judgment-accent)' : 'var(--color-muted)',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {previewLinks && previewLinks.length > 0 ? (
              <details
                style={{
                  width: 'min(420px, 100%)',
                  borderRadius: '1rem',
                  border: '1px solid rgba(17, 24, 39, 0.08)',
                  background: 'rgba(255,255,255,0.78)',
                  padding: '0.7rem 0.85rem',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    listStyle: 'none',
                    color: 'var(--color-judgment-accent)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                  }}
                >
                  Preview states
                </summary>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '0.7rem' }}>
                  {previewLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        textDecoration: 'none',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '999px',
                        border: item.active ? '1px solid rgba(23, 58, 106, 0.22)' : '1px solid rgba(17, 24, 39, 0.08)',
                        background: item.active ? 'rgba(23, 58, 106, 0.92)' : 'rgba(255,255,255,0.9)',
                        color: item.active ? '#fff' : 'var(--color-judgment-accent)',
                        fontSize: '0.88rem',
                        fontWeight: 700,
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}