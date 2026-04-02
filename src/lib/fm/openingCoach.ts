import {
  getDominantActor,
  getDominantConsequence,
  getDominantScene,
  getDominantTurningPoint,
  type SessionCaseState,
} from '@/lib/fm/case-state';
import {
  deriveCoachBehaviorSignals,
  buildCoachMemoryState,
  buildCoachResponse,
  type CoachBehaviorSignals,
  type CoachMemoryState,
  type CoachResponse,
} from '@/lib/fm/coachBehavior';
import { deriveDirectionContent } from '@/lib/fm/direction';
import { renderGuard } from '@/lib/fm/output-quality';
import type { IntakeIntelligenceObject } from '@/types/intake';

export interface OpeningCoachModel {
  helperLine: string;
  scaffoldSteps: string[];
  starterLine: string | null;
  initialDraft: string;
  openingComparison: {
    weaker: string;
    stronger: string;
    judgment: string;
  };
  nextParagraphInstruction: string;
  nextParagraphExpectation: string;
  antiGenericWarnings: string[];
  refinementQuestion: string;
  whyWeakMicroFeedback: string;
  behavior: CoachBehaviorSignals;
  coachResponse: CoachResponse;
  coachMemory: CoachMemoryState;
}

export interface OpeningSentenceFeedback {
  line: string;
  verdict: 'keep' | 'cut' | 'replace';
  reason: string;
}

export interface OpeningDraftReview {
  coachResponse: CoachResponse;
  behavior: CoachBehaviorSignals;
  comparison: {
    weaker: string;
    stronger: string;
    judgment: string;
  };
  sentenceFeedback: OpeningSentenceFeedback[];
}

function trimSnippet(text: string): string {
  const value = text.trim().replace(/[.?!]+$/, '');
  if (!value) return '';
  return value.length > 92 ? `${value.slice(0, 89).trim()}…` : value;
}

function sentenceCase(text: string): string {
  const value = text.trim();
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ensureSentence(text: string): string {
  const value = sentenceCase(text).trim();
  if (!value) return '';
  return /[.?!]$/.test(value) ? value : `${value}.`;
}

function buildStarterLine(scene: string | null, turning: string | null): string | null {
  const normalizedScene = scene ? trimSnippet(scene) : '';
  if (normalizedScene) {
    if (/^(I|We|My|Our|The|In|At|During)\b/.test(normalizedScene)) {
      return ensureSentence(normalizedScene);
    }
    return ensureSentence(`I was ${normalizedScene}`);
  }

  const normalizedTurning = turning ? trimSnippet(turning) : '';
  if (normalizedTurning) {
    return ensureSentence(`The moment everything shifted started with ${normalizedTurning}`);
  }

  return null;
}

function buildStrongStarterLine(caseState: SessionCaseState | null): string | null {
  const lens = detectStrongOpeningLens(caseState);

  if (lens === 'lab_reliability') {
    return 'I finished the titration setup first, and another student copied the unlabeled step I had started doing in my head.';
  }

  if (lens === 'tradeoff_judgment') {
    return 'After two failed inspections, I told the team to cut autonomous so we could pass on time.';
  }

  if (lens === 'translation_understanding') {
    return 'I summarized the clerk\'s instructions so we could move faster, and my grandfather signed before he fully understood the form.';
  }

  return null;
}

function buildInitialDraft(starterLine: string | null, options?: { starterOnly?: boolean }): string {
  if (options?.starterOnly) {
    return starterLine ?? '';
  }

  return [
    starterLine ?? 'I was [what you were doing just before the shift].',
    'Then [what interrupted that routine].',
    'So I chose to [what you did next].',
    'The detail I still remember is [the concrete detail that makes the scene real].',
  ].join('\n');
}

function buildOpeningComparison(
  strongest: ReturnType<typeof deriveDirectionContent>['strongest'],
  scene: string | null,
  turning: string | null,
  actor: string | null
): OpeningCoachModel['openingComparison'] {
  const sceneSnippet = scene ? trimSnippet(scene) : null;
  const turningSnippet = turning ? trimSnippet(turning) : null;
  const actorSnippet = actor ? trimSnippet(actor) : null;

  const weaker = renderGuard(
    sceneSnippet
      ? `This version would summarize ${sceneSnippet} before the real turn appears.`
      : 'This version would open with background and explanation before the real turn appears.',
    'This version would stay in setup too long.',
    { maxWords: 18, maxSentences: 1 }
  );

  const stronger = renderGuard(
    turningSnippet
      ? `This version starts near ${turningSnippet} and moves straight to the choice.`
      : actorSnippet
        ? `This version starts in the moment you respond to ${actorSnippet}.`
        : strongest.next_move,
    'This version starts inside the pressure and moves straight to the choice.',
    { maxWords: 18, maxSentences: 1 }
  );

  const judgment = renderGuard(
    turningSnippet
      ? `The stronger opening earns meaning because ${turningSnippet} puts the pressure on the page instead of talking around it.`
      : 'The stronger opening earns meaning because it starts with pressure, not explanation.',
    'The stronger opening earns meaning because it starts with pressure, not explanation.',
    { maxWords: 18, maxSentences: 1 }
  );

  return {
    weaker,
    stronger,
    judgment,
  };
}

function hasConcreteOpeningSignal(line: string): boolean {
  return /("|'|\b(sat|stood|walked|looked|heard|saw|held|opened|closed|lined|said|told|asked|coloring|book|crayons|hallway|desk|room|door|phone|practice|kitchen|she|he|they|my|our)\b)/i.test(line);
}

function hasStrongOpeningInterpretationSignal(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null
): boolean {
  const signal = intake.usable_signal.signal_strength;
  if (signal !== 'medium' && signal !== 'high') return false;

  const scene = caseState ? getDominantScene(caseState) : null;
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const consequence = caseState ? getDominantConsequence(caseState) : null;

  return Boolean(scene && (turning || consequence));
}

function detectStrongOpeningLens(caseState: SessionCaseState | null): 'lab_reliability' | 'translation_understanding' | 'tradeoff_judgment' | null {
  const combined = [
    caseState ? getDominantScene(caseState) : null,
    caseState ? getDominantTurningPoint(caseState) : null,
    caseState ? getDominantConsequence(caseState) : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(' ');

  if (/\b(chem|lab|burette|titration|checklist|reliability|failed trials)\b/i.test(combined)) {
    return 'lab_reliability';
  }

  if (/\b(grandparents?|translate|translating|translator|clerk|officials|appointment|government offices|line by line)\b/i.test(combined)) {
    return 'translation_understanding';
  }

  if (/\b(robot|robotics|inspection|quarterfinal|regionals|tradeoff|autonomous|manual control)\b/i.test(combined)) {
    return 'tradeoff_judgment';
  }

  return null;
}

function buildStrongOpeningComparison(
  pattern: string,
  caseState: SessionCaseState | null
): OpeningCoachModel['openingComparison'] {
  const lens = detectStrongOpeningLens(caseState);

  if (lens === 'lab_reliability') {
    return {
      weaker: 'The weaker opening turns this into a lab mistake instead of the moment your definition of competence failed someone else.',
      stronger: 'This is stronger because the reader watches your private shortcut look efficient right up until another student has to absorb the cost.',
      judgment: 'What makes this opening work is the split between pride and trust: finishing first stops looking like excellence the second someone else has to rely on your standard.',
    };
  }

  if (lens === 'translation_understanding') {
    return {
      weaker: 'The weaker opening treats this like office logistics instead of the moment helpfulness failed because understanding never arrived.',
      stronger: 'This is stronger because the reader feels the fast summary as kindness first, then sees why kindness without understanding was not enough.',
      judgment: 'What makes this opening work is the split between moving things along and making sure another person can actually act with full understanding.',
    };
  }

  if (lens === 'tradeoff_judgment') {
    return {
      weaker: 'The weaker opening treats this like a tense robotics decision instead of the moment your leadership logic concealed the real cost.',
      stronger: 'This is stronger because the reader sees your call protect schedule first and only then feels the strength it quietly buried.',
      judgment: 'What makes this opening work is not the pressure by itself, but the moment you realize a decision is incomplete until its cost is spoken aloud.',
    };
  }

  switch (pattern) {
    case 'self_correction_arc':
      return {
        weaker: 'The weaker opening just recounts the correction.',
        stronger: 'The stronger opening makes the old rule fail on the page before the new one appears.',
        judgment: 'The opening should let the reader feel why your first standard stopped being enough.',
      };
    case 'competence_vs_responsibility':
      return {
        weaker: 'The weaker opening just recounts the mistake.',
        stronger: 'The stronger opening makes the old standard collapse on the page.',
        judgment: 'The opening should show why speed stopped feeling like competence.',
      };
    case 'conflict_reframe':
      return {
        weaker: 'The weaker opening just replays the argument.',
        stronger: 'The stronger opening makes the tradeoff visible before the lesson arrives.',
        judgment: 'The opening earns the essay when the cost of your old decision logic is visible.',
      };
    case 'identity_shift':
      return {
        weaker: 'The weaker opening just summarizes the responsibility.',
        stronger: 'The stronger opening makes convenience and responsibility collide on the page.',
        judgment: 'The opening should establish what responsibility started to mean under pressure.',
      };
    default:
      return {
        weaker: 'The weaker opening just summarizes the event.',
        stronger: 'The stronger opening establishes the shift in understanding before it explains it.',
        judgment: 'The opening should make the changed standard legible, not just the chronology.',
      };
  }
}

function buildStrongOpeningGuidance(
  pattern: string,
  caseState: SessionCaseState | null
): Pick<OpeningCoachModel,
  'helperLine' | 'scaffoldSteps' | 'nextParagraphInstruction' | 'nextParagraphExpectation' | 'antiGenericWarnings'
> & { diagnosis: string } {
  const lens = detectStrongOpeningLens(caseState);

  if (lens === 'lab_reliability') {
    return {
      helperLine: 'Choose the exact line where your private shortcut still feels like excellence, then build the opening from that evidence.',
      scaffoldSteps: [
        'Choose the exact line where finishing first still feels like proof that you know what you are doing.',
        'Start from that line, not from lab background or a lesson statement.',
        'Let the copied setup and the contamination show who had to live with the shortcut you kept private.',
        'Hold the lesson back until the reader can feel pride and reliability stop pointing to the same thing.'
      ],
      nextParagraphInstruction: 'Before you draft further, keep one evidence line for the skipped step and one for the contamination. Then write from those lines into the trust failure they expose.',
      nextParagraphExpectation: 'That paragraph should sound like you are redefining competence, not narrating how the checklist rollout happened.',
      antiGenericWarnings: [
        'Do not frame this as a generic lesson about being more careful.',
        'Do not explain the checklist before the trust failure is visible.',
        'Do not tell the reader the meaning in the first sentence; make them feel the wrong standard first.',
        'Do not let process detail crowd out the claim about competence.'
      ],
      diagnosis: 'The scene is already strong. What the opening still needs is the instant pride stops looking like competence and trust becomes the real measure.'
    };
  }

  if (lens === 'translation_understanding') {
    return {
      helperLine: 'Choose the exact line where the fast summary still feels like kindness, then build the opening from that evidence.',
      scaffoldSteps: [
        'Choose the exact line where moving things along still feels like the helpful thing to do.',
        'Start from that line, not from office background or family duty.',
        'Let the signature land before you explain why speed was not enough.',
        'Keep the claim implied until the reader can feel the gap between getting through the line and making sure someone truly understands.'
      ],
      nextParagraphInstruction: 'Before you draft further, keep one evidence line for the summary and one for the signature. Then write from those lines into the misunderstanding they caused.',
      nextParagraphExpectation: 'That paragraph should sound like a claim about what responsibility owes another person, not a summary of how you now translate.',
      antiGenericWarnings: [
        'Do not reduce this to being a good grandchild or a helpful translator.',
        'Do not explain the moral before the misunderstanding lands.',
        'Do not drown the claim in office detail.',
        'Do not make efficiency and understanding sound equally acceptable.'
      ],
      diagnosis: 'The scene is already there. What the opening still needs is the instant efficiency stops feeling like help and starts looking like incomplete care.'
    };
  }

  if (lens === 'tradeoff_judgment') {
    return {
      helperLine: 'Choose the exact line for the call that still feels decisive, then build the opening from that evidence.',
      scaffoldSteps: [
        'Choose the exact line for the call you made after the failed inspections.',
        'Start from that call, not from robotics background or atmosphere.',
        'Let the call protect schedule first, then make the hidden sacrifice visible.',
        'Hold the lesson back until the reader can feel the blind spot in your reasoning, not just the pressure around you.'
      ],
      nextParagraphInstruction: 'Before you draft further, keep one evidence line for the call and one for the loss it created. Then write from those lines into the cost you had missed.',
      nextParagraphExpectation: 'That paragraph should read like an argument about judgment under pressure, not a replay of inspections and quarterfinals.',
      antiGenericWarnings: [
        'Do not reduce this to a right-versus-wrong decision story.',
        'Do not explain the lesson before the sacrifice is visible.',
        'Do not spend the paragraph on robotics background the reader does not need.',
        'Do not make the opening about tension alone; make it about the blind spot in your reasoning.'
      ],
      diagnosis: 'The pressure is already on the page. What the opening still needs is the blind cost your old decision logic could not see.'
    };
  }

  switch (pattern) {
    case 'self_correction_arc':
      return {
        helperLine: 'Choose the line where the old rule breaks, then draft from that evidence.',
        scaffoldSteps: [
          'Choose the exact line where the shortcut or first rule still felt right.',
          'Start from that line, not from explanation.',
          'Let the reader see the cost of that rule before you explain the lesson.',
          'Keep the pressure on what your first standard missed, not on broad backstory.'
        ],
        nextParagraphInstruction: 'Before you draft further, keep one line for the failure and one for the response. Then write from those lines into what they prove.',
        nextParagraphExpectation: 'The reader should leave the paragraph understanding not just what changed, but what your first standard failed to protect.',
        antiGenericWarnings: [
          'Do not retell the correction as a simple mistake story.',
          'Do not explain the lesson before the failure is visible.',
          'Do not flatten the shift into generic maturity language.',
          'Do not confuse process detail with what the scene proves.'
        ],
        diagnosis: 'You already have the scene. Make the opening show why the old rule stopped working.'
      };
    case 'competence_vs_responsibility':
      return {
        helperLine: 'Choose the exact evidence line where speed stops being enough, then draft from there.',
        scaffoldSteps: [
          'Choose the line where looking efficient still feels normal.',
          'Start from that line before you explain why it failed.',
          'Make the key turn the moment someone else had to live with your standard.',
          'End the opening where reliability becomes non-negotiable.'
        ],
        nextParagraphInstruction: 'Before you draft further, keep one line for the shortcut and one for the fallout. Then write from those lines into why trust had to matter more than speed.',
        nextParagraphExpectation: 'The reader should see that trust—not speed—is what your new standard protects.',
        antiGenericWarnings: [
          'Do not retell the whole event step by step.',
          'Do not over-explain the checklist mechanics.',
          'Do not frame this as perfectionism.',
          'Do not state the lesson before the trust problem is visible.'
        ],
        diagnosis: 'You already have the scene. Make the opening prove why the old rule failed.'
      };
    case 'conflict_reframe':
      return {
        helperLine: 'Choose the exact line for the decision and the exact line for the cost, then draft from those.',
        scaffoldSteps: [
          'Choose the line where the decision happens.',
          'Pair it with the line that shows the cost.',
          'Make the reader feel what your call protected and what it cost.',
          'Do not defend yourself too early; let the tradeoff stay uncomfortable.'
        ],
        nextParagraphInstruction: 'Before you draft further, keep one line for what the call protected and one for what it cost. Then write from those lines into the judgment you lacked at the time.',
        nextParagraphExpectation: 'The reader should leave the paragraph understanding what your decision protected, what it sacrificed, and why that changed you.',
        antiGenericWarnings: [
          'Do not turn this into a robotics recap.',
          'Do not reduce the choice to right versus wrong.',
          'Do not rush to the lesson before the cost is visible.',
          'Do not over-explain the technical background.'
        ],
        diagnosis: 'You already have the pressure. Make the opening reveal the cost your old decision missed.'
      };
    case 'identity_shift':
      return {
        helperLine: 'Choose the exact line where getting through the interaction stopped being enough, then draft from there.',
        scaffoldSteps: [
          'Choose the line where the shortcut still feels reasonable.',
          'Start from that line before you explain its cost.',
          'Keep the opening focused on what the misunderstanding exposed about your role.',
          'End where accuracy starts to matter more than convenience.'
        ],
        nextParagraphInstruction: 'Before you draft further, keep one line for the shortcut and one for the misunderstanding. Then write from those lines into what responsibility had to protect.',
        nextParagraphExpectation: 'The reader should feel that responsibility changed from a family task into a question of whether another person can act with full understanding.',
        antiGenericWarnings: [
          'Do not reduce this to being helpful.',
          'Do not over-explain the office logistics.',
          'Do not announce the lesson before the misunderstanding lands.',
          'Do not flatten responsibility into duty language.'
        ],
        diagnosis: 'You already have the scene. Make the opening show when convenience stopped being acceptable.'
      };
    default:
      return {
        helperLine: 'Choose the exact evidence line that carries the pressure, then draft from there.',
        scaffoldSteps: [
          'Choose the line with the most pressure in it.',
          'Start from that line, not from backstory.',
          'Use the opening to establish the tension the essay will interpret.'
        ],
        nextParagraphInstruction: 'Before you draft further, keep one line for the pressure point and one for the response. Then write from those lines into what the scene proves.',
        nextParagraphExpectation: 'The next paragraph should clarify what the scene proves about you, not just what happened next.',
        antiGenericWarnings: [
          'Do not explain the lesson too early.',
          'Do not retell the whole event in order.',
          'Do not flatten the opening into résumé language.',
          'Do not mistake scene detail for interpretation.'
        ],
        diagnosis: 'You already have the material. Make the opening establish the pressure and the response clearly.'
      };
  }
}

export function deriveOpeningSentenceFeedback(draftText: string): OpeningSentenceFeedback[] {
  const lines = draftText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (lines.length === 0) return [];

  return lines.map((line, index) => {
    const lower = line.toLowerCase();
    const generic = /(i learned|this taught me|made me realize|leadership|service|community|passion|resilience)/.test(lower);
    const abstract = /(journey|experience|important|meaningful|growth|impact|perspective)/.test(lower);
    const concrete = hasConcreteOpeningSignal(line);
    const choiceLanguage = /(then|so|because|when|after|i chose|i decided|i stayed|i said)/.test(lower);

    if (generic || abstract) {
      return {
        line,
        verdict: 'cut',
        reason: 'Cut this line. It explains the meaning before the scene earns it.',
      };
    }

    if (index === 0 && concrete) {
      return {
        line,
        verdict: 'keep',
        reason: 'Keep this. It starts inside a real moment.',
      };
    }

    if (choiceLanguage && concrete) {
      return {
        line,
        verdict: 'keep',
        reason: 'Keep this if the next line shows what changed or what you chose.',
      };
    }

    return {
      line,
      verdict: 'replace',
      reason: 'Replace this with a concrete action, spoken line, or visible detail from the scene.',
    };
  });
}

export function deriveOpeningDraftReview(input: {
  intake: IntakeIntelligenceObject;
  caseState: SessionCaseState | null;
  draftText: string;
}): OpeningDraftReview {
  const { intake, caseState, draftText } = input;
  const derivedDirection = deriveDirectionContent(intake, caseState);
  const strongest = derivedDirection.strongest;
  const behavior = deriveCoachBehaviorSignals({
    stage: 'opening',
    intake,
    strongest,
    caseState,
    draftText,
    lastStudentAnswer: draftText,
  });
  const coachResponse = buildCoachResponse(behavior, strongest, caseState, draftText);
  const scene = caseState ? getDominantScene(caseState) : null;
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const actor = caseState ? getDominantActor(caseState) : null;
  const strongInterpretationSignal = hasStrongOpeningInterpretationSignal(intake, caseState);
  const strongGuidance = strongInterpretationSignal
    ? buildStrongOpeningGuidance(intake.narrative_pattern.primary_pattern, caseState)
    : null;
  const strongComparison = strongInterpretationSignal
    ? buildStrongOpeningComparison(intake.narrative_pattern.primary_pattern, caseState)
    : null;
  const firstLine = draftText.split(/\n+/).map((line) => line.trim()).filter(Boolean)[0] ?? '';
  const firstLineSnippet = firstLine ? trimSnippet(firstLine) : null;
  const comparisonGuard = strongInterpretationSignal
    ? { maxWords: 34, maxSentences: 2 }
    : { maxWords: 18, maxSentences: 1 };

  const weaker = behavior.correction_target === 'meaning_too_early'
    ? 'This draft explains what you learned before the scene becomes visible.'
    : behavior.correction_target === 'scene_missing'
      ? 'This draft names the idea but still hides the actual moment.'
      : behavior.correction_target === 'resume_language'
        ? 'This draft leans on role labels instead of the lived scene.'
        : behavior.correction_target === 'generic_helping_language'
          ? 'This draft sounds like a broad helping essay instead of this exact choice.'
          : firstLineSnippet
            ? `This draft weakens if it moves away from ${firstLineSnippet} too early.`
            : 'This draft weakens if it shifts into explanation too early.';

  const stronger = behavior.correction_target === 'scene_missing'
    ? scene
      ? `Start in ${trimSnippet(scene)} and show the interruption before the meaning.`
      : strongest.write_first_steps[0]
    : behavior.correction_target === 'meaning_too_early'
      ? 'Keep the scene first, then let the meaning arrive after the choice.'
      : firstLineSnippet && hasConcreteOpeningSignal(firstLine)
        ? `Keep ${firstLineSnippet} and make the next line show the interruption.`
        : turning
          ? `Start near ${trimSnippet(turning)} and move straight to the choice.`
          : actor
            ? `Start in the moment you respond to ${trimSnippet(actor)}.`
            : strongest.next_move;

  const judgment = behavior.correction_target === 'none'
    ? 'This opening is usable because it stays with the pressure instead of translating it too early.'
    : behavior.correction_target === 'meaning_too_early'
      ? 'The fix is simple: earn the meaning after the moment, not before it.'
      : behavior.correction_target === 'scene_missing'
        ? 'The page gets stronger the second the draft shows a real scene.'
        : 'The stronger version keeps the moment under pressure instead of summarizing it.';

  return {
    coachResponse: strongGuidance
      ? { ...coachResponse, diagnosis: strongGuidance.diagnosis }
      : coachResponse,
    behavior,
    comparison: {
      weaker: renderGuard(strongComparison?.weaker ?? weaker, 'This draft weakens if it shifts into explanation too early.', comparisonGuard),
      stronger: renderGuard(strongComparison?.stronger ?? stronger, 'Start inside the pressure and move straight to the choice.', comparisonGuard),
      judgment: renderGuard(strongComparison?.judgment ?? judgment, 'The stronger version keeps the moment under pressure instead of summarizing it.', comparisonGuard),
    },
    sentenceFeedback: deriveOpeningSentenceFeedback(draftText),
  };
}

export function deriveOpeningCoachModel(
  intake: IntakeIntelligenceObject,
  caseState: SessionCaseState | null = null
): OpeningCoachModel {
  const derivedDirection = deriveDirectionContent(intake, caseState);
  const strongest = derivedDirection.strongest;
  const scene = caseState ? getDominantScene(caseState) : null;
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const actor = caseState ? getDominantActor(caseState) : null;
  const strongInterpretationSignal = hasStrongOpeningInterpretationSignal(intake, caseState);
  const starterLine = strongInterpretationSignal
    ? buildStrongStarterLine(caseState) ?? buildStarterLine(scene, turning)
    : buildStarterLine(scene, turning);
  const strongGuidance = strongInterpretationSignal
    ? buildStrongOpeningGuidance(intake.narrative_pattern.primary_pattern, caseState)
    : null;
  const strongComparison = strongInterpretationSignal
    ? buildStrongOpeningComparison(intake.narrative_pattern.primary_pattern, caseState)
    : null;
  const behavior = deriveCoachBehaviorSignals({
    stage: 'opening',
    intake,
    strongest,
    caseState,
  });
  const coachResponseBase = buildCoachResponse(behavior, strongest, caseState);
  const coachResponse = strongGuidance
    ? { ...coachResponseBase, diagnosis: strongGuidance.diagnosis }
    : coachResponseBase;
  const coachMemory = buildCoachMemoryState(
    {
      stage: 'opening',
      intake,
      strongest,
      caseState,
    },
    behavior,
    derivedDirection.compare_alternatives.find((entry) => !entry.is_strongest)?.title ?? null
  );

  const scaffoldSteps = strongGuidance?.scaffoldSteps ?? [
    renderGuard(
      scene
        ? `Choose the exact line around "${trimSnippet(scene)}" that carries the pressure.`
        : 'Choose the exact line that carries the pressure.',
      'Choose the exact line that carries the pressure.',
      { maxWords: 20, maxSentences: 1 }
    ),
    renderGuard(
      turning
        ? `Draft from "${trimSnippet(turning)}", not from background summary.`
        : 'Draft from the pressure point, not from background summary.',
      'Draft from the pressure point, not from background summary.',
      { maxWords: 20, maxSentences: 1 }
    ),
    renderGuard(
      actor
        ? `Show the choice you made in response to ${trimSnippet(actor)}.`
        : 'Show the choice you made in that moment.',
      'Show the choice you made in that moment.',
      { maxWords: 18, maxSentences: 1 }
    ),
    renderGuard(
      'Keep one concrete detail in the scene so the opening feels lived, not explained.',
      'Keep one concrete detail in the scene.',
      { maxWords: 18, maxSentences: 1 }
    ),
  ];

  return {
    helperLine: strongGuidance?.helperLine ?? 'Write the first four lines.',
    scaffoldSteps,
    starterLine,
    initialDraft: buildInitialDraft(starterLine, { starterOnly: Boolean(strongGuidance) }),
    openingComparison: strongComparison ?? buildOpeningComparison(strongest, scene, turning, actor),
    nextParagraphInstruction: renderGuard(
      strongGuidance?.nextParagraphInstruction ?? strongest.write_next_steps[0] ?? 'Before drafting further, choose the evidence line you are building from and the line that shows what changed.',
      'Before drafting further, choose the evidence line you are building from and the line that shows what changed.',
      { maxWords: 30, maxSentences: 2 }
    ),
    nextParagraphExpectation: renderGuard(
      strongGuidance?.nextParagraphExpectation ?? strongest.write_next_steps[1] ?? 'Show the visible result, but do not jump to the life lesson yet.',
      'Show the visible result, but do not jump to the life lesson yet.',
      { maxWords: 32, maxSentences: 2 }
    ),
    antiGenericWarnings: strongGuidance?.antiGenericWarnings ?? [
      'Do not turn this into a caring-about-people essay.',
      'Do not start with what you learned.',
      'Do not explain the meaning too early.',
      'Stay in the scene first.',
      ...strongest.avoid_lines.slice(0, 2),
    ],
    refinementQuestion: strongest.focused_question,
    whyWeakMicroFeedback: behavior.correction_target === 'meaning_too_early'
      ? 'I changed this because the earlier version started with meaning instead of scene.'
      : behavior.correction_target === 'scene_missing'
        ? 'I changed this because the earlier version was too broad and skipped the real moment.'
        : behavior.correction_target === 'resume_language'
          ? 'I changed this because the earlier version sounded like résumé language, not lived writing.'
          : 'I changed this because the earlier version was too broad.',
    behavior,
    coachResponse,
    coachMemory,
  };
}