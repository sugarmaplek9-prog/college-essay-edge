'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { fireFmEvent, buildEvent } from '@/lib/fm/events';

export default function HomePage() {
  useEffect(() => {
    const { name, payload } = buildEvent('fm_homepage_view', 'homepage');
    fireFmEvent(name, payload);
  }, []);

  function handleCtaClick() {
    const { name, payload } = buildEvent('fm_cta_click', 'homepage');
    fireFmEvent(name, payload);
  }

  return (
    <main
      style={{
        minHeight: '100svh',
        background:
          'radial-gradient(circle at 82% 10%, rgba(23, 58, 106, 0.16) 0%, rgba(23, 58, 106, 0.08) 20%, transparent 44%), radial-gradient(circle at 18% 24%, rgba(124, 102, 69, 0.08) 0%, rgba(124, 102, 69, 0.04) 20%, transparent 48%), linear-gradient(180deg, #f8f3ea 0%, #f1eadf 30%, #f7f4ed 67%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(4.6rem, 8vw, 6.4rem) var(--spacing-page) clamp(5.8rem, 11vw, 7.6rem)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '4% auto auto 59%',
          width: '30rem',
          height: '30rem',
          background: 'radial-gradient(circle, rgba(23, 58, 106, 0.14) 0%, rgba(23, 58, 106, 0.06) 42%, transparent 72%)',
          filter: 'blur(34px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          maxWidth: '76rem',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
        }}
      >
        <header style={{ marginBottom: '2.2rem' }}>
          <p className="text-label" style={{ marginBottom: '0.32rem', letterSpacing: '0.08em' }}>
            College Essay Edge
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            Decide the essay before you draft it
          </p>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.72fr) minmax(22rem, 1.28fr)',
            gap: 'clamp(3rem, 6vw, 5.2rem)',
            alignItems: 'center',
            marginBottom: 'clamp(4rem, 7vw, 5.8rem)',
          }}
        >
          <div style={{ maxWidth: '24rem', paddingTop: '0.5rem' }}>
            <p
              className="text-label"
              style={{
                marginBottom: '1rem',
                color: '#173a6a',
                letterSpacing: '0.1em',
              }}
            >
              Decision before draft
            </p>

            <h1
              className="text-display"
              style={{
                marginBottom: '1.15rem',
                fontSize: 'clamp(3.05rem, 6vw, 4.8rem)',
                lineHeight: 0.9,
                letterSpacing: '-0.05em',
                maxWidth: '21rem',
              }}
            >
              <span style={{ display: 'block' }}>Choose the real</span>
              <span style={{ display: 'block' }}>essay before</span>
              <span style={{ display: 'block' }}>the safe one hardens.</span>
            </h1>

            <p
              className="text-body"
              style={{
                marginBottom: '2.4rem',
                color: 'var(--color-muted)',
                maxWidth: '19rem',
                fontSize: '1rem',
                lineHeight: 1.58,
              }}
            >
              Bring the note or draft. We make the real call.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
              <Link
                href="/start?entry=notes"
                onClick={handleCtaClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '3.25rem',
                  padding: '0.98rem 1.5rem',
                  borderRadius: '999px',
                  backgroundColor: '#173a6a',
                  color: 'var(--color-surface)',
                  textDecoration: 'none',
                  fontWeight: 650,
                  boxShadow: '0 18px 42px rgba(23, 58, 106, 0.16)',
                }}
              >
                Start with rough notes
              </Link>

              <Link
                href="/start?entry=draft"
                onClick={handleCtaClick}
                style={{
                  color: 'rgba(23, 58, 106, 0.76)',
                  textDecoration: 'none',
                  fontSize: '0.93rem',
                  fontWeight: 600,
                }}
              >
                I already have a draft
              </Link>
            </div>

            <p
              className="text-small"
              style={{
                margin: '1.6rem 0 0',
                color: 'rgba(23, 58, 106, 0.72)',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                maxWidth: '18rem',
              }}
            >
              Parent-safe by design.
            </p>
          </div>

          <SignatureArtifact />
        </section>

        <EditorialComparison />

        <TrustStrip />
      </div>
    </main>
  );
}

function SignatureArtifact() {
  return (
    <aside
      style={{
        border: '1px solid rgba(23, 58, 106, 0.12)',
        borderRadius: '2.35rem',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247, 243, 235, 0.98) 52%, rgba(237, 242, 249, 0.98) 100%)',
        padding: '2rem',
        boxShadow: '0 30px 78px rgba(17, 24, 39, 0.12)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-3rem -3rem auto auto',
          width: '16rem',
          height: '16rem',
          background: 'radial-gradient(circle, rgba(23, 58, 106, 0.18) 0%, rgba(23, 58, 106, 0.08) 42%, transparent 74%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'grid', gap: '1.5rem', position: 'relative' }}>
        <p className="text-label" style={{ marginBottom: 0, color: '#173a6a' }}>
          From note to call
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(13rem, 0.76fr) minmax(0, 1.24fr)',
            gap: '1.4rem',
            alignItems: 'stretch',
          }}
        >
          <ArtifactPanel
            label="Raw note"
            body="I kept organizing the preschool room until I noticed one child sitting alone."
          />

          <div
            style={{
              display: 'grid',
              alignContent: 'space-between',
              minHeight: '100%',
              paddingLeft: '0.2rem',
            }}
          >
            <p className="text-label" style={{ marginBottom: '0.45rem', color: '#173a6a' }}>
              Real call.
            </p>
            <p
              className="text-body"
              style={{
                margin: '0 0 1rem',
                fontSize: 'clamp(2rem, 3.3vw, 2.9rem)',
                lineHeight: 0.94,
                letterSpacing: '-0.055em',
                fontWeight: 680,
                maxWidth: '18rem',
              }}
            >
              Attention, not helpfulness.
            </p>
            <p
              className="text-small"
              style={{
                margin: 0,
                color: 'rgba(23, 58, 106, 0.72)',
                lineHeight: 1.55,
                maxWidth: '15rem',
              }}
            >
              One serious decision.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function ArtifactPanel({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  return (
    <div
      style={{
        borderRadius: '1.45rem',
        backgroundColor: 'rgba(248, 242, 233, 0.84)',
        border: '1px solid rgba(128, 94, 52, 0.1)',
        padding: '1.15rem 1.05rem 1.25rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.45rem', color: '#805e34' }}>
        {label}
      </p>
      <p className="text-body" style={{ margin: 0, lineHeight: 1.58, fontSize: '0.98rem', maxWidth: '13rem' }}>
        “{body}”
      </p>
    </div>
  );
}

function EditorialComparison() {
  return (
    <section
      style={{
        marginBottom: 'clamp(4rem, 7vw, 5.4rem)',
        padding: '0.2rem 0 0.2rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.62fr) minmax(0, 1.38fr)',
          gap: '1.8rem',
          alignItems: 'end',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <p className="text-label" style={{ marginBottom: '0.55rem', color: '#173a6a' }}>
            Editorial judgment
          </p>
          <p
            className="text-body"
            style={{
              margin: 0,
              maxWidth: '16rem',
              fontSize: '1.45rem',
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              fontWeight: 650,
            }}
          >
            The respectable one dies first.
          </p>
        </div>

        <div>
          <p
            className="text-body"
            style={{
              margin: '0 0 0.55rem',
              fontSize: '1.08rem',
              lineHeight: 1.5,
              maxWidth: '31rem',
            }}
          >
            Keep the line with mistake, shift, and cost.
          </p>
          <p
            className="text-small"
            style={{
              margin: 0,
              color: 'var(--color-muted)',
              lineHeight: 1.5,
            }}
          >
            Kill the respectable one. Keep the line with damage in it.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(11rem, 0.56fr) minmax(0, 1.44fr)',
          gap: '1.8rem',
          alignItems: 'stretch',
          borderTop: '1px solid rgba(23, 58, 106, 0.1)',
          paddingTop: '1.35rem',
        }}
      >
        <ComparisonSide
          label="Avoid"
          quote="Soccer taught me leadership and resilience."
          body="Clean. Respectable. Replaceable."
          tone="avoid"
        />

        <ComparisonSide
          label="Choose"
          quote="After the bad pass, I stopped sounding like a captain and looked at the silence I had made."
          body="Mistake. Shift. Consequence."
          tone="choose"
        />
      </div>
    </section>
  );
}

function ComparisonSide({
  label,
  quote,
  body,
  tone,
}: {
  label: string;
  quote: string;
  body: string;
  tone: 'avoid' | 'choose';
}) {
  const isChoose = tone === 'choose';

  return (
    <article
      style={{
        borderLeft: isChoose ? '1px solid rgba(23, 58, 106, 0.14)' : 'none',
        background: isChoose ? 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(235, 241, 249, 0.76) 100%)' : 'transparent',
        padding: isChoose ? '1.55rem 0 1.55rem 1.5rem' : '0.35rem 0 0.35rem',
        boxShadow: 'none',
        display: 'grid',
        alignContent: 'start',
        gap: isChoose ? '0.7rem' : '0.55rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: 0, color: isChoose ? '#173a6a' : '#805e34' }}>
        {label}
      </p>

      <p
        className="text-body"
        style={{
          margin: 0,
          fontSize: isChoose ? '1.78rem' : '0.98rem',
          lineHeight: isChoose ? 1.24 : 1.55,
          letterSpacing: isChoose ? '-0.03em' : '-0.01em',
          fontWeight: isChoose ? 650 : 540,
          maxWidth: isChoose ? '28rem' : '12rem',
        }}
      >
        “{quote}”
      </p>

      <p
        className="text-small"
        style={{
          margin: 0,
          color: isChoose ? 'var(--color-text)' : 'var(--color-muted)',
          fontSize: isChoose ? '0.96rem' : '0.88rem',
          lineHeight: 1.55,
          maxWidth: isChoose ? '17rem' : '11rem',
        }}
      >
        {body}
      </p>
    </article>
  );
}

function TrustStrip() {
  return (
    <section
      style={{
        borderTop: '1px solid rgba(23, 58, 106, 0.12)',
        borderBottom: '1px solid rgba(23, 58, 106, 0.08)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(243, 238, 230, 0.88) 55%, rgba(255,255,255,0.72) 100%)',
        padding: '1.9rem 0.15rem 1.55rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.78fr) minmax(0, 1.22fr)',
          gap: '1.8rem',
          alignItems: 'start',
        }}
      >
        <div>
          <p className="text-label" style={{ marginBottom: '0.5rem', color: '#173a6a' }}>
            Why this matters
          </p>
          <p
            className="text-body"
            style={{
              margin: '0 0 0.55rem',
              fontSize: '1.44rem',
              lineHeight: 1.18,
              maxWidth: '16rem',
              letterSpacing: '-0.03em',
            }}
          >
            Most drafts fail early.
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.55, maxWidth: '21rem' }}>
            The expensive mistake happens before the draft is finished.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '1.1rem',
          }}
        >
          <TruthColumn title="Polished still loses" body="A cleaner sentence does not rescue a weak center." />
          <TruthColumn title="Safe gets sticky" body="Respectable versions get drafted early and questioned late." />
          <TruthColumn title="The gain is earlier" body="Make the call before the draft starts absorbing time." />
        </div>
      </div>
    </section>
  );
}

function TruthColumn({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ paddingRight: '0.6rem', borderLeft: '1px solid rgba(23, 58, 106, 0.08)', paddingLeft: '1rem' }}>
      <h2
        className="text-body"
        style={{
          margin: '0 0 0.45rem',
          fontSize: '0.98rem',
          fontWeight: 650,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.52, maxWidth: '12rem' }}>
        {body}
      </p>
    </div>
  );
}
