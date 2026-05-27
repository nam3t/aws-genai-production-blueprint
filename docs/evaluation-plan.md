# Evaluation Plan

Evaluation is a first-class part of the capstone because AIP-C01 expects production validation and troubleshooting skills, not only model invocation.

## Evaluation goals

1. Detect prompt regressions.
2. Detect retrieval quality problems.
3. Measure grounded answer quality.
4. Track latency and token-cost proxies.
5. Validate agent tool use.
6. Create deployment quality gates.

## Dataset format

Use JSONL files in `eval/`. For RAG cases, `expectedSources` is the key field that lets the eval runner check retrieval before judging answer wording.

Each line should follow this shape:

```json
{
  "id": "rag-001",
  "domain": "rag",
  "question": "What does the architecture use for managed RAG?",
  "expectedFacts": ["Bedrock Knowledge Bases", "OpenSearch is an alternative for custom vector search"],
  "expectedSources": ["docs/capstone-architecture.md"],
  "difficulty": "easy",
  "tags": ["knowledge-bases", "opensearch", "domain-1"]
}
```

## Metrics

### Direct chat

- Response validity
- Schema validity if structured output is requested
- Latency
- Error category
- Model ID distribution
- Prompt version distribution

### RAG

- Retrieval hit rate: expected source appears in retrieved top-k
- Expected source coverage
- Top-k relevance
- Retrieval latency
- Answer faithfulness
- Citation correctness
- No-answer correctness

### Agent

- Task completion rate
- Tool-call success rate
- Invalid tool-call rate
- Human approval rate
- Timeout/failure rate
- Final answer correctness

### Safety

- Blocked input count
- Blocked output count
- PII detection count
- Prompt injection detection count
- Unsafe output false negatives discovered by review

## Quality gates

Early project gates:

- Eval dataset parses successfully.
- Every RAG answer has citations or explicit no-answer state.
- Structured outputs pass JSON schema validation.
- No raw secrets or PII are written in test logs.

Later production-like gates:

- Retrieval hit rate above threshold.
- Faithfulness above threshold.
- p95 latency below threshold.
- Cache hit rate tracked for repeated queries.
- Canary workflow passes before promotion.

## Troubleshooting playbooks

### Hallucination

Check:

1. Was context retrieved?
2. Were citations required?
3. Was the prompt version changed?
4. Did the answer include facts not present in sources?
5. Did guardrails or output validators run?

Likely fixes:

- Improve retrieval query.
- Adjust chunking.
- Add no-answer behavior.
- Add citation validation.
- Add stronger prompt constraints.

### Bad retrieval

Check:

1. Are documents ingested?
2. Is the index fresh?
3. Are metadata filters too strict?
4. Is chunk size too large or too small?
5. Are embeddings generated with the expected model?
6. Is hybrid search/reranking needed?

### Context overflow

Check:

1. Token estimate before invocation.
2. Number and size of retrieved chunks.
3. Conversation history length.
4. Whether context pruning ran.

### Invalid structured output

Check:

1. Prompt schema instructions.
2. Model parameters.
3. JSON repair attempt result.
4. Whether the schema is too strict or ambiguous.

### Latency spike

Check:

1. Bedrock model latency.
2. Retrieval latency.
3. Lambda cold starts.
4. Throttling or quota errors.
5. External tool latency.
6. X-Ray traces and CloudWatch p95 metrics.
