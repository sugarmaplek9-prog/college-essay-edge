#!/usr/bin/env node

import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type CaseKind = 'action_dominant' | 'realization_dominant' | 'ambiguity';
type ExpectedWinner = 'direction_1' | 'direction_2' | 'clarification';

interface ProtocolCase {
  id: string;
  kind: CaseKind;
  title: string;
  expectedWinner: ExpectedWinner;
  primary: string;
  secondary: string;
  tertiary?: string;
}

interface ProtocolResult {
  id: string;
  kind: CaseKind;
  expectedWinner: ExpectedWinner;
  actualWinner: string;
  confidenceBand: string;
  routeDecision: string;
  margin: number;
  hasFallbackBoilerplate: boolean;
  passed: boolean;
}

const FALLBACK_PATTERNS = [
  /change signal is limited/i,
  /partial change indicators/i,
  /no clear evidence span available/i,
  /needs clearer evidence/i,
  /full self-correction arc is not yet clear/i,
];

const PROTOCOL_CASES: ProtocolCase[] = [
  {
    id: 'ACTION_01_ROBOTICS_WORKFLOW',
    kind: 'action_dominant',
    title: 'Robotics pit workflow redesign',
    expectedWinner: 'direction_2',
    primary:
      'I liked being the person everyone came to in the robotics pit. For a long time, I treated that as proof that I was leading well. Eventually I started to wonder whether being useful and being central were actually the same thing.',
    secondary:
      'At our second regional, the pit stalled because every repair bottleneck came through me. I redesigned our pit workflow that night: color-coded repair queues, laminated checklists, and assigned subsystem leads for wiring, drivetrain, and tools. The next day our average repair turnaround dropped from twelve minutes to five, and two younger students ran fixes without waiting for me. I stopped measuring leadership by how much I personally touched and started measuring it by whether the pit kept moving when I stepped away.',
    tertiary:
      'After that competition, our rookies were calmer because they finally had a visible process to rely on instead of waiting for me to rescue each problem.',
  },
  {
    id: 'ACTION_02_CLINIC_INTAKE',
    kind: 'action_dominant',
    title: 'Clinic intake redesign',
    expectedWinner: 'direction_2',
    primary:
      'Volunteering at the clinic made me think more carefully about what service means. I started to understand that good intentions are not enough if a patient still leaves confused.',
    secondary:
      'During Saturday intake, I kept seeing Spanish-speaking patients sent from one desk to another because the forms mixed insurance questions with symptom questions. I rewrote the intake packet into two pages, added a color strip for language needs, and trained new volunteers to start with the language strip before handing over paperwork. Over the next month, the average intake wait for Spanish-speaking families dropped by nineteen minutes, and our supervising nurse adopted the workflow for every weekend shift. The real shift was not just noticing confusion; it was building a process that removed it.',
    tertiary:
      'I also began keeping a notebook of moments when patients hesitated before answering. That habit made me pay attention to where the system, not the person, was creating stress.',
  },
  {
    id: 'ACTION_03_TUTORING_TRACKER',
    kind: 'action_dominant',
    title: 'Peer tutoring progress tracker',
    expectedWinner: 'direction_2',
    primary:
      'I used to think tutoring meant being patient enough to explain the same idea multiple times. Eventually I realized patience only matters if the student can actually use the explanation later without you there.',
    secondary:
      'When our algebra lab added ten new ninth graders, I noticed each tutor was improvising a different system for checking whether students retained methods from week to week. I built a one-page tracker that logged the exact step where a student stalled, the self-check question that unlocked it, and the problem type to revisit the next session. Within three weeks, our lead teacher asked every tutor to use it because repeat mistakes on linear-equation quizzes dropped sharply. What changed for me was concrete: I stopped performing helpfulness in the moment and started designing for retention between sessions.',
    tertiary:
      'The tracker also let me see that students shut down fastest when they could not name where they were confused. Once I saw that pattern, my opening question changed from “Do you get it?” to “Which step feels least stable right now?”',
  },
  {
    id: 'ACTION_04_RESEARCH_PROTOCOL',
    kind: 'action_dominant',
    title: 'Research contamination protocol',
    expectedWinner: 'direction_2',
    primary:
      'Failed experiments embarrassed me more than I wanted to admit. I knew that was not a useful reaction, but at first my reflection stayed at the level of frustration rather than change.',
    secondary:
      'After our water-quality cultures kept collapsing, I traced the issue to the five-minute gap between collecting samples and labeling them. I rewrote our protocol so every tube was pre-labeled, added a contamination checkpoint at the sink, and required each team member to initial the sample sheet before incubation. The next round produced usable cultures in all but one set, and our advisor asked me to teach the protocol to the incoming team. The real before-and-after was concrete: I moved from absorbing failure as a mood to designing a method that prevented the same mistake from repeating.',
    tertiary:
      'That change also made me less defensive during lab meetings, because I could point to a process instead of protecting my ego.',
  },
  {
    id: 'ACTION_05_RESTAURANT_EXPO',
    kind: 'action_dominant',
    title: 'Restaurant expo line coordination',
    expectedWinner: 'direction_2',
    primary:
      'Working weekend dinner service taught me that pressure does not automatically create discipline. I had to learn that staying calm matters only if it changes how other people can work around you.',
    secondary:
      'On Friday nights our expo line jammed because tickets were shouted, then forgotten, then shouted again. I reorganized the line into three stations, clipped tickets in firing order, and started reading back only the items that could stall the whole table. The kitchen manager kept the system because missed sides dropped and servers stopped crowding the pass. My contribution was not just keeping up under pressure; it was making the pressure legible enough for everyone else to move through it.',
    tertiary:
      'The calmer line mattered because the new station order removed confusion before it could turn into conflict.',
  },
  {
    id: 'ACTION_06_TEAM_REHAB_PLAN',
    kind: 'action_dominant',
    title: 'Cross-country rehab communication system',
    expectedWinner: 'direction_2',
    primary:
      'Being injured forced me to rethink what contribution means when your usual role disappears. I realized I could either narrate my frustration or create a new kind of usefulness for the team.',
    secondary:
      'When I was sidelined during cross-country season, our freshmen kept missing rehab exercises because the schedule changed between school, the trainer, and home workouts. I built a shared calendar with color-coded recovery blocks, logged who needed resistance bands or trainer check-ins, and texted reminders tied to workout types instead of generic “do rehab” messages. Attendance at rehab sessions went from inconsistent to nearly full, and two younger runners kept using the system after I returned. That was the real turn: I stopped treating injury as private disappointment and started building structure that kept other runners from drifting through recovery the way I had at first.',
    tertiary:
      'The calendar changed my own mindset too, because it gave me a role measured by coordination and follow-through rather than miles logged.',
  },
  {
    id: 'REALIZATION_01_DEBATE_LISTENING',
    kind: 'realization_dominant',
    title: 'Debate listening over dominance',
    expectedWinner: 'direction_1',
    primary:
      'I joined debate because I liked the clean feeling of winning a round with the better argument. Then my captain told me that my best speeches were making my partner smaller. That comment stayed with me because it exposed something ugly: I had been doing debate for the wrong reason. I had mistaken control for leadership. The real shift was not tactical or organizational but relational: listening closely enough to change my own approach mattered more than sounding unshakable, and being impressive was not the same thing as making someone next to me stronger.',
    secondary:
      'That season I also kept a cleaner prep folder, wrote better case briefs, and ran extra drills with our novice team. Those habits made me a more organized captain and helped the team feel prepared before tournaments, but they were still the visible work around the deeper change rather than the center of it.',
  },
  {
    id: 'REALIZATION_02_TRANSLATION_TRUST',
    kind: 'realization_dominant',
    title: 'Translation as trust, not speed',
    expectedWinner: 'direction_1',
    primary:
      'At first I thought translating for my parents meant converting information quickly and accurately. What I did not see was how often I was editing their uncertainty out of the conversation because I wanted the interaction to move faster. The turning point came when my mother answered a doctor’s question differently in Spanish after I had already “simplified” it for her. I realized I had been treating translation like efficiency, when it was really about preserving someone else’s agency inside a system that made them feel small.',
    secondary:
      'After that, I started arriving early to appointments, writing down unfamiliar terms, and building a glossary so I could translate medication instructions more precisely. I also asked follow-up questions more often and kept a notebook of phrases that confused my parents the most.',
    tertiary:
      'The logistical improvements mattered, but they only mattered because they came after I understood what I had been erasing.',
  },
  {
    id: 'AMBIGUITY_01_DISABILITY_PROGRAM',
    kind: 'ambiguity',
    title: 'Disability support philosophy plus program redesign',
    expectedWinner: 'clarification',
    primary:
      'Working with autistic children forced me to confront how often “help” really means asking someone to look less inconvenient to everyone else. I had to question my own idea of progress and admit that my instincts were built around comfort for adults, not dignity for the kids themselves.',
    secondary:
      'At the same time, I redesigned our summer schedule around sensory transitions, added visual countdowns, and trained new counselors to cue choices before demands. Meltdowns decreased, and the room felt calmer because we had changed the structure instead of blaming the children for reacting to it.',
    tertiary:
      'The philosophical shift and the program redesign feel inseparable to me: one changed what I believed I was doing, and the other proved whether I was willing to act on that belief.',
  },
  {
    id: 'AMBIGUITY_02_ROBOTICS_LEADERSHIP',
    kind: 'ambiguity',
    title: 'Robotics leadership philosophy plus delegation system',
    expectedWinner: 'clarification',
    primary:
      'The hardest part of robotics was admitting that my identity as “the reliable one” was making everyone else less willing to touch the hard problems. I had to separate usefulness from control, which was more painful than any technical failure.',
    secondary:
      'But that realization only became real when I built subsystem leads, a repair queue, and a post-match checklist that let younger students run the pit without waiting for me. The team moved faster, and our rookies made decisions I used to hoard for myself.',
    tertiary:
      'I could honestly write this essay around the internal identity shift or around the systems change that made the shift visible. Neither angle feels fake to me.',
  },
];

function buildInput(testCase: ProtocolCase): NdsResolvedSources {
  const storyEntries = [
    { id: `${testCase.id}_1`, title: 'Primary', body: testCase.primary, category: null },
    { id: `${testCase.id}_2`, title: 'Secondary', body: testCase.secondary, category: null },
  ];

  if (testCase.tertiary) {
    storyEntries.push({ id: `${testCase.id}_3`, title: 'Tertiary', body: testCase.tertiary, category: null });
  }

  return {
    essay_project: {
      id: `protocol_${testCase.id}`,
      student_user_id: `protocol_${testCase.id}`,
      title: testCase.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `protocol_${testCase.id}`,
      first_name: 'Protocol',
      last_name: testCase.id,
      grade: 11,
      interests: [],
    },
    story_entries: storyEntries,
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: storyEntries.length,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

function formatScore(value: number | undefined): string {
  return (value ?? 0).toFixed(3);
}

function truncate(text: string | undefined, length: number = 150): string {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return 'N/A';
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
}

function selectedCandidate(payload: any): any | null {
  return payload?.candidates?.find((candidate: any) => candidate.selected) ?? payload?.candidates?.[0] ?? null;
}

function hasFallback(payload: any): boolean {
  const texts = [
    payload?.best_direction?.core_claim,
    payload?.best_direction?.why_this_is_the_real_story,
    ...(payload?.candidates ?? []).flatMap((candidate: any) => [
      candidate.direction_summary,
      candidate.core_tension,
      ...(candidate.evidence_spans ?? []).map((span: any) => span.text),
    ]),
  ]
    .filter(Boolean)
    .map((text: unknown) => String(text));

  return texts.some((text) => FALLBACK_PATTERNS.some((pattern) => pattern.test(text)));
}

function inferWinnerLane(payload: any): 'realization' | 'action' | 'other' {
  const selected = selectedCandidate(payload);
  const selectedId = String(selected?.candidate_id ?? '');
  if (selectedId === 'direction_1') return 'realization';
  if (selectedId === 'direction_2') return 'action';
  const line = String(selected?.direction_line ?? '').toLowerCase();
  if (/who you were becoming|identity|self-concept|listening mattered more|stopped trying to fix.*listening|being right in the argument stopped helping/.test(line)) {
    return 'realization';
  }
  if (/redesign|system|workflow|process|tracker|delegat|distributed|bottleneck|handoff|checklist|method|assigned|responsibility|owed|adjusted your approach|paid attention to what|worked differently|decisions affected/.test(line)) {
    return 'action';
  }
  return 'other';
}

function confidenceBelievable(testCase: ProtocolCase, payload: any): boolean {
  const confidence = payload?.confidence_band;
  if (testCase.kind === 'ambiguity') {
    return confidence === 'low';
  }
  return confidence === 'medium' || confidence === 'high' || confidence === 'low';
}

async function run(): Promise<void> {
  console.log('NDS_ACTION_DOMINANCE_PROTOCOL_V1');
  console.log('');

  const results: ProtocolResult[] = [];

  for (const testCase of PROTOCOL_CASES) {
    const pack = buildNdsNormalizedContextPack(buildInput(testCase));
    const runOut = await executeNdsModule({
      run_id: `run_${testCase.id}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: pack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = runOut.candidate_payload as any;
    const winner = payload?.selected_candidate_id ?? payload?.candidates?.[0]?.candidate_id ?? 'n/a';
    const confidenceBand = payload?.confidence_band ?? 'n/a';
    const routeDecision = payload?.route_decision ?? 'n/a';
    const margin = payload?.score_summary?.score_margin ?? 0;
    const selected = selectedCandidate(payload);
    const fallback = hasFallback(payload);

    const winnerLane = inferWinnerLane(payload);
    const passed =
      testCase.expectedWinner === 'clarification'
        ? routeDecision === 'ask_question_before_showing'
        : testCase.expectedWinner === 'direction_1'
          ? winnerLane === 'realization'
          : winnerLane === 'action';

    results.push({
      id: testCase.id,
      kind: testCase.kind,
      expectedWinner: testCase.expectedWinner,
      actualWinner: winner,
      confidenceBand,
      routeDecision,
      margin,
      hasFallbackBoilerplate: fallback,
      passed,
    });

    console.log(`${testCase.id} [${testCase.kind}] ${testCase.title}`);
    console.log(`  expected: ${testCase.expectedWinner}`);
    console.log(`  actual winner: ${winner}`);
    console.log(`  confidence band: ${confidenceBand}`);
    console.log(`  route decision: ${routeDecision}`);
    console.log(`  score margin: ${formatScore(margin)}`);
    console.log(`  selected summary: ${truncate(selected?.direction_summary, 180)}`);
    console.log(`  selected evidence: ${(selected?.evidence_spans ?? []).map((span: any) => truncate(span.text, 90)).join(' | ') || 'none'}`);
    console.log(`  fallback boilerplate: ${fallback ? 'YES' : 'no'}`);
    console.log(`  confidence believable: ${confidenceBelievable(testCase, payload) ? 'yes' : 'NO'}`);
    console.log(`  result: ${passed ? 'PASS' : 'FAIL'}`);
    console.log('');
  }

  const actionCases = results.filter((result) => result.kind === 'action_dominant');
  const realizationCases = results.filter((result) => result.kind === 'realization_dominant');
  const ambiguityCases = results.filter((result) => result.kind === 'ambiguity');

  const actionWins = actionCases.filter((result) => result.passed).length;
  const realizationWins = realizationCases.filter((result) => result.passed).length;
  const ambiguityClarifications = ambiguityCases.filter((result) => result.routeDecision === 'ask_question_before_showing').length;
  const fallbackCount = results.filter((result) => result.hasFallbackBoilerplate).length;
  const believableConfidence = results.every((result) => {
    if (result.kind === 'ambiguity') return result.confidenceBand === 'low';
    return ['low', 'medium', 'high'].includes(result.confidenceBand);
  });

  const overallPass =
    actionWins >= 4 &&
    realizationWins === 2 &&
    ambiguityClarifications === 2 &&
    fallbackCount === 0 &&
    believableConfidence;

  console.log('PASS CRITERIA');
  console.log(`  action-dominant semantic-lane wins: ${actionWins}/6 ${actionWins >= 4 ? 'PASS' : 'FAIL'}`);
  console.log(`  realization-dominant semantic-lane wins: ${realizationWins}/2 ${realizationWins === 2 ? 'PASS' : 'FAIL'}`);
  console.log(`  ambiguity clarification routes: ${ambiguityClarifications}/2 ${ambiguityClarifications === 2 ? 'PASS' : 'FAIL'}`);
  console.log(`  fallback boilerplate count: ${fallbackCount} ${fallbackCount === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`  confidence bands believable: ${believableConfidence ? 'PASS' : 'FAIL'}`);
  console.log('');
  console.log(`OVERALL: ${overallPass ? 'PASS' : 'FAIL'}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
