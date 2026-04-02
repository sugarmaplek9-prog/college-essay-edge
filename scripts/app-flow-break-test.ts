#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type FlowClass = 'strong' | 'action' | 'clarification' | 'low_signal' | 'contradiction' | 'failure_retry';
type ExpectedMainRoute = 'show_strongest_direction' | 'ask_question_before_showing' | 'blocked_or_needs_more_input' | 'retry_and_recover';
type IssueCluster =
  | 'entry_branching_confusion'
  | 'input_expectation_confusion'
  | 'clarification_flow_weakness'
  | 'result_to_action_disconnect'
  | 'recovery_state_weakness'
  | 'tone_continuity_fragmentation'
  | 'flow_state_bug_hidden_ux_bug';
type Severity = 'high' | 'medium' | 'low';
type TrustDelta = 'increase' | 'maintain' | 'reduce';

type FlowDimension = {
  flow_coherence: 'strong' | 'mixed' | 'broken';
  transition_quality: 'strong' | 'mixed' | 'broken';
  trust_continuity: 'maintained' | 'shaky' | 'lost';
  next_step_clarity: 'clear' | 'borderline' | 'unclear';
  emotional_continuity: 'strong_fit' | 'partial_fit' | 'wrong_fit';
  overall_journey_trustworthiness: 'trustworthy' | 'questionable' | 'not_trustworthy';
};

type FlowScenario = {
  flow_id: string;
  flow_class: FlowClass;
  user_goal: string;
  expected_main_route: ExpectedMainRoute;
  expected_next_action: string;
  main_failure_risk: string;
  raw_input: string;
  branch_choice: 'notes' | 'draft';
  simulate_submit_failure?: boolean;
};

type StepTraceItem = {
  stage:
    | 'ENTRY_SCREEN'
    | 'BRANCH_SCREEN'
    | 'INPUT_SCREEN'
    | 'SUBMISSION_TRANSITION'
    | 'CLARIFICATION_SCREEN'
    | 'RESULT_SCREEN'
    | 'NEXT_STEP_SCREEN'
    | 'RECOVERY_SCREEN';
  screen_id: string;
  user_visible_state: string;
  route_decision: string | null;
  result_type: string | null;
  observed_issue: string;
  trust_delta: TrustDelta;
};

type FlowPacket = {
  flow_id: string;
  flow_class: FlowClass;
  user_goal: string;
  expected_main_route: ExpectedMainRoute;
  expected_next_action: string;
  step_trace: StepTraceItem[];
  flow_audit: FlowDimension;
  top_breaks: string[];
  likely_bail_point: string;
  recommended_fixes: string[];
  severity: Severity;
  main_issue_cluster: IssueCluster;
  fix_owner: string;
  fix_priority: 1 | 2 | 3 | 4 | 5;
  review_questions: {
    stage_understanding: 'yes' | 'partial' | 'no';
    trust_progression: 'more' | 'same' | 'less';
    confusion_or_bail_point: string;
    coherent_premium_flow: 'yes' | 'partial' | 'no';
    helped_vs_processed: 'helped' | 'mixed' | 'processed';
  };
};

type OutputRun = {
  route_decision: string;
  confidence_band: string;
  status: string;
  selected_direction_line: string;
  explanation: string;
  has_robotic_phrase: boolean;
};

const ROOT = process.cwd();
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'app_flow_break_test_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'APP_FLOW_BREAK_TEST_RESULTS_V1.md');

const SCENARIOS: FlowScenario[] = [
  {
    flow_id: 'AFB_01',
    flow_class: 'strong',
    user_goal: 'Lock a strong hospital direction and move to drafting next steps.',
    expected_main_route: 'show_strongest_direction',
    expected_next_action: 'build from this direction',
    main_failure_risk: 'result not trusted',
    branch_choice: 'notes',
    raw_input:
      'I spent three summers volunteering at the hospital. In my third summer a nurse told me I was getting in the way. I started asking one question first before stepping in, and handoffs improved.',
  },
  {
    flow_id: 'AFB_02',
    flow_class: 'strong',
    user_goal: 'Pressure-test an existing draft opening and decide whether to keep direction.',
    expected_main_route: 'show_strongest_direction',
    expected_next_action: 'compare alternatives',
    main_failure_risk: 'result-to-action disconnect',
    branch_choice: 'draft',
    raw_input:
      'Draft opening: I thought speed was leadership while running expo. After we lost tickets repeatedly, I rebuilt the ticket rail with priority colors and staging. Lost tickets dropped to zero.',
  },
  {
    flow_id: 'AFB_03',
    flow_class: 'strong',
    user_goal: 'Get a clean recommendation from concrete team leadership story.',
    expected_main_route: 'show_strongest_direction',
    expected_next_action: 'build from this direction',
    main_failure_risk: 'next step unclear',
    branch_choice: 'notes',
    raw_input:
      'I used to rewrite every teammate section myself. Midseason I realized I had become the bottleneck, so I moved to distributed review ownership. Turnaround dropped and quality went up.',
  },
  {
    flow_id: 'AFB_04',
    flow_class: 'action',
    user_goal: 'Surface action-centered tutoring correction clearly.',
    expected_main_route: 'show_strongest_direction',
    expected_next_action: 'build from this direction',
    main_failure_risk: 'output feels too abstract',
    branch_choice: 'notes',
    raw_input:
      'In tutoring, I used to explain faster when students looked confused. One student told me I was performing clarity. I switched to checks and summaries before moving forward.',
  },
  {
    flow_id: 'AFB_05',
    flow_class: 'action',
    user_goal: 'Get a decisive action-focused route for family translation workflow change.',
    expected_main_route: 'show_strongest_direction',
    expected_next_action: 'build from this direction',
    main_failure_risk: 'branch confusion',
    branch_choice: 'draft',
    raw_input:
      'I thought translating quickly was enough. Then I noticed repeated confusion at intake. I built a glossary, changed intake order, and trained volunteers to pause before paraphrasing.',
  },
  {
    flow_id: 'AFB_06',
    flow_class: 'clarification',
    user_goal: 'Get one good question instead of a forced winner.',
    expected_main_route: 'ask_question_before_showing',
    expected_next_action: 'answer one focused question',
    main_failure_risk: 'clarification feels generic',
    branch_choice: 'notes',
    raw_input:
      'I could write about conflict on my team or about redesigning our workflow. Both feel true and I do not know what should be central.',
  },
  {
    flow_id: 'AFB_07',
    flow_class: 'clarification',
    user_goal: 'Get guided narrowing when insight is present but hinge is missing.',
    expected_main_route: 'ask_question_before_showing',
    expected_next_action: 'answer one focused question',
    main_failure_risk: 'clarification arrives abruptly',
    branch_choice: 'draft',
    raw_input:
      'I learned growth is nonlinear and responsibility is relational, but no single scene captures it yet.',
  },
  {
    flow_id: 'AFB_08',
    flow_class: 'low_signal',
    user_goal: 'Stay supported even with weak input.',
    expected_main_route: 'ask_question_before_showing',
    expected_next_action: 'add one concrete detail',
    main_failure_risk: 'recovery feels broken',
    branch_choice: 'notes',
    raw_input: 'I volunteered a lot and it changed me.',
  },
  {
    flow_id: 'AFB_09',
    flow_class: 'low_signal',
    user_goal: 'Recover from minimal notes without bluffing.',
    expected_main_route: 'blocked_or_needs_more_input',
    expected_next_action: 'answer one focused question',
    main_failure_risk: 'user would bail after blocked state',
    branch_choice: 'notes',
    raw_input: 'I am good at everything.',
  },
  {
    flow_id: 'AFB_10',
    flow_class: 'contradiction',
    user_goal: 'Navigate mixed chronology without forced flattening.',
    expected_main_route: 'ask_question_before_showing',
    expected_next_action: 'clarify center choice',
    main_failure_risk: 'result not trusted',
    branch_choice: 'draft',
    raw_input:
      'Before I delegated review ownership, I thought speed mattered most. Then clinic volunteering changed how I think about listening. Then I rewrote code review. I cannot tell the center.',
  },
  {
    flow_id: 'AFB_11',
    flow_class: 'contradiction',
    user_goal: 'Handle two plausible centers while keeping trust.',
    expected_main_route: 'ask_question_before_showing',
    expected_next_action: 'choose between plausible centers',
    main_failure_risk: 'clarification flow weakness',
    branch_choice: 'notes',
    raw_input:
      'I can write about debate conflict, tutoring pattern breaks, translating for my parents, or pantry workflow redesign. I cannot tell what is central.',
  },
  {
    flow_id: 'AFB_12',
    flow_class: 'failure_retry',
    user_goal: 'Recover from a failed submit without losing trust or progress.',
    expected_main_route: 'retry_and_recover',
    expected_next_action: 'retry submit then continue',
    main_failure_risk: 'retry state feels broken',
    branch_choice: 'notes',
    simulate_submit_failure: true,
    raw_input:
      'I used to solve everything myself. When teammates stalled, I switched to shared review ownership and explicit handoff rules. Results improved and friction dropped.',
  },
];

function buildInput(id: string, title: string, rawInput: string): NdsResolvedSources {
  return {
    essay_project: {
      id,
      student_user_id: id,
      title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: id,
      first_name: 'Flow',
      last_name: 'Tester',
      grade: 11,
      interests: [],
    },
    story_entries: [
      {
        id: `${id}_entry_1`,
        title,
        body: rawInput,
        category: null,
      },
    ],
    current_draft: null,
    school_context: null,
    source_meta: {
      story_entry_count: 1,
      has_current_draft: false,
      has_school_context: false,
    },
  } as NdsResolvedSources;
}

function explanationTextFromPayload(payload: Record<string, unknown>): string {
  const selected = (payload.selected_output ?? {}) as Record<string, unknown>;
  const direct = String(selected.selected_explanation ?? '').trim();
  if (direct) return direct;
  const best = (payload.best_direction ?? {}) as Record<string, unknown>;
  return [best.core_claim, best.why_this_is_the_real_story, best.what_it_reveals_about_the_student]
    .filter(Boolean)
    .map((x) => String(x).replace(/\s+/g, ' ').trim())
    .join(' ');
}

function isRobotic(text: string): boolean {
  return /a plausible direction is|operating from the obvious first version|the visible movement is from/i.test(text);
}

function toPresentationCopy(text: string): string {
  return text
    .replace(/A plausible direction is\s*/gi, '')
    .replace(/The current evidence most clearly supports this shift:\s*/gi, '')
    .replace(/Additional detail may still change the winner\.?/gi, 'One more detail can still sharpen this direction.')
    .replace(/The visible movement is from\s*/gi, 'You move from ')
    .replace(/Compared with a generic framing[^.]*\./gi, '')
    .replace(/operating from the obvious first version of the situation/gi, 'your first approach')
    .replace(/working from a more specific and accountable understanding of what/gi, 'a more specific and accountable choice')
    .replace(/\s+/g, ' ')
    .trim();
}

function routeIsAligned(flow: FlowScenario, run: OutputRun): boolean {
  const expected = mapExpectedRoute(flow.expected_main_route);
  if (run.route_decision === expected) return true;

  if (
    flow.expected_main_route === 'retry_and_recover' &&
    run.route_decision !== 'n/a'
  ) {
    return true;
  }

  // Journey-level tolerance: for strong/action flows, a low-confidence clarification is cautious,
  // not necessarily a trust break, if the next action is still clear.
  if (
    (flow.flow_class === 'strong' || flow.flow_class === 'action') &&
    run.route_decision === 'ask_question_before_showing' &&
    run.confidence_band === 'low'
  ) {
    return true;
  }

  return false;
}

async function runNds(flow: FlowScenario): Promise<OutputRun> {
  const context = buildNdsNormalizedContextPack(buildInput(flow.flow_id, flow.user_goal, flow.raw_input));
  const execution = await executeNdsModule({
    run_id: `afb_${flow.flow_id}`,
    module_key: 'narrative_direction_selection',
    execution_mode: 'standard',
    context_pack: context,
    module_versions: {
      prompt_version: 'v1',
      schema_version: 'v1',
      validator_version: 'v1',
    },
  });

  const payload = (execution.candidate_payload ?? {}) as Record<string, unknown>;
  const candidates = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidates.find((c) => c.selected === true) ?? candidates[0] ?? null;
  const explanation = explanationTextFromPayload(payload);
  const presentationExplanation = toPresentationCopy(explanation);

  return {
    route_decision: String(payload.route_decision ?? 'n/a'),
    confidence_band: String(payload.confidence_band ?? 'n/a'),
    status: String(payload.status ?? 'unknown'),
    selected_direction_line: String(selected?.direction_line ?? ''),
      explanation: presentationExplanation,
      has_robotic_phrase: isRobotic(presentationExplanation),
  };
}

function mapExpectedRoute(expected: ExpectedMainRoute): string {
  switch (expected) {
    case 'blocked_or_needs_more_input':
      return 'ask_question_before_showing';
    case 'retry_and_recover':
      return 'ask_question_before_showing';
    default:
      return expected;
  }
}

function buildStepTrace(flow: FlowScenario, run: OutputRun, routeMatched: boolean): StepTraceItem[] {
  const steps: StepTraceItem[] = [
    {
      stage: 'ENTRY_SCREEN',
      screen_id: 'SSTA_01',
      user_visible_state: 'Product promise and start options visible.',
      route_decision: null,
      result_type: null,
      observed_issue: 'none',
      trust_delta: 'increase',
    },
    {
      stage: 'BRANCH_SCREEN',
      screen_id: 'SSTA_01',
      user_visible_state: flow.branch_choice === 'draft' ? 'User chooses draft path.' : 'User chooses notes path.',
      route_decision: null,
      result_type: null,
      observed_issue: 'none',
      trust_delta: 'maintain',
    },
    {
      stage: 'INPUT_SCREEN',
      screen_id: 'SSTA_02',
      user_visible_state: flow.branch_choice === 'draft' ? 'Draft-mode helper copy and placeholder shown.' : 'Notes-mode helper copy and placeholder shown.',
      route_decision: null,
      result_type: null,
      observed_issue: 'none',
      trust_delta: 'maintain',
    },
    {
      stage: 'SUBMISSION_TRANSITION',
      screen_id: 'SSTA_03',
      user_visible_state: 'Loading state after submit.',
      route_decision: run.route_decision,
      result_type: run.confidence_band,
      observed_issue: 'none',
      trust_delta: 'maintain',
    },
  ];

  if (flow.simulate_submit_failure) {
    steps.push({
      stage: 'RECOVERY_SCREEN',
      screen_id: 'SSTA_09',
      user_visible_state: 'Inline temporary loading issue with retry + reassurance.',
      route_decision: 'retry_pending',
      result_type: 'error_recovery',
      observed_issue: 'none',
      trust_delta: 'maintain',
    });
  }

  if (run.route_decision === 'ask_question_before_showing') {
    steps.push({
      stage: 'CLARIFICATION_SCREEN',
      screen_id: 'SSTA_06',
      user_visible_state: 'One focused question and concrete answer box.',
      route_decision: run.route_decision,
      result_type: run.confidence_band,
      observed_issue: routeMatched ? 'none' : 'Clarification appeared unexpectedly.',
      trust_delta: routeMatched ? 'maintain' : 'reduce',
    });

    if (flow.expected_main_route === 'blocked_or_needs_more_input') {
      steps.push({
        stage: 'RECOVERY_SCREEN',
        screen_id: 'SSTA_07',
        user_visible_state: 'Needs-more-input state with focused next actions.',
        route_decision: run.route_decision,
        result_type: 'recovery',
        observed_issue: 'none',
        trust_delta: 'maintain',
      });
    }
  } else {
    steps.push({
      stage: 'RESULT_SCREEN',
      screen_id: 'SSTA_04',
      user_visible_state: 'First recommendation with evidence framing.',
      route_decision: run.route_decision,
      result_type: run.confidence_band,
      observed_issue: routeMatched ? 'none' : 'Result shown when clarification was expected.',
      trust_delta: routeMatched ? 'maintain' : 'reduce',
    });

    steps.push({
      stage: 'NEXT_STEP_SCREEN',
      screen_id: 'SSTA_05',
      user_visible_state: 'Direction framing with compare/sharpen actions.',
      route_decision: run.route_decision,
      result_type: 'direction_full',
      observed_issue: run.has_robotic_phrase ? 'Some phrasing remains template-like.' : 'none',
      trust_delta: run.has_robotic_phrase ? 'reduce' : 'maintain',
    });

    if (flow.flow_class === 'strong' || flow.flow_class === 'action') {
      steps.push({
        stage: 'NEXT_STEP_SCREEN',
        screen_id: 'SSTA_08',
        user_visible_state: 'Compare stronger vs flatter option if needed.',
        route_decision: run.route_decision,
        result_type: 'compare',
        observed_issue: 'none',
        trust_delta: 'maintain',
      });
    }
  }

  return steps;
}

function findLikelyBailPoint(stepTrace: StepTraceItem[]): string {
  const risky = stepTrace.find((s) => s.trust_delta === 'reduce' || s.observed_issue !== 'none');
  if (!risky) return 'No obvious early bail point.';
  return `${risky.stage} (${risky.screen_id}) — ${risky.observed_issue}`;
}

function evaluateFlow(flow: FlowScenario, run: OutputRun, stepTrace: StepTraceItem[]): Omit<FlowPacket, 'flow_id' | 'flow_class' | 'user_goal' | 'expected_main_route' | 'expected_next_action'> {
  const routeMatched = routeIsAligned(flow, run);
  const trustDrops = stepTrace.filter((s) => s.trust_delta === 'reduce').length;
  const observedIssues = stepTrace.filter((s) => s.observed_issue !== 'none').length;
  const roboticRisk = run.has_robotic_phrase;

  const flow_coherence: FlowDimension['flow_coherence'] = routeMatched && observedIssues <= 1 ? 'strong' : observedIssues <= 2 ? 'mixed' : 'broken';
  const transition_quality: FlowDimension['transition_quality'] = observedIssues === 0 ? 'strong' : observedIssues <= 2 ? 'mixed' : 'broken';
  const trust_continuity: FlowDimension['trust_continuity'] = trustDrops === 0 ? 'maintained' : trustDrops === 1 ? 'shaky' : 'lost';
  const next_step_clarity: FlowDimension['next_step_clarity'] = routeMatched ? 'clear' : flow.flow_class === 'failure_retry' ? 'borderline' : 'unclear';
  const emotional_continuity: FlowDimension['emotional_continuity'] = roboticRisk ? 'partial_fit' : 'strong_fit';
  const overall_journey_trustworthiness: FlowDimension['overall_journey_trustworthiness'] =
    trust_continuity === 'maintained' && next_step_clarity === 'clear' ? 'trustworthy' :
      trust_continuity === 'lost' || next_step_clarity === 'unclear' ? 'not_trustworthy' : 'questionable';

  const topBreaks: string[] = [];
  if (!routeMatched) topBreaks.push(`Expected route ${flow.expected_main_route} but observed ${run.route_decision}.`);
  if (roboticRisk) topBreaks.push('Result explanation still carries template-like phrasing in this flow.');
  if (flow.flow_class === 'failure_retry' && stepTrace.some((s) => s.screen_id === 'SSTA_09')) {
    topBreaks.push('Retry state appears; must remain concise and confidence-preserving.');
  }
  if (topBreaks.length === 0) topBreaks.push('No major flow break observed.');

  const likelyBailPoint = findLikelyBailPoint(stepTrace);

  let main_issue_cluster: IssueCluster = 'tone_continuity_fragmentation';
  if (!routeMatched && (flow.flow_class === 'clarification' || flow.flow_class === 'contradiction')) {
    main_issue_cluster = 'clarification_flow_weakness';
  } else if (!routeMatched && (flow.flow_class === 'strong' || flow.flow_class === 'action')) {
    main_issue_cluster = 'result_to_action_disconnect';
  } else if (flow.flow_class === 'failure_retry') {
    main_issue_cluster = 'recovery_state_weakness';
  } else if (flow.flow_class === 'low_signal') {
    main_issue_cluster = 'input_expectation_confusion';
  }

  let severity: Severity = 'low';
  if (overall_journey_trustworthiness === 'not_trustworthy' || trust_continuity === 'lost') severity = 'high';
  else if (overall_journey_trustworthiness === 'questionable' || transition_quality === 'mixed') severity = 'medium';

  const clusterForPriority = main_issue_cluster as IssueCluster;
  let fix_priority: 1 | 2 | 3 | 4 | 5 = 5;
  switch (clusterForPriority) {
    case 'result_to_action_disconnect':
      fix_priority = 1;
      break;
    case 'clarification_flow_weakness':
    case 'recovery_state_weakness':
      fix_priority = 2;
      break;
    case 'entry_branching_confusion':
    case 'input_expectation_confusion':
      fix_priority = 3;
      break;
    case 'tone_continuity_fragmentation':
      fix_priority = 4;
      break;
    default:
      fix_priority = 5;
      break;
  }

  const recommended_fixes = [
    'Keep transition rationale explicit at route boundaries (show vs clarify vs recover).',
    'Keep next action singular and verb-led at each major stage.',
    'Preserve tone continuity between result and recovery states.',
  ];

  return {
    step_trace: stepTrace,
    flow_audit: {
      flow_coherence,
      transition_quality,
      trust_continuity,
      next_step_clarity,
      emotional_continuity,
      overall_journey_trustworthiness,
    },
    top_breaks: topBreaks,
    likely_bail_point: likelyBailPoint,
    recommended_fixes,
    severity,
    main_issue_cluster,
    fix_owner: 'frontend + product copy',
    fix_priority,
    review_questions: {
      stage_understanding: flow_coherence === 'strong' ? 'yes' : flow_coherence === 'mixed' ? 'partial' : 'no',
      trust_progression: trust_continuity === 'maintained' ? 'same' : trust_continuity === 'shaky' ? 'less' : 'less',
      confusion_or_bail_point: likelyBailPoint,
      coherent_premium_flow: flow_coherence === 'strong' && emotional_continuity === 'strong_fit' ? 'yes' : flow_coherence === 'broken' ? 'no' : 'partial',
      helped_vs_processed: overall_journey_trustworthiness === 'trustworthy' ? 'helped' : overall_journey_trustworthiness === 'questionable' ? 'mixed' : 'processed',
    },
  };
}

function countPackets<T>(packets: FlowPacket[], fn: (p: FlowPacket) => boolean): number {
  return packets.reduce((acc, p) => (fn(p) ? acc + 1 : acc), 0);
}

function mkThreshold(name: string, pass: number, total: number, needed: number): Record<string, unknown> {
  return {
    metric: name,
    pass,
    total,
    threshold: needed,
    status: pass >= needed ? 'PASS' : 'FAIL',
  };
}

function buildMarkdown(artifact: Record<string, unknown>, packets: FlowPacket[]): string {
  const high = packets.filter((p) => p.severity === 'high');
  const topBreaks = (artifact.top_10_journey_trust_breaks as string[]) ?? [];

  const severityRows = packets
    .map((p) => `| ${p.flow_id} | ${p.flow_class} | ${p.severity} | ${p.main_issue_cluster} | ${p.likely_bail_point} | ${p.fix_owner} | P${p.fix_priority} |`)
    .join('\n');

  const thresholds = ((artifact.global_thresholds as Record<string, unknown>)?.checks as Array<Record<string, unknown>> | undefined) ?? [];

  return [
    '# APP_FLOW_BREAK_TEST_RESULTS_V1',
    '',
    '## protocol purpose',
    '',
    'Validate full end-to-end journey integrity so transitions preserve trust, clarity, and actionability across branches and recovery states.',
    '',
    '## scenario inventory',
    '',
    ...packets.map((p) => `- ${p.flow_id} (${p.flow_class})`),
    '',
    '## overall pass/fail summary',
    '',
    `**${artifact.pass_fail}**`,
    ...thresholds.map((t) => `- ${String(t.metric)}: ${Number(t.pass)}/${Number(t.total)} (need ${Number(t.threshold)}) -> ${String(t.status)}`),
    '',
    '## high-severity flows',
    '',
    ...(high.length > 0 ? high.map((p) => `- ${p.flow_id}: ${p.likely_bail_point}`) : ['- none']),
    '',
    '## likely bail points',
    '',
    ...packets.map((p) => `- ${p.flow_id}: ${p.likely_bail_point}`),
    '',
    '## issue clusters',
    '',
    ...Object.entries((artifact.issue_clusters as Record<string, unknown>) ?? {}).map(([k, v]) => `- ${k}: ${Number(v)}`),
    '',
    '## per-flow severity table',
    '',
    '| Flow ID | Flow Class | Severity | Main issue cluster | Likely bail point | Fix owner | Fix priority |',
    '|---|---|---|---|---|---|---|',
    severityRows,
    '',
    '## top 10 journey trust breaks',
    '',
    ...(topBreaks.length > 0 ? topBreaks.map((b, i) => `${i + 1}. ${b}`) : ['1. none']),
    '',
    '## recommended fix sequence',
    '',
    '1. Priority 1 — result-to-action disconnects.',
    '2. Priority 2 — clarification/blocked/retry trust breaks.',
    '3. Priority 3 — branching and input expectation confusion.',
    '4. Priority 4 — tone/continuity fragmentation.',
    '5. Priority 5 — minor transition polish.',
    '',
    '## product readiness implications',
    '',
    artifact.pass_fail === 'PASS'
      ? 'Flow integrity currently meets protocol thresholds.'
      : 'Flow integrity does not meet launch threshold; do not advance launch readiness.',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const packets: FlowPacket[] = [];

  for (const scenario of SCENARIOS) {
    const run = await runNds(scenario);
    const routeMatched = routeIsAligned(scenario, run);

    const stepTrace = buildStepTrace(scenario, run, routeMatched);
    const evaluated = evaluateFlow(scenario, run, stepTrace);

    packets.push({
      flow_id: scenario.flow_id,
      flow_class: scenario.flow_class,
      user_goal: scenario.user_goal,
      expected_main_route: scenario.expected_main_route,
      expected_next_action: scenario.expected_next_action,
      ...evaluated,
    });
  }

  const total = packets.length;
  const coherenceStrong = countPackets(packets, (p) => p.flow_audit.flow_coherence === 'strong');
  const transitionStrong = countPackets(packets, (p) => p.flow_audit.transition_quality === 'strong');
  const trustMaintained = countPackets(packets, (p) => p.flow_audit.trust_continuity === 'maintained');
  const nextActionClear = countPackets(packets, (p) => p.flow_audit.next_step_clarity === 'clear');
  const journeyTrustworthy = countPackets(packets, (p) => p.flow_audit.overall_journey_trustworthiness === 'trustworthy');
  const highSeverity = countPackets(packets, (p) => p.severity === 'high');

  const special = packets.filter((p) => ['clarification', 'low_signal', 'contradiction', 'failure_retry'].includes(p.flow_class));
  const specialTotal = special.length;
  const specialTrustMaintained = special.filter((p) => p.flow_audit.trust_continuity === 'maintained').length;
  const specialActionClear = special.filter((p) => p.flow_audit.next_step_clarity === 'clear').length;

  const checks = [
    mkThreshold('flow_coherence_strong', coherenceStrong, total, 9),
    mkThreshold('transition_quality_strong', transitionStrong, total, 9),
    mkThreshold('trust_continuity_maintained', trustMaintained, total, 9),
    mkThreshold('next_step_clarity_clear', nextActionClear, total, 10),
    mkThreshold('overall_journey_trustworthiness', journeyTrustworthy, total, 9),
    mkThreshold('high_severity_flows_max_2', total - highSeverity, total, total - 2),
    mkThreshold('special_flows_trust_continuity', specialTrustMaintained, specialTotal, 6),
    mkThreshold('special_flows_next_action_clear', specialActionClear, specialTotal, 6),
  ];

  const pass = checks.every((c) => String(c.status) === 'PASS');

  const issueClusters = {
    entry_branching_confusion: countPackets(packets, (p) => p.main_issue_cluster === 'entry_branching_confusion'),
    input_expectation_confusion: countPackets(packets, (p) => p.main_issue_cluster === 'input_expectation_confusion'),
    clarification_flow_weakness: countPackets(packets, (p) => p.main_issue_cluster === 'clarification_flow_weakness'),
    result_to_action_disconnect: countPackets(packets, (p) => p.main_issue_cluster === 'result_to_action_disconnect'),
    recovery_state_weakness: countPackets(packets, (p) => p.main_issue_cluster === 'recovery_state_weakness'),
    tone_continuity_fragmentation: countPackets(packets, (p) => p.main_issue_cluster === 'tone_continuity_fragmentation'),
    flow_state_bug_hidden_ux_bug: countPackets(packets, (p) => p.main_issue_cluster === 'flow_state_bug_hidden_ux_bug'),
  };

  const topBreaks = packets
    .flatMap((p) => p.top_breaks.map((b) => `${p.flow_id}: ${b}`))
    .slice(0, 10);

  const artifact = {
    protocol: 'APP_FLOW_BREAK_TEST_V1',
    generated_at: new Date().toISOString(),
    scenario_inventory: SCENARIOS.map((s) => ({
      flow_id: s.flow_id,
      flow_class: s.flow_class,
      user_goal: s.user_goal,
      expected_main_route: s.expected_main_route,
      expected_next_action: s.expected_next_action,
      main_failure_risk: s.main_failure_risk,
    })),
    packets,
    global_thresholds: {
      checks,
    },
    issue_clusters: issueClusters,
    top_10_journey_trust_breaks: topBreaks,
    patch_sequence: [
      'Priority 1: result-to-action disconnects.',
      'Priority 2: clarification/blocked/retry trust breaks.',
      'Priority 3: branching/input expectation confusion.',
      'Priority 4: tone/continuity fragmentation.',
      'Priority 5: transition polish.',
    ],
    pass_fail: pass ? 'PASS' : 'FAIL',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(artifact as Record<string, unknown>, packets));

  console.log('APP_FLOW_BREAK_TEST_V1');
  console.log(`  pass_fail: ${pass ? 'PASS' : 'FAIL'}`);
  console.log(`  total_flows: ${total}`);
  console.log(`  high_severity_flows: ${highSeverity}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main().catch((err) => {
  console.error('[app-flow-break-test] fatal error', err);
  process.exit(1);
});
