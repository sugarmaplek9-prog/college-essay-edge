import { extractEvidenceFeatures } from '@/lib/ml/evidenceStrength/features';
import { scoreEvidenceDeterministic } from '@/lib/ml/evidenceStrength/model';
import { runNarrativeIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/orchestrator';

const raw = 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.';

const intake = runNarrativeIntakeOrchestrator({
  raw_input: raw,
  prior_attempt_count: 0,
  questions_asked: [],
  session_id: 'tmp-debug',
});

const features = extractEvidenceFeatures({
  rawInput: raw,
  normalizedInput: raw,
  intelligence: intake,
  caseState: null,
});

const prediction = scoreEvidenceDeterministic(features, intake);

console.log(JSON.stringify({
  viability: intake.recommendation_viability,
  usable_signal: intake.usable_signal,
  authorship: intake.authorship_signal,
  topicOptionCount: features.topicOptionCount,
  helpSeekingQuestion: features.helpSeekingQuestion,
  blankPageTriggerSignals: features.blankPageTriggerSignals,
  prediction,
}, null, 2));
