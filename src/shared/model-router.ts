export type QueryComplexity = 'simple' | 'standard' | 'complex';

export interface ModelRouterConfig {
  simpleModelId: string;
  standardModelId: string;
  complexModelId: string;
  fallbackModelIds?: string[];
}

export interface ModelRouterEnv {
  BEDROCK_SIMPLE_MODEL_ID?: string;
  BEDROCK_MODEL_ID?: string;
  BEDROCK_COMPLEX_MODEL_ID?: string;
  BEDROCK_FALLBACK_MODEL_IDS?: string;
}

export interface ModelSelectionPlan {
  complexity: QueryComplexity;
  primaryModelId: string;
  fallbackModelIds: string[];
  candidateModelIds: string[];
  selectionReason: string;
}

export function selectModel(complexity: QueryComplexity | undefined, config: ModelRouterConfig): string {
  switch (complexity) {
    case 'simple':
      return config.simpleModelId;
    case 'complex':
      return config.complexModelId;
    case 'standard':
    case undefined:
      return config.standardModelId;
    default: {
      const exhaustive: never = complexity;
      return exhaustive;
    }
  }
}

export function selectModelPlan(
  complexity: QueryComplexity | undefined,
  config: ModelRouterConfig,
): ModelSelectionPlan {
  const resolvedComplexity = complexity ?? 'standard';
  const primaryModelId = selectModel(complexity, config);
  const fallbackModelIds = dedupeModelIds(config.fallbackModelIds ?? []).filter(
    (modelId) => modelId !== primaryModelId,
  );

  return {
    complexity: resolvedComplexity,
    primaryModelId,
    fallbackModelIds,
    candidateModelIds: [primaryModelId, ...fallbackModelIds],
    selectionReason: complexity ? `complexity:${complexity}` : 'complexity:standard-default',
  };
}

export function defaultRouterConfig(
  defaultModelId: string,
  env: ModelRouterEnv = process.env,
): ModelRouterConfig {
  return {
    simpleModelId: env.BEDROCK_SIMPLE_MODEL_ID ?? defaultModelId,
    standardModelId: env.BEDROCK_MODEL_ID ?? defaultModelId,
    complexModelId: env.BEDROCK_COMPLEX_MODEL_ID ?? defaultModelId,
    fallbackModelIds: parseFallbackModelIds(env.BEDROCK_FALLBACK_MODEL_IDS),
  };
}

export function parseFallbackModelIds(value: string | undefined): string[] {
  return dedupeModelIds(
    (value ?? '')
      .split(',')
      .map((modelId) => modelId.trim())
      .filter(Boolean),
  );
}

function dedupeModelIds(modelIds: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const modelId of modelIds) {
    if (!seen.has(modelId)) {
      seen.add(modelId);
      result.push(modelId);
    }
  }

  return result;
}
