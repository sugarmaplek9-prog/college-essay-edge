// =============================================================
// src/lib/fm/narrative-signals.ts
//
// Extracts structured narrative signals directly from raw
// student text. Text-analysis only — no AI calls.
//
// Identifies the concrete story elements already present so
// the missing-signal detector can determine what to ask next.
//
// "This does not need to be perfect. It just needs to reliably
// identify the obvious story pieces already present in the
// user input." — Engineering spec
// =============================================================

export interface NarrativeSignals {
  /** Named relationships present — e.g. "my manager", "my coach" */
  actors: string[];
  /** Concrete past-tense event sentences */
  keyEvents: string[];
  /** Sentence containing the conflict/tension event, if any */
  tensionEvent?: string;
  /** Sentence containing a realization or internal shift, if any */
  realizationMoment?: string;
  /** Sentence describing what resulted / what happened to the student */
  consequence?: string;
  /** Sentence describing what the student did to follow up or repair */
  repairAction?: string;
  /** Sentence describing changed behavior afterward */
  behaviorChange?: string;
}

// =============================================================
// Extraction patterns
// =============================================================

/**
 * Named relationship roles that identify another person in the story.
 * Matched as "my {role}", "a {role}", "the {role}", or "our {role}".
 */
const ACTOR_PATTERN = /\b(?:my|a|an|the|our)\s+(manager|supervisor|boss|director|coach|teacher|professor|instructor|tutor|counselor|advisor|mentor|nurse|doctor|therapist|captain|teammate|partner|classmate|colleague|friend|roommate|parent|mom|mother|dad|father|brother|sister|sibling|aunt|uncle|grandma|grandpa|grandmother|grandfather|neighbor|judge|officer|trainer|principal|dean|editor|reviewer|interviewer)\b/gi;

/** Conflict or challenge language patterns */
const TENSION_PATTERNS = [
  /\b(got\s+into\s+(?:an?\s+)?(?:argument|fight|conflict|confrontation|disagreement))\b/i,
  /\b(had\s+(?:\w+\s+){0,2}(?:argument|fight|conflict|confrontation|disagreement))\b/i,
  /\b(?:an?\s+)?(?:argument|fight|confrontation|altercation|dispute)\s+(?:with|about|over)\b/i,
  /\b(yelled\s+at\s+me|screamed\s+at\s+me|called\s+me\s+out|criticized\s+me|corrected\s+me|reprimanded\s+me|scolded\s+me|warned\s+me|pulled\s+me\s+aside)\b/i,
  /\b(I\s+(?:messed\s+up|failed|made\s+a\s+mistake|got\s+it\s+wrong|was\s+wrong|screwed\s+up|let\s+(?:him|her|them|everyone)\s+down))\b/i,
  /\b(kicked\s+out|sent\s+(?:me|home)|asked\s+(?:me|us)\s+to\s+leave|told\s+(?:me|us)\s+to\s+(?:go|leave|stop)|removed\s+me|fired\s+me)\b/i,
];

/** Internal realization or shift patterns */
const REALIZATION_PATTERNS = [
  /\bI\s+(?:finally\s+)?(realized|noticed|understood|recognized|saw\s+that|knew|discovered|found\s+out|learned)\b/i,
  /\bit\s+(?:hit\s+me|dawned\s+on\s+me|clicked|all\s+made\s+sense|became\s+clear)\b/i,
  /\bI\s+(?:could\s+see|could\s+finally\s+see|started\s+to\s+see|began\s+to\s+understand)\b/i,
  /\bthe\s+truth\s+(?:was|is|hit\s+me)\b/i,
];

/** What resulted — a direct consequence to the student */
const CONSEQUENCE_PATTERNS = [
  /\b(?:he|she|they)\s+(?:sent\s+me|asked\s+me\s+to\s+leave|told\s+me\s+to\s+go|told\s+me\s+to\s+leave|told\s+me\s+to\s+stop|made\s+me\s+leave|kicked\s+me\s+out|wrote\s+me\s+up)\b/i,
  /\bmy\s+\w+\s+(?:sent\s+me|asked\s+me\s+to|told\s+me\s+to|kicked\s+me\s+out)\b/i,
  /\bI\s+(?:had\s+to\s+leave|was\s+removed|was\s+forced\s+to|got\s+cut|was\s+cut\s+from|lost\s+my|lost\s+the|didn't\s+get|didn't\s+make)\b/i,
  /\b(?:as\s+a\s+result|the\s+result\s+was|which\s+meant\s+I|so\s+I\s+had\s+to)\b/i,
];

/** What the student did to follow up or make it right */
const REPAIR_PATTERNS = [
  /\bI\s+(apologized|went\s+back|came\s+back|returned|reached\s+out|emailed\s+(?:him|her|them)|called\s+(?:him|her|them)|texted\s+(?:him|her|them))\b/i,
  /\bI\s+(?:made\s+up|made\s+it\s+right|fixed\s+it|corrected\s+(?:it|myself)|addressed\s+it)\b/i,
  /\bthe\s+next\s+(?:day|morning|week|time)\s+I\b/i,
  /\bI\s+(?:decided\s+to|chose\s+to)\s+(?:go\s+back|return|apologize|reach\s+out|fix|address)\b/i,
];

/** Forward-looking changed behavior */
const BEHAVIOR_CHANGE_PATTERNS = [
  /\bnow\s+I\s+(?:always|never|make\s+sure|try\s+to|check|ask\s+first|listen|pause)\b/i,
  /\bfrom\s+(?:then|that\s+day|that\s+moment|that\s+point)\s+on\b/i,
  /\bI\s+(?:started|stopped|began)\s+(?:to\s+)?\w+ing\b/i,
  /\bever\s+since\s+(?:then|that)\b/i,
  /\bI\s+(?:still|always|no\s+longer)\s+\w+\b.*\btoday\b/i,
];

/** Strongly past-tense action verbs for key-event detection */
const PAST_TENSE_VERB =
  /\b(went|came|did|made|got|said|told|asked|took|left|called|saw|heard|found|thought|felt|started|stopped|decided|tried|worked|helped|failed|succeeded|changed|moved|wrote|talked|realized|understood|led|won|lost|broke|built|became|began|ended|reached|walked|returned|stayed|left|ran|sat|stood|looked|turned|opened|handed|showed|received|sent)\b/i;

// =============================================================
// Helpers
// =============================================================

/** Split into sentences preserving the period. */
function toSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

/** Return the first sentence matching any of the patterns. */
function firstMatchingSentence(text: string, patterns: RegExp[]): string | undefined {
  const sentences = toSentences(text);
  for (const sentence of sentences) {
    for (const pattern of patterns) {
      if (pattern.test(sentence)) return sentence;
    }
  }
  // fall back: scan the whole text without sentence split
  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (m) {
      // return the surrounding context (up to 120 chars)
      const idx = text.indexOf(m[0]);
      const start = Math.max(0, idx - 30);
      const end = Math.min(text.length, idx + m[0].length + 60);
      return text.slice(start, end).trim();
    }
  }
  return undefined;
}

function extractActors(text: string): string[] {
  const all = Array.from(text.matchAll(ACTOR_PATTERN));
  const seen = new Set<string>();
  const result: string[] = [];
  for (const m of all) {
    const role = m[1].toLowerCase(); // e.g. "manager", "nurse"
    if (seen.has(role)) continue;
    seen.add(role);
    // Normalize to question-appropriate form:
    //   "my manager" → "your manager"   (first-person possessive)
    //   "a/an/the/our nurse" → "the nurse"
    const article = m[0].toLowerCase().startsWith('my') ? 'your' : 'the';
    result.push(`${article} ${role}`);
  }
  return result;
}

function extractKeyEvents(text: string): string[] {
  const sentences = toSentences(text);
  return sentences.filter((s) => PAST_TENSE_VERB.test(s)).slice(0, 6);
}

// =============================================================
// Public API
// =============================================================

/**
 * Extract structured narrative signals from a student's raw input text.
 *
 * Operates on the full merged transcript (original input + any appended
 * clarification answers). Text-only — no AI calls.
 */
export function extractNarrativeSignals(rawInput: string): NarrativeSignals {
  return {
    actors: extractActors(rawInput),
    keyEvents: extractKeyEvents(rawInput),
    tensionEvent: firstMatchingSentence(rawInput, TENSION_PATTERNS),
    realizationMoment: firstMatchingSentence(rawInput, REALIZATION_PATTERNS),
    consequence: firstMatchingSentence(rawInput, CONSEQUENCE_PATTERNS),
    repairAction: firstMatchingSentence(rawInput, REPAIR_PATTERNS),
    behaviorChange: firstMatchingSentence(rawInput, BEHAVIOR_CHANGE_PATTERNS),
  };
}
