# RAG Document Ingestion Plan

This plan defines how source documents enter the `/ask` retrieval system.

Phase-1 backend decision: Bedrock Knowledge Bases with S3 as the document source of truth. See `docs/decisions/adr-001-rag-backend-phase-1.md`.

## Goals

1. Keep original documents durable and versioned.
2. Attach metadata needed for retrieval, citations, authorization, and evaluation.
3. Use repeatable chunking/embedding settings.
4. Sync changed documents into the Knowledge Base without treating the vector store as the source of truth.
5. Track ingestion state outside the vector index.

## Source document lake

The CDK stack already provisions an encrypted, private, versioned S3 document bucket.

Recommended logical layout:

```text
raw/<tenantId>/<documentId>/<version>/source.ext
canonical/<tenantId>/<documentId>/<version>/source.md
metadata/<tenantId>/<documentId>/<version>/source.md.metadata.json
eval/<datasetName>/expected-sources.json
```

### Prefix responsibilities

| Prefix | Purpose |
|---|---|
| `raw/` | original uploaded object: PDF, DOCX, HTML, Markdown, text, CSV, etc. |
| `canonical/` | normalized text/Markdown used for retrieval and deterministic evaluation |
| `metadata/` | metadata sidecars for Bedrock Knowledge Bases and app authorization |
| `eval/` | optional source manifests for retrieval test datasets |

Why canonical Markdown:

- easier deterministic chunking;
- cleaner headings and tables;
- easier source excerpts in citations;
- lower parsing variance across ingestion runs.

## Metadata sidecar pattern

For Bedrock Knowledge Bases, metadata files should use the same base file name plus `.metadata.json`.

Example:

```text
canonical/acme/doc-001/v1/source.md
metadata/acme/doc-001/v1/source.md.metadata.json
```

Example metadata:

```json
{
  "metadataAttributes": {
    "tenantId": "acme",
    "documentId": "doc-001",
    "version": "v1",
    "sourceUri": "s3://bucket/canonical/acme/doc-001/v1/source.md",
    "title": "RAG Backend Decision",
    "documentType": "decision",
    "classification": "internal",
    "allowedGroups": ["architects", "platform"],
    "tags": ["rag", "week-03", "bedrock-knowledge-bases"],
    "createdAt": "2026-05-27T00:00:00Z",
    "parserVersion": "manual-md/v1",
    "chunkingPolicy": "fixed-800-overlap-120/v1",
    "embeddingProfile": "bedrock-kb-default/v1"
  }
}
```

Minimum metadata for this capstone:

| Field | Required | Why |
|---|---:|---|
| `tenantId` | yes | authorization and partitioning |
| `documentId` | yes | citation and lifecycle tracking |
| `version` | yes | freshness and reproducibility |
| `sourceUri` | yes | citation/source traceability |
| `title` | yes | user-visible citation label |
| `documentType` | yes | retrieval filtering and eval grouping |
| `classification` | yes | security controls |
| `allowedGroups` | yes | document-level authorization |
| `tags` | no | topical filtering |
| `parserVersion` | yes | troubleshooting parse/chunk differences |
| `chunkingPolicy` | yes | eval reproducibility |
| `embeddingProfile` | yes | embedding compatibility checks |

Security note: request-supplied filters are not authorization. Production retrieval must combine user identity claims with stored `tenantId`, `classification`, and `allowedGroups` metadata.

## Chunking policy

Phase-1 fixed-size baseline:

```text
policy id: fixed-800-overlap-120/v1
chunk size: about 800 tokens
chunk overlap: about 120 tokens
max retrieved chunks: 5 default, 20 request limit
```

Rationale:

- 800 tokens is large enough for short sections and runbook steps.
- 120-token overlap reduces answer loss at section boundaries.
- The policy is easy to reason about for early evaluation.

When to change it:

| Eval symptom | Change |
|---|---|
| expected source is not retrieved | increase chunk size/overlap or improve headings |
| retrieved chunks are too broad | reduce chunk size or use semantic chunks |
| duplicate citations dominate | reduce overlap or dedupe adjacent chunks |
| tables/code are broken | preprocess to canonical Markdown with table/code preservation |
| answers need parent section context | consider hierarchical chunking |

## Embedding policy

Phase 1 uses an AWS-native embedding model supported by Bedrock Knowledge Bases.

Policy:

- define the embedding model in infrastructure/config;
- store the effective embedding profile in metadata;
- avoid mixing embeddings from incompatible models in the same index;
- re-run evals after changing embedding model or dimensions.

Quality signals:

- expected source hit rate;
- top-k relevance rank;
- citation correctness;
- no-answer correctness;
- retrieval latency.

## Ingestion flow

```text
1. Author or upload source document.
2. Normalize to canonical Markdown when possible.
3. Write metadata sidecar.
4. Upload canonical document and sidecar to S3.
5. Register or update document metadata in DynamoDB.
6. Start Bedrock Knowledge Base sync/ingestion job.
7. Poll/log ingestion status.
8. Run retrieval evals against expected source documents.
9. Promote document version only if eval gate passes.
```

Bedrock Knowledge Bases sync jobs are incremental: changed, added, and deleted files are processed relative to the last sync. Metadata-only updates may avoid full re-embedding when supported by the vector store and configuration.

## DynamoDB metadata table design

DynamoDB tracks operational metadata that should not live only in a vector index.

### Entity examples

Document latest pointer:

```json
{
  "PK": "TENANT#acme",
  "SK": "DOC#doc-001#LATEST",
  "documentId": "doc-001",
  "latestVersion": "v3",
  "classification": "internal",
  "allowedGroups": ["architects", "platform"],
  "status": "INGESTED",
  "updatedAt": "2026-05-27T00:00:00Z"
}
```

Document version:

```json
{
  "PK": "DOC#doc-001",
  "SK": "VERSION#v3",
  "tenantId": "acme",
  "sourceUri": "s3://bucket/canonical/acme/doc-001/v3/source.md",
  "metadataUri": "s3://bucket/metadata/acme/doc-001/v3/source.md.metadata.json",
  "sourceEtag": "etag-value",
  "parserVersion": "manual-md/v1",
  "chunkingPolicy": "fixed-800-overlap-120/v1",
  "embeddingProfile": "bedrock-kb-default/v1",
  "ingestionJobId": "kb-sync-job-id",
  "status": "INGESTED"
}
```

Ingestion job:

```json
{
  "PK": "DOC#doc-001",
  "SK": "INGESTION#2026-05-27T00:00:00Z",
  "knowledgeBaseId": "KB12345678",
  "dataSourceId": "DS12345678",
  "status": "SUCCEEDED",
  "startedAt": "2026-05-27T00:00:00Z",
  "completedAt": "2026-05-27T00:03:00Z",
  "changedObjectCount": 1,
  "errorMessage": null
}
```

### Access patterns

| Need | Key/index |
|---|---|
| fetch latest document metadata by tenant/document | `PK=TENANT#<tenantId>`, `SK=DOC#<documentId>#LATEST` |
| fetch exact document version | `PK=DOC#<documentId>`, `SK=VERSION#<version>` |
| list failed/pending ingestions | `GSI1PK=STATUS#<status>`, `GSI1SK=updatedAt#<timestamp>` |
| list docs by classification | `GSI2PK=CLASS#<classification>`, `GSI2SK=tenantId#documentId` |
| get ingestion history | `PK=DOC#<documentId>`, `SK begins_with INGESTION#` |

## Evaluation gate

Every eval question should include expected source documents.

Minimum gate before trusting `/ask`:

- dataset parses successfully;
- expected source appears in retrieved top-k for at least the target threshold;
- answer cites at least one expected source;
- unsupported questions return no-answer;
- retrieval latency is captured;
- no raw sensitive source text is logged by default.

Current dataset: `eval/questions.example.jsonl`.

## Failure playbook

| Failure | First checks | Likely fix |
|---|---|---|
| source not retrieved | S3 sync status, KB data source status, metadata filters | re-sync, loosen filters, fix metadata |
| wrong source retrieved | chunk text quality, embedding model, tags/classification | improve canonical text, re-embed, add metadata |
| answer has no citation | prompt version, citation validator, response mapping | strengthen prompt and schema |
| citation source is stale | document version, DynamoDB latest pointer, KB sync job | re-ingest latest version |
| access leak | allowedGroups/classification filters, auth context mapping | enforce server-side filters before generation |
| latency spike | top-k, rerank, KB/OpenSearch latency, model latency | reduce chunks, tune search, cache safe queries |

## Phase-2 candidates

Move beyond the phase-1 managed path only if evaluation data shows a need:

- Direct OpenSearch for custom hybrid queries, analyzers, scoring, or dashboards.
- Aurora pgvector for relational + vector workloads and SQL joins.
- Step Functions ingestion workflow for custom parsing, OCR, PII redaction, and approval gates.
- Macie/Comprehend preprocessing before ingestion for sensitive corpora.
