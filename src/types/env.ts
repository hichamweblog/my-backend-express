import type { z } from "zod";
import { envSchema } from "../schemas/env.schema.js";

export type Env = z.infer<typeof envSchema>;
