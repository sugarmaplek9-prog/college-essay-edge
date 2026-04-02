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
          'radial-gradient(circle at 82% 16%, rgba(40, 76, 136, 0.14) 0%, rgba(40, 76, 136, 0.06) 18%, transparent 40%), linear-gradient(180deg, #faf6ef 0%, #f5f1ea 20%, #fbfaf7 54%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(4rem, 8vw, 5.5rem) var(--spacing-page) clamp(4.5rem, 10vw, 6rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 'auto auto 12% 62%',
          width: '24rem',
          height: '24rem',
          background: 'radial-gradient(circle, rgba(94, 120, 78, 0.14) 0%, rgba(94, 120, 78, 0.06) 42%, transparent 72%)',
          filter: 'blur(26px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: '75rem',
          margin: '0 auto',
          width: '100%',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {/* A. Top identity row */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label" style={{ marginBottom: '0.35rem', letterSpacing: '0.08em' }}>
            College Essay Edge
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            Narrative Direction Selection
          </p>
        </div>

        {/* B. Main hero + trust panel + artifact */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.12fr) minmax(18rem, 0.88fr)',
            gap: '1.75rem',
            alignItems: 'start',
            marginBottom: '3rem',
          }}
        >
          <div style={{ maxWidth: '44rem' }}>
            <h1 className="text-display" style={{ marginBottom: '1.35rem', lineHeight: 1.04, maxWidth: '40rem' }}>
              Find the strongest direction for your college essay before you draft it.
            </h1>

            <p
              className="text-body"
              style={{
                color: 'var(--color-muted)',
                marginBottom: '2rem',
                maxWidth: '41rem',
              }}
            >
              Bring rough notes, a partial paragraph, or the moment you keep returning to. College Essay Edge helps you choose the strongest direction, understand why it works, and decide what to draft next — while keeping the essay student-authored.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxWidth: '21rem',
                marginBottom: '1.6rem',
              }}
            >
              <Link
                href="/start?entry=notes"
                onClick={handleCtaClick}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#173a6a',
                  color: 'var(--color-surface)',
                  padding: '0.95rem 1.5rem',
                  borderRadius: 'var(--radius-input)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 12px 30px rgba(23, 58, 106, 0.18)',
                }}
              >
                Start with rough notes
              </Link>

              <Link
                href="/start?entry=draft"
                onClick={handleCtaClick}
                style={{
                  display: 'inline-block',
                  color: 'var(--color-text)',
                  border: '1px solid rgba(23, 58, 106, 0.14)',
                  backgroundColor: 'rgba(255,255,255,0.76)',
                  padding: '0.8rem 1.25rem',
                  borderRadius: 'var(--radius-input)',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                I already have a draft
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <aside
              style={{
                border: '1px solid rgba(23, 58, 106, 0.12)',
                borderRadius: '1.3rem',
                backgroundColor: 'rgba(255,255,255,0.76)',
                backdropFilter: 'blur(12px)',
                padding: '1.2rem',
                boxShadow: '0 16px 46px rgba(17, 24, 39, 0.07)',
              }}
            >
              <p className="text-label" style={{ marginBottom: '0.9rem', color: '#173a6a' }}>
                How College Essay Edge makes the call
              </p>
              <div style={{ display: 'grid', gap: '0.7rem' }}>
                <TrustRow
                  title="Learns from reviewed cases"
                  body="The system is built to learn from real reviewed essay work, not just generate polished text."
                />
                <TrustRow
                  title="Chooses stronger directions"
                  body="It compares paths, rejects weaker angles, and pushes toward stronger narrative material."
                />
                <TrustRow
                  title="Stops generic mistakes early"
                  body="It is designed to catch résumé-summary moves, cliché framing, and vague meaning before they take over the draft."
                />
              </div>
            </aside>

            <CoachArtifact />
          </div>
        </section>

        {/* C. Lower principle band */}
        <section
          style={{
            border: '1px solid rgba(23, 58, 106, 0.1)',
            borderRadius: '1.4rem',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.74) 0%, rgba(245, 241, 234, 0.96) 100%)',
            padding: '1.45rem 1.5rem',
            boxShadow: '0 14px 36px rgba(17, 24, 39, 0.04)',
          }}
        >
          <p className="text-label" style={{ marginBottom: '0.85rem', color: '#173a6a' }}>
            Why our approach
          </p>
          <p className="text-small" style={{ margin: '0 0 0.95rem', color: 'var(--color-muted)', maxWidth: '60rem' }}>
            AI-written essays may sound polished, but they often become generic, weakly owned, and strategically less convincing.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              gap: '1rem',
            }}
          >
            <PrincipleItem
              title="Direction before drafting"
              body="A strong essay starts with the right angle, not just smoother writing."
            />
            <PrincipleItem
              title="Judgment backed by ML-guided evaluation"
              body="The system is built to compare options, expose weak paths, and support better decisions."
            />
            <PrincipleItem
              title="Serious guidance without private-consultant pricing"
              body="Families get stronger essay direction and coaching without paying thousands for one-on-one consulting."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function TrustRow({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        border: '1px solid rgba(23, 58, 106, 0.08)',
        borderRadius: '1rem',
        backgroundColor: 'rgba(255,255,255,0.88)',
        padding: '0.85rem 0.95rem',
      }}
    >
      <h2 className="text-body" style={{ margin: '0 0 0.3rem 0', fontWeight: 600, fontSize: '1rem' }}>
        {title}
      </h2>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
        {body}
      </p>
    </article>
  );
}

function CoachArtifact() {
  return (
    <section
      style={{
        border: '1px solid rgba(17, 24, 39, 0.08)',
        borderRadius: '1.35rem',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(244, 247, 251, 0.88) 100%)',
        padding: '1.1rem',
        boxShadow: '0 18px 44px rgba(17, 24, 39, 0.06)',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.8rem', color: '#173a6a' }}>
        Coach comparison
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
          gap: '0.85rem',
          marginBottom: '0.85rem',
        }}
      >
        <ArtifactColumn
          label="Weaker path"
          tone="weaker"
          quote="Soccer taught me leadership."
        />
        <ArtifactColumn
          label="Stronger path"
          tone="stronger"
          quote="I stopped trying to sound like a captain and started noticing the silence after I made a bad pass."
        />
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(23, 58, 106, 0.1)',
          paddingTop: '0.85rem',
        }}
      >
        <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', fontWeight: 600 }}>
          Coach note
        </p>
        <p className="text-small" style={{ margin: '0.3rem 0 0', color: 'var(--color-muted)' }}>
          The stronger path begins with tension and self-awareness, not résumé language.
        </p>
      </div>
    </section>
  );
}

function ArtifactColumn({
  label,
  quote,
  tone,
}: {
  label: string;
  quote: string;
  tone: 'weaker' | 'stronger';
}) {
  return (
    <article
      style={{
        border: tone === 'stronger'
          ? '1px solid rgba(23, 58, 106, 0.2)'
          : '1px solid rgba(128, 94, 52, 0.16)',
        borderRadius: '1rem',
        backgroundColor: tone === 'stronger' ? 'rgba(232, 239, 249, 0.72)' : 'rgba(250, 244, 236, 0.72)',
        padding: '0.95rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.45rem', color: tone === 'stronger' ? '#173a6a' : '#805e34' }}>
        {label}
      </p>
      <p className="text-body" style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6 }}>
        “{quote}”
      </p>
    </article>
  );
}

function PrincipleItem({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        padding: '0.15rem 0.2rem',
      }}
    >
      <h2 className="text-body" style={{ margin: '0 0 0.45rem 0', fontWeight: 600 }}>
        {title}
      </h2>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
        {body}
      </p>
    </article>
  );
}
