/**
 * 60-SECOND DRAFTABILITY CHECK
 *
 * Validates whether the new direction screen answers all 4 student questions
 * clearly enough to draft from immediately — without requiring coaching.
 *
 * Test protocol:
 *   1. Generate old and new screen content for 3 representative cases
 *   2. For each case, score each of the 4 student questions
 *   3. Flag any hesitation point
 *   4. Report side-by-side
 */

import * as fs from 'fs';
import * as path from 'path';
import { runIntakeOrchestrator } from '../src/lib/ai/modules/narrative-intake/intake-orchestrator';
import { createSessionCaseState } from '../src/lib/fm/case-state';
import { deriveDirectionContent } from '../src/lib/fm/direction';
import type { IntakeSessionInput } from '../src/types/intake';

function buildInput(raw: string): IntakeSessionInput {
  return {
    session_id: 'draftability-check',
    student_user_id: 'test-student',
    subject_entity_id: 'test-project',
    story_entries: [
      {
        id: 'entry-1',
        title: 'Student entry',
        text: raw,
        project_id: 'test-project',
        rejected: false,
      },
    ],
    draft_text: null,
    draft_id: null,
    rejected_source_ids: [],
    school_context: null,
    student_profile: null,
    prior_attempt_count: 0,
    questions_asked: [],
    session_created_at: new Date().toISOString(),
  };
}

// ─── Simulated old screen renderer ─────────────────────────────────────────

function renderOldScreen(d: ReturnType<typeof deriveDirectionContent>): Record<string, string> {
  const s = d.strongest;
  return {
    Q1_what_is_it_about: `[Title] ${s.title}\n[Explanation] ${s.explanation}`,
    Q2_what_to_write_first: s.write_first_steps.join('\n'),
    Q3_what_to_avoid: s.avoid_lines.join('\n'),
    Q4_what_to_write_next: `[Numbered]\n` + s.write_next_steps.map((x, i) => `${i + 1}. ${x}`).join('\n'),
    primary_cta: s.primary_cta_label,
  };
}

// ─── New screen renderer ────────────────────────────────────────────────────

function renderNewScreen(d: ReturnType<typeof deriveDirectionContent>): Record<string, string> {
  const s = d.strongest;
  return {
    Q1_what_is_it_about: `[Title] ${s.title}\n[Subhead] ${s.essay_about}`,
    Q2_what_to_write_first: `In your opening, do these 3 things:\n` + s.write_first_steps.map((x, i) => `${i + 1}. ${x}`).join('\n'),
    Q3_what_to_avoid: `Do not make these mistakes:\n` + s.avoid_lines.map(x => `• ${x}`).join('\n'),
    Q4_what_to_write_next: s.write_next_steps.join('\n'),
    primary_cta: s.primary_cta_label,
  };
}

// ─── Hesitation scorer ──────────────────────────────────────────────────────

interface QuestionScore {
  question: string;
  answer_preview: string;
  immediate: boolean;   // answer is in the first sentence (no hunting)
  concrete: boolean;    // answer contains a specific action verb or concrete noun (not just abstract)
  student_voice: boolean; // no banned abstraction words
  hesitation_flag: string | null;
}

const BANNED_ABSTRACT = [
  'frame', 'angle', 'anchor', 'flatten', 'narrative arc', 'thematic', 'leverage',
  'synthesis', 'contextualize', 'interpretive lens'
];

const CONCRETE_VERBS = [
  'start with', 'write', 'show', 'do not', 'end', 'draft', 'describe',
  'open', 'choose', 'explain', 'begin', 'include', 'avoid', 'after'
];

function scoreQuestion(question: string, text: string): QuestionScore {
  const lower = text.toLowerCase();
  const firstSentence = text.split(/[.!?]/)[0]?.trim() ?? text;

  const bannedFound = BANNED_ABSTRACT.filter(w => lower.includes(w));
  const concreteFound = CONCRETE_VERBS.filter(v => lower.includes(v));

  const immediate = firstSentence.length > 15 && !firstSentence.toLowerCase().startsWith('this essay is not');
  const concrete = concreteFound.length >= 2;
  const studentVoice = bannedFound.length === 0;

  let hesitationFlag: string | null = null;
  if (!immediate) hesitationFlag = 'Answer buried — student has to read past the first sentence to know what to do';
  else if (!concrete) hesitationFlag = 'Too abstract — answer does not tell student what to physically type';
  else if (!studentVoice) hesitationFlag = `Contains abstraction: "${bannedFound[0]}" — may confuse student`;

  return {
    question,
    answer_preview: text.slice(0, 160).replace(/\n/g, ' '),
    immediate,
    concrete,
    student_voice: studentVoice,
    hesitation_flag: hesitationFlag,
  };
}

// ─── Per-screen score summary ────────────────────────────────────────────────

interface ScreenResult {
  case_id: string;
  student_input: string;
  old: {
    Q1: QuestionScore;
    Q2: QuestionScore;
    Q3: QuestionScore;
    Q4: QuestionScore;
    can_draft_immediately: boolean;
    hesitation_count: number;
  };
  new: {
    Q1: QuestionScore;
    Q2: QuestionScore;
    Q3: QuestionScore;
    Q4: QuestionScore;
    can_draft_immediately: boolean;
    hesitation_count: number;
  };
  verdict: string;
  remaining_risk: string | null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function run() {
  const packPath = path.join(process.cwd(), 'evaluation/intake/RIC_NDS_CONTROLLED_VALIDATION_PACK_V1.json');
  const pack = JSON.parse(fs.readFileSync(packPath, 'utf-8'));

  // Pick 3 representative cases: blank_page_confusion, achievement_clutter, vague_identity_angle
  const targetFamilies = ['blank_page_confusion', 'achievement_clutter', 'vague_identity_angle'];
  const testCases: Array<{ case_id: string; case_family: string; student_input_raw: string }> = [];

  for (const family of targetFamilies) {
    const c = pack.cases.find((x: any) => x.case_family === family);
    if (c) testCases.push(c);
  }

  const results: ScreenResult[] = [];

  for (const c of testCases) {
    process.stdout.write(`  Testing ${c.case_id} (${c.case_family})…\n`);
    const intake = await runIntakeOrchestrator(buildInput(c.student_input_raw));
    const caseState = createSessionCaseState(c.student_input_raw, intake);
    const direction = deriveDirectionContent(intake, caseState);

    const oldScreen = renderOldScreen(direction);
    const newScreen = renderNewScreen(direction);

    function scoreScreen(screen: ReturnType<typeof renderOldScreen>) {
      const Q1 = scoreQuestion('What is my essay about?', screen.Q1_what_is_it_about);
      const Q2 = scoreQuestion('What do I write first?', screen.Q2_what_to_write_first);
      const Q3 = scoreQuestion('What should I avoid?', screen.Q3_what_to_avoid);
      const Q4 = scoreQuestion('What do I write right after that?', screen.Q4_what_to_write_next);
      const hesitationCount = [Q1, Q2, Q3, Q4].filter(q => q.hesitation_flag !== null).length;
      return { Q1, Q2, Q3, Q4, can_draft_immediately: hesitationCount === 0, hesitation_count: hesitationCount };
    }

    const oldResult = scoreScreen(oldScreen);
    const newResult = scoreScreen(newScreen);

    // Identify remaining risk in new screen
    let remainingRisk: string | null = null;
    const newHesitations = [newResult.Q1, newResult.Q2, newResult.Q3, newResult.Q4]
      .filter(q => q.hesitation_flag !== null);
    if (newHesitations.length > 0) {
      remainingRisk = newHesitations.map(q => `${q.question}: ${q.hesitation_flag}`).join('; ');
    }

    const oldHesitations = oldResult.hesitation_count;
    const newHesitations2 = newResult.hesitation_count;
    const verdict =
      newHesitations2 === 0
        ? `CLEAR — student can draft in 60s (was ${oldHesitations} hesitation(s) before)`
        : newHesitations2 < oldHesitations
        ? `IMPROVED — ${oldHesitations} → ${newHesitations2} hesitation(s), but not clear yet`
        : newHesitations2 === oldHesitations
        ? `SAME — no regression but no gain (${newHesitations2} hesitation(s) remain)`
        : `WORSE — ${oldHesitations} → ${newHesitations2} hesitation(s)`;

    results.push({
      case_id: c.case_id,
      student_input: c.student_input_raw,
      old: oldResult,
      new: newResult,
      verdict,
      remaining_risk: remainingRisk,
    });
  }

  // ─── Print report ───────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  60-SECOND DRAFTABILITY CHECK — SIDE-BY-SIDE');
  console.log('══════════════════════════════════════════════════════════════\n');

  for (const r of results) {
    console.log(`┌─ ${r.case_id}`);
    console.log(`│  Student: "${r.student_input.slice(0, 80)}…"`);
    console.log(`│  VERDICT: ${r.verdict}`);

    const LABELS: Array<[keyof typeof r.old, string]> = [
      ['Q1', 'What is my essay about?'],
      ['Q2', 'What do I write first?'],
      ['Q3', 'What should I avoid?'],
      ['Q4', 'What do I write right after that?'],
    ];

    for (const [key, label] of LABELS) {
      const oldQ = r.old[key] as QuestionScore;
      const newQ = r.new[key] as QuestionScore;
      const oldStatus = oldQ.hesitation_flag ? `⚠  ${oldQ.hesitation_flag}` : '✓  clear';
      const newStatus = newQ.hesitation_flag ? `⚠  ${newQ.hesitation_flag}` : '✓  clear';
      const changed = oldQ.hesitation_flag !== newQ.hesitation_flag;
      const marker = changed ? (newQ.hesitation_flag ? '▼' : '▲') : '  ';

      console.log(`│`);
      console.log(`│  ${marker} Q: "${label}"`);
      console.log(`│    OLD: ${oldStatus}`);
      console.log(`│        "${oldQ.answer_preview.slice(0, 100)}"`);
      console.log(`│    NEW: ${newStatus}`);
      console.log(`│        "${newQ.answer_preview.slice(0, 100)}"`);
    }

    if (r.remaining_risk) {
      console.log(`│`);
      console.log(`│  ⚠  REMAINING RISK: ${r.remaining_risk}`);
    }

    console.log('└─────────────────────────────────────────────────────────────\n');
  }

  // ─── Summary ────────────────────────────────────────────────────────────

  const totalOldHesitations = results.reduce((s, r) => s + r.old.hesitation_count, 0);
  const totalNewHesitations = results.reduce((s, r) => s + r.new.hesitation_count, 0);
  const cleared = results.filter(r => r.new.can_draft_immediately).length;

  console.log('══════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  Cases tested:            ${results.length}`);
  console.log(`  Clear (0 hesitations):   ${cleared}/${results.length}`);
  console.log(`  Total hesitation points: ${totalOldHesitations} (old) → ${totalNewHesitations} (new)`);
  console.log(`  Net reduction:           ${totalOldHesitations - totalNewHesitations} hesitation(s) eliminated`);
  console.log('');

  const remainingRisks = results.filter(r => r.remaining_risk);
  if (remainingRisks.length === 0) {
    console.log('  All 4 student questions answered immediately across all test cases.');
    console.log('  Student can start writing in < 60 seconds. No tightening required.');
  } else {
    console.log('  Remaining risks requiring tightening:');
    for (const r of remainingRisks) {
      console.log(`    ${r.case_id}: ${r.remaining_risk}`);
    }
  }

  console.log('══════════════════════════════════════════════════════════════\n');

  // ─── Write artifact ──────────────────────────────────────────────────────

  const outPath = path.join(process.cwd(), 'evaluation_outputs/DRAFTABILITY_CHECK_V1.json');
  fs.writeFileSync(outPath, JSON.stringify({
    run_id: 'DRAFTABILITY_CHECK_V1',
    run_timestamp: new Date().toISOString(),
    protocol: '60-second draftability check — old vs new direction screen',
    questions_tested: [
      'What is my essay about?',
      'What do I write first?',
      'What should I avoid?',
      'What do I write right after that?',
    ],
    summary: {
      cases_tested: results.length,
      cases_clear: cleared,
      total_old_hesitations: totalOldHesitations,
      total_new_hesitations: totalNewHesitations,
      net_reduction: totalOldHesitations - totalNewHesitations,
    },
    results,
  }, null, 2));

  process.stdout.write(`\nArtifact written → evaluation_outputs/DRAFTABILITY_CHECK_V1.json\n`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
