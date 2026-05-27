# AWS GenAI Production Blueprint

A study + build repository for preparing for `AWS Certified Generative AI Developer - Professional (AIP-C01)` by implementing a production-style Generative AI application on AWS.

The goal is not only to pass the exam. The goal is to build a real reference architecture that covers the practical patterns behind the exam:

- Amazon Bedrock model integration
- RAG with managed knowledge bases or vector search
- Prompt versioning and governance
- Agentic workflows and safe tool use
- Security, privacy, and responsible AI controls
- Cost, latency, and token optimization
- Evaluation, validation, and troubleshooting
- CDK-based production deployment practices

## Exam target

Official exam facts used for this roadmap:

- Exam: AWS Certified Generative AI Developer - Professional
- Code: AIP-C01
- Level: Professional
- Duration: 180 minutes
- Format: 75 questions total: 65 scored + 10 unscored
- Passing score: 750/1000
- Domains:
  - Domain 1: Foundation Model Integration, Data Management, and Compliance — 31%
  - Domain 2: Implementation and Integration — 26%
  - Domain 3: AI Safety, Security, and Governance — 20%
  - Domain 4: Operational Efficiency and Optimization for GenAI Applications — 12%
  - Domain 5: Testing, Validation, and Troubleshooting — 11%

## Recommended path

Use the 12-week path in `docs/aip-c01-roadmap.md`.

High-level phases:

1. AWS + GenAI foundation refresh
2. Bedrock + foundation model integration
3. RAG, vector stores, and data pipelines
4. Prompt engineering, prompt management, and governance
5. Agents, tool integration, and Step Functions orchestration
6. Enterprise deployment and integration patterns
7. Safety, security, privacy, and compliance
8. Responsible AI and governance operations
9. Cost, latency, caching, and performance optimization
10. Evaluation, validation, and troubleshooting
11. Official exam review and weak-area drilling
12. Full mock exams and readiness gate

## Repository map

```text
.
├── bin/                         # CDK app entrypoint
├── lib/                         # CDK stacks
├── src/
│   ├── functions/               # Lambda handlers
│   ├── shared/                  # Shared TypeScript utilities
│   └── eval/                    # Evaluation runner skeleton
├── eval/                        # Example eval datasets
└── docs/
    ├── aip-c01-roadmap.md       # 12-week study roadmap
    ├── weeks/                   # Week-by-week study + build guides
    ├── decisions/               # Architecture decision records
    ├── ask-api-design.md        # RAG `/ask` contract
    ├── rag-ingestion-plan.md    # S3/metadata/chunking ingestion plan
    ├── backlog.md               # Implementation backlog mapped to exam domains
    ├── capstone-architecture.md # Target production architecture
    ├── exam-checklists.md       # Domain-by-domain readiness checklists
    ├── service-decision-matrix.md
    ├── security-governance.md
    └── evaluation-plan.md
```

## Local prerequisites

- Node.js 20+ or 22+
- npm or Bun
- AWS CLI configured with a sandbox account
- AWS CDK v2
- Amazon Bedrock model access enabled in your target AWS region
- A small AWS budget alert before deploying anything

## Quick start

```bash
npm install
npm run typecheck
npm test
npm run cdk:synth
```

Deployment is intentionally not automatic. Before deploying, confirm:

- You are using a sandbox AWS account.
- You have an AWS Budget alert.
- You understand Bedrock, OpenSearch, and provisioned resources can incur cost.
- You have reviewed `docs/security-governance.md`.

## Capstone architecture summary

The target application is an enterprise-style AI assistant API:

- `/health`: operational health endpoint
- `/chat`: direct Bedrock chat endpoint
- `/ask`: RAG endpoint contract with citations and explicit no-answer states; backend wiring is a future Week 3 follow-up
- `/agent`: future agentic workflow endpoint with tool boundaries
- `/eval`: optional internal evaluation runner/reporting endpoint

Core AWS services:

- API Gateway
- Lambda
- Amazon Bedrock Runtime
- Bedrock Knowledge Bases or OpenSearch vector search
- Step Functions
- S3
- DynamoDB
- CloudWatch
- X-Ray
- CloudTrail
- IAM
- KMS
- Bedrock Guardrails
- Comprehend/Macie for sensitive-data controls

See `docs/capstone-architecture.md` for the target design.

## Learning rule

Every feature should answer three questions:

1. Which AIP-C01 domain does this cover?
2. Which production trade-off does this demonstrate?
3. What failure mode or exam scenario does this help you recognize?

## Current scaffold status

This initial scaffold contains:

- CDK app skeleton
- API Gateway + Lambda starter stack
- Bedrock chat handler using the Converse API
- configurable model router with fallback candidates
- configurable inference parameters and token/latency metadata helpers
- evaluation runner skeleton
- 12-week roadmap and implementation backlog
- Week 3 RAG study guide, `/ask` API contract, ingestion plan, and backend ADR
- `/ask` Lambda/API Gateway scaffold that returns an explicit no-answer state until Bedrock Knowledge Bases is configured

Next recommended implementation step: provision the phase-1 Bedrock Knowledge Base, connect it to the S3 document bucket, and wire `/ask` to retrieve sources before generating grounded answers.
