import fs from 'node:fs';
import path from 'node:path';
import { deriveOpeningCoachModel } from '@/lib/fm/openingCoach';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { createSessionCaseState, normalizeStudentText } from '@/lib/fm/case-state';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';
import { evaluateBlankPageRollout } from '@/lib/release/blankPageRolloutGuard';
import { buildCanonicalPage3Payload } from '@/lib/fm/canonicalPage3Payload';
import type { IntakeIntelligenceObject, IntakeSessionInput } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';

const cases = [
  {
    case_id: 'HV2_01',
    raw_input: 'I was the fastest student in our AP chem lab section at finishing titration setups. During one lab, a classmate copied my setup and contaminated her sample because I had skipped labeling one transfer step I always did in my head. My teacher said speed was not the same thing as reliability. The next week I built a one-page checklist and made everyone use it before touching the burette. Our failed trials dropped a lot, and I stopped being proud of finishing first.',
  },
  {
    case_id: 'HV2_10',
    raw_input: 'During regionals our robot failed inspection twice, and I told the team to remove an autonomous feature to pass on time. Another programmer argued we should keep it and risk a late match. I overruled him. We qualified but lost our quarterfinal because of manual control mistakes. After the event he said my call protected schedule but ignored our actual strength. I now frame emergency decisions as tradeoffs out loud before choosing.',
  },
  {
    case_id: 'HV2_12',
    raw_input: 'I used to think translating for my grandparents at government offices was just a family duty. At one appointment the clerk spoke quickly and I summarized instead of translating line by line so we could finish faster. My grandfather signed a form he did not understand. We had to return the next week to reverse it. Since then I ask officials to pause and I translate every instruction fully even when the line gets longer. That day changed what responsibility sounds like to me.',
  },
];

async function main() {
  const output = [];

  for (const item of cases) {
    const normalizedRawInput = normalizeStudentText(item.raw_input);
    const sessionId = crypto.randomUUID();
    const subjectEntityId = crypto.randomUUID();
    const now = new Date().toISOString();
    const input: IntakeSessionInput = {
      session_id: sessionId,
      student_user_id: `fm_guest_${sessionId}`,
      subject_entity_id: subjectEntityId,
      story_entries: [
        {
          id: crypto.randomUUID(),
          title: 'Initial notes',
          text: normalizedRawInput,
          created_at: now,
        },
      ],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: now,
    };

    const intelligence = await runIntakeOrchestrator(input);
    const intake = normalizeFirstMinuteDecision(normalizedRawInput, intelligence) as IntakeIntelligenceObject;
    const caseState = createSessionCaseState(item.raw_input, intake) as SessionCaseState | null;
    const evidenceStrength = predictEvidenceStrength({
      rawInput: item.raw_input,
      normalizedInput: normalizedRawInput,
      intelligence: intake,
      sessionCaseState: caseState,
    });
    const requestedProductMode = evidenceStrength.route;
    const effectiveProductMode = evaluateBlankPageRollout({
      requestedMode: requestedProductMode,
      blankPageClassification: evidenceStrength.blank_page_classification,
    }).effectiveMode;
    const canonicalPage3Payload = buildCanonicalPage3Payload({
      sessionId,
      caseId: subjectEntityId,
      rawInput: item.raw_input,
      normalizedInput: normalizedRawInput,
      intakeInput: input,
      intake,
      evidenceStrength,
      requestedProductMode,
      effectiveProductMode,
      caseState,
    });
    const opening = deriveOpeningCoachModel(intake, caseState);
    const direction = deriveDirectionContent(intake, caseState);

    output.push({
      case_id: item.case_id,
      recommendation: canonicalPage3Payload?.recommendation_packet?.displayed_recommendation ?? null,
      why_this_direction: canonicalPage3Payload?.recommendation_packet?.why_this_direction ?? null,
      opening: {
        helperLine: opening.helperLine,
        scaffoldSteps: opening.scaffoldSteps,
        nextParagraphInstruction: opening.nextParagraphInstruction,
        nextParagraphExpectation: opening.nextParagraphExpectation,
        antiGenericWarnings: opening.antiGenericWarnings,
        openingComparison: opening.openingComparison,
        diagnosis: opening.coachResponse.diagnosis,
      },
      strongest: {
        title: direction.strongest.title,
        why_beats_obvious: direction.strongest.why_beats_obvious,
        next_move: direction.strongest.next_move,
      },
    });
  }

  const out = path.join(process.cwd(), 'evaluation_outputs', 'tmp_strong_opening_review.json');
  fs.writeFileSync(out, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
