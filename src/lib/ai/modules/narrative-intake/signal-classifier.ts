import type {
  UsableSignalDecision,
  SignalType,
  SignalStrength,
  UsableSignalReasonCode,
  IntakeSourceProvenanceRef,
  IntakeDecisionMeta,
} from '@/types/intake';

export const SIGNAL_CLASSIFIER_VERSION = 'v1' as const;

const SELF_CORRECTION_PATTERNS = [
  /i (got it|handled it|approached it) wrong/i,
  /i made a mistake/i,
  /i mishandled/i,
  /i reacted (badly|poorly)/i,
  /my first instinct was wrong/i,
  /i initially handled/i,
  /i (was corrected|was called out|got feedback)/i,
  /someone (told me|challenged me|pointed out)/i,
  /after (feedback|being told|someone said)/i,
  /i changed (my approach|how i)/i,
  /i adapted my approach/i,
  /i responded differently/i,
  /i adjusted/i,
  /the next time i/i,
  // Named-role feedback
  /\b(a|my|the)\s+\w+\s+(told me|asked me|showed me|informed me|pointed out to me)\b/i,
  /i was doing the opposite\b/i,
  /i had not (been|taught|shown|shared|told|helped|included)\b/i,
  /i (rewrote|rebuilt|redesigned|reorganized|reworked|restructured) (the|my|our|a)\b/i,
  /i had skipped\b/i,
  /i (stopped being proud|stopped measuring success by|stopped optimizing for)\b/i,
  /i stopped equating\b/i,
  /as if i had built (most|all) of it\b/i,
  /i had confused\s+\w+\s+with\s+\w+\b/i,
  /my \w+ said I was\b/i,
  /i started asking (everyone|students|the team|participants|them) to\b/i,
  /since then I (translate|ask|explain|review|approach|verify|check|refuse|require|read)\b/i,
];

const IDENTITY_SHIFT_PATTERNS = [
  /i (realized|understood) (that )?(i had been|my role|who i was)/i,
  /i thought i was/i,
  /i saw myself differently/i,
  /my understanding of (my role|myself|what i was doing) changed/i,
  /i had been (wrong about|mistaken about|treating)/i,
  /that changed how i saw (myself|my job|my role)/i,
  /i was not (who|what) i thought/i,
  /i had confused\s+\w+\s+with\s+\w+\b/i,
  /i replayed that sentence for (days|weeks)\b/i,
];

const RESPONSIBILITY_SHIFT_PATTERNS = [
  /i (realized|noticed) (that )?i (had been|was) (removing|excluding|not including)/i,
  /solving (it|the problem) alone (was|started)/i,
  /i had been (making|taking) decisions (without|alone|by myself)/i,
  /i brought (the team|everyone|others) in/i,
  /i stopped (doing it|solving it) alone/i,
  /i (asked for|invited|included) (help|others|the team)/i,
  /i (was not|wasn.t) letting (others|them|the team)/i,
  /i (advocated|fought|pushed|stood up|spoke up) for (myself|my own|my (own )?placement)\b/i,
  /i (refused to leave|stayed until|sat outside)\b/i,
  /i (wrote|created|drafted) a (document|letter|one-page|note|formal)\b/i,
  /i (waited|sat|stayed) (outside|in front of|at|near|by)\s+the\b/i,
  /i asked (the|my)\s+(counselor|advisor|teacher|principal|director|dean)\s+to\b/i,
  /i (was|got) moved (the same day|that day|that week)\b/i,
  /i waited (for )?(\d+\s+)?(day|days|week|weeks)\b/i,
  /i reported it once and was told\b/i,
  /two weeks later nothing changed\b/i,
  /i gathered (photos|evidence|examples).{0,60}(memo|brief|one-page).{0,60}(vice principal|principal|assistant principal|director)\b/i,
  /i stopped treating escalation like overreaction\b/i,
];

const CONFLICT_REFRAME_PATTERNS = [
  /conflict/i,
  /disagreement/i,
  /argument/i,
  /tension/i,
  /we (clashed|disagreed|argued)/i,
  /the other (person|team|side)/i,
  /after the (round|match|meeting|conversation)/i,
  /i (changed|shifted) my (approach|perspective) (to|toward|about) (the conflict|the disagreement|them)/i,
];

const FAILURE_REINTERPRETATION_PATTERNS = [
  /the (data|result|experiment|project) (was|showed|revealed) (wrong|flat|failed|unexpected)/i,
  /my hypothesis was wrong/i,
  /the failure (taught|showed|revealed)/i,
  /if (the first attempt|it) had (worked|succeeded)/i,
  /the mistake (was|became) the (condition|thing) that/i,
  /i (redesigned|rebuilt|restarted)/i,
  /i (never would have found|would have missed)/i,
  /i (built|created|designed|wrote|developed) a (drill|system|method|process|approach|practice|checklist|protocol|template|rubric)\b/i,
  /\w+\s+students?\s+(at|in|from) my (school|class|program|team) (now use|use|adopted|started using)\b/i,
  /all of them required (me to|switching|a)\b/i,
  /i looked at every .{0,40}(i missed|that failed|that was wrong)/i,
  /i blamed .{0,80} until i (timed|checked|reviewed|tracked)\b/i,
  /wait times? dropped (by|to)\b/i,
  /i timed each step\b/i,
  /i thought (the )?(problem|issue|cause) was.{0,80}but when i (reviewed|checked|tracked|counted|looked at|analyzed)\b/i,
  /turned into the first process i designed\b/i,
];

const SCENE_DETAIL_PATTERNS = [
  /\bwhen\b/i,
  /\bafter\b/i,
  /\bduring\b/i,
  /that (moment|day|session|round|shift|conversation)/i,
  /my (coach|mentor|teacher|partner|teammate|patient|customer|director|advisor|counselor|librarian|principal|colleague|manager|boss) (said|told|asked|pulled|called|showed|sent|gave)\b/i,
  /\b(a|the)\s+(coach|mentor|teacher|nurse|advisor|counselor|parent|librarian|principal|colleague|manager|boss|director|pharmacist|caseworker|supervisor) (told|asked|said|showed|pulled|called)\b/i,
  /i said/i,
  /i did/i,
  /the (match|round|call|rehearsal|shift|experiment|clinic|session|tournament)/i,
  /room \d+/i,
  /asked (me|for me) by name/i,
  /outside (the|my)\s+\w*office\b/i,
  /\b(she|he|they)\s+said\b/i,
  /\b(the )?same day\b/i,
  /i asked (the|my)\s+(counselor|advisor|teacher|principal|director|dean)\b/i,
  /i scored (in|at)?\s*(the )?(bottom|lowest|last|bottom third|bottom quarter)\b/i,
  /twice in a row\b/i,
  /on the drive home\b/i,
  /\bon stage\b/i,
  /one lab\b/i,
  /\bfood pantry\b/i,
  /\bcheck-?in\b/i,
  /\bby noon\b/i,
  /first-time families\b/i,
  /\b(a|the)\s+(student|peer|classmate|participant)\s+(told me|said|asked)\b/i,
];

const RESUME_LIST_PATTERNS = [
  /^[A-Z][^.]{2,40}(,\s*[A-Z][^.]{2,40}){2,}/,
  /captain|treasurer|president|honor roll/i,
  /strong communicator|team player|hard worker/i,
  /\bAP \w+/i,
  /varsity|club|member|officer/i,
];

const ABSTRACT_VALUES_PATTERNS = [
  /values (and|or) future direction/i,
  /demonstrates? (leadership|growth|maturity|resilience)/i,
  /i have always been passionate/i,
  /throughout my (high school career|years)/i,
  /i am (committed|dedicated|proud)/i,
  /admissions committees/i,
  /who i am as a person/i,
  /connect .* values/i,
];

function countHits(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function allText(entries: Array<{ id: string; title: string; text: string }>): string {
  return entries.map((e) => `${e.title} ${e.text}`).join(' ');
}

function detectSignalTypes(
  text: string
): { types: SignalType[]; maxHits: number } {
  const candidates: Array<{ type: SignalType; hits: number }> = [
    { type: 'self_correction_arc',    hits: countHits(text, SELF_CORRECTION_PATTERNS) },
    { type: 'identity_shift',         hits: countHits(text, IDENTITY_SHIFT_PATTERNS) },
    { type: 'responsibility_shift',   hits: countHits(text, RESPONSIBILITY_SHIFT_PATTERNS) },
    { type: 'conflict_reframe',       hits: countHits(text, CONFLICT_REFRAME_PATTERNS) },
    { type: 'failure_reinterpretation', hits: countHits(text, FAILURE_REINTERPRETATION_PATTERNS) },
  ];
  const active = candidates.filter((c) => c.hits >= 1);
  const maxHits = active.length > 0 ? Math.max(...active.map((c) => c.hits)) : 0;
  const types: SignalType[] = active.length > 0
    ? active.sort((a, b) => b.hits - a.hits).map((c) => c.type)
    : ['unknown'];
  return { types, maxHits };
}

function inferStrength(
  scenHits: number,
  signalHits: number,
  resumeHits: number,
  abstractHits: number
): SignalStrength {
  if (resumeHits >= 3 || (signalHits === 0 && scenHits === 0)) return 'none';
  if (abstractHits >= 3 && signalHits < 2) return 'none';
  if (signalHits >= 4 && scenHits >= 3) return 'high';
  if (signalHits >= 2 && scenHits >= 1) return 'medium';
  if (signalHits >= 1 || scenHits >= 2) return 'low';
  return 'none';
}

function buildReasonCodes(
  types: SignalType[],
  strength: SignalStrength,
  resumeHits: number,
  abstractHits: number,
  scenHits: number
): UsableSignalReasonCode[] {
  const codes: UsableSignalReasonCode[] = [];
  if (strength === 'none' && resumeHits >= 3) codes.push('RESUME_LIST_ONLY');
  if (strength === 'none' && abstractHits >= 3) codes.push('ABSTRACT_VALUES_NO_SCENE');
  if (strength === 'none' && resumeHits < 3 && abstractHits < 3) codes.push('NO_SIGNAL_DETECTED');
  if (types.includes('self_correction_arc') && strength === 'high') codes.push('STRONG_SELF_CORRECTION_PRESENT');
  if (types.includes('identity_shift')) codes.push('CLEAR_IDENTITY_SHIFT_PRESENT');
  if (types.includes('responsibility_shift')) codes.push('RESPONSIBILITY_SHIFT_DETECTED');
  if (types.includes('conflict_reframe')) codes.push('CONFLICT_REFRAME_DETECTED');
  if (types.includes('failure_reinterpretation')) codes.push('FAILURE_REINTERPRETATION_DETECTED');
  if (scenHits >= 3) codes.push('SCENE_DETAIL_SUFFICIENT');
  if (strength === 'low') codes.push('AMBIGUOUS_POSSIBLE_SIGNAL');
  return codes.length > 0 ? codes : ['NO_SIGNAL_DETECTED'];
}

export interface SignalClassifierInput {
  story_entries: Array<{
    id: string;
    title: string;
    text: string;
  }>;
  draft_text: string | null;
  session_id: string;
}

export function classifyUsableSignal(
  input: SignalClassifierInput
): UsableSignalDecision {
  const storyText = allText(input.story_entries);
  const draftText = input.draft_text ?? '';
  const combinedText = `${storyText} ${draftText}`.trim();
  const { types, maxHits } = detectSignalTypes(combinedText);
  const scenHits = countHits(storyText, SCENE_DETAIL_PATTERNS);
  const resumeHits = countHits(combinedText, RESUME_LIST_PATTERNS);
  const abstractHits = countHits(draftText, ABSTRACT_VALUES_PATTERNS);
  const strength = inferStrength(scenHits, maxHits, resumeHits, abstractHits);
  const usable = strength !== 'none';
  const confidence: 'high' | 'medium' | 'low' =
    strength === 'high' ? 'high' :
    strength === 'medium' ? 'medium' :
    strength === 'low' ? 'low' : 'high';
  const reason_codes = buildReasonCodes(types, strength, resumeHits, abstractHits, scenHits);
  const evidence_sources: IntakeSourceProvenanceRef[] = input.story_entries.map((e) => ({
    source_id: e.id,
    source_type: 'story_entry' as const,
    excerpt: e.text.slice(0, 120),
  }));
  const meta: IntakeDecisionMeta = {
    decision_version: SIGNAL_CLASSIFIER_VERSION,
    taxonomy_version: 'taxonomy_v1',
    made_at: new Date().toISOString(),
    made_by: 'classifier',
  };
  return {
    usable_signal: usable,
    signal_strength: strength,
    signal_types: types,
    confidence,
    reason_codes,
    evidence_sources,
    meta,
  };
}
