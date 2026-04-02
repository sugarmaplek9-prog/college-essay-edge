import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { predictEvidenceStrength } from '../src/lib/ml/evidenceStrength/predict';
import { createSessionCaseState } from '../src/lib/fm/case-state';
import {
  FIXTURE_F1_STRONG_CASE,
  FIXTURE_F4_BLOCKED,
} from '../src/__tests__/fixtures/orchestrator-responses';
import type { IntakeIntelligenceObject, BlankPageMode, TopLevelBlankPageRoute } from '../src/types/intake';

type SpotCase = {
  family: string;
  rawInput: string;
  expectedRoute: TopLevelBlankPageRoute;
  expectedMode: BlankPageMode | null;
};

function normalizeFixture<T extends Record<string, unknown>>(fixture: T): T {
  if ((fixture?.trusted_evidence as Record<string, unknown>)?.trusted_evidence_rank) return fixture;

  return {
    ...fixture,
    trusted_evidence: {
      trusted_evidence_rank: Array.isArray((fixture?.trusted_evidence as Record<string, unknown>)?.ranking)
        ? ((fixture.trusted_evidence as Record<string, unknown>).ranking as Array<{ source_id: string }>)
            .map((item) => item.source_id)
        : [],
      downgraded_sources: [],
      reason_codes: ['STORY_ENTRY_OUTRANKS_POLISHED_DRAFT'],
      meta: (fixture?.trusted_evidence as Record<string, unknown>)?.meta,
    },
  };
}

const F1 = normalizeFixture(FIXTURE_F1_STRONG_CASE as unknown as Record<string, unknown>) as unknown as IntakeIntelligenceObject;
const F4 = normalizeFixture(FIXTURE_F4_BLOCKED as unknown as Record<string, unknown>) as unknown as IntakeIntelligenceObject;

function makeRecoverableLowSignalIntelligence(): IntakeIntelligenceObject {
  return {
    ...F4,
    usable_signal: {
      ...F4.usable_signal,
      usable_signal: false,
      signal_strength: 'none',
    },
    authorship_signal: {
      ...F4.authorship_signal,
      contamination_risk: 'low',
      student_scene_evidence: 'absent',
    },
    recommendation_viability: {
      ...F4.recommendation_viability,
      decision: 'needs_more_input',
      signal_sufficiency_used: 'none',
      contamination_risk_used: 'low',
    },
    escalation: {
      ...F4.escalation,
      blocking: false,
    },
  };
}

const recoverable = makeRecoverableLowSignalIntelligence();

const cases: SpotCase[] = [
  // topic-only (5)
  { family: 'topic-only', rawInput: 'Can I write about gardening?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'topic_probe' },
  { family: 'topic-only', rawInput: 'Would volunteering work for my college essay?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'topic_probe' },
  { family: 'topic-only', rawInput: 'Should I write about coding for my personal statement?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'topic_probe' },
  { family: 'topic-only', rawInput: 'Can I write about moving schools?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'topic_probe' },
  { family: 'topic-only', rawInput: 'Is writing about tutoring a good topic?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'topic_probe' },

  // theme-only (5)
  { family: 'theme-only', rawInput: 'I want to show resilience.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'theme_probe' },
  { family: 'theme-only', rawInput: 'I want to write about leadership.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'theme_probe' },
  { family: 'theme-only', rawInput: 'I want my essay to show growth.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'theme_probe' },
  { family: 'theme-only', rawInput: 'How do I demonstrate integrity in my essay?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'theme_probe' },
  { family: 'theme-only', rawInput: 'I want to highlight compassion but I do not have a story yet.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'theme_probe' },

  // activity-only (5)
  { family: 'activity-only', rawInput: 'I am between robotics and debate.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'activity_probe' },
  { family: 'activity-only', rawInput: 'Maybe soccer for my essay?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'activity_probe' },
  { family: 'activity-only', rawInput: 'I am deciding between robotics, debate, and soccer.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'activity_probe' },
  { family: 'activity-only', rawInput: 'Should I focus on band or robotics?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'activity_probe' },
  { family: 'activity-only', rawInput: 'Debate or coding club might be my essay topic.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'activity_probe' },

  // scope-uncertain (5)
  { family: 'scope-uncertain', rawInput: 'I do not know if this says enough about me.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'scope_reframe' },
  { family: 'scope-uncertain', rawInput: 'I like this topic but I am not sure it is deep enough.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'scope_reframe' },
  { family: 'scope-uncertain', rawInput: 'I am not sure this is really an essay-worthy topic.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'scope_reframe' },
  { family: 'scope-uncertain', rawInput: 'Is writing about babysitting too common?', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'scope_reframe' },
  { family: 'scope-uncertain', rawInput: 'I have a topic but I do not know if it says enough.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'scope_reframe' },

  // blank-page (5)
  { family: 'blank-page', rawInput: 'I have no idea what to write about.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'blank_page_discovery' },
  { family: 'blank-page', rawInput: 'Nothing feels special enough for my college essay.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'blank_page_discovery' },
  { family: 'blank-page', rawInput: 'I do not know where to start for my personal statement.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'blank_page_discovery' },
  { family: 'blank-page', rawInput: 'I am stuck and have no topic yet.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'blank_page_discovery' },
  { family: 'blank-page', rawInput: 'I need help choosing what to write about for college essays.', expectedRoute: 'needs_structured_blank_page_intake', expectedMode: 'blank_page_discovery' },

  // truly insufficient (5)
  { family: 'truly-insufficient', rawInput: 'hi', expectedRoute: 'true_block', expectedMode: 'too_thin_to_recover' },
  { family: 'truly-insufficient', rawInput: 'n/a', expectedRoute: 'true_block', expectedMode: 'too_thin_to_recover' },
  { family: 'truly-insufficient', rawInput: 'test', expectedRoute: 'true_block', expectedMode: 'too_thin_to_recover' },
  { family: 'truly-insufficient', rawInput: 'write my essay for me', expectedRoute: 'true_block', expectedMode: 'too_thin_to_recover' },
  { family: 'truly-insufficient', rawInput: 'asdf', expectedRoute: 'true_block', expectedMode: 'too_thin_to_recover' },

  // clearly good NDS (5)
  {
    family: 'good-nds',
    rawInput: 'I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service.',
    expectedRoute: 'ready_for_nds',
    expectedMode: null,
  },
  {
    family: 'good-nds',
    rawInput: 'During robotics finals our bot stalled with 40 seconds left. I overrode the script and switched to manual control while my teammate called out timing. We lost that match, but the next round we rebuilt the handoff and won. That changed how I lead under pressure.',
    expectedRoute: 'ready_for_nds',
    expectedMode: null,
  },
  {
    family: 'good-nds',
    rawInput: 'At debate camp, my coach stopped my speech and told me I was hiding behind big words. I rewrote my case overnight with one concrete story and tested it the next day. The room reacted differently, and I finally understood what clarity costs.',
    expectedRoute: 'ready_for_nds',
    expectedMode: null,
  },
  {
    family: 'good-nds',
    rawInput: 'My first month tutoring, a student kept failing the same algebra quiz. I noticed I was explaining fast but never checking where she got lost. We rebuilt one problem step by step, and she later taught it to another student. That shifted my idea of helping.',
    expectedRoute: 'ready_for_nds',
    expectedMode: null,
  },
  {
    family: 'good-nds',
    rawInput: 'At my restaurant shift, tickets kept disappearing during rush hour. I designed a color-coded rail system, trained the team, and we cut missed orders to zero. The bigger change was realizing I needed to fix systems, not just work faster.',
    expectedRoute: 'ready_for_nds',
    expectedMode: null,
  },
];

const rows = cases.map((c, idx) => {
  const intelligence = c.family === 'good-nds' ? F1 : recoverable;
  const state = createSessionCaseState(c.rawInput, intelligence);
  const prediction = predictEvidenceStrength({
    rawInput: c.rawInput,
    normalizedInput: c.rawInput,
    intelligence,
    sessionCaseState: state,
  });

  const actual = prediction.blank_page_classification;
  const pass = actual.top_level_blank_page_route === c.expectedRoute
    && actual.blank_page_mode === c.expectedMode;

  return {
    id: idx + 1,
    family: c.family,
    raw_input: c.rawInput,
    top_level_route: actual.top_level_blank_page_route,
    mode: actual.blank_page_mode,
    trigger_signals: actual.blank_page_trigger_signals,
    confidence: actual.blank_page_confidence,
    reviewer_note: pass ? 'PASS: expected route/mode match.' : `REVIEW: expected ${c.expectedRoute}/${c.expectedMode} but got ${actual.top_level_blank_page_route}/${actual.blank_page_mode}`,
  };
});

const summary = {
  generated_at: new Date().toISOString(),
  artifact_id: 'structured_blank_page_intake_phase_1_spot_check_v1',
  total_cases: rows.length,
  pass_count: rows.filter((r) => r.reviewer_note.startsWith('PASS')).length,
  fail_count: rows.filter((r) => r.reviewer_note.startsWith('REVIEW')).length,
  rows,
};

const jsonPath = resolve(process.cwd(), 'docs/engineering/structured_blank_page_intake_phase_1_spot_check_v1.json');
writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

const mdLines: string[] = [
  '# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_SPOT_CHECK_V1',
  '',
  `- Generated at: ${summary.generated_at}`,
  `- Total cases: ${summary.total_cases}`,
  `- Pass count: ${summary.pass_count}`,
  `- Review-needed count: ${summary.fail_count}`,
  '',
  '| # | Family | Raw input | Top-level route | Mode | Trigger signals | Confidence | Reviewer note |',
  '|---:|---|---|---|---|---|---|---|',
];

for (const row of rows) {
  const raw = row.raw_input.replace(/\|/g, '\\|');
  const triggers = row.trigger_signals.join(', ').replace(/\|/g, '\\|');
  mdLines.push(`| ${row.id} | ${row.family} | ${raw} | ${row.top_level_route} | ${row.mode ?? '-'} | ${triggers || '-'} | ${row.confidence ?? '-'} | ${row.reviewer_note} |`);
}

const mdPath = resolve(process.cwd(), 'docs/engineering/STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_SPOT_CHECK_V1.md');
writeFileSync(mdPath, `${mdLines.join('\n')}\n`, 'utf8');

console.log(`Wrote ${jsonPath}`);
console.log(`Wrote ${mdPath}`);
console.log(`PASS ${summary.pass_count}/${summary.total_cases}`);
