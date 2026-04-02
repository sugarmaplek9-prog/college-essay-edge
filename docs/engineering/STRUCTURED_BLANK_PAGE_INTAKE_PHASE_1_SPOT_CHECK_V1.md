# STRUCTURED_BLANK_PAGE_INTAKE_PHASE_1_SPOT_CHECK_V1

- Generated at: 2026-03-18T21:25:23.583Z
- Total cases: 35
- Pass count: 35
- Review-needed count: 0

| # | Family | Raw input | Top-level route | Mode | Trigger signals | Confidence | Reviewer note |
|---:|---|---|---|---|---|---|---|
| 1 | topic-only | Can I write about gardening? | needs_structured_blank_page_intake | topic_probe | topic_only_intent, topic_eligibility_question | high | PASS: expected route/mode match. |
| 2 | topic-only | Would volunteering work for my college essay? | needs_structured_blank_page_intake | topic_probe | topic_only_intent, topic_eligibility_question | high | PASS: expected route/mode match. |
| 3 | topic-only | Should I write about coding for my personal statement? | needs_structured_blank_page_intake | topic_probe | topic_only_intent, topic_eligibility_question | high | PASS: expected route/mode match. |
| 4 | topic-only | Can I write about moving schools? | needs_structured_blank_page_intake | topic_probe | topic_only_intent, topic_eligibility_question | high | PASS: expected route/mode match. |
| 5 | topic-only | Is writing about tutoring a good topic? | needs_structured_blank_page_intake | topic_probe | topic_only_intent | medium | PASS: expected route/mode match. |
| 6 | theme-only | I want to show resilience. | needs_structured_blank_page_intake | theme_probe | theme_only_intent, trait_show_language | medium | PASS: expected route/mode match. |
| 7 | theme-only | I want to write about leadership. | needs_structured_blank_page_intake | theme_probe | theme_only_intent | low | PASS: expected route/mode match. |
| 8 | theme-only | I want my essay to show growth. | needs_structured_blank_page_intake | theme_probe | theme_only_intent, trait_show_language | medium | PASS: expected route/mode match. |
| 9 | theme-only | How do I demonstrate integrity in my essay? | needs_structured_blank_page_intake | theme_probe | theme_only_intent, trait_show_language | medium | PASS: expected route/mode match. |
| 10 | theme-only | I want to highlight compassion but I do not have a story yet. | needs_structured_blank_page_intake | theme_probe | no_topic_present, theme_only_intent, trait_show_language | medium | PASS: expected route/mode match. |
| 11 | activity-only | I am between robotics and debate. | needs_structured_blank_page_intake | activity_probe | activity_domain_only, multiple_activity_options | high | PASS: expected route/mode match. |
| 12 | activity-only | Maybe soccer for my essay? | needs_structured_blank_page_intake | activity_probe | activity_domain_only | medium | PASS: expected route/mode match. |
| 13 | activity-only | I am deciding between robotics, debate, and soccer. | needs_structured_blank_page_intake | activity_probe | activity_domain_only, multiple_activity_options | high | PASS: expected route/mode match. |
| 14 | activity-only | Should I focus on band or robotics? | needs_structured_blank_page_intake | activity_probe | activity_domain_only | medium | PASS: expected route/mode match. |
| 15 | activity-only | Debate or coding club might be my essay topic. | needs_structured_blank_page_intake | activity_probe | activity_domain_only | medium | PASS: expected route/mode match. |
| 16 | scope-uncertain | I do not know if this says enough about me. | needs_structured_blank_page_intake | scope_reframe | no_topic_present, scope_uncertain_language | high | PASS: expected route/mode match. |
| 17 | scope-uncertain | I like this topic but I am not sure it is deep enough. | needs_structured_blank_page_intake | scope_reframe | scope_uncertain_language, topic_only_intent | high | PASS: expected route/mode match. |
| 18 | scope-uncertain | I am not sure this is really an essay-worthy topic. | needs_structured_blank_page_intake | scope_reframe | scope_uncertain_language, topic_only_intent | high | PASS: expected route/mode match. |
| 19 | scope-uncertain | Is writing about babysitting too common? | needs_structured_blank_page_intake | scope_reframe | no_topic_present, scope_uncertain_language | high | PASS: expected route/mode match. |
| 20 | scope-uncertain | I have a topic but I do not know if it says enough. | needs_structured_blank_page_intake | scope_reframe | scope_uncertain_language, topic_only_intent | high | PASS: expected route/mode match. |
| 21 | blank-page | I have no idea what to write about. | needs_structured_blank_page_intake | blank_page_discovery | blank_page_language, topic_only_intent | high | PASS: expected route/mode match. |
| 22 | blank-page | Nothing feels special enough for my college essay. | needs_structured_blank_page_intake | blank_page_discovery | blank_page_language | high | PASS: expected route/mode match. |
| 23 | blank-page | I do not know where to start for my personal statement. | needs_structured_blank_page_intake | blank_page_discovery | blank_page_language | high | PASS: expected route/mode match. |
| 24 | blank-page | I am stuck and have no topic yet. | needs_structured_blank_page_intake | blank_page_discovery | blank_page_language, topic_only_intent | high | PASS: expected route/mode match. |
| 25 | blank-page | I need help choosing what to write about for college essays. | needs_structured_blank_page_intake | blank_page_discovery | blank_page_language, topic_only_intent | high | PASS: expected route/mode match. |
| 26 | truly-insufficient | hi | true_block | too_thin_to_recover | no_topic_present, empty_or_near_empty_input | medium | PASS: expected route/mode match. |
| 27 | truly-insufficient | n/a | true_block | too_thin_to_recover | no_topic_present, empty_or_near_empty_input | medium | PASS: expected route/mode match. |
| 28 | truly-insufficient | test | true_block | too_thin_to_recover | no_topic_present, empty_or_near_empty_input | medium | PASS: expected route/mode match. |
| 29 | truly-insufficient | write my essay for me | true_block | too_thin_to_recover | off_domain_or_unusable | high | PASS: expected route/mode match. |
| 30 | truly-insufficient | asdf | true_block | too_thin_to_recover | no_topic_present, empty_or_near_empty_input | medium | PASS: expected route/mode match. |
| 31 | good-nds | I spent three summers volunteering at the hospital, and I thought I was helping. In my third summer, a nurse pulled me aside and said I was just getting in the way. That conversation changed how I think about service. | ready_for_nds | - | no_topic_present | - | PASS: expected route/mode match. |
| 32 | good-nds | During robotics finals our bot stalled with 40 seconds left. I overrode the script and switched to manual control while my teammate called out timing. We lost that match, but the next round we rebuilt the handoff and won. That changed how I lead under pressure. | ready_for_nds | - | - | - | PASS: expected route/mode match. |
| 33 | good-nds | At debate camp, my coach stopped my speech and told me I was hiding behind big words. I rewrote my case overnight with one concrete story and tested it the next day. The room reacted differently, and I finally understood what clarity costs. | ready_for_nds | - | - | - | PASS: expected route/mode match. |
| 34 | good-nds | My first month tutoring, a student kept failing the same algebra quiz. I noticed I was explaining fast but never checking where she got lost. We rebuilt one problem step by step, and she later taught it to another student. That shifted my idea of helping. | ready_for_nds | - | no_topic_present | - | PASS: expected route/mode match. |
| 35 | good-nds | At my restaurant shift, tickets kept disappearing during rush hour. I designed a color-coded rail system, trained the team, and we cut missed orders to zero. The bigger change was realizing I needed to fix systems, not just work faster. | ready_for_nds | - | no_topic_present | - | PASS: expected route/mode match. |
