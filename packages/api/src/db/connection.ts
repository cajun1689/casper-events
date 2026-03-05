import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import * as schema from "@cyh/shared/db";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

async function getConnectionString(): Promise<string> {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const client = new SecretsManagerClient({});
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN })
  );

  const secret = JSON.parse(response.SecretString!);
  return `postgres://${secret.username}:${secret.password}@${process.env.DB_HOST}:${secret.port}/${process.env.DB_NAME}`;
}

export async function getDb() {
  if (_db) return _db;

  const connectionString = await getConnectionString();
  const sql = postgres(connectionString, { max: 10 });
  _db = drizzle(sql, { schema });
  return _db;
}

export type Db = Awaited<ReturnType<typeof getDb>>;
