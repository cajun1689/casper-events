#!/usr/bin/env node
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../..");
// Load .env for deploy: try repo root first, then packages/api (where local dev .env lives)
config({ path: path.join(root, ".env") });
config({ path: path.join(root, "packages/api/.env") });

import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack.js";
import { DatabaseStack } from "../lib/database-stack.js";
import { AuthStack } from "../lib/auth-stack.js";
import { StorageStack } from "../lib/storage-stack.js";
import { ApiStack } from "../lib/api-stack.js";

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

const DOMAIN_NAME = "casperevents.org";
const HOSTED_ZONE_ID = "Z03193362N2Y5A9FLV2QP";
const CERTIFICATE_ARN =
  "arn:aws:acm:us-east-1:285633211360:certificate/88a7aefd-cffe-422b-b985-97d09f9a7bc3";

const network = new NetworkStack(app, "CyhNetwork", { env });

const database = new DatabaseStack(app, "CyhDatabase", {
  env,
  vpc: network.vpc,
});

const auth = new AuthStack(app, "CyhAuth", { env });

const storage = new StorageStack(app, "CyhStorage", {
  env,
  domainName: DOMAIN_NAME,
  hostedZoneId: HOSTED_ZONE_ID,
  certificateArn: CERTIFICATE_ARN,
});

new ApiStack(app, "CyhApi", {
  env,
  vpc: network.vpc,
  dbSecretArn: database.secret.secretArn,
  dbClusterEndpoint: database.cluster.clusterEndpoint.hostname,
  userPool: auth.userPool,
  mediaBucket: storage.mediaBucket,
  domainName: DOMAIN_NAME,
  hostedZoneId: HOSTED_ZONE_ID,
  certificateArn: CERTIFICATE_ARN,
});

app.synth();
