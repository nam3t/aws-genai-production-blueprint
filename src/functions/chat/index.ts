import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { jsonResponse } from '../../shared/http.js';
import { defaultRouterConfig, selectModel } from '../../shared/model-router.js';
import type { ApiErrorResponse, ChatRequest, ChatResponse } from '../../shared/types.js';

const bedrock = new BedrockRuntimeClient({});
const defaultModelId = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20240620-v1:0';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const startedAt = Date.now();
  const requestId = event.requestContext.requestId ?? context.awsRequestId;

  try {
    const request = parseRequest(event.body);
    const modelId = selectModel(request.complexity, defaultRouterConfig(defaultModelId));

    const response = await bedrock.send(
      new ConverseCommand({
        modelId,
        messages: [
          {
            role: 'user',
            content: [{ text: request.message }],
          },
        ],
        inferenceConfig: {
          maxTokens: 800,
          temperature: 0.2,
          topP: 0.9,
        },
      }),
    );

    const answer =
      response.output?.message?.content
        ?.map((part) => ('text' in part ? part.text ?? '' : ''))
        .join('')
        .trim() || '';

    const result: ChatResponse = {
      answer,
      metadata: {
        requestId,
        modelId,
        latencyMs: Date.now() - startedAt,
        promptVersion: 'direct-chat/v0',
      },
    };

    console.info('chat.completed', {
      requestId,
      modelId,
      latencyMs: result.metadata.latencyMs,
      inputLength: request.message.length,
      outputLength: answer.length,
      rawPromptLogged: process.env.LOG_RAW_PROMPTS === 'true',
    });

    return jsonResponse(200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const body: ApiErrorResponse = {
      error: {
        code: 'CHAT_REQUEST_FAILED',
        message,
        requestId,
      },
    };

    console.error('chat.failed', {
      requestId,
      latencyMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: message,
    });

    return jsonResponse(400, body);
  }
};

function parseRequest(body: string | undefined): ChatRequest {
  if (!body) {
    throw new Error('Request body is required');
  }

  const parsed = JSON.parse(body) as Partial<ChatRequest>;

  if (!parsed.message || typeof parsed.message !== 'string') {
    throw new Error('Field "message" is required and must be a string');
  }

  if (parsed.message.length > 8_000) {
    throw new Error('Field "message" exceeds the 8000 character limit');
  }

  if (parsed.complexity && !['simple', 'standard', 'complex'].includes(parsed.complexity)) {
    throw new Error('Field "complexity" must be simple, standard, or complex');
  }

  return {
    message: parsed.message,
    sessionId: parsed.sessionId,
    complexity: parsed.complexity,
  };
}
