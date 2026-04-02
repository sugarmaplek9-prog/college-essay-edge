# DISTRIBUTION_SHIFT_PATTERN_DIAGNOSTIC_RESULTS_V1

## protocol purpose

Diagnose residual distribution-shift failures by behavioral pattern (not class), with subsystem ownership, trust risk concentration, and next surgical sprint recommendation.

## residual case universe

- expected from class-repair artifact: 38
- diagnosed cases available: 39
- inclusion-rule matched cases: 39

## overall residual profile classification

- assessment: pattern_concentrated
- explanation: Residual failures now cluster into a small set of recurring behavioral patterns suitable for a surgical sprint.

## behavioral pattern table

| behavioral pattern | total count | high-risk concentration | dominant subsystem owner | dominant classes | fix priority |
|---|---:|---:|---|---|---|
| indirect_hinge_underread | 10 | 2/10 | candidate_generation | achievement_stacked_emotionally_thin, weak_student_low_skill, culturally_indirect_non_default | P1 |
| false_premium_confidence | 8 | 3/8 | trust_calibration | over_polished_hollow, parent_overwritten_adult_shaped, achievement_stacked_emotionally_thin | P1 |
| careful_but_unhelpful_output | 8 | 2/8 | explanation_layer | messy_real_style_note_dump, parent_overwritten_adult_shaped, achievement_stacked_emotionally_thin | P1 |
| weak_note_latent_signal_miss | 6 | 3/6 | candidate_generation | weak_student_low_skill | P1 |
| low_explicit_reflection_penalty | 5 | 0/5 | scorer | over_polished_hollow, messy_real_style_note_dump, achievement_stacked_emotionally_thin | P2 |
| contradiction_shallow_competition | 2 | 1/2 | routing_calibration | contradictory_multi_center, messy_real_style_note_dump | P2 |

## subsystem ownership table

| subsystem owner | owned residual count | high trust-risk count | top behavioral patterns |
|---|---:|---:|---|
| candidate_generation | 16 | 5 | indirect_hinge_underread, weak_note_latent_signal_miss |
| trust_calibration | 8 | 3 | false_premium_confidence |
| explanation_layer | 8 | 2 | careful_but_unhelpful_output |
| scorer | 5 | 0 | low_explicit_reflection_penalty |
| routing_calibration | 2 | 1 | contradiction_shallow_competition |

## high-trust-risk residuals

- DSE_02 (weak_student_low_skill) — weak_note_latent_signal_miss; owner=candidate_generation; reaction=feels_overpraised_but_not_helped
- DSE_03 (weak_student_low_skill) — weak_note_latent_signal_miss; owner=candidate_generation; reaction=feels_overpraised_but_not_helped
- DSE_05 (weak_student_low_skill) — weak_note_latent_signal_miss; owner=candidate_generation; reaction=feels_overpraised_but_not_helped
- DSE_12 (parent_overwritten_adult_shaped) — false_premium_confidence; owner=trust_calibration; reaction=mixed
- DSE_15 (parent_overwritten_adult_shaped) — careful_but_unhelpful_output; owner=explanation_layer; reaction=mixed
- DSE_16 (parent_overwritten_adult_shaped) — false_premium_confidence; owner=trust_calibration; reaction=mixed
- DSE_17 (parent_overwritten_adult_shaped) — indirect_hinge_underread; owner=candidate_generation; reaction=mixed
- DSE_18 (parent_overwritten_adult_shaped) — careful_but_unhelpful_output; owner=explanation_layer; reaction=mixed
- DSE_22 (over_polished_hollow) — false_premium_confidence; owner=trust_calibration; reaction=feels_overpraised_but_not_helped
- DSE_32 (contradictory_multi_center) — contradiction_shallow_competition; owner=routing_calibration; reaction=feels_overpraised_but_not_helped
- DSE_40 (culturally_indirect_non_default) — indirect_hinge_underread; owner=candidate_generation; reaction=feels_overpraised_but_not_helped

## top 10 remaining generalization trust breaks

1. DSE_40 (culturally_indirect_non_default) — indirect_hinge_underread; risk=high; reaction=feels_overpraised_but_not_helped; owner=candidate_generation
2. DSE_03 (weak_student_low_skill) — weak_note_latent_signal_miss; risk=high; reaction=feels_overpraised_but_not_helped; owner=candidate_generation
3. DSE_02 (weak_student_low_skill) — weak_note_latent_signal_miss; risk=high; reaction=feels_overpraised_but_not_helped; owner=candidate_generation
4. DSE_18 (parent_overwritten_adult_shaped) — careful_but_unhelpful_output; risk=high; reaction=mixed; owner=explanation_layer
5. DSE_32 (contradictory_multi_center) — contradiction_shallow_competition; risk=high; reaction=feels_overpraised_but_not_helped; owner=routing_calibration
6. DSE_12 (parent_overwritten_adult_shaped) — false_premium_confidence; risk=high; reaction=mixed; owner=trust_calibration
7. DSE_16 (parent_overwritten_adult_shaped) — false_premium_confidence; risk=high; reaction=mixed; owner=trust_calibration
8. DSE_05 (weak_student_low_skill) — weak_note_latent_signal_miss; risk=high; reaction=feels_overpraised_but_not_helped; owner=candidate_generation
9. DSE_22 (over_polished_hollow) — false_premium_confidence; risk=high; reaction=feels_overpraised_but_not_helped; owner=trust_calibration
10. DSE_17 (parent_overwritten_adult_shaped) — indirect_hinge_underread; risk=high; reaction=mixed; owner=candidate_generation

## benchmark-mismatch candidates

- none flagged in this run

## recommended next sprint

- recommended sprint: FALSE_PREMIUM_AND_INDIRECT_SIGNAL_REPAIR_SPRINT_V1
- top 3 residual patterns: indirect_hinge_underread, false_premium_confidence, careful_but_unhelpful_output
- owner of most high-trust-risk residuals: candidate_generation

## product readiness implication

Do not move toward launch readiness: residual profile still too risky or insufficiently concentrated.

## per-case residual packets

### CASE_ID: DSPD_01
SOURCE_CASE_ID: DSE_02
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Weak scene detail and hesitant self-description.

MAIN_TRAP:
false confidence risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment solving it alone started hurting the team and you had to work differently.
- confidence_band: medium
- route_decision: show_strongest_direction
- top_score: 0.79
- runner_up_score: 0
- score_margin: 0.79

OUTPUT_CONTEXT:
- selected_explanation: The interesting part is not the technical work. It is the moment the student recognized that solving problems alone was making the team weaker — and changed how they operated. The key shift is explicit in the evidence: i guess i changed over time in robotics but i cannot pinpoint one. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I guess I changed over time in robotics but I cannot pinpoint one thing. I just got better.","note":"evidence_span_0_91"},{"quote":"I guess I changed over time in robotics but I cannot pinpoint one thing.","note":"evidence_span_0_72"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: weak_note_latent_signal_miss
- secondary_behavioral_pattern: clarification_too_late
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: high
- likely_student_reaction: feels_overpraised_but_not_helped
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: ask_question_before_showing; observed route: show_strongest_direction. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_02
SOURCE_CASE_ID: DSE_03
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Vague growth statement with no scene.

MAIN_TRAP:
weak note but real latent story

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment your first approach stopped helping and you changed what the situation actually needed.
- confidence_band: medium
- route_decision: show_strongest_direction
- top_score: 0.8
- runner_up_score: 0
- score_margin: 0.8

OUTPUT_CONTEXT:
- selected_explanation: Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real. The key shift is explicit in the evidence: i learned resilience and communication and confidence. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I improved as a person through activities. I learned resilience and communication and confidence.","note":"evidence_span_0_97"},{"quote":"I learned resilience and communication and confidence.","note":"evidence_span_43_97"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: weak_note_latent_signal_miss
- secondary_behavioral_pattern: clarification_too_late
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: high
- likely_student_reaction: feels_overpraised_but_not_helped
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: blocked_or_needs_more_input; observed route: show_strongest_direction. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_03
SOURCE_CASE_ID: DSE_04
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Uncertain low-skill notes with one small concrete signal.

MAIN_TRAP:
overfit-to-clean-input failure

RUNTIME_RESULT:
- selected_candidate_id: direction_2
- selected_axis_family: relationship_or_listening
- direction_line: The moment you stopped trying to fix the situation and started listening to the person in front of you.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.88
- runner_up_score: 0.85
- score_margin: 0.030000000000000027

OUTPUT_CONTEXT:
- selected_explanation: Tutoring without a failure in it is just content delivery. The essay is the gap between the explanation that did not work and the approach that did. The key shift is explicit in the evidence: one thing maybe: student i tutor stopped crying when i started asking what. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I am not strong writer. One thing maybe: student I tutor stopped crying when I started asking what confused him first.","note":"evidence_span_0_118"},{"quote":"One thing maybe: student I tutor stopped crying when I started asking what confused him first.","note":"evidence_span_24_118"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_04
SOURCE_CASE_ID: DSE_05
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Low-quality note dump with repeated generic claims.

MAIN_TRAP:
generic fallback under shift

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment your first approach stopped helping and you changed what the situation actually needed.
- confidence_band: medium
- route_decision: show_strongest_direction
- top_score: 0.72
- runner_up_score: 0
- score_margin: 0.72

OUTPUT_CONTEXT:
- selected_explanation: Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real. The key shift is explicit in the evidence: i learned so much and became better and stronger and more mature. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I learned so much and became better and stronger and more mature. This year changed me in many ways.","note":"evidence_span_0_100"},{"quote":"I learned so much and became better and stronger and more mature.","note":"evidence_span_0_65"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: weak_note_latent_signal_miss
- secondary_behavioral_pattern: clarification_too_late
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: high
- likely_student_reaction: feels_overpraised_but_not_helped
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: ask_question_before_showing; observed route: show_strongest_direction. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_05
SOURCE_CASE_ID: DSE_06
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Weak notes but latent center about responsibility repair.

MAIN_TRAP:
weak note under-support

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.71
- runner_up_score: 0
- score_margin: 0.71

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: i had to explain and fix it with everyone mad. Additional detail may still change the winner.
- selected_evidence: [{"quote":"I forgot to send club forms and we almost lost funding. I had to explain and fix it with everyone mad.","note":"evidence_span_0_102"},{"quote":"I forgot to send club forms and we almost lost funding.","note":"evidence_span_0_55"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: weak_note_latent_signal_miss
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_06
SOURCE_CASE_ID: DSE_07
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Flat uncertain input, no timeline clarity.

MAIN_TRAP:
false confidence risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.71
- runner_up_score: 0
- score_margin: 0.71

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"I did many things over the years and they all mattered. Hard to choose. maybe everything is important.","note":"evidence_span_0_102"},{"quote":"I did many things over the years and they all mattered.","note":"evidence_span_0_55"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: weak_note_latent_signal_miss
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: blocked_or_needs_more_input; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_07
SOURCE_CASE_ID: DSE_09
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Very short note with one duty signal.

MAIN_TRAP:
weak note but real latent story

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment your first approach stopped helping and you changed what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.71
- runner_up_score: 0
- score_margin: 0.71

OUTPUT_CONTEXT:
- selected_explanation: Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real. The key shift is explicit in the evidence: after dad got sick i handled store closing every night and stopped blaming. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"After dad got sick I handled store closing every night and stopped blaming everyone.","note":"evidence_span_0_84"},{"quote":"After dad got sick I handled store closing every night and stopped blaming everyone.","note":"evidence_span_0_84"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_08
SOURCE_CASE_ID: DSE_10
DISTRIBUTION_CLASS: weak_student_low_skill

INPUT_SHAPE_SUMMARY:
Low-signal reflection language with no concrete detail.

MAIN_TRAP:
genericity bait

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.68
- runner_up_score: 0
- score_margin: 0.68

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Sports taught me discipline and teamwork and effort. I am still figuring out my identity.","note":"evidence_span_0_89"},{"quote":"Sports taught me discipline and teamwork and effort.","note":"evidence_span_0_52"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: weak_note_latent_signal_miss
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (weak_note_under_recovery).

### CASE_ID: DSPD_09
SOURCE_CASE_ID: DSE_12
DISTRIBUTION_CLASS: parent_overwritten_adult_shaped

INPUT_SHAPE_SUMMARY:
High diction, low lived center.

MAIN_TRAP:
polished emptiness

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.77
- runner_up_score: 0
- score_margin: 0.77

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"My educational arc evidences sustained metacognitive expansion and intentional values alignment across civic engagements.","note":"evidence_span_0_121"},{"quote":"My educational arc evidences sustained metacognitive expansion and intentional values alignment across civic engagements.","note":"evidence_span_0_121"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: high
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: blocked_or_needs_more_input; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (parent_overwrite_misread).

### CASE_ID: DSPD_10
SOURCE_CASE_ID: DSE_15
DISTRIBUTION_CLASS: parent_overwritten_adult_shaped

INPUT_SHAPE_SUMMARY:
Adult-edited sentence rhythm and distant emotional tone.

MAIN_TRAP:
adult overwrite

RUNTIME_RESULT:
- selected_candidate_id: direction_2
- selected_axis_family: system_redesign
- direction_line: The moment effort stopped fixing the problem and you redesigned the system it depended on.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.88
- runner_up_score: 0.87
- score_margin: 0.010000000000000009

OUTPUT_CONTEXT:
- selected_explanation: Getting through the work quickly is expected. The essay is the moment that approach caused a problem — and what the student did differently after that. The key shift is explicit in the evidence: my role evolved from executor to systems thinker when i redesigned shift handoffs. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"My role evolved from executor to systems thinker when I redesigned shift handoffs after observing recurrent communication breakdowns.","note":"evidence_span_0_133"},{"quote":"My role evolved from executor to systems thinker when I redesigned shift handoffs after observing recurrent communication breakdowns.","note":"evidence_span_0_133"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: high
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (parent_overwrite_misread).

### CASE_ID: DSPD_11
SOURCE_CASE_ID: DSE_16
DISTRIBUTION_CLASS: parent_overwritten_adult_shaped

INPUT_SHAPE_SUMMARY:
Highly polished claim with no concrete scene.

MAIN_TRAP:
polished emptiness

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.77
- runner_up_score: 0
- score_margin: 0.77

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Through iterative introspection, I now inhabit a more ethically coherent and interpersonally resonant mode of leadership.","note":"evidence_span_0_121"},{"quote":"Through iterative introspection, I now inhabit a more ethically coherent and interpersonally resonant mode of leadership.","note":"evidence_span_0_121"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: high
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: blocked_or_needs_more_input; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (parent_overwrite_misread).

### CASE_ID: DSPD_12
SOURCE_CASE_ID: DSE_17
DISTRIBUTION_CLASS: parent_overwritten_adult_shaped

INPUT_SHAPE_SUMMARY:
Polished language with one duty-centered family signal.

MAIN_TRAP:
adult overwrite misread

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment moving fast stopped helping and you had to slow down enough to read the situation.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.86
- runner_up_score: 0.77
- score_margin: 0.08999999999999997

OUTPUT_CONTEXT:
- selected_explanation: Getting through the work quickly is expected. The essay is the moment that approach caused a problem — and what the student did differently after that. The key shift is explicit in the evidence: when my mother began night shifts, i orchestrated household logistics and learned reliability. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"When my mother began night shifts, I orchestrated household logistics and learned reliability as relational practice, not performance.","note":"evidence_span_0_134"},{"quote":"When my mother began night shifts, I orchestrated household logistics and learned reliability as relational practice, not performance.","note":"evidence_span_0_134"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: high
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (parent_overwrite_misread).

### CASE_ID: DSPD_13
SOURCE_CASE_ID: DSE_18
DISTRIBUTION_CLASS: parent_overwritten_adult_shaped

INPUT_SHAPE_SUMMARY:
Over-edited paragraph with weak causality.

MAIN_TRAP:
generic winner risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.78
- runner_up_score: 0
- score_margin: 0.78

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"The cumulative intersections of service, scholarship, and mentorship converged to refine my identity as a compassionate change agent.","note":"evidence_span_0_133"},{"quote":"The cumulative intersections of service, scholarship, and mentorship converged to refine my identity as a compassionate change agent.","note":"evidence_span_0_133"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: high
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (parent_overwrite_misread).

### CASE_ID: DSPD_14
SOURCE_CASE_ID: DSE_20
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Faux-intellectual reflection with low evidence.

MAIN_TRAP:
polished emptiness

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.76
- runner_up_score: 0
- score_margin: 0.76

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: identity, i have learned, is dialogic and recursively co-constructed through participatory belonging and. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Identity, I have learned, is dialogic and recursively co-constructed through participatory belonging and epistemic humility.","note":"evidence_span_0_124"},{"quote":"Identity, I have learned, is dialogic and recursively co-constructed through participatory belonging and epistemic humility.","note":"evidence_span_0_124"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: blocked_or_needs_more_input; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (polished_emptiness_overvaluation).

### CASE_ID: DSPD_15
SOURCE_CASE_ID: DSE_21
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Smooth writing hides generic center.

MAIN_TRAP:
genericity bait

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment your explanation stopped working and you had to rethink what help looked like.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.81
- runner_up_score: 0.8
- score_margin: 0.010000000000000009

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Tutoring taught me patience, listening, and growth. Over time, those values became part of who I am.","note":"evidence_span_0_100"},{"quote":"Tutoring taught me patience, listening, and growth.","note":"evidence_span_0_51"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: low_explicit_reflection_penalty
- secondary_behavioral_pattern: none
- likely_subsystem_owner: scorer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: scorer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_16
SOURCE_CASE_ID: DSE_22
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Polished self-awareness but weak causality.

MAIN_TRAP:
false confidence risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment moving fast stopped helping and you had to slow down enough to read the situation.
- confidence_band: medium
- route_decision: show_strongest_direction
- top_score: 0.82
- runner_up_score: 0.64
- score_margin: 0.17999999999999994

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"I now understand that leadership is relational stewardship rather than unilateral direction, a shift cultivated across many contexts.","note":"evidence_span_0_133"},{"quote":"I now understand that leadership is relational stewardship rather than unilateral direction, a shift cultivated across many contexts.","note":"evidence_span_0_133"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: clarification_too_late
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: high
- likely_student_reaction: feels_overpraised_but_not_helped
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: ask_question_before_showing; observed route: show_strongest_direction. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_17
SOURCE_CASE_ID: DSE_23
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Beautiful language, no scene anchor.

MAIN_TRAP:
polished emptiness

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: relationship_or_listening
- direction_line: The moment helping stopped being about doing the task and started being about listening to the person in front of you.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.75
- runner_up_score: 0
- score_margin: 0.75

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"My narrative is one of gradual awakening to interdependence, rendered through the quiet accumulation of everyday acts of care.","note":"evidence_span_0_126"},{"quote":"My narrative is one of gradual awakening to interdependence, rendered through the quiet accumulation of everyday acts of care.","note":"evidence_span_0_126"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: blocked_or_needs_more_input; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (polished_emptiness_overvaluation).

### CASE_ID: DSPD_18
SOURCE_CASE_ID: DSE_24
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Hollow but coherent prose with one latent center.

MAIN_TRAP:
generic fallback under shift

RUNTIME_RESULT:
- selected_candidate_id: direction_3
- selected_axis_family: system_redesign
- direction_line: The moment effort stopped fixing the problem and you redesigned the system it depended on.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.89
- runner_up_score: 0.85
- score_margin: 0.040000000000000036

OUTPUT_CONTEXT:
- selected_explanation: The clinic is not the subject. The essay is a specific moment when the student's approach to care was wrong — and they had to change it because another person's outcome depended on it. The key shift is explicit in the evidence: i redesigned volunteer onboarding docs because new students kept leaving; after simplification retention. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I redesigned volunteer onboarding docs because new students kept leaving; after simplification retention improved.","note":"evidence_span_0_114"},{"quote":"I redesigned volunteer onboarding docs because new students kept leaving; after simplification retention improved.","note":"evidence_span_0_114"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: low_explicit_reflection_penalty
- secondary_behavioral_pattern: none
- likely_subsystem_owner: scorer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: scorer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_19
SOURCE_CASE_ID: DSE_25
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Polished narrative voice masks uncertainty.

MAIN_TRAP:
false premium overcommitment

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.77
- runner_up_score: 0
- score_margin: 0.77

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"In orchestrating student government communications, I discovered that clarity is an ethical commitment to audience dignity.","note":"evidence_span_0_123"},{"quote":"In orchestrating student government communications, I discovered that clarity is an ethical commitment to audience dignity.","note":"evidence_span_0_123"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_20
SOURCE_CASE_ID: DSE_26
DISTRIBUTION_CLASS: over_polished_hollow

INPUT_SHAPE_SUMMARY:
Elegant but emotionally flat claims.

MAIN_TRAP:
polished emptiness

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The decision to rethink your method after failure, instead of just reacting to the loss.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.77
- runner_up_score: 0
- score_margin: 0.77

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"I became more deliberate, more accountable, and more collaborative through sustained participation in civic leadership spaces.","note":"evidence_span_0_126"},{"quote":"I became more deliberate, more accountable, and more collaborative through sustained participation in civic leadership spaces.","note":"evidence_span_0_126"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (polished_emptiness_overvaluation).

### CASE_ID: DSPD_21
SOURCE_CASE_ID: DSE_32
DISTRIBUTION_CLASS: contradictory_multi_center

INPUT_SHAPE_SUMMARY:
Action and reflection signals point different directions.

MAIN_TRAP:
false confidence risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: relationship_or_listening
- direction_line: The moment helping stopped being about doing the task and started being about listening to the person in front of you.
- confidence_band: medium
- route_decision: show_strongest_direction
- top_score: 0.78
- runner_up_score: 0
- score_margin: 0.78

OUTPUT_CONTEXT:
- selected_explanation: The clinic is not the subject. The essay is a specific moment when the student's approach to care was wrong — and they had to change it because another person's outcome depended on it. The key shift is explicit in the evidence: the tension is between what happened and what it actually changed in you. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"Most of my actions were technical coding work, but reflection keeps returning to family translation and care duties.","note":"evidence_span_0_116"},{"quote":"Most of my actions were technical coding work, but reflection keeps returning to family translation and care duties.","note":"evidence_span_0_116"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: contradiction_shallow_competition
- secondary_behavioral_pattern: clarification_too_late
- likely_subsystem_owner: routing_calibration
- trust_risk_severity: high
- likely_student_reaction: feels_overpraised_but_not_helped
- best_next_fix_type: routing_patch
- reviewer_notes: Expected action: ask_question_before_showing; observed route: show_strongest_direction. Primary pattern mapped from residual cues and prior failure cluster (contradiction_overcommitment).

### CASE_ID: DSPD_22
SOURCE_CASE_ID: DSE_39
DISTRIBUTION_CLASS: culturally_indirect_non_default

INPUT_SHAPE_SUMMARY:
Relational storytelling without self-promotion.

MAIN_TRAP:
generic fallback under shift

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment your explanation stopped working and you had to rethink what help looked like.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.76
- runner_up_score: 0
- score_margin: 0.76

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"During harvest season I coordinated rides for cousins and neighbors so children could still attend tutoring.","note":"evidence_span_0_108"},{"quote":"During harvest season I coordinated rides for cousins and neighbors so children could still attend tutoring.","note":"evidence_span_0_108"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_23
SOURCE_CASE_ID: DSE_40
DISTRIBUTION_CLASS: culturally_indirect_non_default

INPUT_SHAPE_SUMMARY:
Culturally indirect writing plus mixed fragments.

MAIN_TRAP:
cultural style misread

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: relationship_or_listening
- direction_line: The moment being right in the argument stopped helping and listening mattered more.
- confidence_band: high
- route_decision: show_strongest_direction
- top_score: 0.85
- runner_up_score: 0
- score_margin: 0.85

OUTPUT_CONTEXT:
- selected_explanation: The conflict itself is not the interesting part. The essay is about the moment feedback changed how the student was operating in the room. The key shift is explicit in the evidence: the tension is between what happened and what it actually changed in you. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I do not usually talk about myself. I did what was needed at home and school, especially when schedules conflicted.","note":"evidence_span_0_115"},{"quote":"I did what was needed at home and school, especially when schedules conflicted.","note":"evidence_span_36_115"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: clarification_too_late
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: high
- likely_student_reaction: feels_overpraised_but_not_helped
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: ask_question_before_showing; observed route: show_strongest_direction. Primary pattern mapped from residual cues and prior failure cluster (high_confidence_misread).

### CASE_ID: DSPD_24
SOURCE_CASE_ID: DSE_43
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Heavy accomplishments, little reflection.

MAIN_TRAP:
achievement-stack overcommitment

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.85
- runner_up_score: 0
- score_margin: 0.85

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Captain, founder, intern, finalist, president. I increased participation, raised funds, and won awards across multiple organizations.","note":"evidence_span_0_133"},{"quote":"Captain, founder, intern, finalist, president.","note":"evidence_span_0_46"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_25
SOURCE_CASE_ID: DSE_44
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Impressive metrics but no emotional center.

MAIN_TRAP:
generic winner risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment your explanation stopped working and you had to rethink what help looked like.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.88
- runner_up_score: 0
- score_margin: 0.88

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Built app with 5k users, launched tutoring nonprofit, led student council policy committee, and published research abstract.","note":"evidence_span_0_124"},{"quote":"Built app with 5k users, launched tutoring nonprofit, led student council policy committee, and published research abstract.","note":"evidence_span_0_124"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: low_explicit_reflection_penalty
- secondary_behavioral_pattern: none
- likely_subsystem_owner: scorer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: scorer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_26
SOURCE_CASE_ID: DSE_45
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Achievement-dense paragraph with one latent turning point.

MAIN_TRAP:
weak latent center hidden by metrics

RUNTIME_RESULT:
- selected_candidate_id: direction_2
- selected_axis_family: system_redesign
- direction_line: The moment effort stopped fixing the problem and you redesigned the system it depended on.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.9
- runner_up_score: 0.88
- score_margin: 0.020000000000000018

OUTPUT_CONTEXT:
- selected_explanation: Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real. The key shift is explicit in the evidence: the recurring failure stayed in place until the structure changed: after a failed. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"After a failed launch where users quit, I switched from feature-first to interview-first design and rebuilt onboarding.","note":"evidence_span_0_119"},{"quote":"After a failed launch where users quit, I switched from feature-first to interview-first design and rebuilt onboarding.","note":"evidence_span_0_119"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_27
SOURCE_CASE_ID: DSE_46
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Stacked accolades and polished confidence claims.

MAIN_TRAP:
false premium overcommitment

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: relationship_or_listening
- direction_line: The moment being right in the argument stopped helping and listening mattered more.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.79
- runner_up_score: 0
- score_margin: 0.79

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"My impact portfolio spans competitive debate, startup incubation, state-level service recognition, and strategic civic innovation.","note":"evidence_span_0_130"},{"quote":"My impact portfolio spans competitive debate, startup incubation, state-level service recognition, and strategic civic innovation.","note":"evidence_span_0_130"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_28
SOURCE_CASE_ID: DSE_47
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Activity-heavy list with no causal thread.

MAIN_TRAP:
generic fallback under shift

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: relationship_or_listening
- direction_line: The moment helping stopped being about doing the task and started being about listening to the person in front of you.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.74
- runner_up_score: 0
- score_margin: 0.74

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"I did robotics, MUN, soccer, volunteering, coding mentorship, and science olympiad all at once every year.","note":"evidence_span_0_106"},{"quote":"I did robotics, MUN, soccer, volunteering, coding mentorship, and science olympiad all at once every year.","note":"evidence_span_0_106"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_29
SOURCE_CASE_ID: DSE_48
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Achievement stack with subtle relational center.

MAIN_TRAP:
overlooking latent center

RUNTIME_RESULT:
- selected_candidate_id: direction_3
- selected_axis_family: relationship_or_listening
- direction_line: The moment you stopped trying to fix the situation and started listening to the person in front of you.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.91
- runner_up_score: 0.9
- score_margin: 0.010000000000000009

OUTPUT_CONTEXT:
- selected_explanation: Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real. The key shift is explicit in the evidence: awards mattered less after i realized my team quit because i never listened. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"Awards mattered less after I realized my team quit because I never listened; I rebuilt project roles around peer feedback.","note":"evidence_span_0_122"},{"quote":"Awards mattered less after I realized my team quit because I never listened; I rebuilt project roles around peer feedback.","note":"evidence_span_0_122"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_30
SOURCE_CASE_ID: DSE_49
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Metric-heavy success claims and generic growth language.

MAIN_TRAP:
polished emptiness overvaluation

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment moving fast stopped helping and you had to slow down enough to read the situation.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.88
- runner_up_score: 0.84
- score_margin: 0.040000000000000036

OUTPUT_CONTEXT:
- selected_explanation: Getting through the work quickly is expected. The essay is the moment that approach caused a problem — and what the student did differently after that. The key shift is explicit in the evidence: the tension is between what happened and what it actually changed in you. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"Scaled impact by 200%, optimized operations, and strengthened leadership identity through high-performance execution.","note":"evidence_span_0_117"},{"quote":"Scaled impact by 200%, optimized operations, and strengthened leadership identity through high-performance execution.","note":"evidence_span_0_117"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_31
SOURCE_CASE_ID: DSE_50
DISTRIBUTION_CLASS: achievement_stacked_emotionally_thin

INPUT_SHAPE_SUMMARY:
Accomplishment pile with fragmented context.

MAIN_TRAP:
false confidence risk

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.77
- runner_up_score: 0
- score_margin: 0.77

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"Everything went well this year: captain role, internship, awards, and startup prototype with district recognition.","note":"evidence_span_0_114"},{"quote":"Everything went well this year: captain role, internship, awards, and startup prototype with district recognition.","note":"evidence_span_0_114"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: false_premium_confidence
- secondary_behavioral_pattern: none
- likely_subsystem_owner: trust_calibration
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: trust_calibration_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_32
SOURCE_CASE_ID: DSE_52
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Mixed rough paragraph and list notes.

MAIN_TRAP:
generic fallback under shift

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.75
- runner_up_score: 0
- score_margin: 0.75

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: ” notes: pantry line issue / private pickup slot / families came back. Additional detail may still change the winner.
- selected_evidence: [{"quote":"draft: I kept trying to be the “fixer.” notes: pantry line issue / private pickup slot / families came back","note":"evidence_span_0_107"},{"quote":"draft: I kept trying to be the “fixer.” notes: pantry line issue / private pickup slot / families came back","note":"evidence_span_0_107"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: low_explicit_reflection_penalty
- secondary_behavioral_pattern: none
- likely_subsystem_owner: scorer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: scorer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_33
SOURCE_CASE_ID: DSE_53
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Repeated ideas, weak transitions, one strong scene.

MAIN_TRAP:
overfit-to-clean-input failure

RUNTIME_RESULT:
- selected_candidate_id: direction_2
- selected_axis_family: relationship_or_listening
- direction_line: The moment you stopped trying to fix the situation and started listening to the person in front of you.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.88
- runner_up_score: 0.86
- score_margin: 0.020000000000000018

OUTPUT_CONTEXT:
- selected_explanation: Most of what led up to the correction is context. The essay is the correction itself — and the one moment after it that shows the change was real. The key shift is explicit in the evidence: i learned to listen, like really listen, over and over. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"I learned to listen, like really listen, over and over. Scene: teammate cried after I dismissed her concern in planning meeting.","note":"evidence_span_0_128"},{"quote":"I learned to listen, like really listen, over and over.","note":"evidence_span_0_55"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: indirect_hinge_underread
- secondary_behavioral_pattern: none
- likely_subsystem_owner: candidate_generation
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: multi_layer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_34
SOURCE_CASE_ID: DSE_54
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Incoherent sequence but promising contradiction.

MAIN_TRAP:
contradiction collapse

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: relationship_or_listening
- direction_line: The moment helping stopped being about doing the task and started being about listening to the person in front of you.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.7
- runner_up_score: 0
- score_margin: 0.7

OUTPUT_CONTEXT:
- selected_explanation: The clinic is not the subject. The essay is a specific moment when the student's approach to care was wrong — and they had to change it because another person's outcome depended on it. The key shift is explicit in the evidence: the tension is between what happened and what it actually changed in you. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"Wanted medicine then policy then maybe teaching. Stable thing: translating clinic instructions every Saturday.","note":"evidence_span_0_110"},{"quote":"Wanted medicine then policy then maybe teaching.","note":"evidence_span_0_48"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: contradiction_shallow_competition
- secondary_behavioral_pattern: none
- likely_subsystem_owner: routing_calibration
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: routing_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_35
SOURCE_CASE_ID: DSE_56
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Messy timeline with one clear responsibility arc.

MAIN_TRAP:
weak-note under-support

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.75
- runner_up_score: 0
- score_margin: 0.75

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"freshman random, sophomore bad grades, junior store closing duties nightly + payroll mistakes fixed.","note":"evidence_span_0_100"},{"quote":"freshman random, sophomore bad grades, junior store closing duties nightly + payroll mistakes fixed.","note":"evidence_span_0_100"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_36
SOURCE_CASE_ID: DSE_57
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Bullet dump with duplicate phrasing.

MAIN_TRAP:
generic fallback under shift

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.85
- runner_up_score: 0
- score_margin: 0.85

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: - teamwork - discipline - helping others - actual moment: failed migration, owned. Additional detail may still change the winner.
- selected_evidence: [{"quote":"- teamwork - discipline - helping others - actual moment: failed migration, owned error, wrote rollback checklist","note":"evidence_span_0_113"},{"quote":"- teamwork - discipline - helping others - actual moment: failed migration, owned error, wrote rollback checklist","note":"evidence_span_0_113"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: low_explicit_reflection_penalty
- secondary_behavioral_pattern: none
- likely_subsystem_owner: scorer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: scorer_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (generic_fallback_under_shift).

### CASE_ID: DSPD_37
SOURCE_CASE_ID: DSE_58
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Multiple starts plus emotional hesitation.

MAIN_TRAP:
flattening risk

RUNTIME_RESULT:
- selected_candidate_id: direction_3
- selected_axis_family: system_redesign
- direction_line: The moment effort stopped fixing the problem and you redesigned the system it depended on.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.87
- runner_up_score: 0.84
- score_margin: 0.030000000000000027

OUTPUT_CONTEXT:
- selected_explanation: The clinic is not the subject. The essay is a specific moment when the student's approach to care was wrong — and they had to change it because another person's outcome depended on it. The key shift is explicit in the evidence: start1: idk what to write start2: maybe grandma caregiving real part: missed dose. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"start1: idk what to write start2: maybe grandma caregiving real part: missed dose once, rebuilt daily med tracker","note":"evidence_span_0_113"},{"quote":"start1: idk what to write start2: maybe grandma caregiving real part: missed dose once, rebuilt daily med tracker","note":"evidence_span_0_113"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_38
SOURCE_CASE_ID: DSE_59
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Very rough notes with parenthetical fragments.

MAIN_TRAP:
messy shape misread

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: The moment solving it alone started hurting the team and you had to work differently.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.69
- runner_up_score: 0
- score_margin: 0.69

OUTPUT_CONTEXT:
- selected_explanation: The interesting part is not the technical work. It is the moment the student recognized that solving problems alone was making the team weaker — and changed how they operated. The key shift is explicit in the evidence: robotics (wrong wiring -> owned) (asked freshman help) (made preflight checklist) robotics (wrong. That keeps the essay focused on the same axis rather than retelling context.
- selected_evidence: [{"quote":"robotics (wrong wiring -> owned) (asked freshman help) (made preflight checklist)","note":"evidence_span_0_81"},{"quote":"robotics (wrong wiring -> owned) (asked freshman help) (made preflight checklist)","note":"evidence_span_0_81"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).

### CASE_ID: DSPD_39
SOURCE_CASE_ID: DSE_60
DISTRIBUTION_CLASS: messy_real_style_note_dump

INPUT_SHAPE_SUMMARY:
Incoherent but promising mixed style input.

MAIN_TRAP:
overfit-to-clean-input failure

RUNTIME_RESULT:
- selected_candidate_id: direction_1
- selected_axis_family: unclassified
- direction_line: A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- confidence_band: low
- route_decision: ask_question_before_showing
- top_score: 0.73
- runner_up_score: 0
- score_margin: 0.73

OUTPUT_CONTEXT:
- selected_explanation: The current evidence most clearly supports this shift: the tension is between what happened and what it actually changed in you. Additional detail may still change the winner.
- selected_evidence: [{"quote":"paragraph-ish: I tried to lead loud. notes: people shut down. fix: anonymous feedback summaries + role rotation.","note":"evidence_span_0_112"},{"quote":"fix: anonymous feedback summaries + role rotation.","note":"evidence_span_62_112"}]
- clarification_question: none
- blocked_message: none

RESIDUAL_PATTERN_DIAGNOSTIC:
- primary_behavioral_pattern: careful_but_unhelpful_output
- secondary_behavioral_pattern: none
- likely_subsystem_owner: explanation_layer
- trust_risk_severity: medium
- likely_student_reaction: mixed
- best_next_fix_type: explanation_patch
- reviewer_notes: Expected action: show_strongest_direction; observed route: ask_question_before_showing. Primary pattern mapped from residual cues and prior failure cluster (unclear_or_mixed).
