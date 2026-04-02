const fs = require('fs');
const path = require('path');

function replaceStrict(content, from, to, label) {
  if (!content.includes(from)) {
    throw new Error(`Missing snippet for ${label}`);
  }
  return content.replace(from, to);
}

const directionPath = path.join(process.cwd(), 'src/lib/fm/direction.ts');
const canonicalPath = path.join(process.cwd(), 'src/lib/fm/canonicalPage3Payload.ts');

let direction = fs.readFileSync(directionPath, 'utf8');
let canonical = fs.readFileSync(canonicalPath, 'utf8');

direction = replaceStrict(
  direction,
  `function round(value: number): number {
  return Number(value.toFixed(3));
}

function buildRuntimeCandidates(`,
  `function round(value: number): number {
  return Number(value.toFixed(3));
}

const TAXONOMY_FORWARD_PATTERN = /\\b(relationship-based responsibility|ownership under contradiction|interpretation change|value-under-cost|angle|family|framework)\\b/i;

function hasPlainClaimSignal(text: string): boolean {
  const t = text.toLowerCase();
  const hasClaimVerb = /\\b(show|argue|prove|claim|center|focus|make your main claim|your essay should)\\b/i.test(t);
  const hasStudentMeaning = /\\b(essay|moment|decision|choice|result|standard|response|method|value)\\b/i.test(t);
  return hasClaimVerb && hasStudentMeaning;
}

function hasComparativeWhySignal(text: string): boolean {
  return /\\b(stronger|beats|rather than|instead of|compared|vs\\.?|easier to trust)\\b/i.test(text);
}

function hasDraftingPayoffSignal(text: string): boolean {
  return /\\b(drafting payoff|so you can draft|easier to draft|gives you a clear opening|clear opening|draft your opening|start by)\\b/i.test(text);
}

function hasConcreteNextStep(text: string): boolean {
  const action = /\\b(write|start|open|draft|list)\\b/i.test(text);
  const unit = /\\b(sentence|sentences|scene|lines?|detail|decision|result|consequence|opening)\\b/i.test(text);
  return action && unit;
}

function ensureComparativeWhy(why: string): string {
  let out = normalizeSentence(why);
  if (!hasComparativeWhySignal(out)) {
    out = `${out} This is stronger than a vague version because the claim stays explicit.`;
  }
  if (!hasDraftingPayoffSignal(out)) {
    out = `${out} Drafting payoff: you can open with the turning moment, then show decision and immediate result.`;
  }
  return normalizeSentence(out);
}

function ensureConcreteNextMove(nextMove: string): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  return `${normalized} Next step: write 3 lines — moment, decision, immediate result.`;
}

function buildRuntimeCandidates(`,
  'insert helper guardrails'
);

direction = replaceStrict(
  direction,
  `      why_this_direction: normalizeSentence(why_this_direction),
      essay_about: normalizeSentence(essay_about),
      next_move: normalizeSentence(next_move),`,
  `      why_this_direction: ensureComparativeWhy(why_this_direction),
      essay_about: normalizeSentence(essay_about),
      next_move: ensureConcreteNextMove(next_move),`,
  'recommend normalization wiring'
);

direction = replaceStrict(
  direction,
  `    const lowSpecificityRisk = uniqueAnchorCount < 2 || duplicateAnchorRatio > 0.34;

    const quotedFragments = Array.from(`,
  `    const lowSpecificityRisk = uniqueAnchorCount < 2 || duplicateAnchorRatio > 0.34;
    const taxonomyForwardRisk = TAXONOMY_FORWARD_PATTERN.test(`${candidate.direction_line} ${candidate.essay_about}`);
    const plainClaimSignal = hasPlainClaimSignal(candidate.direction_line);
    const comparativeWhySignal = hasComparativeWhySignal(candidate.why_this_direction);
    const draftingPayoffSignal = hasDraftingPayoffSignal(candidate.why_this_direction);
    const concreteNextStepSignal = hasConcreteNextStep(candidate.next_move);

    const quotedFragments = Array.from(`,
  'score signals injection'
);

direction = replaceStrict(
  direction,
  `    const aboutOverlap = jaccardOverlap(candidate.direction_line, candidate.essay_about);
    const essayAboutRedundancyPenalty = clampScore(`,
  `    const aboutOverlap = jaccardOverlap(candidate.direction_line, candidate.essay_about);
    const essayAboutAddsMeaningSignal = aboutOverlap < 0.58 || /\\b(because|so that|which means|what this reveals|why this matters)\\b/i.test(candidate.essay_about);
    const essayAboutRedundancyPenalty = clampScore(`,
  'essay_about meaning signal'
);

direction = replaceStrict(
  direction,
  `    const identifiabilityPenalty = clampScore((rhythmTellHits >= 3 ? 0.3 : 0.1) + (bannedComparePattern.test(text) ? 0.4 : 0));

    const prePenaltyTotal = round(`,
  `    const identifiabilityPenalty = clampScore((rhythmTellHits >= 3 ? 0.3 : 0.1) + (bannedComparePattern.test(text) ? 0.4 : 0));
    const humanVoiceClarity = clampScore(
      (plainClaimSignal ? 0.34 : 0.08)
      + (taxonomyForwardRisk ? 0 : 0.14)
      + (comparativeWhySignal ? 0.16 : 0)
      + (draftingPayoffSignal ? 0.16 : 0)
      + (concreteNextStepSignal ? 0.2 : 0)
      + (essayAboutAddsMeaningSignal ? 0.14 : 0)
    );
    const clarityHardFailPenalty = clampScore(
      (!plainClaimSignal && taxonomyForwardRisk ? 0.62 : 0)
      + (!comparativeWhySignal ? 0.36 : 0)
      + (!draftingPayoffSignal ? 0.28 : 0)
      + (!concreteNextStepSignal ? 0.62 : 0)
      + (!essayAboutAddsMeaningSignal ? 0.34 : 0)
    );

    const prePenaltyTotal = round(`,
  'human clarity score insertion'
);

direction = replaceStrict(
  direction,
  `      caseSpecificityBeyondPivot * 0.08 +
      familyDiversitySurvival * 0.04 +
      ambiguityDecisionHelpfulness * 0.02
    );`,
  `      caseSpecificityBeyondPivot * 0.08 +
      familyDiversitySurvival * 0.04 +
      ambiguityDecisionHelpfulness * 0.02 +
      humanVoiceClarity * 0.08
    );`,
  'pre penalty weighting'
);

direction = replaceStrict(
  direction,
  `      contradictionOverusePenalty * 0.16 -
      familyMismatchPenalty * 0.16 -
      patternConditionedMisfitPenalty * 0.34
    );`,
  `      contradictionOverusePenalty * 0.16 -
      familyMismatchPenalty * 0.16 -
      patternConditionedMisfitPenalty * 0.34 -
      clarityHardFailPenalty * 0.42
    );`,
  'post penalty weighting'
);

direction = replaceStrict(
  direction,
  `    if (essayAboutRedundancyPenalty > 0.25) rejectionReasons.push('essay_about_redundancy_penalty');
    if (familyCollapsePenalty > 0.2) rejectionReasons.push('family_collapse_penalty');`,
  `    if (essayAboutRedundancyPenalty > 0.25) rejectionReasons.push('essay_about_redundancy_penalty');
    if (!plainClaimSignal && taxonomyForwardRisk) rejectionReasons.push('plain_claim_clarity_fail');
    if (!comparativeWhySignal || !draftingPayoffSignal) rejectionReasons.push('why_coaching_clarity_fail');
    if (!concreteNextStepSignal) rejectionReasons.push('no_concrete_next_step');
    if (!essayAboutAddsMeaningSignal) rejectionReasons.push('essay_about_restate_fail');
    if (familyCollapsePenalty > 0.2) rejectionReasons.push('family_collapse_penalty');`,
  'hard fail rejection reasons'
);

direction = replaceStrict(
  direction,
  `  if (!needsDominanceCap) return diversityAdjusted;

  const winner = diversityAdjusted[0];`,
  `  const hardFailReasons = new Set([
    'plain_claim_clarity_fail',
    'why_coaching_clarity_fail',
    'no_concrete_next_step',
    'essay_about_restate_fail',
  ]);
  const currentTop = diversityAdjusted[0];
  if (currentTop && currentTop.rejection_reasons.some((r) => hardFailReasons.has(r))) {
    const clarityAlt = diversityAdjusted.find((c) =>
      c.candidate_id !== currentTop.candidate_id
      && !c.rejection_reasons.some((r) => hardFailReasons.has(r))
      && c.rejection_reasons.length < 3
    );
    if (clarityAlt) {
      const forced = [clarityAlt, ...diversityAdjusted.filter((c) => c.candidate_id !== clarityAlt.candidate_id)];
      return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
    }
  }

  if (!needsDominanceCap) return diversityAdjusted;

  const winner = diversityAdjusted[0];`,
  'hard fail winner gate'
);

direction = replaceStrict(
  direction,
  `        weaker_read: renderGuard(
          [
            \`The weaker version has detail, but the core claim stays blurry.\`,
            \`The weaker version describes events without making the main argument explicit enough.\`,
            \`The weaker version has moments you can use, but the through-line is less clear.\`,
          ][Math.abs(\`${runnerUpCandidate.candidate_id || ''}:${runnerUpCandidate.hinge_span || ''}\`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],`,
  `        weaker_read: renderGuard(
          [
            \`The weaker version is confusing on the main claim, so the reader may not know what you are arguing.\`,
            \`The weaker version has details, but it is hard to tell what your essay is actually trying to prove.\`,
            \`The weaker version sounds abstract, so it is less usable when you start drafting.\`,
          ][Math.abs(\`${runnerUpCandidate.candidate_id || ''}:${runnerUpCandidate.hinge_span || ''}\`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],`,
  'weaker confusing framing'
);

direction = replaceStrict(
  direction,
  `        stronger_read: renderGuard(
          [
            \`The stronger version states the claim early and keeps every detail tied to that claim.\`,
            \`The stronger version is easier to trust because the key decision and result stay tightly connected.\`,
            \`The stronger version gives you a cleaner path from scene to claim to consequence.\`,
          ][Math.abs(\`${selectedCandidate?.candidate_id ?? 'selected'}:${selectedCandidate?.hinge_span ?? ''}\`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],`,
  `        stronger_read: renderGuard(
          [
            \`The stronger version is more usable: the claim is clear and the evidence stays aligned. Next step: write moment, decision, result.\`,
            \`The stronger version is easier to draft because you can see the argument in one read. Next step: write 3 sentences for scene, choice, consequence.\`,
            \`The stronger version is clearer and coach-like, so you know what to write first. Next step: draft the opening around hinge plus immediate result.\`,
          ][Math.abs(\`${selectedCandidate?.candidate_id ?? 'selected'}:${selectedCandidate?.hinge_span ?? ''}\`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],`,
  'stronger usable framing with next step'
);

canonical = replaceStrict(
  canonical,
  `      first_coaching_step: content?.strongest.write_first_steps?.[0] ?? ambiguityFallback?.first_coaching_step ?? null,`,
  `      first_coaching_step: content?.strongest.next_move ?? content?.strongest.write_first_steps?.[0] ?? ambiguityFallback?.first_coaching_step ?? null,`,
  'first coaching step from strongest next move'
);

fs.writeFileSync(directionPath, direction, 'utf8');
fs.writeFileSync(canonicalPath, canonical, 'utf8');

console.log(JSON.stringify({
  status: 'ok',
  patched: ['src/lib/fm/direction.ts', 'src/lib/fm/canonicalPage3Payload.ts']
}, null, 2));
