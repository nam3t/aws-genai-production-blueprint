export type QueryComplexity = 'simple' | 'standard' | 'complex';

export interface ModelRouterConfig {
  simpleModelId: string;
  standardModelId: string;
  complexModelId: string;
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

export function defaultRouterConfig(defaultModelId: string): ModelRouterConfig {
  return {
    simpleModelId: process.env.BEDROCK_SIMPLE_MODEL_ID ?? defaultModelId,
    standardModelId: process.env.BEDROCK_MODEL_ID ?? defaultModelId,
    complexModelId: process.env.BEDROCK_COMPLEX_MODEL_ID ?? defaultModelId,
  };
}
