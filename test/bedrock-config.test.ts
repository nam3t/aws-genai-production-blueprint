import { describe, expect, it } from 'vitest';
import {
  buildConverseInferenceConfig,
  defaultInferenceParameterConfig,
  parseStopSequences,
} from '../src/shared/bedrock-config.js';

describe('bedrock inference config', () => {
  it('uses safe deterministic defaults for direct chat', () => {
    expect(defaultInferenceParameterConfig({})).toEqual({
      maxTokens: 800,
      temperature: 0.2,
      topP: 0.9,
      topK: undefined,
      stopSequences: [],
    });
  });

  it('reads inference parameters from environment-like config', () => {
    expect(
      defaultInferenceParameterConfig({
        BEDROCK_MAX_TOKENS: '1200',
        BEDROCK_TEMPERATURE: '0.35',
        BEDROCK_TOP_P: '0.75',
        BEDROCK_TOP_K: '50',
        BEDROCK_STOP_SEQUENCES: '</answer>, END',
      }),
    ).toEqual({
      maxTokens: 1200,
      temperature: 0.35,
      topP: 0.75,
      topK: 50,
      stopSequences: ['</answer>', 'END'],
    });
  });

  it('rejects invalid numeric inference parameters early', () => {
    expect(() => defaultInferenceParameterConfig({ BEDROCK_TEMPERATURE: 'creative' })).toThrow(
      'BEDROCK_TEMPERATURE must be a number',
    );
    expect(() => defaultInferenceParameterConfig({ BEDROCK_MAX_TOKENS: '0' })).toThrow(
      'BEDROCK_MAX_TOKENS must be between 1 and 200000',
    );
  });

  it('parses stop sequences by trimming blanks', () => {
    expect(parseStopSequences(' </json>,, END ,')).toEqual(['</json>', 'END']);
  });

  it('builds Converse API config and passes topK as a model-specific field', () => {
    expect(
      buildConverseInferenceConfig({
        maxTokens: 500,
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        stopSequences: ['</answer>'],
      }),
    ).toEqual({
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.1,
        topP: 0.8,
        stopSequences: ['</answer>'],
      },
      additionalModelRequestFields: {
        top_k: 40,
      },
    });
  });

  it('omits optional Converse fields when no stop sequences or topK are configured', () => {
    expect(
      buildConverseInferenceConfig({
        maxTokens: 500,
        temperature: 0.1,
        topP: 0.8,
        topK: undefined,
        stopSequences: [],
      }),
    ).toEqual({
      inferenceConfig: {
        maxTokens: 500,
        temperature: 0.1,
        topP: 0.8,
      },
      additionalModelRequestFields: undefined,
    });
  });
});
