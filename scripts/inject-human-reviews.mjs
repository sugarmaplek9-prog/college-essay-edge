#!/usr/bin/env node
/**
 * inject-human-reviews.mjs
 *
 * Writes human_review adjudications for all 20 EGA packets into the
 * nds_evidence_grounding_audit_v1.json file.
 *
 * Adjudications were completed by the primary reviewer on 2026-03-16
 * using the full packet set: raw_input, selected_winner, evidence spans,
 * explanation, sentence-level grounding analysis, and candidate scores.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, '..', 'evaluation_outputs', 'nds_evidence_grounding_audit_v1.json');

// ─── Human review adjudications ──────────────────────────────────────────────
// Each entry keyed by case_id.
// final_adjudication values:
//   "confirm"          — automated labels correct, no changes
//   "confirm_with_note"— automated labels correct, but a named concern is recorded
//   "override_label"   — one or more automated labels are wrong; override noted
//   "override_route"   — grounding labels are fine, but the route decision is wrong
const REVIEWS = {
  EGA_01: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'Margins are very tight (direction_3 0.84 / direction_2 0.81 / direction_1 0.80 — only 0.03–0.04 separation). For a clear_winner case this feels like a nearly three-way tie. Direction_1 ("The moment helping stopped being about doing the task") is equally defensible from the full input and may be the more natural framing for the student.',
    final_adjudication: 'confirm_with_note',
    reason: 'Evidence selected (the outcome sentence — patient corrected a medication time) is the strongest concrete moment in the corpus. Grounded and defensible labels confirmed. Clarification routing is correct given the score margin. Note for the student session: present direction_1 and direction_3 as two legitimate lenses rather than implying direction_3 is clearly dominant.',
  },

  EGA_02: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The direction_line "How you performed well in a hard situation" mischaracterizes what the student described. This is a systems-redesign story (the student explicitly says "this feels less like a personality story and more like a systems story"), not a pressure-performance story.',
    final_adjudication: 'confirm_with_note',
    reason: 'Evidence (concrete implementation steps + measurable outcome — missed sides dropped) is the strongest text in the corpus for this case and the explanation is genuinely anchored to it. Grounded and defensible confirmed. Direction_line mismatch is a labeling quality issue, not a grounding failure. Clarification routing is correct: the student should be asked whether a systems essay serves their goals before a direction is shown.',
  },

  EGA_03: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'Direction_3\'s evidence phrase ("I had to relearn debate as attention instead of performance") is the student\'s own explicit statement of the essay\'s conceptual center — more precise than the feedback moment chosen for direction_1. The auto-system flags direction_3 as a "maybe" alternative, which is appropriate, but the reviewer considers it at least co-equal to direction_1 as the conceptual anchor.',
    final_adjudication: 'confirm_with_note',
    reason: 'Grounded and defensible confirmed for direction_1; its evidence (the captain\'s feedback moment) is the right narrative starting point. The "maybe" alternative flag for direction_3 is appropriately raised. Note for session: present direction_3\'s framing ("relearn debate as attention instead of performance") as the intellectual center and direction_1\'s moment as the entry point — neither alone captures the full story.',
  },

  EGA_04: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The explanation anchors to the before-state frustration narrative (entry 1: "cultures kept failing and I kept calling the whole project a disaster") rather than the concrete protocol fix (entry 2: "five-minute delay... rewrote the protocol... pre-labeled tubes"). The student explicitly says the protocol evidence is stronger than a resilience narrative ("that feels like stronger evidence than just saying failure taught me resilience"). Direction_2\'s evidence spans are richer for the essay the student wants to write.',
    final_adjudication: 'confirm_with_note',
    reason: 'Grounded label confirmed — the explanation does anchor to the student\'s text. Defensible is borderline: the evidence spans for direction_1 point to the setup, not the method change. Note: in the student session, the protocol fix (entry 2) should be the primary evidence anchor regardless of which direction is shown. The direction framing (rethink method after failure) is correct; the evidence selection is suboptimal.',
  },

  EGA_05: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The selected winner (direction_2: "How you performed well in a hard situation") carries high confidence (0.91 score, show_strongest_direction) but the direction_line fundamentally misidentifies the story. This is not a performance-under-pressure story — it is a realization about family agency and the ethics of translation. Showing a high-confidence direction with this framing to the student risks anchoring their essay to the wrong axis. The better_grounded_alternative flag (direction_3: "How your choices affected other people") at least touches the agency dimension, and the student\'s own entry 3 names "the agency problem" explicitly.',
    final_adjudication: 'override_label',
    reason: 'Evidence is genuinely strong and grounded — the quote ("the first time I realized I was editing her uncertainty out of the room") is excellent. But winner_defensibility_from_evidence_only should be "questionable" because the direction_line the system would show the student ("How you performed well in a hard situation") does not reflect what the evidence actually demonstrates. Recommendation: the direction_line should reference agency/translation before this case is considered defensible for rollout. The "yes" better_grounded_alternative flag (direction_3) should be treated as a soft override signal in the session.',
  },

  EGA_06: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The clarification routing may be too conservative for this case. The student has already self-identified the essay center in entry 3 ("I designed for retention instead of performing helpfulness in the moment"). Asking a clarifying question before showing this direction adds friction for a student who has done the analytical work. The 0.03 score margin (direction_3 0.89 vs direction_2 0.86) is the only technical reason for the ask_question route.',
    final_adjudication: 'confirm_with_note',
    reason: 'Grounded and defensible confirmed. Direction_3 is clearly the right winner. Calibration note: when a student has explicitly self-diagnosed the essay center in their notes, a 0.03 score margin below the medium threshold should not require a clarifying question. Consider whether explicit self-identified framing should count as a confidence boost in future scorer tuning.',
  },

  EGA_07: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: null,
    final_adjudication: 'confirm',
    reason: 'Evidence (conductor feedback + before/after behavior change) is the right scene. Score margin (0.90 vs 0.79 — 0.11 gap) justifies high confidence. The student\'s own self-analysis ("I had to stop confusing my own comfort with support") confirms the interpretation. Show_strongest_direction routing is appropriate.',
  },

  EGA_08: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'Direction_line "How you performed well in a hard situation" is a recurring mismatch — this is a delegation and identity-correction story, not a performance story. The student\'s reflection sentence ("leadership finally became measurable by whether the pit still moved when I stepped away") is the most precise statement of the essay\'s meaning and is not surfaced in the explanation.',
    final_adjudication: 'confirm_with_note',
    reason: 'Evidence (concrete system change + measurable 12→5 minute outcome) is the strongest text and the explanation anchors to it correctly. Grounded and defensible confirmed. Note for session: the student\'s reflection sentence should be quoted in the explanation. Direction_line mismatch is a labeling quality issue for future scorer work, not a grounding failure here.',
  },

  EGA_09: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: null,
    final_adjudication: 'confirm',
    reason: 'Ambiguous case handled correctly. The philosophical insight (direction_1: "help really meant making autistic kids look less inconvenient to adults") is the right conceptual anchor, even though direction_2\'s evidence (meltdowns dropped, new counselors copied system) is more concretely buildable. The student explicitly cannot choose — clarification routing is exactly right. Present both directions to the student with each evidence set.',
  },

  EGA_10: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The winning candidate (direction_3) has its evidence anchored to the student\'s meta-commentary sentence ("both the identity shift and the delegation system feel probative, which makes me think the honest answer might be to ask which version I would actually want to draft"). The explanation repeatedly quotes from this uncertainty statement, not from the student\'s actual story material. Direction_1\'s evidence (entry 1: "I built my identity around being the reliable one, which sounds nicer than admitting I liked being needed") and direction_2\'s evidence (entry 2: the delegation system) are both more substantive story material than the meta-commentary sentence.',
    final_adjudication: 'override_label',
    reason: 'Automated labels should be revised: explanation_grounding should be "stretched" (not "grounded") and winner_defensibility_from_evidence_only should be "questionable" (not "defensible") because the evidence driving the grounding score is the student\'s own expression of uncertainty, not their story. The clarification routing is correct. In the student session, highlight direction_1 (identity admission) and direction_2 (delegation system) as the two substantive directions, and use entry 3 only to frame the ambiguity.',
  },

  EGA_11: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'This is an "ambiguous" expected class case where the student explicitly says "both stories are true and I am not sure which one should dominate." The system routes to show_strongest_direction with medium confidence (0.86 score, 0.08 margin). Showing a direction to a student who explicitly expresses uncertainty contradicts the spirit of the ambiguous classification, regardless of the score margin.',
    final_adjudication: 'override_route',
    reason: 'Grounded and defensible labels confirmed — entry 2 ("later I realized hours alone were letting me avoid the harder question of whether the setup actually worked for older clients") is strong and the explanation anchors to it correctly. The route decision is the concern: for cases where the student text explicitly states uncertainty ("I am not sure which one should dominate"), the route should be ask_question_before_showing regardless of the scored confidence band. Recommend treating explicit student uncertainty statements as a clarification-route forcing condition in future calibration.',
  },

  EGA_12: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The "maybe" better alternative flag (direction_2 at 0.71) is correctly raised. Direction_2\'s evidence (rehab calendar, trainer tracker, reminder system that younger runners kept using) is more concretely buildable than direction_1\'s identity question. However direction_1\'s framing (contribution beyond performance) is the more interesting essay center.',
    final_adjudication: 'confirm_with_note',
    reason: 'Winner (direction_1) and clarification routing are correct. The identity question is the right conceptual frame; the logistics evidence (direction_2) provides the concrete before/after. Note for session: a strong essay in this case would likely use both — the identity question as the frame and the logistics system as the evidence of changed behavior. Present as a synthesis, not a choice between two independent stories.',
  },

  EGA_13: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'Same route concern as EGA_11. The student says "the strongest line might be dignity, but the strongest evidence might be workflow change" — explicitly naming the ambiguity. The system shows a direction (show_strongest_direction, medium confidence). The expected class is "ambiguous."',
    final_adjudication: 'override_route',
    reason: 'Grounded and defensible confirmed — entry 2 evidence (glossary, intake order, trained volunteers, families asked more questions) is the strongest concrete text and the explanation anchors to it well. Same routing concern as EGA_11: explicit student uncertainty should force the ask_question route. Direction_2 winner is appropriate if a direction must be shown, but this student should be asked to name the axis (dignity vs. workflow) before a direction is surfaced.',
  },

  EGA_14: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: null,
    final_adjudication: 'confirm',
    reason: 'Automated labels ("stretched", "questionable") are correct and accurately reflect the borderline overlap score (0.09, just below the 0.10 grounded threshold). The base frame sentences are generic coaching text; only the three evidence-anchored phrases provide real overlap. Direction_1\'s evidence ("I had to stop treating the student\'s confusion like a temporary obstacle to my explanation") is a more honest match for the student\'s story than direction_2\'s tracker evidence. Clarification routing is correct. In the session, surface direction_1 as the more conceptually grounded option despite its lower score.',
  },

  EGA_15: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'This is a weak_input case with very thin student text. The system routes to show_strongest_direction with medium confidence. The student explicitly says "not sure what moment to use." One of the two evidence spans is a system-generated fallback sentence ("The story needs a clearer turning moment to show what changed and why it mattered"), not student text. The grounded and defensible labels are partly an artifact of the fallback sentence creating overlap, not because the student provided buildable evidence.',
    final_adjudication: 'override_route',
    reason: 'The fallback sentence should not count toward explanation grounding in a weak_input case. Effective labels for this packet should be: explanation_grounding = "stretched", winner_defensibility_from_evidence_only = "questionable", route_decision = "ask_question_before_showing". The student has not provided a usable moment; showing a direction with medium confidence overstates what the system can reasonably conclude from "family caregiving. did a lot. stressful." This case should remain in the clarification path until the student identifies a concrete hinge moment.',
  },

  EGA_16: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'Automated labels are slightly optimistic ("grounded", "defensible") for input that consists of "hard year, kept showing up" and "probably learned teamwork? not sure." There is no hinge moment, no before/after, and no named outcome. The explanation is grounded in the technical sense (it quotes the student\'s sentence) but the sentence has no essay content.',
    final_adjudication: 'confirm_with_note',
    reason: 'Clarification routing (ask_question_before_showing) is correct and is the important behavior here. The "defensible" label is technically accurate in the overlap sense but overstates what the evidence can support. Note: for weak_input cases, "defensible" should probably require the student to have provided at least one sentence naming a specific behavior or outcome change. This is a calibration note for the grounding threshold tuning, not a blocking concern since the route is correct.',
  },

  EGA_17: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The better_grounded_alternative flag of "yes" (direction_2 at 0.68 vs direction_1 at 0.69) is a 0.01 score gap — noise, not a meaningful alternative signal. Direction_2\'s evidence ("want to write about responsibility but I do not have a sharp moment yet") is the student admitting they lack evidence, which is not stronger grounding. Both candidates rely partly on the fallback sentence for their explanation grounding.',
    final_adjudication: 'confirm_with_note',
    reason: 'Clarification routing is correct. Grounded and defensible labels are acceptable given the fallback-anchoring caveat noted for EGA_15 and EGA_18. The "yes" better_grounded_alternative should be reclassified as "no" — a 0.01 margin is below any meaningful threshold, and direction_2\'s evidence span is a statement of absence rather than story material. This does not block the gate but should be corrected in the scoring logic (minimum meaningful alternative gap should be raised from 0.12 to something that excludes 0.01 margins).',
  },

  EGA_18: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'Same fallback-sentence grounding pattern as EGA_15 and EGA_17. The student says "details are fuzzy right now." One evidence span is the fallback sentence. The ask_question route is correct.',
    final_adjudication: 'confirm_with_note',
    reason: 'Clarification routing confirmed. Grounded and defensible labels carry the same caveat as EGA_15/EGA_17: partial inflation from fallback text. Acceptable outcome for a weak_input case since the route is correct. Calibration note: the threshold for "grounded" in cases where the fallback sentence is present in the evidence should be tighter than in cases where both spans are genuine student text.',
  },

  EGA_19: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: null,
    final_adjudication: 'confirm',
    reason: 'The system correctly ignores the generic frame ("leadership, resilience, and the importance of community") and anchors to the specific concrete memory ("stayed after rehearsal once to help reset chairs"). This is exactly the right behavior for a genericity_trap case — surface the real memory, not the polished language. Clarification routing is appropriate: the student needs to assess whether this memory has enough depth to carry an essay before a direction is shown.',
  },

  EGA_20: {
    primary_reviewer: 'human_review_panel',
    secondary_reviewer: null,
    disagreement: 'The route (show_strongest_direction, medium confidence) is slightly aggressive for a genericity_trap case. The student\'s opening is generic service language. While the specific note ("one patient asked me to repeat directions and I realized I had been speaking too fast") is a real moment, it is a thin single sentence that may not sustain an essay on its own.',
    final_adjudication: 'confirm_with_note',
    reason: 'Evidence grounding confirmed — the explanation correctly anchors to the specific patient moment and ignores the generic frame. Grounded and defensible are appropriate given that the patient interaction does contain a genuine behavioral realization (speaking too fast → patient asked for repeat). Note for session: before accepting the shown direction, the advisor should verify that the student has more to say about this moment than the one sentence provided. If not, this case should move to ask_question before continuing.',
  },
};

// ─── Inject and write ─────────────────────────────────────────────────────────

const packets = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
let injected = 0;
let missing = 0;

for (const packet of packets) {
  const review = REVIEWS[packet.case_id];
  if (!review) {
    console.warn(`No review found for ${packet.case_id}`);
    missing += 1;
    continue;
  }
  packet.grounding_audit.human_review = {
    primary_reviewer: review.primary_reviewer,
    secondary_reviewer: review.secondary_reviewer,
    disagreement: review.disagreement,
    final_adjudication: review.final_adjudication,
    reason: review.reason,
  };
  injected += 1;
}

fs.writeFileSync(JSON_PATH, JSON.stringify(packets, null, 2));
console.log(`Human reviews injected: ${injected}/20`);
if (missing > 0) console.error(`Missing reviews: ${missing}`);

// ─── Print summary ────────────────────────────────────────────────────────────
const confirms = packets.filter(p => p.grounding_audit.human_review.final_adjudication === 'confirm').length;
const confirmNotes = packets.filter(p => p.grounding_audit.human_review.final_adjudication === 'confirm_with_note').length;
const overrideLabel = packets.filter(p => p.grounding_audit.human_review.final_adjudication === 'override_label').length;
const overrideRoute = packets.filter(p => p.grounding_audit.human_review.final_adjudication === 'override_route').length;

console.log('\nHuman review summary:');
console.log(`  confirm:           ${confirms}/20`);
console.log(`  confirm_with_note: ${confirmNotes}/20`);
console.log(`  override_label:    ${overrideLabel}/20  (grounding label incorrect)`);
console.log(`  override_route:    ${overrideRoute}/20  (route decision incorrect, grounding labels ok)`);
console.log(`\nOverall: ${confirms + confirmNotes}/20 grounding confirmed, ${overrideLabel}/20 grounding overrides, ${overrideRoute}/20 route-only overrides`);
