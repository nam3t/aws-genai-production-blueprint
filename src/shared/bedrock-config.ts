import type { DocumentType } from '@smithy/types';

export interface InferenceParameterConfig {
  maxTokens: number;
  temperature: number;
  topP: number;
  topK?: number;
  stopSequences: string[];
}

export interface BedrockInferenceEnv {
  BEDROCK_MAX_TOKENS?: string;
  BEDROCK_TEMPERATURE?: string;
  BEDROCK_TOP_P?: string;
  BEDROCK_TOP_K?: string;
  BEDROCK_STOP_SEQUENCES?: string;
}

export interface ConverseInferenceConfigParts {
  inferenceConfig: {
    maxTokens: number;
    temperature: number;
    topP: number;
    stopSequences?: string[];
  };
  additionalModelRequestFields?: DocumentType;
}

export function defaultInferenceParameterConfig(
  env: BedrockInferenceEnv = process.env,
): InferenceParameterConfig {
  return {
    maxTokens: readNumber(env.BEDROCK_MAX_TOKENS, 'BEDROCK_MAX_TOKENS', 800, 1, 200_000),
    temperature: readNumber(env.BEDROCK_TEMPERATURE, 'BEDROCK_TEMPERATURE', 0.2, 0, 1),
    topP: readNumber(env.BEDROCK_TOP_P, 'BEDROCK_TOP_P', 0.9, 0, 1),
    topK: readOptionalNumber(env.BEDROCK_TOP_K, 'BEDROCK_TOP_K', 1, 500),
    stopSequences: parseStopSequences(env.BEDROCK_STOP_SEQUENCES),
  };
}

export function buildConverseInferenceConfig(
  config: InferenceParameterConfig,
): ConverseInferenceConfigParts {
  return {
    inferenceConfig: {
      maxTokens: config.maxTokens,
      temperature: config.temperature,
      topP: config.topP,
      ...(config.stopSequences.length > 0 ? { stopSequences: config.stopSequences } : {}),
    },
    additionalModelRequestFields: config.topK === undefined ? undefined : { top_k: config.topK },
  };
}

export function parseStopSequences(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((sequence) => sequence.trim())
    .filter(Boolean);
}

function readOptionalNumber(
  value: string | undefined,
  name: string,
  min: number,
  max: number,
): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined;
  }

  return readNumber(value, name, Number.NaN, min, max);
}

function readNumber(
  value: string | undefined,
  name: string,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (value === undefined || value.trim() === '') {
    return defaultValue;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number`);
  }

  if (parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}`);
  }

  return parsed;
}
