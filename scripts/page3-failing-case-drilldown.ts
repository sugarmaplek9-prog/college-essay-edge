import fs from 'node:fs';
import path from 'node:path';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';
import type { IntakeSessionInput } from '@/types/intake';

const OUT_PATH = path.join(process.cwd(), 'evaluation_outputs', 'page3_five_case_before_after_v1', 'failing_case_drilldown.json');

const FAILING_CASES = [
  {
    case_id: 'RUS_03',
    title: 'Pantry redesign with concrete hinge',
    raw_notes:
      'I changed in debate and also helped redesign pantry pickup, both mattered but I am not sure which one says more about me. One family told me they stopped coming because lines were public. I proposed quiet pickup slots and attendance recovered.',
  },
  {
    case_id: 'RUS_13',
    title: 'Clinic translation with immediate outcome',
    raw_notes:
      'At a clinic desk, I translated a medication warning for my parents and realized precision could change outcomes that same day. I shifted from sounding fluent to making sure every instruction was actually understood.',
  },
];

function buildInput(caseId: string, raw: string): IntakeSessionInput {
  return {
    session_id: `fail_drill_${caseId}`,
    student_user_id: `user_${caseId}`,
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

async function run(): Promise<void> {
  const out: unknown[] = [];

  for (const item of FAILING_CASES) {
    const input = buildInput(item.case_id, item.raw_notes);
    const intelligence = await runIntakeOrchestrator(input);
    const caseState = createSessionCaseState(item.raw_notes, intelligence);
    const direction = deriveDirectionContent(intelligence, caseState);

    const pack = (direction.candidate_pack ?? []).map((c) => {
      const candidate = c as typeof c & {
        essay_about?: string;
        next_move?: string;
      };

      return {
      candidate_id: c.candidate_id,
      selected: c.selected,
      rank: c.rank,
      direction_line: c.direction_line,
      why_this_direction: c.why_this_direction,
      essay_about: candidate.essay_about ?? null,
      next_move: candidate.next_move ?? null,
      source_anchor_spans: c.source_anchor_spans,
      hinge_span: c.hinge_span,
      scores: c.scores,
      validator_flags: c.validator_flags,
      rejection_reasons: c.rejection_reasons,
      };
    });

    const selected = pack.find((c) => c.selected) ?? null;
    const runner_up = pack.find((c) => c.rank === 2) ?? null;

    out.push({
      case_id: item.case_id,
      title: item.title,
      raw_notes: item.raw_notes,
      product_mode: intelligence.recommendation_viability.decision,
      strongest: direction.strongest,
      selected,
      runner_up,
      all_candidates: pack,
    });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify({ generated_at: new Date().toISOString(), cases: out }, null, 2), 'utf-8');
  console.log(JSON.stringify({ out_path: OUT_PATH, cases: FAILING_CASES.map((c) => c.case_id) }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
