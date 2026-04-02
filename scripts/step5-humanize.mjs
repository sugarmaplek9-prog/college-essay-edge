import { readFileSync, writeFileSync } from 'node:fs';

const path =
  '/Volumes/TOSHIBA EXT/College Essay/src/lib/ai/modules/narrative-direction-selection/module-executor.ts';

let src = readFileSync(path, 'utf8');

// ── 1. Update type annotation: remove notThis, add nextMoveConnector ──────────
src = src.replace(
  `      angleTitle: string;\n      notThis: string;\n      coreClaim: string;\n      realStory: string;\n      studentReveal: string;\n      whyBeatsObvious: string;\n      obviousAngle: string;\n      risk: string;\n      nextMove: string;`,
  `      angleTitle: string;\n      coreClaim: string;\n      realStory: string;\n      studentReveal: string;\n      whyBeatsObvious: string;\n      obviousAngle: string;\n      risk: string;\n      nextMove: string;\n      nextMoveConnector: string;`
);

// ── 2. Replace the entire domainFrame content ─────────────────────────────────
const newDomainFrame = `    debate_conflict: {
      angleTitle:
        'When being right in the argument became the problem',
      coreClaim:
        'Most debate essays prove argument skill. This one should show the moment skill became the problem — and what the student did once they stopped leading with it.',
      realStory:
        'The conflict itself is not the interesting part. The essay is about the moment feedback changed how the student was operating in the room.',
      studentReveal:
        'It shows that the student can absorb feedback in the middle of a conflict and change how they are handling it — without shutting down or digging in.',
      whyBeatsObvious:
        'An essay about argument skill stays at the surface. This version goes to the correction — a less obvious and more interesting story.',
      obviousAngle: 'leadership/communication traits without a real revision moment',
      risk:
        'If written too generally, this collapses into a teamwork essay instead of a scene-driven story about changed behavior.',
      nextMove:
        'Start with the moment feedback landed. Then write the next interaction where your behavior is visibly different. Cut everything that does not show the shift.',
      nextMoveConnector: 'Keep returning to',
    },
    community_care: {
      angleTitle:
        'The moment in clinic volunteering when tasks stopped being enough',
      coreClaim:
        'The volunteering itself is not the subject. The essay is the moment the student realized that doing the task correctly still was not helping — and had to figure out why.',
      realStory:
        'The clinic is not the subject. The essay is a specific moment when the student\\'s approach to care was wrong — and they had to change it because another person\\'s outcome depended on it.',
      studentReveal:
        'It shows that the student can notice when good intentions are not translating into actual help — and adjust before the other person carries the cost.',
      whyBeatsObvious:
        'A service essay describes what the student did and how it felt. This version goes to the moment understanding changed — a narrower and more specific story.',
      obviousAngle: 'service leadership framed as generic compassion',
      risk:
        'If written as values language without concrete moments, it will read as polished service branding rather than earned insight.',
      nextMove:
        'Build the draft around one interaction: first how you handled it, then what you changed. The essay is the gap between those two moments.',
      nextMoveConnector: "The essay\\'s real center is",
    },
    peer_teaching: {
      angleTitle:
        'The tutoring session where the method stopped working',
      coreClaim:
        'The essay is not about tutoring well. It is about the moment the student\\'s approach stopped working — and what they figured out once they paid attention to why.',
      realStory:
        'Tutoring without a failure in it is just content delivery. The essay is the gap between the explanation that did not work and the approach that did.',
      studentReveal:
        'It shows that the student noticed when their method was not working — and treated that as a problem to solve rather than a limitation of the other person.',
      whyBeatsObvious:
        'Academic support essays describe the helper. This one describes the moment the student realized they were wrong about what help looked like.',
      obviousAngle: 'academic leadership with generic growth language',
      risk:
        'If the essay stays at lesson-level description, it becomes instructional rather than personal and strategic.',
      nextMove:
        'Write the two sessions back to back: first where your approach missed, then where you adjusted and it worked. The essay is the distance between them.',
      nextMoveConnector: 'Keep it grounded in',
    },
    technical_leadership: {
      angleTitle:
        'When solving it alone started hurting the team',
      coreClaim:
        'The robotics project is the setting. The essay is about the moment the student\\'s instinct — handling it alone — started costing the team. What changed after that is the real subject.',
      realStory:
        'The interesting part is not the technical work. It is the moment the student recognized that solving problems alone was making the team weaker — and changed how they operated.',
      studentReveal:
        'It shows that the student can recognize when their own competence is becoming a problem for others — and adjust without waiting to be asked.',
      whyBeatsObvious:
        'An achievement essay focuses on what got built. This version focuses on how the student\\'s role in the team changed — a more specific and less predictable story.',
      obviousAngle: 'problem-solving excellence as a static trait',
      risk:
        'If written as an accomplishment sequence, it loses the pivot that makes the essay meaningful.',
      nextMove:
        'Keep the focus on the team moment, not the technical solution. Write the decision where your first approach was not working, then show what you changed and what it produced.',
      nextMoveConnector: 'The pivot point is',
    },
    research_failure: {
      angleTitle:
        'When failing the experiment changed how the student thinks',
      coreClaim:
        'This is not about the experiment failing. It is about how the student thought through the failure — what they changed in their method and why that was harder than the original work.',
      realStory:
        'Losing the competition is not the story. The essay is about the student who revised their methodology after feedback — not just their attitude after the loss.',
      studentReveal:
        'It shows that the student responds to failure by asking what went wrong in the method — not by reframing the outcome.',
      whyBeatsObvious:
        'A resilience essay describes the emotional arc of recovering. This version describes the reasoning inside it — a more precise and less common story.',
      obviousAngle: 'resilience story with generic bounce-back language',
      risk:
        'If the draft centers on winning or losing, the essay becomes predictable and misses the shift in how the student now approaches problems.',
      nextMove:
        'Do not start with the competition result. Start with the decision that did not hold up. Write what you changed after feedback, then show how that shift affects how you work now.',
      nextMoveConnector: 'Build the draft around',
    },
    service_operations: {
      angleTitle:
        'When moving fast caused the problem and the student had to adjust',
      coreClaim:
        'This is not about working hard under pressure. It is about the moment speed became the problem — and the student had to slow down and figure out what the situation actually needed.',
      realStory:
        'Getting through the work quickly is expected. The essay is the moment that approach caused a problem — and what the student did differently after that.',
      studentReveal:
        'It shows that the student can recognize when efficiency is making things worse — and shift from moving quickly to actually reading the situation.',
      whyBeatsObvious:
        'A work-ethic essay proves you show up and push through. This one asks what happened when pushing through was not enough — which is the more interesting question.',
      obviousAngle: 'hard-working responsibility narrative',
      risk:
        'If written as a workload summary, it reads like a résumé entry rather than a story about changed judgment.',
      nextMove:
        'Start with the moment your first approach made things harder. Write what you noticed, what you changed, and what the outcome was.',
      nextMoveConnector: 'Stay close to',
    },
    athletic_recovery: {
      angleTitle:
        'After the injury: finding a different way to contribute',
      coreClaim:
        'This is not an injury story. It is about how the student found a different way to matter to the team once performance was no longer available.',
      realStory:
        'The physical return is not the interesting part. The essay is the period before it — when the student had to figure out how to contribute without tying it to their own performance.',
      studentReveal:
        'It shows that the student can redefine what it means to participate in a team — moving from personal performance to something less focused on themselves.',
      whyBeatsObvious:
        'A perseverance essay centers on the comeback. This one centers on what changed in the student\\'s understanding of participation before the comeback — a less common and more revealing version of the story.',
      obviousAngle: 'motivation and grit as abstract traits',
      risk:
        'If written as an inspirational arc, it will feel generic and the reader will not learn anything specific about how this student thinks.',
      nextMove:
        'Write the moment when your previous way of contributing was no longer available. Then write one scene after that — where you were participating in a different way.',
      nextMoveConnector: 'The underlying subject is',
    },
    other: {
      angleTitle:
        'The moment the student corrected course and what changed after',
      coreClaim:
        'Do not start with the accomplishment. Start at the moment the student recognized something was wrong and changed course — and stay close to what happened next.',
      realStory:
        'Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real.',
      studentReveal:
        'It shows a student who can identify where they got it wrong and demonstrate that the correction held.',
      whyBeatsObvious:
        'Leadership framing describes a trait. The correction angle shows one specific moment where judgment changed — which is more concrete and easier to believe.',
      obviousAngle: 'general leadership/growth framing',
      risk:
        'If the essay describes character without a concrete moment of correction, it loses the specificity that makes it work.',
      nextMove:
        'Write the moment you got it wrong. Then write the next moment where your corrected approach is visible. Keep only what proves the change was real.',
      nextMoveConnector: 'The anchor is',
    },`;

// Match from the first domain through the closing of the object
const domainFrameStart = '    debate_conflict: {';
const domainFrameEnd = "      nextMove:\n        'Write the moment of correction and one later moment proving the correction held under pressure.',\n    },\n  };";

const startIdx = src.indexOf(domainFrameStart);
const endIdx = src.indexOf(domainFrameEnd);

if (startIdx === -1) throw new Error('Could not find domainFrame start');
if (endIdx === -1) throw new Error('Could not find domainFrame end');

src = src.slice(0, startIdx) + newDomainFrame + '\n  };' + src.slice(endIdx + domainFrameEnd.length);

// ── 3. Add interpretiveFocus variable before the return statement ─────────────
src = src.replace(
  `  return {\n    status: 'success',\n    best_direction: {`,
  `  const interpretiveFocus = interpretiveOpportunity.startsWith('Frame the essay around ')\n    ? interpretiveOpportunity.slice('Frame the essay around '.length)\n    : interpretiveOpportunity;\n\n  return {\n    status: 'success',\n    best_direction: {`
);

// ── 4. Update the three generation lines ─────────────────────────────────────
src = src.replace(
  `      why_it_beats_the_obvious_angle:\n        \`The obvious angle: \${selectedFrame.obviousAngle}. \${selectedFrame.whyBeatsObvious}\`,\n      main_risk_if_written_poorly: selectedFrame.risk,\n      next_move: \`\${selectedFrame.nextMove} Use this interpretive test: \${interpretiveOpportunity}\`,`,
  `      why_it_beats_the_obvious_angle: selectedFrame.whyBeatsObvious,\n      main_risk_if_written_poorly: selectedFrame.risk,\n      next_move: \`\${selectedFrame.nextMove} \${selectedFrame.nextMoveConnector} \${interpretiveFocus}\`,`
);

writeFileSync(path, src);
console.log('✓ step5-humanize done — file length:', src.length);

// ── Sanity checks ─────────────────────────────────────────────────────────────
const checks = [
  ['notThis removed from type', !src.includes('notThis: string;')],
  ['nextMoveConnector in type', src.includes('nextMoveConnector: string;')],
  ['debate anti-pattern A gone', !src.includes('That is not a debater. That is a person.')],
  ['debate anti-pattern A gone (technical)', !src.includes('That is leadership you can show, not just claim.')],
  ['research anti-pattern A gone', !src.includes('That is what evidence-based thinking looks like before graduate school')],
  ['athletic anti-pattern A gone', !src.includes('Not perseverance. Identity work.')],
  ['other anti-pattern A gone', !src.includes('Everything before it is setup. Everything after it is proof.')],
  ['peer anti-pattern B gone', !src.includes('use that discomfort as a diagnostic')],
  ['technical anti-pattern B gone', !src.includes('subordinate technical confidence')],
  ['realStory Not-X-Not-Y gone', !src.includes('Not the argument. Not who won.')],
  ['whyBeats no prefix anymore', !src.includes('The obvious angle: ${selectedFrame.obviousAngle}')],
  ['interpretiveFocus stripping present', src.includes("interpretiveOpportunity.startsWith('Frame the essay around ')")],
  ['nextMoveConnector in generation', src.includes('selectedFrame.nextMoveConnector')],
  ['Use this interpretive test gone', !src.includes('Use this interpretive test:')],
  ['debate new angleTitle', src.includes('When being right in the argument became the problem')],
  ['community new angleTitle', src.includes('The moment in clinic volunteering when tasks stopped being enough')],
  ['peer new angleTitle', src.includes('The tutoring session where the method stopped working')],
  ['technical new angleTitle', src.includes('When solving it alone started hurting the team')],
  ['research new angleTitle', src.includes('When failing the experiment changed how the student thinks')],
  ['service new angleTitle', src.includes('When moving fast caused the problem and the student had to adjust')],
  ['athletic new angleTitle', src.includes('After the injury: finding a different way to contribute')],
];

let allOk = true;
for (const [label, ok] of checks) {
  const mark = ok ? '✓' : '✗';
  if (!ok) allOk = false;
  console.log(`  ${mark}  ${label}`);
}
if (!allOk) process.exit(1);
