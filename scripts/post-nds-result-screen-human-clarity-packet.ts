import fs from 'node:fs';
import path from 'node:path';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';
import type { IntakeSessionInput, ProductMode } from '@/types/intake';

const PACK_PATH = path.join(
  process.cwd(),
  'evaluation',
  'intake',
  'RIC_NDS_CONTROLLED_VALIDATION_PACK_V1.json',
);
const OUT_DIR = path.join(process.cwd(), 'evaluation_outputs');
const REVIEW_DIR = path.join(
  process.cwd(),
  'evaluation',
  'intake',
  'ric_human_reviews',
  'post_nds_result_screen_human_clarity',
);
const OUT_PATH = path.join(OUT_DIR, 'POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_V1.json');
const TEMPLATE_PATH = path.join(
  REVIEW_DIR,
  'reviewer_template_post_nds_result_screen_human_clarity_v1.csv',
);

type ControlledCase = {
  case_id: string;
  case_family: string;
  title: string;
  priority: string;
  student_input_raw: string;
  student_input_normalized: string;
};

type ControlledPack = {
  pack_id: string;
  cases: ControlledCase[];
};

type PacketCase = {
  case_id: string;
  case_family: string;
  title: string;
  priority: string;
  student_input_raw: string;
  student_input_normalized: string;
  screen_path: '/start/direction';
  screen_content: {
    top_label: string;
    main_headline: string;
    subhead: string;
    why_this_direction_works: string;
    what_to_write_first: string[];
    what_not_to_do: string[];
    what_to_write_right_after_the_opening: string[];
    focused_question: string;
    ctas: {
      primary: string;
      secondary: string;
      tertiary: string;
    };
  };
  session_payload: {
    fm_intelligence: unknown;
    fm_case_state: unknown;
    fm_product_mode: ProductMode;
  };
};

function loadPack(): ControlledPack {
  return JSON.parse(fs.readFileSync(PACK_PATH, 'utf-8')) as ControlledPack;
}

function pickDiverseCases(cases: ControlledCase[], count = 5): ControlledCase[] {
  const byFamily = new Map<string, ControlledCase[]>();
  for (const item of cases) {
    const bucket = byFamily.get(item.case_family) ?? [];
    bucket.push(item);
    byFamily.set(item.case_family, bucket);
  }

  const picked: ControlledCase[] = [];
  for (const family of byFamily.keys()) {
    const first = byFamily.get(family)?.[0];
    if (first) picked.push(first);
    if (picked.length >= count) return picked;
  }

  for (const item of cases) {
    if (!picked.find((existing) => existing.case_id === item.case_id)) {
      picked.push(item);
      if (picked.length >= count) break;
    }
  }

  return picked;
}

function buildInput(raw: string, caseId: string): IntakeSessionInput {
  return {
    session_id: `post_nds_human_clarity_${caseId}`,
    student_user_id: `participant_seed_${caseId}`,
    subject_entity_id: `project_${caseId}`,
    story_entries: [
      {
        id: `${caseId}_entry_1`,
        title: 'Student entry',
        text: raw,
        project_id: `project_${caseId}`,
        rejected: false,
      },
    ],
    draft_text: null,
    draft_id: null,
    school_context: null,
    student_profile: null,
    prior_attempt_count: 0,
    questions_asked: [],
    rejected_source_ids: [],
    session_created_at: new Date().toISOString(),
  };
}

function escapeCsv(value: string): string {
  const safe = value.replace(/"/g, '""');
  return `"${safe}"`;
}

async function main(): Promise<void> {
  const pack = loadPack();
  const cases = pickDiverseCases(pack.cases, 5);
  const packetCases: PacketCase[] = [];

  for (const c of cases) {
    const input = buildInput(c.student_input_raw, c.case_id);
    const intelligence = await runIntakeOrchestrator(input);
    const caseState = createSessionCaseState(c.student_input_raw, intelligence);
    const direction = deriveDirectionContent(intelligence, caseState);
    const strongest = direction.strongest;

    packetCases.push({
      case_id: c.case_id,
      case_family: c.case_family,
      title: c.title,
      priority: c.priority,
      student_input_raw: c.student_input_raw,
      student_input_normalized: c.student_input_normalized,
      screen_path: '/start/direction',
      screen_content: {
        top_label: 'STRONGEST DIRECTION',
        main_headline: strongest.title,
        subhead: strongest.essay_about,
        why_this_direction_works: strongest.explanation,
        what_to_write_first: strongest.write_first_steps,
        what_not_to_do: strongest.avoid_lines,
        what_to_write_right_after_the_opening: strongest.write_next_steps,
        focused_question: strongest.focused_question,
        ctas: {
          primary: strongest.primary_cta_label,
          secondary: strongest.secondary_cta_label,
          tertiary: strongest.tertiary_cta_label,
        },
      },
      session_payload: {
        fm_intelligence: intelligence,
        fm_case_state: caseState,
        fm_product_mode: 'direction_full',
      },
    });
  }

  const packet = {
    generated_at: new Date().toISOString(),
    packet_id: 'POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_V1',
    source_pack_id: pack.pack_id,
    participant_minimum: 3,
    participant_preferred: 5,
    interviewer_timebox_seconds: [60, 90],
    screen_sections_required: [
      'title',
      'subhead',
      'why this direction works',
      'what to write first',
      'what not to do',
      'what to write right after the opening',
      'focused question',
      'CTA buttons',
    ],
    interview_script: [
      'In one sentence, what is this essay supposed to be about?',
      'What would you write first if you were starting right now?',
      'What does this screen tell you not to do?',
      'What are you supposed to write right after the opening?',
      'If you had to choose right now, which button would you press, and why?',
      'Do you feel ready to start writing after reading this, or still unsure? Why?',
    ],
    scoring_scale: ['pass', 'partial', 'fail'],
    cases: packetCases,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(packet, null, 2), 'utf-8');

  const header = [
    'participant_id',
    'participant_type',
    'case_id',
    'time_to_first_confident_answer_seconds',
    'q1_answer',
    'q1_score',
    'q2_answer',
    'q2_score',
    'q3_answer',
    'q3_score',
    'q4_answer',
    'q4_score',
    'q5_answer',
    'q5_score',
    'q6_answer',
    'q6_score',
    'hesitation_points',
    'repeated_phrases',
    'confusing_phrases',
    'asked_for_clarification',
    'misread_cta',
    'notes',
  ];

  const rows = [header.join(',')];
  for (const item of packetCases) {
    rows.push(
      [
        'participant_1',
        'student_or_parent_proxy_or_counselor_proxy_or_adult_proxy',
        item.case_id,
        '45',
        escapeCsv('short answer'),
        'pass_or_partial_or_fail',
        escapeCsv('short answer'),
        'pass_or_partial_or_fail',
        escapeCsv('short answer'),
        'pass_or_partial_or_fail',
        escapeCsv('short answer'),
        'pass_or_partial_or_fail',
        escapeCsv('short answer'),
        'pass_or_partial_or_fail',
        escapeCsv('short answer'),
        'pass_or_partial_or_fail',
        escapeCsv('hesitation 1|hesitation 2'),
        escapeCsv('phrase 1|phrase 2'),
        escapeCsv('confusing phrase 1|confusing phrase 2'),
        'true_or_false',
        'true_or_false',
        escapeCsv('freeform notes'),
      ].join(','),
    );
  }
  fs.writeFileSync(TEMPLATE_PATH, `${rows.join('\n')}\n`, 'utf-8');

  console.log(
    'POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_READY',
    JSON.stringify({ outPath: OUT_PATH, templatePath: TEMPLATE_PATH, caseCount: packetCases.length }),
  );
}

main().catch((error) => {
  console.error('POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_PACKET_FAILED', error);
  process.exit(1);
});
