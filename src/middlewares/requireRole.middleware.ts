// src/middleware/requireRole.ts
import { NextFunction, Response } from "express";
import { AppError } from "../utils/AppError.js";
import type { AuthRequest } from "../types/request.js";

export function requireRole(...allowedRoles: Array<"USER" | "ADMIN">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden("Insufficient permissions"));
    }
    next();
  };
}
