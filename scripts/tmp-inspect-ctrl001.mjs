import { runIntakeOrchestrator } from '../src/lib/ai/modules/narrative-intake/intake-orchestrator.ts';
import { createSessionCaseState } from '../src/lib/fm/case-state.ts';
import { deriveDirectionContent } from '../src/lib/fm/direction.ts';

const input = {
  session_id: 'x',
  student_user_id: 'x',
  subject_entity_id: 'x',
  story_entries: [{
    id: 'e1',
    title: 'entry',
    text: 'I really do not know what to write about. Nothing in my life feels dramatic or special, and I am scared my essay will sound boring.',
    project_id: 'x',
    rejected: false,
  }],
  draft_text: null,
  draft_id: null,
  rejected_source_ids: [],
  school_context: null,
  student_profile: null,
  prior_attempt_count: 0,
  questions_asked: [],
  session_created_at: new Date().toISOString(),
};

const intake = await runIntakeOrchestrator(input);
const cs = createSessionCaseState(input.story_entries[0].text, intake);
const d = deriveDirectionContent(intake, cs);
console.log('pattern:', intake.narrative_pattern.primary_pattern);
console.log('essay_about:', d.strongest.essay_about);
