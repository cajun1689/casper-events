import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

const DOMAIN_NAME = process.env.DOMAIN_NAME || "casperevents.org";

export class AuthStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "cyh-calendar-users",
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      userVerification: {
        emailSubject: "Verify your Casper Events account",
        emailBody:
          "Hi! Your verification code is {####}. Enter this code on the signup page to verify your email and start using Casper Events.",
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
    });

    // Configure Cognito to send email via SES (domain must be verified in SES)
    const cfnUserPool = this.userPool.node.defaultChild as cognito.CfnUserPool;
    cfnUserPool.emailConfiguration = {
      emailSendingAccount: "DEVELOPER",
      sourceArn: `arn:aws:ses:${this.region}:${this.account}:identity/${DOMAIN_NAME}`,
      from: `Casper Events <noreply@${DOMAIN_NAME}>`,
      replyToEmailAddress: `noreply@${DOMAIN_NAME}`,
    };

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: "cyh-calendar-web",
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          "https://casperevents.org/auth/callback",
          "http://localhost:5173/auth/callback",
        ],
        logoutUrls: [
          "https://casperevents.org/",
          "http://localhost:5173/",
        ],
      },
      preventUserExistenceErrors: true,
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: this.userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: this.userPoolClient.userPoolClientId,
    });
  }
}
