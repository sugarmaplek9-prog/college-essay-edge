const fs = require('fs');
const path = require('path');

function replaceRegexStrict(content, rules, fileLabel) {
  let out = content;
  for (const rule of rules) {
    const { re, to, min = 1, label } = rule;
    const matches = out.match(re);
    const count = matches ? matches.length : 0;
    if (count < min) {
      throw new Error(`[${fileLabel}] missing pattern: ${label}`);
    }
    out = out.replace(re, to);
  }
  return out;
}

const directionPath = path.join(process.cwd(), 'src/lib/fm/direction.ts');
const canonicalPath = path.join(process.cwd(), 'src/lib/fm/canonicalPage3Payload.ts');

const directionSrc = fs.readFileSync(directionPath, 'utf8');
const canonicalSrc = fs.readFileSync(canonicalPath, 'utf8');

const directionRules = [
  {
    label: 'directionBody regex expansion',
    re: /\^\(Center this essay on\|Make the claim that\|Show how\|Write this as\|Name the essay as\)/g,
    to: '^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim)',
  },
  {
    label: 'direction starters block',
    re: /const directionStarters = \[[\s\S]*?\] as const;/,
    to: "const directionStarters = [\n      'Your essay should show',\n      'Make your main claim',\n      'Center your essay on',\n      'Show how',\n      'Write this around',\n    ] as const;",
  },

  { label: 'tension line 1', re: /Name the essay angle as accountability under tradeoffs, then ground it in \$\{turningQ\} and the outcome in \$\{consequenceQ\}\./g, to: 'Your essay should show the moment your priorities collided at ${turningQ}, and how that choice shaped what happened in ${consequenceQ}.', },
  { label: 'tension line 2', re: /Name the essay angle as accountability under competing priorities, not as a generic growth pivot\./g, to: 'Your essay should show the moment competing priorities forced a real choice, not a generic growth summary.', },
  { label: 'tension about 1', re: /This essay is about accountability under tradeoffs, shown through what changed in your judgment at \$\{turningQ\}\./g, to: 'This essay is about the standard you chose under pressure at ${turningQ}, and how that choice changed your actions.', },
  { label: 'tension about 2', re: /This essay is about accountability under tradeoffs and how that standard changed your behavior\./g, to: 'This essay is about the standard you chose when pressure made the easy option tempting.', },

  { label: 'value line 1', re: /Name the essay as a values-under-cost story, then verify that value through what happened in \$\{consequenceQ\}\./g, to: 'Make your main claim that you protected one value when it cost you something, and prove it through ${consequenceQ}.', },
  { label: 'value line 2', re: /Frame the draft around the value you protected when it was costly, not the activity list around it\./g, to: 'Make your main claim about the value you protected when it cost you something, not a list of activities.', },
  { label: 'value about 1', re: /At its core, this essay is about a value-under-cost decision and how that value shaped outcomes in \$\{consequenceQ\}\./g, to: 'This essay is about the value you refused to drop, and the visible result that followed in ${consequenceQ}.', },
  { label: 'value about 2', re: /At its core, this essay is about a value-under-cost decision and the behavior that followed\./g, to: 'This essay is about the value you protected when dropping it would have been easier.', },

  { label: 'process line 1', re: /Name the essay as a standard rebuilt: what \$\{turningQ\} revealed about how you were working, what you changed, and what \$\{consequenceQ\} proved about the new approach\./g, to: 'Center your essay on the method you rebuilt after ${turningQ}: what you changed and how ${consequenceQ} proved it held.', },
  { label: 'process line 2', re: /Name the essay as a standard rebuilt: show what \$\{turningQ\} revealed about how you were working, what you changed, and one result that proved it held\./g, to: 'Center your essay on what ${turningQ} exposed in your approach, what you changed, and the first result that proved it worked.', },
  { label: 'process line 3', re: /Name the essay as a standard rebuilt: show the specific failure, what changed in how you worked, and the first result that proved it held\./g, to: 'Center your essay on one breakdown, the method you rebuilt, and the first result that proved the new approach held.', },
  { label: 'process about 1', re: /Under the scene, this essay is really about the standard you rebuilt after \$\{turningQ\}: how that failure changed what you required of yourself and what it proved you could do differently\./g, to: 'This essay is about how ${turningQ} forced you to change your method, and how that method held when it mattered.', },
  { label: 'process about 2', re: /Under the scene, this essay is really about a standard rebuilt: the specific failure, the specific change in approach, and the behavior that proved it stuck\./g, to: 'This essay is about one concrete failure, the method you rebuilt, and the behavior that proved it stuck.', },

  { label: 'relationship line 1', re: /Center this essay on relationship-based responsibility, using your interaction with \$\{actor\.toLowerCase\(\)\} at \$\{turningQ\} as proof\./g, to: 'Center this essay on the moment you changed how you responded to ${actor.toLowerCase()} at ${turningQ}.', },
  { label: 'relationship line 2', re: /Make the claim that relationship-based responsibility is the real turn, using what \$\{turningQ\} revealed about what another person needed\./g, to: 'Center this essay on what ${turningQ} showed you about someone else’s need, and how you changed your response.', },
  { label: 'relationship line 3', re: /Show how responsibility in relationship changed once you noticed what \$\{actor\.toLowerCase\(\)\} needed\./g, to: 'Show the moment you stopped assuming and started responding to what ${actor.toLowerCase()} actually needed.', },
  { label: 'relationship line 4', re: /Write this as relationship-based responsibility through one interaction that changed your behavior\./g, to: 'Show one interaction that changed how you responded to another person.', },
  { label: 'relationship why 1', re: /This is stronger because it is about changed responsibility in a real relationship with \$\{actor\.toLowerCase\(\)\}, not abstract personal growth\./g, to: 'This is stronger because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.', min: 2 },
  { label: 'relationship why 2', re: /This is stronger because it grounds changed responsibility in what \$\{turningQ\} made you notice, not abstract growth language\./g, to: 'This is stronger because it ties your change in response to a concrete moment at ${turningQ}.', },
  { label: 'relationship why 3', re: /This is stronger because it shows changed responsibility in a real interaction, not abstract growth language\./g, to: 'This is stronger because it shows a real interaction and a visible response change.', },
  { label: 'relationship about 1', re: /What gives this essay meaning is responsibility in relationship: understanding what \$\{actor\.toLowerCase\(\)\} needed and acting on it\./g, to: 'This essay is about noticing what ${actor.toLowerCase()} needed at ${turningQ}, and changing your behavior to meet that need.', },
  { label: 'relationship about 2', re: /The deeper subject here is responsibility in relationship: what \$\{turningQ\} showed you about another person’s need and how you changed your response\./g, to: 'This essay is about what ${turningQ} taught you about another person’s need, and the response you chose after that.', },
  { label: 'relationship about 3', re: /At its core, this essay is about responsibility in relationship: understanding what \$\{actor\.toLowerCase\(\)\} needed and acting on it\./g, to: 'This essay is about the moment you started responding to what ${actor.toLowerCase()} needed instead of what you assumed.', },
  { label: 'relationship about 4', re: /Under the scene, this essay is really about responsibility in relationship: understanding another person’s need and acting on it\./g, to: 'This essay is about noticing another person’s need and changing your response in a concrete way.', },

  { label: 'contradiction line 1', re: /Name the essay as ownership under contradiction: what you believed about yourself versus what \$\{turningQ\} proved\./g, to: 'Center your essay on the moment what you believed about yourself collided with what ${turningQ} proved.', },
  { label: 'contradiction line 2', re: /Name the essay as ownership under contradiction between self-image and what the moment required\./g, to: 'Center your essay on where your self-image conflicted with what the moment required.', },
  { label: 'contradiction about 1', re: /This essay is about ownership under contradiction: what \$\{turningQ\} forced you to revise in how you judged the situation\./g, to: 'This essay is about the belief you had to revise at ${turningQ}, and the different decision standard that replaced it.', },
  { label: 'contradiction about 2', re: /This essay is about ownership under contradiction and the behavior shift that followed\./g, to: 'This essay is about revising a belief about yourself and showing the decision standard that replaced it.', },

  { label: 'realization line 1', re: /\$\{themeStatement\} Name the essay angle as a change in interpretation that changed later decisions\./g, to: '${themeStatement} Make the claim that what you understood in that moment changed your next decision.', },
  { label: 'realization line 2', re: /Name the essay as interpretation change that altered later decisions, not as reflection alone\./g, to: 'Make the claim that what you understood in one moment changed your later decisions, not just your reflection.', },
  { label: 'realization about 1', re: /The essay becomes about interpretation change: what you understood at \$\{reflectionQ\} and the behavior it changed\./g, to: 'This essay is about what you finally understood at ${reflectionQ}, and the visible behavior that changed after that.', },
  { label: 'realization about 2', re: /The essay becomes about interpretation change and the behavior it changed in a visible way\./g, to: 'This essay is about a new understanding and the visible behavior it changed.', },

  {
    label: 'reusable shell pattern expansion',
    re: /\(name the essay as\|write this essay around\|change in interpretation\|value-under-cost\|accountability under tradeoffs\)/g,
    to: '(name the essay as|write this essay around|change in interpretation|value-under-cost|accountability under tradeoffs|relationship-based responsibility|ownership under contradiction|interpretation change)',
  },

  {
    label: 'why fallback',
    re: /It is stronger because it is clearer, more persuasive, and easier to draft with evidence\./g,
    to: 'It is stronger because it gives a specific claim you can actually prove from your notes.',
  },
  {
    label: 'essay about fallback',
    re: /This essay is about the principle you refined and the repeatable behavior that proved it\./g,
    to: 'This essay is about one decision that changed how you acted, and why that shift matters.',
  },

  {
    label: 'coach weaker block',
    re: /`The weaker path falls short because it stays thinner on claim clarity \(\$\{runnerUpCandidate\.angle_type\} angle\)\.`,\n\s*`What the weaker version misses is claim control under evidence pressure \(\$\{runnerUpCandidate\.angle_type\} angle\)\.`,\n\s*`That weaker option keeps detail but leaves the governing claim less explicit \(\$\{runnerUpCandidate\.angle_type\} angle\)\.`,/,
    to: "`The weaker version has detail, but the core claim stays blurry.`,\n            `The weaker version describes events without making the main argument explicit enough.`,\n            `The weaker version has moments you can use, but the through-line is less clear.`,",
  },
  {
    label: 'coach stronger block',
    re: /`The stronger option works because it states the claim early and ties hinge to consequence cleanly \(\$\{selectedCandidate\?\.angle_type \?\? 'selected'\} angle\)\.`,\n\s*`What makes the stronger version hold together is clear claim-first structure with visible consequence \(\$\{selectedCandidate\?\.angle_type \?\? 'selected'\} angle\)\.`,\n\s*`The stronger path is easier to trust because the decision and outcome stay tightly linked \(\$\{selectedCandidate\?\.angle_type \?\? 'selected'\} angle\)\.`,/,
    to: "`The stronger version states the claim early and keeps every detail tied to that claim.`,\n            `The stronger version is easier to trust because the key decision and result stay tightly connected.`,\n            `The stronger version gives you a cleaner path from scene to claim to consequence.`,",
  },
];

const canonicalRules = [
  { label: 'problem_real 1', re: /Use this line to establish the concrete problem before interpreting it\./g, to: 'Use this line to set the scene before you explain anything.', },
  { label: 'problem_real 2', re: /This detail sets the operational context and makes the stakes legible\./g, to: 'This detail helps the reader see the real problem quickly.', },
  { label: 'problem_real 3', re: /Lead with this scene detail so the reader sees the constraint immediately\./g, to: 'Lead with this moment so the stakes feel concrete right away.', },
  { label: 'turning 1', re: /This is the hinge detail that changes your decision logic\./g, to: 'This is the moment your decision changed.', },
  { label: 'turning 2', re: /This line marks the pivot from assumption to revised approach\./g, to: 'This line marks where your approach shifted.', },
  { label: 'turning 3', re: /This is the point where your strategy changes in a visible way\./g, to: 'Use this as the turning point in your story.', },
  { label: 'stakes 1', re: /Use this to prove downstream consequence, not just intention\./g, to: 'Use this to show what changed after your decision.', },
  { label: 'stakes 2', re: /This detail confirms impact in outcomes the reader can verify\./g, to: 'This detail shows the result, not just your intention.', },
  { label: 'stakes 3', re: /This line shows that the decision altered what happened next\./g, to: 'This line proves the decision had a real outcome.', },
  { label: 'perspective 1', re: /This sentence names the updated standard guiding later choices\./g, to: 'This sentence shows what you understand differently now.', },
  { label: 'perspective 2', re: /Use this reflection to connect behavior change to interpretation change\./g, to: 'Use this reflection to explain why your behavior changed.', },
  { label: 'perspective 3', re: /This clarifies how your judgment shifted after the event\./g, to: 'This line clarifies how your judgment shifted afterward.', },
  { label: 'ambiguity angleA', re: /Angle A: relationship responsibility in action/g, to: 'Angle A: focus on how you responded to another person in one concrete moment', },
  { label: 'ambiguity angleB', re: /Angle B: process or judgment standard under cost/g, to: 'Angle B: focus on a decision where pressure forced a different standard', },
  { label: 'ambiguity about', re: /This essay is about selecting the stronger conceptual center by testing reveal-power, evidence strength, and what missing detail would decisively break the tie\./g, to: 'This essay is about choosing one clear claim you can prove with a real scene, not mixing two directions in the same draft.', },
  { label: 'ambiguity why', re: /What A would reveal: responsibility in relationship\. What B would reveal: judgment standard in action\. Strongest current evidence for A: "\$\{evidenceA\}"\. Strongest current evidence for B: "\$\{evidenceB\}"\. Missing evidence that breaks the tie: one concrete scene where the decision and immediate consequence are both visible\./g, to: 'Angle A currently has this best support: "${evidenceA}". Angle B currently has this best support: "${evidenceB}". Pick the angle you can prove with one scene, one decision, and one immediate consequence.', },
];

const patchedDirection = replaceRegexStrict(directionSrc, directionRules, 'direction.ts');
const patchedCanonical = replaceRegexStrict(canonicalSrc, canonicalRules, 'canonicalPage3Payload.ts');

fs.writeFileSync(directionPath, patchedDirection, 'utf8');
fs.writeFileSync(canonicalPath, patchedCanonical, 'utf8');

console.log(JSON.stringify({
  status: 'ok',
  patched_files: [
    'src/lib/fm/direction.ts',
    'src/lib/fm/canonicalPage3Payload.ts',
  ],
  direction_rules: directionRules.length,
  canonical_rules: canonicalRules.length,
}, null, 2));
