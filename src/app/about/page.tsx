import { PublicCard, PublicGrid, PublicSiteShell } from '@/components/publicSite/PublicSiteShell';

export default function AboutPage() {
  return (
    <PublicSiteShell
      eyebrow="About"
      title="Why build a direction-first essay product?"
      subtitle="College Essay Edge exists because students often get pushed into polished but weak directions too early. The product is built to make the real narrative choice clearer first."
      primaryCta={{ href: '/start', label: 'Begin with rough notes' }}
      secondaryCta={{ href: '/how-it-works', label: 'See the workflow' }}
      focusQuestion="Why not start by generating essay text?"
      focusAnswer="Because the wrong polished direction is still the wrong essay. The product is built to make the narrative decision clearer before anyone tries to sound impressive."
    >
      <PublicGrid>
        <PublicCard label="Belief" title="Decision progress beats text sprawl.">
          <p style={{ margin: 0 }}>
            A better essay usually starts with a better decision about what the essay is really about. That is why the product pushes toward judgment, not endless drafting suggestions.
          </p>
        </PublicCard>
        <PublicCard label="Method" title="Judgment-driven coaching stays bounded.">
          <p style={{ margin: 0 }}>
            The system helps students compare options, see evidence, and understand the next move. It is intentionally built to preserve student authorship instead of acting like a rewrite engine.
          </p>
        </PublicCard>
        <PublicCard label="Proof" title="Reviewed-case learning should be visible.">
          <p style={{ margin: 0 }}>
            When we say reviewed cases matter, that proof should show up in the judgment itself: clearer discrimination, sharper anti-generic pressure, and more honest coaching.
          </p>
        </PublicCard>
      </PublicGrid>

      <PublicCard label="What comes next" title="The product grows into a connected essay workspace.">
        <p style={{ margin: 0 }}>
          The broader vision includes a connected essay workspace with progress, story-grounding, feedback, and supplements. Each page should make the next strongest action obvious without confusing who the author is.
        </p>
      </PublicCard>
    </PublicSiteShell>
  );
}