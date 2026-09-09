import { NextFunction, Request, Response } from "express";
import env from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Known, expected errors (operational)
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Zod validation errors that slipped through (defensive, if not caught earlier)
  if (err.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      details: err,
    });
  }
  // Handle Prisma errors (defensive, if not caught earlier)
  if (err.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({
      error: "Database error",
      details: err.message,
    });
  }

  // Unexpected/programming errors — log full detail, hide it from the client
  console.error("💥 Unexpected error:", err);

  return res.status(500).json({
    error: "Something went wrong",
    // Only show stack traces in development — never in production
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}
