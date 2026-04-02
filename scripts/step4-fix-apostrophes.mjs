import { readFileSync, writeFileSync } from 'node:fs';

const path =
  '/Volumes/TOSHIBA EXT/College Essay/src/lib/ai/modules/narrative-direction-selection/module-executor.ts';

let src = readFileSync(path, 'utf8');

// Fix all unescaped apostrophes in single-quoted TypeScript string literals.
// Strategy: for each problematic string, replace the straight apostrophe
// (which breaks the TS string) with the escaped form \'.

const fixes: [string, string][] = [
  // peer_teaching coreClaim: "student's" and "wasn't"
  [
    "A story about the moment the student's method stopped working — and they had to ask why the other person still wasn't getting it.'",
    "A story about the moment the student\\'s method stopped working — and they had to ask why the other person still wasn\\'t getting it.'",
  ],
  // technical_leadership whyBeatsObvious: "builder's role"
  [
    "This angle shows how the builder's role changed",
    "This angle shows how the builder\\'s role changed",
  ],
  // service_operations (double check - no apostrophes expected, but let's cover it)
  // athletic_recovery: "student redefined what it means to matter to a team."
  // Looks clean already.
  // other: none expected
];

let anyFixed = false;
for (const [from, to] of fixes) {
  if (src.includes(from)) {
    src = src.replace(from, to);
    anyFixed = true;
    console.log('fixed:', from.slice(0, 60));
  }
}

writeFileSync(path, src);

// Final verification: check for any remaining unescaped apostrophe patterns
// inside single-quoted strings (the pattern: single-quote starts a string,
// then a word with apostrophe-s appears, then continues without backslash)
const problematicPattern = /'[^']*[a-z]'[st][^'\\].*'/;
const lines = src.split('\n');
const issues: string[] = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Only check lines that look like string assignments and contain apostrophes
  if (line.includes("'") && line.match(/[a-z]'[st]/)) {
    // Skip lines where the apostrophe is properly escaped
    if (!line.match(/[a-z]\\'/)) {
      issues.push(`  line ${i + 1}: ${line.trim().slice(0, 100)}`);
    }
  }
}

if (issues.length > 0) {
  console.log('\nPotential remaining apostrophe issues:');
  issues.forEach((l) => console.log(l));
} else {
  console.log('\nNo remaining apostrophe issues detected.');
}

console.log('Done. File length:', src.length);
