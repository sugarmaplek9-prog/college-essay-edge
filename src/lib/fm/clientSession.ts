import { FM_CASE_STATE_KEY, type SessionCaseState } from '@/lib/fm/case-state';
import type { IntakeIntelligenceObject, SessionApiResponse } from '@/types/intake';

export const FM_INTELLIGENCE_KEY = 'fm_intelligence';
export const FM_PRODUCT_MODE_KEY = 'fm_product_mode';
export const FM_CLARIFICATION_PAYLOAD_KEY = 'fm_clarification_payload';
export const FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY = 'fm_blank_page_intake_payload';
export const FM_LIGHT_DIRECTION_PAYLOAD_KEY = 'fm_light_direction_payload';
export const FM_CANONICAL_PAGE3_PAYLOAD_KEY = 'fm_canonical_page3_payload';
export const FM_RESUME_DRAFT_KEY = 'fm_resume_draft';
export const FM_RESUME_ACTIVE_KEY = 'fm_resume_active';
export const FM_OPENING_DRAFT_KEY = 'fm_opening_draft';
export const FM_COACH_MEMORY_KEY = 'fm_coach_memory';

export function persistSessionResponse(
  apiResponse: SessionApiResponse,
  caseState: SessionCaseState
): void {
  sessionStorage.setItem(FM_INTELLIGENCE_KEY, JSON.stringify(apiResponse.intake_intelligence));
  sessionStorage.setItem(FM_CASE_STATE_KEY, JSON.stringify(caseState));
  sessionStorage.setItem(FM_PRODUCT_MODE_KEY, apiResponse.product_mode);

  if (apiResponse.clarification_payload) {
    sessionStorage.setItem(FM_CLARIFICATION_PAYLOAD_KEY, JSON.stringify(apiResponse.clarification_payload));
  } else {
    sessionStorage.removeItem(FM_CLARIFICATION_PAYLOAD_KEY);
  }

  if (apiResponse.blank_page_intake_payload) {
    sessionStorage.setItem(FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY, JSON.stringify(apiResponse.blank_page_intake_payload));
  } else {
    sessionStorage.removeItem(FM_BLANK_PAGE_INTAKE_PAYLOAD_KEY);
  }

  if (apiResponse.light_direction_payload) {
    sessionStorage.setItem(FM_LIGHT_DIRECTION_PAYLOAD_KEY, JSON.stringify(apiResponse.light_direction_payload));
  } else {
    sessionStorage.removeItem(FM_LIGHT_DIRECTION_PAYLOAD_KEY);
  }

  if (apiResponse.canonical_page3_payload) {
    sessionStorage.setItem(FM_CANONICAL_PAGE3_PAYLOAD_KEY, JSON.stringify(apiResponse.canonical_page3_payload));
  } else {
    sessionStorage.removeItem(FM_CANONICAL_PAGE3_PAYLOAD_KEY);
  }
}

export function getStoredIntelligence(): IntakeIntelligenceObject | null {
  const raw = sessionStorage.getItem(FM_INTELLIGENCE_KEY);
  return raw ? JSON.parse(raw) as IntakeIntelligenceObject : null;
}

export function getStoredCaseState(): SessionCaseState | null {
  const raw = sessionStorage.getItem(FM_CASE_STATE_KEY);
  return raw ? JSON.parse(raw) as SessionCaseState : null;
}

export function setResumeDraft(text: string): void {
  sessionStorage.setItem(FM_RESUME_DRAFT_KEY, text);
  sessionStorage.setItem(FM_RESUME_ACTIVE_KEY, 'true');
}

export function getResumeDraft(): string | null {
  if (sessionStorage.getItem(FM_RESUME_ACTIVE_KEY) !== 'true') {
    return null;
  }

  return sessionStorage.getItem(FM_RESUME_DRAFT_KEY);
}

export function clearResumeDraft(): void {
  sessionStorage.removeItem(FM_RESUME_ACTIVE_KEY);
  sessionStorage.removeItem(FM_RESUME_DRAFT_KEY);
}

export function setOpeningDraft(text: string): void {
  sessionStorage.setItem(FM_OPENING_DRAFT_KEY, text);
}

export function getOpeningDraft(): string | null {
  return sessionStorage.getItem(FM_OPENING_DRAFT_KEY);
}

export function clearOpeningDraft(): void {
  sessionStorage.removeItem(FM_OPENING_DRAFT_KEY);
}

export function setCoachMemory(memory: unknown): void {
  sessionStorage.setItem(FM_COACH_MEMORY_KEY, JSON.stringify(memory));
}

export function getCoachMemory<T>(): T | null {
  const raw = sessionStorage.getItem(FM_COACH_MEMORY_KEY);
  return raw ? JSON.parse(raw) as T : null;
}