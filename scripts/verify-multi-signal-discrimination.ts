import { buildNdsNormalizedContextPack } from '@/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '@/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '@/types/ai';

function makeSources(stories: Array<{ title: string; body: string }>): NdsResolvedSources {
  return {
    essay_project: {
      id: 'proj-verify',
      student_user_id: 'user-verify',
      title: 'Multi-signal verification',
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-verify',
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

interface VerificationCase {
  id: string;
  title: string;
  stories: Array<{ title: string; body: string }>;
  expectedWinner: string;
  humanJustification: string;
}

const cases: VerificationCase[] = [
  // These are the cases where direction_3 won but direction_1 should win
  {
    id: 'FLIP1_VERIFY',
    title: 'Technical skill mastery vs. learning to delegate',
    expectedWinner: 'direction_1',
    humanJustification:
      'Student explicitly realizes delegation/teaching is the real growth, not solo mastery. Clear self-correction story. Direction_1 (realization frame) should win.',
    stories: [
      {
        title: 'Primary: Solo hero to team architect',
        body: `I built the entire electrical system for our robot because I was the only one who understood it. We won regionals. But then I realized: if I graduated, the team had no one who could build the next robot. So last year I taught two people the system from scratch, and we still won—but now I could step back. The winning version of me is not the one who does everything alone.`,
      },
      {
        title: 'Secondary: Technical mastery edge',
        body: `I can see electrical systems the way other people cannot. I can walk into a diagnostic problem and understand the relationship between components instantly. That skill won us competitions. It is the clearest evidence of my capability under pressure.`,
      },
      {
        title: 'Tertiary: Team sustainability',
        body: `When I realized I was the single point of failure, everything changed. My responsibility was no longer to win this year. It was to leave the team capable. So I spent the season teaching—which cost us some optimization but bought us sustainability. I chose the team\'s four-year future over my senior season advantage.`,
      },
    ],
  },
  {
    id: 'FLIP2_VERIFY',
    title: 'Service hours vs. actual impact',
    expectedWinner: 'tied_low_confidence',
    humanJustification:
      'This case has genuine ambiguity: realization (direction_1), compassion-driven service (direction_2), systems thinking (direction_3) are all present. A tie and low-confidence routing is appropriate.',
    stories: [
      {
        title: 'Primary: The moment I realized helping was not happening',
        body: `An older volunteer asked me: "Do you know any of the people you serve? Do you know if what we do is actually helping?" I could not answer. We started a feedback survey. Most people came once and never returned. We were not helping—we were processing. That moment of admitting our good intentions were not translating into actual outcomes changed how I see service work.`,
      },
      {
        title: 'Secondary: Compassion in steady presence',
        body: `I show up every week because I care about people who are struggling. I see the gratitude in their faces when I arrive. I know my presence matters to them on the days I work. The hours I give are a direct measure of my commitment to care.`,
      },
      {
        title: 'Tertiary: System redesign as responsibility',
        body: `When I see a system that is broken, I feel responsible. I could have complained or stayed comfortable. Instead I pushed us to measure our actual impact and redesign our process. That work was harder than logging hours. That is where real responsibility lives.`,
      },
    ],
  },
  {
    id: 'FLIP3_VERIFY',
    title: 'Victory narrative vs. intellectual humility',
    expectedWinner: 'direction_1',
    humanJustification:
      'Primary signal is the key realization: "I had prepared to win, not to think." Direction_1 should win decisively. Direction_3 (about redesign) is less central.',
    stories: [
      {
        title: 'Primary: Trophy vs. learning moment',
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
];

async function verifyCase(testCase: VerificationCase): Promise<void> {
  console.log('\n' + '█'.repeat(120));
  console.log('█' + ' '.repeat(118) + '█');
  console.log(
    '█' +
      ` CASE: ${testCase.id} — ${testCase.title}`.padEnd(118) +
      '█'
  );
  console.log(
    '█' +
      ` Expected Winner: ${testCase.expectedWinner}`.padEnd(118) +
      '█'
  );
  console.log('█' + ' '.repeat(118) + '█');
  console.log('█'.repeat(120));

  console.log(
    `\n📖 HUMAN JUDGMENT: ${testCase.humanJustification}`
  );

  const sources = makeSources(testCase.stories);
  const context = buildNdsNormalizedContextPack(sources);

  console.log(
    `\n📥 INPUT: ${testCase.stories.length} story entries provided to normalize-context`
  );
  testCase.stories.forEach((s, i) => {
    console.log(`  [${i}] "${s.title}"`);
    console.log(`      "${s.body.substring(0, 70)}..."`);
  });

  console.log(`\n🔍 SIGNALS EXTRACTED BY NORMALIZE-CONTEXT:`);
  console.log(`  story_signals count: ${context.story_signals.length}`);
  context.story_signals.forEach((sig, idx) => {
    console.log(`  [${idx}] domain=${sig.domain_signal.situational_domain}`);
    console.log(`      narrative signals: mistake=${sig.narrative_signal.feedback_present}, feedback=${sig.narrative_signal.pivot_present}, pivot=${sig.narrative_signal.behavior_change_present}`);
    console.log(`      event length=${sig.event_summary.length}, change signal length=${sig.change_signal.length}`);
  });

  const output = await executeNdsModule({
    run_id: `verify-${testCase.id}`,
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
    console.log(`\n❌ EXECUTION FAILED: status=${payload.status}`);
    return;
  }

  const candidates = payload.candidates ?? [];
  if (!candidates || candidates.length === 0) {
    console.log(`\n❌ NO CANDIDATES GENERATED`);
    return;
  }

  console.log(`\n` + '-'.repeat(120));
  console.log(`🎯 CANDIDATE CONSTRUCTION & SCORING`);
  console.log('-'.repeat(120));

  candidates.forEach((c: any, idx: number) => {
    const evidenceLength = c.evidence_spans.reduce((acc: number, span: any) => acc + span.text.length, 0);
    const evidenceSpanCount = c.evidence_spans.length;
    const isSelected = c.selected ? ' ← SELECTED' : '';

    console.log(`\n[${idx + 1}] ${c.candidate_id}${isSelected}`);
    console.log(`    ────────────────────────────────────`);
    console.log(`    Total Score: ${c.scores.total_score.toFixed(2)}`);
    console.log(`    Evidence Grounding: ${c.scores.evidence_grounding.toFixed(2)} (spans=${evidenceSpanCount}, chars=${evidenceLength})`);
    console.log(`    Specificity: ${c.scores.student_specificity.toFixed(2)}`);
    console.log(`    Buildability: ${c.scores.buildability.toFixed(2)}`);
    console.log(`    Non-Genericity: ${c.scores.non_genericity.toFixed(2)}`);
    console.log(`    Scene Strength: ${c.scores.scene_strength.toFixed(2)}`);
    console.log(`    Reflective: ${c.scores.reflective_potential.toFixed(2)}`);
    console.log(`    Distinctness: ${c.scores.distinctness.toFixed(2)}`);
    console.log(
      `    Coherence: ${c.scores.explanation_coherence.toFixed(2)}`
    );

    console.log(`\n    Direction Summary:`);
    console.log(`    "${c.direction_summary.substring(0, 90)}..."`);

    console.log(`\n    Core Tension:`);
    console.log(
      `    "${c.core_tension.substring(0, 90)}..."`
    );

    console.log(`\n    Before State: "${c.before_state.substring(0, 60)}..."`);
    console.log(`    After State: "${c.after_state.substring(0, 60)}..."`);

    console.log(`\n    Evidence Spans (${evidenceSpanCount}):`);
    c.evidence_spans.forEach((span: any, sIdx: number) => {
      console.log(
        `      [${sIdx + 1}] "${span.text.substring(0, 80)}..."`
      );
    });
  });

  console.log(`\n` + '-'.repeat(120));
  console.log(`📊 DECISION ANALYSIS`);
  console.log('-'.repeat(120));

  const winner = candidates[0];
  const runner_up = candidates[1];

  console.log(`\nSelected: ${winner.candidate_id}`);
  console.log(`Confidence Band: ${payload.confidence_band}`);
  console.log(`Route Decision: ${payload.route_decision}`);
  console.log(`Margin (winner vs runner-up): ${payload.score_summary.score_margin.toFixed(3)}`);

  console.log(`\nRanking:`);
  candidates.forEach((c: any, idx: number) => {
    const rank = idx + 1;
    const marker = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
    console.log(`  ${marker} #${rank}: ${c.candidate_id} (${c.scores.total_score.toFixed(2)})`);
  });

  console.log(`\n✅/❌ VERIFICATION:`);
  const winnerCorrect = winner.candidate_id === testCase.expectedWinner;
  if (testCase.expectedWinner === 'tied_low_confidence') {
    // Accept if confidence is low (indicating genuine ambiguity)
    const isTiedOrClose = payload.score_summary.score_margin < 0.02;
    const isLowConfidence = payload.confidence_band === 'low';
    if (isLowConfidence && isTiedOrClose) {
      console.log(`    Score margin: ${payload.score_summary.score_margin.toFixed(3)} (tied)`);
      console.log(`    Confidence: ${payload.confidence_band} (appropriate for ambiguous case)`);
      console.log(`    ✅ PASS`);
    } else {
      console.log(`    Score margin: ${payload.score_summary.score_margin.toFixed(3)}`);
      console.log(`    Confidence: ${payload.confidence_band}`);
      console.log(`    ❌ FAIL — Expected low confidence and tied margin for ambiguous case`);
    }
  } else if (winnerCorrect) {
    console.log(`    ${winner.candidate_id} matches expected winner: ${testCase.expectedWinner}`);
    console.log(`    ✅ PASS`);
  } else {
    console.log(
      `    ${winner.candidate_id} DOES NOT match expected winner: ${testCase.expectedWinner}`
    );
    console.log(`    ❌ FAIL`);
    console.log(`\n    Why did ${winner.candidate_id} beat ${testCase.expectedWinner}?`);
    console.log(
      `      • Evidence: ${winner.scores.evidence_grounding.toFixed(2)} vs ${runner_up.scores.evidence_grounding.toFixed(2)}`
    );
    console.log(
      `      • Specificity: ${winner.scores.student_specificity.toFixed(2)} vs ${runner_up.scores.student_specificity.toFixed(2)}`
    );
    console.log(
      `      • Buildability: ${winner.scores.buildability.toFixed(2)} vs ${runner_up.scores.buildability.toFixed(2)}`
    );
  }

  console.log('-'.repeat(120));
}

async function runVerification(): Promise<void> {
  console.log('\n');
  console.log('█'.repeat(120));
  console.log('█' + ' '.repeat(118) + '█');
  console.log(
    '█' +
      '  PRODUCTION VERIFICATION: Multi-Signal Discrimination Test'.padEnd(
        118
      ) +
      '█'
  );
  console.log(
    '█' +
      '  Each case has 3 story entries → 3 story_signals → 3 candidate angles'.padEnd(
        118
      ) +
      '█'
  );
  console.log(
    '█' +
      '  Shows construction source, evidence spans, scores, and winner justification'.padEnd(
        118
      ) +
      '█'
  );
  console.log('█' + ' '.repeat(118) + '█');
  console.log('█'.repeat(120));

  let passed = 0;
  let failed = 0;

  for (const testCase of cases) {
    await verifyCase(testCase);
  }

  console.log('\n');
  console.log('█'.repeat(120));
  console.log('█' + ' '.repeat(118) + '█');
  console.log(
    '█' +
      '  VERIFICATION COMPLETE'.padEnd(118) +
      '█'
  );
  console.log(
    '█' +
      '  Review the results above for pass/fail status on each case'.padEnd(
        118
      ) +
      '█'
  );
  console.log('█' + ' '.repeat(118) + '█');
  console.log('█'.repeat(120));
}

runVerification().catch(console.error);
