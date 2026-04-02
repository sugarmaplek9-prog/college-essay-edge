// =============================================================
// src/lib/ai/modules/narrative-intake/pattern-classifier.ts
// INTAKE-05: Narrative pattern classifier v1 with taxonomy versioning
//
// Classifies the primary and secondary narrative patterns present
// in the intake input. Primary pattern drives downstream angle
// generation. Taxonomy version is required for reproducibility.
// =============================================================

import type {
  NarrativePatternDecision,
  NarrativePattern,
  PatternConfidence,
  PatternReasonCode,
  IntakeSourceProvenanceRef,
  IntakeDecisionMeta,
} from '@/types/intake';

// ─────────────────────────────────────────────────────────────
// VERSION
// ─────────────────────────────────────────────────────────────

export const PATTERN_CLASSIFIER_VERSION = 'v1' as const;
export const TAXONOMY_VERSION = 'taxonomy_v1' as const;

// ─────────────────────────────────────────────────────────────
// PATTERN FEATURE TABLES
// ─────────────────────────────────────────────────────────────

const PATTERN_FEATURES: Record<Exclude<NarrativePattern, 'unknown'>, {
  patterns: RegExp[];
  minHits: number;
  primaryReasonCode: PatternReasonCode;
}> = {
  self_correction_arc: {
    minHits: 2,
    primaryReasonCode: 'PIVOT_MOMENT_DETECTED',
    patterns: [
      /i (got it|handled it|approached it) wrong/i,
      /i made a mistake/i,
      /i initially handled/i,
      /i (was corrected|was called out|got feedback)/i,
      /someone (told me|challenged me|pointed out)/i,
      /after (feedback|being told)/i,
      /i changed (my approach|how i)/i,
      /i adapted my approach/i,
      /i responded differently/i,
      /the next (time|tournament|session|round|practice)/i,
      /i adjusted/i,
      /that was the moment/i,
      /i realized/i,
      /behavior change/i,
      // real student phrasing — added after V4 pattern-classifier audit
      /my (teacher|coach|mentor|supervisor|manager|advisor|professor|partner|nurse|pharmacist|director) said (i was|i had|that i|i needed)/i,
      /i stopped (equating|treating|seeing|thinking of|confusing)/i,
      /the next (week|day|month|class|practice|session|time)/i,
      /(student|peer|classmate|teammate|patient|client|she|he) told me.{0,60}(not|never|couldn|didn|can.t|don.t)/i,
      /a (student|peer|classmate|teammate|patient|client) told me/i,
      /i (switched|changed) to (spending|asking|having|making|letting|focusing)/i,
      /i used to.{0,60}(but|because|however|until|now)/i,
      /i started (asking|making|having|letting|requiring|inviting) (everyone|students|the team|them|each|participants)/i,
      /i stopped (doing it|solving it|leading|controlling|providing|giving) (alone|myself|for them|the answers)/i,
      /(efficiency|speed|being fast|getting it done) (had made|made|was making|became) (my|the) (help|work|contribution) (less|worse|counter)/i,
      /since then i (translate|ask|write|slow down|review|check|pause|listen|have)/i,
      /(pharmacist|teacher|coach|mentor|manager|advisor) asked me to/i,
    ],
  },
  conflict_reframe: {
    minHits: 2,
    primaryReasonCode: 'CONFLICT_FOLLOWED_BY_RESOLUTION',
    patterns: [
      /conflict|disagreement|argument|tension/i,
      /we (clashed|disagreed|argued)/i,
      /after the (round|match|meeting|conversation|argument)/i,
      /i (changed|shifted) my (approach|perspective) (to|toward|about)/i,
      /i stopped (pushing|arguing|insisting)/i,
      /i (listened|started listening)/i,
      /the other (person|team|side)/i,
      /i saw their (point|side|perspective)/i,
      // HV4_05 type: authority decision creates trust cost in team
      /section (leaders?|members?|principals?|chairs?).{0,50}(were upset|were angry|told me)/i,
      /i had ignored (work|effort|preparation|input|changes).{0,40}(they|the team).{0,30}(prepared|made|done|put in)/i,
      /(musical|technical|strategic|performance|competitive) (gain|benefit|advantage|win).{0,20}(came at the cost|at the cost|cost) of (trust|relationship|rapport|morale|goodwill)/i,
      /i asked .{0,25}for (a|one) non.negotiable/i,
      // HV4_10 type: team overrule with post-decision external critique
      /(controls? lead|team member|teammate|partner|colleague).{0,25}argued (we should|i should|that we|that i)/i,
      /i overruled (him|her|them|my )/i,
      /(he|she|they) said my (choice|decision|call|move).{0,35}(protected|kept|maintained|secured).{0,35}but (erased|hurt|lost|eliminated|cost|sacrificed)/i,
      /i (now|started to|began to|learned to) (state|call out|name|voice|acknowledge|articulate) the tradeoff/i,
      // HV4_05 type: authority decision creates trust cost in team
      /section (leaders?|members?|principals?|chairs?).{0,50}(were upset|were angry|told me)/i,
      /i had ignored (work|effort|preparation|input|changes).{0,40}(they|the team).{0,30}(prepared|made|done|put in)/i,
      /(musical|technical|strategic|performance|competitive) (gain|benefit|advantage|win).{0,20}(came at the cost|at the cost|cost) of (trust|relationship|rapport|morale|goodwill)/i,
      /i asked .{0,25}for (a|one) non.negotiable/i,
      // HV4_10 type: team overrule with post-decision external critique
      /(controls? lead|team member|teammate|partner|colleague).{0,25}argued (we should|i should|that we|that i)/i,
      /i overruled (him|her|them|my )/i,
      /(he|she|they) said my (choice|decision|call|move).{0,35}(protected|kept|maintained|secured).{0,35}but (erased|hurt|lost|eliminated|cost|sacrificed)/i,
      /i (now|started to|began to|learned to) (state|call out|name|voice|acknowledge|articulate) the tradeoff/i,
    ],
  },
  identity_shift: {
    minHits: 2,
    primaryReasonCode: 'IDENTITY_CLAIM_SHIFT_DETECTED',
    patterns: [
      /i thought i was/i,
      /i (realized|understood) (that )?(i had been|my role|who i was)/i,
      /i saw myself differently/i,
      /my understanding of (my role|myself|what i was doing) changed/i,
      /i had been (wrong about|mistaken about|treating)/i,
      /that changed how i saw (myself|my job|my role)/i,
      /i was not (who|what) i thought/i,
      /i had been (the teacher|the one|the expert)/i,
      // HV4_06 type: credit/ownership identity realization
      /(teammate|partner|collaborator|co.creator|cofounder).{0,35}(said|told me) (she|he|they) felt (invisible|excluded|erased|unseen|sidelined|unacknowledged)/i,
      /i had confused (confidence|authority|competence|ownership|taking credit|credit).{0,20}with (control|dominance|erasure|speaking for|taking over)/i,
      /i (replayed|kept thinking about|thought about) that (sentence|moment|comment|question|conversation) for (days|weeks)/i,
      /crediting (contributors|teammates|collaborators|the team|others) first/i,
      /i (rewrote|updated|revised|restructured|changed).{0,35}(documentation|credits|introduction|presentation|notes).{0,35}(named|crediting|by name|ownership)/i,
      // HV4_06 type: credit/ownership identity realization
      /(teammate|partner|collaborator|co.creator|cofounder).{0,35}(said|told me) (she|he|they) felt (invisible|excluded|erased|unseen|sidelined|unacknowledged)/i,
      /i had confused (confidence|authority|competence|ownership|taking credit|credit).{0,20}with (control|dominance|erasure|speaking for|taking over)/i,
      /i (replayed|kept thinking about|thought about) that (sentence|moment|comment|question|conversation) for (days|weeks)/i,
      /crediting (contributors|teammates|collaborators|the team|others) first/i,
      /i (rewrote|updated|revised|restructured|changed).{0,35}(documentation|credits|introduction|presentation|notes).{0,35}(named|crediting|by name|ownership)/i,
    ],
  },
  responsibility_shift: {
    minHits: 2,
    primaryReasonCode: 'RESPONSIBILITY_LANGUAGE_PRESENT',
    patterns: [
      /solving (it|the problem) alone/i,
      /i (had been|was) (making|taking) decisions (without|alone)/i,
      /i brought (the team|everyone|others) in/i,
      /i stopped (doing it|solving it) alone/i,
      /i (asked for|invited|included) (help|others|the team)/i,
      /i (was not|wasn.t) letting (others|them|the team)/i,
      /i (realized|noticed) (that )?i (had been|was) (removing|excluding)/i,
      /it made them feel (useless|excluded|irrelevant)/i,
      // HV4_04 type: self-advocacy against institutional resistance
      /i (emailed|contacted|reached out|wrote).{0,50}(twice|two times|a second time|again|multiple)/i,
      /got told.{0,15}(scheduling|decision|placement|process).{0,15}(was|is) final/i,
      /i asked .{0,30}for (the )?(rubric|criteria|requirements|guidelines|policy)/i,
      /(created|compiled|made|prepared|wrote).{0,20}(summary|one.page|document|overview|packet|evidence)/i,
      /i (waited|stayed|stood) (after school|outside|until she|until he|until they)/i,
      /following (process|the rules|the system|procedure|protocol).{0,40}(still requires?|can still|sometimes) (push|advo)/i,
      /i reported it once and was told/i,
      /two weeks later nothing changed/i,
      /i gathered (photos|evidence|examples).{0,60}(memo|brief|one.page).{0,60}(vice principal|principal|assistant principal|director)/i,
      /i stopped treating escalation like overreaction/i,
      // HV4_04 type: self-advocacy against institutional resistance
      /i (emailed|contacted|reached out|wrote).{0,50}(twice|two times|a second time|again|multiple)/i,
      /got told.{0,15}(scheduling|decision|placement|process).{0,15}(was|is) final/i,
      /i asked .{0,30}for (the )?(rubric|criteria|requirements|guidelines|policy)/i,
      /(created|compiled|made|prepared|wrote).{0,20}(summary|one.page|document|overview|packet|evidence)/i,
      /i (waited|stayed|stood) (after school|outside|until she|until he|until they)/i,
      /following (process|the rules|the system|procedure|protocol).{0,40}(still requires?|can still|sometimes) (push|advo)/i,
    ],
  },
  usefulness_vs_intention: {
    minHits: 2,
    primaryReasonCode: 'USEFULNESS_INTENTION_GAP_DETECTED',
    patterns: [
      /good intentions (were not|weren.t|didn.t)/i,
      /i was (helping|trying) but (it wasn.t|it was not) (working|helping|enough)/i,
      /i realized (that )?doing .{0,30} still (was not|wasn.t) helping/i,
      /task(s)? (stopped being|were not) enough/i,
      /the (task|work|volunteering|effort) (correct(ly)?|technically) (done|completed)/i,
      /i had been translating (words|steps) but not (meaning|understanding)/i,
      /following (the steps|instructions|protocol) (wasn.t|was not) the same as/i,
      // real student phrasing — added after V4 pattern-classifier audit
      /(efficiency|speed|completing the task|doing it quickly) (had made|made|was making) (my help|my work|what i did) (less useful|less helpful|counter)/i,
      /they (came back|returned|kept coming) (with|but).{0,40}(generic|the same|didn.t know|could not|couldn.t)/i,
      /i (gave|provided|supplied).{0,30}(but|and).{0,30}(didn.t know|could not|couldn.t|didn.t understand|didn.t help)/i,
      /instead of learning to/i,
      /(participation|engagement) went up/i,
      /(students|participants|they) (began|started) helping each other/i,
    ],
  },
  competence_vs_responsibility: {
    minHits: 2,
    primaryReasonCode: 'COMPETENCE_RESPONSIBILITY_TENSION',
    patterns: [
      /i (was|am) (good|skilled|fast|capable) (at|with)/i,
      /my (competence|skill|ability|speed) (was|became) the problem/i,
      /being right (was|became) the problem/i,
      /winning the (argument|round|debate) (cost|hurt)/i,
      /i was (efficient|correct|fastest) but/i,
      /the skill (itself|became|was)/i,
    ],
  },
  failure_reinterpretation: {
    minHits: 2,
    primaryReasonCode: 'FAILURE_FOLLOWED_BY_REINTERPRETATION',
    patterns: [
      /the (data|result|experiment|project) (was|showed|revealed) (wrong|flat|failed|unexpected)/i,
      /my hypothesis was wrong/i,
      /the failure (taught|showed|revealed)/i,
      /if (the first attempt|it) had (worked|succeeded)/i,
      /the mistake (was|became) the (condition|thing) that/i,
      // real student phrasing — added after V4 pattern-classifier audit
      /(i|we) (first|initially|at first) blamed/i,
      /i thought (the )?(problem|issue|cause) was.{0,80}but when i (reviewed|checked|tracked|counted|looked at|analyzed)/i,
      /but after (timing|measuring|checking|tracking|counting|observing|reviewing|analyzing)/i,
      /the real (problem|issue|cause|bottleneck) was/i,
      /(wait times|errors|failures|problems) (dropped|fell|decreased|stopped) (after|once|when)/i,
      /i (redesigned|rebuilt|restarted)/i,
      /turned into the first process i designed/i,
      /i (never would have found|would have missed)/i,
      /the wrong (result|data|outcome) led to/i,
      // HV4_09 type: published error, wrong root cause assumption, process fix
      /had to (issue|publish|post|write|run|print) a (correction|retraction|clarification|apology|follow.up)/i,
      /i assumed (the )?(problem|cause|issue|reason|failure|mistake) was.{0,60}(but|however|actually|instead)/i,
      /but (our|the) (workflow|process|system|protocol|procedure|pipeline|practice) had no (explicit|clear|defined|dedicated|formal|built.in)/i,
      /i (built|created|wrote|designed|developed|implemented|established) a (pre.publish|verification|fact.check|review|confirmation|number.verification|source.check) (checklist|process|protocol|step|system|requirement|procedure)/i,
      /i stopped treating (verification|fact.checking|checking|review|oversight|source.checking|confirmation) as optional/i,
      // HV4_09 type: published error, wrong root cause assumption, process fix
      /had to (issue|publish|post|write|run|print) a (correction|retraction|clarification|apology|follow.up)/i,
      /i assumed (the )?(problem|cause|issue|reason|failure|mistake) was.{0,60}(but|however|actually|instead)/i,
      /but (our|the) (workflow|process|system|protocol|procedure|pipeline|practice) had no (explicit|clear|defined|dedicated|formal|built.in)/i,
      /i (built|created|wrote|designed|developed|implemented|established) a (pre.publish|verification|fact.check|review|confirmation|number.verification|source.check) (checklist|process|protocol|step|system|requirement|procedure)/i,
      /i stopped treating (verification|fact.checking|checking|review|oversight|source.checking|confirmation) as optional/i,
    ],
  },
};

// ─────────────────────────────────────────────────────────────
// STRUCTURAL SIGNAL PATTERNS (shared across patterns)
// ─────────────────────────────────────────────────────────────

const BEFORE_AFTER_PATTERNS = [
  /at first.{0,60}(but|however|then|until)/i,
  /initially.{0,60}(but|however|then|until)/i,
  /used to.{0,60}(now|but|until)/i,
  /the next (time|day|week|session|tournament)/i,
];

const EXTERNAL_FEEDBACK_PATTERNS = [
  /my (coach|mentor|teacher|partner|teammate|director|patient|counselor|supervisor) (said|told|asked|pointed out|pulled me aside|reviewed)/i,
  /a (student|peer|classmate|teammate|patient|client) (said|told|asked)/i,
  /someone (told|challenged|asked|corrected) me/i,
  /i (was told|was corrected|got feedback|received feedback)/i,
  /after (being told|someone said|feedback)/i,
];

const INTERNAL_REALIZATION_PATTERNS = [
  /i realized/i,
  /i understood/i,
  /it hit me/i,
  /that (sentence|moment|question) changed/i,
  /i saw (it|the problem|the situation) differently/i,
  /i learned that/i,
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function countHits(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

function allText(entries: Array<{ id: string; title: string; text: string }>): string {
  return entries.map((e) => `${e.title} ${e.text}`).join(' ');
}

// ─────────────────────────────────────────────────────────────
// PATTERN SCORING
// ─────────────────────────────────────────────────────────────

interface PatternScore {
  pattern: Exclude<NarrativePattern, 'unknown'>;
  hits: number;
  qualifies: boolean;
}

function scoreAllPatterns(text: string): PatternScore[] {
  return (Object.entries(PATTERN_FEATURES) as Array<[Exclude<NarrativePattern, 'unknown'>, typeof PATTERN_FEATURES[keyof typeof PATTERN_FEATURES]]>)
    .map(([pattern, config]) => {
      const hits = countHits(text, config.patterns);
      return {
        pattern,
        hits,
        qualifies: hits >= config.minHits,
      };
    })
    .sort((a, b) => b.hits - a.hits);
}

function trySoftPatternClassification(text: string, scores: PatternScore[]): Exclude<NarrativePattern, 'unknown'> | null {
  const top = scores[0];
  const second = scores[1];
  if (!top) return null;

  const structuralSignals =
    (countHits(text, BEFORE_AFTER_PATTERNS) >= 1 ? 1 : 0) +
    (countHits(text, EXTERNAL_FEEDBACK_PATTERNS) >= 1 ? 1 : 0) +
    (countHits(text, INTERNAL_REALIZATION_PATTERNS) >= 1 ? 1 : 0);

  const clearMargin = top.hits > (second?.hits ?? 0);
  const hasMinimalPatternEvidence = top.hits >= 1;

  if (hasMinimalPatternEvidence && clearMargin && structuralSignals >= 1) {
    return top.pattern;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// REASON CODE BUILDER
// ─────────────────────────────────────────────────────────────

function buildReasonCodes(
  text: string,
  primary: NarrativePattern,
  secondaries: NarrativePattern[],
  qualifiedCount: number
): PatternReasonCode[] {
  const codes: PatternReasonCode[] = [];

  if (primary === 'unknown') {
    codes.push('INSUFFICIENT_EVIDENCE_FOR_PATTERN');
    return codes;
  }

  const primaryConfig = PATTERN_FEATURES[primary as Exclude<NarrativePattern, 'unknown'>];
  if (primaryConfig) codes.push(primaryConfig.primaryReasonCode);

  if (countHits(text, BEFORE_AFTER_PATTERNS) >= 1) codes.push('BEFORE_AFTER_CONTRAST_PRESENT');
  if (countHits(text, EXTERNAL_FEEDBACK_PATTERNS) >= 1) codes.push('EXTERNAL_FEEDBACK_CITED');
  if (countHits(text, INTERNAL_REALIZATION_PATTERNS) >= 1) codes.push('INTERNAL_REALIZATION_CITED');
  if (qualifiedCount >= 2) codes.push('MULTIPLE_PATTERNS_COEXIST');

  return codes;
}

// ─────────────────────────────────────────────────────────────
// CONFIDENCE INFERENCE
// ─────────────────────────────────────────────────────────────

function inferConfidence(
  topScore: PatternScore,
  secondScore: PatternScore | undefined
): PatternConfidence {
  if (!topScore.qualifies) return 'low';
  if (!secondScore || !secondScore.qualifies) return 'high'; // clear winner
  // If two patterns both qualify, confidence is medium (ambiguous)
  if (topScore.hits >= secondScore.hits * 1.5) return 'high'; // dominant
  return 'medium';
}

// ─────────────────────────────────────────────────────────────
// PUBLIC CLASSIFIER
// ─────────────────────────────────────────────────────────────

export interface PatternClassifierInput {
  story_entries: Array<{
    id: string;
    title: string;
    text: string;
  }>;
  draft_text: string | null;
  session_id: string;
}

/**
 * Classify the primary and secondary narrative patterns in the
 * intake input. Primary pattern is the single strongest signal;
 * secondary patterns may coexist without displacing the primary.
 *
 * `taxonomy_version` is recorded on every output for reproducibility.
 * The classification logic can be upgraded without changing the
 * output contract or taxonomy version unless the taxonomy changes.
 */
export function classifyNarrativePattern(
  input: PatternClassifierInput
): NarrativePatternDecision {
  const storyText = allText(input.story_entries);
  const combinedText = `${storyText} ${input.draft_text ?? ''}`.trim();

  const scores = scoreAllPatterns(combinedText);
  const qualified = scores.filter((s) => s.qualifies);

  const primaryScore = qualified[0] ?? null;
  const softPrimary = qualified.length === 0 ? trySoftPatternClassification(combinedText, scores) : null;
  const primary: NarrativePattern = primaryScore?.pattern ?? softPrimary ?? 'unknown';

  const secondaries: NarrativePattern[] = qualified
    .slice(1)
    .filter((s) => s.hits >= 1)
    .map((s) => s.pattern);

  const confidence = inferConfidence(
    scores[0] ?? { pattern: 'unknown', hits: 0, qualifies: false },
    scores[1]
  );

  const reason_codes = buildReasonCodes(
    combinedText,
    primary,
    secondaries,
    qualified.length
  );

  const supporting_evidence: IntakeSourceProvenanceRef[] = input.story_entries.map((e) => ({
    source_id: e.id,
    source_type: 'story_entry' as const,
    excerpt: e.text.slice(0, 100),
  }));

  const meta: IntakeDecisionMeta = {
    decision_version: PATTERN_CLASSIFIER_VERSION,
    taxonomy_version: TAXONOMY_VERSION,
    made_at: new Date().toISOString(),
    made_by: 'classifier',
  };

  return {
    primary_pattern: primary,
    secondary_patterns: secondaries,
    confidence,
    reason_codes,
    supporting_evidence,
    taxonomy_version: TAXONOMY_VERSION,
    meta,
  };
}
