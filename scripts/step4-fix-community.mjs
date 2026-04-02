import { readFileSync, writeFileSync } from 'node:fs';

const path =
  '/Volumes/TOSHIBA EXT/College Essay/src/lib/ai/modules/narrative-direction-selection/module-executor.ts';

let src = readFileSync(path, 'utf8');

// Fix: the community_care realStory was written with an unescaped apostrophe
// in 'someone else's outcome' — escape it properly in the TS source
src = src.replace(
  "'The clinic is backdrop. The essay is a specific failure of task-level care and the correction that followed when someone else\u2019s outcome made it real.'",
  "'The clinic is backdrop. The essay is a specific failure of task-level care and the correction that followed when someone else\\'s outcome made it real.'"
);
// Also cover the straight-apostrophe variant
src = src.replace(
  "'The clinic is backdrop. The essay is a specific failure of task-level care and the correction that followed when someone else's outcome made it real.'",
  "'The clinic is backdrop. The essay is a specific failure of task-level care and the correction that followed when someone else\\'s outcome made it real.'"
);

// Remove the leftover _PLACEHOLDER_COMMUNITY_CARE_REMOVE line
src = src.replace(/\s+_PLACEHOLDER_COMMUNITY_CARE_REMOVE: '[^']*',\n/, '\n');
// Also cover variant with smart apostrophe inside the value
src = src.replace(/\s+_PLACEHOLDER_COMMUNITY_CARE_REMOVE: '[^']*',\n/, '\n');

writeFileSync(path, src);

const hasBadElse = /else[^\\']\s*s outcome/.test(src);
const hasPlaceholder = src.includes('_PLACEHOLDER_COMMUNITY_CARE_REMOVE');

console.log('apostrophe issue resolved:', !hasBadElse);
console.log('placeholder removed:', !hasPlaceholder);

if (hasBadElse || hasPlaceholder) {
  console.error('FIX INCOMPLETE');
  process.exit(1);
} else {
  console.log('community_care clean');
}
