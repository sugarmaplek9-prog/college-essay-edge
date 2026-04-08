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
          'radial-gradient(circle at 84% 12%, rgba(23, 58, 106, 0.2) 0%, rgba(23, 58, 106, 0.08) 22%, transparent 44%), radial-gradient(circle at 16% 28%, rgba(94, 120, 78, 0.1) 0%, rgba(94, 120, 78, 0.04) 22%, transparent 48%), linear-gradient(180deg, #f8f3ea 0%, #f2ebdf 21%, #f9f6ef 55%, #ffffff 100%)',
        color: 'var(--color-text)',
        padding: 'clamp(4.2rem, 8vw, 5.8rem) var(--spacing-page) clamp(4.8rem, 10vw, 6.2rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '4% auto auto 58%',
          width: '30rem',
          height: '30rem',
          background: 'radial-gradient(circle, rgba(23, 58, 106, 0.16) 0%, rgba(23, 58, 106, 0.07) 38%, transparent 68%)',
          filter: 'blur(28px)',
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
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-label" style={{ marginBottom: '0.35rem', letterSpacing: '0.08em' }}>
            College Essay Edge
          </p>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            Decide the essay before you draft it
          </p>
        </div>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.82fr) minmax(21rem, 1.18fr)',
            gap: '2.7rem',
            alignItems: 'center',
            marginBottom: '2.5rem',
          }}
        >
          <div style={{ maxWidth: '34rem', paddingTop: '0.9rem' }}>
            <p
              className="text-label"
              style={{
                marginBottom: '0.8rem',
                color: '#173a6a',
                letterSpacing: '0.1em',
              }}
            >
              Avoid the expensive wrong draft
            </p>

            <h1
              className="text-display"
              style={{
                marginBottom: '1rem',
                lineHeight: 0.93,
                maxWidth: '33rem',
                fontSize: 'clamp(3.1rem, 7vw, 5.4rem)',
                letterSpacing: '-0.045em',
              }}
            >
              Stop before you spend weeks on the wrong essay.
            </h1>

            <p
              className="text-body"
              style={{
                color: 'var(--color-muted)',
                marginBottom: '2.2rem',
                maxWidth: '31rem',
                fontSize: '1.08rem',
                lineHeight: 1.68,
              }}
            >
              Bring rough notes, a half draft, or the story you keep circling. College Essay Edge makes one serious call on what is worth writing — and shows you the safe, polished version to kill before it eats the month.
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxWidth: '21rem',
                marginBottom: '1.4rem',
              }}
            >
              <Link
                href="/start?entry=notes"
                onClick={handleCtaClick}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#173a6a',
                  color: 'var(--color-surface)',
                  padding: '1rem 1.55rem',
                  borderRadius: 'var(--radius-input)',
                  fontWeight: 650,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 16px 36px rgba(23, 58, 106, 0.2)',
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
                  padding: '0.84rem 1.25rem',
                  borderRadius: 'var(--radius-input)',
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
              >
                I already have a draft
              </Link>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.65rem',
                maxWidth: '30rem',
                marginBottom: '1.2rem',
              }}
            >
              <SupportPill label="See the weak angle before it eats the draft" />
              <SupportPill label="Get one clear call, not vague brainstorming" />
              <SupportPill label="Serious guidance without ghostwriting" />
            </div>

            <p
              className="text-small"
              style={{
                margin: 0,
                color: 'rgba(23, 58, 106, 0.84)',
                maxWidth: '29rem',
                fontSize: '0.95rem',
                lineHeight: 1.6,
              }}
            >
              Guidance with restraint for students and families who want judgment they can trust — not ghostwriting, and not another thoughtful writing tool that never makes the hard call.
            </p>
          </div>

          <DominantProofSurface />
        </section>

        <ComparisonSpotlight />

        <section
          style={{
            borderTop: '1px solid rgba(23, 58, 106, 0.12)',
            borderBottom: '1px solid rgba(23, 58, 106, 0.08)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.44) 0%, rgba(244, 239, 231, 0.94) 48%, rgba(255,255,255,0.78) 100%)',
            padding: '2rem 0.2rem 1.45rem',
          }}
        >
          <p className="text-label" style={{ marginBottom: '0.85rem', color: '#173a6a' }}>
            Why this matters before the first draft
          </p>
          <p
            className="text-body"
            style={{
              margin: '0 0 1.45rem',
              color: 'var(--color-text)',
              maxWidth: '56rem',
              fontSize: '1.18rem',
              lineHeight: 1.56,
            }}
          >
            Families do not pay for prettier brainstorming. They pay to avoid the quiet expensive mistake: a draft that sounds polished, feels safe, and still was never the right essay.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
              gap: '1.2rem',
            }}
          >
            <TrustConsequence
              title="Polished can still be the wrong essay"
              body="A cleaner paragraph does not fix a weak angle. Students lose hours polishing essays that were never the right story in the first place."
            />
            <TrustConsequence
              title="Most students lock into the safe version too early"
              body="They grab the respectable angle because it sounds acceptable. That is usually how a personal essay turns generic before the real story ever gets a chance."
            />
            <TrustConsequence
              title="Make the call before drafting time is gone"
              body="The real cost of getting the angle wrong shows up before the draft is finished: lost nights, weaker material, and a story that never earns the page."
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function SupportPill({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid rgba(23, 58, 106, 0.12)',
        borderRadius: '999px',
        backgroundColor: 'rgba(255,255,255,0.82)',
        padding: '0.5rem 0.8rem',
        fontSize: '0.85rem',
        lineHeight: 1.35,
        color: 'var(--color-text)',
      }}
    >
      {label}
    </span>
  );
}

function DominantProofSurface() {
  return (
    <aside
      style={{
        border: '1px solid rgba(23, 58, 106, 0.18)',
        borderRadius: '1.85rem',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(242, 238, 230, 0.98) 56%, rgba(236, 242, 250, 0.98) 100%)',
        padding: '1.7rem',
        boxShadow: '0 30px 76px rgba(17, 24, 39, 0.13)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '-3rem -4rem auto auto',
          width: '14rem',
          height: '14rem',
          background: 'radial-gradient(circle, rgba(23, 58, 106, 0.18) 0%, rgba(23, 58, 106, 0.08) 42%, transparent 72%)',
          filter: 'blur(18px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', display: 'grid', gap: '1.1rem' }}>
        <p className="text-label" style={{ marginBottom: 0, color: '#173a6a' }}>
          Proof of judgment
        </p>

        <div>
          <p className="text-small" style={{ margin: '0 0 0.45rem', color: 'rgba(23, 58, 106, 0.84)', fontWeight: 700 }}>
            From rough note to a real call
          </p>
          <p
            className="text-body"
            style={{
              margin: 0,
              fontSize: '1.35rem',
              lineHeight: 1.45,
              fontWeight: 600,
              maxWidth: '34rem',
            }}
          >
            You do not get a motivational summary. You get the sentence that decides what the essay is actually about — and what to stop drafting.
          </p>
        </div>

        <div
          style={{
            borderRadius: '1.35rem',
            background: 'rgba(255,255,255,0.88)',
            border: '1px solid rgba(23, 58, 106, 0.12)',
            padding: '1.2rem',
            display: 'grid',
            gap: '0.9rem',
          }}
        >
          <CalloutBlock
            label="Raw note"
            tone="raw"
            body="I kept organizing the preschool room until I noticed one child sitting alone."
          />
          <CalloutBlock
            label="The call"
            tone="call"
            body="This is not an essay about being helpful. It is about the moment care stopped meaning tasks and started meaning attention."
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.14fr) minmax(15rem, 0.86fr)',
            gap: '0.95rem',
          }}
        >
          <div
            style={{
              borderRadius: '1.2rem',
              background: 'rgba(244, 238, 229, 0.9)',
              border: '1px solid rgba(128, 94, 52, 0.12)',
              padding: '1rem 1.05rem',
            }}
          >
            <p className="text-label" style={{ marginBottom: '0.45rem', color: '#805e34' }}>
              The consequence is visible
            </p>
            <p className="text-small" style={{ margin: '0 0 0.65rem', color: 'var(--color-text)', lineHeight: 1.58 }}>
              A weak angle still sounds acceptable. It just burns time while giving the reader nothing to hold on to.
            </p>
            <OutcomeList
              items={[
                'The generic version gets named and cut early.',
                'The stronger version tells you what earns the page.',
                'You leave with one path to draft, not five maybes.',
              ]}
            />
          </div>

          <div
            style={{
              borderRadius: '1.2rem',
              background: 'rgba(232, 239, 249, 0.84)',
              border: '1px solid rgba(23, 58, 106, 0.14)',
              padding: '1rem 1.05rem',
            }}
          >
            <p className="text-label" style={{ marginBottom: '0.45rem', color: '#173a6a' }}>
              Parent-safe by design
            </p>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.6 }}>
              Strong guidance, visible restraint. The product helps the student find the right center without writing the essay for them.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function CalloutBlock({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone: 'raw' | 'call';
}) {
  return (
    <div
      style={{
        borderRadius: '1rem',
        backgroundColor: tone === 'call' ? 'rgba(232, 239, 249, 0.88)' : 'rgba(247, 243, 236, 0.92)',
        border: tone === 'call'
          ? '1px solid rgba(23, 58, 106, 0.14)'
          : '1px solid rgba(128, 94, 52, 0.12)',
        padding: '0.95rem 1rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.4rem', color: tone === 'call' ? '#173a6a' : '#805e34' }}>
        {label}
      </p>
      <p
        className="text-body"
        style={{
          margin: 0,
          color: 'var(--color-text)',
          fontSize: tone === 'call' ? '1.1rem' : '1rem',
          lineHeight: 1.6,
          fontWeight: tone === 'call' ? 600 : 500,
        }}
      >
        {tone === 'raw' ? `“${body}”` : body}
      </p>
    </div>
  );
}

function OutcomeList({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: '1rem', display: 'grid', gap: '0.45rem' }}>
      {items.map((item) => (
        <li key={item} className="text-small" style={{ color: 'var(--color-text)', lineHeight: 1.55 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ComparisonSpotlight() {
  return (
    <section
      style={{
        border: '1px solid rgba(17, 24, 39, 0.12)',
        borderRadius: '1.95rem',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(240, 244, 250, 0.96) 42%, rgba(246, 241, 232, 0.98) 100%)',
        padding: '1.75rem',
        boxShadow: '0 26px 72px rgba(17, 24, 39, 0.11)',
        marginBottom: '2.45rem',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.65rem', color: '#173a6a' }}>
        Generic path vs essay worth writing
      </p>
      <p
        className="text-body"
        style={{
          margin: '0 0 1.2rem',
          color: 'var(--color-text)',
          fontSize: '1.24rem',
          fontWeight: 600,
          maxWidth: '44rem',
          lineHeight: 1.45,
        }}
      >
        This is the signature product reveal: not nicer wording, but a materially stronger story call.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
          gap: '1rem',
          marginBottom: '1.15rem',
        }}
      >
        <ComparisonColumn
          label="Safe angle to avoid"
          tone="weaker"
          quote="Soccer taught me leadership and resilience."
          body="Sounds acceptable. Feels interchangeable. Gives the reader no real reason to keep going."
        />
        <ComparisonColumn
          label="Essay worth writing"
          tone="stronger"
          quote="After I made the bad pass, I stopped trying to sound like a captain and started paying attention to the silence I had created."
          body="Starts with tension, exposes a blind spot, and gives the essay a real turn instead of a résumé lesson."
        />
      </div>
      <div
        style={{
          borderTop: '1px solid rgba(23, 58, 106, 0.1)',
          paddingTop: '1rem',
        }}
      >
        <p className="text-small" style={{ margin: 0, color: '#173a6a', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Coach verdict
        </p>
        <p className="text-body" style={{ margin: '0.45rem 0 0', color: 'var(--color-text)', fontSize: '1.15rem', lineHeight: 1.56, maxWidth: '48rem' }}>
          The second path earns the page. It gives the reader a mistake, a shift, and a reason this student changed. The first path is exactly how strong students lose weeks to an essay that sounds respectable and lands flat.
        </p>
      </div>
    </section>
  );
}

function ComparisonColumn({
  label,
  quote,
  body,
  tone,
}: {
  label: string;
  quote: string;
  body: string;
  tone: 'weaker' | 'stronger';
}) {
  return (
    <article
      style={{
        border: tone === 'stronger'
          ? '1px solid rgba(23, 58, 106, 0.24)'
          : '1px solid rgba(128, 94, 52, 0.16)',
        borderRadius: '1.35rem',
        backgroundColor: tone === 'stronger' ? 'rgba(232, 239, 249, 0.84)' : 'rgba(250, 244, 236, 0.8)',
        padding: tone === 'stronger' ? '1.4rem' : '1.2rem',
        boxShadow: tone === 'stronger' ? '0 20px 42px rgba(23, 58, 106, 0.1)' : 'none',
      }}
    >
      <p className="text-label" style={{ marginBottom: '0.45rem', color: tone === 'stronger' ? '#173a6a' : '#805e34' }}>
        {label}
      </p>
      <p
        className="text-body"
        style={{
          margin: '0 0 0.8rem',
          fontSize: tone === 'stronger' ? '1.34rem' : '1.14rem',
          lineHeight: 1.55,
          fontWeight: 650,
          maxWidth: tone === 'stronger' ? '31rem' : '24rem',
        }}
      >
        “{quote}”
      </p>
      <p className="text-small" style={{ margin: 0, color: tone === 'stronger' ? 'rgba(17, 24, 39, 0.84)' : 'var(--color-muted)', fontSize: '0.98rem', lineHeight: 1.6 }}>
        {body}
      </p>
    </article>
  );
}

function TrustConsequence({ title, body }: { title: string; body: string }) {
  return (
    <article
      style={{
        padding: '0.25rem 1rem 0.25rem 0',
        borderRight: '1px solid rgba(23, 58, 106, 0.08)',
      }}
    >
      <h2 className="text-body" style={{ margin: '0 0 0.55rem 0', fontWeight: 650, fontSize: '1.08rem', maxWidth: '17rem' }}>
        {title}
      </h2>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)', maxWidth: '18rem', lineHeight: 1.65 }}>
        {body}
      </p>
    </article>
  );
}
