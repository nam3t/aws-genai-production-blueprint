import * as cdk from 'aws-cdk-lib';
import { GenAiBlueprintStack } from '../lib/genai-blueprint-stack.js';

const app = new cdk.App();

new GenAiBlueprintStack(app, 'GenAiBlueprintStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
  },
});
