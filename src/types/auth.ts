import type { z } from "zod";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface TokenPayload {
  userId: string;
  role: "USER" | "ADMIN";
}
