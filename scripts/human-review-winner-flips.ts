import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(story: string): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-review',
      student_user_id: 'user-review',
      title: 'Human review',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-review',
      first_name: 'Test',
      last_name: 'Case',
      grade: 12,
      interests: ['growth'],
    },
    story_entries: [
      {
        id: 'story-1',
        title: 'Test',
        body: story,
        category: 'activity',
      },
    ],
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: 1,
      has_current_draft: false,
      has_school_context: false,
    },
  };
}

interface CaseReview {
  id: string;
  title: string;
  story: string;
  category: 'winner_flip' | 'question_first' | 'low_confidence' | 'control_direction_1';
}

const reviewCases: CaseReview[] = [
  // WINNER-FLIP CASES (non-direction_1 winners)
  {
    id: 'AMB4',
    category: 'winner_flip',
    title: 'Academic rigor vs. collaborative learning (both valuable)',
    story: `I pride myself on understanding material deeply before moving on. Yet my best learning moments came from study groups where I had to explain half-formed ideas to peers. I cannot choose between being thorough and being collaborative. My strength is somehow both.`,
  },
  {
    id: 'AMB5',
    category: 'winner_flip',
    title: 'Performance under pressure vs. deliberation (no clear winner)',
    story: `In a competition, I had to make a critical call in seconds. My instinct was right, and it felt like proof that I work well under pressure. But later, I realized that if I had taken thirty seconds to think, I would have made a different call that was even better. Both moments feel like who I am.`,
  },
  {
    id: 'FLIP1',
    category: 'winner_flip',
    title: 'Technical skill mastery (surface) vs. learning to delegate (deeper)',
    story: `I built the entire electrical system for our robot because I was the only one who understood it. We won regionals. But then I realized: if I graduated, the team had no one who could build the next robot. So last year I taught two people the system from scratch, and we still won—but now I could step back. The winning version of me is not the one who does everything alone.`,
  },
  {
    id: 'FLIP2',
    category: 'winner_flip',
    title: 'Service hours completed (easy to claim) vs. actual impact realization (hard to prove)',
    story: `I logged 200 hours at the food bank. But an older volunteer asked me: "Do you know any of the people you serve? Do you know if what we do is actually helping?" I could not answer. We started a feedback survey. Most people came once and never returned. We were not helping—we were processing. The real story is not my hours. It is the moment I admitted our good intentions were not good outcomes.`,
  },
  // QUESTION-FIRST CASES (low confidence routing to clarification)
  {
    id: 'WEAK1',
    category: 'question_first',
    title: 'Vague growth statement',
    story: `I grew a lot through my volunteer work. I learned that helping people is important and that I enjoy it. It changed my perspective on service.`,
  },
  {
    id: 'WEAK2',
    category: 'question_first',
    title: 'No specific moment',
    story: `I was on the debate team and we competed a lot. I got better at arguing and presenting. I think debate taught me about thinking on my feet.`,
  },
  {
    id: 'WEAK3',
    category: 'question_first',
    title: 'Abstract without grounding',
    story: `I have learned that leadership is about vision and execution. I think the most important thing is knowing yourself and being authentic to your values.`,
  },
  // LOW-CONFIDENCE CASES
  {
    id: 'AMB3',
    category: 'low_confidence',
    title: 'Responsibility to self vs. community (parallel themes)',
    story: `Working in the clinic, I realized I had been overextending myself trying to help everyone. But the moment I stepped back, I saw that the team was unprepared without that support. So I did not reduce my hours—I just changed how I used them. The tension between self-care and responsibility never resolved.`,
  },
  {
    id: 'FLIP3',
    category: 'low_confidence',
    title: 'Debate victory narrative (obvious) vs. intellectual humility discovery (surprising)',
    story: `We won the state championship in policy debate. But the moment I am most proud of is not from the championship. It was a loss to a team from a school district with less funding. They made an argument I had never heard. I realized I had prepared to win, not to think. That loss taught me more than the trophy.`,
  },
  {
    id: 'FLIP4',
    category: 'low_confidence',
    title: 'Artistic accomplishment (visible) vs. creative risk-taking (invisible but formative)',
    story: `My painting was accepted to the regional show. Everyone congratulated me. But the real turning point came the year before when a painting was rejected and the feedback stung. I could have played it safe after that. Instead I painted the most experimental thing I had ever made, it was rejected again, and I made a third one that finally got accepted. The achievement matters less than the decision to keep pushing after failure.`,
  },
  // CONTROL: direction_1 correctly wins
  {
    id: 'FLIP5',
    category: 'control_direction_1',
    title: 'Performance metric (easy) vs. system redesign (harder, more meaningful)',
    story: `I increased our team productivity by 30% in Q3. But when I stepped back, I realized I had done this by rushing through quality checks. The real insight came when I redesigned the workflow to reduce bottlenecks without sacrificing standards. The 30% gain looked impressive. The workflow redesign was actually the work.`,
  },
];

async function reviewCase(testCase: CaseReview): Promise<void> {
  console.log('\n' + '='.repeat(100));
  console.log(`[${testCase.category.toUpperCase()}] ${testCase.id} — ${testCase.title}`);
  console.log('='.repeat(100));

  const sources = makeSources(testCase.story);
  const context = buildNdsNormalizedContextPack(sources);

  const output = await executeNdsModule({
    run_id: `run-review-${testCase.id}`,
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
  if (payload.status !== 'ready' && payload.status !== 'success') {
    console.log(`Status: ${payload.status}`);
    return;
  }

  const candidates = payload.candidates ?? [];
  if (!candidates || candidates.length === 0) {
    console.log(`No candidates found`);
    return;
  }

  // Show story context
  console.log('\nSTORY:');
  console.log(`"${testCase.story}"`);

  // Show all candidates with full details
  console.log('\n' + '-'.repeat(100));
  console.log('CANDIDATES (ranked by score):');
  console.log('-'.repeat(100));

  candidates.forEach((c: any, idx: number) => {
    const evidenceLength = c.evidence_spans.reduce((acc: number, span: any) => acc + span.text.length, 0);
    const evidenceSummary = c.evidence_spans.map((span: any) => span.text.substring(0, 45)).join(' | ');

    console.log(`\n[${idx + 1}] ${c.candidate_id}${c.selected ? ' ← SELECTED' : ''}`);
    console.log(`    Score: ${c.scores.total_score} | Margin from #1: ${payload.score_summary.score_margin}`);
    console.log(`    Confidence: ${payload.confidence_band} | Route: ${payload.route_decision}`);
    console.log(`    Evidence: ${evidenceLength} chars across ${c.evidence_spans.length} spans`);
    console.log(`    Summary: "${c.direction_summary.substring(0, 80)}..."`);
    console.log(`    Tension: "${c.core_tension.substring(0, 80)}..."`);
    console.log(`    Dimensions:`);
    console.log(`      - evidence_grounding: ${c.scores.evidence_grounding}`);
    console.log(`      - buildability: ${c.scores.buildability}`);
    console.log(`      - specificity: ${c.scores.student_specificity}`);
    console.log(`      - non_genericity: ${c.scores.non_genericity}`);
    console.log(`    Evidence spans:`);
    c.evidence_spans.forEach((span: any, sIdx: number) => {
      console.log(`      [${sIdx + 1}] "${span.text.substring(0, 80)}..."`);
    });
  });

  // Human review question
  console.log('\n' + '-'.repeat(100));
  console.log('HUMAN REVIEW QUESTION:');
  const winner = candidates[0];
  const runner_up = candidates[1];
  if (winner.candidate_id !== 'direction_1' && runner_up) {
    console.log(
      `Why ${winner.candidate_id} (score ${winner.scores.total_score}) beat direction_1 (score ${runner_up.scores.total_score}):`
    );
    console.log(
      `  • Evidence: ${winner.scores.evidence_grounding} vs ${runner_up.scores.evidence_grounding}`
    );
    console.log(
      `  • Buildability: ${winner.scores.buildability} vs ${runner_up.scores.buildability}`
    );
    console.log(`  • Specificity: ${winner.scores.student_specificity} vs ${runner_up.scores.student_specificity}`);
    console.log('\n  → REVIEWER JUDGMENT REQUIRED: Is the non-direction_1 winner defensible?');
  } else if (winner.candidate_id === 'direction_1') {
    console.log(
      `Direction_1 correctly selected (score ${winner.scores.total_score} vs runner-up ${runner_up.scores.total_score})`
    );
    console.log(`Margin: ${payload.score_summary.score_margin} (high confidence: ${payload.confidence_band})`);
  }

  console.log('-'.repeat(100));
}

async function runHumanReview(): Promise<void> {
  console.log('\n\n');
  console.log('█'.repeat(100));
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█' + '  HUMAN REVIEW: WINNER-FLIP CASES & CONTROL CASES'.padEnd(98) + '█');
  console.log('█' + '  Verification that non-direction_1 winners are defensible'.padEnd(98) + '█');
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█'.repeat(100));

  // Review winner-flip cases first
  const winnerFlips = reviewCases.filter((c) => c.category === 'winner_flip');
  for (const testCase of winnerFlips) {
    await reviewCase(testCase);
  }

  // Then question-first cases
  console.log('\n\n' + '█'.repeat(100));
  console.log('█' + 'QUESTION-FIRST CASES (low confidence routing to clarification)'.padEnd(99) + '█');
  console.log('█'.repeat(100));
  const questionFirst = reviewCases.filter((c) => c.category === 'question_first');
  for (const testCase of questionFirst) {
    await reviewCase(testCase);
  }

  // Then low-confidence cases
  console.log('\n\n' + '█'.repeat(100));
  console.log('█' + 'LOW-CONFIDENCE CASES (genuine ambiguity, tight margins)'.padEnd(99) + '█');
  console.log('█'.repeat(100));
  const lowConf = reviewCases.filter((c) => c.category === 'low_confidence');
  for (const testCase of lowConf) {
    await reviewCase(testCase);
  }

  // Finally control case
  console.log('\n\n' + '█'.repeat(100));
  console.log('█' + 'CONTROL: DIRECTION_1 CORRECTLY WINS'.padEnd(99) + '█');
  console.log('█'.repeat(100));
  const control = reviewCases.filter((c) => c.category === 'control_direction_1');
  for (const testCase of control) {
    await reviewCase(testCase);
  }

  console.log('\n\n' + '█'.repeat(100));
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█' + '  END OF HUMAN REVIEW'.padEnd(98) + '█');
  console.log('█' + '  Ready for production-credibility assessment'.padEnd(98) + '█');
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█'.repeat(100));
}

runHumanReview().catch(console.error);
