import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { jsonResponse } from '../../shared/http.js';
import type { ApiErrorResponse, AskFilters, AskRequest, AskResponse } from '../../shared/types.js';

const askPromptVersion = 'rag-answer/v1';
const ragBackend = 'bedrock-knowledge-bases' as const;

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  const startedAt = Date.now();
  const requestId = event.requestContext.requestId ?? context.awsRequestId;

  try {
    const request = parseAskRequest(event.body);
    const response = buildAskNotConfiguredResponse(request, requestId);

    console.info('ask.backend_not_configured', {
      requestId,
      backend: ragBackend,
      searchStrategy: request.retrieval.searchStrategy,
      requestedTopK: request.retrieval.maxResults,
      rerank: request.retrieval.rerank,
      filterKeys: Object.keys(request.filters),
      latencyMs: Date.now() - startedAt,
      promptVersion: askPromptVersion,
      rawPromptLoggingEnabled: process.env.LOG_RAW_PROMPTS === 'true',
    });

    return jsonResponse(501, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const body: ApiErrorResponse = {
      error: {
        code: 'ASK_REQUEST_FAILED',
        message,
        requestId,
      },
    };

    console.error('ask.failed', {
      requestId,
      latencyMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: message,
    });

    return jsonResponse(400, body);
  }
};

export function parseAskRequest(body: string | undefined): AskRequest {
  if (!body) {
    throw new Error('Request body is required');
  }

  const parsed = JSON.parse(body) as Record<string, unknown>;
  const question = parsed.question;

  if (typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Field "question" is required and must be a non-empty string');
  }

  const normalizedQuestion = question.trim();

  if (normalizedQuestion.length > 4_000) {
    throw new Error('Field "question" exceeds the 4000 character limit');
  }

  const complexity = parseComplexity(parsed.complexity);
  const filters = parseAskFilters(parsed.filters);
  const retrieval = parseRetrievalOptions(parsed.retrieval);

  return {
    question: normalizedQuestion,
    ...(typeof parsed.sessionId === 'string' && parsed.sessionId.trim()
      ? { sessionId: parsed.sessionId.trim() }
      : {}),
    ...(typeof parsed.tenantId === 'string' && parsed.tenantId.trim()
      ? { tenantId: parsed.tenantId.trim() }
      : {}),
    ...(typeof parsed.userId === 'string' && parsed.userId.trim() ? { userId: parsed.userId.trim() } : {}),
    ...(complexity ? { complexity } : {}),
    filters,
    retrieval,
  };
}

export function buildAskNotConfiguredResponse(request: AskRequest, requestId: string): AskResponse {
  return {
    answer: '',
    citations: [],
    noAnswer: {
      reason: 'retrieval_backend_not_configured',
      message: 'The /ask contract is deployed, but the Bedrock Knowledge Base is not configured yet.',
    },
    retrieval: {
      backend: ragBackend,
      searchStrategy: request.retrieval.searchStrategy,
      requestedTopK: request.retrieval.maxResults,
      returnedChunks: 0,
      reranked: request.retrieval.rerank,
      filtersApplied: request.filters,
      retrievalLatencyMs: 0,
      generationLatencyMs: 0,
      totalLatencyMs: 0,
    },
    metadata: {
      requestId,
      modelId: 'not-invoked',
      promptVersion: askPromptVersion,
    },
  };
}

function parseComplexity(value: unknown): AskRequest['complexity'] | undefined {
  if (value === undefined) return undefined;

  if (value === 'simple' || value === 'standard' || value === 'complex') {
    return value;
  }

  throw new Error('Field "complexity" must be simple, standard, or complex');
}

function parseAskFilters(value: unknown): AskFilters {
  if (value === undefined) return {};
  if (!isObject(value)) throw new Error('Field "filters" must be an object');

  return {
    ...parseStringArrayFilter(value, 'documentIds'),
    ...parseStringArrayFilter(value, 'documentTypes'),
    ...parseStringArrayFilter(value, 'classifications'),
    ...parseStringArrayFilter(value, 'tags'),
  };
}

function parseRetrievalOptions(value: unknown): AskRequest['retrieval'] {
  if (value === undefined) {
    return { maxResults: 5, searchStrategy: 'semantic', rerank: false };
  }

  if (!isObject(value)) throw new Error('Field "retrieval" must be an object');

  const maxResults = value.maxResults === undefined ? 5 : value.maxResults;
  if (!Number.isInteger(maxResults) || Number(maxResults) < 1 || Number(maxResults) > 20) {
    throw new Error('Field "retrieval.maxResults" must be an integer from 1 to 20');
  }

  const searchStrategy = value.searchStrategy === undefined ? 'semantic' : value.searchStrategy;
  if (searchStrategy !== 'semantic' && searchStrategy !== 'hybrid') {
    throw new Error('Field "retrieval.searchStrategy" must be semantic or hybrid');
  }

  const rerank = value.rerank === undefined ? false : value.rerank;
  if (typeof rerank !== 'boolean') {
    throw new Error('Field "retrieval.rerank" must be a boolean');
  }

  return {
    maxResults: Number(maxResults),
    searchStrategy,
    rerank,
  };
}

function parseStringArrayFilter(value: Record<string, unknown>, key: keyof AskFilters): Partial<AskFilters> {
  const raw = value[key];
  if (raw === undefined) return {};
  if (!Array.isArray(raw)) throw new Error(`Field "filters.${key}" must be an array of strings`);
  if (raw.length > 20) throw new Error(`Field "filters.${key}" must contain at most 20 values`);

  const normalized = raw.map((item) => {
    if (typeof item !== 'string' || item.trim().length === 0) {
      throw new Error(`Field "filters.${key}" must be an array of non-empty strings`);
    }
    return item.trim();
  });

  return { [key]: normalized };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
