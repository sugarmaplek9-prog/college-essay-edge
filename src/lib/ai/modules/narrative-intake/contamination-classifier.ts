// =============================================================
// src/lib/ai/modules/narrative-intake/contamination-classifier.ts
// INTAKE-04: Contamination / authorship signal classifier v1
//
// Estimates whether intake input is student-owned, mixed, or
// contamination-heavy (polished adult framing).
//
// Builds on the heuristics in normalize-context.ts but emits
// the full AuthorshipSignalDecision contract from types/intake.ts
// so all downstream components use one canonical authorship object.
// =============================================================

import type {
  AuthorshipSignalDecision,
  AuthorshipCategory,
  ContaminationRisk,
  AuthorshipReasonCode,
  IntakeSourceProvenanceRef,
  IntakeDecisionMeta,
} from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const CONTAMINATION_CLASSIFIER_VERSION = 'v1' as const;

// ─────────────────────────────────────────────────────────────
// FEATURE PATTERNS
// ─────────────────────────────────────────────────────────────

/** Language strongly associated with polished adult / advisor framing. */
const ADULT_FRAMING_PATTERNS = [
  /i am trying to connect/i,
  /values (and|or) future direction/i,
  /connect .* values/i,
  /connect .* future direction/i,
  /\bthis essay\b/i,
  /broader (theme|lesson|meaning)/i,
  /future (direction|purpose|aspirations?)/i,
  /demonstrates? (leadership|growth|maturity|resilience)/i,
  /highlight(s|ing)? /i,
  /authentic voice/i,
  /admissions/i,
  /i have always been passionate/i,
  /throughout my (high school career|years|time)/i,
  /i am (committed|dedicated|proud)/i,
  /who i am as a person/i,
  /consistent(ly)? (demonstrated|shown|displayed)/i,
  /cultivat(ed|ing) .{0,30}(values|skills|environment)/i,
  /mutual (respect|benefit|understanding)/i,
  /shared (purpose|vision|values)/i,
  /continue (growing|to grow|to develop)/i,
];

/** Language characteristic of a student writing their own scene notes. */
const STUDENT_SCENE_PATTERNS = [
  /\bwhen\b/i,
  /\bafter\b/i,
  /\bduring\b/i,
  /that (moment|day|session|round|shift|conversation)/i,
  /my (coach|mentor|teacher|partner|teammate|patient|customer|director) (said|told|asked|pulled)/i,
  /i said/i,
  /i did/i,
  /the (match|round|call|rehearsal|shift|experiment|clinic|session|tournament)/i,
  /room \d+/i,
  /asked (me|for me) by name/i,
  /i stayed (an extra|late|after)/i,
  /that sentence/i,
  /\bpit\b/i,
  /he said|she said|they said/i,
  // Extended role coverage: "my advisor asked", "a parent told me", "the counselor said"
  /my (advisor|counselor|librarian|principal|colleague|manager|boss) (said|told|asked|pulled|called|showed|sent|gave)\b/i,
  /\b(a|the)\s+(coach|mentor|teacher|nurse|advisor|counselor|parent|librarian|principal|colleague|manager|boss|director|pharmacist|clinician) (told|asked|said|showed|pulled|called)\b/i,
  // Student peer feedback as scene
  /\b(a|the)\s+(student|peer|classmate|participant)\s+(told me|said|asked)\b/i,
  // Service-flow scene markers
  /i (wrote|created|drafted) a (document|letter|one-page|note|formal)\b/i,
  /i (waited|sat|stayed) (outside|in front of|at|near|by)\s+the\b/i,
  /i (refused to leave|stayed until|sat outside)\b/i,
  // Service-flow scene markers
  /\bfood pantry\b/i,
  /\bcheck-?in\b/i,
  /\bby noon\b/i,
  /first-time families\b/i,
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function countHits(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

// ─────────────────────────────────────────────────────────────
// CORE CLASSIFICATION LOGIC
// ─────────────────────────────────────────────────────────────

interface ContaminationFeatures {
  adultHits: number;
  sceneHits: number;
  hasDraft: boolean;
  hasStoryEntries: boolean;
  draftLengthWords: number;
  storyTotalLengthWords: number;
}

function extractFeatures(input: ContaminationClassifierInput): ContaminationFeatures {
  const draftText = input.draft_text ?? '';
  const storyText = input.story_entries.map((e) => `${e.title} ${e.text}`).join(' ');

  return {
    adultHits: countHits(draftText, ADULT_FRAMING_PATTERNS),
    sceneHits: countHits(storyText, STUDENT_SCENE_PATTERNS),
    hasDraft: draftText.trim().length > 0,
    hasStoryEntries: input.story_entries.length > 0 && storyText.trim().length > 20,
    draftLengthWords: draftText.split(/\s+/).filter(Boolean).length,
    storyTotalLengthWords: storyText.split(/\s+/).filter(Boolean).length,
  };
}

function classifyAuthorship(f: ContaminationFeatures): {
  category: AuthorshipCategory;
  risk: ContaminationRisk;
  sceneEvidence: 'present' | 'weak' | 'absent';
} {
  const sceneEvidence: 'present' | 'weak' | 'absent' =
    f.sceneHits >= 3 ? 'present' :
    f.sceneHits >= 1 ? 'weak' : 'absent';

  // High contamination: polished draft, no student scene evidence
  if (f.adultHits >= 3 && sceneEvidence === 'absent') {
    return { category: 'contamination_risk', risk: 'high', sceneEvidence };
  }

  // High contamination: polished draft much longer than thin story notes
  if (f.adultHits >= 2 && f.hasDraft && !f.hasStoryEntries) {
    return { category: 'contamination_risk', risk: 'high', sceneEvidence };
  }

  // Medium contamination: adult framing present but student scene also present
  if (f.adultHits >= 2 && sceneEvidence !== 'absent') {
    return { category: 'mixed', risk: 'medium', sceneEvidence };
  }

  // Medium contamination: draft is much longer than story notes, some adult framing
  if (
    f.adultHits >= 1 &&
    f.hasDraft &&
    f.draftLengthWords > f.storyTotalLengthWords * 2 &&
    f.storyTotalLengthWords < 40
  ) {
    return { category: 'mixed', risk: 'medium', sceneEvidence };
  }

  // Low / clean: student scene evidence is dominant
  return { category: 'student_owned', risk: 'low', sceneEvidence };
}

function buildReasonCodes(
  f: ContaminationFeatures,
  category: AuthorshipCategory,
  sceneEvidence: 'present' | 'weak' | 'absent'
): AuthorshipReasonCode[] {
  const codes: AuthorshipReasonCode[] = [];

  if (f.adultHits >= 3) codes.push('ADULT_FRAMING_PATTERNS_DETECTED');
  if (f.adultHits >= 2 && sceneEvidence === 'absent') codes.push('POLISHED_ABSTRACTION_WITHOUT_SCENE');
  if (f.adultHits >= 1 && f.hasDraft && !f.hasStoryEntries) codes.push('DRAFT_CLAIMS_NOT_SUPPORTED_BY_NOTES');
  if (f.adultHits >= 2 && f.draftLengthWords > f.storyTotalLengthWords * 2) codes.push('ABSTRACT_DENSITY_HIGH');

  if (sceneEvidence === 'present') codes.push('STUDENT_SCENE_EVIDENCE_PRESENT');
  if (sceneEvidence === 'present' && f.sceneHits >= 4) codes.push('SCENE_DETAIL_DENSITY_HIGH');
  if (category === 'student_owned') codes.push('SPECIFICITY_CONSISTENT_WITH_STUDENT');

  if (category === 'mixed') codes.push('MIXED_EVIDENCE_STUDENT_AND_ADULT');
  if (category === 'mixed' && f.adultHits >= 1 && sceneEvidence !== 'absent') {
    codes.push('STORY_NOTE_DRAFT_MISMATCH');
  }

  return codes.length > 0 ? codes : ['SPECIFICITY_CONSISTENT_WITH_STUDENT'];
}

// ─────────────────────────────────────────────────────────────
// PUBLIC CLASSIFIER
// ─────────────────────────────────────────────────────────────

export interface ContaminationClassifierInput {
  story_entries: Array<{
    id: string;
    title: string;
    text: string;
  }>;
  draft_text: string | null;
  draft_id: string | null;
  session_id: string;
}

/**
 * Classify whether the intake sources are student-owned, mixed,
 * or contamination-heavy.
 *
 * v1 uses heuristic pattern counts over draft and story note text.
 * The output contract is stable; swap the scoring logic when a
 * supervised model is ready without changing callers.
 */
export function classifyContamination(
  input: ContaminationClassifierInput
): AuthorshipSignalDecision {
  const features = extractFeatures(input);
  const { category, risk, sceneEvidence } = classifyAuthorship(features);
  const reasons = buildReasonCodes(features, category, sceneEvidence);

  const evidence_sources: IntakeSourceProvenanceRef[] = [
    ...input.story_entries.map((e) => ({
      source_id: e.id,
      source_type: 'story_entry' as const,
      excerpt: e.text.slice(0, 80),
    })),
    ...(input.draft_id
      ? [
          {
            source_id: input.draft_id,
            source_type: 'essay_draft_version' as const,
            excerpt: (input.draft_text ?? '').slice(0, 80),
          },
        ]
      : []),
  ];

  const meta: IntakeDecisionMeta = {
    decision_version: CONTAMINATION_CLASSIFIER_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'classifier',
  };

  return {
    authorship_signal: category,
    contamination_risk: risk,
    student_scene_evidence: sceneEvidence,
    reasons,
    evidence_sources,
    meta,
  };
}
