import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

interface CaseResult {
  case_id: string;
  title: string;
  selected_candidate_id: string | null;
  route_decision: string;
  confidence_band: string;
  candidate_count: number;
  rejected_count: number;
  top_score: number;
  runner_up_score: number;
  score_margin: number;
  candidates: Array<{
    candidate_id: string;
    total_score: number;
    kind: string;
  }>;
  rejected_candidates: Array<{
    candidate_id: string;
    reasons: string[];
  }>;
}

function makeSources(overrides: Partial<NdsResolvedSources> = {}): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-test',
      student_user_id: 'user-test',
      title: 'Test project',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-test',
      first_name: 'Case',
      last_name: 'Tester',
      grade: 12,
      interests: ['growth'],
    },
    story_entries: [],
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: 0,
      has_current_draft: false,
      has_school_context: false,
    },
    ...overrides,
  };
}

const testCases: Array<{
  case_id: string;
  title: string;
  story_body: string;
  domain_hint: string;
}> = [
  {
    case_id: 'C1',
    title: 'Debate moment',
    story_body:
      'Debate conflict: I initially handled the argument poorly by being defensive, then adapted after feedback from a teammate. The turning point came when I stopped proving I was right and started listening to other perspectives.',
    domain_hint: 'debate',
  },
  {
    case_id: 'C2',
    title: 'Clinic volunteer care shift',
    story_body:
      'Community clinic volunteer: I initially handled patient interactions by doing the task quickly, then adapted after feedback from a nurse. That was the moment I realized helping meant listening first, not just executing correctly.',
    domain_hint: 'community',
  },
  {
    case_id: 'C3',
    title: 'Peer tutoring method failure',
    story_body:
      'Peer tutoring growth: I initially explained concepts using my preferred method, then adapted after a student said they still did not understand. The turning point came when I realized explaining was not the same as helping them learn.',
    domain_hint: 'tutoring',
  },
  {
    case_id: 'C4',
    title: 'Technical leadership team shift',
    story_body:
      'Robotics project technical leadership: I initially handled problems by solving them alone to prove my capability, then adapted after feedback from the team. The turning point came when I recognized that my competence was making the team weaker, not stronger.',
    domain_hint: 'technical',
  },
  {
    case_id: 'C5',
    title: 'Research methodology revision',
    story_body:
      'Research competition failure: The experiment did not produce the expected results, but I did not reframe the loss. The turning point came when I actually revised my methodology based on the failure instead of just accepting the outcome.',
    domain_hint: 'research',
  },
  {
    case_id: 'C6',
    title: 'Service operations slow-down',
    story_body:
      'Service operations under pressure: I initially handled the busy clinic by moving fast and processing people through quickly, then adapted after seeing that my speed was causing problems for patients. The turning point came when I slowed down to understand what each person actually needed.',
    domain_hint: 'service',
  },
  {
    case_id: 'C7',
    title: 'Athletic recovery identity',
    story_body:
      'Athletic recovery after injury: I initially defined myself by athletic performance, then lost that when I was injured. The turning point came when I figured out how to contribute to the team without tying it to my own performance.',
    domain_hint: 'athletic',
  },
  {
    case_id: 'C8',
    title: 'Minimal story weak evidence',
    story_body: 'I did something and grew from it.',
    domain_hint: 'generic',
  },
  {
    case_id: 'C9',
    title: 'Strong multi-signal story',
    story_body:
      'Debate team leadership: I initially approached arguments by preparing exhaustive evidence, then adapted after a judge told me that listening to opposing points would strengthen my counter-arguments more than additional prep. The turning point came when I realized that being right was less important than understanding the conversation. I started asking questions instead of only answering them. My team saw the shift and started incorporating it into their prep. By the end of the season, we placed in state.',
    domain_hint: 'debate',
  },
  {
    case_id: 'C10',
    title: 'Community care with mentor feedback',
    story_body:
      'Clinic volunteer: I spent two years delivering care the way I thought it should be delivered. Then a patient told me my well-intentioned approach was not addressing their actual need. Instead of defending my intention, I asked what help looked like from their perspective. That question changed everything about how I volunteer.',
    domain_hint: 'community',
  },
  {
    case_id: 'C11',
    title: 'Generic growth essay',
    story_body:
      'I have learned a lot and become a better leader. Through challenges, I have developed resilience and learned that growth means facing difficult situations.',
    domain_hint: 'generic',
  },
  {
    case_id: 'C12',
    title: 'Teaching realization moment',
    story_body:
      'Tutoring: I was explaining a difficult concept to a struggling student when I realized my explanation was making it worse. I stopped talking and asked what was confusing. That moment taught me that the best teachers listen more than they explain.',
    domain_hint: 'tutoring',
  },
  {
    case_id: 'C13',
    title: 'Technical leadership moment with evidence',
    story_body:
      'Robotics: I built the electrical system myself because I wanted to prove my technical skill. Then the robot failed during competition, and I realized the team had not learned what I learned. When we rebuilt for the next competition, I taught the team instead of hoarding the work. We performed better, and I felt better.',
    domain_hint: 'technical',
  },
  {
    case_id: 'C14',
    title: 'Very abstract essay',
    story_body:
      'My strongest direction is learning to embrace the clearest version of my role. I have found that when I work on becoming the best version of myself, opportunities arise. The first instinct I had was to focus on external achievements, but I now apply a higher standard to my internal development.',
    domain_hint: 'generic',
  },
  {
    case_id: 'C15',
    title: 'Empty context',
    story_body: '',
    domain_hint: 'empty',
  },
  {
    case_id: 'C16',
    title: 'Service operations with reflection',
    story_body:
      'Working at the food bank, I initially sorted donations quickly to maximize output. But I noticed that one elderly volunteer was skipping certain packages. I asked why. She said the rushed approach meant damaged items were slipping through and ending up in bags. That was the moment I realized that efficiency without care was not actually helping.',
    domain_hint: 'service',
  },
  {
    case_id: 'C17',
    title: 'Athletic recovery with new role',
    story_body:
      'After tearing my ACL, I could not play for six months. I initially felt useless to the team. Then the coach asked if I would help scout opponents and analyze game film. Scouting taught me that leadership was not only about performance. I contributed differently, but the contribution mattered.',
    domain_hint: 'athletic',
  },
  {
    case_id: 'C18',
    title: 'Research with methodological shift',
    story_body:
      'My hypothesis did not hold up in the experiment. At first I reran the experiment three times hoping for different results. Then I sat down and asked: what was actually wrong with my original design? I realized I had not controlled for temperature. I revised the entire protocol. The second set of results was weaker than I wanted, but the insight was stronger.',
    domain_hint: 'research',
  },
  {
    case_id: 'C19',
    title: 'Debate with feedback integration',
    story_body:
      'Debate: I prepared a case on climate policy by collecting every possible study and statistic. In the first round, the opposing team pointed out that I was citing outdated research. Instead of defending the dates, I asked them what recent sources they were using. Their answer forced me to update my entire understanding. I thanked them after the round.',
    domain_hint: 'debate',
  },
  {
    case_id: 'C20',
    title: 'Clinic with patient outcome shift',
    story_body:
      'Volunteering at clinic: I was proud of my patient load and efficiency until a supervising nurse asked me: "Do you know if your patients are actually getting better?" I realized I was measuring my success by how many people I saw, not whether they were improving. That question redirected everything I do now.',
    domain_hint: 'community',
  },
];

async function runAllCases(): Promise<void> {
  console.log('Running 20-case NDS scoring evaluation...\n');

  const results: CaseResult[] = [];
  const changedWinner: CaseResult[] = [];
  const withRejected: CaseResult[] = [];
  const questionFirst: CaseResult[] = [];

  for (const testCase of testCases) {
    const sources = makeSources({
      story_entries: testCase.story_body
        ? [
            {
              id: `story-${testCase.case_id}`,
              title: testCase.title,
              body: testCase.story_body,
              category: 'activity',
            },
          ]
        : [],
      source_meta: {
        story_entry_count: testCase.story_body ? 1 : 0,
        has_current_draft: false,
        has_school_context: false,
      },
    });

    const context = buildNdsNormalizedContextPack(sources);
    const output = await executeNdsModule({
      run_id: `run-${testCase.case_id}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: context,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = output.candidate_payload as any;
    if (payload.status === 'needs_more_input') {
      console.log(`${testCase.case_id}: NEEDS_MORE_INPUT (insufficient data)\n`);
      continue;
    }

    const candidates = (payload.candidates ?? []).map((candidate: any, idx: number) => ({
      candidate_id: candidate.candidate_id,
      total_score: candidate.scores?.total_score ?? 0,
      kind: candidate.direction_line?.split(' ')[0]?.toLowerCase() ?? 'unknown',
    }));

    const rejected = (payload.rejected_candidates ?? []).map((rc: any) => ({
      candidate_id: rc.candidate_id,
      reasons: rc.rejection_reasons ?? [],
    }));

    const result: CaseResult = {
      case_id: testCase.case_id,
      title: testCase.title,
      selected_candidate_id: payload.selected_candidate_id ?? null,
      route_decision: payload.route_decision ?? 'unknown',
      confidence_band: payload.confidence_band ?? 'unknown',
      candidate_count: candidates.length,
      rejected_count: rejected.length,
      top_score: payload.score_summary?.top_score ?? 0,
      runner_up_score: payload.score_summary?.runner_up_score ?? 0,
      score_margin: payload.score_summary?.score_margin ?? 0,
      candidates,
      rejected_candidates: rejected,
    };

    results.push(result);

    if (rejected.length > 0) {
      withRejected.push(result);
    }

    if (payload.route_decision === 'ask_question_before_showing') {
      questionFirst.push(result);
    }

    // For "changed winner" we'd need to compare best_direction vs selected_candidate_id
    // For now, log all results
    console.log(`${testCase.case_id}: ${testCase.title}`);
    console.log(`  Selected: ${payload.selected_candidate_id}`);
    console.log(`  Route: ${payload.route_decision}`);
    console.log(`  Confidence: ${payload.confidence_band}`);
    console.log(`  Top Score: ${payload.score_summary?.top_score}`);
    console.log(`  Margin: ${payload.score_summary?.score_margin}`);
    console.log(`  Candidates: ${candidates.length} | Rejected: ${rejected.length}`);
    if (rejected.length > 0) {
      console.log(
        `  Rejected: ${rejected.map((r: CaseResult['rejected_candidates'][0]) => `${r.candidate_id}(${r.reasons.join(',')})`).join('; ')}`
      );
    }
    console.log();
  }

  // Summary stats
  console.log('='.repeat(80));
  console.log('SUMMARY STATISTICS');
  console.log('='.repeat(80) + '\n');

  console.log(`Total cases evaluated: ${results.length}`);
  console.log(`Cases with rejected candidates: ${withRejected.length}`);
  console.log(`Cases routed to question-first: ${questionFirst.length}\n`);

  const confidenceBands = results.reduce(
    (acc, r) => {
      acc[r.confidence_band] = (acc[r.confidence_band] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const routeDecisions = results.reduce(
    (acc, r) => {
      acc[r.route_decision] = (acc[r.route_decision] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Confidence Band Distribution:');
  Object.entries(confidenceBands)
    .sort()
    .forEach(([band, count]) => {
      console.log(`  ${band}: ${count}`);
    });

  console.log('\nRoute Decision Distribution:');
  Object.entries(routeDecisions)
    .sort()
    .forEach(([route, count]) => {
      console.log(`  ${route}: ${count}`);
    });

  const margins = results.map((r) => r.score_margin);
  const avgMargin = margins.reduce((a, b) => a + b, 0) / margins.length;
  const maxMargin = Math.max(...margins);
  const minMargin = Math.min(...margins);

  const scores = results.map((r) => r.top_score);
  const avgTopScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxTopScore = Math.max(...scores);
  const minTopScore = Math.min(...scores);

  console.log('\nScore Margin Statistics:');
  console.log(`  Average margin: ${avgMargin.toFixed(4)}`);
  console.log(`  Max margin: ${maxMargin.toFixed(4)}`);
  console.log(`  Min margin: ${minMargin.toFixed(4)}`);

  console.log('\nTop Score Statistics:');
  console.log(`  Average top score: ${avgTopScore.toFixed(4)}`);
  console.log(`  Max top score: ${maxTopScore.toFixed(4)}`);
  console.log(`  Min top score: ${minTopScore.toFixed(4)}`);

  // Cases with rejected candidates
  console.log('\n' + '='.repeat(80));
  console.log('CASES WITH REJECTED CANDIDATES (first 5)');
  console.log('='.repeat(80) + '\n');
  for (const result of withRejected.slice(0, 5)) {
    console.log(`${result.case_id}: ${result.title}`);
    console.log(`  Selected: ${result.selected_candidate_id} (score: ${result.top_score})`);
    console.log(`  Rejected:`);
    for (const rejected of result.rejected_candidates) {
      console.log(`    ${rejected.candidate_id}: ${rejected.reasons.join(', ')}`);
    }
    console.log();
  }

  // Cases routed to question-first
  if (questionFirst.length > 0) {
    console.log('='.repeat(80));
    console.log('CASES ROUTED TO ASK_QUESTION_BEFORE_SHOWING');
    console.log('='.repeat(80) + '\n');
    for (const result of questionFirst) {
      console.log(`${result.case_id}: ${result.title}`);
      console.log(`  Selected: ${result.selected_candidate_id}`);
      console.log(`  Confidence: ${result.confidence_band}`);
      console.log(`  Score margin: ${result.score_margin}`);
      console.log();
    }
  }

  console.log('='.repeat(80));
  console.log('FULL DEBUG DUMP (all 20 cases)');
  console.log('='.repeat(80) + '\n');
  console.log(JSON.stringify(results, null, 2));
}

runAllCases().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
