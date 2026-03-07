import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import path from "path";

async function getConnectionString(): Promise<string> {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const client = new SecretsManagerClient({});
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_ARN })
  );

  const secret = JSON.parse(response.SecretString!);
  return `postgres://${secret.username}:${encodeURIComponent(secret.password)}@${process.env.DB_HOST}:${secret.port}/${process.env.DB_NAME}`;
}

export async function handler() {
  const connectionString = await getConnectionString();
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  const migrationsFolder = path.join(__dirname, "drizzle");
  console.log("Running migrations from:", migrationsFolder);

  await migrate(db, { migrationsFolder });
  console.log("Migrations complete");

  await sql.end();
  return { statusCode: 200, body: "Migrations applied successfully" };
}
