import type { BlankPageClassification, BlankPageMode, ProductMode } from '@/types/intake';

type EnvMap = Record<string, string | undefined>;

export interface BlankPageRolloutConfig {
  enabled: boolean;
  allowedModes: BlankPageMode[];
  minConfidence: 'low' | 'medium' | 'high';
  allowedEnvironments: Array<'development' | 'test' | 'production'>;
  fallbackMode: Extract<ProductMode, 'clarification' | 'blocked'>;
}

export interface BlankPageRolloutDecision {
  activateBlankPageLane: boolean;
  effectiveMode: ProductMode;
  reason:
    | 'candidate_not_blank_page'
    | 'rollout_disabled'
    | 'environment_not_allowed'
    | 'mode_not_allowed'
    | 'confidence_below_minimum'
    | 'blank_page_not_detected'
    | 'activated';
  config: BlankPageRolloutConfig;
}

const DEFAULT_CONFIG: BlankPageRolloutConfig = {
  enabled: false,
  allowedModes: [
    'topic_probe',
    'theme_probe',
    'activity_probe',
    'scope_reframe',
    'blank_page_discovery',
  ],
  minConfidence: 'medium',
  allowedEnvironments: ['production'],
  fallbackMode: 'clarification',
};

export function getBlankPageRolloutConfig(env: EnvMap = process.env): BlankPageRolloutConfig {
  const enabled = parseBoolean(env.BLANK_PAGE_ROLLOUT_ENABLED);
  const allowedModes = parseModes(env.BLANK_PAGE_ROLLOUT_ALLOWED_MODES);
  const minConfidence = parseConfidence(env.BLANK_PAGE_ROLLOUT_MIN_CONFIDENCE);
  const allowedEnvironments = parseEnvironments(env.BLANK_PAGE_ROLLOUT_ALLOWED_ENVS);
  const fallbackMode = parseFallbackMode(env.BLANK_PAGE_ROLLOUT_FALLBACK_MODE);

  if (!enabled || !allowedModes || !minConfidence || !allowedEnvironments || !fallbackMode) {
    return { ...DEFAULT_CONFIG };
  }

  return {
    enabled,
    allowedModes,
    minConfidence,
    allowedEnvironments,
    fallbackMode,
  };
}

export function evaluateBlankPageRollout(input: {
  requestedMode: ProductMode;
  blankPageClassification: BlankPageClassification;
  environment?: 'development' | 'test' | 'production';
  env?: EnvMap;
}): BlankPageRolloutDecision {
  const config = getBlankPageRolloutConfig(input.env);
  const envName = input.environment ?? normalizeEnvironment(process.env.NODE_ENV);

  if (input.requestedMode !== 'blank_page_intake') {
    return {
      activateBlankPageLane: false,
      effectiveMode: input.requestedMode,
      reason: 'candidate_not_blank_page',
      config,
    };
  }

  if (!config.enabled) {
    return {
      activateBlankPageLane: false,
      effectiveMode: config.fallbackMode,
      reason: 'rollout_disabled',
      config,
    };
  }

  if (!config.allowedEnvironments.includes(envName)) {
    return {
      activateBlankPageLane: false,
      effectiveMode: config.fallbackMode,
      reason: 'environment_not_allowed',
      config,
    };
  }

  const mode = input.blankPageClassification.blank_page_mode;
  if (!mode || !config.allowedModes.includes(mode)) {
    return {
      activateBlankPageLane: false,
      effectiveMode: config.fallbackMode,
      reason: 'mode_not_allowed',
      config,
    };
  }

  if (!input.blankPageClassification.blank_page_intake_detected) {
    return {
      activateBlankPageLane: false,
      effectiveMode: config.fallbackMode,
      reason: 'blank_page_not_detected',
      config,
    };
  }

  if (!meetsConfidenceFloor(input.blankPageClassification.blank_page_confidence, config.minConfidence)) {
    return {
      activateBlankPageLane: false,
      effectiveMode: config.fallbackMode,
      reason: 'confidence_below_minimum',
      config,
    };
  }

  return {
    activateBlankPageLane: true,
    effectiveMode: 'blank_page_intake',
    reason: 'activated',
    config,
  };
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function parseModes(value: string | undefined): BlankPageMode[] | null {
  if (!value) return [...DEFAULT_CONFIG.allowedModes];
  const raw = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const isValidMode = (item: string): item is BlankPageMode => (
    item === 'topic_probe'
    || item === 'theme_probe'
    || item === 'activity_probe'
    || item === 'scope_reframe'
    || item === 'blank_page_discovery'
    || item === 'too_thin_to_recover'
  );

  if (raw.length === 0 || raw.some((item) => !isValidMode(item))) {
    return null;
  }

  return Array.from(new Set(raw)) as BlankPageMode[];
}

function parseConfidence(value: string | undefined): 'low' | 'medium' | 'high' | null {
  if (!value) return DEFAULT_CONFIG.minConfidence;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'low' || normalized === 'medium' || normalized === 'high') {
    return normalized;
  }
  return null;
}

function parseEnvironments(value: string | undefined): Array<'development' | 'test' | 'production'> | null {
  if (!value) return [...DEFAULT_CONFIG.allowedEnvironments];
  const raw = value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const isValid = (item: string): item is 'development' | 'test' | 'production' => (
    item === 'development' || item === 'test' || item === 'production'
  );

  if (raw.length === 0 || raw.some((item) => !isValid(item))) {
    return null;
  }

  return Array.from(new Set(raw)) as Array<'development' | 'test' | 'production'>;
}

function parseFallbackMode(value: string | undefined): Extract<ProductMode, 'clarification' | 'blocked'> | null {
  if (!value) return DEFAULT_CONFIG.fallbackMode;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'clarification' || normalized === 'blocked') {
    return normalized;
  }
  return null;
}

function normalizeEnvironment(value: string | undefined): 'development' | 'test' | 'production' {
  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }
  return 'production';
}

function meetsConfidenceFloor(
  confidence: BlankPageClassification['blank_page_confidence'],
  floor: 'low' | 'medium' | 'high'
): boolean {
  const rank: Record<'low' | 'medium' | 'high', number> = {
    low: 1,
    medium: 2,
    high: 3,
  };

  if (!confidence) return false;
  return rank[confidence] >= rank[floor];
}
