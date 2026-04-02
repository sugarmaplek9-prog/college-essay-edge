// Page3 evaluator v3: human-preference gate + template penalties
export const EVALUATOR_VERSION = 'v3-human-preference-2026-03-23';

export function clean(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim();
}

function scoreEssayAboutnessClarity(recommendation, why) {
  const text = `${recommendation} ${why}`;
  let s = 1;
  if (/\b(essay is about|this essay is about|the story is about)\b/i.test(text)) s += 2;
  if (/\b(gap|tension|choice|decision|what changed|what this reveals)\b/i.test(text)) s += 1;
  if (/\b(focus on|importance of|highlights|emphasizes)\b/i.test(recommendation) && !/essay is about/i.test(recommendation)) s -= 1;
  return Math.max(1, Math.min(5, s));
}

function scoreDirectionalUsefulness(recommendation, why) {
  const text = `${recommendation} ${why}`;
  let s = 1;
  if (/\b(build from|start with|anchor|thread|center|direction)\b/i.test(text)) s += 1;
  if (/\b(specific|concrete|moment|decision|choice)\b/i.test(text)) s += 1;
  if (/\b(generic|broad|leadership|growth|resilience)\b/i.test(text) && !/specific|concrete/i.test(text)) s -= 1;
  if (/^\s*(focus on|emphasize)\b/i.test(recommendation)) s -= 1;
  return Math.max(1, Math.min(5, s));
}

function scoreWhyQuality(why) {
  if (!why) return 1;
  let s = 1;
  if (/\b(works because|wins because|stronger because|the reason)\b/i.test(why)) s += 1;
  if (/\b(not just|rather than|instead of|difference|gap)\b/i.test(why)) s += 1;
  if (/\b(reveals|compelling|specific|hard to fake|non-generic)\b/i.test(why)) s += 1;
  if (/\b(highlights|emphasizes|demonstrates|showcases)\b/i.test(why) && /\b(growth|leadership|skills|maturity)\b/i.test(why)) s -= 1;
  return Math.max(1, Math.min(5, s));
}

function scoreCoachingActionability(recommendation, why, weaker, stronger) {
  const text = `${recommendation} ${why} ${weaker} ${stronger}`;
  let s = 1;
  if (/\b(start|open|write|then|after|show|name|draft)\b/i.test(text)) s += 1;
  if (weaker && stronger) s += 1;
  if (/\b(weaker|stronger|wins|misses|better path)\b/i.test(text)) s += 1;
  return Math.max(1, Math.min(5, s));
}

function scoreStudentSpecificity(recommendation, why, evidence) {
  let s = 1;
  const joined = `${recommendation} ${why}`;
  if (evidence.length >= 2) s += 1;
  if (/"/.test(joined) || /\b(calibration|pharmacist|coding club|teach-back|concertmaster|robotics|newspaper|clinic)\b/i.test(joined)) s += 2;
  if (/\b(focus on|importance of|leadership|growth|communication)\b/i.test(joined) && !/"/.test(joined)) s -= 1;
  return Math.max(1, Math.min(5, s));
}

function scoreEvidenceUsefulness(recommendation, why, evidence) {
  let s = 1;
  if (evidence.length >= 2) s += 1;
  if (evidence.some((e) => e.length >= 24)) s += 1;
  const fabricatedRisk = evidence.length >= 2 && !evidence.some((e) => /\b(i|my|we|he|she|they)\b/i.test(e));
  if (fabricatedRisk) s -= 1;
  if (/\b(photography allows me to capture emotions|visual storytelling that has shaped my perspective)\b/i.test(evidence.join(' '))) s -= 2;
  return Math.max(1, Math.min(5, s));
}

function scoreSourceFaithfulness(recommendation, why, evidence) {
  let s = 1;
  if (evidence.length >= 3) s += 2;
  else if (evidence.length >= 2) s += 1;
  if (why.includes('"') || recommendation.includes('"')) s += 1;
  return Math.max(1, Math.min(5, s));
}

function scoreNonRepeatability(recommendation, why) {
  const t = `${recommendation} ${why}`;
  let s = 4;
  if (/\b(your essay is about|this direction works because|this read stays closer|this read centers)\b/i.test(t)) s -= 2;
  if (/\b(generic|best angle|passion|growth|leadership)\b/i.test(t)) s -= 1;
  return Math.max(1, Math.min(5, s));
}

function scoreTemplateScaffoldPenalty(recommendation, why, weaker, stronger) {
  const fields = [recommendation, why, weaker, stronger].map((s) => clean(s));
  const scaffold = fields.filter((f) => /^(your essay is about|this direction works because|this read stays closer|this read centers|what changed when|what became visible)/i.test(f)).length;
  return Math.max(1, Math.min(5, scaffold >= 3 ? 5 : scaffold === 2 ? 4 : scaffold === 1 ? 3 : 1));
}

export function scoreOutput(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);

  const essay_aboutness_clarity = scoreEssayAboutnessClarity(recommendation, why);
  const directional_usefulness = scoreDirectionalUsefulness(recommendation, why);
  const why_quality = scoreWhyQuality(why);
  const coaching_actionability = scoreCoachingActionability(recommendation, why, weaker, stronger);
  const student_specificity = scoreStudentSpecificity(recommendation, why, evidence);
  const evidence_usefulness = scoreEvidenceUsefulness(recommendation, why, evidence);
  const source_faithfulness = scoreSourceFaithfulness(recommendation, why, evidence);
  const non_repeatability = scoreNonRepeatability(recommendation, why);
  const template_scaffold_penalty = scoreTemplateScaffoldPenalty(recommendation, why, weaker, stronger);

  const weighted = (
    essay_aboutness_clarity * 1.3 +
    directional_usefulness * 1.2 +
    why_quality * 1.2 +
    coaching_actionability * 1.2 +
    student_specificity * 1.1 +
    evidence_usefulness * 1.0 +
    source_faithfulness * 0.9 +
    non_repeatability * 0.9 -
    template_scaffold_penalty * 1.1
  ) / 7.7;

  return {
    essay_aboutness_clarity,
    directional_usefulness,
    why_quality,
    coaching_actionability,
    student_specificity,
    evidence_usefulness,
    source_faithfulness,
    non_repeatability,
    template_scaffold_penalty,
    average_effective: Number(weighted.toFixed(2)),
  };
}

export function winnerCall(product, baseline) {
  const dims = [
    'essay_aboutness_clarity',
    'directional_usefulness',
    'why_quality',
    'coaching_actionability',
    'student_specificity',
    'evidence_usefulness',
    'source_faithfulness',
    'non_repeatability',
  ];
  let p = 0;
  let b = 0;
  for (const d of dims) {
    if (product[d] > baseline[d]) p += 1;
    else if (baseline[d] > product[d]) b += 1;
  }
  // lower penalty is better
  if (product.template_scaffold_penalty < baseline.template_scaffold_penalty) p += 1;
  else if (baseline.template_scaffold_penalty < product.template_scaffold_penalty) b += 1;

  return {
    product_points: p,
    openai_points: b,
    winner: p === b ? 'tie' : p > b ? 'product' : 'openai',
    dimensions_evaluated: [...dims, 'template_scaffold_penalty(lower_is_better)'],
  };
}
