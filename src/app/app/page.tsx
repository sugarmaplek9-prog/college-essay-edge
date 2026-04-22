import { StudentDashboard, type DashboardState } from '@/components/dashboard/StudentDashboard';

function resolveDashboardState(state: string | undefined): DashboardState {
  if (state === 'empty') return 'empty';
  if (state === 'ready' || state === 'ready_for_snapshot') return 'ready_for_snapshot';
  return 'active_progress';
}

export default async function AppHomePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const stateParam = typeof params?.state === 'string' ? params.state : undefined;
  const state = resolveDashboardState(stateParam);

  return <StudentDashboard state={state} />;
}