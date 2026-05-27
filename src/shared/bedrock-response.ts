export interface ConverseTextLikeResponse {
  output?: {
    message?: {
      content?: unknown[];
    };
  };
}

export interface ConverseUsageLikeResponse {
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface TokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export function extractConverseText(response: ConverseTextLikeResponse): string {
  return (
    response.output?.message?.content
      ?.map((part) => (hasText(part) ? part.text : ''))
      .join('')
      .trim() ?? ''
  );
}

function hasText(part: unknown): part is { text: string } {
  if (typeof part !== 'object' || part === null || !('text' in part)) {
    return false;
  }

  return typeof (part as { text?: unknown }).text === 'string';
}

export function extractTokenUsage(response: ConverseUsageLikeResponse): TokenUsage {
  return {
    ...(typeof response.usage?.inputTokens === 'number'
      ? { inputTokens: response.usage.inputTokens }
      : {}),
    ...(typeof response.usage?.outputTokens === 'number'
      ? { outputTokens: response.usage.outputTokens }
      : {}),
    ...(typeof response.usage?.totalTokens === 'number'
      ? { totalTokens: response.usage.totalTokens }
      : {}),
  };
}
