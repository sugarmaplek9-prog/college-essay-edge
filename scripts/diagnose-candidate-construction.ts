import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(story: string): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-diag',
      student_user_id: 'user-diag',
      title: 'Diagnostic test',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-diag',
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

const flipCases = [
  {
    id: 'FLIP1',
    title: 'Technical skill mastery (surface) vs. learning to delegate (deeper)',
    story: `I built the entire electrical system for our robot because I was the only one who understood it. We won regionals. But then I realized: if I graduated, the team had no one who could build the next robot. So last year I taught two people the system from scratch, and we still won—but now I could step back. The winning version of me is not the one who does everything alone.`,
  },
  {
    id: 'FLIP2',
    title: 'Service hours completed (easy to claim) vs. actual impact realization (hard to prove)',
    story: `I logged 200 hours at the food bank. But an older volunteer asked me: "Do you know any of the people you serve? Do you know if what we do is actually helping?" I could not answer. We started a feedback survey. Most people came once and never returned. We were not helping—we were processing. The real story is not my hours. It is the moment I admitted our good intentions were not good outcomes.`,
  },
  {
    id: 'FLIP3',
    title: 'Debate victory narrative (obvious) vs. intellectual humility discovery (surprising)',
    story: `We won the state championship in policy debate. But the moment I am most proud of is not from the championship. It was a loss to a team from a school district with less funding. They made an argument I had never heard. I realized I had prepared to win, not to think. That loss taught me more than the trophy.`,
  },
  {
    id: 'FLIP4',
    title: 'Artistic accomplishment (visible) vs. creative risk-taking (invisible but formative)',
    story: `My painting was accepted to the regional show. Everyone congratulated me. But the real turning point came the year before when a painting was rejected and the feedback stung. I could have played it safe after that. Instead I painted the most experimental thing I had ever made, it was rejected again, and I made a third one that finally got accepted. The achievement matters less than the decision to keep pushing after failure.`,
  },
  {
    id: 'FLIP5',
    title: 'Performance metric (easy) vs. system redesign (harder, more meaningful)',
    story: `I increased our team productivity by 30% in Q3. But when I stepped back, I realized I had done this by rushing through quality checks. The real insight came when I redesigned the workflow to reduce bottlenecks without sacrificing standards. The 30% gain looked impressive. The workflow redesign was actually the work.`,
  },
];

async function diagnoseCase(testCase: { id: string; title: string; story: string }): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log(`DIAGNOSTIC: ${testCase.id} — ${testCase.title}`);
  console.log('='.repeat(80));

  const sources = makeSources(testCase.story);
  const context = buildNdsNormalizedContextPack(sources);

  console.log('\nContext signals:');
  context.story_signals.forEach((sig, idx) => {
    console.log(
      `  Signal[${idx}] domain=${sig.domain_signal?.situational_domain}, ` +
        `event_len=${sig.event_summary?.length ?? 0}, change_len=${sig.change_signal?.length ?? 0}`
    );
    if (sig.event_summary) {
      console.log(`    event: "${sig.event_summary.substring(0, 80)}..."`);
    }
  });

  const output = await executeNdsModule({
    run_id: `run-diag-${testCase.id}`,
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
    console.log(`\nStatus: ${payload.status}`);
    console.log(`Payload keys: ${Object.keys(payload).join(', ')}`);
    return;
  }

  const candidates = payload.candidates ?? payload.candidate_payload?.candidates ?? [];
  if (!candidates || candidates.length === 0) {
    console.log(`\nNo candidates found. Payload status: ${payload.status}`);
    console.log(`Payload keys: ${Object.keys(payload).join(', ')}`);
    return;
  }

  console.log('\nCandidates:');
  candidates.forEach((c: any, idx: number) => {
    const evidenceLength = c.evidence_spans.reduce((acc: number, span: any) => acc + span.text.length, 0);
    const buildContext = c.before_state?.length ?? 0;
    const buildResult = c.after_state?.length ?? 0;

    console.log(`\n  [${idx}] ${c.candidate_id}`);
    console.log(`    selected: ${c.selected}`);
    console.log(`    total_score: ${c.scores.total_score}`);
    console.log(`    evidence_grounding: ${c.scores.evidence_grounding}`);
    console.log(`    buildability: ${c.scores.buildability || 'n/a'}`);
    console.log(`    specificity: ${c.scores.student_specificity}`);
    console.log(`    non_genericity: ${c.scores.non_genericity}`);
    console.log(`    evidence_spans: ${c.evidence_spans.length} spans, ${evidenceLength} total chars`);
    c.evidence_spans.forEach((span: any, sIdx: number) => {
      console.log(`      span[${sIdx}]: "${span.text.substring(0, 60)}..."`);
    });
    console.log(`    direction_summary: "${c.direction_summary.substring(0, 60)}..."`);
    console.log(`    core_tension: "${c.core_tension.substring(0, 60)}..."`);
    console.log(`    before_state: "${c.before_state.substring(0, 40)}..." (len=${buildContext})`);
    console.log(`    after_state: "${c.after_state.substring(0, 40)}..." (len=${buildResult})`);
  });

  console.log(`\nSelected: ${payload.selected_candidate_id}`);
  console.log(`Confidence: ${payload.confidence_band}`);
  console.log(`Route: ${payload.route_decision}`);
  console.log(`Margin: ${payload.score_summary.score_margin}`);
}

async function runDiagnostics(): Promise<void> {
  console.log('CANDIDATE CONSTRUCTION DIAGNOSTIC');
  console.log('Analyzing 5 FLIP cases to understand candidate sourcing\n');

  for (const testCase of flipCases) {
    await diagnoseCase(testCase);
  }

  console.log('\n' + '='.repeat(80));
  console.log('DIAGNOSTIC COMPLETE');
  console.log(
    'Check evidence_spans and direction_summary for each candidate to see if they are being built from distinct sources.'
  );
  console.log('='.repeat(80));
}

runDiagnostics().catch(console.error);
