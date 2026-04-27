import type {
  NdsNormalizedContextPack,
  NdsResolvedSources,
} from '@/types/ai';

const MAX_STORY_SIGNALS = 8;

const MISTAKE_PATTERNS = [
  /initially handled poorly/i,
  /initially handled this situation poorly/i,
  /at first i handled/i,
  /i initially handled this situation poorly/i,
  /i approached (it|this) the wrong way/i,
  /i got it wrong/i,
  /i made a mistake/i,
  /i mishandled/i,
  /i reacted badly/i,
  /i handled this situation poorly/i,
  /my first instinct was wrong/i,
];

const FEEDBACK_PATTERNS = [
  /after feedback/i,
  /someone told me/i,
  /i got feedback/i,
  /after being told/i,
  /after someone pointed out/i,
  /i was corrected/i,
  /i was called out/i,
  /someone challenged me/i,
  /someone pushed me to reconsider/i,
];

const PIVOT_PATTERNS = [
  /turning-point moment/i,
  /that was the moment/i,
  /i realized/i,
  /i understood/i,
  /it changed how i saw/i,
  /i saw the problem differently/i,
  /that changed my perspective/i,
];

const BEHAVIOR_CHANGE_PATTERNS = [
  /i changed my approach/i,
  /i adapted my approach/i,
  /adapted my approach/i,
  /i adjusted/i,
  /i handled it differently/i,
  /i started doing/i,
  /i responded differently/i,
  /my behavior changed/i,
  /behavior change/i,
  /i changed how i/i,
];

const IMPACT_ON_OTHERS_PATTERNS = [
  /affected others/i,
  /affected the team/i,
  /affected patients/i,
  /affected staff/i,
  /changed the dynamic/i,
  /others responded differently/i,
  /it changed how people worked with me/i,
  /that affected others/i,
];

const DRAFT_ADULT_FRAMING_PATTERNS = [
  /i am trying to connect/i,
  /values and future direction/i,
  /connect .* values/i,
  /connect .* future direction/i,
  /this essay/i,
  /broader (theme|lesson|meaning)/i,
  /future (direction|purpose|aspirations?)/i,
  /demonstrates? (leadership|growth|maturity|resilience)/i,
  /highlight(s|ing)? /i,
  /authentic voice/i,
  /admissions/i,
];

const DRAFT_SCENE_PATTERNS = [
  /\bwhen\b/i,
  /\bafter\b/i,
  /\bduring\b/i,
  /that moment/i,
  /my (mentor|coach|teammate|partner|teacher|director|grandmother|patient|customer)/i,
  /the (match|round|call|rehearsal|shift|experiment|clinic)/i,
  /i said/i,
  /i did/i,
];

const CONFLICT_PATTERNS = [
  /conflict/i,
  /clash/i,
  /disagreement/i,
  /argument/i,
  /tension/i,
];

const DOMAIN_PATTERNS: Array<{
  domain: NdsNormalizedContextPack['story_signals'][number]['domain_signal']['situational_domain'];
  patterns: RegExp[];
}> = [
  {
    domain: 'debate_conflict',
    patterns: [/debate/i, /argument/i, /conflict/i, /team conflict/i],
  },
  {
    domain: 'community_care',
    patterns: [/clinic/i, /patient/i, /volunteer/i, /care/i, /staff/i],
  },
  {
    domain: 'peer_teaching',
    patterns: [/peer tutoring/i, /tutoring/i, /tutor/i, /teach/i, /mentoring/i],
  },
  {
    domain: 'technical_leadership',
    patterns: [/robotics/i, /engineering/i, /build/i, /drivetrain/i, /technical/i, /pit/i, /intake/i, /inspection/i],
  },
  {
    domain: 'research_failure',
    patterns: [/science fair/i, /experiment/i, /hypothesis/i, /lab/i, /research/i],
  },
  {
    domain: 'service_operations',
    patterns: [/restaurant/i, /operations/i, /shift/i, /customers?/i],
  },
  {
    domain: 'athletic_recovery',
    patterns: [/cross-country/i, /injury/i, /recovery/i, /running/i, /athlet/i],
  },
];

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function countPatternHits(text: string, patterns: RegExp[]): number {
  return patterns.filter((pattern) => pattern.test(text)).length;
}

function detectNarrativeSignal(body: string): NdsNormalizedContextPack['story_signals'][number]['narrative_signal'] {
  const text = body.toLowerCase();

  const mistakePresent = hasAnyPattern(text, MISTAKE_PATTERNS);
  const feedbackPresent = hasAnyPattern(text, FEEDBACK_PATTERNS);
  const pivotPresent = hasAnyPattern(text, PIVOT_PATTERNS);
  const behaviorChangePresent = hasAnyPattern(text, BEHAVIOR_CHANGE_PATTERNS);
  const impactOnOthersPresent = hasAnyPattern(text, IMPACT_ON_OTHERS_PATTERNS);
  const conflictPresent = hasAnyPattern(text, CONFLICT_PATTERNS);

  const meetsSelfCorrectionMinimum =
    mistakePresent &&
    (feedbackPresent || pivotPresent) &&
    behaviorChangePresent;

  let pattern: 'self_correction_arc' | 'unknown' = 'unknown';
  let patternConfidence: 'high' | 'medium' | 'low' = 'low';

  if (meetsSelfCorrectionMinimum) {
    pattern = 'self_correction_arc';
    patternConfidence =
      mistakePresent && feedbackPresent && pivotPresent && behaviorChangePresent
        ? 'high'
        : 'medium';
  }

  const tensionType: 'initial_mistake' | 'conflict' | 'unknown' =
    mistakePresent
      ? 'initial_mistake'
      : conflictPresent
        ? 'conflict'
        : 'unknown';

  return {
    pattern,
    pattern_confidence: patternConfidence,
    tension_type: tensionType,
    feedback_present: feedbackPresent,
    pivot_present: pivotPresent,
    behavior_change_present: behaviorChangePresent,
    impact_on_others_present: impactOnOthersPresent,
  };
}

function detectDomainSignal(
  body: string,
  narrativeSignal: NdsNormalizedContextPack['story_signals'][number]['narrative_signal']
): NdsNormalizedContextPack['story_signals'][number]['domain_signal'] {
  const text = body.toLowerCase();

  const matched = DOMAIN_PATTERNS.find(({ patterns }) => hasAnyPattern(text, patterns));
  const situationalDomain = matched?.domain ?? 'other';

  const likelyHumanStakesByDomain: Record<
    NdsNormalizedContextPack['story_signals'][number]['domain_signal']['situational_domain'],
    string
  > = {
    debate_conflict:
      'Whether the student can move from winning arguments to earning trust under disagreement.',
    community_care:
      'Whether the student treats responsibility as human care, not just task completion.',
    peer_teaching:
      'Whether the student can influence another person’s confidence and understanding, not just deliver answers.',
    technical_leadership:
      'Whether the student can shift from proving competence to making a team effective.',
    research_failure:
      'Whether the student can turn failure into disciplined judgment rather than ego defense.',
    service_operations:
      'Whether the student can carry responsibility under pressure while improving how others work together.',
    athletic_recovery:
      'Whether the student can rebuild identity and contribution after performance setbacks.',
    other:
      'Whether the student can show a real internal shift with observable consequences for other people.',
  };

  const interpretiveOpportunityByDomain: Record<
    NdsNormalizedContextPack['story_signals'][number]['domain_signal']['situational_domain'],
    string
  > = {
    debate_conflict:
      'Frame the essay around the shift from being right to being constructive in conflict.',
    community_care:
      'Frame the essay around the shift from volunteer role execution to personal accountability for others.',
    peer_teaching:
      'Frame the essay around the shift from explaining content to changing how another person learns.',
    technical_leadership:
      'Frame the essay around the shift from individual performance to relational leadership.',
    research_failure:
      'Frame the essay around the shift from outcome obsession to evidence-based adaptation.',
    service_operations:
      'Frame the essay around the shift from task throughput to people-aware decision making.',
    athletic_recovery:
      'Frame the essay around the shift from personal setback to renewed contribution.',
    other:
      'Frame the essay around the strongest evidence-backed internal revision and its outward impact.',
  };

  const likelyHumanStakes = likelyHumanStakesByDomain[situationalDomain];
  const baseOpportunity = interpretiveOpportunityByDomain[situationalDomain];

  const interpretiveOpportunity = baseOpportunity;

  return {
    situational_domain: situationalDomain,
    likely_human_stakes: likelyHumanStakes,
    interpretive_opportunity: interpretiveOpportunity,
  };
}

function dedupeStorySignals(
  signals: NdsNormalizedContextPack['story_signals']
): NdsNormalizedContextPack['story_signals'] {
  const seen = new Set<string>();
  const deduped: NdsNormalizedContextPack['story_signals'] = [];

  for (const signal of signals) {
    const normalizedSummary = signal.event_summary
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const key = `${normalizedSummary}|${signal.change_signal.toLowerCase().trim()}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(signal);
  }

  return deduped.map(
    (
      signal: NdsNormalizedContextPack['story_signals'][number],
      index: number
    ) => ({
      ...signal,
      recency_rank: index + 1,
    })
  );
}

function summarizeStory(body: string): string {
  const compact = body.replace(/\s+/g, ' ').trim();
  return compact.length <= 220 ? compact : `${compact.slice(0, 220)}...`;
}

function splitSentences(body: string): string[] {
  return body
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function extractBestChangeSentence(body: string): string | null {
  const sentences = splitSentences(body);
  const changePattern =
    /realized|understood|recognized|noticed|learned|changed|shifted|adapted|adjusted|redesigned|implemented|delegat|trained|advocat|questioned|stopped|started/i;

  const directMatch = sentences.find((sentence) => changePattern.test(sentence));
  if (directMatch) return directMatch;

  const fallback = sentences.find((sentence) => sentence.length >= 45);
  return fallback ?? null;
}

function buildStructuredEventSummary(
  body: string,
  signal: NdsNormalizedContextPack['story_signals'][number]['narrative_signal'],
  domainSignal: NdsNormalizedContextPack['story_signals'][number]['domain_signal']
): string {
  const domainLabel: Record<
    NdsNormalizedContextPack['story_signals'][number]['domain_signal']['situational_domain'],
    string
  > = {
    debate_conflict: 'Debate/conflict',
    community_care: 'Community care/clinic',
    peer_teaching: 'Peer tutoring/teaching',
    technical_leadership: 'Technical leadership',
    research_failure: 'Research/science-fair',
    service_operations: 'Service operations',
    athletic_recovery: 'Athletic recovery',
    other: 'Student story',
  };

  if (signal.pattern === 'self_correction_arc') {
    if (signal.impact_on_others_present) {
      return `${domainLabel[domainSignal.situational_domain]} story where the student started with an ineffective approach, used feedback as a turning point, and changed behavior in a way that affected others.`;
    }
    return `${domainLabel[domainSignal.situational_domain]} story with an initial poor approach followed by feedback-informed behavioral adaptation.`;
  }

  return summarizeStory(body);
}

function inferChangeSignal(
  body: string,
  signal: NdsNormalizedContextPack['story_signals'][number]['narrative_signal'],
  domainSignal: NdsNormalizedContextPack['story_signals'][number]['domain_signal']
): string {
  const extracted = extractBestChangeSentence(body);

  if (signal.pattern === 'self_correction_arc') {
    if (extracted) {
      return /corrected/i.test(extracted) ? extracted : `Corrected course: ${extracted}`;
    }
    if (signal.impact_on_others_present) {
      return `Corrected an ineffective first instinct in the ${domainSignal.situational_domain.replace(/_/g, ' ')} context and recognized impact on others.`;
    }
    return `Moved from an ineffective first approach to a more deliberate response after feedback in the ${domainSignal.situational_domain.replace(/_/g, ' ')} context.`;
  }

  if (signal.feedback_present || signal.pivot_present || signal.behavior_change_present) {
    if (extracted) return extracted;
    return 'A partial change appears in the story, but the hinge moment needs clearer evidence.';
  }

  if (extracted) return extracted;
  return 'The story needs a clearer turning moment to show what changed and why it mattered.';
}

function inferEvidenceStrength(body: string): 'high' | 'medium' | 'low' {
  const len = body.trim().length;
  if (len >= 500) return 'high';
  if (len >= 180) return 'medium';
  return 'low';
}

function detectDraftAuthorshipSignal(
  draftText: string,
  hasStoryEvidence: boolean
): NdsNormalizedContextPack['draft_signals'][number]['authorship_signal'] {
  const adultFramingHits = countPatternHits(draftText, DRAFT_ADULT_FRAMING_PATTERNS);
  const sceneHits = countPatternHits(draftText, DRAFT_SCENE_PATTERNS);

  const contaminationRisk: 'high' | 'medium' | 'low' =
    adultFramingHits >= 2 && sceneHits === 0
      ? 'high'
      : adultFramingHits >= 1 && sceneHits <= 1
        ? 'medium'
        : 'low';

  const studentSceneEvidence: 'present' | 'weak' | 'absent' =
    sceneHits >= 2 ? 'present' : sceneHits === 1 ? 'weak' : 'absent';

  const weightingDecision: 'prioritize_story' | 'usable_with_caution' | 'draft_only_low_trust' =
    contaminationRisk === 'high'
      ? hasStoryEvidence
        ? 'prioritize_story'
        : 'draft_only_low_trust'
      : contaminationRisk === 'medium' && hasStoryEvidence
        ? 'prioritize_story'
        : 'usable_with_caution';

  return {
    contamination_risk: contaminationRisk,
    student_scene_evidence: studentSceneEvidence,
    weighting_decision: weightingDecision,
  };
}

function inferDraftSignalStrength(
  draftText: string,
  authorshipSignal: NdsNormalizedContextPack['draft_signals'][number]['authorship_signal']
): 'high' | 'medium' | 'low' {
  const len = draftText.trim().length;
  const baseStrength: 'high' | 'medium' | 'low' =
    len >= 400 ? 'high' : len >= 120 ? 'medium' : 'low';

  if (authorshipSignal.contamination_risk === 'high') return 'low';

  if (authorshipSignal.contamination_risk === 'medium') {
    if (baseStrength === 'high') return 'medium';
    return 'low';
  }

  return baseStrength;
}

function buildDraftSignalSummary(
  draftText: string,
  authorshipSignal: NdsNormalizedContextPack['draft_signals'][number]['authorship_signal']
): string {
  if (authorshipSignal.contamination_risk === 'high') {
    return 'Draft exists, but the language is polished and abstract without enough student-owned scene evidence.';
  }

  if (authorshipSignal.contamination_risk === 'medium') {
    return 'Draft exists with some usable material, but it may be over-framed in polished language.';
  }

  return draftText.trim().length >= 200
    ? 'Draft exists with substantive narrative content.'
    : 'Draft exists but appears thin.';
}

export function buildNdsNormalizedContextPack(
  sources: NdsResolvedSources
): NdsNormalizedContextPack {
  const storySignalsRaw = sources.story_entries
    .slice(0, MAX_STORY_SIGNALS)
    .map(
      (
        entry: { id: string; body: string },
        index: number
      ) => {
        const narrativeSignal = detectNarrativeSignal(entry.body);
        const domainSignal = detectDomainSignal(entry.body, narrativeSignal);
        return {
          source_id: entry.id,
          source_type: 'story_entry' as const,
          event_summary: buildStructuredEventSummary(entry.body, narrativeSignal, domainSignal),
          change_signal: inferChangeSignal(entry.body, narrativeSignal, domainSignal),
          evidence_strength: inferEvidenceStrength(entry.body),
          recency_rank: index + 1,
          narrative_signal: narrativeSignal,
          domain_signal: domainSignal,
        };
      }
    );

  const storySignals = dedupeStorySignals(storySignalsRaw);

  const draftAuthorshipSignal = sources.current_draft
    ? detectDraftAuthorshipSignal(sources.current_draft.draft_text, storySignals.length > 0)
    : null;

  const draftSignals = sources.current_draft
    ? [
        {
          source_id: sources.current_draft.id,
          source_type: 'essay_draft_version' as const,
          signal_summary: buildDraftSignalSummary(
            sources.current_draft.draft_text,
            draftAuthorshipSignal as NdsNormalizedContextPack['draft_signals'][number]['authorship_signal']
          ),
          strength: inferDraftSignalStrength(
            sources.current_draft.draft_text,
            draftAuthorshipSignal as NdsNormalizedContextPack['draft_signals'][number]['authorship_signal']
          ),
          authorship_signal:
            draftAuthorshipSignal as NdsNormalizedContextPack['draft_signals'][number]['authorship_signal'],
        },
      ]
    : [];

  const schoolSignals = sources.school_context
    ? [
        {
          source_id: sources.school_context.source_id,
          target_school: sources.school_context.target_school,
          signal_summary: sources.school_context.signal_summary,
        },
      ]
    : [];

  const contextGaps: string[] = [];
  if (storySignals.length === 0) contextGaps.push('No usable story evidence found.');
  if (!sources.current_draft) contextGaps.push('No draft signal available.');
  if (draftAuthorshipSignal?.contamination_risk === 'high' && storySignals.length === 0) {
    contextGaps.push(
      'Current draft may reflect polished adult framing without enough student-owned scene evidence.'
    );
  }
  if (draftAuthorshipSignal?.contamination_risk !== 'low' && storySignals.length > 0) {
    contextGaps.push(
      'Student-authored story evidence should take priority over polished draft framing.'
    );
  }

  const firstName = sources.student_profile?.first_name ?? null;
  const lastName = sources.student_profile?.last_name ?? null;

  return {
    module: 'narrative_direction_selection',
    subject: {
      entity_type: 'essay_project',
      entity_id: sources.essay_project.id,
    },
    student_core: {
      name: firstName || lastName ? `${firstName ?? ''} ${lastName ?? ''}`.trim() : null,
      grade_level:
        typeof sources.student_profile?.grade === 'number'
          ? `Grade ${sources.student_profile.grade}`
          : null,
      intended_majors: [],
      core_interests: Array.isArray(sources.student_profile?.interests)
        ? (sources.student_profile?.interests as string[])
        : [],
      identity_notes: [],
    },
    story_signals: storySignals,
    draft_signals: draftSignals,
    school_signals: schoolSignals,
    context_gaps: contextGaps,
    assembler_meta: {
      story_signal_count: storySignals.length,
      draft_signal_count: draftSignals.length,
      school_signal_count: schoolSignals.length,
      used_current_draft: !!sources.current_draft,
    },
  };
}
