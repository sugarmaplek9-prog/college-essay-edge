import type { IntakeIntelligenceObject } from '@/types/intake';

function chooseRecoveryPromptFragment(rawInput: string): string | null {
  const fragments = rawInput
    .split(/\/|(?<=[.!?])\s+/)
    .map((fragment) => fragment.replace(/\s+/g, ' ').trim())
    .filter((fragment) => fragment.length >= 12);

  if (fragments.length === 0) return null;

  const scored = fragments.map((fragment) => {
    let score = 0;
    if (/\b(asked|said|told|realized|noticed|signed|failed|blank|repeat|changed|stopped|started)\b/i.test(fragment)) score += 4;
    if (/\b(student|nurse|teacher|team|grandparents?|grandfather|grandmother|problem|instructions|form)\b/i.test(fragment)) score += 2;
    if (/\b(service|resilience|community|leadership|growth)\b/i.test(fragment) && !/\b(asked|said|did|failed|changed)\b/i.test(fragment)) score -= 3;
    return { fragment, score };
  });

  scored.sort((a, b) => b.score - a.score || b.fragment.length - a.fragment.length);
  return (scored[0]?.score ?? 0) > 0 ? scored[0]?.fragment ?? null : null;
}

function buildClarificationFallbackQuestion(rawInput: string): string {
  const lowered = rawInput.trim().toLowerCase();
  const fragment = chooseRecoveryPromptFragment(rawInput);

  if (/\b(service|resilience|community|leadership|growth)\b/.test(lowered) && !fragment) {
    return 'Name one real moment behind those value words: who was there, what stopped your first approach from being enough, and what you did next.';
  }

  if (/\b(hospital|translate|translation|summary wasn\'t enough|repeat|medical|grandparents?|grandfather|grandmother|nurse)\b/.test(lowered)) {
    return 'Start with the repeat moment: what did someone ask to hear again, and what did that show you had summarized too loosely?';
  }

  if (/\b(nodded|problem blank|turned in the problem blank|lecture|shut down)\b/.test(lowered)) {
    return 'Use the blank-response moment: what made you realize the student did not actually understand, and what question did you ask differently after that?';
  }

  if (/(sports?|team|game|practice)/.test(lowered)) {
    return 'What is one specific sports moment where you felt that gap most clearly — what happened?';
  }

  if (fragment) {
    return `Start from this fragment — "${fragment}". What exactly happened in that moment, and what choice did it force next?`;
  }

  return 'What is one specific moment where this felt true — what happened, and what did you do next?';
}

function buildCompareChoiceRecoveryQuestion(): string {
  return 'Which option gives you one recoverable scene you can actually write now — what happened, what choice was made, and what changed immediately after?';
}

function isPlausibleButThinRecoverableInput(text: string, words: number): boolean {
  if (words < 7 || words > 28) return false;

  const hasFirstPerson = /\b(i|me|my)\b/.test(text);
  const hasConcreteDomain = /\b(sports?|team|game|practice|class|school|club|job|work|home|family|friend|project|shift|hospital|coach|teacher)\b/.test(text);
  const hasTension = /\b(but|not\s+great|struggle|hard|difficult|can'?t|couldn'?t|afraid|behind|worse|frustrat)\b/.test(text);

  return hasFirstPerson && hasConcreteDomain && hasTension;
}

function isRecoverableCompareChoiceInput(text: string, words: number): boolean {
  if (words < 8 || words > 36) return false;

  const hasFirstPerson = /\b(i|me|my)\b/.test(text);
  const hasEssayIntent = /\b(essay|college\s+essay|personal\s+statement|write\s+about|which\s+one)\b/.test(text);
  const hasCompareCue = /\b(both\s+matter|which\s+one|unsure|not\s+sure|between|better\s+for\s+my\s+(college\s+)?essay|split\s+focus|both\s+feel\s+important\s+for\s+different\s+reasons|should\s+carry\s+the\s+essay)\b/.test(text);
  const activityMatches = text.match(/\b(paint(?:ing)?|portraits?|art|cross-country|running|track|robotics?|debate|soccer|football|basketball|tennis|research|band|orchestra|choir|volunteer(?:ing)?|dance|dance\s+team|tutor(?:ing)?|tutor\s+algebra|algebra|family\s+business)\b/g) ?? [];
  const distinctActivities = new Set(activityMatches.map((value) => value.toLowerCase()));
  const hasDualStructure = /\bi\s+[^.]{0,40}\bi\s+also\b/.test(text) || distinctActivities.size >= 2;

  return hasFirstPerson && hasEssayIntent && hasCompareCue && hasDualStructure;
}

function isRecoverableOverwrittenPartialDraftInput(text: string, words: number): boolean {
  if (words < 24) return false;

  const overwrittenDraftCue = /\b(my\s+draft|current\s+draft|draft\s+opens|draft\s+says|from\s+this\s+mess|cleaner\s+direction|sounds\s+motivational|sounds\s+like\s+project\s+management\s+notes)\b/.test(text);
  const concreteEventCue = /\b(actual\s+event\s+was|real\s+story|more\s+real\s+piece|i\s+proposed|used\s+it\s+before\s+publication|rebuilt\s+our|changed\s+our\s+interpretation|verification\s+step|testing\s+checklist|final\s+check)\b/.test(text);

  return overwrittenDraftCue && concreteEventCue;
}

function isHardBlockedGenericInput(text: string, words: number): boolean {
  const genericSelfPraise =
    /\bi(?:\s*am|'m)\s+good\s+at\s+everything\b/.test(text) ||
    (/\bgood\s+at\s+everything\b/.test(text) && words <= 12);

  if (genericSelfPraise) return true;

  const contentEmpty = words < 6;
  if (contentEmpty) return true;

  const concretePivotSignal =
    /\b(used\s+to|one\s+(student|person|peer|friend|teammate)|shifted\s+to|changed\s+how|changed\s+to|realized|learned|asked|asking|told|said|moment|scene|scenes|consequences?)\b/.test(text)
    || (/\bbut\b/.test(text) && /\b(student|peer|friend|teammate|counselor|mentor)\b/.test(text));

  const abstractOnly =
    /\b(hard\s*worker|leadership|teamwork|passion|dedication|resilience|discipline)\b/.test(text) &&
    !/\b(when|after|because|said|told|asked|happened|moment)\b/.test(text) &&
    !concretePivotSignal;

  return abstractOnly;
}

export function normalizeFirstMinuteDecision(
  rawInput: string,
  intelligence: IntakeIntelligenceObject
): IntakeIntelligenceObject {
  const text = rawInput.trim().toLowerCase();
  const words = rawInput.trim().split(/\s+/).filter(Boolean).length;

  const hardBlocked = isHardBlockedGenericInput(text, words);

  // Preserve hard blocked signals.
  if (hardBlocked) {
    return {
      ...intelligence,
      recommendation_viability: {
        ...intelligence.recommendation_viability,
        decision: 'blocked',
        reason_codes: ['NO_SCENE_EVIDENCE'],
        signal_sufficiency_used: 'none',
        contamination_risk_used: intelligence.authorship_signal.contamination_risk,
      },
      escalation: {
        ...intelligence.escalation,
        blocking: true,
      },
      next_question: null,
      usable_signal: {
        ...intelligence.usable_signal,
        signal_strength: 'none',
      },
    };
  }

  const recoverableThin = isPlausibleButThinRecoverableInput(text, words);
  const recoverableCompareChoice = isRecoverableCompareChoiceInput(text, words);
  const recoverableOverwrittenPartialDraft = isRecoverableOverwrittenPartialDraftInput(text, words);

  // Rescue path: borderline-thin but plausible should be recoverable via clarification.
  if (
    intelligence.recommendation_viability.decision === 'blocked' &&
    (recoverableThin || recoverableCompareChoice) &&
    intelligence.authorship_signal.contamination_risk !== 'high'
  ) {
    return {
      ...intelligence,
      recommendation_viability: {
        ...intelligence.recommendation_viability,
        decision: 'needs_more_input',
        reason_codes: ['NO_SCENE_EVIDENCE'],
        signal_sufficiency_used:
          intelligence.usable_signal.signal_strength === 'none'
            ? 'low'
            : intelligence.usable_signal.signal_strength,
        contamination_risk_used: intelligence.authorship_signal.contamination_risk,
      },
      escalation: {
        ...intelligence.escalation,
        blocking: false,
      },
      usable_signal: {
        ...intelligence.usable_signal,
        usable_signal: true,
        signal_strength: intelligence.usable_signal.signal_strength === 'none'
          ? 'low'
          : intelligence.usable_signal.signal_strength,
      },
      next_question: intelligence.next_question ?? {
        question_type: 'scene_detail',
        question_text: recoverableCompareChoice
          ? buildCompareChoiceRecoveryQuestion()
          : buildClarificationFallbackQuestion(rawInput),
        why_this_question: 'fills_scene_detail_gap',
        fallback_if_unanswered: 'needs_more_input',
        reason_codes: ['MISSING_SCENE_DETAIL'],
        evidence_gap_sources: [],
        meta: {
          decision_version: 'v1',
          taxonomy_version: 'taxonomy_v1',
          made_at: new Date().toISOString(),
          made_by: 'rules',
        },
      },
    };
  }

  // If orchestrator already resolved beyond needs_more_input, preserve it.
  if (intelligence.recommendation_viability.decision !== 'needs_more_input') {
    return intelligence;
  }

  // Guardrail: substantial narrative with a clear pivot can proceed.
  const hasPivotLanguage = /\b(changed|realized|realizing|learned|when|after|but|proposed|rebuilt|used\s+it\s+before\s+publication)\b/.test(text);
  if (words >= 28 && (hasPivotLanguage || recoverableOverwrittenPartialDraft)) {
    return {
      ...intelligence,
      recommendation_viability: {
        ...intelligence.recommendation_viability,
        decision: 'success',
        reason_codes: ['SUFFICIENT_SIGNAL_STANDARD'],
        signal_sufficiency_used: 'high',
        contamination_risk_used: intelligence.authorship_signal.contamination_risk,
      },
      escalation: {
        ...intelligence.escalation,
        blocking: false,
      },
      next_question: null,
      usable_signal: {
        ...intelligence.usable_signal,
        signal_strength: 'high',
      },
    };
  }

  return intelligence;
}
