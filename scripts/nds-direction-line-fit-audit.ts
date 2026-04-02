#!/usr/bin/env node
/**
 * NDS_DIRECTION_LINE_FIT_AUDIT_V1
 *
 * Verifies that the NDS module's selected direction_line correctly names the
 * true story axis — not a generic performance / challenge substitute.
 *
 * Core question:
 *   Does the selected direction line describe what the story is actually about,
 *   or does it flatten the story into a generic frame?
 *
 * Pass criteria (ALL must hold across 20 cases):
 *   1. strong_fit_count      ≥ 16  (direction_line_fit = strong_fit)
 *   2. specific_count        ≥ 16  (direction_line_specificity = specific)
 *   3. over_generic_count    ≤  3  (genericity_of_line = over_generic)
 *   4. misfit_count          ≤  3  (direction_line_fit = misfit)
 *   5. better_alt_yes_count  ≤  4  (better_alternate_line_exists = yes)
 *
 * "other" domain sub-gate (4 cases):
 *   6. not_over_generic      ≥  3/4
 *   7. misfit_count          ≤  1/4
 *
 * Case mix: 6 realization | 6 action | 4 ambiguity | 4 other_domain
 * Failure-trap coverage: performed_well×3, handled_pressure×2,
 *   leadership_challenge×2, growth_difficult×2, meaningful_personal×2
 *
 * Locked case IDs: DLF_01 – DLF_20
 * Protocol ID: NDS_DIRECTION_LINE_FIT_AUDIT_V1
 */

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

// ─── Types ────────────────────────────────────────────────────────────────────

type ExpectedClass = 'realization' | 'action' | 'ambiguity' | 'other_domain';

type StoryAxis =
  | 'realization'
  | 'action'
  | 'agency'
  | 'responsibility'
  | 'listening'
  | 'identity_shift'
  | 'control_vs_care'
  | 'delegation'
  | 'system_redesign'
  | 'intellectual_humility'
  | 'relationship'
  | 'other';

type DirectionLineFit = 'strong_fit' | 'partial_fit' | 'misfit';
type DirectionLineSpecificity = 'specific' | 'borderline' | 'generic';
type GenericityOfLine = 'not_generic' | 'mildly_generic' | 'over_generic';
type BetterAltExists = 'no' | 'maybe' | 'yes';

interface AuditCase {
  caseId: string;
  title: string;
  expectedClass: ExpectedClass;
  expectedStoryAxis: StoryAxis;
  /** The wrong direction_line this case is designed to resist. */
  genericTemptation: string;
  storyEntries: string[];
  note: string;
}

interface PreAuditFlags {
  line_contains_generic_challenge_terms: boolean;
  line_contains_generic_competence_phrasing: boolean;
  line_contains_template_frame_language: boolean;
  line_contains_narrative_motion_language: boolean;
  line_is_story_about_story_label: boolean;
  line_has_low_lexical_overlap_with_evidence: boolean;
  evidence_and_explanation_lexical_overlap: number;
  selected_line_shorter_than_longest_alternate: boolean;
  other_domain_competence_flag: boolean;
}

interface AutoLabels {
  story_axis: StoryAxis;
  direction_line_fit: DirectionLineFit;
  direction_line_specificity: DirectionLineSpecificity;
  genericity_of_line: GenericityOfLine;
  better_alternate_line_exists: BetterAltExists;
  better_alternate_line_source: 'another_candidate' | 'rewrite_of_selected' | null;
  proposed_better_line: string | null;
}

interface HumanReview {
  primary_reviewer: string | null;
  reviewer_story_axis: StoryAxis | null;
  direction_line_fit: DirectionLineFit | null;
  direction_line_specificity: DirectionLineSpecificity | null;
  genericity_of_line: GenericityOfLine | null;
  better_alternate_line_exists: BetterAltExists | null;
  better_alternate_line_source: 'another_candidate' | 'rewrite_of_selected' | null;
  proposed_better_line: string | null;
  reviewer_notes: string | null;
  final_adjudication: string | null;
}

interface CandidateRecord {
  candidate_id: string;
  direction_line: string;
  direction_summary: string;
  total_score: number;
  evidence_spans: string[];
  /** Forwarded from validator_flags.axis_presence; 'unknown' when flags are absent. */
  axis_presence: 'strong' | 'weak' | 'missing' | 'unknown';
}

interface DLFAuditPacket {
  case_id: string;
  title: string;
  expected_class: ExpectedClass;
  expected_story_axis: StoryAxis;
  generic_temptation: string;
  raw_input: string[];
  selected_winner: {
    candidate_id: string;
    direction_line: string;
    confidence_band: string;
    route_decision: string;
  };
  selected_explanation: string;
  selected_evidence: Array<{ text: string; note: string }>;
  all_candidates: CandidateRecord[];
  direction_line_fit_audit: {
    pre_audit_flags: PreAuditFlags;
    auto_labels: AutoLabels;
    human_review: HumanReview;
  };
}

interface PassCriteriaResult {
  strong_fit_count: number;
  strong_fit_pass: boolean;
  specific_count: number;
  specific_pass: boolean;
  over_generic_count: number;
  over_generic_pass: boolean;
  misfit_count: number;
  misfit_pass: boolean;
  better_alt_yes_count: number;
  better_alt_pass: boolean;
  other_domain_not_over_generic_count: number;
  other_domain_generic_pass: boolean;
  other_domain_misfit_count: number;
  other_domain_misfit_pass: boolean;
  overall_pass: boolean;
}

// ─── Pattern constants ────────────────────────────────────────────────────────

/** Triggers flag: line_contains_generic_challenge_terms */
const GENERIC_CHALLENGE_PATTERN =
  /\bhard situation\b|\bunder pressure\b|\bin difficulty\b|\bduring hardship\b|\bthrough adversity\b|\bin a setback\b|\bwhen things were hard\b|\bin tough times\b|\bin difficult circumstances\b/i;

/** Triggers flag: line_contains_generic_competence_phrasing */
const GENERIC_COMPETENCE_PATTERN =
  /\bperformed well\b|\bstepped up\b|\brose to\b|\bkept going\b|\bkept showing up\b|\bshowed you could\b|\bhandled the challenge\b|\bhandled the difficulty\b|\bovercome\b|\bovercame\b|\bstayed strong\b|\bpowered through\b/i;

/** Triggers template-frame / meta-label failures */
const TEMPLATE_FRAME_PATTERN =
  /\bthe\s+angle\s+behind\b|\bthe\s+story\s+behind\b|\bthe\s+narrative\s+behind\b|\bthe\s+structure\s+behind\b|\bhow\s+the\s+student\s+corrected\s+course\b|\bthe\s+moment\s+the\s+student\s+corrected\s+course\b/i;

/** Triggers story-motion labels that describe arc mechanics, not axis */
const NARRATIVE_MOTION_PATTERN =
  /\bwhat\s+changed\s+after\b|\bwhat\s+happened\s+after\s+the\s+moment\b|\bthe\s+shift\s+behind\b|\bafter\s+that\s+moment\b|\bthe\s+important\s+part\s+was\s+not\b/i;

/** Story-about-story labels that sound analytical instead of student-facing */
const STORY_ABOUT_STORY_PATTERN =
  /\bthe\s+essay\s+is\s+about\b|\bthe\s+story\s+is\s+about\b|\bthe\s+angle\b|\bthe\s+narrative\b/i;

/** Stop-words excluded from token overlap computation */
const STOPWORDS = new Set([
  'the','and','that','with','from','into','over','than','they','them','this',
  'those','their','there','after','before','because','about','while','where',
  'which','what','when','then','just','have','had','been','were','was','like',
  'felt','made','make','more','less','very','only','also','onto','through',
  'your','would','could','should','still','much','many','some','such','each',
  'once','same','most','able','being','good','real','really','around','under',
  'between','without','inside','outside','again','every','other','another',
  'myself','itself','herself','himself','ourselves','themselves',
  'student','story','angle','essay','how','you','once','what','was','were',
  'did','get','got','its','our','him','her','his','she','but','not','for',
  'are','who','too','can','see','set','put','use','may','new','old','own',
]);

// ─── Locked 20-case set ───────────────────────────────────────────────────────
//
// Mix: 6 realization (DLF_01–06) | 6 action (DLF_07–12)
//       4 ambiguity  (DLF_13–16) | 4 other-domain (DLF_17–20)
//
// Failure-trap coverage (required minimums):
//   performed_well_in_hard_situation ×3 : DLF_02, DLF_05, DLF_18
//   handled_pressure                 ×2 : DLF_01, DLF_08
//   leadership_under_challenge       ×2 : DLF_04, DLF_11
//   growth_from_difficult_moment     ×2 : DLF_06, DLF_16
//   meaningful_personal_story        ×2 : DLF_03, DLF_17

const AUDIT_CASES: AuditCase[] = [
  // ── 6 REALIZATION cases ──────────────────────────────────────────────────

  {
    caseId: 'DLF_01',
    title: 'Debate captain who had to stop winning the room',
    expectedClass: 'realization',
    expectedStoryAxis: 'listening',
    genericTemptation: 'How you handled the argument under pressure.',
    storyEntries: [
      'debate captain notes: my coaches said I was making my partner smaller every round.',
      'for the first month of the season I cut my partner off, flagged their errors publicly, and treated every round as mine to anchor.',
      'then I stopped. I rewrote my job: not to win the round but to make my partner better. I started asking questions after their speeches instead of correcting them. Our win rate improved but the thing that actually changed was that I listened for the first time.',
    ],
    note: 'Real axis is listening / responsibility — not performance or handling pressure. Wrong line: "How you handled the argument under pressure."',
  },

  {
    caseId: 'DLF_02',
    title: 'Lab cultures that kept failing until she read someone else\'s failure',
    expectedClass: 'realization',
    expectedStoryAxis: 'intellectual_humility',
    genericTemptation: 'How you performed well in a hard situation.',
    storyEntries: [
      'science fair notes: yeast cultures failed at week two, three cycles in a row. I cleaned everything, blamed contamination.',
      'then I found a paper about temperature gradient effects in the exact incubator model I was using. The problem was structural, not mine to clean away.',
      'I rebuilt the entire protocol around that paper. First time I fixed my own experiment by reading someone else\'s failure first instead of assuming I already knew the cause.',
    ],
    note: 'Real axis is intellectual_humility — the realization was that she needed to stop assuming and start reading. Wrong line: "How you performed well in a hard situation."',
  },

  {
    caseId: 'DLF_03',
    title: 'Medical interpreter who stopped softening her parents\' words',
    expectedClass: 'realization',
    expectedStoryAxis: 'agency',
    genericTemptation: 'A meaningful personal story about identity and family.',
    storyEntries: [
      'interpreter notes: I started translating for my parents at medical appointments when I was nine. I always edited out their uncertainty and made them sound more confident than they were.',
      'at fifteen I realized I had been erasing them. Every time I smoothed their words, I took away their ability to be heard as themselves.',
      'I stopped softening. I started asking what they actually wanted to say before I opened my mouth. The doctors started asking follow-up questions I had never heard before. My parents\' actual voices were in the room for the first time.',
    ],
    note: 'Real axis is agency — she recovered her parents\' voice by giving up control of the translation. Wrong line: "A meaningful personal story about identity and family."',
  },

  {
    caseId: 'DLF_04',
    title: 'Robotics pit crew captain who was the bottleneck by choice',
    expectedClass: 'realization',
    expectedStoryAxis: 'delegation',
    genericTemptation: 'How you showed leadership under challenge.',
    storyEntries: [
      'robotics regional notes: every repair bottleneck ran through me. I liked that more than I admitted. It felt like being needed.',
      'after match three I realized the team was waiting for me to approve every step — rookies were frozen, repairs were twelve minutes average, and I was the reason.',
      'that night I built a color-coded queue, laminated checklists, assigned subsystem leads with full authority. Next day average repair time dropped to five minutes. Rookies stopped asking permission. The system ran without me in the center.',
    ],
    note: 'Real axis is delegation — she had to give up control she was holding for the wrong reasons. Wrong line: "How you showed leadership under challenge."',
  },

  {
    caseId: 'DLF_05',
    title: 'Orchestra section leader who stopped masking the section\'s hesitation',
    expectedClass: 'realization',
    expectedStoryAxis: 'responsibility',
    genericTemptation: 'How you performed well in a hard situation.',
    storyEntries: [
      'orchestra notes: I was section leader for two years. Conductor pulled me aside and said I was covering my section\'s hesitation by playing louder than I should.',
      'I had been treating my volume as protection. I thought I was helping; I was actually making it impossible for anyone to hear what needed fixing.',
      'I went quiet for three full rehearsals. The hesitations became audible. People had to fix their own weak spots. The section got stronger because I stopped masking it.',
    ],
    note: 'Real axis is responsibility — she had to understand what she owed the section, not just what she could perform. Wrong line: "How you performed well in a hard situation."',
  },

  {
    caseId: 'DLF_06',
    title: 'Hospital volunteer who learned she had been getting in the way',
    expectedClass: 'realization',
    expectedStoryAxis: 'listening',
    genericTemptation: 'How you grew from a difficult moment.',
    storyEntries: [
      'volunteering notes: I spent three summers at the hospital thinking I was helping. I distributed pamphlets, refilled water pitchers, checked in on patients unprompted.',
      'in my third summer a nurse pulled me aside and said I was getting in the way. I had been moving through the ward as if my presence was the help. I had never asked what would actually help.',
      'I changed my entire approach. I stopped doing tasks no one asked me to do and started asking before I moved. My patient satisfaction ratings went up but that was not the point — the point was that I finally paid attention before acting.',
    ],
    note: 'Real axis is listening — the change was in the direction of attention, not in resilience or growth. Wrong line: "How you grew from a difficult moment."',
  },

  // ── 6 ACTION cases ───────────────────────────────────────────────────────

  {
    caseId: 'DLF_07',
    title: 'Tutor who built a stall-point tracking system across an entire center',
    expectedClass: 'action',
    expectedStoryAxis: 'system_redesign',
    genericTemptation: 'How you helped students learn through difficulty.',
    storyEntries: [
      'tutoring notes: my freshman student kept failing the same six vocab words after three explanations each. I switched to having her use them in her own sentences. Retention improved.',
      'then I mapped every stall point I had ever logged: wrong word, stuck concept, explanation that never worked twice.',
      'I built a shared tracking doc for every tutor at the center — each session they logged where a student stalled and what question unlocked the next step. The center\'s pass rate on the state vocab benchmark went from 58% to 79% in one term.',
    ],
    note: 'Real axis is system_redesign — the story is about transforming an individual fix into a structural change for the whole center.',
  },

  {
    caseId: 'DLF_08',
    title: 'Injured runner who became the team\'s statistician instead of watching',
    expectedClass: 'action',
    expectedStoryAxis: 'action',
    genericTemptation: 'How you handled pressure and found a way to contribute.',
    storyEntries: [
      'cross-country notes: I fractured my foot six weeks before state. Could not run. The first week I watched practice from the infield and felt useless.',
      'then I started timing every runner\'s 400-meter splits. I wrote individual post-practice notes for each runner — pacing patterns, stride breaks, race-day targets.',
      'coach said it was the most precise performance data the team had ever had. We placed second at state. I found a role that made me useful in a way I would not have tried without the injury.',
    ],
    note: 'Real axis is action — she created a concrete new role, did not just cope with hardship. Wrong line: "How you handled pressure and found a way to contribute."',
  },

  {
    caseId: 'DLF_09',
    title: 'Restaurant expo who redesigned the ticket system from scratch',
    expectedClass: 'action',
    expectedStoryAxis: 'system_redesign',
    genericTemptation: 'How you managed work under pressure.',
    storyEntries: [
      'restaurant expo notes: I ran expo at my cousin\'s restaurant on weekend shifts for two years. The system was entirely verbal — server calls order, kitchen confirms, I relay.',
      'we lost two tickets every busy Friday on average. Verbal systems have no memory; when three things happen at once something falls off.',
      'I proposed a printed ticket rail with a four-color priority code and a physical staging zone. The owner approved it. First weekend: zero lost tickets. Kitchen stopped calling me for mid-service clarification. The system held without me managing the noise.',
    ],
    note: 'Real axis is system_redesign — she identified a structural flaw and built a structural fix. Wrong line: "How you managed work under pressure."',
  },

  {
    caseId: 'DLF_10',
    title: 'Food pantry volunteer who caught the third-week drop and fixed it',
    expectedClass: 'action',
    expectedStoryAxis: 'system_redesign',
    genericTemptation: 'How you stepped up when a problem needed solving.',
    storyEntries: [
      'food pantry notes: I volunteered every Saturday for a year. The first three months I handed out pre-packed bags and did not think much about the pattern.',
      'then I noticed: the same families came each week, but their pickup quantities dropped consistently in the third week of every month. I asked the director why. She did not know.',
      'I built a month-over-month tracking sheet, identified the pattern as a cash-cycle gap, and proposed switching from monthly large packs to smaller weekly allotments. The director approved. The third-week drop disappeared.',
    ],
    note: 'Real axis is system_redesign — she saw a structural gap, built evidence, proposed a fix. Wrong line: "How you stepped up when a problem needed solving."',
  },

  {
    caseId: 'DLF_11',
    title: 'Debate team captain who rebuilt the entire prep architecture over a summer',
    expectedClass: 'action',
    expectedStoryAxis: 'system_redesign',
    genericTemptation: 'How you showed leadership under challenge.',
    storyEntries: [
      'debate prep notes: I had been captain for a year when I realized our case file was built around speed, not argument quality. We won rounds early, lost when judges demanded depth.',
      'over the summer I rewrote the prep structure. Structured rebuttal drills. Weekly case autopsies. Pre-round partner strategy reviews with explicit decision trees.',
      'the team\'s elimination-round win rate went from 40% to 68% over the next season. What I had redesigned was not the team — it was the conditions under which the team could think.',
    ],
    note: 'Real axis is system_redesign — the story is about structural change in how the team prepared, not personal resilience or leadership personality. Wrong line: "How you showed leadership under challenge."',
  },

  {
    caseId: 'DLF_12',
    title: 'Intern who unblocked a six-person code review bottleneck',
    expectedClass: 'action',
    expectedStoryAxis: 'delegation',
    genericTemptation: 'How you handled leadership pressure as the only reviewer.',
    storyEntries: [
      'internship notes: I was the only person doing code reviews for a six-person team. Reviews averaged three days. The whole team was waiting on me.',
      'I wrote a review rubric covering our ten most common defect categories. Ran two 45-minute training sessions. Distributed review ownership to three senior engineers with defined scope.',
      'turnaround dropped from three days to under one. I shipped two features I had been blocking myself on. The team stopped treating review as a gate and started treating it as shared work.',
    ],
    note: 'Real axis is delegation — she identified that she was the problem and redesigned the workflow to not depend on her. Wrong line: "How you handled leadership pressure as the only reviewer."',
  },

  // ── 4 AMBIGUITY cases ────────────────────────────────────────────────────

  {
    caseId: 'DLF_13',
    title: 'Robotics captain unsure whether the essay center is the decision or the teaching',
    expectedClass: 'ambiguity',
    expectedStoryAxis: 'other',
    genericTemptation: 'How you overcame a difficult season.',
    storyEntries: [
      'robotics captain notes: we placed third at regionals. I am not sure which moment to write about.',
      'the design decision in week three might be the better story — I overruled the team on the gear ratio and turned out to be right, but it cost trust.',
      'or it might be the night I stayed late to teach four new members the drill sequence. I am not sure which one should dominate. Both feel real and I cannot tell whether the essay center is the decision or the responsibility.',
    ],
    note: 'Explicit uncertainty — system should route to clarification. Generic wrong line: "How you overcame a difficult season."',
  },

  {
    caseId: 'DLF_14',
    title: 'Tutoring notes with two genuine story centers',
    expectedClass: 'ambiguity',
    expectedStoryAxis: 'other',
    genericTemptation: 'How you grew through teaching.',
    storyEntries: [
      'tutoring notes: I had to stop treating my student\'s confusion like a temporary obstacle to my explanation.',
      'I also built a weekly tracker so every tutor logged where a student stalled and what question unlocked the next step.',
      'the internal reframe is the more personal story. The tracker is the more structural story. Both are real enough that a winner should probably be treated cautiously — I genuinely cannot tell whether the essay center is the change in me or the change in the system.',
    ],
    note: 'Both centers are real and defensible — uncertainty is genuine. System should clarify or route cautiously.',
  },

  {
    caseId: 'DLF_15',
    title: 'Clinic translator where strongest line might be dignity but strongest evidence might be workflow',
    expectedClass: 'ambiguity',
    expectedStoryAxis: 'other',
    genericTemptation: 'How you served others through difficulty.',
    storyEntries: [
      'clinic notes: I used to translate quickly because speed felt kind.',
      'then I kept a glossary, changed intake order, and trained newer volunteers to pause before paraphrasing. Families started asking more questions.',
      'the strongest line might be dignity — slowing down to let each person be fully understood. But the strongest evidence might be the workflow change: the glossary, the intake reorder, the training. I am not sure which is the real center.',
    ],
    note: 'Ambiguity between agency/dignity and system_redesign — both plausible. Direction line must stay appropriately cautious.',
  },

  {
    caseId: 'DLF_16',
    title: 'Research failure with three competing interpretations',
    expectedClass: 'ambiguity',
    expectedStoryAxis: 'other',
    genericTemptation: 'How you grew from a difficult moment.',
    storyEntries: [
      'research notes: my experiment kept failing and I did not know whether the method was wrong or the hypothesis was wrong.',
      'I eventually changed both — redesigned the protocol and narrowed the hypothesis. The new version worked.',
      'not sure if the essay is about persistence, about admitting I was wrong, or about the specific methodological insight. All three feel true. The honest answer might be to ask which one is actually the story I want to tell.',
    ],
    note: 'Three competing centers — persistence, intellectual_humility, or specific method insight. "Grew from a difficult moment" is the generic wrong collapse. System should clarify.',
  },

  // ── 4 OTHER-DOMAIN cases (main stress area) ──────────────────────────────

  {
    caseId: 'DLF_17',
    title: 'Family caregiving note with almost no recoverable hinge',
    expectedClass: 'other_domain',
    expectedStoryAxis: 'relationship',
    genericTemptation: 'A meaningful personal story about caregiving.',
    storyEntries: [
      'family caregiving. did a lot. stressful. learned patience maybe.',
      'helped with meds and appointments. not sure what the real point is.',
    ],
    note: 'Thin input: no hinge moment, no concrete change signal. System must route to clarification, not flatten to a meaningful personal story.',
  },

  {
    caseId: 'DLF_18',
    title: 'Bench season sports note with no concrete role change',
    expectedClass: 'other_domain',
    expectedStoryAxis: 'identity_shift',
    genericTemptation: 'How you performed well in a hard situation.',
    storyEntries: [
      'basketball bench season notes: hard year, kept showing up.',
      'probably learned teamwork? not sure. coach said keep working.',
      'did not play much but tried to be useful. not sure what the angle is.',
    ],
    note: 'Thin input: no concrete hinge. System must not produce "performed well in a hard situation." Should route to clarification.',
  },

  {
    caseId: 'DLF_19',
    title: 'Generic internship leadership reflection with no recoverable event',
    expectedClass: 'other_domain',
    expectedStoryAxis: 'other',
    genericTemptation: 'How you showed leadership under challenge and grew from a difficult moment.',
    storyEntries: [
      'draft-like note: this internship taught me leadership, resilience, and the importance of teamwork.',
      'I led a small group project. We had setbacks. I kept the team together.',
      'the experience made me a stronger person and showed me that I can handle pressure.',
    ],
    note: 'Maximally generic input — three failure traps simultaneously (leadership challenge, grew from difficult moment, meaningful personal story). System must not produce any of them without asking. Should route to clarification.',
  },

  {
    caseId: 'DLF_20',
    title: 'Language identity shift from competitor to complement',
    expectedClass: 'other_domain',
    expectedStoryAxis: 'identity_shift',
    genericTemptation: 'A meaningful personal story about identity and language.',
    storyEntries: [
      'language notes: I grew up speaking Tagalog at home and English at school. I treated them as completely separate — one for family, one for everything else.',
      'in ninth grade I started mixing them on purpose. Code-switching mid-sentence in class, in study groups, in my own notes.',
      'my teacher asked me to present on code-switching as a cognitive tool. That was the moment I stopped thinking of the two languages as competing. Each one let me see the same thing differently. I had two different ways of thinking, not one way split in half.',
    ],
    note: 'Rich other-domain case. Real axis is identity_shift — the realization was about how the two languages related. System must not collapse to "meaningful personal story about identity." The direction line should name the axis of the shift.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeText(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Fraction of `target` tokens found in `source`.
 * Use: overlapScore(evidence_text, direction_line) → how much of the direction
 * line vocabulary is present in the evidence+explanation.
 */
function overlapScore(source: string, target: string): number {
  const sourceTokens = new Set(tokenize(source));
  const targetTokens = new Set(tokenize(target));
  if (sourceTokens.size === 0 || targetTokens.size === 0) return 0;
  let matches = 0;
  for (const t of targetTokens) {
    if (sourceTokens.has(t)) matches += 1;
  }
  return matches / Math.max(1, targetTokens.size);
}

function extractExplanation(payload: unknown): string {
  const p = payload as Record<string, unknown> | null;
  const best = (p?.best_direction ?? {}) as Record<string, unknown>;
  return [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .map((item) => normalizeText(String(item)))
    .join(' ');
}

function evidenceNote(spanText: string, directionLine: string): string {
  const isFallback =
    /no clear evidence span available|the story needs a clearer turning moment|hinge moment needs clearer evidence|partial change appears|change signal is limited/i.test(
      spanText
    );
  if (isFallback) return 'fallback / system-generated evidence note';
  const score = overlapScore(spanText, directionLine);
  if (score >= 0.15) return 'direct support';
  if (score >= 0.06) return 'related but partial support';
  return 'mostly contextual setup';
}

// ─── Pre-audit flag computation ───────────────────────────────────────────────

function computePreAuditFlags(
  directionLine: string,
  evidenceAndExplanation: string,
  allCandidates: CandidateRecord[],
  selectedId: string,
  isOtherDomain: boolean,
): PreAuditFlags {
  const lineContainsGenericChallengeTerms = GENERIC_CHALLENGE_PATTERN.test(directionLine);
  const lineContainsGenericCompetencePhrasing = GENERIC_COMPETENCE_PATTERN.test(directionLine);
  const lineContainsTemplateFrameLanguage = TEMPLATE_FRAME_PATTERN.test(directionLine);
  const lineContainsNarrativeMotionLanguage = NARRATIVE_MOTION_PATTERN.test(directionLine);
  const lineIsStoryAboutStoryLabel = STORY_ABOUT_STORY_PATTERN.test(directionLine);
  const overlap = overlapScore(evidenceAndExplanation, directionLine);
  const lineHasLowLexicalOverlapWithEvidence = overlap < 0.04;

  const selectedLen = directionLine.length;
  const longestAlt = Math.max(
    0,
    ...allCandidates
      .filter((c) => c.candidate_id !== selectedId)
      .map((c) => c.direction_line.length),
  );
  const selectedLineShorterThanLongestAlternate = longestAlt > selectedLen + 25;

  const otherDomainCompetenceFlag =
    isOtherDomain &&
    (lineContainsGenericChallengeTerms || lineContainsGenericCompetencePhrasing);

  return {
    line_contains_generic_challenge_terms: lineContainsGenericChallengeTerms,
    line_contains_generic_competence_phrasing: lineContainsGenericCompetencePhrasing,
    line_contains_template_frame_language: lineContainsTemplateFrameLanguage,
    line_contains_narrative_motion_language: lineContainsNarrativeMotionLanguage,
    line_is_story_about_story_label: lineIsStoryAboutStoryLabel,
    line_has_low_lexical_overlap_with_evidence: lineHasLowLexicalOverlapWithEvidence,
    evidence_and_explanation_lexical_overlap: Math.round(overlap * 1000) / 1000,
    selected_line_shorter_than_longest_alternate: selectedLineShorterThanLongestAlternate,
    other_domain_competence_flag: otherDomainCompetenceFlag,
  };
}

// ─── Auto label derivation ────────────────────────────────────────────────────

function deriveAutoLabels(
  directionLine: string,
  evidenceAndExplanation: string,
  allCandidates: CandidateRecord[],
  selectedId: string,
  expectedAxis: StoryAxis,
  flags: PreAuditFlags,
): AutoLabels {
  const selectedOverlap = overlapScore(evidenceAndExplanation, directionLine);
  const hasMetaTemplateIssue =
    flags.line_contains_template_frame_language ||
    flags.line_contains_narrative_motion_language ||
    flags.line_is_story_about_story_label;

  // direction_line_fit
  let direction_line_fit: DirectionLineFit;
  if (hasMetaTemplateIssue || (flags.line_contains_generic_challenge_terms && flags.line_contains_generic_competence_phrasing)) {
    direction_line_fit = 'misfit';
  } else if (
    flags.line_contains_generic_challenge_terms ||
    flags.line_contains_generic_competence_phrasing ||
    selectedOverlap < 0.04
  ) {
    direction_line_fit = 'partial_fit';
  } else {
    direction_line_fit = 'strong_fit';
  }

  // direction_line_specificity
  let direction_line_specificity: DirectionLineSpecificity;
  if (hasMetaTemplateIssue || (flags.line_contains_generic_challenge_terms && flags.line_contains_generic_competence_phrasing)) {
    direction_line_specificity = 'generic';
  } else if (
    flags.line_contains_generic_challenge_terms ||
    flags.line_contains_generic_competence_phrasing ||
    selectedOverlap < 0.05
  ) {
    direction_line_specificity = 'borderline';
  } else {
    direction_line_specificity = 'specific';
  }

  // genericity_of_line
  let genericity_of_line: GenericityOfLine;
  if (hasMetaTemplateIssue || (flags.line_contains_generic_challenge_terms && flags.line_contains_generic_competence_phrasing)) {
    genericity_of_line = 'over_generic';
  } else if (
    flags.line_contains_generic_challenge_terms ||
    flags.line_contains_generic_competence_phrasing
  ) {
    genericity_of_line = 'mildly_generic';
  } else {
    genericity_of_line = 'not_generic';
  }

  // better alternate line
  const alternates = allCandidates
    .filter((c) => c.candidate_id !== selectedId)
    .map((c) => ({
      id: c.candidate_id,
      line: c.direction_line,
      overlap: overlapScore(evidenceAndExplanation, c.direction_line),
    }))
    .sort((a, b) => b.overlap - a.overlap);

  const bestAlt = alternates[0];
  let better_alternate_line_exists: BetterAltExists = 'no';
  let better_alternate_line_source: 'another_candidate' | 'rewrite_of_selected' | null = null;
  let proposed_better_line: string | null = null;

  if (bestAlt) {
    // 'yes' only fires when the selected line is NOT already strong_fit —
    // if the selected line is strong_fit, an alternate can be 'maybe' at most,
    // since you already have a correctly-named strong axis line.
    if (direction_line_fit !== 'strong_fit' && bestAlt.overlap > selectedOverlap + 0.06) {
      better_alternate_line_exists = 'yes';
      better_alternate_line_source = 'another_candidate';
      proposed_better_line = bestAlt.line;
    } else if (bestAlt.overlap > selectedOverlap + 0.10) {
      better_alternate_line_exists = 'maybe';
      better_alternate_line_source = 'another_candidate';
      proposed_better_line = bestAlt.line;
    } else if (bestAlt.overlap > selectedOverlap + 0.04) {
      better_alternate_line_exists = 'maybe';
      better_alternate_line_source = 'another_candidate';
      proposed_better_line = bestAlt.line;
    } else if (direction_line_fit === 'misfit' || direction_line_specificity === 'generic') {
      better_alternate_line_exists = 'maybe';
      better_alternate_line_source = 'rewrite_of_selected';
      proposed_better_line = null;
    }
  }

  return {
    story_axis: expectedAxis,
    direction_line_fit,
    direction_line_specificity,
    genericity_of_line,
    better_alternate_line_exists,
    better_alternate_line_source,
    proposed_better_line,
  };
}

// ─── Pass-criteria evaluation ─────────────────────────────────────────────────

function getFinalLabels(packet: DLFAuditPacket): {
  fit: DirectionLineFit;
  specificity: DirectionLineSpecificity;
  genericity: GenericityOfLine;
  betterAlt: BetterAltExists;
} {
  const hr = packet.direction_line_fit_audit.human_review;
  const auto = packet.direction_line_fit_audit.auto_labels;
  return {
    fit: hr.direction_line_fit ?? auto.direction_line_fit,
    specificity: hr.direction_line_specificity ?? auto.direction_line_specificity,
    genericity: hr.genericity_of_line ?? auto.genericity_of_line,
    betterAlt: hr.better_alternate_line_exists ?? auto.better_alternate_line_exists,
  };
}

function evaluatePassCriteria(packets: DLFAuditPacket[]): PassCriteriaResult {
  const allFinal = packets.map(getFinalLabels);

  const strongFitCount = allFinal.filter((l) => l.fit === 'strong_fit').length;
  const specificCount = allFinal.filter((l) => l.specificity === 'specific').length;
  const overGenericCount = allFinal.filter((l) => l.genericity === 'over_generic').length;
  const misfitCount = allFinal.filter((l) => l.fit === 'misfit').length;
  const betterAltYesCount = allFinal.filter((l) => l.betterAlt === 'yes').length;

  const otherPackets = packets.filter((p) => p.expected_class === 'other_domain');
  const otherFinal = otherPackets.map(getFinalLabels);
  const otherNotOverGenericCount = otherFinal.filter((l) => l.genericity !== 'over_generic').length;
  const otherMisfitCount = otherFinal.filter((l) => l.fit === 'misfit').length;

  const overallPass =
    strongFitCount >= 16 &&
    specificCount >= 16 &&
    overGenericCount <= 3 &&
    misfitCount <= 3 &&
    betterAltYesCount <= 4 &&
    otherNotOverGenericCount >= 3 &&
    otherMisfitCount <= 1;

  return {
    strong_fit_count: strongFitCount,
    strong_fit_pass: strongFitCount >= 16,
    specific_count: specificCount,
    specific_pass: specificCount >= 16,
    over_generic_count: overGenericCount,
    over_generic_pass: overGenericCount <= 3,
    misfit_count: misfitCount,
    misfit_pass: misfitCount <= 3,
    better_alt_yes_count: betterAltYesCount,
    better_alt_pass: betterAltYesCount <= 4,
    other_domain_not_over_generic_count: otherNotOverGenericCount,
    other_domain_generic_pass: otherNotOverGenericCount >= 3,
    other_domain_misfit_count: otherMisfitCount,
    other_domain_misfit_pass: otherMisfitCount <= 1,
    overall_pass: overallPass,
  };
}

// ─── Packet renderer ──────────────────────────────────────────────────────────

function renderPacket(packet: DLFAuditPacket): string {
  const final = getFinalLabels(packet);
  const hr = packet.direction_line_fit_audit.human_review;
  const auto = packet.direction_line_fit_audit.auto_labels;
  const flags = packet.direction_line_fit_audit.pre_audit_flags;

  const flagLine = [
    flags.line_contains_generic_challenge_terms ? '⚑ challenge-terms' : '',
    flags.line_contains_generic_competence_phrasing ? '⚑ competence-phrasing' : '',
    flags.line_contains_template_frame_language ? '⚑ template-frame' : '',
    flags.line_contains_narrative_motion_language ? '⚑ narrative-motion' : '',
    flags.line_is_story_about_story_label ? '⚑ story-about-story' : '',
    flags.line_has_low_lexical_overlap_with_evidence ? '⚑ low-overlap' : '',
    flags.selected_line_shorter_than_longest_alternate ? '⚑ shorter-than-alt' : '',
    flags.other_domain_competence_flag ? '⚑ other-domain+competence' : '',
  ]
    .filter(Boolean)
    .join('  ') || '(none)';

  const fitIcon = (v: DirectionLineFit) =>
    v === 'strong_fit' ? '✓' : v === 'partial_fit' ? '~' : '✗';
  const specIcon = (v: DirectionLineSpecificity) =>
    v === 'specific' ? '✓' : v === 'borderline' ? '~' : '✗';
  const genIcon = (v: GenericityOfLine) =>
    v === 'not_generic' ? '✓' : v === 'mildly_generic' ? '~' : '✗';

  const evidenceLines = packet.selected_evidence
    .map((e, i) => `  ${i + 1}. "${e.text}"\n     note: ${e.note}`)
    .join('\n');

  const candidateLines = packet.all_candidates
    .map(
      (c) =>
        `  - candidate_id: ${c.candidate_id}
` +
        `    direction_line: ${c.direction_line}
` +
        `    total_score: ${c.total_score.toFixed(3)}
` +
        `    axis_presence: ${c.axis_presence}
` +
        `    evidence_spans: ${c.evidence_spans.length > 0 ? c.evidence_spans.join(' | ').slice(0, 160) : 'none'}`,
    )
    .join('\n');

  const betterLineNote =
    final.betterAlt !== 'no'
      ? `  better_alternate_line_source: ${hr.better_alternate_line_source ?? auto.better_alternate_line_source ?? 'n/a'}\n` +
        `  proposed_better_line: ${hr.proposed_better_line ?? auto.proposed_better_line ?? '(reviewer to fill)'}`
      : '';

  const reviewerStoryAxis = hr.reviewer_story_axis ?? auto.story_axis;

  return [
    `CASE_ID: ${packet.case_id}`,
    `TITLE: ${packet.title}`,
    `EXPECTED_CLASS: ${packet.expected_class}`,
    `GENERIC_TEMPTATION: "${packet.generic_temptation}"`,
    ``,
    `RAW_INPUT:`,
    ...packet.raw_input.map((line, i) => `  ${i + 1}. "${line}"`),
    ``,
    `SELECTED_RESULT:`,
    `  candidate_id: ${packet.selected_winner.candidate_id}`,
    `  direction_line: ${packet.selected_winner.direction_line}`,
    `  confidence_band: ${packet.selected_winner.confidence_band}`,
    `  route_decision: ${packet.selected_winner.route_decision}`,
    ``,
    `SELECTED_EXPLANATION:`,
    `  ${packet.selected_explanation.slice(0, 320) || '(none)'}`,
    ``,
    `SELECTED_EVIDENCE:`,
    evidenceLines || '  (none)',
    ``,
    `ALL_CANDIDATES:`,
    candidateLines,
    ``,
    `PRE_AUDIT_FLAGS:`,
    `  ${flagLine}`,
    `  overlap(evidence+explanation → direction_line): ${flags.evidence_and_explanation_lexical_overlap.toFixed(3)}`,
    ``,
    `DIRECTION_LINE_FIT_AUDIT:`,
    `  reviewer_story_axis:         ${reviewerStoryAxis}`,
    `  direction_line_fit:          ${fitIcon(final.fit)} ${final.fit}`,
    `  direction_line_specificity:  ${specIcon(final.specificity)} ${final.specificity}`,
    `  genericity_of_line:          ${genIcon(final.genericity)} ${final.genericity}`,
    `  better_alternate_line_exists: ${final.betterAlt}`,
    betterLineNote,
    `  reviewer_notes: ${hr.reviewer_notes ?? '(human review pending)'}`,
    ``,
  ].join('\n');
}

// ─── Summary document builder ─────────────────────────────────────────────────

function buildSummary(packets: DLFAuditPacket[], criteria: PassCriteriaResult): string {
  const passBanner = criteria.overall_pass
    ? '**STATUS: PASS — NDS_DIRECTION_LINE_FIT_AUDIT_V1**'
    : '**STATUS: FAIL — NDS_DIRECTION_LINE_FIT_AUDIT_V1**';

  const check = (pass: boolean, label: string) =>
    `- ${pass ? '✓ PASS' : '✗ FAIL'}  ${label}`;

  const caseRows = packets.map((p) => {
    const f = getFinalLabels(p);
    const fitIcon = f.fit === 'strong_fit' ? '✓' : f.fit === 'partial_fit' ? '~' : '✗';
    const specIcon = f.specificity === 'specific' ? '✓' : f.specificity === 'borderline' ? '~' : '✗';
    const genIcon = f.genericity === 'not_generic' ? '✓' : f.genericity === 'mildly_generic' ? '~' : '✗';
    const altIcon = f.betterAlt === 'no' ? '✓' : f.betterAlt === 'maybe' ? '~' : '✗';
    const dl = p.selected_winner.direction_line.slice(0, 55) +
      (p.selected_winner.direction_line.length > 55 ? '…' : '');
    return `| ${p.case_id} | ${p.expected_class} | ${dl} | ${fitIcon} ${f.fit} | ${specIcon} ${f.specificity} | ${genIcon} ${f.genericity} | ${altIcon} ${f.betterAlt} |`;
  });

  const misfitCases = packets.filter((p) => getFinalLabels(p).fit === 'misfit');
  const overGenericCases = packets.filter((p) => getFinalLabels(p).genericity === 'over_generic');
  const betterAltCases = packets.filter((p) => getFinalLabels(p).betterAlt === 'yes');
  const otherDomainPackets = packets.filter((p) => p.expected_class === 'other_domain');

  return [
    '# NDS_DIRECTION_LINE_FIT_AUDIT_V1 Results',
    '',
    `> ${passBanner}`,
    '',
    '## Audit purpose',
    '',
    'Verify that the selected direction_line correctly names the true story axis.',
    'Core question: does the direction line describe what the story is actually about,',
    'or does it flatten the story into a generic frame?',
    '',
    '## Case mix',
    '',
    `- 6 realization | 6 action | 4 ambiguity | 4 other_domain`,
    `- Total: ${packets.length} cases (DLF_01–DLF_20)`,
    `- Failure-trap coverage: performed_well×3, handled_pressure×2, leadership_challenge×2, growth_difficult×2, meaningful_personal×2`,
    '',
    '## Global pass/fail summary',
    '',
    check(criteria.strong_fit_pass, `strong_fit_count ≥ 16: ${criteria.strong_fit_count}/20`),
    check(criteria.specific_pass, `specific_count ≥ 16: ${criteria.specific_count}/20`),
    check(criteria.over_generic_pass, `over_generic_count ≤ 3: ${criteria.over_generic_count}/20`),
    check(criteria.misfit_pass, `misfit_count ≤ 3: ${criteria.misfit_count}/20`),
    check(criteria.better_alt_pass, `better_alt_yes_count ≤ 4: ${criteria.better_alt_yes_count}/20`),
    '',
    '### "other" domain sub-gate (4 cases)',
    '',
    check(criteria.other_domain_generic_pass, `not_over_generic ≥ 3/4: ${criteria.other_domain_not_over_generic_count}/4`),
    check(criteria.other_domain_misfit_pass, `misfit_count ≤ 1/4: ${criteria.other_domain_misfit_count}/4`),
    '',
    '## Case-level results',
    '',
    '| ID | Class | Direction Line | Fit | Specificity | Genericity | Better Alt |',
    '|----|-------|----------------|-----|-------------|------------|------------|',
    ...caseRows,
    '',
    '## Misfit cases',
    '',
    ...(misfitCases.length === 0
      ? ['- None by automated pre-audit.']
      : misfitCases.map(
          (p) =>
            `- **${p.case_id}** (${p.title}): "${p.selected_winner.direction_line}"` +
            (getFinalLabels(p).fit === 'misfit' ? ' — MISFIT' : ''),
        )),
    '',
    '## Over-generic line cases',
    '',
    ...(overGenericCases.length === 0
      ? ['- None by automated pre-audit.']
      : overGenericCases.map(
          (p) =>
            `- **${p.case_id}** (${p.title}): "${p.selected_winner.direction_line}"`,
        )),
    '',
    '## "other" domain findings',
    '',
    ...otherDomainPackets.map((p) => {
      const f = getFinalLabels(p);
      return (
        `- **${p.case_id}** (${p.title}): fit=${f.fit}, specificity=${f.specificity}, genericity=${f.genericity}` +
        (f.genericity === 'over_generic' ? ' ← SUB-GATE VIOLATION' : '')
      );
    }),
    '',
    '## Cases with better alternate lines',
    '',
    ...(betterAltCases.length === 0
      ? ['- None by automated pre-audit.']
      : betterAltCases.map((p) => {
          const auto = p.direction_line_fit_audit.auto_labels;
          const hr = p.direction_line_fit_audit.human_review;
          const alt = hr.proposed_better_line ?? auto.proposed_better_line ?? '(reviewer to fill)';
          return `- **${p.case_id}**: selected="${p.selected_winner.direction_line}" → better: "${alt}"`;
        })),
    '',
    '## Remediation recommendations',
    '',
    '- Any case labeled misfit or over_generic is a release blocker.',
    '- If more than 4 cases have better_alternate_line_exists = yes, review direction-line builder logic for those domains.',
    '- "other" domain violations require updating buildCompetenceDirectionLine / buildResponsibilityDirectionLine for the relevant domain key.',
    '- Re-run this locked set after any direction-line or domain-frame change.',
    '',
    '## Human review requirement',
    '',
    '- Primary reviewer: required for all 20 cases',
    '- Second reviewer: required for any case labeled misfit, over_generic, or better_alternate_line_exists = yes',
    '- Final adjudication must be written into the serialized audit packet before rollout expansion.',
    '- Use inject-human-reviews script to populate human_review fields once review is complete.',
    '',
    '---',
    `_Generated by NDS_DIRECTION_LINE_FIT_AUDIT_V1 | Cases: ${packets.length} | Protocol locked_`,
  ].join('\n');
}

// ─── Input builder ────────────────────────────────────────────────────────────

function buildInput(auditCase: AuditCase): NdsResolvedSources {
  return {
    essay_project: {
      id: `dlf_${auditCase.caseId}`,
      student_user_id: `dlf_${auditCase.caseId}`,
      title: auditCase.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `dlf_${auditCase.caseId}`,
      first_name: 'DLFAudit',
      last_name: auditCase.caseId,
      grade: 11,
      interests: [],
    },
    story_entries: auditCase.storyEntries.map((body, idx) => ({
      id: `${auditCase.caseId}_${idx + 1}`,
      title: `Entry ${idx + 1}`,
      body,
      category: null,
    })),
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: auditCase.storyEntries.length,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

// ─── Output paths ─────────────────────────────────────────────────────────────

const OUTPUT_JSON = path.join(
  process.cwd(),
  'evaluation_outputs',
  'nds_direction_line_fit_audit_v1.json',
);
const OUTPUT_MD = path.join(
  process.cwd(),
  'docs',
  'engineering',
  'NDS_DIRECTION_LINE_FIT_AUDIT_RESULTS_V1.md',
);

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run(): Promise<void> {
  const packets: DLFAuditPacket[] = [];

  for (const auditCase of AUDIT_CASES) {
    const contextPack = buildNdsNormalizedContextPack(buildInput(auditCase));
    const execution = await executeNdsModule({
      run_id: `dlf_${auditCase.caseId}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: contextPack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = execution.candidate_payload as Record<string, unknown> | null;
    const candidates = (payload?.candidates ?? []) as Array<Record<string, unknown>>;
    const selected =
      candidates.find((c) => c.selected === true) ?? candidates[0] ?? null;

    const selectedDirectionLine = normalizeText(String(selected?.direction_line ?? ''));
    const evidenceSpanTexts: string[] = ((selected?.evidence_spans ?? []) as Array<Record<string, unknown>>)
      .map((s) => normalizeText(String(s.text ?? '')));
    const explanation = extractExplanation(payload);
    const evidenceAndExplanation = [...evidenceSpanTexts, explanation].join(' ');

    const allCandidateRecords: CandidateRecord[] = candidates.map((c) => ({
      candidate_id: String(c.candidate_id ?? ''),
      direction_line: normalizeText(String(c.direction_line ?? '')),
      direction_summary: normalizeText(String(c.direction_summary ?? '')),
      total_score: Number((c.scores as Record<string, unknown>)?.total_score ?? 0),
      evidence_spans: ((c.evidence_spans ?? []) as Array<Record<string, unknown>>).map((s) =>
        normalizeText(String(s.text ?? '')),
      ),
      axis_presence: (['strong', 'weak', 'missing'].includes(
        String((c.validator_flags as Record<string, unknown>)?.axis_presence ?? ''),
      )
        ? (c.validator_flags as Record<string, unknown>).axis_presence
        : 'unknown') as 'strong' | 'weak' | 'missing' | 'unknown',
    }));

    const flags = computePreAuditFlags(
      selectedDirectionLine,
      evidenceAndExplanation,
      allCandidateRecords,
      String(selected?.candidate_id ?? ''),
      auditCase.expectedClass === 'other_domain',
    );

    const autoLabels = deriveAutoLabels(
      selectedDirectionLine,
      evidenceAndExplanation,
      allCandidateRecords,
      String(selected?.candidate_id ?? ''),
      auditCase.expectedStoryAxis,
      flags,
    );

    const packet: DLFAuditPacket = {
      case_id: auditCase.caseId,
      title: auditCase.title,
      expected_class: auditCase.expectedClass,
      expected_story_axis: auditCase.expectedStoryAxis,
      generic_temptation: auditCase.genericTemptation,
      raw_input: auditCase.storyEntries,
      selected_winner: {
        candidate_id: String(selected?.candidate_id ?? 'n/a'),
        direction_line: selectedDirectionLine,
        confidence_band: String(payload?.confidence_band ?? 'n/a'),
        route_decision: String(payload?.route_decision ?? 'n/a'),
      },
      selected_explanation: explanation,
      selected_evidence: evidenceSpanTexts.map((text) => ({
        text,
        note: evidenceNote(text, selectedDirectionLine),
      })),
      all_candidates: allCandidateRecords,
      direction_line_fit_audit: {
        pre_audit_flags: flags,
        auto_labels: autoLabels,
        human_review: {
          primary_reviewer: null,
          reviewer_story_axis: null,
          direction_line_fit: null,
          direction_line_specificity: null,
          genericity_of_line: null,
          better_alternate_line_exists: null,
          better_alternate_line_source: null,
          proposed_better_line: null,
          reviewer_notes: null,
          final_adjudication: null,
        },
      },
    };

    packets.push(packet);
  }

  // ── Print structured packets ──
  for (const packet of packets) {
    console.log(renderPacket(packet));
    console.log('─'.repeat(80));
  }

  // ── Gate evaluation ──
  const criteria = evaluatePassCriteria(packets);

  console.log('');
  console.log('═'.repeat(80));
  console.log('NDS_DIRECTION_LINE_FIT_AUDIT_V1  —  GATE SUMMARY (auto-labels, pre-human-review)');
  console.log('═'.repeat(80));
  console.log(`  strong_fit_count  ≥ 16 : ${criteria.strong_fit_pass ? 'PASS' : 'FAIL'} (${criteria.strong_fit_count}/20)`);
  console.log(`  specific_count    ≥ 16 : ${criteria.specific_pass ? 'PASS' : 'FAIL'} (${criteria.specific_count}/20)`);
  console.log(`  over_generic_count ≤  3 : ${criteria.over_generic_pass ? 'PASS' : 'FAIL'} (${criteria.over_generic_count}/20)`);
  console.log(`  misfit_count       ≤  3 : ${criteria.misfit_pass ? 'PASS' : 'FAIL'} (${criteria.misfit_count}/20)`);
  console.log(`  better_alt_yes     ≤  4 : ${criteria.better_alt_pass ? 'PASS' : 'FAIL'} (${criteria.better_alt_yes_count}/20)`);
  console.log('  ── "other" domain sub-gate ──────────────────────────────────────');
  console.log(`  not_over_generic ≥ 3/4 : ${criteria.other_domain_generic_pass ? 'PASS' : 'FAIL'} (${criteria.other_domain_not_over_generic_count}/4)`);
  console.log(`  misfit_count     ≤ 1/4 : ${criteria.other_domain_misfit_pass ? 'PASS' : 'FAIL'} (${criteria.other_domain_misfit_count}/4)`);
  console.log('─'.repeat(80));
  console.log(`  OVERALL (auto-labels): ${criteria.overall_pass ? '✓ PASS' : '✗ FAIL'}`);
  console.log('  NOTE: Auto-labels are triage aids. Final verdict requires human review.');
  console.log('═'.repeat(80));

  // ── Write outputs ──
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(packets, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildSummary(packets, criteria));
  console.log(`\nWrote JSON → ${OUTPUT_JSON}`);
  console.log(`Wrote MD   → ${OUTPUT_MD}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
