import dotenv from "dotenv";
import { envSchema } from "../schemas/env.schema.js";
import type { Env } from "../types/env.js";

dotenv.config();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(
    parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n"),
  );
  process.exit(1);
}
console.log("✅ Environment variables are valid.");
const env: Env = parsed.data;

export default env;
