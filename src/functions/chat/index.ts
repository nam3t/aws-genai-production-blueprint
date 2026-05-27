import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { buildConverseInferenceConfig, defaultInferenceParameterConfig } from '../../shared/bedrock-config.js';
import { extractConverseText, extractTokenUsage } from '../../shared/bedrock-response.js';
import { jsonResponse } from '../../shared/http.js';
import { defaultRouterConfig, selectModelPlan } from '../../shared/model-router.js';
import type { ApiErrorResponse, ChatRequest, ChatResponse } from '../../shared/types.js';

const bedrock = new BedrockRuntimeClient({});
const defaultModelId = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20240620-v1:0';
const promptVersion = 'direct-chat/v1';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const startedAt = Date.now();
  const requestId = event.requestContext.requestId ?? context.awsRequestId;

  try {
    const request = parseChatRequest(event.body);
    const routerConfig = defaultRouterConfig(defaultModelId);
    const modelPlan = selectModelPlan(request.complexity, routerConfig);
    const inferenceConfig = defaultInferenceParameterConfig();
    const converseConfig = buildConverseInferenceConfig(inferenceConfig);

    // TODO(week-04): Implement bounded retry/fallback across modelPlan.candidateModelIds for
    // retryable Bedrock errors only. Fallback must log the original model, fallback model,
    // error category, latency, and cost impact, and must be disabled for flows with strict
    // compliance/model-approval requirements until evals prove behavior equivalence.
    const response = await bedrock.send(
      new ConverseCommand({
        modelId: modelPlan.primaryModelId,
        messages: [
          {
            role: 'user',
            content: [{ text: request.message }],
          },
        ],
        ...converseConfig,
        requestMetadata: {
          requestId,
          route: 'POST /chat',
          promptVersion,
          modelSelectionReason: modelPlan.selectionReason,
          ...(request.sessionId ? { sessionId: request.sessionId } : {}),
        },
      }),
    );

    const answer = extractConverseText(response);
    const tokenUsage = extractTokenUsage(response);
    const latencyMs = Date.now() - startedAt;

    const result: ChatResponse = {
      answer,
      metadata: {
        requestId,
        modelId: modelPlan.primaryModelId,
        latencyMs,
        promptVersion,
        modelSelectionReason: modelPlan.selectionReason,
        fallbackModelIds: modelPlan.fallbackModelIds,
        ...tokenUsage,
      },
    };

    console.info('chat.completed', {
      requestId,
      modelId: modelPlan.primaryModelId,
      modelSelectionReason: modelPlan.selectionReason,
      fallbackModelIds: modelPlan.fallbackModelIds,
      latencyMs,
      promptVersion,
      inputCharLength: request.message.length,
      outputCharLength: answer.length,
      inputTokens: tokenUsage.inputTokens ?? null,
      outputTokens: tokenUsage.outputTokens ?? null,
      totalTokens: tokenUsage.totalTokens ?? null,
      maxTokens: inferenceConfig.maxTokens,
      temperature: inferenceConfig.temperature,
      topP: inferenceConfig.topP,
      topK: inferenceConfig.topK ?? null,
      stopSequenceCount: inferenceConfig.stopSequences.length,
      rawPromptLoggingEnabled: process.env.LOG_RAW_PROMPTS === 'true',
    });

    return jsonResponse(200, result);
  } catch (error) {
    const categorized = categorizeChatError(error);
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
      errorCategory: categorized.category,
      retryable: categorized.retryable,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: message,
    });

    return jsonResponse(categorized.statusCode, body);
  }
};

export function parseChatRequest(body: string | undefined): ChatRequest {
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

export interface CategorizedChatError {
  category: 'validation' | 'throttling' | 'access_denied' | 'service_unavailable' | 'unknown';
  statusCode: number;
  retryable: boolean;
}

export function categorizeChatError(error: unknown): CategorizedChatError {
  const errorName = error instanceof Error ? error.name : 'UnknownError';

  if (errorName === 'SyntaxError' || errorName === 'ValidationException') {
    return { category: 'validation', statusCode: 400, retryable: false };
  }

  if (errorName === 'ThrottlingException' || errorName === 'TooManyRequestsException') {
    return { category: 'throttling', statusCode: 429, retryable: true };
  }

  if (errorName === 'AccessDeniedException' || errorName === 'UnauthorizedException') {
    return { category: 'access_denied', statusCode: 403, retryable: false };
  }

  if (errorName === 'ServiceUnavailableException' || errorName === 'InternalServerException') {
    return { category: 'service_unavailable', statusCode: 502, retryable: true };
  }

  return { category: 'unknown', statusCode: 500, retryable: false };
}
