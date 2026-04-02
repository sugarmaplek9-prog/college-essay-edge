// =============================================================
// src/lib/ai/modules/narrative-intake/evidence-ranker.ts
// INTAKE-06: Trusted evidence ranking service
//
// Orders intake sources by trust level so downstream modules
// consume evidence in the correct priority sequence.
//
// Rules:
//   1. Student-owned story entries outrank unsupported polished drafts.
//   2. Stale sources are filtered (never re-enter ranked list).
//   3. Rejected sources are filtered.
//   4. Cross-project sources are filtered.
//   5. High-contamination-risk sources are downgraded, not deleted.
// =============================================================

import type {
  TrustedEvidenceRank,
  TrustedEvidenceReasonCode,
  DowngradedSource,
  DowngradeReason,
  IntakeDecisionMeta,
} from '@/types/intake';
import type { ContaminationRisk } from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const EVIDENCE_RANKER_VERSION = 'v1' as const;

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface RankableSource {
  source_id: string;
  source_type: 'story_entry' | 'essay_draft_version' | 'student_profile' | 'school_context';
  /** Recency rank: lower = more recent (1 = most recent). */
  recency_rank: number;
  /** Which essay project this source belongs to. */
  project_id: string;
  /** Whether the student has explicitly rejected this source. */
  rejected: boolean;
  /** Whether this source is from a different project than the active one. */
  is_cross_project: boolean;
  /** Whether this source is stale (e.g. draft superseded by a newer version). */
  is_stale: boolean;
  /** Contamination risk as determined by the contamination classifier. */
  contamination_risk: ContaminationRisk;
  /** Whether this source has scene-level student evidence. */
  has_scene_evidence: boolean;
}

// ─────────────────────────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────────────────────────

/**
 * Compute a numeric trust score for a rankable source.
 * Higher = more trusted.
 */
function scoreTrust(source: RankableSource): number {
  let score = 0;

  // Source type base score
  if (source.source_type === 'story_entry') score += 40;
  if (source.source_type === 'student_profile') score += 20;
  if (source.source_type === 'essay_draft_version') score += 10;
  if (source.source_type === 'school_context') score += 5;

  // Scene evidence bonus
  if (source.has_scene_evidence) score += 20;

  // Contamination penalty on drafts
  if (source.source_type === 'essay_draft_version') {
    if (source.contamination_risk === 'high') score -= 25;
    if (source.contamination_risk === 'medium') score -= 10;
  }

  // Recency bonus (most recent = rank 1 = bigger bonus)
  const recencyBonus = Math.max(0, 10 - source.recency_rank);
  score += recencyBonus;

  return score;
}

// ─────────────────────────────────────────────────────────────
// FILTER LOGIC
// ─────────────────────────────────────────────────────────────

interface FilterResult {
  eligible: RankableSource[];
  downgraded: DowngradedSource[];
  removedReasons: TrustedEvidenceReasonCode[];
}

function filterSources(sources: RankableSource[]): FilterResult {
  const eligible: RankableSource[] = [];
  const downgraded: DowngradedSource[] = [];
  const removedReasons = new Set<TrustedEvidenceReasonCode>();

  for (const source of sources) {
    // Hard removes (never enter ranked list)
    if (source.rejected) {
      downgraded.push({ source_id: source.source_id, source_type: source.source_type, reason: 'source_rejected' });
      removedReasons.add('REJECTED_SOURCE_REMOVED');
      continue;
    }
    if (source.is_cross_project) {
      downgraded.push({ source_id: source.source_id, source_type: source.source_type, reason: 'cross_project_source' });
      removedReasons.add('CROSS_PROJECT_SOURCE_REMOVED');
      continue;
    }
    if (source.is_stale) {
      downgraded.push({ source_id: source.source_id, source_type: source.source_type, reason: 'source_stale' });
      removedReasons.add('STALE_SOURCE_REMOVED');
      continue;
    }

    // Soft downgrade: high-contamination drafts stay in ranked list
    // but at lower scores — record the downgrade for transparency
    if (
      source.source_type === 'essay_draft_version' &&
      source.contamination_risk === 'high' &&
      !source.has_scene_evidence
    ) {
      downgraded.push({ source_id: source.source_id, source_type: source.source_type, reason: 'contamination_risk_high' });
      removedReasons.add('CONTAMINATION_FORCED_DOWNGRADE');
      // Still add to eligible so it can appear in ranked list (at low score)
      eligible.push(source);
      continue;
    }

    eligible.push(source);
  }

  return { eligible, downgraded, removedReasons: Array.from(removedReasons) };
}

// ─────────────────────────────────────────────────────────────
// REASON CODE BUILDER
// ─────────────────────────────────────────────────────────────

function buildReasonCodes(
  sources: RankableSource[],
  filteredReasons: TrustedEvidenceReasonCode[],
  rankedIds: string[]
): TrustedEvidenceReasonCode[] {
  const codes = new Set<TrustedEvidenceReasonCode>(filteredReasons);

  if (rankedIds.length === 0) codes.add('NO_SOURCES_RANKABLE');

  const hasStoryInTop = sources
    .filter((s) => rankedIds.slice(0, 2).includes(s.source_id))
    .some((s) => s.source_type === 'story_entry');
  if (hasStoryInTop) codes.add('STORY_ENTRY_OUTRANKS_POLISHED_DRAFT');

  const hasSceneInTop = sources
    .filter((s) => rankedIds.slice(0, 3).includes(s.source_id))
    .some((s) => s.has_scene_evidence);
  if (hasSceneInTop) codes.add('SCENE_DETAIL_ELEVATES_RANK');

  if (sources.some((s) => s.recency_rank === 1)) codes.add('RECENT_SOURCE_PREFERRED');

  return Array.from(codes);
}

// ─────────────────────────────────────────────────────────────
// PUBLIC RANKER
// ─────────────────────────────────────────────────────────────

export interface EvidenceRankerInput {
  sources: RankableSource[];
  session_id: string;
}

/**
 * Rank all available intake sources by trustworthiness.
 * Returns an ordered list of source IDs (highest trust first)
 * plus a list of downgraded sources with reasons.
 *
 * Downstream modules MUST consume evidence in `trusted_evidence_rank`
 * order and MUST NOT reintroduce any source in `downgraded_sources`.
 */
export function rankTrustedEvidence(input: EvidenceRankerInput): TrustedEvidenceRank {
  const { eligible, downgraded, removedReasons } = filterSources(input.sources);

  const ranked = eligible
    .map((s) => ({ source_id: s.source_id, score: scoreTrust(s) }))
    .sort((a, b) => b.score - a.score);

  const trusted_evidence_rank = ranked.map((r) => r.source_id);
  const reason_codes = buildReasonCodes(input.sources, removedReasons, trusted_evidence_rank);

  const meta: IntakeDecisionMeta = {
    decision_version: EVIDENCE_RANKER_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'rules',
  };

  return {
    trusted_evidence_rank,
    downgraded_sources: downgraded,
    reason_codes,
    meta,
  };
}
