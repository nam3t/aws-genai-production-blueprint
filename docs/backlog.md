# Implementation Backlog

This backlog turns the AIP-C01 roadmap into a buildable capstone. Each epic maps to exam domains and produces practical artifacts.

Status legend:

- `Todo`: not started
- `Doing`: in progress
- `Scaffolded`: initial code/design exists, but AWS deployment/runtime validation is still pending
- `Done`: implemented and verified

## Epic 0 — Repository and study system

Domain coverage: all domains

Goal: create a clean repo structure for study, implementation, and exam tracking.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E0.1 | Create README and docs map | README explains purpose, exam target, repo structure, and quick start | Done |
| E0.2 | Create 12-week roadmap | `docs/aip-c01-roadmap.md` exists and maps weeks to outcomes | Done |
| E0.3 | Create service decision matrix | `docs/service-decision-matrix.md` exists | Done |
| E0.4 | Create domain checklist | `docs/exam-checklists.md` exists | Done |
| E0.5 | Add CDK + TypeScript skeleton | `npm run typecheck` passes after install | Done |

## Epic 1 — Direct Bedrock chat API

Domain coverage: Domain 1, Domain 2, Domain 4, Domain 5

Goal: expose a minimal production-style API that calls Amazon Bedrock.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E1.1 | Add health Lambda | `/health` returns status and timestamp | Scaffolded |
| E1.2 | Add chat Lambda | `/chat` accepts `{ message, sessionId? }` and returns model text | Scaffolded |
| E1.3 | Add Bedrock Runtime client | Handler uses Bedrock Converse API | Scaffolded |
| E1.4 | Add model config | Model ID is configurable via environment variable | Scaffolded |
| E1.5 | Add structured logs | Logs include request ID, model ID, latency, and error category | Scaffolded |
| E1.6 | Add basic model router | Simple/standard/complex request categories map to model IDs | Done |
| E1.7 | Add unit tests for router | Tests cover fallback/default behavior | Done |

Exam scenarios covered:

- Selecting FMs based on cost, latency, and capability
- Switching models without code changes
- Diagnosing Bedrock API integration errors
- Logging enough metadata for troubleshooting

## Epic 2 — RAG and knowledge retrieval

Domain coverage: Domain 1, Domain 2, Domain 5

Goal: implement a RAG endpoint with citations and retrieval diagnostics.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E2.1 | Choose RAG backend | Decision recorded: Bedrock Knowledge Bases vs OpenSearch vs Aurora pgvector | Todo |
| E2.2 | Add document source bucket | CDK provisions encrypted S3 bucket for source docs | Todo |
| E2.3 | Add ingestion plan | Document chunking, metadata, and sync process documented | Todo |
| E2.4 | Add `/ask` API contract | Request/response types include question, citations, and retrieval metadata | Todo |
| E2.5 | Add retrieval metrics | Track retrieval latency, chunk count, and relevance score | Todo |
| E2.6 | Add citation requirement | Responses include source references or explicit no-answer state | Todo |
| E2.7 | Add retrieval eval dataset | JSONL contains questions with expected source docs | Todo |

Exam scenarios covered:

- Reducing hallucinations through grounding
- Choosing a vector store
- Troubleshooting bad retrieval
- Designing RAG with compliance and metadata filters

## Epic 3 — Prompt management and structured output

Domain coverage: Domain 1, Domain 3, Domain 5

Goal: make prompts versioned, testable, and safe to change.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E3.1 | Add prompt registry | Prompt templates have names, versions, owners, and risk levels | Todo |
| E3.2 | Add prompt version metadata | Responses include prompt name/version | Todo |
| E3.3 | Add JSON schema validation | Structured outputs are validated before returning | Todo |
| E3.4 | Add repair prompt path | Invalid JSON can be repaired once before failing | Todo |
| E3.5 | Add prompt regression tests | Golden cases verify prompt behavior | Todo |
| E3.6 | Add prompt change checklist | Governance review is documented | Todo |

Exam scenarios covered:

- Prompt maintenance issues
- Prompt confusion troubleshooting
- Structured response validation
- Prompt governance and rollback

## Epic 4 — Agentic workflow and tools

Domain coverage: Domain 2, Domain 3, Domain 5

Goal: design an agent flow with safe tool use, permissions, and stopping conditions.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E4.1 | Define tool contract | Tool input/output schemas are documented | Todo |
| E4.2 | Add Step Functions plan | State machine includes branching, retries, timeout, and failure path | Todo |
| E4.3 | Add sample lookup tool | Lambda validates parameters before accessing data | Todo |
| E4.4 | Add human approval branch | High-risk action requires manual approval | Todo |
| E4.5 | Add tool IAM boundary | Each tool has least-privilege permissions | Todo |
| E4.6 | Add agent eval metrics | Track task completion and tool-call success | Todo |

Exam scenarios covered:

- Agent tool integration
- Human-in-the-loop systems
- Step Functions orchestration
- Safe autonomous workflow design

## Epic 5 — Security, privacy, and governance

Domain coverage: Domain 3 primarily, plus Domain 1 and 2

Goal: add defense-in-depth controls for GenAI-specific risks.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E5.1 | Add threat model | Prompt injection, PII leakage, over-retrieval, and tool misuse documented | Done |
| E5.2 | Add KMS encryption | Buckets/tables use customer-managed or AWS-managed encryption | Todo |
| E5.3 | Add secure logging policy | Sensitive prompts are not logged by default | Todo |
| E5.4 | Add Guardrails integration plan | Input/output safety flow documented | Todo |
| E5.5 | Add PII detection plan | Comprehend/Macie responsibilities documented | Todo |
| E5.6 | Add document-level authorization | RAG retrieval respects user/team metadata | Todo |
| E5.7 | Add audit trail plan | CloudTrail/CloudWatch events listed | Todo |

Exam scenarios covered:

- Data security and privacy controls
- Responsible AI controls
- Prompt injection defense
- Governance and auditability

## Epic 6 — Cost, latency, and operational optimization

Domain coverage: Domain 4

Goal: optimize GenAI workloads for cost and responsiveness.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E6.1 | Add token tracking | Input/output token estimates are captured where available | Todo |
| E6.2 | Add exact cache design | Deterministic cache key design documented | Todo |
| E6.3 | Add semantic cache design | Embedding-based cache strategy documented | Todo |
| E6.4 | Add response streaming plan | Streaming path documented for low-latency UX | Todo |
| E6.5 | Add model router policy | Router considers cost, latency, and complexity | Todo |
| E6.6 | Add CloudWatch dashboard | Metrics list includes p50/p95 latency, errors, cost proxies, cache hit rate | Todo |

Exam scenarios covered:

- Token cost reduction
- Caching repeated queries
- Latency-cost trade-offs
- FM throughput optimization

## Epic 7 — Evaluation, validation, and troubleshooting

Domain coverage: Domain 5

Goal: create quality gates and diagnostic workflows for GenAI outputs.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E7.1 | Add eval dataset schema | JSONL schema documented | Done |
| E7.2 | Add eval runner skeleton | Script reads dataset and emits summary metrics | Done |
| E7.3 | Add retrieval quality metrics | Hit rate, relevance, and latency metrics defined | Todo |
| E7.4 | Add hallucination/faithfulness rubric | Rubric defined for human or LLM-as-judge scoring | Todo |
| E7.5 | Add deployment validation plan | Canary and synthetic workflows documented | Todo |
| E7.6 | Add troubleshooting playbooks | Context overflow, bad retrieval, prompt regression, and API errors documented | Todo |

Exam scenarios covered:

- FM output evaluation
- RAG evaluation
- Agent performance evaluation
- Troubleshooting content handling and integration issues

## Epic 8 — Exam readiness system

Domain coverage: all domains

Goal: convert implementation knowledge into exam performance.

| ID | Task | Acceptance criteria | Status |
|---|---|---|---|
| E8.1 | Create mistake log | Every missed practice question is categorized by domain and error pattern | Todo |
| E8.2 | Create service flashcards | Flashcards cover service fit and distractors | Todo |
| E8.3 | Create scenario drills | Scenario prompts exist for RAG, agents, security, optimization, and eval | Todo |
| E8.4 | Mock exam 1 | Score and weak domains recorded | Todo |
| E8.5 | Mock exam 2 | Score improves and repeated mistakes decline | Todo |
| E8.6 | Final readiness review | No domain below 70%; overall mock score 80-85%+ | Todo |

## Recommended next sprint

Sprint 1 should convert the scaffold into a validated AWS deployment:

1. Deploy the CDK stack to a sandbox account.
2. Call `/health` through API Gateway.
3. Enable Bedrock model access in the deployment region.
4. Call `/chat` with a small prompt.
5. Review CloudWatch logs for request ID, model ID, latency, and safe logging behavior.
6. Tighten IAM/resource policies based on the deployed model/region.

Definition of done:

- `npm run typecheck` passes.
- `npm test` passes.
- `npm run cdk:synth` passes.
- `/health` works in AWS.
- `/chat` returns a Bedrock response in AWS.
- README documents how to call `/chat` after deployment.
