'use client';

import { useRouter } from 'next/navigation';
import { InteriorPageShell } from '@/components/firstMinute/InteriorFlowSystem';
import RenderPageFromContract from '@/components/representation/renderPageFromContract';
import { buildReflectionPage } from '@/lib/representation/pageBuilders/buildReflectionPage';

export function ReflectingRepresentationPage() {
  const router = useRouter();
  const build = buildReflectionPage();

  return (
    <InteriorPageShell maxWidth="38rem">
      <RenderPageFromContract
        pageContract={build.pageContract}
        journeySessionContract={build.journeySessionContract}
        availableStateKeys={build.availableStateKeys}
        onSelectCta={(cta) => cta.targetRoute && router.push(cta.targetRoute)}
      />
    </InteriorPageShell>
  );
}
