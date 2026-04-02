import fs from 'fs';
import path from 'path';

const directionPath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
const content = fs.readFileSync(directionPath, 'utf8');

// Find the postPenaltyTotal calculation and add realizationMisfitPenalty
const originalPostPenaltyCalc = `    const postPenaltyTotal = round(
      prePenaltyTotal -
      translationPenalty * 0.35 -
      templateScaffoldPenalty * 0.4 -
      abstractionPenalty * 0.3 -
      essayAboutRedundancyPenalty * 0.25 -
      familyCollapsePenalty * 0.5 -
      decisionShellPenalty * 0.4 -
      dominantFamilyOverusePenalty * 0.25 -
      contradictionOverusePenalty * 0.4 -
      familyMismatchPenalty * 0.3
    );`;

const newPostPenaltyCalc = `    // Apply realization misfit penalty: penalize when realization has low pattern fit
    const realizationMisfitPenalty = clampScore(
      candidate.family_type === 'realization' && familyFit < 0.8
        ? (0.8 - familyFit) * 0.5
        : 0
    );

    const postPenaltyTotal = round(
      prePenaltyTotal -
      translationPenalty * 0.35 -
      templateScaffoldPenalty * 0.4 -
      abstractionPenalty * 0.3 -
      essayAboutRedundancyPenalty * 0.25 -
      familyCollapsePenalty * 0.5 -
      decisionShellPenalty * 0.4 -
      dominantFamilyOverusePenalty * 0.25 -
      contradictionOverusePenalty * 0.4 -
      familyMismatchPenalty * 0.3 -
      realizationMisfitPenalty * 0.32
    );`;

if (content.includes(originalPostPenaltyCalc)) {
  const newContent = content.replace(originalPostPenaltyCalc, newPostPenaltyCalc);
  fs.writeFileSync(directionPath, newContent, 'utf8');
  console.log('✓ Added realizationMisfitPenalty to postPenaltyTotal');
} else {
  console.error('✗ Could not find postPenaltyTotal calculation to patch');
  process.exit(1);
}
