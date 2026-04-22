import Link from 'next/link';
import { StudentAppShell } from '@/components/app-shell/StudentAppShell';

type SupplementsState =
  | 'empty'
  | 'project_created_missing_prompt'
  | 'ready_for_angles'
  | 'angles_loading'
  | 'angles_available_selection_required'
  | 'angle_selected'
  | 'angles_stale'
  | 'angles_needs_more_input';

type SupplementProjectId = 'stanford-short-answer' | 'brown-community' | 'northwestern-identity';

type SupplementProject = {
  id: SupplementProjectId;
  school: string;
  promptLabel: string;
  category: string;
  status: string;
  draftCount: string;
  nextAction: string;
};

const projects: SupplementProject[] = [
  {
    id: 'stanford-short-answer',
    school: 'Stanford',
    promptLabel: 'What matters to you, and why?',
    category: 'Identity / values',
    status: 'Angle selected',
    draftCount: '2 versions',
    nextAction: 'Draft from the selected angle.',
  },
  {
    id: 'brown-community',
    school: 'Brown',
    promptLabel: 'How will you contribute to the Brown community?',
    category: 'Community / contribution',
    status: 'Selection required',
    draftCount: '0 versions',
    nextAction: 'Choose one ranked angle.',
  },
  {
    id: 'northwestern-identity',
    school: 'Northwestern',
    promptLabel: 'Prompt incomplete',
    category: 'Missing prompt',
    status: 'Needs prompt',
    draftCount: '0 versions',
    nextAction: 'Add the real prompt.',
  },
];

const rankedAngles = [
  {
    rank: 'Angle 1',
    title: 'Usefulness becomes the organizing value, not just helping.',
    why: 'This is strongest because the hospital correction story already shows a visible turn, and Stanford can plausibly connect to that shift through peer responsibility and practical contribution.',
    schoolReason: 'It fits Stanford best when framed as a habit of making systems more useful for other people rather than broad service branding.',
    overlap: 'Watch overlap with the personal statement: do not retell the nurse interruption as the main scene. Use it as background evidence and shift the supplement toward how the student now contributes in groups.',
  },
  {
    rank: 'Angle 2',
    title: 'The student notices where groups become disoriented and quietly rebuilds clarity.',
    why: 'This angle is credible and specific, but it is slightly weaker because the underlying evidence is spread across intake-desk and tutoring material that still needs more scene detail.',
    schoolReason: 'Works for prompts asking about contribution, collaboration, or campus life where the student can show how they improve group functioning.',
    overlap: 'Could blur into generic teamwork language unless one concrete group example stays visible.',
  },
  {
    rank: 'Angle 3',
    title: 'Teaching after mistakes becomes the central contribution pattern.',
    why: 'This is usable, but it risks sounding more familiar and more sports-coded than the top options unless it is narrowed carefully.',
    schoolReason: 'Best used when the prompt explicitly invites peer learning, mentoring, or collaborative growth.',
    overlap: 'Avoid repeating the bad-pass story if it is already carrying major weight elsewhere in the package.',
  },
];

const draftVersions = [
  {
    version: 'Current draft',
    note: 'Saved today · 176 words · aligned to selected angle',
    status: 'Current version',
  },
  {
    version: 'Version 1',
    note: 'Earlier attempt that leaned too broad and school-agnostic',
    status: 'Historical',
  },
];

function Card({ label, title, children, tone = 'default' }: { label: string; title: string; children: React.ReactNode; tone?: 'default' | 'primary' | 'warning' }) {
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

function StatusBadge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'warning' | 'primary' }) {
  const color = tone === 'warning' ? 'var(--color-caution)' : 'var(--color-judgment-accent)';
  return (
    <span style={{ padding: '0.26rem 0.55rem', borderRadius: '999px', background: 'rgba(255,255,255,0.76)', border: '1px solid rgba(17, 24, 39, 0.08)', color, fontSize: '0.78rem', fontWeight: 700 }}>
      {label}
    </span>
  );
}

function ProjectList({ activeProject, state }: { activeProject: SupplementProjectId; state: SupplementsState }) {
  return (
    <Card label="Supplement projects" title="Pick one project and keep the next move obvious.">
      <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.35rem' }}>
        {projects.map((project) => {
          const isActive = project.id === activeProject;
          return (
            <div
              key={project.id}
              style={{
                padding: '0.9rem',
                borderRadius: '1rem',
                border: isActive ? '1px solid rgba(23, 58, 106, 0.16)' : '1px solid rgba(17, 24, 39, 0.08)',
                background: isActive ? 'rgba(242, 247, 252, 0.84)' : 'rgba(255,255,255,0.7)',
                display: 'grid',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>{project.school}</p>
                  <p className="text-small" style={{ margin: '0.22rem 0 0', color: 'var(--color-muted)' }}>{project.promptLabel}</p>
                </div>
                <StatusBadge label={project.status} tone={project.status === 'Needs prompt' ? 'warning' : 'default'} />
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <StatusBadge label={project.category} tone={isActive ? 'primary' : 'default'} />
                <StatusBadge label={project.draftCount} />
              </div>
              <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>{project.nextAction}</p>
              {isActive ? (
                <p className="text-small" style={{ margin: 0, color: 'var(--color-judgment-accent)', fontWeight: 700 }}>
                  Current project
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      {state === 'empty' ? (
        <ActionLink href="/app/supplements?state=project_created_missing_prompt&project=northwestern-identity" label="Create your first supplement project" />
      ) : null}
    </Card>
  );
}

function ProjectContext({ project }: { project: SupplementProject }) {
  return (
    <Card label="Project detail" title={`${project.school} supplement project`}>
      <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.35rem' }}>
        <div style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.74)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>School context</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            {project.school} · {project.category} prompt · supplement project status is {project.status.toLowerCase()}.
          </p>
        </div>
        <div style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.74)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Prompt context</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-text)', fontWeight: 700 }}>{project.promptLabel}</p>
        </div>
      </div>
    </Card>
  );
}

function AnglePanel({ state, project }: { state: SupplementsState; project: SupplementProject }) {
  if (state === 'empty') {
    return (
      <Card label="Supplement Angle Suggestion" title="No supplement projects exist yet." tone="primary">
        <p style={{ margin: 0 }}>
          Start with one real school and one real prompt.
        </p>
        <ActionLink href="/app/supplements?state=project_created_missing_prompt&project=northwestern-identity" label="Create your first supplement project" />
      </Card>
    );
  }

  if (state === 'project_created_missing_prompt') {
    return (
      <Card label="Supplement Angle Suggestion" title="The project exists, but the prompt is still incomplete." tone="warning">
        <p style={{ margin: 0 }}>
          Angle work stays blocked until the prompt is real.
        </p>
        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.7rem' }}>
          {['Confirm the exact prompt.', 'Choose the prompt category.', 'Keep the school attached.'].map((item) => (
            <p key={item} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(146, 64, 14, 0.2)' }}>{item}</p>
          ))}
        </div>
        <ActionLink href={`/app/supplements?state=ready_for_angles&project=${project.id}`} label="Add the full prompt" />
      </Card>
    );
  }

  if (state === 'ready_for_angles') {
    return (
      <Card label="Supplement Angle Suggestion" title="This project is ready for ranked angle suggestions." tone="primary">
        <p style={{ margin: 0 }}>
          School, prompt, and enough student context exist. Choose the angle before drafting.
        </p>
        <ActionLink href={`/app/supplements?state=angles_loading&project=${project.id}`} label="Run Supplement Angle Suggestion" />
      </Card>
    );
  }

  if (state === 'angles_loading') {
    return (
      <Card label="Supplement Angle Suggestion" title="Ranked angles are being prepared for this project." tone="primary">
        <p style={{ margin: 0 }}>
          The system is comparing school fit, prompt intent, and overlap risk.
        </p>
        <ActionLink href={`/app/supplements?state=angles_available_selection_required&project=${project.id}`} label="View ranked angles" />
      </Card>
    );
  }

  if (state === 'angles_needs_more_input') {
    return (
      <Card label="Supplement Angle Suggestion" title="The current context is too thin for strong school-aware angles." tone="warning">
        <p style={{ margin: 0 }}>
          The prompt is real, but the student evidence is still too thin.
        </p>
        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.7rem' }}>
          {['Add one stronger Story Vault scene.', 'Clarify what is distinctive here.', 'Avoid drafting until the angle is specific.'].map((item) => (
            <p key={item} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(146, 64, 14, 0.2)' }}>{item}</p>
          ))}
        </div>
        <ActionLink href="/app/story-vault?state=analysis_available" label="Strengthen Story Vault context" />
      </Card>
    );
  }

  return (
    <Card
      label={state === 'angles_stale' ? 'Supplement Angle Suggestion · stale current' : state === 'angle_selected' ? 'Supplement Angle Suggestion · selected angle current' : 'Supplement Angle Suggestion'}
      title={state === 'angles_stale' ? 'A ranked angle exists, but newer upstream changes may alter the best choice.' : state === 'angle_selected' ? 'One angle is now canonical for this supplement project.' : 'Ranked angle options are available, but selection still matters.'}
      tone={state === 'angles_stale' ? 'warning' : 'primary'}
    >
      <div style={{ display: 'grid', gap: '0.7rem', marginTop: '0.35rem' }}>
        <div style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.74)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Why the top option is strongest</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            The winner reuses strong evidence without repeating the personal statement and stays specific to this school.
          </p>
        </div>
        <div style={{ display: 'grid', gap: '0.7rem' }}>
          {rankedAngles.slice(0, 2).map((angle, index) => (
            <div key={angle.rank} style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: index === 0 ? 'rgba(242, 247, 252, 0.76)' : 'rgba(255,255,255,0.74)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div>
                  <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>{angle.rank}{state === 'angle_selected' && index === 0 ? ' · Selected angle' : ''}</p>
                  <p style={{ margin: '0.35rem 0', fontWeight: 700, color: 'var(--color-text)' }}>{angle.title}</p>
                </div>
                {state === 'angles_available_selection_required' && index === 0 ? <StatusBadge label="Selection required" tone="warning" /> : null}
              </div>
              <p className="text-small" style={{ margin: '0 0 0.35rem', color: 'var(--color-muted)' }}><strong style={{ color: 'var(--color-text)' }}>Why this works:</strong> {angle.why}</p>
              <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}><strong style={{ color: 'var(--color-text)' }}>Overlap watchout:</strong> {angle.overlap}</p>
            </div>
          ))}
          <p className="text-small" style={{ margin: 0, color: 'var(--color-muted)' }}>
            One more backup angle exists, but it does not need equal weight on-screen.
          </p>
        </div>
      </div>
      <ActionLink
        href={state === 'angles_available_selection_required' ? `/app/supplements?state=angle_selected&project=${project.id}` : state === 'angles_stale' ? `/app/supplements?state=angles_available_selection_required&project=${project.id}` : `/app/supplements?state=angles_stale&project=${project.id}`}
        label={state === 'angles_available_selection_required' ? 'Select the strongest angle' : 'Refresh angle suggestions'}
      />
    </Card>
  );
}

function DraftPanel({ state }: { state: SupplementsState }) {
  return (
    <Card label="Draft versions" title="Draft only after the angle is clear.">
      <div style={{ display: 'grid', gap: '0.65rem', marginTop: '0.35rem' }}>
        <div style={{ padding: '0.9rem', borderRadius: '1rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.74)' }}>
          <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>Current draft home</p>
          <p className="text-small" style={{ margin: '0.35rem 0 0', color: 'var(--color-muted)' }}>
            {state === 'angle_selected' || state === 'angles_stale'
              ? 'The selected angle now guides the draft.'
              : 'Do not polish a draft before the angle is chosen.'}
          </p>
        </div>
        {draftVersions.map((version) => (
          <div key={version.version} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem 0.85rem', borderRadius: '0.95rem', border: '1px solid rgba(17, 24, 39, 0.08)', background: 'rgba(255,255,255,0.68)' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text)' }}>{version.version}</p>
              <p className="text-small" style={{ margin: '0.2rem 0 0', color: 'var(--color-muted)' }}>{version.note}</p>
            </div>
            <p className="text-small" style={{ margin: 0, color: 'var(--color-judgment-accent)', fontWeight: 700 }}>{version.status}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SummaryRail({ state, project }: { state: SupplementsState; project: SupplementProject }) {
  const statusLines =
    state === 'empty'
      ? ['No supplement projects yet.', 'Start with school plus prompt.']
      : state === 'project_created_missing_prompt'
        ? ['Project saved.', 'Prompt context is incomplete.']
        : state === 'ready_for_angles'
          ? ['School and prompt are present.', 'Angle selection is the next move.']
          : state === 'angles_loading'
            ? ['Angle run is in progress.', 'Selection follows when the ranking returns.']
            : state === 'angles_needs_more_input'
              ? ['The prompt is real, but student context is weak.', 'Story Vault strengthening is the next move.']
              : state === 'angles_available_selection_required'
                ? ['Ranked angle options are available.', 'No canonical angle is selected yet.']
                : state === 'angles_stale'
                  ? ['A canonical angle exists.', 'Upstream context changed after the result.']
                  : ['A canonical angle exists.', 'Draft from it without repeating the package.'];

  return (
    <div style={{ display: 'grid', gap: '0.9rem' }}>
      <Card label="Workspace status" title={`${project.school} is one supplement project inside a larger package.`}>
        <div style={{ display: 'grid', gap: '0.45rem', marginTop: '0.25rem' }}>
          {statusLines.map((item) => (
            <p key={item} className="text-small" style={{ margin: 0, paddingLeft: '0.7rem', borderLeft: '2px solid rgba(23, 58, 106, 0.16)' }}>{item}</p>
          ))}
        </div>
      </Card>
      <Card label="Overlap warning" title="Supplements should widen the package, not echo it." tone="warning">
        <p style={{ margin: 0 }}>
          Borrow evidence lightly, then pivot toward what this prompt needs. Repeating the same main scene would flatten the package.
        </p>
        <ActionLink href="/app/personal-statement?tab=feedback" label="Review personal statement feedback" />
      </Card>
      <Card label="Next move" title="Keep the workflow pointed at one concrete action." tone="primary">
        <p style={{ margin: 0 }}>
          {state === 'angles_available_selection_required'
            ? 'Choose the strongest ranked angle, then draft from it.'
            : state === 'project_created_missing_prompt'
              ? 'Complete the project prompt so the route can earn a specific recommendation.'
              : state === 'angles_needs_more_input'
                ? 'Improve the student evidence before asking the system to guess.'
                : state === 'angles_stale'
                  ? 'Refresh the ranked result so the canonical angle matches the current package.'
                  : 'Use the selected angle in drafting and keep overlap pressure visible while writing.'}
        </p>
        <ActionLink href="/app/profile" label="Open profile context" />
      </Card>
    </div>
  );
}

export function SupplementsWorkspace({ state, projectId }: { state: SupplementsState; projectId: SupplementProjectId }) {
  const activeProject = projects.find((project) => project.id === projectId) ?? projects[0];

  return (
    <StudentAppShell
      title="Supplements Workspace"
      subtitle="Organize school-specific supplement projects, choose the strongest angle for each prompt, and keep overlap pressure visible so the package does not repeat itself."
      activeNav="Supplements"
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.9fr) minmax(0, 1.1fr) minmax(280px, 0.75fr)', gap: '0.95rem' }}>
        <ProjectList activeProject={activeProject.id} state={state} />
        <div style={{ display: 'grid', gap: '0.95rem' }}>
          <ProjectContext project={activeProject} />
          <AnglePanel state={state} project={activeProject} />
          <DraftPanel state={state} />
        </div>
        <SummaryRail state={state} project={activeProject} />
      </div>
    </StudentAppShell>
  );
}

export type { SupplementProjectId, SupplementsState };
