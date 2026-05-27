export type RequestComplexity = 'simple' | 'standard' | 'complex';

export interface ChatRequest {
  message: string;
  sessionId?: string;
  complexity?: RequestComplexity;
}

export interface ChatResponse {
  answer: string;
  metadata: {
    requestId: string;
    modelId: string;
    latencyMs: number;
    promptVersion: string;
    modelSelectionReason: string;
    fallbackModelIds: string[];
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export type RetrievalSearchStrategy = 'semantic' | 'hybrid';
export type RagBackend = 'bedrock-knowledge-bases' | 'opensearch' | 'aurora-pgvector';
export type NoAnswerReason =
  | 'retrieval_backend_not_configured'
  | 'no_relevant_sources'
  | 'insufficient_source_support'
  | 'access_denied';

export interface AskFilters {
  documentIds?: string[];
  documentTypes?: string[];
  classifications?: string[];
  tags?: string[];
}

export interface AskRetrievalOptions {
  maxResults: number;
  searchStrategy: RetrievalSearchStrategy;
  rerank: boolean;
}

export interface AskRequest {
  question: string;
  sessionId?: string;
  tenantId?: string;
  userId?: string;
  complexity?: RequestComplexity;
  filters: AskFilters;
  retrieval: AskRetrievalOptions;
}

export interface AskCitation {
  documentId: string;
  sourceUri: string;
  chunkId: string;
  title?: string;
  excerpt: string;
  score?: number;
}

export interface AskResponse {
  answer: string;
  citations: AskCitation[];
  noAnswer?: {
    reason: NoAnswerReason;
    message: string;
  };
  retrieval: {
    backend: RagBackend;
    searchStrategy: RetrievalSearchStrategy;
    requestedTopK: number;
    returnedChunks: number;
    reranked: boolean;
    filtersApplied: AskFilters;
    retrievalLatencyMs: number;
    generationLatencyMs: number;
    totalLatencyMs: number;
  };
  metadata: {
    requestId: string;
    modelId: string;
    promptVersion: string;
    knowledgeBaseId?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
