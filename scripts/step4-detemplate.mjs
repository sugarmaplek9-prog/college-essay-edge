import { readFileSync, writeFileSync } from 'node:fs';

const path =
  '/Volumes/TOSHIBA EXT/College Essay/src/lib/ai/modules/narrative-direction-selection/module-executor.ts';

let src = readFileSync(path, 'utf8');

// ── 1. Remove the now-unused primarySummary variable ──────────────────────────
src = src.replace(
  /\n  const primarySummary = \(top\?\.event_summary[^\n]+\.trim\(\);/,
  ''
);

// ── 2. Expand the domainFrame type to include coreClaim + whyBeatsObvious ─────
src = src.replace(
  '      angleTitle: string;\n      notThis: string;\n      realStory: string;\n      studentReveal: string;\n      obviousAngle: string;\n      risk: string;\n      nextMove: string;',
  '      angleTitle: string;\n      notThis: string;\n      coreClaim: string;\n      realStory: string;\n      studentReveal: string;\n      whyBeatsObvious: string;\n      obviousAngle: string;\n      risk: string;\n      nextMove: string;'
);

// ── 3. Replace each domain entry with new coreClaim, revised realStory/studentReveal, and whyBeatsObvious ──

// debate_conflict
src = src.replace(
  `      notThis: 'a debate essay about argument skill',
      realStory:
        'The strongest signal is not the conflict itself. It is the correction in approach after feedback, which demonstrates social maturity under pressure.',
      studentReveal:
        'It reveals a student who can revise behavior in public and convert disagreement into trust.',
      obviousAngle: 'leadership/communication traits without a real revision moment',`,
  `      notThis: 'a debate essay about argument skill',
      coreClaim:
        'Debate essays fail when they prove skill. This one works if it shows the moment skill became the problem — and the student stopped leading with it.',
      realStory:
        'Not the argument. Not who won. The essay is the correction: the moment feedback landed mid-conflict and the student changed how they were operating.',
      studentReveal:
        'Someone who could be publicly wrong and still adjust course. Under pressure, in front of others. That is not a debater. That is a person.',
      whyBeatsObvious:
        'Argument skill essays prove argument skill. This angle shows the student discover the limit of argument — which is the less expected and more revealing story.',
      obviousAngle: 'leadership/communication traits without a real revision moment',`
);

// community_care — find unique anchor (notThis field)
src = src.replace(
  `      notThis: 'a service résumé essay about hours and commitment',
      realStory:`,
  `      notThis: 'a service résumé essay about hours and commitment',
      coreClaim:
        'This is not a service essay. It is about the exact moment helping stopped feeling like enough — and the student had to figure out what another person actually needed.',
      realStory:`
);
src = src.replace(
  `        'The strongest signal is not volunteering itself. It is the moment the student reframed responsibility from task completion to human consequence.',
      studentReveal:
        'It reveals a student who treats responsibility as relational, attentive, and accountable to other people`,
  `        'The clinic is backdrop. The essay is a specific failure of task-level care and the correction that followed when someone else\'s outcome made it real.',
      studentReveal:
        'A person who noticed when their care was still about themselves — and chose accountability over comfort instead.',
      whyBeatsObvious:
        'Service essays describe service. This one shows the student cross from role to responsibility. That is what differentiates it.',
      _PLACEHOLDER_COMMUNITY_CARE_REMOVE: 'other people`
);
// Remove the remainder of the original studentReveal line for community_care
src = src.replace(`        '_PLACEHOLDER_COMMUNITY_CARE_REMOVE: 'other people\u2019s outcomes.',
      obviousAngle: 'service leadership framed as generic compassion',`, `      obviousAngle: 'service leadership framed as generic compassion',`);

// peer_teaching
src = src.replace(
  `      notThis: 'a tutoring activity summary about being helpful',
      realStory:
        'The strongest signal is the shift from content delivery to relational teaching judgment after feedback.',
      studentReveal:
        'It reveals a student who can diagnose what another person needs and adapt behavior to produce real learning movement.',
      obviousAngle: 'academic leadership with generic growth language',`,
  `      notThis: 'a tutoring activity summary about being helpful',
      coreClaim:
        'Not a tutoring story. A story about the moment the student\'s method stopped working — and they had to ask why the other person still wasn\'t getting it.',
      realStory:
        'Tutoring without a failure is just content delivery. The essay lives in the gap between the explanation that did not work and the adaptation that did.',
      studentReveal:
        'Someone who can sit with not being understood and use that discomfort as a diagnostic instead of an excuse.',
      whyBeatsObvious:
        'Academic support essays describe the helper. This one describes the moment the student realized they were wrong about what help looked like.',
      obviousAngle: 'academic leadership with generic growth language',`
);

// technical_leadership
src = src.replace(
  `      notThis: 'a robotics achievement recap',
      realStory:
        'The strongest signal is the shift from solving alone to leading through better team decisions after feedback.',
      studentReveal:
        'It reveals a student who values collective performance and can revise technical ego into shared execution.',
      obviousAngle: 'problem-solving excellence as a static trait',`,
  `      notThis: 'a robotics achievement recap',
      coreClaim:
        'This is not a robotics essay. It is about the moment individual competence started costing the team — and the student caught it before the damage ran deeper.',
      realStory:
        'Technical ability is common in this applicant pool. What this case offers is the pivot: from solving alone to making the team smarter. That is the essay.',
      studentReveal:
        'Someone who could subordinate technical confidence to team judgment under competition pressure. That is leadership you can show, not just claim.',
      whyBeatsObvious:
        'Project achievement essays describe what was built. This angle shows how the builder\'s role changed — which is the sharper and less expected story.',
      obviousAngle: 'problem-solving excellence as a static trait',`
);

// research_failure
src = src.replace(
  `      notThis: 'a failure-then-success competition story',
      realStory:
        'The strongest signal is the correction of method and judgment after feedback, not the project result itself.',
      studentReveal:
        'It reveals a student who can metabolize failure into better reasoning rather than self-protection.',
      obviousAngle: 'resilience story with generic bounce-back language',`,
  `      notThis: 'a failure-then-success competition story',
      coreClaim:
        'The essay is not about the experiment failing. It is about how the student reasoned after the failure — what they changed, and why that change was harder than the original work.',
      realStory:
        'Anyone can lose a competition. What this case holds is a student who revised their methodology after feedback, not just their self-narrative after the loss.',
      studentReveal:
        'Someone who treats failure as diagnostic. That is what evidence-based thinking looks like before graduate school teaches it.',
      whyBeatsObvious:
        'Resilience essays describe the comeback. This one shows the reasoning inside it — which is what the admissions reader is actually looking for.',
      obviousAngle: 'resilience story with generic bounce-back language',`
);

// service_operations
src = src.replace(
  `      notThis: 'a busy-shift work ethic story',
      realStory:
        'The strongest signal is the shift from executing tasks quickly to making decisions that improved how others worked together.',
      studentReveal:
        'It reveals a student who can balance urgency with judgment and relational awareness.',
      obviousAngle: 'hard-working responsibility narrative',`,
  `      notThis: 'a busy-shift work ethic story',
      coreClaim:
        'Not a work-ethic essay. A story about the moment throughput stopped being the goal — and reading the room became the actual job.',
      realStory:
        'Fast execution is the baseline skill in operations. The essay is the moment that speed created a problem and what the student changed next.',
      studentReveal:
        'Someone who could slow down under operational pressure, read what was actually happening, and adjust before the damage compounded.',
      whyBeatsObvious:
        'Work ethic essays prove reliability. This angle proves judgment under pressure — a narrower and more specific claim.',
      obviousAngle: 'hard-working responsibility narrative',`
);

// athletic_recovery
src = src.replace(
  `      notThis: 'a perseverance-over-injury arc',
      realStory:
        'The strongest signal is the shift in how the student defines value and contribution after disruption.',
      studentReveal:
        'It reveals a student who can rebuild identity through contribution, not just personal comeback narrative.',
      obviousAngle: 'motivation and grit as abstract traits',`,
  `      notThis: 'a perseverance-over-injury arc',
      coreClaim:
        'The essay is not about the injury. It is about what the student chose to contribute when their old definition of value no longer applied.',
      realStory:
        'Recovery stories describe return. This essay is about the identity shift before the return — when contribution replaced performance as what mattered.',
      studentReveal:
        'Someone who could rebuild the meaning of participation from the ground up. Not perseverance. Identity work.',
      whyBeatsObvious:
        'Perseverance essays prove motivation. This angle proves something more specific: that the student redefined what it means to matter to a team.',
      obviousAngle: 'motivation and grit as abstract traits',`
);

// other
src = src.replace(
  `      notThis: 'a broad accomplishment summary',
      realStory:
        'The strongest signal is the correction from first instinct to revised behavior with external consequences.',
      studentReveal:
        'It reveals a student who can interpret experience and change conduct in ways others can feel.',
      obviousAngle: 'general leadership/growth framing',`,
  `      notThis: 'a broad accomplishment summary',
      coreClaim:
        'The essay should not describe the accomplishment. It should start at the moment of self-correction and stay close to what changed next.',
      realStory:
        'The behavior correction is the story. Everything before it is setup. Everything after it is proof.',
      studentReveal:
        'Someone who can locate the moment they got it wrong, identify the correction, and show it held under pressure.',
      whyBeatsObvious:
        'General leadership framing describes traits. The correction angle shows one precise moment of changed judgment — which is the sharper story.',
      obviousAngle: 'general leadership/growth framing',`
);

// ── 4. Update the generation block ───────────────────────────────────────────
src = src.replace(
  `    core_claim: \`This should not be \${selectedFrame.notThis}. It should center on \${primarySummary.slice(0, 170)} because that moment captures the student's real revision in judgment and behavior.\`,
    why_this_is_the_real_story: selectedFrame.realStory,
    what_it_reveals_about_the_student: selectedFrame.studentReveal,
    why_it_beats_the_obvious_angle:
      \`The obvious angle would be \${selectedFrame.obviousAngle}. That version is weaker because it stays at trait-level. The stronger angle captures a visible correction in role and decision-quality.\`,`,
  `    core_claim: selectedFrame.coreClaim,
    why_this_is_the_real_story: selectedFrame.realStory,
    what_it_reveals_about_the_student: selectedFrame.studentReveal,
    why_it_beats_the_obvious_angle:
      \`The obvious angle: \${selectedFrame.obviousAngle}. \${selectedFrame.whyBeatsObvious}\`,`
);

writeFileSync(path, src);
console.log('✓ step4-detemplate done — file length:', src.length);

// Sanity checks
const checks = [
  ['primarySummary removed', !src.includes('const primarySummary')],
  ['coreClaim type present', src.includes('coreClaim: string;')],
  ['whyBeatsObvious type present', src.includes('whyBeatsObvious: string;')],
  ['debate coreClaim authored', src.includes('Debate essays fail when they prove skill')],
  ['community coreClaim authored', src.includes('This is not a service essay')],
  ['peer coreClaim authored', src.includes('Not a tutoring story')],
  ['tech coreClaim authored', src.includes('This is not a robotics essay')],
  ['research coreClaim authored', src.includes('The essay is not about the experiment')],
  ['service coreClaim authored', src.includes('Not a work-ethic essay')],
  ['athletic coreClaim authored', src.includes('The essay is not about the injury')],
  ['old core_claim template gone', !src.includes("captures the student's real revision in judgment and behavior")],
  ['old why_beats template gone', !src.includes('it stays at trait-level')],
  ['old "strongest signal" gone', !src.includes("The strongest signal is")],
  ['old "It reveals a student" gone', !src.includes("It reveals a student")],
  ['new generation coreClaim', src.includes('core_claim: selectedFrame.coreClaim')],
  ['new generation whyBeats', src.includes('whyBeatsObvious}')],
];

let allOk = true;
for (const [label, ok] of checks) {
  const mark = ok ? '✓' : '✗';
  if (!ok) allOk = false;
  console.log(`  ${mark}  ${label}`);
}
if (!allOk) process.exit(1);
