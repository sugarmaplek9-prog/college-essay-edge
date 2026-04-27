# 072 Targeted Output Repair V1 — Pattern Summary

## Rubric

- Critical leak threshold: correction-template titles, meta-instructional leakage, and generic next-move suffixes must all be zero.
- Phrasing threshold: dangling fragment artifacts should be zero.
- Specificity threshold: average source-overlap must improve versus the stored pre-repair blind-run outputs, and low-specificity cases must not increase.

## Recommendation

- result: REPAIR_PASS
- rationale: All critical templating leaks drop to zero, phrasing artifacts clear, and source-overlap grounding improves on the fixed 072 set.

## Before vs After Summary

- correction_template_count: 7 -> 0
- meta_instructional_leak_count: 3 -> 0
- generic_next_move_suffix_count: 9 -> 0
- dangling_fragment_count: 7 -> 0
- low_specificity_case_count: 0 -> 0
- average_source_overlap: 7.67 -> 9.44

## NSB-FS-005 — official blind case — playlist as identity architecture

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: When the story became about self-definition, not just accomplishment
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: true
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 8 (playlist, specific, preserves, voice, specificity, treating, identity, rather)
- source_overlap_after: 10 (student's, playlist, becomes, organizing, device, explaining, memory, taste, specific, rather)

## NSB-FS-006 — official blind case — classical study through a history and gender lens

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: When the story became about self-definition, not just accomplishment
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: false
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 7 (signal, intellectual, identity, built, interpretation, pattern-finding, strong)
- source_overlap_after: 8 (material, signal, intellectual, identity, built, interpretation, pattern-finding, strong)

## NSB-FS-013 — official blind case — anchor relationship as family and selfhood engine

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: When the student changed how the work could move
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: false
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: false
- dangling_fragment_after: false
- source_overlap_before: 6 (centers, person, functions, student's, making, rather)
- source_overlap_after: 6 (centers, person, functions, student's, making, instead)

## NSB-FS-014 — official blind case — repair-the-world service ethic

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: When the story became about self-definition, not just accomplishment
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: true
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 7 (connect, belief, action, personal, identity, instead, listing)
- source_overlap_after: 9 (student's, central, engine, service, ethic, rooted, actually, identity, instead)

## NSB-FS-015 — official blind case — preparedness as a lived discipline

- angle_title_before: The moment in clinic volunteering when tasks stopped being enough
- angle_title_after: When the old response stopped working under pressure
- correction_template_before: false
- correction_template_after: false
- meta_leak_before: true
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 7 (change, preparation, lived, situations, decision-making, rather, branding)
- source_overlap_after: 8 (habit, packing, lightly, preparing, carefully, change, lived, instead)

## NSB-FS-016 — official blind case — bringing order to disorder

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: When the student changed how the work could move
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: false
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 6 (student's, merely, tidiness, treats, order-making, without)
- source_overlap_after: 9 (central, signal, student's, drive, organize, feels, scattered, messy, praise)

## NSB-FS-020 — official blind case — belonging and identity through sport

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: When the story became about self-definition, not just accomplishment
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: false
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 12 (student's, sport, environment, becomes, place, where, questions, belonging, identity, visible, strong, without)
- source_overlap_after: 12 (student's, sport, environment, becomes, place, where, questions, belonging, identity, visible, instead, abstract)

## NSB-FS-021 — official blind case — environmental stewardship as community service

- angle_title_before: The moment the student corrected course and what changed after
- angle_title_after: What the student owed the people affected by the moment
- correction_template_before: true
- correction_template_after: false
- meta_leak_before: false
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: false
- dangling_fragment_after: false
- source_overlap_before: 6 (rather, strong, action, specific, service, instead)
- source_overlap_after: 12 (essay's, engine, environmental, stewardship, understood, responsibility, shared, community, strong, specific, instead, student's)

## NSB-FS-022 — official blind case — maker-style intellectual identity

- angle_title_before: When solving it alone started hurting the team
- angle_title_after: When the story became about self-definition, not just accomplishment
- correction_template_before: false
- correction_template_after: false
- meta_leak_before: false
- meta_leak_after: false
- generic_next_move_before: true
- generic_next_move_after: false
- dangling_fragment_before: true
- dangling_fragment_after: false
- source_overlap_before: 10 (reveals, intellectual, identity, making, building, experimenting, rather, strong, between, makes)
- source_overlap_after: 11 (reveals, intellectual, identity, making, building, experimenting, rather, strong, between, without, makes)
