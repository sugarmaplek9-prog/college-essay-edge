from pathlib import Path

path = Path('src/lib/fm/canonicalPage3Payload.ts')
text = path.read_text()
old = """export function buildCanonicalPage3Payload(
  input: BuildCanonicalPage3PayloadInput
): CanonicalPage3Payload {
  const routeDecision = toRouteDecision(input.effectiveProductMode, input.intake, input.evidenceStrength);
  const content = routeDecision.direction_generation_allowed
    ? deriveDirectionContent(input.intake, input.caseState)
    : null;
"""
new = """export function buildCanonicalPage3Payload(
  input: BuildCanonicalPage3PayloadInput
): CanonicalPage3Payload {
  const routeDecision = toRouteDecision(input.effectiveProductMode, input.intake, input.evidenceStrength);
  const preferAmbiguityFallback =
    routeDecision.direction_generation_allowed
    && input.intake.narrative_pattern.primary_pattern === 'unknown'
    && input.intake.recommendation_viability.decision === 'needs_more_input'
    && /\\b(both\\s+matter|which\\s+one|unsure|not\\s+sure|between|split\\s+focus)\\b/i.test(input.rawInput);

  const content = routeDecision.direction_generation_allowed && !preferAmbiguityFallback
    ? deriveDirectionContent(input.intake, input.caseState)
    : null;
"""
if old not in text:
    raise SystemExit('target block not found')
path.write_text(text.replace(old, new))
print('patched canonical fallback preference')
