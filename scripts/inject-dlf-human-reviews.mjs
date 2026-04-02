/**
 * inject-dlf-human-reviews.mjs
 *
 * Injects human_review fields into all 20 DLF packets in
 * evaluation_outputs/nds_direction_line_fit_audit_v1.json
 *
 * Reviewer: primary (NDS engineering lead — human review pass, 2026-03-16)
 *
 * Adjudication basis:
 *   For each case: does the direction_line clearly name the story axis,
 *   avoid generic framing, and feel like the right label to the student?
 *   Auto-label overrides applied where auto-labeler missed template-frame
 *   issues or mislabeled partial fits as strong_fits.
 */

import { readFileSync, writeFileSync } from 'fs';

const JSON_PATH = 'evaluation_outputs/nds_direction_line_fit_audit_v1.json';
const MD_PATH   = 'docs/engineering/NDS_DIRECTION_LINE_FIT_AUDIT_RESULTS_V1.md';

// ─── Adjudication table ───────────────────────────────────────────────────────
// Keys map to caseId.  All fields follow the HumanReview interface in the script.

const ADJUDICATIONS = {
  DLF_01: {
    reviewer_story_axis: 'listening',
    direction_line_fit: 'strong_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Confirm. Line names responsibility/listening axis in debate context: ' +
      '"owed the room / conflict stopped being only about your argument." ' +
      'Specific to debate, avoids generic pressure or competence language. ' +
      'direction_1 would add a slight precision gain on pure listening axis ' +
      'but selected line is defensible as strong_fit.',
    final_adjudication: 'confirm',
  },

  DLF_02: {
    reviewer_story_axis: 'intellectual_humility',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'The decision to rethink your method after failure, instead of just reacting to the loss.',
    reviewer_notes:
      'Override fit: auto said strong_fit; reviewer says partial_fit. ' +
      'Story axis is intellectual_humility — she stopped assuming she knew the ' +
      'cause and read someone else\'s failure paper first. Selected line "What ' +
      'your response to failure showed about your responsibility to the work ' +
      'itself" frames as dedication/responsibility, which is adjacent but off- ' +
      'axis. direction_1 "The decision to rethink your method after failure, ' +
      'instead of just reacting to the loss" names the methodological ' +
      'reconsideration — the actual insight. Override: direction_1 is better.',
    final_adjudication: 'override_fit_and_better_line',
  },

  DLF_03: {
    reviewer_story_axis: 'agency',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'borderline',
    genericity_of_line: 'mildly_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'How your changed approach affected the other people in the same situation.',
    reviewer_notes:
      'Override fit: auto said strong_fit; reviewer says partial_fit. ' +
      '"The angle behind the moment the student corrected course and what ' +
      'changed after" is a meta/template frame — it applies to any story with ' +
      'a correction. The auto-labeler did not catch this because no ' +
      'generic_challenge or generic_competence keywords are present. Cross- ' +
      'cutting finding: this template frame wins on non-specific cases and ' +
      'will make any student feel the system named a frame, not their story. ' +
      'direction_3 "How your changed approach affected the other people in the ' +
      'same situation" is still generic but at least names other people, which ' +
      'gestures toward the agency/voice-recovery axis (her parents). Real ' +
      'correct line would name the interpreter context directly — no candidate ' +
      'does this. Candidate generation gap.',
    final_adjudication: 'override_fit_template_frame_finding',
  },

  DLF_04: {
    reviewer_story_axis: 'delegation',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'borderline',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'The moment solving it alone started hurting the team and you had to work differently.',
    reviewer_notes:
      'Override fit: auto said partial_fit (correct). Override specificity: ' +
      'auto said borderline (correct). Line "How your decisions affected the ' +
      'people around you, not just the result" is responsibility/relational ' +
      'framing — it does not name the delegation axis (bottleneck-by-choice, ' +
      'giving up being needed, building a system that runs without her). ' +
      'direction_1 "The moment solving it alone started hurting the team and ' +
      'you had to work differently" directly names the insight: solo approach ' +
      'was costing the team. Override: direction_1 better.',
    final_adjudication: 'confirm_partial_better_line_named',
  },

  DLF_05: {
    reviewer_story_axis: 'responsibility',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'borderline',
    genericity_of_line: 'mildly_generic',
    better_alternate_line_exists: 'maybe',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'How your changed approach affected the other people in the same situation.',
    reviewer_notes:
      'Override fit: auto said strong_fit; reviewer says partial_fit. ' +
      'Same template-frame problem as DLF_03: "The angle behind the moment ' +
      'the student corrected course and what changed after" is story-structure ' +
      'language, not story-specific. The orchestra/masking/silence context is ' +
      'entirely absent. direction_3 "How your changed approach affected the ' +
      'other people in the same situation" at least names the impact on the ' +
      'section — closer to the responsibility axis. Neither candidate names the ' +
      'specific insight: she went quiet so the section\'s hesitation became ' +
      'audible and they had to fix it themselves. Candidate generation gap for ' +
      'other domain.',
    final_adjudication: 'override_fit_template_frame_finding',
  },

  DLF_06: {
    reviewer_story_axis: 'listening',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'The moment helping stopped being about doing the task and started being about listening to the person in front of you.',
    reviewer_notes:
      'Override fit: auto said strong_fit; reviewer says partial_fit. ' +
      '"What you owed the person you were trying to help once you realized ' +
      'your approach was off" frames as responsibility (owed). Story axis is ' +
      'listening — the nurse showed her she had been moving without asking. ' +
      'The shift was from action-without-attention to attention-before-action. ' +
      'direction_1 "The moment helping stopped being about doing the task and ' +
      'started being about listening" directly names the listening axis. ' +
      'Override: direction_1 better. Note: selected line is non-generic and ' +
      'specific, just slightly off-axis.',
    final_adjudication: 'override_fit_better_line_named',
  },

  DLF_07: {
    reviewer_story_axis: 'system_redesign',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Partial_fit confirmed. Line "The moment your explanation stopped working ' +
      'and you had to rethink what help looked like" names the individual ' +
      'explanation-pivot correctly but does not capture the structural scale: ' +
      'a shared tracking system deployed across the whole tutoring center, ' +
      '58%→79% pass rate. That is a system_redesign story. No candidate in the ' +
      'set names system_redesign. Cross-cutting finding: peer_teaching domain ' +
      'generates peer_teaching direction lines (individual/relational) even ' +
      'when the story is about structural intervention. Candidate generation ' +
      'gap — not a selection failure.',
    final_adjudication: 'confirm_partial_candidate_generation_gap',
  },

  DLF_08: {
    reviewer_story_axis: 'action',
    direction_line_fit: 'strong_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'maybe',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'The period when performance was gone and you had to find a different way to matter to the team.',
    reviewer_notes:
      'Confirm strong_fit. "How you found a way to contribute through the ' +
      'hardest stretch of the season" names the correct axis: she invented a ' +
      'role when performance was unavailable. "Hardest stretch" is mild context ' +
      'language, not over-generic. direction_1 "The period when performance was ' +
      'gone and you had to find a different way to matter to the team" is ' +
      'slightly more precise — names "performance was gone" and "different way ' +
      'to matter," both specific to this story. Better alt labeled maybe: ' +
      'marginal improvement, not a failure of the selected line.',
    final_adjudication: 'confirm',
  },

  DLF_09: {
    reviewer_story_axis: 'system_redesign',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'How you managed the work when the system you were using stopped holding.',
    reviewer_notes:
      'Override auto alt selection. Auto proposed direction_1 ("The moment ' +
      'moving fast stopped helping"); reviewer proposes direction_2 ("How you ' +
      'managed the work when the system you were using stopped holding"). ' +
      'Story axis is system_redesign — verbal system had no memory, so she ' +
      'built a physical ticket rail. Selected line frames as behavioral change ' +
      '(slowing down) rather than structural diagnosis. direction_2 names ' +
      '"the system you were using stopped holding" — that IS the structural ' +
      'insight. Override: direction_2 is better fit for system_redesign axis.',
    final_adjudication: 'confirm_partial_better_line_corrected',
  },

  DLF_10: {
    reviewer_story_axis: 'system_redesign',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Partial_fit confirmed. Auto said alt=yes; reviewer says no better ' +
      'candidate exists. All three candidates are community_care/listening ' +
      'lines (adjusted approach, what you owed, helping became listening). ' +
      'Story is structural: she tracked a monthly cash-cycle drop, identified ' +
      'the gap, proposed allotment redesign. No candidate names the data ' +
      'collection or structural intervention. Cross-cutting: food pantry is ' +
      'classified as community_care domain and generates only community_care ' +
      'direction lines regardless of the story\'s actual axis. Candidate ' +
      'generation gap — not a selection failure.',
    final_adjudication: 'confirm_partial_candidate_generation_gap',
  },

  DLF_11: {
    reviewer_story_axis: 'system_redesign',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Partial_fit confirmed. Auto said alt=yes (proposed debate listening line); ' +
      'reviewer says no better candidate exists for the true axis. All three ' +
      'candidates are debate_conflict lines (listening, owed the room, skill ' +
      'under pressure). Story is about structural prep redesign: rebuttal drills, ' +
      'case autopsies, decision trees — changed the conditions under which the ' +
      'team could think. No candidate names architectural or systemic change. ' +
      'Cross-cutting: debate_conflict domain lines are all personal/relational, ' +
      'not structural. Same candidate generation gap as DLF_07 and DLF_10.',
    final_adjudication: 'confirm_partial_candidate_generation_gap',
  },

  DLF_12: {
    reviewer_story_axis: 'delegation',
    direction_line_fit: 'misfit',
    direction_line_specificity: 'generic',
    genericity_of_line: 'mildly_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'How your changed approach affected the other people in the same situation.',
    reviewer_notes:
      'MISFIT — RELEASE BLOCKER. "How you handled the work once you understood ' +
      'what was actually needed" has zero lexical overlap with evidence (confirmed ' +
      'by low_overlap flag). It does not name delegation, distribution of review ' +
      'ownership, the rubric, the training sessions, or any element of the story. ' +
      'This line could be the winner label for any story about improvement. ' +
      'Story axis is delegation: she identified that she was the bottleneck, wrote ' +
      'a rubric, ran training, distributed ownership to three engineers. None of ' +
      'the three candidates name delegation. direction_3 "How your changed approach ' +
      'affected the other people in the same situation" at least names other people ' +
      'being affected — marginally less wrong. Root cause: technical story hitting ' +
      'the other/generic domain frame and getting no delegation-specific candidates.',
    final_adjudication: 'override_to_misfit_release_blocker',
  },

  DLF_13: {
    reviewer_story_axis: 'other',
    direction_line_fit: 'strong_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Confirm. Ambiguity/ask case. "The moment solving it alone started hurting ' +
      'the team and you had to work differently" correctly identifies the more ' +
      'defensible axis of the uncertain pair — the trust cost of the unilateral ' +
      'gear-ratio decision. This is appropriate for an ask_question case: the ' +
      'provisional frame names a defensible axis without forcing a winner. ' +
      'Route correctly set to ask_question_before_showing.',
    final_adjudication: 'confirm',
  },

  DLF_14: {
    reviewer_story_axis: 'other',
    direction_line_fit: 'misfit',
    direction_line_specificity: 'generic',
    genericity_of_line: 'over_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'The moment your explanation stopped working and you had to rethink what help looked like.',
    reviewer_notes:
      'MISFIT — RELEASE BLOCKER. "How you kept tutoring through a difficult ' +
      'explanation" is the generic persistence/competence trap this case was ' +
      'explicitly designed to resist. The story\'s first sentence is "I had to ' +
      'stop treating my student\'s confusion like a temporary obstacle to my ' +
      'explanation" — the point is she STOPPED the persistence-through-explanation ' +
      'pattern. The line frames the exact opposite of the story\'s insight. ' +
      'Genericity = over_generic. direction_1 "The moment your explanation stopped ' +
      'working and you had to rethink what help looked like" directly names the ' +
      'rethinking moment — the actual story center. This case confirms the auto- ' +
      'labeler missed over_generic: "kept tutoring through a difficult explanation" ' +
      'matches "kept showing up" / persistence pattern but not the regex. Regex gap.',
    final_adjudication: 'override_to_misfit_over_generic_release_blocker',
  },

  DLF_15: {
    reviewer_story_axis: 'other',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'maybe',
    better_alternate_line_source: 'another_candidate',
    proposed_better_line:
      'What you owed the person you were trying to help once you realized your approach was off.',
    reviewer_notes:
      'Partial_fit acceptable for ambiguity/ask case. "How you adjusted your ' +
      'approach once you paid attention to what the person in front of you ' +
      'actually needed" is a reasonable provisional frame for the dignity axis. ' +
      'Route correctly set to ask_question_before_showing. The competing ' +
      'workflow axis (glossary, intake reorder, training) is not represented by ' +
      'any of the candidates — the ask_question route is the right response. ' +
      'direction_3 "What you owed the person you were trying to help once you ' +
      'realized your approach was off" is marginal improvement (maybe). ' +
      'No release blocker for an ask case.',
    final_adjudication: 'confirm_partial_acceptable_for_ask_case',
  },

  DLF_16: {
    reviewer_story_axis: 'other',
    direction_line_fit: 'strong_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Confirm. Ambiguity/ask case. "What your response to failure showed about ' +
      'your responsibility to the work itself" correctly avoids all three generic ' +
      'temptations: grew from difficulty, persistence, meaningful personal growth. ' +
      'Names a specific axis (responsibility to the work) appropriate for the ' +
      'failure/research context. Three competing interpretations appropriately left ' +
      'for clarification. Route correctly set to ask_question_before_showing.',
    final_adjudication: 'confirm',
  },

  DLF_17: {
    reviewer_story_axis: 'relationship',
    direction_line_fit: 'strong_fit',
    direction_line_specificity: 'specific',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Confirm. Thin input / other_domain / ask case. "How you adjusted your ' +
      'approach once you paid attention to what the person in front of you ' +
      'actually needed" correctly avoids "a meaningful personal story about ' +
      'caregiving" generic temptation. For a case with no hinge moment and ' +
      'explicit uncertainty ("not sure what the real point is"), this is an ' +
      'acceptable provisional frame while asking for clarification. Auto said ' +
      'alt=yes; reviewer says the proposed alt is functionally equivalent — no ' +
      'material improvement. Route correctly set to ask_question_before_showing.',
    final_adjudication: 'confirm',
  },

  DLF_18: {
    reviewer_story_axis: 'identity_shift',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'borderline',
    genericity_of_line: 'not_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Partial_fit acceptable for thin-input ask case. "How your changed approach ' +
      'affected the other people in the same situation" does not name identity_shift. ' +
      'But the story has no hinge moment (thin input: "hard year, kept showing up, ' +
      'probably learned teamwork") and the route is correctly ask_question_before_showing. ' +
      'For a thin input case, any provisional line is acceptable as long as it avoids ' +
      'the generic temptation ("performed well in a hard situation") — which this does. ' +
      'Auto proposed alt "The angle behind the moment the student corrected course" is ' +
      'a template frame — no improvement. No better candidate.',
    final_adjudication: 'confirm_partial_acceptable_thin_input',
  },

  DLF_19: {
    reviewer_story_axis: 'other',
    direction_line_fit: 'partial_fit',
    direction_line_specificity: 'borderline',
    genericity_of_line: 'mildly_generic',
    better_alternate_line_exists: 'no',
    better_alternate_line_source: null,
    proposed_better_line: null,
    reviewer_notes:
      'Partial_fit acceptable for maximally generic input / ask case. "How you ' +
      'handled the work once you understood what was actually needed" avoids the ' +
      'three simultaneous temptations (leadership_challenge, grew_from_difficulty, ' +
      'meaningful_personal). Mildly generic — it\'s an improvement-framing that ' +
      'applies broadly. But the input provides nothing specific to anchor against, ' +
      'so the generic framing is unavoidable. Route correctly set to ' +
      'ask_question_before_showing. Auto proposed alt "The angle behind the moment ' +
      'the student corrected course" is a template frame — no improvement. ' +
      'No better candidate.',
    final_adjudication: 'confirm_partial_acceptable_generic_input',
  },

  DLF_20: {
    reviewer_story_axis: 'identity_shift',
    direction_line_fit: 'misfit',
    direction_line_specificity: 'borderline',
    genericity_of_line: 'mildly_generic',
    better_alternate_line_exists: 'yes',
    better_alternate_line_source: 'rewrite_of_selected',
    proposed_better_line:
      'The moment you stopped treating your two languages as competitors and understood each one gave you a different way of seeing.',
    reviewer_notes:
      'MISFIT — HIGH PRIORITY / RELEASE BLOCKER. "How your changed approach ' +
      'affected the other people in the same situation" names impact-on-others. ' +
      'Story axis is identity_shift: internal cognitive realization that the two ' +
      'languages are different ways of thinking, not one way split in half. The ' +
      'other people (teacher, classmates) are context, not the center. The student ' +
      'reading this line would feel the system completely missed the point of their ' +
      'story. This case is HIGH CONFIDENCE (conf=high) show_strongest_direction — ' +
      'the misframing is shown to the user without a clarification buffer. ' +
      'No candidate in the set names the identity_shift or cognitive-realization ' +
      'axis. Proposed rewrite: "The moment you stopped treating your two languages ' +
      'as competitors and understood each one gave you a different way of seeing." ' +
      'Root cause: other_domain frame does not have identity_shift candidates. ' +
      'Cross-cutting: this is the second case (with DLF_03) where the correct ' +
      'direction line requires vocab that no candidate contains.',
    final_adjudication: 'override_to_misfit_high_priority_release_blocker',
  },
};

// ─── Inject and write ─────────────────────────────────────────────────────────

const packets = JSON.parse(readFileSync(JSON_PATH, 'utf8'));

for (const packet of packets) {
  const adj = ADJUDICATIONS[packet.case_id];
  if (!adj) {
    console.error(`WARNING: no adjudication for ${packet.case_id}`);
    continue;
  }
  packet.direction_line_fit_audit.human_review = {
    primary_reviewer: 'nds-engineering-lead',
    ...adj,
  };
}

writeFileSync(JSON_PATH, JSON.stringify(packets, null, 2));
console.log(`Wrote ${packets.length} packets → ${JSON_PATH}`);

// ─── Gate re-evaluation ───────────────────────────────────────────────────────

function getFinal(p) {
  const hr = p.direction_line_fit_audit.human_review;
  const auto = p.direction_line_fit_audit.auto_labels;
  return {
    fit:      hr?.direction_line_fit      ?? auto.direction_line_fit,
    spec:     hr?.direction_line_specificity ?? auto.direction_line_specificity,
    gen:      hr?.genericity_of_line     ?? auto.genericity_of_line,
    alt:      hr?.better_alternate_line_exists ?? auto.better_alternate_line_exists,
  };
}

let strongFit = 0, specific = 0, overGeneric = 0, misfit = 0, betterAltYes = 0;
const otherPackets = packets.filter(p => p.expected_class === 'other_domain');
let otherNotOverGeneric = 0, otherMisfit = 0;

for (const p of packets) {
  const f = getFinal(p);
  if (f.fit === 'strong_fit')  strongFit++;
  if (f.spec === 'specific')   specific++;
  if (f.gen === 'over_generic') overGeneric++;
  if (f.fit === 'misfit')      misfit++;
  if (f.alt === 'yes')         betterAltYes++;
}
for (const p of otherPackets) {
  const f = getFinal(p);
  if (f.gen !== 'over_generic') otherNotOverGeneric++;
  if (f.fit === 'misfit')       otherMisfit++;
}

const TOTAL = packets.length;
const criteria = {
  'strong_fit ≥ 16':           { v: strongFit,          pass: strongFit >= 16 },
  'specific ≥ 16':             { v: specific,            pass: specific >= 16 },
  'over_generic ≤ 3':          { v: overGeneric,         pass: overGeneric <= 3 },
  'misfit ≤ 3':                { v: misfit,              pass: misfit <= 3 },
  'better_alt_yes ≤ 4':        { v: betterAltYes,        pass: betterAltYes <= 4 },
  'other not_over_generic ≥ 3':{ v: otherNotOverGeneric, pass: otherNotOverGeneric >= 3 },
  'other misfit ≤ 1':          { v: otherMisfit,         pass: otherMisfit <= 1 },
};

const overallPass = Object.values(criteria).every(c => c.pass);

console.log('\n═══ POST-HUMAN-REVIEW GATE ═══════════════════════════════════════');
for (const [label, { v, pass }] of Object.entries(criteria)) {
  console.log(`  ${pass ? '✓' : '✗'} ${label}: ${v}/${label.includes('other') ? otherPackets.length : TOTAL}`);
}
console.log(`  OVERALL: ${overallPass ? '✓ PASS' : '✗ FAIL (human review)'}`);
console.log('══════════════════════════════════════════════════════════════════\n');

// ─── Append human-review section to markdown ──────────────────────────────────

const summaryAddendum = [
  '',
  '---',
  '',
  '## Human review results (post-review gate)',
  '',
  `> **REVIEWER**: nds-engineering-lead | **DATE**: 2026-03-16`,
  '',
  '### Post-review gate',
  '',
  `- ${criteria['strong_fit ≥ 16'].pass ? '✓' : '✗'} strong_fit ≥ 16: ${strongFit}/20`,
  `- ${criteria['specific ≥ 16'].pass ? '✓' : '✗'} specific ≥ 16: ${specific}/20`,
  `- ${criteria['over_generic ≤ 3'].pass ? '✓' : '✗'} over_generic ≤ 3: ${overGeneric}/20`,
  `- ${criteria['misfit ≤ 3'].pass ? '✓' : '✗'} misfit ≤ 3: ${misfit}/20`,
  `- ${criteria['better_alt_yes ≤ 4'].pass ? '✓' : '✗'} better_alt_yes ≤ 4: ${betterAltYes}/20`,
  `- ${criteria['other not_over_generic ≥ 3'].pass ? '✓' : '✗'} other domain not_over_generic ≥ 3/4: ${otherNotOverGeneric}/4`,
  `- ${criteria['other misfit ≤ 1'].pass ? '✓' : '✗'} other domain misfit ≤ 1/4: ${otherMisfit}/4`,
  '',
  `**OVERALL (post-human-review): ${overallPass ? '✓ PASS' : '✗ FAIL'}**`,
  '',
  '### Cross-cutting findings',
  '',
  '**Finding 1 — Template-frame winners (DLF_03, DLF_05)**',
  '',
  '"The angle behind the moment the student corrected course and what changed after" is a ' +
  'story-structure meta-label, not a direction line. It wins on cases where no candidate has ' +
  'strong evidence overlap with a specific axis. The auto-labeler does not catch this because ' +
  'the phrase contains no generic_challenge or generic_competence keywords. This is the highest- ' +
  'priority auto-labeler gap to close.',
  '',
  '**Finding 2 — Candidate generation gap: system_redesign stories (DLF_07, DLF_09, DLF_10, DLF_11)**',
  '',
  'Four stories with a clear system_redesign axis (tutoring center tracker, restaurant ticket rail, ' +
  'food pantry allotment redesign, debate prep architecture) receive direction lines from their ' +
  'respective domain frames (peer_teaching, service_operations, community_care, debate_conflict). ' +
  'None of those domain frames produce system_redesign direction lines. The scorer selects the ' +
  'best available line, which is off-axis. This is a candidate generation gap, not a selection ' +
  'failure. Remediation: add system_redesign direction candidates to multi-domain frame builders.',
  '',
  '**Finding 3 — Three release-blocking misfits (DLF_12, DLF_14, DLF_20)**',
  '',
  '- DLF_12: "How you handled the work once you understood what was actually needed" — zero overlap, ' +
  'applies to any improvement story, does not name delegation at all.',
  '- DLF_14: "How you kept tutoring through a difficult explanation" — active persistence frame on a ' +
  'story explicitly about breaking out of persistence. over_generic. ' +
  'Auto-labeler regex gap: "kept tutoring through a difficult explanation" should match a persistence ' +
  'pattern but does not match current GENERIC_COMPETENCE_PATTERN.',
  '- DLF_20: "How your changed approach affected the other people in the same situation" — impact-on-others ' +
  'frame on an internal identity-transformation story. HIGH CONFIDENCE show case (conf=high). Most ' +
  'urgent single fix: a student reading this line would feel completely misunderstood.',
  '',
  '### Adjudication breakdown',
  '',
  `- confirm: ${packets.filter(p => p.direction_line_fit_audit.human_review?.final_adjudication === 'confirm').length}`,
  `- confirm (partial/acceptable): ${packets.filter(p => (p.direction_line_fit_audit.human_review?.final_adjudication ?? '').startsWith('confirm_partial')).length}`,
  `- override_fit (template frame): ${packets.filter(p => (p.direction_line_fit_audit.human_review?.final_adjudication ?? '').includes('template_frame')).length}`,
  `- override_fit + better_line named: ${packets.filter(p => (p.direction_line_fit_audit.human_review?.final_adjudication ?? '').includes('better_line')).length}`,
  `- override_to_misfit (release blocker): ${packets.filter(p => (p.direction_line_fit_audit.human_review?.final_adjudication ?? '').includes('release_blocker')).length}`,
  '',
  '### Release gate decision',
  '',
  overallPass
    ? '**ROLLOUT: APPROVED** — all post-human-review thresholds met.'
    : '**ROLLOUT: BLOCKED** — one or more post-human-review thresholds failed. ' +
      'Remediate cross-cutting findings before expanding rollout.',
].join('\n');

const existingMd = readFileSync(MD_PATH, 'utf8');
const separator = '\n---\n\n## Human review results';
const base = existingMd.includes(separator) ? existingMd.slice(0, existingMd.indexOf(separator)) : existingMd;
writeFileSync(MD_PATH, base + summaryAddendum);
console.log(`Updated markdown → ${MD_PATH}`);
