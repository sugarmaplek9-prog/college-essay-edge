import { PublicCard, PublicGrid, PublicSiteShell } from '@/components/publicSite/PublicSiteShell';

export default function HowItWorksPage() {
  return (
    <PublicSiteShell
      eyebrow="How it works"
      title="What happens after rough notes go in?"
      subtitle="First comes the direction call. Then the opening, comparison, revision, and supplements stay connected to that same decision."
      primaryCta={{ href: '/start', label: 'Start with rough notes' }}
      secondaryCta={{ href: '/faq', label: 'See the boundaries' }}
      focusQuestion="What does the product actually do first?"
      focusAnswer="It makes one direction call before drafting, so the student is not polishing the wrong essay."
    >
      <PublicGrid>
        <PublicCard label="Step 1" title="Bring rough notes, not polished copy.">
          <p style={{ margin: 0 }}>
            A partial paragraph, a memory, or a rough scene is enough. The job is to find the strongest direction before the student drafts the wrong version.
          </p>
        </PublicCard>
        <PublicCard label="Step 2" title="Get a direction call with visible reasons.">
          <p style={{ margin: 0 }}>
            The first return shows which direction survives, why it wins, and where the opening should start.
          </p>
        </PublicCard>
        <PublicCard label="Step 3" title="Move into bounded coaching workspaces.">
          <p style={{ margin: 0 }}>
            From there the workflow extends into compare, opening, revision, essay feedback, and supplements without turning into chat sprawl.
          </p>
        </PublicCard>
      </PublicGrid>

      <PublicCard label="Why this is different" title="Reviewed cases sharpen the judgment, not just the language.">
        <p style={{ margin: 0 }}>
          Reviewed cases and human gold checks pressure-test whether the recommendation is specific, credible, and useful before the student trusts it.
        </p>
      </PublicCard>

      <PublicCard label="Boundary" title="This is coaching, selection, and critique — not ghostwriting.">
        <p style={{ margin: 0 }}>
          The system helps the student choose, compare, and revise their own material. It does not generate a finished personal statement for them to pass off as their voice.
        </p>
      </PublicCard>
    </PublicSiteShell>
  );
}