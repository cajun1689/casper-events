import { build } from "esbuild";

await build({
  entryPoints: ["src/index.ts", "src/scheduled.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  outdir: "dist",
  format: "cjs",
  sourcemap: true,
  external: ["@aws-sdk/*"],
});

console.log("API build complete");
