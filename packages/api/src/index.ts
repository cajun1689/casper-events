import awsLambdaFastify from "@fastify/aws-lambda";
import { buildApp } from "./app.js";

const app = buildApp();
const proxy = awsLambdaFastify(app, { callbackWaitsForEmptyEventLoop: false });

export const handler = proxy;
