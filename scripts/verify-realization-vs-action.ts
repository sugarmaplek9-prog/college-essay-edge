#!/usr/bin/env node

import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

interface TestCase {
  name: string;
  description: string;
  primary: string;
  secondary: string;
  tertiary?: string;
  expectedWinner: 'direction_1' | 'direction_2' | 'clarification';
  category: 'realization_wins' | 'action_wins' | 'ambiguous';
}

interface CandidateDiagnostic {
  candidateId: string;
  directionLine: string;
  directionSummary: string;
  evidenceSpans: string[];
  specificityScore: number;
  evidenceGroundingScore: number;
  buildabilityScore: number;
  reflectiveScore: number;
  totalScore: number;
}

interface CaseResult {
  testName: string;
  expectedWinner: string;
  actualWinner: string;
  confidenceBand: string;
  routeDecision: string;
  margin: number;
  passed: boolean;
}

const WEIGHTS = {
  evidence_grounding: 0.22,
  student_specificity: 0.2,
  buildability: 0.18,
  reflective_potential: 0.08,
} as const;

const testCases: TestCase[] = [
  {
    name: 'CASE_1_REALIZATION_WINS',
    description: 'Realization should clearly win. Action is concrete but shallow.',
    category: 'realization_wins',
    expectedWinner: 'direction_1',
    primary:
      'I spent three years on the robotics team believing that the goal was to build the best robot. Then in junior year, a teammate froze during competition and I realized something fundamental had shifted in how I understood leadership. I had been optimizing for perfection, not for helping my team members become confident problem-solvers. That insight changed everything about how I led in senior year.',
    secondary:
      'I designed the new motor control system. I stayed until midnight debugging the autonomous code. I rewrote the entire sensor calibration pipeline and improved accuracy by 30%. I took responsibility for mentoring three new programmers and made sure they understood each subsystem.',
  },
  {
    name: 'CASE_2_REALIZATION_WINS',
    description: 'Realization should clearly win. Action sounds impressive but insight is more differentiated.',
    category: 'realization_wins',
    expectedWinner: 'direction_1',
    primary:
      "I had always been told I was a natural leader. Then I joined the debate team and realized that everything I called leadership was actually just confidence bordering on dismissiveness. The moment I understood that good leadership meant listening more than talking, my entire approach shifted. The debate team didn't need my answers; they needed me to ask better questions.",
    secondary:
      'I won three regional championships. I prepared my teammates for competition rounds. I organized training sessions and created practice debate files. I coached the freshman debate team and helped them place at districts. I won speaker awards and led my team to states.',
  },
  {
    name: 'CASE_3_ACTION_WINS',
    description: 'Action should clearly win. Reflection is vague; action has the true center.',
    category: 'action_wins',
    expectedWinner: 'direction_2',
    primary:
      'I had been volunteering at the food bank for a while and it felt meaningful. One day I realized something about responsibility and community. It made me think differently. The experience was profound in some way. I had learned something about helping others.',
    secondary:
      "I discovered that the food bank's donation system was failing senior citizens because the intake form required internet access. I redesigned the paper intake process to match their needs. I implemented a phone-based option that increased senior access by 40%. I created a training program for volunteers to use the new system. Now I coach other volunteers on how to make systems that actually serve the people they're supposed to help.",
  },
  {
    name: 'CASE_4_ACTION_WINS',
    description: 'Action should clearly win. Reflection is generic; action shows the actual shift.',
    category: 'action_wins',
    expectedWinner: 'direction_2',
    primary:
      'I realized that I was not perfect. This was a moment of growth for me. I understood that I needed to be different. It was a transformation in my understanding of myself. I became more humble.',
    secondary:
      "I had always run every debate case myself until the championship round when I had 10 cases to research and 48 hours. I had to delegate. I assigned cases by each teammate's strength, not my preference. I documented my research method so others could follow it. The team produced better case files than I would have made alone, and we won because we had more strategic diversity. I learned I was limiting the team's potential.",
  },
  {
    name: 'CASE_5_AMBIGUOUS',
    description: 'Clarification should win. Both are plausible; neither should be forced.',
    category: 'ambiguous',
    expectedWinner: 'clarification',
    primary:
      'When I started working with autistic children, I assumed I understood how to help. But I realized that my idea of help was based on my idea of normal, not on what would actually serve them. I had to question every assumption about progress and independence. The bigger change was in how I understood disability itself—not as something to fix, but as a different way of being.',
    secondary:
      'I redesigned the summer program schedule to reduce sensory overwhelm. I created visual schedules and transition warnings that reduced meltdowns by 60%. I trained other counselors on communication strategies that actually worked. I advocated with administration to change their "normal" expectations. I built a system where autistic children felt safe because we were meeting them where they are, not forcing them where we thought they should be.',
  },
];

function buildNdsInput(testCase: TestCase): NdsResolvedSources {
  const storyEntries: Array<{ id: string; title: string; body: string; category: null }> = [
    {
      id: 'primary',
      title: 'Primary',
      body: testCase.primary,
      category: null,
    },
    {
      id: 'secondary',
      title: 'Secondary',
      body: testCase.secondary,
      category: null,
    },
  ];

  if (testCase.tertiary) {
    storyEntries.push({
      id: 'tertiary',
      title: 'Tertiary',
      body: testCase.tertiary,
      category: null,
    });
  }

  return {
    essay_project: {
      id: `test_${testCase.name}`,
      student_user_id: `test_${testCase.name}`,
      title: testCase.name,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `test_${testCase.name}`,
      first_name: 'Test',
      last_name: testCase.name,
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

function normalizeText(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function truncate(text: string | undefined, length: number = 160): string {
  const normalized = normalizeText(text);
  if (!normalized) {
    return 'N/A';
  }
  return normalized.length > length ? `${normalized.slice(0, length)}…` : normalized;
}

function formatScore(value: number | undefined): string {
  return (value ?? 0).toFixed(3);
}

function getCandidate(payload: any, candidateId: string): any | null {
  return payload.candidates?.find((candidate: any) => candidate.candidate_id === candidateId) ?? null;
}

function getDiagnostic(payload: any, candidateId: string): CandidateDiagnostic {
  const candidate = getCandidate(payload, candidateId);
  if (!candidate) {
    return {
      candidateId,
      directionLine: 'N/A',
      directionSummary: 'N/A',
      evidenceSpans: [],
      specificityScore: 0,
      evidenceGroundingScore: 0,
      buildabilityScore: 0,
      reflectiveScore: 0,
      totalScore: 0,
    };
  }

  return {
    candidateId,
    directionLine: normalizeText(candidate.direction_line),
    directionSummary: normalizeText(candidate.direction_summary),
    evidenceSpans: (candidate.evidence_spans ?? []).map((span: any) => truncate(span.text, 110)),
    specificityScore: candidate.scores?.student_specificity ?? 0,
    evidenceGroundingScore: candidate.scores?.evidence_grounding ?? 0,
    buildabilityScore: candidate.scores?.buildability ?? 0,
    reflectiveScore: candidate.scores?.reflective_potential ?? 0,
    totalScore: candidate.scores?.total_score ?? 0,
  };
}

function getWinner(payload: any): string {
  return payload.selected_candidate_id ?? payload.candidates?.[0]?.candidate_id ?? 'none';
}

function getScoreMargin(payload: any): number {
  return payload.score_summary?.score_margin ?? 0;
}

function inferWinnerLane(payload: any): 'realization' | 'action' | 'other' {
  const selected = payload?.candidates?.find((candidate: any) => candidate.selected) ?? payload?.candidates?.[0] ?? null;
  const selectedId = String(selected?.candidate_id ?? '');
  if (selectedId === 'direction_1') return 'realization';
  if (selectedId === 'direction_2') return 'action';
  const line = normalizeText(selected?.direction_line).toLowerCase();
  if (/who you were becoming|identity|self-concept|listening mattered more|being right in the argument stopped helping|stopped trying to fix.*listening/.test(line)) {
    return 'realization';
  }
  if (/redesign|system|process|workflow|tracker|delegat|distributed|bottleneck|handoff|checklist|method|assigned|adjusted your approach|paid attention to what|worked differently|decisions affected/.test(line)) {
    return 'action';
  }
  if (/owed|responsibility|worked differently|rethink/.test(line)) {
    return 'action';
  }
  return 'other';
}

function getWeightedDeltas(direction1: CandidateDiagnostic, direction2: CandidateDiagnostic) {
  return [
    {
      key: 'student_specificity',
      delta: direction1.specificityScore - direction2.specificityScore,
      weighted: (direction1.specificityScore - direction2.specificityScore) * WEIGHTS.student_specificity,
    },
    {
      key: 'evidence_grounding',
      delta: direction1.evidenceGroundingScore - direction2.evidenceGroundingScore,
      weighted: (direction1.evidenceGroundingScore - direction2.evidenceGroundingScore) * WEIGHTS.evidence_grounding,
    },
    {
      key: 'buildability',
      delta: direction1.buildabilityScore - direction2.buildabilityScore,
      weighted: (direction1.buildabilityScore - direction2.buildabilityScore) * WEIGHTS.buildability,
    },
    {
      key: 'reflective_potential',
      delta: direction1.reflectiveScore - direction2.reflectiveScore,
      weighted: (direction1.reflectiveScore - direction2.reflectiveScore) * WEIGHTS.reflective_potential,
    },
  ].sort((left, right) => right.weighted - left.weighted);
}

function printCandidate(diag: CandidateDiagnostic): void {
  console.log(`    candidate id: ${diag.candidateId}`);
  console.log(`    direction line: ${diag.directionLine}`);
  console.log(`    direction summary: ${truncate(diag.directionSummary, 220)}`);
  console.log(`    evidence spans: ${diag.evidenceSpans.length === 0 ? 'none' : diag.evidenceSpans.join(' | ')}`);
  console.log(`    specificity score: ${formatScore(diag.specificityScore)}`);
  console.log(`    evidence grounding score: ${formatScore(diag.evidenceGroundingScore)}`);
  console.log(`    buildability score: ${formatScore(diag.buildabilityScore)}`);
  console.log(`    reflective score: ${formatScore(diag.reflectiveScore)}`);
  console.log(`    total score: ${formatScore(diag.totalScore)}`);
}

function printFailureAnalysis(testCase: TestCase, payload: any): void {
  const direction1 = getDiagnostic(payload, 'direction_1');
  const direction2 = getDiagnostic(payload, 'direction_2');
  const direction3 = getDiagnostic(payload, 'direction_3');
  const winner = getWinner(payload);
  const confidenceBand = payload.confidence_band ?? 'unknown';
  const routeDecision = payload.route_decision ?? 'unknown';
  const margin = getScoreMargin(payload);

  console.log('  Diagnostic pass:');
  printCandidate(direction1);
  printCandidate(direction2);
  printCandidate(direction3);
  console.log(`    selected winner: ${winner}`);
  console.log(`    confidence band: ${confidenceBand}`);
  console.log(`    route decision: ${routeDecision}`);

  if (testCase.expectedWinner === 'clarification') {
    console.log(
      `  Why did the ambiguous case not trigger clarification? score_margin=${formatScore(margin)} kept confidence at ${confidenceBand}, so route_decision stayed ${routeDecision}.`
    );
    return;
  }

  const deltas = getWeightedDeltas(direction1, direction2);
  const topPositive = deltas.find((delta) => delta.weighted > 0);
  console.log(`  Why did direction_1 beat direction_2? direction_1 led by ${formatScore(direction1.totalScore - direction2.totalScore)} total-score points.`);
  if (topPositive) {
    console.log(
      `  Which score dimension created the false winner? ${topPositive.key} was the largest weighted edge for direction_1 (${formatScore(topPositive.delta)} raw / ${formatScore(topPositive.weighted)} weighted).`
    );
  } else {
    console.log('  Which score dimension created the false winner? No positive direction_1 edge appeared in these four dimensions; inspect lower-weight scores or candidate ordering.');
  }
}

async function runTests(): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log('NDS_REALIZATION_VS_ACTION_TEST_V1');
  console.log(`${'='.repeat(80)}\n`);

  const results: CaseResult[] = [];

  for (const testCase of testCases) {
    console.log(`${testCase.name}:`);
    console.log(`  ${testCase.description}`);

    const ndsInput = buildNdsInput(testCase);
    const contextPack = buildNdsNormalizedContextPack(ndsInput);
    const result = await executeNdsModule({
      run_id: `test_${testCase.name}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: contextPack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = result.candidate_payload as any;
    const winner = getWinner(payload);
    const confidenceBand = payload.confidence_band ?? 'unknown';
    const routeDecision = payload.route_decision ?? 'unknown';
    const margin = getScoreMargin(payload);

    const winnerLane = inferWinnerLane(payload);
    const passed =
      testCase.expectedWinner === 'clarification'
        ? routeDecision === 'ask_question_before_showing'
        : testCase.expectedWinner === 'direction_1'
          ? winnerLane === 'realization'
          : winnerLane === 'action';

    console.log(`  selected winner: ${winner}`);
    console.log(`  confidence band: ${confidenceBand}`);
    console.log(`  route decision: ${routeDecision}`);
    console.log(`  score margin: ${formatScore(margin)}`);
    console.log(`  result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

    if (!passed) {
      printFailureAnalysis(testCase, payload);
    }

    console.log('');

    results.push({
      testName: testCase.name,
      expectedWinner: testCase.expectedWinner,
      actualWinner: winner,
      confidenceBand,
      routeDecision,
      margin,
      passed,
    });
  }

  const passCount = results.filter((result) => result.passed).length;
  const realizationPass = results
    .filter((result) => ['CASE_1_REALIZATION_WINS', 'CASE_2_REALIZATION_WINS'].includes(result.testName))
    .every((result) => result.passed);
  const actionPass = results
    .filter((result) => ['CASE_3_ACTION_WINS', 'CASE_4_ACTION_WINS'].includes(result.testName))
    .every((result) => result.passed);
  const ambiguousPass = results.find((result) => result.testName === 'CASE_5_AMBIGUOUS')?.routeDecision === 'ask_question_before_showing';

  console.log(`${'='.repeat(80)}`);
  console.log(`SUMMARY: ${passCount}/${testCases.length} cases passed`);
  console.log(`${'='.repeat(80)}`);
  console.log(`✓ Realization cases select realization: ${realizationPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Action cases select action: ${actionPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Ambiguous case routes to clarification: ${ambiguousPass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`OVERALL: ${realizationPass && actionPass && ambiguousPass ? '✅ TEST PASSES' : '❌ TEST FAILS'}`);
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
