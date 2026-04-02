import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { buildEvidenceFeatures, predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';

const CASES = [
  {
    id: 'HV3_03',
    raw: 'I coordinated intake at a Saturday food pantry and still had forty-minute lines by noon. I blamed turnout until I timed each step and saw forms were bottlenecking first-time families. I redesigned check-in so returning families used color cards while new families met one volunteer at a side table. The next week wait times dropped by half. What embarrassed me most was realizing I had been optimizing for order, not dignity.',
  },
  {
    id: 'HV3_11',
    raw: 'I sing in choir and I also build small coding projects. Both matter to me and I am not sure which would make a better college essay topic.',
  },
];

async function run() {
  for (const c of CASES) {
    const input = {
      session_id: `probe_${c.id}`,
      student_user_id: `probe_${c.id}`,
      subject_entity_id: `probe_${c.id}`,
      story_entries: [{ id: `${c.id}_e1`, title: 'Initial notes', text: c.raw }],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    } as any;

    const intelligence = await runIntakeOrchestrator(input);
    const normalized = normalizeFirstMinuteDecision(c.raw, intelligence as any);
    const state = createSessionCaseState(c.raw, normalized as any);
    const features = buildEvidenceFeatures({
      rawInput: c.raw,
      normalizedInput: c.raw,
      intelligence: normalized as any,
      sessionCaseState: state,
    });
    const pred = predictEvidenceStrength({
      rawInput: c.raw,
      normalizedInput: c.raw,
      intelligence: normalized as any,
      sessionCaseState: state,
    });

    console.log(JSON.stringify({
      case_id: c.id,
      route: pred.route,
      scores: pred.scores,
      usable_signal: normalized.usable_signal,
      recommendation_viability: normalized.recommendation_viability,
      narrative_pattern: normalized.narrative_pattern,
      authorship_signal: normalized.authorship_signal,
      features: {
        tokenCount: features.tokenCount,
        sceneSpecificityScore: features.sceneSpecificityScore,
        signalStrength: features.signalStrength,
        primaryPatternConfidence: features.primaryPatternConfidence,
        turningPointPresent: features.turningPointPresent,
        reflectionPresent: features.reflectionPresent,
        conflictPresent: features.conflictPresent,
        consequencePresent: features.consequencePresent,
      },
    }, null, 2));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
