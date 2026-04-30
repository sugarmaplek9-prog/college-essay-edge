import {
  SupplementsWorkspace,
  type SupplementProjectId,
  type SupplementsState,
} from '@/components/supplements/SupplementsWorkspace';

function resolveState(state: string | undefined): SupplementsState {
  if (state === 'empty') return 'empty';
  if (state === 'project_created_missing_prompt' || state === 'missing_prompt') return 'project_created_missing_prompt';
  if (state === 'ready_for_angles' || state === 'ready') return 'ready_for_angles';
  if (state === 'angles_loading' || state === 'loading') return 'angles_loading';
  if (state === 'angles_available_selection_required' || state === 'selection_required') return 'angles_available_selection_required';
  if (state === 'angles_stale' || state === 'stale') return 'angles_stale';
  if (state === 'angles_needs_more_input' || state === 'needs_input') return 'angles_needs_more_input';
  return 'angle_selected';
}

function resolveProject(project: string | undefined): SupplementProjectId {
  if (project === 'brown-community') return 'brown-community';
  if (project === 'northwestern-identity') return 'northwestern-identity';
  return 'stanford-short-answer';
}

export default async function SupplementsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const stateParam = typeof params?.state === 'string' ? params.state : undefined;
  const projectParam = typeof params?.project === 'string' ? params.project : undefined;

  return <SupplementsWorkspace state={resolveState(stateParam)} projectId={resolveProject(projectParam)} />;
}
