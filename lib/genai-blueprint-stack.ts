import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class GenAiBlueprintStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const documentBucket = new s3.Bucket(this, 'DocumentBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const commonLambdaProps = {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: Duration.seconds(30),
      memorySize: 512,
      bundling: {
        minify: true,
        sourceMap: true,
      },
    } satisfies Partial<lambdaNodejs.NodejsFunctionProps>;

    const healthLogGroup = new logs.LogGroup(this, 'HealthFunctionLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const chatLogGroup = new logs.LogGroup(this, 'ChatFunctionLogGroup', {
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const healthFn = new lambdaNodejs.NodejsFunction(this, 'HealthFunction', {
      ...commonLambdaProps,
      entry: 'src/functions/health/index.ts',
      handler: 'handler',
      description: 'Health endpoint for the GenAI blueprint API',
      logGroup: healthLogGroup,
    });

    const chatFn = new lambdaNodejs.NodejsFunction(this, 'ChatFunction', {
      ...commonLambdaProps,
      entry: 'src/functions/chat/index.ts',
      handler: 'handler',
      description: 'Direct Amazon Bedrock chat endpoint',
      logGroup: chatLogGroup,
      environment: {
        BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-3-5-sonnet-20240620-v1:0',
        SESSIONS_TABLE_NAME: sessionsTable.tableName,
        LOG_RAW_PROMPTS: process.env.LOG_RAW_PROMPTS ?? 'false',
      },
    });

    sessionsTable.grantReadWriteData(chatFn);

    chatFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
        resources: ['*'],
      }),
    );

    const api = new apigateway.RestApi(this, 'GenAiBlueprintApi', {
      restApiName: 'aws-genai-production-blueprint',
      description: 'AIP-C01 study capstone API for production-style GenAI patterns',
      deployOptions: {
        stageName: 'dev',
        tracingEnabled: true,
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      },
    });

    api.root.addResource('health').addMethod('GET', new apigateway.LambdaIntegration(healthFn));
    api.root.addResource('chat').addMethod('POST', new apigateway.LambdaIntegration(chatFn));

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Base URL for the GenAI blueprint API',
    });

    new cdk.CfnOutput(this, 'DocumentBucketName', {
      value: documentBucket.bucketName,
      description: 'S3 bucket reserved for future RAG source documents',
    });
  }
}
