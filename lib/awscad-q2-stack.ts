import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

import { Construct } from 'constructs';


export class AwscadQ2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // dynamodb
    const table = new dynamodb.TableV2(this, 'q2_dynamodb_table', {
      tableName: 'q2_table',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: 'name', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY, 
    });

    // iam-role  lamdba-dynamodb
    const lambdaRole = new iam.Role(this, 'lambda_dynamodb', {
      roleName: 'lambda-dynamodb',
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
      ],
    });

    //lambda
    const lambdaFunction = new lambda.Function(this, 'q2_lambda', {
      functionName: 'q2-lambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      role: lambdaRole,
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    //api gateway
    const api = new apigateway.RestApi(this, 'q2_api_gateway', {
      restApiName: 'Q2 API',
      description: 'API Gateway for Lambda and DynamoDB',
    });

    
    const items = api.root.addResource('items');
    items.addMethod('POST', new apigateway.LambdaIntegration(lambdaFunction));
    
    const item = items.addResource('{id}');
    item.addMethod('GET', new apigateway.LambdaIntegration(lambdaFunction));

    table.grantReadWriteData(lambdaFunction);

  }
}
