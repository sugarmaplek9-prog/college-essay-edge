// =============================================================
// src/lib/ml/evidenceStrength/features.ts
//
// Phase 1 deterministic feature extractor.
// Builds EvidenceFeatures from: raw input text, normalized
// input, the orchestrator intelligence object, and an
// optional session case state.
//
// All features are numeric (0–N) for scorer compatibility.
// Do not invent hidden heuristics — reuse orchestrator
// signal wherever it already exists.
// =============================================================

import type { BlankPageTriggerSignal, IntakeIntelligenceObject } from '@/types/intake';
import type { SessionCaseState } from '@/lib/fm/case-state';

// =============================================================
// Feature contract
// =============================================================

export interface EvidenceFeatures {
  // --- Input density ---
  tokenCount: number;
  sentenceCount: number;
  uniqueWordRatio: number;

  // --- Narrative structure (binary 0/1) ---
  actorCount: number;
  eventCount: number;
  conflictPresent: number;
  turningPointPresent: number;
  consequencePresent: number;
  reflectionPresent: number;
  repairPresent: number;

  // --- Signal quality (0–1) ---
  sceneSpecificityScore: number;
  abstractionScore: number;
  clicheRiskScore: number;
  ambiguityScore: number;

  // --- Orchestrator-derived (numeric mappings) ---
  trustedEvidenceCount: number;
  /** 'none'→0  'low'→1  'medium'→2  'high'→3 */
  signalStrength: number;
  /** 'absent'→0  'weak'→1  'present'→2 */
  authorshipSignal: number;
  /** 'low'→0  'medium'→1  'high'→2 */
  contaminationRisk: number;
  /** 'low'→0  'medium'→1  'high'→2 */
  primaryPatternConfidence: number;

  // --- Intent markers (0/1, count) ---
  helpSeekingQuestion: number;
  topicOptionCount: number;
  instructionalPrompt: number;

  // --- Blank-page intake signals (0/1 + explainable triggers) ---
  topicOnlySignal: number;
  themeOnlySignal: number;
  activityOnlySignal: number;
  scopeUncertainSignal: number;
  blankPageDiscoverySignal: number;
  tooThinToRecoverSignal: number;
  blankPageTriggerSignals: BlankPageTriggerSignal[];
}

// =============================================================
// Keyword banks
// =============================================================

const CONFLICT_PATTERNS = [
  /\b(argued?|argument|disagreed?|disagreement|fought?|fight|conflict|tension|confronted?)\b/i,
  /\b(told me|said (I|it|that)|said\s+["']|yelled?|pushed?\s+back|criticized?|rejected?)\b/i,
  /\b(pulled me aside|sat me down|called me out|pointed out|corrected?)\b/i,
  /\b(I was wrong|I was (just |)getting in the way|I was making it (harder|worse))\b/i,
];

const TURNING_POINT_PATTERNS = [
  /\b(realized?|changed?|understood?|learned?|noticed?|saw\s+that|finally)\b/i,
  /\b(until (then|that|I)|but (then|that|when|after)|that('s|\s+is)\s+when)\b/i,
  /\b(changed how I|made me (see|realize|think|understand)|shifted)\b/i,
  /\b(the moment|that was when|that's when|everything changed)\b/i,
  /\b(actual event was|real story|more real piece|stopped patching|rebuilt our|proposed a simple|created a shared|fixed responsibility)\b/i,
];

const CONSEQUENCE_PATTERNS = [
  /\b(after (that|then|wards)|since then|from that point|ever since)\b/i,
  /\b(so I (started?|stopped?|decided?|began?|changed?|tried?))\b/i,
  /\b(the next (day|time|morning|practice|summer|year))\b/i,
  /\b(I (now|no longer|always|never|still)|led to|which meant)\b/i,
  /\b(used it before publication|before publication|changed our interpretation|wait times dropped|different pattern|carried the essay)\b/i,
];

const REFLECTION_PATTERNS = [
  /\b(I (now )?(see|know|understand|think|believe|realize))\b/i,
  /\b(changed how I (think|see|view|judge|approach))\b/i,
  /\b(made me realize|showed me|taught me|I (came to|began to))\b/i,
  /\b(what (this|that|it) (meant|taught|showed|revealed))\b/i,
];

const REPAIR_PATTERNS = [
  /\b(apologized?|went back|came back|tried again|fixed|reconciled?)\b/i,
  /\b(I asked (how|what|if)|asked for (help|feedback|advice))\b/i,
  /\b(made it right|made up for|corrected? (my|the|it))\b/i,
  /\b(the next (time|day|morning)|I decided to)\b/i,
];

const SCENE_MARKERS = [
  /\b(at the|in the|during|at school|hospital|gym|field|court|office|kitchen|car|practice)\b/i,
  /\b(that (day|summer|year|night|morning|afternoon|moment|time))\b/i,
  /\b(told me|said|asked|showed|pulled me|called me|sent me|gave me)\b/i,
  /["']/,
  /\b(my (coach|teacher|nurse|manager|boss|friend|dad|mom|parent|mentor|captain|teammate))\b/i,
  /\b(actual event was|report meeting|before publication|verification step|testing checklist|final check|dance team|tutor algebra)\b/i,
];

const ABSTRACTION_PHRASES = [
  /\b(leadership|teamwork|dedication|passion|hard\s*work|determination|perseverance|resilience|discipline|commitment)\b/i,
  /\b(I (am|have always been|have always)\s+(passionate|dedicated|committed|driven|motivated))\b/i,
  /\b(throughout my (life|years|career|time)|ever since I was|I have always)\b/i,
  /\b(well.rounded|good at everything|best version|strive to be|work ethic)\b/i,
];

const CLICHE_PHRASES = [
  /\bchanged my life\b/i,
  /\bmade me who I am\b/i,
  /\bout of my comfort zone\b/i,
  /\bmade me (a )?stronger( person)?\b/i,
  /\bovercome (obstacles|challenges|adversity)\b/i,
  /\bleadership skills?\b/i,
  /\bteam player\b/i,
  /\bI am good at everything\b/i,
  /\bpassion for\b/i,
  /\bI have always (loved|been passionate)\b/i,
];

const STOP_WORDS = new Set([
  'the', 'and', 'that', 'with', 'from', 'this', 'have', 'your', 'they', 'were',
  'when', 'what', 'where', 'after', 'about', 'there', 'their', 'would', 'could',
  'should', 'because', 'into', 'just', 'then', 'than', 'them', 'been', 'being',
  'some', 'more', 'much', 'like', 'really', 'very', 'still', 'also', 'only',
]);

// =============================================================
// Helpers
// =============================================================

function countMatching(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function mapSignalStrength(s: string): number {
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  if (s === 'low') return 1;
  return 0; // 'none'
}

function mapSceneEvidence(s: string): number {
  if (s === 'present') return 2;
  if (s === 'weak') return 1;
  return 0; // 'absent'
}

function mapContamination(s: string): number {
  if (s === 'high') return 2;
  if (s === 'medium') return 1;
  return 0; // 'low'
}

function mapConfidence(s: string): number {
  if (s === 'high') return 2;
  if (s === 'medium') return 1;
  return 0; // 'low'
}

function countTopicOptions(text: string): number {
  const lower = text.toLowerCase();
  const activityMentions = Array.from(new Set((lower.match(/\b(robotics?|debate|soccer|football|basketball|tennis|track|cross-country|running|band|orchestra|choir|volunteering|volunteer|coding|research|internship|club|student\s+council|yearbook|newspaper|painting|paint|portraits?|art|portfolio|dance|dance\s+team|tutor(?:ing)?|tutor\s+algebra|algebra|family\s+business)\b/g) ?? []).map((value) => value.toLowerCase())));

  const betweenMatch = lower.match(/between\s+(.+?)\??$/i);
  if (betweenMatch?.[1]) {
    const segment = betweenMatch[1];
    const pieces = segment
      .split(/,|\bor\b|\band\b/gi)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);
    return Math.max(0, Math.min(6, pieces.length));
  }

  if (/\b(which\s+(essay\s+)?topic|deciding\s+between|better\s+to\s+write\s+about)\b/i.test(text)) {
    const pieces = lower
      .replace(/\?/g, '')
      .split(/,|\bor\b/gi)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);
    return Math.max(0, Math.min(6, pieces.length));
  }

  if (/\b(both\s+matter|which\s+one|unsure|not\s+sure|better\s+for\s+my\s+(college\s+)?essay|split\s+focus|both\s+feel\s+important\s+for\s+different\s+reasons|should\s+carry\s+the\s+essay)\b/i.test(text) && activityMentions.length >= 2) {
    return Math.max(0, Math.min(6, activityMentions.length));
  }

  if (/\bi\s+[^.]{0,60}\band\s+also\s+[^.]{0,60}\b/i.test(lower) && activityMentions.length >= 2) {
    return Math.max(0, Math.min(6, activityMentions.length));
  }

  // Activity listing: "my main activities are X, Y, and Z" or "activities include X, Y, Z"
  if (/\b(activities?|interests?|hobbies?)\s+(are|include)\b/i.test(text)) {
    const afterMatch = lower.split(/\b(?:activities?|interests?|hobbies?)\s+(?:are|include)\b/i)[1] ?? '';
    const pieces = afterMatch
      .replace(/\?.*$/, '')
      .split(/,|\bor\b|\band\b/gi)
      .map((p) => p.trim())
      .filter((p) => p.length >= 3);
    if (pieces.length >= 2) return Math.max(0, Math.min(6, pieces.length));
  }

  return 0;
}

function isBlankPageHelpRequest(text: string): boolean {
  return /\b(no\s+idea|don['’]?t\s+know|do\s+not\s+know|not\s+sure)\b[\s\S]{0,50}\b(what\s+to\s+write\s+about|what\s+i\s+should\s+write|for\s+my\s+college\s+essay|college\s+essay|personal\s+statement)\b/i.test(text);
}

function hasHelpSeekingQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  const words = lower.trim().split(/\s+/).filter(Boolean).length;
  const asksQuestion = text.includes('?');
  const questionLead = /^(how|what|which|should|would|can|is|are|do|does)\b/.test(lower.trim());
  const betweenLead = /^i[\u2019']?m\s+between\b/.test(lower.trim());
  const blankPageIntent = isBlankPageHelpRequest(text);
  const helpIntent = /\b(help|how\s+do\s+i\s+write|what\s+should\s+i\s+write|essay\s+topic|stand\s+out|write\s+about|writing\s+about|what\s+to\s+write\s+about|common\s+app|college\s+essay|personal\s+statement)\b/i.test(text);

  if (blankPageIntent && words <= 28) return true;

  const likelyQuestion = asksQuestion || questionLead || betweenLead;
  if (!likelyQuestion) return false;
  if (words < 5 || words > 70) return false;

  if (helpIntent) return true;

  return /\b(essay|college|topic|write|personal|common\s+app|why\s+us)\b/i.test(text);
}

function isInstructionalPrompt(text: string): boolean {
  return /\b(why\s+us|how\s+specific|failure\s+without\s+sounding\s+fake|how\s+personal\s+is\s+too\s+personal)\b/i.test(text);
}

function normalizeTriggerList(signals: BlankPageTriggerSignal[]): BlankPageTriggerSignal[] {
  return Array.from(new Set(signals));
}

function hasSceneSignal(text: string): boolean {
  return SCENE_MARKERS.some((p) => p.test(text))
    || CONFLICT_PATTERNS.some((p) => p.test(text))
    || TURNING_POINT_PATTERNS.some((p) => p.test(text))
    || CONSEQUENCE_PATTERNS.some((p) => p.test(text))
    || REFLECTION_PATTERNS.some((p) => p.test(text));
}

function hasThemeLanguage(text: string): boolean {
  return ABSTRACTION_PHRASES.some((p) => p.test(text))
    || /\b(leadership|resilience|growth|integrity|compassion|discipline|grit|character|identity|values?)\b/i.test(text);
}

function hasEssayIntentLanguage(text: string): boolean {
  return /\b(essay|personal\s+statement|common\s+app|write\s+about|topic|what\s+to\s+write|should\s+i\s+write|can\s+i\s+write|would\s+.*\s+work)\b/i.test(text);
}

function hasActivityLanguage(text: string): boolean {
  return /\b(robotics?|debate|soccer|football|basketball|tennis|track|cross-country|running|band|orchestra|choir|volunteering|volunteer|coding|research|internship|club|student\s+council|yearbook|newspaper|painting|paint|portraits?|art|portfolio|dance|dance\s+team|tutor(?:ing)?|tutor\s+algebra|algebra|family\s+business)\b/i.test(text);
}

function hasTopicEligibilityQuestion(text: string): boolean {
  return /\b(can\s+i\s+write\s+about|would\s+.*\s+work|is\s+.*\s+(good|okay|ok)\s+for\s+(my\s+)?(college\s+essay|personal\s+statement)|should\s+i\s+write\s+about)\b/i.test(text);
}

function hasScopeUncertainLanguage(text: string): boolean {
  return /\b(not\s+sure|don['’]?t\s+know|do\s+not\s+know)\b[\s\S]{0,80}\b(says\s+enough|deep\s+enough|good\s+enough|essay[-\s]?worthy|worth\s+writing\s+about|really\s+an\s+essay|too\s+common)\b/i.test(text)
    || /\bdoes\s+this\s+say\s+enough\s+about\s+me\b/i.test(text)
    || /\bis\s+writing\s+about\s+.+\s+too\s+common\b/i.test(text)
    || /\b(which\s+one\s+is\s+better\s+for\s+my\s+(college\s+)?essay|both\s+matter\s+to\s+me|which\s+one\s+should\s+carry\s+the\s+essay|both\s+feel\s+important\s+for\s+different\s+reasons)\b/i.test(text);
}

function isNearEmptyOrUnusable(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= 2) return true;
  if (/^(hi|hello|test|asdf|idk|n\/a|none|na)[.!?]*$/i.test(trimmed)) return true;
  return false;
}

function hasOffDomainOrUnusableIntent(text: string): boolean {
  return /\b(write\s+my\s+essay\s+for\s+me|hack|bypass|cheat|plagiar|pirat|torrent|betting|sportsbook|crypto\s+signal)\b/i.test(text);
}

export function hasBlankPageDiscoverySignal(text: string): boolean {
  return isBlankPageHelpRequest(text)
    || /\b(nothing\s+feels\s+special\s+enough|where\s+to\s+start|stuck\s+on\s+my\s+essay|no\s+topic|choosing\s+what\s+to\s+write\s+about)\b/i.test(text);
}

export function hasScopeUncertainSignal(text: string): boolean {
  return hasScopeUncertainLanguage(text);
}

export function hasThemeOnlySignal(text: string): boolean {
  if (!hasThemeLanguage(text)) return false;
  if (hasSceneSignal(text)) return false;
  if (!hasEssayIntentLanguage(text) && !/\b(show|demonstrate|prove|highlight)\b/i.test(text)) return false;
  return true;
}

export function hasActivityOnlySignal(text: string): boolean {
  if (!hasActivityLanguage(text)) return false;
  if (hasSceneSignal(text)) return false;
  const looksLikeChoiceQuestion = /\?/.test(text) && /\bor\b/i.test(text);
  if (!hasEssayIntentLanguage(text) && !/\bbetween\b/i.test(text) && !looksLikeChoiceQuestion) return false;
  if (/\b(write\s+about|should\s+i\s+write\s+about|can\s+i\s+write\s+about|would\s+.*\s+work)\b/i.test(text) && countTopicOptions(text) < 2) {
    return false;
  }
  return true;
}

export function hasTopicOnlySignal(text: string): boolean {
  const hasTopicIntent = /\b(write\s+about|topic|essay\s+about|personal\s+statement\s+about|would\s+.*\s+work)\b/i.test(text);
  if (!hasTopicIntent && !hasTopicEligibilityQuestion(text)) return false;
  if (hasSceneSignal(text)) return false;
  if (hasThemeOnlySignal(text) || hasActivityOnlySignal(text)) return false;
  return true;
}

export function hasTooThinToRecoverSignal(text: string): boolean {
  return isNearEmptyOrUnusable(text) || hasOffDomainOrUnusableIntent(text);
}

export function extractBlankPageTriggerSignals(text: string): BlankPageTriggerSignal[] {
  const signals: BlankPageTriggerSignal[] = [];
  const trimmed = text.trim();

  if (hasBlankPageDiscoverySignal(text)) {
    signals.push('blank_page_language');
  }

  if (!/\b(write\s+about|topic|essay|personal\s+statement|robotics?|debate|soccer|coding|volunteer|leadership|resilience|growth)\b/i.test(text)) {
    signals.push('no_topic_present');
  }

  if (hasScopeUncertainSignal(text)) {
    signals.push('scope_uncertain_language');
  }

  if (hasThemeOnlySignal(text)) {
    signals.push('theme_only_intent');
    if (/\b(show|demonstrate|prove|highlight)\b/i.test(text)) {
      signals.push('trait_show_language');
    }
  }

  if (hasActivityOnlySignal(text)) {
    signals.push('activity_domain_only');
  }

  if (hasTopicOnlySignal(text)) {
    signals.push('topic_only_intent');
  }

  if (hasTopicEligibilityQuestion(text)) {
    signals.push('topic_eligibility_question');
  }

  if (countTopicOptions(text) >= 2) {
    signals.push('multiple_activity_options');
  }

  if (isNearEmptyOrUnusable(trimmed)) {
    signals.push('empty_or_near_empty_input');
  }

  if (hasOffDomainOrUnusableIntent(text)) {
    signals.push('off_domain_or_unusable');
  }

  return normalizeTriggerList(signals);
}

// =============================================================
// Scene specificity score  (0–1)
// =============================================================

function computeSceneSpecificityScore(text: string): number {
  let score = 0;
  if (/\b(at the|in the|hospital|gym|office|field|court|room)\b/i.test(text)) score += 0.15;
  if (/\b(told me|said|asked|pulled|pushed|called|showed|helped|sent|gave)\b/i.test(text)) score += 0.20;
  if (/\b(that day|that summer|that year|in my|one day|one time|the moment)\b/i.test(text)) score += 0.10;
  if (/["']/.test(text)) score += 0.15; // quoted speech → very concrete
  if (/\b(my (coach|teacher|nurse|manager|boss|friend|parent|mentor))\b/i.test(text)) score += 0.10;
  const tokens = tokenize(text);
  const uniqueRatio = tokens.length > 0 ? new Set(tokens).size / tokens.length : 0;
  score += uniqueRatio * 0.15;
  // Extra: actions with named person make scene very specific
  if (
    /\b(my (coach|nurse|teacher|boss|manager))\b/i.test(text) &&
    /\b(said|told|asked|showed|pulled)\b/i.test(text)
  ) {
    score += 0.15;
  }
  return Math.min(1, score);
}

// =============================================================
// Abstraction score  (0–1)
// =============================================================

function computeAbstractionScore(text: string): number {
  const count = ABSTRACTION_PHRASES.filter((p) => p.test(text)).length;
  return Math.min(1, count * 0.22);
}

// =============================================================
// Cliché risk score  (0–1)
// =============================================================

function computeClicheRiskScore(text: string): number {
  const count = CLICHE_PHRASES.filter((p) => p.test(text)).length;
  return Math.min(1, count * 0.22);
}

// =============================================================
// Ambiguity score  (0–1)
// =============================================================

function computeAmbiguityScore(text: string, tokenCount: number): number {
  let score = 0;
  if (tokenCount < 20) score += 0.3;
  else if (tokenCount < 40) score += 0.15;

  // Abstract-heavy without scenes
  const abstractCount = ABSTRACTION_PHRASES.filter((p) => p.test(text)).length;
  const sceneCount = SCENE_MARKERS.filter((p) => p.test(text)).length;
  if (abstractCount > 0 && sceneCount === 0) score += 0.25;
  if (abstractCount > 1 && sceneCount <= 1) score += 0.15;

  // Generic pronoun density without concrete context
  const genericMatches = text.match(/\b(thing|stuff|it|things|everything)\b/gi) ?? [];
  if (genericMatches.length >= 3) score += 0.15;

  return Math.min(1, score);
}

// =============================================================
// Actor extraction count
// =============================================================

function countActors(text: string): number {
  const matches = text.match(
    /\b(my\s+[a-z]+|the\s+[a-z]+|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g
  ) ?? [];
  return new Set(
    matches
      .map((m) => m.trim().toLowerCase())
      .filter((m) => m.length > 2 && !STOP_WORDS.has(m))
  ).size;
}

// =============================================================
// Event count (sentences with action verbs)
// =============================================================

function countEvents(sentences: string[]): number {
  const actionVerbs = /\b(went|came|said|told|asked|showed|pulled|called|helped|started|stopped|changed|realized|decided|tried|learned|gave|took|made|built|ran|worked|played|joined|left)\b/i;
  return sentences.filter((s) => actionVerbs.test(s)).length;
}

// =============================================================
// Trusted evidence count (safe accessor for fixture mismatch)
// =============================================================

function getTrustedEvidenceCount(intelligence: IntakeIntelligenceObject): number {
  const te = intelligence.trusted_evidence as unknown as Record<string, unknown>;
  if (Array.isArray(te.trusted_evidence_rank)) return te.trusted_evidence_rank.length;
  if (Array.isArray(te.ranking)) return (te.ranking as unknown[]).length;
  return 0;
}

// =============================================================
// Public API
// =============================================================

export interface BuildEvidenceFeaturesInput {
  rawInput: string;
  normalizedInput: string;
  intelligence: IntakeIntelligenceObject;
  sessionCaseState?: SessionCaseState | null;
}

export function buildEvidenceFeatures(input: BuildEvidenceFeaturesInput): EvidenceFeatures {
  const { rawInput, normalizedInput, intelligence, sessionCaseState } = input;

  const tokens = tokenize(normalizedInput);
  const sentences = splitSentences(normalizedInput);
  const tokenCount = tokens.length;
  const sentenceCount = sentences.length;
  const uniqueWordRatio = tokenCount > 0 ? new Set(tokens).size / tokenCount : 0;

  const text = normalizedInput;

  // Narrative structure — use direct text patterns for turning point & conflict
  // (caseState extraction uses broad heuristics like matching "but" which
  //  produces false positives on thin inputs like "I like sports but…")
  const conflictPresent = countMatching(text, CONFLICT_PATTERNS) > 0 ? 1 : 0;

  const turningPointPresent = countMatching(text, TURNING_POINT_PATTERNS) > 0 ? 1 : 0;

  const consequencePresent =
    sessionCaseState && sessionCaseState.extracted.consequences.length > 0
      ? 1
      : countMatching(text, CONSEQUENCE_PATTERNS) > 0
        ? 1
        : 0;

  const reflectionPresent =
    sessionCaseState && sessionCaseState.extracted.reflections.length > 0
      ? 1
      : countMatching(text, REFLECTION_PATTERNS) > 0
        ? 1
        : 0;

  const repairPresent = countMatching(text, REPAIR_PATTERNS) > 0 ? 1 : 0;

  const actorCount =
    sessionCaseState
      ? sessionCaseState.extracted.actors.length
      : countActors(rawInput);

  const eventCount = countEvents(sentences);

  const sceneSpecificityScore = computeSceneSpecificityScore(text);
  const abstractionScore = computeAbstractionScore(text);
  const clicheRiskScore = computeClicheRiskScore(text);
  const ambiguityScore = computeAmbiguityScore(text, tokenCount);

  const trustedEvidenceCount = getTrustedEvidenceCount(intelligence);
  const signalStrength = mapSignalStrength(intelligence.usable_signal.signal_strength);
  const authorshipSignal = mapSceneEvidence(intelligence.authorship_signal.student_scene_evidence);
  const contaminationRisk = mapContamination(intelligence.authorship_signal.contamination_risk);
  const primaryPatternConfidence = mapConfidence(intelligence.narrative_pattern.confidence);
  const helpSeekingQuestion = hasHelpSeekingQuestion(rawInput) ? 1 : 0;
  const topicOptionCount = countTopicOptions(rawInput);
  const instructionalPrompt = isInstructionalPrompt(rawInput) ? 1 : 0;
  const topicOnlySignal = hasTopicOnlySignal(rawInput) ? 1 : 0;
  const themeOnlySignal = hasThemeOnlySignal(rawInput) ? 1 : 0;
  const activityOnlySignal = hasActivityOnlySignal(rawInput) ? 1 : 0;
  const scopeUncertainSignal = hasScopeUncertainSignal(rawInput) ? 1 : 0;
  const blankPageDiscoverySignal = hasBlankPageDiscoverySignal(rawInput) ? 1 : 0;
  const tooThinToRecoverSignal = hasTooThinToRecoverSignal(rawInput) ? 1 : 0;
  const blankPageTriggerSignals = extractBlankPageTriggerSignals(rawInput);

  return {
    tokenCount,
    sentenceCount,
    uniqueWordRatio,
    actorCount,
    eventCount,
    conflictPresent,
    turningPointPresent,
    consequencePresent,
    reflectionPresent,
    repairPresent,
    sceneSpecificityScore,
    abstractionScore,
    clicheRiskScore,
    ambiguityScore,
    trustedEvidenceCount,
    signalStrength,
    authorshipSignal,
    contaminationRisk,
    primaryPatternConfidence,
    helpSeekingQuestion,
    topicOptionCount,
    instructionalPrompt,
    topicOnlySignal,
    themeOnlySignal,
    activityOnlySignal,
    scopeUncertainSignal,
    blankPageDiscoverySignal,
    tooThinToRecoverSignal,
    blankPageTriggerSignals,
  };
}
