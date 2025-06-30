import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { createCloudFrontElements } from './cloudfront-elements';
import { generateTwilioCredentials } from './twilio-setup';


export class CreateEventsBotStack extends cdk.Stack {
  edgeFunction?: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create CloudFront distribution and S3 bucket for React app
    const { distribution } = createCloudFrontElements(this);

    // Generate Twilio credentials and store them in SSM
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = generateTwilioCredentials(this);

    // Create dynamoDB table for events
    const eventsTable = new dynamodb.Table(this, 'UserEventsTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    const bucket = new s3.Bucket(this, 'event-posters', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: new s3.BlockPublicAccess({
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
      }),
      publicReadAccess: true,
    });
    

    const sharedLayer = new lambda.LayerVersion(this, 'SharedUtilsLayer', {
      code: lambda.Code.fromAsset("src/shared"),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: 'Shared utils for all lambdas',
    });
    
    const createEventLambda = new lambda.Function(this, 'CreateEventLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      timeout: cdk.Duration.seconds(120),
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/create_event')),
      environment: {
        EVENTS_TABLE_NAME: eventsTable.tableName,
        EVENT_POSTERS_S3_BUCKET: bucket.bucketName,
        FRONTEND_URL: distribution.distributionDomainName,
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER
      }
    });

    const myEventsLambda = new lambda.Function(this, 'MyEventsLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      timeout: cdk.Duration.seconds(120),
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/my_events')),
      environment: {
        EVENTS_TABLE_NAME: eventsTable.tableName,
        EVENT_POSTERS_S3_BUCKET: "event-posters",
        FRONTEND_URL: distribution.distributionDomainName,
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER
      }
    });

    const deleteEventLambda = new lambda.Function(this, 'DeleteEventLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      timeout: cdk.Duration.seconds(120),
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/delete_event')),
      environment: {
        EVENTS_TABLE_NAME: eventsTable.tableName,
        EVENT_POSTERS_S3_BUCKET: "event-posters",
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER
      }
    });

    const RouterLambda = new lambda.Function(this, 'RouterLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      timeout: cdk.Duration.seconds(120),
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/router')),
      environment: {
        CREATE_EVENT_FUNCTION_ARN: createEventLambda.functionArn,
        MY_EVENTS_FUNCTION_ARN: myEventsLambda.functionArn,
        DELETE_EVENT_FUNCTION_ARN: deleteEventLambda.functionArn,
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_WHATSAPP_NUMBER
      },
    });

    
    /**
     * Router Lambda needs to invoke the other Lambdas
     */
    createEventLambda.grantInvoke(RouterLambda);
    myEventsLambda.grantInvoke(RouterLambda);
    deleteEventLambda.grantInvoke(RouterLambda);

    /**
     * Assign permissions to the Lambda functions
     */
    createEventLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['s3:PutObject'],
      resources: [bucket.arnForObjects('*')],
    }));
    eventsTable.grant(createEventLambda, 'dynamodb:Scan', 'dynamodb:PutItem');
    eventsTable.grant(myEventsLambda, 'dynamodb:Scan');
    eventsTable.grant(deleteEventLambda, 'dynamodb:Scan', 'dynamodb:DeleteItem');
    // bucket.grantPut(createEventLambda);
    // eventsTable.grantReadWriteData(createEventLambda);


    /**
     * Add shared layer to the Lambda functions (all need twilio shared function)
     */
    createEventLambda.addLayers(sharedLayer);
    myEventsLambda.addLayers(sharedLayer);
    deleteEventLambda.addLayers(sharedLayer);
    RouterLambda.addLayers(sharedLayer);

    /**
     * Get event is not used by twilio
     */
    const getEventLambda = new lambda.Function(this, 'GetEventLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'handler.handler',
      timeout: cdk.Duration.seconds(120),
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/get_event')),
      environment: {
        EVENTS_TABLE_NAME: eventsTable.tableName,
      }
    });
    eventsTable.grant(getEventLambda, "dynamodb:GetItem");

    /**
     * Create API Gateway
     */
    const api = new apigateway.LambdaRestApi(this, 'WhatsappAPI', {
      handler: RouterLambda,
      proxy: false
    });

    // POST endpoint for twilio messages
    const messages = api.root.addResource('messages');
    messages.addMethod('POST', new apigateway.LambdaIntegration(RouterLambda));

    // GET endpoint for the react app
    const eventResource = api.root.addResource("event");
    const eventIDResource = eventResource.addResource("{id}");
    eventIDResource.addMethod('GET', new apigateway.LambdaIntegration(getEventLambda));

    // const edgeRole = new iam.Role(this, 'EdgeFunctionRole', {
    //   assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    //   managedPolicies: [
    //     iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    //   ],
    // });
    // eventsTable.grantReadData(edgeRole);

    // Lambda@Edge function for origin request
    // const edgeFunction = new cloudfront.experimental.EdgeFunction(this, 'EdgeFunction', {
    //   runtime: lambda.Runtime.PYTHON_3_11,
    //   handler: 'handler.handler',
    //   code: lambda.Code.fromAsset(path.join(__dirname, '../src/edge')),
    //   timeout: cdk.Duration.seconds(5),
    //   memorySize: 128,
    //   role: edgeRole,
    // });

    
    // eventsTable.grant(edgeFunction, 'dynamodb:GetItem');

    // Origin Access Control for CloudFront

    // Output the CloudFront URL
    // new cdk.CfnOutput(this, 'CloudFrontURL', {
    //   value: distribution.distributionDomainName,
    //   description: 'CloudFront Distribution URL',
    // });

    // new cdk.CfnOutput(this, 'S3BucketName', {
    //   value: websiteBucket.bucketName,
    //   description: 'S3 Bucket Name',
    // });

    // new cdk.CfnOutput(this, 'TableName', {
    //   value: eventsTable.tableName,
    //   description: 'DynamoDB Table Name',
    // });
  }
}