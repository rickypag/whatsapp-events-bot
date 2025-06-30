import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

export class EdgeFunctionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        ...props?.env,
        region: 'us-east-1',
      },
    });

    const edgeFunction = new lambda.Function(this, 'EdgeFunction', {
      functionName: 'react-app-edge-function',
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/edge')),
      timeout: cdk.Duration.seconds(5),
      memorySize: 128,
    });

    const edgeVersion = new lambda.Version(this, 'EdgeVersion', {
      lambda: edgeFunction,
    });

    new cdk.CfnOutput(this, 'EdgeFunctionVersionArn', {
      value: edgeVersion.functionArn,
      exportName: 'EdgeFunctionVersionArn',
    });
  }
}