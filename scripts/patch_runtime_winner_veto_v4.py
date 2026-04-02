from pathlib import Path


def replace_strict(content: str, old: str, new: str, label: str) -> str:
    if old not in content:
        raise RuntimeError(f"Missing snippet for {label}")
    return content.replace(old, new)

root = Path('/Volumes/TOSHIBA EXT/College Essay')
direction_path = root / 'src/lib/fm/direction.ts'
content = direction_path.read_text()

content = replace_strict(
    content,
    """function ensureConcreteNextMove(nextMove: string): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  return `${normalized} Next step: write 3 lines — moment, decision, immediate result.`;
}

function buildRuntimeCandidates(""",
    """function ensureConcreteNextMove(nextMove: string): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  return `${normalized} Next step: write 3 lines — moment, decision, immediate result.`;
}

function ensurePlainClaimRecommendation(directionLine: string, seedValue: number): string {
  const normalized = normalizeSentence(directionLine);
  const stem = normalized.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim|Center your essay on|Write this around)\s*/i, '').trim();
  const starters = [
    'Your essay should show',
    'Make your main claim that',
    'Center your essay on',
    'Show how',
    'Write this around',
  ] as const;
  const lead = starters[Math.abs(seedValue) % starters.length];

  const needRewrite = !hasPlainClaimSignal(normalized)
    || (TAXONOMY_FORWARD_PATTERN.test(normalized) && !/\b(moment|decision|choice|result|what changed|what you changed)\b/i.test(normalized));

  if (!needRewrite) return normalized;
  if (!stem) return `${lead} one clear claim you can prove from your notes.`;
  return `${lead} ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`;
}

function ensureEssayAboutAddsMeaning(essayAbout: string, recommendation: string, seedValue: number): string {
  const normalized = normalizeSentence(essayAbout);
  const hasMeaningCue = /\b(because|so that|which means|what this reveals|why this matters|this matters because)\b/i.test(normalized);
  const overlap = jaccardOverlap(normalized, recommendation);
  if (overlap < 0.58 || hasMeaningCue) return normalized;

  const addOns = [
    'Why this matters: it tells the reader what changed in your decision standard, not just what happened.',
    'Why this matters: the claim becomes understandable in one read and easier to draft with evidence.',
    'Why this matters: the reader can track moment, decision, and immediate consequence without guessing your point.',
  ] as const;

  return `${normalized} ${addOns[Math.abs(seedValue) % addOns.length]}`;
}

function buildRuntimeCandidates(""",
    'insert recommendation/about guardrail helpers'
)

content = replace_strict(
    content,
    """    return {
      candidate_id,
      family_type: family,
      recommendation_family: family,
      angle_type: family,
      surface_shell_id: shellId,
      shell_penalty_hits: [],
      why_family_type: whyFamily,
      compare_family_type: compareFamily,
      direction_line: diversifiedDirection,
      why_this_direction: ensureComparativeWhy(why_this_direction),
      essay_about: normalizeSentence(essay_about),
      next_move: ensureConcreteNextMove(next_move),
      source_anchor_spans: anchors.slice(0, 4),
      hinge_span: hinge ? trimSnippet(hinge) : null,
    };""",
    """    const plainDirectionLine = ensurePlainClaimRecommendation(diversifiedDirection, seedValue);
    const shapedEssayAbout = ensureEssayAboutAddsMeaning(essay_about, plainDirectionLine, seedValue);

    return {
      candidate_id,
      family_type: family,
      recommendation_family: family,
      angle_type: family,
      surface_shell_id: shellId,
      shell_penalty_hits: [],
      why_family_type: whyFamily,
      compare_family_type: compareFamily,
      direction_line: plainDirectionLine,
      why_this_direction: ensureComparativeWhy(why_this_direction),
      essay_about: shapedEssayAbout,
      next_move: ensureConcreteNextMove(next_move),
      source_anchor_spans: anchors.slice(0, 4),
      hinge_span: hinge ? trimSnippet(hinge) : null,
    };""",
    'wire recommendation/about shaping into candidate output'
)

content = replace_strict(
    content,
    """  const survivors = scored.filter((candidate) => candidate.rejection_reasons.length < 2);
  const rankedSource = survivors.length >= 2 ? survivors : scored;

  const sorted = rankedSource.sort((a, b) => b.scores.total_score - a.scores.total_score);""",
    """  const hardFailReasons = new Set([
    'plain_claim_clarity_fail',
    'why_coaching_clarity_fail',
    'no_concrete_next_step',
    'essay_about_restate_fail',
  ]);
  const hasHardFail = (candidate: RankedRuntimeDirectionCandidate): boolean =>
    candidate.rejection_reasons.some((r) => hardFailReasons.has(r));

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
  const survivors = vetoEligible.filter((candidate) => candidate.rejection_reasons.length < 2);
  const rankedSource = survivors.length >= 2
    ? survivors
    : (vetoEligible.length > 0 ? vetoEligible : scoredAdjusted);

  const sorted = rankedSource.sort((a, b) => b.scores.total_score - a.scores.total_score);""",
    'veto-first survivor set and cross-family shell-sameness penalty'
)

content = replace_strict(
    content,
    """  const hardFailReasons = new Set([
    'plain_claim_clarity_fail',
    'why_coaching_clarity_fail',
    'no_concrete_next_step',
    'essay_about_restate_fail',
  ]);
  const currentTop = diversityAdjusted[0];""",
    """  const currentTop = diversityAdjusted[0];""",
    'remove duplicate hardFailReasons declaration'
)

direction_path.write_text(content)
print('ok')
