import { PublicCard, PublicGrid, PublicSiteShell } from '@/components/publicSite/PublicSiteShell';

export default function FaqPage() {
  return (
    <PublicSiteShell
      eyebrow="FAQ"
      title="What do serious families need to know before trusting this?"
      subtitle="These are the shortest honest answers about rough notes, direction calls, boundaries, and what the workflow grows into next."
      primaryCta={{ href: '/start', label: 'Start the first direction call' }}
      secondaryCta={{ href: '/about', label: 'Read why we built it' }}
      focusQuestion="Can a student trust this without drifting into ghostwriting?"
      focusAnswer="Yes, if the product keeps the job narrow: choose, compare, and critique first, then help the student move their own draft forward."
    >
      <PublicGrid>
        <PublicCard label="FAQ 1" title="What should a student bring?">
          <p style={{ margin: 0 }}>
            Rough notes, a partial paragraph, or a moment they keep returning to. The workflow is built for material that is still messy.
          </p>
        </PublicCard>
        <PublicCard label="FAQ 2" title="What comes back first?">
          <p style={{ margin: 0 }}>
            A direction call, why this wins, and where the opening should start so the next drafting move is concrete.
          </p>
        </PublicCard>
        <PublicCard label="FAQ 3" title="Is this ghostwriting?">
          <p style={{ margin: 0 }}>
            No. The product coaches, critiques, and compares. It does not replace the student voice with a finished essay they did not author.
          </p>
        </PublicCard>
      </PublicGrid>

      <PublicCard label="FAQ 4" title="Why mention reviewed cases?">
        <p style={{ margin: 0 }}>
          Reviewed cases matter because they pressure-test the judgment. They help us ask whether the recommendation is believable, specific, and useful against real essay behavior.
        </p>
      </PublicCard>

      <PublicCard label="FAQ 5" title="Does the workflow stop after the first minute?">
        <p style={{ margin: 0 }}>
          No. The system grows into story inventory, essay feedback, and supplements so the student can keep making the next strongest decision.
        </p>
      </PublicCard>
    </PublicSiteShell>
  );
}