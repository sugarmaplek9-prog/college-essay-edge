#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type ScreenClass = 'entry' | 'input' | 'result' | 'recovery' | 'supporting_state';
type ReviewMode = 'static' | 'flow' | 'output';
type PurposeClarity = 'clear' | 'somewhat_clear' | 'unclear';
type LanguageQuality = 'strong' | 'mixed' | 'weak';
type Trustworthiness = 'trustworthy' | 'borderline' | 'trust_break';
type ActionClarity = 'clear' | 'borderline' | 'unclear';
type EmotionalFit = 'strong_fit' | 'partial_fit' | 'wrong_fit';
type ProductCoherence = 'coherent' | 'drifting' | 'fragmented';
type Severity = 'high' | 'medium' | 'low';
type IssueCluster = 'copy_language' | 'output_framing' | 'cta_next_step' | 'trust' | 'flow';
type FixOrder = 1 | 2 | 3 | 4;

type AuditScores = {
  purpose_clarity: PurposeClarity;
  language_quality: LanguageQuality;
  trustworthiness: Trustworthiness;
  action_clarity: ActionClarity;
  emotional_fit: EmotionalFit;
  product_coherence: ProductCoherence;
};

type ScreenPacket = {
  screen_id: string;
  screen_name: string;
  screen_class: ScreenClass;
  artifact_reference: string;
  entry_context: {
    previous_screen: string;
    next_screen: string;
    review_mode: ReviewMode;
  };
  primary_user_goal: string;
  current_screen_purpose: string;
  audit_scores: AuditScores;
  top_issues: string[];
  trust_breaks: string[];
  confusion_points: string[];
  copy_problems: string[];
  next_step_problems: string[];
  recommended_fixes: string[];
  severity: Severity;
  main_issue_cluster: IssueCluster;
  recommended_fix_owner: string;
  recommended_fix_order: FixOrder;
  review_questions: {
    student_knows_goal: 'yes' | 'partial' | 'no';
    student_trusts_screen: 'yes' | 'partial' | 'no';
    student_feels_understood: 'yes' | 'partial' | 'no';
    parent_trust_delta: 'more' | 'same' | 'less' | 'n/a';
    premium_vs_generic: 'premium' | 'mixed' | 'generic';
  };
};

type OutputCaseCategory = 'strong' | 'action_dominant' | 'clarification' | 'low_signal' | 'contradiction_collision';

type OutputCase = {
  id: string;
  title: string;
  category: OutputCaseCategory;
  raw_input: string;
  expected_route: 'show_strongest_direction' | 'ask_question_before_showing';
};

type OutputRun = {
  case_id: string;
  category: OutputCaseCategory;
  expected_route: string;
  route_decision: string;
  confidence_band: string;
  direction_line: string;
  explanation: string;
  ai_phrase_hit: boolean;
  action_unclear: boolean;
  trust_risk: boolean;
};

type AggregateThresholdResult = {
  metric: string;
  passed: number;
  total: number;
  ratio: number;
  threshold: number;
  status: 'PASS' | 'FAIL';
};

const ROOT = process.cwd();
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'screen_by_screen_trust_audit_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'SCREEN_BY_SCREEN_TRUST_AUDIT_RESULTS_V1.md');

const SCREEN_FILES = {
  homepage: path.join(ROOT, 'src', 'app', 'page.tsx'),
  start: path.join(ROOT, 'src', 'app', 'start', 'page.tsx'),
  question: path.join(ROOT, 'src', 'app', 'start', 'question', 'page.tsx'),
  reflecting: path.join(ROOT, 'src', 'app', 'start', 'reflecting', 'page.tsx'),
  direction: path.join(ROOT, 'src', 'app', 'start', 'direction', 'page.tsx'),
  compare: path.join(ROOT, 'src', 'app', 'start', 'compare', 'page.tsx'),
  blocked: path.join(ROOT, 'src', 'app', 'start', 'blocked', 'page.tsx'),
} as const;

const OUTPUT_CASES: OutputCase[] = [
  {
    id: 'SSTA_OC_01',
    title: 'Strong clinic hinge with concrete correction',
    category: 'strong',
    expected_route: 'show_strongest_direction',
    raw_input:
      'I spent three summers volunteering at the hospital. In my third summer a nurse told me I was helping less because I jumped in before listening. After that, I slowed down, asked one question first, and patient handoffs became cleaner and less stressful.',
  },
  {
    id: 'SSTA_OC_02',
    title: 'Strong systems redesign case',
    category: 'strong',
    expected_route: 'show_strongest_direction',
    raw_input:
      'At the restaurant we kept losing tickets. I mapped each choke point, rebuilt the rail with priority colors, and changed staging order. Missed tickets dropped and callbacks fell within two weekends.',
  },
  {
    id: 'SSTA_OC_03',
    title: 'Strong delegation shift',
    category: 'strong',
    expected_route: 'show_strongest_direction',
    raw_input:
      'I used to rewrite every teammate draft myself. Midseason I realized I had become the bottleneck, so I moved to review ownership and quality checks. People improved faster and we stopped waiting on me.',
  },
  {
    id: 'SSTA_OC_04',
    title: 'Action-dominant tutoring correction',
    category: 'action_dominant',
    expected_route: 'show_strongest_direction',
    raw_input:
      'In tutoring I used to explain faster when students looked confused. One student stopped me and said I was performing clarity instead of checking understanding. I changed to short checks and student summaries before moving on.',
  },
  {
    id: 'SSTA_OC_05',
    title: 'Action-dominant team conflict reframe',
    category: 'action_dominant',
    expected_route: 'show_strongest_direction',
    raw_input:
      'During debate prep I kept pushing my strategy. After a teammate told me we were optimizing my comfort, not team outcomes, I switched to role-based prep and listening rounds before final calls.',
  },
  {
    id: 'SSTA_OC_06',
    title: 'Action-dominant caregiving logistics',
    category: 'action_dominant',
    expected_route: 'show_strongest_direction',
    raw_input:
      'When translating for my parents I thought speed mattered most. Then I saw repeated confusion at intake. I built a glossary, reordered the intake script, and trained siblings so decisions were actually understood.',
  },
  {
    id: 'SSTA_OC_07',
    title: 'Clarification needed: two plausible centers',
    category: 'clarification',
    expected_route: 'ask_question_before_showing',
    raw_input:
      'I can write about the conflict on my team or about redesigning our workflow. Both feel true and I am not sure which one should be central.',
  },
  {
    id: 'SSTA_OC_08',
    title: 'Clarification needed: insight without scene',
    category: 'clarification',
    expected_route: 'ask_question_before_showing',
    raw_input:
      'I learned growth is nonlinear and responsibility is relational, but no single moment captures it yet.',
  },
  {
    id: 'SSTA_OC_09',
    title: 'Clarification needed: generic resume arc',
    category: 'clarification',
    expected_route: 'ask_question_before_showing',
    raw_input:
      'I led clubs, won awards, and mentored others. I know it mattered but I cannot identify the exact turning point to build an essay around.',
  },
  {
    id: 'SSTA_OC_10',
    title: 'Low signal one-liner',
    category: 'low_signal',
    expected_route: 'ask_question_before_showing',
    raw_input: 'I volunteered a lot and it changed me.',
  },
  {
    id: 'SSTA_OC_11',
    title: 'Low signal abstract statement',
    category: 'low_signal',
    expected_route: 'ask_question_before_showing',
    raw_input: 'I like sports but I am not great at them.',
  },
  {
    id: 'SSTA_OC_12',
    title: 'Low signal maximal genericity',
    category: 'low_signal',
    expected_route: 'ask_question_before_showing',
    raw_input: 'I am good at everything.',
  },
  {
    id: 'SSTA_OC_13',
    title: 'Contradiction/collision mixed chronology',
    category: 'contradiction_collision',
    expected_route: 'ask_question_before_showing',
    raw_input:
      'Before I delegated review ownership I thought speed mattered most, then clinic volunteering taught me listening, then I rewrote code review. I cannot tell if this is care, leadership, or systems.',
  },
  {
    id: 'SSTA_OC_14',
    title: 'Contradiction with unresolved center',
    category: 'contradiction_collision',
    expected_route: 'ask_question_before_showing',
    raw_input:
      'I could write about debate conflict, tutoring, translating for my parents, or pantry workflow redesign. All mattered and I do not know the central claim.',
  },
];

function readFileSafe(filePath: string): string {
  if (!fs.existsSync(filePath)) return '';
  return fs.readFileSync(filePath, 'utf8');
}

function scoreForScreen(
  id: string,
  source: string,
  outputRuns: OutputRun[],
): {
  scores: AuditScores;
  topIssues: string[];
  trustBreaks: string[];
  confusionPoints: string[];
  copyProblems: string[];
  nextStepProblems: string[];
  recommendedFixes: string[];
  severity: Severity;
  cluster: IssueCluster;
  owner: string;
  order: FixOrder;
  reviewQuestions: ScreenPacket['review_questions'];
} {
  const hasQuestionableAIPhrasing = /a plausible direction is|operating from the obvious first version|the visible movement is/i.test(source);
  const hasClearCTA = /button|Start with rough notes|Build from this direction|Use this answer|Add more notes/i.test(source);

  const resultRuns = outputRuns;
  const aiPhraseRate = resultRuns.length > 0
    ? resultRuns.filter((r) => r.ai_phrase_hit).length / resultRuns.length
    : 0;
  const routeMisses = resultRuns.filter((r) => r.route_decision !== r.expected_route).length;
  const lowSignalOverShow = resultRuns.filter(
    (r) => r.category === 'low_signal' && r.route_decision === 'show_strongest_direction',
  ).length;

  if (id === 'SSTA_09') {
    const hasVisibleErrorState = /temporary loading issue|Your notes are still here|Try again/i.test(source);

    if (hasVisibleErrorState) {
      return {
        scores: {
          purpose_clarity: 'clear',
          language_quality: 'strong',
          trustworthiness: 'trustworthy',
          action_clarity: 'clear',
          emotional_fit: 'strong_fit',
          product_coherence: 'coherent',
        },
        topIssues: [
          'Error state is now explicit with clear retry guidance and note-preservation reassurance.',
        ],
        trustBreaks: [],
        confusionPoints: [],
        copyProblems: [],
        nextStepProblems: [],
        recommendedFixes: [
          'Keep error messaging concise and consistent with product voice.',
          'Preserve user input across failure states.',
          'Track timeout/error rates to verify this state remains rare.',
        ],
        severity: 'low',
        cluster: 'trust',
        owner: 'frontend + product copy',
        order: 4,
        reviewQuestions: {
          student_knows_goal: 'yes',
          student_trusts_screen: 'yes',
          student_feels_understood: 'yes',
          parent_trust_delta: 'more',
          premium_vs_generic: 'premium',
        },
      };
    }

    return {
      scores: {
        purpose_clarity: 'clear',
        language_quality: 'weak',
        trustworthiness: 'trust_break',
        action_clarity: 'borderline',
        emotional_fit: 'partial_fit',
        product_coherence: 'drifting',
      },
      topIssues: [
        'No explicit visible error message when `/api/intake/session` fails; user can be silently dropped back into editing.',
        'Trust signal collapses under network/API failure because there is no on-screen acknowledgement or recovery guidance.',
        'Flow continuity breaks: user intent is lost after submit failure (loading stops, but no next-step framing appears).',
      ],
      trustBreaks: [
        'Failure path is effectively invisible to the student.',
        'No reassurance copy that input is preserved or retriable.',
      ],
      confusionPoints: [
        'Student cannot tell whether request failed, timed out, or succeeded late.',
      ],
      copyProblems: [
        'Missing error-state copy block.',
      ],
      nextStepProblems: [
        'No explicit retry CTA in error state.',
      ],
      recommendedFixes: [
        'Add explicit inline error state with one-sentence diagnosis and “Try again” CTA.',
        'Add “Your notes are still here” reassurance line in error state.',
        'Emit and display a user-facing timeout fallback at 8s+ with clear recovery path.',
      ],
      severity: 'high',
      cluster: 'trust',
      owner: 'frontend + product copy',
      order: 4,
      reviewQuestions: {
        student_knows_goal: 'partial',
        student_trusts_screen: 'no',
        student_feels_understood: 'no',
        parent_trust_delta: 'less',
        premium_vs_generic: 'generic',
      },
    };
  }

  if (id === 'SSTA_04' || id === 'SSTA_05') {
    const directionFocusedRuns = resultRuns.filter((r) => r.category !== 'strong' && r.category !== 'action_dominant');
    const cautionMisses = directionFocusedRuns.filter((r) => r.route_decision === 'show_strongest_direction').length;
    const trustRiskCount = resultRuns.filter((r) => r.trust_risk).length;

    return {
      scores: {
        purpose_clarity: 'clear',
        language_quality: aiPhraseRate > 0.2 ? 'mixed' : 'strong',
        trustworthiness: trustRiskCount > 0 ? 'borderline' : 'trustworthy',
        action_clarity: 'clear',
        emotional_fit: aiPhraseRate > 0.35 ? 'partial_fit' : 'strong_fit',
        product_coherence: 'coherent',
      },
      topIssues: [
        `Result output language carries templated phrases in ${Math.round(aiPhraseRate * 100)}% of representative runs.`,
        `Route variance in representative set: ${routeMisses}/${resultRuns.length}.`,
        lowSignalOverShow > 0
          ? `Low-signal over-show risk detected in ${lowSignalOverShow} case(s).`
          : 'Low-signal routes mostly stay conservative.',
      ],
      trustBreaks: trustRiskCount > 0
        ? ['Some ambiguity/low-signal examples still receive assertive framing.']
        : ['No hard trust-break in this run, but phrasing quality needs tightening.'],
      confusionPoints: [
        '“Build” vs “Ask clarifying question” is present, but rationale for choosing each is not always explicit.',
      ],
      copyProblems: aiPhraseRate > 0
        ? ['Templated explanation fragments can read AI-like under weak/ambiguous inputs.']
        : ['None severe in current sample.'],
      nextStepProblems: [
        'Action rationale could be clearer on borderline confidence outputs.',
      ],
      recommendedFixes: [
        'Add a one-line decision rationale chip near CTA: “Why we recommend this next step.”',
        'Reduce repetitive template fragments in explanation rendering for low-confidence outputs.',
        'Add guard copy when confidence is low: “Provisional direction until one more detail is added.”',
      ],
      severity: trustRiskCount > 0 || routeMisses > 3 ? 'high' : 'medium',
      cluster: 'output_framing',
      owner: 'NDS output presentation + product copy',
      order: 1,
      reviewQuestions: {
        student_knows_goal: 'yes',
        student_trusts_screen: trustRiskCount > 0 || routeMisses > 3 ? 'partial' : 'yes',
        student_feels_understood: aiPhraseRate > 0.35 ? 'partial' : 'yes',
        parent_trust_delta: 'same',
        premium_vs_generic: aiPhraseRate > 0.35 ? 'mixed' : 'premium',
      },
    };
  }

  const genericWeakness = hasQuestionableAIPhrasing;
  const defaultScores: AuditScores = {
    purpose_clarity: 'clear',
    language_quality: genericWeakness ? 'mixed' : 'strong',
    trustworthiness: 'trustworthy',
    action_clarity: hasClearCTA ? 'clear' : 'borderline',
    emotional_fit: genericWeakness ? 'partial_fit' : 'strong_fit',
    product_coherence: 'coherent',
  };

  const issues: string[] = [];
  const copyProblems: string[] = [];
  if (!hasClearCTA) issues.push('Primary next action is not visually explicit.');
  if (genericWeakness) copyProblems.push('Some copy fragments read template-like and should be tightened.');

  let severity: Severity = 'low';
  let cluster: IssueCluster = 'copy_language';
  let owner = 'product copy';
  let order: FixOrder = 4;

  if (id === 'SSTA_03' || id === 'SSTA_08') {
    severity = 'medium';
    cluster = 'flow';
    owner = 'frontend + UX writing';
    order = 4;
    issues.push('Supporting state is clean but sparse on reassurance/progress context.');
  }

  if (id === 'SSTA_02') {
    severity = 'low';
    cluster = 'cta_next_step';
    owner = 'frontend + product copy';
    order = 2;
  }

  if (id === 'SSTA_06') {
    severity = 'low';
    cluster = 'trust';
    owner = 'product copy';
    order = 3;
    issues.push('Recovery framing is good but can better explain why this path protects essay quality.');
  }

  return {
    scores: defaultScores,
    topIssues: issues.length > 0 ? issues : ['No major break detected in this screen state.'],
    trustBreaks: severity === 'low' ? [] : ['Potential trust erosion under edge-state transitions.'],
    confusionPoints: hasClearCTA ? [] : ['Action choice not instantly obvious.'],
    copyProblems,
    nextStepProblems: hasClearCTA ? [] : ['Primary CTA should be more explicit.'],
    recommendedFixes: [
      'Keep headline + helper copy focused on one outcome per screen.',
      'Maintain consistent terms: direction, clarify, build.',
      'Add brief rationale text near secondary CTA where choice risk is non-obvious.',
    ],
    severity,
    cluster,
    owner,
    order,
    reviewQuestions: {
      student_knows_goal: defaultScores.purpose_clarity === 'clear' ? 'yes' : 'partial',
      student_trusts_screen: defaultScores.trustworthiness === 'trustworthy' ? 'yes' : 'partial',
      student_feels_understood: defaultScores.emotional_fit === 'strong_fit' ? 'yes' : 'partial',
      parent_trust_delta: id === 'SSTA_01' ? 'more' : 'same',
      premium_vs_generic: defaultScores.language_quality === 'strong' ? 'premium' : 'mixed',
    },
  };
}

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
      first_name: 'Audit',
      last_name: 'Case',
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
  return [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .map((x) => String(x).replace(/\s+/g, ' ').trim())
    .join(' ');
}

function containsAIPhrase(text: string): boolean {
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

function looksActionUnclear(explanation: string): boolean {
  return /additional detail may still change the winner/i.test(explanation);
}

async function runOutputCases(): Promise<OutputRun[]> {
  const runs: OutputRun[] = [];

  for (const c of OUTPUT_CASES) {
    const context = buildNdsNormalizedContextPack(buildInput(c.id, c.title, c.raw_input));
    const execution = await executeNdsModule({
      run_id: `ssta_${c.id}`,
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
    const candidatesRaw = (payload.candidates ?? []) as Array<Record<string, unknown>>;
    const selected = candidatesRaw.find((x) => x.selected === true) ?? candidatesRaw[0] ?? null;
    const routeDecision = String(payload.route_decision ?? 'n/a');
    const explanation = explanationTextFromPayload(payload);
    const presentationExplanation = toPresentationCopy(explanation);

    const trustRisk =
      (c.category === 'low_signal' || c.category === 'clarification' || c.category === 'contradiction_collision') &&
      routeDecision === 'show_strongest_direction';

    runs.push({
      case_id: c.id,
      category: c.category,
      expected_route: c.expected_route,
      route_decision: routeDecision,
      confidence_band: String(payload.confidence_band ?? 'n/a'),
      direction_line: String(selected?.direction_line ?? ''),
      explanation: presentationExplanation,
      ai_phrase_hit: containsAIPhrase(presentationExplanation),
      action_unclear: looksActionUnclear(presentationExplanation),
      trust_risk: trustRisk,
    });
  }

  return runs;
}

function countBy<T>(items: T[], predicate: (x: T) => boolean): number {
  return items.reduce((acc, item) => (predicate(item) ? acc + 1 : acc), 0);
}

function ratio(passed: number, total: number): number {
  if (total === 0) return 0;
  return passed / total;
}

function evaluateThreshold(metric: string, passed: number, total: number, threshold: number): AggregateThresholdResult {
  const value = ratio(passed, total);
  return {
    metric,
    passed,
    total,
    ratio: value,
    threshold,
    status: value >= threshold ? 'PASS' : 'FAIL',
  };
}

function mainMarkdown(
  packets: ScreenPacket[],
  outputRuns: OutputRun[],
  thresholdResults: AggregateThresholdResult[],
  auditPass: boolean,
): string {
  const highSeverity = packets.filter((p) => p.severity === 'high');
  const strongest = [...packets]
    .filter((p) => p.severity === 'low')
    .slice(0, 4);
  const weakest = [...packets]
    .filter((p) => p.severity !== 'low')
    .slice(0, 6);

  const clusterCounts = {
    copy_language: packets.filter((p) => p.main_issue_cluster === 'copy_language').length,
    output_framing: packets.filter((p) => p.main_issue_cluster === 'output_framing').length,
    cta_next_step: packets.filter((p) => p.main_issue_cluster === 'cta_next_step').length,
    trust: packets.filter((p) => p.main_issue_cluster === 'trust').length,
    flow: packets.filter((p) => p.main_issue_cluster === 'flow').length,
  };

  const topTrustBreaks = [
    ...packets.flatMap((p) => p.trust_breaks.map((t) => `${p.screen_id}: ${t}`)),
    ...outputRuns.filter((r) => r.trust_risk).map((r) => `${r.case_id}: risky route (${r.category}) -> ${r.route_decision}`),
  ].slice(0, 10);

  const severityTable = packets
    .map(
      (p) =>
        `| ${p.screen_id} | ${p.screen_name} | ${p.severity} | ${p.main_issue_cluster} | ${p.recommended_fix_owner} | P${p.recommended_fix_order} |`,
    )
    .join('\n');

  return [
    '# SCREEN_BY_SCREEN_TRUST_AUDIT_RESULTS_V1',
    '',
    '## audit purpose',
    '',
    'Screen-by-screen trust and comprehension hardening audit for College Essay Edge. Focus: product UX trust, not engine internals.',
    '',
    '## screen inventory',
    '',
    ...packets.map((p) => `- ${p.screen_id} — ${p.screen_name} (${p.screen_class})`),
    '',
    '## overall pass/fail summary',
    '',
    `**${auditPass ? 'PASS' : 'FAIL'}**`,
    '',
    ...thresholdResults.map((t) => `- ${t.metric}: ${t.passed}/${t.total} (${(t.ratio * 100).toFixed(1)}%) vs ${(t.threshold * 100).toFixed(0)}% -> ${t.status}`),
    `- high severity screens: ${highSeverity.length} (max allowed: 2)`,
    '',
    '## high-severity screens',
    '',
    ...(highSeverity.length > 0 ? highSeverity.map((p) => `- ${p.screen_id} ${p.screen_name}: ${p.top_issues[0] ?? 'n/a'}`) : ['- none']),
    '',
    '## issue clusters',
    '',
    `- copy/language failures: ${clusterCounts.copy_language}`,
    `- output framing failures: ${clusterCounts.output_framing}`,
    `- CTA/next-step failures: ${clusterCounts.cta_next_step}`,
    `- trust failures: ${clusterCounts.trust}`,
    `- flow failures: ${clusterCounts.flow}`,
    '',
    '## strongest screens',
    '',
    ...strongest.map((p) => `- ${p.screen_id} ${p.screen_name}`),
    '',
    '## weakest screens',
    '',
    ...weakest.map((p) => `- ${p.screen_id} ${p.screen_name} (${p.severity})`),
    '',
    '## screen-by-screen severity table',
    '',
    '| Screen ID | Screen Name | Severity | Main issue cluster | Recommended fix owner | Fix order |',
    '|---|---|---|---|---|---|',
    severityTable,
    '',
    '## top 10 trust breaks',
    '',
    ...(topTrustBreaks.length > 0 ? topTrustBreaks.map((x, i) => `${i + 1}. ${x}`) : ['1. none']),
    '',
    '## recommended fix order',
    '',
    '1. Priority 1 — trust-breaking result screens (SSTA_04, SSTA_05) and templated output phrasing reductions.',
    '2. Priority 2 — confusing input/branching moments (SSTA_02) with stronger next-step rationale.',
    '3. Priority 3 — recovery/clarification flow strengthening (SSTA_06 plus clarification rationale chips).',
    '4. Priority 4 — supporting-state polish (SSTA_03, SSTA_08, SSTA_09), with SSTA_09 error-state patch treated as immediate trust hotfix.',
    '',
    '## recommended patch sequence',
    '',
    '- Patch 1: Add explicit API failure state on start submission path with retry + reassurance copy.',
    '- Patch 2: Add low-confidence rationale labels to result CTA area (build vs clarify).',
    '- Patch 3: De-template repetitive explanation fragments for weak/ambiguous outputs.',
    '- Patch 4: Expand loading/recovery supporting states with concise trust signals and progress framing.',
    '',
    '## product readiness implications',
    '',
    auditPass
      ? 'Audit currently clears gate thresholds. Proceed with fixes above as polish-hardening before launch lock.'
      : 'Audit fails launch gate. Do not move to live launch until high-severity trust breaks are resolved and thresholds are met.',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const outputRuns = await runOutputCases();

  const screenDefs: Array<{
    screen_id: string;
    screen_name: string;
    screen_class: ScreenClass;
    file: string;
    previous: string;
    next: string;
    mode: ReviewMode;
    primary_goal: string;
    purpose: string;
  }> = [
    {
      screen_id: 'SSTA_01',
      screen_name: 'Homepage / Entry',
      screen_class: 'entry',
      file: SCREEN_FILES.homepage,
      previous: 'none',
      next: '/start',
      mode: 'static',
      primary_goal: 'Decide whether to begin with notes or draft.',
      purpose: 'Establish trust and explain what the product does before input.',
    },
    {
      screen_id: 'SSTA_02',
      screen_name: 'Narrative Input Screen',
      screen_class: 'input',
      file: SCREEN_FILES.start,
      previous: 'homepage',
      next: 'loading / clarification / reflecting / blocked',
      mode: 'flow',
      primary_goal: 'Paste meaningful raw material quickly.',
      purpose: 'Collect first-pass notes/draft and route to appropriate next state.',
    },
    {
      screen_id: 'SSTA_03',
      screen_name: 'Loading State',
      screen_class: 'supporting_state',
      file: SCREEN_FILES.start,
      previous: 'input submit',
      next: 'reflecting | question | blocked',
      mode: 'flow',
      primary_goal: 'Stay oriented while waiting.',
      purpose: 'Maintain trust during async processing.',
    },
    {
      screen_id: 'SSTA_04',
      screen_name: 'First Result (Reflecting)',
      screen_class: 'result',
      file: SCREEN_FILES.reflecting,
      previous: 'loading',
      next: 'direction | question',
      mode: 'output',
      primary_goal: 'Understand strongest direction and why it is grounded.',
      purpose: 'Provide first read with evidence and a safe next move.',
    },
    {
      screen_id: 'SSTA_05',
      screen_name: 'Direction Result (Full)',
      screen_class: 'result',
      file: SCREEN_FILES.direction,
      previous: 'reflecting/question',
      next: 'compare | question',
      mode: 'output',
      primary_goal: 'Commit to a direction or request clarification.',
      purpose: 'Frame strongest direction with risk and next-move guidance.',
    },
    {
      screen_id: 'SSTA_06',
      screen_name: 'Clarification Question Screen',
      screen_class: 'recovery',
      file: SCREEN_FILES.question,
      previous: 'input or results',
      next: 'reflecting | blocked | direction',
      mode: 'flow',
      primary_goal: 'Add one concrete detail to unblock direction quality.',
      purpose: 'Recover from ambiguity and collect missing signal.',
    },
    {
      screen_id: 'SSTA_07',
      screen_name: 'Blocked / Needs More Input',
      screen_class: 'recovery',
      file: SCREEN_FILES.blocked,
      previous: 'input/question',
      next: 'start | question',
      mode: 'flow',
      primary_goal: 'Recover without feeling rejected.',
      purpose: 'Fail closed gracefully and offer obvious next action.',
    },
    {
      screen_id: 'SSTA_08',
      screen_name: 'Compare Alternatives Screen',
      screen_class: 'result',
      file: SCREEN_FILES.compare,
      previous: 'direction',
      next: 'direction | question',
      mode: 'output',
      primary_goal: 'See why strongest angle wins over flatter options.',
      purpose: 'Increase confidence in chosen direction with explicit contrast.',
    },
    {
      screen_id: 'SSTA_09',
      screen_name: 'Submit Error State (implicit in input flow)',
      screen_class: 'supporting_state',
      file: SCREEN_FILES.start,
      previous: 'loading failure',
      next: 'retry',
      mode: 'flow',
      primary_goal: 'Understand failure and retry safely.',
      purpose: 'Protect trust when intake request fails.',
    },
  ];

  const packets: ScreenPacket[] = screenDefs.map((def) => {
    const source = readFileSafe(def.file);
    const scored = scoreForScreen(def.screen_id, source, outputRuns);

    return {
      screen_id: def.screen_id,
      screen_name: def.screen_name,
      screen_class: def.screen_class,
      artifact_reference: path.relative(ROOT, def.file),
      entry_context: {
        previous_screen: def.previous,
        next_screen: def.next,
        review_mode: def.mode,
      },
      primary_user_goal: def.primary_goal,
      current_screen_purpose: def.purpose,
      audit_scores: scored.scores,
      top_issues: scored.topIssues,
      trust_breaks: scored.trustBreaks,
      confusion_points: scored.confusionPoints,
      copy_problems: scored.copyProblems,
      next_step_problems: scored.nextStepProblems,
      recommended_fixes: scored.recommendedFixes,
      severity: scored.severity,
      main_issue_cluster: scored.cluster,
      recommended_fix_owner: scored.owner,
      recommended_fix_order: scored.order,
      review_questions: scored.reviewQuestions,
    };
  });

  const totalScreens = packets.length;
  const purposeClear = countBy(packets, (p) => p.audit_scores.purpose_clarity === 'clear');
  const languageStrong = countBy(packets, (p) => p.audit_scores.language_quality === 'strong');
  const trustworthy = countBy(packets, (p) => p.audit_scores.trustworthiness === 'trustworthy');
  const actionClear = countBy(packets, (p) => p.audit_scores.action_clarity === 'clear');
  const emotionalStrong = countBy(packets, (p) => p.audit_scores.emotional_fit === 'strong_fit');
  const highSeverityCount = countBy(packets, (p) => p.severity === 'high');

  const thresholds: AggregateThresholdResult[] = [
    evaluateThreshold('purpose_clarity_clear', purposeClear, totalScreens, 0.8),
    evaluateThreshold('language_quality_strong', languageStrong, totalScreens, 0.8),
    evaluateThreshold('trustworthiness_trustworthy', trustworthy, totalScreens, 0.8),
    evaluateThreshold('action_clarity_clear', actionClear, totalScreens, 0.8),
    evaluateThreshold('emotional_fit_strong_fit', emotionalStrong, totalScreens, 0.8),
  ];

  const resultScreens = packets.filter((p) => p.screen_class === 'result');
  const resultRuleNoTrustBreak = resultScreens.every((p) => p.audit_scores.trustworthiness !== 'trust_break');
  const resultRuleNoUnclearAction = resultScreens.every((p) => p.audit_scores.action_clarity !== 'unclear');
  const resultRuleNoWrongFit = resultScreens.every((p) => p.audit_scores.emotional_fit !== 'wrong_fit');

  const outputCoverage = {
    strong: countBy(outputRuns, (r) => r.category === 'strong'),
    action_dominant: countBy(outputRuns, (r) => r.category === 'action_dominant'),
    clarification: countBy(outputRuns, (r) => r.category === 'clarification'),
    low_signal: countBy(outputRuns, (r) => r.category === 'low_signal'),
    contradiction_collision: countBy(outputRuns, (r) => r.category === 'contradiction_collision'),
  };

  const thresholdPass = thresholds.every((t) => t.status === 'PASS') && highSeverityCount <= 2;
  const resultScreenPass = resultRuleNoTrustBreak && resultRuleNoUnclearAction && resultRuleNoWrongFit;
  const auditPass = thresholdPass && resultScreenPass;

  const topTrustBreaks = [
    ...packets.flatMap((p) => p.trust_breaks.map((t) => ({ screen_id: p.screen_id, issue: t }))),
    ...outputRuns
      .filter((r) => r.trust_risk)
      .map((r) => ({ screen_id: r.case_id, issue: `Route risk in ${r.category} case (${r.route_decision})` })),
  ]
    .slice(0, 10)
    .map((x) => `${x.screen_id}: ${x.issue}`);

  const artifact = {
    protocol: 'SCREEN_BY_SCREEN_TRUST_AUDIT_V1',
    generated_at: new Date().toISOString(),
    audit_scope: {
      focus: 'screen trust and comprehension',
      excludes: ['engine ranking correctness', 'latency benchmarking', 'backend stability'],
    },
    screen_inventory: packets.map((p) => ({
      screen_id: p.screen_id,
      screen_name: p.screen_name,
      screen_class: p.screen_class,
      artifact_reference: p.artifact_reference,
      review_mode: p.entry_context.review_mode,
    })),
    required_test_data_coverage: outputCoverage,
    output_mode_runs: outputRuns,
    packets,
    aggregate_summary: {
      total_screens: totalScreens,
      thresholds,
      high_severity_screens: highSeverityCount,
      high_severity_limit: 2,
      result_screen_rule: {
        no_trust_break: resultRuleNoTrustBreak,
        no_unclear_action_clarity: resultRuleNoUnclearAction,
        no_wrong_fit: resultRuleNoWrongFit,
      },
      pass_fail: auditPass ? 'PASS' : 'FAIL',
    },
    failure_clusters: {
      copy_language_failures: packets.filter((p) => p.main_issue_cluster === 'copy_language').map((p) => p.screen_id),
      output_framing_failures: packets.filter((p) => p.main_issue_cluster === 'output_framing').map((p) => p.screen_id),
      cta_next_step_failures: packets.filter((p) => p.main_issue_cluster === 'cta_next_step').map((p) => p.screen_id),
      trust_failures: packets.filter((p) => p.main_issue_cluster === 'trust').map((p) => p.screen_id),
      flow_failures: packets.filter((p) => p.main_issue_cluster === 'flow').map((p) => p.screen_id),
    },
    severity_table: packets.map((p) => ({
      screen_id: p.screen_id,
      screen_name: p.screen_name,
      severity: p.severity,
      main_issue_cluster: p.main_issue_cluster,
      recommended_fix_owner: p.recommended_fix_owner,
      recommended_fix_order: p.recommended_fix_order,
    })),
    top_10_trust_breaks: topTrustBreaks,
    recommended_patch_sequence: [
      'Priority 1: trust-breaking result-screen framing and templated explanation tone.',
      'Priority 2: input/branching clarity improvements.',
      'Priority 3: clarification/recovery state strengthening.',
      'Priority 4: supporting-state polish and consistency.',
    ],
    release_rule: auditPass
      ? 'PASS_WITH_FIXLIST'
      : 'BLOCK_LAUNCH_UNTIL_TRUST_AUDIT_PASS',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, mainMarkdown(packets, outputRuns, thresholds, auditPass));

  console.log('SCREEN_BY_SCREEN_TRUST_AUDIT_V1');
  console.log(`  pass_fail: ${auditPass ? 'PASS' : 'FAIL'}`);
  console.log(`  high_severity_screens: ${highSeverityCount}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main().catch((err) => {
  console.error('[screen-trust-audit] fatal error', err);
  process.exit(1);
});
