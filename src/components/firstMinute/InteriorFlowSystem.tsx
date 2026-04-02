import type { CSSProperties, ReactNode } from 'react';

export function InteriorPageShell({
  children,
  maxWidth = '44rem',
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <main
      style={{
        minHeight: '100svh',
        background:
          'radial-gradient(circle at 82% 16%, rgba(40, 76, 136, 0.14) 0%, rgba(40, 76, 136, 0.06) 18%, transparent 40%), linear-gradient(180deg, #faf6ef 0%, #f5f1ea 20%, #fbfaf7 54%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(2.5rem, 5vw, 4rem) var(--spacing-page) clamp(3rem, 7vw, 4.5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 'auto 8% 12% auto',
          width: '20rem',
          height: '20rem',
          background: 'radial-gradient(circle, rgba(94, 120, 78, 0.12) 0%, rgba(94, 120, 78, 0.04) 42%, transparent 72%)',
          filter: 'blur(24px)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ maxWidth, margin: '0 auto', width: '100%', position: 'relative' }}>{children}</div>
    </main>
  );
}

export function InteriorHeaderBlock({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      {eyebrow && (
        <p className="text-label" style={{ marginBottom: '0.4rem', color: 'var(--color-judgment-accent)' }}>
          {eyebrow}
        </p>
      )}
      <h1 className="text-title" style={{ margin: '0 0 0.55rem' }}>
        {title}
      </h1>
      {subtitle && (
        <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function SurfaceCard({
  label,
  children,
  variant = 'task',
  style,
}: {
  label?: string;
  children: ReactNode;
  variant?: 'task' | 'judgment' | 'evidence' | 'warning' | 'coach';
  style?: CSSProperties;
}) {
  const cardStyles: Record<string, CSSProperties> = {
    task: {
      border: '1px solid var(--color-border-neutral)',
      background: 'var(--color-task-surface)',
      boxShadow: '0 10px 28px rgba(17, 24, 39, 0.04)',
    },
    judgment: {
      border: '1px solid rgba(23, 58, 106, 0.15)',
      background: 'var(--color-judgment-surface)',
      boxShadow: '0 12px 30px rgba(23, 58, 106, 0.07)',
    },
    evidence: {
      border: '1px solid rgba(17, 24, 39, 0.1)',
      background: 'var(--color-evidence-surface)',
      boxShadow: '0 8px 22px rgba(17, 24, 39, 0.04)',
    },
    warning: {
      border: '1px solid rgba(146, 64, 14, 0.2)',
      background: 'var(--color-warning-surface)',
      boxShadow: '0 8px 22px rgba(146, 64, 14, 0.05)',
    },
    coach: {
      border: '1px solid rgba(23, 58, 106, 0.12)',
      background: 'rgba(255,255,255,0.78)',
      boxShadow: '0 10px 24px rgba(17, 24, 39, 0.04)',
    },
  };

  return (
    <section
      style={{
        borderRadius: 'var(--radius-card-lg)',
        padding: '0.95rem 1.05rem',
        marginBottom: '1rem',
        ...cardStyles[variant],
        ...style,
      }}
    >
      {label && (
        <p
          className="text-label"
          style={{
            marginBottom: '0.6rem',
            color: variant === 'warning' ? 'var(--color-caution)' : 'var(--color-judgment-accent)',
          }}
        >
          {label}
        </p>
      )}
      {children}
    </section>
  );
}

export function EvidenceCard({
  fragment,
  explanation,
  role,
}: {
  fragment: string;
  explanation: string;
  role?: string;
}) {
  return (
    <div
      style={{
        padding: '0.7rem 0.9rem',
        border: '1px solid rgba(17, 24, 39, 0.09)',
        borderRadius: 'var(--radius-card)',
        background: 'var(--color-evidence-surface)',
        boxShadow: '0 4px 14px rgba(17, 24, 39, 0.03)',
      }}
    >
      <p
        className="text-small"
        style={{ margin: '0 0 0.3rem', color: 'var(--color-text)', fontStyle: 'italic' }}
      >
        &ldquo;{fragment}&rdquo;
      </p>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
        {explanation}
      </p>
      {role && (
        <p
          className="text-label"
          style={{ margin: '0.4rem 0 0', color: 'var(--color-judgment-accent)' }}
        >
          {role}
        </p>
      )}
    </div>
  );
}

export function WarningArtifact({
  label = 'Avoid',
  items,
}: {
  label?: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div
      style={{
        borderRadius: 'var(--radius-card-lg)',
        padding: '0.85rem 1rem',
        marginBottom: '1rem',
        background: 'rgba(250, 244, 236, 0.88)',
        border: '1px solid rgba(146, 64, 14, 0.14)',
        boxShadow: '0 4px 14px rgba(146, 64, 14, 0.04)',
      }}
    >
      <p
        className="text-label"
        style={{ marginBottom: '0.5rem', color: 'var(--color-caution)' }}
      >
        {label}
      </p>
      <div style={{ display: 'grid', gap: '0.35rem' }}>
        {items.map((item, index) => (
          <p
            key={`warn-${index}`}
            className="text-small"
            style={{
              margin: 0,
              color: 'rgba(146, 64, 14, 0.85)',
              paddingLeft: '0.7rem',
              borderLeft: '2px solid rgba(146, 64, 14, 0.2)',
            }}
          >
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

export function CTARegion({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--color-border)',
        marginTop: '0.25rem',
      }}
    >
      {children}
    </div>
  );
}

export const primaryCTA: CSSProperties = {
  padding: '0.9rem 1.5rem',
  backgroundColor: 'var(--color-text)',
  color: 'var(--color-surface)',
  border: '1.5px solid var(--color-text)',
  borderRadius: 'var(--radius-input)',
  fontSize: '1rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'center',
};

export const primaryCTADisabled: CSSProperties = {
  ...primaryCTA,
  backgroundColor: 'rgba(17, 24, 39, 0.12)',
  color: 'rgba(17, 24, 39, 0.35)',
  borderColor: 'transparent',
  cursor: 'default',
};

export const secondaryCTA: CSSProperties = {
  padding: '0.875rem 1.5rem',
  backgroundColor: 'transparent',
  color: 'var(--color-text)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-input)',
  fontSize: '1rem',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'center',
};

export const ghostCTA: CSSProperties = {
  padding: '0.5rem',
  background: 'none',
  border: 'none',
  color: 'var(--color-muted)',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'center',
};

export function CompareArtifact({
  weaker,
  stronger,
  judgment,
  label = 'Why this wins',
}: {
  weaker: string;
  stronger: string;
  judgment?: string;
  label?: string;
}) {
  const hasJudgment = Boolean(judgment && judgment.trim());

  return (
    <div
      style={{
        borderRadius: 'var(--radius-card-lg)',
        border: '1.5px solid rgba(23, 58, 106, 0.18)',
        background: 'linear-gradient(160deg, rgba(232, 239, 249, 0.6) 0%, rgba(242, 247, 252, 0.85) 100%)',
        boxShadow: '0 16px 36px rgba(23, 58, 106, 0.09)',
        padding: '1.1rem 1.15rem',
        marginBottom: '1.25rem',
      }}
    >
      <p
        className="text-label"
        style={{ marginBottom: '0.75rem', color: 'var(--color-judgment-accent)' }}
      >
        {label}
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
          gap: '0.65rem',
          marginBottom: '0.85rem',
        }}
      >
        <article
          style={{
            border: '1px solid rgba(128, 94, 52, 0.16)',
            borderRadius: 'var(--radius-card)',
            background: 'rgba(250, 244, 236, 0.9)',
            padding: '0.8rem',
          }}
        >
          <p className="text-label" style={{ margin: '0 0 0.4rem', color: 'rgba(120, 64, 16, 0.8)' }}>
            Weaker read
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-text)' }}>
            {weaker}
          </p>
        </article>

        <article
          style={{
            border: '1.5px solid rgba(23, 58, 106, 0.22)',
            borderRadius: 'var(--radius-card)',
            background: 'rgba(232, 239, 249, 0.95)',
            padding: '0.8rem',
            boxShadow: '0 4px 14px rgba(23, 58, 106, 0.08)',
          }}
        >
          <p className="text-label" style={{ margin: '0 0 0.4rem', color: '#173a6a' }}>
            Stronger read
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 500 }}>
            {stronger}
          </p>
        </article>
      </div>

      {hasJudgment && (
        <div
          style={{
            borderTop: '1px solid rgba(23, 58, 106, 0.12)',
            paddingTop: '0.7rem',
          }}
        >
          <p className="text-small" style={{ margin: 0, color: '#173a6a', fontStyle: 'italic' }}>
            {judgment}
          </p>
        </div>
      )}
    </div>
  );
}

export function OpeningDirectiveArtifact({
  seedLine,
  steps,
  whyItWins,
  nextMove,
  avoidLines,
}: {
  seedLine: string;
  steps: string[];
  whyItWins: string;
  nextMove: string;
  avoidLines: string[];
}) {
  const visibleSteps = steps.slice(0, 3);
  const visibleAvoids = avoidLines.slice(0, 2);

  return (
    <section
      style={{
        borderRadius: 'var(--radius-card-lg)',
        border: '1.5px solid rgba(23, 58, 106, 0.16)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.82) 0%, rgba(242,247,252,0.92) 100%)',
        boxShadow: '0 18px 36px rgba(17, 24, 39, 0.06)',
        padding: '1.15rem',
        marginBottom: '1.1rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.75rem', color: 'var(--color-judgment-accent)' }}>
        Build the opening from this evidence
      </p>

      <div
        style={{
          borderRadius: 'var(--radius-card)',
          border: '1px solid rgba(23, 58, 106, 0.15)',
          background: 'rgba(255,255,255,0.88)',
          padding: '0.95rem 1rem',
          marginBottom: '0.9rem',
        }}
      >
        <p className="text-label" style={{ marginBottom: '0.45rem', color: 'var(--color-judgment-accent)' }}>
          Lead with this exact moment
        </p>
        <p
          style={{
            margin: 0,
            fontSize: 'clamp(1.05rem, 2.4vw, 1.3rem)',
            lineHeight: 1.45,
            color: 'var(--color-text)',
            fontWeight: 500,
          }}
        >
          {seedLine}
        </p>
      </div>

      <p className="text-small" style={{ margin: '0 0 0.8rem', color: 'var(--color-muted)' }}>
        {whyItWins}
      </p>

      <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '0.85rem' }}>
        {visibleSteps.map((step, index) => (
          <div
            key={`opening-step-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.35rem 1fr',
              gap: '0.7rem',
              alignItems: 'start',
              padding: '0.7rem 0.75rem',
              borderRadius: '0.8rem',
              background: index === 0 ? 'rgba(232, 239, 249, 0.72)' : 'rgba(255,255,255,0.7)',
              border: index === 0 ? '1px solid rgba(23, 58, 106, 0.16)' : '1px solid rgba(17, 24, 39, 0.08)',
            }}
          >
            <div
              style={{
                width: '1.35rem',
                height: '1.35rem',
                borderRadius: '999px',
                background: index === 0 ? '#173a6a' : 'rgba(23, 58, 106, 0.12)',
                color: index === 0 ? 'white' : '#173a6a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginTop: '0.05rem',
              }}
            >
              {index + 1}
            </div>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-text)' }}>
              {step}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gap: '0.75rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
        }}
      >
        <div
          style={{
            borderRadius: 'var(--radius-card)',
            padding: '0.8rem 0.85rem',
            background: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(17, 24, 39, 0.08)',
          }}
        >
          <p className="text-label" style={{ marginBottom: '0.35rem', color: 'var(--color-judgment-accent)' }}>
            What to prove next
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            {nextMove}
          </p>
        </div>

        <div
          style={{
            borderRadius: 'var(--radius-card)',
            padding: '0.8rem 0.85rem',
            background: 'rgba(250, 244, 236, 0.72)',
            border: '1px solid rgba(146, 64, 14, 0.12)',
          }}
        >
          <p className="text-label" style={{ marginBottom: '0.4rem', color: 'var(--color-caution)' }}>
            Do not flatten it
          </p>
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            {visibleAvoids.map((line, index) => (
              <p
                key={`opening-avoid-${index}`}
                className="text-small"
                style={{ margin: 0, color: 'rgba(146, 64, 14, 0.86)' }}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function KeepCutReplaceModule({
  rows,
}: {
  rows: Array<{ line: string; verdict: 'keep' | 'cut' | 'replace'; reason: string }>;
}) {
  if (rows.length === 0) return null;

  const verdictColor: Record<string, string> = {
    keep: '#173a6a',
    cut: '#92400e',
    replace: '#2d5a27',
  };

  return (
    <SurfaceCard label="Line by line" variant="judgment" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {rows.map((entry, index) => (
          <div
            key={`${entry.verdict}-${index}`}
            style={{
              border: `1px solid ${entry.verdict === 'keep' ? 'rgba(23,58,106,0.12)' : entry.verdict === 'cut' ? 'rgba(146,64,14,0.14)' : 'rgba(45,90,39,0.14)'}`,
              borderRadius: '0.7rem',
              padding: '0.75rem 0.8rem',
              background: 'rgba(255,255,255,0.75)',
            }}
          >
            <p
              className="text-label"
              style={{ margin: '0 0 0.25rem', color: verdictColor[entry.verdict] }}
            >
              {entry.verdict}
            </p>
            <p
              className="text-small"
              style={{ margin: '0 0 0.4rem', color: 'var(--color-text)', fontWeight: 500 }}
            >
              {entry.line}
            </p>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
              {entry.reason}
            </p>
          </div>
        ))}
      </div>
    </SurfaceCard>
  );
}
