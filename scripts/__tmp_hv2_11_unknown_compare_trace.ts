import { readFile } from 'node:fs/promises';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeStudentText, createSessionCaseState } from '@/lib/fm/case-state';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { predictEvidenceStrength } from '@/lib/ml/evidenceStrength/predict';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { buildCanonicalPage3Payload } from '@/lib/fm/canonicalPage3Payload';
import type { IntakeSessionInput } from '@/types/intake';

const HARD_FAIL_REASONS = new Set([
	'claim_first_clarity_fail',
	'plain_claim_clarity_fail',
	'why_coaching_clarity_fail',
	'no_concrete_next_step',
	'essay_about_restate_fail',
	'comprehension_fail',
]);

async function main() {
	const rawCases = await readFile('./scripts/data/frozen/page3-holdout-v2-cases.frozen.json', 'utf8');
	const allCases = JSON.parse(rawCases) as Array<{ case_id: string; title: string; raw_notes: string }>;
	const testCase = allCases.find((row) => row.case_id === 'HV2_11');
	if (!testCase) throw new Error('HV2_11 not found');

	const normalizedRawInput = normalizeStudentText(testCase.raw_notes);
	const now = new Date('2026-03-27T00:00:00.000Z').toISOString();
	const intakeInput: IntakeSessionInput = {
		session_id: 'trace_hv2_11',
		student_user_id: 'trace_user_hv2_11',
		subject_entity_id: 'trace_subject_hv2_11',
		story_entries: [{
			id: 'trace_entry_hv2_11',
			title: 'Initial notes',
			text: normalizedRawInput,
			created_at: now,
		}],
		draft_text: null,
		draft_id: null,
		school_context: null,
		student_profile: null,
		prior_attempt_count: 0,
		questions_asked: [],
		rejected_source_ids: [],
		session_created_at: now,
	};

	const intelligence = await runIntakeOrchestrator(intakeInput);
	const normalizedIntelligence = normalizeFirstMinuteDecision(normalizedRawInput, intelligence);
	const caseState = createSessionCaseState(normalizedRawInput, normalizedIntelligence);
	const evidenceStrength = predictEvidenceStrength({
		rawInput: testCase.raw_notes,
		normalizedInput: normalizedRawInput,
		intelligence: normalizedIntelligence,
		sessionCaseState: caseState,
	});

	const direction = deriveDirectionContent(normalizedIntelligence, caseState);
	const candidates = (direction.candidate_pack ?? []) as any[];
	const strictSurvivors = candidates.filter((candidate) => {
		const reasons = candidate.rejection_reasons ?? [];
		return reasons.length < 2 && !reasons.some((reason: string) => HARD_FAIL_REASONS.has(reason));
	});

	const canonical = buildCanonicalPage3Payload({
		sessionId: 'trace_hv2_11',
		caseId: 'trace_subject_hv2_11',
		rawInput: testCase.raw_notes,
		normalizedInput: normalizedRawInput,
		intakeInput,
		intake: normalizedIntelligence,
		evidenceStrength,
		requestedProductMode: evidenceStrength.route,
		effectiveProductMode: evidenceStrength.route,
		caseState,
	});

	console.log(JSON.stringify({
		case_id: testCase.case_id,
		route: evidenceStrength.route,
		displayed_recommendation: canonical.recommendation_packet.displayed_recommendation,
		winner_id: canonical.candidate_debug.winner_id,
		winner_family: canonical.candidate_debug.winner_family,
		strict_survivor_count: strictSurvivors.length,
		candidates: candidates.map((candidate) => ({
			id: candidate.candidate_id,
			family: candidate.recommendation_family,
			direction_line: candidate.direction_line,
			hinge_span: candidate.hinge_span,
			source_anchor_spans: candidate.source_anchor_spans,
			rejection_reasons: candidate.rejection_reasons,
			selected: candidate.selected,
		})),
	}, null, 2));
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
