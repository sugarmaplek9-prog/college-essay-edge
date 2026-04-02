import type { NdsResolvedSources } from '@/types/ai';

export interface NdsEvalCase {
  id: string;
  label: string;
  sources: NdsResolvedSources;
}

function makeSources(params: {
  id: string;
  title: string;
  stories: Array<{ id: string; title: string; body: string; category?: string | null }>;
  draftText?: string;
  grade?: number;
}): NdsResolvedSources {
  return {
    essay_project: {
      id: params.id,
      student_user_id: 'user-1',
      title: params.title,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: 'user-1',
      first_name: 'Alex',
      last_name: 'Kim',
      grade: params.grade ?? 11,
      interests: ['engineering', 'teaching'],
    },
    story_entries: params.stories.map((s) => ({
      id: s.id,
      title: s.title,
      body: s.body,
      category: s.category ?? null,
    })),
    current_draft: params.draftText
      ? {
          id: `${params.id}-draft-1`,
          draft_text: params.draftText,
          version_number: 1,
        }
      : null,
    school_context: null,
    source_meta: {
      story_entry_count: params.stories.length,
      has_current_draft: !!params.draftText,
      has_school_context: false,
    },
  };
}

export const NDS_EVAL_CASES: NdsEvalCase[] = [
  {
    id: 'case-01',
    label: 'high-signal leadership arc',
    sources: makeSources({
      id: 'proj-01',
      title: 'Personal Statement',
      stories: [
        {
          id: 'story-01',
          title: 'Robotics captain under pressure',
          body: 'When our drivetrain failed two days before regionals, I realized I had built a team that waited for me to have answers. I stopped trying to be the hero, mapped failure modes on the whiteboard, and asked each teammate to own one fix path. We rebuilt overnight, qualified, and I learned leadership means designing trust, not controlling every outcome.',
        },
        {
          id: 'story-02',
          title: 'Tutoring middle school math',
          body: 'I started tutoring to earn service hours, but I stayed because one student told me she finally felt smart in algebra. I learned to explain ideas three ways and measure success by her confidence, not my explanations.',
        },
      ],
    }),
  },
  {
    id: 'case-02',
    label: 'single reflective story',
    sources: makeSources({
      id: 'proj-02',
      title: 'Common App Essay',
      stories: [
        {
          id: 'story-03',
          title: 'Family restaurant weekends',
          body: 'I used to resent spending weekends at my parents’ restaurant. After a delivery app outage, I managed paper tickets, calmed frustrated customers, and saw how fragile small businesses are. I grew from helper to problem-solver and now care deeply about operations and community resilience.',
        },
      ],
      draftText: 'I want to write about my relationship with responsibility and how work changed my values.',
    }),
  },
  {
    id: 'case-03',
    label: 'thin input should route nmi',
    sources: makeSources({
      id: 'proj-03',
      title: 'Essay Direction',
      stories: [],
    }),
  },
  {
    id: 'case-04',
    label: 'technical to human shift',
    sources: makeSources({
      id: 'proj-04',
      title: 'Essay Brainstorm',
      stories: [
        {
          id: 'story-04',
          title: 'Science fair failure',
          body: 'My experiment collapsed at state finals and I blamed my data pipeline. My mentor asked what question I was actually curious about. I rebuilt the project around water quality in my neighborhood creek and learned that research matters when it serves people, not when it just wins points.',
        },
        {
          id: 'story-05',
          title: 'Debate team conflict',
          body: 'I thought winning arguments made me a good debater. After alienating my partner, I changed how I prepared: fewer scripted rebuttals, more listening for values behind claims. Our results improved, but more importantly, I learned persuasion without respect is empty.',
        },
      ],
    }),
  },
  {
    id: 'case-05',
    label: 'service identity arc',
    sources: makeSources({
      id: 'proj-05',
      title: 'Essay Narrative',
      stories: [
        {
          id: 'story-06',
          title: 'Translating for grandparents',
          body: 'I translated insurance letters for my grandparents for years, but I treated it as a chore. During a denied claim call, I heard panic in my grandmother’s voice and understood language access as dignity, not convenience. I began volunteering at a legal clinic and found purpose in building clarity for others.',
        },
      ],
      draftText: 'Current draft explores communication and advocacy across generations.',
    }),
  },
];
