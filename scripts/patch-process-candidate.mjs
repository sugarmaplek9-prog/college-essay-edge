import fs from 'fs';

const filePath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
let src = fs.readFileSync(filePath, 'utf8');

// Verify old text is present
const OLD_MARKER = "Name the essay as process redesign and operational thinking, then show why the system fix mattered in";
const OLD_ESSAY_ABOUT = "'This essay is about process redesign: turning a one-off problem into a repeatable system others can rely on.'";

if (!src.includes(OLD_MARKER)) {
  console.error('ERROR: old direction_line marker not found in file');
  process.exit(1);
}
if (!src.includes(OLD_ESSAY_ABOUT)) {
  console.error('ERROR: old essay_about not found in file');
  process.exit(1);
}

console.log('Old text confirmed present. Applying patch...');

// Patch 1: direction_line (the displayed_recommendation)
// Old: single branch using consequenceQ
// New: three branches using turningQ && consequenceQ
src = src.replace(
  `    consequenceQ
      ? \`Name the essay as process redesign and operational thinking, then show why the system fix mattered in \${consequenceQ}.\`
      : 'Tell the story through the system fix you built after the wake-up moment and why it changed outcomes.',`,
  `    turningQ && consequenceQ
      ? \`Name the essay as a standard rebuilt: what \${turningQ} revealed about how you were working, what you changed, and what \${consequenceQ} proved about the new approach.\`
      : turningQ
        ? \`Name the essay as a standard rebuilt: show what \${turningQ} revealed about how you were working, what you changed, and one result that proved it held.\`
        : \`Name the essay as a standard rebuilt: show the specific failure, what changed in how you worked, and the first result that proved it held.\`,`
);

// Patch 2: why_this_direction
src = src.replace(
  `    'This wins when you show how your thinking became repeatable through a better process, not just a one-time fix.',`,
  `    turningQ && consequenceQ
      ? \`This wins because it names the exact failure at \${turningQ} and shows how the rebuilt standard proved itself in \${consequenceQ} — not a generic process story.\`
      : \`This wins when you show the specific failure, the specific change in how you worked, and the first result that proved it was real — not just that you improved.\`,`
);

// Patch 3: essay_about
src = src.replace(
  `    'This essay is about process redesign: turning a one-off problem into a repeatable system others can rely on.',`,
  `    turningQ
      ? \`This essay is about the standard you rebuilt after \${turningQ}: how that failure changed what you required of yourself and what it proved you could do differently.\`
      : 'This essay is about a standard rebuilt: the specific failure, the specific change in approach, and the behavior that proved it stuck.',`
);

// Patch 4: next_move
src = src.replace(
  `    'Start with the failure detail, then show the specific process change and the first result that proved it worked.',`,
  `    'Start inside the failure detail, name the exact thing you changed in how you worked, then show the first result that proved the new standard held.',`
);

// Write
fs.writeFileSync(filePath, src, 'utf8');
console.log('Written.');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const checks = [
  { label: 'new direction_line (turningQ branch)', text: 'standard rebuilt: what ${turningQ}' },
  { label: 'new direction_line (consequenceQ fallback)', text: 'standard rebuilt: show what ${turningQ}' },
  { label: 'new direction_line (bare fallback)', text: 'standard rebuilt: show the specific failure' },
  { label: 'new why_this_direction', text: 'names the exact failure at ${turningQ}' },
  { label: 'new essay_about', text: 'the standard you rebuilt after ${turningQ}' },
  { label: 'new next_move', text: 'Start inside the failure detail' },
];
const gone = [
  { label: 'old direction_line', text: 'process redesign and operational thinking' },
  { label: 'old essay_about', text: 'turning a one-off problem into a repeatable system' },
  { label: 'old why', text: 'how your thinking became repeatable through a better process' },
];

let allOk = true;
checks.forEach(c => {
  if (verify.includes(c.text)) {
    console.log('✓ PRESENT:', c.label);
  } else {
    console.error('✗ MISSING:', c.label);
    allOk = false;
  }
});
gone.forEach(c => {
  if (verify.includes(c.text)) {
    console.error('✗ STILL PRESENT (should be gone):', c.label);
    allOk = false;
  } else {
    console.log('✓ REMOVED:', c.label);
  }
});

if (allOk) {
  console.log('\nPATCH COMPLETE — all checks pass');
} else {
  console.error('\nPATCH INCOMPLETE — some checks failed');
  process.exit(1);
}
