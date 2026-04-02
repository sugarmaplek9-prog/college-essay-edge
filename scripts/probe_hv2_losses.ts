import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { buildEvidenceFeatures, predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';

const CASES = [
  {
    id: 'HV2_01',
    raw: 'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.',
  },
  {
    id: 'HV2_06',
    raw: 'At a local hackathon our app won second place, and I introduced it on stage as if I had built most of it. On the drive home my teammate said she almost did not correct me because she assumed I needed the spotlight for college apps. I replayed that sentence for days. I rewrote our project page to show exactly who built what and started opening every team presentation with contribution roles. I had confused confidence with ownership.',
  },
  {
    id: 'HV2_11',
    raw: 'I paint portraits and I also run cross-country. Both matter to me and I am unsure which one is better for my college essay.',
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
      authorship_signal: normalized.authorship_signal,
      narrative_pattern: normalized.narrative_pattern,
      features: {
        tokenCount: features.tokenCount,
        sceneSpecificityScore: features.sceneSpecificityScore,
        signalStrength: features.signalStrength,
        primaryPatternConfidence: features.primaryPatternConfidence,
        turningPointPresent: features.turningPointPresent,
        reflectionPresent: features.reflectionPresent,
        conflictPresent: features.conflictPresent,
      },
    }, null, 2));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
