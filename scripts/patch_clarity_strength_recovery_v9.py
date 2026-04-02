from pathlib import Path
import re

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text()

# 1) claim-first/comprehension helpers
text = text.replace(
"""const TAXONOMY_FORWARD_PATTERN = /\\b(relationship-based responsibility|ownership under contradiction|interpretation change|value-under-cost|angle|family|framework)\\b/i;

function hasPlainClaimSignal(text: string): boolean {
  const t = text.toLowerCase();
  const hasClaimVerb = /\\b(show|argue|prove|claim|center|focus|make your main claim|your essay should)\\b/i.test(t);
  const hasStudentMeaning = /\\b(essay|moment|decision|choice|result|standard|response|method|value)\\b/i.test(t);
  return hasClaimVerb && hasStudentMeaning;
}
""",
"""const TAXONOMY_FORWARD_PATTERN = /\\b(relationship-based responsibility|ownership under contradiction|interpretation change|value-under-cost|angle|family|framework)\\b/i;
const CLAIM_FIRST_START_PATTERN = /^(your essay should|make your main claim that|center your essay on|show how|write this around|argue that|at the center, show|lead with the claim that|frame the essay around|build the draft around)\\b/i;

function hasPlainClaimSignal(text: string): boolean {
  const t = text.toLowerCase();
  const hasClaimVerb = /\\b(show|argue|prove|claim|center|focus|make your main claim|your essay should)\\b/i.test(t);
  const hasStudentMeaning = /\\b(essay|moment|decision|choice|result|standard|response|method|value)\\b/i.test(t);
  return hasClaimVerb && hasStudentMeaning;
}

function hasClaimFirstForm(text: string): boolean {
  return CLAIM_FIRST_START_PATTERN.test(normalizeSentence(text));
}

function hasComprehensionSignal(candidate: RuntimeDirectionCandidate): boolean {
  const direction = normalizeSentence(candidate.direction_line);
  const directionWordCount = direction.split(/\\s+/).filter(Boolean).length;
  const directionHasCore = /\\b(moment|decision|choice|result|standard|method|value|response|behavior)\\b/i.test(direction);
  const whyHasBecause = /\\bbecause\\b/i.test(candidate.why_this_direction);
  const nextHasConcrete = hasConcreteNextStep(candidate.next_move);
  return hasClaimFirstForm(direction) && directionHasCore && directionWordCount <= 34 && whyHasBecause && nextHasConcrete;
}
"""
)

# 2) two-part why
text = re.sub(
    r"function ensureComparativeWhy\(why: string, seedValue = 0\): string \{[\s\S]*?\n\}\n\nfunction ensureConcreteNextMove",
    lambda _m: """function ensureComparativeWhy(why: string, seedValue = 0): string {
  const out = normalizeSentence(why);
  const comparativeLeads = [
    'Choose this over the weaker version because',
    'This beats the alternate read because',
    'Pick this direction because',
    'This is stronger than the fallback because',
    'Compared with the weaker path, this works because',
    'From a drafting lens, choose this because',
    'This is the clearer coaching path because',
    'If your goal is a writable claim, pick this because',
  ] as const;
  const lead = comparativeLeads[(stableTextHash(out) + seedValue) % comparativeLeads.length];

  let firstPart = out.split(/(?<=[.!?])\\s+/).filter(Boolean)[0] ?? out;
  if (!hasComparativeWhySignal(firstPart)) {
    firstPart = `${lead} the claim stays explicit and evidence-aligned.`;
  } else if (/^(this wins because|it is stronger because|this is stronger because)/i.test(firstPart)) {
    firstPart = firstPart.replace(/^(this wins because|it is stronger because|this is stronger because)\\s*/i, `${lead} `);
  }
  if (!/\\bbecause\\b/i.test(firstPart)) {
    firstPart = `${firstPart} because the claim is explicit and evidence-aligned.`;
  }

  const payoffVariants = [
    'Drafting payoff: open with the hinge moment, then show decision and immediate result.',
    'Drafting payoff: start with one scene, then write the claim and consequence in order.',
    'Drafting payoff: you can draft the opening in three lines — moment, choice, result.',
    'Drafting payoff: this gives a clean first paragraph structure you can write right now.',
    'Drafting payoff: the reader can follow your argument from scene to claim without guesswork.',
  ] as const;

  const secondPart = payoffVariants[(stableTextHash(`${out}:${firstPart}`) + seedValue) % payoffVariants.length];
  return normalizeSentence(`${firstPart} ${secondPart}`);
}

function ensureConcreteNextMove""",
    text,
    count=1,
)

# 3) claim-first rewrite rule
text = text.replace(
"""  const startsAsAbout = /^(this essay is about|the essay is about|your essay is really about|the heart of this essay is|the essay is fundamentally about)\\b/i.test(normalized);
  const needRewrite = startsAsAbout
    || !hasPlainClaimSignal(normalized)
    || (TAXONOMY_FORWARD_PATTERN.test(normalized) && !/\\b(moment|decision|choice|result|what changed|what you changed)\\b/i.test(normalized));
""",
"""  const startsAsAbout = /^(this essay is about|the essay is about|your essay is really about|the heart of this essay is|the essay is fundamentally about)\\b/i.test(normalized);
  const needRewrite = startsAsAbout
    || !hasClaimFirstForm(normalized)
    || !hasPlainClaimSignal(normalized)
    || (TAXONOMY_FORWARD_PATTERN.test(normalized) && !/\\b(moment|decision|choice|result|what changed|what you changed)\\b/i.test(normalized));
"""
)

# 4) realization high-clarity templates
if "const realizationDirectionLine = (() => {" not in text:
    text = text.replace(
"""  const pattern = intake.narrative_pattern.primary_pattern;
  const themeStatement = deriveThemeStatement(pattern, turningQ, consequenceQ);
  const baseWhy = deriveWhyStatement(pattern, turningQ, consequenceQ);

  const recommend = (
""",
"""  const pattern = intake.narrative_pattern.primary_pattern;
  const themeStatement = deriveThemeStatement(pattern, turningQ, consequenceQ);
  const baseWhy = deriveWhyStatement(pattern, turningQ, consequenceQ);

  const realizationDirectionLine = (() => {
    switch (pattern) {
      case 'usefulness_vs_intention':
        return turningQ
          ? `Argue that ${turningQ} changed how you define helping, and show the next decision that proved it.`
          : 'Argue that one corrective moment changed how you define helping, then prove it with your next decision.';
      case 'competence_vs_responsibility':
        return turningQ
          ? `Make your main claim that ${turningQ} changed your standard from being fast to being reliable.`
          : 'Make your main claim that your standard shifted from being fast to being reliable, then show where it held.';
      case 'failure_reinterpretation':
        return turningQ
          ? `Show how ${turningQ} changed your interpretation of failure, and how that changed your method.`
          : 'Show how one failure changed your interpretation, then show the method you rebuilt from it.';
      case 'identity_shift':
        return reflectionQ
          ? `Lead with the claim that ${reflectionQ} changed who you were in practice, not just in reflection.`
          : 'Lead with the claim that one realization changed who you were in practice, not just what you believed.';
      case 'responsibility_shift':
        return turningQ
          ? `Center your essay on the claim that ${turningQ} made responsibility your call, and your next action proved it.`
          : 'Center your essay on the claim that responsibility became your call, then show the next action that proved it.';
      case 'conflict_reframe':
        return turningQ
          ? `Show how ${turningQ} changed your lens in conflict, and how that new lens changed your response.`
          : 'Show how one conflict changed your lens, then show the response that proved that change.';
      default:
        return reflectionQ
          ? `Argue that what you understood at ${reflectionQ} changed your next decision.`
          : 'Argue that one realization changed your next decision, not just your reflection.';
    }
  })();

  const recommend = (
"""
    )

text = text.replace(
"""  const realizationCandidate = recommend(
    'c_realization_angle',
    'realization',
    'angle_realization_action',
    themeStatement
      ? `${themeStatement} Make the claim that what you understood in that moment changed your next decision.`
      : 'Make the claim that what you understood in one moment changed your later decisions, not just your reflection.',
    `${baseWhy} It also beats a flatter version because it turns realization into action instead of reflection-only language.`,
""",
"""  const realizationCandidate = recommend(
    'c_realization_angle',
    'realization',
    'angle_realization_action',
    realizationDirectionLine,
    `${baseWhy} It also beats a flatter version because it turns realization into action instead of reflection-only language.`,
"""
)

# 5) scoring signals
text = text.replace(
"""    const taxonomyForwardRisk = TAXONOMY_FORWARD_PATTERN.test(`${candidate.direction_line} ${candidate.essay_about}`);
    const plainClaimSignal = hasPlainClaimSignal(candidate.direction_line);
    const comparativeWhySignal = hasComparativeWhySignal(candidate.why_this_direction);
    const draftingPayoffSignal = hasDraftingPayoffSignal(candidate.why_this_direction);
    const concreteNextStepSignal = hasConcreteNextStep(candidate.next_move);
""",
"""    const taxonomyForwardRisk = TAXONOMY_FORWARD_PATTERN.test(`${candidate.direction_line} ${candidate.essay_about}`);
    const claimFirstSignal = hasClaimFirstForm(candidate.direction_line);
    const plainClaimSignal = hasPlainClaimSignal(candidate.direction_line);
    const comparativeWhySignal = hasComparativeWhySignal(candidate.why_this_direction);
    const draftingPayoffSignal = hasDraftingPayoffSignal(candidate.why_this_direction);
    const concreteNextStepSignal = hasConcreteNextStep(candidate.next_move);
    const comprehensionSignal = hasComprehensionSignal(candidate);
"""
)

# 6) clarity score details
text = text.replace(
"""    const humanVoiceClarity = clampScore(
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
""",
"""    const humanVoiceClarity = clampScore(
      (claimFirstSignal ? 0.18 : 0.04)
      + (plainClaimSignal ? 0.24 : 0.06)
      + (taxonomyForwardRisk ? 0 : 0.12)
      + (comparativeWhySignal ? 0.14 : 0)
      + (draftingPayoffSignal ? 0.14 : 0)
      + (concreteNextStepSignal ? 0.16 : 0)
      + (essayAboutAddsMeaningSignal ? 0.1 : 0)
      + (comprehensionSignal ? 0.12 : 0)
    );
    const clarityHardFailPenalty = clampScore(
      (!claimFirstSignal ? 0.28 : 0)
      + (!plainClaimSignal && taxonomyForwardRisk ? 0.62 : 0)
      + (!comparativeWhySignal ? 0.36 : 0)
      + (!draftingPayoffSignal ? 0.28 : 0)
      + (!concreteNextStepSignal ? 0.62 : 0)
      + (!essayAboutAddsMeaningSignal ? 0.34 : 0)
      + (!comprehensionSignal ? 0.58 : 0)
    );
"""
)

# 7) rejection reasons
text = text.replace(
"""    if (essayAboutRedundancyPenalty > 0.25) rejectionReasons.push('essay_about_redundancy_penalty');
    if (!plainClaimSignal && taxonomyForwardRisk) rejectionReasons.push('plain_claim_clarity_fail');
    if (!comparativeWhySignal || !draftingPayoffSignal) rejectionReasons.push('why_coaching_clarity_fail');
    if (!concreteNextStepSignal) rejectionReasons.push('no_concrete_next_step');
    if (!essayAboutAddsMeaningSignal) rejectionReasons.push('essay_about_restate_fail');
""",
"""    if (essayAboutRedundancyPenalty > 0.25) rejectionReasons.push('essay_about_redundancy_penalty');
    if (!claimFirstSignal) rejectionReasons.push('claim_first_clarity_fail');
    if (!plainClaimSignal && taxonomyForwardRisk) rejectionReasons.push('plain_claim_clarity_fail');
    if (!comparativeWhySignal || !draftingPayoffSignal) rejectionReasons.push('why_coaching_clarity_fail');
    if (!concreteNextStepSignal) rejectionReasons.push('no_concrete_next_step');
    if (!essayAboutAddsMeaningSignal) rejectionReasons.push('essay_about_restate_fail');
    if (!comprehensionSignal) rejectionReasons.push('comprehension_fail');
"""
)

# 8) clarity-first selection after hard shell constraints
text = re.sub(
    r"const hardFailReasons = new Set\(\[[\s\S]*?const sorted = rankedSource\.sort\(\(a, b\) => b\.scores\.total_score - a\.scores\.total_score\);",
    lambda _m: """const hardFailReasons = new Set([
    'claim_first_clarity_fail',
    'plain_claim_clarity_fail',
    'why_coaching_clarity_fail',
    'no_concrete_next_step',
    'essay_about_restate_fail',
    'comprehension_fail',
  ]);
  const shellHardFailReasons = new Set([
    'cross_family_shell_sameness',
    'over_repeated_scaffold_family',
    'family_collapse_penalty',
    'decision_shell_penalty',
    'banned_recommendation_shell',
    'banned_why_shell',
  ]);
  const hasHardFail = (candidate: RankedRuntimeDirectionCandidate): boolean =>
    candidate.rejection_reasons.some((r) => hardFailReasons.has(r));
  const hasShellHardFail = (candidate: RankedRuntimeDirectionCandidate): boolean =>
    candidate.rejection_reasons.some((r) => shellHardFailReasons.has(r));

  const shellPrefixFamilies = new Map<string, Set<string>>();
  for (const candidate of scored) {
    const shellKey = normalizeAnchorKey(candidate.direction_line).split(' ').slice(0, 7).join(' ');
    if (!shellKey) continue;
    const families = shellPrefixFamilies.get(shellKey) ?? new Set<string>();
    families.add(candidate.family_type);
    shellPrefixFamilies.set(shellKey, families);
  }

  const scoredAdjusted = scored.map((candidate) => {
    const shellKey = normalizeAnchorKey(candidate.direction_line).split(' ').slice(0, 7).join(' ');
    const families = shellPrefixFamilies.get(shellKey);
    const crossFamilySameness = Boolean(families && families.size > 1);
    if (!crossFamilySameness) return candidate;

    const updatedReasons = candidate.rejection_reasons.includes('cross_family_shell_sameness')
      ? candidate.rejection_reasons
      : [...candidate.rejection_reasons, 'cross_family_shell_sameness'];
    const updatedHits = candidate.shell_penalty_hits.includes('cross_family_shell_sameness')
      ? candidate.shell_penalty_hits
      : [...candidate.shell_penalty_hits, 'cross_family_shell_sameness'];

    const familyCollapsePenalty = clampScore((candidate.scores.family_collapse_penalty ?? 0) + 0.18);
    const decisionShellPenalty = clampScore((candidate.scores.decision_shell_penalty ?? 0) + 0.18);
    const adjustedPost = round((candidate.scores.post_penalty_total ?? candidate.scores.total_score) - 0.12);
    const adjustedTotal = round((candidate.scores.total_score ?? adjustedPost) - 0.12);

    return {
      ...candidate,
      rejection_reasons: updatedReasons,
      shell_penalty_hits: updatedHits,
      scores: {
        ...candidate.scores,
        family_collapse_penalty: familyCollapsePenalty,
        decision_shell_penalty: decisionShellPenalty,
        post_penalty_total: adjustedPost,
        total_score: adjustedTotal,
        packet_adjusted_total: adjustedTotal,
      },
    };
  });

  const vetoEligible = scoredAdjusted.filter((candidate) => !hasHardFail(candidate));
  const shellSafeEligible = vetoEligible.filter((candidate) => !hasShellHardFail(candidate));

  const clarityScore = (candidate: RankedRuntimeDirectionCandidate): number => round(
    (candidate.scores.directional_usefulness * 0.26)
    + (candidate.scores.essay_aboutness_clarity * 0.22)
    + (candidate.scores.why_quality * 0.2)
    + (candidate.scores.coaching_actionability * 0.2)
    + (candidate.scores.coach_judgment_quality * 0.12)
  );

  const clarityWeightedTotal = (candidate: RankedRuntimeDirectionCandidate): number => round(
    candidate.scores.total_score * 0.56 + clarityScore(candidate) * 0.44
  );

  const strictSurvivors = shellSafeEligible.filter((candidate) => candidate.rejection_reasons.length < 2);
  const rankedSource = strictSurvivors.length >= 2
    ? strictSurvivors
    : (shellSafeEligible.length > 0 ? shellSafeEligible : (vetoEligible.length > 0 ? vetoEligible : scoredAdjusted));

  const sorted = [...rankedSource].sort((a, b) => {
    const clarityDelta = clarityWeightedTotal(b) - clarityWeightedTotal(a);
    if (Math.abs(clarityDelta) > 0.001) return clarityDelta;
    return b.scores.total_score - a.scores.total_score;
  });""",
    text,
    count=1,
)

path.write_text(text)
print('ok')
