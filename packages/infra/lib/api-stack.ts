import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

interface ApiStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dbSecretArn: string;
  dbClusterEndpoint: string;
  userPool: cognito.IUserPool;
  mediaBucket: s3.IBucket;
  domainName: string;
  hostedZoneId: string;
  certificateArn: string;
}

export class ApiStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "ApiCert",
      props.certificateArn
    );

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "Zone",
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      }
    );

    const lambdaSg = new ec2.SecurityGroup(this, "LambdaSg", {
      vpc: props.vpc,
      description: "Security group for API Lambda functions",
    });

    const apiHandler = new lambda.Function(this, "ApiHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset("../api/dist"),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      environment: {
        NODE_ENV: "production",
        DB_SECRET_ARN: props.dbSecretArn,
        DB_HOST: props.dbClusterEndpoint,
        DB_NAME: "cyhcalendar",
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        MEDIA_BUCKET: props.mediaBucket.bucketName,
        CDN_DOMAIN: props.domainName,
        CORS_ORIGIN: `https://${props.domainName}`,
        FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID || "",
        FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET || "",
        FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI || `https://api.${props.domainName}/v1/auth/facebook/callback`,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
        GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || `https://api.${props.domainName}/v1/auth/google/callback`,
      },
    });

    apiHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.dbSecretArn],
      })
    );

    props.mediaBucket.grantReadWrite(apiHandler);

    const apiDomainName = `api.${props.domainName}`;

    this.api = new apigateway.RestApi(this, "CalendarApi", {
      restApiName: "Casper Events API",
      description: "Community calendar REST API",
      domainName: {
        domainName: apiDomainName,
        certificate,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Date",
        ],
      },
      deployOptions: {
        stageName: "v1",
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200,
      },
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(apiHandler, {
      proxy: true,
    });

    this.api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    // DNS: api.casperevents.org -> API Gateway
    new route53.ARecord(this, "ApiAlias", {
      zone: hostedZone,
      recordName: apiDomainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGateway(this.api)
      ),
    });

    // Scheduled task: sync Facebook events and check token health
    const scheduledHandler = new lambda.Function(this, "ScheduledHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "scheduled.handler",
      code: lambda.Code.fromAsset("../api/dist"),
      memorySize: 256,
      timeout: cdk.Duration.minutes(5),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      environment: {
        NODE_ENV: "production",
        DB_SECRET_ARN: props.dbSecretArn,
        DB_HOST: props.dbClusterEndpoint,
        DB_NAME: "cyhcalendar",
        MEDIA_BUCKET: props.mediaBucket.bucketName,
        CDN_DOMAIN: props.domainName,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    });

    scheduledHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.dbSecretArn],
      })
    );

    props.mediaBucket.grantReadWrite(scheduledHandler);

    new events.Rule(this, "SyncSchedule", {
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
      targets: [new targets.LambdaFunction(scheduledHandler)],
    });

    // Weekly digest: Monday 6am UTC
    const digestHandler = new lambda.Function(this, "DigestHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "digest-handler.handler",
      code: lambda.Code.fromAsset("../api/dist"),
      memorySize: 256,
      timeout: cdk.Duration.minutes(2),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      environment: {
        NODE_ENV: "production",
        DB_SECRET_ARN: props.dbSecretArn,
        DB_HOST: props.dbClusterEndpoint,
        DB_NAME: "cyhcalendar",
        WEB_URL: `https://${props.domainName}`,
        API_URL: `https://api.${props.domainName}/v1`,
        DIGEST_FROM_EMAIL: `noreply@${props.domainName}`,
      },
    });

    digestHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.dbSecretArn],
      })
    );

    digestHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ses:SendEmail", "ses:SendRawEmail"],
        resources: ["*"],
      })
    );

    new events.Rule(this, "DigestSchedule", {
      schedule: events.Schedule.cron({
        weekDay: "MON",
        hour: "6",
        minute: "0",
      }),
      targets: [new targets.LambdaFunction(digestHandler)],
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: `https://${apiDomainName}`,
      description: "API URL",
    });

    // Migration Lambda: runs DB migrations inside the VPC
    const migrateHandler = new lambda.Function(this, "MigrateHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "migrate-handler.handler",
      code: lambda.Code.fromAsset("../api/dist"),
      memorySize: 256,
      timeout: cdk.Duration.minutes(2),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSg],
      environment: {
        NODE_ENV: "production",
        DB_SECRET_ARN: props.dbSecretArn,
        DB_HOST: props.dbClusterEndpoint,
        DB_NAME: "cyhcalendar",
      },
    });

    migrateHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["secretsmanager:GetSecretValue"],
        resources: [props.dbSecretArn],
      })
    );

    new cdk.CfnOutput(this, "MigrateFunctionName", {
      value: migrateHandler.functionName,
      description: "Lambda function name for running DB migrations",
    });
  }
}
