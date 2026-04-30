import { Suspense } from 'react';
import { PersonalStatementPageClient } from '@/components/personalStatement/PersonalStatementPageClient';

export default function PersonalStatementPage() {
  return (
    <Suspense fallback={<div data-app-eval-ready="pending">Loading Personal Statement workspace…</div>}>
      <PersonalStatementPageClient />
    </Suspense>
  );
}