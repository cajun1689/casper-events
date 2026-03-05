import "dotenv/config";
import { buildApp } from "./app.js";

const app = buildApp();

app.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`API server running at ${address}`);
});
