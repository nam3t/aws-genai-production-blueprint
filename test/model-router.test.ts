import { describe, expect, it } from 'vitest';
import {
  defaultRouterConfig,
  parseFallbackModelIds,
  selectModel,
  selectModelPlan,
} from '../src/shared/model-router.js';

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

  it('selects the complex model for complex requests', () => {
    expect(
      selectModel('complex', {
        simpleModelId: 'cheap-model',
        standardModelId: 'standard-model',
        complexModelId: 'strong-model',
      }),
    ).toBe('strong-model');
  });

  it('falls back all router config values to the default model', () => {
    const config = defaultRouterConfig('default-model', {});

    expect(config.simpleModelId).toBe('default-model');
    expect(config.standardModelId).toBe('default-model');
    expect(config.complexModelId).toBe('default-model');
    expect(config.fallbackModelIds).toEqual([]);
  });

  it('reads model IDs and fallback candidates from environment-like config', () => {
    const config = defaultRouterConfig('default-model', {
      BEDROCK_SIMPLE_MODEL_ID: 'nova-lite',
      BEDROCK_MODEL_ID: 'claude-sonnet',
      BEDROCK_COMPLEX_MODEL_ID: 'claude-opus',
      BEDROCK_FALLBACK_MODEL_IDS: 'nova-pro, claude-sonnet, nova-lite ,,',
    });

    expect(config).toEqual({
      simpleModelId: 'nova-lite',
      standardModelId: 'claude-sonnet',
      complexModelId: 'claude-opus',
      fallbackModelIds: ['nova-pro', 'claude-sonnet', 'nova-lite'],
    });
  });

  it('parses fallback model IDs by trimming blanks and removing duplicates', () => {
    expect(parseFallbackModelIds(' model-a, model-b,model-a, , model-c ')).toEqual([
      'model-a',
      'model-b',
      'model-c',
    ]);
  });

  it('builds an ordered model plan with primary first and duplicate fallback candidates removed', () => {
    const plan = selectModelPlan('simple', {
      simpleModelId: 'nova-lite',
      standardModelId: 'claude-sonnet',
      complexModelId: 'claude-opus',
      fallbackModelIds: ['claude-sonnet', 'nova-lite', 'nova-pro'],
    });

    expect(plan).toEqual({
      complexity: 'simple',
      primaryModelId: 'nova-lite',
      fallbackModelIds: ['claude-sonnet', 'nova-pro'],
      candidateModelIds: ['nova-lite', 'claude-sonnet', 'nova-pro'],
      selectionReason: 'complexity:simple',
    });
  });

  it('labels an omitted complexity as standard default in the model plan', () => {
    const plan = selectModelPlan(undefined, {
      simpleModelId: 'nova-lite',
      standardModelId: 'claude-sonnet',
      complexModelId: 'claude-opus',
      fallbackModelIds: [],
    });

    expect(plan.selectionReason).toBe('complexity:standard-default');
    expect(plan.primaryModelId).toBe('claude-sonnet');
  });
});
