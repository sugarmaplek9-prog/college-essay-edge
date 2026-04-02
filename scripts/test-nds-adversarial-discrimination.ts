import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

interface CaseResult {
  case_id: string;
  set: string;
  title: string;
  story_body: string;
  selected_candidate_id: string | null;
  route_decision: string;
  confidence_band: string;
  top_score: number;
  runner_up_score: number;
  score_margin: number;
  candidates: Array<{
    candidate_id: string;
    total_score: number;
  }>;
  rejected_count: number;
}

function makeSources(overrides: Partial<NdsResolvedSources> = {}): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-adv',
      student_user_id: 'user-adv',
      title: 'Adversarial test',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-adv',
      first_name: 'Test',
      last_name: 'Case',
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

// SET 1: AMBIGUOUS CASES — two strong candidates, unclear winner
const ambiguousCases = [
  {
    case_id: 'AMB1',
    title: 'Leadership vs. Service (competing strength)',
    story: `I led the robotics team through a difficult project, making technical decisions that moved us forward. At the same time, I noticed a newer member struggling and took time to mentor them. Both matter to who I am—leadership through technical skill, or leadership through developing others.`,
  },
  {
    case_id: 'AMB2',
    title: 'Competence vs. Humility (equal evidence)',
    story: `I spent months preparing for debate and my research was exhaustive. But what I remember most is the moment an opponent cited a study I had not seen. Instead of defending my prep, I asked them to explain it. That question taught me more than my preparation had. Both versions of that experience feel true.`,
  },
  {
    case_id: 'AMB3',
    title: 'Responsibility to self vs. community (parallel themes)',
    story: `Working in the clinic, I realized I had been overextending myself trying to help everyone. But the moment I stepped back, I saw that the team was unprepared without that support. So I did not reduce my hours—I just changed how I used them. The tension between self-care and responsibility never resolved.`,
  },
  {
    case_id: 'AMB4',
    title: 'Academic rigor vs. collaborative learning (both valuable)',
    story: `I pride myself on understanding material deeply before moving on. Yet my best learning moments came from study groups where I had to explain half-formed ideas to peers. I cannot choose between being thorough and being collaborative. My strength is somehow both.`,
  },
  {
    case_id: 'AMB5',
    title: 'Performance under pressure vs. deliberation (no clear winner)',
    story: `In a competition, I had to make a critical call in seconds. My instinct was right, and it felt like proof that I work well under pressure. But later, I realized that if I had taken thirty seconds to think, I would have made a different call that was even better. Both moments feel like who I am.`,
  },
];

// SET 2: WEAK / UNDERSPECIFIED CASES — thin, vague, missing scene detail
const weakCases = [
  {
    case_id: 'WEAK1',
    title: 'Vague growth statement',
    story: `I grew a lot through my volunteer work. I learned that helping people is important and that I enjoy it. It changed my perspective on service.`,
  },
  {
    case_id: 'WEAK2',
    title: 'No specific moment',
    story: `I was on the debate team and we competed a lot. I got better at arguing and presenting. I think debate taught me about thinking on my feet.`,
  },
  {
    case_id: 'WEAK3',
    title: 'Abstract without grounding',
    story: `I have learned that leadership is about vision and execution. I think the most important thing is knowing yourself and being authentic to your values.`,
  },
  {
    case_id: 'WEAK4',
    title: 'Thin evidence, broad claim',
    story: `I was involved in several leadership roles. I care about making a difference and I think that shows in my work.`,
  },
  {
    case_id: 'WEAK5',
    title: 'Missing transition or specificity',
    story: `Tutoring has been meaningful. I help students understand concepts. I am good at explaining things clearly.`,
  },
];

// SET 3: WINNER-FLIP CASES — initial intuition suggests one direction, evidence points to another
const winnerFlipCases = [
  {
    case_id: 'FLIP1',
    title: 'Technical skill mastery (surface) vs. learning to delegate (deeper)',
    story: `I built the entire electrical system for our robot because I was the only one who understood it. We won regionals. But then I realized: if I graduated, the team had no one who could build the next robot. So last year I taught two people the system from scratch, and we still won—but now I could step back. The winning version of me is not the one who does everything alone.`,
  },
  {
    case_id: 'FLIP2',
    title: 'Service hours completed (easy to claim) vs. actual impact realization (hard to prove)',
    story: `I logged 200 hours at the food bank. But an older volunteer asked me: "Do you know any of the people you serve? Do you know if what we do is actually helping?" I could not answer. We started a feedback survey. Most people came once and never returned. We were not helping—we were processing. The real story is not my hours. It is the moment I admitted our good intentions were not good outcomes.`,
  },
  {
    case_id: 'FLIP3',
    title: 'Debate victory narrative (obvious) vs. intellectual humility discovery (surprising)',
    story: `We won the state championship in policy debate. But the moment I am most proud of is not from the championship. It was a loss to a team from a school district with less funding. They made an argument I had never heard. I realized I had prepared to win, not to think. That loss taught me more than the trophy.`,
  },
  {
    case_id: 'FLIP4',
    title: 'Artistic accomplishment (visible) vs. creative risk-taking (invisible but formative)',
    story: `My painting was accepted to the regional show. Everyone congratulated me. But the real turning point came the year before when a painting was rejected and the feedback stung. I could have played it safe after that. Instead I painted the most experimental thing I had ever made, it was rejected again, and I made a third one that finally got accepted. The achievement matters less than the decision to keep pushing after failure.`,
  },
  {
    case_id: 'FLIP5',
    title: 'Performance metric (easy) vs. system redesign (harder, more meaningful)',
    story: `I increased our team productivity by 30% in Q3. But when I stepped back, I realized I had done this by rushing through quality checks. The real insight came when I redesigned the workflow to reduce bottlenecks without sacrificing standards. The 30% gain looked impressive. The workflow redesign was actually the work.`,
  },
];

async function runAdversarialSuite(): Promise<void> {
  console.log('='.repeat(80));
  console.log('ADVERSARIAL SCORING DISCRIMINATION TEST SUITE');
  console.log('='.repeat(80) + '\n');

  const allCases = [
    ...ambiguousCases.map((c) => ({ ...c, set: 'AMBIGUOUS' })),
    ...weakCases.map((c) => ({ ...c, set: 'WEAK' })),
    ...winnerFlipCases.map((c) => ({ ...c, set: 'FLIP' })),
  ];

  const results: CaseResult[] = [];
  let successCount = 0;
  let nmiCount = 0;

  for (const testCase of allCases) {
    const sources = makeSources({
      story_entries: [
        {
          id: `story-${testCase.case_id}`,
          title: testCase.title,
          body: testCase.story,
          category: 'activity',
        },
      ],
      source_meta: {
        story_entry_count: 1,
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
      console.log(`${testCase.case_id} [${testCase.set}]: NEEDS_MORE_INPUT\n`);
      nmiCount++;
      continue;
    }

    successCount++;

    const candidates = (payload.candidates ?? []).map((c: any) => ({
      candidate_id: c.candidate_id,
      total_score: c.scores?.total_score ?? 0,
    }));

    const result: CaseResult = {
      case_id: testCase.case_id,
      set: testCase.set,
      title: testCase.title,
      story_body: testCase.story,
      selected_candidate_id: payload.selected_candidate_id ?? null,
      route_decision: payload.route_decision ?? 'unknown',
      confidence_band: payload.confidence_band ?? 'unknown',
      top_score: payload.score_summary?.top_score ?? 0,
      runner_up_score: payload.score_summary?.runner_up_score ?? 0,
      score_margin: payload.score_summary?.score_margin ?? 0,
      candidates,
      rejected_count: (payload.rejected_candidates ?? []).length,
    };

    results.push(result);

    console.log(`${testCase.case_id} [${testCase.set}]: ${testCase.title}`);
    console.log(`  Selected: ${payload.selected_candidate_id}`);
    console.log(`  Route: ${payload.route_decision}`);
    console.log(`  Confidence: ${payload.confidence_band}`);
    console.log(`  Top: ${payload.score_summary?.top_score.toFixed(2)} | Runner-up: ${payload.score_summary?.runner_up_score.toFixed(2)} | Margin: ${payload.score_summary?.score_margin.toFixed(2)}`);
    console.log(`  Candidates: ${candidates.length} | Rejected: ${result.rejected_count}`);
    console.log();
  }

  // Analysis
  console.log('='.repeat(80));
  console.log('DISCRIMINATION TEST RESULTS');
  console.log('='.repeat(80) + '\n');

  console.log(`Success cases: ${successCount} | NMI: ${nmiCount}\n`);

  const selectedIds = new Set(results.map((r) => r.selected_candidate_id));
  const confidenceBands = new Set(results.map((r) => r.confidence_band));
  const routeDecisions = new Set(results.map((r) => r.route_decision));
  const margins = results.map((r) => r.score_margin);

  console.log('SPREAD ANALYSIS:');
  console.log(`  Unique selected_candidate_ids: ${selectedIds.size}`);
  console.log(`    Values: ${Array.from(selectedIds).sort().join(', ')}`);
  console.log(`  Unique confidence bands: ${confidenceBands.size}`);
  console.log(`    Values: ${Array.from(confidenceBands).sort().join(', ')}`);
  console.log(`  Unique route decisions: ${routeDecisions.size}`);
  console.log(`    Values: ${Array.from(routeDecisions).sort().join(', ')}`);
  console.log(`\n  Score margin range: ${Math.min(...margins).toFixed(4)} to ${Math.max(...margins).toFixed(4)}`);
  console.log(`  Score margin std dev: ${calculateStdDev(margins).toFixed(4)}\n`);

  // Gate criteria
  const nonDirection1 = results.filter((r) => r.selected_candidate_id !== 'direction_1');
  const questionFirst = results.filter((r) => r.route_decision === 'ask_question_before_showing');
  const closeMargin = results.filter((r) => r.score_margin < 0.15);
  const lowConfidence = results.filter((r) => r.confidence_band === 'low');
  const mediumConfidence = results.filter((r) => r.confidence_band === 'medium');

  console.log('GATE CRITERIA:');
  console.log(`  2-3+ question-first cases: ${questionFirst.length} (need ≥2) ${questionFirst.length >= 2 ? '✅' : '❌'}`);
  console.log(`  2-3+ non-direction_1 winners: ${nonDirection1.length} (need ≥2) ${nonDirection1.length >= 2 ? '✅' : '❌'}`);
  console.log(`  2-3+ close-margin cases (<0.15): ${closeMargin.length} (need ≥2) ${closeMargin.length >= 2 ? '✅' : '❌'}`);
  console.log(`  Medium or low confidence: ${mediumConfidence.length + lowConfidence.length} (need ≥3) ${mediumConfidence.length + lowConfidence.length >= 3 ? '✅' : '❌'}\n`);

  const passedGates =
    questionFirst.length >= 2 &&
    nonDirection1.length >= 2 &&
    closeMargin.length >= 2 &&
    mediumConfidence.length + lowConfidence.length >= 3;

  console.log(`READINESS FOR DEPLOY: ${passedGates ? '✅ YES — Scorer discriminates' : '❌ NO — Scorer is not yet discriminating properly'}\n`);

  // Detailed results by set
  console.log('='.repeat(80));
  console.log('SET 1: AMBIGUOUS CASES');
  console.log('='.repeat(80) + '\n');
  for (const result of results.filter((r) => r.set === 'AMBIGUOUS')) {
    console.log(`${result.case_id}: ${result.title}`);
    console.log(`  Selected: ${result.selected_candidate_id} (score: ${result.top_score.toFixed(2)}, margin: ${result.score_margin.toFixed(2)})`);
    console.log(`  Confidence: ${result.confidence_band} | Route: ${result.route_decision}`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('SET 2: WEAK / UNDERSPECIFIED CASES');
  console.log('='.repeat(80) + '\n');
  for (const result of results.filter((r) => r.set === 'WEAK')) {
    console.log(`${result.case_id}: ${result.title}`);
    console.log(`  Selected: ${result.selected_candidate_id} (score: ${result.top_score.toFixed(2)}, margin: ${result.score_margin.toFixed(2)})`);
    console.log(`  Confidence: ${result.confidence_band} | Route: ${result.route_decision}`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('SET 3: WINNER-FLIP CASES');
  console.log('='.repeat(80) + '\n');
  for (const result of results.filter((r) => r.set === 'FLIP')) {
    console.log(`${result.case_id}: ${result.title}`);
    console.log(`  Selected: ${result.selected_candidate_id} (score: ${result.top_score.toFixed(2)}, margin: ${result.score_margin.toFixed(2)})`);
    console.log(`  Confidence: ${result.confidence_band} | Route: ${result.route_decision}`);
    console.log();
  }

  console.log('='.repeat(80));
  console.log('FULL JSON DUMP');
  console.log('='.repeat(80) + '\n');
  console.log(JSON.stringify(results, null, 2));
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

runAdversarialSuite().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
