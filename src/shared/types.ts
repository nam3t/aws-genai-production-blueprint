export interface ChatRequest {
  message: string;
  sessionId?: string;
  complexity?: 'simple' | 'standard' | 'complex';
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

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
