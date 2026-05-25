# Security and Governance Plan

This document defines the security and governance baseline for the capstone.

## Security goals

1. Protect user data and prompts.
2. Prevent unauthorized retrieval of documents.
3. Prevent unsafe or policy-violating model outputs.
4. Limit agent/tool permissions.
5. Preserve auditability for production operations.
6. Avoid unnecessary storage of sensitive model interactions.

## Threat model

| Threat | Example | Control |
|---|---|---|
| Prompt injection | User asks model to ignore policy or reveal hidden instructions | Input validation, guardrails, instruction hierarchy, tool boundaries |
| Retrieval injection | Malicious document instructs model to exfiltrate data | document trust metadata, retrieval filters, context labeling, output validation |
| PII leakage | Prompt or answer contains personal data | Comprehend PII detection, masking, secure logging policy |
| Sensitive S3 data exposure | Documents contain credentials or regulated data | Macie, bucket policies, KMS, access reviews |
| Over-retrieval | User retrieves docs outside their permissions | metadata filters, authorization checks before retrieval |
| Tool misuse | Agent calls destructive tool or broad API | least-privilege IAM, tool schemas, approval workflow |
| Hallucinated answer | Model invents facts without sources | RAG grounding, citations, confidence/no-answer behavior |
| Unsafe output | Toxic, harmful, or policy-violating content | Bedrock Guardrails, post-processing filters |
| Excessive logging | Raw prompts with secrets stored in CloudWatch | metadata-only logging by default, redaction |

## Baseline controls

### Identity and access

- Use IAM least privilege for every Lambda.
- Separate roles for chat, retrieval, ingestion, and tools.
- Avoid wildcard permissions except where AWS service constraints require it; document each exception.
- Add Cognito or IAM Identity Center before supporting real users.

### Data protection

- S3 block public access enabled.
- Encryption enabled for S3 and DynamoDB.
- KMS key policy reviewed before production use.
- Retention periods defined for logs and evaluation records.
- Raw prompt/response storage disabled unless explicitly approved.

### RAG authorization

Every document chunk should carry metadata:

- `tenantId`
- `documentId`
- `sourceUri`
- `classification`
- `allowedGroups`
- `createdAt`
- `version`

Retrieval must apply user/team filters before context is sent to a model.

### Safety controls

Recommended request lifecycle:

1. Validate request schema.
2. Detect obvious prompt injection patterns.
3. Detect/redact PII where required.
4. Retrieve only authorized context.
5. Invoke model with explicit grounded-answer instructions.
6. Apply Bedrock Guardrails and output validation.
7. Require citations for RAG responses.
8. Log metadata and safety decisions.

### Agent/tool controls

- Tools must have explicit JSON schemas.
- Tools validate input before action.
- Tools return structured results.
- High-risk tools require human approval.
- Tool Lambdas must not share a broad admin role.
- Step Functions should enforce timeout and max-step boundaries.

## Governance artifacts

Maintain these artifacts as the project grows:

- Prompt registry
- Model inventory
- Risk classification table
- Safety policy
- Eval datasets
- Deployment approval checklist
- Incident/troubleshooting log
- Data retention policy

## Responsible AI checklist

Before promoting a capability:

- [ ] Expected use and misuse cases are documented
- [ ] Sensitive data behavior is documented
- [ ] Failure modes are documented
- [ ] Human escalation path exists for high-risk outputs
- [ ] Evaluation dataset covers common and adversarial cases
- [ ] Users can distinguish grounded answers from uncertain/no-answer states
- [ ] Monitoring captures quality, safety, and business metrics
