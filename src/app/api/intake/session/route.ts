// =============================================================
// src/app/api/intake/session/route.ts
// POST /api/intake/session
//
// FM-05: Intake session endpoint.
// Accepts rough student input, runs the intake orchestrator,
// runs the evidence-strength governor, and returns a
// SessionApiResponse with product_mode and shaped payload.
//
// Response shape is consumed directly by client screens.
// Frontend must route from product_mode — not from raw flags.
// =============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeStudentText, createSessionCaseState } from '@/lib/fm/case-state';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { predictEvidenceStrength, buildEvidenceFeatures } from '@/lib/ml/evidenceStrength/predict';
import { buildClarificationPayload } from '@/lib/fm/buildClarificationPayload';
import { buildBlankPagePayload } from '@/lib/fm/buildBlankPagePayload';
import { buildLightDirectionPayload } from '@/lib/fm/buildLightDirectionPayload';
import { buildEvidenceLogRecord, logEvidenceDecision } from '@/lib/fm/logEvidenceDecision';
import { evaluateBlankPageRollout } from '@/lib/release/blankPageRolloutGuard';
import { buildCanonicalPage3Payload } from '@/lib/fm/canonicalPage3Payload';
import type { IntakeIntelligenceObject, IntakeSessionInput, QuestionType, SessionApiResponse } from '@/types/intake';

// =============================================================
// REQUEST SHAPE
// =============================================================

interface IntakeSessionRequest {
  /** Free-text input from the student — rough notes, draft fragment, or raw thoughts. */
  raw_input: string;
  /** Optional: essay project ID this session belongs to. */
  subject_entity_id?: string;
  /** Optional: preserve the same intake session across clarification continuations. */
  session_id?: string;
  /** Optional: preserve prior question history for re-evaluation. */
  questions_asked?: QuestionType[];
  /** Optional: preserve prior attempt count across clarification continuations. */
  prior_attempt_count?: number;
}

// =============================================================
// HANDLER
// =============================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // --- Parse body ---
    let body: IntakeSessionRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Request body is not valid JSON', code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: 'MALFORMED_REQUEST' },
        { status: 400 }
      );
    }

    const normalizedRawInput = normalizeStudentText(body.raw_input);

    // --- Build session input ---
    const sessionId = body.session_id ?? crypto.randomUUID();
    const subjectEntityId = body.subject_entity_id ?? crypto.randomUUID();
    const now = new Date().toISOString();
    let studentUserId = `fm_guest_${sessionId}`;

    // --- Optional auth (fallback to guest for first-minute flow) ---
    const hasSupabaseEnv = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (hasSupabaseEnv) {
      try {
        const db = await createAuthClient();
        const {
          data: { user },
        } = await db.auth.getUser();
        if (user?.id) {
          studentUserId = user.id;
        }
      } catch (authErr) {
        console.warn('[POST /api/intake/session] Auth unavailable, using guest mode:', authErr);
      }
    }

    const input: IntakeSessionInput = {
      session_id: sessionId,
      student_user_id: studentUserId,
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
      prior_attempt_count: body.prior_attempt_count ?? 0,
      questions_asked: Array.isArray(body.questions_asked) ? body.questions_asked : [],
      rejected_source_ids: [],
      session_created_at: now,
    };

    // --- Run orchestrator ---
    const intelligence = await runIntakeOrchestrator(input);
    const normalizedIntelligence = normalizeFirstMinuteDecision(normalizedRawInput, intelligence);

    // --- Build session case state (used for feature extraction) ---
    const intelligenceTyped = normalizedIntelligence as IntakeIntelligenceObject;
    const caseState = createSessionCaseState(normalizedRawInput, intelligenceTyped);

    // --- Run evidence-strength governor ---
    const evidenceFeatures = buildEvidenceFeatures({
      rawInput: body.raw_input,
      normalizedInput: normalizedRawInput,
      intelligence: intelligenceTyped,
      sessionCaseState: caseState,
    });

    const evidenceStrength = predictEvidenceStrength({
      rawInput: body.raw_input,
      normalizedInput: normalizedRawInput,
      intelligence: intelligenceTyped,
      sessionCaseState: caseState,
    });

    const productMode = evidenceStrength.route;
    const blankPage = evidenceStrength.blank_page_classification;
    const rolloutDecision = evaluateBlankPageRollout({
      requestedMode: productMode,
      blankPageClassification: blankPage,
    });
    const effectiveProductMode = rolloutDecision.effectiveMode;

    if (productMode === 'blank_page_intake' && !rolloutDecision.activateBlankPageLane) {
      console.log(
        JSON.stringify({
          event: 'blank_page_rollout_guard',
          session_id: sessionId,
          requested_mode: productMode,
          effective_mode: effectiveProductMode,
          reason: rolloutDecision.reason,
          blank_page_mode: blankPage.blank_page_mode,
          blank_page_confidence: blankPage.blank_page_confidence,
        })
      );
    }

    // --- Shape payload based on product_mode ---
    let clarificationPayload: SessionApiResponse['clarification_payload'];
    let blankPageIntakePayload: SessionApiResponse['blank_page_intake_payload'];
    let lightDirectionPayload: SessionApiResponse['light_direction_payload'];
    let canonicalPage3Payload: SessionApiResponse['canonical_page3_payload'];
    let sharpeningQuestion: string | undefined;

    if (effectiveProductMode === 'blank_page_intake') {
      blankPageIntakePayload = buildBlankPagePayload({
        rawInput: normalizedRawInput,
        blankPageClassification: blankPage,
      });
      sharpeningQuestion = blankPageIntakePayload.recovery_question_primary;
    } else if (effectiveProductMode === 'clarification') {
      clarificationPayload = buildClarificationPayload(intelligenceTyped, evidenceFeatures, caseState, normalizedRawInput);
      sharpeningQuestion = clarificationPayload.primaryQuestion;
    } else if (effectiveProductMode === 'direction_light') {
      lightDirectionPayload = buildLightDirectionPayload(intelligenceTyped, evidenceFeatures, caseState);
      sharpeningQuestion = lightDirectionPayload.bestNextQuestion ?? undefined;
    }

    canonicalPage3Payload = buildCanonicalPage3Payload({
      sessionId,
      caseId: subjectEntityId,
      rawInput: body.raw_input,
      normalizedInput: normalizedRawInput,
      intakeInput: input,
      intake: intelligenceTyped,
      evidenceStrength,
      requestedProductMode: productMode,
      effectiveProductMode,
      caseState,
    });

    // --- Log for future ML training ---
    try {
      const logRecord = buildEvidenceLogRecord({
        sessionId,
        rawInput: body.raw_input,
        normalizedInput: normalizedRawInput,
        intelligence: intelligenceTyped,
        features: evidenceFeatures,
        prediction: evidenceStrength,
        blankPageIntakePayload,
        primaryQuestionShown: sharpeningQuestion ?? null,
      });
      logEvidenceDecision(logRecord);
    } catch {
      // Logging must never block the response
    }

    // --- Build response ---
    const response: SessionApiResponse = {
      intake_intelligence: intelligenceTyped,
      product_mode: effectiveProductMode,
      evidence_strength: evidenceStrength,
      blank_page_intake_detected: blankPage.blank_page_intake_detected,
      blank_page_mode: blankPage.blank_page_mode,
      blank_page_trigger_signals: blankPage.blank_page_trigger_signals,
      blank_page_recovery_reason: blankPage.blank_page_recovery_reason,
      blank_page_confidence: blankPage.blank_page_confidence,
      top_level_blank_page_route: blankPage.top_level_blank_page_route,
      sharpening_question: sharpeningQuestion,
      clarification_payload: clarificationPayload,
      blank_page_intake_payload: blankPageIntakePayload,
      light_direction_payload: lightDirectionPayload,
      canonical_page3_payload: canonicalPage3Payload,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('[POST /api/intake/session] Unhandled error:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// =============================================================
// VALIDATION
// =============================================================

function validateRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return 'Request body must be an object';
  }
  const b = body as Record<string, unknown>;
  if (!b['raw_input'] || typeof b['raw_input'] !== 'string') {
    return 'raw_input is required and must be a string';
  }
  if (b['raw_input'].trim().length < 10) {
    return 'raw_input must be at least 10 characters';
  }
  if (b['session_id'] !== undefined && typeof b['session_id'] !== 'string') {
    return 'session_id must be a string when provided';
  }
  if (b['subject_entity_id'] !== undefined && typeof b['subject_entity_id'] !== 'string') {
    return 'subject_entity_id must be a string when provided';
  }
  if (b['prior_attempt_count'] !== undefined && typeof b['prior_attempt_count'] !== 'number') {
    return 'prior_attempt_count must be a number when provided';
  }
  if (b['questions_asked'] !== undefined && !Array.isArray(b['questions_asked'])) {
    return 'questions_asked must be an array when provided';
  }
  return null;
}
