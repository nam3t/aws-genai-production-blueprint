import { describe, expect, it } from 'vitest';
import { categorizeChatError, parseChatRequest } from '../src/functions/chat/index.js';

describe('chat handler helpers', () => {
  it('parses valid chat requests', () => {
    expect(
      parseChatRequest(
        JSON.stringify({ message: 'hello', sessionId: 'session-1', complexity: 'complex' }),
      ),
    ).toEqual({ message: 'hello', sessionId: 'session-1', complexity: 'complex' });
  });

  it('rejects requests without a message', () => {
    expect(() => parseChatRequest(JSON.stringify({}))).toThrow(
      'Field "message" is required and must be a string',
    );
  });

  it('categorizes Bedrock throttling errors as retryable 429 responses', () => {
    const error = Object.assign(new Error('too many requests'), { name: 'ThrottlingException' });

    expect(categorizeChatError(error)).toEqual({
      category: 'throttling',
      statusCode: 429,
      retryable: true,
    });
  });

  it('categorizes access denied errors as non-retryable 403 responses', () => {
    const error = Object.assign(new Error('not allowed'), { name: 'AccessDeniedException' });

    expect(categorizeChatError(error)).toEqual({
      category: 'access_denied',
      statusCode: 403,
      retryable: false,
    });
  });

  it('categorizes unknown errors as 500 responses', () => {
    expect(categorizeChatError(new Error('boom'))).toEqual({
      category: 'unknown',
      statusCode: 500,
      retryable: false,
    });
  });
});
