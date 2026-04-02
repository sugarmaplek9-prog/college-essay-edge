
import { writeFileSync, readFileSync } from 'fs';

const filePath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
let content = readFileSync(filePath, 'utf8');

// Strategy: Reduce realization's structural advantage by:
// 1. Increase familyFit weight from 0.06 to 0.14 (make pattern matching critical)
// 2. Reduce essayAboutnessClarity weight from 0.13 to 0.08 (realization is wordy-clear)
// 3. Reduce directionalUsefulness weight from 0.11 to 0.07 (realization frames well)
// 4. Add explicit realization discount outside its primary patterns

const oldFormula = `      coachingActionability * 0.05 +
      nonRepeatability * 0.06 +
      humanPreferenceLikelihood * 0.09 +
      familyFit * 0.06 +
      concreteAnchorRetention * 0.04 +
      hingeClarity * 0.03 +
      individualization * 0.02 +
      coachJudgmentQuality * 0.02 +
      angleDirectness * 0.08 +
      essayAngleNamingQuality * 0.08 +
      caseSpecificityBeyondPivot * 0.08 +
      familyDiversitySurvival * 0.04 +
      ambiguityDecisionHelpfulness * 0.02`;

const newFormula = `      coachingActionability * 0.05 +
      nonRepeatability * 0.06 +
      humanPreferenceLikelihood * 0.09 +
      familyFit * 0.14 +
      concreteAnchorRetention * 0.04 +
      hingeClarity * 0.03 +
      individualization * 0.02 +
      coachJudgmentQuality * 0.02 +
      angleDirectness * 0.08 +
      essayAngleNamingQuality * 0.08 +
      caseSpecificityBeyondPivot * 0.08 +
      familyDiversitySurvival * 0.04 +
      ambiguityDecisionHelpfulness * 0.02`;

if (!content.includes(oldFormula)) {
  console.error('ERROR: Could not find oldFormula');
  process.exit(1);
}

content = content.replace(oldFormula, newFormula);
writeFileSync(filePath, content, 'utf8');
console.log('✓ Increased familyFit weight from 0.06 to 0.14');

// Now reduce essayAboutnessClarity weight
const oldClarity = '      essayAboutnessClarity * 0.13 +';
const newClarity = '      essayAboutnessClarity * 0.08 +';

if (!content.includes(oldClarity)) {
  console.error('ERROR: Could not find oldClarity');
  process.exit(1);
}

content = content.replace(oldClarity, newClarity);
writeFileSync(filePath, content, 'utf8');
console.log('✓ Reduced essayAboutnessClarity weight from 0.13 to 0.08');

// Reduce directionalUsefulness weight
const oldDirectness = '      directionalUsefulness * 0.11 +';
const newDirectness = '      directionalUsefulness * 0.07 +';

if (!content.includes(oldDirectness)) {
  console.error('ERROR: Could not find oldDirectness');
  process.exit(1);
}

content = content.replace(oldDirectness, newDirectness);
writeFileSync(filePath, content, 'utf8');
console.log('✓ Reduced directionalUsefulness weight from 0.11 to 0.07');
