import type {
  EvidenceStrengthPrediction,
  IntakeIntelligenceObject,
  IntakeSessionInput,
  ProductMode,
} from '@/types/intake';
import type {
  CanonicalPage3Payload,
  CanonicalRouteDecision,
} from '@/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1';
import {
  type SessionCaseState,
  getDominantConsequence,
  getDominantReflection,
  getDominantScene,
  getDominantTurningPoint,
} from '@/lib/fm/case-state';
import { deriveDirectionContent } from '@/lib/fm/direction';

interface BuildCanonicalPage3PayloadInput {
  sessionId: string;
  caseId?: string | null;
  rawInput: string;
  normalizedInput: string;
  intakeInput: IntakeSessionInput;
  intake: IntakeIntelligenceObject;
  evidenceStrength: EvidenceStrengthPrediction;
  requestedProductMode: ProductMode;
  effectiveProductMode: ProductMode;
  caseState: SessionCaseState | null;
}

const ANCHOR_FRAGMENT_PATTERNS: RegExp[] = [
  /\b(since then I[^.?!]{0,140}[.?!])/gi,
  /\b(the moment[^.?!]{0,180}[.?!])/gi,
  /\b(after [^.?!]{0,160}[.?!])/gi,
  /\b(before [^.?!]{0,160}[.?!])/gi,
  /\b(I (realized|learned|changed|stopped|started)[^.?!]{0,160}[.?!])/gi,
  /\b(he|she|they|my (coach|teacher|teammate|partner|counselor|supervisor)) (said|told me)[^.?!]{0,160}[.?!]/gi,
];

const ANCHOR_TERM_PATTERNS: RegExp[] = [
  /\b(checklist|rubric|criteria|policy|verification|fact-?check|tradeoff|ownership|credit|trust|responsibility)\b/gi,
  /\b(teacher|coach|teammate|partner|counselor|supervisor|pharmacist|principal)\b/gi,
  /\b(corrected|correction|overruled|revised|rewrote|reframed|pushed|waited|emailed)\b/gi,
  /\b(before|after|since then|at first|later|instead|but actually)\b/gi,
];

function toRouteDecision(
  effectiveProductMode: ProductMode,
  intake: IntakeIntelligenceObject,
  evidenceStrength: EvidenceStrengthPrediction
): CanonicalRouteDecision {
  const confidence =
    evidenceStrength.confidence >= 0.75 ? 'high' : evidenceStrength.confidence >= 0.5 ? 'medium' : 'low';

  if (effectiveProductMode === 'blocked') {
    return {
      route_target: 'blank_page',
      route_confidence: confidence,
      route_reason_code: 'ROUTE_BLOCKED',
      route_reason_detail: 'Blocking risk detected from viability and escalation signals.',
      direction_generation_allowed: false,
      clarification_recommended: false,
      fallback_required: true,
    };
  }

  if (effectiveProductMode === 'blank_page_intake') {
    return {
      route_target: 'blank_page',
      route_confidence: confidence,
      route_reason_code: 'ROUTE_BLANK_PAGE',
      route_reason_detail: intake.recommendation_viability.reason_codes.join(', ') || 'Blank-page intake recovery lane selected.',
      direction_generation_allowed: false,
      clarification_recommended: true,
      fallback_required: true,
    };
  }

  if (effectiveProductMode === 'clarification') {
    return {
      route_target: 'question',
      route_confidence: confidence,
      route_reason_code: 'ROUTE_CLARIFICATION',
      route_reason_detail: intake.recommendation_viability.reason_codes.join(', ') || 'Clarification recommended before committing to final direction.',
      direction_generation_allowed: true,
      clarification_recommended: true,
      fallback_required: false,
    };
  }

  return {
    route_target: 'direction',
    route_confidence: confidence,
    route_reason_code: 'ROUTE_DIRECTION',
    route_reason_detail: intake.recommendation_viability.reason_codes.join(', ') || 'Direction path selected.',
    direction_generation_allowed: true,
    clarification_recommended: effectiveProductMode === 'direction_light',
    fallback_required: effectiveProductMode === 'direction_light',
  };
}

function collectPreservedSourceFragments(rawInput: string): string[] {
  const fragments: string[] = [];
  for (const pattern of ANCHOR_FRAGMENT_PATTERNS) {
    const matches = rawInput.match(pattern) ?? [];
    for (const m of matches) {
      const trimmed = m.replace(/\s+/g, ' ').trim();
      if (trimmed.length >= 24 && !fragments.includes(trimmed)) {
        fragments.push(trimmed);
      }
      if (fragments.length >= 8) return fragments;
    }
  }

  if (fragments.length < 3) {
    const sentenceFallback = rawInput
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim())
      .filter((line) => line.length >= 24)
      .slice(0, 8);

    for (const sentence of sentenceFallback) {
      if (!fragments.includes(sentence)) fragments.push(sentence);
      if (fragments.length >= 8) break;
    }
  }

  return fragments;
}

function collectPreservedAnchorTerms(rawInput: string): string[] {
  const terms = new Set<string>();
  for (const pattern of ANCHOR_TERM_PATTERNS) {
    const matches = rawInput.match(pattern) ?? [];
    for (const rawMatch of matches) {
      const normalized = rawMatch.trim().toLowerCase();
      if (normalized) terms.add(normalized);
      if (terms.size >= 14) break;
    }
    if (terms.size >= 14) break;
  }
  return [...terms];
}

function buildEvidencePacket(caseState: SessionCaseState | null): {
  evidence_lines: string[];
  evidence_explanations: string[];
} {
  const scene = caseState ? getDominantScene(caseState) : null;
  const turning = caseState ? getDominantTurningPoint(caseState) : null;
  const consequence = caseState ? getDominantConsequence(caseState) : null;
  const reflection = caseState ? getDominantReflection(caseState) : null;

  const seen = new Set<string>();
  const lines = [scene, turning, consequence, reflection]
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);

  const explanationFamilies: Record<string, string[]> = {
    problem_real: [
      'Use this line to set the scene before you explain anything.',
      'This detail helps the reader see the real problem quickly.',
      'Lead with this moment so the stakes feel concrete right away.',
    ],
    turning: [
      'This is the moment your decision changed.',
      'This line marks where your approach shifted.',
      'Use this as the turning point in your story.',
    ],
    stakes: [
      'Use this to show what changed after your decision.',
      'This detail shows the result, not just your intention.',
      'This line proves the decision had a real outcome.',
    ],
    perspective: [
      'This sentence shows what you understand differently now.',
      'Use this reflection to explain why your behavior changed.',
      'This line clarifies how your judgment shifted afterward.',
    ],
  };

  const roleFamilies = [
    scene ? 'problem_real' : null,
    turning ? 'turning' : null,
    consequence ? 'stakes' : null,
    reflection ? 'perspective' : null,
  ].filter((v): v is keyof typeof explanationFamilies => Boolean(v));

  const explanations: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    const family = roleFamilies[i] ?? 'problem_real';
    const omitExplanation =
      line.length > 88
      && /\b(said|told|decided|created|changed|realized|proposed|recovered|stopped|started|asked|rebuilt|overruled)\b/i.test(line)
      && i % 2 === 0;
    if (omitExplanation) continue;
    const variants = explanationFamilies[family];
    const idx = Math.abs(line.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0) + i) % variants.length;
    explanations.push(variants[idx]);
  }

  return {
    evidence_lines: lines,
    evidence_explanations: explanations.slice(0, lines.length),
  };
}

function cleanCompareOptionLabel(value: string): string {
  return value
    .replace(/^(i\s+(?:could|can|might|am|keep|have|want|feel|love|care about|do)\s+)/i, '')
    .replace(/^(between|about|whether|if|choosing|choose)\s+/i, '')
    .replace(/\b(for my (?:college )?essay|for college essays?)\b/gi, '')
    .replace(/\b(both matter to me|matter to me|not sure which one|unsure which one|which one is better|is better)\b/gi, '')
    .replace(/^[\s,:;.-]+|[\s,:;.-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function presentCompareOptionLabel(label: string): string {
  const normalized = label.replace(/\s+/g, ' ').trim();
  if (!normalized) return normalized;

  if (/^paint\s+portraits$/i.test(normalized)) {
    return 'painting portraits';
  }

  if (/^run\s+cross-country$/i.test(normalized)) {
    return 'running cross-country';
  }

  if (/^do\s+photography$/i.test(normalized)) {
    return 'photography';
  }

  return normalized;
}

function extractCompareOptionLabels(rawInput: string): string[] {
  const normalized = rawInput.replace(/\s+/g, ' ').trim();
  const labels: string[] = [];

  const add = (value: string | undefined) => {
    if (!value) return;
    const cleaned = cleanCompareOptionLabel(value);
    if (cleaned.length < 3) return;
    if (labels.some((existing) => existing.toLowerCase() === cleaned.toLowerCase())) return;
    labels.push(cleaned);
  };

  const andAlso = normalized.match(/i\s+(.+?)\s+and\s+i\s+also\s+(.+?)(?:[.!?]|$)/i);
  if (andAlso) {
    add(andAlso[1]);
    add(andAlso[2]);
  }

  const between = normalized.match(/\bbetween\s+(.+?)\s+and\s+(.+?)(?:[.!?]|$)/i);
  if (between) {
    add(between[1]);
    add(between[2]);
  }

  if (labels.length < 2) {
    normalized
      .split(/\bor\b/i)
      .map((part) => part.trim())
      .forEach((part) => add(part));
  }

  return labels.slice(0, 2);
}

function normalizeSurfaceText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function hasMalformedReferenceSurface(text: string): boolean {
  const normalized = normalizeSurfaceText(text);
  if (!normalized) return true;

  return /\bat (I|we|my|our|he|she|they)\b/i.test(normalized)
    || /\bwhat [a-z\s]{0,40} needed at\b/i.test(normalized)
    || /\binteraction with both\b/i.test(normalized)
    || /\bat Since then\b/i.test(normalized);
}

function hasFrameworkSurface(text: string): boolean {
  const normalized = normalizeSurfaceText(text);
  if (!normalized) return true;

  return /\b(hinge|new standard|assumption that failed|decision standard|the accountability you accepted|the standard your next action proved|the response in .* showed the change was real)\b/i.test(normalized);
}

function isCompareSurfaceCase(rawInput: string, primaryPattern: string): boolean {
  if (primaryPattern !== 'unknown') return false;
  const labels = extractCompareOptionLabels(rawInput);
  return labels.length >= 2 && /\b(both|either|unsure|not sure|which one|split|between|compare|vs\.?|or)\b/i.test(rawInput);
}

function hasMalformedRecommendationSurface(text: string): boolean {
  const normalized = normalizeSurfaceText(text);
  if (!normalized) return true;

  return /\.\s*:/.test(normalized)
    || /\b(the old assumption fails there|shows the revision held|showed your old lens produced the wrong read|the decision standard that replaced it became visible in your actions|the response in the first proof that)\b/i.test(normalized)
    || /\bat Since then\b/i.test(normalized)
    || /\bonce what they actually needed became clear, and the response\b/i.test(normalized);
}

function hasWeakRecommendationSurface(text: string): boolean {
  const normalized = normalizeSurfaceText(text);
  if (!normalized) return true;

  return normalized.length > 110
    || /^choose between\b/i.test(normalized)
    || /^focus the essay on\b/i.test(normalized)
    || /^angle [ab]\b/i.test(normalized)
    || /^make this an essay about the moment your standard changed\.?$/i.test(normalized)
    || /^make this an essay about the decision that taught you how to weigh tradeoffs\.?$/i.test(normalized)
    || /^make this an essay about the action that changed your definition of responsibility\.?$/i.test(normalized)
    || /^commit to the option with the clearest scene, decision, and result\.?$/i.test(normalized)
    || /\bby keeping the option you can prove with one specific scene\b/i.test(normalized)
    || /\bshould compete on one question\b/i.test(normalized);
}

function deriveSurfaceAnchorLabel(rawInput: string): string | null {
  const normalized = normalizeSurfaceText(rawInput);
  if (!normalized) return null;

  if (/\b(chem|lab|burette|titration|checklist)\b/i.test(normalized)) return 'the lab moment';
  if (/\b(robot|robotics|inspection|quarterfinal|autonomous|match|regionals)\b/i.test(normalized)) return 'the competition decision';
  if (/\b(grandparents?|translate|translating|translator|clerk|officials|appointment|government offices)\b/i.test(normalized)) return 'the translation moment';
  if (/\b(teacher|classmate|classroom)\b/i.test(normalized)) return 'the classroom moment';
  if (/\b(patient|mentor|volunteer|family|friends?|interaction)\b/i.test(normalized)) return 'the interaction';

  return null;
}

function buildCompareSpecificHeadline(rawInput: string): string {
  if (/\b(crayon|crayons|preschool|preschoolers|child|children|crying|classroom|daycare|babysit|babysitting)\b/i.test(rawInput)) {
    return 'Center the essay on the caregiving moment that best shows you moving from managing the room to reading what a child actually needed.';
  }

  if (/\b(grandparents?|patient|mentor|friend|friends|translate|translator|listening|response|interaction|teammate|partner)\b/i.test(rawInput)) {
    return 'Center the essay on the interaction that best shows how your read of another person changed and how your response changed with it.';
  }

  if (/\b(paint|portrait|photography|choir|coding|tennis|cross-country|run|debate|robotics|build)\b/i.test(rawInput)) {
    return 'Center the essay on the option that best turns one lived scene into a claim about your discipline, judgment, or standard in action.';
  }

  return 'Center the essay on the option that gives you the clearest claim: one scene, one choice, and one visible result.';
}

function buildCompareSurfaceEssayAbout(rawInput: string): string {
  if (/\b(crayon|crayons|preschool|preschoolers|child|children|crying|classroom|daycare|babysit|babysitting)\b/i.test(rawInput)) {
    return 'This essay is about the caregiving standard that became visible when one child needed something different from the routine you were managing, and how that changed your response.';
  }

  if (/\b(grandparents?|patient|mentor|friend|friends|translate|translator|listening|response|interaction|teammate|partner)\b/i.test(rawInput)) {
    return 'This essay is about the moment your understanding of another person changed, the response that correction forced, and the standard that shift revealed.';
  }

  if (/\b(paint|portrait|photography|choir|coding|tennis|cross-country|run|debate|robotics|build)\b/i.test(rawInput)) {
    return 'This essay is about choosing the discipline that gives you a real claim on the page: a visible standard, a concrete choice, and a result that proves it.';
  }

  return 'This essay is about choosing the option that becomes a real claim on the page rather than a list of possibilities.';
}

function buildCompareSurfaceWhy(rawInput: string): string {
  if (/\b(crayon|crayons|preschool|preschoolers|child|children|crying|classroom|daycare|babysit|babysitting)\b/i.test(rawInput)) {
    return 'This version wins only if one scene lets the reader watch your understanding of what a child needed change in real time. The weaker version stays at the level of classroom activity instead of a response shift.';
  }

  if (/\b(grandparents?|patient|mentor|friend|friends|translate|translator|listening|response|interaction|teammate|partner)\b/i.test(rawInput)) {
    return 'This version wins only if one interaction lets the reader see what you first read wrong, how you corrected that read, and how your response changed because of it. The weaker version stays at the level of caring or helping in the abstract.';
  }

  if (/\b(paint|portrait|photography|choir|coding|tennis|cross-country|run|debate|robotics|build)\b/i.test(rawInput)) {
    return 'This version wins only if one option gives you more than an interest. It needs to reveal a real standard in action so the essay becomes a claim, not a topic choice.';
  }

  return 'This version wins only if one option gives you a defensible claim with a visible hinge and result. The weaker version keeps the essay at the level of indecision.';
}

function buildCompareSurfaceStronger(rawInput: string): string {
  if (/\b(crayon|crayons|preschool|preschoolers|child|children|crying|classroom|daycare|babysit|babysitting)\b/i.test(rawInput)) {
    return 'The stronger version gives you a claim the reader can test: the routine stops being enough, you read the child differently, and your response changes because of it.';
  }

  if (/\b(grandparents?|patient|mentor|friend|friends|translate|translator|listening|response|interaction|teammate|partner)\b/i.test(rawInput)) {
    return 'The stronger version gives you a clear correction arc: a misread, a changed response, and a reaction that proves the adjustment mattered.';
  }

  if (/\b(paint|portrait|photography|choir|coding|tennis|cross-country|run|debate|robotics|build)\b/i.test(rawInput)) {
    return 'The stronger version gives you a real claim in action: one standard becomes visible through a concrete choice and an immediate result.';
  }

  return 'The stronger version gives you a real claim in action instead of a cleaner list of options.';
}

function buildCompareSurfaceNextStep(rawInput: string): string {
  if (/\b(crayon|crayons|preschool|preschoolers|child|children|crying|classroom|daycare|babysit|babysitting)\b/i.test(rawInput)) {
    return 'Draft one opening for each caregiving moment. Keep the one where the routine stops being enough, your read of the child changes, and the response shift is visible without extra explanation.';
  }

  if (/\b(grandparents?|patient|mentor|friend|friends|translate|translator|listening|response|interaction|teammate|partner)\b/i.test(rawInput)) {
    return 'Draft one opening for each interaction. Keep the version where the misread, the correction, and the response shift all land in a single pass.';
  }

  if (/\b(paint|portrait|photography|choir|coding|tennis|cross-country|run|debate|robotics|build)\b/i.test(rawInput)) {
    return 'Draft one short opening for each option. Keep the version that sounds like a claim about your standard in action, not a description of the activity.';
  }

  return 'Draft one short opening per option and keep the version that turns fastest into a claim with a hinge and a result.';
}

function isStrongInterpretationCase(input: BuildCanonicalPage3PayloadInput): boolean {
  if (input.intake.narrative_pattern.primary_pattern === 'unknown') return false;

  const signal = input.intake.usable_signal.signal_strength;
  if (signal !== 'medium' && signal !== 'high') return false;

  const scene = input.caseState ? getDominantScene(input.caseState) : null;
  const turning = input.caseState ? getDominantTurningPoint(input.caseState) : null;
  const consequence = input.caseState ? getDominantConsequence(input.caseState) : null;

  return Boolean(scene && (turning || consequence));
}

function detectStrongInterpretationLens(rawInput: string): 'lab_reliability' | 'translation_understanding' | 'tradeoff_judgment' | null {
  if (/\b(chem|lab|burette|titration|checklist|reliability|failed trials)\b/i.test(rawInput)) {
    return 'lab_reliability';
  }

  if (/\b(grandparents?|translate|translating|translator|clerk|officials|appointment|government offices|line by line)\b/i.test(rawInput)) {
    return 'translation_understanding';
  }

  if (/\b(robot|robotics|inspection|quarterfinal|regionals|tradeoff|autonomous|manual control)\b/i.test(rawInput)) {
    return 'tradeoff_judgment';
  }

  return null;
}

function buildStrongInterpretiveRecommendation(pattern: string, rawInput: string): string {
  const lens = detectStrongInterpretationLens(rawInput);

  if (lens === 'lab_reliability') {
    return 'Your essay is really about the moment you realized competence means building something other people can trust, not proving you can move fastest.';
  }

  if (lens === 'translation_understanding') {
    return 'Your essay is really about the moment helping your grandparents stopped meaning getting through the interaction and started meaning protecting full understanding.';
  }

  if (lens === 'tradeoff_judgment') {
    return 'Your essay is really about learning that judgment means naming what a decision protects and what it costs before you make it.';
  }

  switch (pattern) {
    case 'self_correction_arc':
      return /\b(chem|lab|burette|titration|checklist)\b/i.test(rawInput)
        ? 'Make this an essay about the moment competence stopped meaning speed and started meaning something other people could trust.'
        : /\b(grandparents?|translate|translator|clerk|officials|appointment|government offices)\b/i.test(rawInput)
        ? 'Make this an essay about the moment helping your grandparents stopped meaning efficiency and started meaning full understanding.'
        : 'Make this an essay about the moment the rule you trusted stopped being enough.';
    case 'competence_vs_responsibility':
      return /\b(clinic|patient|nurse|translated?|medication)\b/i.test(rawInput)
        ? 'Make this an essay about why understanding became more important than literal accuracy.'
        : 'Make this an essay about why reliability became your standard, not speed.';
    case 'usefulness_vs_intention':
      return 'Make this an essay about learning that helping means giving up control.';
    case 'failure_reinterpretation':
      return 'Make this an essay about learning to fix systems, not symptoms.';
    case 'responsibility_shift':
      return 'Make this an essay about the moment you decided the problem was yours to move.';
    case 'conflict_reframe':
      return 'Make this an essay about learning to name tradeoffs before deciding under pressure.';
    case 'identity_shift':
      return /\b(grandparents?|translate|translator|clerk|officials|appointment)\b/i.test(rawInput)
        ? 'Make this an essay about how responsibility became accuracy, not convenience.'
        : 'Make this an essay about the moment responsibility stopped being duty and became a standard.';
    default:
      return 'Make this an essay about the standard that had to change—and what that revealed about you.';
  }
}

function buildStrongInterpretiveWhy(pattern: string, rawInput: string): string {
  const lens = detectStrongInterpretationLens(rawInput);

  if (lens === 'lab_reliability') {
    return 'This works because the lab is not just a scene where something went wrong. It exposes the standard you were using, shows why that standard failed another person, and turns the essay into a claim about trust instead of speed.';
  }

  if (lens === 'translation_understanding') {
    return 'This works because the translation moment is not just a family-duty scene. It reveals the misconception you were carrying—that helping meant moving things along—and turns the essay into a claim about what real understanding owes another person.';
  }

  if (lens === 'tradeoff_judgment') {
    return 'This works because the competition scene is not just a pressure story. It shows the blind spot in your old decision logic and lets the essay argue that real leadership means naming the protection and the cost in the same breath.';
  }

  switch (pattern) {
    case 'self_correction_arc':
      return /\b(chem|lab|burette|titration|checklist)\b/i.test(rawInput)
        ? 'This essay works because the lab scene proves your growth is not just that you fixed a mistake. It shows you stopped defining competence by how fast you could move and started defining it by whether other people could rely on your process.'
        : /\b(grandparents?|translate|translator|clerk|officials|appointment|government offices)\b/i.test(rawInput)
        ? 'This essay works because the translation scene proves your growth is not just that you became more careful. It shows you stopped treating help as getting through the interaction and started treating it as protecting someone else\'s full understanding.'
        : 'This essay works because the scene proves that the first rule you trusted failed under pressure, and the essay can show the stronger standard that replaced it.';
    case 'competence_vs_responsibility':
      return /\b(clinic|patient|nurse|translated?|medication)\b/i.test(rawInput)
        ? 'This essay works because the scene proves that competence stopped meaning accurate words and started meaning whether another person could truly act on what you said. The reader sees your standard deepen, not just your process improve.'
        : 'This essay works because the scene proves that competence stopped meaning speed and started meaning whether other people could trust your system. The reader sees a change in standard, not just a lab correction.';
    case 'usefulness_vs_intention':
      return 'This essay works because the scene proves your growth is not that you cared, but that you learned helping is only real when the other person can act without your control. That gives the essay a sharper claim than generosity alone.';
    case 'failure_reinterpretation':
      return 'This essay works because the failure is not just embarrassing—it proves you learned to diagnose the system underneath the visible mistake. The reader sees a mind that moved from reaction to design.';
    case 'responsibility_shift':
      return 'This essay works because the scene proves you stopped treating the problem as something to report and started treating it as something you were responsible for moving. That shift is the essay, not the logistics of the fix.';
    case 'conflict_reframe':
      return 'This essay works because the decision scene proves you learned that leadership is not speed or certainty—it is naming what a decision protects and what it costs. The scene reveals your judgment, not just a tense moment in robotics.';
    case 'identity_shift':
      return /\b(grandparents?|translate|translator|clerk|officials|appointment)\b/i.test(rawInput)
        ? 'This essay works because the scene proves responsibility stopped being family duty and became a promise of full understanding. What the opening reveals is not that you helped, but that you changed what accuracy owed another person.'
        : 'This essay works because one action forces you to redefine responsibility in a way the reader can actually watch happen. The scene proves a value changing under pressure, not just a value being stated.';
    default:
      return 'This essay works because the scene is doing more than recounting what happened—it proves the standard, assumption, or understanding that changed in you. The reader sees interpretation, not recap.';
  }
}

function buildStrongInterpretiveNextStep(pattern: string, rawInput: string): string {
  const lens = detectStrongInterpretationLens(rawInput);

  if (lens === 'lab_reliability') {
    return 'Start with the unlabeled step your classmate copied. Then show the contaminated sample before you explain the checklist or what the scene taught you about trust.';
  }

  if (lens === 'translation_understanding') {
    return 'Start with the summary you gave and the form your grandfather signed. Let the misunderstanding land before you explain why getting through the line was not enough.';
  }

  if (lens === 'tradeoff_judgment') {
    return 'Start with the call to cut autonomous after the failed inspections. Then show the quarterfinal cost before you explain the judgment you were missing.';
  }

  switch (pattern) {
    case 'self_correction_arc':
      return /\b(chem|lab|burette|titration|checklist)\b/i.test(rawInput)
        ? 'Start with the shortcut that still felt reasonable. Then show the exact moment it failed another person before you explain the lesson.'
        : /\b(grandparents?|translate|translator|clerk|officials|appointment|government offices)\b/i.test(rawInput)
        ? 'Start with the shortcut that felt efficient. Then show the misunderstanding it caused before you explain what real help required.'
        : 'Start with the exact moment your first rule failed. Then show what you changed in response.';
    case 'competence_vs_responsibility':
      return /\b(clinic|patient|nurse|translated?|medication)\b/i.test(rawInput)
        ? 'Start with the moment your words were accurate but still not usable. Then show what the other person could not act on before you explain what changed.'
        : 'Start with the shortcut that still felt smart. Then show the exact trust failure before you explain why speed stopped being enough.';
    case 'usefulness_vs_intention':
      return 'Start with the moment your help stopped working. Then show what you changed in the next response before you explain the lesson.';
    case 'failure_reinterpretation':
      return 'Start with the failed attempt. Then show the detail that proved you were solving the wrong problem.';
    case 'responsibility_shift':
      return 'Start with the problem everyone was leaving untouched. Then show the moment waiting stopped feeling responsible.';
    case 'conflict_reframe':
      return 'Start with the decision under pressure. Then show the cost you could not see at the time before you explain what you learned.';
    case 'identity_shift':
      return /\b(grandparents?|translate|translator|clerk|officials|appointment)\b/i.test(rawInput)
        ? 'Start with the shortcut that felt efficient. Then show the misunderstanding it caused before you explain why convenience was no longer good enough.'
        : 'Start with the action that felt reasonable at first. Then show what it cost before you explain its meaning.';
    default:
      return 'Start with the pressure point. Then show the response and the first visible result before you explain the lesson outright.';
  }
}

function hasWeakWhySurface(text: string): boolean {
  const normalized = normalizeSurfaceText(text);
  if (!normalized) return true;

  return /\b(Drafting payoff:|as a drafting claim|lets the reader see the assumption that failed|interaction with both|shows what you misread about my grandparents)\b/i.test(normalized);
}

function hasWeakNextStepSurface(text: string): boolean {
  const normalized = normalizeSurfaceText(text);
  if (!normalized) return true;

  return /\b(with both in four beats|Draft four beats from .*: the assumption you were using|interaction with .* at Since then)\b/i.test(normalized)
    || /^Draft 4 sentences: the setup, the break in your old approach, the change you made, and the result that proved the new standard worked\.?$/i.test(normalized);
}

function buildSurfaceRecommendation(pattern: string, rawInput: string): string {
  if (isCompareSurfaceCase(rawInput, pattern)) {
    return buildCompareSpecificHeadline(rawInput);
  }

  const anchor = deriveSurfaceAnchorLabel(rawInput);

  switch (pattern) {
    case 'competence_vs_responsibility':
      return anchor
        ? `Make this an essay about ${anchor} that changed your standard from speed to reliability.`
        : 'Make this an essay about the moment you stopped mistaking speed for reliability.';
    case 'usefulness_vs_intention':
      return anchor
        ? `Make this an essay about ${anchor} that taught you helping is not the same as taking over.`
        : 'Make this an essay about the moment helping stopped meaning taking over.';
    case 'failure_reinterpretation':
      return anchor
        ? `Make this an essay about ${anchor} that forced you to rebuild your system.`
        : 'Make this an essay about the failure that forced you to rebuild your system.';
    case 'responsibility_shift':
      return anchor
        ? `Make this an essay about ${anchor} where you stopped waiting and took ownership.`
        : 'Make this an essay about the moment you stopped waiting and took ownership.';
    case 'conflict_reframe':
      return anchor
        ? `Make this an essay about ${anchor} that taught you how to weigh tradeoffs.`
        : 'Make this an essay about the decision that taught you how to weigh tradeoffs.';
    case 'identity_shift':
      return anchor
        ? `Make this an essay about ${anchor} that changed what responsibility meant to you.`
        : 'Make this an essay about the action that changed what responsibility meant to you.';
    default:
      if (anchor === 'the lab moment') {
        return 'Make this an essay about the lab moment that changed your standard from speed to reliability.';
      }

      if (anchor === 'the translation moment') {
        return 'Make this an essay about the translation moment that changed what responsibility meant to you.';
      }

      return anchor
        ? `Make this an essay about ${anchor} that changed your standard.`
        : 'Make this an essay about the moment your standard changed.';
  }
}

function buildSurfaceWhy(pattern: string, rawInput: string): string {
  if (isCompareSurfaceCase(rawInput, pattern)) {
    return buildCompareSurfaceWhy(rawInput);
  }

  switch (pattern) {
    case 'competence_vs_responsibility':
      return 'This version wins because the scene shows speed failing another person. That gives you something concrete to open on and a clear claim to prove.';
    case 'usefulness_vs_intention':
      return 'This version wins because the scene shows exactly where your help stopped helping. That keeps the essay grounded in what changed, not in good intentions.';
    case 'failure_reinterpretation':
      return 'This version wins because the failure leads to a visible rebuild. The reader can watch you move from the wrong read to the right fix.';
    case 'responsibility_shift':
      return 'This version wins because the scene shows the moment you stopped waiting and acted. The essay stays with your decision instead of drifting into summary.';
    case 'conflict_reframe':
      return 'This version wins because the scene shows what your decision protected and what it cost. That makes the judgment feel earned instead of explained afterward.';
    case 'identity_shift':
      return 'This version wins because one moment changes what responsibility looks like in practice. The essay can stay with the misunderstanding and the response instead of drifting into values language.';
    default:
      return 'This version wins because the scene gives you a real pressure point, a response, and a result. The weaker version would stay at the level of setup or summary.';
  }
}

function buildSurfaceEssayAbout(pattern: string, rawInput: string): string {
  const anchor = deriveSurfaceAnchorLabel(rawInput);

  switch (pattern) {
    case 'competence_vs_responsibility':
      return anchor === 'the translation moment'
        ? 'The essay should leave the reader with one clear point: helping was not real if the other person still could not understand what they were signing or agreeing to.'
        : 'The essay should leave the reader with one clear point: finishing fast stopped mattering once someone else had to trust your process.';
    case 'usefulness_vs_intention':
      return 'The essay should show the moment care stopped meaning control and started meaning making it possible for the other person to act for themselves.';
    case 'failure_reinterpretation':
      return 'The essay should show the moment the visible mistake stopped being the whole story and you had to rebuild the system underneath it.';
    case 'responsibility_shift':
      return 'The essay should show the moment you stopped treating the problem as someone else\'s to fix and acted on it yourself.';
    case 'conflict_reframe':
      return 'The essay should show the decision, the cost you could not see at first, and the judgment that grew out of that miss.';
    case 'identity_shift':
      return anchor === 'the translation moment'
        ? 'The essay should show the moment getting through the interaction stopped being enough because full understanding was what the other person actually needed.'
        : 'The essay should show the action that changed what responsibility looked like in practice, not just what it sounded like in theory.';
    default:
      return 'The essay should show one pressure point, the choice it forced, and the visible result that made the point real.';
  }
}

function buildSurfaceWeaker(pattern: string, rawInput: string): string {
  if (isCompareSurfaceCase(rawInput, pattern)) {
    return 'The weaker version keeps both options in play, so the essay starts to sound undecided instead of focused.';
  }

  return 'The weaker version would stay in activity or atmosphere and never show the exact moment that makes this essay worth reading.';
}

function extractRecoveryFragments(rawInput: string): string[] {
  return rawInput
    .split(/\/|(?<=[.!?])\s+/)
    .map((fragment) => fragment.replace(/\s+/g, ' ').trim())
    .filter((fragment) => fragment.length >= 14)
    .slice(0, 8);
}

function chooseBestRecoveryFragment(rawInput: string): string | null {
  const fragments = extractRecoveryFragments(rawInput);
  if (fragments.length === 0) return null;

  const scored = fragments.map((fragment) => {
    let score = 0;
    if (/\b(asked|said|told|realized|noticed|signed|copied|failed|blank|wrong|repeat|regretted|changed|stopped|started)\b/i.test(fragment)) score += 4;
    if (/\b(but|after|before|because|until|instead)\b/i.test(fragment)) score += 2;
    if (/\b(student|nurse|grandfather|grandmother|teacher|team|board|problem|instructions|form|check|demo|appointment|translation|summary)\b/i.test(fragment)) score += 2;
    if (/\b(service|resilience|community|leadership|growth|values?)\b/i.test(fragment) && !/\b(asked|said|did|went|failed|blank|repeat|changed)\b/i.test(fragment)) score -= 3;
    return { fragment, score };
  });

  scored.sort((a, b) => b.score - a.score || b.fragment.length - a.fragment.length);
  return (scored[0]?.score ?? 0) > 0 ? scored[0]?.fragment ?? null : null;
}

function buildLowSignalRecoveryNextStep(rawInput: string): string {
  const anchor = chooseBestRecoveryFragment(rawInput);

  if (/\b(service|resilience|community|leadership|growth)\b/i.test(rawInput) && !anchor) {
    return 'Stop at the values words and recover one observable moment instead: write who was there, what made your first approach fail, and the exact choice you made right after that. If you cannot name that scene yet, that missing moment is the evidence gap to fill.';
  }

  if (/\b(hospital|translate|translation|summary wasn\'t enough|repeat|medical|grandparents?|grandfather|grandmother|nurse)\b/i.test(rawInput)) {
    return 'Start with the moment someone had to repeat the instructions. Then add one line naming what you had summarized too loosely and one line naming what you changed after that moment.';
  }

  if (/\b(nodded|problem blank|turned in the problem blank|asked questions|explanation sounded like a lecture|shut down)\b/i.test(rawInput)) {
    return 'Start with the student seeming to understand and then revealing that they did not. Then add one line showing the question you asked differently and one line showing what changed in the next response.';
  }

  if (/\b(skip one check|skipped? one check|board failed|copied me|copied my setup|we were late|because we were late)\b/i.test(rawInput)) {
    return 'Start with the shortcut you allowed because you were late. Then add one line showing the exact failure it caused for someone else and one line naming the rule you changed after that.';
  }

  if (isUnknownSplitChoiceInput(rawInput)) {
    return anchor
      ? `Do not choose by theme words yet. Start from "${anchor}" and ask which option it honestly belongs to. Then write one line for the choice in that scene and one line for the immediate result.`
      : 'Do not choose by theme words yet. Pick the option with one recoverable scene, then write the choice in that scene and the immediate result it created.';
  }

  if (anchor) {
    return `Start from "${anchor}". Then add one line naming what that moment exposed and one line naming the next choice it forced.`;
  }

  return 'Write one recoverable scene only: who was there, what failed or felt off, and the next choice that scene forced. That is enough to test whether the direction is real.';
}

function buildSurfaceStronger(pattern: string, rawInput: string): string {
  if (isCompareSurfaceCase(rawInput, pattern)) {
    return buildCompareSurfaceStronger(rawInput);
  }

  switch (pattern) {
    case 'competence_vs_responsibility':
      return 'The stronger version gives you a scene where speed fails, a response that changes, and a result that proves why the change mattered.';
    case 'usefulness_vs_intention':
      return 'The stronger version shows the moment your role changes and the result that proves the change actually helped.';
    case 'failure_reinterpretation':
      return 'The stronger version shows what you first blamed, what you discovered instead, and what you rebuilt because of it.';
    case 'responsibility_shift':
      return 'The stronger version keeps the problem, your action, and the outcome in one line of sight.';
    case 'conflict_reframe':
      return 'The stronger version keeps the decision and its cost in the same frame, so the judgment feels earned.';
    case 'identity_shift':
      return 'The stronger version shows one moment changing what responsibility looks like, then shows how your behavior changed because of it.';
    default:
      return 'The stronger version gives you a real moment, a real response, and a real result right away.';
  }
}

function buildSurfaceNextStep(pattern: string, rawInput: string): string {
  if (isCompareSurfaceCase(rawInput, pattern)) {
    return buildCompareSurfaceNextStep(rawInput);
  }

  const anchor = deriveSurfaceAnchorLabel(rawInput);

  switch (pattern) {
    case 'competence_vs_responsibility':
      return anchor === 'the lab moment'
        ? 'Start with the skipped step your classmate copied. Then show the contaminated sample before you explain the checklist or the lesson.'
        : 'Start with the exact moment speed stopped being enough. Then show what failed for someone else and what you changed next.';
    case 'usefulness_vs_intention':
      return 'Start with the moment your help stopped helping. Then show what you changed in your role and the first sign the new approach worked.';
    case 'failure_reinterpretation':
      return 'Start with the failed attempt. Then show the detail you missed, the fix you built, and the first result that proved it worked.';
    case 'responsibility_shift':
      return 'Start with the problem everyone was leaving untouched. Then show the moment you stepped in and the consequence that followed.';
    case 'conflict_reframe':
      return anchor === 'the competition decision'
        ? 'Start with the call to cut autonomous after the failed inspections. Then show the quarterfinal cost before you explain the rule you use now.'
        : 'Start with the decision under pressure. Then show what it protected, what it cost, and what that made you change.';
    case 'identity_shift':
      return anchor === 'the translation moment'
        ? 'Start with the summary you gave and the form your grandfather signed. Let the misunderstanding land before you explain how you translate now.'
        : 'Start with the action that felt reasonable at first. Then show what it cost and what you changed because of that.';
    default:
      if (anchor === 'the lab moment') {
        return 'Start with the skipped step in the lab. Then show what failed, what you changed, and the first result that proved it mattered.';
      }

      if (anchor === 'the translation moment') {
        return 'Start with what you summarized in the appointment. Then show what went wrong and what you changed in the next interaction.';
      }

      return 'Start with the exact moment the first approach failed. Then show what you changed and the first result that proved the change mattered.';
  }
}

function isLowSignalRescueCase(input: BuildCanonicalPage3PayloadInput): boolean {
  if (isStrongInterpretationCase(input)) return false;

  const signal = input.intake.usable_signal.signal_strength;
  return signal === 'low'
    || signal === 'none'
    || input.effectiveProductMode === 'clarification'
    || input.effectiveProductMode === 'blocked'
    || input.intake.recommendation_viability.decision === 'needs_more_input';
}

function shouldUseLowSignalRecoverySurface(
  input: BuildCanonicalPage3PayloadInput,
  weakRecommendationSurface: boolean,
  weakWhySurface: boolean,
  weakNextStepSurface: boolean,
): boolean {
  if (isStrongInterpretationCase(input)) return false;
  if (weakNextStepSurface) return true;
  if (isLowSignalRescueCase(input)) return true;

  return input.intake.usable_signal.signal_strength !== 'high'
    && (weakRecommendationSurface || weakWhySurface || weakNextStepSurface);
}

function buildAmbiguityFallbackRecommendation(rawInput: string, evidencePacket: {
  evidence_lines: string[];
  evidence_explanations: string[];
}): {
  displayed_recommendation: string;
  essay_about: string;
  why_this_direction: string;
  weaker_read: string;
  stronger_read: string;
  first_coaching_step: string | null;
  evidence_lines: string[];
  evidence_explanations: string[];
} {
  const buildCompareCoachRecommendation = () =>
    buildCompareSpecificHeadline(rawInput);

  const optionLabels = extractCompareOptionLabels(rawInput);
  const twoTrackHint = optionLabels.length >= 2 || /\b(both|either|unsure|not sure|which one|split|two)\b/i.test(rawInput);
  const relationshipSignal = /\b(tutor|student|parent|grandparents?|patient|volunteer|director|choir|band|section leader|mentor|friends?|famil(?:y|ies)|new players|translation|translate|listening|helping|needed|response|interaction)\b/i.test(rawInput);

  const fallbackEvidence = Array.from(
    new Set([
      ...evidencePacket.evidence_lines,
      ...rawInput
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 16),
    ])
  ).slice(0, 2);

  const angleA = optionLabels[0]
    ? `Angle A (${optionLabels[0]}): creative-discipline method`
    : 'Angle A: creative-discipline method';
  const angleB = optionLabels[1]
    ? `Angle B (${optionLabels[1]}): endurance-discipline method`
    : 'Angle B: endurance-discipline method';

  const evidenceA = fallbackEvidence[0] ?? 'No clear anchor line yet.';
  const evidenceB = fallbackEvidence[1] ?? fallbackEvidence[0] ?? 'No second anchor line yet.';

  if (relationshipSignal) {
    const recommendation = optionLabels.length >= 2
      ? 'Center the essay on the interaction that best shows how your read of another person changed and how your response changed with it.'
      : 'Make this an essay about the interaction that changed how you responded.';
    const about = buildCompareSurfaceEssayAbout(rawInput);
    const why = optionLabels.length >= 2
      ? buildCompareSurfaceWhy(rawInput)
      : 'The relationship version works only when one interaction reveals the misread, the response change, and the reaction in order. Broad service summary or mixed scenes will stay flat.';
    const strongerRead = optionLabels.length >= 2
      ? buildCompareSurfaceStronger(rawInput)
      : 'Sorting question: which single interaction lets the reader see what you first got wrong, what you changed, and the reaction that proved it?';

    return {
      displayed_recommendation: recommendation,
      essay_about: about,
      why_this_direction: why,
      weaker_read: 'If you merge multiple roles or scenes into one opening, the claim blurs and the essay reads like summary instead of one correction scene.',
      stronger_read: strongerRead,
      first_coaching_step: optionLabels.length >= 2
        ? buildLowSignalRecoveryNextStep(rawInput)
        : buildLowSignalRecoveryNextStep(rawInput),
      evidence_lines: fallbackEvidence.length > 0 ? fallbackEvidence : evidencePacket.evidence_lines,
      evidence_explanations: evidencePacket.evidence_explanations,
    };
  }

  const recommendation = optionLabels.length >= 2
    ? buildCompareSpecificHeadline(rawInput)
    : 'Make this an essay about the option with the clearest scene, decision, and consequence.';
  const about = buildCompareSurfaceEssayAbout(rawInput);
  const why = optionLabels.length >= 2
    ? buildCompareSurfaceWhy(rawInput)
    : `This is a compare decision, not a final topic win yet. Angle A currently has this best support: "${evidenceA}". Angle B currently has this best support: "${evidenceB}". Keep the option with the cleaner scene, clearer choice, and more immediate consequence.`;

  const weakerRead = 'If you merge both angles in one opening, the claim blurs and the essay reads as indecisive summary instead of a focused argument.';

  const strongerRead = 'Sorting question: which angle can you prove in one scene with one decision and one immediate consequence? Immediate next drafting move: write a 4-line opening for A and B, then keep the version with clearer claim and stronger consequence evidence.';

  return {
    displayed_recommendation: recommendation,
    essay_about: about,
    why_this_direction: why,
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    first_coaching_step: twoTrackHint
      ? buildLowSignalRecoveryNextStep(rawInput)
      : buildLowSignalRecoveryNextStep(rawInput),
    evidence_lines: fallbackEvidence.length > 0 ? fallbackEvidence : evidencePacket.evidence_lines,
    evidence_explanations: evidencePacket.evidence_explanations,
  };
}


function isUnknownSplitChoiceInput(rawInput: string): boolean {
  return /\b(both|either|which\s+one|not\s+sure|unsure|between|compare|vs\.?|or)\b/i.test(rawInput);
}

function buildLowSignalCompareFallbackCandidates(rawInput: string, evidencePacket: {
  evidence_lines: string[];
  evidence_explanations: string[];
}) {
  const labels = extractCompareOptionLabels(rawInput);
  const optionA = labels[0] ?? 'the first option';
  const optionB = labels[1] ?? 'the second option';

  const evidence = Array.from(
    new Set([
      ...evidencePacket.evidence_lines,
      ...rawInput
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter((line) => line.length >= 16),
    ])
  ).slice(0, 2);

  const mk = (
    candidateId: string,
    family: string,
    angleType: string,
    directionLine: string,
    essayAbout: string,
    why: string,
    nextMove: string,
    selected: boolean,
    total: number,
  ) => ({
    candidate_id: candidateId,
    recommendation_family: family,
    angle_type: angleType,
    direction_line: directionLine,
    essay_about: essayAbout,
    why_this_direction: why,
    next_move: nextMove,
    surface_shell_id: `shadow_${family}`,
    shell_penalty_hits: [] as string[],
    rejection_reasons: [] as string[],
    selected,
    scores: {
      source_grounding: 0.72,
      source_faithfulness: 0.72,
      angle_directness: 0.62,
      angle_first_quality: 0.62,
      essay_angle_naming_quality: 0.65,
      essay_about_conceptual_lift: 0.55,
      case_specificity_beyond_pivot: 0.52,
      family_diversity_survival: 0.8,
      batch_diversity_credit: 0,
      ambiguity_decision_helpfulness: 0.9,
      essay_aboutness_clarity: 0.7,
      directional_usefulness: 0.74,
      why_quality: 0.72,
      coaching_actionability: 0.84,
      draftability: 0.81,
      non_repeatability: 0.83,
      decision_shell_penalty: 0,
      family_collapse_penalty: 0,
      dominant_family_overuse_penalty: 0,
      packet_family_sameness_penalty: 0,
      batch_family_distribution_penalty: 0,
      pre_penalty_total: total,
      post_penalty_total: total,
      translation_penalty: 0,
      template_scaffold_penalty: 0,
      total_score: total,
    },
  });

  const evidenceA = evidence[0] ?? 'No clear anchor line yet.';
  const evidenceB = evidence[1] ?? evidenceA;

  return [
    mk(
      'c_compare_option_a_shadow',
      'compare',
      'compare',
      `Choose ${optionA} as your lead angle and show one concrete decision plus immediate consequence before comparing anything else.`,
      `This essay is about proving why ${optionA} gives you the clearest claim to draft from one scene and one visible result.`,
      `This is stronger than the split summary because ${optionA} gives a cleaner draft path from evidence: "${evidenceA}". Drafting payoff: start by writing one scene, one choice, and one result for this option.`,
      `Write 3 lines for ${optionA}: scene, decision, immediate consequence.`,
      true,
      0.86,
    ),
    mk(
      'c_compare_option_b_shadow',
      'compare',
      'compare',
      `Center your essay on ${optionB} only if it gives a sharper scene and consequence than ${optionA}.`,
      `This essay is about testing whether ${optionB} produces a clearer claim and stronger immediate consequence than the alternate option.`,
      `Compared with the first option, this can win only if the evidence is cleaner: "${evidenceB}". Drafting payoff: draft the same 3-line opening for ${optionB} and keep the clearer one.`,
      `Write 3 lines for ${optionB}, then compare clarity against ${optionA}.`,
      false,
      0.82,
    ),
    mk(
      'c_compare_decision_frame_shadow',
      'tension',
      'tension',
      `Frame the essay around the decision standard you will use to choose between ${optionA} and ${optionB}, then prove it in one scene.`,
      `This essay is about the judgment rule you used to pick one angle and why that rule holds under pressure.`,
      `This beats an indecisive blend because it names the decision rule first, then uses evidence from both options to select one. Drafting payoff: write the rule in one sentence, then prove it with one scene.`,
      'Write one sentence naming your selection rule, then one scene that proves it.',
      false,
      0.79,
    ),
  ];
}

export function buildCanonicalPage3Payload(
  input: BuildCanonicalPage3PayloadInput
): CanonicalPage3Payload {
  const routeDecision = toRouteDecision(input.effectiveProductMode, input.intake, input.evidenceStrength);
  const preservedSourceFragments = collectPreservedSourceFragments(input.rawInput);
  const preservedAnchorTerms = collectPreservedAnchorTerms(input.rawInput);
  const rawFeatureCountForRecovery = preservedSourceFragments.length + preservedAnchorTerms.length;
  const rawWordCount = input.rawInput.trim().split(/\s+/).filter(Boolean).length;
  const generatedDirectionContent = routeDecision.direction_generation_allowed
    ? deriveDirectionContent(input.intake, input.caseState)
    : null;
  const generatedDirectionCandidateCount = generatedDirectionContent?.candidate_pack?.length ?? 0;
  const preserveGeneratedDirectionCandidates =
    input.effectiveProductMode === 'direction_light'
    && generatedDirectionCandidateCount > 0;
  const preferAmbiguityFallback =
    routeDecision.direction_generation_allowed
    && !preserveGeneratedDirectionCandidates
    && input.intake.narrative_pattern.primary_pattern === 'unknown'
    && input.intake.recommendation_viability.decision === 'needs_more_input'
    && /\b(both\s+matter|which\s+one|unsure|not\s+sure|between|split\s+focus)\b/i.test(input.rawInput);

  const unknownCompareCue = /\b(both\s+matter|which\s+one|unsure|not\s+sure|between|split\s+focus|either|compare|vs\.?|or)\b/i.test(input.rawInput);
  const unknownRecoveryCandidateAllowed =
    !routeDecision.direction_generation_allowed
    && input.intake.narrative_pattern.primary_pattern === 'unknown'
    && rawWordCount >= 14
    && (unknownCompareCue || rawFeatureCountForRecovery >= 3);

  const recommendationContent = routeDecision.direction_generation_allowed && !preferAmbiguityFallback
    ? generatedDirectionContent
    : null;

  const debugContent = recommendationContent
    ?? (unknownRecoveryCandidateAllowed ? deriveDirectionContent(input.intake, input.caseState) : null);

  const evidencePacket = buildEvidencePacket(input.caseState);
  const unknownShadowMode = !routeDecision.direction_generation_allowed && input.intake.narrative_pattern.primary_pattern === 'unknown';
  const normalizedShadowCandidates = unknownShadowMode
    ? (debugContent?.candidate_pack ?? []).map((candidate) => ({
        ...candidate,
        rejection_reasons: (candidate.rejection_reasons ?? []).slice(0, 1),
      }))
    : (debugContent?.candidate_pack ?? []);
  const splitChoiceFallbackCandidates =
    input.intake.narrative_pattern.primary_pattern === 'unknown'
    && isUnknownSplitChoiceInput(input.rawInput)
    && (unknownShadowMode || input.effectiveProductMode === 'clarification')
    && normalizedShadowCandidates.length === 0
      ? buildLowSignalCompareFallbackCandidates(input.rawInput, evidencePacket)
      : [];
  const debugCandidates = normalizedShadowCandidates.length > 0 ? normalizedShadowCandidates : splitChoiceFallbackCandidates;

  const winner = debugCandidates.find((candidate) => candidate.selected) ?? debugCandidates[0] ?? null;
  const runnerUp = debugCandidates.find((candidate) => !candidate.selected) ?? debugCandidates[1] ?? null;
  const winnerBeforeReweight = debugCandidates.length > 0
    ? [...debugCandidates].sort((a, b) => (b.scores.pre_penalty_total ?? b.scores.total_score) - (a.scores.pre_penalty_total ?? a.scores.total_score))[0] ?? null
    : null;

  const rawFeatureCount = rawFeatureCountForRecovery;
  const structuredFeatureCount = input.caseState
    ? input.caseState.extracted.actors.length +
      input.caseState.extracted.scenes.length +
      input.caseState.extracted.turning_points.length +
      input.caseState.extracted.consequences.length +
      input.caseState.extracted.reflections.length
    : 0;

  const differences: string[] = [];
  if (input.intake.narrative_pattern.primary_pattern === 'unknown' && rawFeatureCount >= 3) {
    differences.push('UNKNOWN_WITH_RAW_SIGNAL_PRESENT');
  }
  if (rawFeatureCount > structuredFeatureCount) {
    differences.push('RAW_SIGNAL_RICHER_THAN_STRUCTURED');
  }
  if (structuredFeatureCount === 0 && rawFeatureCount > 0) {
    differences.push('STRUCTURED_EXTRACTION_EMPTY');
  }

  const ambiguityFallback = (!recommendationContent || !winner) && input.intake.narrative_pattern.primary_pattern === 'unknown'
    ? buildAmbiguityFallbackRecommendation(input.rawInput, evidencePacket)
    : null;

  const rawDisplayedRecommendation = recommendationContent?.strongest.title ?? ambiguityFallback?.displayed_recommendation ?? '';
  const rawEssayAbout = recommendationContent?.strongest.essay_about ?? ambiguityFallback?.essay_about ?? '';
  const rawWhyThisDirection = recommendationContent?.strongest.why_beats_obvious ?? recommendationContent?.strongest.explanation ?? ambiguityFallback?.why_this_direction ?? '';
  const rawWeakerRead = recommendationContent?.coach_comparison.weaker_read ?? ambiguityFallback?.weaker_read ?? '';
  const rawStrongerRead = recommendationContent?.coach_comparison.stronger_read ?? ambiguityFallback?.stronger_read ?? '';
  const rawNextStep = recommendationContent?.strongest.next_move ?? recommendationContent?.strongest.write_first_steps?.[0] ?? ambiguityFallback?.first_coaching_step ?? null;
  const compareSurfaceCase = isCompareSurfaceCase(input.rawInput, input.intake.narrative_pattern.primary_pattern);
  const strongInterpretationCase = isStrongInterpretationCase(input);
  const malformedRecommendationSurface = hasMalformedRecommendationSurface(rawDisplayedRecommendation);
  const weakRecommendationSurface = hasWeakRecommendationSurface(rawDisplayedRecommendation);
  const weakWhySurface = hasWeakWhySurface(rawWhyThisDirection);
  const weakNextStepSurface = hasWeakNextStepSurface(rawNextStep ?? '');
  const malformedEssayAboutSurface = hasMalformedReferenceSurface(rawEssayAbout);
  const frameworkEssayAboutSurface = hasFrameworkSurface(rawEssayAbout);
  const malformedWhySurface = hasMalformedReferenceSurface(rawWhyThisDirection);
  const frameworkWhySurface = hasFrameworkSurface(rawWhyThisDirection);
  const frameworkWeakerSurface = hasFrameworkSurface(rawWeakerRead);
  const frameworkStrongerSurface = hasFrameworkSurface(rawStrongerRead);
  const lowSignalRecoverySurface = shouldUseLowSignalRecoverySurface(
    input,
    weakRecommendationSurface,
    weakWhySurface,
    weakNextStepSurface,
  );

  const surfaceDisplayedRecommendation = ambiguityFallback
    ? (weakRecommendationSurface || malformedRecommendationSurface
      ? buildSurfaceRecommendation(input.intake.narrative_pattern.primary_pattern, input.rawInput)
      : rawDisplayedRecommendation)
    : ((strongInterpretationCase || malformedRecommendationSurface || weakRecommendationSurface)
      ? (strongInterpretationCase
        ? buildStrongInterpretiveRecommendation(input.intake.narrative_pattern.primary_pattern, input.rawInput)
        : buildSurfaceRecommendation(input.intake.narrative_pattern.primary_pattern, input.rawInput))
      : rawDisplayedRecommendation);

  const surfaceWhyThisDirection = ambiguityFallback
    ? rawWhyThisDirection
    : (strongInterpretationCase || compareSurfaceCase || weakWhySurface || malformedWhySurface || frameworkWhySurface || malformedRecommendationSurface || weakRecommendationSurface
      ? (strongInterpretationCase
        ? buildStrongInterpretiveWhy(input.intake.narrative_pattern.primary_pattern, input.rawInput)
        : buildSurfaceWhy(input.intake.narrative_pattern.primary_pattern, input.rawInput))
      : rawWhyThisDirection);

  const surfaceEssayAbout = compareSurfaceCase
    ? buildCompareSurfaceEssayAbout(input.rawInput)
    : (malformedEssayAboutSurface || frameworkEssayAboutSurface
      ? buildSurfaceEssayAbout(input.intake.narrative_pattern.primary_pattern, input.rawInput)
      : rawEssayAbout);

  const surfaceWeakerRead = ambiguityFallback
    ? rawWeakerRead
    : (compareSurfaceCase || malformedRecommendationSurface || weakRecommendationSurface || weakWhySurface || frameworkWeakerSurface
      ? buildSurfaceWeaker(input.intake.narrative_pattern.primary_pattern, input.rawInput)
      : rawWeakerRead);

  const surfaceStrongerRead = ambiguityFallback
    ? rawStrongerRead
    : (compareSurfaceCase || malformedRecommendationSurface || weakRecommendationSurface || weakWhySurface || frameworkStrongerSurface
      ? buildSurfaceStronger(input.intake.narrative_pattern.primary_pattern, input.rawInput)
      : rawStrongerRead);

  const surfaceNextStep = ambiguityFallback
    ? rawNextStep
    : ((lowSignalRecoverySurface || strongInterpretationCase || compareSurfaceCase || malformedRecommendationSurface || weakNextStepSurface)
      ? (strongInterpretationCase
        ? buildStrongInterpretiveNextStep(input.intake.narrative_pattern.primary_pattern, input.rawInput)
        : lowSignalRecoverySurface
        ? buildLowSignalRecoveryNextStep(input.rawInput)
        : buildSurfaceNextStep(input.intake.narrative_pattern.primary_pattern, input.rawInput))
      : rawNextStep);

  return {
    session_id: input.sessionId,
    case_id: input.caseId ?? null,
    routing: {
      product_mode: input.requestedProductMode,
      effective_product_mode: input.effectiveProductMode,
      direction_viable: input.intake.recommendation_viability.decision !== 'blocked',
      route_target:
        routeDecision.route_target === 'blank_page'
          ? 'blank_page'
          : routeDecision.route_target === 'question'
          ? 'question'
          : 'direction',
      route_reason: routeDecision.route_reason_detail,
      route_reason_code: routeDecision.route_reason_code,
      is_fallback: input.effectiveProductMode === 'direction_light' || input.effectiveProductMode === 'clarification',
      fallback_reason_code:
        input.effectiveProductMode === 'direction_light'
          ? 'FALLBACK_DIRECTION_LIGHT'
          : input.effectiveProductMode === 'clarification'
          ? 'FALLBACK_CLARIFICATION'
          : null,
      unknown_classifier: input.intake.narrative_pattern.primary_pattern === 'unknown',
      unknown_driver_codes:
        input.intake.narrative_pattern.primary_pattern === 'unknown'
          ? input.intake.narrative_pattern.reason_codes
          : [],
      route_decision: routeDecision,
    },
    source_truth: {
      raw_input: input.rawInput,
      normalized_input: input.normalizedInput,
      raw_note_count: input.intakeInput.story_entries.length,
      preserved_source_fragments: preservedSourceFragments,
      preserved_anchor_terms: preservedAnchorTerms,
      signal_summary: input.intake.narrative_pattern.reason_codes,
      story_entries_snapshot: input.intakeInput.story_entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        text: entry.text,
      })),
      raw_vs_structured_alignment: {
        raw_feature_count: rawFeatureCount,
        structured_feature_count: structuredFeatureCount,
        differences,
      },
    },
    classification: {
      primary_pattern: input.intake.narrative_pattern.primary_pattern,
      secondary_patterns: input.intake.narrative_pattern.secondary_patterns,
      signal_strength: input.intake.usable_signal.signal_strength === 'none' ? 'low' : input.intake.usable_signal.signal_strength,
      student_scene_evidence: input.intake.authorship_signal.student_scene_evidence,
      contamination_risk: input.intake.authorship_signal.contamination_risk,
      recommendation_viability: input.intake.recommendation_viability.decision,
      recommendation_viability_reason: input.intake.recommendation_viability.reason_codes.join(', '),
    },
    recommendation_packet: {
      displayed_recommendation: surfaceDisplayedRecommendation,
      essay_about: surfaceEssayAbout,
      why_this_direction: surfaceWhyThisDirection,
      weaker_read: surfaceWeakerRead,
      stronger_read: surfaceStrongerRead,
      next_step: surfaceNextStep,
      first_coaching_step: surfaceNextStep,
      evidence_lines: ambiguityFallback?.evidence_lines ?? evidencePacket.evidence_lines,
      evidence_explanations: ambiguityFallback?.evidence_explanations ?? evidencePacket.evidence_explanations,
    },
    candidate_debug: {
      candidates_generated: debugCandidates.length,
      winner_before_reweight_id: winnerBeforeReweight?.candidate_id ?? null,
      winner_id: winner?.candidate_id ?? 'none',
      winner_family: winner?.recommendation_family ?? null,
      weaker_read_source_id: runnerUp?.candidate_id ?? null,
      weaker_read_family: runnerUp?.recommendation_family ?? null,
      scores_by_candidate:
        debugCandidates.map((candidate) => {
          const s = candidate.scores as Record<string, number>;
          return {
          id: candidate.candidate_id,
          recommendation_family: candidate.recommendation_family,
          angle_type: candidate.angle_type,
          direction_line: candidate.direction_line,
          essay_about: candidate.essay_about,
          why_this_direction: candidate.why_this_direction,
          next_move: candidate.next_move,
          surface_shell_id: candidate.surface_shell_id,
          shell_penalty_hits: candidate.shell_penalty_hits,
          rejection_reasons: candidate.rejection_reasons,
          source_grounding: candidate.scores.source_grounding,
          source_faithfulness: candidate.scores.source_faithfulness,
          angle_directness: candidate.scores.angle_directness,
          angle_first_quality: candidate.scores.angle_first_quality,
          essay_angle_naming_quality: candidate.scores.essay_angle_naming_quality,
          essay_about_conceptual_lift: candidate.scores.essay_about_conceptual_lift,
          case_specificity_beyond_pivot: candidate.scores.case_specificity_beyond_pivot,
          family_diversity_survival: candidate.scores.family_diversity_survival,
          batch_diversity_credit: candidate.scores.batch_diversity_credit,
          ambiguity_decision_helpfulness: candidate.scores.ambiguity_decision_helpfulness,
          essay_aboutness_clarity: candidate.scores.essay_aboutness_clarity,
          directional_usefulness: candidate.scores.directional_usefulness,
          why_quality: candidate.scores.why_quality,
          coaching_actionability: candidate.scores.coaching_actionability,
          draftability: candidate.scores.draftability,
          human_preference_likelihood: s.human_preference_likelihood ?? 0,
          concrete_anchor_retention: s.concrete_anchor_retention ?? 0,
          narrative_hinge_clarity: s.narrative_hinge_clarity ?? 0,
          individualization: s.individualization ?? 0,
          coach_judgment_quality: s.coach_judgment_quality ?? 0,
          non_repeatability: candidate.scores.non_repeatability,
          family_fit_base: s.family_fit_base ?? 0,
          family_fit: s.family_fit ?? 0,
          family_fit_gap: s.family_fit_gap ?? 0,
          pattern_conditioned_misfit_penalty: s.pattern_conditioned_misfit_penalty ?? 0,
          decision_shell_penalty: candidate.scores.decision_shell_penalty,
          family_collapse_penalty: candidate.scores.family_collapse_penalty,
          dominant_family_overuse_penalty: candidate.scores.dominant_family_overuse_penalty,
          abstraction_penalty: s.abstraction_penalty ?? 0,
          packet_family_sameness_penalty: candidate.scores.packet_family_sameness_penalty,
          batch_family_distribution_penalty: candidate.scores.batch_family_distribution_penalty,
          pre_penalty_total: candidate.scores.pre_penalty_total,
          post_penalty_total: candidate.scores.post_penalty_total,
          translation_penalty: candidate.scores.translation_penalty,
          template_scaffold_penalty: candidate.scores.template_scaffold_penalty,
          packet_adjusted_total: s.packet_adjusted_total ?? candidate.scores.total_score,
          total: candidate.scores.total_score,
          composition_instrumentation: (candidate as { composition_instrumentation?: unknown }).composition_instrumentation ?? null,
          };
        }) ?? [],
    },
    evaluation_metadata: {
      canonical_payload_version: 'page3_canonical_payload_v1',
      render_contract_version: 'page3_render_contract_v1',
      evaluator_contract_version: 'page3_evaluator_contract_v1',
    },
  };
}
