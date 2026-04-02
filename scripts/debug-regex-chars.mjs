import fs from 'node:fs';

const frozen = fs.readFileSync('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-openai-only-headtohead.mjs', 'utf-8');
const holdout = fs.readFileSync('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-holdout-v1.mjs', 'utf-8');

function findRegex(src, label) {
  // Look for the evidence filter regex
  const idx = src.indexOf('/^[""]');
  if (idx < 0) {
    console.log(label, ': regex NOT found (looked for /^[""]);');
    // Try to find any quote-filter regex
    const alt = src.indexOf('filter((text)');
    console.log(label, ': filter((text) found at', alt, src.slice(Math.max(0,alt-5), alt+80));
    return;
  }
  const snippet = src.slice(idx, idx + 30);
  console.log(label, ': snippet =', JSON.stringify(snippet));
  for (let i = 0; i < snippet.length; i++) {
    const code = snippet.charCodeAt(i);
    if (code > 127 || code === 34) {
      console.log('  pos', i, '= U+' + code.toString(16).padStart(4,'0'), snippet[i]);
    }
  }
}

findRegex(frozen, 'FROZEN');
findRegex(holdout, 'HOLDOUT');

// Check EvidenceCard
const component = fs.readFileSync('/Volumes/TOSHIBA EXT/College Essay/src/components/firstMinute/InteriorFlowSystem.tsx', 'utf-8');
const ldIdx = component.indexOf('ldquo');
const rdIdx = component.indexOf('rdquo');
console.log('\nEvidenceCard &ldquo;:', ldIdx >= 0, '  &rdquo;:', rdIdx >= 0);

// Check if EvidenceCard has curly quote chars directly
const evIdx = component.indexOf('EvidenceCard');
const evSnippet = component.slice(evIdx, evIdx + 500);
for (let i = 0; i < evSnippet.length; i++) {
  const code = evSnippet.charCodeAt(i);
  if (code > 127) {
    console.log('EvidenceCard char pos', i, '= U+' + code.toString(16).padStart(4,'0'), evSnippet[i]);
  }
}
