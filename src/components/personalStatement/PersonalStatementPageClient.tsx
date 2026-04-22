'use client';

import { useSearchParams } from 'next/navigation';
import {
  PersonalStatementWorkspace,
  type WorkspaceTab,
} from '@/components/personalStatement/PersonalStatementWorkspace';

function resolveTab(tab: string | null): WorkspaceTab {
  if (tab === 'direction') return 'direction';
  if (tab === 'drafts') return 'drafts';
  return 'feedback';
}

export function PersonalStatementPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const entryParam = searchParams.get('entry') ?? undefined;

  return <PersonalStatementWorkspace tab={resolveTab(tabParam)} entry={entryParam} />;
}
