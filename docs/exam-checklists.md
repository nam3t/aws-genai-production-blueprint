# AIP-C01 Exam Checklists

Use these checklists during weekly review and final readiness checks.

## Domain 1 — Foundation Model Integration, Data Management, and Compliance

You are ready when you can explain:

- [ ] How to select an FM by quality, latency, cost, context window, modality, and region availability
- [ ] When to use Amazon Bedrock vs SageMaker AI
- [ ] How to change model selection without code changes
- [ ] How to design model fallback and cross-region inference
- [ ] How to design a full RAG pipeline
- [ ] When to use Bedrock Knowledge Bases vs OpenSearch vs Aurora pgvector
- [ ] How chunking, overlap, metadata, embeddings, and reranking affect retrieval quality
- [ ] How to validate, normalize, and format input data for FM inference
- [ ] How to process text, image, audio, and tabular data for FM consumption
- [ ] How to version and govern prompts
- [ ] How to reduce hallucination through grounding, citations, and confidence signals
- [ ] How the AWS Well-Architected Framework and Generative AI Lens apply to GenAI apps

## Domain 2 — Implementation and Integration

You are ready when you can explain:

- [ ] How to implement an agent with tools and state
- [ ] How to enforce stopping conditions, timeouts, and permissions for agentic systems
- [ ] When to use Bedrock Agents vs Step Functions vs custom orchestration
- [ ] How to coordinate multiple models or route by task complexity
- [ ] How to build human-in-the-loop workflows
- [ ] How to integrate FM APIs into enterprise systems
- [ ] When to use synchronous API vs async queue/event workflows
- [ ] When to use Lambda vs ECS/Fargate for tool execution
- [ ] How to deploy FM workloads with canary, blue/green, and rollback strategies
- [ ] How CI/CD applies to GenAI prompts, models, and evaluation gates

## Domain 3 — AI Safety, Security, and Governance

You are ready when you can explain:

- [ ] Prompt injection and jailbreak risks
- [ ] Defense-in-depth safety across input, retrieval, tool use, model output, and post-processing
- [ ] Bedrock Guardrails input/output filtering
- [ ] PII detection with Comprehend
- [ ] Sensitive-data discovery with Macie
- [ ] IAM least privilege for model calls and tools
- [ ] KMS encryption and secure data storage
- [ ] Secure RAG with user/team/document-level authorization
- [ ] CloudTrail and CloudWatch audit/monitoring responsibilities
- [ ] Responsible AI principles: safety, fairness, privacy, accountability, transparency, robustness
- [ ] Governance mechanisms: prompt registry, model inventory, approval workflow, risk classification

## Domain 4 — Operational Efficiency and Optimization

You are ready when you can explain:

- [ ] Token cost drivers for input, output, and retrieved context
- [ ] Prompt compression and context pruning
- [ ] Exact caching vs semantic caching
- [ ] Model routing by complexity/cost/latency
- [ ] Response streaming for better UX
- [ ] Batch inference and throughput optimization
- [ ] Bedrock provisioned throughput trade-offs
- [ ] Retrieval latency tuning
- [ ] p50/p95 latency, error rates, token usage, and cache-hit dashboards
- [ ] Cost anomaly detection and cost allocation patterns

## Domain 5 — Testing, Validation, and Troubleshooting

You are ready when you can explain:

- [ ] How to build a golden dataset
- [ ] How to evaluate relevance, factual accuracy, consistency, fluency, and faithfulness
- [ ] How to test retrieval quality: hit rate, source coverage, retrieval latency
- [ ] How to use LLM-as-a-judge safely
- [ ] How to collect human feedback
- [ ] How to run A/B tests and canary tests for FM changes
- [ ] How to evaluate agent task completion and tool-use effectiveness
- [ ] How to troubleshoot context overflow
- [ ] How to troubleshoot Bedrock API integration errors
- [ ] How to troubleshoot prompt regressions
- [ ] How to troubleshoot bad retrieval, embedding drift, chunking problems, and vector search performance

## Final readiness gate

Book/take the exam only when:

- [ ] Mock exam score is consistently 80-85%+
- [ ] No domain is below 70%
- [ ] You can explain why wrong answers are wrong
- [ ] You can map every major AWS GenAI service to use cases and distractors
- [ ] You can answer long scenario questions without losing the objective/constraint
