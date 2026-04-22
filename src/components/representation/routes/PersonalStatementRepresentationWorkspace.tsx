'use client';

import Link from 'next/link';
import { useLayoutEffect, useMemo, useState } from 'react';
import { StudentAppShell } from '@/components/app-shell/StudentAppShell';
import RenderPageFromContract from '@/components/representation/renderPageFromContract';
import type { RepresentationCtaContract } from '@/lib/representation/contracts';
import { readLiveDirectionSession, type LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import { buildRecoveryPage } from '@/lib/representation/pageBuilders/buildRecoveryPage';
import { buildRecoverySession } from '@/lib/representation/pageBuilders/helpers';
import { buildWorkspacePage } from '@/lib/representation/pageBuilders/buildWorkspacePage';

export type PersonalStatementRepresentationTab = 'direction' | 'drafts' | 'feedback';

export function PersonalStatementRepresentationWorkspace({
  tab,
  entry,
}: {
  tab: PersonalStatementRepresentationTab;
  entry?: string;
}) {
  const [sessionState, setSessionState] = useState<LiveDirectionSessionState | null>(null);
  const [recoveryIssues, setRecoveryIssues] = useState<string[] | null>(null);

  useLayoutEffect(() => {
    const result = readLiveDirectionSession(sessionStorage);
    if (!result.ok) {
      setRecoveryIssues(result.issues);
      return;
    }

    setSessionState(result.state);
  }, []);

  const tabs = useMemo(
    () => [
      { href: '/app/personal-statement?tab=direction', label: 'Direction', active: tab === 'direction' },
      { href: '/app/personal-statement?tab=drafts', label: 'Drafts', active: tab === 'drafts' },
      { href: '/app/personal-statement?tab=feedback', label: 'Feedback', active: tab === 'feedback' },
    ],
    [tab],
  );

  const recoveryBuild = recoveryIssues
    ? buildRecoverySession({
        sessionId: 'workspace-recovery',
        pageContract: buildRecoveryPage({
          pageId: 'workspace-personal-statement-recovery',
          pageRole: 'recovery',
          title: 'Live workspace handoff is missing or malformed.',
          message: 'The Personal Statement workspace only renders from the live handoff contract. That handoff is missing or malformed, so the page is failing closed.',
          issues: recoveryIssues,
        }),
        currentRoute: '/app/personal-statement',
        priorRoutes: ['/start', '/start/direction', '/start/opening'],
        nextRoutes: ['/start'],
        reasonCode: 'missing-workspace-contract',
        message: 'Workspace contract is unavailable.',
        issues: recoveryIssues,
      })
    : null;

  const liveBuild = sessionState ? buildWorkspacePage(sessionState, tab, entry) : null;

  function handleCta(cta: RepresentationCtaContract) {
    if (cta.targetRoute) {
      window.location.assign(cta.targetRoute);
    }
  }

  return (
    <StudentAppShell
      title="Personal Statement Workspace"
      subtitle="Move one live draft forward without losing the direction call."
      activeNav="Personal Statement"
    >
      <div
        style={{
          marginBottom: '0.9rem',
          padding: '0.8rem 0.95rem',
          borderRadius: '1rem',
          border: '1px solid rgba(23, 58, 106, 0.1)',
          background: 'rgba(255,255,255,0.8)',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.55, color: 'var(--color-text)', fontWeight: 600 }}>
          Keep the selected direction, improve the saved opening, then move the same hinge into the next workspace.
        </p>
      </div>
      <section style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginBottom: '0.95rem' }}>
        {tabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: 'none',
              padding: '0.6rem 0.9rem',
              borderRadius: '999px',
              border: item.active ? '1px solid rgba(23, 58, 106, 0.22)' : '1px solid rgba(17, 24, 39, 0.08)',
              background: item.active ? 'rgba(23, 58, 106, 0.92)' : 'rgba(255,255,255,0.78)',
              color: item.active ? '#fff' : 'var(--color-judgment-accent)',
              fontWeight: 700,
              fontSize: '0.92rem',
            }}
          >
            {item.label}
          </Link>
        ))}
      </section>

      {recoveryBuild ? (
        <RenderPageFromContract
          pageContract={recoveryBuild.pageContract}
          journeySessionContract={recoveryBuild.journeySessionContract}
          availableStateKeys={recoveryBuild.availableStateKeys}
          onSelectCta={handleCta}
        />
      ) : liveBuild ? (
        <RenderPageFromContract
          pageContract={liveBuild.pageContract}
          journeySessionContract={liveBuild.journeySessionContract}
          availableStateKeys={liveBuild.availableStateKeys}
          onSelectCta={handleCta}
        />
      ) : (
        <div data-app-eval-ready="pending" style={{ borderRadius: '1.2rem', padding: '1rem 1.05rem', border: '1px solid rgba(23, 58, 106, 0.16)', background: 'rgba(242, 247, 252, 0.88)' }}>
          <p style={{ margin: 0 }}>Loading the live first-minute handoff…</p>
        </div>
      )}
    </StudentAppShell>
  );
}
