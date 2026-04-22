export function PageIntroBlock({ content }: { content: Record<string, unknown> }) {
  return (
    <section style={{ marginBottom: '0.55rem' }}>
      {content.eyebrow ? (
        <p className="text-label" style={{ marginBottom: '0.35rem', color: 'var(--color-judgment-accent)' }}>
          {String(content.eyebrow)}
        </p>
      ) : null}
      <h1 style={{ margin: '0 0 0.45rem', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 700, lineHeight: 1.18, letterSpacing: '-0.02em', color: 'var(--color-text)' }}>
        {String(content.title ?? '')}
      </h1>
      {content.subtitle ? (
        <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', maxWidth: '44rem' }}>
          {String(content.subtitle)}
        </p>
      ) : null}
      {content.support ? (
        <p className="text-small" style={{ margin: '0.45rem 0 0', color: 'var(--color-text)', fontWeight: 500, maxWidth: '42rem' }}>
          {String(content.support)}
        </p>
      ) : null}
    </section>
  );
}

export default PageIntroBlock;
