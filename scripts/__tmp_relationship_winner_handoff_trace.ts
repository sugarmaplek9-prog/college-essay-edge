import { readFile } from 'node:fs/promises';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeStudentText, createSessionCaseState } from '@/lib/fm/case-state';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { buildCanonicalPage3Payload } from '@/lib/fm/canonicalPage3Payload';
import type { IntakeSessionInput } from '@/types/intake';

const TARGET_CASES = new Set(['HV2_05', 'HV2_07', 'HV2_12']);
const GENERIC_PREFIX = 'center your essay on how';

async function main() {
  const rawCases = await readFile('./scripts/data/page3-holdout-v2-cases.json', 'utf8');
  const cases = JSON.parse(rawCases) as Array<{
    case_id: string;
    title: string;
    raw_notes: string;
  }>;

  const results = [];

  for (const testCase of cases.filter((row) => TARGET_CASES.has(row.case_id))) {
    const normalizedRawInput = normalizeStudentText(testCase.raw_notes);
    const sessionId = `trace_${testCase.case_id}`;
    const now = new Date('2026-03-27T00:00:00.000Z').toISOString();

    const input: IntakeSessionInput = {
      session_id: sessionId,
      student_user_id: `trace_user_${testCase.case_id}`,
      subject_entity_id: `trace_subject_${testCase.case_id}`,
      story_entries: [
        {
          id: `entry_${testCase.case_id}`,
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
    const normalizedIntelligence = normalizeFirstMinuteDecision(normalizedRawInput, intelligence);
    const caseState = createSessionCaseState(normalizedRawInput, normalizedIntelligence);
    const evidenceStrength = predictEvidenceStrength({
      rawInput: testCase.raw_notes,
      normalizedInput: normalizedRawInput,
      intelligence: normalizedIntelligence,
      sessionCaseState: caseState,
    });

    const direction = deriveDirectionContent(normalizedIntelligence, caseState);
    const candidatePack = (direction.candidate_pack ?? []) as any[];
    const selected = candidatePack.find((candidate) => candidate.selected) ?? candidatePack[0] ?? null;

    const canonical = buildCanonicalPage3Payload({
      sessionId,
      caseId: `trace_subject_${testCase.case_id}`,
      rawInput: testCase.raw_notes,
      normalizedInput: normalizedRawInput,
      intakeInput: input,
      intake: normalizedIntelligence,
      evidenceStrength,
      requestedProductMode: evidenceStrength.route,
      effectiveProductMode: evidenceStrength.route,
      caseState,
    });

    const strongestTitle = direction.strongest.title ?? null;
    const selectedDirection = selected?.direction_line ?? null;
    const canonicalDisplayed = canonical.recommendation_packet.displayed_recommendation ?? null;
    const candidateDebugWinner = (canonical.candidate_debug.scores_by_candidate as any[]).find((candidate) => candidate.id === canonical.candidate_debug.winner_id) ?? null;
    const composition = selected?.composition_instrumentation ?? null;
    const strongestIntroduces = !!strongestTitle && strongestTitle.toLowerCase().startsWith(GENERIC_PREFIX) && !(selectedDirection ?? '').toLowerCase().startsWith(GENERIC_PREFIX);
    const canonicalIntroduces = !!canonicalDisplayed && canonicalDisplayed.toLowerCase().startsWith(GENERIC_PREFIX) && !(strongestTitle ?? '').toLowerCase().startsWith(GENERIC_PREFIX);
    const selectedIntroduces = !!selectedDirection && selectedDirection.toLowerCase().startsWith(GENERIC_PREFIX);

    const firstAppearance = selectedIntroduces
      ? 'raw_winner_candidate'
      : strongestIntroduces
        ? 'winner_mapping_or_surface'
        : canonicalIntroduces
          ? 'canonical_payload_assembly'
          : 'downstream_or_absent';

    results.push({
      case_id: testCase.case_id,
      title: testCase.title,
      pattern: normalizedIntelligence.narrative_pattern.primary_pattern,
      route: evidenceStrength.route,
      selected_winner: selected
        ? {
            id: selected.candidate_id,
            family: selected.recommendation_family,
            direction_line: selected.direction_line,
            surface_shell_id: selected.surface_shell_id,
            composition_instrumentation: composition,
          }
        : null,
      derive_direction_content: {
        strongest_title: strongestTitle,
        strongest_equals_selected_direction: strongestTitle === selectedDirection,
      },
      canonical_payload_input_value: strongestTitle,
      canonical_payload: {
        displayed_recommendation: canonicalDisplayed,
        essay_about: canonical.recommendation_packet.essay_about,
        why_this_direction: canonical.recommendation_packet.why_this_direction,
        winner_id: canonical.candidate_debug.winner_id,
        winner_family: canonical.candidate_debug.winner_family,
        winner_direction_line: candidateDebugWinner?.direction_line ?? null,
        routing_is_fallback: canonical.routing.is_fallback,
        route_reason_code: canonical.routing.route_reason_code,
      },
      overwrite_checks: {
        selected_to_strongest_changed: selectedDirection !== strongestTitle,
        strongest_to_canonical_changed: strongestTitle !== canonicalDisplayed,
        ambiguity_fallback_in_play: normalizedIntelligence.narrative_pattern.primary_pattern === 'unknown' && canonical.candidate_debug.winner_id === 'none',
        composition_fallback_replaced: composition?.fallback_replaced ?? null,
        composition_fallback_reason: composition?.fallback_reason ?? null,
      },
      first_generic_appearance: firstAppearance,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
