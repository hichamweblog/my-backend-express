// src/utils/tokens.ts
import jwt from "jsonwebtoken";
import z from "zod";
import env from "../config/env.js";
import type { TokenPayload } from "../types/auth.js";

const tokenPayloadSchema = z
  .object({
    userId: z.string().min(1),
    role: z.enum(["USER", "ADMIN"]),
    iat: z.number().int().nonnegative().optional(),
    exp: z.number().int().nonnegative().optional(),
  })
  .strict();

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string): TokenPayload {
  return tokenPayloadSchema.parse(jwt.verify(token, env.ACCESS_TOKEN_SECRET));
}

export function verifyRefreshToken(token: string): TokenPayload {
  return tokenPayloadSchema.parse(jwt.verify(token, env.REFRESH_TOKEN_SECRET));
}
