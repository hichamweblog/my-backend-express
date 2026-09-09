// src/middleware/requireAuth.ts
import { Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import type { AuthRequest } from "../types/request.js";

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(AppError.unauthorized("Not authenticated"));
  }

  try {
    req.user = verifyAccessToken(token); // throws if expired or tampered
    next();
  } catch {
    next(AppError.unauthorized("Session expired or invalid"));
  }
}
