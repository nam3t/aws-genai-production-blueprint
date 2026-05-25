import { describe, expect, it } from 'vitest';
import { defaultRouterConfig, selectModel } from '../src/shared/model-router.js';

describe('model router', () => {
  it('selects the standard model by default', () => {
    expect(
      selectModel(undefined, {
        simpleModelId: 'cheap-model',
        standardModelId: 'standard-model',
        complexModelId: 'strong-model',
      }),
    ).toBe('standard-model');
  });

  it('selects the simple model for simple requests', () => {
    expect(
      selectModel('simple', {
        simpleModelId: 'cheap-model',
        standardModelId: 'standard-model',
        complexModelId: 'strong-model',
      }),
    ).toBe('cheap-model');
  });

  it('falls back all router config values to the default model', () => {
    const config = defaultRouterConfig('default-model');

    expect(config.simpleModelId).toBe(process.env.BEDROCK_SIMPLE_MODEL_ID ?? 'default-model');
    expect(config.standardModelId).toBe(process.env.BEDROCK_MODEL_ID ?? 'default-model');
    expect(config.complexModelId).toBe(process.env.BEDROCK_COMPLEX_MODEL_ID ?? 'default-model');
  });
});
