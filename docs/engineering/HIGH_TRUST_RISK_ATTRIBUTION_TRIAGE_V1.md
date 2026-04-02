# HIGH TRUST RISK ATTRIBUTION TRIAGE V1

Generated: 2026-03-17T17:40:04.590Z

## Summary

- High-trust-risk cases reviewed: 11
- Better candidate already existed: 0/11 (0.0%)
- No good candidate existed: 10/11 (90.9%)
- Clarification should have replaced show: 6/11 (54.5%)
- Line/explanation worsened an otherwise borderline choice: 3/11 (27.3%)

## Next Sprint Recommendation

- Recommended next sprint: candidate generation sprint
- Why: Most high-trust-risk residuals fail because the engine never produces a trustworthy candidate for weak-note, culturally indirect, family-duty, or contradictory inputs. The reranker has almost no recoverable wins to select from.
- Secondary follow-on: Add a narrow routing guardrail that forces clarification when the candidate set is generic, contradictory, or premium-sounding without scene-level support.

## Case-by-case Attribution

### DSE_02 — weak_note_latent_signal_miss

- Route taken: show_strongest_direction
- Route that should have happened: ask_question_before_showing
- Selected candidate: direction_1 — The moment solving it alone started hurting the team and you had to work differently.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Candidate generation
- Notes: Only a generic robotics/teamwork center was generated, then the explanation invented a stronger causal arc than the note supports.

### DSE_03 — weak_note_latent_signal_miss

- Route taken: show_strongest_direction
- Route that should have happened: blocked_or_needs_more_input
- Selected candidate: direction_1 — The moment your first approach stopped helping and you changed what the situation actually needed.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Candidate generation
- Notes: The candidate set never found a real scene-level center; the explanation upgrades generic virtues into a fake correction arc.

### DSE_05 — weak_note_latent_signal_miss

- Route taken: show_strongest_direction
- Route that should have happened: ask_question_before_showing
- Selected candidate: direction_1 — The moment your first approach stopped helping and you changed what the situation actually needed.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Candidate generation
- Notes: The system treated repeated growth claims as a usable hinge, but no trustworthy candidate existed.

### DSE_12 — false_premium_confidence

- Route taken: ask_question_before_showing
- Route that should have happened: blocked_or_needs_more_input
- Selected candidate: direction_1 — A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Trust calibration
- Notes: The ask route is safer than show, but the generated “plausible center” still over-legitimizes polished emptiness that should have been blocked.

### DSE_15 — careful_but_unhelpful_output

- Route taken: ask_question_before_showing
- Route that should have happened: show_strongest_direction
- Selected candidate: direction_2 — The moment effort stopped fixing the problem and you redesigned the system it depended on.
- Top non-selected candidates: direction_1 — The moment moving fast stopped helping and you had to slow down enough to read the situation. | direction_3 — The moment you stopped being the bottleneck and started distributing responsibility.
- Better candidate already existed: no
- No good candidate existed: no
- Clarification better than any available candidate: no
- Line/explanation worsened failure: no
- Primary failure mechanism: Routing calibration
- Notes: The selected system-redesign candidate is already usable and evidence-grounded; the failure is over-caution, not candidate quality.

### DSE_16 — false_premium_confidence

- Route taken: ask_question_before_showing
- Route that should have happened: blocked_or_needs_more_input
- Selected candidate: direction_1 — A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Trust calibration
- Notes: No candidate is grounded enough to show, and even the ask output still frames the prose as if a plausible center already exists.

### DSE_17 — indirect_hinge_underread

- Route taken: ask_question_before_showing
- Route that should have happened: show_strongest_direction
- Selected candidate: direction_1 — The moment moving fast stopped helping and you had to slow down enough to read the situation.
- Top non-selected candidates: direction_2 — How you managed the work when the system you were using stopped holding.
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: no
- Primary failure mechanism: Candidate generation
- Notes: The engine missed the family-duty center entirely; both generated candidates stay generic, so the real fix is better candidate recovery.

### DSE_18 — careful_but_unhelpful_output

- Route taken: ask_question_before_showing
- Route that should have happened: show_strongest_direction
- Selected candidate: direction_1 — A plausible center is the moment your first approach stopped helping and you had to adjust what the situation actually needed.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Candidate generation
- Notes: A true causal hinge never makes it into the candidate set, and the “plausible center” wording makes the weak ask output feel even flatter.

### DSE_22 — false_premium_confidence

- Route taken: show_strongest_direction
- Route that should have happened: ask_question_before_showing
- Selected candidate: direction_1 — The moment moving fast stopped helping and you had to slow down enough to read the situation.
- Top non-selected candidates: direction_2 — How you managed the work when the system you were using stopped holding.
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Trust calibration
- Notes: The system should have clarified before showing; neither available candidate is grounded enough, and the output amplifies the false-premium surface.

### DSE_32 — contradiction_shallow_competition

- Route taken: show_strongest_direction
- Route that should have happened: ask_question_before_showing
- Selected candidate: direction_1 — The moment helping stopped being about doing the task and started being about listening to the person in front of you.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Candidate generation
- Notes: The contradiction never gets converted into competing concrete candidates, so the engine shows a flattened listening winner instead of clarifying.

### DSE_40 — indirect_hinge_underread

- Route taken: show_strongest_direction
- Route that should have happened: ask_question_before_showing
- Selected candidate: direction_1 — The moment being right in the argument stopped helping and listening mattered more.
- Top non-selected candidates: none
- Better candidate already existed: no
- No good candidate existed: yes
- Clarification better than any available candidate: yes
- Line/explanation worsened failure: yes
- Primary failure mechanism: Candidate generation
- Notes: The engine overreads culturally indirect duty language into a high-confidence conflict/listening story that is not actually present.

