import type {
  AttachRunRequest,
  CreateCaseRequest,
  SubmitCaseReviewRequest,
} from '@/types/api/realInputCorpusApi';

export const seedCreateCaseRequest: CreateCaseRequest = {
  caseType: 'nds_real_input',
  productSurface: 'narrative_direction_selection',
  sourceChannel: 'evaluation_seed',
  rawInputText: 'I have too many possible activities and cannot pick an essay direction.',
  labelSchemaVersion: 'ml_labels_v1',
  tags: ['blank_page', 'seed_fixture'],
  context: {
    studentGradeLevel: '12',
    priorAttemptsPresent: true,
    statedGoalSignal: 'needs direction',
    ambiguityLevel: 4,
    complexityScore: 3,
    sensitivityFlags: [],
    contextPayload: {},
  },
};

export const seedAttachRunRequest: AttachRunRequest = {
  runKey: 'RUN-SEED-0001',
  modelProvider: 'openai',
  modelName: 'gpt-5.4-thinking',
  routingPolicyVersion: 'irp_v1.2.0',
  promptTemplateVersion: 'nds_prompt_v1.4.3',
  assemblyContextVersion: 'ctx_v1.1.0',
  fallbackUsed: false,
  confidenceScore: 0.83,
  riskScore: 0.12,
  runStatus: 'success',
  releaseVersion: 'app_0.9.0',
  inputFeatures: { ambiguityLevel: 4 },
  retrievedPatterns: [],
  assemblyPayload: {},
  outputs: [
    {
      outputRole: 'final',
      outputText: 'You have three viable narrative directions to test.',
      selectedForDelivery: true,
      deliveredToUser: true,
    },
  ],
};

export const seedSubmitReviewRequest: SubmitCaseReviewRequest = {
  caseId: 'case-seed-id',
  runId: 'run-seed-id',
  reviewerId: 'reviewer_seed_1',
  reviewRound: 1,
  decision: 'approve_with_minor_edits',
  rationaleText: 'Strong strategic direction with minor clarity edits needed.',
  generalizableLearningFlag: true,
  promoteToGoldFlag: false,
  requiresAdjudicationFlag: false,
  reasonCodes: ['direction_specific', 'actionable_next_step'],
  scores: [
    { dimension: 'authenticity_preservation', value: 4 },
    { dimension: 'narrative_specificity', value: 4 },
    { dimension: 'directional_usefulness', value: 5 },
    { dimension: 'non_genericness', value: 4 },
    { dimension: 'strategic_differentiation', value: 4 },
    { dimension: 'student_fit', value: 4 },
    { dimension: 'clarity_of_recommendation', value: 4 },
    { dimension: 'evidence_grounded_interpretation', value: 4 },
    { dimension: 'actionability', value: 5 },
    { dimension: 'safety_policy_compliance', value: 5 },
  ],
  failureModes: [],
};
