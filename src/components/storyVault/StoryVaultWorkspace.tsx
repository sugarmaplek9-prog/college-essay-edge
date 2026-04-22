import Link from 'next/link';
import { StudentAppShell } from '@/components/app-shell/StudentAppShell';

type StoryVaultState =
  | 'empty'
  | 'drafting_inventory'
  | 'analysis_ready'
  | 'analysis_available'
  | 'analysis_stale';

type StoryEntry = {
  title: string;
  category: string;
  tags: string[];
  strength: 'High' | 'Medium' | 'Early';
  status: 'Used as evidence' | 'Linked to project' | 'Saved' | 'Draft';
  body: string;
};

const stories: StoryEntry[] = [
  {
    title: 'The nurse who said I was getting in the way',
    category: 'Service / responsibility',
    tags: ['usefulness', 'self-correction', 'hospital'],
    strength: 'High',
    status: 'Used as evidence',
    body: 'I thought I was helping until a nurse stopped me and made me realize that effort and usefulness were not the same thing.',
  },
  {
    title: 'Teaching younger teammates after my own bad pass',
    category: 'Leadership / group role',
    tags: ['silence', 'coaching', 'team'],
    strength: 'High',
    status: 'Linked to project',
    body: 'The bad pass mattered less than the silence after it. That was the moment I noticed what my teammates needed from me.',
  },
  {
    title: 'Summer clinic intake desk',
    category: 'Observation / systems',
    tags: ['patterns', 'intake', 'patience'],
    strength: 'Medium',
    status: 'Saved',
    body: 'Working the intake desk taught me that small procedural details could make someone feel oriented or lost before they ever saw a clinician.',
  },
  {
    title: 'Tutoring session that stayed too summary-heavy',
    category: 'Teaching / communication',
    tags: ['explaining', 'revision', 'practice'],
    strength: 'Early',
    status: 'Draft',
    body: 'I can tell this story has useful material, but it still needs one concrete scene instead of a broad explanation of what I usually do.',
  },
];

function WorkspaceCard({ label, title, children, tone = 'default' }: { label: string; title: string; children: React.ReactNode; tone?: 'default' | 'primary' | 'warning' }) {
  const base =
    tone === 'primary'
      ? {
          border: '1px solid rgba(23, 58, 106, 0.16)',
          background: 'rgba(242, 247, 252, 0.88)',
          boxShadow: '0 16px 30px rgba(23, 58, 106, 0.06)',
        }
      : tone === 'warning'
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
    <section style={{ borderRadius: '1.2rem', padding: '1rem 1.05rem', ...base }}>
      <p className="text-label" style={{ margin: '0 0 0.4rem', color: tone === 'warning' ? 'var(--color-caution)' : 'var(--color-judgment-accent)' }}>
        {label}
      </p>
      <h2 className="text-title" style={{ margin: '0 0 0.45rem' }}>
        {title}
      </h2>
      <div className="text-body" style={{ color: 'var(--color-muted)' }}>{children}</div>
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

function StrengthBadge({ value }: { value: StoryEntry['strength'] }) {
  const color = value === 'High' ? 'rgba(23, 58, 106, 0.9)' : value === 'Medium' ? 'rgba(74, 124, 94, 0.92)' : 'rgba(146, 64, 14, 0.92)';
  return (
    <span style={{ padding: '0.26rem 0.55rem', borderRadius: '999px', background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(17, 24, 39, 0.08)', color, fontSize: '0.78rem', fontWeight: 700 }}>
      {value} strength
    </span>
  );
}

function StatusBadge({ value }: { value: StoryEntry['status'] }) {
  return (
    <span style={{ padding: '0.26rem 0.55rem', borderRadius: '999px', background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(17, 24, 39, 0.08)', color: 'var(--color-muted)', fontSize: '0.78rem', fontWeight: 700 }}>
      {value}
    </span>
  );
}

function StoryCard({ story }: { story: StoryEntry }) {
  return (
    <div style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.7)', display: 'grid', gap: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div>
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>{story.title}</p>
          <p className="text-small" style={{ margin: '0.22rem 0 0', color: 'var(--color-muted)' }}>{story.category}</p>
        </div>
        <Link href="/app/story-vault?state=analysis_available" style={{ textDecoration: 'none', color: 'var(--color-judgment-accent)', fontSize: '0.88rem', fontWeight: 700 }}>
          Open Story Vault analysis
        </Link>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <StrengthBadge value={story.strength} />
        <StatusBadge value={story.status} />
        {story.tags.map((tag) => (
          <span key={tag} style={{ padding: '0.24rem 0.5rem', borderRadius: '999px', background: 'rgba(232, 239, 249, 0.8)', color: 'var(--color-judgment-accent)', fontSize: '0.76rem', fontWeight: 700 }}>
            {tag}
          </span>
        ))}
      </div>
      <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{story.body}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: 'grid', gap: '0.95rem', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(280px, 0.8fr)' }}>
      <WorkspaceCard label="Empty state" title="Story Vault is where the raw material gets stronger before the draft does." tone="primary">
        <p style={{ margin: 0 }}>
          No stories exist yet. This workspace matters because the rest of the system gets sharper only when there are real moments, scenes, and evidence to compare — not just broad claims about who the student is.
        </p>
        <ActionLink href="/app/story-vault?state=drafting_inventory" label="Add your first story" />
      </WorkspaceCard>
      <WorkspaceCard label="What this route does" title="Collect, inspect, and improve the evidence layer.">
        <p style={{ margin: 0 }}>
          Story Vault should show which stories are strong, what is underused, and what still needs depth before Direction Selection can make a confident call.
        </p>
      </WorkspaceCard>
    </div>
  );
}

function InventoryState() {
  return (
    <div style={{ display: 'grid', gap: '0.95rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(300px, 0.85fr)', gap: '0.95rem' }}>
        <WorkspaceCard label="Story list" title="You have early material, but not enough depth for strong downstream use.">
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.35rem' }}>
            {stories.slice(0, 2).map((story) => <StoryCard key={story.title} story={{ ...story, strength: story.strength === 'High' ? 'Medium' : story.strength }} />)}
          </div>
          <ActionLink href="/app/story-vault?state=analysis_ready" label="Deepen these stories" />
        </WorkspaceCard>
        <WorkspaceCard label="Needs more depth" title="The system can see possible material, but the scenes are still thin." tone="warning">
          <p style={{ margin: 0 }}>
            Before analysis can be trusted, these stories need one clearer scene, one visible turn, and one detail that shows what changed for the student.
          </p>
          <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.7rem' }}>
            {['Add one scene with friction, not summary.', 'Show what the student noticed or changed.', 'Keep one moment concrete enough to compare later.'].map((item) => (
              <p key={item} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(146, 64, 14, 0.2)' }}>{item}</p>
            ))}
          </div>
        </WorkspaceCard>
      </div>
    </div>
  );
}

function AnalysisPanel({ stale = false, limited = false }: { stale?: boolean; limited?: boolean }) {
  return (
    <WorkspaceCard
      label={stale ? 'Story Vault Analysis · stale current' : limited ? 'Story Vault Analysis · needs more input' : 'Story Vault Analysis'}
      title={stale ? 'Current analysis exists, but newer story changes may affect the result.' : limited ? 'Stories exist, but the analysis confidence is limited.' : 'Analysis turns the story list into usable direction evidence.'}
      tone={stale || limited ? 'warning' : 'primary'}
    >
      <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.35rem' }}>
        <div style={{ padding: '0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Strongest story candidates</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            The hospital correction story and the bad-pass silence story are the strongest candidates because they both show visible change instead of broad virtue language.
          </p>
        </div>
        <div style={{ padding: '0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
          <p className="text-label" style={{ margin: 0, color: stale || limited ? 'var(--color-caution)' : 'var(--color-judgment-accent)' }}>Underused material / gaps</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            Observation and tutoring material still looks underused, while scene specificity is weakest in the tutoring story and in the clinic-intake story’s turning point.
          </p>
        </div>
        <div style={{ padding: '0.8rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>{limited ? 'What is missing' : 'Next route'}</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            {limited
              ? 'The stories need one clearer scene, one visible turn, and less repetition before Direction Selection can make a clean call.'
              : 'Use the strongest candidates in Direction Selection once the evidence layer feels current and specific enough.'}
          </p>
        </div>
      </div>
      <ActionLink href={limited ? '/app/story-vault?state=analysis_ready' : '/start/direction'} label={limited ? 'Deepen the selected stories' : 'Use candidates in Direction Selection'} />
    </WorkspaceCard>
  );
}

function AnalysisReadyState() {
  return (
    <div style={{ display: 'grid', gap: '0.95rem', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(320px, 0.9fr)' }}>
      <WorkspaceCard label="Story list" title="There is enough material to analyze the story set.">
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.35rem' }}>
          {stories.slice(0, 3).map((story) => <StoryCard key={story.title} story={story} />)}
        </div>
        <ActionLink href="/app/story-vault?state=analysis_available" label="Run Story Vault Analysis" />
      </WorkspaceCard>
      <AnalysisPanel limited />
    </div>
  );
}

function AnalysisAvailableState({ stale = false }: { stale?: boolean }) {
  return (
    <div style={{ display: 'grid', gap: '0.95rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(340px, 0.95fr)', gap: '0.95rem' }}>
        <WorkspaceCard label="Story list" title="Story Vault is the evidence layer behind later direction choices.">
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.35rem' }}>
            {stories.map((story) => <StoryCard key={story.title} story={story} />)}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <ActionLink href="/app/story-vault?state=drafting_inventory" label="Open drafting inventory" />
            <ActionLink href={stale ? '/app/story-vault?state=analysis_available' : '/app/story-vault?state=analysis_stale'} label={stale ? 'Mark analysis current' : 'Simulate inventory change'} />
          </div>
        </WorkspaceCard>
        <AnalysisPanel stale={stale} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.95rem' }}>
        <WorkspaceCard label="Underused material" title="Useful evidence exists outside the strongest two stories.">
          <p style={{ margin: 0 }}>
            The clinic-intake and tutoring material could widen the essay package later, but both need a more visible scene before they can support stronger direction or supplement work.
          </p>
        </WorkspaceCard>
        <WorkspaceCard label="Weak / repetitive areas" title="The system should say where the inventory is still generic.">
          <p style={{ margin: 0 }}>
            Service and coaching both appear several times, so the inventory still needs one non-service story with a clearer personal stake if the package is going to avoid repetition later.
          </p>
        </WorkspaceCard>
      </div>
    </div>
  );
}

export function StoryVaultWorkspace({ state }: { state: StoryVaultState }) {
  return (
    <StudentAppShell
      title="Story Vault"
      subtitle="Collect your best stories, see which ones are actually strong, and notice what is still missing before later modules pretend the evidence is ready."
      activeNav="Story Vault"
      previewLinks={[
        { href: '/app/story-vault?state=empty', label: 'Empty', active: state === 'empty' },
        { href: '/app/story-vault?state=drafting', label: 'Drafting inventory', active: state === 'drafting_inventory' },
        { href: '/app/story-vault?state=ready', label: 'Analysis ready', active: state === 'analysis_ready' },
        { href: '/app/story-vault', label: 'Analysis available', active: state === 'analysis_available' },
        { href: '/app/story-vault?state=stale', label: 'Analysis stale', active: state === 'analysis_stale' },
      ]}
    >
      {state === 'empty'
        ? <EmptyState />
        : state === 'drafting_inventory'
          ? <InventoryState />
          : state === 'analysis_ready'
            ? <AnalysisReadyState />
            : <AnalysisAvailableState stale={state === 'analysis_stale'} />}
    </StudentAppShell>
  );
}

export type { StoryVaultState };