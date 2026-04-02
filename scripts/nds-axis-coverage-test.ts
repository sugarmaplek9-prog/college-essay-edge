#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type AxisFamily =
  | 'system_redesign'
  | 'delegation_distributed_responsibility'
  | 'pattern_breaking'
  | 'identity_transformation'
  | 'relationship_or_listening';

type PresenceLabel = 'present' | 'partial' | 'missing';
type BestFitLabel = 'strong_fit' | 'partial_fit' | 'wrong_family';
type YesNo = 'yes' | 'no';
type BetterFamilyShouldExist = 'yes' | 'maybe' | 'no';

interface CoverageCase {
  caseId: string;
  title: string;
  targetFamily: AxisFamily;
  rawInput: string[];
}

interface CandidateAuditRow {
  candidate_id: string;
  direction_line: string;
  direction_summary: string;
  inferred_family_label: string;
  total_score: number;
}

interface CoveragePacket {
  case_id: string;
  title: string;
  target_family: AxisFamily;
  raw_input: string[];
  selected_candidate_id: string;
  selected_direction_line: string;
  selected_confidence_band: string;
  selected_route_decision: string;
  candidates: CandidateAuditRow[];
  axis_coverage_audit: {
    target_family_present: PresenceLabel;
    target_family_candidate_ids: string[];
    best_family_fit: BestFitLabel;
    generic_competence_fallback_present: YesNo;
    better_family_should_exist: BetterFamilyShouldExist;
    reviewer_notes: string;
  };
}

interface AggregateSummary {
  present_count: number;
  partial_count: number;
  missing_count: number;
  strong_fit_count: number;
  generic_fallback_yes_count: number;
  global_pass: boolean;
  family_stats: Record<AxisFamily, { total: number; present: number; partial: number; missing: number }>;
  family_pass: Record<AxisFamily, boolean>;
}

const OUTPUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'nds_axis_coverage_test_v1.json');
const OUTPUT_MD = path.join(process.cwd(), 'docs', 'engineering', 'NDS_AXIS_COVERAGE_TEST_RESULTS_V1.md');

const GENERIC_COMPETENCE_FALLBACK_PATTERN =
  /\b(handled\s+pressure|performed\s+well\s+in\s+a\s+hard\s+situation|kept\s+going\s+through\s+difficulty|leadership\s+under\s+challenge|how\s+you\s+handled|how\s+you\s+performed|how\s+you\s+kept\s+going|under\s+pressure)\b/i;

const FAMILY_PRESENT_PATTERNS: Record<AxisFamily, RegExp> = {
  system_redesign:
    /\b(redesigned\s+the\s+system|system\s+had\s+to\s+change|redesigning\s+the\s+structure|process\s+stopped\s+holding|workflow|tracker|architecture|ticket\s+rail|restructured|changed\s+the\s+system)\b/i,
  delegation_distributed_responsibility:
    /\b(stopped\s+being\s+the\s+bottleneck|distributing\s+responsibility|distributed\s+ownership|shared\s+ownership|handoff|single\s+point\s+of\s+failure|delegat)\b/i,
  pattern_breaking:
    /\b(wrong\s+pattern|broke\s+it\s+on\s+purpose|had\s+to\s+stop|stopped\s+repeating|default\s+response|persistence\s+was\s+the\s+wrong\s+pattern)\b/i,
  identity_transformation:
    /\b(who\s+you\s+were\s+becoming|identity|self|self-concept|stopped\s+seeing\s+yourself|who\s+i\s+was\s+becoming|not\s+just\s+what\s+you\s+were\s+doing)\b/i,
  relationship_or_listening:
    /\b(listening|owed\s+the\s+person|person\s+in\s+front\s+of\s+you|relationship|room\s+once\s+the\s+conflict|paid\s+attention\s+to\s+what\s+the\s+person)\b/i,
};

const FAMILY_PARTIAL_PATTERNS: Record<AxisFamily, RegExp> = {
  system_redesign:
    /\b(changed\s+approach|managed\s+the\s+work|solving\s+it\s+alone|worked\s+differently|adjusted\s+your\s+approach)\b/i,
  delegation_distributed_responsibility:
    /\b(decisions\s+affected\s+people|team|worked\s+differently|responsibility)\b/i,
  pattern_breaking:
    /\b(changed\s+approach|corrected\s+course|what\s+changed\s+after|rethink)\b/i,
  identity_transformation:
    /\b(changed\s+approach|affected\s+other\s+people|corrected\s+course|what\s+changed\s+after)\b/i,
  relationship_or_listening:
    /\b(changed\s+approach|responsibility|helping\s+stopped\s+being|what\s+real\s+help\s+looked\s+like)\b/i,
};

const CASES: CoverageCase[] = [
  {
    caseId: 'AXC_01',
    title: 'Restaurant ticket rail redesign',
    targetFamily: 'system_redesign',
    rawInput: [
      'restaurant expo notes: we kept losing tickets during rush because everything was verbal.',
      'I rebuilt the process with a printed ticket rail, priority colors, and a staging zone.',
      'after the redesign, lost tickets dropped to zero and kitchen callbacks almost disappeared.',
    ],
  },
  {
    caseId: 'AXC_02',
    title: 'Tutoring center stall tracker architecture',
    targetFamily: 'system_redesign',
    rawInput: [
      'one-off tutoring fixes worked per student but the same failure repeated across tutors.',
      'I built a shared tracker and changed session workflow so each tutor logged stall points and unlocks.',
      'pass rate rose after the system changed.',
    ],
  },
  {
    caseId: 'AXC_03',
    title: 'Food pantry cadence redesign',
    targetFamily: 'system_redesign',
    rawInput: [
      'I noticed third-week pickup dropped every month at the pantry.',
      'I built tracking sheets and proposed shifting from monthly packs to smaller weekly allotments.',
      'the recurring drop disappeared once the process changed.',
    ],
  },
  {
    caseId: 'AXC_04',
    title: 'Debate prep architecture rebuild',
    targetFamily: 'system_redesign',
    rawInput: [
      'our debate prep was speed-first and collapsed in depth rounds.',
      'I rewrote preparation structure with rebuttal drills, case autopsies, and decision trees.',
      'elimination-round results improved after the new architecture.',
    ],
  },
  {
    caseId: 'AXC_05',
    title: 'Code review bottleneck delegation',
    targetFamily: 'delegation_distributed_responsibility',
    rawInput: [
      'I was the single point of failure for code review and everyone waited on me.',
      'I delegated review ownership to three engineers and added handoff rules.',
      'turnaround dropped from three days to under one once responsibility was distributed.',
    ],
  },
  {
    caseId: 'AXC_06',
    title: 'Robotics pit distributed ownership',
    targetFamily: 'delegation_distributed_responsibility',
    rawInput: [
      'every repair bottleneck ran through me and rookies waited for my approval.',
      'I assigned subsystem leads, delegated checklists, and distributed ownership.',
      'the pit ran without me as the center.',
    ],
  },
  {
    caseId: 'AXC_07',
    title: 'Tutoring over-explanation pattern break',
    targetFamily: 'pattern_breaking',
    rawInput: [
      'when students were confused I kept pushing harder with longer explanations.',
      'I realized persistence was the wrong pattern and stopped repeating it.',
      'learning improved once I switched to diagnostic questions.',
    ],
  },
  {
    caseId: 'AXC_08',
    title: 'Interpreter softening habit interruption',
    targetFamily: 'pattern_breaking',
    rawInput: [
      'I kept softening my parents\' uncertainty to make appointments go faster.',
      'I had to stop that habit once I saw I was erasing what they wanted to say.',
      'doctors finally responded to their real concerns after the break.',
    ],
  },
  {
    caseId: 'AXC_09',
    title: 'Language self-concept shift',
    targetFamily: 'identity_transformation',
    rawInput: [
      'I stopped seeing myself as split between two languages and started seeing both as one thinking system.',
      'the real change was who I was becoming, not just what I was doing in class.',
      'my self-concept shifted from performing fluency to translating between worlds.',
    ],
  },
  {
    caseId: 'AXC_10',
    title: 'Fixer identity release',
    targetFamily: 'identity_transformation',
    rawInput: [
      'I always saw myself as the fixer who had to rescue every problem personally.',
      'after one conflict I realized I was becoming someone who asked better questions.',
      'the story is about identity change, not just a tactic change.',
    ],
  },
  {
    caseId: 'AXC_11',
    title: 'Hospital volunteer listening pivot',
    targetFamily: 'relationship_or_listening',
    rawInput: [
      'I thought helping meant doing as many tasks as possible at the hospital.',
      'a nurse told me I was getting in the way because I moved before asking what was needed.',
      'I shifted to listening first and patient interactions changed immediately.',
    ],
  },
  {
    caseId: 'AXC_12',
    title: 'Debate partner listening correction',
    targetFamily: 'relationship_or_listening',
    rawInput: [
      'as captain I kept cutting my partner off because I thought being right was the job.',
      'I changed by asking questions after speeches instead of correcting publicly.',
      'the relationship changed once listening replaced control.',
    ],
  },
];

function buildInput(c: CoverageCase): NdsResolvedSources {
  return {
    essay_project: {
      id: `axc_${c.caseId}`,
      student_user_id: `axc_${c.caseId}`,
      title: c.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `axc_${c.caseId}`,
      first_name: 'AxisCoverage',
      last_name: c.caseId,
      grade: 11,
      interests: [],
    },
    story_entries: c.rawInput.map((body, i) => ({
      id: `${c.caseId}_${i + 1}`,
      title: `Story ${i + 1}`,
      body,
      category: null,
    })),
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: c.rawInput.length,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

function inferFamilyLabel(directionLine: string): string {
  const line = directionLine.toLowerCase();
  if (FAMILY_PRESENT_PATTERNS.system_redesign.test(line)) return 'system_redesign';
  if (FAMILY_PRESENT_PATTERNS.delegation_distributed_responsibility.test(line)) return 'delegation_distributed_responsibility';
  if (FAMILY_PRESENT_PATTERNS.pattern_breaking.test(line)) return 'pattern_breaking';
  if (FAMILY_PRESENT_PATTERNS.identity_transformation.test(line)) return 'identity_transformation';
  if (FAMILY_PRESENT_PATTERNS.relationship_or_listening.test(line)) return 'relationship_or_listening';
  if (GENERIC_COMPETENCE_FALLBACK_PATTERN.test(line)) return 'generic_competence_or_challenge';
  return 'unclassified';
}

function classifyPresence(targetFamily: AxisFamily, candidates: CandidateAuditRow[]): {
  label: PresenceLabel;
  matchedIds: string[];
  partialIds: string[];
} {
  const presentIds = candidates
    .filter((c) => FAMILY_PRESENT_PATTERNS[targetFamily].test(c.direction_line))
    .map((c) => c.candidate_id);
  if (presentIds.length > 0) {
    return { label: 'present', matchedIds: presentIds, partialIds: [] };
  }

  const partialIds = candidates
    .filter((c) => FAMILY_PARTIAL_PATTERNS[targetFamily].test(c.direction_line))
    .map((c) => c.candidate_id);
  if (partialIds.length > 0) {
    return { label: 'partial', matchedIds: [], partialIds };
  }

  return { label: 'missing', matchedIds: [], partialIds: [] };
}

function bestFamilyFit(targetFamily: AxisFamily, candidates: CandidateAuditRow[]): BestFitLabel {
  const hasStrongFamilyCandidate = candidates.some((c) =>
    FAMILY_PRESENT_PATTERNS[targetFamily].test(c.direction_line)
  );
  if (hasStrongFamilyCandidate) return 'strong_fit';

  const hasPartialFamilyCandidate = candidates.some((c) =>
    FAMILY_PARTIAL_PATTERNS[targetFamily].test(c.direction_line)
  );
  if (hasPartialFamilyCandidate) return 'partial_fit';

  return 'wrong_family';
}

function betterFamilyShouldExist(presence: PresenceLabel): BetterFamilyShouldExist {
  if (presence === 'missing') return 'yes';
  if (presence === 'partial') return 'maybe';
  return 'no';
}

function reviewerNotes(
  targetFamily: AxisFamily,
  presence: PresenceLabel,
  fit: BestFitLabel,
  fallback: YesNo,
  matchedIds: string[],
  partialIds: string[]
): string {
  if (presence === 'present') {
    return `Coverage confirmed: target family ${targetFamily} appears in candidate(s) ${matchedIds.join(', ')}.`;
  }
  if (presence === 'partial') {
    return `Partial coverage: target family ${targetFamily} is only gestured at by candidate(s) ${partialIds.join(', ')}.`;
  }
  return `Missing coverage: no candidate clearly names ${targetFamily}.` +
    (fallback === 'yes' ? ' Generic competence fallback detected.' : '');
}

function computeAggregate(packets: CoveragePacket[]): AggregateSummary {
  const presentCount = packets.filter((p) => p.axis_coverage_audit.target_family_present === 'present').length;
  const partialCount = packets.filter((p) => p.axis_coverage_audit.target_family_present === 'partial').length;
  const missingCount = packets.filter((p) => p.axis_coverage_audit.target_family_present === 'missing').length;
  const strongFitCount = packets.filter((p) => p.axis_coverage_audit.best_family_fit === 'strong_fit').length;
  const genericFallbackYesCount = packets.filter((p) => p.axis_coverage_audit.generic_competence_fallback_present === 'yes').length;

  const familyStats: AggregateSummary['family_stats'] = {
    system_redesign: { total: 0, present: 0, partial: 0, missing: 0 },
    delegation_distributed_responsibility: { total: 0, present: 0, partial: 0, missing: 0 },
    pattern_breaking: { total: 0, present: 0, partial: 0, missing: 0 },
    identity_transformation: { total: 0, present: 0, partial: 0, missing: 0 },
    relationship_or_listening: { total: 0, present: 0, partial: 0, missing: 0 },
  };

  for (const packet of packets) {
    const stat = familyStats[packet.target_family];
    stat.total += 1;
    stat[packet.axis_coverage_audit.target_family_present] += 1;
  }

  const familyPass: AggregateSummary['family_pass'] = {
    system_redesign:
      familyStats.system_redesign.present >= 3 && familyStats.system_redesign.missing === 0,
    delegation_distributed_responsibility:
      familyStats.delegation_distributed_responsibility.present === 2,
    pattern_breaking:
      familyStats.pattern_breaking.present === 2,
    identity_transformation:
      familyStats.identity_transformation.present === 2,
    relationship_or_listening:
      familyStats.relationship_or_listening.present === 2,
  };

  const globalPass =
    presentCount >= 10 &&
    partialCount <= 2 &&
    missingCount === 0 &&
    strongFitCount >= 10 &&
    genericFallbackYesCount <= 2 &&
    Object.values(familyPass).every(Boolean);

  return {
    present_count: presentCount,
    partial_count: partialCount,
    missing_count: missingCount,
    strong_fit_count: strongFitCount,
    generic_fallback_yes_count: genericFallbackYesCount,
    global_pass: globalPass,
    family_stats: familyStats,
    family_pass: familyPass,
  };
}

function buildMarkdown(packets: CoveragePacket[], aggregate: AggregateSummary): string {
  const missing = packets.filter((p) => p.axis_coverage_audit.target_family_present === 'missing');
  const partial = packets.filter((p) => p.axis_coverage_audit.target_family_present === 'partial');
  const fallback = packets.filter((p) => p.axis_coverage_audit.generic_competence_fallback_present === 'yes');

  return [
    '# NDS_AXIS_COVERAGE_TEST_RESULTS_V1',
    '',
    '## Protocol purpose',
    '',
    'Verify that when a story clearly belongs to a specific axis family, the candidate generator includes that family in the non-rejected candidate set.',
    '',
    '## Case inventory by family',
    '',
    '- system_redesign: 4',
    '- delegation_distributed_responsibility: 2',
    '- pattern_breaking: 2',
    '- identity_transformation: 2',
    '- relationship_or_listening: 2',
    '',
    '## Aggregate pass/fail summary',
    '',
    `- target_family_present present: ${aggregate.present_count}/12 (${aggregate.present_count >= 10 ? 'PASS' : 'FAIL'})`,
    `- target_family_present partial: ${aggregate.partial_count}/12 (${aggregate.partial_count <= 2 ? 'PASS' : 'FAIL'})`,
    `- target_family_present missing: ${aggregate.missing_count}/12 (${aggregate.missing_count === 0 ? 'PASS' : 'FAIL'})`,
    `- best_family_fit strong_fit: ${aggregate.strong_fit_count}/12 (${aggregate.strong_fit_count >= 10 ? 'PASS' : 'FAIL'})`,
    `- generic_competence_fallback_present yes: ${aggregate.generic_fallback_yes_count}/12 (${aggregate.generic_fallback_yes_count <= 2 ? 'PASS' : 'FAIL'})`,
    '',
    '### Family-level thresholds',
    '',
    `- system_redesign present ${aggregate.family_stats.system_redesign.present}/4, missing ${aggregate.family_stats.system_redesign.missing}/4 (${aggregate.family_pass.system_redesign ? 'PASS' : 'FAIL'})`,
    `- delegation_distributed_responsibility present ${aggregate.family_stats.delegation_distributed_responsibility.present}/2 (${aggregate.family_pass.delegation_distributed_responsibility ? 'PASS' : 'FAIL'})`,
    `- pattern_breaking present ${aggregate.family_stats.pattern_breaking.present}/2 (${aggregate.family_pass.pattern_breaking ? 'PASS' : 'FAIL'})`,
    `- identity_transformation present ${aggregate.family_stats.identity_transformation.present}/2 (${aggregate.family_pass.identity_transformation ? 'PASS' : 'FAIL'})`,
    `- relationship_or_listening present ${aggregate.family_stats.relationship_or_listening.present}/2 (${aggregate.family_pass.relationship_or_listening ? 'PASS' : 'FAIL'})`,
    '',
    `**OVERALL: ${aggregate.global_pass ? 'PASS' : 'FAIL'}**`,
    '',
    '## Missing-family cases',
    '',
    ...(missing.length === 0
      ? ['- None']
      : missing.map((p) => `- ${p.case_id} (${p.target_family}): selected="${p.selected_direction_line}"`)),
    '',
    '## Partial-family cases',
    '',
    ...(partial.length === 0
      ? ['- None']
      : partial.map((p) => `- ${p.case_id} (${p.target_family}): ${p.axis_coverage_audit.reviewer_notes}`)),
    '',
    '## Generic competence fallback cases',
    '',
    ...(fallback.length === 0
      ? ['- None']
      : fallback.map((p) => `- ${p.case_id}: "${p.selected_direction_line}"`)),
    '',
    '## Remediation recommendations',
    '',
    '- For any missing family case, add family-specific candidate constructors in the runtime candidate path.',
    '- If partial cases exceed threshold, tighten family-specific line templates so they explicitly name axis nouns (system, delegation, pattern break, identity, listening).',
    '- If generic fallback cases exceed threshold, expand hard/soft rejection filters for competence/challenge phrasing.',
    '- Re-run NDS_DIRECTION_LINE_FIT_AUDIT_V1 after any candidate-family changes.',
  ].join('\n');
}

function renderPacket(packet: CoveragePacket): string {
  const candidateLines = packet.candidates
    .map(
      (c) =>
        `- candidate_id: ${c.candidate_id}\n` +
        `  direction_line: ${c.direction_line}\n` +
        `  direction_summary: ${c.direction_summary}\n` +
        `  inferred_family_label: ${c.inferred_family_label}\n` +
        `  total_score: ${c.total_score.toFixed(3)}`
    )
    .join('\n');

  return [
    `CASE_ID: ${packet.case_id}`,
    `TITLE: ${packet.title}`,
    `TARGET_FAMILY: ${packet.target_family}`,
    '',
    'RAW_INPUT:',
    ...packet.raw_input.map((line) => `- ${line}`),
    '',
    'CANDIDATES:',
    candidateLines,
    '',
    'AXIS_COVERAGE_AUDIT:',
    `- target_family_present: ${packet.axis_coverage_audit.target_family_present}`,
    `- target_family_candidate_ids: ${packet.axis_coverage_audit.target_family_candidate_ids.join(', ') || 'none'}`,
    `- best_family_fit: ${packet.axis_coverage_audit.best_family_fit}`,
    `- generic_competence_fallback_present: ${packet.axis_coverage_audit.generic_competence_fallback_present}`,
    `- better_family_should_exist: ${packet.axis_coverage_audit.better_family_should_exist}`,
    `- reviewer_notes: ${packet.axis_coverage_audit.reviewer_notes}`,
  ].join('\n');
}

async function run(): Promise<void> {
  const packets: CoveragePacket[] = [];

  for (const c of CASES) {
    const context = buildNdsNormalizedContextPack(buildInput(c));
    const execution = await executeNdsModule({
      run_id: `axc_${c.caseId}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: context,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = execution.candidate_payload as any;
    const candidatesRaw = payload?.candidates ?? [];
    const selected = candidatesRaw.find((x: any) => x.selected) ?? candidatesRaw[0] ?? null;

    const candidates: CandidateAuditRow[] = candidatesRaw.map((x: any) => ({
      candidate_id: String(x.candidate_id ?? ''),
      direction_line: String(x.direction_line ?? ''),
      direction_summary: String(x.direction_summary ?? ''),
      inferred_family_label: inferFamilyLabel(String(x.direction_line ?? '')),
      total_score: Number(x.scores?.total_score ?? 0),
    }));

    const presence = classifyPresence(c.targetFamily, candidates);
    const fit = bestFamilyFit(c.targetFamily, candidates);
    const selectedLine = String(selected?.direction_line ?? '');
    const fallback: YesNo = GENERIC_COMPETENCE_FALLBACK_PATTERN.test(selectedLine) ? 'yes' : 'no';
    const betterShould = betterFamilyShouldExist(presence.label);
    const notes = reviewerNotes(c.targetFamily, presence.label, fit, fallback, presence.matchedIds, presence.partialIds);

    packets.push({
      case_id: c.caseId,
      title: c.title,
      target_family: c.targetFamily,
      raw_input: c.rawInput,
      selected_candidate_id: String(selected?.candidate_id ?? 'n/a'),
      selected_direction_line: selectedLine,
      selected_confidence_band: String(payload?.confidence_band ?? 'n/a'),
      selected_route_decision: String(payload?.route_decision ?? 'n/a'),
      candidates,
      axis_coverage_audit: {
        target_family_present: presence.label,
        target_family_candidate_ids: presence.matchedIds,
        best_family_fit: fit,
        generic_competence_fallback_present: fallback,
        better_family_should_exist: betterShould,
        reviewer_notes: notes,
      },
    });
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(packets, null, 2));

  const aggregate = computeAggregate(packets);
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(packets, aggregate));

  for (const packet of packets) {
    console.log(renderPacket(packet));
    console.log('\n' + '─'.repeat(88) + '\n');
  }

  console.log('NDS_AXIS_COVERAGE_TEST_V1');
  console.log(`  present: ${aggregate.present_count}/12`);
  console.log(`  partial: ${aggregate.partial_count}/12`);
  console.log(`  missing: ${aggregate.missing_count}/12`);
  console.log(`  strong_fit: ${aggregate.strong_fit_count}/12`);
  console.log(`  generic_fallback_yes: ${aggregate.generic_fallback_yes_count}/12`);
  console.log(`  overall: ${aggregate.global_pass ? 'PASS' : 'FAIL'}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);

  if (!aggregate.global_pass) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
