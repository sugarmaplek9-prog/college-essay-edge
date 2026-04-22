'use client';

import {
  PersonalStatementRepresentationWorkspace,
  type PersonalStatementRepresentationTab,
} from '@/components/representation/routes/PersonalStatementRepresentationWorkspace';

export type WorkspaceTab = PersonalStatementRepresentationTab;

export function PersonalStatementWorkspace({
  tab,
  entry,
}: {
  tab: WorkspaceTab;
  entry?: string;
}) {
  return <PersonalStatementRepresentationWorkspace tab={tab} entry={entry} />;
}
