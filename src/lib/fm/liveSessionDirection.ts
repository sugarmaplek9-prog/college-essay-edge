import { FM_CANONICAL_PAGE3_PAYLOAD_KEY, FM_INTELLIGENCE_KEY, FM_OPENING_DRAFT_KEY } from '@/lib/fm/clientSession';
import { FM_CASE_STATE_KEY, type SessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent, type CompareAlternative, type DirectionContent } from '@/lib/fm/direction';
import { validateRecommendationPacketCopy, type MalformedCopyIssue } from '@/lib/fm/malformedCopyGate';
import type { CanonicalPage3Payload } from '@/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1';
import type { IntakeIntelligenceObject } from '@/types/intake';

export type LiveDirectionSessionState = {
  intelligence: IntakeIntelligenceObject;
  caseState: SessionCaseState | null;
  canonicalPayload: CanonicalPage3Payload;
  directionContent: DirectionContent;
  selectedDirection: {
    strongestDirection: string;
    recommendationText: string;
    whyWins: string;
    risk: string;
    bestNextMove: string;
    evidenceLines: Array<{ quote: string; explanation: string }>;
  };
  compareAlternative: CompareAlternative | null;
  openingDraft: string;
  malformedCopyIssues: MalformedCopyIssue[];
};

export type LiveDirectionSessionResult =
  | { ok: true; state: LiveDirectionSessionState }
  | { ok: false; reason: string; issues: string[] };

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function buildFromValues(input: {
  intelligence: IntakeIntelligenceObject | null;
  caseState: SessionCaseState | null;
  canonicalPayload: CanonicalPage3Payload | null;
  openingDraft?: string | null;
}): LiveDirectionSessionResult {
  if (!input.intelligence) {
    return { ok: false, reason: 'missing-intelligence', issues: ['Live first-minute intelligence is missing.'] };
  }

  if (!input.canonicalPayload) {
    return { ok: false, reason: 'missing-canonical-payload', issues: ['Selected direction payload is missing.'] };
  }

  const packet = input.canonicalPayload.recommendation_packet;
  const malformedCopyIssues = validateRecommendationPacketCopy(packet);
  const blockingCopyIssues = malformedCopyIssues.filter((issue) => {
    if (issue.field.startsWith('evidence_lines[')) return false;
    if (issue.field.startsWith('evidence_explanations[')) return false;
    if (
      issue.code === 'truncation_ellipsis' &&
      (issue.field === 'first_coaching_step' || issue.field === 'next_step')
    ) {
      return false;
    }
    return true;
  });

  if (blockingCopyIssues.length > 0) {
    return {
      ok: false,
      reason: 'malformed-canonical-payload',
      issues: blockingCopyIssues.map((issue) => issue.message),
    };
  }

  const directionContent = deriveDirectionContent(input.intelligence, input.caseState);
  const compareAlternative = directionContent.compare_alternatives.find((entry) => !entry.is_strongest) ?? null;

  return {
    ok: true,
    state: {
      intelligence: input.intelligence,
      caseState: input.caseState,
      canonicalPayload: input.canonicalPayload,
      directionContent,
      selectedDirection: {
        strongestDirection: packet.displayed_recommendation,
        recommendationText: packet.essay_about,
        whyWins: packet.why_this_direction,
        risk: directionContent.strongest.risk,
        bestNextMove: packet.first_coaching_step || packet.next_step || directionContent.strongest.next_move,
        evidenceLines: packet.evidence_lines.map((quote, index) => ({
          quote,
          explanation: packet.evidence_explanations[index] || 'This source line supports the selected direction.',
        })),
      },
      compareAlternative,
      openingDraft: (input.openingDraft ?? '').trim(),
      malformedCopyIssues,
    },
  };
}

export function readLiveDirectionSession(storage: Pick<Storage, 'getItem'>): LiveDirectionSessionResult {
  return buildFromValues({
    intelligence: parseJson<IntakeIntelligenceObject>(storage.getItem(FM_INTELLIGENCE_KEY)),
    caseState: parseJson<SessionCaseState>(storage.getItem(FM_CASE_STATE_KEY)),
    canonicalPayload: parseJson<CanonicalPage3Payload>(storage.getItem(FM_CANONICAL_PAGE3_PAYLOAD_KEY)),
    openingDraft: storage.getItem(FM_OPENING_DRAFT_KEY),
  });
}

export function buildLiveDirectionSessionForTests(input: {
  intelligence: IntakeIntelligenceObject | null;
  caseState: SessionCaseState | null;
  canonicalPayload: CanonicalPage3Payload | null;
  openingDraft?: string | null;
}): LiveDirectionSessionResult {
  return buildFromValues(input);
}
