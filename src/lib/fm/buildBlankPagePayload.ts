import type {
  BlankPageClassification,
  BlankPageIntakePayload,
  BlankPageMode,
  BlankPageQuestionFamily,
  MissingSignalType,
  NextStepType,
} from '@/types/intake';

interface QuestionTemplate {
  id: string;
  family: BlankPageQuestionFamily;
  text: string;
}

interface ModeTemplateConfig {
  primary: QuestionTemplate[];
  secondary: QuestionTemplate[];
  whyNotReady: string;
  missingSignal: MissingSignalType;
  reassurance: string | null;
  exampleAnswerShape: string | null;
  whatGoodSignalLooksLike: string | null;
}

const BANNED_PROMPT_PATTERNS: RegExp[] = [
  /^tell me more\.?$/i,
  /^can you elaborate\??$/i,
  /^what do you mean\??$/i,
  /^what are you passionate about\??$/i,
  /^what makes you unique\??$/i,
  /^what did you learn\??$/i,
  /3\s*[–-]\s*5\s+topics/i,
  /that sounds like a great topic/i,
];

const TEMPLATE_REGISTRY: Record<Exclude<BlankPageMode, 'too_thin_to_recover'>, ModeTemplateConfig> = {
  topic_probe: {
    primary: [
      {
        id: 'tp_moment_01',
        family: 'moment_question',
        text: 'What moment inside this topic stayed with you after it ended?',
      },
      {
        id: 'tp_moment_02',
        family: 'moment_question',
        text: 'Inside this topic, what is one specific scene you can still replay clearly?',
      },
      {
        id: 'tp_hinge_01',
        family: 'hinge_question',
        text: 'When did this stop being just a topic and start feeling personally meaningful?',
      },
    ],
    secondary: [
      {
        id: 'tp_change_01',
        family: 'change_question',
        text: 'After that moment, what changed in how you thought or acted?',
      },
      {
        id: 'tp_conflict_01',
        family: 'conflict_question',
        text: 'Where was the tension or uncertainty inside this topic?',
      },
    ],
    whyNotReady: 'Topic present but no lived moment or hinge identified yet.',
    missingSignal: 'missing_moment',
    reassurance: 'This is recoverable. One concrete moment is enough to move forward.',
    exampleAnswerShape: 'One scene, one sentence of what happened, one sentence of why it mattered.',
    whatGoodSignalLooksLike: 'A specific moment where something shifted, not a general statement about the topic.',
  },
  theme_probe: {
    primary: [
      {
        id: 'th_change_01',
        family: 'change_question',
        text: 'What specific situation forced this trait to become real, not just a theme you want to show?',
      },
      {
        id: 'th_hinge_01',
        family: 'hinge_question',
        text: 'Where did this theme become real for you instead of staying abstract?',
      },
      {
        id: 'th_change_02',
        family: 'change_question',
        text: 'What happened that changed how you handled this in real life?',
      },
    ],
    secondary: [
      {
        id: 'th_conflict_01',
        family: 'conflict_question',
        text: 'Where did this feel difficult, uncertain, or uncomfortable in practice?',
      },
      {
        id: 'th_moment_01',
        family: 'moment_question',
        text: 'What exact moment would prove this theme actually happened?',
      },
    ],
    whyNotReady: 'Theme present but no concrete event anchor exists.',
    missingSignal: 'missing_lived_evidence',
    reassurance: 'You do not need a perfect story yet. You only need one grounded event.',
    exampleAnswerShape: 'Name the event, who was involved, and the turning point in 2–3 sentences.',
    whatGoodSignalLooksLike: 'A real situation with before/after movement, not trait-only language.',
  },
  activity_probe: {
    primary: [
      {
        id: 'ap_person_01',
        family: 'person_over_task_question',
        text: 'Inside this activity, what part mattered to you beyond the task itself?',
      },
      {
        id: 'ap_person_02',
        family: 'person_over_task_question',
        text: 'What does this activity reveal about you that a résumé line cannot show?',
      },
      {
        id: 'ap_moment_01',
        family: 'moment_question',
        text: 'What moment inside this activity felt personally high-stakes for you?',
      },
    ],
    secondary: [
      {
        id: 'ap_resp_01',
        family: 'responsibility_question',
        text: 'What responsibility did you carry here that actually mattered to other people?',
      },
      {
        id: 'ap_conflict_01',
        family: 'conflict_question',
        text: 'Where did friction or pressure show up inside this activity?',
      },
      {
        id: 'ap_change_01',
        family: 'change_question',
        text: 'What changed in how you approached this after a difficult moment?',
      },
    ],
    whyNotReady: 'Activity present but personal center is still missing.',
    missingSignal: 'missing_personal_center',
    reassurance: 'This does not require a dramatic story. It requires your center inside the activity.',
    exampleAnswerShape: 'One moment, one responsibility or tension, one personal shift.',
    whatGoodSignalLooksLike: 'Identity signal inside the activity, not a broad summary of participation.',
  },
  scope_reframe: {
    primary: [
      {
        id: 'sr_reframe_01',
        family: 'scope_reframe_question',
        text: 'Instead of asking whether this is enough, what part of it most clearly changed how you see yourself?',
      },
      {
        id: 'sr_reframe_02',
        family: 'scope_reframe_question',
        text: 'What specific part of this reveals something true about you that a reader would not otherwise know?',
      },
      {
        id: 'sr_reframe_03',
        family: 'scope_reframe_question',
        text: 'Set aside whether this is a good topic for a moment: what scene here carries the strongest signal?',
      },
    ],
    secondary: [
      {
        id: 'sr_change_01',
        family: 'change_question',
        text: 'What changed in your thinking because of this?',
      },
      {
        id: 'sr_moment_01',
        family: 'moment_question',
        text: 'What exact moment best captures what this reveals about you?',
      },
    ],
    whyNotReady: 'User is asking worthiness questions instead of extracting signal.',
    missingSignal: 'missing_scope_frame',
    reassurance: 'The goal is not proving depth in the abstract. The goal is finding concrete signal.',
    exampleAnswerShape: 'Name one scene and what it shows about you in plain language.',
    whatGoodSignalLooksLike: 'A specific event that reveals responsibility, tension, or change.',
  },
  blank_page_discovery: {
    primary: [
      {
        id: 'bd_discovery_01',
        family: 'blank_page_discovery_question',
        text: 'What is something you kept returning to, carrying, fixing, avoiding, or protecting recently, even if it did not seem essay-worthy at first?',
      },
      {
        id: 'bd_discovery_02',
        family: 'blank_page_discovery_question',
        text: 'What situation or responsibility has stayed with you longer than you expected?',
      },
      {
        id: 'bd_discovery_03',
        family: 'blank_page_discovery_question',
        text: 'What recurring frustration or responsibility keeps pulling your attention lately?',
      },
    ],
    secondary: [
      {
        id: 'bd_resp_01',
        family: 'responsibility_question',
        text: 'Where have people depended on you in a way that felt real?',
      },
      {
        id: 'bd_conflict_01',
        family: 'conflict_question',
        text: 'What has felt difficult, tense, or unresolved recently?',
      },
      {
        id: 'bd_change_01',
        family: 'change_question',
        text: 'What has changed in you over the past year that you can tie to one real moment?',
      },
    ],
    whyNotReady: 'No usable topic candidate has been identified yet.',
    missingSignal: 'missing_topic_candidate',
    reassurance: 'You do not need a final topic yet. We are looking for one viable story zone.',
    exampleAnswerShape: 'Give one recurring situation and one moment inside it that still feels vivid.',
    whatGoodSignalLooksLike: 'A repeat pattern, responsibility, tension, or memory residue that can anchor a story.',
  },
};

const TOO_THIN_FALLBACK = {
  primaryQuestion: 'Give one concrete starting point: a specific responsibility, event, or challenge from the last year.',
  whyNotReady: 'Insufficient recoverable signal for meaningful progression.',
  reassurance: 'This is not a rejection. We just need one concrete starting point to continue.',
  exampleAnswerShape: 'One sentence naming the situation, one sentence naming what happened.',
  whatGoodSignalLooksLike: 'A real event with a person, action, or tension we can work with.',
};

export function buildBlankPagePayload(input: {
  rawInput: string;
  blankPageClassification: BlankPageClassification;
}): BlankPageIntakePayload {
  const mode = input.blankPageClassification.blank_page_mode ?? 'too_thin_to_recover';
  const normalized = normalizeForSelection(input.rawInput);

  if (mode === 'too_thin_to_recover') {
    return {
      product_mode: 'blank_page_intake',
      blank_page_mode: 'too_thin_to_recover',
      recovery_question_primary: TOO_THIN_FALLBACK.primaryQuestion,
      recovery_question_secondary: null,
      recovery_confidence: input.blankPageClassification.blank_page_confidence ?? 'low',
      missing_signal_type: 'missing_recoverable_signal',
      why_not_ready_for_direction: TOO_THIN_FALLBACK.whyNotReady,
      next_step_type: resolveNextStepType('too_thin_to_recover', null),
      reassurance_copy: TOO_THIN_FALLBACK.reassurance,
      example_answer_shape: TOO_THIN_FALLBACK.exampleAnswerShape,
      what_good_signal_would_look_like: TOO_THIN_FALLBACK.whatGoodSignalLooksLike,
      topic_candidate: null,
      question_family_primary: null,
      question_family_secondary: null,
      selected_template_id: 'ttr_recovery_stop_01',
    };
  }

  const config = TEMPLATE_REGISTRY[mode];
  const primary = pickDeterministicTemplate(config.primary, normalized, `${mode}_primary`);
  const secondary = pickDeterministicTemplate(config.secondary, normalized, `${mode}_secondary`);

  const safePrimary = ensureAllowedPrompt(primary.text, mode);
  const safeSecondary = ensureAllowedPrompt(secondary.text, mode);

  return {
    product_mode: 'blank_page_intake',
    blank_page_mode: mode,
    recovery_question_primary: safePrimary,
    recovery_question_secondary: safeSecondary,
    recovery_confidence: input.blankPageClassification.blank_page_confidence ?? 'medium',
    missing_signal_type: config.missingSignal,
    why_not_ready_for_direction: config.whyNotReady,
    next_step_type: resolveNextStepType(mode, safeSecondary),
    reassurance_copy: config.reassurance,
    example_answer_shape: config.exampleAnswerShape,
    what_good_signal_would_look_like: config.whatGoodSignalLooksLike,
    topic_candidate: extractTopicCandidate(input.rawInput),
    question_family_primary: primary.family,
    question_family_secondary: secondary.family,
    selected_template_id: `${primary.id}__${secondary.id}`,
  };
}

function resolveNextStepType(mode: BlankPageMode, secondaryQuestion: string | null): NextStepType {
  if (mode === 'too_thin_to_recover') {
    return 'provide_more_concrete_starting_point';
  }

  if (secondaryQuestion) {
    return 'answer_primary_or_secondary_question';
  }

  return 'answer_primary_question';
}

function ensureAllowedPrompt(prompt: string, mode: BlankPageMode): string {
  if (BANNED_PROMPT_PATTERNS.some((pattern) => pattern.test(prompt.trim()))) {
    if (mode === 'scope_reframe') {
      return 'What specific part of this reveals something true about you that a reader would not otherwise know?';
    }
    if (mode === 'blank_page_discovery') {
      return 'What recurring situation, responsibility, or tension has stayed with you recently?';
    }
    return 'What specific moment here carries the strongest signal about you?';
  }

  return prompt;
}

function pickDeterministicTemplate(
  templates: QuestionTemplate[],
  normalizedInput: string,
  salt: string
): QuestionTemplate {
  const seed = `${salt}:${normalizedInput}`;
  const hash = stableHash(seed);
  return templates[Math.abs(hash) % templates.length];
}

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function normalizeForSelection(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTopicCandidate(rawInput: string): string | null {
  const aboutMatch = rawInput.match(/\b(?:about|on)\s+([a-z0-9\s'’\-]{3,80})/i);
  const betweenMatch = rawInput.match(/\bbetween\s+([a-z0-9\s'’\-,]{3,100})/i);

  const candidate = (aboutMatch?.[1] ?? betweenMatch?.[1] ?? '').trim();
  if (!candidate) return null;

  return candidate
    .replace(/[?.!,;:]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}
