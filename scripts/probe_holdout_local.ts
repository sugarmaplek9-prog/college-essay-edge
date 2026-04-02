import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { buildEvidenceFeatures, predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';

const CASES = [
  {
    id: 'HO_01',
    raw: 'I was the only person on the team who knew how to fix the memory leak in our codebase. I fixed it in ten minutes the first time it happened. The second time, a junior teammate was stuck on it for two days before I stepped in and fixed it again. My advisor asked why I had not taught her how to fix it. I did not have a good answer. I rewrote the documentation and ran a code review session the following week. I have not touched that bug since.',
  },
  {
    id: 'HO_02',
    raw: 'I ran a Saturday reading program for elementary kids. Attendance was good the first month. Then it dropped by half. I assumed the kids were just busy. A parent told me her daughter stopped coming because the books were too hard and she felt embarrassed in front of the older kids. I split the group by reading level the next week. Attendance came back. My original goal was to help kids love reading. I was doing the opposite.',
  },
  {
    id: 'HO_05',
    raw: 'I scored in the bottom third at the state math competition. I had prepared more than anyone I knew. After I got my score back I looked at every problem I missed. All of them required me to switch strategy mid-problem, which I had never practiced. I built a drill where you start a problem, stop after two minutes, explain in writing why your approach is failing, then try a different method. Twelve students at my school now use it.',
  },
  {
    id: 'HO_08',
    raw: 'In ninth grade I was placed in ESL because of my last name even though I had spoken English my whole life. I asked the counselor to move me. She said she would look into it. I waited three weeks and nothing happened. I wrote a one-page document with my test scores and sat outside the counselor\'s office until she saw me. I was moved the same day. I did not understand at the time that I had just done something most kids in that class had never been able to do.',
  },
  {
    id: 'HO_11',
    raw: 'I play violin and I also captain the soccer team. Both have made me who I am. I am not sure which story to tell for college.',
  },
];

async function run() {
  for (const c of CASES) {
    const input = {
      session_id: `local_${c.id}`,
      student_user_id: `local_user_${c.id}`,
      subject_entity_id: `local_project_${c.id}`,
      story_entries: [
        {
          id: `${c.id}_entry_1`,
          title: 'Initial notes',
          text: c.raw,
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

    console.log(
      JSON.stringify(
        {
          case_id: c.id,
          route: pred.route,
          scores: pred.scores,
          signal_strength: normalized.usable_signal.signal_strength,
          signal_types: normalized.usable_signal.signal_types,
          recommendation_viability: normalized.recommendation_viability.decision,
          narrative_confidence: normalized.narrative_pattern.confidence,
          trustedEvidenceCount: features.trustedEvidenceCount,
          tokenCount: features.tokenCount,
          sceneSpecificity: features.sceneSpecificityScore,
          turningPointPresent: features.turningPointPresent,
          reflectionPresent: features.reflectionPresent,
          primaryPatternConfidence: features.primaryPatternConfidence,
        },
        null,
        2
      )
    );
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
