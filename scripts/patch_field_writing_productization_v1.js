const fs = require('fs');
const path = require('path');

function replaceAllStrict(content, replacements, fileLabel) {
  let out = content;
  for (const [from, to] of replacements) {
    if (!out.includes(from)) {
      throw new Error(`[${fileLabel}] missing expected snippet:\n${from.slice(0, 180)}...`);
    }
    out = out.split(from).join(to);
  }
  return out;
}

const directionPath = path.join(process.cwd(), 'src/lib/fm/direction.ts');
const canonicalPath = path.join(process.cwd(), 'src/lib/fm/canonicalPage3Payload.ts');

const directionSrc = fs.readFileSync(directionPath, 'utf8');
const canonicalSrc = fs.readFileSync(canonicalPath, 'utf8');

const directionReplacements = [
  [
    "const directionBody = normalizedDirection.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as)\\s*/i, '');",
    "const directionBody = normalizedDirection.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim)\\s*/i, '');",
  ],
  [
    "const directionStarters = [\n      'Center this essay on',\n      'Make the claim that',\n      'Show how',\n      'Write this as',\n      'Name the essay as',\n    ] as const;",
    "const directionStarters = [\n      'Your essay should show',\n      'Make your main claim',\n      'Center your essay on',\n      'Show how',\n      'Write this around',\n    ] as const;",
  ],
  [
    "? `Name the essay angle as accountability under tradeoffs, then ground it in ${turningQ} and the outcome in ${consequenceQ}.`",
    "? `Your essay should show the moment your priorities collided at ${turningQ}, and how that choice shaped what happened in ${consequenceQ}.`",
  ],
  [
    "      : `Name the essay angle as accountability under competing priorities, not as a generic growth pivot.`",
    "      : `Your essay should show the moment competing priorities forced a real choice, not a generic growth summary.`",
  ],
  [
    "? `This essay is about accountability under tradeoffs, shown through what changed in your judgment at ${turningQ}.`",
    "? `This essay is about the standard you chose under pressure at ${turningQ}, and how that choice changed your actions.`",
  ],
  [
    "      : 'This essay is about accountability under tradeoffs and how that standard changed your behavior.'",
    "      : 'This essay is about the standard you chose when pressure made the easy option tempting.'",
  ],
  [
    "? `Name the essay as a values-under-cost story, then verify that value through what happened in ${consequenceQ}.`",
    "? `Make your main claim that you protected one value when it cost you something, and prove it through ${consequenceQ}.`",
  ],
  [
    "      : `Frame the draft around the value you protected when it was costly, not the activity list around it.`",
    "      : `Make your main claim about the value you protected when it cost you something, not a list of activities.`",
  ],
  [
    "? `At its core, this essay is about a value-under-cost decision and how that value shaped outcomes in ${consequenceQ}.`",
    "? `This essay is about the value you refused to drop, and the visible result that followed in ${consequenceQ}.`",
  ],
  [
    "      : 'At its core, this essay is about a value-under-cost decision and the behavior that followed.'",
    "      : 'This essay is about the value you protected when dropping it would have been easier.'",
  ],
  [
    "? `Name the essay as a standard rebuilt: what ${turningQ} revealed about how you were working, what you changed, and what ${consequenceQ} proved about the new approach.`",
    "? `Center your essay on the method you rebuilt after ${turningQ}: what you changed and how ${consequenceQ} proved it held.`",
  ],
  [
    "        ? `Name the essay as a standard rebuilt: show what ${turningQ} revealed about how you were working, what you changed, and one result that proved it held.`",
    "        ? `Center your essay on what ${turningQ} exposed in your approach, what you changed, and the first result that proved it worked.`",
  ],
  [
    "        : `Name the essay as a standard rebuilt: show the specific failure, what changed in how you worked, and the first result that proved it held.`",
    "        : `Center your essay on one breakdown, the method you rebuilt, and the first result that proved the new approach held.`",
  ],
  [
    "? `Under the scene, this essay is really about the standard you rebuilt after ${turningQ}: how that failure changed what you required of yourself and what it proved you could do differently.`",
    "? `This essay is about how ${turningQ} forced you to change your method, and how that method held when it mattered.`",
  ],
  [
    "      : 'Under the scene, this essay is really about a standard rebuilt: the specific failure, the specific change in approach, and the behavior that proved it stuck.'",
    "      : 'This essay is about one concrete failure, the method you rebuilt, and the behavior that proved it stuck.'",
  ],
  [
    "? `Center this essay on relationship-based responsibility, using your interaction with ${actor.toLowerCase()} at ${turningQ} as proof.`",
    "? `Center this essay on the moment you changed how you responded to ${actor.toLowerCase()} at ${turningQ}.`",
  ],
  [
    "        ? `Make the claim that relationship-based responsibility is the real turn, using what ${turningQ} revealed about what another person needed.`",
    "        ? `Center this essay on what ${turningQ} showed you about someone else’s need, and how you changed your response.`",
  ],
  [
    "          ? `Show how responsibility in relationship changed once you noticed what ${actor.toLowerCase()} needed.`",
    "          ? `Show the moment you stopped assuming and started responding to what ${actor.toLowerCase()} actually needed.`",
  ],
  [
    "          : 'Write this as relationship-based responsibility through one interaction that changed your behavior.'",
    "          : 'Show one interaction that changed how you responded to another person.'",
  ],
  [
    "? `This is stronger because it is about changed responsibility in a real relationship with ${actor.toLowerCase()}, not abstract personal growth.`",
    "? `This is stronger because it shows a real change in how you treated ${actor.toLowerCase()}, not a broad claim about growth.`",
  ],
  [
    "        ? `This is stronger because it grounds changed responsibility in what ${turningQ} made you notice, not abstract growth language.`",
    "        ? `This is stronger because it ties your change in response to a concrete moment at ${turningQ}.`",
  ],
  [
    "          ? `This is stronger because it is about changed responsibility in a real relationship with ${actor.toLowerCase()}, not abstract personal growth.`",
    "          ? `This is stronger because it shows a real response change with ${actor.toLowerCase()}, not abstract reflection.`",
  ],
  [
    "          : 'This is stronger because it shows changed responsibility in a real interaction, not abstract growth language.'",
    "          : 'This is stronger because it shows a real interaction and a visible response change.'",
  ],
  [
    "? `What gives this essay meaning is responsibility in relationship: understanding what ${actor.toLowerCase()} needed and acting on it.`",
    "? `This essay is about noticing what ${actor.toLowerCase()} needed at ${turningQ}, and changing your behavior to meet that need.`",
  ],
  [
    "        ? `The deeper subject here is responsibility in relationship: what ${turningQ} showed you about another person’s need and how you changed your response.`",
    "        ? `This essay is about what ${turningQ} taught you about another person’s need, and the response you chose after that.`",
  ],
  [
    "          ? `At its core, this essay is about responsibility in relationship: understanding what ${actor.toLowerCase()} needed and acting on it.`",
    "          ? `This essay is about the moment you started responding to what ${actor.toLowerCase()} needed instead of what you assumed.`",
  ],
  [
    "          : 'Under the scene, this essay is really about responsibility in relationship: understanding another person’s need and acting on it.'",
    "          : 'This essay is about noticing another person’s need and changing your response in a concrete way.'",
  ],
  [
    "? `Name the essay as ownership under contradiction: what you believed about yourself versus what ${turningQ} proved.`",
    "? `Center your essay on the moment what you believed about yourself collided with what ${turningQ} proved.`",
  ],
  [
    "      : 'Name the essay as ownership under contradiction between self-image and what the moment required.'",
    "      : 'Center your essay on where your self-image conflicted with what the moment required.'",
  ],
  [
    "? `This essay is about ownership under contradiction: what ${turningQ} forced you to revise in how you judged the situation.`",
    "? `This essay is about the belief you had to revise at ${turningQ}, and the different decision standard that replaced it.`",
  ],
  [
    "      : 'This essay is about ownership under contradiction and the behavior shift that followed.'",
    "      : 'This essay is about revising a belief about yourself and showing the decision standard that replaced it.'",
  ],
  [
    "      ? `${themeStatement} Name the essay angle as a change in interpretation that changed later decisions.`",
    "      ? `${themeStatement} Make the claim that what you understood in that moment changed your next decision.`",
  ],
  [
    "      : 'Name the essay as interpretation change that altered later decisions, not as reflection alone.'",
    "      : 'Make the claim that what you understood in one moment changed your later decisions, not just your reflection.'",
  ],
  [
    "      ? `The essay becomes about interpretation change: what you understood at ${reflectionQ} and the behavior it changed.`",
    "      ? `This essay is about what you finally understood at ${reflectionQ}, and the visible behavior that changed after that.`",
  ],
  [
    "      : 'The essay becomes about interpretation change and the behavior it changed in a visible way.'",
    "      : 'This essay is about a new understanding and the visible behavior it changed.'",
  ],
  [
    "  const reusableShellPattern = /\\b(name the essay as|write this essay around|change in interpretation|value-under-cost|accountability under tradeoffs)\\b/i;",
    "  const reusableShellPattern = /\\b(name the essay as|write this essay around|change in interpretation|value-under-cost|accountability under tradeoffs|relationship-based responsibility|ownership under contradiction|interpretation change)\\b/i;",
  ],
  [
    "      'It is stronger because it is clearer, more persuasive, and easier to draft with evidence.',",
    "      'It is stronger because it gives a specific claim you can actually prove from your notes.',",
  ],
  [
    "          'This essay is about the principle you refined and the repeatable behavior that proved it.',",
    "          'This essay is about one decision that changed how you acted, and why that shift matters.',",
  ],
  [
    "            `The weaker path falls short because it stays thinner on claim clarity (${runnerUpCandidate.angle_type} angle).`,\n            `What the weaker version misses is claim control under evidence pressure (${runnerUpCandidate.angle_type} angle).`,\n            `That weaker option keeps detail but leaves the governing claim less explicit (${runnerUpCandidate.angle_type} angle).`,",
    "            `The weaker version has detail, but the core claim stays blurry.`,\n            `The weaker version describes events without making the main argument explicit enough.`,\n            `The weaker version has moments you can use, but the through-line is less clear.`,",
  ],
  [
    "            `The stronger option works because it states the claim early and ties hinge to consequence cleanly (${selectedCandidate?.angle_type ?? 'selected'} angle).`,\n            `What makes the stronger version hold together is clear claim-first structure with visible consequence (${selectedCandidate?.angle_type ?? 'selected'} angle).`,\n            `The stronger path is easier to trust because the decision and outcome stay tightly linked (${selectedCandidate?.angle_type ?? 'selected'} angle).`,",
    "            `The stronger version states the claim early and keeps every detail tied to that claim.`,\n            `The stronger version is easier to trust because the key decision and result stay tightly connected.`,\n            `The stronger version gives you a cleaner path from scene to claim to consequence.`,",
  ],
];

const canonicalReplacements = [
  [
    "      'Use this line to establish the concrete problem before interpreting it.',",
    "      'Use this line to set the scene before you explain anything.',",
  ],
  [
    "      'This detail sets the operational context and makes the stakes legible.',",
    "      'This detail helps the reader see the real problem quickly.',",
  ],
  [
    "      'Lead with this scene detail so the reader sees the constraint immediately.',",
    "      'Lead with this moment so the stakes feel concrete right away.',",
  ],
  [
    "      'This is the hinge detail that changes your decision logic.',",
    "      'This is the moment your decision changed.',",
  ],
  [
    "      'This line marks the pivot from assumption to revised approach.',",
    "      'This line marks where your approach shifted.',",
  ],
  [
    "      'This is the point where your strategy changes in a visible way.',",
    "      'Use this as the turning point in your story.',",
  ],
  [
    "      'Use this to prove downstream consequence, not just intention.',",
    "      'Use this to show what changed after your decision.',",
  ],
  [
    "      'This detail confirms impact in outcomes the reader can verify.',",
    "      'This detail shows the result, not just your intention.',",
  ],
  [
    "      'This line shows that the decision altered what happened next.',",
    "      'This line proves the decision had a real outcome.',",
  ],
  [
    "      'This sentence names the updated standard guiding later choices.',",
    "      'This sentence shows what you understand differently now.',",
  ],
  [
    "      'Use this reflection to connect behavior change to interpretation change.',",
    "      'Use this reflection to explain why your behavior changed.',",
  ],
  [
    "      'This clarifies how your judgment shifted after the event.',",
    "      'This line clarifies how your judgment shifted afterward.',",
  ],
  [
    "    : 'Angle A: relationship responsibility in action'",
    "    : 'Angle A: focus on how you responded to another person in one concrete moment'",
  ],
  [
    "    : 'Angle B: process or judgment standard under cost';",
    "    : 'Angle B: focus on a decision where pressure forced a different standard';",
  ],
  [
    "  const about = 'This essay is about selecting the stronger conceptual center by testing reveal-power, evidence strength, and what missing detail would decisively break the tie.';",
    "  const about = 'This essay is about choosing one clear claim you can prove with a real scene, not mixing two directions in the same draft.';",
  ],
  [
    "  const why = `What A would reveal: responsibility in relationship. What B would reveal: judgment standard in action. Strongest current evidence for A: \"${evidenceA}\". Strongest current evidence for B: \"${evidenceB}\". Missing evidence that breaks the tie: one concrete scene where the decision and immediate consequence are both visible.`;",
    "  const why = `Angle A currently has this best support: \"${evidenceA}\". Angle B currently has this best support: \"${evidenceB}\". Pick the angle you can prove with one scene, one decision, and one immediate consequence.`;",
  ],
];

const patchedDirection = replaceAllStrict(directionSrc, directionReplacements, 'direction.ts');
const patchedCanonical = replaceAllStrict(canonicalSrc, canonicalReplacements, 'canonicalPage3Payload.ts');

fs.writeFileSync(directionPath, patchedDirection);
fs.writeFileSync(canonicalPath, patchedCanonical);

console.log(JSON.stringify({
  status: 'ok',
  patched: [
    'src/lib/fm/direction.ts',
    'src/lib/fm/canonicalPage3Payload.ts',
  ],
  direction_replacements: directionReplacements.length,
  canonical_replacements: canonicalReplacements.length,
}, null, 2));
