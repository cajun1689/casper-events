import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

interface StorageStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
  certificateArn: string;
}

export class StorageStack extends cdk.Stack {
  public readonly mediaBucket: s3.Bucket;
  public readonly staticBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Cert",
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

    this.mediaBucket = new s3.Bucket(this, "MediaBucket", {
      bucketName: `casperevents-media-${this.account}`,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
          maxAge: 3600,
        },
      ],
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.staticBucket = new s3.Bucket(this, "StaticBucket", {
      bucketName: `casperevents-static-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.distribution = new cloudfront.Distribution(this, "CDN", {
      defaultBehavior: {
        origin:
          origins.S3BucketOrigin.withOriginAccessControl(this.staticBucket),
        viewerProtocolPolicy:
          cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      additionalBehaviors: {
        "/media/*": {
          origin:
            origins.S3BucketOrigin.withOriginAccessControl(this.mediaBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
      },
      domainNames: [props.domainName, `www.${props.domainName}`],
      certificate,
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: cdk.Duration.minutes(5),
        },
      ],
    });

    // DNS records: casperevents.org -> CloudFront
    new route53.ARecord(this, "SiteAlias", {
      zone: hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.distribution)
      ),
    });

    // www.casperevents.org -> CloudFront
    new route53.ARecord(this, "WwwAlias", {
      zone: hostedZone,
      recordName: `www.${props.domainName}`,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.distribution)
      ),
    });

    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      description: "CloudFront distribution domain",
    });

    new cdk.CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
    });

    new cdk.CfnOutput(this, "StaticBucketName", {
      value: this.staticBucket.bucketName,
    });

    new cdk.CfnOutput(this, "MediaBucketName", {
      value: this.mediaBucket.bucketName,
    });
  }
}
