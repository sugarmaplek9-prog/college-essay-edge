import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─── inline the patterns for local testing ───────────────────
const SELF = [
  /i (got it|handled it|approached it) wrong/i,
  /i made a mistake/i,
  /i mishandled/i,
  /i reacted (badly|poorly)/i,
  /my first instinct was wrong/i,
  /i initially handled/i,
  /i (was corrected|was called out|got feedback)/i,
  /someone (told me|challenged me|pointed out)/i,
  /after (feedback|being told|someone said)/i,
  /i changed (my approach|how i)/i,
  /i adapted my approach/i,
  /i responded differently/i,
  /i adjusted/i,
  /the next time i/i,
  /\b(a|my|the)\s+\w+\s+(told me|asked me|showed me|informed me|pointed out to me)\b/i,
  /i was doing the opposite\b/i,
  /i had not (been|taught|shown|shared|told|helped|included)\b/i,
  /i (rewrote|rebuilt|redesigned|reorganized|reworked|restructured) (the|my|our|a)\b/i,
];
const SCENE = [
  /\bwhen\b/i,
  /\bafter\b/i,
  /\bduring\b/i,
  /that (moment|day|session|round|shift|conversation)/i,
  /my (coach|mentor|teacher|partner|teammate|patient|customer|director|advisor|counselor|librarian|principal|colleague|manager|boss) (said|told|asked|pulled|called|showed|sent|gave)\b/i,
  /\b(a|the)\s+(coach|mentor|teacher|nurse|advisor|counselor|parent|librarian|principal|colleague|manager|boss|director) (told|asked|said|showed|pulled|called)\b/i,
  /i said/i,
  /i did/i,
  /the (match|round|call|rehearsal|shift|experiment|clinic|session|tournament)/i,
  /room \d+/i,
  /asked (me|for me) by name/i,
];
const FAIL = [
  /the (data|result|experiment|project) (was|showed|revealed) (wrong|flat|failed|unexpected)/i,
  /my hypothesis was wrong/i,
  /the failure (taught|showed|revealed)/i,
  /if (the first attempt|it) had (worked|succeeded)/i,
  /the mistake (was|became) the (condition|thing) that/i,
  /i (redesigned|rebuilt|restarted)/i,
  /i (never would have found|would have missed)/i,
  /i (built|created|designed|wrote|developed) a (drill|system|method|process|approach|practice)\b/i,
  /\w+\s+students?\s+(at|in|from) my (school|class|program|team) (now use|use|adopted|started using)\b/i,
  /all of them required (me to|switching|a)\b/i,
  /i looked at every .{0,40}(i missed|that failed|that was wrong)/i,
];
const RESP = [
  /i (realized|noticed) (that )?i (had been|was) (removing|excluding|not including)/i,
  /solving (it|the problem) alone (was|started)/i,
  /i had been (making|taking) decisions (without|alone|by myself)/i,
  /i brought (the team|everyone|others) in/i,
  /i stopped (doing it|solving it) alone/i,
  /i (asked for|invited|included) (help|others|the team)/i,
  /i (was not|wasn.t) letting (others|them|the team)/i,
  /i (advocated|fought|pushed|stood up|spoke up) for (myself|my own|my (own )?placement)\b/i,
  /i (refused to leave|stayed until|sat outside)\b/i,
  /i (wrote|created|drafted) a (document|letter|one-page|note|formal)\b/i,
  /i (waited|sat|stayed) (outside|in front of|at|near|by)\s+the\b/i,
];

const cases = [
  {
    id: 'HO_01',
    text: 'Software mentor. I was the only person on the team who knew how to fix the memory leak in our codebase. I fixed it in ten minutes the first time it happened. A junior teammate was stuck on it for two days before I stepped in and fixed it again. My advisor asked why I had not taught my teammate instead. I did not have a good answer. I rewrote the documentation and ran a code review session for the whole team the next week.',
  },
  {
    id: 'HO_02',
    text: 'Library reading program. I started a Saturday reading program at the public library for middle schoolers. Attendance was good the first month. Then it dropped by half. A parent told me her daughter stopped coming because the books were too hard. I split the group by reading level the next week. Attendance came back. My original goal was to help kids love reading. I was doing the opposite.',
  },
  {
    id: 'HO_05',
    text: 'Math competition. I scored in the bottom quarter of my regional math team twice in a row. I looked at every problem I missed. All of them required switching between algebra and geometry mid-problem. I built a drill where you start a problem using one method and finish it using another. Twelve students at my school now use it before competitions.',
  },
  {
    id: 'HO_08',
    text: 'ESL class misplacement. My high school placed me in ESL class even though I had spoken English at home since age seven. I asked my counselor to move me. She said the placement was based on my last name. I wrote a one-page document showing my standardized test scores and sat outside her office every day for a week. She changed my schedule on Friday.',
  },
];

function hits(text, patterns) {
  return patterns.filter((p) => p.test(text));
}
function inferStrength(scenHits, signalHits) {
  if (signalHits === 0 && scenHits === 0) return 'none';
  if (signalHits >= 4 && scenHits >= 3) return 'high';
  if (signalHits >= 2 && scenHits >= 1) return 'medium';
  if (signalHits >= 1 || scenHits >= 2) return 'low';
  return 'none';
}

for (const c of cases) {
  const t = c.text;
  const selfM = hits(t, SELF);
  const scenM = hits(t, SCENE);
  const failM = hits(t, FAIL);
  const respM = hits(t, RESP);
  const maxHits = Math.max(selfM.length, failM.length, respM.length);
  const strength = inferStrength(scenM.length, maxHits);
  console.log(`\n=== ${c.id} ===`);
  console.log(`  self=${selfM.length} scene=${scenM.length} fail=${failM.length} resp=${respM.length} -> maxHits=${maxHits} -> ${strength}`);
  if (selfM.length) console.log('  SELF:', selfM.map((p) => p.toString().slice(0, 60)).join(' | '));
  if (scenM.length) console.log('  SCENE:', scenM.map((p) => p.toString().slice(0, 60)).join(' | '));
  if (failM.length) console.log('  FAIL:', failM.map((p) => p.toString().slice(0, 60)).join(' | '));
  if (respM.length) console.log('  RESP:', respM.map((p) => p.toString().slice(0, 60)).join(' | '));
}