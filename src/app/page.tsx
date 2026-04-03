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
        background: 'linear-gradient(180deg, #f7f3eb 0%, #f3eee5 34%, #faf8f3 72%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(4rem, 8vw, 5.8rem) var(--spacing-page) clamp(4.8rem, 10vw, 6.4rem)',
      }}
    >
      <div
        style={{
          maxWidth: '74rem',
          margin: '0 auto',
          width: '100%',
        }}
      >
        <header style={{ marginBottom: '1.6rem' }}>
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
            gridTemplateColumns: 'minmax(0, 0.86fr) minmax(20rem, 1.14fr)',
            gap: 'clamp(2rem, 4vw, 3.4rem)',
            alignItems: 'start',
            marginBottom: 'clamp(2.8rem, 6vw, 4.4rem)',
          }}
        >
          <div style={{ maxWidth: '31rem', paddingTop: '0.7rem' }}>
            <p
              className="text-label"
              style={{
                marginBottom: '0.9rem',
                color: '#173a6a',
                letterSpacing: '0.1em',
              }}
            >
              Consequence first
            </p>

            <h1
              className="text-display"
              style={{
                marginBottom: '1rem',
                fontSize: 'clamp(3rem, 6.8vw, 5rem)',
                lineHeight: 0.94,
                letterSpacing: '-0.05em',
                maxWidth: '28rem',
              }}
            >
              Stop before the wrong essay hardens.
            </h1>

            <p
              className="text-body"
              style={{
                marginBottom: '1.8rem',
                color: 'var(--color-muted)',
                maxWidth: '29rem',
                fontSize: '1.06rem',
                lineHeight: 1.65,
              }}
            >
              Bring the note, half draft, or safe version you keep polishing. College Essay Edge makes one clear call on what earns the page and what to kill.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.9rem' }}>
              <Link
                href="/start?entry=notes"
                onClick={handleCtaClick}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '3.2rem',
                  padding: '0.95rem 1.4rem',
                  borderRadius: '999px',
                  backgroundColor: '#173a6a',
                  color: 'var(--color-surface)',
                  textDecoration: 'none',
                  fontWeight: 650,
                  boxShadow: '0 18px 34px rgba(23, 58, 106, 0.14)',
                }}
              >
                Start with rough notes
              </Link>

              <Link
                href="/start?entry=draft"
                onClick={handleCtaClick}
                style={{
                  color: 'rgba(23, 58, 106, 0.88)',
                  textDecoration: 'none',
                  fontSize: '0.96rem',
                  fontWeight: 600,
                }}
              >
                Already drafted? Start there
              </Link>
            </div>
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
        border: '1px solid rgba(23, 58, 106, 0.14)',
        borderRadius: '1.8rem',
        background: 'rgba(255,255,255,0.78)',
        padding: '1.65rem',
        boxShadow: '0 24px 60px rgba(17, 24, 39, 0.08)',
      }}
    >
      <div style={{ display: 'grid', gap: '1.15rem' }}>
        <p className="text-label" style={{ marginBottom: 0, color: '#173a6a' }}>
          Raw note → real call
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: '0.9rem',
            alignItems: 'start',
          }}
        >
          <ArtifactPanel
            label="Raw note"
            body="I kept organizing the preschool room until I noticed one child sitting alone."
          />

          <div
            style={{
              borderLeft: '1px solid rgba(23, 58, 106, 0.12)',
              paddingLeft: '1.1rem',
              minHeight: '100%',
            }}
          >
            <p className="text-label" style={{ marginBottom: '0.45rem', color: '#173a6a' }}>
              Real call
            </p>
            <p
              className="text-body"
              style={{
                margin: '0 0 0.8rem',
                fontSize: '1.55rem',
                lineHeight: 1.16,
                letterSpacing: '-0.03em',
                fontWeight: 650,
                maxWidth: '15rem',
              }}
            >
              Not helpfulness. Attention.
            </p>
            <p
              className="text-small"
              style={{
                margin: 0,
                color: 'var(--color-muted)',
                lineHeight: 1.6,
                maxWidth: '18rem',
              }}
            >
              One decision, not five maybes.
              <br />
              Parent-safe by design.
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
        borderRadius: '1.2rem',
        backgroundColor: 'rgba(247, 243, 236, 0.92)',
        border: '1px solid rgba(128, 94, 52, 0.1)',
        padding: '1rem 1rem 1.05rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.45rem', color: '#805e34' }}>
        {label}
      </p>
      <p className="text-body" style={{ margin: 0, lineHeight: 1.58, fontSize: '1rem' }}>
        “{body}”
      </p>
    </div>
  );
}

function EditorialComparison() {
  return (
    <section
      style={{
        marginBottom: 'clamp(2.8rem, 6vw, 4rem)',
        paddingTop: '0.3rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.72fr) minmax(0, 1.28fr)',
          gap: '1.2rem',
          alignItems: 'end',
          marginBottom: '1.1rem',
        }}
      >
        <div>
          <p className="text-label" style={{ marginBottom: '0.55rem', color: '#173a6a' }}>
            The decision artifact
          </p>
          <p
            className="text-body"
            style={{
              margin: 0,
              maxWidth: '18rem',
              color: 'var(--color-muted)',
              lineHeight: 1.58,
            }}
          >
            Avoid the safe version. Keep the one with stakes.
          </p>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(23, 58, 106, 0.14)',
            paddingTop: '0.9rem',
          }}
        >
          <p
            className="text-body"
            style={{
              margin: 0,
              fontSize: '1.22rem',
              lineHeight: 1.45,
              maxWidth: '34rem',
            }}
          >
            The job is not to polish both versions. It is to choose the one that gives the reader a mistake, a shift, and a cost.
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(13rem, 0.76fr) minmax(0, 1.24fr)',
          gap: '1.1rem',
          alignItems: 'stretch',
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
          quote="After the bad pass, I stopped trying to sound like a captain and paid attention to the silence I had created."
          body="Mistake. Shift. Consequence. Something real can finally happen on the page."
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
        border: isChoose
          ? '1px solid rgba(23, 58, 106, 0.18)'
          : '1px solid rgba(128, 94, 52, 0.12)',
        borderRadius: '1.6rem',
        background: isChoose ? 'rgba(255,255,255,0.9)' : 'rgba(249, 244, 236, 0.72)',
        padding: isChoose ? '1.45rem 1.5rem' : '1.2rem 1.2rem 1.25rem',
        boxShadow: isChoose ? '0 22px 50px rgba(17, 24, 39, 0.08)' : 'none',
        display: 'grid',
        alignContent: 'start',
        gap: '0.75rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: 0, color: isChoose ? '#173a6a' : '#805e34' }}>
        {label}
      </p>

      <p
        className="text-body"
        style={{
          margin: 0,
          fontSize: isChoose ? '1.45rem' : '1.08rem',
          lineHeight: isChoose ? 1.42 : 1.55,
          letterSpacing: isChoose ? '-0.03em' : '-0.01em',
          fontWeight: isChoose ? 650 : 560,
          maxWidth: isChoose ? '33rem' : '16rem',
        }}
      >
        “{quote}”
      </p>

      <p
        className="text-small"
        style={{
          margin: 0,
          color: isChoose ? 'var(--color-text)' : 'var(--color-muted)',
          fontSize: isChoose ? '1rem' : '0.95rem',
          lineHeight: 1.62,
          maxWidth: isChoose ? '29rem' : '15rem',
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
        paddingTop: '1.5rem',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          gap: '1.3rem',
          alignItems: 'start',
          marginBottom: '1.2rem',
        }}
      >
        <div>
          <p className="text-label" style={{ marginBottom: '0.5rem', color: '#173a6a' }}>
            Why this matters
          </p>
          <p
            className="text-body"
            style={{
              margin: 0,
              fontSize: '1.2rem',
              lineHeight: 1.48,
              maxWidth: '24rem',
            }}
          >
            The quiet expensive mistake happens before the draft is finished.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '1rem',
          }}
        >
          <TruthColumn
            title="Polished can still be wrong"
            body="A cleaner sentence does not rescue a weak center."
          />
          <TruthColumn
            title="Safe choices harden fast"
            body="Respectable versions get drafted early and questioned late."
          />
          <TruthColumn
            title="The real win is earlier"
            body="Make the call before the draft starts absorbing time."
          />
        </div>
      </div>
    </section>
  );
}

function TruthColumn({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ paddingRight: '0.5rem' }}>
      <h2
        className="text-body"
        style={{
          margin: '0 0 0.45rem',
          fontSize: '1.02rem',
          fontWeight: 650,
          lineHeight: 1.42,
        }}
      >
        {title}
      </h2>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', lineHeight: 1.6 }}>
        {body}
      </p>
    </div>
  );
}
