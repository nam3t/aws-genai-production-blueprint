# AIP-C01 12-Week Roadmap

This roadmap prepares for `AWS Certified Generative AI Developer - Professional (AIP-C01)` by combining study, hands-on implementation, and exam-style review.

The target study budget is approximately 120 hours.

## Time allocation by exam weight

| Domain | Weight | 120h allocation | Approx scored questions |
|---|---:|---:|---:|
| Domain 1: Foundation Model Integration, Data Management, and Compliance | 31% | 37h | ~20 |
| Domain 2: Implementation and Integration | 26% | 31h | ~17 |
| Domain 3: AI Safety, Security, and Governance | 20% | 24h | ~13 |
| Domain 4: Operational Efficiency and Optimization | 12% | 14h | ~8 |
| Domain 5: Testing, Validation, and Troubleshooting | 11% | 13h | ~7 |

## Weekly routine

For each study week:

1. Read official AWS docs and the relevant exam guide domain.
2. Implement the related backlog items.
3. Write notes in your study log.
4. Add at least five exam-style scenarios to your mistake log.
5. Review which AWS services are the best fit and which distractors are likely.

Suggested daily structure for 2 hours/day:

- 30m: docs/course reading
- 45m: hands-on implementation
- 30m: notes, diagrams, service matrix
- 15m: quiz, flashcards, mistake log

## Week 1 — AWS + GenAI foundation refresh

Goal: refresh the production AWS primitives and GenAI vocabulary needed for the rest of the roadmap.

Study:

- IAM, KMS, S3, Lambda, API Gateway, CloudWatch, CloudTrail
- Step Functions, EventBridge, SQS/SNS, DynamoDB, ECS/Fargate basics
- CDK/CloudFormation basics
- FMs, embeddings, vector stores, RAG, prompts, agents, guardrails, evals, token cost

Build:

- Initialize repository structure.
- Create CDK skeleton.
- Add a health endpoint.
- Add docs for target architecture and backlog.

Readiness gate:

- You can explain why GenAI apps need different observability than traditional APIs.
- You can explain when to use Lambda, Step Functions, SQS, ECS/Fargate, and API Gateway.

## Week 2 — Bedrock and model integration

Goal: directly integrate a foundation model through Amazon Bedrock.

Study:

- Amazon Bedrock Runtime
- Converse API vs InvokeModel
- Streaming response
- Inference parameters: temperature, top-p, top-k, max tokens, stop sequences
- Model selection by quality, cost, latency, modality, and context window
- Cross-region inference and fallback design

Build:

- Implement `/chat` Lambda handler.
- Add model selection config.
- Add token/latency logging fields.
- Add model fallback TODOs and tests around model routing.

Readiness gate:

- You can choose between on-demand Bedrock inference and provisioned throughput.
- You can describe how to change model selection without code changes.

## Week 3 — RAG and vector stores

Goal: understand and implement retrieval-augmented generation patterns.

Study:

- RAG architecture
- Chunking and overlap
- Embeddings
- Hybrid search and reranking
- Bedrock Knowledge Bases
- OpenSearch vector search
- Aurora PostgreSQL with pgvector
- S3 document lakes
- DynamoDB metadata patterns

Build:

- Add `/ask` design and interface.
- Add document ingestion plan.
- Decide whether phase 1 uses Bedrock Knowledge Bases or OpenSearch.
- Add evaluation questions with expected source documents.

Readiness gate:

- You can explain when Knowledge Bases are better than OpenSearch.
- You can diagnose retrieval misses caused by chunking, embeddings, filters, or stale indexes.

## Week 4 — Prompt engineering and prompt governance

Goal: make prompts testable, versioned, and governable.

Study:

- Prompt templates
- Few-shot examples
- Structured output
- JSON Schema validation
- Prompt Management
- Prompt Flows
- Prompt versioning and rollback
- Prompt testing and regression tests

Build:

- Add prompt registry utility.
- Add prompt version field to request/response metadata.
- Add schema validation skeleton.
- Add prompt regression test plan.

Readiness gate:

- You can explain how prompt versioning reduces production risk.
- You can explain when Prompt Flows or Step Functions are better than a single prompt.

## Week 5 — Agents and safe tool integration

Goal: design tool-using AI workflows with boundaries.

Study:

- Bedrock Agents
- Action groups
- Tool validation
- Agent memory and state
- Step Functions orchestration
- ReAct-style workflows
- Human approval
- Timeouts, stopping conditions, and circuit breakers
- MCP, Strands Agents, and AWS Agent Squad at a conceptual level

Build:

- Add `/agent` design.
- Add Step Functions state machine plan.
- Add Lambda tool contract.
- Add IAM boundary notes for tools.

Readiness gate:

- You can explain how to prevent an agent from overusing tools or accessing unauthorized resources.
- You can explain when Step Functions is safer than a fully autonomous loop.

## Week 6 — Enterprise integration and deployment

Goal: connect the GenAI app to production integration patterns.

Study:

- Synchronous APIs vs async queues
- EventBridge, SQS, SNS
- ECS/Fargate for long-running tool servers
- API Gateway integration patterns
- CodePipeline/CodeBuild
- Canary and blue/green deployment
- Rollback strategies
- SageMaker endpoint and Model Registry use cases

Build:

- Add CDK deployment environments: dev/prod config plan.
- Add CI skeleton.
- Add canary test design.
- Add deployment rollback checklist.

Readiness gate:

- You can choose Bedrock vs SageMaker for a scenario.
- You can choose Lambda vs ECS/Fargate for tool execution.

## Week 7 — Safety, security, and privacy

Goal: add defense-in-depth controls for GenAI-specific risks.

Study:

- Bedrock Guardrails
- Prompt injection
- Jailbreak attempts
- Toxic or unsafe outputs
- PII detection with Comprehend
- Sensitive data discovery with Macie
- IAM least privilege
- KMS encryption
- VPC endpoints and PrivateLink
- CloudTrail audit trails

Build:

- Add pre-processing safety plan.
- Add output validation plan.
- Add secure logging policy.
- Add document-level authorization for RAG design.

Readiness gate:

- You can design a secure RAG system where users only retrieve authorized documents.
- You can explain where Guardrails, Comprehend, Macie, IAM, and KMS fit.

## Week 8 — Governance and responsible AI

Goal: make the system auditable and policy-driven.

Study:

- Responsible AI principles
- Model and prompt inventory
- Approval workflows
- Risk classification
- Human-in-the-loop review
- SageMaker Clarify and Model Monitor use cases
- AWS Well-Architected Framework and Generative AI Lens

Build:

- Add governance dashboard metrics list.
- Add prompt-change approval checklist.
- Add model usage inventory document.
- Add risk classification table.

Readiness gate:

- You can describe governance controls beyond simply adding Guardrails.
- You can map business risk to technical controls.

## Week 9 — Cost, latency, and performance optimization

Goal: optimize tokens, retrieval, latency, and throughput.

Study:

- Token estimation and tracking
- Context pruning
- Prompt compression
- Exact caching and semantic caching
- Model routing
- Response streaming
- Batch inference
- Provisioned throughput
- Retrieval query optimization
- CloudWatch dashboards for GenAI apps

Build:

- Add model router tests.
- Add cache design.
- Add CloudWatch metrics list.
- Add latency/cost dashboard plan.

Readiness gate:

- You can identify the cheapest safe architecture for repeated queries.
- You can explain how to reduce token cost without hurting answer quality too much.

## Week 10 — Evaluation, validation, and troubleshooting

Goal: build an evaluation mindset for GenAI systems.

Study:

- Golden datasets
- RAG evaluation
- Retrieval hit rate
- Faithfulness
- Factual accuracy
- Consistency and fluency
- LLM-as-a-judge
- Human feedback
- A/B testing
- Canary testing
- Prompt and model regression tests

Build:

- Implement basic eval runner skeleton.
- Add JSONL dataset schema.
- Add quality gates for future CI.
- Add troubleshooting playbooks.

Readiness gate:

- You can troubleshoot hallucination, bad retrieval, context overflow, and schema failures.
- You can explain why traditional ML metrics are not enough for FM output quality.

## Week 11 — Official exam review and weak-area drilling

Goal: turn knowledge into exam performance.

Tasks:

- Re-read the official exam guide.
- Review each domain checklist.
- Build a mistake log.
- Drill scenario questions by domain.
- Focus on service selection trade-offs.

Readiness gate:

- No domain below 70% in practice.
- You can explain why each wrong answer is wrong.

## Week 12 — Mock exams and final readiness

Goal: pass the final readiness gate before booking/taking the exam.

Tasks:

- Take 2-3 full-length mock exams.
- Review every missed question.
- Revisit weak services and patterns.
- Do a final architecture walkthrough from memory.

Book/take exam when:

- Mock exams are consistently 80-85%+.
- Domain scores are balanced.
- You can handle long scenario questions without rushing.
- Your mistake log no longer shows repeated pattern errors.

## Final mental model

AIP-C01 is about production GenAI systems, not toy prompts.

For every scenario, identify:

1. The business objective.
2. The operational constraint.
3. The safety/compliance requirement.
4. The correct AWS managed service fit.
5. The failure mode the question is testing.
