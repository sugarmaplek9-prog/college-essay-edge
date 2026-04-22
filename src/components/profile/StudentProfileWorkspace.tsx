import Link from 'next/link';
import { StudentAppShell } from '@/components/app-shell/StudentAppShell';

function Card({
  label,
  title,
  children,
  emphasis = 'default',
}: {
  label: string;
  title: string;
  children: React.ReactNode;
  emphasis?: 'default' | 'primary' | 'warning';
}) {
  const borderColor =
    emphasis === 'primary'
      ? 'rgba(23, 58, 106, 0.14)'
      : emphasis === 'warning'
        ? 'rgba(146, 64, 14, 0.16)'
        : 'rgba(17, 24, 39, 0.08)';
  const background =
    emphasis === 'primary'
      ? 'rgba(243, 247, 255, 0.86)'
      : emphasis === 'warning'
        ? 'rgba(255, 248, 240, 0.84)'
        : 'rgba(255,255,255,0.74)';
  const labelColor = emphasis === 'warning' ? 'var(--color-caution)' : 'var(--color-judgment-accent)';

  return (
    <section
      style={{
        padding: '1rem',
        borderRadius: '1.15rem',
        border: `1px solid ${borderColor}`,
        background,
        boxShadow: '0 12px 26px rgba(17, 24, 39, 0.04)',
      }}
    >
      <p className="text-label" style={{ margin: 0, color: labelColor }}>{label}</p>
      <h2 style={{ margin: '0.35rem 0 0.7rem', fontSize: '1.18rem', color: 'var(--color-text)' }}>{title}</h2>
      {children}
    </section>
  );
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        marginTop: '0.75rem',
        textDecoration: 'none',
        padding: '0.58rem 0.85rem',
        borderRadius: '999px',
        border: '1px solid rgba(23, 58, 106, 0.12)',
        background: 'rgba(255,255,255,0.86)',
        color: 'var(--color-judgment-accent)',
        fontSize: '0.92rem',
        fontWeight: 700,
      }}
    >
      {label}
    </Link>
  );
}

export function StudentProfileWorkspace() {
  return (
    <StudentAppShell
      title="Profile / Discovery Context"
      subtitle="Keep student context, discovery readiness, and support boundaries visible so supplement overlap, story evidence, and the next workflow decision all use the right material."
      activeNav="Profile"
      previewLinks={[
        { href: '/app/profile', label: 'Current context', active: true },
        { href: '/app?state=ready', label: 'Home handoff' },
        { href: '/app/story-vault?state=analysis_available', label: 'Evidence handoff' },
      ]}
    >
      <div style={{ display: 'grid', gap: '0.95rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)', gap: '0.95rem' }}>
          <Card label="Student snapshot" title="Profile context that should change the next decision." emphasis="primary">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.7rem' }}>
              {[
                ['Graduation year', '2027'],
                ['Writing confidence', 'Medium — strong ideas, uneven openings'],
                ['Core interests', 'Public health, tutoring, community advocacy'],
                ['Package pressure', 'Personal statement + two supplements in motion'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '0.75rem 0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.76)' }}>
                  <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>{label}</p>
                  <p style={{ margin: '0.32rem 0 0', color: 'var(--color-text)', fontWeight: 700 }}>{value}</p>
                </div>
              ))}
            </div>
            <p className="text-small" style={{ margin: '0.8rem 0 0', color: 'var(--color-muted)' }}>
              Student context matters here only if it changes which stories need discovery, which direction can carry the package, or what evidence still needs to be gathered.
            </p>
            <p className="text-small" style={{ margin: '0.55rem 0 0', color: 'var(--color-muted)' }}>
              For supplements, this context should help the student choose contribution proof that widens the package instead of reusing the hospital-correction scene by default.
            </p>
            <ActionLink href="/start/reflecting" label="Run Edge Snapshot" />
          </Card>

          <Card label="Discovery context" title="What is ready for the rest of the workflow — and what is still missing.">
            <div style={{ display: 'grid', gap: '0.65rem' }}>
              {[
                'Ready for Story Vault analysis: three strong story candidates already tagged.',
                'Still missing: one school-specific motivation thread strong enough for supplements.',
                'Current package risk: service language could flatten into generic leadership if later pages lose the lived hinge.',
                'Current supplement use: Stanford can still borrow the usefulness pattern, but it needs group-contribution evidence instead of the personal statement scene itself.',
              ].map((item) => (
                <p key={item} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(23, 58, 106, 0.16)', color: 'var(--color-muted)' }}>
                  {item}
                </p>
              ))}
            </div>
            <ActionLink href="/app/story-vault?state=analysis_available" label="Open Story Vault" />
          </Card>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.95rem' }}>
          <Card label="Support boundary" title="Read-only visibility should help the student without becoming the writing operator." emphasis="warning">
            <p style={{ margin: 0, color: 'var(--color-text)' }}>
              Supporting adult visibility stays read-only: progress summaries, deadlines, and current workflow state can be shared without exposing raw draft control or turning the student voice into a committee product.
            </p>
            <p className="text-small" style={{ margin: '0.55rem 0 0', color: 'var(--color-muted)' }}>
              This workspace exists to keep authorship boundaries visible before later feedback and supplement pressure increase.
            </p>
          </Card>

          <Card label="Next moves" title="Use profile context only where it changes the package decisions.">
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {[
                'Review package progress before widening supplements into a second school-specific draft move.',
                'Check whether Story Vault evidence still supports the current direction call and the current supplement angle.',
                'Use profile constraints to avoid overloading the same community-service proof everywhere in the package.',
              ].map((item) => (
                <p key={item} className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{item}</p>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <ActionLink href="/app/personal-statement?tab=feedback" label="Open personal statement feedback" />
              <ActionLink href="/app/supplements?project=stanford-short-answer" label="Open supplements project" />
            </div>
          </Card>
        </div>
      </div>
    </StudentAppShell>
  );
}
