# Human Blind Review Slice (10 cases)
mode: blind

selected_case_ids: case_021, case_024, case_027, case_011, case_014, case_017, case_002, case_003, case_006, case_008

## case_021 — strong-signal family caregiving
difficulty: strong
tags: school_sensitive

### Student input packet
stories: 2
draft present: false
school context: School 3

### Output A
{
  "case_id": "case_021",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_021",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_024 — strong-signal debate conflict
difficulty: strong
tags: draft_present, school_sensitive, conflicting_signals

### Student input packet
stories: 2
draft present: true
school context: School 6

### Output A
{
  "case_id": "case_024",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_024",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_027 — strong-signal community clinic volunteer
difficulty: strong
tags: school_sensitive

### Student input packet
stories: 2
draft present: false
school context: School 3

### Output A
{
  "case_id": "case_027",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_027",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_011 — medium-signal family caregiving
difficulty: medium
tags: messy_notes

### Student input packet
stories: 1
draft present: false
school context: none

### Output A
{
  "case_id": "case_011",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_011",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_014 — medium-signal debate conflict
difficulty: medium
tags: messy_notes, draft_present

### Student input packet
stories: 1
draft present: true
school context: none

### Output A
{
  "case_id": "case_014",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_014",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_017 — medium-signal community clinic volunteer
difficulty: medium
tags: 

### Student input packet
stories: 1
draft present: false
school context: none

### Output A
{
  "case_id": "case_017",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_017",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_002 — weak-signal robotics leadership
difficulty: weak
tags: messy_notes, draft_present, red_team, stale_draft_risk, parent_advisor_risk, fake_confidence_temptation

### Student input packet
stories: 0
draft present: true
school context: none

### Output A
{
  "case_id": "case_002",
  "system": "baseline_free_ai",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "Can you share a meaningful personal experience?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_002",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_003 — weak-signal restaurant operations
difficulty: weak
tags: messy_notes, school_sensitive, red_team, stale_draft_risk, generic_padding_risk, fake_confidence_temptation, conflicting_signals

### Student input packet
stories: 1
draft present: false
school context: School 3

### Output A
{
  "case_id": "case_003",
  "system": "nds_internal",
  "status": "success",
  "best_direction": {
    "title": "From Short notes: restaurant operations. ... to growth",
    "summary": "This direction has the clearest personal arc and strongest evidence signal.",
    "why_it_wins": "It demonstrates concrete action, reflection, and a meaningful change signal.",
    "main_risk": "Could become summary-heavy if the pivotal moment is not dramatized.",
    "next_move": "Draft the turning-point scene first, then connect it to present values."
  },
  "alternatives": [],
  "evidence_anchors": [
    "Primary story signal"
  ],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 0,
    "evidence_anchor_count": 1
  }
}

### Output B
{
  "case_id": "case_003",
  "system": "baseline_free_ai",
  "status": "success",
  "best_direction": {
    "title": "Direction 1",
    "summary": "Focus on a meaningful experience and what you learned.",
    "why_it_wins": "It can be broadly compelling for admissions readers.",
    "main_risk": "May feel generic.",
    "next_move": "Draft a personal statement paragraph."
  },
  "alternatives": [
    {
      "title": "Direction 2",
      "why_it_loses": "Less compelling overall.",
      "risk": "Could be too broad."
    }
  ],
  "evidence_anchors": [],
  "recovery_question": null,
  "meta": {
    "clear_winner_present": true,
    "alternative_count": 1,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_006 — weak-signal translation advocacy
difficulty: weak
tags: messy_notes, draft_present, school_sensitive, red_team, parent_advisor_risk, fake_confidence_temptation

### Student input packet
stories: 0
draft present: true
school context: School 6

### Output A
{
  "case_id": "case_006",
  "system": "baseline_free_ai",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "Can you share a meaningful personal experience?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_006",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment

## case_008 — weak-signal music ensemble accountability
difficulty: weak
tags: messy_notes, draft_present, conflicting_signals, red_team, parent_advisor_risk

### Student input packet
stories: 0
draft present: true
school context: none

### Output A
{
  "case_id": "case_008",
  "system": "baseline_free_ai",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "Can you share a meaningful personal experience?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Output B
{
  "case_id": "case_008",
  "system": "nds_internal",
  "status": "needs_more_input",
  "best_direction": {
    "title": "",
    "summary": "",
    "why_it_wins": "",
    "main_risk": "",
    "next_move": ""
  },
  "alternatives": [],
  "evidence_anchors": [],
  "recovery_question": "What moment changed how you see yourself or your future?",
  "meta": {
    "clear_winner_present": false,
    "alternative_count": 0,
    "evidence_anchor_count": 0
  }
}

### Human score form
- divergence_quality (1-5 each)
- conviction_quality (1-5 each)
- evidence_grounding (1-5 each)
- next_step_usefulness (1-5 each)
- substitution_risk (1-5 each)
- student_dignity_tone (1-5 each)
- product_sharpness (1-5 each)
- nds_clearly_better_than_baseline (true/false)
- nds_strength
- baseline_failure
- important_comment
