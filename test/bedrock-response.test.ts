import { describe, expect, it } from 'vitest';
import { extractConverseText, extractTokenUsage } from '../src/shared/bedrock-response.js';

describe('bedrock response helpers', () => {
  it('extracts concatenated text blocks from a Converse response', () => {
    expect(
      extractConverseText({
        output: {
          message: {
            content: [{ text: 'Hello' }, { text: ' world' }, { toolUse: { name: 'ignored' } }],
          },
        },
      }),
    ).toBe('Hello world');
  });

  it('returns an empty string when no text blocks exist', () => {
    expect(extractConverseText({ output: { message: { content: [] } } })).toBe('');
  });

  it('extracts token usage fields when Bedrock returns usage metadata', () => {
    expect(
      extractTokenUsage({
        usage: {
          inputTokens: 10,
          outputTokens: 15,
          totalTokens: 25,
        },
      }),
    ).toEqual({
      inputTokens: 10,
      outputTokens: 15,
      totalTokens: 25,
    });
  });

  it('omits token fields that Bedrock did not return', () => {
    expect(extractTokenUsage({ usage: { inputTokens: 10 } })).toEqual({ inputTokens: 10 });
    expect(extractTokenUsage({})).toEqual({});
  });
});
