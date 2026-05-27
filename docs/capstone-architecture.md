# Capstone Architecture

The capstone is a production-style GenAI assistant API. It is intentionally broad enough to cover the AIP-C01 exam domains, but scoped so it can be built incrementally.

## Target capabilities

1. Direct FM chat with Amazon Bedrock
2. RAG answers with citations
3. Prompt versioning and structured output validation
4. Agentic workflow with safe tool use
5. Guardrails, PII controls, and document-level authorization
6. Token, latency, and retrieval observability
7. Evaluation pipeline for regression testing
8. CDK deployment with clear security boundaries

## Logical architecture

```text
Client
  |
  v
API Gateway
  |
  +-- GET /health ------------> Health Lambda
  |
  +-- POST /chat -------------> Chat Lambda
  |                               |
  |                               +--> Model Router
  |                               +--> Prompt Registry
  |                               +--> Amazon Bedrock Runtime
  |
  +-- POST /ask --------------> RAG Lambda / Workflow
  |                               |
  |                               +--> Retriever
  |                               +--> Bedrock Knowledge Bases or OpenSearch
  |                               +--> Amazon Bedrock Runtime
  |                               +--> Citation Validator
  |
  +-- POST /agent ------------> Step Functions
                                  |
                                  +--> Planner / FM step
                                  +--> Tool Lambda(s)
                                  +--> Human approval branch
                                  +--> Final response step
```

## AWS services by layer

### Edge and API

- API Gateway for HTTP endpoints
- Cognito later if user authentication is needed
- AWS WAF later if public exposure requires request filtering

### Compute

- Lambda for stateless API handlers and tools
- Step Functions for long-running or auditable multi-step workflows
- ECS/Fargate later for long-running MCP/tool servers

### Model layer

- Amazon Bedrock Runtime for FM invocation
- Bedrock Guardrails for input/output safety
- Bedrock Prompt Management and Prompt Flows for managed prompt workflows
- SageMaker AI only when custom model hosting/lifecycle is required

### Retrieval/data layer

- S3 for document source of truth
- Bedrock Knowledge Bases for phase-1 managed RAG
- OpenSearch for custom vector/hybrid search if evaluation proves the managed path is insufficient
- DynamoDB for sessions, document metadata, ingestion status, and request records
- Aurora pgvector only if relational + vector search becomes a requirement

### Security/governance

- IAM least privilege for all Lambdas and tools
- KMS encryption for storage resources
- CloudTrail for API audit events
- CloudWatch Logs/Metrics for app observability
- Comprehend for PII detection in text
- Macie for sensitive data discovery in S3
- Lake Formation later if the data lake requires fine-grained governance

### Delivery

- CDK for infrastructure as code
- GitHub Actions / CodePipeline later for CI/CD
- Canary tests for post-deployment validation

## Data flow: direct chat

1. Client calls `POST /chat` with a message.
2. API Gateway invokes Chat Lambda.
3. Lambda validates input and chooses a model using model router config.
4. Lambda builds a prompt request and calls Bedrock Runtime.
5. Lambda logs metadata: request ID, model ID, latency, error category.
6. Lambda returns response text and metadata.

Exam domains:

- Domain 1: FM integration and model selection
- Domain 2: API integration
- Domain 4: latency/cost metadata
- Domain 5: integration troubleshooting

## Data flow: RAG answer

1. Client calls `POST /ask` with a question and optional filters.
2. Handler validates the request shape and resolves user identity/access scope.
3. Retriever queries Bedrock Knowledge Bases in phase 1 using metadata filters.
4. Handler maps retrieved chunks into citation candidates.
5. Bedrock Runtime generates a grounded answer from labeled source chunks.
6. Citation validator checks source coverage.
7. Response includes answer, citations, retrieval metadata, and confidence/no-answer signals.

Exam domains:

- Domain 1: vector stores, retrieval, FM augmentation
- Domain 3: document-level authorization and privacy
- Domain 5: retrieval quality testing and troubleshooting

## Data flow: agent workflow

1. Client requests a task that may require tool use.
2. Step Functions starts an execution.
3. Planner step determines required tool calls.
4. Tool Lambda validates parameters and enforces IAM boundaries.
5. High-risk actions route to human approval.
6. Final FM step summarizes result.
7. Metrics capture completion rate and tool success.

Exam domains:

- Domain 2: agentic systems and tool integration
- Domain 3: safe tool use and governance
- Domain 5: agent performance evaluation

## Reliability patterns

- Timeouts on every Lambda/tool call
- Retries with bounded backoff for transient failures
- Circuit breaker around model/provider failures
- Model fallback for non-critical workloads
- Dead-letter queues for async jobs
- Canary checks after deployment

## Cost/performance patterns

- Model router chooses cheaper models for simple tasks
- Context pruning before FM invocation
- Exact cache for deterministic repeated queries
- Semantic cache for similar repeated queries
- Streaming responses for perceived latency
- Retrieval query optimization and top-k tuning

## Security invariants

- Never log raw sensitive prompts by default.
- Every tool has least-privilege IAM permissions.
- RAG retrieval must filter by user/team/document authorization metadata.
- S3 buckets must block public access.
- Stored data must be encrypted.
- Safety controls must exist both before and after model invocation.

## Current RAG backend decision

Phase 1 uses Bedrock Knowledge Bases with S3 as the document source of truth. Direct OpenSearch is reserved for a later phase if retrieval evaluation proves a need for custom hybrid search, analyzers, scoring, dashboards, or higher-control index operations. See `docs/decisions/adr-001-rag-backend-phase-1.md`.

## Architecture decision record candidates

Create ADRs later for:

1. Lambda vs ECS/Fargate for tool servers
2. Bedrock Agents vs custom Step Functions agent workflow
3. Exact cache vs semantic cache
4. How to store prompts and prompt versions
5. Whether to store prompt/response content or only metadata
