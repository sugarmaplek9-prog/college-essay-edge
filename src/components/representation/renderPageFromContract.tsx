import type { ReactNode } from 'react';
import CTAGroupBlock from '@/components/representation/blocks/CTAGroupBlock';
import CompareBlock from '@/components/representation/blocks/CompareBlock';
import DraftSeedBlock from '@/components/representation/blocks/DraftSeedBlock';
import EvidenceBlock from '@/components/representation/blocks/EvidenceBlock';
import HandoffSummaryBlock from '@/components/representation/blocks/HandoffSummaryBlock';
import NextMoveBlock from '@/components/representation/blocks/NextMoveBlock';
import PageIntroBlock from '@/components/representation/blocks/PageIntroBlock';
import RecommendationBlock from '@/components/representation/blocks/RecommendationBlock';
import RecoveryBlock from '@/components/representation/blocks/RecoveryBlock';
import RiskBlock from '@/components/representation/blocks/RiskBlock';
import StudentTruthBlock from '@/components/representation/blocks/StudentTruthBlock';
import type {
  RepresentationBlockContract,
  RepresentationCtaContract,
  RepresentationJourneySessionContract,
  RepresentationPageContract,
} from '@/lib/representation/contracts';
import { hasRequiredStateKeys, validateJourneySessionContract, validatePageContract } from '@/lib/representation/validators';

function renderBlock(
  block: RepresentationBlockContract,
  input: {
    availableStateKeys: string[];
    draftText?: string;
    onDraftChange?: (value: string) => void;
    onSelectCta?: (cta: RepresentationCtaContract) => void;
  },
): ReactNode {
  if (!block.visible) return null;

  switch (block.blockType) {
    case 'page_intro':
      return <PageIntroBlock content={block.content} />;
    case 'student_truth':
      return <StudentTruthBlock content={block.content} />;
    case 'recommendation':
      return <RecommendationBlock content={block.content} />;
    case 'evidence':
      return <EvidenceBlock content={block.content} />;
    case 'risk':
      return <RiskBlock content={block.content} />;
    case 'next_move':
      return <NextMoveBlock content={block.content} />;
    case 'compare':
      return <CompareBlock content={block.content} />;
    case 'handoff_summary':
      return <HandoffSummaryBlock content={block.content} />;
    case 'draft_seed':
      return <DraftSeedBlock content={block.content} draftText={input.draftText} onDraftChange={input.onDraftChange} />;
    case 'recovery':
      return <RecoveryBlock content={block.content} />;
    case 'cta_group':
      return <CTAGroupBlock content={block.content} availableStateKeys={input.availableStateKeys} onSelect={input.onSelectCta} />;
    default:
      return null;
  }
}

function PrimaryActions({
  pageContract,
  availableStateKeys,
  onSelectCta,
}: {
  pageContract: RepresentationPageContract;
  availableStateKeys: string[];
  onSelectCta?: (cta: RepresentationCtaContract) => void;
}) {
  const primaryCta = pageContract.primaryCta;
  const secondaryCta = pageContract.secondaryCta;
  const ctas = [primaryCta, secondaryCta].filter(Boolean) as RepresentationCtaContract[];
  if (ctas.length === 0) return null;

  return (
    <section
      style={{
        marginTop: '1rem',
        paddingTop: '0.2rem',
        display: 'grid',
        gap: '0.65rem',
      }}
    >
      <p className="text-label" style={{ margin: 0, color: 'var(--color-judgment-accent)' }}>
        Next action
      </p>
      {ctas.map((cta) => {
        const enabled = hasRequiredStateKeys(cta, availableStateKeys);
        const variant = cta.variant ?? 'secondary';
        const isPrimary = cta.id === primaryCta?.id;
        const style = variant === 'primary'
          ? {
              background: enabled ? 'linear-gradient(135deg, #173a6a 0%, #224f8e 100%)' : 'rgba(23, 58, 106, 0.35)',
              color: '#fff',
              border: '1px solid rgba(15, 38, 68, 0.22)',
              boxShadow: enabled ? '0 16px 32px rgba(23, 58, 106, 0.18)' : 'none',
            }
          : variant === 'ghost'
            ? {
                background: 'rgba(255,255,255,0.65)',
                color: enabled ? 'var(--color-judgment-accent)' : 'var(--color-muted)',
                border: '1px solid rgba(23, 58, 106, 0.14)',
                boxShadow: '0 6px 18px rgba(17, 24, 39, 0.04)',
              }
            : {
                background: 'rgba(255,255,255,0.8)',
                color: enabled ? 'var(--color-judgment-accent)' : 'var(--color-muted)',
                border: '1px solid rgba(23, 58, 106, 0.14)',
                boxShadow: '0 6px 18px rgba(17, 24, 39, 0.04)',
              };

        return (
          <button
            key={cta.id}
            type="button"
            disabled={!enabled}
            onClick={() => enabled && onSelectCta?.(cta)}
            style={{
              width: isPrimary ? '100%' : 'fit-content',
              justifySelf: 'start',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              borderRadius: isPrimary ? '1rem' : '999px',
              padding: isPrimary ? '0.95rem 1.15rem' : '0.78rem 1rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: enabled ? 'pointer' : 'not-allowed',
              textAlign: 'center',
              ...style,
            }}
          >
            {cta.label}
            {isPrimary ? <span aria-hidden="true">→</span> : null}
          </button>
        );
      })}
    </section>
  );
}

export function RepresentationContractScripts({
  pageContract,
  journeySessionContract,
}: {
  pageContract: RepresentationPageContract;
  journeySessionContract: RepresentationJourneySessionContract;
}) {
  const pageValidation = validatePageContract(pageContract);
  const sessionValidation = validateJourneySessionContract(journeySessionContract);

  return (
    <>
      <script id="representation-page-contract" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageContract) }} />
      <script id="representation-journey-session" type="application/json" dangerouslySetInnerHTML={{ __html: JSON.stringify(journeySessionContract) }} />
      <script
        id="representation-validation"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            page: pageValidation,
            session: sessionValidation,
          }),
        }}
      />
    </>
  );
}

export function RenderPageFromContract({
  pageContract,
  journeySessionContract,
  availableStateKeys,
  draftText,
  onDraftChange,
  onSelectCta,
}: {
  pageContract: RepresentationPageContract;
  journeySessionContract: RepresentationJourneySessionContract;
  availableStateKeys: string[];
  draftText?: string;
  onDraftChange?: (value: string) => void;
  onSelectCta?: (cta: RepresentationCtaContract) => void;
}) {
  return (
    <div data-app-eval-ready="true" data-representation-page-role={pageContract.pageRole}>
      <RepresentationContractScripts pageContract={pageContract} journeySessionContract={journeySessionContract} />
      <div style={{ display: 'grid', gap: '0.95rem' }}>
        {pageContract.blocks.map((block) => (
          <div key={block.blockId}>{renderBlock(block, { availableStateKeys, draftText, onDraftChange, onSelectCta })}</div>
        ))}
      </div>
      <PrimaryActions pageContract={pageContract} availableStateKeys={availableStateKeys} onSelectCta={onSelectCta} />
    </div>
  );
}

export default RenderPageFromContract;
