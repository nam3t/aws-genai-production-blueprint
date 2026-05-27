import { describe, expect, it } from 'vitest';
import { buildAskNotConfiguredResponse, parseAskRequest } from '../src/functions/ask/index.js';

describe('ask handler helpers', () => {
  it('parses valid ask requests with retrieval controls and metadata filters', () => {
    expect(
      parseAskRequest(
        JSON.stringify({
          question: 'Which RAG backend should phase 1 use?',
          sessionId: 'session-1',
          tenantId: 'tenant-demo',
          userId: 'user-demo',
          complexity: 'complex',
          filters: {
            documentIds: ['adr-rag-backend'],
            documentTypes: ['decision'],
            classifications: ['internal'],
            tags: ['rag', 'week-03'],
          },
          retrieval: {
            maxResults: 8,
            searchStrategy: 'hybrid',
            rerank: true,
          },
        }),
      ),
    ).toEqual({
      question: 'Which RAG backend should phase 1 use?',
      sessionId: 'session-1',
      tenantId: 'tenant-demo',
      userId: 'user-demo',
      complexity: 'complex',
      filters: {
        documentIds: ['adr-rag-backend'],
        documentTypes: ['decision'],
        classifications: ['internal'],
        tags: ['rag', 'week-03'],
      },
      retrieval: {
        maxResults: 8,
        searchStrategy: 'hybrid',
        rerank: true,
      },
    });
  });

  it('defaults retrieval options for a minimal ask request', () => {
    expect(parseAskRequest(JSON.stringify({ question: 'Explain chunk overlap.' }))).toEqual({
      question: 'Explain chunk overlap.',
      filters: {},
      retrieval: {
        maxResults: 5,
        searchStrategy: 'semantic',
        rerank: false,
      },
    });
  });

  it('rejects requests without a question', () => {
    expect(() => parseAskRequest(JSON.stringify({}))).toThrow(
      'Field "question" is required and must be a non-empty string',
    );
  });

  it('rejects questions over the 4000 character interface limit', () => {
    expect(() => parseAskRequest(JSON.stringify({ question: 'x'.repeat(4_001) }))).toThrow(
      'Field "question" exceeds the 4000 character limit',
    );
  });

  it('rejects invalid search strategies', () => {
    expect(() =>
      parseAskRequest(JSON.stringify({ question: 'hello', retrieval: { searchStrategy: 'keyword' } })),
    ).toThrow('Field "retrieval.searchStrategy" must be semantic or hybrid');
  });

  it('builds an explicit no-answer response while the retrieval backend is not configured', () => {
    const request = parseAskRequest(JSON.stringify({ question: 'What is the RAG decision?' }));

    expect(buildAskNotConfiguredResponse(request, 'request-1')).toEqual({
      answer: '',
      citations: [],
      noAnswer: {
        reason: 'retrieval_backend_not_configured',
        message: 'The /ask contract is deployed, but the Bedrock Knowledge Base is not configured yet.',
      },
      retrieval: {
        backend: 'bedrock-knowledge-bases',
        searchStrategy: 'semantic',
        requestedTopK: 5,
        returnedChunks: 0,
        reranked: false,
        filtersApplied: {},
        retrievalLatencyMs: 0,
        generationLatencyMs: 0,
        totalLatencyMs: 0,
      },
      metadata: {
        requestId: 'request-1',
        modelId: 'not-invoked',
        promptVersion: 'rag-answer/v1',
      },
    });
  });
});
