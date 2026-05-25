# Week 1 — AWS + GenAI Foundation Refresh

Goal: build a strong mental model for the AWS primitives and GenAI concepts that appear repeatedly in AIP-C01 scenario questions, then verify the initial capstone scaffold.

Study budget: 8-10 hours.

Outcome by end of week:

- You can explain the role of each core AWS service in a production GenAI app.
- You can explain how API Gateway, Lambda, IAM, CloudWatch, and CloudTrail work together.
- You can explain why GenAI apps need RAG, guardrails, evaluations, and token-cost controls.
- You can run the repo locally and synthesize the CDK stack.
- You can point to the initial architecture/backlog docs and explain the capstone direction.

---

## 1. Study map

Week 1 is not about memorizing every AWS feature. It is about learning the architectural role of each service.

Use this framing for every service:

1. What problem does it solve?
2. What does AWS manage for me?
3. What am I still responsible for?
4. How does it appear in a GenAI application?
5. What exam distractors are similar but wrong?

---

## 2. Core AWS services for the capstone

### IAM — identity, authorization, and least privilege

IAM controls authentication and authorization for AWS resources.

In our capstone:

- Lambda has an execution role.
- The chat Lambda needs permission to call Amazon Bedrock Runtime.
- Future ingestion Lambdas will need S3 and vector-store permissions.
- Future agent tool Lambdas should each get separate least-privilege roles.

Key exam idea:

- Never give a GenAI tool broad admin permissions.
- Prefer role-based, task-specific permissions.
- IAM changes are eventually consistent, so do not put IAM mutations on critical runtime paths.

Mental model:

```text
Principal + Policy + Resource + Conditions => Allow or Deny
```

Common mistake:

- Thinking IAM alone solves document-level RAG authorization. IAM protects AWS resources, but app-level retrieval still needs metadata filters such as tenantId, documentId, allowedGroups.

### KMS — key management for encryption

KMS helps create and control encryption keys used by AWS services and applications.

In our capstone:

- S3 document bucket should be encrypted.
- DynamoDB table should be encrypted.
- If we later store evaluation records or prompts, encryption and key policy matter.

Key exam idea:

- KMS controls key access. S3/DynamoDB/OpenSearch use KMS keys for encryption at rest.
- Encryption does not replace authorization; both are required.

### S3 — durable object storage

S3 stores objects. It is often the source of truth for documents in a RAG system.

In our capstone:

- `DocumentBucket` is reserved for future RAG source documents.
- Future ingestion pipeline can read PDFs/Markdown/JSON from S3.
- S3 metadata/tags can help classify documents.

Key exam idea:

- Use S3 for document lake/source-of-truth storage.
- Keep Block Public Access on by default.
- Use lifecycle rules for cost control.
- Use Macie to discover sensitive data in S3.

### Lambda — short-lived serverless compute

Lambda runs code without managing servers.

In our capstone:

- `/health` is a Lambda handler.
- `/chat` is a Lambda handler calling Bedrock.
- Future tools and ingestion jobs can use Lambda if they fit timeout/runtime limits.

Key exam idea:

- Lambda is good for short, event-driven tasks.
- Step Functions is better for multi-step orchestration.
- ECS/Fargate is better for long-running containers or tool servers.

### API Gateway — managed API front door

API Gateway creates, secures, deploys, monitors, and manages HTTP/REST/WebSocket APIs.

In our capstone:

- API Gateway exposes `/health` and `/chat`.
- Later it can expose `/ask`, `/agent`, and internal eval endpoints.

Key exam idea:

- API Gateway is the front door.
- Lambda is the backend compute.
- CloudWatch/X-Ray help observe latency and failures.
- Cognito/Lambda authorizers/IAM policies can add auth later.

### CloudWatch — operational observability

CloudWatch collects metrics, logs, alarms, dashboards, traces, and operational signals.

In our capstone:

- Lambda logs go to CloudWatch Logs.
- API Gateway metrics show latency/error rates.
- Future dashboards should track token usage proxies, p50/p95 latency, model errors, retrieval hit rate, and safety blocks.

Key exam idea:

- Traditional API observability is not enough for GenAI.
- GenAI observability also needs model ID, prompt version, token usage, retrieval metadata, safety outcomes, and eval scores.

### CloudTrail — audit trail for AWS API activity

CloudTrail records account and API activity for auditing, governance, compliance, and incident response.

In our capstone:

- Use CloudTrail to answer who changed infrastructure, policies, buckets, or Bedrock resources.
- CloudWatch tells you how the app behaves; CloudTrail tells you who did what in AWS.

Key exam idea:

```text
CloudWatch = operational telemetry
CloudTrail = AWS API audit history
```

---

## 3. Event-driven and workflow services

### Step Functions — stateful workflow orchestration

Step Functions coordinates multi-step workflows as state machines.

In our capstone later:

- Agent workflow orchestration.
- Human approval for risky actions.
- Retry/failure paths for ingestion or evaluation jobs.

Key exam idea:

- Standard workflows: long-running, auditable, exactly-once workflow execution, up to one year.
- Express workflows: high-volume, short-running, at-least-once workflow execution, up to five minutes.

Use Step Functions when:

- You need retries, branching, timeout, auditability, or human approval.
- You need safer agent/tool orchestration than an unbounded autonomous loop.

### EventBridge — event routing and scheduling

EventBridge connects application components with events.

In our capstone later:

- Schedule nightly eval runs.
- Route document-ingested events.
- Trigger downstream workflows when an evaluation fails.

Key exam idea:

- EventBridge event buses route events from many sources to many targets.
- EventBridge Pipes are point-to-point integrations with optional filtering/transformation/enrichment.
- EventBridge Scheduler handles cron/rate/one-time scheduled tasks.

### SQS — queue-based decoupling

SQS is a durable hosted queue for decoupling producers and consumers.

In our capstone later:

- Queue document ingestion jobs.
- Buffer eval jobs.
- Add DLQ for failed processing.

Key exam idea:

- SQS Standard: high throughput, at-least-once delivery, best-effort ordering.
- SQS FIFO: ordering and exactly-once processing semantics, lower throughput unless configured for high-throughput FIFO.
- Use visibility timeout and DLQ for reliable processing.

### SNS — pub/sub fanout

SNS publishes messages from producers to subscribers.

In our capstone later:

- Notify teams when evaluation quality drops.
- Fan out safety incidents to email, Lambda, and SQS subscribers.

Key exam idea:

```text
SNS = push/fanout pub-sub
SQS = pull queue and buffering
EventBridge = event routing across applications/services/SaaS
```

### DynamoDB — serverless NoSQL database

DynamoDB is a fully managed serverless NoSQL database with single-digit millisecond performance.

In our capstone:

- Current `SessionsTable` is a placeholder for future chat/session metadata.
- Later we can store request metadata, eval runs, prompt versions, and cache entries.

Key exam idea:

- Model access patterns first.
- Use partition key/sort key intentionally.
- Avoid relational JOIN thinking.
- On-demand mode is useful for unpredictable workloads.

### ECS/Fargate — containers without managing servers

ECS manages container orchestration. Fargate runs containers serverlessly.

In our capstone later:

- Use Fargate for long-running tool servers, MCP servers, crawlers, or workloads that exceed Lambda constraints.

Key exam idea:

- Lambda: short event-driven functions.
- Fargate: containerized apps without server management.
- ECS on EC2: more control over compute/capacity.

---

## 4. CDK and CloudFormation basics

### CloudFormation

CloudFormation provisions AWS resources from templates. A stack is a collection of resources managed as a unit.

Mental model:

```text
Template => Stack => AWS resources
```

Why it matters:

- Infrastructure is repeatable.
- Changes are reviewed as code.
- Rollback is possible when deployments fail.

### CDK

CDK lets us write infrastructure in TypeScript, then synthesizes CloudFormation.

Mental model:

```text
TypeScript CDK code => cdk synth => CloudFormation template => cdk deploy => AWS resources
```

In this repo:

- `bin/app.ts` creates the CDK app.
- `lib/genai-blueprint-stack.ts` defines the stack.
- `npm run cdk:synth` generates the CloudFormation template.

Important command flow:

```bash
npm run typecheck
npm test
npm run cdk:synth
npm run cdk:diff
npm run cdk:deploy
```

Do not deploy until:

- AWS sandbox account is selected.
- Budget alert exists.
- Bedrock model access is enabled in the target region.
- You understand which resources can incur cost.

---

## 5. GenAI concepts for AIP-C01

### Foundation model — FM

A foundation model is a large pre-trained model used for tasks like chat, summarization, extraction, classification, image generation, or code generation.

Exam trade-offs:

- Quality vs cost
- Latency vs capability
- Context window size
- Region availability
- Modality support
- Compliance requirements

### Embeddings

Embeddings convert text/images into numerical vectors that represent semantic meaning.

Used for:

- Semantic search
- RAG retrieval
- Similarity matching
- Semantic caching

### Vector store

A vector store indexes embeddings so similar items can be retrieved efficiently.

AWS choices:

- Bedrock Knowledge Bases for managed RAG
- OpenSearch for custom vector/hybrid search
- Aurora PostgreSQL with pgvector when relational + vector search is needed

### RAG — retrieval-augmented generation

RAG improves answers by retrieving relevant source documents and passing them as context to the model.

Flow:

```text
Question => Retrieve relevant chunks => Build grounded prompt => FM answer => Citations/evaluation
```

Why it matters:

- Reduces hallucination.
- Uses proprietary/current data.
- Enables citations.
- Still requires authorization, chunking, evals, and source quality controls.

### Prompt

A prompt is the instruction/context sent to the model.

Production prompt concerns:

- Versioning
- Testing
- Structured output
- Safety policy
- Rollback
- Ownership and approval

### Agent

An agent uses an FM to plan, reason, call tools/APIs, retrieve data, and complete tasks.

Production agent concerns:

- Tool permissions
- Input validation
- Max steps/timeouts
- Human approval
- Traceability
- Evaluation

### Guardrails

Guardrails filter or block unsafe inputs/outputs, sensitive information, prompt attacks, denied topics, and unsupported responses.

Important: guardrails are not the whole security strategy. You still need IAM, KMS, authorization, logging policy, evals, and secure tool design.

### Evals

Evaluations measure model/system quality.

GenAI evals should cover:

- Factual accuracy
- Faithfulness to source
- Citation correctness
- Retrieval hit rate
- Safety behavior
- Structured output validity
- Latency/cost regression

### Token cost

Models charge partly by tokens. Tokens are chunks of text. More prompt context and longer outputs cost more and increase latency.

Optimization patterns:

- Use smaller model for simple tasks.
- Prune context.
- Cache repeated answers.
- Use RAG top-k carefully.
- Stream responses for perceived latency.
- Track token usage/model ID per request.

---

## 6. How this maps to our repo

Current repo structure:

```text
bin/app.ts                         # CDK app entrypoint
lib/genai-blueprint-stack.ts       # CDK stack: API, Lambda, S3, DynamoDB, IAM
src/functions/health/index.ts      # /health Lambda handler
src/functions/chat/index.ts        # /chat Lambda handler for Week 2+
src/shared/model-router.ts         # model selection utility
docs/aip-c01-roadmap.md            # 12-week roadmap
docs/backlog.md                    # implementation backlog
docs/capstone-architecture.md      # target architecture
docs/service-decision-matrix.md    # service fit + exam distractors
docs/security-governance.md        # threat model and controls
docs/evaluation-plan.md            # eval strategy
eval/questions.example.jsonl       # sample eval dataset
test/model-router.test.ts          # unit tests
```

Week 1 build items and status:

| Build item | File(s) | Status |
|---|---|---|
| Initialize repository structure | root folders, README, docs, src, test, eval | Done |
| Create CDK skeleton | `bin/app.ts`, `lib/genai-blueprint-stack.ts`, `cdk.json` | Done |
| Add a health endpoint | `src/functions/health/index.ts`, API Gateway route in stack | Scaffolded locally; cloud runtime validation pending |
| Add docs for target architecture/backlog | `docs/capstone-architecture.md`, `docs/backlog.md` | Done |

---

## 7. Build lab: verify Week 1 locally

From repo root:

```bash
cd /root/aws-genai-production-blueprint
npm install
npm run typecheck
npm test
npm run eval:sample
npm run cdk:synth
```

Expected outcome:

- TypeScript compiles with no errors.
- Unit tests pass.
- Eval sample validates 3 JSONL cases.
- CDK synth emits a CloudFormation template.

Check what CDK defines:

```bash
npm run cdk:synth > /tmp/genai-blueprint-template.yaml
```

Look for these resources in the synthesized template:

- `AWS::ApiGateway::RestApi`
- `AWS::Lambda::Function`
- `AWS::S3::Bucket`
- `AWS::DynamoDB::Table`
- IAM roles/policies

Before cloud deployment, do not skip:

```bash
aws sts get-caller-identity
aws configure get region
```

Only deploy after confirming sandbox account and budget guardrails.

---

## 8. Architecture walkthrough exercise

Try to explain this out loud:

```text
A client calls GET /health.
API Gateway receives the HTTP request.
API Gateway invokes the health Lambda.
The Lambda returns JSON with status and timestamp.
CloudWatch stores Lambda logs and API metrics.
CloudTrail can audit API/config changes made in AWS.
CDK defines this infrastructure as TypeScript.
CloudFormation provisions it as a stack.
```

Then extend the explanation for GenAI:

```text
A client calls POST /chat.
API Gateway invokes the chat Lambda.
Lambda validates the request.
Lambda selects a Bedrock model.
Lambda calls Bedrock Runtime Converse API.
Lambda logs metadata such as requestId/modelId/latency.
Client receives an answer plus metadata.
```

---

## 9. Week 1 mini quiz

Answer without looking first, then check the notes above.

1. IAM vs KMS: which one controls access, and which one manages encryption keys?
2. CloudWatch vs CloudTrail: which one do you use for latency/errors, and which one for audit history?
3. Lambda vs ECS/Fargate: when would Lambda be the wrong choice?
4. Step Functions vs EventBridge: which one coordinates a multi-step workflow, and which one routes events?
5. SQS vs SNS: which one buffers work for consumers, and which one fans out messages to subscribers?
6. Why is S3 a natural source of truth for RAG documents?
7. Why does RAG still need authorization even if the S3 bucket is private?
8. What does `cdk synth` produce?
9. Why should GenAI logs include model ID and prompt version?
10. What are three ways to reduce token cost?

Suggested answers:

1. IAM controls authentication/authorization; KMS manages encryption keys.
2. CloudWatch for operational telemetry; CloudTrail for AWS API audit history.
3. Lambda is wrong for long-running processes, persistent servers, or workloads exceeding Lambda constraints.
4. Step Functions coordinates workflows; EventBridge routes/schedules events.
5. SQS buffers messages; SNS fans out notifications.
6. S3 is durable, scalable object storage and integrates with ingestion pipelines.
7. App-level access filters still need to prevent users from retrieving unauthorized chunks.
8. `cdk synth` produces CloudFormation templates.
9. They help debug quality regressions, latency/cost changes, and prompt/model rollout problems.
10. Use smaller models, prune context, cache repeated answers, tune RAG top-k, limit max output tokens.

---

## 10. Week 1 readiness gate

You are ready for Week 2 when you can do all of this:

- [ ] Explain each Week 1 AWS service in one sentence.
- [ ] Explain the request path for `/health`.
- [ ] Explain the planned request path for `/chat`.
- [ ] Explain CloudWatch vs CloudTrail.
- [ ] Explain Lambda vs Step Functions vs ECS/Fargate.
- [ ] Explain SQS vs SNS vs EventBridge.
- [ ] Explain CDK vs CloudFormation.
- [ ] Explain FM, embedding, vector store, RAG, prompt, agent, guardrail, eval, token cost.
- [ ] Run `npm run typecheck` successfully.
- [ ] Run `npm test` successfully.
- [ ] Run `npm run eval:sample` successfully.
- [ ] Run `npm run cdk:synth` successfully.

---

## 11. Official docs consulted

AWS official docs consulted for this guide:

- IAM: https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html
- KMS: https://docs.aws.amazon.com/kms/latest/developerguide/overview.html
- S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html
- Lambda: https://docs.aws.amazon.com/lambda/latest/dg/welcome.html
- API Gateway: https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html
- CloudWatch: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html
- CloudTrail: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
- Step Functions: https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html
- EventBridge: https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-what-is.html
- SQS: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html
- SNS: https://docs.aws.amazon.com/sns/latest/dg/welcome.html
- DynamoDB: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html
- ECS: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html
- CDK: https://docs.aws.amazon.com/cdk/v2/guide/home.html
- CloudFormation: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html
- Bedrock overview: https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html
- Bedrock Knowledge Bases: https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base.html
- Bedrock Agents: https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html
- Bedrock Guardrails: https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html
