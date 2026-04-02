import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(stories: Array<{ title: string; body: string }>): NdsResolvedSources {
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
    story_entries: stories.map((s, idx) => ({
      id: `story-${idx}`,
      title: s.title,
      body: s.body,
      category: 'activity',
    })),
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: stories.length,
      has_current_draft: false,
      has_school_context: false,
    },
  };
}

interface CaseReview {
  id: string;
  title: string;
  stories: Array<{ title: string; body: string }>;
  category: 'winner_flip' | 'question_first' | 'low_confidence' | 'control_direction_1';
  expectedWinner?: string;
  humanJustification: string;
}

const reviewCases: CaseReview[] = [
  // WINNER-FLIP CASES (non-direction_1 winners)
  // These have genuine *second* stories that provide credible alternatives
  {
    id: 'AMB4',
    category: 'winner_flip',
    title: 'Academic rigor vs. collaborative learning (both valuable)',
    expectedWinner: 'direction_2 or direction_3',
    humanJustification:
      'Both the rigor frame and the collaboration frame are equally valid. No single angle clearly dominates. System should route to clarification to pick which resonates.',
    stories: [
      {
        title: 'Primary: Study groups transformed my learning',
        body: `I pride myself on understanding material deeply before moving on. Yet my best learning moments came from study groups where I had to explain half-formed ideas to peers. I cannot choose between being thorough and being collaborative. My strength is somehow both.`,
      },
      {
        title: 'Secondary: Rigor over speed',
        body: `I realized I learn by going slowly, making sure I understand the conceptual foundation before moving on. Skipping steps means I do not retain it. The moments I remember most are when I had to pause and say "I do not understand this yet." That discipline in not rushing became my actual edge.`,
      },
      {
        title: 'Tertiary: Teaching others deepened my own understanding',
        body: `In study group, I had to articulate ideas I had not fully formed yet. That articulation made me discover gaps in my own thinking. Teaching became the mechanism through which I learned. I cannot separate my learning from the obligation to communicate it to others.`,
      },
    ],
  },
  {
    id: 'AMB5',
    category: 'winner_flip',
    title: 'Performance under pressure vs. deliberation (no clear winner)',
    expectedWinner: 'direction_2 or direction_3',
    humanJustification:
      'The case is genuinely ambiguous: instinct worked AND deliberation would have worked better. Strong case for uncertainty routing.',
    stories: [
      {
        title: 'Primary: Critical decision, both paths plausible',
        body: `In a competition, I had to make a critical call in seconds. My instinct was right, and it felt like proof that I work well under pressure. But later, I realized that if I had taken thirty seconds to think, I would have made a different call that was even better. Both moments feel like who I am.`,
      },
      {
        title: 'Secondary: Instinct track record',
        body: `I have built a pattern of making quick judgments and being right more often than not. In fast-paced situations—debate, leadership decisions, sports—my first instinct usually points to the right move. I trust that instinct now because I have tested it hundreds of times.`,
      },
      {
        title: 'Tertiary: The power of slowing down',
        body: `Every time I have paused to think something through instead of acting on the first impulse, I have found deeper solutions. The moments I am most proud of are the ones where I talked myself OUT of the first instinct and found the better path. Patience has saved me more times than speed.`,
      },
    ],
  },
  {
    id: 'FLIP1',
    category: 'winner_flip',
    title: 'Technical skill mastery (surface) vs. learning to delegate (deeper)',
    expectedWinner: 'direction_1',
    humanJustification:
      'The student explicitly says "The winning version of me is not the one who does everything alone." This is a clear self-correction. Direction_1 (realization story) should win.',
    stories: [
      {
        title: 'Primary: From solo hero to team architect',
        body: `I built the entire electrical system for our robot because I was the only one who understood it. We won regionals. But then I realized: if I graduated, the team had no one who could build the next robot. So last year I taught two people the system from scratch, and we still won—but now I could step back. The winning version of me is not the one who does everything alone.`,
      },
      {
        title: 'Secondary: Technical excellence as my edge',
        body: `I can see electrical systems the way other people cannot. I can walk into a diagnostic problem and understand the relationship between components instantly. That skill won us competitions. It is the clearest evidence of my capability under pressure.`,
      },
      {
        title: 'Tertiary: Responsibility to the team after I leave',
        body: `When I realized I was the single point of failure, everything changed. My responsibility was no longer to win this year. It was to leave the team capable. So I spent the season teaching—which cost us some optimization but bought us sustainability. I chose the team\'s four-year future over my senior season advantage.`,
      },
    ],
  },
  {
    id: 'FLIP2',
    category: 'winner_flip',
    title: 'Service hours completed (easy to claim) vs. actual impact realization (hard to prove)',
    expectedWinner: 'direction_1',
    humanJustification:
      'Clear self-correction: "The real story is not my hours. It is the moment I admitted our good intentions were not good outcomes." Direction_1 should win.',
    stories: [
      {
        title: 'Primary: From hours logged to impact measured',
        body: `I logged 200 hours at the food bank. But an older volunteer asked me: "Do you know any of the people you serve? Do you know if what we do is actually helping?" I could not answer. We started a feedback survey. Most people came once and never returned. We were not helping—we were processing. The real story is not my hours. It is the moment I admitted our good intentions were not good outcomes.`,
      },
      {
        title: 'Secondary: Compassion in action',
        body: `I show up every week because I care about people who are struggling. I see the gratitude in their faces. I know my presence matters to them on the days I work. The hours I give are a direct measure of the care I am committing.`,
      },
      {
        title: 'Tertiary: The cost of inaction',
        body: `When I see a system that is broken, I feel responsible. I could have complained or stayed comfortable. Instead I pushed us to measure our actual impact and redesign our process. That was harder than just logging hours. That is the work that actually mattered.`,
      },
    ],
  },
  // QUESTION-FIRST CASES (low confidence routing to clarification)
  {
    id: 'WEAK1',
    category: 'question_first',
    title: 'Vague growth statement (single entry)',
    humanJustification: 'This needs clarification. No clear moment, no specific change signal. System should ask: "What is one specific moment where your thinking changed?"',
    stories: [
      {
        title: 'Volunteering growth',
        body: `I grew a lot through my volunteer work. I learned that helping people is important and that I enjoy it. It changed my perspective on service.`,
      },
    ],
  },
  {
    id: 'WEAK2',
    category: 'question_first',
    title: 'No specific moment (single entry)',
    humanJustification: 'Needs clarification. Generic skill development without a hinge point. System should ask: "When did you realize your old approach was not working?"',
    stories: [
      {
        title: 'Debate team growth',
        body: `I was on the debate team and we competed a lot. I got better at arguing and presenting. I think debate taught me about thinking on my feet.`,
      },
    ],
  },
  // LOW-CONFIDENCE CASES
  {
    id: 'FLIP3',
    category: 'low_confidence',
    title: 'Victory narrative (obvious) vs. intellectual humility discovery (surprising)',
    expectedWinner: 'direction_1 with low confidence margin',
    humanJustification:
      'Both angles are present. The championship win is real (competence story). But the intellectual humility from the loss is deeper. Direction_1 should win, but with a tight margin reflecting the tension.',
    stories: [
      {
        title: 'Primary: Trophy moment vs. learning moment',
        body: `We won the state championship in policy debate. But the moment I am most proud of is not from the championship. It was a loss to a team from a school district with less funding. They made an argument I had never heard. I realized I had prepared to win, not to think. That loss taught me more than the trophy.`,
      },
      {
        title: 'Secondary: Championship as proof',
        body: `We won the state championship. That proves the debate approach is sound, my preparation is rigorous, and our team executed under pressure. That is the tangible evidence of debate excellence.`,
      },
      {
        title: 'Tertiary: Intellectual openness after loss',
        body: `A team with fewer resources beat our assumptions. That forced me to admit: I had optimized to win against teams like mine, not against teams that think differently. That moment—admitting I was wrong in my preparation strategy—changed how I approach competition and learning.`,
      },
    ],
  },
  // CONTROL: direction_1 should win clearly
  {
    id: 'STRONG1',
    category: 'control_direction_1',
    title: 'Clear self-correction arc (direction_1 should win with high confidence)',
    expectedWinner: 'direction_1',
    humanJustification:
      'Sharp realization moment with clear before/after. "I realized I had done this by rushing through quality checks" → "redesigned the workflow to reduce bottlenecks without sacrificing standards." Direction_1 should win decisively.',
    stories: [
      {
        title: 'Primary: From metric-chasing to system redesign',
        body: `I increased our team productivity by 30% in Q3. But when I stepped back, I realized I had done this by rushing through quality checks. The real insight came when I redesigned the workflow to reduce bottlenecks without sacrificing standards. The 30% gain looked impressive. The workflow redesign was actually the work.`,
      },
      {
        title: 'Secondary: Performance achievement',
        body: `I delivered a 30% productivity increase in Q3. That is measurable impact on the team\'s capacity and output. That metric is evidence of leadership effectiveness.`,
      },
      {
        title: 'Tertiary: Quality discipline under pressure',
        body: `Maintaining standards while accelerating work is the real test of systems thinking. I could have sacrificed quality; instead I built a process that maintained both. That is what sustainable performance looks like.`,
      },
    ],
  },
];

async function reviewCase(testCase: CaseReview): Promise<void> {
  console.log('\n' + '='.repeat(100));
  console.log(`[${testCase.category.toUpperCase()}] ${testCase.id} — ${testCase.title}`);
  console.log(`Expected Winner: ${testCase.expectedWinner ?? 'n/a'}`);
  console.log('='.repeat(100));
  console.log(`HUMAN JUSTIFICATION: ${testCase.humanJustification}`);
  console.log('='.repeat(100));

  const sources = makeSources(testCase.stories);
  const context = buildNdsNormalizedContextPack(sources);

  console.log(`\nINPUT: ${testCase.stories.length} story entries to NDS`);
  testCase.stories.forEach((s, i) => {
    console.log(`  [${i}] ${s.title}: ${s.body.substring(0, 60)}...`);
  });

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

  console.log('\n' + '-'.repeat(100));
  console.log('SCORER OUTPUT:');
  console.log('-'.repeat(100));

  candidates.forEach((c: any, idx: number) => {
    const evidenceLength = c.evidence_spans.reduce((acc: number, span: any) => acc + span.text.length, 0);
    console.log(`\n[${idx + 1}] ${c.candidate_id}${c.selected ? ' ← SELECTED' : ''}`);
    console.log(`    Score: ${c.scores.total_score.toFixed(2)}`);
    console.log(`    Evidence: ${evidenceLength} chars across ${c.evidence_spans.length} spans`);
    console.log(`    Summary: "${c.direction_summary.substring(0, 60)}..."`);
  });

  console.log(`\nRoute decision: ${payload.route_decision}`);
  console.log(`Confidence band: ${payload.confidence_band}`);
  console.log(`Margin: ${payload.score_summary.score_margin.toFixed(2)}`);

  console.log('\n' + '-'.repeat(100));
  console.log('HUMAN REVIEW:');
  console.log('-'.repeat(100));

  const winner = candidates[0];
  const runner_up = candidates[1];

  if (testCase.expectedWinner) {
    const expectedId = testCase.expectedWinner.includes('direction_1') ? 'direction_1' : 'direction_2_or_3';
    const actualId = winner.candidate_id;
    const match = testCase.expectedWinner.includes(actualId);

    console.log(`Expected: ${testCase.expectedWinner}`);
    console.log(`Actual:   ${actualId}`);
    console.log(`Match:    ${match ? '✓ YES' : '✗ NO'}`);

    if (match) {
      console.log(`\n✅ VERDICT: Scorer decision matches human judgment.`);
    } else {
      console.log(`\n❌ VERDICT: Scorer decision does NOT match human judgment. Review needed.`);
    }
  }

  console.log('-'.repeat(100));
}

async function runHumanReview(): Promise<void> {
  console.log('\n\n');
  console.log('█'.repeat(100));
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█' + '  HUMAN REVIEW: MULTI-ENTRY WINNER-FLIP CASES'.padEnd(98) + '█');
  console.log('█' + '  Each case now has 2-3 story entries to generate real alternatives'.padEnd(98) + '█');
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█'.repeat(100));

  // Review all cases in order
  for (const testCase of reviewCases) {
    await reviewCase(testCase);
  }

  console.log('\n\n' + '█'.repeat(100));
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█' + '  END OF HUMAN REVIEW'.padEnd(98) + '█');
  console.log('█' + '  Analysis: Does the scorer match human judgment across multi-entry cases?'.padEnd(98) + '█');
  console.log('█' + ' '.repeat(98) + '█');
  console.log('█'.repeat(100));
}

runHumanReview().catch(console.error);
