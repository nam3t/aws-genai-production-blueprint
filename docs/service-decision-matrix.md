# Service Decision Matrix

Use this as a fast exam and architecture reference.

## Foundation model access

| Requirement | Prefer | Why |
|---|---|---|
| Managed FM access with low ops | Amazon Bedrock | No model infrastructure to operate |
| Direct text/chat generation | Bedrock Runtime Converse API | Standard message-oriented interface |
| Streaming response | Bedrock Runtime streaming / API streaming path | Improves perceived latency |
| Stable high-throughput workload | Bedrock Provisioned Throughput | Predictable capacity and latency |
| Custom model hosting | SageMaker AI endpoint | More control over model artifacts and hosting |
| Model lifecycle/version registry | SageMaker Model Registry | Tracks custom model versions and approvals |
| Bias/explainability monitoring | SageMaker Clarify | Responsible AI evaluation for ML workflows |

## RAG and retrieval

| Requirement | Prefer | Why |
|---|---|---|
| Phase-1 capstone RAG | Bedrock Knowledge Bases | Managed ingestion/retrieval/citations with low ops |
| Managed RAG with lower ops | Bedrock Knowledge Bases | Handles ingestion/retrieval integration |
| Custom vector/hybrid search | OpenSearch Service / Serverless | Index tuning, hybrid queries, custom scoring |
| Relational metadata + vectors | Aurora PostgreSQL + pgvector | SQL + vector retrieval in one place |
| Document source of truth | S3 | Durable object store and integration point |
| Document/ingestion metadata registry | DynamoDB | Serverless metadata lookups, status tracking, auth-filter inputs |
| Enterprise search connectors | Amazon Kendra or Amazon Q Business | Enterprise document search patterns |

## Orchestration and integration

| Requirement | Prefer | Why |
|---|---|---|
| Stateless short API handler | Lambda | Low operational overhead |
| Multi-step workflow | Step Functions | Branching, retries, auditability |
| Human approval | Step Functions | Native task-token/manual approval patterns |
| Async decoupling | SQS/EventBridge | Buffering, retries, event routing |
| Long-running tool server | ECS/Fargate | Container runtime and long-lived process support |
| External HTTPS API | API Gateway | Managed API front door |
| GraphQL/mobile app API | AppSync | Managed GraphQL/subscription patterns |

## Security and governance

| Requirement | Prefer | Why |
|---|---|---|
| Service/resource permissions | IAM | Least-privilege access control |
| User authentication | Cognito / IAM Identity Center | Managed identity depending on audience |
| Encryption key management | KMS | Central key policies and auditability |
| S3 sensitive data discovery | Macie | Finds sensitive data in object storage |
| Text PII detection | Comprehend | Detects PII/entities in text content |
| FM input/output filtering | Bedrock Guardrails | GenAI-specific safety controls |
| API activity audit | CloudTrail | Records AWS API calls |
| Logs/metrics/alarms | CloudWatch | Operational observability |
| Distributed tracing | X-Ray | Request path and latency analysis |
| Fine-grained data lake access | Lake Formation | Governed data access controls |

## Cost/performance optimization

| Problem | Pattern | AWS services/features |
|---|---|---|
| Repeated identical questions | Exact cache | DynamoDB/ElastiCache + deterministic hash |
| Similar repeated questions | Semantic cache | Embeddings + vector store |
| Large prompt cost | Context pruning/prompt compression | App logic + Bedrock |
| Slow response | Streaming | Bedrock streaming + API integration |
| Wrong model for simple task | Model router | AppConfig/env config + Bedrock models |
| Stable high throughput | Provisioned throughput | Bedrock Provisioned Throughput |
| Retrieval latency | Index tuning/hybrid search | OpenSearch/Knowledge Bases config |

## Evaluation and troubleshooting

| Symptom | Likely cause | First checks |
|---|---|---|
| Hallucinated answer | Missing grounding, weak prompt, bad retrieval | citations, retrieved chunks, prompt version |
| No relevant sources | Bad chunking, metadata filters, embedding mismatch | retrieval logs, top-k, filters, index freshness |
| Context overflow | Too many chunks or long conversation | token count, truncation logs, context pruning |
| Invalid JSON output | Prompt/schema mismatch | schema validation errors, repair prompt success rate |
| Latency spike | model latency, retrieval latency, throttling | CloudWatch p95, X-Ray traces, Bedrock errors |
| Cost spike | large prompts, repeated calls, wrong model | token logs, cache hit rate, model distribution |
| Unsafe output | missing/weak guardrail or post-validation | Guardrails config, output filters, eval failures |
