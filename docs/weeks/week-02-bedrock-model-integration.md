# Week 2 — Bedrock and Model Integration

Goal: turn the capstone from a generic serverless scaffold into a direct Amazon Bedrock integration, while building the exam mental model for runtime APIs, inference parameters, model choice, streaming, and fallback strategy.

Study budget: 8-10 hours.

Outcome by end of week:

- You can choose between `Converse`, `ConverseStream`, `InvokeModel`, and `InvokeModelWithResponseStream`.
- You can explain temperature, top-p, top-k, max tokens, and stop sequences.
- You can choose models by quality, cost, latency, modality, context window, and region availability.
- You can explain when to use a cross-Region inference profile.
- The `/chat` handler calls Bedrock Runtime through the Converse API.
- Model selection, inference config, and token/latency logging are represented in code.

---

## 1. Mental model for Amazon Bedrock Runtime

Amazon Bedrock has two important API surfaces:

```text
Bedrock control plane    = manage/list/configure models, profiles, guardrails, prompts
Bedrock Runtime endpoint = run inference against a model or inference profile
```

Week 2 focuses on Bedrock Runtime.

For chat-style applications, the usual flow is:

```text
Client request
  -> API Gateway
  -> Lambda validates payload
  -> Lambda selects model or inference profile
  -> Lambda builds Converse request
  -> Bedrock Runtime generates response
  -> Lambda logs model/latency/tokens/error category
  -> Client receives answer + metadata
```

In AWS SDKs, Bedrock Runtime is separate from the Bedrock control-plane client.

In this repo:

```ts
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
```

---

## 2. Converse API vs InvokeModel

### Converse API

Use `Converse` for conversational applications.

Why:

- Consistent message-based API across supported models.
- Supports `messages`, `system`, `inferenceConfig`, tools, guardrails, prompt management, and streaming through `ConverseStream`.
- Easier to write provider-portable chat code.

Basic shape:

```ts
new ConverseCommand({
  modelId,
  messages: [
    {
      role: 'user',
      content: [{ text: 'Explain RAG in one paragraph' }],
    },
  ],
  inferenceConfig: {
    maxTokens: 800,
    temperature: 0.2,
    topP: 0.9,
  },
});
```

IAM permission:

```text
bedrock:InvokeModel
```

### ConverseStream

Use `ConverseStream` when the user experience benefits from token-by-token or chunk-by-chunk output.

IAM permission:

```text
bedrock:InvokeModelWithResponseStream
```

Important exam point:

- To deny model inference fully, deny both `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream`.
- The AWS CLI does not support Bedrock streaming operations, so use an SDK/app runtime for streaming tests.

### InvokeModel

Use `InvokeModel` when:

- The model/task does not fit the messages abstraction.
- You need model-specific request/response body control.
- You are doing embeddings, image generation, or a provider-specific inference format.

Trade-off:

- More flexible.
- Less portable, because body shape is model-specific.

### InvokeModelWithResponseStream

Streaming version of `InvokeModel`.

Use when:

- You need model-specific request body plus streaming response.

### Practical rule

```text
Chat app?             Start with Converse.
Streaming chat?       ConverseStream.
Model-specific body?  InvokeModel.
Model-specific stream? InvokeModelWithResponseStream.
Embeddings?           Usually InvokeModel/model-specific API path.
```

---

## 3. Streaming response design

Bedrock supports streaming through:

- `ConverseStream`
- `InvokeModelWithResponseStream`

But our current API Gateway REST + Lambda proxy response is a buffered JSON response. That is fine for Week 2.

If we want true streaming later, common options are:

1. Lambda response streaming with a Function URL.
2. API Gateway WebSocket API.
3. AppSync subscriptions.
4. ALB + Lambda/container integration.
5. ECS/Fargate service that streams Server-Sent Events or WebSocket frames.

Week 2 decision:

- Keep `/chat` non-streaming using `Converse`.
- Document streaming trade-offs.
- Keep IAM permission for `InvokeModelWithResponseStream` because future streaming endpoints need it.

Exam trap:

- Do not claim a buffered REST API streams just because Bedrock supports streaming. The transport path must support streaming too.

---

## 4. Inference parameters

Inference parameters influence response generation.

### temperature

Controls randomness.

```text
Lower temperature = more deterministic
Higher temperature = more creative/random
```

Use lower values for:

- factual Q&A
- compliance-sensitive answers
- structured output
- extraction/classification

Use higher values for:

- brainstorming
- creative writing
- ideation

### top-p

Also called nucleus sampling. It controls the cumulative probability mass considered for the next token.

```text
Lower top-p = narrower candidate pool
Higher top-p = wider candidate pool
```

### top-k

Controls the number of highest-probability token candidates considered.

`top-k` is model-specific in Converse. For Claude-style requests through Converse, pass it through `additionalModelRequestFields`, for example:

```json
{ "top_k": 200 }
```

### max tokens

Limits response length. This directly affects:

- cost
- latency
- completeness
- risk of runaway output

### stop sequences

Stop sequences end generation when specified strings appear.

Useful for:

- preventing the model from continuing into another section
- delimiting structured output
- stopping before an unwanted suffix

---

## 5. Model selection criteria

When choosing a model, evaluate these dimensions:

| Criterion | Architect question |
|---|---|
| Quality | Does it solve the task reliably? |
| Cost | Is the per-token/request cost justified? |
| Latency | Is p95 latency acceptable? |
| Modality | Does it support text/image/audio/video as needed? |
| Context window | Can it fit the required instructions + retrieved context? |
| Region availability | Is it available in the deployment/compliance region? |
| Streaming support | Does the model support response streaming? |
| Tool use | Does it support tool calling if needed? |
| Structured output | Can it reliably produce/adhere to schemas? |
| Safety/compliance | Does it work with guardrails and governance requirements? |

In this repo, we start with a simple router:

```text
simple   -> cheaper/faster model
standard -> default model
complex  -> stronger model
```

The router is intentionally simple for Week 2. In later weeks, evals should decide routing rules instead of intuition.

---

## 6. Cross-Region inference and fallback design

Bedrock cross-Region inference uses inference profiles. An inference profile can route requests to supported Regions to improve throughput and manage bursts.

Two broad profile styles:

| Type | Best for |
|---|---|
| Geographic cross-Region | Data residency/compliance within a geography such as US/EU/APAC |
| Global cross-Region | Maximum throughput and potentially lower cost, when global processing is acceptable |

Important points:

- Model/inference profile IDs can be used in the `modelId` field.
- Cross-Region inference has no additional routing cost; pricing is based on the Region from which the profile is called.
- Data stays on the AWS network and is encrypted in transit between Regions.
- CloudTrail logs cross-Region inference in the source Region and includes `additionalEventData.inferenceRegion`.
- Service Control Policies may need to allow destination Regions or `aws:RequestedRegion: unspecified` for global profiles.

Fallback design for production:

```text
Attempt primary model/profile
  -> if throttling/capacity/transient failure
  -> retry with bounded backoff
  -> optionally try fallback model/profile
  -> log primary, fallback, error category, latency, token usage
  -> never fallback silently for compliance-sensitive tasks
```

Week 2 implementation decision:

- Add model fallback candidates to configuration and tests.
- Log fallback candidates.
- Do not implement automatic retry/fallback yet, because safe fallback requires error classification, cost controls, idempotency, and eval validation.

---

## 7. Build lab: complete Week 2 in this repo

Files involved:

```text
src/functions/chat/index.ts
src/shared/model-router.ts
src/shared/types.ts
lib/genai-blueprint-stack.ts
test/model-router.test.ts
```

New/updated support files may include:

```text
src/shared/bedrock-config.ts
src/shared/bedrock-response.ts
test/bedrock-config.test.ts
test/bedrock-response.test.ts
```

Acceptance criteria:

- `/chat` accepts JSON with `{ "message": "...", "sessionId"?: "...", "complexity"?: "simple|standard|complex" }`.
- `/chat` sends a `ConverseCommand` to Bedrock Runtime.
- Model ID is configurable by environment variables.
- Simple/standard/complex model selection is tested.
- Fallback model candidates are configurable and tested.
- Logs include request ID, selected model, fallback candidates, latency, token usage fields if returned, input/output character lengths, and prompt version.
- Response metadata includes request ID, model ID, latency, prompt version, and optional token usage.
- Code typechecks, tests pass, eval sample passes, and CDK synth succeeds.

Recommended local verification:

```bash
cd /root/aws-genai-production-blueprint
npm run typecheck
npm test
npm run eval:sample
npm run cdk:synth
```

Cloud smoke test after deployment:

```bash
curl -X POST "$API_URL/chat" \
  -H 'content-type: application/json' \
  -d '{"message":"Explain the difference between Converse and InvokeModel in two bullets","complexity":"simple"}'
```

Deployment prerequisites:

- AWS sandbox account selected.
- Budget alert exists.
- Bedrock model access enabled in target region.
- `BEDROCK_MODEL_ID` or inference profile ID points to a model you can invoke.

---

## 8. Suggested environment variables

```bash
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
BEDROCK_SIMPLE_MODEL_ID=amazon.nova-lite-v1:0
BEDROCK_COMPLEX_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
BEDROCK_FALLBACK_MODEL_IDS=amazon.nova-pro-v1:0,amazon.nova-lite-v1:0
BEDROCK_MAX_TOKENS=800
BEDROCK_TEMPERATURE=0.2
BEDROCK_TOP_P=0.9
BEDROCK_TOP_K=200
BEDROCK_STOP_SEQUENCES=
LOG_RAW_PROMPTS=false
```

Note: model IDs and availability change by Region/account. Always verify in the Bedrock console or with AWS APIs before deploying.

---

## 9. Week 2 mini quiz

1. Why is `Converse` a better default than `InvokeModel` for chat apps?
2. Which IAM permission is required for `ConverseStream`?
3. Why is `InvokeModel` less portable than `Converse`?
4. What happens when temperature is lowered?
5. What is the difference between top-p and top-k?
6. Why can max tokens affect both cost and latency?
7. Why might a model with higher quality be a bad default model?
8. When should you choose a cross-Region inference profile?
9. Why should fallback not be silent in compliance-sensitive flows?
10. Why does `/chat` logging need token fields and selected model ID?

Suggested answers:

1. `Converse` provides a consistent message-based interface across supported chat models.
2. `bedrock:InvokeModelWithResponseStream`.
3. `InvokeModel` uses model-specific request/response bodies.
4. Output becomes more deterministic and more likely to choose high-probability tokens.
5. Top-p uses cumulative probability mass; top-k limits the number of candidate tokens.
6. More tokens mean more generated output, more processing time, and higher usage cost.
7. It may be slower or more expensive than necessary for simple tasks.
8. For throughput bursts, quota pressure, or regional resiliency where residency requirements allow it.
9. Different models/profiles can have different behavior, costs, regions, and compliance implications.
10. To debug cost, latency, quality regressions, routing mistakes, and model-specific failures.

---

## 10. Week 2 readiness gate

You are ready for Week 3 when you can:

- [ ] Explain `Converse` vs `InvokeModel`.
- [ ] Explain `ConverseStream` vs buffered `/chat` response.
- [ ] Explain temperature, top-p, top-k, max tokens, and stop sequences.
- [ ] Choose a model based on quality/cost/latency/modality/context window.
- [ ] Explain cross-Region inference profiles.
- [ ] Explain why fallback requires careful governance.
- [ ] Run `npm run typecheck` successfully.
- [ ] Run `npm test` successfully.
- [ ] Run `npm run eval:sample` successfully.
- [ ] Run `npm run cdk:synth` successfully.

---

## 11. Official docs consulted

- Converse API user guide: https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html
- Invoke API user guide: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-api.html
- Inference parameters: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-parameters.html
- Converse API reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_Converse.html
- ConverseStream API reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_ConverseStream.html
- InvokeModel API reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModel.html
- InvokeModelWithResponseStream API reference: https://docs.aws.amazon.com/bedrock/latest/APIReference/API_runtime_InvokeModelWithResponseStream.html
- Cross-Region inference: https://docs.aws.amazon.com/bedrock/latest/userguide/cross-region-inference.html
- Inference profiles: https://docs.aws.amazon.com/bedrock/latest/userguide/inference-profiles-create.html
