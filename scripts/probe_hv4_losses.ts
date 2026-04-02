import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { buildEvidenceFeatures, predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';

const CASES = [
  {
    id: 'HV4_01',
    raw: 'In physics lab I used to rush through calibration because I could usually fix errors later. During a pendulum trial, my partner copied my setup and our data drifted so far we had to restart. My teacher said I was solving symptoms, not preventing mistakes. The next week I wrote a calibration checklist and made our table run it before every test. Our graphs became consistent, and I stopped equating speed with competence.',
  },
  {
    id: 'HV4_07',
    raw: 'I ran a coding club and solved bugs for students whenever we got stuck. A student told me club felt like watching me debug instead of learning to debug. I started asking everyone to write one hypothesis before I touched the keyboard. Participation went up and students began helping each other.',
  },
  {
    id: 'HV4_08',
    raw: 'I translated prescription instructions for my uncle and summarized quickly because the pharmacist was busy. He took one medication at the wrong interval. At the follow-up, the pharmacist asked me to have him repeat each step back. Since then I translate line by line and ask for teach-back before leaving.',
  },
  {
    id: 'HV4_11',
    raw: 'I do photography and I also play tennis competitively. Both are meaningful to me and I am unsure which one should be my college essay topic.',
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
      signal_strength: normalized.usable_signal?.signal_strength,
      signal_types: normalized.usable_signal?.signal_types,
      usable: normalized.usable_signal?.usable_signal,
      viability: normalized.recommendation_viability?.decision,
      viability_reason_codes: normalized.recommendation_viability?.reason_codes,
      scene_evidence: normalized.authorship_signal?.student_scene_evidence,
      contamination_risk: normalized.authorship_signal?.contamination_risk,
      pattern: normalized.narrative_pattern?.primary_pattern,
      pattern_confidence: normalized.narrative_pattern?.confidence,
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
    console.log('---');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
