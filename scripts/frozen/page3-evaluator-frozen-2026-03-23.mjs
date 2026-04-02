// Frozen evaluator snapshot for page-3 head-to-head.
// Source lineage: page3-openai-only-headtohead.mjs / page3-holdout-v1.mjs (2026-03-23)
// Do not modify scoring logic without creating a new frozen snapshot file.

export function clean(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim();
}

export function scoreOutput(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);
  const merged = `${recommendation} ${why} ${weaker} ${stronger}`;

  const quotedCount = (merged.match(/["""]/g) || []).length;
  const hasConcreteEntity = /\b(hospital|nurse|clinic|robotics|pantry|freshman|medication|younger student|family)\b/i.test(merged);
  const hasActionChain = /\b(start|then|after|write|open|show|prove|scene|sentence|detail)\b/i.test(merged);
  const genericPhrase = /\b(best angle|specific moment your choice changed the story|growth|resilience|journey)\b/i.test(merged);
  const hingeSignal = /\b(hinge|moment|changed|decision|consequence|shift)\b/i.test(merged);

  const sourceSpecificity = Math.max(1, Math.min(5,
    (evidence.length >= 2 ? 3 : evidence.length === 1 ? 2 : 1) +
    (quotedCount >= 2 ? 1 : 0) +
    (hasConcreteEntity ? 1 : 0)
  ));

  const sourceFaithfulness = Math.max(1, Math.min(5,
    (evidence.length >= 2 ? 3 : evidence.length === 1 ? 2 : 1) +
    (why.includes('"') || recommendation.includes('"') ? 1 : 0) +
    (hasConcreteEntity ? 1 : 0)
  ));

  const draftability = Math.max(1, Math.min(5,
    (hasActionChain ? 3 : 1) +
    (/\b(start|then|after)\b/i.test(output?.why_this_direction || '') ? 1 : 0) +
    (/\b(write|open|show|prove)\b/i.test(merged) ? 1 : 0)
  ));

  const nonRepeatability = Math.max(1, Math.min(5,
    5 - (genericPhrase ? 2 : 0) - (sourceSpecificity <= 2 ? 1 : 0) - (sourceFaithfulness <= 2 ? 1 : 0)
  ));

  const recommendationClarity = Math.max(1, Math.min(5,
    recommendation.length >= 18 && recommendation.length <= 220
      ? (hingeSignal ? 5 : 4)
      : 2
  ));

  const weakerStrongerUsefulness = Math.max(1, Math.min(5,
    weaker && stronger
      ? 3 + (/\b(weaker|setup|generic|summary)\b/i.test(weaker) ? 1 : 0) + (/\b(stronger|hinge|concrete|wins|anchor)\b/i.test(stronger) ? 1 : 0)
      : 1
  ));

  const translationPenalty = Math.max(0, Math.min(5,
    (genericPhrase ? 2 : 0) +
    (/\b(best angle|the direction is)\b/i.test(merged) ? 2 : 0) +
    (sourceFaithfulness <= 2 ? 1 : 0)
  ));

  const avg = Number(((sourceSpecificity + sourceFaithfulness + draftability + nonRepeatability + recommendationClarity + weakerStrongerUsefulness + (5 - translationPenalty)) / 7).toFixed(2));

  return {
    source_specificity: sourceSpecificity,
    source_faithfulness: sourceFaithfulness,
    draftability,
    non_repeatability: nonRepeatability,
    recommendation_clarity: recommendationClarity,
    weaker_stronger_usefulness: weakerStrongerUsefulness,
    translation_penalty: translationPenalty,
    average_effective: avg,
  };
}

export function winnerCall(product, baseline) {
  const dims = [
    'source_specificity',
    'source_faithfulness',
    'draftability',
    'non_repeatability',
    'recommendation_clarity',
    'weaker_stronger_usefulness',
  ];
  let p = 0;
  let b = 0;
  for (const d of dims) {
    if (product[d] > baseline[d]) p += 1;
    else if (baseline[d] > product[d]) b += 1;
  }
  if (product.translation_penalty < baseline.translation_penalty) p += 1;
  else if (baseline.translation_penalty < product.translation_penalty) b += 1;

  return {
    product_points: p,
    openai_points: b,
    winner: p === b ? 'tie' : p > b ? 'product' : 'openai',
  };
}
