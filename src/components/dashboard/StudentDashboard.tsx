import Link from 'next/link';
import { StudentAppShell } from '@/components/app-shell/StudentAppShell';

type DashboardState = 'empty' | 'ready_for_snapshot' | 'active_progress';

const progressStats = [
  { label: 'Onboarding', value: 'Complete', note: 'Profile + discovery context ready' },
  { label: 'Edge Snapshot', value: 'Current', note: 'Updated 2 days ago' },
  { label: 'Story inventory', value: '14 entries', note: 'Enough material to deepen direction' },
  { label: 'Supplements', value: '2 active', note: 'One choice pending' },
];

const awaitingChoiceItems = [
  {
    label: 'Direction selection',
    title: 'Pick the direction that survives the hospital-service notes.',
    detail: 'Two usable directions remain, but the silence-after-the-correction version is stronger.',
    href: '/start/direction',
    cta: 'Review the direction call',
  },
  {
    label: 'Supplement angle',
    title: 'Choose the Common App activity angle before drafting that supplement.',
    detail: 'One angle is more grounded in visible action; one still sounds résumé-summary heavy.',
    href: '/start/compare',
    cta: 'Compare the angles',
  },
];

const needsInputItems = [
  {
    label: 'Story depth',
    title: 'Add one concrete service scene before Story Vault Analysis refresh.',
    detail: 'Add the correction scene where service stopped feeling helpful so Story Vault Analysis can test one real hinge instead of a broad pattern.',
    href: '/start?entry=notes',
    cta: 'Add one rough note',
  },
  {
    label: 'Supplement prompt',
    title: 'Paste the exact school prompt for the civic-impact supplement.',
    detail: 'The project is blocked because the current prompt summary is too broad to suggest a sharper angle safely.',
    href: '/start?entry=notes',
    cta: 'Paste the prompt',
  },
];

const recentResults = [
  'Edge Snapshot surfaced service, usefulness, and self-correction as the strongest early themes.',
  'Direction call chose the silence-after-the-correction scene as the better opening edge.',
  'Opening coach kept the silence first and pushed explanation later in the paragraph.',
];

const supplementProjects = [
  { school: 'Northwestern', status: 'Awaiting your choice', note: 'Two angles ready for selection' },
  { school: 'Michigan', status: 'Needs more input', note: 'Prompt detail still missing' },
];

const deadlineRows = [
  { label: 'Common App draft checkpoint', value: '5 days' },
  { label: 'Northwestern supplement', value: '12 days' },
  { label: 'Michigan supplement', value: '16 days' },
];


function Card({ label, title, children, emphasis = 'default' }: { label: string; title: string; children: React.ReactNode; emphasis?: 'default' | 'primary' | 'warning' }) {
  const styles =
    emphasis === 'primary'
      ? {
          border: '1px solid rgba(23, 58, 106, 0.16)',
          background: 'rgba(242, 247, 252, 0.88)',
          boxShadow: '0 16px 30px rgba(23, 58, 106, 0.06)',
        }
      : emphasis === 'warning'
        ? {
            border: '1px solid rgba(146, 64, 14, 0.18)',
            background: 'rgba(254, 243, 199, 0.52)',
            boxShadow: '0 10px 24px rgba(146, 64, 14, 0.04)',
          }
        : {
            border: '1px solid rgba(17, 24, 39, 0.08)',
            background: 'rgba(255,255,255,0.84)',
            boxShadow: '0 8px 22px rgba(17, 24, 39, 0.04)',
          };

  return (
    <section style={{ borderRadius: '1.2rem', padding: '1rem 1.05rem', ...styles }}>
      <p className="text-label" style={{ margin: '0 0 0.4rem', color: emphasis === 'warning' ? 'var(--color-caution)' : 'var(--color-judgment-accent)' }}>
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

function ActionRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        textDecoration: 'none',
        marginTop: '0.75rem',
        color: 'var(--color-judgment-accent)',
        fontWeight: 700,
        fontSize: '0.95rem',
      }}
    >
      {label} →
    </Link>
  );
}

function ActiveDashboard() {
  return (
    <div style={{ display: 'grid', gap: '0.95rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 0.85fr)', gap: '0.95rem' }}>
        <Card label="Progress Snapshot" title="What is complete, current, and already in motion.">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.7rem', marginTop: '0.35rem' }}>
            {progressStats.map((stat) => (
              <div key={stat.label} style={{ padding: '0.75rem 0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
                <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>{stat.label}</p>
                <p style={{ margin: '0.35rem 0 0.2rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>{stat.value}</p>
                <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{stat.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card label="Current Best Next Step" title="Carry the chosen direction into the current draft." emphasis="primary">
          <p style={{ margin: 0 }}>
            The strongest move is now to keep the selected direction, current opening, and revision work in the Personal Statement workspace so paragraph one keeps its hinge instead of splitting across tools.
          </p>
          <div style={{ marginTop: '0.75rem', padding: '0.8rem', borderRadius: '0.95rem', background: 'rgba(255,255,255,0.74)', border: '1px solid rgba(23, 58, 106, 0.1)' }}>
            <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Why now</p>
            <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
              The workspace should now act as the continuation of the first-minute result: selected direction, current draft, and next revision move in one place before supplements branch farther out.
            </p>
          </div>
          <ActionRow href="/app/personal-statement?state=selected&tab=drafts" label="Open the current draft workspace" />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.95rem' }}>
        <Card label="Awaiting Your Choice" title="Artifacts are ready, but the student still needs to choose.">
          <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.35rem' }}>
            {awaitingChoiceItems.map((item) => (
              <div key={item.title} style={{ padding: '0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
                <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>{item.label}</p>
                <p style={{ margin: '0.3rem 0', fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</p>
                <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{item.detail}</p>
                <ActionRow href={item.href} label={item.cta} />
              </div>
            ))}
          </div>
        </Card>

        <Card label="Needs More Input" title="The system stopped honestly and shows what is missing." emphasis="warning">
          <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.35rem' }}>
            {needsInputItems.map((item) => (
              <div key={item.title} style={{ padding: '0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(146, 64, 14, 0.14)', background: 'rgba(255,255,255,0.62)' }}>
                <p className="text-label" style={{ margin: 0, color: 'var(--color-caution)' }}>{item.label}</p>
                <p style={{ margin: '0.3rem 0', fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</p>
                <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{item.detail}</p>
                <ActionRow href={item.href} label={item.cta} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.95rem' }}>
        <Card label="Recent Results" title="Saved outputs that still affect the next move.">
          <div style={{ display: 'grid', gap: '0.55rem', marginTop: '0.35rem' }}>
            {recentResults.map((item) => (
              <p key={item} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(23, 58, 106, 0.16)' }}>
                {item}
              </p>
            ))}
          </div>
        </Card>

        <Card label="Supplements in Progress" title="Open supplement work stays visible here.">
          <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.35rem' }}>
            {supplementProjects.map((project) => (
              <div key={project.school} style={{ padding: '0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>{project.school}</p>
                <p className="text-small" style={{ margin: '0.22rem 0', color: 'var(--color-judgment-accent)', fontWeight: 600 }}>{project.status}</p>
                <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{project.note}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card label="Deadlines + Visibility" title="Keep timing and support visible without losing authorship boundaries.">
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.35rem' }}>
            {deadlineRows.map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
                <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{row.label}</p>
                <p className="text-small" style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>{row.value}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.66)' }}>
            <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Parent visibility</p>
            <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
              Invite a supporting adult to see read-only progress summaries without showing raw Story Vault entries or turning them into the writing operator.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div style={{ display: 'grid', gap: '0.95rem', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' }}>
      <Card label="Empty state" title="Start with the minimum context that unlocks real judgment." emphasis="primary">
        <p style={{ margin: 0 }}>
          You have not completed onboarding yet, so the workspace cannot tell which stories, directions, or modules should come first.
        </p>
        <div style={{ marginTop: '0.8rem', padding: '0.8rem', borderRadius: '0.95rem', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(23, 58, 106, 0.1)' }}>
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            The first job is not to generate an essay. It is to collect enough true context that the system can route you toward a useful first result.
          </p>
        </div>
        <ActionRow href="/start" label="Continue onboarding" />
      </Card>

      <Card label="What this workspace is for" title="Home should answer the next-action question fast.">
        <p style={{ margin: 0 }}>
          Once onboarding is complete, Home shows what is done, what the strongest next move is, what is waiting for your choice, and where more input is needed.
        </p>
      </Card>
    </div>
  );
}

function ReadyForSnapshotDashboard() {
  return (
    <div style={{ display: 'grid', gap: '0.95rem', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' }}>
      <Card label="Ready for snapshot" title="Onboarding is done. Run Edge Snapshot next." emphasis="primary">
        <p style={{ margin: 0 }}>
          You have enough profile and discovery context to produce an early synthesis of the strongest themes, missing discovery areas, and the best next route into Story Vault or direction work.
        </p>
        <div style={{ marginTop: '0.8rem', padding: '0.8rem', borderRadius: '0.95rem', background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(23, 58, 106, 0.1)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Why it matters</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            Snapshot is the bridge between raw onboarding answers and sharper story or direction work. It should tell you what already looks promising and what still needs discovery.
          </p>
        </div>
        <ActionRow href="/start/reflecting" label="Run Edge Snapshot" />
      </Card>

      <Card label="What comes next" title="Home will use the result to route the next strongest action.">
        <p style={{ margin: 0 }}>
          Once Snapshot resolves, this page should surface top themes, missing discovery areas, and the CTA into Story Vault or direction selection.
        </p>
      </Card>
    </div>
  );
}

export function StudentDashboard({ state }: { state: DashboardState }) {
  return (
    <StudentAppShell
      title="Home / Progress Dashboard"
      subtitle="This workspace orients the student toward the highest-value next action instead of dropping them into scattered modules."
      activeNav="Home"
      previewLinks={[
        { href: '/app?state=empty', label: 'Empty', active: state === 'empty' },
        { href: '/app?state=ready', label: 'Ready for snapshot', active: state === 'ready_for_snapshot' },
        { href: '/app', label: 'Active progress', active: state === 'active_progress' },
      ]}
    >
      {state === 'empty' ? <EmptyDashboard /> : state === 'ready_for_snapshot' ? <ReadyForSnapshotDashboard /> : <ActiveDashboard />}
    </StudentAppShell>
  );
}

export type { DashboardState };