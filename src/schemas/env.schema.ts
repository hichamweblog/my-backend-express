import { z } from "zod";

export const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.url(),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(64, "ACCESS_TOKEN_SECRET must be at least 64 characters long"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(64, "REFRESH_TOKEN_SECRET must be at least 64 characters long"),
});
