import { StoryVaultWorkspace, type StoryVaultState } from '@/components/storyVault/StoryVaultWorkspace';

function resolveState(state: string | undefined): StoryVaultState {
  if (state === 'empty') return 'empty';
  if (state === 'drafting' || state === 'drafting_inventory') return 'drafting_inventory';
  if (state === 'ready' || state === 'analysis_ready') return 'analysis_ready';
  if (state === 'stale' || state === 'analysis_stale') return 'analysis_stale';
  return 'analysis_available';
}

export default async function StoryVaultPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const stateParam = typeof params?.state === 'string' ? params.state : undefined;
  const state = resolveState(stateParam);

  return <StoryVaultWorkspace state={state} />;
}