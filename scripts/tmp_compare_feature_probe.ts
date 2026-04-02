import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { buildEvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import { scoreEvidenceDeterministic, classifyBlankPageIntake } from '@/lib/ml/evidenceStrength/model';

const raw = 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.';

const intake = await runIntakeOrchestrator({
  session_id: 'tmp-compare-probe',
  student_user_id: 'tmp-student',
  subject_entity_id: 'tmp-subject',
  raw_input: raw,
  story_entries: [{ id: 's1', title: 'Initial notes', text: raw }],
  questions_asked: [],
  prior_attempt_count: 0,
  rejected_source_ids: [],
});

const f = buildEvidenceFeatures({
  rawInput: raw,
  normalizedInput: raw,
  intelligence: intake,
  sessionCaseState: null,
});

const blank = classifyBlankPageIntake(f, intake);
const pred = scoreEvidenceDeterministic(f, intake);

console.log(JSON.stringify({
  viability: intake.recommendation_viability,
  signal: intake.usable_signal,
  contamination: intake.authorship_signal,
  f: {
    tokenCount: f.tokenCount,
    topicOptionCount: f.topicOptionCount,
    helpSeekingQuestion: f.helpSeekingQuestion,
    scopeUncertainSignal: f.scopeUncertainSignal,
    blankPageDiscoverySignal: f.blankPageDiscoverySignal,
    tooThinToRecoverSignal: f.tooThinToRecoverSignal,
    blankPageTriggerSignals: f.blankPageTriggerSignals,
  },
  blank,
  route: pred.route,
  scores: pred.scores,
}, null, 2));
