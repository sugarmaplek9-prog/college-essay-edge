import {
  CASE_DIR,
  createManifest,
  generateReviewerPacket,
  initializeRunFolder,
  loadCases,
  normalizeResults,
  autoScoreHeadToHead,
  generateSummary,
  persistRunArtifacts,
  runBaselineEvaluation,
  runNdsEvaluation,
  validateScoreRecords,
} from '@/lib/ai/evaluation/pack';

async function main(): Promise<void> {
  const cases = loadCases(CASE_DIR);
  if (cases.length < 25) {
    console.error(`Expected at least 25 cases, found ${cases.length}`);
    process.exit(1);
  }

  const manifest = createManifest(cases.length);
  const runDir = initializeRunFolder(manifest);

  const ndsResults = await runNdsEvaluation(cases);
  const baselineResults = await runBaselineEvaluation(cases);
  const normalized = normalizeResults(ndsResults, baselineResults);
  const scores = autoScoreHeadToHead(ndsResults, baselineResults);
  const scoreErrors = validateScoreRecords(scores);
  if (scoreErrors.length > 0) {
    console.error(`Score schema validation failed: ${scoreErrors.join(' | ')}`);
    process.exit(1);
  }

  const summary = generateSummary(cases, scores, ndsResults, baselineResults);
  const { packet, decode } = generateReviewerPacket(cases, normalized, { blind: true });

  persistRunArtifacts({
    runDir,
    ndsResults,
    baselineResults,
    normalizedResults: normalized,
    scores,
    summary,
    reviewerPacket: packet,
    reviewerDecode: decode,
  });

  console.log(`Full evaluation pipeline complete. runDir=${runDir} cases=${cases.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
