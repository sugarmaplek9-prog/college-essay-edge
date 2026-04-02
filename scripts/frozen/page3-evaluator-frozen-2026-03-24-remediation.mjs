// Frozen evaluator snapshot for page-3 remediation pass (2026-03-24).
// Purpose: align scoring with human usefulness and reduce false product over-calls.

export function clean(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim();
}

function count(pattern, text) {
  return (text.match(pattern) || []).length;
}

function clamp1to5(n) {
  return Math.max(1, Math.min(5, n));
}

function overlapRatio(a, b) {
  const toks = (t) => clean(t).toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  const A = new Set(toks(a));
  const B = new Set(toks(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter += 1;
  return inter / (A.size + B.size - inter);
}

export function scoreOutput(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const essayAbout = clean(output?.essay_about);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);
  const evidenceExplanations = (output?.evidence_explanations ?? []).map(clean).filter(Boolean);

  const merged = `${recommendation} ${essayAbout} ${why} ${weaker} ${stronger}`;

  const oldShellPattern = /\b(build from the angle that|the direction is the specific moment|the real story is|what changed in your judgment|the choice at.+changed what happened|this direction works because|specific gap|not a general lesson|links one decision to one consequence)\b/i;
  const compareTellPattern = /\b(overweights setup|underweights the real decision|centers the hinge|keeps the decision and consequence tied|stays closer to setup than hinge)\b/i;
  const evidenceTellPattern = /\b(grounds the setting where|contains the hinge|shows what changed after|captures what you understood)\b/i;

  const quotedCount = count(/["“”]/g, merged);
  const hasConcreteNouns = /\b(hospital|nurse|clinic|robotics|pantry|freshman|medication|family|teacher|student|coach|inventory|checklist|debate|tutoring)\b/i.test(merged);
  const hasActionVerbs = /\b(chose|decided|changed|revised|created|stopped|started|asked|proposed|fixed|rebuilt)\b/i.test(merged);
  const decisionShell = /\b(decision under pressure|one concrete decision|reveals your real standard|center of this essay|write this essay around|cleaner route from scene to insight|what happened next)\b/i.test(merged);
  const angleNaming = /\b(process|system|reliability|usefulness|accountability|ownership|autonomy|translation|research rigor|advocacy|trust|method|discipline)\b/i.test(`${recommendation} ${essayAbout}`);
  const angleFirstLead = /^essay angle:/i.test(recommendation);
  const mechanismHeavy = /\b(process redesign|operational thinking|system fix|pivot|scene-level choice|choice and consequence)\b/i.test(`${recommendation} ${essayAbout}`);
  const pivotOnlyShell = /\b(pressure|decision|standard|scene|consequence)\b/i.test(`${recommendation} ${essayAbout}`) && !angleNaming;
  const cadencePatternHits = count(/\b(this path|this route|the selected path|the alternate path|the center of this essay|at its core)\b/gi, merged);
  const aboutOverlap = overlapRatio(recommendation, essayAbout);
  const repetitiveEvidenceCadence = count(/\b(this is where|this line|this detail|this shows)\b/gi, evidenceExplanations.join(' '));

  const essayAngleLegibility = clamp1to5(
    1
    + (recommendation.length >= 40 ? 1 : 0)
    + (/\b(essay|angle|story|center|focus)\b/i.test(recommendation) ? 1 : 0)
    + (/\b(tension|value|process|relationship|contradiction|realization|accountability|responsibility|standard)\b/i.test(recommendation) ? 1 : 0)
    + (hasConcreteNouns ? 1 : 0)
    - (oldShellPattern.test(recommendation) ? 2 : 0)
    - (decisionShell ? 2 : 0)
  );

  const essayAboutnessClarity = clamp1to5(
    1
    + (essayAbout.length >= 35 ? 1 : 0)
    + (/\bfundamentally about\b|\bthis essay is about\b/i.test(essayAbout) ? 1 : 0)
    + (/\b(tension|value|process|relationship|contradiction|realization|standard|accountability|trust)\b/i.test(essayAbout) ? 1 : 0)
    + (hasConcreteNouns ? 1 : 0)
    - (/\bone clear thread\b|\bconcrete moments and consequences\b|\bstrong central claim\b/i.test(essayAbout) ? 2 : 0)
    - (aboutOverlap > 0.62 ? 2 : 0)
  );

  const whyPersuasion = clamp1to5(
    1
    + (/\b(stronger|earns trust|persuades|beats|clearer than|stake)\b/i.test(why) ? 2 : 0)
    + (/\b(reveals|shows|proves|clarifies)\b/i.test(why) ? 1 : 0)
    + (/\b(instead of|rather than|flatter|summary)\b/i.test(why) ? 1 : 0)
    - (oldShellPattern.test(why) ? 2 : 0)
    - (decisionShell ? 2 : 0)
  );

  const directionalUsefulness = clamp1to5(
    1
    + (/\b(write|center|frame|make the essay about|open|show|then)\b/i.test(merged) ? 2 : 0)
    + (hasActionVerbs ? 1 : 0)
    + (evidence.length >= 2 ? 1 : 0)
    - (oldShellPattern.test(merged) ? 1 : 0)
    - (decisionShell ? 2 : 0)
  );

  const humanUsefulness = clamp1to5(
    1
    + Math.round((essayAngleLegibility + essayAboutnessClarity + whyPersuasion + directionalUsefulness) / 4)
    - (compareTellPattern.test(merged) ? 1 : 0)
    - (aboutOverlap > 0.62 ? 1 : 0)
    - (repetitiveEvidenceCadence >= 2 ? 1 : 0)
  );

  const familyDiversityBonus = clamp1to5(
    1
    + (/\b(tension|value|process|relationship|contradiction|realization)\b/i.test(recommendation) ? 1 : 0)
    + (/\b(versus|vs|between)\b/i.test(recommendation) ? 1 : 0)
    + (aboutOverlap < 0.45 ? 1 : 0)
    + (cadencePatternHits <= 2 ? 1 : 0)
    - (decisionShell ? 1 : 0)
  );

  const angleDirectness = clamp1to5(
    1
    + (angleNaming ? 3 : 0)
    - (decisionShell ? 2 : 0)
    - (pivotOnlyShell ? 1 : 0)
  );

  const essayAngleNamingQuality = clamp1to5(
    1
    + (angleNaming ? 3 : 0)
    + (aboutOverlap < 0.5 ? 1 : 0)
    - (aboutOverlap > 0.6 ? 2 : 0)
    - (pivotOnlyShell ? 1 : 0)
  );

  const angleFirstQuality = clamp1to5(
    1
    + (angleFirstLead ? 2 : 0)
    + (angleNaming ? 1 : 0)
    + (hasConcreteNouns ? 1 : 0)
    - (mechanismHeavy ? 2 : 0)
    - (pivotOnlyShell ? 1 : 0)
  );

  const conceptualLift = clamp1to5(
    1
    + (aboutOverlap < 0.5 ? 2 : 0)
    + (/\b(principle|standard|interpretation|responsibility|trust|judgment|ownership)\b/i.test(essayAbout) ? 1 : 0)
    + (/\b(behavior|decision|choices?|actions?|pattern)\b/i.test(essayAbout) ? 1 : 0)
    - (aboutOverlap > 0.6 ? 2 : 0)
    - (mechanismHeavy ? 1 : 0)
  );

  const caseSpecificityBeyondPivot = clamp1to5(
    1
    + (evidence.length >= 2 ? 2 : 0)
    + (hasConcreteNouns ? 1 : 0)
    + (angleNaming ? 1 : 0)
    - (pivotOnlyShell ? 2 : 0)
  );

  const familyDiversitySurvival = clamp1to5(
    1
    + (familyDiversityBonus >= 4 ? 2 : 0)
    + (angleNaming ? 1 : 0)
    - (decisionShell ? 2 : 0)
  );

  const ambiguityModeUsefulness = clamp1to5(
    1
    + (/\b(two|2|three|3)\b/i.test(recommendation + ' ' + essayAbout) ? 1 : 0)
    + (/\bangle\b/i.test(recommendation + ' ' + essayAbout) ? 1 : 0)
    + (/\bmissing\b|\bdecisive\b|\bchoose\b|\bsorting question\b/i.test(why + ' ' + stronger) ? 2 : 0)
  );

  const ambiguityDecisionHelpfulness = clamp1to5(
    1
    + (ambiguityModeUsefulness >= 4 ? 2 : 0)
    + (/\bsorting question|missing detail|next action|choose\b/i.test(`${why} ${stronger}`) ? 2 : 0)
  );

  const sourceSpecificity = clamp1to5(
    1
    + (evidence.length >= 2 ? 2 : evidence.length === 1 ? 1 : 0)
    + (quotedCount >= 2 ? 1 : 0)
    + (hasConcreteNouns ? 1 : 0)
    - (repetitiveEvidenceCadence >= 3 ? 1 : 0)
  );

  const packetIdentifiabilityPenalty = Math.max(0, Math.min(5,
    (oldShellPattern.test(merged) ? 2 : 0)
    + (compareTellPattern.test(merged) ? 1 : 0)
    + (evidenceTellPattern.test(evidenceExplanations.join(' ')) ? 1 : 0)
    + ((count(/\bthis version\b/gi, merged) >= 2) ? 1 : 0)
    + (decisionShell ? 3 : 0)
    + (pivotOnlyShell ? 2 : 0)
    + (cadencePatternHits >= 3 ? 2 : cadencePatternHits >= 2 ? 1 : 0)
    + (repetitiveEvidenceCadence >= 3 ? 2 : repetitiveEvidenceCadence >= 2 ? 1 : 0)
  ));

  const familyCollapsePenalty = Math.max(0, Math.min(5,
    (decisionShell ? 2 : 0)
    + (pivotOnlyShell ? 2 : 0)
    + (cadencePatternHits >= 3 ? 1 : 0)
  ));

  const packetFamilySamenessPenalty = Math.max(0, Math.min(5,
    (mechanismHeavy ? 2 : 0)
    + (pivotOnlyShell ? 2 : 0)
    + (aboutOverlap > 0.58 ? 1 : 0)
  ));

  const humanPacketReadability = clamp1to5(
    1
    + (humanUsefulness >= 4 ? 1 : 0)
    + (essayAboutnessClarity >= 4 ? 1 : 0)
    + (whyPersuasion >= 4 ? 1 : 0)
    + (packetIdentifiabilityPenalty <= 1 ? 1 : 0)
  );

  const averageEffective = Number((
    essayAngleLegibility * 0.06 +
    essayAboutnessClarity * 0.07 +
    whyPersuasion * 0.07 +
    directionalUsefulness * 0.06 +
    humanUsefulness * 0.12 +
    humanPacketReadability * 0.11 +
    familyDiversityBonus * 0.03 +
    ambiguityModeUsefulness * 0.07 +
    sourceSpecificity * 0.03 +
    angleDirectness * 0.14 +
    essayAngleNamingQuality * 0.14 +
    angleFirstQuality * 0.12 +
    conceptualLift * 0.11 +
    caseSpecificityBeyondPivot * 0.07 +
    familyDiversitySurvival * 0.04 +
    ambiguityDecisionHelpfulness * 0.04
    - packetIdentifiabilityPenalty * 0.42
    - packetFamilySamenessPenalty * 0.38
    - Number(aboutOverlap.toFixed(3)) * 0.24
    - familyCollapsePenalty * 0.24
  ).toFixed(2));

  return {
    essay_angle_specificity: essayAngleLegibility,
    essay_angle_legibility: essayAngleLegibility,
    essay_aboutness_clarity: essayAboutnessClarity,
    essay_about_clarity: essayAboutnessClarity,
    why_persuasion: whyPersuasion,
    directional_usefulness: directionalUsefulness,
    human_usefulness: humanUsefulness,
    human_packet_readability: humanPacketReadability,
    family_diversity_bonus: familyDiversityBonus,
    family_diversity_survival: familyDiversitySurvival,
    ambiguity_mode_usefulness: ambiguityModeUsefulness,
    ambiguity_decision_helpfulness: ambiguityDecisionHelpfulness,
    angle_directness: angleDirectness,
    angle_first_quality: angleFirstQuality,
    essay_angle_naming_quality: essayAngleNamingQuality,
    conceptual_lift: conceptualLift,
    case_specificity_beyond_pivot: caseSpecificityBeyondPivot,
    source_specificity: sourceSpecificity,
    packet_identifiability_penalty: packetIdentifiabilityPenalty,
    family_collapse_penalty: familyCollapsePenalty,
    packet_family_sameness_penalty: packetFamilySamenessPenalty,
    essay_about_redundancy_penalty: Number(aboutOverlap.toFixed(3)),
    average_effective: averageEffective,
  };
}

export function winnerCall(product, baseline) {
  const dims = [
    'essay_angle_specificity',
    'essay_angle_legibility',
    'essay_aboutness_clarity',
    'why_persuasion',
    'directional_usefulness',
    'human_usefulness',
    'human_packet_readability',
    'family_diversity_bonus',
    'family_diversity_survival',
    'ambiguity_mode_usefulness',
    'ambiguity_decision_helpfulness',
    'angle_directness',
    'angle_first_quality',
    'essay_angle_naming_quality',
    'conceptual_lift',
    'case_specificity_beyond_pivot',
    'source_specificity',
  ];

  const weighted = (x) =>
    x.essay_angle_specificity * 0.05 +
    x.essay_aboutness_clarity * 0.07 +
    x.why_persuasion * 0.07 +
    x.directional_usefulness * 0.06 +
    x.human_usefulness * 0.12 +
    x.human_packet_readability * 0.11 +
    x.family_diversity_bonus * 0.03 +
    x.family_diversity_survival * 0.04 +
    x.ambiguity_mode_usefulness * 0.08 +
    x.ambiguity_decision_helpfulness * 0.06 +
    x.angle_directness * 0.12 +
    x.angle_first_quality * 0.12 +
    x.essay_angle_naming_quality * 0.12 +
    x.conceptual_lift * 0.1 +
    x.case_specificity_beyond_pivot * 0.06 +
    x.source_specificity * 0.03 -
    x.packet_identifiability_penalty * 0.44 -
    (x.packet_family_sameness_penalty ?? 0) * 0.4 -
    (x.family_collapse_penalty ?? 0) * 0.38 -
    (x.essay_about_redundancy_penalty ?? 0) * 0.28;

  const pScore = weighted(product);
  const bScore = weighted(baseline);

  let p = 0;
  let b = 0;
  for (const d of dims) {
    if (product[d] > baseline[d]) p += 1;
    else if (baseline[d] > product[d]) b += 1;
  }
  if (product.packet_identifiability_penalty < baseline.packet_identifiability_penalty) p += 2;
  else if (baseline.packet_identifiability_penalty < product.packet_identifiability_penalty) b += 2;

  const margin = pScore - bScore;
  const tooClose = Math.abs(margin) < 0.85;
  const lowConfidence = Math.min(product.human_usefulness, product.human_packet_readability) < 4;
  const productPivotShellWithoutAngle =
    product.angle_directness <= 2
    && product.essay_angle_naming_quality <= 2
    && product.packet_identifiability_penalty >= 3;
  const productSamenessBlocked =
    (product.packet_family_sameness_penalty ?? 0) >= 3
    || (product.family_collapse_penalty ?? 0) >= 3
    || (product.conceptual_lift ?? 0) <= 2;

  const winner = (productPivotShellWithoutAngle || productSamenessBlocked) && margin > 0
    ? (bScore >= pScore - 0.45 ? 'openai' : 'tie')
    : tooClose || (margin > 0 && lowConfidence)
      ? 'tie'
      : margin > 0
        ? 'product'
        : 'openai';

  return {
    product_points: p,
    openai_points: b,
    weighted_product: Number(pScore.toFixed(3)),
    weighted_openai: Number(bScore.toFixed(3)),
    weighted_margin: Number(margin.toFixed(3)),
    winner,
  };
}
