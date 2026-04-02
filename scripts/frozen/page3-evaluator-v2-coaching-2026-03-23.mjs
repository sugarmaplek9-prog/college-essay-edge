// ─────────────────────────────────────────────────────────────────────────────
// PAGE3 EVALUATOR V2 — COACHING-FIRST SCORING (2026-03-23)
//
// The v1 evaluator over-weighted structural evidence anchoring (evidence lines
// cited, quotes present) and gave no credit for whether the output actually
// told the student what their essay is ABOUT or why the direction matters.
//
// Human blind review of v1 output: OpenAI 12 — Product 0.
// Humans preferred the side that explained the essay's meaning, not just which
// quote to use. V2 corrects for this by adding:
//
//   directional_usefulness   — does the output name what the essay is ABOUT?
//   why_quality              — does the "why" explain why this direction makes
//                              a compelling essay, not just identify a quote?
//   coaching_actionability   — can the student immediately start writing from
//                              this output? Does it give them a move?
//
// Evidence dimensions are retained but no longer dominant. The weighted score
// treats coaching force and directional clarity as co-equal to evidence fidelity.
//
// Do not modify scoring logic without creating a new frozen snapshot file.
// ─────────────────────────────────────────────────────────────────────────────

export const EVALUATOR_VERSION = 'v2-coaching-2026-03-23';

export function clean(v) {
  return (v ?? '').replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION: directional_usefulness
// Does the recommendation tell the student what their essay is ABOUT?
// Penalizes structural instructions ("Use the hinge '...'") when they
// don't also convey the essay's thematic claim.
// ─────────────────────────────────────────────────────────────────────────────
function scoreDirectionalUsefulness(recommendation, why) {
  const text = `${recommendation} ${why}`;
  let score = 1;

  // Thematic claim signals — these indicate the output names what the essay IS
  const thematicClaim = /\b(essay is about|this is about|the essay lives|what changed|the gap between|the moment|your understanding|your standard|what you found|what it revealed|what became clear|turned out to be wrong|responsible for|judgment call)\b/i.test(text);
  if (thematicClaim) score += 2;

  // Explains the "so what" of the narrative pattern
  const essayMeaning = /\b(not just|not a general|specific to|harder than|more specific than|can't un-know|impossible to fake|gap|distinction|tension|judgment)\b/i.test(text);
  if (essayMeaning) score += 1;

  // Penalize pure structural instructions without thematic claim
  const structuralOnly = /^(use the hinge|build from the chain|center the scene|frame the direction|start in)/i.test(recommendation);
  if (structuralOnly && !thematicClaim) score -= 2;

  // Penalize generic theme labels
  const genericTheme = /\b(advocacy|persistence|leadership|growth|resilience|teamwork|self-discovery|passion)\b/i.test(recommendation);
  if (genericTheme && !thematicClaim) score -= 1;

  return Math.max(1, Math.min(5, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION: why_quality
// Does the "why this direction" explain WHY this makes a compelling essay,
// not just WHY this quote is structurally correct?
// ─────────────────────────────────────────────────────────────────────────────
function scoreWhyQuality(why) {
  if (!why || why === '(none)' || why.trim().length < 10) return 1;
  let score = 1;

  // Explains the essay-level value of the direction
  const essayValue = /\b(works because|compelling because|strongest because|specific to|can't be faked|hard to fake|gap between|specific situation|particular judgment|distinction|reveals|reframes|non-generic|impossible to generalize|harder and more)\b/i.test(why);
  if (essayValue) score += 2;

  // Names a contrast between surface and depth
  const contrastSignal = /\b(not just|not a general|more than|beyond|rather than|instead of|versus|the difference)\b/i.test(why);
  if (contrastSignal) score += 1;

  // Penalize "this wins when the reader can see" — structural not coaching
  const structuralWhy = /^this wins when the reader can see/i.test(why);
  if (structuralWhy) score -= 2;

  // Penalize generic "emphasizing X showcases Y" pattern
  const genericShowcase = /\b(showcases?|highlights?|emphasiz(es?|ing)|demonstrates?|underscores?)\b/i.test(why);
  const genericTarget = /\b(personal growth|maturity|resilience|leadership|self-awareness|problem.solving skills|critical thinking)\b/i.test(why);
  if (genericShowcase && genericTarget) score -= 2;

  // Penalize "fostering X leads to Y" abstraction
  const abstractCausal = /\b(fosters?|promotes?|cultivates?|builds)\b.{0,40}\b(skills|growth|understanding|thinking)\b/i.test(why);
  if (abstractCausal) score -= 1;

  return Math.max(1, Math.min(5, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSION: coaching_actionability
// Can the student immediately start writing from this output?
// Does it give them a concrete next move, not just a theme label?
// ─────────────────────────────────────────────────────────────────────────────
function scoreCoachingActionability(recommendation, why, weaker, stronger) {
  const text = `${recommendation} ${why} ${weaker} ${stronger}`;
  let score = 1;

  // Has a specific next-draft move or structural instruction with context
  const draftMove = /\b(start with|open with|write the|anchor the|build from|trace the decision|prove the consequence|name the moment|show one|keep these|next move)\b/i.test(text);
  if (draftMove) score += 1;

  // Weaker/stronger reads exist and are distinct (signal that output has coaching depth)
  const hasWeakerStronger = weaker && stronger && weaker !== '(none)' && stronger !== '(none)';
  if (hasWeakerStronger) score += 1;

  // Weaker/stronger reads describe the essay's actual interpretive spectrum
  const interpretiveWeaker = /\b(stays closer to setup|closer to summary|without the shift|without naming|generic|just the context|surface level|just describes)\b/i.test(weaker ?? '');
  const interpretiveStronger = /\b(centers the hinge|names the shift|specific|non-generic|anchored|concrete|shows the move|visible)\b/i.test(stronger ?? '');
  if (interpretiveWeaker && interpretiveStronger) score += 1;

  // Penalize generic weaker/stronger that just restate the theme
  const genericWeaker = /\b(rushing|describing the situation|without emotional context|focuses on the negative)\b/i.test(weaker ?? '');
  const genericStronger = /\b(fostering|promoting|emphasizing|highlights the value|showcasing)\b/i.test(stronger ?? '');
  if (genericWeaker && genericStronger) score -= 2;

  return Math.max(1, Math.min(5, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// RETAINED DIMENSIONS (from v1, weights adjusted)
// ─────────────────────────────────────────────────────────────────────────────
function scoreSourceFaithfulness(recommendation, why, evidence) {
  let score = 1;
  if (evidence.length >= 3) score += 2;
  else if (evidence.length >= 2) score += 1;
  if (why.includes('"') || recommendation.includes('"')) score += 1;
  // Penalize fabricated evidence (claims not traceable to student text)
  const noStudentTextSignal = evidence.length >= 3 && !evidence.some(e => e.length > 20);
  if (noStudentTextSignal) score -= 1;
  return Math.max(1, Math.min(5, score));
}

function scoreNonRepeatability(recommendation, why) {
  const merged = `${recommendation} ${why}`;
  const genericPhrase = /\b(best angle|connect .* values|admissions|demonstrates leadership|growth|resilience|journey|passionate about)\b/i.test(merged);
  let score = genericPhrase ? 2 : 4;
  // Reward specificity to this student's actual situation
  const situationSpecific = /\b(calibration|pharmacist|coding club|teach-back|bus stop|halftime|kiosk|history day)\b/i.test(merged);
  if (situationSpecific) score = Math.min(5, score + 1);
  return Math.max(1, Math.min(5, score));
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCORER
// ─────────────────────────────────────────────────────────────────────────────
export function scoreOutput(output) {
  const recommendation = clean(output?.displayed_recommendation);
  const why = clean(output?.why_this_direction);
  const weaker = clean(output?.weaker_read);
  const stronger = clean(output?.stronger_read);
  const evidence = (output?.evidence_lines ?? []).map(clean).filter(Boolean);

  // --- Three new coaching dimensions ---
  const directionalUsefulness = scoreDirectionalUsefulness(recommendation, why);
  const whyQuality = scoreWhyQuality(why);
  const coachingActionability = scoreCoachingActionability(recommendation, why, weaker, stronger);

  // --- Two retained evidence dimensions ---
  const sourceFaithfulness = scoreSourceFaithfulness(recommendation, why, evidence);
  const nonRepeatability = scoreNonRepeatability(recommendation, why);

  // --- Weighted average ---
  // Coaching dimensions: 3 × weight 1.5 = 4.5
  // Evidence dimensions: 2 × weight 1.0 = 2.0
  // Total weight: 6.5
  const weightedSum =
    directionalUsefulness * 1.5 +
    whyQuality * 1.5 +
    coachingActionability * 1.5 +
    sourceFaithfulness * 1.0 +
    nonRepeatability * 1.0;

  const averageEffective = Number((weightedSum / 6.5).toFixed(2));

  return {
    directional_usefulness: directionalUsefulness,
    why_quality: whyQuality,
    coaching_actionability: coachingActionability,
    source_faithfulness: sourceFaithfulness,
    non_repeatability: nonRepeatability,
    average_effective: averageEffective,
    // v1 compat shim — expose so runner can still compute winner on named dims
    _v1_compat: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// WINNER CALL
// Winner is decided on 5 dimensions. Coaching dims each count once.
// ─────────────────────────────────────────────────────────────────────────────
export function winnerCall(product, baseline) {
  const dims = [
    'directional_usefulness',
    'why_quality',
    'coaching_actionability',
    'source_faithfulness',
    'non_repeatability',
  ];
  let p = 0;
  let b = 0;
  for (const d of dims) {
    if (product[d] > baseline[d]) p += 1;
    else if (baseline[d] > product[d]) b += 1;
  }
  return {
    product_points: p,
    openai_points: b,
    winner: p === b ? 'tie' : p > b ? 'product' : 'openai',
    dimensions_evaluated: dims,
  };
}
