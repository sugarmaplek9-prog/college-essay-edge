from pathlib import Path

path = Path('src/lib/fm/canonicalPage3Payload.ts')
text = path.read_text()
orig = text


def replace_once(old: str, new: str, label: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'missing block: {label}')
    text = text.replace(old, new, 1)


replace_once(
    "  const routeDecision = toRouteDecision(input.effectiveProductMode, input.intake, input.evidenceStrength);\n  const preferAmbiguityFallback =",
    "  const routeDecision = toRouteDecision(input.effectiveProductMode, input.intake, input.evidenceStrength);\n  const preservedSourceFragments = collectPreservedSourceFragments(input.rawInput);\n  const preservedAnchorTerms = collectPreservedAnchorTerms(input.rawInput);\n  const rawFeatureCountForRecovery = preservedSourceFragments.length + preservedAnchorTerms.length;\n  const rawWordCount = input.rawInput.trim().split(/\\s+/).filter(Boolean).length;\n  const preferAmbiguityFallback =",
    'insert-precompute',
)

replace_once(
    "  const content = routeDecision.direction_generation_allowed && !preferAmbiguityFallback\n    ? deriveDirectionContent(input.intake, input.caseState)\n    : null;",
    "  const unknownCompareCue = /\\b(both\\s+matter|which\\s+one|unsure|not\\s+sure|between|split\\s+focus|either|compare|vs\\.?|or)\\b/i.test(input.rawInput);\n  const unknownRecoveryCandidateAllowed =\n    !routeDecision.direction_generation_allowed\n    && input.intake.narrative_pattern.primary_pattern === 'unknown'\n    && rawWordCount >= 14\n    && (unknownCompareCue || rawFeatureCountForRecovery >= 3);\n\n  const recommendationContent = routeDecision.direction_generation_allowed && !preferAmbiguityFallback\n    ? deriveDirectionContent(input.intake, input.caseState)\n    : null;\n\n  const debugContent = recommendationContent\n    ?? (unknownRecoveryCandidateAllowed ? deriveDirectionContent(input.intake, input.caseState) : null);",
    'split-content',
)

replace_once(
    "  const winner = content?.candidate_pack?.find((candidate) => candidate.selected) ?? content?.candidate_pack?.[0] ?? null;",
    "  const winner = debugContent?.candidate_pack?.find((candidate) => candidate.selected) ?? debugContent?.candidate_pack?.[0] ?? null;",
    'winner',
)
replace_once(
    "  const runnerUp = content?.candidate_pack?.find((candidate) => !candidate.selected) ?? content?.candidate_pack?.[1] ?? null;",
    "  const runnerUp = debugContent?.candidate_pack?.find((candidate) => !candidate.selected) ?? debugContent?.candidate_pack?.[1] ?? null;",
    'runner-up',
)
replace_once(
    "  const winnerBeforeReweight = content?.candidate_pack\n    ? [...content.candidate_pack].sort((a, b) => (b.scores.pre_penalty_total ?? b.scores.total_score) - (a.scores.pre_penalty_total ?? a.scores.total_score))[0] ?? null\n    : null;",
    "  const winnerBeforeReweight = debugContent?.candidate_pack\n    ? [...debugContent.candidate_pack].sort((a, b) => (b.scores.pre_penalty_total ?? b.scores.total_score) - (a.scores.pre_penalty_total ?? a.scores.total_score))[0] ?? null\n    : null;",
    'winner-before-reweight',
)
replace_once(
    "  const rawFeatureCount = collectPreservedSourceFragments(input.rawInput).length + collectPreservedAnchorTerms(input.rawInput).length;",
    "  const rawFeatureCount = rawFeatureCountForRecovery;",
    'raw-feature-count',
)
replace_once(
    "  const ambiguityFallback = (!content || !winner) && input.intake.narrative_pattern.primary_pattern === 'unknown'",
    "  const ambiguityFallback = (!recommendationContent || !winner) && input.intake.narrative_pattern.primary_pattern === 'unknown'",
    'ambiguity-fallback',
)
replace_once(
    "      preserved_source_fragments: collectPreservedSourceFragments(input.rawInput),",
    "      preserved_source_fragments: preservedSourceFragments,",
    'preserved-fragments',
)
replace_once(
    "      preserved_anchor_terms: collectPreservedAnchorTerms(input.rawInput),",
    "      preserved_anchor_terms: preservedAnchorTerms,",
    'preserved-terms',
)
replace_once(
    "      displayed_recommendation: content?.strongest.title ?? ambiguityFallback?.displayed_recommendation ?? '',",
    "      displayed_recommendation: recommendationContent?.strongest.title ?? ambiguityFallback?.displayed_recommendation ?? '',",
    'packet-display',
)
replace_once(
    "      essay_about: content?.strongest.essay_about ?? ambiguityFallback?.essay_about ?? '',",
    "      essay_about: recommendationContent?.strongest.essay_about ?? ambiguityFallback?.essay_about ?? '',",
    'packet-about',
)
replace_once(
    "        content?.strongest.why_beats_obvious ?? content?.strongest.explanation ?? ambiguityFallback?.why_this_direction ?? '',",
    "        recommendationContent?.strongest.why_beats_obvious ?? recommendationContent?.strongest.explanation ?? ambiguityFallback?.why_this_direction ?? '',",
    'packet-why',
)
replace_once(
    "      weaker_read: content?.coach_comparison.weaker_read ?? ambiguityFallback?.weaker_read ?? '',",
    "      weaker_read: recommendationContent?.coach_comparison.weaker_read ?? ambiguityFallback?.weaker_read ?? '',",
    'packet-weaker',
)
replace_once(
    "      stronger_read: content?.coach_comparison.stronger_read ?? ambiguityFallback?.stronger_read ?? '',",
    "      stronger_read: recommendationContent?.coach_comparison.stronger_read ?? ambiguityFallback?.stronger_read ?? '',",
    'packet-stronger',
)
replace_once(
    "      first_coaching_step: content?.strongest.next_move ?? content?.strongest.write_first_steps?.[0] ?? ambiguityFallback?.first_coaching_step ?? null,",
    "      first_coaching_step: recommendationContent?.strongest.next_move ?? recommendationContent?.strongest.write_first_steps?.[0] ?? ambiguityFallback?.first_coaching_step ?? null,",
    'packet-step',
)
replace_once(
    "      candidates_generated: content?.candidate_pack?.length ?? 0,",
    "      candidates_generated: debugContent?.candidate_pack?.length ?? 0,",
    'debug-count',
)
replace_once(
    "        content?.candidate_pack?.map((candidate) => ({",
    "        debugContent?.candidate_pack?.map((candidate) => ({",
    'debug-map',
)

if text == orig:
    raise SystemExit('no-op edit')

path.write_text(text)
print('patched canonical payload shadow candidates')
