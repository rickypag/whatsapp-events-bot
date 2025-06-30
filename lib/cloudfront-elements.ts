import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import path from 'path';

export const createCloudFrontElements = (stack: cdk.Stack) => {
    const websiteBucket = new s3.Bucket(stack, 'ReactAppBucket', {
        bucketName: `react-app-${stack.account}-${stack.region}`,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'error.html',
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
    });

    
    const originAccessControl = new cloudfront.S3OriginAccessControl(stack, 'ReactAppOAC', {
      description: 'OAC for React App',
    });

    // CloudFront distribution
    const distribution = new cloudfront.Distribution(stack, 'ReactAppDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
          originAccessControl,
        }),
        // edgeLambdas: [
        //   {
        //     functionVersion: edgeFunction.currentVersion,
        //     eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
        //   },
        // ],
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Deploy React app build files to S3
    new s3deploy.BucketDeployment(stack, 'ReactAppDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '../src/frontend/dist'))], // Path to your React build folder
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    return {
        websiteBucket,
        distribution,
        originAccessControl,
    }
}