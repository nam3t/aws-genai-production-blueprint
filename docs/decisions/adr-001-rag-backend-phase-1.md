# ADR 001: Phase-1 RAG Backend

Status: Accepted

Date: 2026-05-27

## Context

Week 3 adds the `/ask` RAG interface to the AIP-C01 capstone. The project needs a phase-1 retrieval backend choice that teaches AWS-native RAG patterns without prematurely optimizing search infrastructure.

Options considered:

1. Amazon Bedrock Knowledge Bases.
2. Direct OpenSearch vector search.
3. Aurora PostgreSQL with pgvector.

Important AWS facts used for this decision:

- Bedrock Knowledge Bases supports managed RAG over connected data sources and can return relevant sources, generate grounded responses, include citations, sync changed data sources, use reranking models, and integrate into Bedrock Agents.
- Bedrock Knowledge Base ingestion converts source data into chunks, embeddings, and vector-store records; S3 data source changes require sync/re-ingestion.
- Knowledge Base retrieval configuration supports metadata filters, result count, and reranking. `HYBRID` search is available when the Knowledge Base uses OpenSearch Serverless with a filterable text field; otherwise semantic search is the portable baseline.
- OpenSearch is the AWS search/vector option for high-throughput, low-latency, custom hybrid/vector search and analytics control.
- Aurora PostgreSQL with pgvector is strong when relational SQL, transactions, joins, and vectors belong in the same workload.

## Decision

Phase 1 will use Amazon Bedrock Knowledge Bases with S3 as the document source of truth.

The `/ask` interface will expose retrieval controls that are useful across backends:

```json
{
  "retrieval": {
    "maxResults": 5,
    "searchStrategy": "semantic",
    "rerank": false
  }
}
```

The first deployed implementation should call Knowledge Base retrieval, inspect returned chunks, then use Bedrock Runtime to generate a citation-aware answer. This keeps application-level control over citation validation and no-answer behavior instead of fully hiding retrieval inside a one-call generation path.

## Rationale

### Why Bedrock Knowledge Bases first

- Best learning value for AIP-C01 managed RAG scenarios.
- Lower operational overhead than operating direct OpenSearch indexes in the first capstone phase.
- Native S3 data source and sync workflow match the planned document lake.
- Citations, metadata filters, retrieval configuration, and reranking map directly to exam and production concepts.
- Keeps the team focused on source quality, authorization metadata, evaluation, and troubleshooting instead of index operations.

### Why not direct OpenSearch in phase 1

OpenSearch is powerful, but it adds early responsibility for index schema, field mappings, hybrid query tuning, capacity, security policies, and search relevance diagnostics. Those are valuable phase-2 skills, but they would distract from the core Week 3 RAG baseline.

Use OpenSearch later if eval data proves one or more of these needs:

- semantic-only retrieval misses exact identifiers, codes, or AWS service names;
- custom analyzers, field boosts, filters, or scoring rules are required;
- query throughput/latency requirements exceed the managed KB path;
- search dashboards and deeper relevance diagnostics become necessary;
- the team needs full control of vector index lifecycle and hybrid search behavior.

### Why not Aurora pgvector in phase 1

Aurora pgvector is best when vectors are tightly coupled to relational data and SQL access patterns. The capstone corpus is document-centric and S3-native. Adding Aurora now would add database/network/secrets work without a strong relational requirement.

Use Aurora pgvector later if:

- document metadata must join with relational business entities;
- transactionality around vector records is required;
- SQL filtering is central to retrieval;
- the application already depends on Aurora PostgreSQL.

## Consequences

Positive:

- Faster path to a working managed RAG implementation.
- Stronger alignment with AWS GenAI certification scenarios.
- Clear separation between source-of-truth S3 documents and derived vector index.
- Easier setup for ingestion, citations, metadata filters, and future Bedrock Agent integration.

Negative / trade-offs:

- Less direct control over search internals than OpenSearch.
- Hybrid search support depends on vector-store configuration.
- Deep relevance tuning may require moving to direct OpenSearch later.
- We still need separate metadata governance and evaluation; managed RAG is not automatic quality.

## Implementation notes

Phase 1.1, completed/scaffolded:

- `/ask` request/response contract.
- API Gateway route and Lambda scaffold.
- explicit backend-not-configured no-answer response.
- document ingestion plan.
- evaluation questions with expected source documents.

Phase 1.2, next:

- Add CDK resources for Bedrock Knowledge Base and data source, or document a manual setup if CDK L2 coverage is insufficient.
- Configure S3 data source and embedding model.
- Store `BEDROCK_KNOWLEDGE_BASE_ID` in Lambda environment/config.
- Add Bedrock Agent Runtime client for `Retrieve`.
- Map Knowledge Base retrieval results into the `AskCitation` shape.

Phase 1.3:

- Build grounded prompt with retrieved chunks.
- Invoke Bedrock Runtime through model router.
- Validate citations and source support.
- Add no-answer behavior for weak retrieval.

## Exit criteria for revisiting this ADR

Revisit the decision if any of these become true:

- Retrieval eval source hit rate stays below the agreed threshold after chunking/metadata fixes.
- Exact-term queries repeatedly fail and require custom lexical/hybrid tuning.
- Reranking or hybrid search requirements exceed Knowledge Base support for the selected vector store.
- Query latency/cost becomes unacceptable under target load.
- A relational product feature requires SQL joins with vector results.
- Multi-tenant authorization filters cannot be expressed safely in the managed KB retrieval layer.

## Source documents

- `docs/weeks/week-03-rag-vector-stores.md`
- `docs/rag-ingestion-plan.md`
- `docs/ask-api-design.md`
- AWS Bedrock Knowledge Bases documentation
- AWS Bedrock Knowledge Base ingestion/sync documentation
- AWS Bedrock Knowledge Base vector search API documentation
- AWS Prescriptive Guidance: choosing an AWS vector database for RAG use cases
- Amazon Aurora PostgreSQL pgvector / Bedrock Knowledge Base documentation
