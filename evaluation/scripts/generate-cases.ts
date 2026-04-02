import fs from 'node:fs';
import path from 'node:path';

type Difficulty = 'weak' | 'medium' | 'strong';

type EvalCase = {
  case_id: string;
  label: string;
  difficulty: Difficulty;
  tags: string[];
  student_profile: {
    grade_level: string;
    intended_majors: string[];
    core_interests: string[];
    identity_notes: string[];
  };
  essay_project: {
    project_id: string;
    project_type: 'personal_statement';
    target_school: string | null;
  };
  story_entries: Array<{ id: string; text: string }>;
  current_draft: { id: string | null; text: string | null };
  school_context: { target_school: string | null; notes: string };
  expected_conditions: {
    should_be_needs_more_input: boolean;
    should_have_clear_winner: boolean;
    likely_bad_baseline_behavior: string[];
  };
  author_notes: {
    why_included: string;
    reviewer_warning: string;
  };
};

const outDir = path.join(process.cwd(), 'evaluation', 'cases');
fs.mkdirSync(outDir, { recursive: true });

const themes = [
  'family caregiving',
  'robotics leadership',
  'restaurant operations',
  'debate conflict',
  'science fair failure',
  'translation advocacy',
  'community clinic volunteer',
  'music ensemble accountability',
  'cross-country recovery',
  'peer tutoring growth',
];

const majors = [
  ['biology'],
  ['mechanical engineering'],
  ['public policy'],
  ['computer science'],
  ['psychology'],
];

function storyText(theme: string, i: number): string {
  return `Case ${i}: ${theme}. I initially handled this situation poorly, then adapted my approach after feedback. I can point to one turning-point moment and a specific behavior change that affected others.`;
}

const parentAdvisorOverrides: Record<string, Partial<EvalCase>> = {
  case_002: {
    story_entries: [
      {
        id: 'story_2_1',
        text:
          'Robotics pit notes. At first I kept taking the repair back from Maya because I thought I could fix the intake faster. After our mentor told me I was freezing the whole pit, I changed my approach. Next round I stayed on testing and notes while Maya handled the repair, and we got through inspection.',
      },
    ],
    current_draft: {
      id: 'draft_2',
      text:
        'This essay should frame robotics as a lesson in collaborative leadership and future engineering direction. I am trying to connect the event to values, maturity, and broader purpose.',
    },
    author_notes: {
      why_included:
        'Parent/advisor contamination case: a polished robotics draft competes with a rough student-owned pit scene.',
      reviewer_warning:
        'Check whether the system follows the student-owned repair moment instead of the polished framing.',
    },
  },
  case_004: {
    story_entries: [
      {
        id: 'story_4_1',
        text:
          'Debate round notes. I handled cross badly at first and kept cutting my partner off because I wanted to control the round. After my coach pointed it out, I changed how I handled the next round. I asked my partner what line she wanted, gave her space, and we were calmer and clearer.',
      },
    ],
    current_draft: {
      id: 'draft_4',
      text:
        'This essay could highlight debate as a story of leadership, confidence, and future direction. I am trying to connect the event to growth, values, and a broader lesson about communication.',
    },
    author_notes: {
      why_included:
        'Parent/advisor contamination case: the polished debate draft overstates the lesson while the student notes still hold the real scene.',
      reviewer_warning:
        'Check whether the system prefers the scene where the student changed behavior over the polished leadership framing.',
    },
  },
  case_006: {
    story_entries: [
      {
        id: 'story_6_1',
        text:
          'Clinic call notes. I first treated translating for my grandmother like just repeating words. After a volunteer at the clinic told me I was moving too fast, I changed my approach. I started stopping after each part of the call, checking what she understood, and the whole call got calmer.',
      },
    ],
    current_draft: {
      id: 'draft_6',
      text:
        'This essay should connect translation advocacy to service, empathy, and future direction in medicine. I am trying to frame the experience around values, voice, and the broader meaning of care.',
    },
    author_notes: {
      why_included:
        'Parent/advisor contamination case: polished service framing competes with a student-owned clinic translation scene.',
      reviewer_warning:
        'Check whether the system centers the actual correction in care rather than the abstract service language.',
    },
  },
  case_008: {
    story_entries: [
      {
        id: 'story_8_1',
        text:
          'Orchestra rehearsal notes. At first I covered missed entrances by playing louder and trying to pull everyone in. After the director told me I was hiding the problem, I changed my approach. Next rehearsal I stopped the run, pointed out where our section was late, and we fixed it together.',
      },
    ],
    current_draft: {
      id: 'draft_8',
      text:
        'This essay can highlight music as a story of accountability, maturity, and collaborative values. I am trying to connect the rehearsal experience to broader themes of leadership and future direction.',
    },
    author_notes: {
      why_included:
        'Parent/advisor contamination case: polished ensemble framing competes with a rough rehearsal correction scene.',
      reviewer_warning:
        'Check whether the system follows the rehearsal moment instead of the abstract accountability framing.',
    },
  },
  case_010: {
    story_entries: [
      {
        id: 'story_10_1',
        text:
          'Tutoring notes. I first kept explaining the same way because I thought repeating it would help. After my teacher said I was doing the work for him, I changed my approach. I started asking one question at a time and waited, and he finally started working out the problem himself.',
      },
    ],
    current_draft: {
      id: 'draft_10',
      text:
        'This essay should frame peer tutoring as a story of growth, leadership, and future direction. I am trying to connect the experience to values, maturity, and a broader lesson about helping others learn.',
    },
    author_notes: {
      why_included:
        'Parent/advisor contamination case: polished tutoring framing competes with a specific student-owned before/after teaching moment.',
      reviewer_warning:
        'Check whether the system follows the student scene rather than the abstract growth framing.',
    },
  },
};

function makeCase(i: number): EvalCase {
  const id = `case_${String(i).padStart(3, '0')}`;
  const difficulty: Difficulty = i <= 10 ? 'weak' : i <= 20 ? 'medium' : 'strong';
  const theme = themes[(i - 1) % themes.length];

  const weak = difficulty === 'weak';
  const medium = difficulty === 'medium';

  const tags = new Set<string>();
  if (i <= 15) tags.add('messy_notes');
  if (i % 2 === 0) tags.add('draft_present');
  if (i % 3 === 0) tags.add('school_sensitive');
  if (i % 4 === 0) tags.add('conflicting_signals');
  if (i % 5 === 0) tags.add('resume_list');
  if (i <= 8) tags.add('red_team');

  if ([1, 2, 3, 4, 5].includes(i)) tags.add('stale_draft_risk');
  if ([2, 4, 6, 8, 10].includes(i)) tags.add('parent_advisor_risk');
  if ([1, 3, 5, 7, 9].includes(i)) tags.add('generic_padding_risk');
  if ([1, 2, 3, 4, 5, 6].includes(i)) tags.add('fake_confidence_temptation');
  if (i <= 8) tags.add('red_team');

  const redTeamExtras = [
    'stale_draft_risk',
    'parent_advisor_risk',
    'conflicting_signals',
    'generic_padding_risk',
    'resume_list',
    'fake_confidence_temptation',
    'school_sensitive',
    'draft_present',
  ];
  if (i <= 8) tags.add(redTeamExtras[i - 1]);

  const storyCount = weak ? (i % 2 === 0 ? 0 : 1) : medium ? 1 : 2;
  const story_entries = Array.from({ length: storyCount }, (_, idx) => ({
    id: `story_${i}_${idx + 1}`,
    text: weak
      ? `Short notes: ${theme}. Did a lot. Learned something.`
      : storyText(theme, i),
  }));

  const draftText = i % 2 === 0
    ? `Draft for ${theme}. I am trying to connect event-level details with values and future direction.`
    : null;

  const targetSchool = i % 3 === 0 ? `School ${((i - 1) % 6) + 1}` : null;

  const generatedCase: EvalCase = {
    case_id: id,
    label: `${difficulty}-signal ${theme}`,
    difficulty,
    tags: Array.from(tags),
    student_profile: {
      grade_level: '12',
      intended_majors: majors[(i - 1) % majors.length],
      core_interests: ['community', 'learning', 'growth'],
      identity_notes: [],
    },
    essay_project: {
      project_id: `eval_${id}`,
      project_type: 'personal_statement',
      target_school: targetSchool,
    },
    story_entries,
    current_draft: {
      id: draftText ? `draft_${i}` : null,
      text: draftText,
    },
    school_context: {
      target_school: targetSchool,
      notes: targetSchool ? `Student is considering fit with ${targetSchool}.` : '',
    },
    expected_conditions: {
      should_be_needs_more_input: weak && story_entries.length === 0 && !draftText,
      should_have_clear_winner: !weak || !!draftText,
      likely_bad_baseline_behavior: ['generic_praise', 'flat_options', 'resume_list_regurgitation'],
    },
    author_notes: {
      why_included: `Covers ${difficulty} difficulty behavior and ${theme} signal pattern.`,
      reviewer_warning: weak ? 'Watch for fake confidence under thin context.' : '',
    },
  };

  const override = parentAdvisorOverrides[id];
  return override
    ? {
        ...generatedCase,
        ...override,
      }
    : generatedCase;
}

const cases = Array.from({ length: 30 }, (_, idx) => makeCase(idx + 1));
for (const c of cases) {
  const p = path.join(outDir, `${c.case_id}.json`);
  fs.writeFileSync(p, JSON.stringify(c, null, 2), 'utf-8');
}

console.log(`Generated ${cases.length} evaluation cases in ${outDir}`);
