import { build, context } from "esbuild";
import { cpSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [
    "src/index.ts",
    "src/scheduled.ts",
    "src/migrate-handler.ts",
    "src/digest-handler.ts",
    "src/push-handler.ts",
  ],
  bundle: true,
  platform: "node",
  target: "node20",
  outdir: "dist",
  format: "cjs",
  sourcemap: true,
  external: ["@aws-sdk/*"],
});

const drizzleSrc = join(__dirname, "drizzle");
const drizzleDest = join(__dirname, "dist", "drizzle");
if (existsSync(drizzleSrc)) {
  cpSync(drizzleSrc, drizzleDest, { recursive: true });
  console.log("Copied drizzle migrations to dist/drizzle");
}

console.log("API build complete");
