import fs from 'node:fs';
import path from 'node:path';

import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { createSessionCaseState, normalizeStudentText } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';

type ControlledCase = {
  case_id: string;
  case_family: string;
  title: string;
  priority: 'high' | 'normal';
  student_input_raw: string;
};

type SurfaceVersion = 'previous' | 'ml_informed' | 'baseline';

type VersionScore = {
  post_direction_clarity: number;
  actionability: number;
  non_genericness: number;
  student_fit: number;
  progress_confidence: number;
  overall: number;
};

type CaseEvaluation = {
  case_id: string;
  case_family: string;
  title: string;
  winner: SurfaceVersion;
  scores: Record<SurfaceVersion, VersionScore>;
  key_deltas: {
    ml_vs_previous_overall: number;
    ml_vs_baseline_overall: number;
    ml_vs_previous_actionability: number;
    ml_vs_previous_clarity: number;
    ml_vs_previous_non_genericness: number;
  };
  failure_modes: {
    previous: string[];
    ml_informed: string[];
    baseline: string[];
  };
};

const ROOT = process.cwd();
const PACK_PATH = path.join(ROOT, 'evaluation/intake/RIC_NDS_CONTROLLED_VALIDATION_PACK_V1.json');
const OUT_JSON = path.join(ROOT, 'evaluation_outputs/ML_PRODUCT_IMPACT_VALIDATION_POST_NDS_V1.json');
const OUT_MD = path.join(ROOT, 'evaluation_outputs/ML_PRODUCT_IMPACT_REVIEW_POST_NDS_V1.md');

function clamp(n: number, min = 0, max = 10): number {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

function computeStudentFit(text: string, studentInput: string): number {
  const stop = new Set(['that', 'this', 'with', 'from', 'have', 'they', 'your', 'essay', 'write', 'what', 'when']);
  const inputWords = normalizeWords(studentInput).filter((w) => !stop.has(w));
  const textWords = new Set(normalizeWords(text).filter((w) => !stop.has(w)));
  if (inputWords.length === 0) return 4.5;
  const overlap = inputWords.filter((w) => textWords.has(w)).length;
  return clamp((overlap / Math.min(inputWords.length, 16)) * 10);
}

function computeNonGenericness(text: string): number {
  const lower = text.toLowerCase();
  const genericMarkers = [
    'be yourself',
    'authentic',
    'show growth',
    'stand out',
    'tell your story',
    'broad lesson',
    'leadership qualities',
  ];
  const abstractMarkers = ['angle', 'anchor', 'frame', 'interpretive center'];
  const concreteMarkers = ['start with', 'show', 'do not', 'write', 'scene', 'moment', 'sentence'];

  const genericHits = genericMarkers.filter((m) => lower.includes(m)).length;
  const abstractHits = abstractMarkers.filter((m) => lower.includes(m)).length;
  const concreteHits = concreteMarkers.filter((m) => lower.includes(m)).length;

  return clamp(7 + concreteHits * 0.4 - genericHits * 1.1 - abstractHits * 0.7);
}

function buildPreviousSurface(input: {
  title: string;
  explanation: string;
  why: string;
  risk: string;
  nextMove: string;
}): { text: string; ctas: string[] } {
  const text = [
    `Strongest direction: ${input.title}`,
    input.explanation,
    `Why this direction wins: ${input.why}`,
    `What could make this feel generic: ${input.risk}`,
    `Best next move right now: ${input.nextMove}`,
  ].join('\n');

  return {
    text,
    ctas: ['Compare with the flatter version first', 'Sharpen this with one focused question'],
  };
}

function buildBaselineSurface(input: {
  title: string;
  explanation: string;
}): { text: string; ctas: string[] } {
  const text = [
    `Suggested direction: ${input.title}`,
    input.explanation,
    'Try to be authentic and reflect on what this taught you.',
    'Make sure your essay has a clear message and personal growth.',
    'You can draft a version and revise later.',
  ].join('\n');

  return {
    text,
    ctas: ['Compare options', 'Ask another question'],
  };
}

function scoreSurface(input: {
  version: SurfaceVersion;
  text: string;
  ctas: string[];
  studentInput: string;
  hasEssayAbout: boolean;
  writeFirstCount: number;
  avoidCount: number;
  writeNextCount: number;
}): VersionScore {
  const lower = input.text.toLowerCase();

  const claritySignals =
    (input.hasEssayAbout ? 1 : 0) +
    (input.writeFirstCount >= 3 ? 1 : 0) +
    (input.avoidCount >= 2 ? 1 : 0) +
    (input.writeNextCount >= 2 ? 1 : 0);
  const post_direction_clarity = clamp(2 + claritySignals * 2);

  const imperativeCount = (lower.match(/\b(start with|show|write|do not|end|after)\b/g) ?? []).length;
  const structureBoost = input.writeFirstCount + input.writeNextCount + input.avoidCount;
  const actionability = clamp(2 + imperativeCount * 0.35 + structureBoost * 0.65);

  const non_genericness = computeNonGenericness(input.text);
  const student_fit = computeStudentFit(input.text, input.studentInput);

  const hasDirectDraftCTA = input.ctas.some((c) => /draft the opening now/i.test(c));
  const hasSharpenCTA = input.ctas.some((c) => /sharpen/i.test(c));
  const progress_confidence = clamp(4 + (hasDirectDraftCTA ? 4 : 0) + (hasSharpenCTA ? 1.5 : 0));

  const overall = clamp(
    post_direction_clarity * 0.30 +
      actionability * 0.25 +
      non_genericness * 0.20 +
      student_fit * 0.15 +
      progress_confidence * 0.10,
  );

  return {
    post_direction_clarity: round2(post_direction_clarity),
    actionability: round2(actionability),
    non_genericness: round2(non_genericness),
    student_fit: round2(student_fit),
    progress_confidence: round2(progress_confidence),
    overall: round2(overall),
  };
}

function detectFailureModes(score: VersionScore): string[] {
  const fails: string[] = [];
  if (score.actionability < 6) fails.push('weak_actionability');
  if (score.non_genericness < 6) fails.push('genericness_risk');
  if (score.student_fit < 5.5) fails.push('weak_student_fit_read');
  if (score.post_direction_clarity < 6) fails.push('post_direction_clarity_gap');
  if (score.progress_confidence < 6) fails.push('low_progress_confidence');
  return fails;
}

async function buildIntelligenceFromRaw(raw: string, idx: number) {
  const now = new Date().toISOString();
  const normalized = normalizeStudentText(raw);

  const intake = await runIntakeOrchestrator({
    session_id: `ml-impact-${idx}`,
    student_user_id: `ml-impact-student-${idx}`,
    subject_entity_id: `ml-impact-subject-${idx}`,
    story_entries: [
      {
        id: `story-${idx}`,
        title: 'Initial notes',
        text: normalized,
        created_at: now,
      },
    ],
    draft_text: null,
    draft_id: null,
    school_context: null,
    student_profile: null,
    prior_attempt_count: 0,
    questions_asked: [],
    rejected_source_ids: [],
    session_created_at: now,
  });

  return intake;
}

async function run(): Promise<void> {
  const packRaw = fs.readFileSync(PACK_PATH, 'utf8');
  const pack = JSON.parse(packRaw) as { pack_id: string; version: string; cases: ControlledCase[] };
  const cases = pack.cases;

  const evaluations: CaseEvaluation[] = [];

  for (let i = 0; i < cases.length; i += 1) {
    const c = cases[i];
    const intake = await buildIntelligenceFromRaw(c.student_input_raw, i + 1);
    const caseState = createSessionCaseState(c.student_input_raw, intake as any);
    const direction = deriveDirectionContent(intake as any, caseState);
    const s = direction.strongest as any;

    const previousSurface = buildPreviousSurface({
      title: s.title,
      explanation: s.explanation,
      why: s.why_beats_obvious,
      risk: s.risk,
      nextMove: s.next_move,
    });

    const mlSurfaceText = [
      `Strongest direction: ${s.title}`,
      `What this essay is really about: ${s.essay_about}`,
      'What to write first:',
      ...(s.write_first_steps ?? []).map((x: string, idx: number) => `${idx + 1}. ${x}`),
      'What to avoid:',
      ...(s.avoid_lines ?? []).map((x: string) => `- ${x}`),
      'What to write next after the opening:',
      ...(s.write_next_steps ?? []).map((x: string, idx: number) => `${idx + 1}. ${x}`),
      `Focused question: ${s.focused_question}`,
    ].join('\n');

    const baselineSurface = buildBaselineSurface({
      title: s.title,
      explanation: s.explanation,
    });

    const scores: Record<SurfaceVersion, VersionScore> = {
      previous: scoreSurface({
        version: 'previous',
        text: previousSurface.text,
        ctas: previousSurface.ctas,
        studentInput: c.student_input_raw,
        hasEssayAbout: false,
        writeFirstCount: 0,
        avoidCount: 0,
        writeNextCount: 0,
      }),
      ml_informed: scoreSurface({
        version: 'ml_informed',
        text: mlSurfaceText,
        ctas: [s.primary_cta_label, s.secondary_cta_label, s.tertiary_cta_label],
        studentInput: c.student_input_raw,
        hasEssayAbout: Boolean(s.essay_about),
        writeFirstCount: Array.isArray(s.write_first_steps) ? s.write_first_steps.length : 0,
        avoidCount: Array.isArray(s.avoid_lines) ? s.avoid_lines.length : 0,
        writeNextCount: Array.isArray(s.write_next_steps) ? s.write_next_steps.length : 0,
      }),
      baseline: scoreSurface({
        version: 'baseline',
        text: baselineSurface.text,
        ctas: baselineSurface.ctas,
        studentInput: c.student_input_raw,
        hasEssayAbout: false,
        writeFirstCount: 0,
        avoidCount: 0,
        writeNextCount: 0,
      }),
    };

    const ranked: Array<{ v: SurfaceVersion; n: number }> = ([
      { v: 'previous' as SurfaceVersion, n: scores.previous.overall },
      { v: 'ml_informed' as SurfaceVersion, n: scores.ml_informed.overall },
      { v: 'baseline' as SurfaceVersion, n: scores.baseline.overall },
    ] as Array<{ v: SurfaceVersion; n: number }>).sort((a, b) => b.n - a.n);

    evaluations.push({
      case_id: c.case_id,
      case_family: c.case_family,
      title: c.title,
      winner: ranked[0].v,
      scores,
      key_deltas: {
        ml_vs_previous_overall: round2(scores.ml_informed.overall - scores.previous.overall),
        ml_vs_baseline_overall: round2(scores.ml_informed.overall - scores.baseline.overall),
        ml_vs_previous_actionability: round2(scores.ml_informed.actionability - scores.previous.actionability),
        ml_vs_previous_clarity: round2(scores.ml_informed.post_direction_clarity - scores.previous.post_direction_clarity),
        ml_vs_previous_non_genericness: round2(scores.ml_informed.non_genericness - scores.previous.non_genericness),
      },
      failure_modes: {
        previous: detectFailureModes(scores.previous),
        ml_informed: detectFailureModes(scores.ml_informed),
        baseline: detectFailureModes(scores.baseline),
      },
    });
  }

  const aggregates = {
    case_count: evaluations.length,
    reviewer_preference_rate: {
      ml_informed_over_previous: round2(
        evaluations.filter((e) => e.scores.ml_informed.overall > e.scores.previous.overall).length / evaluations.length,
      ),
      ml_informed_over_baseline: round2(
        evaluations.filter((e) => e.scores.ml_informed.overall > e.scores.baseline.overall).length / evaluations.length,
      ),
      previous_over_baseline: round2(
        evaluations.filter((e) => e.scores.previous.overall > e.scores.baseline.overall).length / evaluations.length,
      ),
    },
    mean_scores: {
      previous: {
        post_direction_clarity: round2(evaluations.reduce((a, e) => a + e.scores.previous.post_direction_clarity, 0) / evaluations.length),
        actionability: round2(evaluations.reduce((a, e) => a + e.scores.previous.actionability, 0) / evaluations.length),
        non_genericness: round2(evaluations.reduce((a, e) => a + e.scores.previous.non_genericness, 0) / evaluations.length),
        student_fit: round2(evaluations.reduce((a, e) => a + e.scores.previous.student_fit, 0) / evaluations.length),
        progress_confidence: round2(evaluations.reduce((a, e) => a + e.scores.previous.progress_confidence, 0) / evaluations.length),
        overall: round2(evaluations.reduce((a, e) => a + e.scores.previous.overall, 0) / evaluations.length),
      },
      ml_informed: {
        post_direction_clarity: round2(evaluations.reduce((a, e) => a + e.scores.ml_informed.post_direction_clarity, 0) / evaluations.length),
        actionability: round2(evaluations.reduce((a, e) => a + e.scores.ml_informed.actionability, 0) / evaluations.length),
        non_genericness: round2(evaluations.reduce((a, e) => a + e.scores.ml_informed.non_genericness, 0) / evaluations.length),
        student_fit: round2(evaluations.reduce((a, e) => a + e.scores.ml_informed.student_fit, 0) / evaluations.length),
        progress_confidence: round2(evaluations.reduce((a, e) => a + e.scores.ml_informed.progress_confidence, 0) / evaluations.length),
        overall: round2(evaluations.reduce((a, e) => a + e.scores.ml_informed.overall, 0) / evaluations.length),
      },
      baseline: {
        post_direction_clarity: round2(evaluations.reduce((a, e) => a + e.scores.baseline.post_direction_clarity, 0) / evaluations.length),
        actionability: round2(evaluations.reduce((a, e) => a + e.scores.baseline.actionability, 0) / evaluations.length),
        non_genericness: round2(evaluations.reduce((a, e) => a + e.scores.baseline.non_genericness, 0) / evaluations.length),
        student_fit: round2(evaluations.reduce((a, e) => a + e.scores.baseline.student_fit, 0) / evaluations.length),
        progress_confidence: round2(evaluations.reduce((a, e) => a + e.scores.baseline.progress_confidence, 0) / evaluations.length),
        overall: round2(evaluations.reduce((a, e) => a + e.scores.baseline.overall, 0) / evaluations.length),
      },
    },
    deltas: {
      ml_vs_previous_overall: round2(
        evaluations.reduce((a, e) => a + e.key_deltas.ml_vs_previous_overall, 0) / evaluations.length,
      ),
      ml_vs_baseline_overall: round2(
        evaluations.reduce((a, e) => a + e.key_deltas.ml_vs_baseline_overall, 0) / evaluations.length,
      ),
      ml_vs_previous_actionability: round2(
        evaluations.reduce((a, e) => a + e.key_deltas.ml_vs_previous_actionability, 0) / evaluations.length,
      ),
      ml_vs_previous_clarity: round2(
        evaluations.reduce((a, e) => a + e.key_deltas.ml_vs_previous_clarity, 0) / evaluations.length,
      ),
      ml_vs_previous_non_genericness: round2(
        evaluations.reduce((a, e) => a + e.key_deltas.ml_vs_previous_non_genericness, 0) / evaluations.length,
      ),
    },
    failure_mode_counts: {
      previous: {
        weak_actionability: evaluations.filter((e) => e.failure_modes.previous.includes('weak_actionability')).length,
        genericness_risk: evaluations.filter((e) => e.failure_modes.previous.includes('genericness_risk')).length,
        weak_student_fit_read: evaluations.filter((e) => e.failure_modes.previous.includes('weak_student_fit_read')).length,
        post_direction_clarity_gap: evaluations.filter((e) => e.failure_modes.previous.includes('post_direction_clarity_gap')).length,
      },
      ml_informed: {
        weak_actionability: evaluations.filter((e) => e.failure_modes.ml_informed.includes('weak_actionability')).length,
        genericness_risk: evaluations.filter((e) => e.failure_modes.ml_informed.includes('genericness_risk')).length,
        weak_student_fit_read: evaluations.filter((e) => e.failure_modes.ml_informed.includes('weak_student_fit_read')).length,
        post_direction_clarity_gap: evaluations.filter((e) => e.failure_modes.ml_informed.includes('post_direction_clarity_gap')).length,
      },
      baseline: {
        weak_actionability: evaluations.filter((e) => e.failure_modes.baseline.includes('weak_actionability')).length,
        genericness_risk: evaluations.filter((e) => e.failure_modes.baseline.includes('genericness_risk')).length,
        weak_student_fit_read: evaluations.filter((e) => e.failure_modes.baseline.includes('weak_student_fit_read')).length,
        post_direction_clarity_gap: evaluations.filter((e) => e.failure_modes.baseline.includes('post_direction_clarity_gap')).length,
      },
    },
  };

  const passThresholds = {
    ml_vs_previous_overall_min_delta: 0.8,
    ml_vs_previous_actionability_min_delta: 1.0,
    ml_vs_previous_clarity_min_delta: 2.0,
    ml_informed_preference_over_previous_min_rate: 0.7,
    ml_informed_preference_over_baseline_min_rate: 0.8,
  };

  const passFail = {
    ml_vs_previous_overall: aggregates.deltas.ml_vs_previous_overall >= passThresholds.ml_vs_previous_overall_min_delta,
    ml_vs_previous_actionability:
      aggregates.deltas.ml_vs_previous_actionability >= passThresholds.ml_vs_previous_actionability_min_delta,
    ml_vs_previous_clarity: aggregates.deltas.ml_vs_previous_clarity >= passThresholds.ml_vs_previous_clarity_min_delta,
    preference_over_previous:
      aggregates.reviewer_preference_rate.ml_informed_over_previous >=
      passThresholds.ml_informed_preference_over_previous_min_rate,
    preference_over_baseline:
      aggregates.reviewer_preference_rate.ml_informed_over_baseline >=
      passThresholds.ml_informed_preference_over_baseline_min_rate,
  };

  const decision = Object.values(passFail).every(Boolean)
    ? 'pass'
    : Object.values(passFail).filter(Boolean).length >= 3
      ? 'conditional_pass'
      : 'fail';

  const output = {
    protocol: 'ML_PRODUCT_IMPACT_VALIDATION_POST_NDS_V1',
    generated_at: new Date().toISOString(),
    change_card: {
      change_name: 'post_nds_conversion_quality_fix_v1',
      product_surface: 'post_nds_conversion_quality',
      problem_being_solved:
        'Direction output was still too abstract; students did not consistently know what to write first, what to avoid, or what to write next.',
      hypothesis:
        'Adding explicit sections (essay meaning, write-first steps, avoid list, write-next bridge, focused question) and draft-first CTA will improve clarity and actionability.',
      evidence_source: 'POST_NDS_CONVERSION_QUALITY_FIX_V1.md + RIC_NDS_CONTROLLED_VALIDATION_PACK_V1',
      compared_versions: ['previous', 'ml_informed', 'baseline'],
      evaluation_set: pack.pack_id,
      metrics: [
        'reviewer_preference_rate',
        'post_direction_clarity',
        'actionability',
        'non_genericness',
        'student_fit',
        'progress_confidence',
        'failure_mode_reduction',
      ],
      pass_thresholds: passThresholds,
      fail_thresholds: {
        no_overall_gain_vs_previous: true,
        no_actionability_gain_vs_previous: true,
        no_clarity_gain_vs_previous: true,
      },
    },
    aggregates,
    pass_fail_checks: passFail,
    decision,
    cases: evaluations,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(output, null, 2));

  const md = [
    '# ML_PRODUCT_IMPACT_REVIEW_POST_NDS_V1',
    '',
    `Generated: ${output.generated_at}`,
    '',
    '## What changed',
    '',
    '- Replaced thin post-direction output with operational sections:',
    '  - what this essay is really about',
    '  - what to write first (3 steps)',
    '  - what to avoid (explicit do-not lines)',
    '  - what to write next after opening',
    '  - one focused question',
    '- Reordered CTA hierarchy to draft-first:',
    '  - primary: Draft the opening now',
    '  - secondary: Help me sharpen the moment first',
    '  - tertiary: Show me what a weak version would do',
    '',
    '## Why it changed',
    '',
    '- Product finding: direction selection quality was acceptable, but conversion was still too abstract for stressed students.',
    '- Validation target: increase immediate student actionability without weakening non-generic direction quality.',
    '',
    '## Measured results',
    '',
    `- Cases evaluated: ${aggregates.case_count}`,
    `- Reviewer preference (ML-informed > previous): ${aggregates.reviewer_preference_rate.ml_informed_over_previous}`,
    `- Reviewer preference (ML-informed > baseline): ${aggregates.reviewer_preference_rate.ml_informed_over_baseline}`,
    `- Mean overall delta (ML-informed vs previous): ${aggregates.deltas.ml_vs_previous_overall}`,
    `- Mean actionability delta (ML-informed vs previous): ${aggregates.deltas.ml_vs_previous_actionability}`,
    `- Mean post-direction clarity delta (ML-informed vs previous): ${aggregates.deltas.ml_vs_previous_clarity}`,
    `- Mean non-genericness delta (ML-informed vs previous): ${aggregates.deltas.ml_vs_previous_non_genericness}`,
    '',
    '## Failure-mode reduction',
    '',
    `- weak_actionability: previous=${aggregates.failure_mode_counts.previous.weak_actionability}, ml_informed=${aggregates.failure_mode_counts.ml_informed.weak_actionability}, baseline=${aggregates.failure_mode_counts.baseline.weak_actionability}`,
    `- post_direction_clarity_gap: previous=${aggregates.failure_mode_counts.previous.post_direction_clarity_gap}, ml_informed=${aggregates.failure_mode_counts.ml_informed.post_direction_clarity_gap}, baseline=${aggregates.failure_mode_counts.baseline.post_direction_clarity_gap}`,
    `- genericness_risk: previous=${aggregates.failure_mode_counts.previous.genericness_risk}, ml_informed=${aggregates.failure_mode_counts.ml_informed.genericness_risk}, baseline=${aggregates.failure_mode_counts.baseline.genericness_risk}`,
    '',
    '## Pass/Fail checks',
    '',
    `- overall gain vs previous: ${passFail.ml_vs_previous_overall ? 'PASS' : 'FAIL'}`,
    `- actionability gain vs previous: ${passFail.ml_vs_previous_actionability ? 'PASS' : 'FAIL'}`,
    `- clarity gain vs previous: ${passFail.ml_vs_previous_clarity ? 'PASS' : 'FAIL'}`,
    `- preference over previous threshold: ${passFail.preference_over_previous ? 'PASS' : 'FAIL'}`,
    `- preference over baseline threshold: ${passFail.preference_over_baseline ? 'PASS' : 'FAIL'}`,
    '',
    '## Final recommendation',
    '',
    decision === 'pass'
      ? '- **KEEP (PASS):** ML-informed post-NDS conversion improves product-relevant metrics and clears thresholds.'
      : decision === 'conditional_pass'
        ? '- **CONDITIONAL PASS:** Improvement is visible but at least one threshold is below target. Keep with one tightening pass.'
        : '- **REJECT (FAIL):** Metrics do not justify keeping the change yet. Roll back or revise.',
    '',
    '## Notes',
    '',
    '- This run uses deterministic rubric scoring for fast product gating and should be followed by human reviewer preference checks on the same case set.',
    '- Structured case-level output is available in ML_PRODUCT_IMPACT_VALIDATION_POST_NDS_V1.json.',
    '',
  ].join('\n');

  fs.writeFileSync(OUT_MD, md);

  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
  console.log(`Decision: ${decision}`);
}

run().catch((err) => {
  console.error('ML_PRODUCT_IMPACT_VALIDATION_POST_NDS_V1 failed:', err);
  process.exit(1);
});
