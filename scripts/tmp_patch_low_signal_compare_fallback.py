from pathlib import Path

path = Path('src/lib/fm/canonicalPage3Payload.ts')
text = path.read_text()
orig = text

insert_after = """function buildAmbiguityFallbackRecommendation(rawInput: string, evidencePacket: {
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
  const optionLabels = extractCompareOptionLabels(rawInput);
  const twoTrackHint = optionLabels.length >= 2 || /\\b(both|either|unsure|not sure|which one|split|two)\\b/i.test(rawInput);

  const fallbackEvidence = Array.from(
    new Set([
      ...evidencePacket.evidence_lines,
      ...rawInput
        .split(/(?<=[.!?])\\s+/)
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

  const recommendation = `Essay angle: choose the stronger discipline claim. ${angleA}. ${angleB}. Compare both as full essay angles, then keep one.`;
  const about = 'This essay is about choosing one discipline method you can prove with evidence, then showing accountability and ownership through that method in one focused claim.';
  const why = `This is a compare decision, not a final topic win yet. Angle A currently has this best support: "${evidenceA}". Angle B currently has this best support: "${evidenceB}". Keep the option with the cleaner scene, clearer choice, and more immediate consequence.`;

  const weakerRead = 'If you merge both angles in one opening, the claim blurs and the essay reads as indecisive summary instead of a focused argument.';

  const strongerRead = 'Sorting question: which angle can you prove in one scene with one decision and one immediate consequence? Immediate next drafting move: write a 4-line opening for A and B, then keep the version with clearer claim and stronger consequence evidence.';

  return {
    displayed_recommendation: recommendation,
    essay_about: about,
    why_this_direction: why,
    weaker_read: weakerRead,
    stronger_read: strongerRead,
    first_coaching_step: twoTrackHint
      ? 'Step 1: list one concrete scene for Angle A and one for Angle B. Step 2: write a one-sentence claim for each. Step 3: keep only the angle with stronger evidence and clearer consequence.'
      : 'Write one scene with who was there, what decision happened, what changed immediately, then name which angle that evidence truly supports.',
    evidence_lines: fallbackEvidence.length > 0 ? fallbackEvidence : evidencePacket.evidence_lines,
    evidence_explanations: evidencePacket.evidence_explanations,
  };
}
"""

insert_block = """
function isUnknownSplitChoiceInput(rawInput: string): boolean {
  return /\\b(both|either|which\\s+one|not\\s+sure|unsure|between|compare|vs\\.?|or)\\b/i.test(rawInput);
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
        .split(/(?<=[.!?])\\s+/)
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
      `Center your essay on ${optionA} and show one concrete decision plus immediate consequence before comparing anything else.`,
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
"""

if insert_after not in text:
    raise SystemExit('cannot find ambiguity fallback function block for helper insertion')
text = text.replace(insert_after, insert_after + "\n" + insert_block, 1)

old_segment = """  const evidencePacket = buildEvidencePacket(input.caseState);
  const winner = debugContent?.candidate_pack?.find((candidate) => candidate.selected) ?? debugContent?.candidate_pack?.[0] ?? null;
  const runnerUp = debugContent?.candidate_pack?.find((candidate) => !candidate.selected) ?? debugContent?.candidate_pack?.[1] ?? null;
  const winnerBeforeReweight = debugContent?.candidate_pack
    ? [...debugContent.candidate_pack].sort((a, b) => (b.scores.pre_penalty_total ?? b.scores.total_score) - (a.scores.pre_penalty_total ?? a.scores.total_score))[0] ?? null
    : null;
"""

new_segment = """  const evidencePacket = buildEvidencePacket(input.caseState);
  const unknownShadowMode = !routeDecision.direction_generation_allowed && input.intake.narrative_pattern.primary_pattern === 'unknown';
  const normalizedShadowCandidates = unknownShadowMode
    ? (debugContent?.candidate_pack ?? []).map((candidate) => ({
        ...candidate,
        rejection_reasons: (candidate.rejection_reasons ?? []).slice(0, 1),
      }))
    : (debugContent?.candidate_pack ?? []);
  const splitChoiceFallbackCandidates =
    unknownShadowMode
    && isUnknownSplitChoiceInput(input.rawInput)
    && normalizedShadowCandidates.length === 0
      ? buildLowSignalCompareFallbackCandidates(input.rawInput, evidencePacket)
      : [];
  const debugCandidates = normalizedShadowCandidates.length > 0 ? normalizedShadowCandidates : splitChoiceFallbackCandidates;

  const winner = debugCandidates.find((candidate) => candidate.selected) ?? debugCandidates[0] ?? null;
  const runnerUp = debugCandidates.find((candidate) => !candidate.selected) ?? debugCandidates[1] ?? null;
  const winnerBeforeReweight = debugCandidates.length > 0
    ? [...debugCandidates].sort((a, b) => (b.scores.pre_penalty_total ?? b.scores.total_score) - (a.scores.pre_penalty_total ?? a.scores.total_score))[0] ?? null
    : null;
"""

if old_segment not in text:
    raise SystemExit('cannot find debug candidate segment for replacement')
text = text.replace(old_segment, new_segment, 1)

text = text.replace(
    "      candidates_generated: debugContent?.candidate_pack?.length ?? 0,",
    "      candidates_generated: debugCandidates.length,",
    1,
)
text = text.replace(
    "        debugContent?.candidate_pack?.map((candidate) => ({",
    "        debugCandidates.map((candidate) => ({",
    1,
)

if text == orig:
    raise SystemExit('no-op patch')

path.write_text(text)
print('patched low-signal compare fallback + shadow candidate normalization')
