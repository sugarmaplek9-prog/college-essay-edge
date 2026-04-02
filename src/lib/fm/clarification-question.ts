// =============================================================
// src/lib/fm/clarification-question.ts
//
// Generates one concrete, case-specific clarification question
// from extracted narrative signals and the missing-signal
// target.
//
// Rules:
//   - Reference actual details from the student's text
//   - Target exactly one missing signal
//   - Sound like a human editor reading the story
//   - Never use generic reflection prompts
//
// Hard bans — must never appear in output:
//   "what changed in how you judge yourself"
//   "what did this teach you"
//   "how did your role change"
//   "what did this mean to you"
//   "how did this shape you"
//   "self-understanding" / "personal growth"
// =============================================================

import type { NarrativeSignals } from './narrative-signals';
import type { MissingSignalTarget } from './missing-signal-detector';

// =============================================================
// Public contract
// =============================================================

export interface ClarificationQuestionInput {
  rawInput: string;
  signals: NarrativeSignals;
  target: MissingSignalTarget;
  priorQuestions?: string[];
}

/**
 * Generate one concrete, story-specific clarification question.
 * Returns null if target is null or no useful question can be formed.
 */
export function generateClarificationQuestion(
  input: ClarificationQuestionInput
): string | null {
  const { signals, target } = input;
  if (!target) return null;

  const actor = signals.actors[0] ?? null;

  switch (target) {
    case 'conflict_detail':
      return buildConflictDetailQuestion(signals, actor);
    case 'exact_words':
      return buildExactWordsQuestion(signals, actor);
    case 'decision_reason':
      return buildDecisionReasonQuestion(signals, actor);
    case 'realization':
      return buildRealizationQuestion(signals, actor);
    case 'repair_action':
      return buildRepairActionQuestion(signals, actor);
    case 'behavior_change':
      return buildBehaviorChangeQuestion(signals, actor);
    case 'consequence_detail':
      return buildConsequenceDetailQuestion(signals, actor);
    default:
      return null;
  }
}

// =============================================================
// Helpers
// =============================================================

/** Trim a sentence to N words, appending "…" if truncated. */
function trimToWords(sentence: string, maxWords = 10): string {
  const words = sentence.trim().split(/\s+/);
  if (words.length <= maxWords) return sentence.trim();
  return words.slice(0, maxWords).join(' ') + '…';
}

/** Strip leading "I", "He", "She", "They" + verb starters for use inside a question. */
function stripSubjectPrefix(sentence: string): string {
  return sentence
    .trim()
    .replace(/^(I\s+|He\s+|She\s+|They\s+|And\s+|But\s+|So\s+|Then\s+)/i, '')
    .replace(/^[a-z]/, (c) => c);
}

/**
 * Extract the conflict type word ("argument", "fight", "confrontation", etc.)
 * from the tension event sentence.
 */
function extractConflictLabel(tensionEvent: string | undefined): string | null {
  if (!tensionEvent) return null;
  const m = tensionEvent.match(
    /\b(argument|fight|conflict|confrontation|altercation|disagreement|dispute|tension)\b/i
  );
  return m?.[1]?.toLowerCase() ?? null;
}

/**
 * Extract what the student did for repair (convert to base form for question use).
 * "I apologized" → "apologize"
 * "I went back" → "go back"
 */
function extractRepairBase(repairAction: string): string | null {
  const REPAIR_MAP: Record<string, string> = {
    apologized: 'apologize',
    'emailed her': 'email her',
    'emailed him': 'email him',
    'emailed them': 'email them',
    emailed: 'email',
    called: 'call',
    texted: 'text',
    'went back': 'go back',
    'came back': 'come back',
    returned: 'return',
    'reached out': 'reach out',
    'made up': 'make up',
    'fixed it': 'fix it',
    'corrected it': 'correct it',
    'corrected myself': 'correct myself',
    'addressed it': 'address it',
  };

  for (const [past, base] of Object.entries(REPAIR_MAP)) {
    if (repairAction.toLowerCase().includes(past)) return base;
  }

  // Fallback: extract the first verb phrase after "I" and attempt basic de-tensing
  const m = repairAction.match(/\bI\s+(\w+(?:\s+\w+)?)/i);
  if (!m) return null;
  const verbPhrase = m[1].toLowerCase();
  const parts = verbPhrase.split(/\s+/);
  let verb = parts[0] ?? '';
  const object = parts.slice(1).join(' ');

  if (verb.endsWith('ied') && verb.length > 4) {
    verb = `${verb.slice(0, -3)}y`;
  } else if (verb.endsWith('ed') && verb.length > 3) {
    verb = verb.slice(0, -2);
  }

  return object ? `${verb} ${object}` : verb;
}

/**
 * Pull the core action phrase from a consequence sentence for use in a question.
 * "He sent me home" → "sent you home"
 */
function extractConsequenceAction(consequence: string): string | null {
  // Match "he/she/they [verb] me/you [complement]"
  const m = consequence.match(
    /\b(?:he|she|they)\s+(sent\s+(?:me|you)\s+\w+|asked\s+(?:me|you)\s+to\s+\w+|told\s+(?:me|you)\s+to\s+\w+|kicked\s+(?:me|you)\s+out|wrote\s+(?:me|you)\s+up)/i
  );
  if (m) {
    return m[1].replace(/\bme\b/g, 'you').replace(/\bMy\b/, 'your');
  }
  // Fallback: use the sentence shortened
  const trimmed = consequence.trim();
  if (trimmed.length <= 50) {
    return trimmed.replace(/^[A-Z]/, (c) => c.toLowerCase()).replace(/\.$/, '');
  }
  return null;
}

// =============================================================
// Question builders — one per MissingSignalTarget
// =============================================================

/**
 * conflict_detail: We know there was a conflict but not what it was about.
 *
 * Good:  "What was the argument with your manager actually about?"
 * Bad:   "What changed in how you judged yourself?"
 */
function buildConflictDetailQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  const conflictLabel = extractConflictLabel(signals.tensionEvent);

  if (actor && conflictLabel) {
    return `What was the ${conflictLabel} with ${actor} actually about?`;
  }
  if (actor && signals.tensionEvent) {
    return `What started the tension with ${actor}? Was there a specific comment, decision, or thing you did that set it off?`;
  }
  if (conflictLabel) {
    return `What was the ${conflictLabel} actually about? What triggered it?`;
  }
  if (signals.tensionEvent) {
    return `What caused the conflict? Was there a specific moment or comment that started it?`;
  }
  return `What was the disagreement or tension actually about? What triggered it?`;
}

/**
 * exact_words: A consequence or event exists but no vivid scene detail.
 *
 * Good:  "What exactly did your manager say when he sent you home?"
 * Bad:   "What did this mean to you?"
 */
function buildExactWordsQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  const consequenceAction = signals.consequence
    ? extractConsequenceAction(signals.consequence)
    : null;

  if (actor && consequenceAction) {
    return `What exactly did ${actor} say when they ${consequenceAction}?`;
  }
  if (actor && signals.consequence) {
    return `What exactly did ${actor} say in that moment? What were the actual words?`;
  }
  if (signals.consequence) {
    return `Walk me through that exact moment — what was said, word for word?`;
  }
  if (signals.tensionEvent) {
    const label = extractConflictLabel(signals.tensionEvent);
    return label
      ? `Walk me back to the start of that ${label} — where were you, and what was said first?`
      : `Walk me back to that moment — where were you, and what happened first?`;
  }
  return `What was actually said or done in that moment, word for word?`;
}

/**
 * decision_reason: A concrete follow-up happened, but we do not know why.
 *
 * Good: "What made you decide to come back the next day?"
 */
function buildDecisionReasonQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  const repairBase = signals.repairAction
    ? extractRepairBase(signals.repairAction)
    : null;

  if (repairBase) {
    return `What made you decide to ${repairBase}?`;
  }

  if (actor && signals.consequence) {
    return `After that moment with ${actor}, what made you decide to do something about it?`;
  }

  return 'What made you decide to do something different after that moment?';
}

/**
 * realization: Repair or consequence exists but no internal shift described.
 *
 * Good:  "What made you decide to come back the next day?"
 * Bad:   "What did this teach you about growth?"
 */
function buildRealizationQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  const repairBase = signals.repairAction
    ? extractRepairBase(signals.repairAction)
    : null;

  if (signals.consequence && actor) {
    const consequenceAction = extractConsequenceAction(signals.consequence);
    if (consequenceAction) {
      return `After ${actor} ${consequenceAction} — what were you actually thinking? Not the lesson, just what went through your head right then.`;
    }
    return `After that happened with ${actor} — what were you actually thinking? Not the lesson you drew later — what did you think right in that moment?`;
  }

  if (signals.consequence) {
    return `After that happened — what were you actually thinking right then? Not the takeaway — what went through your head in the moment?`;
  }

  return `What clicked right before you decided to do something about it? Not a general lesson — what did you actually think or notice?`;
}

/**
 * repair_action: Realization described but no follow-through action.
 *
 * Good:  "After that realization, what did you actually do differently?"
 * Bad:   "How did your role change?"
 */
function buildRepairActionQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  if (signals.realizationMoment) {
    const realizationSnippet = trimToWords(
      stripSubjectPrefix(signals.realizationMoment),
      9
    );
    return `After "${realizationSnippet}" — what did you do first to change your approach?`;
  }

  if (actor) {
    return `After that moment with ${actor}, what did you actually do? Give me the first specific thing you did differently.`;
  }

  return `What did you do after that moment? Give me the first specific, concrete thing you actually did differently.`;
}

/**
 * behavior_change: Both realization and repair present, but no lasting change.
 *
 * Good:  "After coming back to apologize, what's one thing you actually do differently now?"
 * Bad:   "How did this shape you?"
 */
function buildBehaviorChangeQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  const repairBase = signals.repairAction
    ? extractRepairBase(signals.repairAction)
    : null;

  if (repairBase) {
    return `After coming back to ${repairBase}, what's one thing you actually do differently now? Something concrete, not just an attitude.`;
  }

  if (actor) {
    return `What's one thing you do differently now because of what happened with ${actor}? Something a person watching could actually see.`;
  }

  return `What's one concrete thing you do differently now because of that experience? Not a general attitude — something a person watching could actually see.`;
}

/**
 * consequence_detail: Tension exists but no specific result described yet.
 *
 * Good:  "What happened right after the argument with your manager?"
 * Bad:   "What did this mean to you?"
 */
function buildConsequenceDetailQuestion(
  signals: NarrativeSignals,
  actor: string | null
): string {
  const conflictLabel = extractConflictLabel(signals.tensionEvent);

  if (actor && conflictLabel) {
    return `What happened right after the ${conflictLabel} with ${actor}? What was the immediate result?`;
  }
  if (actor && signals.tensionEvent) {
    return `What happened right after that with ${actor}? What did they do or say next?`;
  }
  if (conflictLabel) {
    return `What happened right after the ${conflictLabel}? What was the immediate result?`;
  }
  return `What happened immediately after? What was the direct result of that moment?`;
}
