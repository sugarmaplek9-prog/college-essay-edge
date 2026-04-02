#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type ExpectedClass = 'clear_winner' | 'ambiguous' | 'weak_input' | 'genericity_trap';
type EvidenceRelevance = 'strong' | 'partial' | 'weak';
type EvidenceSufficiency = 'sufficient' | 'borderline' | 'insufficient';
type ExplanationGrounding = 'grounded' | 'stretched' | 'ungrounded';
type WinnerDefensibility = 'defensible' | 'questionable' | 'not_defensible';
type AlternativeGrounding = 'no' | 'maybe' | 'yes';

interface AuditCase {
  caseId: string;
  title: string;
  expectedClass: ExpectedClass;
  storyEntries: string[];
}

interface CandidatePacket {
  candidate_id: string;
  direction_line: string;
  total_score: number;
  evidence_spans: string[];
}

interface AuditLabels {
  evidence_relevance: EvidenceRelevance;
  evidence_sufficiency: EvidenceSufficiency;
  explanation_grounding: ExplanationGrounding;
  winner_defensibility_from_evidence_only: WinnerDefensibility;
  better_grounded_alternative_exists: AlternativeGrounding;
  better_grounded_alternative_id: string | null;
  reviewer_notes: string;
  human_review: {
    primary_reviewer: string | null;
    secondary_reviewer: string | null;
    disagreement: string | null;
    final_adjudication: string | null;
    reason: string | null;
  };
}

interface AuditPacket {
  case_id: string;
  title: string;
  expected_class: ExpectedClass;
  raw_input: string[];
  selected_winner: {
    candidate_id: string;
    direction_line: string;
    confidence_band: string;
    route_decision: string;
  };
  selected_evidence: Array<{ text: string; note: string }>;
  selected_explanation: string;
  all_candidates: CandidatePacket[];
  grounding_audit: AuditLabels;
}

const OUTPUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_evidence_grounding_audit_v1.json');
const OUTPUT_MD = path.join(process.cwd(), 'docs', 'engineering', 'NDS_EVIDENCE_GROUNDING_AUDIT_RESULTS_V1.md');

const FALLBACK_PATTERNS = [
  /change signal is limited/i,
  /partial change indicators/i,
  /no clear evidence span available/i,
  /needs clearer evidence/i,
  /hinge moment needs clearer evidence/i,
];

const STOPWORDS = new Set([
  'the','and','that','with','from','into','over','than','they','them','this','those','their','there','after','before','because','about','while','where','which','what','when','then','just','have','had','been','were','was','like','felt','made','make','more','less','very','only','also','onto','through','your','would','could','should','still','much','many','some','such','each','once','same','most','able','being','good','real','really','around','under','between','without','inside','outside','again','every','other','another','myself','itself','herself','himself','ourselves','themselves','student','story','angle','essay'
]);

const AUDIT_CASES: AuditCase[] = [
  {
    caseId: 'EGA_01',
    title: 'Clinic volunteer rethinks what helping means',
    expectedClass: 'clear_winner',
    storyEntries: [
      'clinic volunteer notes: I thought being useful meant moving fast. Third Saturday, a nurse told me I kept answering before patients finished. I wrote down that sentence because it bothered me all week.',
      'later note: the real change was that I stopped measuring myself by whether I looked efficient. I started sitting down, repeating instructions back, and checking whether the patient actually understood before I moved on.',
      'result note: one older patient who usually nodded and stayed quiet finally interrupted me to correct a medication time, which was the first sign my slower approach was actually leaving room for honesty.'
    ]
  },
  {
    caseId: 'EGA_02',
    title: 'Restaurant expo line system change',
    expectedClass: 'clear_winner',
    storyEntries: [
      'messy work notes: Friday expo line kept jamming because tickets got shouted and forgotten. I was staying calm but that was not solving the actual bottleneck.',
      'what I changed: split the pass into three stations, clipped tickets in firing order, and only called out the dishes that could hold the whole table. manager kept the system after missed sides dropped.',
      'reflection: this feels less like a personality story and more like a systems story because the strongest evidence is what changed once the process changed.'
    ]
  },
  {
    caseId: 'EGA_03',
    title: 'Debate control versus listening',
    expectedClass: 'clear_winner',
    storyEntries: [
      'debate notebook: captain told me my best speeches were making my partner smaller. I hated hearing that because I thought sounding airtight meant I was helping the team.',
      'after that I kept noticing how often I drafted rebuttals while other people were still talking. the uglier truth was that I liked control more than collaboration.',
      'I later organized prep better too, but the actual center is that I had to relearn debate as attention instead of performance.'
    ]
  },
  {
    caseId: 'EGA_04',
    title: 'Research protocol beats vague lessons',
    expectedClass: 'clear_winner',
    storyEntries: [
      'lab notes: cultures kept failing and I kept calling the whole project a disaster. advisor asked me to stop narrating feelings and trace the failure path.',
      'found the error: five-minute delay between collecting and labeling samples. I rewrote the protocol so tubes were pre-labeled, added a contamination checkpoint, and had each person initial the sheet before incubation.',
      'next run produced usable cultures in all but one tray. that feels like stronger evidence than just saying failure taught me resilience.'
    ]
  },
  {
    caseId: 'EGA_05',
    title: 'Translation as preserving agency',
    expectedClass: 'clear_winner',
    storyEntries: [
      'family notes: I used to translate for my parents by simplifying everything so appointments would go faster.',
      'turning point: my mom answered a doctor differently in Spanish after I had already cleaned up the question for her. that was the first time I realized I was editing her uncertainty out of the room.',
      'afterward I started writing down unfamiliar terms and pausing before I paraphrased, but those logistics matter because of the agency problem, not the other way around.'
    ]
  },
  {
    caseId: 'EGA_06',
    title: 'Tutoring tracker with retention evidence',
    expectedClass: 'clear_winner',
    storyEntries: [
      'algebra lab notes: every tutor had a different way of checking if students actually kept the method after the session ended.',
      'I made a one-page tracker with the exact step where a student stalled, the self-check question that unlocked it, and which problem type to revisit the next week. teacher asked everyone to use it after repeat mistakes dropped.',
      'reflection scratch: strongest angle probably is not “I care about helping.” it is that I designed for retention instead of performing helpfulness in the moment.'
    ]
  },
  {
    caseId: 'EGA_07',
    title: 'Music section leader learns when to stop filling silence',
    expectedClass: 'clear_winner',
    storyEntries: [
      'orchestra notes: I kept singing entrances for younger players because silence made me nervous. conductor finally said I was covering the exact hesitation they needed to learn through.',
      'what changed: I stopped fixing the gap immediately and started asking what they heard instead. rehearsals got slower for a week but then they entered without waiting for me.',
      'I can also tell the story as leadership, but the real evidence is that I had to stop confusing my own comfort with support.'
    ]
  },
  {
    caseId: 'EGA_08',
    title: 'Robotics pit queue with visible before and after',
    expectedClass: 'clear_winner',
    storyEntries: [
      'regional notes: every repair bottleneck ran through me. I liked that more than I admitted.',
      'that night I made a color-coded queue, laminated checklists, and assigned subsystem leads. next day repairs dropped from around twelve minutes to five and rookies stopped waiting for me to approve each step.',
      'I wrote in my notebook that leadership finally became measurable by whether the pit still moved when I stepped away.'
    ]
  },
  {
    caseId: 'EGA_09',
    title: 'Autism support philosophy and schedule redesign both feel real',
    expectedClass: 'ambiguous',
    storyEntries: [
      'summer program notes: I realized how often “help” really meant making autistic kids look less inconvenient to adults.',
      'same summer I redesigned transitions with visual countdowns and choice cues. meltdowns dropped and new counselors copied the system.',
      'I genuinely cannot tell whether the essay center is the philosophical shift or the program redesign because one made the other visible.'
    ]
  },
  {
    caseId: 'EGA_10',
    title: 'Robotics identity shift plus delegation system',
    expectedClass: 'ambiguous',
    storyEntries: [
      'robotics scratch notes: I built my identity around being the reliable one, which sounds nicer than admitting I liked being needed.',
      'then I built subsystem leads, a repair queue, and a post-match checklist that let younger students run fixes without me.',
      'both the identity shift and the delegation system feel probative, which makes me think the honest answer might be to ask which version I would actually want to draft.'
    ]
  },
  {
    caseId: 'EGA_11',
    title: 'Service hours versus systems change at the food pantry',
    expectedClass: 'ambiguous',
    storyEntries: [
      'pantry notes: I used to think showing up every week was proof that I cared.',
      'later I realized hours alone were letting me avoid the harder question of whether the setup actually worked for older clients.',
      'I also changed pickup cards and volunteer handoff steps so fewer people got sent back to the wrong table. both stories are true and I am not sure which one should dominate.'
    ]
  },
  {
    caseId: 'EGA_12',
    title: 'Injury recovery as identity shift and rehab logistics',
    expectedClass: 'ambiguous',
    storyEntries: [
      'cross-country notes: injury forced me to ask whether contribution only counted if it looked like mileage.',
      'while I was out, I also made a rehab calendar, trainer check-in tracker, and reminder system that younger runners kept using after I came back.',
      'the evidence feels split: one lane is internal identity, the other is visible coordination.'
    ]
  },
  {
    caseId: 'EGA_13',
    title: 'Clinic translation and dignity',
    expectedClass: 'ambiguous',
    storyEntries: [
      'clinic notes: I used to translate quickly because speed felt kind.',
      'then I kept a glossary, changed intake order, and trained newer volunteers to pause before paraphrasing, which made families ask more questions.',
      'the strongest line might be dignity, but the strongest evidence might be workflow change.'
    ]
  },
  {
    caseId: 'EGA_14',
    title: 'Tutoring notes with two plausible centers',
    expectedClass: 'ambiguous',
    storyEntries: [
      'tutoring notes: I had to stop treating the student\'s confusion like a temporary obstacle to my explanation.',
      'I also built a weekly tracker so every tutor logged where a student stalled and what question unlocked the next step.',
      'both the internal reframe and the tracker are real enough that a winner should probably be treated cautiously.'
    ]
  },
  {
    caseId: 'EGA_15',
    title: 'Thin family caregiving note',
    expectedClass: 'weak_input',
    storyEntries: [
      'family caregiving. did a lot. stressful. learned patience maybe.',
      'helped with meds and appointments. not sure what moment to use.'
    ]
  },
  {
    caseId: 'EGA_16',
    title: 'Thin sports note with almost no hinge',
    expectedClass: 'weak_input',
    storyEntries: [
      'basketball bench season notes: hard year, kept showing up.',
      'probably learned teamwork? not sure. coach said keep working.'
    ]
  },
  {
    caseId: 'EGA_17',
    title: 'Messy volunteering note without clear change',
    expectedClass: 'weak_input',
    storyEntries: [
      'volunteered at shelter. some difficult conversations. one dog got adopted. felt meaningful.',
      'want to write about responsibility but I do not have a sharp moment yet.'
    ]
  },
  {
    caseId: 'EGA_18',
    title: 'Short research note with broad takeaways',
    expectedClass: 'weak_input',
    storyEntries: [
      'science fair was frustrating. had setbacks and changed plan a few times.',
      'lesson was maybe persistence / resilience. details are fuzzy right now.'
    ]
  },
  {
    caseId: 'EGA_19',
    title: 'Polished growth framing with weak support',
    expectedClass: 'genericity_trap',
    storyEntries: [
      'draft-like note: this experience taught me leadership, resilience, and the importance of community.',
      'actual memory underneath it is that I stayed after rehearsal once to help reset chairs, which is probably too small unless I can name what really changed.'
    ]
  },
  {
    caseId: 'EGA_20',
    title: 'Generic service language covering thin event detail',
    expectedClass: 'genericity_trap',
    storyEntries: [
      'service reflection: volunteering showed me that empathy matters and that helping others changes you.',
      'specific note is only that one patient asked me to repeat directions and I realized I had been speaking too fast.'
    ]
  }
];

function normalizeText(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9%]+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function overlapScore(source: string, target: string): number {
  const sourceTokens = new Set(tokenize(source));
  const targetTokens = new Set(tokenize(target));
  if (sourceTokens.size === 0 || targetTokens.size === 0) return 0;

  let matches = 0;
  for (const token of targetTokens) {
    if (sourceTokens.has(token)) matches += 1;
  }

  return matches / Math.max(1, targetTokens.size);
}

function containsFallback(text: string): boolean {
  return FALLBACK_PATTERNS.some((pattern) => pattern.test(text));
}

interface SentenceGrounding {
  sentence: string;
  overlap: number;
  supported: boolean;
}

/**
 * Splits `explanation` on sentence boundaries and scores each sentence against
 * the concatenated evidence text.  A sentence is "supported" when its token
 * overlap with the evidence is ≥ 0.08.
 */
function computeSentenceGrounding(
  explanation: string,
  evidenceTexts: string[]
): SentenceGrounding[] {
  const evidenceSource = evidenceTexts.join(' ');
  const sentences = explanation
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 15);
  return sentences.map((sentence) => {
    const score = overlapScore(evidenceSource, sentence);
    return {
      sentence,
      overlap: Math.round(score * 100) / 100,
      supported: score >= 0.08,
    };
  });
}

function buildInput(auditCase: AuditCase): NdsResolvedSources {
  return {
    essay_project: {
      id: `audit_${auditCase.caseId}`,
      student_user_id: `audit_${auditCase.caseId}`,
      title: auditCase.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `audit_${auditCase.caseId}`,
      first_name: 'Audit',
      last_name: auditCase.caseId,
      grade: 11,
      interests: [],
    },
    story_entries: auditCase.storyEntries.map((body, index) => ({
      id: `${auditCase.caseId}_${index + 1}`,
      title: `Story ${index + 1}`,
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

function selectedExplanation(payload: any): string {
  const best = payload?.best_direction ?? {};
  return [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .map((item: unknown) => normalizeText(String(item)))
    .join(' ');
}

function evidenceNote(text: string, directionText: string): string {
  const score = overlapScore(text, directionText);
  if (containsFallback(text)) return 'fallback / weak evidence note';
  if (score >= 0.15) return 'direct support';
  if (score >= 0.06) return 'related but partial support';
  return 'mostly contextual setup';
}

function candidateGroundingScore(candidate: any): number {
  const directionText = `${candidate.direction_line ?? ''} ${candidate.direction_summary ?? ''}`;
  const evidenceTexts = (candidate.evidence_spans ?? []).map((span: any) => normalizeText(String(span.text ?? '')));
  const overlap = evidenceTexts.reduce((acc: number, text: string) => acc + overlapScore(text, directionText), 0) / Math.max(1, evidenceTexts.length);
  const sufficiency = Math.min(1, evidenceTexts.join(' ').length / 220);
  const fallbackPenalty = evidenceTexts.some(containsFallback) ? 0.4 : 0;
  return Math.max(0, Math.min(1, overlap * 0.6 + sufficiency * 0.4 - fallbackPenalty));
}

function deriveAuditLabels(payload: any): AuditLabels {
  const selected = payload?.candidates?.find((candidate: any) => candidate.selected) ?? payload?.candidates?.[0];
  const candidates = payload?.candidates ?? [];
  const evidenceTexts = (selected?.evidence_spans ?? []).map((span: any) => normalizeText(String(span.text ?? '')));
  const directionText = `${selected?.direction_line ?? ''} ${selected?.direction_summary ?? ''}`;
  const explanation = selectedExplanation(payload);
  const relevanceValue = evidenceTexts.reduce((acc: number, text: string) => acc + overlapScore(text, directionText), 0) / Math.max(1, evidenceTexts.length);
  const evidenceLength = evidenceTexts.join(' ').length;
  const explanationOverlap = overlapScore(evidenceTexts.join(' '), explanation);
  const hasFallback = evidenceTexts.some(containsFallback);

  let evidence_relevance: EvidenceRelevance = 'weak';
  if (!hasFallback && relevanceValue >= 0.16) evidence_relevance = 'strong';
  else if (!hasFallback && relevanceValue >= 0.06) evidence_relevance = 'partial';

  let evidence_sufficiency: EvidenceSufficiency = 'insufficient';
  if (evidence_relevance === 'strong' && evidenceTexts.length >= 2 && evidenceLength >= 110) evidence_sufficiency = 'sufficient';
  else if (evidence_relevance !== 'weak' && evidenceLength >= 60) evidence_sufficiency = 'borderline';

  let explanation_grounding: ExplanationGrounding = 'ungrounded';
  if (!hasFallback && explanationOverlap >= 0.1 && evidence_sufficiency !== 'insufficient') explanation_grounding = 'grounded';
  else if (!hasFallback && explanationOverlap >= 0.04) explanation_grounding = 'stretched';

  let winner_defensibility_from_evidence_only: WinnerDefensibility = 'not_defensible';
  if (evidence_relevance === 'strong' && evidence_sufficiency === 'sufficient' && explanation_grounding === 'grounded') {
    winner_defensibility_from_evidence_only = 'defensible';
  } else if (evidence_relevance !== 'weak' && explanation_grounding !== 'ungrounded') {
    winner_defensibility_from_evidence_only = 'questionable';
  }

  const selectedGrounding = selected ? candidateGroundingScore(selected) : 0;
  const alternatives = candidates.filter((candidate: any) => !candidate.selected);
  const betterAlternative = alternatives
    .map((candidate: any) => ({
      candidate_id: candidate.candidate_id,
      score: candidateGroundingScore(candidate),
    }))
    .sort((left: { score: number }, right: { score: number }) => right.score - left.score)[0];

  let better_grounded_alternative_exists: AlternativeGrounding = 'no';
  let better_grounded_alternative_id: string | null = null;
  if (betterAlternative && betterAlternative.score >= selectedGrounding + 0.12) {
    better_grounded_alternative_exists = 'yes';
    better_grounded_alternative_id = betterAlternative.candidate_id;
  } else if (betterAlternative && betterAlternative.score >= selectedGrounding + 0.04) {
    better_grounded_alternative_exists = 'maybe';
    better_grounded_alternative_id = betterAlternative.candidate_id;
  }

  const reviewer_notes = [
    `Auto-audit overlap=${relevanceValue.toFixed(2)}`,
    `evidence_chars=${evidenceLength}`,
    `explanation_overlap=${explanationOverlap.toFixed(2)}`,
    better_grounded_alternative_exists !== 'no'
      ? `Alternative ${better_grounded_alternative_id} may be better grounded.`
      : 'No stronger-grounded alternative detected by the audit layer.',
    'Human review required before rollout expansion.',
  ].join(' ');

  return {
    evidence_relevance,
    evidence_sufficiency,
    explanation_grounding,
    winner_defensibility_from_evidence_only,
    better_grounded_alternative_exists,
    better_grounded_alternative_id,
    reviewer_notes,
    human_review: {
      primary_reviewer: null,
      secondary_reviewer: null,
      disagreement: null,
      final_adjudication: null,
      reason: null,
    },
  };
}

function renderPacket(packet: AuditPacket): string {
  const selectedEvidence = packet.selected_evidence
    .map((item, index) => `${index + 1}. "${item.text}"\n   note: ${item.note}`)
    .join('\n');

  const candidates = packet.all_candidates
    .map(
      (candidate) =>
        `- candidate_id: ${candidate.candidate_id}\n  direction_line: ${candidate.direction_line}\n  total_score: ${candidate.total_score.toFixed(3)}\n  evidence_spans: ${candidate.evidence_spans.length > 0 ? candidate.evidence_spans.join(' | ') : 'none'}`
    )
    .join('\n');

  // Sentence-level explanation-to-evidence grounding analysis
  const evidenceTexts = packet.selected_evidence.map((e) => e.text);
  const sentenceMap = computeSentenceGrounding(packet.selected_explanation, evidenceTexts);
  const unsupported = sentenceMap.filter((s) => !s.supported);

  const sentenceMappingLines = sentenceMap.map((s, i) =>
    `  ${i + 1}. [${s.supported ? 'supported ' : 'unsupported'} overlap=${s.overlap.toFixed(2)}] "${s.sentence.length > 88 ? s.sentence.slice(0, 85) + '...' : s.sentence}"`
  );

  const unsupportedLines =
    unsupported.length === 0
      ? ['  none']
      : unsupported.map(
          (s) =>
            `  - "${s.sentence.length > 88 ? s.sentence.slice(0, 85) + '...' : s.sentence}" (overlap=${s.overlap.toFixed(2)})`
        );

  return [
    `CASE_ID: ${packet.case_id}`,
    `TITLE: ${packet.title}`,
    `EXPECTED_CLASS: ${packet.expected_class}`,
    '',
    'RAW_INPUT:',
    ...packet.raw_input.map((input) => `- ${input}`),
    '',
    'SELECTED_WINNER:',
    `- candidate_id: ${packet.selected_winner.candidate_id}`,
    `- direction_line: ${packet.selected_winner.direction_line}`,
    `- confidence_band: ${packet.selected_winner.confidence_band}`,
    `- route_decision: ${packet.selected_winner.route_decision}`,
    '',
    'SELECTED_EVIDENCE:',
    selectedEvidence || 'none',
    '',
    'SELECTED_EXPLANATION:',
    packet.selected_explanation || 'N/A',
    '',
    'GROUNDING_ANALYSIS:',
    'explanation-to-evidence sentence mapping:',
    ...sentenceMappingLines,
    '',
    `unsupported sentences (${unsupported.length}):`,
    ...unsupportedLines,
    '',
    'ALL_CANDIDATES:',
    candidates,
    '',
    'GROUNDING_AUDIT:',
    `- evidence_relevance: ${packet.grounding_audit.evidence_relevance}`,
    `- evidence_sufficiency: ${packet.grounding_audit.evidence_sufficiency}`,
    `- explanation_grounding: ${packet.grounding_audit.explanation_grounding}`,
    `- winner_defensibility_from_evidence_only: ${packet.grounding_audit.winner_defensibility_from_evidence_only}`,
    `- better_grounded_alternative_exists: ${packet.grounding_audit.better_grounded_alternative_exists}`,
    `- better_grounded_alternative_id: ${packet.grounding_audit.better_grounded_alternative_id ?? 'n/a'}`,
    `- reviewer_notes: ${packet.grounding_audit.reviewer_notes}`,
  ].join('\n');
}

function buildSummary(packets: AuditPacket[]): string {
  const count = (predicate: (packet: AuditPacket) => boolean) => packets.filter(predicate).length;
  const strongRelevance = count((packet) => packet.grounding_audit.evidence_relevance === 'strong');
  const sufficientEvidence = count((packet) => packet.grounding_audit.evidence_sufficiency === 'sufficient');
  const groundedExplanation = count((packet) => packet.grounding_audit.explanation_grounding === 'grounded');
  const defensibleWinner = count((packet) => packet.grounding_audit.winner_defensibility_from_evidence_only === 'defensible');
  const weakRelevance = count((packet) => packet.grounding_audit.evidence_relevance === 'weak');
  const insufficientEvidence = count((packet) => packet.grounding_audit.evidence_sufficiency === 'insufficient');
  const ungroundedExplanation = count((packet) => packet.grounding_audit.explanation_grounding === 'ungrounded');
  const notDefensible = count((packet) => packet.grounding_audit.winner_defensibility_from_evidence_only === 'not_defensible');
  const betterAlternativeYes = count((packet) => packet.grounding_audit.better_grounded_alternative_exists === 'yes');

  const pass =
    strongRelevance / packets.length >= 0.8 &&
    sufficientEvidence / packets.length >= 0.75 &&
    groundedExplanation / packets.length >= 0.8 &&
    defensibleWinner / packets.length >= 0.8 &&
    weakRelevance <= 2 &&
    insufficientEvidence <= 2 &&
    ungroundedExplanation <= 2 &&
    notDefensible <= 2 &&
    betterAlternativeYes <= 3;

  const weakCases = packets.filter(
    (packet) =>
      packet.grounding_audit.evidence_relevance === 'weak' ||
      packet.grounding_audit.evidence_sufficiency === 'insufficient' ||
      packet.grounding_audit.explanation_grounding === 'ungrounded' ||
      packet.grounding_audit.winner_defensibility_from_evidence_only === 'not_defensible'
  );

  const alternativeCases = packets.filter((packet) => packet.grounding_audit.better_grounded_alternative_exists === 'yes');

  return [
    '# NDS Evidence Grounding Audit Results V1',
    '',
    '## Audit purpose',
    '',
    'This audit checks whether the selected strongest direction is genuinely supported by the student text, whether the cited evidence is actually probative, and whether the explanation stays within the bounds of that evidence. These packets are deterministic audit-layer outputs and still require human review before release decisions.',
    '',
    '## Case mix',
    '',
    `- 20 locked cases total`,
    `- 8 clear winner cases`,
    `- 6 ambiguous cases`,
    `- 4 weak-input cases`,
    `- 2 genericity-trap cases`,
    '',
    '## Pass / fail summary',
    '',
    `- Overall result: ${pass ? 'PASS' : 'FAIL'}`,
    `- Strong evidence relevance: ${strongRelevance}/20`,
    `- Sufficient evidence: ${sufficientEvidence}/20`,
    `- Grounded explanations: ${groundedExplanation}/20`,
    `- Defensible winners from evidence only: ${defensibleWinner}/20`,
    `- Better-grounded alternatives = yes: ${betterAlternativeYes}/20`,
    '',
    '## Aggregate grounding metrics',
    '',
    `- Weak evidence relevance cases: ${weakRelevance}`,
    `- Insufficient evidence cases: ${insufficientEvidence}`,
    `- Ungrounded explanation cases: ${ungroundedExplanation}`,
    `- Not defensible winner cases: ${notDefensible}`,
    '',
    '## Cases with weak grounding',
    '',
    ...(weakCases.length > 0
      ? weakCases.map(
          (packet) =>
            `- ${packet.case_id}: relevance=${packet.grounding_audit.evidence_relevance}, sufficiency=${packet.grounding_audit.evidence_sufficiency}, explanation=${packet.grounding_audit.explanation_grounding}, defensibility=${packet.grounding_audit.winner_defensibility_from_evidence_only}`
        )
      : ['- None by automated pre-audit.']),
    '',
    '## Cases with better-grounded alternatives',
    '',
    ...(alternativeCases.length > 0
      ? alternativeCases.map(
          (packet) =>
            `- ${packet.case_id}: selected=${packet.selected_winner.candidate_id}, better_grounded_alternative=${packet.grounding_audit.better_grounded_alternative_id}`
        )
      : ['- None by automated pre-audit.']),
    '',
    '## Remediation recommendations',
    '',
    '- Human reviewers should inspect every packet and only judge whether the evidence shown actually justifies the winner.',
    '- Cases flagged with weak / insufficient / ungrounded labels should be treated as release blockers until adjudicated.',
    '- If more than 3 cases remain with clearly better-grounded alternatives after human review, rollout should remain blocked.',
    '- Re-run this locked set after any scorer or evidence-routing change to confirm that selected winners stay grounded in the student notes.',
    '',
    '## Human review requirement',
    '',
    '- Primary reviewer: required',
    '- Secondary reviewer: optional for contested packets',
    '- Final adjudication must be written into the serialized audit packet before rollout expansion.',
  ].join('\n');
}

async function run(): Promise<void> {
  const packets: AuditPacket[] = [];

  for (const auditCase of AUDIT_CASES) {
    const contextPack = buildNdsNormalizedContextPack(buildInput(auditCase));
    const execution = await executeNdsModule({
      run_id: `audit_${auditCase.caseId}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: contextPack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = execution.candidate_payload as any;
    const selected = payload?.candidates?.find((candidate: any) => candidate.selected) ?? payload?.candidates?.[0];
    const selectedEvidence = (selected?.evidence_spans ?? []).map((span: any) => ({
      text: normalizeText(String(span.text ?? '')),
      note: evidenceNote(String(span.text ?? ''), `${selected?.direction_line ?? ''} ${selected?.direction_summary ?? ''}`),
    }));

    packets.push({
      case_id: auditCase.caseId,
      title: auditCase.title,
      expected_class: auditCase.expectedClass,
      raw_input: auditCase.storyEntries,
      selected_winner: {
        candidate_id: selected?.candidate_id ?? 'n/a',
        direction_line: normalizeText(String(selected?.direction_line ?? '')),
        confidence_band: String(payload?.confidence_band ?? 'n/a'),
        route_decision: String(payload?.route_decision ?? 'n/a'),
      },
      selected_evidence: selectedEvidence,
      selected_explanation: selectedExplanation(payload),
      all_candidates: (payload?.candidates ?? []).map((candidate: any) => ({
        candidate_id: String(candidate.candidate_id),
        direction_line: normalizeText(String(candidate.direction_line ?? '')),
        total_score: Number(candidate.scores?.total_score ?? 0),
        evidence_spans: (candidate.evidence_spans ?? []).map((span: any) => normalizeText(String(span.text ?? ''))),
      })),
      grounding_audit: deriveAuditLabels(payload),
    });
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(packets, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildSummary(packets));

  for (const packet of packets) {
    console.log(renderPacket(packet));
    console.log('\n' + '-'.repeat(80) + '\n');
  }

  console.log(`Wrote audit packets to ${OUTPUT_JSON}`);
  console.log(`Wrote summary artifact to ${OUTPUT_MD}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
